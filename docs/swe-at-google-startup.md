---
tags: ['工程文化', 'Google', '新創', 'Code Review', '測試文化', 'Postmortem']
---

# 《Software Engineering at Google》讀完，我才知道新創少了什麼

---

## 目錄

1. [那段我說不清楚的混亂](#那段我說不清楚的混亂)
2. [Code Review 文化](#code-review-文化)
3. [Testing Grouplet](#testing-grouplet)
4. [Blameless Postmortem](#blameless-postmortem)
5. [結尾](#結尾)

---

## 那段我說不清楚的混亂

有一段時間，我在新創工作，團隊很小，節奏很快。

那時候常發生一些事：某個工程師直接把 code 推上去，沒有人看，隔天出問題了，大家口頭討論一番，找到「原因」，然後繼續往前衝。測試？那是「之後再補」的事，永遠沒有之後。Code Review？PR 開了幾分鐘就被 approve，因為大家都很忙。

出過幾次事故之後，我有種模糊的感覺——這樣下去不對，但我說不清楚哪裡不對，更不知道怎麼改。

後來我讀了《Software Engineering at Google》（又稱 SWE Book）。

這本書是 Google 工程師寫的，講的是他們怎麼在超大規模下維持工程品質。我一開始以為這是一本「只適合大公司」的書——Google 有幾萬名工程師，我們只有幾個人，能學什麼？

但讀完才發現，讓我印象最深的那些章節，說的不是 Google 有多厲害，而是他們為什麼要建立這些做法——背後的邏輯，正好說清楚了我當時那段混亂是怎麼回事。

這篇文章不是 SWE Book 的摘要。我想聊的是三個概念，它們在 Google 是日常，在新創卻很難落地——以及我認為最小化可以怎麼開始。

---

## Code Review 文化

### Google 怎麼做

在 Google，任何一行 code 要進 production，必須至少通過一個 reviewer 的 approve。這是硬規定，沒有例外。

但更重要的不是這個流程本身，而是 reviewer 在看什麼。

SWE Book 裡有一句話讓我印象很深：**"code is a liability, not an asset."**

這句話的意思是：你寫的 code 不是資產，是負債。每多一行 code，未來就多一行要維護、要理解、要修改的成本。所以 reviewer 看的不只是「這段 code 有沒有 bug」，而是「這段 code 有沒有必要存在」、「它的命名別人看得懂嗎」、「這個設計三個月後還 hold 得住嗎」。

Google 的 review 文化培養了一種集體的 ownership——不是「這是你寫的，你的問題」，而是「這段 code 進了 codebase，就是我們大家的問題」。

### 新創通常怎麼做

在新創，code review 常常走這條路：

「我們應該要做 code review。」

→ PR 開了，沒人有時間看。

→ 過了幾天，reviewer 看了五分鐘，留了一句「looks good」，approve。

→ 後來大家更忙，PR 開了，自己 merge。

→ 出問題了，沒有人知道誰改了什麼、為什麼這樣改。

這不是工程師的問題，也不是主管的問題。是因為沒有人把「review 是什麼、要看什麼」這件事說清楚過。

### 為什麼很難改

最常見的理由是「速度」。

主管說要快，review 感覺在擋路。工程師自己也覺得：我這個 feature 很簡單，要不要 review？

這個問題的核心是：大家不知道 code review 的目的不是找 bug，是在傳遞知識、對齊設計、維持可讀性。一旦只把 review 定義成「抓 bug 的機制」，它就很容易被快速跳過——因為「我這段 code 很直覺，不可能有 bug」。

### 最小化怎麼開始

不需要導入工具，不需要寫長篇規範。

**第一步：定一份三條的 PR checklist，放在 PR template 裡。**

舉例：

```
- [ ] 這個 PR 的目的一句話說得清楚嗎？
- [ ] 有沒有你自己也不確定的地方？（標出來讓 reviewer 重點看）
- [ ] 有沒有之後會回來咬你的設計決策？
```

三條，不多。每次開 PR 填一遍。

填的過程本身就是一種自我 review——很多人在填的時候就會發現「欸，這段我自己也不確定」，然後先修掉再送。

Review 文化的起點不是「要求別人看」，是「讓每個 PR 的作者先自己看過一遍」。

---

## Testing Grouplet

### Google 怎麼做

Google 內部有一個很有趣的組織叫 Testing Grouplet。

它不是正式的部門，不是主管指派的任務。它是一群工程師自願組成的小組，目標是在 Google 內部推動測試文化。

他們做的事包括：辦 workshop、寫內部教學文件、建立讓測試更容易寫的工具、設計 **Test Certified** 程式——讓團隊能自我評估「我們的測試成熟度在哪一級」，然後給出具體的改進方向。

SWE Book 裡說，推動測試文化最難的不是技術，是讓工程師相信「寫測試值得」。Testing Grouplet 做的就是這件事：降低寫測試的摩擦，讓「寫測試」變成自然的工作流程，而不是額外的負擔。

### 新創通常怎麼做

在新創，測試文化的崩潰通常是漸進式的：

一開始沒有測試。後來有人覺得應該要有，開始寫了一些 unit test。然後某幾個 test 開始 flaky——偶爾過、偶爾不過，沒人知道為什麼。沒人有時間修。CI 跑到一半就紅了，大家習慣了「這個 test 不用管，它一直這樣」。

然後有一天，有人說：「這個 CI check 先關掉好了，擋到 release 了。」

就這樣，測試消失了。

這個過程不是因為大家不認同測試的價值，而是因為沒有人負責維護「測試這件事本身」——不是測試案例，是測試的基礎設施、文化、習慣。

### 為什麼很難改

在新創，大家都在趕功能。推文化需要「slack」——餘裕，時間，空間。而新創最缺的就是這個。

更難的是，推測試文化的 ROI 不是立刻可見的。你花了半天修好 flaky test，今天的 sprint 沒有任何新功能交付。短期看，這是浪費時間。長期看，這是投資。但在新創，「長期」這個詞很難說服人。

### 最小化怎麼開始

你不需要組成一個正式的 Testing Grouplet。你只需要**一個人先動**。

具體做法：

**每週找一個測試痛點，修掉它，然後跟團隊說你做了什麼。**

不是要教訓任何人，不是要求大家做到什麼。就是分享：「這個 flaky test 我找到原因了，是因為 timing issue，我加了一個 explicit wait，現在穩了。」或是：「我發現我們的 login 流程沒有任何 test，我花了兩小時加了三個，現在有 coverage 了。」

這個動作的意義不在於那一個 test 本身，而在於讓「關心測試」這件事在團隊裡有能見度。

文化是行為的累積，不是規定的結果。一個人每週做一件小事，持續三個月，比一份沒人看的測試規範有效一百倍。

---

## Blameless Postmortem

### Google 怎麼做

在 Google，每次出事故（incident），不管大小，都要在 24 到 48 小時內完成一份 postmortem。

格式是固定的：事件 timeline、root cause 分析、action items。

但最關鍵的原則，是 **blameless**：不寫「是誰造成的」。

SWE Book 裡說，大多數的工程事故不是因為某個人犯了蠢，而是因為系統允許那個錯誤發生。一個工程師漏掉了一個 edge case——那個 edge case 為什麼沒有被測試覆蓋？為什麼 code review 沒有抓到？為什麼 deploy 流程沒有保護機制？

把問題歸到人，你只能解決那個人。把問題歸到系統，你才能讓同樣的事不再發生。

Blameless postmortem 的目的不是找戰犯，是找可以改善的地方，然後把它變成 action items，讓下次更不容易出事。

### 新創通常怎麼做

在新創，出事之後的流程通常是：

Slack 上炸鍋，大家一起排查，找到問題，修掉上線。

口頭討論一番，隱約知道「是某個地方沒處理好」，但沒有寫下來。

主管說「大家辛苦了」，然後繼續往前走。

三個月後，類似的問題再次發生。

這不是因為大家不在乎，而是因為「把事故反省寫下來」這個動作從來沒有發生過，所以組織沒有辦法從事故中學習——每一次都是從零開始的痛苦。

### 為什麼很難改

有兩個核心的阻力。

第一個是**心理安全感**。如果寫下 postmortem，會不會被人翻出來秋後算帳？「你看，當時就是你造成這個問題的。」這種擔心是真實的，尤其在心理安全感還沒有建立的團隊裡。

第二個是**沒有人推動**。Blameless postmortem 需要有人願意先寫第一份。在大家都很忙的情況下，「事情解決了就好」是最省力的選擇。沒有人強制要求，就沒有人會主動做。

### 最小化怎麼開始

**你自己先寫一份，貼到 Slack，不點名。**

下次出事故，不管是你負責的還是不是，就在事後寫一份簡單的文件：

```
## 事件：[簡短描述]

**發生時間：** YYYY-MM-DD

**Timeline：**
- 14:30 某功能開始出現異常
- 14:45 發現是資料庫連線設定問題
- 15:00 rollback，服務恢復

**Root Cause：**
環境變數在 staging 和 production 不一致，沒有在 deploy checklist 裡確認。

**Action Items：**
- [ ] 加入 deploy checklist：確認 production 環境變數
- [ ] 考慮用 config validation 在啟動時就擋住這類錯誤
```

把它貼到 Slack，說：「出事之後我整理了一下，希望對大家有用。」

不需要等主管要求，不需要等有人同意這個流程。讓「寫下來」這個動作先存在，比討論「要不要建立 postmortem 文化」更重要。

---

## 結尾

我讀《Software Engineering at Google》的時候，有個感覺一直在變：一開始覺得「這是 Google 的事，跟我沒關係」，讀到後來越來越覺得「這其實說的是我遇到的問題」。

Code Review 沒在做，不是因為我們不夠專業，是因為沒有人說清楚它的目的。

測試文化起不來，不是因為大家不在乎，是因為沒有人願意先開始維護它。

出事之後沒有反省，不是因為大家不想進步，是因為沒有一個安全的方式把事情寫下來。

這三件事在 Google 是制度，在新創是選擇。

它們不需要你有幾萬名工程師，不需要有正式的流程，不需要主管的批准。

需要的只是一個人願意先動：開一個 PR template、修一個 flaky test、寫一份沒人要求的 postmortem。

那段我說不清楚的混亂，後來我才知道，它不是新創的宿命，是可以改的——只要有人先開始。

---

## 參考資料

- [Software Engineering at Google — Free Online Book](https://abseil.io/resources/swe-book) — 本書全文免費閱讀（Titus Winters, Tom Manshreck, Hyrum Wright）
- [Google Testing Blog](https://testing.googleblog.com/) — Google 工程師分享的測試實踐文章
- [Google SRE Book — Site Reliability Engineering](https://sre.google/sre-book/table-of-contents/) — Google SRE 全書，與 SWE@Google 互補
- [Google DORA — Accelerate State of DevOps 2024](https://dora.dev/research/2024/dora-report/) — Google 主導的 DevOps 效能研究
- [Martin Fowler — Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html) — CI 概念原始定義
