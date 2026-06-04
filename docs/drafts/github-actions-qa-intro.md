# QA 工程師的第一條 GitHub Actions Pipeline

---

## 目錄

1. [為什麼我的測試要靠人工觸發才跑](#人工觸發)
2. [GitHub Actions 是什麼，用 QA 的語言說](#是什麼)
3. [四個你需要懂的概念](#四個概念)
4. [第一條 workflow：PR 開出來就跑測試](#第一條-workflow)
5. [跑完測試，怎麼看結果](#看結果)
6. [2026 年跑 CI 比以前便宜了](#便宜了)
7. [下一步可以做什麼](#下一步)

---

## 為什麼我的測試要靠人工觸發才跑

我之前的工作流程是這樣的：

1. RD 說「我改完了」
2. 我去測
3. 測完說「可以上了」

每一個環節都靠人工。測試什麼時候跑，取決於我有沒有空、有沒有被通知到、有沒有忘記。

這個流程有一個很大的問題：**每次測試的起點是人，而人是不穩定的。**

有時候 RD 忘記通知，功能就直接合進去了。有時候我在忙別的，測試就晚了一天。有時候上線後才發現某個基本流程壞掉，但那個功能上週就改了，只是沒有人跑測試。

GitHub Actions 解決的就是這個問題：**讓測試的觸發點從「人」變成「事件」。**

---

## GitHub Actions 是什麼，用 QA 的語言說

GitHub Actions 是一個自動化系統，當你的 code repository 發生某件事（有人開 PR、有人 merge、有人推 commit），它就自動去做你指定的工作。

對 QA 來說，最常用的場景是：

> **有人開 PR → 自動跑測試 → 回報結果**

你設定好規則之後，不需要任何人手動觸發。只要有 PR 開出來，測試就跑。跑完告訴你通過還是失敗。

這件事聽起來很技術，但設定起來並不難——它的核心就是一個 YAML 檔案。

---

## 四個你需要懂的概念

在看任何 GitHub Actions 設定之前，先把這四個詞搞清楚：

```
Workflow
└── Trigger（什麼時候跑）
└── Job（做什麼大工作）
    └── Step（一步一步怎麼做）
```

**Workflow**：整個自動化流程的描述，存成一個 `.yml` 檔案放在 `.github/workflows/` 資料夾。

**Trigger**：什麼事件會觸發這個 workflow。常用的：
- `push`：有人推 code
- `pull_request`：有人開 PR 或更新 PR
- `schedule`：定時跑（像 cron job）
- `workflow_dispatch`：手動觸發

**Job**：一個 workflow 裡可以有多個 job，每個 job 跑在獨立的虛擬機器上，job 之間可以設定相依關係。

**Step**：Job 裡的每一個步驟。可以是 shell 指令，也可以是別人寫好的 action（GitHub Marketplace 有很多現成的）。

---

## 第一條 workflow：PR 開出來就跑測試

以下是一個最基本的範例，讓你在每次 PR 的時候自動跑 Python 的測試：

```yaml
# .github/workflows/run-tests.yml
name: Run Tests on PR

on:
  pull_request:
    branches: [main, develop]  # 只在這兩個 branch 的 PR 觸發

jobs:
  test:
    runs-on: ubuntu-latest  # 用 GitHub 提供的 Ubuntu 虛擬機

    steps:
      - name: 拉下程式碼
        uses: actions/checkout@v4

      - name: 安裝 Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: 安裝相依套件
        run: pip install -r requirements.txt

      - name: 跑測試
        run: pytest tests/ -v
```

這個檔案放進去之後，每次有人對 `main` 或 `develop` 開 PR，GitHub 就會自動：
1. 啟動一台乾淨的 Ubuntu 虛擬機
2. 把 code 拉下來
3. 安裝 Python 和套件
4. 跑 pytest

全程不需要任何人手動做任何事。

---

## 跑完測試，怎麼看結果

跑完之後，PR 頁面下方會出現一個 checks 的狀態：

- ✅ 綠色：所有測試通過
- ❌ 紅色：有測試失敗，可以點進去看 log

這個狀態可以設成「必須通過才能 merge」，讓 RD 沒辦法在測試紅燈的情況下把 code 合進去。

**上傳測試報告當 artifact：**

如果你想保留每次跑的測試報告，可以加一個步驟：

```yaml
      - name: 上傳測試報告
        uses: actions/upload-artifact@v4
        if: always()  # 不管測試通過失敗都上傳
        with:
          name: test-report
          path: reports/
          retention-days: 14
```

`if: always()` 很重要——如果不加，測試失敗的時候這一步就會被跳過，你就看不到失敗的 log 了。

---

## 2026 年跑 CI 比以前便宜了

2026 年 1 月，GitHub 把 hosted runner 的費用降了最多 39%。

對 QA 來說，最實際的意義是：**如果你用 GitHub Actions 跑自動化測試，成本比之前低不少。**

Public repository 的 runner 使用依然免費。Private repository 有每月的免費額度（Free 方案 2000 分鐘/月），超過才計費。對於中小型專案，通常免費額度就夠了。

---

## 下一步可以做什麼

第一條 workflow 跑通之後，可以往這幾個方向延伸：

| 方向 | 怎麼做 |
|------|--------|
| 跑 Android Appium 測試 | 加 `reactivecircus/android-emulator-runner` |
| 跑多個 Python/Node 版本 | 用 `matrix` 策略 |
| 定時回歸測試 | trigger 改成 `schedule: cron` |
| 測試失敗時通知 Slack | 加 Slack notification action |
| 發布測試報告到 GitHub Pages | 加 Allure report + gh-pages deploy |

GitHub Actions 的好處是每一個擴充都是獨立的步驟，你可以慢慢加，不需要一次全部設定好。

先讓最基本的「PR 開出來就跑測試」跑通，其他的等你需要的時候再加。

---

*參考資料：[GitHub Actions 官方文件](https://docs.github.com/en/actions) ／ [GitHub Actions 2026 定價調整](https://github.com/resources/insights/2026-pricing-changes-for-github-actions)*
