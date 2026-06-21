---
title: 元件定位策略：accessibility id 優先、少用 XPath
excerpt: 定位是 App 自動化 flaky 的最大源頭。這篇講定位策略的優先序——為什麼 accessibility id 最穩、為什麼 XPath 又慢又脆，以及 Android/iOS locator 怎麼分開管理。
tags: [Appium, 元件定位, flaky, QA 實戰]
status: draft
---

# 元件定位策略：accessibility id 優先、少用 XPath

測試寫完第一天跑得很順，第二天開發改了一個按鈕的層級，XPath 爛掉三個 test。這不是你的錯，是定位策略的問題。

## 定位優先序

從最穩到最脆，依序是：**accessibility id → id / resource-id → class name → XPath**。選定位策略的原則只有一個：選最不依賴 UI 結構的那個。

```python
from appium.webdriver.common.appiumby import AppiumBy

# 第一優先：accessibility id（跨平台、語意化、開發標好就永遠穩）
driver.find_element(AppiumBy.ACCESSIBILITY_ID, "login_btn")

# 第二優先：id / resource-id（Android 原生元件常有，iOS 對應 name）
driver.find_element(AppiumBy.ID, "com.example.app:id/btn_login")

# 第三優先：class name（型別太粗，通常要加 index 才唯一，勉強用）
driver.find_element(AppiumBy.CLASS_NAME, "android.widget.Button")

# 最後手段：XPath（下一節解釋為什麼）
driver.find_element(AppiumBy.XPATH, "//android.widget.Button[@text='登入']")
```

## 為什麼少用 XPath

XPath 在行動裝置上有兩個致命傷：**慢**和**脆**。

慢是因為 Appium 要遍歷整棵 UI tree 才能比對路徑；一個複雜畫面可能有幾百個節點，定位時間是 accessibility id 的數倍。脆是因為絕對路徑和 UI 結構綁死，改個層級就斷。

```python
# 壞：絕對路徑，任何父層改動都會斷
driver.find_element(
    AppiumBy.XPATH,
    "//android.widget.FrameLayout/android.widget.LinearLayout"
    "/android.widget.RelativeLayout/android.widget.Button[1]",
)

# 好一點：相對 XPath，只靠屬性比對
driver.find_element(
    AppiumBy.XPATH,
    "//android.widget.Button[@text='登入']",
)

# 最好：根本不用 XPath
driver.find_element(AppiumBy.ACCESSIBILITY_ID, "login_btn")
```

只有在元件沒有任何 id、也沒有 accessibility id，才考慮相對 XPath；絕對路徑就直接劃掉。

## Android/iOS 分開管理

跨平台 app 同一個語意元件，Android 和 iOS 的 id 幾乎一定不一樣。把兩個平台的 locator 寫死在 test 裡，是 flaky 的溫床。標準做法是用 dict 依平台選：

```python
from appium.webdriver.common.appiumby import AppiumBy

# locators.py
LOGIN_BTN = {
    "android": (AppiumBy.ACCESSIBILITY_ID, "login_btn"),
    "ios": (AppiumBy.ACCESSIBILITY_ID, "loginButton"),
}

USERNAME_FIELD = {
    "android": (AppiumBy.ID, "com.example.app:id/et_username"),
    "ios": (AppiumBy.ACCESSIBILITY_ID, "usernameInput"),
}
```

test 或 page object 只要讀平台變數就能取到正確的 locator：

```python
# conftest.py 裡從 caps 取出平台，存到 session-scoped fixture
@pytest.fixture(scope="session")
def platform(driver):
    return driver.capabilities["platformName"].lower()  # "android" 或 "ios"

# test 裡
def test_login(driver, platform):
    by, value = LOGIN_BTN[platform]
    driver.find_element(by, value).click()
```

## 跟開發要 accessibility id

最穩的定位來自開發在元件上標好 id，不是 QA 自己去 UI tree 裡挖。

Android 在 XML 加 `contentDescription`，iOS 在 SwiftUI 加 `.accessibilityIdentifier("login_btn")`，成本幾乎是零，卻能讓整個測試套件跨平台都穩住。這件事 QA 完全可以推動——列出哪些關鍵元件缺少 accessibility id，開 ticket 給開發，附上加法範例。這就是 shift-left 最直接的落地之一。

## 帶得走

- 定位優先序：accessibility id → id/resource-id → class name → XPath；XPath 是最後手段。
- XPath 慢（遍歷整棵 UI tree）又脆（絕對路徑綁死結構）；非用不可時只用相對 XPath。
- 跨平台 locator 用 dict 管理，依平台選對應的 `(by, value)` 組合，test 保持平台無關。
- 跟開發要 accessibility id 是 QA 能推動的 shift-left 行動，一次標好，測試長期穩。
