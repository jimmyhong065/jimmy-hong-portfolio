# Proxyman 攔截請求的原理：中間人是怎麼運作的

---

## 目錄

1. [為什麼要攔截請求](#為什麼攔截)
2. [中間人攻擊的原理](#中間人原理)
3. [HTTPS 為什麼能被攔截](#https-攔截)
4. [憑證安裝在做什麼](#憑證安裝)
5. [實際 Demo：看請求怎麼被攔截](#實際-demo)
6. [結尾](#結尾)

---

## 為什麼要攔截請求

App 打 API 的時候，你在 App 畫面上只看得到結果——「載入成功」或「發生錯誤」。

但畫面背後，App 發了什麼 request、帶了哪些 header、server 回了什麼 response，你看不到。測試的時候，這些資訊非常重要：

- request body 的格式是否正確？
- Authorization header 有沒有被帶上去？
- server 回的錯誤是 401 還是 500？錯誤訊息是什麼？
- API 回傳的資料和畫面顯示的是否一致？

Proxyman 讓你能看到這一切。它的做法，是把自己插入 App 和 server 之間，成為中間人。

---

## 中間人原理

正常情況下，App 和 server 直接溝通：

```
iOS App ──────────────────── Server
         request / response
```

Proxyman 啟動後，把自己插入中間：

```
iOS App ──── Proxyman ──── Server
         ↑               ↑
      App 以為            Server 以為
      在跟 Server 說話    在跟 App 說話
```

App 發出去的 request，先到 Proxyman。Proxyman 讀取內容、記錄下來，再轉發給真正的 server。Server 的 response 同樣先經過 Proxyman，再轉回給 App。

App 和 server 都不知道中間有人。這就是「中間人」（Man-in-the-Middle，MITM）的概念。

Proxyman 是善意的 MITM——目的是觀察和除錯，不是竄改（雖然它也有竄改的能力，後面會提）。

---

## HTTPS 為什麼能被攔截

HTTP 是明文傳輸，沒有加密，攔截很容易理解。

HTTPS 呢？HTTPS 的「S」代表 SSL/TLS 加密——理論上，沒有 server 的私鑰，第三方無法解密內容。那 Proxyman 怎麼看得到 HTTPS 的請求？

關鍵在於：Proxyman 對 App 假裝是 server，對 server 假裝是 App。

```
iOS App                Proxyman                  Server
   |                      |                         |
   |── HTTPS 請求 ────────>|                         |
   |   (用 Proxyman 的憑證加密)                      |
   |                      |── HTTPS 請求 ───────────>|
   |                      |   (用 Server 真實憑證加密) |
   |                      |<── Response ─────────────|
   |                      |   (Proxyman 解密、記錄)   |
   |<── Response ─────────|                         |
   |   (Proxyman 重新加密回傳)                       |
```

Proxyman 維護兩條獨立的加密連線：
1. App ↔ Proxyman（用 Proxyman 自己的憑證加密）
2. Proxyman ↔ Server（用 Server 的真實憑證加密）

中間 Proxyman 解密了 App 的請求，讀取明文內容，再重新加密轉發給 server。對 App 來說，它以為自己在跟 server 說話；對 server 來說，它以為自己在跟 App 說話。

這套機制讓 Proxyman 能完整看到 HTTPS 的內容，包含 request body、response body、所有 header。

---

## 憑證安裝在做什麼

這裡有個問題：App 怎麼知道要不要信任對方的憑證？

HTTPS 的信任機制靠的是憑證鏈（Certificate Chain）。App 收到一個憑證，會去驗證它是否由受信任的 CA（Certificate Authority）簽發。iOS 內建了一批受信任的根 CA，如果收到的憑證不是這些 CA 簽的，iOS 會拒絕連線。

Proxyman 有自己的根憑證（Proxyman CA），這個 CA 不在 iOS 的預設信任清單裡。所以如果你直接讓 iOS 通過 Proxyman，它會收到 Proxyman 的憑證，驗證失敗，拒絕連線，看到 SSL error。

解決方法是：把 Proxyman 的根憑證安裝到 iOS 上，並手動設定信任。

安裝之後，iOS 把 Proxyman CA 加入自己的信任清單。這樣當 App 收到 Proxyman 簽發的憑證時，驗證通過，連線成功——Proxyman 就能正常攔截。

**iOS Simulator 的快捷方式**

Proxyman 提供 Certificate → Install Certificate on iOS Simulators，一鍵完成憑證安裝，不需要手動設定。這是 Simulator 限定的功能，因為 Proxyman 可以直接操作 Simulator 的憑證 store。

真實 iOS 裝置則需要手動：連上 Proxyman 的 Wi-Fi proxy，用 Safari 打開 `http://proxy.man/ssl` 下載憑證，再去 Settings → General → About → Certificate Trust Settings 手動信任。

---

## 實際 Demo：看請求怎麼被攔截

用一個簡單的 Demo 說明。

**環境：**
- FastAPI 跑在 `http://127.0.0.1:8000`
- SwiftUI iOS App 打這個 API
- Proxyman 開著，Simulator 憑證已安裝

**Demo App 有幾個按鈕：**

```
POST /login       ← 帶 email + password body
GET  /user/1001   ← 帶 Authorization header
POST /plant       ← 帶 request body + Authorization header
GET  /plant/history/1001
```

點「Login（正確密碼）」之後，Proxyman 的 Traffic 視窗立刻出現這筆請求：

**Request：**
```
POST http://127.0.0.1:8000/login
Content-Type: application/json

{
  "email": "demo@example.com",
  "password": "demo1234"
}
```

**Response：**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo",
  "user_id": 1001,
  "email": "demo@example.com"
}
```

App 畫面只顯示「登入成功」，但 Proxyman 讓你看到完整的 request body、response body、status code、耗時。

---

點「Get User（無 Token）→ 401」，可以看到請求沒有帶 Authorization header，server 回 401：

**Request：**
```
GET http://127.0.0.1:8000/user/1001
（無 Authorization header）
```

**Response：**
```json
{
  "detail": "Missing Authorization header"
}
```

App 可能只顯示一個紅色錯誤畫面，但 Proxyman 告訴你：問題不是網路，是 header 沒帶。

---

**Breakpoint：在請求送出前攔截並修改**

Proxyman 還有 Breakpoint 功能，讓你在請求送出前暫停，手動修改內容再放行。

對 `POST /plant` 設定 Breakpoint，點「種樹 25 分鐘」之後，Proxyman 暫停請求，你可以把 `duration_minutes` 從 25 改成 999，看 App 和 server 怎麼處理超大值。

這在測試 input validation 的時候很有用：不需要改 App 程式碼，直接在網路層塞入非預期的資料。

---

## 結尾

中間人攔截聽起來像資安漏洞，但 Proxyman 做的是善意版本——它不是要竊取資料，是讓你能看到自己的 App 在做什麼。

理解 MITM 的原理，有幾個實際的好處：

**知道憑證安裝為什麼必要**：不是 Proxyman 的設定步驟，是 HTTPS 信任機制的基礎。

**理解為什麼 Production App 更難攔截**：很多 App 有 SSL Pinning——App 內建指定的憑證指紋，只信任這個憑證，不信任系統憑證 store 裡的任何東西（包括你安裝的 Proxyman 憑證）。這讓 Proxyman 在 Production App 上失效，需要額外的方法繞過。

**知道 Proxyman 能做什麼、不能做什麼**：能攔截、能修改、能重放請求，但需要裝置信任憑證，且對有 SSL Pinning 的 App 無效。

QA 用 Proxyman 不是在做壞事，是在用工程師一樣的工具，看清楚 App 和 server 之間真正在說什麼。
