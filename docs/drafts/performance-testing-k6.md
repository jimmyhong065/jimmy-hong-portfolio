# Performance Testing 不只是壓測：用 k6 找出真正的瓶頸

---

## 目錄

1. [那次壓測全過，上線還是掛了](#壓測全過上線掛了)
2. [壓測不等於效能測試](#壓測不等於效能測試)
3. [k6 的基本用法](#k6-基本用法)
4. [三種我實際跑過的場景](#三種場景)
5. [怎麼讀 k6 的報告](#怎麼讀報告)
6. [結尾](#結尾)

---

## 那次壓測全過，上線還是掛了

我們的 App 有一個每年的活動：跨年倒數，從 12/31 晚上十點到 1/1 凌晨一點，所有用戶的計時硬幣增加三倍。

去年活動上線前，後端有做壓測：模擬 500 個用戶同時請求，API response time 正常，沒有 error。壓測通過。

活動開始，實際用戶同時線上的峰值大概是 3000 多人。計時完成的 API 開始 timeout，用戶種樹失敗，客訴湧進來。

事後分析：壓測用的 500 個並發，是用平均分布的方式打 API。但真實情況是，凌晨 12:00:00，幾千個計時在同一秒完成，所有人同時請求 `/sessions/complete`。這個 spike 的模式，壓測沒有模擬到。

---

## 壓測不等於效能測試

「壓測」通常的理解是：用大量並發打 API，確認 server 撐得住。

但效能測試包含的場景更多：

**Spike testing（瞬間峰值）**

不是穩定的大流量，是在短時間內流量暴增。我們的 App 跨年活動就是這個模式：一般時間可能 100 個並發，活動開始瞬間 3000 個。

**Soak testing（長時間穩定負載）**

不是大流量，是中等流量跑幾個小時，觀察有沒有 memory leak、有沒有效能隨時間下降的問題。

**Stress testing（找到崩潰點）**

不是確認能承受預期流量，是找到系統在什麼流量下開始出現問題。

**Latency baseline**

不是壓測，是正常流量下，API 的 p50/p95/p99 latency 是多少。這個基準建好之後，每次 release 對比，確認沒有退步。

---

## k6 的基本用法

k6 是一個用 JavaScript 寫測試腳本的效能測試工具。

```javascript
// k6_scripts/timer_complete.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,           // 並發用戶數
  duration: '30s',    // 測試時長
};

export default function() {
  const token = __ENV.AUTH_TOKEN;

  const res = http.post(
    'https://staging.example.com/api/v1/sessions/complete',
    JSON.stringify({ duration: 25, tree_type: 'oak' }),
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'coins_earned present': (r) => JSON.parse(r.body).coins_earned !== undefined,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

跑：

```bash
AUTH_TOKEN=your_token k6 run k6_scripts/timer_complete.js
```

---

## 三種我實際跑過的場景

**場景一：正常負載基準測試**

目的：建立 API 在正常流量下的 latency 基準。

```javascript
export const options = {
  vus: 50,
  duration: '5m',
};
```

跑完記錄 p50、p95、p99。這個數字每次 release 後跑一次，確認沒有退步。

我們的 App 的基準：`/sessions/complete` 的 p95 應該在 200ms 以內。如果某次 release 後 p95 升到 800ms，就知道這個 release 有效能問題，在上線前就能發現。

**場景二：峰值模擬**

目的：模擬活動開始的瞬間流量。

```javascript
export const options = {
  stages: [
    { duration: '1m', target: 50 },    // 正常流量
    { duration: '30s', target: 3000 }, // 瞬間 spike 到 3000
    { duration: '2m', target: 3000 },  // 維持峰值
    { duration: '1m', target: 50 },    // 回到正常
  ],
};
```

這個腳本模擬「活動開始，流量瞬間暴增，維持一段時間，再降回來」的模式。

跑完之後看：spike 階段的 error rate 是多少、p99 latency 是多少、有沒有 timeout。

**場景三：長時間穩定測試**

目的：找出 memory leak 或效能隨時間退化的問題。

```javascript
export const options = {
  vus: 100,
  duration: '2h',  // 跑兩小時
};
```

在 Grafana 看 server 的 memory 使用量：如果兩小時後 memory 比開始高很多，可能有 leak。

同時觀察 latency：如果第一個小時 p95 是 150ms，第二個小時變成 500ms，代表有問題隨時間累積。

---

## 怎麼讀 k6 的報告

```
http_req_duration.............: avg=180ms min=45ms med=165ms max=2.1s p(95)=450ms p(99)=890ms
http_req_failed...............: 0.23% ✓ 4750 ✗ 11
```

**重點數字：**

- `p(95)` 和 `p(99)`：95% 和 99% 的請求的 response time。`avg` 容易被少數極慢的請求拉高，p95/p99 更能反映大部分用戶的體驗。
- `http_req_failed`：error rate。0.23% 代表每 400 個請求有 1 個失敗。在一般場景下這個應該接近 0。
- `max`：最慢的那個請求花了多久。`max=2.1s` 值得關注，2 秒的 timeout 對用戶體驗影響大。

**怎麼定義「過關」：**

在跑效能測試之前，先定義 SLO（Service Level Objective）：

- `p95 < 300ms`（95% 的請求要在 300ms 內完成）
- `error rate < 0.1%`（每 1000 個請求允許不超過 1 個失敗）
- `p99 < 1s`（99% 的請求要在 1 秒內完成）

k6 的 `check` 可以把這些條件寫進腳本，測試失敗的時候 exit code 非 0，可以接進 CI 自動判斷過沒過。

---

## 結尾

那次跨年活動掛掉，事後後端花了一週優化了計時完成 API 的 DB 查詢，加了 cache，把峰值承載量提高到可以應對短時間的大量並發。

但更重要的是，我們把峰值模擬腳本加進了每次大活動前的測試清單。現在活動上線前，一定跑一次 spike test，確認峰值承載量。

效能測試不是一次性的工作，是每次有流量預期的情境下都要跑的流程。工具不難，難的是建立這個習慣，在問題出現之前問那個問題。
