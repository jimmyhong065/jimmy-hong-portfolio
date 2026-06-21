# 新課設計：App 自動化測試 — 用 pytest + POM 打造可維護的框架

**Date:** 2026-06-21
**Status:** Approved outline, ready for implementation plan
**課程目錄:** `docs/course-app-pytest/`

## 定位

App 自動化的難點不在「寫得出一個測試」，而在「寫出改一次 UI 不會崩一片、半夜 CI 不會無故紅燈」的框架。
這門課用 pytest + Page Object Model，從實際工作會遇到的問題出發——定位、WebView、穩定性、資料、雲端真機、CI。
**假設讀者會基本 pytest**，重心放在 POM 設計與工程化（作者的差異化價值），不花篇幅在工具安裝教學。

## 教學哲學（與既有課一致）

- 每篇 hook 開場、有方法、有可改用的 pytest/Appium 範例、收尾「帶得走」。
- **code-heavy**：像 k6 課，每篇含可跑/可改的程式碼。
- 繁中全形標點（程式碼、inline code、URL 例外）。
- **不掛來源書名/作者**，當通用知識寫（內部參考骨架見文末，不入正文；POM、Page Object 等模式名可用，但不歸功個人）。
- QA IC 講師視角。全 draft（本地）。一課一檔 `article-Dxx-*.md`。

## 課綱（16 課 / 4 模組）

### 模組 D1 · 起步與第一個測試（5）

- **D01 為什麼 App 自動化比 Web 難**
  裝置/OS 碎片化、原生元件、非同步渲染、環境（emulator/真機/雲端）、啟動成本高——說清楚為什麼「工程化」在 App 自動化特別重要。
- **D02 Appium 怎麼運作 + 最小起步**
  client-server 架構：client 用 WebDriver 協定送命令，server 依 capabilities 路由到 UIAutomator2（Android）/ XCUITest（iOS）。介紹核心 capabilities，起一個最小 session。
- **D03 寫出第一個 pytest + Appium 測試**
  pytest 結構（test function、assert）、用 fixture 取得 driver、一個能跑的端到端測試。先求「會動」，後面再求「好維護」。
- **D04 元件定位策略：accessibility id 優先、少用 XPath**
  定位是 flaky 的最大源頭。優先序：accessibility id（跨平台、穩）> id > 其他；XPath 慢又脆、絕對路徑勿用。Android/iOS locator 可分開管理。
- **D05 處理 WebView 與 hybrid app：context 切換**
  hybrid app 有 `NATIVE_APP` 與 `WEBVIEW_{package}` 兩種 context。用 `driver.contexts` 列出、`driver.switch_to.context()` 切換；Android 靠 Chromedriver（版本要對）、iOS 靠 remote debugger（多 webview 有坑）。給切換的範例與常見錯誤。

### 模組 D2 · POM 設計（4，核心）

- **D06 為什麼要 POM：把「測什麼」和「怎麼操作」分開**
  Page Object 是封裝——把 UI 結構與操作細節藏在 page class 後面，測試只呼叫語意化的方法。UI 改了只改一個地方。沒有 POM 的測試為什麼會在 UI 一改就崩一片。
- **D07 設計一個 Page 物件**
  一個 page class 包含：元素 locator、語意化動作方法、動作後回傳「下一個 page 物件」。**斷言留在測試、不要放進 page object**（避免 page 過度複雜）。給一個登入頁範例。
- **D08 BasePage 與共用行為**
  把等待、捲動、context 切換、共用元件操作收進 `BasePage`，各 page 繼承。減少重複、集中維護點。
- **D09 POM 進階：Component 物件、Screen 流程、避免 god object**
  重複出現的區塊（導覽列、彈窗、卡片）抽成 Component 物件；多頁流程用 flow/screen 串接；page 太肥是壞味道——怎麼拆。

### 模組 D3 · 工程化與穩定性（4）

- **D10 fixture 與 conftest：driver 生命週期**
  `conftest.py` 放共用 fixture。function scope（每測試全新 session，隔離但慢）vs session scope（重用 driver，讀取型測試可省 60-70% 時間但要管狀態）。用 `yield` + `driver.quit()` 或 context manager 保證清理。
- **D11 測試資料與參數化**
  `@pytest.mark.parametrize` 一份腳本跑多組資料；資料外部化（JSON/YAML）；帳號池避免帳號互相干擾（呼應實際工作的多帳號併發）。
- **D12 等待策略：顯式 vs 隱式，為什麼 sleep 是壞味道**
  `time.sleep()` 是脆弱與緩慢的來源。用 `WebDriverWait` + expected conditions 做顯式等待；隱式等待的陷阱；把等待收進 BasePage。
- **D13 對抗 flaky：穩定 locator、狀態清理、retry 與 quarantine**
  flaky 的成因（時序、狀態殘留、locator 脆弱、環境）；retry 機制（pytest-rerunfailures）何時用、何時是遮蓋問題；quarantine 隔離不穩測試，別讓它擋 CI。

### 模組 D4 · 報告、雲端、CI（3）

- **D14 測試報告：接進 ReportPortal**
  把結果變成團隊看得到的即時儀表板。ReportPortal 的價值：即時結果、歷史趨勢、失敗自動分類、附截圖/log。pytest 接 RP 的方式、失敗時自動附截圖。
- **D15 雲端真機：BrowserStack / Sauce 類平台**
  本機真機/emulator 的維護成本 vs 雲端設備農場。用 capabilities 切換本機 ↔ 雲端，同一套 POM 兩邊都能跑；雲端的取捨（速度、成本、除錯）。
- **D16 接進 CI：GitHub Actions、self-hosted runner（收尾 QA in DevOps）**
  把自動化變成回歸防線：GitHub Actions 跑 Appium（Android emulator 要額外設定、iOS 建議 self-hosted Mac runner）。收尾談 QA 在 DevOps 中的角色——自動化測試是品質的安全網，不是取代人的判斷。

## 與既有內容交叉（內鏈，不重複）

| 本課 | 連到 | 分工 |
|---|---|---|
| 全課 | API 自動化課（course-api） | 姊妹篇：API 測下層、App 測上層，自動化金字塔分工 |
| D13 對抗 flaky | 既有文 appium-self-healing-framework | 本課講原則；該文是 self-healing 進階實作 |
| D16 CI | 既有文 appium-github-actions | 本課講策略；該文是完整 workflow |
| D02/D05 | 既有文 appium-pytest-integration、maestro-vs-appium | 工具細節與選型對照 |

## 內部參考骨架（不入正文，只當作者寫作依據）

| 模組 | 參考 |
|---|---|
| D1 | Appium client-server 架構、capabilities 路由 UIAutomator2/XCUITest；定位策略（accessibility id 跨平台優先、避免 XPath 絕對路徑）；hybrid/WebView context（NATIVE_APP / WEBVIEW_{package}、Chromedriver、iOS remote debugger 多 webview 坑） |
| D2 | Page Object＝封裝（Fowler）；斷言不放 page object；BasePage / Page Component Object |
| D3 | pytest fixture/conftest scope（function 隔離 vs session 重用省 60-70%）；`WebDriverWait` 顯式等待取代 `time.sleep()`；context manager 保證 quit；flaky/retry/quarantine |
| D4 | ReportPortal（即時 dashboard、失敗分類、附截圖）；BrowserStack/Sauce 雲端真機；GitHub Actions（Android emulator 需額外設定、iOS 用 self-hosted Mac runner）；Appium iOS simulator vs real device |

來源連結（供作者查證，不入正文）：
- https://martinfowler.com/bliki/PageObject.html
- https://www.selenium.dev/documentation/test_practices/encouraged/page_object_models/
- https://www.browserstack.com/guide/locators-in-appium
- https://appiumpro.com/editions/60-how-to-pick-the-right-locator-strategy
- https://appium.readthedocs.io/en/latest/en/writing-running-appium/web/hybrid/
- https://geekyants.com/blog/how-to-power-mobile-test-automation-with-appium--pytest
- https://www.browserstack.com/guide/appium-ios-simulator-vs-real-device-testing
- ReportPortal：專案已有 reportportal-qa skill，實作細節以該 skill / 既有 RP 用法為準

## 交付物

- `docs/course-app-pytest/README.md` — 定位、教學哲學、課綱、交叉表（對齊既有 course README 格式）。
- 16 篇 `docs/course-app-pytest/article-D01-*.md` … `article-D16-*.md`（檔名見下）。

檔名：
- D01 `article-D01-why-app-automation-hard.md`
- D02 `article-D02-appium-how-it-works.md`
- D03 `article-D03-first-pytest-appium-test.md`
- D04 `article-D04-locator-strategy.md`
- D05 `article-D05-webview-context.md`
- D06 `article-D06-why-pom.md`
- D07 `article-D07-design-a-page-object.md`
- D08 `article-D08-basepage.md`
- D09 `article-D09-pom-advanced.md`
- D10 `article-D10-fixtures-conftest.md`
- D11 `article-D11-test-data-parametrize.md`
- D12 `article-D12-wait-strategy.md`
- D13 `article-D13-fighting-flaky.md`
- D14 `article-D14-reportportal.md`
- D15 `article-D15-cloud-devices.md`
- D16 `article-D16-ci-github-actions.md`

每篇 frontmatter：`title`、`excerpt`、`tags`、`status: draft`。

## 不在本次範圍（follow-up）

- 上線到 Supabase / 設 published（沿用 seed-courses.mjs 流程；記得把 README 定位行寫純文字，避免 subtitle 帶 markdown）。
- 後台課程封面、章節封面。
- 跨課內鏈的實際 URL。
