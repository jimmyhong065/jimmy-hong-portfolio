# 讓 QA 少回報 flaky bug 的幾件事，RD 可以主動做

---

## 目錄

1. [那個每次回報都找不到的 bug](#那個找不到的-bug)
2. [Flaky bug 的成本被低估了](#成本被低估)
3. [RD 能主動做的幾件事](#rd-能做的事)
4. [結尾](#結尾)

---

## 那個每次回報都找不到的 bug

Google 的工程生產力團隊曾在 Testing Blog 披露：他們的 CI 系統中，約有 1/7 的測試案例存在某種程度的不穩定性（flakiness），而這些不穩定的測試每年消耗工程師數以萬計的工時在重跑、確認和忽略上。這還是 Google 這種投入大量資源在測試基礎設施的公司。對一般中小型團隊，這個比例通常更高。

我在 我們的 App 的測試過程中，有一個 bug 回報了三次。

每次回報的描述都一樣：「計時進行中切換到其他 App，回來之後計時器顯示的剩餘時間和實際不符，差了幾分鐘。」

第一次：RD 試了十幾次，沒有重現，標成 Cannot Reproduce。

第二次：我再遇到，補了影片。RD 說影片裡看不出具體差了多少，還是很難定位。

第三次：我跟 RD 坐在一起，他終於重現了。差了 4 分鐘。

根本原因是 iOS 背景喚回的時間戳記計算問題，在特定的電池省電模式下才會觸發，觸發條件不確定。但從第一次回報到定位到根本原因，花了三週。

那三週裡，這個 bug 占用了我和 RD 總共加起來大概 6–8 個小時的時間——光是來回確認、重現、補資訊。

---

## Flaky bug 的成本被低估了

當 QA 說「我發現一個 bug，但不一定能重現」，這句話在工程師耳裡通常解讀成：「不確定是不是真的 bug，先觀察。」

但這句話的實際含義是：「有一個問題存在，只是觸發條件我不確定，也沒有辦法提供足夠的資訊讓你定位。」

Flaky bug 的浪費發生在幾個地方：

- QA 每次遇到都要花時間確認「是真的還是環境問題」
- RD 花時間嘗試重現，重現不了就擱置
- Bug 長期存在，某天突然在用戶端規模觸發

最糟的結果是：bug 在測試階段以 flaky 的形式出現，沒有被重視，上線之後在特定條件下穩定觸發，這時候定位的成本是測試階段的好幾倍。Martin Fowler 在〈Eradicating Non-Determinism in Tests〉一文中也指出，非確定性測試是持續整合流程中最具破壞性的因素之一，因為它讓「測試紅燈」失去了警示意義——人們開始習慣性地「再跑一次」，而不是去修問題。

---

## RD 能主動做的幾件事

大部分的 flaky bug，本質上是「觸發條件存在，但沒有足夠的可觀測性讓你知道發生了什麼」。

**1. 在關鍵狀態轉換點加 log**

計時器的狀態轉換是 我們的 App 的核心邏輯：開始→暫停→繼續→結束。每一個狀態轉換，應該有 log 記下時間戳記、觸發原因、當時的裝置狀態。

如果有完整的 log，QA 遇到「計時器時間對不上」的問題，第一步是看 log，而不是花時間描述「我做了什麼步驟」。

```swift
Logger.timer.debug(
    "state_transition",
    from: currentState,
    to: newState,
    timestamp: Date(),
    backgroundedAt: lastBackgroundedAt,
    deviceBatteryMode: UIDevice.current.batteryState
)
```

有了這個 log，QA 提供的資訊從「我覺得計時器少了幾分鐘」變成「log 裡 backgroundedAt 和 resumedAt 之間的差值是 4 分鐘，但 elapsedTime 只增加了 1 分鐘」。這個資訊 RD 拿到可以直接定位。

**2. Error 不要靜默失敗**

我們的 App 有幾個地方會靜默失敗：API 呼叫失敗沒有 retry，也沒有記錄；event queue 寫入失敗沒有 alert；硬幣入帳失敗前端顯示「成功」但後端實際沒有更新。

這些靜默失敗讓 QA 回報的是「看起來正常但其實壞了」的 bug，最難定位。

至少做到：失敗就記 log，記清楚是哪個步驟失敗、什麼 error code。

**3. 加一個 debug 資訊頁**

很多 Mobile App 會有一個開發者隱藏頁面，顯示當前的關鍵狀態：帳號 ID、訂閱狀態、當前計時 session 的 ID、最後一次 API 呼叫的 timestamp。

這個頁面在 QA 測試時非常有用。遇到 bug 的時候，第一步是截這個頁面，QA 提供的資訊品質立刻提升一個等級。

**4. API 回應加上 request ID**

每次 API 呼叫都有一個唯一的 request ID，response header 帶回來。QA 遇到 bug 的時候，能直接給 RD 一個 request ID，RD 去 log 系統裡查那筆 request 的完整記錄。

省掉「幫我重現一次」這個步驟，直接找原始問題。

---

## 結尾

那個計時器的 flaky bug，後來 RD 加了詳細的狀態轉換 log。下次我再遇到類似問題，是在兩個月後：計時顯示少了 2 分鐘。我直接從 App 的 debug 頁面截出 session log，貼給 RD，他十分鐘後告訴我根本原因。

從三週縮到十分鐘。

RD 加 log 的成本很低，但對 QA 提報 bug 的品質、對整個 team 的除錯效率，影響很大。這些事情不需要等 QA 要求，RD 主動做，兩邊都省時間。

---

## 參考資料

1. [Google Testing Blog — Test Flakiness](https://testing.googleblog.com/2020/12/test-flakiness-one-of-main-challenges.html) — Google 工程生產力團隊對 flaky test 規模與成本的實測分析
2. [Martin Fowler — Eradicating Non-Determinism in Tests](https://martinfowler.com/articles/nonDeterminism.html) — 非確定性測試的成因分類與根治策略
3. [Google SRE Book — Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/) — 可觀測性設計與 log 策略對系統可靠性的影響
4. [DORA 2024 State of DevOps Report](https://dora.dev/research/2024/dora-report/) — 測試可靠性與整體交付效能的相關性研究
5. [Tricentis — The State of Continuous Testing](https://www.tricentis.com/resources/) — 自動化測試穩定性與 CI/CD 整合的產業報告
