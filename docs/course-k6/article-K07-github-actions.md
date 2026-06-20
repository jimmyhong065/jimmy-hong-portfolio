---
title: 把 k6 接進 GitHub Actions：讓 thresholds 當 CI 品質門檻
excerpt: k6 不達標就回非零 exit code，GitHub Actions 接到就紅燈──這就是效能回歸自動化的核心。這篇給你一個能跑的 workflow，把效能退化擋在合併之前。
tags: [k6, CI, GitHub Actions, 效能回歸]
status: draft
---

# 把 k6 接進 GitHub Actions

觀念課的最後一課講「效能常態化」——把效能測試接進 CI、用門檻擋退化。這篇就把它做出來：k6 + GitHub Actions。

## 為什麼這件事成立

關鍵在前面講過的兩件事串起來：

1. **thresholds 不達標 → `k6 run` 回非零 exit code。**
2. CI 步驟拿到非零 exit code → **該 job 失敗 → PR 紅燈。**

所以只要 thresholds 寫對，效能退化會自動擋在合併之前，不用人盯。

## 一個能跑的 workflow

`.github/workflows/load-test.yml`：

```yaml
name: load-test
on:
  pull_request:
    paths: ['src/**']      # 動到程式碼才跑
  workflow_dispatch:        # 也允許手動觸發

jobs:
  k6:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup k6
        uses: grafana/setup-k6-action@v1

      - name: Run load test
        run: k6 run k6/tests/checkout.js
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
```

`k6/tests/checkout.js` 裡用上一篇的 `options.thresholds`。thresholds 沒過，這個 step 直接失敗。

## CI 裡的負載要「輕量但有代表性」

CI 的目的是**抓退化**，不是壓出極限容量。所以 CI 跑的應該是輕量的基準場景（幾分鐘、固定中等負載），跟基線比較。真正的大規模壓測另外排（手動 dispatch 或夜間排程）。

```javascript
// checkout.js 給 CI 用的輕量 options
export const options = {
  scenarios: {
    ci_baseline: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.RATE || 50),
      timeUnit: '1s', duration: '3m',
      preAllocatedVUs: 50,
    },
  },
  thresholds: {
    'http_req_duration{name:createOrder}': ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
}
```

## 把報告留下來

k6 可以輸出 summary JSON，存成 artifact 方便事後比對（下一篇細講輸出格式）：

```yaml
      - name: Run load test
        run: k6 run --summary-export=summary.json k6/tests/checkout.js
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}

      - name: Upload summary
        if: always()                 # 失敗也要留報告
        uses: actions/upload-artifact@v4
        with:
          name: k6-summary
          path: summary.json
```

`if: always()` 很重要——thresholds 沒過時 step 失敗，但你更想看那份失敗的報告。

## 帶得走

- thresholds 失敗 → k6 非零 exit → CI 紅燈，這是自動擋退化的根基。
- CI 跑**輕量、有代表性**的基準場景抓退化，極限壓測另外排。
- 用 `--summary-export` + `upload-artifact`（配 `if: always()`）保留每次報告。

下一篇：讓 workflow 可以手動選環境與負載等級。
