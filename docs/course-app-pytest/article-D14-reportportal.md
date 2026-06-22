---
title: 測試報告：接進 ReportPortal，把結果變團隊看得到的儀表板
excerpt: 終端機的 pass/fail 只有你看得到。接進 ReportPortal，測試結果變成即時儀表板——歷史趨勢、失敗自動分類、附截圖與 log。這篇講 pytest 怎麼接 ReportPortal，以及失敗時自動附截圖。
tags: [ReportPortal, 測試報告, pytest, QA 實戰]
status: draft
---

# 測試報告：接進 ReportPortal，把結果變團隊看得到的儀表板

你跑完一輪回歸，終端機顯示「23 passed, 2 failed」。然後呢？截圖貼 Slack？每次都要手動說明哪裡壞了？這不叫報告，叫廣播。真正的報告是讓開發、PM、測試主管，不用問你就能自己看到品質狀態——那就是 ReportPortal 在做的事。

## 為什麼要 ReportPortal

終端機的輸出是一次性的；ReportPortal 把每次執行的結果持久化進儀表板：

| 能力 | 說明 |
|------|------|
| **即時結果** | 測試跑完自動推送，不用人工上傳 |
| **歷史趨勢** | 看到這條測試是「一直不穩」還是「這版才壞」 |
| **失敗自動分類** | 同一個錯誤訊息的失敗自動歸群，一眼看出影響範圍 |
| **附截圖與 log** | 失敗當下的畫面和完整 log 直接在 RP 裡看，不用回去翻 CI |

這讓 QA 不必每次開完 CI 都要當翻譯，品質狀態直接可視化給整個團隊。

## pytest 接 RP

安裝套件：

```bash
pip install pytest-reportportal
```

在 `pytest.ini` 加入 RP 設定：

```ini
[pytest]
rp_endpoint = https://reportportal.example.com
rp_project = mobile_qa
rp_launch = App 回歸
rp_api_key = your_api_key_here
rp_launch_attributes = env:staging version:1.4.2
```

- `rp_endpoint`：你的 ReportPortal 伺服器 URL。
- `rp_project`：RP 後台的專案名稱，要先建好。
- `rp_launch`：這次執行顯示的標題；可以在 CI 用環境變數帶入版本號。
- `rp_api_key`：從 RP 個人設定頁取得；建議存進 CI secrets，不要寫死。
- `rp_launch_attributes`：附加標籤，方便後台篩選（環境、版本、branch）。

跑測試時加 `--reportportal` flag，結果就會即時推送：

```bash
pytest --reportportal
```

CI pipeline 裡通常長這樣：

```bash
pytest tests/ --reportportal \
  -v \
  --tb=short \
  -m "not flaky_quarantine"
```

## 失敗自動附截圖

RP 接了結果還不夠——失敗時的截圖才是讓開發馬上定位問題的關鍵。在 `conftest.py` 掛 `pytest_runtest_makereport` hook：

```python
# conftest.py
import pytest
import logging

logger = logging.getLogger(__name__)


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()

    if report.when == "call" and report.failed:
        driver = item.funcargs.get("driver")
        if driver:
            png = driver.get_screenshot_as_png()
            # RP handler 會攔截 logging 輸出並附到當前 test item
            logger.error(
                "Screenshot on failure",
                extra={"attachment": {"name": "screenshot.png",
                                      "data": png,
                                      "mime": "image/png"}},
            )
```

`pytest_runtest_makereport` 在每個測試階段（setup / call / teardown）都會觸發；只攔 `call` 階段失敗，避免 setup 錯誤也截圖產生誤導。`logger.error` 搭配 `extra["attachment"]` 是 `pytest-reportportal` 的附件協議——RP handler 會把這包資料上傳成附件，直接掛在失敗的 test item 下面。

如果測試同時需要附文字 log（例如 API response body），同樣透過 `logger` 傳：

```python
logger.error("API response: %s", response_text)
```

## 怎麼讀 RP

RP 最有價值的功能是**失敗分類**（Defect Type）。每個失敗預設進「To Investigate」，QA 看完之後要手動標記：

| 分類 | 意義 | 後續動作 |
|------|------|----------|
| **Product Bug** | 產品功能壞了 | 開 bug ticket 給開發 |
| **Automation Bug** | 測試程式本身的問題（selector 過期、斷言邏輯錯） | QA 修測試，不開 bug |
| **System Issue** | 環境、裝置、網路問題 | 通知 DevOps / Infra，重跑確認 |

把同一批失敗分類完，RP 的 Launch 頁就會顯示圓餅圖，讓團隊一眼看出這次回歸「是品質問題還是環境問題」——這個判讀直接影響下一步是擋發布還是重跑。

RP 的歷史趨勢圖讓你看出某條測試是「三個 sprint 前就開始不穩」，而不是「這次才壞」。這種脈絡在復盤和優先排序時非常重要，靠終端機 log 根本回不去看。

## 帶得走

- `pytest-reportportal` 加三行 `pytest.ini`，`--reportportal` flag 就能推送；CI 裡用 secrets 存 `rp_api_key`。
- `pytest_runtest_makereport` hook 在 `call` 失敗時截圖，透過 `logger.error + extra["attachment"]` 附到 RP，不需要額外 plugin。
- 跑完要標記失敗分類：Product Bug / Automation Bug / System Issue——這三個標籤讓「紅燈」有意義，而不只是數字。
- RP 歷史趨勢是做 flaky 追蹤的補充視角：承接 D13 的 quarantine，在 RP 裡能看到某條測試的「不穩頻率」是多高。
