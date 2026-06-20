---
title: 接進 pytest：斷言、fixture 與參數化
excerpt: 自己寫 assert 和 print 只能撐到測試變多之前。這篇把 API 測試接進 pytest，用它的斷言報告、用 fixture 管理登入狀態、用參數化把一堆相似 case 收成一行——這是讓測試規模化的關鍵一步。
tags: [API 測試, Python, pytest, 測試框架]
status: draft
---

# 接進 pytest：讓測試規模化

到目前為止，我們的「測試」是一堆 `assert` 加 `print`。能跑，但測試一多就管不動：沒有清楚的通過/失敗報告、登入邏輯到處複製、相似 case 一個個複製貼上。

`pytest` 是 Python 最主流的測試框架，正好補上這些。

## 安裝與第一個測試

```bash
pip install pytest
```

pytest 的規則很簡單：檔名 `test_*.py`、函式 `test_*`、用原生 `assert` 斷言。

```python
# test_message.py
import requests

URL = "https://automationintesting.online/message/"

def test_create_message_returns_201():
    body = {
        "name": "Tester", "email": "tester@example.com",
        "phone": "09123456789012", "subject": "Enquiry",
        "description": "I would like to book a room.",
    }
    resp = requests.post(URL, json=body)
    assert resp.status_code == 201
    assert "messageId" in resp.json()
```

跑 `pytest -v`，它會列出每個 test 的 pass/fail，斷言失敗時還會把「預期 vs 實際」漂亮地攤出來——比自己 print 清楚太多。

## fixture：管理共用的前置狀態

每個測試都要先登入、開 session——這種重複的前置工作交給 **fixture**。fixture 是「測試需要的東西」的供應商，`yield` 之後的程式碼會在測試結束後自動執行（拿來清理）。

```python
# conftest.py（放這裡，整個資料夾的測試都能用）
import pytest
import requests

BASE = "https://restful-booker.herokuapp.com"

@pytest.fixture
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Accept": "application/json"})
    yield s
    s.close()          # 測試結束後關閉

@pytest.fixture
def auth_session(session):
    """已登入的 session，直接拿來用。"""
    resp = session.post(f"{BASE}/auth", json={"username": "admin", "password": "password123"})
    session.headers["Cookie"] = f"token={resp.json()['token']}"
    return session
```

測試只要把 fixture 名稱當參數，pytest 就會自動注入：

```python
def test_create_booking(auth_session):
    resp = auth_session.post(f"{BASE}/booking", json=NEW_BOOKING)
    assert resp.status_code == 200          # restful-booker 建立成功回 200
    assert resp.json()["bookingid"] > 0
```

`auth_session` 又依賴 `session`——fixture 可以串接，pytest 會自動把整條鏈準備好。

## 參數化：一堆相似 case 收成一行

異常測試常是「同一支 API、換不同的壞輸入、都該被擋」。與其複製五個幾乎一樣的 test，用 `@pytest.mark.parametrize` 把資料攤開：

```python
import pytest

@pytest.mark.parametrize("field, value", [
    ("name", ""),                 # 必填卻空
    ("email", "not-an-email"),    # 格式錯
    ("phone", "123"),             # 太短
])
def test_invalid_message_is_rejected(field, value):
    body = {**VALID_BODY, field: value}   # 以合法 body 為底，只壞一個欄位
    resp = requests.post(URL, json=body)
    assert resp.status_code == 400         # 故意打錯該回 4xx，不是 500
```

這正好把 B05 那條「一次只壞一個欄位」的紀律，落成乾淨的程式碼——每組參數跑成一個獨立 case，哪一組紅了一目了然。

## 帶得走

- pytest：檔案 `test_*.py`、函式 `test_*`、原生 `assert`，`pytest -v` 給清楚報告。
- **fixture** 管前置與清理（`yield` 後自動 teardown），可串接依賴。
- **參數化**把相似的異常 case 收成一份，呼應「一次只壞一個欄位」。

下一篇：手寫斷言驗結構太累——用 schema 驗證自動守住契約。
