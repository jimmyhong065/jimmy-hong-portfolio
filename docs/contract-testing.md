# Contract Testing：前後端分離之後，誰來保證 API 不爛

---

## 目錄

1. [那次前後端各自測試都過，但整合起來壞了](#各自都過但整合壞了)
2. [Contract testing 在解什麼問題](#解什麼問題)
3. [Consumer-Driven Contract Testing 怎麼運作](#怎麼運作)
4. [在 我們的 App 的實作](#實作)
5. [什麼時候值得引入](#什麼時候值得引入)
6. [結尾](#結尾)

---

## 那次前後端各自測試都過，但整合起來壞了

我們的 App 後端更新了 `/sessions/complete` 的 response 格式：把 `coins_earned` 從 top-level 移進了 `reward` object。

```json
// 舊格式
{ "status": "success", "coins_earned": 25 }

// 新格式
{ "status": "success", "reward": { "coins": 25, "multiplier": 1 } }
```

後端有 unit test，跑完全綠。
前端也有 unit test，mock 了 API response，也全綠。

根據 Postman 2023 年 State of the API Report，超過 51% 的工程師表示 API 文件不夠準確或未及時更新是整合問題的主要原因；SmartBear 的 API 調查同樣指出，跨團隊的 API 格式不對齊，是前後端分離架構下最常見的 bug 來源之一。兩份 unit test 都是綠的，但整合的時候才發現格式脫節——這就是那個問題。

QA 拿到 build，測計時完成，種樹動畫播完，森林主頁沒有新樹，硬幣沒有增加。

前端還在讀 `response.coins_earned`，這個欄位現在是 `undefined`，整個種樹邏輯靜默失敗了。

後端沒有錯，前端沒有錯，但兩邊的格式脫節了。

---

## Contract testing 在解什麼問題

這個問題的根本原因是：前後端對 API 格式的「合約」在哪裡？

答案通常是：在 spec 文件裡、在 Postman collection 裡、或者在工程師的腦子裡。

這些地方有個共同問題：它們不會自動驗證「現在的實作有沒有符合合約」。格式改了，合約沒有更新，兩邊各自的測試繼續過，直到整合的時候才知道。

Contract testing 的做法是：**讓合約成為可執行的測試**。

格式改動會讓 contract test 失敗，而不是等到 QA 手動測試整合流程的時候才知道。

---

## Consumer-Driven Contract Testing 怎麼運作

最主流的 contract testing 框架是 Pact。核心概念是 consumer-driven：**由消費 API 的一方（通常是前端）定義合約**，而不是由提供 API 的一方定義。

流程是這樣的：

**Step 1：Consumer（前端）寫 consumer test**

前端測試描述「我期望這個 API 回什麼格式」，Pact 把這個期望記錄成一個 pact file：

```javascript
// 前端的 consumer test
await provider.addInteraction({
  state: "計時 session 存在",
  uponReceiving: "complete session request",
  withRequest: {
    method: "POST",
    path: "/sessions/complete",
    body: { duration: 25, tree_type: "oak" }
  },
  willRespondWith: {
    status: 200,
    body: {
      status: "success",
      coins_earned: like(25)  // 型別匹配，不是精確值匹配
    }
  }
});
```

這個 test 跑完，產生一個 pact file，描述前端的期望。

**Step 2：Producer（後端）驗證 pact file**

後端拿到 pact file，跑 provider verification：「我的實作有沒有符合前端的期望？」

```python
# 後端的 provider test
@pytest.fixture
def provider():
    return Provider("OurAppAPI", pact_dir="./pacts")

def test_provider_verification(provider):
    provider.verify()  # 如果格式不符，這裡失敗
```

**Step 3：在 CI 跑**

前端 PR merge → 跑 consumer test → 更新 pact file
後端 PR merge → 跑 provider verification → 確認不破壞前端的期望

後端改了格式，provider verification 失敗，RD 在合 code 之前就知道這個改動會破壞前端。

---

## 在 我們的 App 的實作

我們沒有用完整的 Pact（Pact 有一定的架構複雜度），用的是一個簡化版本：

**OpenAPI spec 作為 contract**

後端維護一份 OpenAPI spec（swagger），描述所有 API 的格式。

```yaml
# openapi.yaml
/sessions/complete:
  post:
    responses:
      200:
        content:
          application/json:
            schema:
              type: object
              required: [status, coins_earned]
              properties:
                status:
                  type: string
                coins_earned:
                  type: integer
                  minimum: 0
```

**前端測試 mock 從 spec 生成**

前端的 mock server 從 OpenAPI spec 自動生成，保證前端測試用的 mock 和 spec 一致。

**後端 CI 跑 spec validation**

每次後端 API 有改動，CI 自動跑一個測試：確認實際的 API response 符合 OpenAPI spec 的定義。

如果後端把 `coins_earned` 移進 `reward` object 但沒有更新 spec，CI 會失敗。如果 spec 更新了，CI 會通知前端「API 格式有改動」。

這不是 Pact 那種 consumer-driven 的完整 contract testing，但覆蓋了 90% 的 contract 問題，成本低很多。

---

## 什麼時候值得引入

**值得引入的情況：**

- 前後端分開部署，release 節奏不同步
- Mobile app + 後端的場景（App 版本更新慢，舊版本的 client 會遇到新版本的 API）
- 多個前端消費同一個 API（Web + iOS + Android）
- 你已經多次遇到「格式不對齊」的整合問題

**不值得引入的情況：**

- 全棧單一 repo，前後端同時部署
- 小團隊，前後端是同一個人或坐在一起緊密合作
- API 還在快速變動的早期產品

Contract testing 的主要成本是：初始建置的時間、以及維護 contract 的習慣。如果你的整合問題不頻繁，手動溝通就能解決，可以先不引入。

---

## 結尾

那次 `coins_earned` 格式改動的 bug，如果有 contract test，後端那個 PR 在 CI 的階段就會失敗，不會等到 QA 測試整合的時候才知道。

更重要的是：它給了後端一個明確的信號——「你的改動會影響前端」，讓前端有機會同步更新，而不是各自獨立上線然後在整合的時候出問題。

前後端分離是架構上的優勢，但它把溝通的責任從「坐在一起可以直接問」變成「需要明確的契約來保證」。Contract testing 把這個契約從文件變成可執行的測試，讓格式對齊不再依賴人的記憶和溝通頻率。

## 參考資料

- [Pact Documentation - Consumer-Driven Contract Testing](https://docs.pact.io/)
- [Consumer-Driven Contracts: A Service Evolution Pattern - Ian Robinson on Martin Fowler's site](https://martinfowler.com/articles/consumerDrivenContracts.html)
- [Postman 2023 State of the API Report](https://www.postman.com/state-of-api/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [ContractTest - Martin Fowler](https://martinfowler.com/bliki/ContractTest.html)
