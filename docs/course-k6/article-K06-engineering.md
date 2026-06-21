---
title: k6 腳本工程化：group、參數化、認證流程、Threshold 設計
excerpt: 一次性的腳本誰都會寫，能長期維護的才有價值。這篇講 SharedArray 參數化、CookieJar 多用戶認證、Token 過期輪換，以及怎麼從 SLO 推出有意義的 threshold——而不是從空氣捏數字。
tags: [k6, 效能測試, 參數化, 腳本工程, 認證]
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

## 認證流程：Cookie jar 與 Token 輪換

真實 API 幾乎都有登入狀態。認證在壓測裡有兩種常見模式：

**模式一：setup() 拿一次 token，所有 VU 共用**

適合 admin token、測試專用的長效 token。K06 setup 範例就是這個做法。缺點是所有 VU 帶同一個身份，不能測「多用戶同時存取」的場景。

**模式二：每個 VU 自己登入，帶自己的 session**

還原真實的多用戶場景：

```javascript
import { CookieJar } from 'k6/http'

// 每個 VU 有獨立的 cookie jar
const jar = new CookieJar()

export default function () {
  const user = users[__VU % users.length]

  // 登入，session cookie 自動存進 jar
  http.post(`${BASE}/login`, user, { jar })

  // 後續請求帶同一個 jar，伺服器認得這個 session
  http.get(`${BASE}/profile`, { jar })
  http.post(`${BASE}/cart`, cartBody, { jar })
}
```

每個 VU 有獨立 `CookieJar`，登入後 server 回的 Set-Cookie 會自動存入，後續請求自動帶上——不用手動抄 token。

**Token 會過期怎麼辦？**

短效 JWT 在長時間壓測中一定會到期。用 `__ITER` 計數，每隔一段迭代重新登入：

```javascript
export default function (data) {
  // 每 50 次迭代換一次 token（依 token 效期調整）
  if (__ITER % 50 === 0) {
    const res = http.post(`${BASE}/auth/refresh`, { refreshToken: data.refreshToken })
    data.token = res.json('accessToken')
  }

  http.get(`${BASE}/me`, { headers: { Authorization: `Bearer ${data.token}` } })
}
```

## Threshold 怎麼定才有意義

K04 教「怎麼寫」threshold，這裡講「怎麼定一個有意義的數字」——因為定錯比沒有還糟。

**常見的壞 threshold：**

```javascript
// ❌ 從空氣捏出來的數字，沒有根據
thresholds: { http_req_duration: ['p95 < 2000'] }

// ❌ 太鬆：永遠過、啥都擋不住
thresholds: { http_req_duration: ['p95 < 10000'] }

// ❌ 太緊：在正常負載下也過不了，CI 永遠紅燈
thresholds: { http_req_duration: ['p95 < 50'] }
```

**定出有根據的 threshold，三個來源：**

1. **從現有監控取基線** — 在正常流量下跑一段時間，看 APM 的 p95。以此為基線，壓測 threshold 設為基線的 1.2～1.5 倍（允許合理的壓力下降）。

2. **從 SLO 反推** — 如果對外承諾 p99 < 500ms，壓測時 p95 < 300ms 是合理的安全邊際。

3. **從業務容忍度決定** — 結帳流程跟首頁搜尋的用戶容忍度不同，用 `tags` 對不同交易下不同門檻（K04 講過），不要對整體設一個平均值。

```javascript
// ✅ 按交易分別設，依業務重要性與 SLO 推算
thresholds: {
  'http_req_duration{name:checkout}': ['p95 < 800'],   // 結帳：嚴
  'http_req_duration{name:browse}':   ['p95 < 300'],   // 瀏覽：更嚴（高頻）
  'http_req_failed':                  ['rate < 0.01'], // 全局錯誤率 < 1%
}
```

第一次跑沒有基線？先跑一次輕量版（10 VU），把結果當基線，再定 threshold 跑正式壓測。

## 帶得走

- `group` 把業務分層，報表好讀；`tags` 讓門檻能對單一交易下。
- 參數化**必用 `SharedArray`**，配 `__VU`/`__ITER` 分配資料避免撞鎖、假命中。
- `__ENV` 切環境/負載，讓腳本與參數分離——CI 切環境靠它。
- `setup/teardown` 管 token 與測試資料的生命週期。
- 多用戶場景用 `CookieJar`；長時間壓測用 `__ITER` 計數換 token。
- Threshold 從基線或 SLO 推，按交易分別設——定錯比沒有還糟。

下一篇：把這套腳本接進 GitHub Actions，讓 thresholds 當 CI 門檻。
