---
title: 處理 WebView 與 hybrid app：context 切換
excerpt: Hybrid app 一半是原生、一半是網頁，測試卡在「找不到網頁裡的元件」幾乎都是 context 沒切。這篇講 NATIVE_APP 與 WEBVIEW 兩種 context 怎麼切、Android 與 iOS 的差異與常見坑。
tags: [Appium, WebView, hybrid app, QA 實戰]
status: draft
---

# 處理 WebView 與 hybrid app：context 切換

寫了 locator、設好等待，測試跑起來卻一直拋 `NoSuchElementException`。打開 Appium Inspector 根本看不到那個元件。原因幾乎一定是：你在找網頁裡的元件，但 driver 還停在原生層。

## 為什麼找不到元件

Hybrid app 有兩層：**原生層**（按鈕、導覽列、底部 tab）和**WebView 層**（內嵌網頁）。Appium session 一啟動，預設落在 `NATIVE_APP` context，只能看到原生元件。WebView 裡的 DOM 對 `NATIVE_APP` 完全不可見——定位自然失敗。

切 context 是入口，不切就是鎖門打牆。

## 列出與切換 context

```python
from appium.webdriver.common.appiumby import AppiumBy

# 先列出目前所有可用 context
contexts = driver.contexts
# 回傳範例：['NATIVE_APP', 'WEBVIEW_com.example.app']

# 取出第一個 WEBVIEW context（若有多個，後面會說怎麼挑）
webview = next(c for c in contexts if c.startswith("WEBVIEW"))

# 切進 WebView
driver.switch_to.context(webview)

# 現在可以用 Web 定位法（CSS Selector、By.ID、By.TAG_NAME）
driver.find_element(AppiumBy.CSS_SELECTOR, "#submit").click()
driver.find_element(AppiumBy.CSS_SELECTOR, "input[name='email']").send_keys("test@example.com")

# 操作完畢，切回原生層（例如要按 app 自己的返回鍵）
driver.switch_to.context("NATIVE_APP")
driver.find_element(AppiumBy.ACCESSIBILITY_ID, "back_btn").click()
```

切進 WebView 後，定位語法就跟 Selenium 一樣——用 `CSS_SELECTOR`、`XPATH`、`ID` 都行，AppiumBy 的原生定位方式（`ACCESSIBILITY_ID`、`ANDROID_UIAUTOMATOR` 等）在 WebView 裡反而不適用。

## Android vs iOS 的差異與坑

**Android**

Android WebView 底層走 Chromedriver。**Chromedriver 版本要對上 app 內嵌的 Chrome/WebView 版本**，版本不對，`switch_to.context` 會直接丟例外或 context 列表只剩 `NATIVE_APP`。

capabilities 裡加 `chromedriverAutodownload`，Appium server 會自動下載對應版本：

```python
options.set_capability("chromedriverAutodownload", True)
```

若測試環境不能連外網，就要手動指定：

```python
options.set_capability("chromedriverExecutable", "/path/to/chromedriver")
```

另外，WebView 必須開啟 debug 模式，app 程式碼裡要有：

```java
// Android (Java)
WebView.setWebContentsDebuggingEnabled(true);
```

少了這行，Appium 看不到 WebView，`contexts` 只會回傳 `['NATIVE_APP']`。

---

**iOS**

iOS 走 Safari remote debugger，不需要 Chromedriver。但有幾個坑：

1. **多個 WebView**：一個畫面有多個 WebView 時，`driver.contexts` 會回傳多個 `WEBVIEW_` 項目，要靠 index 或等到正確的 context 出現，不能直接取第一個。
2. **等 WebView 出現**：WebView 不一定在畫面出現的瞬間就對 Appium 可見，需要等待：

```python
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def wait_for_webview(driver, timeout=10):
    """等到 WEBVIEW context 出現才切換"""
    def webview_present(d):
        return any(c.startswith("WEBVIEW") for c in d.contexts)

    WebDriverWait(driver, timeout).until(webview_present)
    webview = next(c for c in driver.contexts if c.startswith("WEBVIEW"))
    driver.switch_to.context(webview)
```

3. **模擬器 vs 真機**：iOS 模擬器上 WebView 切換通常順暢；真機要在裝置設定開啟「Web 檢閱器」，否則 remote debugger 連不上。

## 包進 BasePage

context 切換每次手寫很累，也容易忘記切回來。這種重複行為適合收進 `BasePage`，用 context manager 包住，確保進出對稱：

```python
from contextlib import contextmanager

class BasePage:
    def __init__(self, driver, platform):
        self.driver = driver
        self.platform = platform

    @contextmanager
    def in_webview(self, timeout=10):
        """切進 WebView，離開 with 區塊後自動切回 NATIVE_APP"""
        self._wait_for_webview(timeout)
        try:
            yield
        finally:
            self.driver.switch_to.context("NATIVE_APP")

    def _wait_for_webview(self, timeout):
        from selenium.webdriver.support.ui import WebDriverWait

        def webview_present(d):
            return any(c.startswith("WEBVIEW") for c in d.contexts)

        WebDriverWait(self.driver, timeout).until(webview_present)
        webview = next(c for c in self.driver.contexts if c.startswith("WEBVIEW"))
        self.driver.switch_to.context(webview)
```

test 裡就像這樣用——WebView 操作收在 `with` 區塊，讀起來清楚，忘記切回的問題也消失：

```python
def test_webview_form(driver, platform):
    page = SomeHybridPage(driver, platform)
    page.open_embedded_form()

    with page.in_webview():
        driver.find_element(AppiumBy.CSS_SELECTOR, "input#name").send_keys("Jimmy")
        driver.find_element(AppiumBy.CSS_SELECTOR, "#submit").click()

    # with 結束後自動回到 NATIVE_APP
    page.assert_success_toast()
```

下一節會把這個 `BasePage` 繼續擴充，把等待、截圖、平台判斷都收進去，讓所有 Page Object 繼承同一套基底。

## 帶得走

- Hybrid app 預設在 `NATIVE_APP` context；網頁元件要先 `driver.switch_to.context(webview)` 才找得到。
- WebView 裡用 Web 定位法（CSS Selector、XPath），原生定位法（ACCESSIBILITY_ID 等）在 WebView 無效。
- Android 靠 Chromedriver，版本要對上 app 內嵌 WebView 的版本，且 app 要開 `setWebContentsDebuggingEnabled(true)`。
- iOS 靠 Safari remote debugger，多 WebView 要挑對 context，真機要開「Web 檢閱器」。
- WebView 出現有延遲，切換前加 `WebDriverWait` 等到 context 列表裡有 `WEBVIEW_` 才切。
- context 切換包進 `BasePage` 的 context manager，確保進出對稱、test 不用手動切回。
