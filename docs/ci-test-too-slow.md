---
tags: ['CI/CD', 'DevOps', '測試策略', 'GitHub Actions', '自動化測試']
---

# CI 測試跑太慢？平行化策略與最佳化

CI 跑太慢的問題通常是這樣開始的：一開始 10 分鐘，大家覺得還好。半年後功能多了，變成 25 分鐘。再半年，40 分鐘。開發者開始不等 CI 結果，直接 merge。

40 分鐘的 CI 不是「慢一點」，而是「大家已經放棄等它」。這個狀態的 CI 對品質的保護幾乎是零。

這篇整理幾個常見的 CI 測試慢的根源，和對應的優化策略——從不需要改 code 就能做的調整，到需要重新設計測試架構的根本解法。

---

## 先診斷：你的 CI 慢在哪裡？

優化之前先搞清楚時間花在哪。盲目優化是最大的浪費。

在 GitHub Actions 裡，每個 step 旁邊都有執行時間。花 5 分鐘看一次完整的 job log，通常就能找到真正的瓶頸。

常見的時間殺手：

| 問題 | 典型症狀 |
|------|---------|
| 環境準備太慢 | `npm install` 或 `pip install` 每次跑 3~5 分鐘 |
| 測試本身太重 | 單個 E2E 測試跑 2 分鐘以上 |
| 所有測試串行跑 | job 裡測試一個接一個，CPU 只用一核 |
| 不必要的測試都在跑 | 改一個 util function，跑了全套 E2E |
| 環境不穩定 | 每次跑結果不一樣，需要重跑才會過 |

---

## 策略一：快取依賴（最快見效）

最容易被忽略、又最快見效的優化。

每次 CI job 都是全新環境，如果每次都重新下載並安裝套件，光 `npm install` 就可能花 3 分鐘。

GitHub Actions 的 `actions/cache` 可以把 `node_modules` 或 Python 的 `.venv` 快取起來，下次 lock file 沒有變的話直接用快取，跳過安裝。

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

- run: npm ci
```

`npm ci` 搭配快取，通常能從 3 分鐘降到 20 秒以內。Python 的 `pip` 也有類似設定。

`actions/setup-node`、`actions/setup-python` 這些官方 action 現在內建 `cache` 參數，一行就開啟：

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
```

---

## 策略二：平行執行測試（效果最大）

串行跑測試是最常見的浪費。100 個測試案例一個接一個跑，等於只用了機器一顆 CPU 的能力。

### 方法一：matrix strategy 切分測試群組

把測試按功能分組，每組開一個 job 並行跑：

```yaml
strategy:
  matrix:
    test-group: [auth, checkout, notifications, profile]

steps:
  - run: pytest tests/${{ matrix.test-group }}/ -v
```

4 組測試變成 4 個 job 同時跑，整體時間變成最慢那組的時間。

### 方法二：pytest-xdist 在單一 job 內平行

如果用 pytest，`pytest-xdist` 讓測試在同一台機器內多核心同時跑：

```bash
pip install pytest-xdist
pytest -n auto  # 自動偵測 CPU 數量，開對應數量的 worker
```

`-n auto` 在 GitHub Actions 的 2-core runner 上通常能讓速度提升 1.5~1.8 倍。

**注意**：平行跑測試要求測試之間不能有共享狀態。如果測試互相依賴（A 測試建立的資料被 B 測試用），平行化會讓測試隨機失敗。這是檢查測試設計的好機會。

### 方法三：Playwright 的 --shard 切分 E2E

Playwright 內建 sharding，把 E2E suite 切成 N 份，每份在獨立的 job 跑：

```yaml
strategy:
  matrix:
    shardIndex: [1, 2, 3, 4]
    shardTotal: [4]

steps:
  - run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
```

100 個 E2E 測試切成 4 份，每份 25 個，整體時間縮到原本的 1/4。

---

## 策略三：只跑受影響的測試（治本）

「改了一個登入邏輯，跑全套 E2E」——這是最大的浪費來源之一。

### 按改動範圍決定跑哪些測試

在 GitHub Actions 裡可以偵測哪些檔案有改動，決定要跑哪個測試群組：

```yaml
- uses: dorny/paths-filter@v3
  id: changes
  with:
    filters: |
      auth:
        - 'src/auth/**'
      payment:
        - 'src/payment/**'

- run: pytest tests/auth/ -v
  if: steps.changes.outputs.auth == 'true'

- run: pytest tests/payment/ -v
  if: steps.changes.outputs.payment == 'true'
```

改了 auth 相關 code，只跑 auth 測試；改了 payment，只跑 payment 測試。

### PR 跑 smoke，merge 跑完整回歸

一個實用的分層策略：

```
PR 開啟 → smoke test（5 分鐘）
合併到 main → 完整回歸（30 分鐘，不擋 PR）
排程（每天凌晨）→ E2E + 效能測試
```

開發者等 5 分鐘知道 PR 有沒有大問題，不需要等 30 分鐘的完整套件。

---

## 策略四：清理慢測試和 Flaky test

有時候讓 CI 慢的不是「測試太多」，而是「有幾個特別慢的測試」在拖整體時間。

### 找出最慢的測試

```bash
pytest --durations=10  # 列出最慢的 10 個測試
```

看到一個測試跑 45 秒，通常是：
- 測試裡有 `sleep()`（等待 UI 動畫或 API 回應）
- 測試建立了太多資料
- 測試做了不必要的 setup/teardown

針對這幾個測試做優化，效果可能比平行化更明顯。

### 移除或修復 Flaky test

Flaky test 除了本身會失敗，還會觸發 retry，讓 CI 時間不可預測。

一個測試失敗 → retry 2 次 → 才真正判斷失敗：時間直接乘以 3。

定期檢查 CI 失敗記錄，找出「大部分情況通過、偶爾失敗」的測試，優先修復或隔離。

---

## 策略五：升級 runner（最後手段）

前面幾個策略都試過了，還是不夠快——這時候可以考慮升級 runner。

GitHub Actions 的標準 runner 是 2-core。花一點錢可以用 4-core、8-core 的大機器，`pytest -n auto` 的平行數量跟著翻倍。

不建議一開始就走這條路。更大的機器掩蓋的是測試架構的問題，不是解決它。先做前面幾個策略，確定瓶頸真的是 CPU 而不是設計問題，再考慮升級。

---

## 實際案例：40 分鐘 → 9 分鐘

把上面的策略組合起來，是可以有很大幅度提升的。我自己在工作中做過的一次優化：

- **起點**：40 分鐘，全部 E2E，串行
- 加快取 `npm ci`：-5 分鐘 → 35 分鐘
- pytest-xdist `-n 2`：35 分鐘 → 20 分鐘
- 切 4 個 matrix shard：20 分鐘 → 9 分鐘
- 移除 5 個 flaky test（各有 retry）：更穩定

**最終：9 分鐘，穩定，開發者開始真的等結果**。

最後那個效果才是真正重要的——CI 的意義不在於跑多快，在於有沒有人相信它、等它的結果。

---

## 常見問題

**Q：平行化測試需要什麼前提條件？**
A：測試必須相互獨立——每個測試不能依賴其他測試建立的資料或狀態。測試要能在任意順序執行、任意子集執行，結果都一樣。如果測試之間有依賴，平行化會讓它們隨機失敗。解法是讓每個測試自己準備和清理需要的資料（test fixtures）。

**Q：matrix strategy 和 pytest-xdist 有什麼差別？**
A：matrix strategy 是在多個獨立的 job（不同的雲端機器）上並行，適合大規模切分，每個 job 的資源完全獨立。pytest-xdist 是在同一台機器內多核心並行，設定更簡單，但受限於單台機器的核心數。兩者可以同時用——先 matrix 切成 4 組，每組再用 xdist 跑 2 核。

**Q：只跑受影響的測試，萬一漏掉了怎麼辦？**
A：這是真實風險。解法是：PR 只跑受影響的測試（快速反饋），merge 後觸發完整套件（確保沒有漏網之魚）。完整套件不擋 PR，只是在背景跑，失敗了發通知。這樣兼顧速度和覆蓋。

**Q：CI 測試速度的目標是多少？**
A：Janet Gregory 在 *Test Automation in DevOps* 裡提到：PR check 的目標是 10 分鐘內，最多 15 分鐘。超過這個時間，開發者的注意力就切走了，CI 的即時回饋作用消失。完整回歸可以更長，但不能擋 PR 流程。
