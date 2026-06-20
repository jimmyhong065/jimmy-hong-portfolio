---
title: k6 入門：為什麼選它，以及你的第一個壓測腳本
excerpt: k6 用 JavaScript 寫腳本、Go 引擎跑得快、天生為 CI 而生。這篇帶你裝好 k6、寫出第一個能跑的壓測腳本，並看懂 k6 run 吐出來的那堆數字。
tags: [k6, 效能測試, 壓測工具, 入門]
status: draft
---

# k6 入門：為什麼選它，第一個腳本怎麼寫

效能測試的觀念課裡我們聊過工具選型——這門延伸課，就專心把「怎麼用 k6 真的做出來」走一遍。先從為什麼選 k6、怎麼裝、第一個腳本開始。

## 為什麼是 k6

- **用 JavaScript 寫腳本**：不用學專屬語言，前後端工程師都能上手。
- **Go 引擎、高效**：同樣的機器能掛比 thread-per-VU 工具多很多的虛擬用戶。
- **腳本即程式碼**：純文字、好版控、好 code review。
- **天生為 CI 而生**：CLI 跑、用 exit code 表達成敗——這點在後面接 GitHub Actions 時是關鍵。

## 安裝

```bash
# macOS
brew install k6
# Windows
choco install k6        # 或 winget install k6
# Docker（CI 常用）
docker run --rm -i grafana/k6 run - <script.js
```

Linux 用對應的套件庫（apt/yum）即可。

## 第一個腳本

建一個 `first.js`：

```javascript
import http from 'k6/http'
import { sleep } from 'k6'

export const options = {
  vus: 10,        // 10 個虛擬用戶
  duration: '30s' // 跑 30 秒
}

export default function () {
  http.get('https://test.k6.io')
  sleep(1) // 思考時間：模擬真人停頓
}
```

跑起來：

```bash
k6 run first.js
```

三個重點先記住：

- `options` 定義「怎麼壓」（這裡是 10 VU 跑 30 秒）。
- `export default function` 是每個虛擬用戶反覆執行的主體，一次執行叫一個 **iteration**。
- `sleep(1)` 是思考時間——別省，沒有它會高估壓力、低估可承載 VU（這點觀念課的腳本設計篇講過）。

## 看懂輸出

`k6 run` 結束會吐一份 summary，先看這幾個：

```
http_req_duration..: avg=124ms  p(95)=210ms  p(99)=480ms
http_req_failed....: 0.00%
http_reqs..........: 3120   104/s
iterations.........: 3100   103/s
vus................: 10
```

- `http_req_duration`：回應時間。**看 p(95)/p(99)，不要只看 avg**（為什麼，觀念課指標篇講過）。
- `http_req_failed`：錯誤率。**先看這個再看延遲**——一堆失敗請求秒回會把 avg 拉得很漂亮，是假象。
- `http_reqs` / `iterations`：吞吐，後面的 `104/s` 才是你關心的每秒處理量。

## 帶得走

- k6 = JS 腳本 + 高效引擎 + CI 友善，是現在做 CI 效能回歸的首選之一。
- 一個腳本三件事：`options`（怎麼壓）、`default function`（壓什麼）、`sleep`（像真人）。
- 看 summary 先看錯誤率、再看 p95/p99，別被 avg 騙。

下一篇：把 HTTP 請求寫完整，並加上 `check()` 驗證回應。
