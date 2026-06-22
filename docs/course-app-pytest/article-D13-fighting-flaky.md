---
title: 對抗 flaky：穩定 locator、狀態清理、retry 與 quarantine
excerpt: flaky 測試比沒有測試更糟——它讓團隊不再相信紅燈。這篇講 flaky 的成因、怎麼用穩定 locator 和狀態清理治本，以及 retry 與 quarantine 該怎麼用而不是拿來遮蓋問題。
tags: [flaky, 測試穩定性, pytest, QA 實戰]
status: draft
---

# 對抗 flaky：穩定 locator、狀態清理、retry 與 quarantine

CI 亮紅燈，你重跑，綠了。沒有改任何程式碼——就這樣過了。這種感覺很熟悉吧？flaky 測試比完全沒有測試更危險，因為它訓練你忽略紅燈。一旦團隊學會「重跑就好」，真正的 bug 出現時，沒有人會認真看。

## flaky 的成因

flaky 通常來自這四個地方：

| 成因 | 描述 |
|------|------|
| **時序問題** | 沒等 UI 就繼續操作，`time.sleep` 猜秒數，CI 機器慢就掛 |
| **狀態殘留** | 上一條測試建的資料還留在 DB，下一條撞名衝突或撿到舊值 |
| **locator 脆弱** | 用 XPath 抓位置、用 class 抓動態 style，元件稍微改版就斷 |
| **環境差異** | 裝置效能不一、網路抖動、CI 跑在共享資源機器 |

前三項你可以治本；第四項才是真正的「隨機性」，也是 retry 唯一合理的用武之地。

## 治本：穩定 locator 與狀態清理

**穩定 locator** 的原則（承接 D04）：優先用 `accessibility id` 或 `resource-id`，不用 XPath 抓層級、不用 class 抓視覺。

```python
from appium.webdriver.common.appiumby import AppiumBy

# ❌ 脆弱：層級一改就斷
driver.find_element(AppiumBy.XPATH, "//android.widget.FrameLayout[2]/android.widget.Button")

# ✅ 穩定：語意 ID，重構不影響
driver.find_element(AppiumBy.ACCESSIBILITY_ID, "submit_btn")
```

**狀態清理** 要靠 fixture 在每條測試前後各做一次。不要假設上一條測試沒有留下痕跡。

```python
# conftest.py
import pytest
import requests

API_BASE = "http://localhost:8080/api"
HEADERS = {"Authorization": "Bearer test-token"}

@pytest.fixture(autouse=True)
def clean_test_user():
    """每條測試前先清掉測試帳號，跑完再清一次"""
    _delete_user("test_user@example.com")
    yield
    _delete_user("test_user@example.com")

def _delete_user(email: str):
    requests.delete(f"{API_BASE}/users", json={"email": email}, headers=HEADERS)
```

`autouse=True` 讓這個 fixture 在整個 scope 內自動套用，不必在每條測試手動掛。teardown 放在 `yield` 之後，即使測試中途失敗也保證執行。

顯式等待搭配乾淨狀態，把 flaky 機率壓到最低——承接 D12 的 `BasePage.wait_until_visible`，兩件事合在一起才完整。

## retry：何時用、何時不該用

`pytest-rerunfailures` 可以讓失敗的測試自動重跑：

```bash
pip install pytest-rerunfailures
pytest --reruns 2 --reruns-delay 1
```

重跑 2 次、每次間隔 1 秒。適用情境是**真正的隨機外部因素**——網路瞬斷、第三方 sandbox 偶爾逾時。

但 retry 不是萬靈丹，有幾個硬規則：

- **不該拿來遮蓋你自己程式的 bug**：retry 後才過，代表測試邏輯本身有問題，重跑只是在賭。
- **retry 次數要記錄**：`--reruns-delay` 加上 CI log，持續重跑才通過的測試要列追蹤清單。
- **持續 flaky 的必須查**：如果一條測試每次 CI 都要重跑第 2 次才過，它已經是一個訊號，不是「可以接受的噪音」。

## quarantine：隔離而非刪除

已知不穩的測試不該刪，也不該擋住主線 CI。正確做法是用 mark 打標籤，隔離進獨立排程。

```python
# tests/test_checkout.py
import pytest

@pytest.mark.flaky_quarantine
def test_known_unstable_payment_flow(driver):
    """第三方金流 sandbox 不穩，隔離等環境修好再解除"""
    ...
```

CI 主要 gate 排除這些測試：

```bash
pytest -m "not flaky_quarantine"
```

獨立排程（例如每天一次）單獨跑 quarantine 群：

```bash
pytest -m "flaky_quarantine" --reruns 3
```

quarantine 不是終點，是暫存區。每條打標的測試要開 ticket 追蹤原因和修復期限，否則它會永遠住在那裡。

## 帶得走

- flaky 的根源幾乎都是時序、狀態殘留、脆弱 locator——這三件事治好，大多數 flaky 消失。
- fixture 的 `yield` 前後各清一次狀態，`autouse=True` 確保沒有測試漏掉清理。
- retry 只適合真正的環境隨機性；拿它遮蓋邏輯問題，等於讓 bug 學會隱身。
- quarantine 是隔離不是放棄——打標、開 ticket、排程獨跑、設期限修復。
