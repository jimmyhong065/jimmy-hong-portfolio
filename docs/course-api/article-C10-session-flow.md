---
title: 用 Session 串起多步 API 測試流程
excerpt: 真實的業務測試很少只打一支 API——登入、建立、修改、刪除往往是一串。這篇用 requests 的 Session 把這串流程接起來，自動帶著登入狀態，並示範怎麼用多個 session 模擬多個用戶。
tags: [API 測試, Python, session, 測試流程]
status: draft
---

# 用 Session 串起多步測試流程

上一篇發的是單支請求。但真實測試常是一連串：先登入拿 token，再帶著這個 token 去建立、修改、刪除。如果每支請求都手動把 token 塞進 header，又囉嗦又容易漏。

`requests` 的 **Session** 就是為這個而生——它會在一連串請求之間，自動記住 cookie 與共用的 header。

## 為什麼用 Session

測試端常需要連續用好幾支 API 完成一個流程。建一個 session，相當於開一條「記得你是誰」的連線：登入後把身分存進去，後面的請求都自動帶著走。

## 一個完整流程：訂房的增改刪

用 `restful-booker` 示範一條「登入 → 建立 → 部分更新 → 刪除」的流程：

```python
import json
import requests

BASE = "https://restful-booker.herokuapp.com"

session = requests.Session()
# 這支 API 的 PATCH／DELETE 需要這兩個 header，先設在 session 上共用
session.headers.update({
    "Content-Type": "application/json",
    "Accept": "application/json",
})

# 1. 登入，取得 token
auth = session.post(f"{BASE}/auth", json={
    "username": "admin",
    "password": "password123",
})
token = auth.json()["token"]

# 2. 把 token 存進 session 的 cookie，之後每支請求都會自動帶
session.headers["Cookie"] = f"token={token}"

# 3. 建立 booking
new_booking = {
    "firstname": "Jim",
    "lastname": "Brown",
    "totalprice": 111,
    "depositpaid": True,
    "bookingdates": {"checkin": "2025-01-01", "checkout": "2025-01-05"},
    "additionalneeds": "Breakfast",
}
created = session.post(f"{BASE}/booking", json=new_booking)
booking_id = created.json()["bookingid"]

# 4. 部分更新（需要登入；session 已帶 cookie，不必再手動設）
updated = session.patch(f"{BASE}/booking/{booking_id}", json={"firstname": "James"})
assert updated.json()["firstname"] == "James"

# 5. 刪除
deleted = session.delete(f"{BASE}/booking/{booking_id}")
print("Delete status:", deleted.status_code)
```

注意第 4、5 步**沒有再手動帶 token**——因為 session 記住了。這就是 session 的價值：身分設一次，整條流程通用。

## 用多個 Session 模擬多個用戶

要測「A 改不到 B 的資料」這種多用戶情境，就開多個 session，各自獨立：

```python
session_a = requests.Session()
session_b = requests.Session()

# 各自登入，各自存各自的身分
login(session_a, "user_a", "pwd_a")
login(session_b, "user_b", "pwd_b")

# 用 A 的身分建立資源
res = session_a.post(f"{BASE}/booking", json=new_booking)
bid = res.json()["bookingid"]

# 用 B 的身分去刪 A 的資源——預期該被擋（呼應授權測試）
forbidden = session_b.delete(f"{BASE}/booking/{bid}")
assert forbidden.status_code in (401, 403)
```

兩個 session 的 cookie、header 各自獨立，互不污染——這正好對上 B08 講的越權測試。

## 帶得走

- 多步流程用 `requests.Session()`，自動在請求間記住 cookie 與共用 header。
- 登入後把 token 存進 session，後續請求不必再手動帶身分。
- 共用的 header（`Content-Type`、`Accept`）用 `session.headers.update()` 設一次。
- 多用戶情境開**多個獨立 session**，正好拿來測越權。

下一篇：流程一長，腳本就亂——用 API Object 把它封裝起來。
