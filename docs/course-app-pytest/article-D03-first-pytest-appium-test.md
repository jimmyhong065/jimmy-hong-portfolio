---
title: 寫出第一個 pytest + Appium 測試
excerpt: 把架構知識變成一個能跑的測試。這篇用 pytest 的結構寫第一個端到端 App 測試——driver 用 fixture 取得、動作後用 assert 驗證。先求會動，後面再求好維護。
tags: [pytest, Appium, App 自動化, QA 實戰]
status: draft
---

# 寫出第一個 pytest + Appium 測試

知道 Appium 的 client-server 架構之後，腦子裡那個模型要落地——變成一個能跑、能失敗、能給你錯誤訊息的測試。這篇就做這件事，從最小的 `conftest.py` 開始，寫出第一個有意義的 assert。

## pytest 的最小結構

pytest 有三個你需要先認識的概念：**test function**（以 `test_` 開頭的函式就是一個測試）、**assert**（斷言預期結果）、**fixture**（注入測試所需的資源）。

driver 是「需要在測試前建立、測試後關掉」的資源，正是 fixture 設計來處理的事。把 driver 的建立與清理放進 `conftest.py`，所有測試共用，不用每個 test function 自己 `try/finally`：

```python
# conftest.py
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

`yield` 是關鍵：`yield` 之前是 setup，`yield` 之後是 teardown。pytest 保證測試跑完（不管過或失敗）都會執行 `drv.quit()`，不會留下殭屍 session。

## 第一個測試

有了 fixture，test function 只要宣告參數名稱和 fixture 同名，pytest 就會自動注入——這叫 **dependency injection**：

```python
# test_login.py
from appium.webdriver.common.appiumby import AppiumBy

def test_login_shows_home(driver):
    driver.find_element(AppiumBy.ACCESSIBILITY_ID, "username").send_keys("demo")
    driver.find_element(AppiumBy.ACCESSIBILITY_ID, "login_btn").click()
    assert driver.find_element(AppiumBy.ACCESSIBILITY_ID, "home_title").is_displayed()
```

`AppiumBy.ACCESSIBILITY_ID` 對應 Android 的 `content-desc`、iOS 的 `accessibilityIdentifier`——跨平台最穩的定位方式之一。這個測試做了三件事：輸入帳號、點登入、確認首頁標題出現。assert 失敗時，pytest 會打出元件找不到或 `is_displayed()` 回傳 `False` 的錯誤，而不是靜默通過。

跑測試：

```bash
pytest test_login.py -v
```

看到 `PASSED` 代表 session 建立成功、元件找到、斷言通過；看到 `FAILED` 才是真正的 QA 價值起點。

## 為什麼這樣還不夠

這個測試能動，但有兩個明顯的痛點。

**第一，locator 散在測試裡。** `"username"`、`"login_btn"`、`"home_title"` 直接寫在 test function 裡，只要 app 改一個 accessibility ID，你要全文搜尋才找得到要改哪裡。測試案例一多，維護成本呈線性成長。解法是 Page Object Model（POM）——後面的章節會把定位邏輯集中到 Page class 裡。

**第二，沒有等待。** `find_element` 找不到元件就立刻拋 `NoSuchElementException`，不等頁面載入或動畫結束。真實 app 有非同步渲染、轉場動畫、網路延遲，硬找會讓測試隨機失敗（又稱 flaky test）。解法是 Explicit Wait——用 `WebDriverWait` 等條件成立，不是 `time.sleep`。

這兩件事不處理，測試的維護成本和穩定性都撐不住規模。接下來兩篇就處理這兩個問題。

## 帶得走

- `conftest.py` 的 `driver` fixture 用 `yield` 分開 setup 和 teardown，pytest 保證測試結束後一定執行 `drv.quit()`。
- test function 宣告與 fixture 同名的參數，pytest 自動注入——不用 `import`，不用手動呼叫。
- `AppiumBy.ACCESSIBILITY_ID` 是跨平台首選定位方式；`assert element.is_displayed()` 讓測試有明確的通過／失敗邊界。
- locator 散落在測試裡、缺乏等待機制——這兩個問題在真實 app 裡會放大；POM 和 Explicit Wait 是下一步。
