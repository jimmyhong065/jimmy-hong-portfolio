---
title: k6 thresholds：把 SLO 寫成會讓測試失敗的 pass/fail gate
excerpt: thresholds 是 k6 唯一會影響 exit code 的東西──不達標，k6 就以非零結束、CI 就紅燈。這篇教你把 SLO 翻成 threshold、用 abortOnFail 提早止血，以及對特定 tag 下門檻。
tags: [k6, 效能測試, thresholds, SLO]
status: draft
---

# thresholds：讓不合格的版本過不了

上一篇說 `check` 不會讓測試失敗。那什麼會？答案是 **thresholds**——它是 k6 裡唯一會影響 exit code 的機制。不達標，`k6 run` 就回非零、CI 就紅燈。這也是後面把 k6 接進 GitHub Actions 的根基。

## 把 SLO 翻成 threshold

觀念課說過，一條好 SLO 要有「百分位 + 閾值 + 條件」。在 k6 直接寫進 `options.thresholds`：

```javascript
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<150', 'p(99)<300'], // 延遲
    http_req_failed: ['rate<0.01'],                 // 錯誤率 < 1%
    checks: ['rate>0.99'],                          // check 通過率 > 99%
    order_success_rate: ['rate>0.99'],              // 自訂業務指標
  },
}
```

任何一條沒過，summary 會標紅，`k6 run` 的 exit code ≠ 0。

## abortOnFail：提早止血

預設 k6 會把場景跑完才判定。但如果一開始就爛掉，繼續壓沒意義、還浪費時間。用物件語法加 `abortOnFail`：

```javascript
thresholds: {
  http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true, delayAbortEval: '10s' }],
}
```

`delayAbortEval: '10s'` 是給暖機一點緩衝（觀念課說的暖機段數據不可信），10 秒後才開始認真判定。

## 對特定請求下門檻（用 tag）

整體 `http_req_duration` 會把所有請求混在一起。但你常常只在乎「下單」這條關鍵鏈（觀念課：SLO 要分交易）。用 tag 區隔：

```javascript
const res = http.post(`${BASE}/orders`, body, {
  headers,
  tags: { name: 'createOrder' }, // 打標籤
})
```

```javascript
thresholds: {
  'http_req_duration{name:createOrder}': ['p(95)<300'], // 只看下單
  'http_req_duration{name:browse}': ['p(95)<100'],      // 瀏覽更嚴
}
```

這樣讀（瀏覽）和寫（下單）就能各有各的門檻，不會被彼此平均掉。

## 一個完整的判準範例

```javascript
export const options = {
  scenarios: { /* 下一篇講 */ },
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true, delayAbortEval: '10s' }],
    'http_req_duration{name:createOrder}': ['p(95)<300', 'p(99)<800'],
    'http_req_duration{name:browse}': ['p(95)<100'],
    order_success_rate: ['rate>0.99'],
    checks: ['rate>0.99'],
  },
}
```

## 帶得走

- **thresholds 是唯一會讓 k6 失敗的機制**——CI 門檻就靠它。
- 把 SLO（百分位 + 閾值）逐條寫成 threshold；自訂業務指標也能設。
- `abortOnFail` 提早止血，`delayAbortEval` 留暖機緩衝。
- 用 `tags` 對「下單」這種關鍵交易單獨下門檻，別讓它被平均掩蓋。

下一篇：負載模型——scenarios 與 executors，以及開放/封閉模型在 k6 怎麼設。
