# 測試資料管理：為什麼你的測試環境總是一團亂

---

## 目錄

1. [那個帳號昨天還能用，今天就不行了](#那個帳號今天不行了)
2. [測試資料亂的幾種形式](#幾種形式)
3. [我現在怎麼管理測試資料](#怎麼管理)
4. [建 seed script 的實際做法](#seed-script)
5. [結尾](#結尾)

---

## 那個帳號昨天還能用，今天就不行了

我們的 App 的 staging 環境，我有一個長期使用的測試帳號：`qa_test_pro@example.com`，Pro 訂閱，有 3 棵樹，硬幣 500 枚。

有一天我在測訂閱到期的行為，需要把這個帳號的訂閱設成過期。我在 staging DB 直接改了 `subscription_expires_at`。

測試完了，忘了改回來。

隔天要測 Pro 功能，帳號的訂閱是過期的，Pro 功能全部鎖定，我測了半小時才想到可能是帳號狀態的問題。

再往前推一週：另一個 QA 同事也在用這個帳號，他加了幾棵測試用的樹，然後也忘了清。現在帳號裡有 11 棵樹，如果我在測「首次種樹的行為」，我需要一個完全沒有種植紀錄的帳號——但我這個用了太久的帳號已經無法提供這個狀態了。

這是測試資料管理失控的典型症狀。

---

## 測試資料亂的幾種形式

**1. 共用帳號狀態被污染**

多個人或多次測試共用同一批帳號，每次測試留下的狀態殘留，下次測試的時候不知道帳號是什麼狀態，前置條件不確定。

**2. 測試之間有隱性依賴**

A 測試建立了一個計時 session，B 測試依賴那個 session 存在。如果 A 先跑，B 才能過；如果 B 先跑，B 就失敗。

這種依賴讓測試的順序很重要，但測試套件應該要能在任意順序下跑。

**3. Staging 環境資料越積越多**

每次測試建立的計時 session、種植紀錄、測試帳號，如果沒有清理，幾個月後 staging DB 裡有幾十萬筆測試資料。某些查詢開始變慢，某些測試開始因為資料量太大而行為異常。

**4. 前置條件需要手動設定**

測試「連結帳號首次種樹」，需要一個用 Google 登入、沒有種植紀錄的帳號。每次都要手動建帳號、手動連結 Google OAuth、手動確認狀態。

每次設定 15 分鐘。每週測五次。一週耗掉 75 分鐘在準備前置條件。

---

## 我現在怎麼管理

**原則一：測試資料獨立，不共用**

每個測試用的帳號，只在那個測試的生命週期內存在。測試開始建立，測試結束清理。

不是「每個人有自己的帳號」，是「每次測試有自己的帳號」。

**原則二：狀態要可以重置**

任何我需要的帳號狀態，應該可以用一個指令重置，不依賴手動操作。

**原則三：測試完就清**

建了什麼就清什麼。Fixture teardown 是標準做法，不是選項。

---

## 建 seed script 的實際做法

我們的 App 的測試資料 seed script：

```python
# scripts/seed_test_data.py

def create_fresh_account(account_type: str = "free") -> dict:
    """建立全新帳號，沒有任何種植紀錄"""
    email = f"qa_test_{uuid4().hex[:8]}@test.com"
    user = api.create_user(email=email, password="test1234")

    if account_type == "pro":
        api.set_subscription(user_id=user["id"], status="active",
                             expires_at=datetime.now() + timedelta(days=30))

    return {"id": user["id"], "email": email, "password": "test1234"}


def create_account_with_trees(tree_count: int = 3) -> dict:
    """建立有種植紀錄的帳號"""
    user = create_fresh_account()
    for _ in range(tree_count):
        api.plant_tree(user_id=user["id"], tree_type="oak",
                       session_duration=25)
    return user


def cleanup_account(user_id: str):
    """清除帳號和所有相關資料"""
    api.delete_user(user_id=user_id)  # cascade delete
```

在 pytest 裡用 fixture 包起來：

```python
@pytest.fixture
def fresh_free_account():
    user = create_fresh_account("free")
    yield user
    cleanup_account(user["id"])

@pytest.fixture
def fresh_pro_account():
    user = create_fresh_account("pro")
    yield user
    cleanup_account(user["id"])

@pytest.fixture
def account_with_history():
    user = create_account_with_trees(tree_count=5)
    yield user
    cleanup_account(user["id"])
```

Test 只需要宣告它需要什麼狀態：

```python
def test_first_time_planting(fresh_free_account):
    # 保證這個帳號沒有任何種植紀錄
    ...

def test_pro_tree_unlocked(fresh_pro_account):
    # 保證這個帳號是 Pro 訂閱
    ...
```

不需要手動建帳號，不需要確認帳號狀態，不需要事後清理。

---

## 一個現實問題：Staging DB 的清理

就算有 fixture teardown，staging DB 還是會累積一些「孤兒資料」：測試中途失敗沒有清理的、手動測試建的、忘了加 teardown 的。

我的做法是：每個月跑一次清理 script，刪除 `email` 以 `qa_test_` 開頭的帳號和 30 天以上沒有活動的測試資料。

這不是完美的解法，但 80% 的情況下夠用了。

---

## 結尾

測試資料管理的問題通常是慢慢嚴重的：一開始沒什麼影響，幾個月後環境越來越混亂，每次測試開始之前都要花時間確認帳號狀態，測試失敗的時候很難判斷是功能問題還是資料狀態問題。

建 seed script 的初始成本不大，但長期下來省掉的時間和除錯成本很可觀。

如果你現在的測試環境狀態讓你不確定，從這裡開始：列出你最常需要的 5 種帳號狀態，把建立這些狀態的步驟腳本化。這一件事，能改善你大部分的前置條件問題。
