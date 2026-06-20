---
title: API Object 設計：別讓 URL 和 body 散落整個專案
excerpt: UI 測試有 Page Object，API 測試也該有 API Object。這篇把零散的 requests 呼叫封裝成可複用的物件，讓 URL、body、認證邏輯集中一處，測試只描述「做什麼」，不再重複「怎麼做」。
tags: [API 測試, Python, 設計模式, 可維護性]
status: draft
---

# API Object：別讓 URL 和 body 散落整個專案

上一篇的流程能跑了，但有個隱憂：如果每支測試都直接寫 `session.post(f"{BASE}/auth", json=...)`，那 URL、欄位、認證邏輯會散落在幾十個檔案裡。哪天 `/auth` 改路徑、或登入多一個欄位，你要改幾十個地方。

UI 自動化測試早就有 **Page Object** 來解這個問題——把頁面操作封裝成物件。API 測試的對應做法，就是 **API Object**。

## 概念

把「一支 API 怎麼呼叫」封裝進一個 class：URL、方法、body 組裝、回應處理都收進去。測試只管「呼叫它、驗結果」，不再重複「怎麼組請求」。

## 封裝一個 AuthAPI

```python
import requests


class AuthAPI:
    BASE = "https://restful-booker.herokuapp.com"

    def __init__(self, session, username, password):
        self.session = session
        self.username = username
        self.password = password
        self.response = None

    def get_response(self):
        """呼叫登入 API，回傳 response。"""
        self.response = self.session.post(
            f"{self.BASE}/auth",
            json={"username": self.username, "password": self.password},
        )
        return self.response

    def set_cookie(self):
        """把拿到的 token 存進 session，供後續請求使用。"""
        token = self.response.json()["token"]
        self.session.headers["Cookie"] = f"token={token}"
        return token
```

主程式就被簡化成幾行，而且讀起來像在描述業務，不是在拼字串：

```python
session = requests.Session()

auth = AuthAPI(session, "admin", "password123")
auth.get_response()
auth.set_cookie()

# 登入後身分已存進 session，接著做別的事…
```

## 一個 BookingAPI

把 booking 的增改刪也封起來，每個方法對應一個操作：

```python
class BookingAPI:
    BASE = "https://restful-booker.herokuapp.com"

    def __init__(self, session):
        self.session = session

    def create(self, payload):
        return self.session.post(f"{self.BASE}/booking", json=payload)

    def update(self, booking_id, payload):
        return self.session.patch(f"{self.BASE}/booking/{booking_id}", json=payload)

    def delete(self, booking_id):
        return self.session.delete(f"{self.BASE}/booking/{booking_id}")
```

測試讀起來就清爽多了：

```python
booking = BookingAPI(session)

created = booking.create(new_booking)
bid = created.json()["bookingid"]

booking.update(bid, {"firstname": "James"})
booking.delete(bid)
```

## 它幫你解掉的痛

- **單一真相來源**：URL、欄位改了，只改 API Object 一處，所有測試跟著對。
- **測試可讀**：測試碼描述意圖（`booking.create(...)`），把實作細節藏進物件。
- **好複用**：同一支 API 被很多測試用到，封裝一次到處用。
- **好擴充**：加 retry、log、共用驗證，都集中在物件裡加。

這跟 Page Object 是同一個精神：**把「怎麼做」跟「測什麼」分開。**

## 帶得走

- API Object 是 API 測試版的 Page Object：把一支 API 怎麼呼叫封裝成物件。
- URL、body、認證邏輯集中一處，改一個地方所有測試跟著對。
- 測試碼只描述意圖，實作細節藏進物件——可讀、可複用、好擴充。

下一篇：把這些封裝好的呼叫，接進 pytest，獲得斷言、fixture 與參數化的威力。
