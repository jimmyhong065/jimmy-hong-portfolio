---
title: 測試資料與參數化：一份腳本跑多組資料
excerpt: 同一個流程要測十組輸入，不該複製十次測試。這篇講用 pytest parametrize 把資料和腳本分開、把測試資料外部化，以及用帳號池避免併發時帳號互相干擾。
tags: [pytest, parametrize, 測試資料, QA 實戰]
status: draft
---

# 測試資料與參數化：一份腳本跑多組資料

登入測試要驗正確帳號、錯誤密碼、空白欄位——三個情境，邏輯完全一樣，差的只是輸入和預期結果。把同一段腳本複製三次，下次登入頁改版，你就要改三個地方。pytest 的 `parametrize` 是正解：一份腳本，資料自己帶。

## parametrize 基礎

用 `@pytest.mark.parametrize` 把資料和腳本分開，pytest 會自動展開成多個測試案例：

```python
# tests/test_login.py
import pytest
from appium.webdriver.common.appiumby import AppiumBy
from pages.login_page import LoginPage

@pytest.mark.parametrize("user, pw, expected", [
    ("demo", "correct", "home_title"),
    ("demo", "wrong",   "error_msg"),
    ("",     "",        "error_msg"),
])
def test_login(driver, user, pw, expected):
    LoginPage(driver).login(user, pw)
    # 這裡直接用 find_element 示範是為了簡化範例；
    # 正式專案建議把 locator 封裝進 Page Object，測試不直接碰 By。
    assert driver.find_element(AppiumBy.ACCESSIBILITY_ID, expected).is_displayed()
```

執行後 pytest 會顯示三筆獨立測試：
`test_login[demo-correct-home_title]`、`test_login[demo-wrong-error_msg]`、`test_login[--error_msg]`。
哪組失敗一目了然，不用猜。

## 資料外部化

隨著情境增多，把資料硬寫在腳本裡會讓 `parametrize` 清單越來越長，而且測試資料和程式邏輯綁在一起——行銷要加一組測試帳號，還得動程式碼。把資料改放 JSON，腳本只負責讀進來：

```json
// tests/data/login_cases.json
[
  {"user": "demo",  "pw": "correct", "expected": "home_title"},
  {"user": "demo",  "pw": "wrong",   "expected": "error_msg"},
  {"user": "",      "pw": "",        "expected": "error_msg"},
  {"user": "admin", "pw": "correct", "expected": "home_title"}
]
```

```python
# tests/test_login_from_file.py
import json
import pathlib
import pytest
from appium.webdriver.common.appiumby import AppiumBy
from pages.login_page import LoginPage

_DATA_FILE = pathlib.Path(__file__).parent / "data" / "login_cases.json"

def _load_cases():
    cases = json.loads(_DATA_FILE.read_text(encoding="utf-8"))
    return [(c["user"], c["pw"], c["expected"]) for c in cases]

@pytest.mark.parametrize("user, pw, expected", _load_cases())
def test_login_from_file(driver, user, pw, expected):
    LoginPage(driver).login(user, pw)
    assert driver.find_element(AppiumBy.ACCESSIBILITY_ID, expected).is_displayed()
```

新增情境只改 `login_cases.json`，腳本零修改。同樣的模式也適用 YAML——把 `json.loads` 換成 `yaml.safe_load` 即可，結構不變。

## 帳號池：避免併發干擾

用 `pytest-xdist` 開多個 worker 跑測試時，如果所有 worker 都用同一組帳號登入，後台 session 會互踢，測試互相干擾。解法是帳號池：每個 worker 拿走一個專屬帳號，跑完再還回去。

```python
# conftest.py（加在 driver fixture 旁）
import queue
import pytest

# 準備足夠 worker 數量的測試帳號
_ACCOUNT_POOL: queue.Queue = queue.Queue()
for _acc in [
    {"user": "qa_worker_1", "pw": "pw1"},
    {"user": "qa_worker_2", "pw": "pw2"},
    {"user": "qa_worker_3", "pw": "pw3"},
]:
    _ACCOUNT_POOL.put(_acc)

@pytest.fixture
def account():
    """每個測試從池子拿一組帳號，測完歸還。"""
    acc = _ACCOUNT_POOL.get(timeout=30)   # 超過 30 秒拿不到就 fail，避免死等
    yield acc
    _ACCOUNT_POOL.put(acc)
```

```python
# tests/test_profile.py
from pages.login_page import LoginPage
from pages.profile_page import ProfilePage

def test_profile_display(driver, account):
    LoginPage(driver).login(account["user"], account["pw"])
    page = ProfilePage(driver)
    assert page.username_is_shown()
```

每個 worker 各自拿到不同帳號，同時跑三個測試也不會互踢 session。帳號數量設成和 `-n` 的 worker 數一致，多了浪費、少了 `get(timeout=30)` 會讓測試 fail 而不是卡死。

## 帶得走

- `@pytest.mark.parametrize` 把資料和流程分開；一份腳本展開成多筆測試，失敗訊息帶參數值，定位問題快。
- 情境超過五組就考慮外部化——JSON/YAML 檔只放資料，腳本只負責讀；新增情境零改程式。
- 併發跑測試時，共用帳號會互踢 session；帳號池（`queue.Queue`）讓每個 worker 各拿一組，跑完自動歸還。
- 帳號池數量對齊 `-n` 的 worker 數；用 `timeout` 而非無限等待，跑不到帳號就快速 fail，不卡 CI。
