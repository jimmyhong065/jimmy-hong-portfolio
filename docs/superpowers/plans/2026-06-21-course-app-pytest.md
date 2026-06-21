# App 自動化(pytest+POM)課 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write a 16-chapter code-heavy QA course (`docs/course-app-pytest/`) on App automation with pytest + Page Object Model — plus a README — all as local drafts matching the existing course style.

**Architecture:** Each chapter is one markdown file with frontmatter (`title`/`excerpt`/`tags`/`status: draft`), a hook opening, 2-4 `##` method sections each with a runnable/adaptable pytest+Appium code block, and a `## 帶得走` recap. Grounded in an internal reference skeleton (Appium architecture, locator strategy, hybrid/WebView contexts, POM/Fowler, pytest fixtures, ReportPortal, cloud devices, CI) but written as general knowledge — **no source author name-drop**.

**Tech Stack:** Markdown with Python (pytest + Appium-Python-Client) code blocks. Local preview via `node scripts/preview-course.mjs docs/course-app-pytest` → `_preview.html`.

---

## Conventions (apply to EVERY article task)

Mechanical "tests" each article must pass — every article task repeats them as steps.

1. **Frontmatter** — exactly these keys, in order:
   ```
   ---
   title: <課名>
   excerpt: <50-120 字，講這課解決什麼，不劇透清單>
   tags: [<3-4 個標籤>]
   status: draft
   ---
   ```
2. **Body shape** — `# H1` (same as title), hook opening, 2-4 `##` sections, `## 帶得走` recap (3-4 bullets).
3. **Code-heavy** — every method section that introduces a technique includes a Python code block (```python). Code uses Appium-Python-Client idioms (`webdriver.Remote`, `UiAutomator2Options`/`XCUITestOptions`, `AppiumBy`, `WebDriverWait`). Code may be illustrative but must be syntactically plausible and idiomatic, not pseudocode.
4. **繁中全形標點** — prose uses 全形 `，。：「」（）`; exception: code, inline code, URLs, frontmatter.
5. **No source name-drop** — never write author/book names (no "Fowler", "Martin Fowler", etc.). Pattern names (Page Object Model, POM, Component Object) are fine as standard terminology.
6. **Length** — aim 50-75 lines markdown (code-heavy runs longer than prose courses).
7. **Voice** — QA IC 講師；hook 開場；從實際工作痛點切入；不寫成乾 tips 清單.

Style references to read before writing:
- `docs/course-bughunt/article-A01-reverse-thinking.md` (voice/shape)
- `docs/course-k6/article-K06-engineering.md` (code-heavy formatting)

ReportPortal note (Task 15 / D14): the repo has a `reportportal-qa` skill describing the project's actual ReportPortal usage. The writer should keep D14 consistent with pytest + ReportPortal (`pytest-reportportal` agent, `rp_*` ini config, attach screenshot on failure) rather than inventing API.

---

## Task 1: 課程 README

**Files:** Create `docs/course-app-pytest/README.md`

- [ ] **Step 1: Write the README**

Match `docs/course-comm/README.md` format: `#` title, `>` blockquote (定位/教學哲學/視角/狀態), 課程定位 section, 與其他課的交叉 table, then 課綱 (16 課 / 4 模組).

- Title: `# App 自動化測試：用 pytest + Page Object Model 打造可維護的框架`
- 定位 blockquote: App 自動化的難點不在寫出一個測試，而在寫出改一次 UI 不會崩一片、半夜 CI 不會無故紅燈的框架；用 pytest + POM，從實際工作痛點出發；假設讀者會基本 pytest，重心在 POM 設計與工程化；code-heavy；草稿（本地），一課一檔。
- 課程定位 bullets: 工程化是 App 自動化的真正門檻；POM 讓 UI 一改不崩一片；穩定性（flaky/等待/資料）決定自動化能不能長期信任；報告/雲端/CI 讓自動化變團隊的回歸防線。
- 交叉 table (本課 | 連到 | 分工):
  - 全課 | API 自動化課 | 姊妹篇：API 測下層、App 測上層，自動化金字塔分工
  - D13 對抗 flaky | 既有文 appium-self-healing-framework | 本課講原則；該文是 self-healing 進階實作
  - D16 CI | 既有文 appium-github-actions | 本課講策略；該文是完整 workflow
- 課綱: 16 chapters under 4 modules using the titles from Tasks 2-17.

**重要**：README 的 `> 定位：` 行**只能用純文字**，不可含 markdown（`` ` ``、`**`）——seed 會把定位行抓成課程 subtitle，markdown 會渲染成原始碼。

- [ ] **Step 2: Verify** — no frontmatter (matches other course READMEs); 全形標點; 定位行純文字無 markdown; no name-drop.

- [ ] **Step 3: Commit**

```bash
git add docs/course-app-pytest/README.md
git commit -m "docs(course-app-pytest): 課程 README 與課綱"
```

---

## Task 2: D01 為什麼 App 自動化比 Web 難

**Files:** Create `docs/course-app-pytest/article-D01-why-app-automation-hard.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: 為什麼 App 自動化比 Web 難
excerpt: 同樣是自動化，App 比 Web 多了一堆變數：裝置碎片化、原生元件、非同步渲染、環境難搞、啟動成本高。這篇講清楚這些難點，也說明為什麼「工程化」在 App 自動化特別重要。
tags: [App 自動化, Appium, 測試策略, QA 實戰]
status: draft
---
```

Required `##` sections (prose + at least one illustrative snippet or comparison where natural):
- **裝置與 OS 碎片化**：Android 機型/版本爆炸、iOS 相對收斂但有自己的坑；同一支測試要在多組裝置上穩定。
- **原生元件與非同步渲染**：不像 Web 有穩定 DOM，原生元件渲染時機難掌握，畫面還沒好就找元件＝flaky。
- **環境難搞、啟動成本高**：emulator/真機/雲端各有狀況；起一個 session 比開瀏覽器慢得多，這決定了 fixture 設計。
- **所以要工程化**：正因為變數多，App 自動化更需要 POM、穩定的等待、好的 fixture——這就是這門課的主軸。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — frontmatter; 全形標點; `## 帶得走`; no name-drop; 50-75 lines.

- [ ] **Step 3: Commit**

```bash
git add docs/course-app-pytest/article-D01-why-app-automation-hard.md
git commit -m "docs(course-app-pytest): D01 為什麼 App 自動化比 Web 難"
```

---

## Task 3: D02 Appium 怎麼運作 + 最小起步

**Files:** Create `docs/course-app-pytest/article-D02-appium-how-it-works.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: Appium 怎麼運作：架構、capabilities 與最小起步
excerpt: 在寫測試前，先搞懂 Appium 在做什麼。這篇講 client-server 架構、capabilities 怎麼決定要驅動 Android 還是 iOS，並用最少的程式碼起一個能連上裝置的 session。
tags: [Appium, capabilities, App 自動化, QA 實戰]
status: draft
---
```

Required `##` sections (code-heavy):
- **client-server 架構**：你的 pytest 是 client，用 WebDriver 協定（HTTP）把命令送給 Appium server；server 依 capabilities 路由到 UIAutomator2（Android）/ XCUITest（iOS）。
- **capabilities 是什麼**：講關鍵 caps（platformName、automationName、deviceName、app/appPackage+appActivity、udid）。給一段 Android capabilities 範例：
  ```python
  from appium import webdriver
  from appium.options.android import UiAutomator2Options

  options = UiAutomator2Options()
  options.platform_name = "Android"
  options.device_name = "emulator-5554"
  options.app_package = "com.example.app"
  options.app_activity = ".MainActivity"

  driver = webdriver.Remote("http://127.0.0.1:4723", options=options)
  ```
- **最小起步**：起 session、做一個動作、`driver.quit()`。強調 session 一定要關（後面 fixture 會處理）。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions; must contain a real capabilities code block.

- [ ] **Step 3: Commit**

```bash
git add docs/course-app-pytest/article-D02-appium-how-it-works.md
git commit -m "docs(course-app-pytest): D02 Appium 怎麼運作"
```

---

## Task 4: D03 第一個 pytest + Appium 測試

**Files:** Create `docs/course-app-pytest/article-D03-first-pytest-appium-test.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: 寫出第一個 pytest + Appium 測試
excerpt: 把架構知識變成一個能跑的測試。這篇用 pytest 的結構寫第一個端到端 App 測試——driver 用 fixture 取得、動作後用 assert 驗證。先求會動，後面再求好維護。
tags: [pytest, Appium, App 自動化, QA 實戰]
status: draft
---
```

Required `##` sections (code-heavy):
- **pytest 的最小結構**：test function、`assert`、用 fixture 注入 driver。給一個簡單 `conftest.py` driver fixture（function scope、`yield` + `quit`）：
  ```python
  import pytest
  from appium import webdriver
  from appium.options.android import UiAutomator2Options

  @pytest.fixture
  def driver():
      options = UiAutomator2Options()
      options.platform_name = "Android"
      options.device_name = "emulator-5554"
      options.app_package = "com.example.app"
      options.app_activity = ".MainActivity"
      drv = webdriver.Remote("http://127.0.0.1:4723", options=options)
      yield drv
      drv.quit()
  ```
- **第一個測試**：用 `AppiumBy` 找元件、點擊、驗證結果：
  ```python
  from appium.webdriver.common.appiumby import AppiumBy

  def test_login_shows_home(driver):
      driver.find_element(AppiumBy.ACCESSIBILITY_ID, "username").send_keys("demo")
      driver.find_element(AppiumBy.ACCESSIBILITY_ID, "login_btn").click()
      assert driver.find_element(AppiumBy.ACCESSIBILITY_ID, "home_title").is_displayed()
  ```
- **為什麼這樣還不夠**：locator 散在測試裡、沒有等待——預告後面的定位策略、等待、POM。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions; contains conftest fixture + test code.

- [ ] **Step 3: Commit**

```bash
git add docs/course-app-pytest/article-D03-first-pytest-appium-test.md
git commit -m "docs(course-app-pytest): D03 第一個 pytest+Appium 測試"
```

---

## Task 5: D04 元件定位策略

**Files:** Create `docs/course-app-pytest/article-D04-locator-strategy.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: 元件定位策略：accessibility id 優先、少用 XPath
excerpt: 定位是 App 自動化 flaky 的最大源頭。這篇講定位策略的優先序——為什麼 accessibility id 最穩、為什麼 XPath 又慢又脆，以及 Android/iOS locator 怎麼分開管理。
tags: [Appium, 元件定位, flaky, QA 實戰]
status: draft
---
```

Required `##` sections (code-heavy):
- **定位優先序**：accessibility id（跨平台、穩、語意化）> id/resource-id > 其他；附 `AppiumBy` 各種策略的程式碼對照。
- **為什麼少用 XPath**：XPath 在行動裝置上慢（要遍歷整棵 UI tree）、絕對路徑一改 UI 就斷；只在沒別招時用相對 XPath。給好 vs 壞 locator 對照。
- **Android/iOS 分開管理**：跨平台 app 同一語意元件兩平台 id 可能不同；示範用 dict 或平台條件選 locator：
  ```python
  LOGIN_BTN = {
      "android": (AppiumBy.ACCESSIBILITY_ID, "login_btn"),
      "ios": (AppiumBy.ACCESSIBILITY_ID, "loginButton"),
  }
  ```
- **跟開發要 accessibility id**：最穩的定位來自開發在元件上標好 id——這是 QA 可以推動的事（呼應 shift-left）。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions; locator code present.

- [ ] **Step 3: Commit**

```bash
git add docs/course-app-pytest/article-D04-locator-strategy.md
git commit -m "docs(course-app-pytest): D04 元件定位策略"
```

---

## Task 6: D05 WebView 與 hybrid app context 切換

**Files:** Create `docs/course-app-pytest/article-D05-webview-context.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: 處理 WebView 與 hybrid app：context 切換
excerpt: Hybrid app 一半是原生、一半是網頁，測試卡在「找不到網頁裡的元件」幾乎都是 context 沒切。這篇講 NATIVE_APP 與 WEBVIEW 兩種 context 怎麼切、Android 與 iOS 的差異與常見坑。
tags: [Appium, WebView, hybrid app, QA 實戰]
status: draft
---
```

Required `##` sections (code-heavy):
- **為什麼找不到元件**：hybrid app 有原生層與 WebView 層；預設在 `NATIVE_APP` context，網頁元件要切到 WebView 才看得到。
- **列出與切換 context**：
  ```python
  # 列出目前可用的 context
  contexts = driver.contexts  # ['NATIVE_APP', 'WEBVIEW_com.example.app']

  # 切到 WebView
  webview = next(c for c in contexts if c.startswith("WEBVIEW"))
  driver.switch_to.context(webview)

  # 在 WebView 裡用 Web 的定位方式（CSS/XPath）
  driver.find_element(AppiumBy.CSS_SELECTOR, "#submit").click()

  # 切回原生
  driver.switch_to.context("NATIVE_APP")
  ```
- **Android vs iOS 的差異與坑**：Android 靠 Chromedriver（版本要對上 WebView 的 Chrome 版本，不然連不上）；iOS 靠 remote debugger，多個 WebView 時要挑對的；切換有時要等 WebView 出現（配合等待）。
- **包進 BasePage**：context 切換是重複行為，預告後面收進 BasePage 的 helper（如 `with self.in_webview():`）。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions; context-switch code present.

- [ ] **Step 3: Commit**

```bash
git add docs/course-app-pytest/article-D05-webview-context.md
git commit -m "docs(course-app-pytest): D05 WebView context 切換"
```

---

## Task 7: D06 為什麼要 POM

**Files:** Create `docs/course-app-pytest/article-D06-why-pom.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: 為什麼要 POM：把「測什麼」和「怎麼操作」分開
excerpt: 沒有 POM 的測試，UI 一改就崩一片——因為 locator 和操作散落在每個測試裡。Page Object Model 把 UI 細節封裝起來，測試只呼叫語意化的方法。這篇講為什麼這個分離值得。
tags: [Page Object Model, POM, 測試架構, QA 實戰]
status: draft
---
```

Required `##` sections (code-heavy, contrast-driven):
- **沒有 POM 的痛**：locator 重複散在多個測試；一個按鈕改 id，要改十個檔案。給一段「壞」的測試（locator 寫死在測試裡）。
- **POM 是封裝**：page class 藏住 UI 結構與操作，測試只呼叫 `login_page.login("demo", "pw")`。給同一情境的「好」版本對照。
- **好處**：UI 改只改一處、測試讀起來像業務語言、locator 集中維護。
- **一個原則**：斷言留在測試、不放進 page object（page 負責「怎麼操作」，測試負責「驗什麼」）。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions; bad-vs-good code contrast present.

- [ ] **Step 3: Commit**

```bash
git add docs/course-app-pytest/article-D06-why-pom.md
git commit -m "docs(course-app-pytest): D06 為什麼要 POM"
```

---

## Task 8: D07 設計一個 Page 物件

**Files:** Create `docs/course-app-pytest/article-D07-design-a-page-object.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: 設計一個 Page 物件：元素、動作、回傳下一頁
excerpt: 一個好的 page 物件包含三樣東西：元素 locator、語意化的動作方法、動作後回傳下一個 page。這篇用一個登入頁示範怎麼設計，並守住「斷言不進 page」的原則。
tags: [Page Object Model, POM, 測試架構, QA 實戰]
status: draft
---
```

Required `##` sections (code-heavy):
- **page 物件的三個組成**：locator（class 常數）、動作方法（語意化）、回傳下一個 page 物件。
- **登入頁範例**：
  ```python
  from appium.webdriver.common.appiumby import AppiumBy

  class LoginPage:
      USERNAME = (AppiumBy.ACCESSIBILITY_ID, "username")
      PASSWORD = (AppiumBy.ACCESSIBILITY_ID, "password")
      LOGIN_BTN = (AppiumBy.ACCESSIBILITY_ID, "login_btn")

      def __init__(self, driver):
          self.driver = driver

      def login(self, user, pw):
          self.driver.find_element(*self.USERNAME).send_keys(user)
          self.driver.find_element(*self.PASSWORD).send_keys(pw)
          self.driver.find_element(*self.LOGIN_BTN).click()
          return HomePage(self.driver)   # 回傳下一頁
  ```
- **動作回傳下一頁**：讓測試能串成流程（`home = LoginPage(driver).login(...)`）。
- **測試怎麼用**：測試只做 assert，不碰 locator。給對應測試片段。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions; page class code present.

- [ ] **Step 3: Commit**

```bash
git add docs/course-app-pytest/article-D07-design-a-page-object.md
git commit -m "docs(course-app-pytest): D07 設計一個 Page 物件"
```

---

## Task 9: D08 BasePage 與共用行為

**Files:** Create `docs/course-app-pytest/article-D08-basepage.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: BasePage 與共用行為：把重複收進一個地方
excerpt: 每個 page 都要等待、捲動、切 context——這些不該複製貼上。把共用行為收進 BasePage，各 page 繼承它。這篇示範 BasePage 怎麼設計，讓維護點集中。
tags: [Page Object Model, BasePage, 測試架構, QA 實戰]
status: draft
---
```

Required `##` sections (code-heavy):
- **哪些行為該共用**：顯式等待後再操作、捲動找元件、context 切換、取得文字。
- **BasePage 範例**：
  ```python
  from selenium.webdriver.support.ui import WebDriverWait
  from selenium.webdriver.support import expected_conditions as EC

  class BasePage:
      def __init__(self, driver, timeout=10):
          self.driver = driver
          self.wait = WebDriverWait(driver, timeout)

      def tap(self, locator):
          self.wait.until(EC.element_to_be_clickable(locator)).click()

      def type(self, locator, text):
          self.wait.until(EC.visibility_of_element_located(locator)).send_keys(text)

      def text_of(self, locator):
          return self.wait.until(EC.visibility_of_element_located(locator)).text
  ```
- **page 繼承 BasePage**：把 D07 的 LoginPage 改成繼承 BasePage、用 `self.tap/self.type`，少掉重複的 find_element + 等待。
- **集中維護的價值**：等待邏輯改一次全部生效。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions; BasePage code present.

- [ ] **Step 3: Commit**

```bash
git add docs/course-app-pytest/article-D08-basepage.md
git commit -m "docs(course-app-pytest): D08 BasePage 與共用行為"
```

---

## Task 10: D09 POM 進階

**Files:** Create `docs/course-app-pytest/article-D09-pom-advanced.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: POM 進階：Component 物件、流程串接、避免 god object
excerpt: page 物件寫久了會變肥——一個 page 塞滿整個畫面的所有操作。這篇講怎麼用 Component 物件拆出重複區塊、用流程物件串多頁，並認得「page 太肥」這個壞味道。
tags: [Page Object Model, Component, 測試架構, QA 實戰]
status: draft
---
```

Required `##` sections (code-heavy):
- **Component 物件**：導覽列、彈窗、卡片這種跨頁重複的區塊，抽成獨立 component，被 page 組合：
  ```python
  class NavBar(BasePage):
      HOME_TAB = (AppiumBy.ACCESSIBILITY_ID, "tab_home")
      PROFILE_TAB = (AppiumBy.ACCESSIBILITY_ID, "tab_profile")

      def go_profile(self):
          self.tap(self.PROFILE_TAB)
          return ProfilePage(self.driver)

  class HomePage(BasePage):
      def __init__(self, driver):
          super().__init__(driver)
          self.nav = NavBar(driver)   # 組合 component
  ```
- **多頁流程串接**：動作回傳下一頁，測試讀起來像一條業務流程。
- **避免 god object**：一個 page 方法爆多就是壞味道；按職責拆 page/component。
- **怎麼判斷該拆**：重複出現、職責太多、改一個地方影響太廣。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions; component code present.

- [ ] **Step 3: Commit**

```bash
git add docs/course-app-pytest/article-D09-pom-advanced.md
git commit -m "docs(course-app-pytest): D09 POM 進階"
```

---

## Task 11: D10 fixture 與 conftest

**Files:** Create `docs/course-app-pytest/article-D10-fixtures-conftest.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: fixture 與 conftest：管好 driver 的生命週期
excerpt: driver 怎麼開、怎麼關、要不要每個測試都重開，是 App 自動化速度與穩定的關鍵。這篇講 conftest 共用 fixture、function scope 與 session scope 的取捨，以及怎麼保證 session 一定被關掉。
tags: [pytest, fixture, conftest, QA 實戰]
status: draft
---
```

Required `##` sections (code-heavy):
- **conftest.py 放共用 fixture**：driver fixture 放 conftest，全專案測試共用。
- **function vs session scope**：function（每測試全新 session，隔離乾淨但慢）vs session（重用 driver，讀取型測試可省 60-70% 時間，但要管狀態殘留）。給兩種 scope 的程式碼，講何時用哪個。
  ```python
  @pytest.fixture(scope="session")
  def driver():
      drv = make_driver()
      yield drv
      drv.quit()
  ```
- **保證清理**：`yield` 後一定 `quit()`；即使測試失敗也會執行；或用 context manager。
- **疊 fixture**：用 driver fixture 再疊一個 logged-in fixture（登入狀態重用），減少重複登入。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions; scope code present.

- [ ] **Step 3: Commit**

```bash
git add docs/course-app-pytest/article-D10-fixtures-conftest.md
git commit -m "docs(course-app-pytest): D10 fixture 與 conftest"
```

---

## Task 12: D11 測試資料與參數化

**Files:** Create `docs/course-app-pytest/article-D11-test-data-parametrize.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: 測試資料與參數化：一份腳本跑多組資料
excerpt: 同一個流程要測十組輸入，不該複製十次測試。這篇講用 pytest parametrize 把資料和腳本分開、把測試資料外部化，以及用帳號池避免併發時帳號互相干擾。
tags: [pytest, parametrize, 測試資料, QA 實戰]
status: draft
---
```

Required `##` sections (code-heavy):
- **parametrize 基礎**：
  ```python
  import pytest

  @pytest.mark.parametrize("user, pw, expected", [
      ("demo", "correct", "home_title"),
      ("demo", "wrong", "error_msg"),
      ("", "", "error_msg"),
  ])
  def test_login(driver, user, pw, expected):
      home = LoginPage(driver).login(user, pw)
      assert driver.find_element(AppiumBy.ACCESSIBILITY_ID, expected).is_displayed()
  ```
- **資料外部化**：把測試資料放 JSON/YAML，腳本讀進來——資料變更不用改程式。
- **帳號池**：併發跑測試時，多測試共用一個帳號會互相干擾；用帳號池（每個 worker 拿不同帳號）。呼應實際工作的多帳號併發。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions; parametrize code present.

- [ ] **Step 3: Commit**

```bash
git add docs/course-app-pytest/article-D11-test-data-parametrize.md
git commit -m "docs(course-app-pytest): D11 測試資料與參數化"
```

---

## Task 13: D12 等待策略

**Files:** Create `docs/course-app-pytest/article-D12-wait-strategy.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: 等待策略：為什麼 sleep 是壞味道
excerpt: time.sleep 是 App 自動化最常見、也最該戒掉的壞習慣——它要嘛太短不穩、要嘛太長浪費。這篇講顯式等待怎麼取代 sleep、隱式等待的陷阱，以及怎麼把等待收進 BasePage。
tags: [pytest, 顯式等待, flaky, QA 實戰]
status: draft
---
```

Required `##` sections (code-heavy):
- **為什麼 sleep 壞**：固定 sleep 要嘛賭太短（畫面還沒好＝flaky）、要嘛賭太長（每次都白等）。
- **顯式等待**：用 `WebDriverWait` + `expected_conditions` 等到「條件成立」才繼續：
  ```python
  from selenium.webdriver.support.ui import WebDriverWait
  from selenium.webdriver.support import expected_conditions as EC

  WebDriverWait(driver, 10).until(
      EC.visibility_of_element_located((AppiumBy.ACCESSIBILITY_ID, "home_title"))
  )
  ```
- **隱式等待的陷阱**：implicit wait 全域生效、跟顯式等待混用會疊加出奇怪的 timeout；建議統一用顯式。
- **收進 BasePage**：等待不該散在測試裡，集中在 BasePage 的 helper（接回 D08）。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions; WebDriverWait code present.

- [ ] **Step 3: Commit**

```bash
git add docs/course-app-pytest/article-D12-wait-strategy.md
git commit -m "docs(course-app-pytest): D12 等待策略"
```

---

## Task 14: D13 對抗 flaky

**Files:** Create `docs/course-app-pytest/article-D13-fighting-flaky.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: 對抗 flaky：穩定 locator、狀態清理、retry 與 quarantine
excerpt: flaky 測試比沒有測試更糟——它讓團隊不再相信紅燈。這篇講 flaky 的成因、怎麼用穩定 locator 和狀態清理治本，以及 retry 與 quarantine 該怎麼用而不是拿來遮蓋問題。
tags: [flaky, 測試穩定性, pytest, QA 實戰]
status: draft
---
```

Required `##` sections (code-heavy):
- **flaky 的成因**：時序（沒等待）、狀態殘留（前一個測試留下資料）、locator 脆弱、環境（裝置/網路）。
- **治本**：穩定 locator（接 D04）、顯式等待（接 D12）、每個測試前後清乾淨狀態（fixture 做 setup/teardown 清資料）。
- **retry 何時用**：`pytest-rerunfailures` 自動重跑——對「真隨機」的外部不穩有用，但**不該拿來遮蓋真 bug**；retry 次數要記錄、持續 flaky 的要查。
  ```bash
  pytest --reruns 2 --reruns-delay 1
  ```
- **quarantine**：把已知不穩的測試隔離（mark）出主 CI gate，別讓它擋住別人，同時排程修。
  ```python
  @pytest.mark.flaky_quarantine
  def test_known_unstable(driver):
      ...
  ```

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions; retry/quarantine code present.

- [ ] **Step 3: Commit**

```bash
git add docs/course-app-pytest/article-D13-fighting-flaky.md
git commit -m "docs(course-app-pytest): D13 對抗 flaky"
```

---

## Task 15: D14 測試報告 ReportPortal

**Files:** Create `docs/course-app-pytest/article-D14-reportportal.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: 測試報告：接進 ReportPortal，把結果變團隊看得到的儀表板
excerpt: 終端機的 pass/fail 只有你看得到。接進 ReportPortal，測試結果變成即時儀表板——歷史趨勢、失敗自動分類、附截圖與 log。這篇講 pytest 怎麼接 ReportPortal，以及失敗時自動附截圖。
tags: [ReportPortal, 測試報告, pytest, QA 實戰]
status: draft
---
```

Required `##` sections (code-heavy). Keep consistent with the repo's `reportportal-qa` skill / real RP usage:
- **為什麼要 ReportPortal**：即時結果、歷史趨勢、失敗自動分類（把同類失敗歸群）、附截圖與 log，讓團隊看得到品質狀態。
- **pytest 接 RP**：用 `pytest-reportportal`，在 `pytest.ini`/`pytest.addopts` 設 `rp_endpoint`、`rp_project`、`rp_api_key`、`rp_launch`，跑測試時 `--reportportal`：
  ```ini
  [pytest]
  rp_endpoint = https://reportportal.example.com
  rp_project = mobile_qa
  rp_launch = App 回歸
  ```
- **失敗自動附截圖**：在 conftest 用 `pytest_runtest_makereport` hook，測試失敗時截圖並附到 RP：
  ```python
  import pytest

  @pytest.hookimpl(hookwrapper=True)
  def pytest_runtest_makereport(item, call):
      outcome = yield
      report = outcome.get_result()
      if report.when == "call" and report.failed:
          driver = item.funcargs.get("driver")
          if driver:
              png = driver.get_screenshot_as_png()
              # 附到 ReportPortal（透過 logging + rp handler）
  ```
- **怎麼讀 RP**：把失敗分類成 product bug / automation bug / 環境問題——這直接接到後面 CI 的決策。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions; RP config + screenshot hook code present; uses ReportPortal (NOT Allure).

- [ ] **Step 3: Commit**

```bash
git add docs/course-app-pytest/article-D14-reportportal.md
git commit -m "docs(course-app-pytest): D14 ReportPortal 測試報告"
```

---

## Task 16: D15 雲端真機

**Files:** Create `docs/course-app-pytest/article-D15-cloud-devices.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: 雲端真機：本機維護不完的設備，交給設備農場
excerpt: 自己維護一櫃真機很快會失控——充電、更新、連線、機型不夠。雲端設備農場用 capabilities 就能換到上百種機型。這篇講本機 vs 雲端的取捨，以及同一套 POM 怎麼兩邊都能跑。
tags: [BrowserStack, 雲端測試, Appium, QA 實戰]
status: draft
---
```

Required `##` sections (code-heavy):
- **本機真機的維護地獄**：充電、OS 更新、USB 連線、機型覆蓋不足——規模一大就失控。
- **雲端設備農場**：BrowserStack/Sauce 類平台，用 capabilities 指定機型，測試跑在雲端真機上。給切換 capabilities 的範例（本機 endpoint ↔ 雲端 endpoint + 雲端專屬 caps）：
  ```python
  if os.getenv("USE_CLOUD"):
      options.set_capability("bstack:options", {
          "deviceName": "Samsung Galaxy S23",
          "osVersion": "13.0",
          "userName": os.environ["BS_USER"],
          "accessKey": os.environ["BS_KEY"],
      })
      endpoint = "https://hub.browserstack.com/wd/hub"
  else:
      endpoint = "http://127.0.0.1:4723"
  ```
- **同一套 POM 兩邊跑**：POM 與測試不變，只換 driver 來源（接回 fixture 設計）。
- **取捨**：雲端省維護、機型多，但較慢、有成本、遠端除錯較麻煩；怎麼分配本機（開發時）vs 雲端（CI 全機型回歸）。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions; cloud capability switch code present.

- [ ] **Step 3: Commit**

```bash
git add docs/course-app-pytest/article-D15-cloud-devices.md
git commit -m "docs(course-app-pytest): D15 雲端真機"
```

---

## Task 17: D16 接進 CI（收尾）

**Files:** Create `docs/course-app-pytest/article-D16-ci-github-actions.md`

- [ ] **Step 1: Write the article**

Frontmatter:
```
---
title: 接進 CI：讓 App 自動化變回歸防線
excerpt: 自動化測試的價值，在能擋住合併前的回歸。這篇講把 pytest+Appium 接進 GitHub Actions 的策略——Android emulator 與 iOS self-hosted runner 的差異，並收尾談 QA 在 DevOps 中的角色。
tags: [CI, GitHub Actions, DevOps, QA 實戰]
status: draft
---
```

Required `##` sections (code-heavy). This is the final chapter — wrap up the whole course at the end.
- **CI 的目標**：把自動化變回歸防線——push/PR 觸發、跑測試、報告進 ReportPortal、不達標擋合併。
- **GitHub Actions 跑 Appium 的現實**：Android emulator 在 GitHub-hosted runner 要額外設定（如 reactivecircus/android-emulator-runner）；iOS 在 hosted runner 不理想，建議 self-hosted Mac runner 或接雲端設備農場。給一段 Android workflow 骨架（YAML）：
  ```yaml
  jobs:
    android-tests:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: reactivecircus/android-emulator-runner@v2
          with:
            api-level: 31
            script: pytest --reportportal
  ```
- **策略：哪些測試進 CI**：冒煙進每次 PR、完整回歸排程跑（夜間/雲端全機型）；flaky quarantine 不擋 gate（接 D13）。
- **收尾：QA 在 DevOps 的角色**：自動化是品質的安全網，不是取代人的判斷；QA 在 DevOps 裡的價值是設計這張網、讀懂它的訊號、推動可測性。一句話收束整門課（從第一個測試 → 可維護的框架 → 團隊的回歸防線）。

End with `## 帶得走`.

- [ ] **Step 2: Mechanical checks** — as conventions; CI workflow code present; wrap-up in 帶得走.

- [ ] **Step 3: Commit**

```bash
git add docs/course-app-pytest/article-D16-ci-github-actions.md
git commit -m "docs(course-app-pytest): D16 接進 CI（收尾）"
```

---

## Task 18: 預覽與整課驗收

**Files:** Read-only check of `docs/course-app-pytest/`

- [ ] **Step 1: Generate the preview**

Run: `node scripts/preview-course.mjs docs/course-app-pytest`
Expected: produces `_preview.html` with 17 篇（README + 16 章）, correct titles in sidebar, no parse errors.

- [ ] **Step 2: Cross-article consistency check**

Confirm across all 16 articles:
- All have frontmatter `title`/`excerpt`/`tags`/`status: draft`.
- All end with `## 帶得走`.
- Each technique-introducing section has a ```python (or ```yaml/```ini/```bash) code block.
- 全形標點 in prose.
- No author name-drop. Run: `grep -rliE "fowler|martin fowler|圖解" docs/course-app-pytest/ || echo "clean: no name-drops"` → expect clean.
- D14 uses ReportPortal, not Allure. Run: `grep -rli "allure" docs/course-app-pytest/ && echo "WARN: Allure mentioned" || echo "clean: no Allure"` → expect clean.
- README 課綱 titles match the 16 article `title:` lines; README 定位行純文字無 markdown.

- [ ] **Step 3: Final commit (if fixes made)**

```bash
git add docs/course-app-pytest/
git commit -m "docs(course-app-pytest): 整課一致性修正"
```

(If no fixes needed, skip — `_preview.html` is gitignored.)

---

## Notes / Out of Scope (follow-up)

- 上線到 Supabase / 設 `published`（沿用 seed-courses.mjs；README 定位行純文字；display_order 在 ORDER map 加 'course-app-pytest'）。
- 後台課程封面、章節封面。
- 跨課內鏈實際 URL。
