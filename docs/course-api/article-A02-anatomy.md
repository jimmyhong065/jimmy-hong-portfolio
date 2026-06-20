---
title: 拿到「測一下這支 API」，你該先問清楚什麼？
excerpt: API 是一份契約。要測它，得先掌握契約的全貌——URL、方法、header、request body 每個欄位的限制、response 各種情境的回應。這篇給你一份可以照抄的「開測前資訊清單」。
tags: [API 測試, 契約, 需求分析, 入門]
status: draft
---

# 拿到「測一下這支 API」，你該先問清楚什麼？

主管丟來一句：「這支新的下單 API，你測一下。」

如果你直接打開工具開始亂打，那跟瞎子摸象沒兩樣。測一支 API 之前，要先把它的**契約**摸清楚——API 本質就是一份「你給我什麼、我回你什麼」的約定，測試就是在驗這份約定有沒有被準確實作。

## 開測前的資訊清單

一支 API 你至少要掌握這些：

**怎麼呼叫**

- 用途、使用規則、有沒有特別處理的情境。
- URL。
- HTTP 方法（GET／POST／PUT／PATCH／DELETE）。
- Header 參數（Cookie、Access Key、Authorization 等）。

**Request Body**

- 格式（Content-Type，例如 `application/json`）。
- 內容，以及**每個欄位的限制**——這一條最常被忽略，卻是設計用例的金礦：
  - 型別（string／int／float……）。
  - 字串的長度限制。
  - 可填的範圍（例如 `sex` 只能是 `female` 或 `male`）。
  - 是否必填。

**Response Body**

- 格式（Content-Type）。
- 成功情境：回傳內容 + HTTP status code。
- 失敗情境：各種錯誤會回什麼 + status code + error message。

## 為什麼欄位限制這麼重要

因為它直接長成你的測試用例。「`name` 最長 50 字」這一條限制，就生出至少三個 case：剛好 50（邊界內）、51（邊界外該被擋）、空值（必填驗證）。沒有這份限制清單，你的異常測試就只能用猜的。

## 把契約整理成一張表

以 `automationintesting.online` 的留言 API 為例，把蒐集到的資訊整理成這樣：

```
URL:    https://automationintesting.online/message/
Method: POST
Content-Type: application/json

Request Body:
  name        string  必填
  email       string  必填，需符合 email 格式
  phone       string  必填，長度有限制
  subject     string  必填
  description string  必填

Response:
  成功 → 201，回傳 messageId + 原內容
  失敗 → 400，回傳 fieldErrors 陣列
```

有了這張表，後面的用例設計、Python 腳本、schema 驗證才有依據。**測試的品質，從你掌握契約的完整度就決定了一半。**

## 帶得走

- API 是契約；開測前先把契約摸清楚，別急著打。
- 清單三大塊：怎麼呼叫、request body（含每欄位限制）、response（成功＋各種失敗）。
- 欄位限制會直接長成異常與邊界用例——這是最值錢的一塊資訊。

下一篇：如果這份契約根本沒有文件，怎麼辦？
