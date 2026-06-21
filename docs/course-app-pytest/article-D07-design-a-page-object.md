---
title: 設計一個 Page 物件：元素、動作、回傳下一頁
excerpt: 一個好的 page 物件包含三樣東西：元素 locator、語意化的動作方法、動作後回傳下一個 page。這篇用一個登入頁示範怎麼設計，並守住「斷言不進 page」的原則。
tags: [Page Object Model, POM, 測試架構, QA 實戰]
status: draft
---

# 設計一個 Page 物件：元素、動作、回傳下一頁

知道 POM 的概念是一回事，真正動手設計一個 page 物件又是另一回事。很多人第一次寫，把 locator 放錯地方、動作命名含糊、忘記回傳下一頁，測試串不起來才發現問題。這篇就拆開來看：一個 page 物件到底要有哪三樣東西。

## page 物件的三個組成

一個設計良好的 page 物件只包含三件事：

1. **元素 locator（class 常數）**：用 tuple 存起來，找元件只要解包 `*`，不重複寫 `AppiumBy`。
2. **語意化的動作方法**：方法名稱說的是「做什麼」，不是「點哪個 id」——`login()` 比 `click_login_btn()` 好一個層次。
3. **回傳下一個 page 物件**：動作後 UI 跳頁，method 就回傳對應的 page class；讓 test 能串成流程，不用手動建下一頁物件。

## 登入頁範例

```python
# pages/login_page.py
from appium.webdriver.common.appiumby import AppiumBy

class LoginPage:
    # 1. locator 集中在 class 常數
    USERNAME  = (AppiumBy.ACCESSIBILITY_ID, "username")
    PASSWORD  = (AppiumBy.ACCESSIBILITY_ID, "password")
    LOGIN_BTN = (AppiumBy.ACCESSIBILITY_ID, "login_btn")

    def __init__(self, driver):
        self.driver = driver

    # 2. 語意化動作方法
    def login(self, user: str, pw: str) -> "HomePage":
        self.driver.find_element(*self.USERNAME).send_keys(user)
        self.driver.find_element(*self.PASSWORD).send_keys(pw)
        self.driver.find_element(*self.LOGIN_BTN).click()
        # 3. 回傳下一頁 page 物件
        return HomePage(self.driver)
```

locator 全都在最上面，看一眼就知道這個頁面管了哪些元件；`find_element(*self.USERNAME)` 用解包，不需要重複寫策略字串。

## 動作回傳下一頁

`login()` 回傳 `HomePage`，是整個設計的關鍵。沒有這個回傳，test 要自己 `new` 下一頁物件，流程一長就散掉。

有了回傳，test 可以直接鏈結：

```python
home = LoginPage(driver).login("demo", "pw123")
# home 現在是 HomePage 物件，可以繼續操作
profile = home.go_to_profile()
```

這種寫法讓操作流程讀起來像一句話：「登入，然後去個人頁」。

## 測試怎麼用

test 只做 assert，完全不碰 locator：

```python
# tests/test_login.py
from pages.login_page import LoginPage
from pages.home_page import HomePage

def test_login_success(driver):
    home = LoginPage(driver).login("demo", "pw123")
    assert home.welcome_message_is_displayed()   # 斷言在 test，不在 page

def test_login_wrong_password(driver):
    LoginPage(driver).login("demo", "wrong_pw")
    # 登入失敗不跳頁，所以不需要回傳值
    error = driver.find_element(
        AppiumBy.ACCESSIBILITY_ID, "error_msg"
    )
    assert error.is_displayed()
```

`test_login_success` 甚至連 `AppiumBy` 都不用 import——所有 locator 都藏在 `LoginPage` 裡。test 讀起來就是業務語言：登入，然後驗歡迎訊息有沒有顯示。

失敗訊息也更清楚：如果 `login()` 噴錯，代表操作壞了；如果 `assert` 失敗，代表預期行為沒達到。兩件事分得很開。

## 帶得走

- page 物件三要素：locator 集中為 class 常數、方法名稱語意化、動作後回傳下一頁。
- locator 用 tuple 搭配 `*` 解包，不在方法裡重複寫 `AppiumBy.XXX`。
- 動作方法回傳下一頁物件，test 才能串成流程，不用自己 `new` 每一頁。
- 斷言永遠在 test，不進 page；page 只管操作，test 才管預期——失敗原因才分得清楚。
