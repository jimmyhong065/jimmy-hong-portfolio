---
title: k6 的輸出與觀測：從 summary 到 Grafana 即時看板
excerpt: 終端機那份 summary 只是起點。用 Docker Compose 五分鐘就能讓 k6 指標串進 InfluxDB + Grafana，壓測跑到一半圖就在動。這篇從本機快速起手到 CI 長期趨勢，把 k6 的輸出選項講清楚。
tags: [k6, 觀測性, Grafana, InfluxDB, Docker]
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
// textSummary 不是內建，要從 k6 的 jslib 匯入
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js'

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}
```

`data` 裡有所有指標的統計，你能自由轉成任何格式。

## 3. 視覺化：把指標送進 Grafana

### 3a. 本機五分鐘看到圖：Docker Compose 方案

最快的起手方式是用這個開源模板，一條指令就把 InfluxDB + Grafana 跑起來，k6 直接把指標推進去：

```bash
git clone https://github.com/luketn/docker-k6-grafana-influxdb
cd docker-k6-grafana-influxdb
docker compose up -d influxdb grafana   # 起 InfluxDB（port 8086）與 Grafana（port 3000）
```

等兩秒服務就緒後，跑你自己的腳本：

```bash
K6_OUT=influxdb=http://localhost:8086/k6 k6 run your-script.js
```

開 `http://localhost:3000`，匿名登入（不用帳密），點進已預載的 k6 dashboard，就能即時看到 VU 曲線、p95 RT、錯誤率——壓測還沒跑完圖就在動。

**這個方案的架構：**

```
k6 → InfluxDB（時間序列儲存）→ Grafana（視覺化）
```

InfluxDB 1.x 在這個組合裡只是「指標存放桶」，不需要額外設定；Grafana 已預載好 datasource 和 dashboard，開箱即用。

**想改成測自己的 API？** 最簡單的做法是把你前幾課寫的 script.js 放進 `scripts/` 資料夾，用 docker compose 的 k6 服務跑：

```bash
# docker-compose.yml 裡的 k6 服務已設好 K6_OUT，volumes 掛好 scripts/
docker compose run k6 run /scripts/your-script.js
```

### 3b. CI/生產端：Prometheus remote-write 方案

這是做長期趨勢看板的主流（觀念課常態化篇的對應實作）：

```bash
K6_PROMETHEUS_RW_SERVER_URL=http://prometheus:9090/api/v1/write \
k6 run --out experimental-prometheus-rw script.js
```

數據進 Prometheus 後，用 Grafana 的 k6 官方 dashboard 看趨勢——每次跑的 p95、錯誤率、吞吐都留下歷史，就能抓「每週慢一點」的緩慢退化。

**兩個方案的差別：**

| | Docker Compose（3a）| Prometheus（3b）|
|---|---|---|
| 適合 | 本機手動跑、快速驗證 | CI 排程跑、長期留存 |
| 複雜度 | 一條 clone + compose up | 需要 Prometheus + Grafana 基礎設施 |
| 資料保留 | 重啟 container 就清 | 持久存在 Prometheus 裡 |

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
