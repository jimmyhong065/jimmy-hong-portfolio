---
title: 用 Python requests 發出你的第一支 API 測試
excerpt: 觀念講夠了，來動手。這篇用 Python 最常見的 requests 套件，發出 GET 與 POST、讀 response、看 status code，把前面學的契約變成一支真的會跑的測試。
tags: [API 測試, Python, requests, 實作]
status: draft
---

# 用 requests 發出第一支 API 測試

前兩個模組你學會了怎麼想、怎麼設計用例。現在把它變成程式碼。Python 做 API 測試最常用的就是 `requests` 套件——API 直觀、幾行就能發出一支請求。

## 安裝

```bash
pip install requests
```

## 發一支 POST

用前面整理過的 `automationintesting.online` 留言 API 當例子：

```python
import json
import requests

url = "https://automationintesting.online/message/"

body = {
    "name": "Tester",
    "email": "tester@example.com",
    "phone": "09123456789012",
    "subject": "Booking enquiry",
    "description": "I would like to book a room next week.",
}

# Content-Type 是 application/json，用 json 參數傳，requests 會自動序列化並設好 header
resp = requests.post(url, json=body)

# response 是 JSON，用 .json() 讀；用 json.dumps 排版好閱讀
print("Status:", resp.status_code)
print("Body:", json.dumps(resp.json(), indent=4, ensure_ascii=False))
```

幾個重點：

- **`json=body`**：當 Content-Type 是 `application/json` 時用這個參數，`requests` 會自動把 dict 轉成 JSON 字串，並補上 `Content-Type: application/json` 這個 header。（如果 API 收的是表單，才改用 `data=`。）
- **`resp.json()`**：把回應的 JSON 字串轉回 Python dict。
- **`resp.status_code`**：拿到狀態碼，成功建立這支會回 `201`。
- **`json.dumps(..., indent=4)`**：資料量大時排版一下，不然擠成一團很難讀；`ensure_ascii=False` 讓中文正常顯示。

## 各種方法都長一樣

`requests` 對每個 HTTP 方法都有對應函式，用法一致：

```python
requests.get(url, params={"page": 1})          # 查詢字串用 params
requests.post(url, json=body)                  # 建立
requests.put(url, json=body)                   # 整筆更新
requests.patch(url, json={"name": "new"})      # 部分更新
requests.delete(url)                           # 刪除
```

帶 header（例如認證）也很直接：

```python
resp = requests.get(
    "https://api.example.com/me",
    headers={"Authorization": "Bearer <token>"},
)
```

## 把它變成「測試」

上面只是「發請求、印出來」。要變成測試，就是加上**斷言**——把前一個模組的判準寫成 `assert`：

```python
resp = requests.post(url, json=body)

assert resp.status_code == 201, f"預期 201，實際 {resp.status_code}"
data = resp.json()
assert "messageId" in data            # 該回 messageId
assert data["name"] == body["name"]   # 回填的 name 要一致
```

跑起來沒報錯就是過、`AssertionError` 就是不過。這已經是一支最小可用的 API 測試了——下一步只是讓它更好組織、更好維護。

## 帶得走

- `pip install requests`，每個 HTTP 方法都有對應函式，用法一致。
- JSON body 用 `json=`（自動序列化＋設 header）；查詢字串用 `params=`；header 用 `headers=`。
- `resp.status_code` 拿狀態碼、`resp.json()` 讀 JSON。
- 加上 `assert`，把判準寫成斷言，請求就變成測試。

下一篇：真實測試常要連續打好幾支 API，用 session 把流程串起來。
