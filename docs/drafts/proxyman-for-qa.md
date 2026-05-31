# Proxyman 讓我少問了一半的問題，也讓 bug 無所遁形

---

## 目錄

1. [在用 Proxyman 之前，我怎麼除錯](#用之前怎麼除錯)
2. [Proxyman 是什麼](#是什麼)
3. [iOS 設定：十分鐘讓模擬器和真機都可以攔](#ios-設定)
4. [Android 設定：有幾個坑要先知道](#android-設定)
5. [QA 實際怎麼用：五個高頻場景](#五個高頻場景)
6. [導入團隊的建議](#導入團隊)
7. [結尾](#結尾)

---

## 在用 Proxyman 之前，我怎麼除錯

那段時間每次遇到網路相關的 bug，我的流程是：

1. 把 bug 的現象描述給 RD
2. RD 說「你能不能把 log 給我」
3. 我說「怎麼看 log」
4. RD 遠端連線或坐過來，開 Xcode console，教我怎麼找
5. Log 裡有一堆雜訊，RD 花時間篩
6. 找到那筆 API request，看 response
7. 確認問題

這個流程每次花 30–60 分鐘，而且很多時候問題已經過了，無法重現。

更麻煩的情況：bug 是「功能看起來正常，但不確定後端收到的 request 是否正確」。比如計時完成後，UI 顯示「種植成功」，但我不確定前端有沒有把正確的 `duration` 和 `tree_type` 送給後端。這種情況，光看 UI 是判斷不了的。

用了 Proxyman 之後，這類問題的答案我自己就能找到，不需要問 RD。

---

## Proxyman 是什麼

Proxyman 是一個 macOS 上的 HTTP/HTTPS 流量攔截工具（Proxy）。

它的角色是：坐在你的裝置和伺服器之間，把所有的網路請求都攔下來讓你看，也讓你修改它們。

```
裝置（iOS/Android）
      ↓ 所有 HTTP/HTTPS 請求
   Proxyman
      ↓ 轉發
   後端伺服器
```

你能看到：
- 每個 request 的 URL、Method、Header、Body
- 每個 response 的 Status Code、Header、Body
- 請求時間、大小、耗時

你能做到：
- 修改 request 再送出（改 header、改 body）
- 修改 response 再回給 App（讓後端「回傳」你想要的內容）
- 攔截 request 讓它等待，手動決定讓它過或修改後放行
- 把某個 API 的 response 換成你本地的 JSON 檔案
- 模擬慢速網路

最重要的是：這些都不需要改 code、不需要後端配合、不需要 RD 坐在旁邊。

---

## iOS 設定：十分鐘讓模擬器和真機都可以攔

### iOS 模擬器（最簡單，三步完成）

Proxyman 對模擬器有特殊支援，幾乎是一鍵設定。

**Step 1：打開 Proxyman，點選選單 Certificate → Install Certificate on iOS Simulators**

Proxyman 會自動把 CA 憑證安裝到所有模擬器，你不需要手動操作。

**Step 2：點選 Certificate → Trust Certificate on iOS Simulators**

自動信任，完成。

**Step 3：打開模擬器，打開你的 App，開始使用**

Proxyman 的 Request List 裡就會開始出現流量。

這三步大概兩分鐘，之後模擬器上的所有 HTTPS 流量都可以看到。

---

### iOS 真機設定

真機需要多幾個步驟，但一次設定之後就固定了。

**Step 1：確認 Mac 和 iPhone 在同一個 WiFi**

Proxyman 要作為 proxy，裝置和 Mac 必須在同一個網路。

**Step 2：在 Mac 的 Proxyman 找到你的 IP 和 Port**

Proxyman 啟動後，左下角會顯示類似：`192.168.1.5:9090`

這個是你 Mac 的 IP 和 Proxyman 的 port。

**Step 3：在 iPhone 設定 HTTP Proxy**

- 設定 → WiFi → 點選目前的 WiFi → 最下面「設定 Proxy」
- 選「手動」
- 伺服器：`192.168.1.5`（你 Mac 的 IP）
- 連接埠：`9090`

**Step 4：在 iPhone 安裝 Proxyman CA 憑證**

- iPhone 上打開 Safari（不能用 Chrome）
- 前往 `http://proxy.man/ssl`
- 下載描述檔
- 設定 → 已下載的描述檔 → 安裝

**Step 5：信任憑證**

- 設定 → 一般 → 關於本機 → 憑證信任設定
- 找到 Proxyman 的憑證，開啟「完全信任」

完成。之後 iPhone 上所有 App 的 HTTPS 流量都會經過 Proxyman。

**測試結束後記得關掉 Proxy 設定**，否則離開辦公室換了 WiFi，iPhone 的網路會壞掉（因為 Mac 不在了，Proxy 連不上）。

---

## Android 設定：有幾個坑要先知道

Android 比 iOS 複雜，因為 Android 7.0（API 24）之後，系統預設不信任用戶安裝的 CA 憑證。這意味著就算你安裝了 Proxyman 的憑證，App 也可能不接受它。

有三種方法，從簡單到完整：

### 方法一：Android 模擬器（最簡單）

**Step 1：在 Proxyman 點選 Certificate → Install Certificate on Android Emulators**

和 iOS 模擬器一樣，Proxyman 支援自動安裝。

但如果你的 App 的 `targetSdkVersion` 是 24 以上，可能還需要方法三。

**Step 2：設定模擬器的 Proxy**

```bash
# 透過 ADB 設定 proxy
adb shell settings put global http_proxy <your-mac-ip>:9090
```

或在模擬器設定裡手動設：Extended Controls → Settings → Proxy

---

### 方法二：Debug APK 加 network_security_config（開發環境標準做法）

這是最正確的做法，需要 RD 在 App 裡加一個設定：

**Step 1：在 Android 專案新增 `res/xml/network_security_config.xml`**

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <debug-overrides>
        <trust-anchors>
            <!-- 在 debug build 信任用戶安裝的憑證 -->
            <certificates src="user" />
            <!-- 也信任系統憑證 -->
            <certificates src="system" />
        </trust-anchors>
    </debug-overrides>
</network-security-config>
```

**Step 2：在 `AndroidManifest.xml` 的 `<application>` 加上這個設定**

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

**重要**：這個設定只影響 `debug` build，`release` build 的行為不變，不會影響上架的安全性。

這是跟 RD 說「請幫我加這個」最好的依據：**只改 debug build，production 完全不受影響。**

**Step 3：安裝 Proxyman CA 憑證到 Android 裝置**

- Proxyman → Certificate → Export Certificate as PEM → 儲存
- 傳到 Android 裝置
- 設定 → 安全性 → 安裝憑證（位置因廠商不同）

**Step 4：設定 WiFi Proxy（和 iOS 真機一樣）**

設定 → WiFi → 長按目前的網路 → 修改網路 → 進階選項 → Proxy → 手動

---

### 方法三：Production APK（進階，需要反編譯）

如果你需要測 production build，不能改 code，有一個方法：

用 `apk-mitm` 工具自動幫 APK 加 network security config：

```bash
# 安裝 apk-mitm
npm install -g apk-mitm

# 幫 APK 加 MITM 支援（會重新簽名）
apk-mitm forestfocus.apk
```

輸出是一個 `forestfocus-patched.apk`，可以直接安裝並攔截 HTTPS。

這個方法不需要原始碼，但需要解除安裝原本的 App（因為簽名不同）。適合測 release candidate build 的情境。

---

## QA 實際怎麼用：五個高頻場景

### 場景一：確認 Request 的內容是否正確

計時完成，UI 顯示「種植成功」，但我不確定前端送給後端的 `duration` 是否正確。

打開 Proxyman，找到 `POST /sessions/complete` 的 request：

```json
// Request Body
{
  "duration": 25,
  "tree_type": "oak",
  "session_id": "abc123"
}
```

一眼確認。不需要問 RD、不需要看 log、不需要加 debug print。

如果發現 `duration` 是 0 或是 null，這就是 bug 的根本原因，而且我能在 bug report 裡直接說：「前端送出的 request body 的 `duration` 是 null，不是 25。」這比說「計時完成後硬幣沒入帳」精確很多。

---

### 場景二：模擬後端回傳錯誤，測前端的 Error Handling

我想測：如果訂閱 API 回 500，App 的 UI 是否有友善的錯誤訊息？

不需要讓後端故意回 500（這很麻煩），用 Proxyman 的 **Breakpoint** 功能：

**設定 Breakpoint：**
- Tools → Breakpoint
- 新增一個 Breakpoint，條件：URL 包含 `/subscription/purchase`
- 設定在 Response 階段攔截

**操作：**
1. 在 App 點擊「購買 Pro」
2. Proxyman 攔截到 response，暫停
3. 把 Status Code 改成 `500`，Body 改成 `{"error": "Internal Server Error"}`
4. 放行

App 收到 500，觀察 UI：是顯示「購買失敗，請稍後再試」，還是白屏，還是 crash？

這個測試用 Breakpoint 做，30 秒設定好，不需要後端改任何東西。

---

### 場景三：Map Local — 用本地 JSON 替換 API Response

森林主頁的 API 正常回傳 3 棵樹，但我想測「有 100 棵樹的時候 UI 怎麼顯示」，後端沒有辦法快速給我一個有 100 棵樹的帳號。

用 **Map Local** 功能：

**Step 1：建立本地的 JSON 檔案**

```json
// ~/Desktop/forest_100_trees.json
{
  "trees": [
    {"id": 1, "type": "oak", "planted_at": "2026-01-01"},
    {"id": 2, "type": "pine", "planted_at": "2026-01-02"},
    // ... 100 棵
  ],
  "total": 100
}
```

**Step 2：設定 Map Local**

- Tools → Map Local
- Request URL 匹配：`*/forests/my`
- 對應到本地檔案：`~/Desktop/forest_100_trees.json`

**Step 3：打開 App，進入森林主頁**

App 的 `GET /forests/my` request 被 Proxyman 攔截，response 替換成你的本地 JSON，App 看到的是一個有 100 棵樹的森林。

不需要後端建資料、不需要 RD 幫忙，你自己就能測任何邊界狀態。

這個功能對測試「超量資料的 UI 行為」、「API 格式改動後前端的相容性」、「特殊邊界值的資料」都極其有用。

---

### 場景四：找 Flaky Bug 的根因

計時器偶爾出現「種植失敗」，重現不穩定。

以前的做法：等它再次出現，然後趕快截圖。

現在的做法：Proxyman 一直在記錄所有流量。當 bug 出現的時候，我直接在 Proxyman 裡找到那次 request，看 response：

```json
// 那次失敗的 response
{
  "error": "DUPLICATE_SESSION",
  "message": "A session with this ID already exists"
}
```

原來是計時器在背景被喚醒時，重複送了 `POST /sessions/complete`，後端拒絕了第二次。

這個資訊讓 RD 立刻定位到問題：App 的 timer 恢復邏輯在特定條件下會重複觸發完成事件。

沒有 Proxyman，這個 bug 可能要花幾天才能定位。有了 Proxyman，出現一次就有足夠的資訊。

---

### 場景五：驗證 Headers 和認證

我想確認：每個 API request 有沒有帶正確的 `Authorization` token？Header 有沒有帶 `X-App-Version`？

在 Proxyman 點任何一個 request，切到 Headers tab：

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR...
Content-Type: application/json
X-App-Version: 6.2.1
X-Platform: ios
X-Device-ID: abc-def-123
```

確認所有 header 都在、格式正確。如果某個 request 沒有帶 `Authorization`，可能是 token 沒有正確設定，或者有些 API 呼叫走了錯誤的 code path。

這個驗證以前要 RD 加 log 才能看到，現在 QA 自己就能做。

---

## 導入團隊的建議

### 怎麼跟 RD 說

「我需要你幫 Android 的 debug build 加 `network_security_config.xml`，這樣我測試的時候能攔截 HTTPS 流量，找 bug 更快，也不需要一直問你 log。」

這句話對 RD 的說服力很強：**幫我做一件小事，換來少被問很多問題**。

加 `network_security_config.xml` 總共改兩個檔案、10 行 code，一般 RD 5 分鐘就能做完。

### 什麼時候應該在 CI 或 Staging 環境設定

如果你的 staging server 有 SSL pinning（App 只信任特定的憑證），Proxyman 的憑證會被拒絕，攔截不到。

這種情況要請 RD 在 debug build 裡把 SSL pinning bypass 掉，或者直接停用 SSL pinning for debug builds。

### 給 QA 同事的快速入門順序

1. 安裝 Proxyman（Mac App Store 有免費版，大部分功能夠用）
2. 先設定 iOS 模擬器（最簡單，兩分鐘）
3. 練習看一個 API request 的 Request Body 和 Response Body
4. 學會用 Breakpoint 改 Response Status Code
5. 學會 Map Local
6. 再設定 iOS 真機（需要配置 WiFi Proxy）
7. 最後設定 Android（需要 RD 幫忙加 network_security_config）

這個順序讓你可以從最低成本的地方開始，不需要一次學完所有功能。

### 常用的 Filter 設定

Proxyman 會攔截電腦上所有 App 的流量，包含系統更新、Slack、Chrome——很多不相關的雜訊。

設定 Filter 只看你的 App：

- Proxyman → 左側的 Filter
- 輸入你的 API domain（`api.example.com`）
- 或者輸入你的 App 的 Bundle ID

這樣 Request List 只顯示你關心的流量，除錯效率高很多。

---

## 幾個 Proxyman 的進階功能

### Scripting（JavaScript）

可以用 JavaScript 寫腳本，自動修改 request 或 response：

```javascript
// 每個 request 自動加 debug header
function onRequest(context, url, request) {
  request.headers["X-QA-Debug"] = "true";
  return request;
}

// 自動記錄所有 500 錯誤到 console
function onResponse(context, url, request, response) {
  if (response.statusCode === 500) {
    console.log("500 Error:", url, response.body);
  }
  return response;
}
```

這個功能對自動化測試輔助很有用：不需要每次手動設 Breakpoint，腳本自動處理。

### Network Throttling

Tools → Throttle → 設定頻寬限制和延遲：

```
預設可選：
- 3G（1.5 Mbps，300ms latency）
- Edge（240 Kbps，800ms latency）
- 自訂（你想要的任何設定）
```

搭配前面說的弱網測試，Proxyman 的 Network Throttle 比 iOS Network Link Conditioner 更靈活，可以針對特定 domain 設定，而不是全局生效。

### Diff 工具

把兩個 request 或 response 放在一起比較差異。在測試「這次 release 的 API 格式和上次有什麼不同」的時候特別有用。

---

## 結尾

用了 Proxyman 大概三個月後，我發現自己問 RD 的問題少了很多。

以前問的：「這個 API 有沒有被呼叫到？」「Request 裡的 duration 是什麼值？」「Response 是什麼格式？」「那個 API 有沒有帶 token？」

這些現在我自己在 Proxyman 就能看到，不需要等 RD。

留下來問 RD 的問題品質也變高了：「Response 裡的 `coins_earned` 是 null，你覺得這個 null 是預期行為還是計算邏輯有問題？」而不是「我覺得有問題，你看一下。」

Proxyman 本質上是一個「讓 QA 能看到網路層真相」的工具。看得到真相，bug 就無所遁形，和 RD 的溝通也更有效率。

對大部分的 Mobile App QA 來說，這是性價比最高的一個工具投資。
