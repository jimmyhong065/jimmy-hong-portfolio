# API 測試從手動到自動化：工具選擇和我踩過的坑

---

## 目錄

1. [一開始用 Postman，用了兩年](#用-postman-兩年)
2. [Postman 不夠用的地方](#postman-不夠用)
3. [轉到 pytest + requests](#轉到-pytest)
4. [架構設計：讓 API 測試可以維護](#架構設計)
5. [結尾](#結尾)

---

## 一開始用 Postman，用了兩年

剛開始做 我們的 App 的 API 測試，我用 Postman。

理由很簡單：Postman 有 GUI，可以快速發 request，有 response 格式化，有 collection 可以管理。學習成本低，三十分鐘上手。

我建了一個 collection，幾十個 request 按照功能分組：auth、timer、reward、forest。每次測試的時候開 Postman，手動跑一遍。

這樣用了兩年。

---

## Postman 不夠用的地方

**1. 沒辦法跑 assertions**

Postman 有 Tests tab，可以寫 JavaScript 驗證 response。但這個功能很多人只用來驗 status code：

```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
```

更複雜的驗證——「確認 `coins_earned` 是正整數」、「確認 `tree_id` 存在於森林的 tree list 裡」——用 Postman 的 JavaScript 寫起來很麻煩，而且 debug 困難。

**2. 狀態依賴很難管理**

API 測試通常有依賴順序：先登入拿 token，再用 token 完成計時，再查詢森林確認樹木出現。

Postman 的 collection runner 可以做到，但一旦某個步驟失敗，很難知道是前置步驟的問題還是這個 API 本身的問題。

**3. 放進 CI 很痛**

Postman 有 Newman（command line runner），可以在 CI 跑 collection。但 collection 是 JSON 格式，在 git 裡 diff 很難看，review 改動很痛苦。

**4. 測試資料不好管理**

不同的測試情境需要不同的前置資料：免費帳號、Pro 帳號、有種植紀錄的帳號、沒有的帳號。這些在 Postman 靠 environment variables 管，但複雜之後很難維護。

---

## 轉到 pytest + requests

現在我的 API 測試用 Python pytest + requests。

```python
import pytest
import requests

BASE_URL = "https://staging.example.com/api/v1"

@pytest.fixture
def auth_token(new_user):
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": new_user["email"],
        "password": new_user["password"]
    })
    return response.json()["token"]

def test_complete_timer_coins_credited(auth_token):
    # 完成一次計時
    complete_resp = requests.post(
        f"{BASE_URL}/sessions/complete",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"duration": 25, "tree_type": "oak"}
    )
    assert complete_resp.status_code == 200
    coins_earned = complete_resp.json()["coins_earned"]
    assert isinstance(coins_earned, int)
    assert coins_earned == 25

    # 確認帳號硬幣更新
    wallet_resp = requests.get(
        f"{BASE_URL}/wallet",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert wallet_resp.json()["coins"] == coins_earned
```

為什麼比 Postman 好：

- **pytest fixture** 管理前置狀態，可以重用、可以組合
- **assertions 用 Python 寫**，表達能力強，debug 訊息清楚
- **git 友好**，純文字，PR 的 diff 一目了然
- **放進 CI 直接跑**，一個 `pytest` 指令

---

## 架構設計：讓 API 測試可以維護

剛轉到 pytest 的時候，我把所有 request 直接寫在 test function 裡。一個月後，test file 越來越長，URL、header、request body 到處重複。

現在的結構：

```
api_tests/
├── conftest.py          # fixtures：auth token、測試用帳號、清理
├── clients/
│   ├── auth_client.py   # 登入、登出、token 管理
│   ├── timer_client.py  # 計時相關的 API wrapper
│   └── reward_client.py # 硬幣、獎勵相關
├── tests/
│   ├── test_timer.py
│   ├── test_reward.py
│   └── test_subscription.py
└── data/
    └── test_scenarios.yaml  # 測試情境的參數
```

`clients/` 是 API 的抽象層，每個 client 封裝 request 的細節：

```python
# clients/timer_client.py
class TimerClient:
    def __init__(self, token: str):
        self.headers = {"Authorization": f"Bearer {token}"}

    def complete_session(self, duration: int, tree_type: str) -> dict:
        resp = requests.post(
            f"{BASE_URL}/sessions/complete",
            headers=self.headers,
            json={"duration": duration, "tree_type": tree_type}
        )
        resp.raise_for_status()
        return resp.json()
```

Test file 只關心業務邏輯：

```python
def test_pro_user_earns_double_coins(pro_auth_token):
    client = TimerClient(pro_auth_token)
    result = client.complete_session(duration=25, tree_type="oak")
    assert result["coins_earned"] == 50  # Pro 倍率
```

這個結構讓 API 改動的時候，只需要修改 client，不需要在所有 test file 裡找到所有相關的 request 一個一個改。

---

## 幾個踩過的坑

**1. 不要在測試裡呼叫太多 API**

「計時完成 → 查森林 → 確認樹木 → 查帳號 → 確認硬幣」這個流程全部放在一個 test 裡，測試失敗的時候你不知道哪一步出了問題。

每個 test 盡量只驗一件事，依賴關係用 fixture 處理。

**2. 測試資料的清理**

每個 test 完成後，建立的測試資料要清理掉，否則測試之間會有狀態污染。

用 pytest fixture 的 teardown：

```python
@pytest.fixture
def new_user():
    user = create_test_user()
    yield user
    delete_test_user(user["id"])  # 測試完成後自動清理
```

**3. 環境的 base URL 要參數化**

不要把 staging URL 寫死在 code 裡。用環境變數，讓同一套測試可以指向不同環境。

```python
BASE_URL = os.getenv("API_BASE_URL", "https://staging.example.com/api/v1")
```

---

## 結尾

從 Postman 轉到 pytest 不是因為 Postman 不好，是因為我的需求超過了 Postman 的適用範圍。

Postman 適合：快速探索 API、手動測試、小型的非自動化 collection。

pytest + requests 適合：放進 CI 的自動化 API 測試、複雜的前置條件管理、需要長期維護的測試套件。

工具的選擇應該跟著需求走，不是跟著「什麼最流行」走。
