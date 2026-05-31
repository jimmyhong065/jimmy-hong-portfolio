# Deep Link 和 Universal Link 測試：比你想的更容易出錯

---

## 目錄

1. [那個推播點進去卻跑到首頁的問題](#推播點進去跑到首頁)
2. [Deep Link 和 Universal Link 的差異](#兩者差異)
3. [測試矩陣：比你想的多](#測試矩陣)
4. [常見的壞掉方式](#常見的壞掉方式)
5. [結尾](#結尾)

---

## 那個推播點進去卻跑到首頁的問題

我們的 App 的推播通知：「你的好友 Jimmy 完成了今日目標！來看看他的森林」，附帶一個 deep link，點擊後應該直接開啟那個用戶的森林頁面。

用戶回報：點了推播，App 打開，但停在首頁，沒有跳到那個森林頁面。

我測了一遍，沒問題。RD 也沒問題。

最後找到觸發條件：App 在背景時收到推播，點擊，直接跳到正確的森林頁面。App 完全關閉（被用戶或 iOS 終止）時收到推播，點擊，App 冷啟動，deep link 在啟動過程中被吃掉，停在首頁。

Cold start + deep link 的組合。這是最常被漏測的一個情境。

---

## Deep Link 和 Universal Link 的差異

**Deep Link（Custom URL Scheme）**

格式：`app://forest?user_id=123`

用法：App 定義一個自訂的 URL scheme，系統看到這個 scheme 就打開對應的 App。

問題：任何 App 都可以宣稱處理 `app://`，沒有驗證機制。安全性較低，在 iOS 14+ 某些情況下已被限制。

**Universal Link（iOS）/ App Link（Android）**

格式：`https://app.example.com/forest?user_id=123`

用法：標準的 HTTPS URL，但在裝置上有 App 且 App 有註冊這個 domain，系統會直接打開 App 而不是瀏覽器。

驗證機制：App 必須在 domain 上放一個 `apple-app-site-association`（iOS）或 `assetlinks.json`（Android）文件，證明 App 和 domain 的關聯。

**測試差異**

Custom URL scheme：直接在 Safari 或 Notes 打這個 URL 就能測。

Universal Link：測試更複雜，因為它的行為和 App 有沒有安裝、系統有沒有快取 association 文件都有關。

---

## 測試矩陣

Deep link 的觸發情境，比大部分人測試的多：

**App 狀態 × 觸發來源**

```
App 狀態：
├── Foreground（App 在前景運行）
├── Background（App 在背景暫停）
└── Cold Start（App 完全關閉）

觸發來源：
├── 推播通知點擊
├── 瀏覽器 URL 點擊
├── 其他 App 的 share
├── 掃描 QR code
└── Email / 訊息裡的連結
```

這是 3 × 5 = 15 個組合。不是全部都需要測，但 Cold Start 的組合通常是最容易出問題的，每個觸發來源都要測一次 Cold Start。

**帳號狀態 × Deep Link 目標**

```
帳號狀態：
├── 已登入
├── 未登入
└── Token 過期

Deep Link 目標：
├── 需要登入才能看的頁面（好友森林）
├── 不需要登入就能看的頁面（公開分享）
└── 不存在的資源（user_id 已刪帳）
```

未登入用戶點了需要登入才能看的 deep link，應該先導到登入頁，登入後再跳到目標頁面，不是直接顯示「無權限」錯誤。

---

## 常見的壞掉方式

**1. Cold Start 吃掉 Deep Link**

App 冷啟動時，有一個初始化流程（讀設定、拿 token、初始化 SDK）。這個流程完成之前，deep link 的導航邏輯還沒有啟動。

如果 deep link 在啟動流程完成前就被處理，但導航器還沒有 ready，link 就被靜默丟掉，App 停在首頁。

修法：在 `didFinishLaunchingWithOptions` 把 deep link 先存起來，等 App 完全初始化後再處理。

**2. Universal Link 失效**

Universal Link 依賴系統快取 `apple-app-site-association` 文件。如果 App 剛安裝、或者 domain 的文件更新了，系統需要重新抓取這個文件。在某些情況下，Universal Link 會暫時 fall back 到瀏覽器而不是 App。

測試方法：把 App 解除安裝，重新安裝，立刻測 Universal Link。確認新安裝的 App 也能正確打開 link，不是 fall back 到瀏覽器。

**3. 參數被截斷或編碼問題**

`app://forest?user_id=abc&from=notification`——如果參數裡有特殊字元（中文、空格、`&`），沒有正確 URL encode，解析會出問題。

測試方法：deep link 的參數用特殊字元試：中文 user name、含有 `&` 的 campaign ID。

**4. 導到不存在的資源**

`app://forest?user_id=deleted_user`——那個用戶已經刪帳，App 應該顯示友善的錯誤訊息，不是 crash 或白屏。

---

## 結尾

Deep link 測試容易被低估，因為 happy path 很容易過：App 打開，URL 對，直接跳到目標頁面。

真正出問題的是邊緣條件：Cold Start、未登入狀態、不存在的資源、Universal Link 的快取問題。這些在日常測試中不容易被想到，但在真實用戶中觸發率不低——用戶不一定一直保持 App 開著，Cold Start 是正常的使用情境。

把 Cold Start + 各觸發來源加進你的 deep link 測試清單，這一個情境能擋住最多的 link 問題。
