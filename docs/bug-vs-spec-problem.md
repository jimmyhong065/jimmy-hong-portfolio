# 我怎麼跟 RD 說「這不是 bug，是 spec 沒定義」

---

## 目錄

1. [那次差點開成 bug 的爭議](#那次差點開成-bug)
2. [Bug 和 Spec 問題的差別](#差別)
3. [怎麼判斷是哪一種](#怎麼判斷)
4. [怎麼跟 RD 說，不傷關係](#怎麼說)
5. [結尾](#結尾)

---

## 那次差點開成 bug 的爭議

業界研究顯示，軟體缺陷中約有 40–50% 可以追溯到需求定義階段的問題，而非實作錯誤。把規格問題開成 bug，是讓工程師去修一件他當初沒有做錯的事——這種誤判，是很多團隊溝通摩擦的隱形來源。

我們的 App 有個功能：計時中途放棄，樹木死亡，硬幣不入帳。

有一次我測到：用戶計時進行到 80% 的時候，App 被 iOS 強制在背景終止（OOM kill）。用戶重開 App，計時 session 消失，沒有種樹，也沒有硬幣。

我的第一反應是開一個 bug：「被強制終止的計時 session，應該要能恢復，或者至少給用戶一個提示。」

我開 ticket 之前先去翻了 spec。Spec 上寫的是：「用戶主動放棄計時，樹木死亡。」

OOM kill 是「用戶主動放棄」嗎？Spec 沒有定義。

我沒有開 bug，我去找 PM。

---

## Bug 和 Spec 問題的差別

**Bug**：功能的實際行為和 spec 定義的預期行為不一致。

**Spec 問題**：Spec 沒有定義這個情境，所以沒有「預期行為」可以對照。

這個區別很重要，因為處理方式完全不同：

- Bug → RD 修
- Spec 問題 → PM 決定預期行為，然後 RD 實作，QA 驗證

把 spec 問題開成 bug，會讓 RD 很困惑：「我要修什麼？Spec 沒有說這個情況應該怎麼做，我怎麼知道什麼算修好了？」

ISTQB 的缺陷分類框架中，明確區分了「deviation from specification（偏離規格）」和「missing specification（規格缺失）」，前者是 bug，後者是需求問題。混淆這兩種類型，會讓處理路徑走錯方向。

然後 RD 只能猜，猜錯了又回到你這邊，又一個來回。

---

## 怎麼判斷是哪一種

我的判斷方式是問三個問題：

**1. Spec 上有沒有定義這個情境的預期行為？**

如果有：對照 spec，行為不符就是 bug。

如果沒有：繼續問下一個問題。

**2. 這個行為是否違反了「合理的用戶預期」？**

有些情境 spec 沒有定義，但答案很明顯：計時 App 在計時中途 crash，用戶一定預期某種形式的恢復或提示。這種情況，就算 spec 沒有寫，也算是設計上的缺失——但它是 spec 缺失，不是 RD 的錯。

**3. 如果我去問 PM 「這個情況應該怎麼處理」，PM 需要思考嗎？**

如果 PM 需要思考，代表這個行為沒有被提前決策，就是 spec 問題。

如果 PM 立刻說「當然應該 OOO」，代表大家都知道預期行為，只是 spec 漏寫了——這種情況比較接近 bug（實作和隱性預期不符）。

---

## 怎麼說，不傷關係

直接告訴 RD「這不是 bug，是 spec 問題」，有時候聽起來像是在說「這不是你的問題，是 PM 的問題」——這句話容易製造對立。

我現在的說法是：

「我發現一個行為不確定要怎麼處理——[描述情境]。我去翻了 spec，這個情況好像沒有定義。你有沒有這個情況的預期行為的想法？我想先跟 PM 確認，再決定要不要開 ticket。」

這樣說有幾個好處：

- 先問 RD，給他表達意見的空間，有時候 RD 知道當時實作的設計決策
- 「跟 PM 確認」把決策移到正確的地方，不是 QA 單方面裁定
- 不是在說「你做錯了」，是在說「這個情境我們還沒有對齊」

---

## 一個更麻煩的情況：Spec 有定義，但定義模糊

Spec 上寫：「計時中斷後，用戶可以選擇繼續或放棄。」

「中斷」包含 OOM kill 嗎？包含用戶手動 kill App 嗎？包含收到電話然後回來嗎？

Spec 有定義「中斷」，但「中斷」的邊界沒有定義。

這種情況最難處理，因為 RD 可以說「我按照 spec 實作了」，QA 可以說「但這個情況 spec 沒有涵蓋」，兩個人都是對的。

我遇到這種情況的做法是：列出所有「中斷」的具體情境，請 PM 逐一確認哪些屬於 spec 定義的範圍。這個清單通常包含 5–8 個情境，花 15 分鐘把它釐清，比之後的來回省很多。

---

## 結尾

那個 OOM kill 的情況，PM 確認後決定：App 重開後，如果距離上次計時結束不到 5 分鐘，顯示「你的計時因為 App 被系統關閉而中斷，要繼續嗎？」

這個決策需要 PM 參與，因為它涉及產品行為，不是技術問題。RD 沒有辦法自己決定，QA 也不應該單方面裁定。

把 spec 問題和 bug 分開，不只是為了正確分類——是為了讓正確的人做正確的決定，讓問題被真正解決，而不是被技術方式錯誤地處理掉。

---

## 參考資料

1. [ISTQB Glossary — Defect Classification](https://glossary.istqb.org/) — 標準缺陷分類框架，區分 deviation from spec 與 missing specification
2. [Capgemini World Quality Report 2024-25](https://www.capgemini.com/insights/research-library/world-quality-report-2024-25/) — 需求品質對整體軟體品質影響的全球調查
3. [Martin Fowler — Specification by Example](https://martinfowler.com/bliki/SpecificationByExample.html) — 用範例驅動規格，減少需求模糊地帶
4. [Google Testing Blog](https://testing.googleblog.com/) — 測試與需求對齊的實踐經驗
5. [Ministry of Testing — Bug Advocacy](https://www.ministryoftesting.com/) — 有效 bug report 與缺陷分類的實戰討論
