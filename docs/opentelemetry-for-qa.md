# OpenTelemetry 對 QA 的意義：Trace 讓除錯少問了一半的問題

---

## 目錄

1. [從「我不知道哪裡壞了」到「我知道哪個 service 慢了」](#我知道哪裡壞了)
2. [Observability 的三根柱子](#三根柱子)
3. [Trace 對 QA 的實際幫助](#trace-對-qa-的幫助)
4. [QA 怎麼開始使用 Trace](#怎麼開始使用)
5. [結尾](#結尾)

---

## 從「我不知道哪裡壞了」到「我知道哪個 service 慢了」

根據 DORA 2024 年的研究，具備良好可觀測性（Observability）的團隊，修復生產事故的速度顯著優於缺乏可觀測性的團隊。OpenTelemetry 在 2023 年成為 CNCF 中僅次於 Kubernetes 的第二活躍專案，顯示整個產業正在快速建立分散式追蹤的基礎設施——但大多數 QA 還沒有意識到，這個工具對他們的日常除錯方式意味著什麼。

我們的 App 有一次 bug：計時完成之後，硬幣入帳的畫面要等 8–10 秒才出現，正常應該是 1–2 秒。

以前遇到這種問題，我的 bug report 是：「計時完成後，硬幣入帳顯示有 8–10 秒的延遲，不確定是哪個環節的問題。」

RD 拿到這個 bug，要自己去查：是前端的問題？是 API 慢？是 DB query 慢？是 event queue 積壓？要查每個環節的 log，花了大半天才定位到是 `獎勵服務` 在高負載下的 DB query 變慢。

同樣的 bug，有了 Distributed Tracing 之後：

我在 Jaeger（trace 工具）裡查那個請求的 trace，三分鐘：

```
計時完成 POST /sessions/complete
├── 計時服務: 12ms ✓
├── event published: 8ms ✓
└── 獎勵服務: 9,234ms ← 這裡
    ├── DB query (coins calculation): 8,891ms ← 根本原因
    └── event published: 45ms ✓
```

我的 bug report 變成：「計時完成後 8–10 秒延遲，根據 trace 顯示延遲發生在 `獎勵服務` 的 `coins calculation` DB query，耗時 8.8 秒，trace ID: xyz。」

RD 拿到這個 bug，開始看那個 query 的 execution plan，三十分鐘定位到是 index 沒有加。

從「我不知道哪裡慢」到「我知道是哪個 service 的哪個 query 慢了」，這個差距讓除錯時間從半天縮到半小時。

---

## Observability 的三根柱子

現代 Observability 通常說三件事：

**Logs**：記錄發生了什麼事。「用戶 X 在 14:30 完成計時。」

**Metrics**：記錄系統的數值狀態。「現在 獎勵服務 的 DB query 平均耗時 120ms。」

**Traces**：記錄一個請求在整個系統裡走過的路徑，每個 service 花了多少時間。

QA 最熟悉的是 Logs，因為 bug report 常常需要 log 裡的錯誤訊息。Metrics 是監控用的，QA 會看 dashboard 但不常直接查。

Traces 是最少被 QA 使用的，但對於「分散式系統的效能問題」和「跨 service 的 bug 定位」，它是效率最高的工具。

---

## Trace 對 QA 的實際幫助

**1. 效能問題的精確定位**

沒有 trace：「這個功能感覺很慢，大概 8 秒。」

有 trace：「延遲發生在 step 3 的 DB query，耗時 8.8 秒，其他環節都正常。」

**2. Flaky bug 的根因線索**

Flaky bug 最難的地方是重現不了——出現的時候沒有抓到足夠的資訊。

有了 trace，每個請求都有完整的執行路徑記錄。即使 bug 的觸發是偶然的，你可以查那次失敗的請求的 trace，看到它和正常請求的差異：是某個 service 多花了時間，還是有一個 timeout，還是有一個 retry？

**3. 跨 service 的 bug 更容易追蹤**

我們的 App 是 event-driven 架構，一個計時完成事件會觸發三個 service 的處理。如果最後的結果不對（樹沒有出現），要找是哪個 service 的問題。

有 trace，你從一個 trace ID 就能看完整的流程：event 有沒有被發出、被哪個 consumer 消費、consumer 處理花了多少時間、最後 主功能服務 有沒有成功更新。

**4. Bug Report 更有含金量**

在 bug report 裡附上 trace ID，讓 RD 可以直接看那次請求的完整執行路徑，不用再重現、再 debug。

這讓 bug 的修復時間顯著縮短，也讓 QA 和 RD 的協作更有效率。根據 Atlassian 的研究，包含重現步驟和診斷資料的高品質 bug report，可以將工程師的除錯時間縮短 40–60%——而附上 Trace ID 的 bug report，本質上就是這樣一份高品質報告。

---

## QA 怎麼開始使用 Trace

**Step 1：確認你的系統有沒有 Distributed Tracing**

問 RD：「我們的後端有沒有加 OpenTelemetry 或其他 tracing 的工具？」

如果有，問：「我怎麼查一個請求的 trace？Trace ID 在哪裡？」

常見的 trace 查詢工具：Jaeger、Zipkin、Tempo（Grafana 的）、AWS X-Ray、Datadog APM。

**Step 2：學會用 Trace ID 找到一個請求**

每個 API 請求在有 tracing 的系統裡，response header 通常會帶一個 `X-Trace-ID` 或類似的 header。

```bash
# 用 curl 看 response header
curl -I -H "Authorization: Bearer TOKEN" \
  https://api.example.com/api/v1/sessions/complete \
  -d '{"duration": 25}'

# 輸出
HTTP/1.1 200 OK
X-Trace-Id: 4bf92f3577b34da6a3ce929d0e0e4736
```

拿著這個 `X-Trace-Id` 去 trace 工具裡查，就能看到這個請求的完整執行路徑。

**Step 3：在 Bug Report 加上 Trace ID**

遇到效能問題或跨 service 的 bug，在 bug report 裡加：

```
Trace ID: 4bf92f3577b34da6a3ce929d0e0e4736
觀察到的問題：獎勵服務 的 DB query 耗時 8.8 秒
```

這一行資訊，讓 RD 的除錯工作直接跳過「重現問題」和「找到哪個環節出問題」這兩個步驟。

---

## 結尾

OpenTelemetry 是 2021 年才正式 GA 的標準，現在正在快速普及。很多後端工程師已經在用，但 QA 很少主動使用這個工具。

學會讀 trace 不需要理解整個 OpenTelemetry 的架構，只需要：知道 trace ID 在哪裡、知道用什麼工具查、知道怎麼從 trace 裡讀出「哪個環節花了多少時間」。

這個能力讓你從「我不知道哪裡壞了」變成「我知道根本原因在哪裡」，是 QA 在分散式系統時代最值得投資的一個技術工具。

---

## 參考資料

- [OpenTelemetry 官方文件](https://opentelemetry.io/docs/) — 分散式追蹤、Metrics 與 Logs 的開放標準
- [OpenTelemetry：Traces 概念說明](https://opentelemetry.io/docs/concepts/signals/traces/) — Trace、Span 與 Context Propagation 的基礎概念
- [Jaeger 官方文件](https://www.jaegertracing.io/docs/) — 開源的分散式追蹤系統，常用的 Trace 查詢工具
- [Grafana Tempo 文件](https://grafana.com/docs/tempo/latest/) — Grafana 生態系中的分散式追蹤後端
- [DORA 2024 研究報告](https://dora.dev/research/2024/dora-report/) — 可觀測性與軟體交付效能的關係研究
