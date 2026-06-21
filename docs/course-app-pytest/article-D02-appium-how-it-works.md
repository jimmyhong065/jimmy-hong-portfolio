---
title: Appium 怎麼運作：架構、capabilities 與最小起步
excerpt: 在寫測試前，先搞懂 Appium 在做什麼。這篇講 client-server 架構、capabilities 怎麼決定要驅動 Android 還是 iOS，並用最少的程式碼起一個能連上裝置的 session。
tags: [Appium, capabilities, App 自動化, QA 實戰]
status: draft
---

# Appium 怎麼運作：架構、capabilities 與最小起步

很多人第一次跑 Appium 是複製一段程式碼湊出 session，然後驚喜地看到手機動了。但下一步——改 caps、換裝置、接 CI——就卡住了，原因幾乎都一樣：不知道那個 session 背後在做什麼。

## client-server 架構

你寫的 pytest 是 **client**，不直接控制手機，而是把動作翻譯成 HTTP 請求，透過 WebDriver 協定送給 **Appium server**：

```
pytest  →  HTTP（/session /element /click）  →  Appium Server  →  UIAutomator2 / XCUITest  →  裝置
```

Appium server 是中繼層——收命令、轉譯、叫對應的 driver 打裝置。UIAutomator2 負責 Android，XCUITest 負責 iOS。server 要先啟動，pytest 才能送命令；沒啟動就跑測試，拿到的是 `ConnectionRefusedError`，不是程式錯誤。

## capabilities 是什麼

capabilities（caps）是你告訴 server「要連哪台裝置、跑哪個 app」的設定包。server 收到後依 caps 決定叫 UIAutomator2 還是 XCUITest，以及要起哪個 Activity。

關鍵 caps：`platform_name`（Android/iOS）、`automation_name`（UiAutomator2/XCUITest）、`device_name`（emulator 名或真機名）、`app_package` + `app_activity`（Android 的 app 入口）、`udid`（多台裝置時必填）。

Android 標準寫法用 `UiAutomator2Options`，不要用裸 dict——型別安全，打錯 cap 名稱 Python 直接報錯：

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

## 最小起步

起 session、做一個動作、關掉——這是最小的完整骨架：

```python
from appium import webdriver
from appium.options.android import UiAutomator2Options
from appium.webdriver.common.appiumby import AppiumBy

options = UiAutomator2Options()
options.platform_name = "Android"
options.device_name = "emulator-5554"
options.app_package = "com.example.app"
options.app_activity = ".MainActivity"

driver = webdriver.Remote("http://127.0.0.1:4723", options=options)

try:
    btn = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "login-button")
    btn.click()
finally:
    driver.quit()  # 一定要關
```

`driver.quit()` 放 `finally` 兜底：沒關的 session 會佔住 server 資源，下次起 session 可能撞上殘留狀態出現奇怪錯誤。正式測試裡這件事交給 fixture 統一管，不用每個 test 自己寫 `try/finally`——下一篇會把這段包進去。

## 帶得走

- pytest 是 client，透過 HTTP 送命令給 Appium server；server 依 caps 路由給 UIAutomator2 或 XCUITest，再打到裝置。
- caps 是連線設定包：`platform_name` 決定平台，`automation_name` 決定驅動，`app_package`/`app_activity` 決定起哪個 app。
- 用 `UiAutomator2Options` 不要用裸 dict——型別安全，打錯 cap 名稱 Python 直接報錯。
- `driver.quit()` 是必須的，沒關的 session 會留下殘局；正式測試由 fixture 統一管。
