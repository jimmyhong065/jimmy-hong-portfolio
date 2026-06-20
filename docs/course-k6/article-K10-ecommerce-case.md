---
title: 實戰：一個電商下單流程的完整 k6 腳本（對應雙11場景）
excerpt: 把前九課全部串起來──開放模型、用戶旅程 group、SharedArray 熱點參數化、分交易的 thresholds、業務級自訂指標。這是一個可以直接改來用的雙11 壓測腳本骨架。
tags: [k6, 效能測試, 秒殺, 實戰]
status: draft
---

# 實戰：電商下單的完整 k6 腳本

最後一課，把前九課串成一個能跑的東西：一個對應雙11／秒殺場景的下單壓測腳本。它示範了開放模型、用戶旅程分層、熱點參數化、分交易門檻、業務級指標——全都在裡面。

## 場景設定（呼應觀念課）

- **流量形狀**：瀏覽多、下單少（讀寫比），但秒殺爆品集中在少數 SKU（熱點）。
- **模型**：用開放模型（`constant-arrival-rate`）灌瞬時尖峰，才壓得出行鎖競爭。
- **判準**：下單 p95 < 300ms、錯誤率 < 1%、下單成功率 > 99%、不超賣。

## 完整腳本

```javascript
import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Trend, Rate } from 'k6/metrics'
import { SharedArray } from 'k6/data'

const BASE = __ENV.BASE_URL || 'https://staging.shop.example.com'

// 把 409（庫存售罄、被拒）也視為「預期內」，否則內建 http_req_failed
// 會把它當失敗，配上 abortOnFail 會在賣完瞬間直接中止整場測試。
http.setResponseCallback(http.expectedStatuses({ min: 200, max: 399 }, 409))

// 熱點：少數爆品 + 一般商品（照權重抽，模擬 80-20）
const hotSkus = new SharedArray('hot', () => JSON.parse(open('./data/hot_skus.json')))
const skus    = new SharedArray('skus', () => JSON.parse(open('./data/skus.json')))
const users   = new SharedArray('users', () => JSON.parse(open('./data/users.json')))

// 業務級自訂指標
const orderDuration = new Trend('order_duration', true)
const orderSuccess  = new Rate('order_success_rate')

export const options = {
  scenarios: {
    // 瀏覽：大量讀流量
    browse: {
      executor: 'constant-arrival-rate',
      rate: 800, timeUnit: '1s', duration: '10m',
      preAllocatedVUs: 200, maxVUs: 600, exec: 'browse',
    },
    // 秒殺下單：開放模型灌尖峰
    seckill: {
      executor: 'ramping-arrival-rate',
      startRate: 100, timeUnit: '1s',
      stages: [
        { target: 2000, duration: '30s' }, // 開賣瞬間衝高
        { target: 2000, duration: '3m' },   // 維持尖峰
        { target: 0, duration: '30s' },
      ],
      preAllocatedVUs: 500, maxVUs: 2000, exec: 'seckill', startTime: '1m',
    },
  },
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true, delayAbortEval: '15s' }],
    'http_req_duration{name:browse}': ['p(95)<100'],
    'http_req_duration{name:createOrder}': ['p(95)<300', 'p(99)<800'],
    order_success_rate: ['rate>0.99'],
    checks: ['rate>0.99'],
  },
}

export function setup() {
  // 預熱：先打一輪讓快取暖起來（觀念課：秒殺要預熱）
  http.get(`${BASE}/products`)
  return {}
}

export function browse() {
  group('瀏覽商品', () => {
    const sku = skus[Math.floor(Math.random() * skus.length)]
    const res = http.get(`${BASE}/products/${sku.id}`, { tags: { name: 'browse' } })
    check(res, { '瀏覽 200': (r) => r.status === 200 })
  })
  sleep(Math.random() * 2 + 1) // 1~3 秒思考時間
}

export function seckill() {
  // 熱點集中：九成打爆品
  const pool = Math.random() < 0.9 ? hotSkus : skus
  const sku = pool[Math.floor(Math.random() * pool.length)]
  const user = users[__VU % users.length] // 每 VU 綁一帳號，避免撞鎖

  group('秒殺下單', () => {
    const res = http.post(`${BASE}/orders`,
      JSON.stringify({ skuId: sku.id, qty: 1, userId: user.id }),
      { headers: { 'Content-Type': 'application/json' }, tags: { name: 'createOrder' } },
    )
    const ok = check(res, {
      '下單非 5xx': (r) => r.status < 500,
      '無超賣（拒絕也算正常）': (r) => r.status === 200 || r.status === 409,
    })
    orderDuration.add(res.timings.duration)
    orderSuccess.add(res.status === 200)
  })
}
```

## 幾個刻意的設計

- **兩個 scenario 併行**：`browse`（固定到達率）+ `seckill`（階梯到達率錯開 1 分鐘起跑）——還原讀多寫少 + 開賣尖峰。
- **熱點集中**：`Math.random() < 0.9` 讓九成下單打爆品池，才壓得出行鎖競爭（不然就是觀念課說的假測試）。
- **不超賣的驗證**：庫存扣完回 409 是**正常**的（被拒絕），不該算失敗——所以 check 把 200 和 409 都當通過，真正要抓的是 5xx 和超賣。注意這還不夠：k6 內建的 `http_req_failed` 預設把所有 4xx（含 409）算失敗，配上 `abortOnFail` 會在賣完瞬間中止整場測試，所以開頭用 `setResponseCallback` 把 409 也標成預期內。
- **分交易門檻**：瀏覽 p95<100、下單 p95<300，各有各的線。
- **預熱**：`setup()` 先打一輪暖快取。

## 怎麼跑

```bash
# 本地
k6 run -e BASE_URL=https://staging.shop.example.com k6/tests/seckill.js

# CI（接前面的 GitHub Actions workflow，thresholds 沒過就紅燈）
```

## 收尾：兩門課合起來看

到這裡，效能測試課的「觀念與方法論」和這門 k6 課的「怎麼做出來」就接上了：

- 為什麼要開放模型、要熱點集中、要分交易門檻 → 在效能測試課。
- 這些用 k6 具體怎麼寫、怎麼進 CI、怎麼觀測 → 在這門課。

拿這個骨架去改你自己的業務流程，就是一個可以進 CI、能擋退化、能壓雙11 的真實壓測腳本了。
