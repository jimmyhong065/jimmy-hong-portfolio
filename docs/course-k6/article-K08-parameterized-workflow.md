---
title: 參數化的 k6 workflow：手動選環境與負載等級
excerpt: 同一套腳本，有時想壓 staging、有時壓 production；有時輕量回歸、有時重壓。用 GitHub Actions 的 workflow_dispatch inputs 做成下拉選單，把 env 與負載等級傳進 k6。
tags: [k6, CI, GitHub Actions, workflow]
status: draft
---

# 參數化的 workflow：一套腳本，多種跑法

上一篇的 workflow 是固定的。但實務上你會想：這次壓 staging 還是 production？輕量回歸還是重壓？與其複製一堆 workflow，不如用 `workflow_dispatch` 的 inputs 做成下拉選單。

## workflow_dispatch inputs

```yaml
name: load-test
on:
  workflow_dispatch:
    inputs:
      environment:
        description: '目標環境'
        type: choice
        options: [staging, production]
        default: staging
      profile:
        description: '負載等級'
        type: choice
        options: [light, medium, heavy]
        default: light
```

在 GitHub UI 的 Actions 頁，點 "Run workflow" 就會出現兩個下拉選單。

## 把 inputs 傳進 k6

```yaml
jobs:
  k6:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: grafana/setup-k6-action@v1

      - name: Run load test
        run: k6 run k6/tests/checkout.js
        env:
          BASE_URL: ${{ inputs.environment == 'production' && secrets.PROD_URL || secrets.STAGING_URL }}
          PROFILE: ${{ inputs.profile }}
```

## 腳本依 profile 切負載

腳本端用 `__ENV.PROFILE` 選對應的負載參數：

```javascript
const PROFILES = {
  light:  { rate: 50,   duration: '3m' },
  medium: { rate: 500,  duration: '5m' },
  heavy:  { rate: 2000, duration: '10m' },
}
const p = PROFILES[__ENV.PROFILE || 'light']

export const options = {
  scenarios: {
    checkout: {
      executor: 'constant-arrival-rate',
      rate: p.rate, timeUnit: '1s', duration: p.duration,
      preAllocatedVUs: Math.ceil(p.rate / 2), maxVUs: p.rate * 2,
    },
  },
  thresholds: {
    'http_req_duration{name:createOrder}': ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
}
```

## ⚠️ 壓 production 的護欄

能一鍵壓 production 很方便，但也危險（觀念課線上壓測篇講的風險控管）。至少要：

- 用 GitHub **Environments** 對 production 設 **required reviewers**，跑前要人核准。
- production 的負載先從 light 開始，別讓人手滑直接 heavy。
- 確認被壓的是有染色 / 影子隔離的全鏈路壓測環境，別污染真實資料。

## 帶得走

- `workflow_dispatch.inputs` + `type: choice` = UI 下拉選單，一套腳本多種跑法。
- 環境靠 `inputs` 選 secret、負載靠 `__ENV.PROFILE` 在腳本端切。
- 壓 production 要有護欄：required reviewers、預設 light、確認是隔離環境。

下一篇：k6 的輸出與觀測——summary、JSON、Prometheus/Grafana、New Relic。
