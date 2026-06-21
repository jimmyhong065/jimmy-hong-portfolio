---
title: 為什麼要 POM：把「測什麼」和「怎麼操作」分開
excerpt: 沒有 POM 的測試，UI 一改就崩一片——因為 locator 和操作散落在每個測試裡。Page Object Model 把 UI 細節封裝起來，測試只呼叫語意化的方法。這篇講為什麼這個分離值得。
tags: [Page Object Model, POM, 測試架構, QA 實戰]
status: draft
---

# 為什麼要 POM：把「測什麼」和「怎麼操作」分開

開發把登入按鈕的 `resource-id` 改了一個字，你的測試崩了十二個。你一個一個去改，改完隔天他又動了輸入框。這不是開發的問題——這是你的測試沒有把「操作 UI」這件事集中管理。

## 沒有 POM 的痛

locator 直接寫在每個 test 裡，看起來快，痛起來慢。

```python
# 壞：locator 散落在每個 test，重複三次
from appium.webdriver.common.appiumby import AppiumBy

def test_login_success(driver):
    driver.find_element(AppiumBy.ID, "com.app:id/et_username").send_keys("demo")
    driver.find_element(AppiumBy.ID, "com.app:id/et_password").send_keys("pw123")
    driver.find_element(AppiumBy.ACCESSIBILITY_ID, "login_btn").click()
    assert driver.find_element(AppiumBy.ID, "com.app:id/tv_welcome").is_displayed()

def test_login_wrong_password(driver):
    driver.find_element(AppiumBy.ID, "com.app:id/et_username").send_keys("demo")
    driver.find_element(AppiumBy.ID, "com.app:id/et_password").send_keys("wrong")
    driver.find_element(AppiumBy.ACCESSIBILITY_ID, "login_btn").click()
    assert driver.find_element(AppiumBy.ID, "com.app:id/tv_error").is_displayed()

def test_login_empty_fields(driver):
    driver.find_element(AppiumBy.ACCESSIBILITY_ID, "login_btn").click()
    assert driver.find_element(AppiumBy.ID, "com.app:id/tv_error").is_displayed()
```

`et_username` 改名成 `input_username`，你要改幾行？數一數：三個 test、每個 test 重複出現，至少六處。locator 越散、test 越多，維護成本就越高。

## POM 是封裝

Page Object Model 的核心只有一件事：**把 UI 的結構和操作藏進一個 class，讓 test 只看語意。**

```python
# pages/login_page.py
from appium.webdriver.common.appiumby import AppiumBy

class LoginPage:
    _USERNAME = (AppiumBy.ID, "com.app:id/et_username")
    _PASSWORD = (AppiumBy.ID, "com.app:id/et_password")
    _LOGIN_BTN = (AppiumBy.ACCESSIBILITY_ID, "login_btn")

    def __init__(self, driver):
        self.driver = driver

    def login(self, username: str, password: str) -> None:
        self.driver.find_element(*self._USERNAME).send_keys(username)
        self.driver.find_element(*self._PASSWORD).send_keys(password)
        self.driver.find_element(*self._LOGIN_BTN).click()
```

test 只需要呼叫 `login_page.login(...)`，完全看不見任何 locator：

```python
# 好：test 只說「做什麼」，不管「怎麼找元件」
from pages.login_page import LoginPage

def test_login_success(driver):
    login_page = LoginPage(driver)
    login_page.login("demo", "pw123")
    assert driver.find_element(AppiumBy.ID, "com.app:id/tv_welcome").is_displayed()

def test_login_wrong_password(driver):
    login_page = LoginPage(driver)
    login_page.login("demo", "wrong")
    assert driver.find_element(AppiumBy.ID, "com.app:id/tv_error").is_displayed()

def test_login_empty_fields(driver):
    login_page = LoginPage(driver)
    login_page.login("", "")
    assert driver.find_element(AppiumBy.ID, "com.app:id/tv_error").is_displayed()
```

`et_username` 改名，只要改 `LoginPage._USERNAME` 一行，三個 test 全部自動修好。

## 好處

- **UI 改只改一處**：locator 集中在 page class，不散在 test 裡。
- **測試讀起來像業務語言**：`login_page.login("demo", "pw")` 比 `find_element(BY.ID, "com.app:id/et_username").send_keys("demo")` 好讀十倍。
- **重複操作可複用**：登入這個動作在幾十個 test 裡都用同一個 method，不用複製貼上。

## 一個原則

**斷言放在 test，不放進 page object。**

```python
# 壞：page object 自己做斷言，test 不知道驗了什麼
class LoginPage:
    def login_and_assert_success(self, username, password):
        self._do_login(username, password)
        assert self.driver.find_element(AppiumBy.ID, "com.app:id/tv_welcome").is_displayed()  # ← 不該在這裡

# 好：page object 只操作，test 自己決定要驗什麼
class LoginPage:
    def login(self, username: str, password: str) -> None:
        self._do_login(username, password)  # 操作完就結束，不驗

def test_login_success(driver):
    LoginPage(driver).login("demo", "pw123")
    assert driver.find_element(AppiumBy.ID, "com.app:id/tv_welcome").is_displayed()  # ← 驗的責任在 test
```

page object 負責「怎麼操作」，test 負責「驗什麼」。兩件事分開，失敗訊息才清楚——是操作壞了，還是預期行為錯了。

## 帶得走

- 沒有 POM，locator 散在每個 test；UI 一動，要改的地方與 test 數量成正比。
- POM 把 UI 結構和操作封裝進 page class，test 只呼叫語意化的 method，看不見 locator。
- locator 集中維護：只要改 page class，所有用到這個元件的 test 自動生效。
- 斷言永遠留在 test，不寫進 page object；page 只管操作，test 才管預期。
