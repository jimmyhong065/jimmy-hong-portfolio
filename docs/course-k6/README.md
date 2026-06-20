# k6 實戰課程 — 把效能測試方法論落地

> 定位：效能測試課（`docs/course-perf/`，20 課，講「觀念與方法論」）的**延伸實作課**。
> 這門課講「怎麼用 k6 真的做出來」——code-heavy，每篇含可跑的 k6 範例。
> 狀態：草稿（本地）。一課一檔 `article-Kxx-*.md`。

## 兩課怎麼接

| 效能測試課（觀念） | k6 課（落地） |
|---|---|
| L03 指標：TPS / RT / 百分位 | K03 內建/自訂指標、K04 thresholds |
| L04 SLO | K04 把 SLO 寫成 pass/fail gate |
| L09 開放 vs 封閉模型 | K05 `ramping-vus` vs `constant-arrival-rate` |
| L05 流量模型、L08 參數化 | K06 `group` + `SharedArray` 參數化 |
| L20 CI 常態化 | K07 GitHub Actions + thresholds 當門檻 |
| L02/L18 雙11、秒殺 | K10 電商下單完整實戰腳本 |

## 課綱（10 課）

### A. k6 基礎
- K01 為什麼選 k6 + 安裝 + 第一個腳本
- K02 HTTP 請求與 `check()`（checks ≠ thresholds）
- K03 指標體系：內建 + 自訂（Trend / Counter / Gauge / Rate）

### B. 場景與判準
- K04 `thresholds`：把 SLO 寫成 pass/fail gate
- K05 負載模型：executors / scenarios（開放 vs 封閉模型）
- K06 腳本工程化：`group`、參數化、env、`setup/teardown`

### C. CI/CD 與觀測
- K07 接進 CI：GitHub Actions + `grafana/k6`
- K08 參數化 workflow：手動 dispatch 選環境 / 負載等級
- K09 輸出與觀測：summary / JSON / Prometheus+Grafana / New Relic

### D. 實戰
- K10 完整案例：電商下單流程的 k6 腳本（對應雙11）
