---
tags: ['BDD', 'pytest-bdd', 'Python', 'TAU 課程筆記', 'QA 學習']
---

# BDD 不只是工具，是溝通框架：pytest-bdd 完整筆記

你有沒有遇過這種情況：

PM 說「使用者登入後應該看到儀表板」，開發理解成「登入成功轉跳到 `/dashboard`」，QA 測試時發現「登入後出現歡迎彈窗，再跳轉儀表板」——三個人各自理解了同一個需求，但沒有一個版本完全對齊。

BDD 想解決的就是這個問題。

這篇是我上完 Test Automation University 上 *Behavior-Driven Python with pytest-bdd* 的完整筆記，加上自己的理解。課程 9 章，從 BDD 概念講到 API 測試和 UI 測試的完整實作。

---

## 課程概覽

**課程名稱**：Behavior-Driven Python with pytest-bdd
**平台**：Test Automation University（免費）
**講師**：Andrew Knight（Automation Panda）
**章節**：9 章
**語言**：Python

---

## BDD 到底在解決什麼問題？

軟體開發的速度越來越快，但有兩件事一直在受苦：**協作**和**測試自動化**。

常見的問題：
- PM 描述功能的方式、開發實作的方式、QA 測試的方式——三個人講的不是同一種語言
- 需求會議變成「猜謎遊戲」，而不是真正規劃
- 文件和測試案例被壓縮或跳過
- 測試自動化趕不上開發速度

BDD 的核心思想是：**把焦點拉回到功能的「行為（Behavior）」**。

行為是什麼？就是「在什麼情況下，做什麼動作，會得到什麼結果」。這個描述方式對 PM、開發、QA 都是可理解的，讓三方能用同一套語言溝通。

---

## Gherkin：讓需求變成可執行的規格

BDD 用 **Gherkin** 語言來描述行為。它看起來像是自然語言，但有固定結構：

```gherkin
Feature: 購物車
  身為一個網站使用者
  我想要把商品加入購物車
  以便之後結帳

  Scenario: 把商品加入空購物車
    Given 購物車是空的
    When 我把 1 個 "藍芽耳機" 加入購物車
    Then 購物車裡有 1 個商品
    And 購物車總金額是 "1299" 元
```

**Given**：前置狀態（系統在什麼情況下）
**When**：觸發動作（使用者做了什麼）
**Then**：預期結果（系統應該有什麼反應）

Gherkin 的優點是任何人都能讀懂，包含不懂程式的 PM 和業務人員。

---

## pytest-bdd 的結構：Feature File → Step Definitions

pytest-bdd 是 pytest 的 BDD 擴充套件。它的工作是把 Gherkin 的每一行，對應到 Python 的測試函數。

```
Feature File (.feature)          Step Definitions (.py)
─────────────────────────────    ──────────────────────────────
Given 購物車是空的          →    @given("購物車是空的")
                                 def step_empty_basket():
                                     ...

When 我把商品加入購物車      →    @when("我把商品加入購物車")
                                 def step_add_item():
                                     ...

Then 購物車裡有 1 個商品     →    @then("購物車裡有 1 個商品")
                                 def step_check_count():
                                     ...
```

### 安裝

```bash
pip install pytest-bdd
```

### 基本測試結構

**Feature File**（`tests/features/cucumber_basket.feature`）：

```gherkin
Feature: Cucumber Basket
  As a gardener,
  I want to carry cucumbers in a basket,
  So that I don't drop them all.

  Scenario: Add cucumbers to a basket
    Given the basket has 2 cucumbers
    When 4 cucumbers are added to the basket
    Then the basket contains 6 cucumbers
```

**Step Definitions**（`tests/step_defs/test_cucumber.py`）：

```python
from pytest_bdd import scenario, given, when, then
from cucumbers import CucumberBasket

@scenario('../features/cucumber_basket.feature',
           'Add cucumbers to a basket')
def test_add_cucumbers():
    pass

@given("the basket has 2 cucumbers")
def basket_with_2(basket):
    basket.add(2)

@when("4 cucumbers are added to the basket")
def add_4_cucumbers(basket):
    basket.add(4)

@then("the basket contains 6 cucumbers")
def basket_contains_6(basket):
    assert basket.count == 6
```

注意 `test_add_cucumbers` 函數本身是空的（只有 `pass`）——因為測試邏輯都在 step definitions 裡，這個函數只是把 scenario 和 Python 連接起來。

---

## 參數化 Steps

硬編碼數字的 step 無法重用。用 `parsers.cfparse` 讓 step 接受參數：

```gherkin
Scenario: Add cucumbers to a basket
  Given the basket has "2" cucumbers
  When "4" cucumbers are added to the basket
  Then the basket contains "6" cucumbers
```

```python
from pytest_bdd import parsers

@given(parsers.cfparse('the basket has "{initial:Number}" cucumbers',
                       extra_types={'Number': int}))
def basket_with_cucumbers(basket, initial):
    basket.add(initial)
```

雙引號是 Gherkin 的慣例，表示「這是可變動的值」，讓讀者一眼看出哪些是參數。

---

## Scenario Outline：一個場景，多組輸入

當同一個場景要用不同的輸入驗證時，用 **Scenario Outline** + **Examples** 表格：

```gherkin
Scenario Outline: Add cucumbers to a basket
  Given the basket has "<initial>" cucumbers
  When "<some>" cucumbers are added to the basket
  Then the basket contains "<total>" cucumbers

  Examples: Amounts
    | initial | some | total |
    | 0       | 3    | 3     |
    | 2       | 4    | 6     |
    | 5       | 5    | 10    |
```

`<initial>`、`<some>`、`<total>` 是佔位符，pytest-bdd 會用 Examples 表格的每一行展開成獨立的測試案例。這等同於 pytest 的 `@pytest.mark.parametrize`，但寫在 feature file 裡，連非技術人員也能讀懂。

---

## 實戰 1：REST API 測試

BDD 用在 unit test 上有點殺雞用牛刀——它真正的優勢是在**功能測試**上，因為 Gherkin 能描述有業務意義的行為。

用 `requests` 套件寫 API 測試：

```gherkin
Feature: DuckDuckGo Instant Answer API
  As an application developer,
  I want to get instant answers for search terms via a REST API.

  Scenario Outline: Basic DuckDuckGo API Query
    Given the DuckDuckGo API is queried with "<phrase>"
    Then the response status code is "200"
    And the response contains results for "<phrase>"

    Examples: Animals
      | phrase   |
      | panda    |
      | python   |
      | platypus |
```

```python
import requests
from pytest_bdd import scenario, given, then, parsers

@pytest.fixture
def context():
    return {}

@given(parsers.cfparse('the DuckDuckGo API is queried with "{phrase}"'))
def query_api(context, phrase):
    url = 'https://api.duckduckgo.com/'
    params = {'q': phrase, 'format': 'json'}
    context['response'] = requests.get(url, params=params)
    context['phrase'] = phrase

@then(parsers.cfparse('the response status code is "{code:Number}"',
                      extra_types={'Number': int}))
def check_status(context, code):
    assert context['response'].status_code == code
```

用 `context` fixture（一個 dict）在 steps 之間傳遞狀態，是 pytest-bdd 的常見模式，因為 Given → When → Then 各個 step 函數需要共享資料。

---

## 實戰 2：Web UI 測試

用 Selenium WebDriver + pytest-bdd 寫 UI 測試：

```gherkin
Feature: DuckDuckGo Web Browsing

  Background:
    Given the DuckDuckGo home page is displayed

  Scenario: Basic DuckDuckGo Search
    When the user searches for "panda"
    Then results are shown for "panda"
```

`Background`：每個 scenario 執行前都會先跑的共同前置步驟（相當於 `@pytest.fixture` + `autouse=True`）。

```python
from selenium import webdriver
from pytest_bdd import scenario, given, when, then, parsers
import pytest

@pytest.fixture
def browser():
    driver = webdriver.Firefox()
    yield driver
    driver.quit()   # 測試結束後自動關閉

@given("the DuckDuckGo home page is displayed")
def open_home_page(browser):
    browser.get('https://duckduckgo.com')

@when(parsers.cfparse('the user searches for "{phrase}"'))
def search(browser, phrase):
    search_box = browser.find_element_by_id('search_form_input_homepage')
    search_box.send_keys(phrase)
    search_box.submit()

@then(parsers.cfparse('results are shown for "{phrase}"'))
def check_results(browser, phrase):
    assert phrase.lower() in browser.title.lower()
```

---

## Tags：過濾要跑的測試

測試多了之後，不一定每次都要全跑。用 **tags** 分類：

```gherkin
@cucumber-basket
Feature: Cucumber Basket

  @add
  Scenario Outline: Add cucumbers...

  @remove
  Scenario Outline: Remove cucumbers...
```

```gherkin
@service @duckduckgo
Feature: DuckDuckGo API...

@web @duckduckgo
Feature: DuckDuckGo Web...
```

執行時用 `-m` 過濾：

```bash
# 只跑 cucumber basket 的測試
pytest -m "cucumber-basket"

# 只跑 add 相關
pytest -m "add"

# 跑所有 duckduckgo 相關（API + UI）
pytest -m "duckduckgo"

# 跑 web 但不跑 duckduckgo
pytest -m "web and not duckduckgo"
```

Tags 可以加在 Feature 層（整個 feature 都有這個 tag）或 Scenario 層（只有這個 scenario）。

---

## Shared Steps 和 Hooks：conftest.py

如果多個 feature file 共用相同的 step，把它們放進 `conftest.py`：

```
tests/
  step_defs/
    conftest.py          ← 共用 steps 和 hooks 放這裡
    test_cucumber.py
    test_service.py
    test_web.py
```

Hooks 讓你在測試執行的不同時間點插入邏輯：

```python
# conftest.py
from pytest_bdd import before_scenario, after_scenario, before_step

@before_scenario
def before_each_scenario(request, feature, scenario):
    print(f"\n開始執行：{scenario.name}")

@after_scenario
def after_each_scenario(request, feature, scenario):
    print(f"完成：{scenario.name}")
```

常見用途：
- 截圖（失敗時自動截圖）
- 清理測試資料
- 記錄測試執行 log

---

## BDD 值不值得導入？

課程沒有迴避這個問題。BDD 的成本：
- 要維護 feature file + step definitions 兩份檔案
- 非技術人員不一定真的會去讀 feature file
- 對小型或純技術的專案，BDD 可能是 over-engineering

BDD 真正有價值的情境：
- 有業務人員、PM、QA、開發**需要共同討論需求**的場景
- 測試案例需要被非技術人員理解和驗收
- 功能邊界複雜，需要明確的 Given/When/Then 來定義行為

如果你的團隊只有工程師，每個人都看得懂 code，直接用 pytest 可能更簡單。BDD 的核心是**協作**，不是工具本身。

---

## 我的總結

這門課讓我最有共鳴的一句話：

> *「返回到功能行為的焦點——這可能聽起來太簡單，但這些行為才是為終端使用者創造價值的東西。」*

BDD 最大的價值不是讓測試「看起來像英文」，而是**強迫大家在動手之前，先把行為說清楚**。

`Given the user is logged in / When they click "logout" / Then they see the login page` 這樣的描述，任何角色都能參與討論、確認、挑戰。這種對齊，是很多 bug 還沒出生就被消滅的原因。

---

課程連結：[TAU - Behavior-Driven Python with pytest-bdd](https://testautomationu.applitools.com/behavior-driven-python-with-pytest-bdd/)

---

## 參考資料

- [Test Automation University — Python BDD with pytest-bdd](https://testautomationu.applitools.com/pytest-bdd-tutorial/) — 本文課程來源
- [pytest-bdd — Official Documentation](https://pytest-bdd.readthedocs.io/en/stable/) — pytest-bdd 官方文件
- [Cucumber — BDD Overview](https://cucumber.io/docs/bdd/) — BDD 概念與 Given-When-Then 語法說明
- [Dan North — Introducing BDD](https://dannorth.net/introducing-bdd/) — BDD 發明者 Dan North 的原始論文
- [Gherkin Reference](https://cucumber.io/docs/gherkin/) — Gherkin 語法完整規範
