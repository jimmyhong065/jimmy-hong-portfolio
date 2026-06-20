---
title: 把 API 測試接進 CI：每次 PR 自動把關
excerpt: 測試寫得再好，沒接進 CI、靠人記得手動跑，防退化的能力就減半。這篇給你一個能跑的 GitHub Actions workflow，讓 pytest 在每次 PR 自動跑、失敗就擋合併，並把報告留下來。
tags: [API 測試, CI, GitHub Actions, pytest]
status: draft
---

# 把 API 測試接進 CI

你寫了一整套漂亮的 API 測試。但如果它只在你心血來潮時手動跑一次，那它防退化的能力就大打折扣——退化往往是別人合進來的，而那個人不會記得跑你的測試。

要讓測試真正有牙齒，得把它接進 CI：**每次 PR 自動跑，紅了就擋合併。**

## 為什麼這件事成立

兩件事串起來：

1. `pytest` 只要有任何一個測試失敗，就以**非零 exit code** 結束。
2. CI 步驟拿到非零 exit code → 該 job 失敗 → **PR 紅燈、擋住合併**。

所以只要測試寫對，效能退化、契約破壞、邏輯回歸，都會自動被擋在合併之前。

## 一個能跑的 workflow

`.github/workflows/api-tests.yml`：

```yaml
name: api-tests
on:
  pull_request:
    paths: ['src/**', 'tests/**']   # 動到程式或測試才跑
  workflow_dispatch:                 # 也允許手動觸發

jobs:
  pytest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run API tests
        run: pytest -v --junitxml=report.xml
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}     # 環境與機密走 secrets，別寫死

      - name: Upload test report
        if: always()                 # 失敗也要留報告
        uses: actions/upload-artifact@v4
        with:
          name: pytest-report
          path: report.xml
```

幾個重點：

- **`env` + `secrets`**：URL、帳密這類環境相關與機密資訊，走 GitHub Secrets 注入，絕不寫死在程式碼裡（這也呼應下一篇講的反模式）。
- **`--junitxml`**：產出標準格式的測試報告，CI 能解析、能當 artifact 留存。
- **`if: always()`**：測試失敗時 step 會中斷，但你**更想看**那份失敗的報告，所以上傳這步要無論成敗都跑。

## CI 裡跑哪些測試

不是每種測試都適合每次 PR 跑：

- **每次 PR**：快、穩、隔離良好的 API 測試（mock 掉不可控依賴的那些），幾秒到一兩分鐘跑完。
- **另外排（夜間／手動）**：真打第三方的整合測試、大規模或慢的測試——它們有價值，但太慢或太脆，不該卡每一個 PR。

把快測當 PR 門檻、慢測另外排，是讓 CI 既能擋退化、又不拖慢開發的平衡點。

## 帶得走

- 測試沒進 CI，防退化能力減半——退化常是別人合進來的。
- pytest 失敗→非零 exit→CI 紅燈→擋合併，這是自動把關的根基。
- 環境與機密走 **secrets**，別寫死；用 `--junitxml` 出報告、`if: always()` 保留它。
- 快穩的測試當 PR 門檻，慢或真打第三方的另外排。

下一篇：功能對了還不夠——API 在效能與安全的交界，QA 該補哪些。
