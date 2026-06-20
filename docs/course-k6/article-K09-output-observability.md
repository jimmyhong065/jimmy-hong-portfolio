---
title: k6 的輸出與觀測：從 summary 到 Prometheus、Grafana、New Relic
excerpt: 終端機那份 summary 只是起點。要做趨勢看板、要把壓測數據跟伺服器端監控對齊，就得把 k6 的指標串流到 Prometheus + Grafana 或 New Relic。這篇講各種輸出與客製化報告。
tags: [k6, 觀測性, Grafana, Prometheus]
status: draft
---

# k6 的輸出與觀測

`k6 run` 結束的那份終端 summary 是給人快速看的。但要做趨勢看板、要把壓測數據跟服務端監控放一起看，就得把指標串流出去。這篇把 k6 的輸出選項講清楚。

## 1. 終端 summary 與 JSON

```bash
k6 run script.js                          # 終端摘要
k6 run --summary-export=summary.json s.js # 匯出摘要 JSON（CI 存 artifact）
k6 run --out json=raw.json script.js      # 逐筆原始數據（檔案會很大）
```

`summary.json` 適合 CI 留存與基線比對；`--out json` 是逐筆，量大，少用。

## 2. 客製化報告：handleSummary

想自己決定報告長相（例如輸出 HTML 或自訂 JSON），用 `handleSummary`：

```javascript
export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}
```

`data` 裡有所有指標的統計，你能自由轉成任何格式。

## 3. 串流到 Prometheus + Grafana（做趨勢看板）

這是做「效能看板」（觀念課常態化篇）的主流：

```bash
k6 run --out experimental-prometheus-rw script.js
```

搭配環境變數指到 Prometheus 的 remote-write 端點：

```bash
K6_PROMETHEUS_RW_SERVER_URL=http://prometheus:9090/api/v1/write \
k6 run --out experimental-prometheus-rw script.js
```

數據進 Prometheus 後，用 Grafana 的 k6 官方 dashboard 看趨勢——每次跑的 p95、錯誤率、吞吐都留下歷史，就能抓「每週慢一點」的緩慢退化。

## 4. New Relic / DataDog / OTel（跟服務端對齊）

把 k6 指標送到 APM 平台，最大的價值是**跟服務端監控放在同一條時間軸**——壓測的 RT 飆高時，正好對照看伺服器的 CPU、GC、DB 連接池發生什麼（這就是觀念課「客戶端 vs 服務端對照」）。

常見做法：

- New Relic / DataDog：透過它們的 Prometheus remote-write 或 OTel 接收端，把 k6 指標寫進去。
- OpenTelemetry：k6 可輸出到 OTel Collector，再分流到任何後端。

## 客戶端數據 ≠ 全部

提醒一個觀念課反覆講的點：k6 報的是**客戶端視角**的數字（含網路往返）。它告訴你「慢了、錯了」，但「為什麼慢」要靠服務端監控回答。所以觀測的終極目標，是讓 k6 的曲線和服務端的 USE/RED 指標能對在一起看。

## 帶得走

- CI 留存用 `--summary-export`；要自訂報告用 `handleSummary`。
- 做趨勢看板用 `--out experimental-prometheus-rw` + Grafana。
- 送 New Relic / OTel 的最大價值，是跟服務端監控對齊時間軸找根因。
- k6 是客戶端視角，定位根因仍要服務端監控。

下一篇（最後一課）：把全部串起來，寫一個電商下單的完整 k6 實戰腳本。
