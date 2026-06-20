---
title: k6 負載模型：scenarios 與 executors，開放模型怎麼設
excerpt: vus + duration 只夠用一次。真正的負載控制在 scenarios 與 executors──ramping-vus 是封閉模型、constant-arrival-rate 是開放模型。秒殺為什麼一定要用後者，這篇用 k6 設定講清楚。
tags: [k6, 效能測試, 負載模型, scenarios]
status: draft
---

# 負載模型：scenarios 與 executors

第一篇用的 `vus + duration` 只能跑最簡單的固定負載。真實壓測要階梯加壓、要尖峰、要固定到達率——這些靠 **scenarios** 搭配 **executors** 控制。這篇也把觀念課「開放 vs 封閉模型」落到 k6 設定上。

## executors 是什麼

executor 決定「怎麼產生負載」。常用這幾個：

| executor | 模型 | 用途 |
|----------|------|------|
| `ramping-vus` | 封閉 | 階梯增減 VU，找容量 |
| `constant-vus` | 封閉 | 固定 VU 跑一段時間 |
| `constant-arrival-rate` | **開放** | 固定每秒到達率 |
| `ramping-arrival-rate` | **開放** | 階梯增減到達率 |

## 封閉模型：ramping-vus

```javascript
export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 }, // 2 分鐘爬到 100 VU
        { duration: '5m', target: 100 }, // 維持 5 分鐘
        { duration: '2m', target: 0 },   // 收尾
      ],
    },
  },
}
```

封閉模型固定的是「同時幾個 VU」。每個 VU 做完一次才發下一次——**系統一慢，發出的請求自動變少，壓力跟著縮**。這會掩蓋問題（觀念課講過）。

## 開放模型：constant-arrival-rate（秒殺用這個）

```javascript
export const options = {
  scenarios: {
    seckill: {
      executor: 'constant-arrival-rate',
      rate: 2000,             // 每秒 2000 次
      timeUnit: '1s',
      duration: '3m',
      preAllocatedVUs: 200,   // 預配 VU 池
      maxVUs: 1000,           // 不夠時最多開到這
    },
  },
}
```

開放模型固定的是「每秒丟多少請求進來」，**不管系統多慢都照丟**——就像真實大促，用戶不會因為你慢就不來。秒殺、尖峰一定要用開放模型，才壓得出真實雪崩。

注意 `preAllocatedVUs`：開放模型需要一個 VU 池去執行那些到達的請求。系統變慢、請求堆積時，k6 會用更多 VU（到 `maxVUs`）。如果 VU 不夠，summary 會警告 "insufficient VUs"——這本身就是一個訊號。

## 一次跑多個場景

scenarios 可以併行，還能用 `startTime` 錯開、用 `exec` 指定不同函式：

```javascript
export const options = {
  scenarios: {
    browse: {
      executor: 'constant-arrival-rate',
      rate: 500, timeUnit: '1s', duration: '10m',
      preAllocatedVUs: 100, exec: 'browse',
    },
    checkout: {
      executor: 'ramping-arrival-rate',
      startRate: 50, timeUnit: '1s',
      stages: [{ target: 300, duration: '5m' }],
      preAllocatedVUs: 100, exec: 'checkout', startTime: '1m',
    },
  },
}

export function browse() { /* 瀏覽流量 */ }
export function checkout() { /* 下單流量 */ }
```

這就能還原觀念課說的「流量模型」——讀多寫少、各 API 不同比例，用不同 rate 的場景同時跑。

## 帶得走

- 負載控制在 scenarios + executors，不是 `vus + duration`。
- `ramping-vus` = 封閉模型（會掩蓋問題）；`constant-arrival-rate` = **開放模型**（貼近大促，秒殺必用）。
- 開放模型要設 `preAllocatedVUs` / `maxVUs`；不足的警告本身是訊號。
- 多 scenario 併行 + `exec` 分流，可還原真實流量模型。

下一篇：腳本工程化——group、參數化、env、setup/teardown。
