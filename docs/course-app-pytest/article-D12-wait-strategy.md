---
title: 等待策略：為什麼 sleep 是壞味道
excerpt: time.sleep 是 App 自動化最常見、也最該戒掉的壞習慣——它要嘛太短不穩、要嘛太長浪費。這篇講顯式等待怎麼取代 sleep、隱式等待的陷阱，以及怎麼把等待收進 BasePage。
tags: [pytest, 顯式等待, flaky, QA 實戰]
status: draft
---

# 等待策略：為什麼 sleep 是壞味道

測試在本機跑得過、CI 跑不過——幾乎每次查下去，罪魁禍首都是同一行：`time.sleep(2)`。睡兩秒夠嗎？本機夠，CI 不夠；改成三秒？每條測試都多白等一秒，五十條就多花一分鐘。這不是微調問題，是策略問題。

## 為什麼 sleep 壞

`time.sleep` 是固定等待——你賭的是「這個時間點 UI 一定好了」。問題是：

- **太短 → flaky**：網路慢、裝置效能差、CI 機器繁忙，畫面還沒渲染完，下一個操作就撲空。
- **太長 → 浪費**：UI 在 0.3 秒就好了，你還在睡兩秒，整個套件時間直接膨脹。

壞例：

```python
import time
from appium.webdriver.common.appiumby import AppiumBy

# ❌ 猜時間：太短 flaky，太長浪費
driver.find_element(AppiumBy.ACCESSIBILITY_ID, "login_btn").click()
time.sleep(2)
driver.find_element(AppiumBy.ACCESSIBILITY_ID, "home_title")
```

這段程式碼沒辦法告訴你「它在等什麼」，只知道它在賭。

## 顯式等待

顯式等待的邏輯是：**等到條件成立才繼續，超過上限才報錯**。條件由你定義，不是靠秒數猜。

```python
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from appium.webdriver.common.appiumby import AppiumBy

# ✅ 等到元件可見，最多等 10 秒；條件一成立立刻繼續
WebDriverWait(driver, 10).until(
    EC.visibility_of_element_located((AppiumBy.ACCESSIBILITY_ID, "home_title"))
)
```

常用條件速查：

| 條件 | 用途 |
|------|------|
| `visibility_of_element_located` | 等元件可見（不遮擋、非 hidden） |
| `element_to_be_clickable` | 等元件可點擊（可見且 enabled） |
| `presence_of_element_located` | 等元件存在 DOM（可能不可見） |
| `invisibility_of_element_located` | 等 loading 消失 |

## 隱式等待的陷阱

Appium 提供了另一種全域設定：

```python
driver.implicitly_wait(10)  # 全域：每次 find_element 最多等 10 秒
```

聽起來方便，實際上有兩個坑：

1. **全域生效，無法針對單一操作控制**：你想等某個元素最多 3 秒、另一個最多 15 秒，implicit wait 沒辦法做到。
2. **與顯式等待混用會疊加**：`WebDriverWait(driver, 10)` 裡面的 `find_element` 受 implicit wait 影響，實際 timeout 可能比你設的還長，debug 時完全摸不著頭緒。

建議：**統一用顯式等待，`implicitly_wait` 設 0 或完全不設。**

```python
driver.implicitly_wait(0)  # 明確關掉，避免疊加
```

## 收進 BasePage

等待邏輯不該散在每條測試裡，也不該散在每個 page 的每個方法裡。D08 示範過的 `BasePage.tap` 和 `BasePage.type` 本身就已內含等待——這就是集中的好處。

```python
# pages/base_page.py（節錄）
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class BasePage:
    def __init__(self, driver, timeout=10):
        self.driver = driver
        self.wait = WebDriverWait(driver, timeout)

    def tap(self, locator):
        """等可點擊再點——不需要在測試裡手動等"""
        self.wait.until(EC.element_to_be_clickable(locator)).click()

    def wait_until_visible(self, locator, timeout=None):
        """需要自訂 timeout 時，臨時建一個 wait"""
        w = WebDriverWait(self.driver, timeout) if timeout else self.wait
        return w.until(EC.visibility_of_element_located(locator))

    def wait_until_gone(self, locator):
        """等 loading spinner 之類的元件消失"""
        self.wait.until(EC.invisibility_of_element_located(locator))
```

子 page 用 `self.tap`、`self.wait_until_visible`，完全不碰 `WebDriverWait`；timeout 要調，改 `BasePage.__init__` 一行就全套生效。

## 帶得走

- `time.sleep` 是定時炸彈——穩定性取決於你猜得準不準，不是取決於 UI 真的好了。
- 顯式等待以「條件」為基準，最快當下成立、最慢上限才報錯，兩頭都不浪費。
- `implicitly_wait` 與顯式等待混用會疊加 timeout，建議一律設 0 或不設。
- 把 `WebDriverWait` 封進 `BasePage`，測試和子 page 的等待邏輯消失；timeout 維護點只有一個。
