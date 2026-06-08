---
tags: ['pytest', 'Python', '自動化測試', 'TAU 課程筆記', 'QA 學習']
---

# pytest 從零開始：TAU 課程完整筆記

我用 pytest 已經一段時間了，但一直是「會用，但不懂為什麼這樣設計」的狀態。

Fixture 的 scope 怎麼設？`conftest.py` 和直接在測試檔定義 fixture 有什麼差？`@pytest.mark.parametrize` 的第二個參數是 list 還是 tuple？這些問題每次要查文件，說明我其實對這個框架理解還不夠深。

這篇是我上完 Test Automation University 上 *pytest Tutorial* 的完整筆記，加上自己的理解。課程從零開始，12 章，講師是 Automation Panda（Andrew Knight）。

---

## 課程概覽

**課程名稱**：pytest Tutorial
**平台**：Test Automation University（免費）
**講師**：Andrew Knight（Automation Panda）
**章節**：12 章
**語言**：Python

---

## 為什麼選 pytest？

pytest 不是 Python 唯一的測試框架。標準函式庫裡有 `unittest`，還有各種其他選擇。

但 pytest 有幾個獨特的地方，讓它成為 Python 測試生態的事實標準：

**1. 不需要繼承 class 就能寫測試**

`unittest` 要求測試必須放在繼承 `TestCase` 的 class 裡。pytest 只要函數名稱以 `test_` 開頭就會被自動發現：

```python
# unittest 的方式
class TestMath(unittest.TestCase):
    def test_one_plus_one(self):
        self.assertEqual(1 + 1, 2)

# pytest 的方式
def test_one_plus_one():
    assert 1 + 1 == 2
```

**2. 直接用 `assert`，不需要特殊方法**

`unittest` 有一整套 `assertEqual`、`assertTrue`、`assertIn`... pytest 讓你直接用 Python 原生的 `assert`，並且失敗時會自動顯示變數的值。

**3. Fixture 系統非常強大**（後面詳細說）

**4. 豐富的 plugin 生態**

---

## 核心功能 1：Assertion Introspection

這是 pytest 最讓我驚訝的功能之一。

當 assert 失敗時，pytest 不只告訴你「失敗了」，它會自動展示每個變數的值：

```python
def test_one_plus_two():
    a = 1
    b = 2
    c = 0
    assert a + b == c
```

執行失敗時，pytest 輸出：

```
FAILED test_math.py::test_one_plus_two
assert 3 == 0
  where 3 = 1 + 2
```

不需要加任何 print 或 log，pytest 自動解析 assert 表達式並顯示值。這叫 **Assertion Introspection**，在 debug 失敗測試時省了很多時間。

---

## 核心功能 2：測試例外（Exception Testing）

有時候我們要驗證某段 code 會拋出特定的例外。用 `pytest.raises`：

```python
import pytest

def test_divide_by_zero():
    with pytest.raises(ZeroDivisionError) as exc_info:
        result = 1 / 0

    assert 'division by zero' in str(exc_info.value)
```

`pytest.raises` 作為 context manager 使用：
- 進入 `with` 區塊時，開始監聽例外
- 離開時，檢查是否拋出了指定的例外類型
- 沒拋出 → 測試失敗；拋出的類型不對 → 測試失敗

---

## 核心功能 3：參數化測試（Parametrize）

這是消除重複測試程式碼的神器。

假設要測試乘法的多個邊界條件：

```python
# 重複且難維護的寫法
def test_multiply_positive():
    assert 2 * 3 == 6

def test_multiply_identity():
    assert 1 * 99 == 99

def test_multiply_zero():
    assert 0 * 100 == 0
```

用 `@pytest.mark.parametrize` 重構：

```python
import pytest

@pytest.mark.parametrize('a, b, expected', [
    (2,   3,   6),    # 正數相乘
    (1,   99,  99),   # identity
    (0,   100, 0),    # zero property
    (2,   -3,  -6),   # 正 × 負
    (-2,  -3,  6),    # 負 × 負
    (0.1, 0.2, pytest.approx(0.02)),  # 浮點數
])
def test_multiply(a, b, expected):
    assert a * b == expected
```

一個函數，六個測試。pytest 會自動展開，個別顯示每個 case 的結果。

`pytest.approx` 是處理浮點數比較的工具，0.1 × 0.2 在 Python 裡不完全等於 0.02，用 `pytest.approx` 可以設定容差範圍。

---

## 核心功能 4：Fixture

Fixture 是 pytest 最強大也最獨特的功能，值得細說。

### 什麼是 Fixture？

Fixture 是「測試的前置準備」——建立物件、連接資料庫、讀取設定檔等。

沒有 fixture 的寫法：

```python
def test_accumulator_init():
    accum = Accumulator()      # 每個測試都要建立
    assert accum.count == 0

def test_accumulator_add():
    accum = Accumulator()      # 重複！
    accum.add()
    assert accum.count == 1
```

用 fixture 重構：

```python
import pytest
from stuff.accum import Accumulator

@pytest.fixture
def accum():
    return Accumulator()       # 定義一次

def test_accumulator_init(accum):      # 傳入 fixture
    assert accum.count == 0

def test_accumulator_add(accum):       # 傳入 fixture
    accum.add()
    assert accum.count == 1
```

pytest 看到測試函數的參數名稱叫 `accum`，會自動找到同名的 `@pytest.fixture` 函數並呼叫它，把回傳值傳入測試。

### Fixture 的清理（yield fixture）

如果 fixture 需要在測試結束後清理資源（關閉連線、刪除測試資料），用 `yield` 代替 `return`：

```python
@pytest.fixture
def db_connection():
    conn = create_connection()   # setup
    yield conn                   # 把連線傳給測試
    conn.close()                 # teardown（測試結束後執行）
```

### Fixture 的 scope

預設每個測試都會重新執行 fixture（`scope="function"`）。如果 fixture 建立成本很高，可以設定更大的 scope：

| scope | 說明 |
|-------|------|
| `function`（預設）| 每個測試函數執行一次 |
| `class` | 每個 class 執行一次 |
| `module` | 每個模組（.py 檔）執行一次 |
| `session` | 整個測試執行期間只執行一次 |

### conftest.py

如果多個測試模組都需要同一個 fixture，把它放進 `conftest.py`，pytest 會自動讀取，不需要 import：

```
tests/
  conftest.py      ← fixture 定義在這裡，所有測試都能用
  test_api.py
  test_ui.py
```

---

## 核心功能 5：命令列選項和設定檔

### 常用命令

```bash
# 基本執行
python -m pytest

# 詳細輸出（每個測試一行）
python -m pytest -v

# 安靜輸出（只有點和 F）
python -m pytest -q

# 第一個失敗就停止
python -m pytest -x

# 最多允許 N 個失敗
python -m pytest --maxfail=3

# 顯示 print 輸出（預設被吞掉）
python -m pytest -s
```

### 過濾測試

```bash
# 只跑特定檔案
python -m pytest tests/test_api.py

# 只跑特定測試函數
python -m pytest tests/test_math.py::test_one_plus_one

# 用名字過濾（-k 支援 and / or / not）
python -m pytest -k "add or divide"
python -m pytest -k "not slow"

# 用 marker 過濾
python -m pytest -m smoke
```

### pytest.ini 設定檔

把常用設定寫進 `pytest.ini`，就不用每次都打長命令：

```ini
[pytest]
minversion = 6.0
addopts = -v --tb=short
testpaths = tests
markers =
    smoke: 冒煙測試
    regression: 回歸測試
    slow: 執行較慢的測試
```

---

## Plugin 生態

pytest 的 plugin 讓框架能力大幅延伸。幾個常用的：

**pytest-html**：產出 HTML 報告
```bash
pip install pytest-html
python -m pytest --html=report.html
```

**pytest-cov**：測試覆蓋率（搭配 coverage.py）
```bash
pip install pytest-cov
python -m pytest --cov=src --cov-report=html
```

**pytest-xdist**：平行執行測試，加速大型測試套件
```bash
pip install pytest-xdist
python -m pytest -n 4  # 用 4 個 process 平行跑
```

**pytest-playwright**：Playwright 的 pytest 整合（後面詳說）

---

## pytest 做 API 測試

pytest 不只能做 unit test，也能做整合測試。用 `requests` 套件呼叫 API：

```python
import requests

BASE_URL = 'https://jsonplaceholder.typicode.com'

def test_get_todos():
    response = requests.get(f'{BASE_URL}/todos/1')

    assert response.status_code == 200
    body = response.json()
    assert body['id'] == 1
    assert 'title' in body
    assert 'completed' in body
```

把 base URL 抽成 fixture，讓測試更乾淨：

```python
import pytest
import requests

@pytest.fixture
def base_url():
    return 'https://jsonplaceholder.typicode.com'

def test_get_todos(base_url):
    response = requests.get(f'{base_url}/todos/1')
    assert response.status_code == 200
```

---

## pytest 做 UI 測試（搭配 Playwright）

pytest-playwright 提供了幾個內建 fixture，讓 UI 測試的設定很簡單：

```bash
pip install playwright pytest-playwright
playwright install
```

```python
from playwright.sync_api import Page

def test_example_page(page: Page):
    page.goto('https://example.com')
    assert page.title() == 'Example Domain'
    page.get_by_role('link', name='More information').click()
    assert 'iana.org' in page.url
```

pytest-playwright 的 `page` 是內建 fixture，不需要自己建立 browser 和 page 物件。

Playwright 的優點：
- 內建自動等待（不需要 explicit wait）
- 速度比 Selenium 快
- 支援 Chromium、Firefox、WebKit

---

## 總結：pytest 的設計哲學

整門課下來，我覺得 pytest 的設計哲學是**讓測試盡量像普通 Python code**。

沒有特殊的繼承結構、沒有魔法方法、不需要記一堆 `assertXxx`。就是 Python 函數、Python 的 `assert`、加上幾個 decorator。

學 pytest 最值得花時間的三個東西：
1. **Fixture**：理解 scope、conftest、yield fixture
2. **`@pytest.mark.parametrize`**：消滅重複的測試
3. **`pytest.ini`**：把設定固化，不依賴命令列記憶

這三個搞懂了，pytest 就真的很好用。

---

課程連結：[TAU - pytest Tutorial](https://testautomationu.applitools.com/pytest-tutorial/)
