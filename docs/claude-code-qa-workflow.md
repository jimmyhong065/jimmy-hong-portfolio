# 手動測試 App 的我，用 Claude Code 省了多少時間

Capgemini《World Quality Report 2024–25》調查發現，QA 工程師有大量工時消耗在測試本體以外的週邊事務：整理 log、撰寫 bug report、解讀 API response。這些事不難，但它們吃掉你真正用來思考和判斷的精力。Claude Code 改變的就是這一塊。

---

## 目錄

1. [那些每天都在做的雜事](#那些每天都在做的雜事)
2. [Workflow 1：Logcat 貼進去，直接拿到 bug 的根源](#logcat)
3. [Workflow 2：需求文件 → 測試清單，三分鐘搞定](#spec-to-checklist)
4. [Workflow 3：Release note → 回歸重點，不再靠記憶](#regression)
5. [Workflow 4：Bug report 第一稿，不用再空白盯著發呆](#bug-report)
6. [Workflow 5：API JSON 貼進去，驗證點一秒生出來](#api-json)
7. [用起來的前提](#前提)
8. [哪些事它還是幫不了你](#限制)

---

## 那些每天都在做的雜事

手動測試 App，有一大半的時間不是在「測試」，是在做圍繞測試的雜事：

- 複製 logcat，肉眼找哪一行是 crash
- 把需求文件讀完，再一條一條想要測什麼
- 寫 bug report，想怎麼把步驟說得清楚
- Release 前整理回歸清單，擔心有東西漏掉
- 看 API response，想有沒有哪個欄位值不對勁

這些事不難，但它們吃掉你大量的低效時間——不是難到需要思考，是煩到讓人不想開始。

Claude Code 改變的就是這些。不是替你測試，而是把你在測試前後的雜事，壓縮到幾秒鐘。

---

## Workflow 1：Logcat 貼進去，直接拿到 bug 的根源

**場景：** App 閃退，你開 Android Studio 看 logcat，看到幾百行 log，不知道從哪裡開始找。

**以前怎麼做：** 從上往下掃，找 `FATAL`、`Exception`，再往上追 stack trace，花 5–10 分鐘。

**現在怎麼做：** 把 logcat 複製貼上，加一行 prompt：

```
以下是 Android logcat，App 在操作 [功能名稱] 時閃退。
請找出 root cause 是哪一行，並說明為什麼。

[貼入 logcat]
```

Claude 會直接指出：

> `NullPointerException` at `UserProfileFragment.kt:87` — `currentUser` 在 fragment 被 detach 後仍被存取，此時已為 null。

你拿到的不只是「哪裡出錯」，是「為什麼出錯」。寫 bug report 的時候可以直接引用。

**補充：iOS crash log 也一樣有效**，把 `.ips` 或 Xcode 的 crash report 貼進去，同樣的 prompt 套路。

---

## Workflow 2：需求文件 → 測試清單，三分鐘搞定

**場景：** 新功能 spec 下來，你要列出這次要測什麼。

**以前怎麼做：** 讀完 spec，腦袋轉一圈，開始打 test case，邊打邊想有沒有漏。

**現在怎麼做：**

```
以下是功能 spec，請幫我列出手動測試清單。
格式要求：
- 分「Happy path」「邊界值」「異常/錯誤情境」三類
- 每項一行，說明測試目的
- 如果有你覺得 spec 沒寫清楚、但可能有風險的地方，標記出來

[貼入 spec]
```

Claude 會給你一份骨架，你的工作變成「審查和補充」，而不是「從零開始想」。

速度差距大概是 3 倍。

**重要：** 這份清單只是骨架，一定要自己看過，加入你對產品的判斷。詳細原因在另一篇文章 [我讓 AI 產測試案例，它給了我一份看起來很完整但根本沒用的東西] 有討論。

---

## Workflow 3：Release note → 回歸重點，不再靠記憶

**場景：** 每次 Release 前，你要決定要回歸哪些舊功能。

**以前怎麼做：** 憑對這次改動的印象，加上「感覺可能影響到的地方」，列一份清單。有時候是對的，有時候漏掉某個你沒想到的 edge case。

**現在怎麼做：** 把 Git commit message 或工程師的 Release note 貼進來：

```
以下是這次版本的改動清單（commit messages）。
請分析這些改動可能影響到哪些舊功能，幫我列出回歸測試重點。
以「風險高→低」排序，說明為什麼這個改動可能影響那個功能。

[貼入 commit messages 或 changelog]
```

這個 prompt 的關鍵是「風險高→低排序」。Claude 會幫你做影響分析，你的時間優先放在高風險的地方。

**實際例子：**

你看到 commit 裡有 `refactor: 重構 user session 管理`

Claude 會提醒你：

> 高風險：登入/登出流程、跨頁面的登入狀態、記住登入/自動登入、token 過期後的行為、多帳號切換

這些你可能沒全想到，但 Claude 知道 session 管理牽涉的範圍。

---

## Workflow 4：Bug report 第一稿，不用再空白盯著發呆

**場景：** 你發現一個 bug，要寫 report，但你面對空白的 Jira 欄位，不知道怎麼開始。

**以前怎麼做：** 慢慢打，改來改去，花 10–20 分鐘。

**現在怎麼做：** 用自然語言先說一遍你看到了什麼：

```
我在測試 [功能名稱] 的時候發現一個問題。
[口語描述：我做了什麼，看到了什麼，預期是什麼]

請幫我整理成標準 bug report，包含：
- 標題（清楚描述問題）
- 環境（iOS/Android, 版本, 裝置）← 我會再補上實際數值
- Steps to reproduce
- 實際結果
- 預期結果
- 嚴重程度（建議 P1–P4 並說明原因）
```

你拿到一份結構清楚的草稿，再補上裝置資訊和截圖就完成了。

**進階版：** 如果你有截圖，可以直接貼圖片給 Claude，讓它根據截圖描述問題。這在 UI 跑版、元素位移的 bug 特別好用。

---

## Workflow 5：API JSON 貼進去，驗證點一秒生出來

**場景：** 你用 Proxyman 攔到 API response，要確認回傳值有沒有問題。

**以前怎麼做：** 肉眼看 JSON，根據 spec 一個個比對欄位。

**現在怎麼做：**

```
以下是 [API 名稱] 的 response。
這個 API 的用途是 [簡短說明]。
請幫我列出驗證清單：哪些欄位值得特別確認，可能的異常值是什麼。

[貼入 JSON]
```

Claude 會給你：

```
建議驗證點：
- status 欄位：預期為 "success"，確認是否有其他可能值
- user_id：確認是否為當前登入用戶的 ID，非 null
- expires_at：確認是否為未來時間，格式是否符合 ISO 8601
- items[].price：確認所有項目價格 > 0（參考近期業界案例，這個坑很真實）
- pagination.total 與實際 items 數量是否一致
```

這個 workflow 對於測試含金融邏輯的 API 特別有用——欄位多，每個都有意義，肉眼容易漏。

---

## 用起來的前提

要讓這些 workflow 有效，有幾件事要注意：

**1. Prompt 要有脈絡**

「幫我找 bug」不夠。「我在測 iOS 的訂閱恢復功能，以下是 crash log，請找 root cause」才夠。脈絡越清楚，答案越精準。

**2. 你要懂得判斷輸出**

Claude 給你的是草稿，不是最終答案。你對產品的理解才是品質的把關點。拿到清單後要自己過一遍，補上 AI 不知道的產品歷史和業務規則。

**3. 不要貼機密資料**

Logcat、API response 裡如果有用戶資料（ID、email、token），先遮掉再貼。這是基本的資安習慣。

---

## 哪些事它還是幫不了你

說清楚：Claude Code 目前還做不到這些：

| 做不到 | 原因 |
|--------|------|
| 替你操作 App 做測試 | 沒有眼睛和手，看不到 UI |
| 判斷「這個 UI 看起來怪不怪」 | 視覺品味和使用者直覺是你的 |
| 知道你們產品的歷史 bug | 它不認識你的系統，你要餵給它 |
| 理解某個行為「業務上不合理」 | 這是 domain knowledge，你比它懂 |

所以 Claude Code 是加速器，不是替代品。它幫你省掉的是「把已知的東西整理成文字」這件事，但判斷、觀察、理解業務，還是你的工作。

---

手動測試工程師的核心價值從來不是「執行測試步驟」，而是「知道什麼值得測、怎麼測才能找到問題」。Claude Code 幫你省下整理文字的時間，讓你把精力放在真正需要人腦的地方。

---

## 參考資料

- [World Quality Report 2024–25 — Capgemini](https://www.capgemini.com/insights/research-library/world-quality-report-2024-25/)
- [Stack Overflow Developer Survey 2024](https://survey.stackoverflow.co/2024/)
- [Claude Code Documentation — Anthropic](https://docs.anthropic.com/en/docs/claude-code)
- [AI Tester Certification — ISTQB](https://www.istqb.org/certifications/artificial-intelligence-tester)
- [Google Testing Blog](https://testing.googleblog.com/)
