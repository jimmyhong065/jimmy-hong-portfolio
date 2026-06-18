# Playwright 和 Appium 的取捨：我在 Mobile Web 兩個都用過

---

## 目錄

1. [我以為 Playwright 可以取代 Appium](#以為可以取代)
2. [兩者的適用場景](#適用場景)
3. [Mobile Web 的特殊情況](#mobile-web)
4. [我現在的工具分工](#工具分工)
5. [結尾](#結尾)

---

## 我以為 Playwright 可以取代 Appium

根據 Stack Overflow 2024 年的開發者調查，Playwright 已成為最受歡迎的 Web 測試框架之一，使用率持續超越 Selenium 和 Cypress。它在三年內從幾乎沒有市佔率到主流，速度之快讓很多人開始問：「這個工具能不能一統 Web 和 Mobile 的測試？」我自己做了這個嘗試，花了兩週，得到了一個明確的答案。

我們的 App 準備做 Web 版，讓用戶在桌面瀏覽器也能使用計時功能。

我已經用 Appium 做了 iOS 和 Android 的自動化測試，自然想：「能不能用一套工具搞定 Web + Mobile？」

Playwright 支援 Mobile emulation，可以用 Chrome DevTools 的裝置模式模擬 iPhone 和 Android 的螢幕尺寸和 User-Agent。看起來很誘人：一個工具，一套腳本，覆蓋 Web 和 Mobile。

我花了兩週試著把 Appium 的測試腳本移植到 Playwright。

結果：Web 端的測試完全沒有問題，很好用。Mobile 端的測試——在模擬器上跑得動，但發現了幾個在 Playwright 的 Mobile emulation 裡測不到的問題：

- Swipe gesture 的行為和真實 App 不一樣
- iOS WebKit 的特定渲染問題，Chrome emulation 看不出來
- 原生元件（date picker、alert、native share sheet）Playwright 完全碰不到

---

## 兩者的適用場景

**Playwright 擅長的：**

- Web 應用測試（Desktop 和 Mobile Web）
- 跨瀏覽器測試（Chromium、Firefox、WebKit）
- Web UI 的 E2E 流程
- API 測試（可以直接用 `request` context）
- CI/CD 整合（速度快、設定簡單）
- Screenshot / Visual regression（內建支援）

**Appium 擅長的：**

- 原生 iOS / Android App 測試
- 原生 UI 元件（Alert、ActionSheet、系統設定）
- 手勢測試（Swipe、Long press、Pinch）
- 裝置狀態測試（網路切換、背景/前景）
- App 的系統整合（推播、相機、位置權限）

**Playwright 的 Mobile emulation 能做什麼：**

只是改變瀏覽器的 viewport 大小和 User-Agent，讓 Web 頁面「看起來」是手機版的。它仍然是在桌面瀏覽器裡跑，不是真正的 iOS Safari 或 Android Chrome，沒有觸控事件的真實行為，沒有真實的行動瀏覽器引擎差異。

---

## Mobile Web 的特殊情況

如果你的產品有 Mobile Web（用手機瀏覽器打開網頁），需要同時考慮兩個工具：

**Playwright for Mobile Web（推薦）**

用 Playwright 的 WebKit（Safari）和 Chromium（Android Chrome）跑 Mobile Web 的功能測試。

```javascript
// playwright.config.js
const devices = require('@playwright/test').devices;

module.exports = {
  projects: [
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 15'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],
};
```

Playwright 的 WebKit 用的是真正的 WebKit 引擎（不只是模擬 User-Agent），能抓到 iOS Safari 特有的渲染問題。

**Appium for Native App（維持使用）**

原生 iOS/Android App 的測試繼續用 Appium，不要混用。

**兩者的邊界：Mobile Web 的 Safari / Chrome 行為**

Playwright 可以測 Mobile Web 的功能，但如果你需要測「手機版 Safari 的系統行為」（Safari Reader Mode、Safari 的表單自動填入、iOS 的 Smart App Banner），Playwright 也覆蓋不到，需要在真機上手動測試。

---

## 我現在的工具分工

```
測試類型          工具              環境
────────────────────────────────────────────────
Web E2E          Playwright        CI（Headless）
Mobile Web       Playwright        CI（Headless）
iOS Native App   Appium            真機 + Simulator
Android Native   Appium            真機 + Emulator
API              pytest + requests  CI
Visual Regression Playwright        CI
```

**選工具的原則：**

1. 能用 Playwright 的就用 Playwright（速度快、CI 整合好、debug 容易）
2. 需要測原生 App 行為就用 Appium
3. 不要為了「一套工具」而強迫一個工具做它做不好的事

Playwright 官方文件指出，其平行執行與內建 Trace Viewer 讓 CI 上的除錯效率顯著高於傳統框架——這是它在 Web 測試這一層，成為默認選擇的核心理由。

---

## Playwright 的幾個 QA 常用功能

**Network Interception**

可以攔截並修改 API request/response，模擬各種後端行為：

```javascript
// 模擬 API 超時
await page.route('**/api/sessions/complete', route =>
  route.abort('timedout')
);

// 模擬伺服器錯誤
await page.route('**/api/sessions/complete', route =>
  route.fulfill({ status: 500, body: '{"error": "Internal Server Error"}' })
);
```

這讓你不需要後端支援就能測各種錯誤情境。

**Trace Viewer**

測試失敗的時候，Playwright 可以記錄完整的執行 trace，包含每個步驟的截圖、網路請求、console log：

```bash
# 開啟 trace 記錄
PLAYWRIGHT_TRACE=on npx playwright test

# 失敗後查看 trace
npx playwright show-trace trace.zip
```

這讓 CI 上的失敗比 Appium 更容易 debug——不需要在本地重現，直接看 trace。

---

## 結尾

Playwright 和 Appium 不是競爭關係，是不同場景的工具。把它們當成互補的選項，而不是「用哪個取代哪個」，才能讓兩個工具各自發揮最大價值。

我現在的工具選擇原則很簡單：先問「這個測試在 Playwright 裡能做到嗎？」，如果能做到，用 Playwright。如果需要真實的原生 App 行為，用 Appium。

不要因為「已經在用 Appium 了」就把所有東西都塞進 Appium，也不要因為「Playwright 比較潮」就強迫它做原生 App 的事。

---

## 參考資料

- [Playwright 官方文件](https://playwright.dev/docs/intro) — Playwright 完整文件，包含 Mobile emulation 設定
- [Playwright：Trace Viewer](https://playwright.dev/docs/trace-viewer-intro) — 測試失敗除錯工具，記錄完整執行軌跡
- [Appium 官方文件](https://appium.io/docs/en/latest/) — 原生 App 自動化測試框架
- [Stack Overflow Developer Survey 2024](https://survey.stackoverflow.co/2024/) — 最受歡迎的測試框架調查數據
- [Playwright：裝置模擬設定](https://playwright.dev/docs/emulation) — Mobile viewport、User-Agent 與 geolocation 模擬設定
