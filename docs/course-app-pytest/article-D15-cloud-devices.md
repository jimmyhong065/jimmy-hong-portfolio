---
title: 雲端真機：本機維護不完的設備，交給設備農場
excerpt: 自己維護一櫃真機很快會失控——充電、更新、連線、機型不夠。雲端設備農場用 capabilities 就能換到上百種機型。這篇講本機 vs 雲端的取捨，以及同一套 POM 怎麼兩邊都能跑。
tags: [BrowserStack, 雲端測試, Appium, QA 實戰]
status: draft
---

# 雲端真機：本機維護不完的設備，交給設備農場

你的測試在 Pixel 7 上跑得穩，上線後卻收到 Samsung A14 的 crash 回報。買一支回來跑？然後再來一支 Xiaomi？設備這條路沒有終點——今天講怎麼把這個問題外包掉。

## 本機真機的維護地獄

維護幾支真機乍看簡單，機型一多就開始出問題：

| 痛點 | 實際情境 |
|------|----------|
| **充電管理** | 測試伺服器旁掛 10 支手機，有人拔錯線整輪 CI 少一台 |
| **OS 更新** | Android 14 推送，三台自動更新，Appium driver 相容性炸掉 |
| **USB 連線** | `adb devices` 回空，重插還是空，重開機才恢復 |
| **機型覆蓋** | 你買得到的永遠不是用戶手上那支 |

規模到五台以上，維護工時會大幅超過測試工時本身。設備農場（Device Farm）就是把這個維護責任整個轉移出去。

## 雲端設備農場

BrowserStack、Sauce Labs 這類平台在雲端維護上百種真機，你只要用 capabilities 指定機型，Appium session 就跑在那台實體裝置上。

關鍵設計是**用環境變數切換 endpoint 和 caps**，本機和雲端共用同一份測試程式碼：

```python
import os
from appium import webdriver
from appium.options.android import UiAutomator2Options

options = UiAutomator2Options()
options.platform_name = "Android"

if os.getenv("USE_CLOUD"):
    options.set_capability("bstack:options", {
        "deviceName": "Samsung Galaxy S23",
        "osVersion": "13.0",
        "userName": os.environ["BS_USER"],
        "accessKey": os.environ["BS_KEY"],
    })
    endpoint = "https://hub.browserstack.com/wd/hub"
else:
    options.device_name = "emulator-5554"
    endpoint = "http://127.0.0.1:4723"

driver = webdriver.Remote(endpoint, options=options)
```

`bstack:options` 是 BrowserStack 的 vendor namespace，裡面的 `deviceName` / `osVersion` 對應平台的機型列表。`BS_USER` 和 `BS_KEY` 存進 CI secrets，不寫死在程式碼裡。

切換到不同機型只要改 `deviceName` 和 `osVersion`，不需要更動任何測試邏輯。

## 同一套 POM 兩邊跑

POM 和測試用例完全不知道 driver 從哪裡來——它們只接受一個 `driver` 物件。這正是 D09 fixture 抽象的設計回報。

把切換邏輯收進 conftest fixture：

```python
# conftest.py
import os
import pytest
from appium import webdriver
from appium.options.android import UiAutomator2Options


@pytest.fixture(scope="session")
def driver():
    options = UiAutomator2Options()
    options.platform_name = "Android"

    if os.getenv("USE_CLOUD"):
        options.set_capability("bstack:options", {
            "deviceName": os.getenv("BS_DEVICE", "Samsung Galaxy S23"),
            "osVersion": os.getenv("BS_OS_VERSION", "13.0"),
            "userName": os.environ["BS_USER"],
            "accessKey": os.environ["BS_KEY"],
        })
        endpoint = "https://hub.browserstack.com/wd/hub"
    else:
        options.device_name = "emulator-5554"
        endpoint = "http://127.0.0.1:4723"

    d = webdriver.Remote(endpoint, options=options)
    yield d
    d.quit()
```

測試和 Page Object 完全不動：

```python
# tests/test_login.py
from pages.login_page import LoginPage


def test_login_success(driver):
    page = LoginPage(driver)
    page.login("user@example.com", "secret")
    assert page.is_logged_in()
```

本機跑：`pytest tests/`  
雲端跑：`USE_CLOUD=1 BS_USER=xxx BS_KEY=yyy pytest tests/`

同一份 POM，切機型只改環境變數。

## 取捨

雲端不是萬能，選錯場景反而更慢更貴：

| 面向 | 本機 / 模擬器 | 雲端設備農場 |
|------|--------------|-------------|
| **速度** | 快，session 幾秒建立 | 較慢，排隊 + 串流延遲 |
| **成本** | 硬體一次性，維護自負 | 按分鐘計費，機型多時費用高 |
| **機型廣度** | 受限於手上裝置 | 上百種真機隨選 |
| **除錯便利性** | 直接 `adb logcat`，截圖本機 | 遠端 log，除錯路徑較長 |
| **維護責任** | 自己扛 OS / driver 相容 | 平台維護，你只管 caps |

建議分工：**開發期用本機模擬器跑 smoke**，iteration 快；**CI 全機型回歸用雲端**，覆蓋 Samsung / Xiaomi / 舊版 Android 這些你不會買的機型。這樣成本只花在真正需要廣度的那輪。

## 帶得走

- 本機真機超過五台就開始失控；設備農場把充電、OS、USB 維護轉移給平台。
- 切換本機 vs 雲端只動 `endpoint` 和 `capabilities`；用環境變數隔離，測試程式碼不碰。
- `bstack:options` 是 BrowserStack vendor namespace；`BS_USER` / `BS_KEY` 存 CI secrets，不寫死。
- POM 和測試不感知 driver 來源——D09 fixture 抽象讓同一套程式碼兩邊都能跑。
- 本機跑開發期 smoke，雲端跑 CI 全機型回歸：速度和覆蓋各取所長，成本不會爆。
