---
tags: ['行動測試', 'Appium', '測試策略', '自動化測試']
---

# App 測試為什麼比網頁測試難這麼多？

從網頁測試轉向 App 測試，很多 QA 都有一樣的感受：「明明是同一個功能，為什麼行動端要花兩倍時間？」

這不是你不熟練，也不是你的團隊效率低落——行動端測試本質上就是更複雜的環境。

數據也說明了這個現象：Tricentis 在 2024 年調查了 1,000 位資深 IT 專業人員與開發者，結果顯示：

- **87%** 表示行動 App 品質對公司業務至關重要
- 但只有 **27%** 認為自己的行動 App 測試策略「超越預期」
- **90%** 估計行動 App 品質不佳每年最多會造成 **250 萬美元（約台幣 8,000 萬）** 的營收損失
- 仍有 **47%** 的團隊主要依賴人工測試

知道重要，但做不到位——這個落差的背後，就是行動測試本質上的複雜度。

---

## 難在哪裡？先看失敗時發生了什麼

在網頁測試，一個 test case 跑失敗了，你通常很快就能定位：

- 是選取器（selector）壞掉了？
- 是測試資料的問題？
- 是網路請求失敗？
- 還是應用程式本身的 bug？

但在 App 測試，同一個失敗可能來自完全不同的地方：

- OS 版本不對（iOS 16 vs iOS 17 行為不同）
- App 狀態殘留（前一個 test 沒有正確 teardown）
- 裝置權限沒有開啟
- Build 類型錯誤（Debug build 和 Release build 行為有差）
- Appium / WebDriverAgent 本身的問題
- 雲端裝置運行緩慢導致 timeout
- Deep link 設定錯誤
- Push notification 狀態干擾測試流程
- 安裝失敗，但 test runner 沒有正確拋出錯誤

同樣一個「按鈕點不到」，在網頁可能只是選取器問題，在 App 可能是以上任何一種——而且每種的排查方式都完全不同。

---

## 五個讓 App 測試特別耗時的地方

### 1. 環境準備比「指向一個 URL」複雜得多

網頁測試的環境準備基本上就是一行：打開瀏覽器，輸入 URL。

App 測試的環境準備清單長得多：

- 確認這次的 build 版本是哪個（Dev / Staging / Release）
- 確認裝置 / 模擬器的 OS 版本正確
- 確認 Appium server 有在跑、capabilities 設定正確
- 確認 App 已正確安裝（不是舊版殘留）
- 確認裝置的語言、時區、通知權限設定符合測試情境

任何一個環節出問題，你的 test 還沒開始跑就已經失敗了。

光是 Android 生態系，目前就有超過 **24,000 種裝置型號**，同時間在市場上活躍的 Android 版本超過 6 個（Android 9 到 Android 14 都還有使用者）。iOS 碎片化程度雖然低一些，但每年 iOS 大版本更新後，仍需要維持對舊版本的相容測試。

### 2. 自動化腳本要寫兩份

如果你的 App 同時支援 Android 和 iOS，很多互動的底層實作是不同的。元素定位方式、手勢觸發、鍵盤行為——常常沒辦法直接共用同一份腳本。

結果就是：維護成本直接乘以二。

用 Appium 搭配 Playwright 之類的框架可以盡量共用邏輯層，但終究無法完全消除這個差異。

### 3. 手動測試的覆蓋面更廣

行動裝置有一整類「網頁不存在的測試情境」：

- 手勢操作（滑動、長按、捏合縮放）
- 中斷測試（來電、推播通知在使用中途出現）
- 多工行為（切換 App 再回來）
- 各種裝置尺寸和解析度
- 低網路 / 無網路情境

這些只能手動跑，而且每次都要考慮「這個功能在 3 種螢幕尺寸上都長得對嗎」。

### 4. Debug 工具的學習曲線

網頁的 debug 工具是 DevTools，大家都很熟。

App 的 debug 需要學一套新工具：

- **Android**：ADB logcat 看 crash log、Chrome DevTools for Android 看 WebView
- **iOS**：Xcode Console 或 Console app 看系統 log

更麻煩的是，crash 的原因往往散落在多個地方，需要比對 app log + device log + automation log 才能確定根本原因。

### 5. 發布流程不在你控制範圍內

網頁發布按個按鈕，幾分鐘後就上線了。

App 發布要經過 App Store / Google Play 審核，等待時間從幾小時到幾天不等，而且可能被拒。

這代表：你不能在「發現 bug → 修好 → 馬上驗證」的迴圈裡快速移動。每一個 hotfix 都要重新走一次審核流程。Staged rollout 的監控也要持續跟進，不能發完就不管。

---

## 實務上怎麼應對

### 不要把網頁自動化的思維直接搬過來

網頁端常見的策略是「盡量自動化，覆蓋越多越好」。

行動端要反過來想：**維護一個精簡的自動化工具包，只覆蓋真正關鍵的核心流程**，然後靠手動 / 探索性測試覆蓋手勢、中斷、裝置特定行為。

自動化測試太多，在行動端的代價是：每次 Appium 版本更新、裝置 OS 升級，你都要花大量時間修 test。

### 建立一份「失敗排查清單」

行動端 test 失敗的時候，如果沒有一套系統性的排查流程，每次都是從頭謎題調查。

建議整理一份檢查清單，例如：

1. 這個 build 是正確的版本嗎？
2. 裝置的 OS 版本符合測試目標嗎？
3. Appium server log 有沒有異常？
4. 這個失敗在本機裝置能重現嗎（排除雲端環境問題）？
5. 這個操作在上一個版本有通過嗎？

這份清單不用很長，但要讓任何人拿到都能按步驟排查，而不是依賴某個人的經驗直覺。

### Hybrid App 的另一條路

如果你的 App 是用 React Native、Ionic Capacitor 這類技術建構的，底層其實是網頁。

這代表你可以直接用 Playwright / Cypress 跑網頁測試，在瀏覽器裡覆蓋大部分功能邏輯，然後在真實裝置上只測「行動專屬」的部分：安裝、通知、App 開啟 / 關閉、深度連結。

這不是偷懶——這是讓測試工具的強項和測試目標精確對齊。

---

## 小結

從網頁測試轉向 App 測試，耗時增加是正常的，不是你效率有問題。

難的不是功能本身，難的是：**你有多少層「不確定性」要在每次 test 失敗時排除**。

減少這些不確定性的方法：
- 精簡自動化，聚焦關鍵路徑
- 建立系統化的排查流程
- 善用 Hybrid App 架構降低行動測試負擔
- 手動測試集中在行動裝置獨有的行為

---

## 參考資料

- [Tricentis State of Mobile Application Quality Report 2024](https://www.tricentis.com/resources/mobile-application-quality-report)（調查 1,000 位資深 IT 專業人員與開發者）
- [BrowserStack: What is Android Fragmentation](https://www.browserstack.com/guide/what-is-android-fragmentation)
- [Capgemini World Quality Report 2024-25](https://www.capgemini.com/insights/research-library/world-quality-report-2024-25/)
