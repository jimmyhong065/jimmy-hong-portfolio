# App 自動化測試：用 pytest + Page Object Model 打造可維護的框架

> 定位：App 自動化的難點不在寫出一個測試，而在寫出改一次 UI 不會崩一片、半夜 CI 不會無故紅燈的框架。用 pytest 加 Page Object Model，從實際工作痛點出發。
> 教學哲學：假設讀者會基本 pytest，重心放在 POM 設計與工程化；code-heavy，每篇有可改用的範例；hook 開場、收尾「帶得走」。
> 視角：QA IC 講師。
> 狀態：草稿（本地）。一課一檔 `article-Dxx-*.md`。

## 課程定位

- **工程化是 App 自動化的真正門檻**：變數多（裝置、原生元件、非同步），所以更需要好框架。
- **POM 讓 UI 一改不崩一片**：把「測什麼」和「怎麼操作」分開。
- **穩定性決定信任**：flaky、等待、資料清理決定自動化能不能長期被信任。
- **報告、雲端、CI 讓自動化變團隊的回歸防線**。

## 與其他課的交叉（可選內鏈，不強綁）

| 本課 | 連到 | 分工 |
|---|---|---|
| 全課 | API 自動化課 | 姊妹篇：API 測下層、App 測上層，自動化金字塔分工 |
| D13 對抗 flaky | 既有文 appium-self-healing-framework | 本課講原則；該文是 self-healing 進階實作 |
| D16 CI | 既有文 appium-github-actions | 本課講策略；該文是完整 workflow |

## 課綱（16 課 / 4 模組）

### 模組 D1 · 起步與第一個測試

- **D01** 為什麼 App 自動化比 Web 難
- **D02** Appium 怎麼運作：架構、capabilities 與最小起步
- **D03** 寫出第一個 pytest + Appium 測試
- **D04** 元件定位策略：accessibility id 優先、少用 XPath
- **D05** 處理 WebView 與 hybrid app：context 切換

### 模組 D2 · POM 設計

- **D06** 為什麼要 POM：把「測什麼」和「怎麼操作」分開
- **D07** 設計一個 Page 物件：元素、動作、回傳下一頁
- **D08** BasePage 與共用行為
- **D09** POM 進階：Component 物件、流程串接、避免 god object

### 模組 D3 · 工程化與穩定性

- **D10** fixture 與 conftest：管好 driver 的生命週期
- **D11** 測試資料與參數化
- **D12** 等待策略：為什麼 sleep 是壞味道
- **D13** 對抗 flaky：穩定 locator、狀態清理、retry 與 quarantine

### 模組 D4 · 報告、雲端、CI

- **D14** 測試報告：接進 ReportPortal
- **D15** 雲端真機：BrowserStack／Sauce 類平台
- **D16** 接進 CI：讓 App 自動化變回歸防線
