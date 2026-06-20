---
title: k6 指標體系：內建指標看什麼，自訂指標怎麼加
excerpt: k6 內建的 http_req_duration、http_req_failed、iterations 是地基；當你要量「業務級」的東西──下單成功率、單品扣庫存耗時──就要用 Trend、Counter、Gauge、Rate 四種自訂指標。
tags: [k6, 效能測試, 指標, 自訂指標]
status: draft
---

# k6 指標體系：內建 + 自訂

觀念課說過「看懂指標是第一門功課」。這篇看 k6 實際提供哪些指標，以及怎麼量到 HTTP 之外的「業務級」數字。

## 內建指標：先認得這幾個

| 指標 | 意義 |
|------|------|
| `http_req_duration` | 請求總耗時（含等待）。**看 p(95)/p(99)** |
| `http_req_failed` | 請求失敗率。**先看這個** |
| `http_reqs` | 總請求數與每秒請求數（吞吐） |
| `iterations` | default function 執行次數與速率 |
| `vus` / `vus_max` | 當前 / 最大虛擬用戶數 |
| `checks` | check 通過率 |

`http_req_duration` 還能再拆：`http_req_waiting`（TTFB，伺服器處理時間）、`http_req_connecting`、`http_req_sending`/`receiving`。當總耗時高但 waiting 正常，瓶頸就在連線或網路，不在後端——這正是觀念課「響應時間拆分」的 k6 版。

## 自訂指標：量業務級的東西

內建指標都是 HTTP 層的。但你常常想量「業務」的數字：下單成功率、秒殺扣庫存的耗時、優惠券核銷數。這時用 `k6/metrics` 的四種型別：

```javascript
import { Trend, Counter, Gauge, Rate } from 'k6/metrics'

const orderDuration = new Trend('order_duration', true) // 趨勢：看 avg/p95/max
const orderCount    = new Counter('order_total')        // 累加計數
const queueDepth    = new Gauge('queue_depth')          // 瞬時值（最後一次）
const orderSuccess  = new Rate('order_success_rate')    // 成功比率

export default function () {
  const res = http.post(`${BASE}/orders`, body, params)

  orderDuration.add(res.timings.duration) // 記一筆耗時
  orderCount.add(1)                       // +1
  orderSuccess.add(res.status === 200)    // true/false 累積成比率
  queueDepth.add(res.json('queueDepth'))  // 記當下佇列深度
}
```

四種型別怎麼選：

- **Trend**：要看分佈（avg / p95 / max）的時間或數值 → 自訂耗時。
- **Counter**：只增不減的累加 → 總下單數。
- **Gauge**：只記最後一個值的瞬時量 → 佇列深度。
- **Rate**：true/false 的比率 → 成功率。

## 自訂指標 + threshold

自訂指標一樣能設 pass/fail 門檻（下一篇細講）：

```javascript
export const options = {
  thresholds: {
    order_duration: ['p(95)<300'],     // 下單 p95 < 300ms
    order_success_rate: ['rate>0.99'], // 下單成功率 > 99%
  },
}
```

這就是把「業務級 SLO」變成可自動判定的門檻——遠比只看 HTTP 平均值有意義。

## 帶得走

- 內建指標先認 `http_req_duration`（看 p95）、`http_req_failed`（先看）、`http_reqs`/`iterations`（吞吐）。
- `http_req_waiting` = TTFB，可做 k6 版的響應時間拆分。
- 業務級數字用 Trend / Counter / Gauge / Rate 自訂，並可設成 threshold 自動判定。

下一篇：thresholds——把 SLO 寫成 pass/fail gate。
