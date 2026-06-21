---
title: BasePage 與共用行為：把重複收進一個地方
excerpt: 每個 page 都要等待、捲動、切 context——這些不該複製貼上。把共用行為收進 BasePage，各 page 繼承它。這篇示範 BasePage 怎麼設計，讓維護點集中。
tags: [Page Object Model, BasePage, 測試架構, QA 實戰]
status: draft
---

# BasePage 與共用行為：把重複收進一個地方

你有十個 page 物件，每個都寫了一模一樣的 `WebDriverWait(self.driver, 10).until(...)`。有一天 timeout 要從 10 秒改成 15 秒，你一口氣要改十個地方——這就是沒有 BasePage 的代價。

## 哪些行為該共用

不是每件事都要放進 BasePage，只有「每個 page 都要做」的才算。常見的有：

- **顯式等待後再操作**：`click()` 前先等 `element_to_be_clickable`、`send_keys()` 前先等 `visibility_of_element_located`，幾乎每個 page 都要做。
- **取得元件文字**：等可見再取 `.text`，漏掉等待就拿到空字串。
- **捲動找元件**：行動端長頁面，元件不在視窗內就點不到，需要先滾過去。
- **context 切換**：有 WebView 的 app，需要在 NATIVE_APP 與 WEBVIEW 之間切換；每個頁面切法一樣，邏輯不應散落各處。

這四類行為只要有一個地方改，全部 page 都跟著生效——這就是放進 BasePage 的判斷依據。

## BasePage 範例

```python
# pages/base_page.py
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class BasePage:
    def __init__(self, driver, timeout=10):
        self.driver = driver
        self.wait = WebDriverWait(driver, timeout)

    def tap(self, locator):
        """等元件可點擊後點擊"""
        self.wait.until(EC.element_to_be_clickable(locator)).click()

    def type(self, locator, text):
        """等元件可見後輸入文字"""
        self.wait.until(EC.visibility_of_element_located(locator)).send_keys(text)

    def text_of(self, locator):
        """等元件可見後回傳文字"""
        return self.wait.until(EC.visibility_of_element_located(locator)).text

    def scroll_to(self, locator):
        """捲動直到元件進入視窗（行動端常用）"""
        element = self.wait.until(EC.presence_of_element_located(locator))
        self.driver.execute_script("arguments[0].scrollIntoView(true);", element)

    def switch_to_webview(self):
        """切換到第一個 WEBVIEW context"""
        contexts = self.driver.contexts
        webview = next(c for c in contexts if "WEBVIEW" in c)
        self.driver.switch_to.context(webview)

    def switch_to_native(self):
        """切回 NATIVE_APP context"""
        self.driver.switch_to.context("NATIVE_APP")
```

`timeout=10` 只在一個地方設定；所有等待邏輯集中在 `BasePage`，子 page 不需要知道 `WebDriverWait` 是什麼。

## page 繼承 BasePage

上一課的 `LoginPage` 直接用 `find_element` 加上手動等待，現在改成繼承 `BasePage`、呼叫 `self.tap` / `self.type`：

```python
# pages/login_page.py
from appium.webdriver.common.appiumby import AppiumBy
from pages.base_page import BasePage
from pages.home_page import HomePage

class LoginPage(BasePage):           # 繼承 BasePage
    USERNAME  = (AppiumBy.ACCESSIBILITY_ID, "username")
    PASSWORD  = (AppiumBy.ACCESSIBILITY_ID, "password")
    LOGIN_BTN = (AppiumBy.ACCESSIBILITY_ID, "login_btn")
    ERROR_MSG = (AppiumBy.ACCESSIBILITY_ID, "error_msg")

    # __init__ 不需要重寫，BasePage 已經接收 driver

    def login(self, user: str, pw: str) -> "HomePage":
        self.type(self.USERNAME, user)       # BasePage.type，含等待
        self.type(self.PASSWORD, pw)
        self.tap(self.LOGIN_BTN)             # BasePage.tap，含等待
        return HomePage(self.driver)

    def error_is_shown(self) -> bool:
        return self.text_of(self.ERROR_MSG) != ""   # BasePage.text_of
```

改寫前後，`LoginPage` 的 `login()` 少掉三行 `find_element` 加各自的等待邏輯；未來再加 `ProfilePage`、`CartPage`，同樣的等待行為一行都不用重寫。

## 集中維護的價值

假設 CI 環境偏慢，timeout 要從 10 秒調到 20 秒，舊做法要改每一個 page；有了 BasePage，只改一行：

```python
# conftest.py
@pytest.fixture
def login_page(driver):
    return LoginPage(driver, timeout=20)   # 傳入 timeout，BasePage 接收
```

或者直接改 `BasePage.__init__` 的預設值：

```python
def __init__(self, driver, timeout=20):   # 改這一行，全部 page 生效
```

等待策略、捲動實作、context 切換邏輯——只要這些行為有一個維護點，測試套件的穩定性就容易掌握。

## 帶得走

- 判斷要不要進 BasePage：每個 page 都要做的才放；只有一兩個 page 特有的動作留在各自 class。
- BasePage 只做「操作」，不做斷言，不回傳下一頁——那是子 page 的職責。
- `timeout` 由外層傳入或改預設值，維護點只有一個，不用全域搜尋替換。
- 繼承後子 page 的 `__init__` 通常不用重寫；如果需要額外初始化，記得呼叫 `super().__init__(driver, timeout)`。
