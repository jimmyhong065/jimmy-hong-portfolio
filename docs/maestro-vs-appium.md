# 用了 Appium 三年，我為什麼開始認真考慮 Maestro

---

## 目錄

1. [Appium 的坑，你應該都踩過](#appium-的坑)
2. [Maestro 是什麼](#maestro-是什麼)
3. [Setup：從幾天變成 30 分鐘](#setup)
4. [語法：YAML 寫測試長什麼樣](#語法)
5. [Flakiness：Maestro 內建的解法](#flakiness)
6. [Maestro 的天花板在哪裡](#天花板)
7. [什麼時候選哪個](#什麼時候選哪個)
8. [我的結論](#結論)

---

## Appium 的坑，你應該都踩過

Appium 是目前全球最廣泛採用的跨平台行動 App 測試框架，在 GitHub 上累積超過 9,000 個 star，背後的社群橫跨數十個國家。但它的架構靈活性帶來了相應的維護成本，這讓 Maestro 這個 2022 年才出現的新框架，在短短兩年內就獲得大量團隊的採用——因為它針對的正是 Appium 最常見的痛點。

如果你用 Appium 寫過手機自動化測試，這些場景應該都很熟悉：

- 裝環境裝了三天，Node 版本不對、driver 版本衝突、模擬器連不上
- 寫好的測試在本機跑過，CI 上 `NoSuchElementException`
- 一個 UI 小改版，十幾個 locator 全壞掉，花一個下午修腳本
- 每次跑到一半卡著，不確定是測試壞了還是 emulator 沒反應

這些不是你寫得不好，是 Appium 的架構決定了它的維護成本就是偏高。

Maestro 想解決的就是這些問題。

---

## Maestro 是什麼

Maestro 是一個 2022 年出現的手機 UI 測試框架，開源、免費，支援 Android、iOS、React Native、Flutter。

它的核心設計方向跟 Appium 完全不同：

**Appium** 的哲學是「彈性第一」——你可以用任何語言寫，可以做任何事，可以深入操控裝置的任何層面。代價是設定複雜、維護負擔重。

**Maestro** 的哲學是「簡單第一」——用 YAML 寫測試，內建等待邏輯，setup 簡單到半小時可以跑起第一個測試。代價是複雜邏輯的表達能力有限。

---

## Setup：從幾天變成 30 分鐘

**Appium 的 setup 清單：**

```
□ 安裝 Node.js（版本要對）
□ npm install -g appium
□ appium driver install uiautomator2 / xcuitest
□ 安裝 Android Studio + SDK
□ 設定 ANDROID_HOME 環境變數
□ 確認 AVD 可以開起來
□ 安裝對應語言的 client library（Python / Java）
□ 確認所有版本相容
□ 第一次跑，再修一堆 capability 設定
```

光是這個清單，沒碰過的人可能要花一兩天。

**Maestro 的 setup：**

```bash
# macOS
brew tap mobile-dev-inc/tap
brew install maestro

# 或 Linux / Windows
curl -Ls "https://get.maestro.mobile.dev" | bash
```

裝完就跑。不需要設定 SDK、不需要設定環境變數、不需要知道 capability 是什麼。

---

## 語法：YAML 寫測試長什麼樣

這是一個 Maestro 的登入流程測試：

```yaml
appId: com.example.myapp
---
- launchApp
- tapOn: "Sign In"
- inputText: "test@example.com"
- tapOn: "Continue"
- inputText: "password123"
- tapOn: "Login"
- assertVisible: "Welcome back"
```

不需要懂程式語言，不需要找 XPath 或 resource-id，直接寫「點選這個文字」就好。

等等看 Appium 的相同流程（Python）：

```python
driver.find_element(AppiumBy.ACCESSIBILITY_ID, "Sign In").click()

email_field = WebDriverWait(driver, 10).until(
    EC.presence_of_element_located(
        (AppiumBy.XPATH, '//android.widget.EditText[@hint="Email"]')
    )
)
email_field.send_keys("test@example.com")
driver.find_element(AppiumBy.ID, "com.example.myapp:id/btn_continue").click()
# ...
```

Appium 的寫法靈活，但光是定位一個元素就要考慮用 ACCESSIBILITY_ID 還是 XPATH 還是 ID，維護的時候 UI 一改就全壞。

---

## Flakiness：Maestro 內建的解法

Appium 的 flaky test 問題，很大一部分來自「等待時機不對」——元素還沒載入你就去點，或是動畫還沒跑完就去斷言。根據 Google Testing Blog 的分析，Flaky test 是大型測試套件中最消耗工程師信心的問題，Google 內部每天有數以萬計的測試因 flakiness 而被重跑，其中大量是因為等待邏輯不精確。

解法通常是自己加 `WebDriverWait` + `ExpectedConditions`，但這需要你自己判斷每個地方要等多久、等什麼。

Maestro 把這件事內建了：

- 每個 `tapOn` 都會自動等待元素出現再執行
- 如果元素短暫消失，它會 retry
- 不需要你手動加 sleep 或 explicit wait

這個設計讓 Maestro 的 flakiness 率比 Appium 低很多。不是因為它更聰明，是因為它預設就是「等到好再動」，而 Appium 預設是「你說找，我就找，找不到就報錯」。

---

## Maestro 的天花板在哪裡

Maestro 不是萬能的，它有明確的限制：

**1. 複雜邏輯在 YAML 裡很難寫**

條件判斷、迴圈、動態資料、多個測試之間的共用狀態——這些在 YAML 語法裡要嘛寫不了，要嘛寫出來難以維護。

一旦你的測試邏輯開始變複雜，YAML 的可讀性優勢就消失了，變成另一種難以維護的格式。

**2. 低層次的裝置操作做不到**

Appium 可以直接跑 ADB 指令、讀取系統 log、操作系統層級的功能（例如權限對話框的細節處理）。

Maestro 的設計哲學讓它刻意不支援這些，換來簡單性，但如果你的測試場景需要這類操作，Maestro 就不夠用。

**3. 跨 app 流程比較麻煩**

測試需要切換到瀏覽器、跳到 Settings app、或是跨多個 app 的流程，Appium 處理起來比較自然。

**4. 生態系統還在成長**

Appium 有幾十個現成的 action，社群資源多，遇到問題搜尋解法很容易。Maestro 相對年輕，特殊需求有時候找不到現成答案。

---

## 什麼時候選哪個

| 情況 | 建議選擇 |
|------|---------|
| 剛開始建立自動化，要快速上手 | Maestro |
| 主要測試 Happy path、E2E 主流程 | Maestro |
| 需要複雜的測試邏輯和條件分支 | Appium |
| 需要操作系統層級功能（ADB、權限）| Appium |
| 團隊沒有強 coding 背景 | Maestro |
| 已有大量 Appium 測試，遷移成本高 | 繼續用 Appium |
| React Native / Flutter 的 smoke test | Maestro 值得試 |

---

## 我的結論

Maestro 不是要取代 Appium，是在填一個 Appium 沒有在服務的場景：**你想快速寫幾個自動化測試，但不想花三天裝環境、不想管理複雜的 locator、不想維護脆弱的等待邏輯。**

如果你現有大量 Appium 測試，不需要全部遷移。可以考慮的策略是：

- **Appium**：複雜 E2E 流程、需要精細控制的場景
- **Maestro**：快速 smoke test、新功能的第一版自動化、讓 RD 也能看懂的測試

兩個工具共存，在各自擅長的地方發揮，比硬要用一個工具做所有事更實際。

---

## 參考資料

- [Maestro 官方文件](https://maestro.mobile.dev/) — Maestro 框架完整文件與快速上手指南
- [Appium 官方文件](https://appium.io/docs/en/latest/) — Appium 跨平台行動測試框架完整文件
- [Maestro GitHub Repository](https://github.com/mobile-dev-inc/maestro) — Maestro 原始碼與社群討論
- [Google Testing Blog：Flaky Tests at Google](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html) — Google 對 Flaky Test 問題的深入分析
- [Maestro vs Appium 比較分析 - Revyl](https://revyl.com/blog/maestro-vs-appium/) — 兩框架功能與適用場景的詳細比較
