---
title: fixture 與 conftest：管好 driver 的生命週期
excerpt: driver 怎麼開、怎麼關、要不要每個測試都重開，是 App 自動化速度與穩定的關鍵。這篇講 conftest 共用 fixture、function scope 與 session scope 的取捨，以及怎麼保證 session 一定被關掉。
tags: [pytest, fixture, conftest, QA 實戰]
status: draft
---

# fixture 與 conftest：管好 driver 的生命週期

每個測試檔都寫一次 `driver = webdriver.Remote(...)`、測完再 `driver.quit()`——當你有二十個測試模組，這二十個地方要同步改。把 driver 的生死交給 pytest fixture，才是對的做法。

## conftest.py 放共用 fixture

pytest 在執行前會自動掃描 `conftest.py`，裡面定義的 fixture 對同層與子目錄的所有測試模組都可用，**不需要 import**。

```python
# conftest.py（放在測試根目錄）
import pytest
from appium import webdriver
from appium.options import XCUITestOptions   # iOS 範例；Android 換 UiAutomator2Options

def make_driver():
    options = XCUITestOptions()
    options.platform_name     = "iOS"
    options.device_name       = "iPhone 15 Simulator"
    options.app               = "/path/to/MyApp.app"
    options.automation_name   = "XCUITest"
    return webdriver.Remote("http://127.0.0.1:4723", options=options)

@pytest.fixture
def driver():
    drv = make_driver()
    yield drv          # 測試在這裡執行
    drv.quit()         # 測試結束後一定跑到這裡
```

測試檔直接宣告參數名，pytest 自動注入：

```python
# tests/test_login.py
from pages.login_page import LoginPage

def test_login_success(driver):            # 不用 import，直接用
    page = LoginPage(driver)
    home = page.login("user@example.com", "correct_pw")
    assert home.is_visible()
```

## function vs session scope

fixture 預設是 `scope="function"`——每個測試函式各自拿到一個全新 driver。

```python
@pytest.fixture(scope="function")          # 預設，可省略不寫
def driver():
    drv = make_driver()
    yield drv
    drv.quit()
```

**優點**：隔離乾淨，測試 A 留下的狀態不影響測試 B。  
**缺點**：啟動 App 約 3–8 秒，一百個測試就是 5–13 分鐘的純啟動成本。

換成 `scope="session"`，整個 pytest 執行過程只開一個 driver：

```python
@pytest.fixture(scope="session")
def driver():
    drv = make_driver()
    yield drv
    drv.quit()
```

**優點**：讀取型、唯讀驗證的測試可省 60–70% 執行時間。  
**缺點**：測試之間共享狀態——一個測試改了登入帳號、留在某個頁面，下一個測試可能就出錯。

**選哪個？** 寫入型、改變 App 狀態的測試用 `function`；只讀、純查看介面的測試才考慮 `session`。混合使用時，把兩種 scope 各定義一個 fixture，讓測試自己選參數名。

## 保證清理：yield 後一定 quit

`yield` 把 fixture 切成「前置」與「後置」兩段——後置段**即使測試失敗、拋例外也一定執行**，等同 `try/finally`：

```python
@pytest.fixture(scope="function")
def driver():
    drv = make_driver()
    try:
        yield drv
    finally:
        drv.quit()          # 測試失敗、timeout、KeyboardInterrupt 都跑得到
```

不用 `try/finally` 的話，`yield` 本身已保證後置段執行；但如果你在 fixture 裡還有其他可能拋出的初始化邏輯，用 `try/finally` 更保險。

## 疊 fixture：登入狀態重用

把登入動作包成獨立 fixture，讓需要登入才能操作的測試不必自己呼叫登入步驟：

```python
# conftest.py（續）
from pages.login_page import LoginPage

@pytest.fixture                            # function scope（與 driver 一致）
def logged_in_driver(driver):              # 疊在 driver fixture 上
    page = LoginPage(driver)
    page.login("qa_user@example.com", "test_pw")
    return driver                          # 傳出已登入狀態的 driver
```

注意：疊在上面的 fixture scope 不能比它依賴的 fixture 更廣——若 `driver` 是 function scope，`logged_in_driver` 也必須是 function scope 或更窄；反過來宣告 `scope="session"` 會讓 pytest 拋出 `ScopeMismatch` 錯誤。

測試宣告 `logged_in_driver` 就能直接操作登入後的頁面：

```python
# tests/test_profile.py
from pages.profile_page import ProfilePage

def test_profile_display(logged_in_driver):
    page = ProfilePage(logged_in_driver)
    assert page.username_is_shown()        # 不用自己登入
```

每個測試各自拿到一個全新的已登入 driver，登入步驟由 fixture 負責，測試主體保持乾淨。

## 帶得走

- `conftest.py` 放在測試根目錄，fixture 自動對全專案可見，不用手動 import。
- `scope="function"` 隔離最乾淨，適合寫入型測試；`scope="session"` 最快，適合唯讀驗證。
- `yield` 後的程式碼等同 `finally`，測試失敗也一定執行——`quit()` 永遠放在 `yield` 後。
- 用 fixture 疊 fixture（`logged_in_driver` 疊在 `driver` 上），登入邏輯集中在一處，測試主體更乾淨；疊的 fixture scope 不能比依賴的 fixture 更廣，否則 pytest 拋 `ScopeMismatch`。
