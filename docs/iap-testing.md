# 測 IAP 和第三方整合：Apple、Google 的沙盒環境有多難搞

---

## 目錄

1. [Sandbox 帳號，那個每隔幾週就失效的東西](#sandbox-帳號)
2. [IAP 測試的核心困難](#核心困難)
3. [我的 IAP 測試流程](#測試流程)
4. [Google Play 和 App Store 沙盒的差異](#兩者差異)
5. [其他第三方整合的測試原則](#其他第三方)
6. [結尾](#結尾)

---

## Sandbox 帳號，那個每隔幾週就失效的東西

根據 RevenueCat 2024 年的《State of Subscription Apps》報告，App 內購（IAP）是行動 App 最主要的商業模式，但訂閱流程的技術問題——購買失敗、訂閱狀態不同步、退款處理不當——是用戶流失的重要原因之一。即便只有 1% 的購買流程出現問題，在有一定規模的 App 上，每天的損失也相當可觀。而這一切都從一個測試環境開始：那個每隔幾個月就會突然失效的 Apple Sandbox 帳號。

我們的 App 的 Pro 訂閱走 App Store IAP。每次測試訂閱流程，都要用 Apple Sandbox 測試帳號。

這個 Sandbox 帳號有幾個特性讓我印象深刻：

每隔幾個月帳號密碼會被 Apple 要求重設。有時候沒有任何預警，突然就登不進去。

Sandbox 環境的訂閱週期被壓縮了：月訂閱在 Sandbox 裡是 5 分鐘，年訂閱是 1 小時。這讓測試「訂閱到期」的情境稍微可行，但也帶來了「測試過程中訂閱突然到期」的意外。

某次我在測訂閱購買流程的中途，Sandbox 後台的交易卡住了，之後幾個小時所有的 Sandbox 購買請求都會 timeout。原因是 Apple 的 Sandbox 環境偶爾就是會掛，不是你的 App 問題。

第一次遇到這些情況，你會懷疑是自己的問題，花很多時間在錯誤的方向除錯。

---

## IAP 測試的核心困難

**1. 無法完整模擬真實購買流程**

Sandbox 環境的行為和 production 不完全相同。Sandbox 不會真的扣款，某些 App Store 的促銷機制在 Sandbox 沒有。

更重要的是：Sandbox 的 receipt 驗證和 production 的 receipt 驗證走的是不同的端點。後端在 production 要記得切換驗證端點，如果沒切換，production 的購買用 sandbox 端點驗證會失敗。這個錯誤在 staging 測試中發現不了。Apple 官方文件明確標注了兩個端點的差異，但這個細節仍是上線後最常出現的 IAP 問題之一。

**2. Refund 測試**

Apple 的退款流程需要用戶在 App Store 申請，App 無法在 Sandbox 模擬退款。

但 Apple 有一個機制：當退款發生，Apple 會發 `REFUND` notification 給你的後端。你可以在 Sandbox 的 App Store Connect 後台手動觸發這個 notification，測試後端的退款處理邏輯。

這個機制很多人不知道，導致退款邏輯從來沒有被測試過——直到真的有用戶退款，發現退款後功能沒有被正確取消。

**3. 訂閱狀態同步的時機**

用戶訂閱之後，訂閱狀態需要在前端和後端同步。Apple 把購買 receipt 回給前端，前端把 receipt 傳給後端驗證，後端更新訂閱狀態。

這個流程的問題：如果後端驗證慢了，前端拿到購買成功的 callback 但後端還沒更新，用戶看到「購買成功」但功能還是鎖的。

測試方法：模擬後端驗證 delay（在 staging 加一個人工 delay），確認前端的 loading state 和 error handling 是否正確。

---

## 我的 IAP 測試流程

**Step 1：前置準備**

- 確認 Sandbox 帳號可以登入（每次測試前確認，不要假設上次能用這次也能用）
- 確認後端的 receipt 驗證端點是 Sandbox 端點（不是 Production）
- 確認 Sandbox 環境的 App Store Connect 後台可以存取

**Step 2：Happy Path**

1. 用全新的 Sandbox 帳號登入
2. 進入訂閱頁面，確認免費版限制正確顯示
3. 點擊訂閱，完成 Sandbox 購買流程
4. 確認後端收到並驗證了 receipt
5. 確認 Pro 功能解鎖（稀有樹種、無廣告、好友功能）
6. 確認跨裝置同步：在另一台裝置登入同帳號，Pro 功能有解鎖

**Step 3：錯誤和邊界情境**

- 購買中途取消（用戶按了 Cancel）
- 網路中斷後的 retry 行為
- 後端 receipt 驗證失敗（測試前端的 error handling）
- 已訂閱用戶重複點擊訂閱按鈕

**Step 4：手動觸發 Sandbox notification**

在 App Store Connect 後台，手動觸發這幾種 notification，確認後端處理正確：

- `DID_RENEW`：訂閱自動續期（在 Sandbox 是 5 分鐘後）
- `EXPIRED`：訂閱到期，確認 Pro 功能被正確鎖回
- `REFUND`：退款，確認功能取消和資料處理

---

## Google Play 和 App Store 沙盒的差異

**測試帳號設定**

App Store：在 App Store Connect 建立 Sandbox 帳號，用這個帳號登入裝置上的 App Store。

Google Play：在 Google Play Console 設定測試用的 Gmail 帳號為 License Tester，這些帳號購買都是免費的（不會真的扣款）。

Google 的設定比 Apple 稍微麻煩一點：需要把測試 APK 上傳到 Internal Testing track，然後把測試帳號加入測試清單，才能在那個帳號看到測試定價。

**Receipt 驗證**

App Store 用 Apple 的 receipt 驗證 API。
Google Play 用 Google Play Developer API，需要 OAuth 2.0，設定相對複雜。

**Subscription 行為差異**

Sandbox 壓縮比例不同：
- App Store Sandbox：月訂閱 = 5 分鐘，年訂閱 = 1 小時
- Google Play 測試：月訂閱 = 5 分鐘

行為上，Google 的訂閱狀態同步有時候比 Apple 慢，需要稍微長一點的 polling timeout。

---

## 其他第三方整合的測試原則

IAP 的問題在其他第三方整合上也會出現：

**Google Sign-In / Apple Sign-In**：Sandbox 環境可以用，但某些 OAuth scope 在 staging 和 production 行為不同。

**Firebase / Crashlytics**：確認 staging 和 production 的 Firebase project 是分開的，不要讓測試的 crash log 污染 production 的數據。

**Firebase Cloud Messaging（推播）**：在 staging 發推播需要另外設定測試用的 FCM token，production 的 device token 不能在 staging 用。

通用原則：
1. **每個第三方服務的 sandbox/staging 環境要記錄清楚**，不要每次測試都要重新找設定方法
2. **第三方服務不穩定的情況要有標準 SOP**：「Apple Sandbox 掛了，怎麼確認、怎麼等、怎麼繞過繼續測試」
3. **Production 上線前一定要有一輪在接近 production 條件下的測試**，純 staging 測試不足夠

---

## 結尾

IAP 測試讓我學到的最重要一件事：第三方整合有自己的不確定性，不是你的 App 問題也不是你的測試問題，是外部依賴的特性。

接受這件事之後，你的測試策略會改變：不是「把所有情境都測完才放心」，是「把已知的高風險情境覆蓋好，對外部不確定性保持觀測能力」。

Sandbox 帳號失效、Apple Server 偶爾掛掉、receipt 驗證偶爾 timeout——這些都是你控制不了的變數。你能控制的是：當這些事情發生的時候，你的 App 和後端有沒有正確的錯誤處理。測這個，比測「正常購買流程有沒有走通」更重要。

---

## 參考資料

- [Apple：在 Sandbox 中測試 In-App Purchase](https://developer.apple.com/documentation/storekit/testing_in_app_purchases_with_sandbox) — Apple 官方 Sandbox 測試環境設定與限制說明
- [Apple App Store Server API](https://developer.apple.com/documentation/appstoreserverapi) — 後端 Receipt 驗證端點與 Notification 格式
- [Google Play Billing 開發者文件](https://developer.android.com/google/play/billing) — Google Play IAP 完整開發與測試指南
- [Google Play：設定授權測試](https://developer.android.com/google/play/billing/test) — Google Play 測試帳號與 License Tester 設定
- [StoreKit 官方文件](https://developer.apple.com/documentation/storekit) — Apple 的 IAP 框架，包含 StoreKit 2 的新 API
