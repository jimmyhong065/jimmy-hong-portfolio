---
title: k6 腳本工程化：group、參數化、env、setup/teardown
excerpt: 一次性的腳本誰都會寫，能長期維護的才有價值。這篇講用 group 分層業務、用 SharedArray 做高效參數化、用環境變數切換設定，以及用 setup/teardown 管理測試生命週期。
tags: [k6, 效能測試, 參數化, 腳本工程]
status: draft
---

# 腳本工程化：讓腳本能長期維護

能跑的腳本誰都寫得出來，能長期維護、能還原真實流量的腳本才有價值。這篇把零散的 k6 腳本，整理成工程化的樣子。

## group：把業務流分層

`group` 讓 summary 按業務邏輯分組，報表一看就懂哪條流程慢（對應觀念課的「用戶旅程」）。

```javascript
import { group } from 'k6'

export default function () {
  group('瀏覽商品', () => {
    http.get(`${BASE}/products`, { tags: { name: 'browse' } })
  })
  group('下單流程', () => {
    const cart = http.post(`${BASE}/cart`, body, { tags: { name: 'addCart' } })
    http.post(`${BASE}/orders`, body, { tags: { name: 'createOrder' } })
  })
}
```

## 參數化：用 SharedArray（重要）

觀念課強調參數化要還原真實分佈、帳號池要夠大。在 k6 做參數化**一定要用 `SharedArray`**——否則每個 VU 都會複製一份資料，幾萬 VU 時記憶體直接爆。

```javascript
import { SharedArray } from 'k6/data'

// 只載入一次，所有 VU 共享記憶體
const skus = new SharedArray('skus', () => JSON.parse(open('./data/skus.json')))
const users = new SharedArray('users', () => JSON.parse(open('./data/users.json')))

export default function () {
  // 照熱點權重抽（這裡簡化成隨機）
  const sku = skus[Math.floor(Math.random() * skus.length)]
  const user = users[__VU % users.length] // 每個 VU 綁一個帳號，避免撞鎖
  // ...
}
```

`__VU`（第幾個虛擬用戶）和 `__ITER`（第幾次迭代）是 k6 內建變數，常用來分配資料、避免所有 VU 都打同一筆（觀念課說的「假瓶頸 / 假快取命中」）。

## env：切換環境與設定

別把 URL、負載參數寫死。用 `__ENV` 讀環境變數，這在 CI 切 staging/production 時是關鍵：

```javascript
const BASE = __ENV.BASE_URL || 'https://staging.example.com'
const RATE = Number(__ENV.RATE || 100)
```

```bash
k6 run -e BASE_URL=https://prod.example.com -e RATE=2000 script.js
```

設定多時，可以把 options 拆成外部 JSON，用 `--config` 載入，讓「腳本」和「壓測參數」分離。

## setup / teardown：測試生命週期

`setup()` 在所有 VU 開跑前執行一次（拿 token、準備資料），回傳值會傳給 default function；`teardown()` 在最後執行一次（清理）。

```javascript
export function setup() {
  const res = http.post(`${BASE}/login`, adminCreds)
  return { token: res.json('token') } // 傳給 default
}

export default function (data) {
  http.get(`${BASE}/me`, { headers: { Authorization: `Bearer ${data.token}` } })
}

export function teardown(data) {
  http.post(`${BASE}/test-data/cleanup`, null, { headers: { Authorization: `Bearer ${data.token}` } })
}
```

## 建議的專案結構

```
k6/
├── tests/         # 各業務的腳本：checkout.js, browse.js
├── data/          # 參數化資料：skus.json, users.json
├── lib/           # 共用：http client、auth、config
└── options/       # 各負載等級的 options：light.json, heavy.json
```

## 帶得走

- `group` 把業務分層，報表好讀；`tags` 讓門檻能對單一交易下。
- 參數化**必用 `SharedArray`**，配 `__VU`/`__ITER` 分配資料避免撞鎖、假命中。
- `__ENV` 切環境/負載，讓腳本與參數分離——CI 切環境靠它。
- `setup/teardown` 管 token 與測試資料的生命週期。

下一篇：把這套腳本接進 GitHub Actions，讓 thresholds 當 CI 門檻。
