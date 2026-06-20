---
title: 用 Schema 驗證自動守住 API 契約
excerpt: 一個個手寫 assert 去驗回應結構，又累又漏。這篇用 jsonschema 和 pydantic，把「回應長得對不對」變成一行驗證——欄位齊不齊、型別對不對、該必填的有沒有，全自動把關。
tags: [API 測試, Python, jsonschema, pydantic]
status: draft
---

# 用 Schema 驗證自動守住契約

回想 B07 那五層驗證，第三層是「response 的**結構**對不對」。如果用手寫斷言去驗——`assert "id" in data`、`assert isinstance(data["price"], (int, float))`——一個回應十幾個欄位，寫到天荒地老，還很容易漏掉某個。

更好的做法是把「正確結構」描述成一份 **schema**，讓工具自動比對。

## 方法一：jsonschema

`jsonschema` 用一份 JSON Schema 描述結構，再拿回應去比對：

```bash
pip install jsonschema
```

```python
from jsonschema import validate, ValidationError

booking_schema = {
    "type": "object",
    "required": ["bookingid", "booking"],
    "properties": {
        "bookingid": {"type": "integer"},
        "booking": {
            "type": "object",
            "required": ["firstname", "lastname", "totalprice", "depositpaid"],
            "properties": {
                "firstname": {"type": "string"},
                "lastname": {"type": "string"},
                "totalprice": {"type": "number"},
                "depositpaid": {"type": "boolean"},
                "bookingdates": {
                    "type": "object",
                    "properties": {
                        "checkin": {"type": "string"},
                        "checkout": {"type": "string"},
                    },
                },
            },
        },
    },
}

def test_create_booking_matches_schema(auth_session):
    resp = auth_session.post(f"{BASE}/booking", json=NEW_BOOKING)
    validate(instance=resp.json(), schema=booking_schema)   # 不符就丟 ValidationError
```

一行 `validate`，就同時驗了：該有的欄位在不在（`required`）、每個欄位型別對不對（`type`）。`totalprice` 哪天從數字變成字串、`depositpaid` 漏掉了，這個測試立刻紅——這些用手寫斷言最容易漏的退化，schema 全幫你守住。

## 方法二：pydantic

如果你偏好用 Python 類別來描述模型，`pydantic` 更貼近型別註記的寫法：

```bash
pip install pydantic
```

```python
from pydantic import BaseModel

class BookingDates(BaseModel):
    checkin: str
    checkout: str

class Booking(BaseModel):
    firstname: str
    lastname: str
    totalprice: float
    depositpaid: bool
    bookingdates: BookingDates

def test_booking_model(auth_session):
    resp = auth_session.post(f"{BASE}/booking", json=NEW_BOOKING)
    Booking.model_validate(resp.json()["booking"])   # 不符就丟 ValidationError
```

pydantic 的好處是：驗證通過後你還拿到一個**型別清楚的物件**（`booking.totalprice` 有自動補全），後續斷言更安全。

## 兩者怎麼選

- **jsonschema**：標準格式、語言無關，schema 還能跟後端共用同一份 OpenAPI 定義，適合「契約就是 schema」的團隊。
- **pydantic**：Python 原生、寫起來像型別註記，驗完還給你好用的物件，適合純 Python 的測試專案。

不論哪個，重點是同一件事：**把結構驗證自動化，別再手寫一堆 `in` 和 `isinstance`。** 精確的業務值還是照樣個別斷言，但「結構對不對」交給 schema。

## 帶得走

- 回應結構別手寫斷言驗，描述成 schema 讓工具自動比對。
- `jsonschema`：標準、語言無關、可與後端 OpenAPI 共用。
- `pydantic`：Python 原生、像型別註記、驗完給你型別清楚的物件。
- schema 守結構（欄位、型別、必填），個別斷言守關鍵業務值，兩者分工。

下一篇：測試資料怎麼準備與清理，才能讓測試獨立、可重跑。
