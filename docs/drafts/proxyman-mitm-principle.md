# Proxyman 攔截請求的原理：中間人是怎麼運作的

---

## 目錄

1. [為什麼要攔截請求](#為什麼攔截)
2. [中間人攻擊的原理](#中間人原理)
3. [HTTPS 為什麼能被攔截](#https-攔截)
4. [憑證安裝在做什麼](#憑證安裝)
5. [iOS 設定：Simulator 和真機](#ios-設定)
6. [Android 設定：為什麼比 iOS 麻煩](#android-設定)
7. [實際 Demo：看請求怎麼被攔截](#實際-demo)
8. [QA 常用的三個功能](#qa-功能)
9. [結尾](#結尾)

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

解決方法是：把 Proxyman 的根憑證安裝到 iOS 或 Android 上，並手動設定信任。安裝之後，系統把 Proxyman CA 加入信任清單，攔截才能正常運作。

---

## iOS 設定：Simulator 和真機

**iOS Simulator（2 步，全自動）**

Proxyman → Certificate → Install Certificate on iOS Simulators → Install

這個步驟同時做兩件事：
1. 把 Proxyman 根憑證裝進 Simulator 的 trust store
2. 把 Proxyman 設成 Simulator 的 proxy

沒做這步，Simulator 不會把流量導向 Proxyman，就算 macOS system proxy 開著也沒用——Simulator 有獨立的 proxy 設定，不是自動繼承 macOS 的。

**iOS 真機（手動，需要和 Mac 在同一個 Wi-Fi）**

1. 手機 Wi-Fi 設定 → 點連線名稱旁的 ⓘ → 設定 Proxy → 手動
2. Server 填 Mac 的 IP（Proxyman 頂部列出），Port 填 `9090`
3. Safari 打開 `http://proxy.man/ssl` 下載憑證
4. Settings → General → VPN & Device Management → 安裝下載的憑證
5. Settings → General → About → Certificate Trust Settings → 手動開啟 Proxyman 的信任

真機的流量設定步驟比 Simulator 多，但攔截到的行為更接近真實用戶環境。

**ATS 和 HTTP 的問題**

iOS 預設開啟 ATS（App Transport Security），擋掉所有 HTTP 明文流量，只允許 HTTPS。

打本地 API（`localhost`、`127.0.0.1`）的時候，需要在 `Info.plist` 加例外：

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsLocalNetworking</key>
    <true/>
</dict>
```

這個設定只允許本機網路，不影響對外部 domain 的 HTTPS 要求。

---

## Android 設定：為什麼比 iOS 麻煩

**Android 7+ 的憑證信任問題**

Android 7（API 24）之後，App 預設只信任系統 CA，不信任使用者安裝的 CA 憑證。就算你在 Android 設定裡安裝了 Proxyman 憑證，App 也不會信任它，HTTPS 攔截會失敗。

這是設計上的安全決策：防止用戶安裝惡意 CA 憑證後，所有 App 的 HTTPS 流量都被攔截。

**解決方法：`network_security_config.xml`**

在 Android App 的 `res/xml/` 新增：

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <debug-overrides>
        <trust-anchors>
            <certificates src="user" />
            <certificates src="system" />
        </trust-anchors>
    </debug-overrides>
</network-security-config>
```

`debug-overrides` 只在 debug build 生效，release build 完全不受影響。這表示：
- 測試環境：Proxyman 可以攔截
- Production release：這段設定不存在，不影響用戶安全

`AndroidManifest.xml` 的 `<application>` 要指向這個檔案：

```xml
android:networkSecurityConfig="@xml/network_security_config"
```

**Android Emulator 的 IP 問題**

Android Emulator 用 `10.0.2.2` 連到 Mac 的 localhost，這個地址只在 Emulator 內部有效。

流量通過 Proxyman 轉發時，Proxyman 在 Mac 端嘗試連到 `10.0.2.2`，但 Mac 本身找不到這個 IP，請求就會失敗（status 999）。

修法：把 App 的 base URL 從 `10.0.2.2` 改成 Mac 的真實 IP（在 Proxyman 頂部可以看到，例如 `192.168.50.160`）。這個 IP 不管從 Emulator 直連還是透過 Proxyman 轉發，都能正確找到 Mac 的 FastAPI。

**HTTP cleartext 的問題**

Android 9（API 28）之後，App 預設擋掉 HTTP cleartext traffic。打本地 API 同樣需要在 `network_security_config.xml` 開放：

```xml
<base-config cleartextTrafficPermitted="true">
    <trust-anchors>
        <certificates src="user" />
        <certificates src="system" />
    </trust-anchors>
</base-config>
```

**Release build 攔截困難**

Production App 通常沒有 `network_security_config.xml` 的用戶 CA 信任，加上可能有 SSL Pinning，Proxyman 基本上攔截不到。需要用 `apk-mitm` 這類工具重新打包 APK 才能繞過，但這只適用於測試用途，且有技術門檻。

---

## 實際 Demo：看請求怎麼被攔截

**環境：**
- FastAPI 跑在 `http://127.0.0.1:8000`（iOS）/ `http://192.168.50.160:8000`（Android）
- SwiftUI iOS App 和 Jetpack Compose Android App 各自打這個 API
- Proxyman 開著，憑證已安裝

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
  "email": "demo@forestfocus.app",
  "password": "demo1234"
}
```

**Response：**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo",
  "user_id": 1001,
  "email": "demo@forestfocus.app"
}
```

App 畫面只顯示結果，但 Proxyman 讓你看到完整的 request body、response body、status code、耗時。

---

點「Get User（無 Token）→ 401」，可以看到請求沒有帶 Authorization header，server 回 401：

```
GET http://127.0.0.1:8000/user/1001
（無 Authorization header）
```

```json
{ "detail": "Missing Authorization header" }
```

App 可能只顯示一個紅色錯誤畫面，但 Proxyman 告訴你：問題不是網路，是 header 沒帶。

**過濾流量**

Proxyman Traffic 視窗左下角 Filter → 輸入 `8000`，只顯示打這個 port 的請求，排除其他 App 的流量干擾。

---

## QA 常用的三個功能

**Breakpoint：攔截並修改請求**

對 `POST /plant` 設定 Breakpoint，點「種樹 25 分鐘」之後，Proxyman 暫停請求，你可以把 `duration_minutes` 從 25 改成 999，看 App 和 server 怎麼處理超大值。

不需要改 App 程式碼，直接在網路層塞入非預期的資料，測試 input validation 的邊界。

**Map Local：用本地 JSON 替換 API Response**

不需要後端配合，就能測試 edge case。

在 Proxyman 設定 Map Local，把 `GET /plant/history/1001` 的 response 換成本地一個 JSON 檔，裡面放 500 筆種植紀錄——測試 App 的無限捲動、空列表、超長內容的顯示行為。

或者把 `coins_earned` 設成 `null`，看 App 有沒有做 null 處理，而不是等後端真的給你一個有問題的 response。

**Repeat Request：重放請求**

右鍵任一請求 → Repeat，不需要在 App 上重新操作，直接把同一個請求再打一次。

測試冪等性（同一個請求打兩次，結果應該一樣）、session 過期後舊 token 的行為、API rate limiting——這些情境在 App 上手動觸發很麻煩，用 Repeat 就很快。

---

## 結尾

中間人攔截聽起來像資安漏洞，但 Proxyman 做的是善意版本——它不是要竊取資料，是讓你能看到自己的 App 在做什麼。

理解 MITM 的原理，有幾個實際的好處：

**知道憑證安裝為什麼必要**：不是 Proxyman 的設定步驟，是 HTTPS 信任機制的基礎。

**理解 iOS 和 Android 設定為什麼不同**：iOS 的 ATS 和 Android 的 CA 信任政策各有自己的設計邏輯，搞清楚原理才不會每次都靠試錯解決。

**知道 Production App 更難攔截**：SSL Pinning 讓 Proxyman 憑證被拒絕，release build 沒有 `network_security_config.xml` 的用戶 CA 信任。這是設計上的安全機制，不是 Proxyman 的限制。

QA 用 Proxyman 不是在做壞事，是在用工程師一樣的工具，看清楚 App 和 server 之間真正在說什麼。
