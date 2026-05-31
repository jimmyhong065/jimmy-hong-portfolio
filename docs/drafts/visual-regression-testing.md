# Visual Regression Testing：截圖比對不是你想的那麼簡單

---

## 目錄

1. [那次「UI 沒有改」但 UI 確實壞了](#ui-沒改但壞了)
2. [截圖比對在解什麼問題](#在解什麼問題)
3. [為什麼 pixel-perfect 比對幾乎沒有用](#pixel-perfect-沒用)
4. [我現在怎麼用 Visual Testing](#怎麼用)
5. [哪些情境值得，哪些不值得](#哪些值得)
6. [結尾](#結尾)

---

## 那次「UI 沒有改」但 UI 確實壞了

那次 我們的 App 做了一個後端的效能優化，純粹改 DB query，前端程式碼一行沒動。

RD 說：「前端沒有改動，UI 不用測。」

我的直覺告訉我這個邏輯不對，還是跑了一遍主要畫面的確認。

結果：森林主頁的樹木排列在 iPhone SE（小螢幕）上亂掉了。

根本原因：後端回傳的樹木資料順序改變了，前端用固定的 grid 排列，樹木換了順序導致整個畫面的佈局位移。程式碼邏輯沒有改，但資料驅動的 UI 結果變了。

如果有 visual regression test，這個問題在 CI 就會被抓到。

---

## 截圖比對在解什麼問題

Visual regression testing 的核心概念：

1. 對某個 UI 狀態截一張「baseline」截圖（已知正確的狀態）
2. 每次 release 後對同樣的狀態截圖
3. 比較兩張截圖的差異
4. 差異超過閾值 → 標記為 regression，人工確認

這讓你能自動發現：
- 字體大小或顏色意外改變
- 元素位移或消失
- RWD 在特定螢幕尺寸下破版
- 第三方元件更新導致的外觀變化

這些問題在功能測試裡不會被抓到——功能是對的，UI 看起來壞了。

---

## 為什麼 pixel-perfect 比對幾乎沒有用

第一次嘗試 visual testing，我用的是最直接的做法：把截圖的每個 pixel 和 baseline 比對，任何不同就報錯。

結果：每次跑測試，大概有 30% 的截圖被標記為「差異」。

原因：

**字體渲染的差異**：同一個字，在不同的 iOS 版本、不同的螢幕密度，渲染結果有細微的 pixel 差距。Pixel-perfect 比對會把這個當成 regression。

**動畫的時機**：截圖的時機不同，動畫可能在不同的 frame，即使是同一個畫面也會有差異。

**日期和時間**：截圖裡如果有顯示時間（「2 分鐘前」、「今天 14:30」），下次截圖就不一樣了。

**動態資料**：用戶的樹木數量、硬幣顯示——這些每次測試帳號的狀態不同，截圖自然不同。

Pixel-perfect 比對產生大量 false positive，讓你花更多時間在確認「這是真的 regression 還是環境差異」，而不是在測試。

---

## 我現在怎麼用 Visual Testing

**工具選擇**

主流工具：
- **Percy**（BrowserStack）：CI 整合好，有智慧比對，自動忽略字體渲染差異
- **Applitools**：基於 AI 的視覺比對，誤報率低，但收費較貴
- **Playwright 內建截圖**：免費，但比對邏輯要自己調

我現在用 Playwright 的截圖 + 自訂的比對邏輯：

```javascript
// tests/visual/forest-homepage.spec.js
import { test, expect } from '@playwright/test';

test('forest homepage layout - iPhone 14', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/forest');
  await page.waitForSelector('[data-testid="tree-grid"]');

  // 遮蔽動態內容，避免 false positive
  await page.evaluate(() => {
    document.querySelectorAll('[data-testid="coin-count"]')
      .forEach(el => el.style.visibility = 'hidden');
    document.querySelectorAll('[data-testid="timer-display"]')
      .forEach(el => el.style.visibility = 'hidden');
  });

  await expect(page).toHaveScreenshot('forest-homepage-iphone14.png', {
    maxDiffPixelRatio: 0.02  // 允許 2% 的像素差異
  });
});
```

兩個關鍵設計：

**1. 遮蔽動態內容**：截圖前把會變動的元素（時間、計數、動態資料）隱藏，只測靜態的 UI 結構和樣式。

**2. 允許容忍閾值**：不是 pixel-perfect，允許 1–2% 的差異，過濾掉字體渲染的噪音。

---

## 哪些情境值得，哪些不值得

**值得做 visual regression 的：**

- 重要的固定版面：onboarding、訂閱購買頁、Pro 功能介紹
- 各裝置尺寸的 RWD：iPhone SE、iPhone 15 Pro Max、iPad
- 深色模式 / 淺色模式的切換
- 多語言版本的排版（中文、英文、日文字元寬度不同）

這些的共同點：UI 結構固定、改動不頻繁、出問題對用戶的視覺影響大。

**不值得做的：**

- 動畫過程中的截圖（時機不穩定）
- 包含用戶資料的個人化頁面（資料每次不同）
- 功能還在快速迭代的頁面（baseline 要一直更新，維護成本高）
- 探索性測試的範疇（視覺異常通常手動測試就能發現）

---

## 我們的 App 的實際覆蓋

我現在設定了 12 個固定的 visual snapshot：
- 森林主頁（空、有 3 棵樹、有 20 棵樹）× 2 個螢幕尺寸
- 計時進行中畫面
- 樹種選擇畫面（免費 vs Pro）
- 訂閱購買頁
- 深色模式下的主要畫面

這 12 個 snapshot 在每次 release 前自動跑，有差異就在 CI 標記，人工確認是 intentional change 還是意外的 regression。

---

## 結尾

Visual regression testing 最容易踩的坑是：期待它像功能測試一樣黑白分明。功能測試有對錯，視覺測試有「預期改動」和「意外改動」。

學會設定合理的容忍閾值、遮蔽動態內容、限制覆蓋範圍在真正有價值的頁面——這些決定比「用哪個工具」更重要。

那次樹木排列亂掉的問題，如果有 visual regression，CI 就會標記森林主頁的截圖差異。現在它在我的 snapshot 清單裡了。
