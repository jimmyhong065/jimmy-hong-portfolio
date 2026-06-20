---
title: k6 的 HTTP 請求與 check()──但 checks 不等於 thresholds
excerpt: GET、POST、帶 header 與 body、用關聯接起多步請求；再用 check() 驗證回應。最關鍵的觀念：check 失敗不會讓測試失敗，真正的 pass/fail gate 是 thresholds。
tags: [k6, 效能測試, check, HTTP]
status: draft
---

# HTTP 請求與 check()──別把 check 當成 gate

第一個腳本只發了一個 GET。真實壓測要打各種請求、還要驗證回應對不對。這篇講 k6 的 HTTP API 與 `check()`，並釐清一個超多人誤會的點：**check 不是 pass/fail gate。**

## 各種 HTTP 請求

```javascript
import http from 'k6/http'

// GET
const res = http.get('https://api.example.com/products')

// POST（JSON）
const payload = JSON.stringify({ sku: 'A123', qty: 1 })
const params = { headers: { 'Content-Type': 'application/json' } }
const order = http.post('https://api.example.com/orders', payload, params)

// 帶授權 header
const authed = http.get('https://api.example.com/me', {
  headers: { Authorization: `Bearer ${token}` },
})
```

PUT / PATCH / DELETE 同理（`http.put` / `http.patch` / `http.del`）。

## 關聯：把多步請求接起來

真實業務是一連串請求，後一步要用前一步回傳的值（觀念課腳本設計篇講的「關聯」）。在 k6 就是純 JS：

```javascript
const login = http.post(`${BASE}/login`, JSON.stringify({ user, pass }), params)
const token = login.json('token')          // 從回應 JSON 取值

const order = http.post(`${BASE}/orders`, body, {
  headers: { Authorization: `Bearer ${token}` },
})
const orderId = order.json('id')
```

`res.json('path')` 取 JSON 欄位，`res.body` 是原始字串，`res.status` 是狀態碼。

## check()：驗證回應

```javascript
import { check } from 'k6'

const res = http.get(`${BASE}/products`)
check(res, {
  '狀態 200': (r) => r.status === 200,
  '有回傳商品': (r) => r.json('items').length > 0,
  '回應夠快': (r) => r.timings.duration < 500,
})
```

`check` 會把通過率統計在 summary 的 `checks` 指標裡。

## ⚠️ 最關鍵：check 失敗，測試不會失敗

這是新手最大的誤解。`check()` 回 `false` **只是記一筆**，**不會讓 `k6 run` 以非零 exit code 結束**，所以在 CI 裡它**擋不了不合格的版本**。

真正的 pass/fail gate 是 **thresholds**（下一篇主角）。兩者分工是：

- `check`：逐筆驗證「這個回應對不對」，產生通過率。
- `threshold`：對整體指標下「達標線」，**不達標就讓 k6 失敗**。

常見做法是把 checks 的通過率也設成一條 threshold，讓它真的有牙齒：

```javascript
export const options = {
  thresholds: {
    checks: ['rate>0.99'],            // 99% 的 check 要過，否則 k6 失敗
    http_req_failed: ['rate<0.01'],
  },
}
```

## 帶得走

- HTTP API 就是 `http.get/post/...`，關聯用純 JS 取回應值再帶入下一步。
- `check()` 驗證單筆回應、產生通過率，但**不會讓測試失敗**。
- 要有 pass/fail 效果，必須靠 **thresholds**，或把 `checks` 通過率設成 threshold。

下一篇：k6 的指標體系——內建指標看什麼、怎麼加自訂指標。
