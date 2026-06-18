---
tags: ['GitHub Actions', 'CI/CD', '自動化測試', 'TAU 課程筆記', 'QA 學習']
---

# 用 GitHub Actions 跑測試：TAU 課程完整筆記

QA 常遇到一個尷尬的狀況：測試寫好了，但只能手動跑。

每次要 release 就要記得跑一遍，忘了就出事。想要每個 PR 都跑？那就要每次手動觸發，或是依賴開發者幫你設定 CI。

GitHub Actions 解決了這個問題——而且比想像中容易上手。

這篇是我上完 Test Automation University 上 *GitHub Actions for Testing* 的完整筆記。課程用一個 Java + Playwright 的範例專案，從第一個 workflow 一路做到完整的 CI/CD pipeline，含部署和 E2E 測試整合。

---

## 課程概覽

**課程名稱**：GitHub Actions for Testing
**平台**：Test Automation University（免費）
**章節**：8 章
**技術**：GitHub Actions、YAML、Java（Maven）、Playwright

---

## GitHub Actions 是什麼？

GitHub Actions 是 GitHub 內建的 CI/CD 平台。你在 repo 裡放一個 YAML 檔，GitHub 就會在特定事件發生時自動執行你定義的任務。

### 和 Jenkins 的比較

很多公司用 Jenkins，GitHub Actions 和它有什麼不同？

| 維度 | Jenkins | GitHub Actions |
|------|---------|----------------|
| 主機 | 需要自己架設和維護 | GitHub 提供雲端 runner |
| 設定 | 需要安裝 plugin、設定 server | 只需要一個 YAML 檔 |
| 觸發 | 多種方式，設定較複雜 | 直接綁定 GitHub 事件 |
| 費用 | 基礎設施成本 | Public repo 免費；Private repo 有免費額度 |
| 整合 | 豐富的 plugin 生態 | 豐富的 Marketplace action 生態 |

對 QA 來說，最大的優勢是**GitHub Actions 和 repo 在同一個地方**，不需要另外維護一套 CI 系統，測試和程式碼的版本也自然同步。

---

## 核心概念：四層結構

GitHub Actions 有四個層次：

```
Event（事件）
  └── Workflow（工作流程）
        └── Job（工作）
              └── Step（步驟）
```

**Event**：觸發 workflow 的事件。例如 push、pull_request、排程、手動觸發。

**Workflow**：定義在 `.github/workflows/*.yml` 的 YAML 檔。一個 repo 可以有多個 workflow。

**Job**：workflow 裡的工作單元。多個 job 預設平行執行，可以用 `needs` 設定依賴關係（A 完成才跑 B）。

**Step**：job 裡的每一個步驟。可以是 shell 指令（`run:`）或是 Marketplace 的 action（`uses:`）。

---

## 觸發事件（Events）

Events 是 GitHub Actions 的核心——**你要在什麼情況下自動執行測試？**

幾個 QA 最常用的事件：

### workflow_dispatch：手動觸發

```yaml
on:
  workflow_dispatch:
```

加上這個，GitHub UI 裡的 Actions 頁面會出現「Run workflow」按鈕，隨時可以手動觸發。適合快速測試 workflow 是否正確，或是需要臨時跑一次的情境。

### push：有程式碼推入時

```yaml
on:
  push:
    branches:
      - 'feature/*'
```

每次推入特定分支就觸發。課程示範的是「只有 feature 分支的 push 才跑 unit test」，main 分支則走完整 pipeline。

### pull_request：PR 被建立或更新時

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches:
      - main
```

最常見的 QA 整合點——**每個 PR 都自動跑測試，通過了才能 merge**。

`types` 讓你控制在 PR 的哪些狀態下觸發。預設觸發的類型太多，通常只需要 `opened`（新建）、`synchronize`（新增 commit）、`reopened`（重新開啟）。

### schedule：排程執行

```yaml
on:
  schedule:
    - cron: "0 2 * * *"  # 每天凌晨 2 點
```

適合夜間完整回歸測試，或是定期健康檢查。

### repository_dispatch：API 觸發

```yaml
on:
  repository_dispatch:
    types: [trigger-tests]
```

這是最強大但最少人知道的觸發方式：可以從外部系統用 REST API 觸發 workflow，並傳入自訂的 payload。

例如：部署 pipeline 部署完成後，自動呼叫測試 repo 的 API，觸發 E2E 測試，並把剛部署的環境 URL 傳過去。這個模式讓測試和部署 pipeline 解耦，各自在不同 repo 維護。

---

## Runners：在哪裡執行？

**GitHub-hosted runners**：GitHub 提供的虛擬機器，每次建立全新環境。
- `ubuntu-latest`、`windows-latest`、`macos-latest`
- 不需要自己維護，但每次都要重新安裝依賴（可以用 cache 加速）

**Self-hosted runners**：自己架設在公司內部或雲端。
- 適合有安全規範（不能把程式碼上傳到 GitHub 雲端）或需要特殊硬體（iOS 測試需要 Mac）的情境
- 需要自己維護，但執行環境可以預先設定好

---

## Workflow 實用功能

### Artifacts：儲存測試產出物

測試執行後的報告、截圖、log，如果不主動儲存，workflow 結束就消失了。

```yaml
- name: Upload test report
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 30  # 儲存 30 天
```

GitHub 預設保存 90 天（免費版），可以在 UI 上直接下載。

### Caching：加速依賴安裝

每次 workflow 都要 `npm install` 或 `mvn dependency:resolve`？用 cache 大幅縮短執行時間：

```yaml
- name: Set up Node with cache
  uses: actions/setup-node@v3
  with:
    node-version: 18
    cache: 'npm'       # 自動 cache node_modules
```

Maven、Gradle、pip 都有對應的 cache 設定，`actions/setup-java`、`actions/setup-python` 都支援。

### 停用/啟用 Workflow

開發新 workflow 時，不需要刪掉舊的——在 Actions 頁面可以直接 Disable，測試完再 Enable 回來。

---

## 完整 CI/CD Pipeline 範例

課程示範了一個完整的 pipeline，分三個階段：

### 階段一：Build（持續整合）

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK 11
        uses: actions/setup-java@v3
        with:
          java-version: '11'
          distribution: 'temurin'
          cache: maven

      - name: Run Unit Tests
        run: mvn test

      - name: Static Code Analysis
        run: mvn checkstyle:check

      - name: Upload build artifact
        uses: actions/upload-artifact@v3
        with:
          name: app-jar
          path: target/*.jar
```

### 階段二：Deliver（持續交付）

部署到測試環境需要帳密，用 **Secrets** 儲存敏感資訊：

```yaml
  deploy:
    needs: build        # 等 build 完才執行
    runs-on: ubuntu-latest
    environment: test   # 使用 test 環境的 secrets
    steps:
      - name: Copy artifact to server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          password: ${{ secrets.SERVER_PASSWORD }}
          source: target/*.jar
          target: /app/

      - name: Start application
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          password: ${{ secrets.SERVER_PASSWORD }}
          script: |
            cd /app
            java -jar app.jar &
```

**Secrets vs Variables 的區別**：
- **Secret**：加密儲存，輸出時顯示 `***`。用於密碼、token、私鑰
- **Variable**：明文儲存，可讀取。用於 URL、環境名稱等非敏感設定

### 階段三：Test（E2E 測試）

測試用獨立的 repo 管理，透過 `repository_dispatch` 被呼叫：

```yaml
# 在 deploy repo 呼叫測試 repo
- name: Trigger E2E tests
  uses: actions/github-script@v6
  with:
    github-token: ${{ secrets.TEST_REPO_TOKEN }}
    script: |
      await github.rest.repos.createDispatchEvent({
        owner: 'my-org',
        repo: 'e2e-tests',
        event_type: 'trigger-tests',
        client_payload: {
          sut: '${{ steps.deploy.outputs.server_ip }}'
        }
      })
```

測試 repo 接收到事件後跑 Playwright E2E 測試，並上傳報告：

```yaml
# 在 e2e-tests repo
on:
  repository_dispatch:
    types: [trigger-tests]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - run: npm install
      - run: npx playwright install

      - name: Run E2E tests
        run: npx playwright test
        env:
          BASE_URL: ${{ github.event.client_payload.sut }}

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: always()   # 即使測試失敗也要上傳報告
        with:
          name: playwright-report
          path: playwright-report/
```

`if: always()` 很重要——確保測試失敗時也能上傳報告，否則失敗的報告你看不到。

---

## 自訂 Action

如果某些步驟在多個 workflow 重複出現，可以打包成自訂 action 重用。三種類型：

**Composite Action**：把多個步驟組合成一個 action，最常用

```yaml
# action.yml
name: 'Setup and Run Tests'
runs:
  using: composite
  steps:
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    - run: npm install
      shell: bash
    - run: npx playwright test
      shell: bash
```

**JavaScript Action**：用 JavaScript 撰寫，適合需要複雜邏輯的情境

**Docker Container Action**：把環境打包進 Docker，適合需要特定執行環境（只支援 Linux runner）

---

## 給 QA 的實用建議

**從最簡單的開始**：先讓 `workflow_dispatch` + 跑測試運作，確認 YAML 正確，再加觸發條件。

**PR 整合是最高 CP 值的投資**：每個 PR 都自動跑測試，從根本上改變團隊的品質意識。這件事不需要等開發者邀請，QA 自己就可以做到。

**`if: always()` 記得加在報告上傳**：測試失敗時你最需要看報告，但這時候預設不會上傳。

**善用 `repository_dispatch`**：把測試 workflow 和部署 workflow 分開，讓測試 repo 可以獨立版本控制，也可以從不同的部署 pipeline 觸發。

**Secrets 分環境管理**：測試環境和 production 的帳密分開設定，避免測試把 production 資料寫壞。

---

## 我的總結

GitHub Actions 最打動我的一點是：**它讓 QA 有能力自己設定 CI，不需要跟開發要權限或等待支援**。

只要有 repo 的權限，你就可以加 `.github/workflows/` 目錄，寫 YAML，讓測試在每個 PR、每個 push、每天凌晨自動跑。這件事過去需要懂 Jenkins、需要找 DevOps 幫忙設定，現在只需要學 YAML 語法。

這門課給了我足夠的基礎，讓我知道「遇到問題要去查什麼」，這對於一門工具課來說，已經是最重要的事了。

---

課程連結：[TAU - GitHub Actions for Testing](https://testautomationu.applitools.com/github-actions-for-testing/)

---

## 參考資料

- [Test Automation University — GitHub Actions for Testing](https://testautomationu.applitools.com/github-actions-for-testing/) — 本文課程來源
- [GitHub Actions — Official Documentation](https://docs.github.com/en/actions) — GitHub Actions 完整官方文件
- [GitHub — Building and Testing](https://docs.github.com/en/actions/use-cases-and-examples/building-and-testing) — CI 測試整合官方教學
- [Google DORA — Accelerate State of DevOps 2024](https://dora.dev/research/2024/dora-report/) — CI/CD 實踐與軟體交付效能的關聯
- [GitHub Blog — CI Best Practices](https://github.blog/engineering/infrastructure/optimize-your-github-actions-ci-cd-pipeline/) — GitHub Actions 最佳化建議
