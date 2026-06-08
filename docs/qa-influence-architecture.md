---
tags: ['測試策略', '系統設計', 'QA 思維', '架構']
---

# QA 怎麼影響架構決策？從可測試性談起

一個難以測試的系統，幾乎必然是難以維護的系統。

這不是巧合，而是因果：可測試性需要清晰的邊界、明確的依賴、可預期的行為——這些特性和好的架構設計完全重疊。

但 QA 通常是在系統架構決定之後才介入。這個時間點，能改變的空間已經很有限。這篇文章談的是：QA 如何在架構決策階段就發揮影響力，而不只是在結果出來後抱怨「這個很難測」。

---

## 可測試性是架構的非功能需求

大多數架構討論圍繞著效能、擴展性、安全性。可測試性（Testability）很少被列為一等公民。

但數據說話：Microsoft Research 在 2009 年發表的研究《An Empirical Study of the Influence of Static Analysis Alerts on Delivered Software Quality》發現，程式碼的可測試性（以圈複雜度和耦合度量化）與缺陷密度有強相關。簡單地說：**難以測試的程式碼，缺陷更多。**

Michael Feathers 在《Working Effectively with Legacy Code》中直接說：「Legacy code is code without tests.」（遺留程式碼就是沒有測試的程式碼。）但更準確的說法應該是：難以添加測試的程式碼，就是難以改動的程式碼。

---

## QA 視角能看到的架構問題

開發工程師在設計架構時，自然從「怎麼實作功能」出發。QA 的視角是「這個系統怎麼會壞，以及我怎麼知道它壞了」。

這兩個視角的差異，在以下幾個架構決策點最為明顯：

### 1. 服務邊界劃分

微服務的邊界怎麼劃，直接決定了整合測試的複雜度。

如果 A 服務的一個 API 要穿越 B、C、D 三個服務才能完成，那麼：
- 端到端測試要同時把四個服務跑起來
- 任何一個服務的問題都會讓測試失敗，但很難定位原因
- CI/CD 的速度會大幅下降

QA 在設計討論時可以問：「如果 B 服務掛了，A 服務的哪些功能還能用？我們的測試怎麼驗證這個降級行為？」

這個問題不只是測試問題，也是可用性（Availability）的設計問題。

---

### 2. 外部依賴的隔離

如果業務邏輯直接呼叫外部 API（金流、簡訊、地圖服務），測試就被迫依賴外部環境。

**常見結果：**
- 測試環境金流服務不穩定，CI 每天有一成機率失效
- 無法模擬外部服務回傳錯誤的情況（超時、5xx、回應格式錯誤）
- 測試執行成本高（每次測試都打真實 API）

**QA 可以在架構討論時提出：** 「這個外部服務有沒有辦法用 interface 包起來？這樣我們可以在測試時注入 fake 實作，在生產環境用真實實作。」

這就是依賴注入（Dependency Injection）的標準理由，但從測試的角度提出來，開發工程師往往更容易接受。

---

### 3. 可觀測性的設計

Google SRE 手冊把可觀測性（Observability）定義為系統的核心屬性之一：「A system is observable if you can understand its internal state from its external outputs.」

可觀測性不是上線後加上去的日誌，而是要在設計階段就想好：
- 哪些事件需要被記錄？
- Log 的格式是否能被監控工具解析？
- 關鍵路徑有沒有 trace ID 串接？
- 業務指標（訂單完成率、支付成功率）有沒有被埋點？

QA 對這個最有發言權，因為 QA 是最常需要「在問題發生後重建現場」的人。如果 Log 不夠，QA 要花大量時間才能確認 bug 的根因。

在架構 review 時，QA 可以直接問：「如果這個功能在生產環境出現問題，我需要什麼資訊來診斷？現在的設計能不能在 5 分鐘內給我這些資訊？」

---

### 4. 狀態管理的複雜度

架構中的狀態越多、越分散，測試就越難寫。

**難以測試的設計：**
- 把大量業務邏輯放在前端狀態管理（如 Redux）中
- 多個服務都維護同一份資料的副本，但同步邏輯不清楚
- 使用全域變數或 Singleton 持有可變狀態

這些設計讓測試很難寫出「給定初始狀態 A，執行操作 B，預期結果 C」的結構，因為「初始狀態 A」本身就很難設定。

QA 可以在設計討論時提問：「如果我想要測試這個功能在特定狀態下的行為，我怎麼把系統設定到那個狀態？」

如果工程師答不出來或說「很複雜」，就是一個值得深入討論的設計問題。

---

## 把可測試性帶進架構 Review

大多數團隊有 Code Review，但很少有 Testability Review。QA 可以主動要求在架構討論或設計文件 review 時納入測試視角。

**幾個具體的問題清單：**

| 架構決策 | QA 應該問的問題 |
|---------|--------------|
| 服務邊界 | 服務之間的邊界可以獨立測試嗎？整合點有合約測試嗎？|
| 資料庫設計 | 測試資料怎麼清理？有沒有辦法快速建立測試所需的初始狀態？|
| 非同步處理 | 非同步操作的結果怎麼驗證？有沒有辦法讓測試等待非同步完成？|
| 快取策略 | 快取的狀態會影響測試結果嗎？測試之間怎麼隔離？|
| 外部依賴 | 外部服務可以被 mock 嗎？如何模擬外部服務失敗的場景？|

---

## 一個真實的案例邏輯

Netflix 的混沌工程（Chaos Engineering）是 QA 影響架構的極致案例。

Netflix 的 Chaos Monkey 工具會在生產環境隨機關掉服務實例，強迫工程師在設計時就考慮「如果這個服務掛了，系統的其他部分怎麼辦」。這不是測試工具，而是架構設計工具——它讓不可測試的假設在設計階段就被挑戰，而不是等到真實故障才發現。

Netflix 在 2011 年發表的論文《Chaos Monkey Released into the Wild》中指出，這個實踐讓他們的服務可用性顯著提升，因為工程師在設計時就被迫思考失敗場景。

---

## QA 怎麼在架構討論中取得發言權

技術性的架構討論，QA 有時會覺得自己插不上嘴。幾個建立影響力的策略：

**1. 把過去的痛點量化**  
「上次我們測某功能，花了兩天設定測試環境，因為資料庫 schema 沒有辦法快速 seed。」  
具體的歷史案例比抽象的建議更有說服力。

**2. 用工程語言說話**  
「這個設計違反了依賴反轉原則，會讓 unit test 很難寫」比「這個很難測試」更有份量。  
閱讀 Robert C. Martin 的《Clean Architecture》可以幫你建立這套語言。

**3. 先問，再建議**  
「這個我不確定，但如果這樣設計，測試要怎麼寫？」  
問問題比直接說「這樣不好」更不對立，也更容易引發真正的討論。

---

## 結語

「軟體工程在 Google」（Software Engineering at Google, 2020）一書中有一句話：「If you liked it, you should have put a test on it.」（如果你重視這個功能，你就應該替它寫測試。）

這句話的意思不只是「要測試」，而是：測試是對設計的一種壓力測試。難以測試的設計往往是難以維護的設計。

QA 帶著這個視角進入架構討論，不是在要求特權，而是在提供一個系統性的壓力測試——讓設計在紙上就接受挑戰，而不是等到程式碼寫出來後才發現問題。

---

**延伸閱讀：**
- Michael Feathers — *Working Effectively with Legacy Code* (2004)
- Robert C. Martin — *Clean Architecture* (2017)
- Betsy Beyer et al. — *Site Reliability Engineering* (Google, 2016) — 第四章 Service Level Objectives
- Titus Winters, Tom Manshreck, Hyrum Wright — *Software Engineering at Google* (2020)
- Netflix Technology Blog — [Chaos Monkey Released into the Wild](https://netflixtechblog.com/chaos-monkey-released-into-the-wild-daa55478ead0) (2012)
- Microsoft Research — *An Empirical Study of the Influence of Static Analysis Alerts on Delivered Software Quality* (2009)
