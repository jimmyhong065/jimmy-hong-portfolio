---
title: POM 進階：Component 物件、流程串接、避免 god object
excerpt: page 物件寫久了會變肥——一個 page 塞滿整個畫面的所有操作。這篇講怎麼用 Component 物件拆出重複區塊、用流程物件串多頁，並認得「page 太肥」這個壞味道。
tags: [Page Object Model, Component, 測試架構, QA 實戰]
status: draft
---

# POM 進階：Component 物件、流程串接、避免 god object

你的 `HomePage` 已經 200 行了，裡面有搜尋框、導覽列、推薦卡片、彈窗……每次新加功能都往同一個 class 裡塞。這不是 POM 的錯，是你把一個畫面的所有東西縫進同一個物件了。

## Component 物件

導覽列、底部 Tab Bar、彈窗這類**跨多個頁面重複出現**的區塊，應該抽成獨立的 Component class，再由 page 組合它，而不是讓每個 page 各自複製一份邏輯。

```python
# pages/components/navbar.py
from appium.webdriver.common.appiumby import AppiumBy
from pages.base_page import BasePage

class NavBar(BasePage):
    PROFILE_ICON = (AppiumBy.ACCESSIBILITY_ID, "nav_profile")
    HOME_ICON    = (AppiumBy.ACCESSIBILITY_ID, "nav_home")

    def go_profile(self):
        from pages.profile_page import ProfilePage   # 避免循環匯入
        self.tap(self.PROFILE_ICON)
        return ProfilePage(self.driver)
```

`NavBar` 繼承 `BasePage`，拿到 `tap()` 等共用操作。`ProfilePage` 用 local import 避開循環依賴。

`HomePage` 以**組合**方式持有 `NavBar`：

```python
# pages/home_page.py
from appium.webdriver.common.appiumby import AppiumBy
from pages.base_page import BasePage
from pages.components.navbar import NavBar

class HomePage(BasePage):
    SEARCH_BAR = (AppiumBy.ACCESSIBILITY_ID, "search_bar")

    def __init__(self, driver):
        super().__init__(driver)
        self.nav = NavBar(driver)   # 組合，不繼承

    def search(self, keyword: str) -> "HomePage":
        self.type(self.SEARCH_BAR, keyword)
        return self
```

`ProfilePage` 若也需要導覽列，同樣一行 `self.nav = NavBar(driver)`，不用複製任何邏輯。

## 多頁流程串接

每個動作回傳下一頁的物件，測試讀起來就像一條業務流程：

```python
# tests/test_profile_flow.py
from pages.login_page import LoginPage

def test_view_profile_after_login(driver):
    profile = (
        LoginPage(driver)
            .login("user@example.com", "pass")  # → HomePage
            .nav.go_profile()                    # → ProfilePage
    )
    assert profile.display_name() == "Jimmy"
```

`LoginPage.login()` 回傳 `HomePage`，`NavBar.go_profile()` 回傳 `ProfilePage`——每一步型別都明確，IDE 可以補全，閱讀順序就是使用者的操作順序。測試本身不需要知道中間怎麼初始化 page。

## 避免 god object

page 的方法一旦超過 20–30 個，通常代表它承擔了太多職責：

```python
# ❌ 壞味道：SettingsPage 塞了所有設定區塊
class SettingsPage(BasePage):
    def change_password(self): ...
    def change_avatar(self): ...
    def toggle_notification(self): ...
    def set_language(self): ...
    def manage_payment(self): ...
    def logout(self): ...
    # 再加 20 個方法……
```

畫面上「設定」是一頁，但業務上是獨立的子區塊。按職責拆：

```python
# ✅ 拆成 section component，SettingsPage 只負責組合
# pages/settings/security_section.py   → change_password, logout
# pages/settings/profile_section.py    → change_avatar, set_language
# pages/settings/notification_section.py → toggle_notification
# pages/settings/payment_section.py    → manage_payment

class SettingsPage(BasePage):
    def __init__(self, driver):
        super().__init__(driver)
        self.security     = SecuritySection(driver)
        self.profile      = ProfileSection(driver)
        self.notification = NotificationSection(driver)
        self.payment      = PaymentSection(driver)
```

`SettingsPage` 本身只負責「持有各子區塊」，子區塊各管各的操作，爆炸半徑縮到最小。

## 怎麼判斷該拆

三個信號出現一個就值得考慮：

1. **重複出現**：同一段 locator 加操作在兩個以上的 page 裡出現 → 抽成 Component。
2. **職責太多**：一個 page 的方法橫跨不相關的業務邏輯 → 按功能切 page 或 section。
3. **改一個地方影響太廣**：修改某個方法要擔心 10 個測試壞掉 → 拆小，縮小影響範圍。

不要為了拆而拆。如果一個 Component 只會被一個 page 用到，直接留在該 page 的方法裡就夠了。

## 帶得走

- Component 繼承 `BasePage`、被 page 以**組合**方式持有（`self.nav = NavBar(driver)`），不要用繼承。
- 動作回傳下一頁，讓測試流程鏈接起來，測試不需要手動 `new` 每個 page。
- page 方法超過 20–30 個、或出現跨職責混搭，就是拆的時機。
- local import 可以解開循環依賴，但若頻繁需要，代表模組邊界本身需要重新規劃。
