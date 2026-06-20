---
title: 測試資料管理：讓每支測試獨立、可重跑
excerpt: 「昨天還會過的測試，今天紅了，但程式沒改。」元兇常常是測試資料。這篇講怎麼用 fixture 準備與清理資料、用唯一值避免衝突、讓每支測試自給自足，跑一百遍結果都一樣。
tags: [API 測試, Python, 測試資料, pytest]
status: draft
---

# 測試資料管理：讓每支測試獨立、可重跑

有一種 bug 最折磨人：「測試昨天還綠的，今天紅了，但程式一行都沒改。」十之八九，問題出在**測試資料**——資料被前一次跑髒了、或兩支測試在搶同一筆。

好的 API 測試有一個共同特徵：**每支測試自給自足，跑幾遍、用什麼順序跑，結果都一樣。** 這篇講怎麼做到。

## 原則一：自己造、自己清

每支測試該為自己準備需要的資料，跑完再清乾淨，不要依賴「資料庫裡本來就有某筆資料」。用 pytest fixture 的 `yield` 把「建立」和「清理」綁在一起：

```python
import pytest

@pytest.fixture
def a_booking(auth_session):
    # setup：建立一筆專屬這次測試的資料
    resp = auth_session.post(f"{BASE}/booking", json=NEW_BOOKING)
    booking_id = resp.json()["bookingid"]

    yield booking_id          # 把 id 交給測試用

    # teardown：測試結束後刪掉，不留垃圾給下一次
    auth_session.delete(f"{BASE}/booking/{booking_id}")


def test_update_booking(auth_session, a_booking):
    resp = auth_session.patch(f"{BASE}/booking/{a_booking}", json={"firstname": "James"})
    assert resp.json()["firstname"] == "James"
```

`test_update_booking` 不在乎資料庫原本有什麼——它要的那筆，fixture 現場造、用完即清。

## 原則二：用唯一值避免衝突

如果測試會建立「不能重複」的東西（帳號、email、訂單編號），寫死一個值就埋了地雷：第一次跑成功，第二次就撞「已存在」而失敗，於是測試**不可重跑**。

解法是每次都產一個唯一值：

```python
import uuid

def unique_username():
    return f"test_{uuid.uuid4().hex[:8]}"

# 或用時間戳
import time
email = f"qa_{int(time.time())}@example.com"
```

這樣同一支測試連跑十遍，每遍用的都是新身分，不會互撞。

## 原則三：測試之間不要有順序依賴

一個常見的反模式是：`test_create` 建了資料，`test_update` 假設它存在、`test_delete` 再把它刪掉——三支測試靠執行順序串在一起。

這很脆弱：單獨跑 `test_update` 會失敗、調換順序會壞、平行跑會互相打架。pytest 也不保證執行順序。

正解是讓**每支測試獨立**：需要一筆資料，就自己用 fixture 造（如原則一），而不是指望別的測試先幫它鋪好。共用的造資料邏輯放進 fixture 複用，但每支測試各拿各的。

## 原則四：環境要可重置

更大範圍看，整個測試環境最好能回到已知乾淨狀態：用獨立的測試資料庫、跑前 seed 基準資料、必要時整批清空。這樣「上次跑髒了」就不會變成今天的紅燈。這也呼應了測試該有的可重現精神——資料的狀態本身，就是一個變數。

## 帶得走

- 每支測試**自己造、自己清**，用 fixture 的 `yield` 綁定 setup/teardown，別依賴既有資料。
- 不可重複的欄位用 **uuid／時間戳**產唯一值，測試才可重跑。
- 別讓測試靠**執行順序**串在一起——每支獨立，共用造資料邏輯放 fixture。
- 大範圍上讓環境可重置（獨立測試庫、seed、清空），把資料這個變數控住。

下一篇進入模組 D：當依賴的第三方服務不可控，用 mock／stub 把它隔離掉。
