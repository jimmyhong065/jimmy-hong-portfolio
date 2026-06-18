# Appium 2 升 Appium 3，我踩了哪些坑

---

## 目錄

1. [我以為只要 npm install 就好了](#以為很簡單)
2. [為什麼要升？不升會怎樣？](#為什麼要升)
3. [第一關：Node.js 版本](#node-版本)
4. [第二關：JSONWP 正式移除](#jsonwp)
5. [第三關：Security flag 加上 scope 前綴](#security-flag)
6. [第四關：100 多個舊端點消失了](#舊端點)
7. [第五關：Session discovery 端點改名](#session-discovery)
8. [新功能：Inspector 可以直接裝進 Appium 了](#inspector)
9. [升級前的 checklist](#checklist)

---

## 我以為只要 npm install 就好了

Appium 是目前全球最廣泛採用的跨平台行動 App 測試框架，GitHub 上累積超過 9,000 個 star，背後的社群橫跨數十個國家。2025 年推出的 Appium 3，是近年來最大幅度的協定層清理——而「比較溫和的升級」這句話，差點讓我輕敵。

Appium 官方說 2 → 3 的升級幅度比 1 → 2 小很多，是一個「比較溫和的升級」。

我就放心地跑了：

```bash
npm install -g appium@latest
```

然後跑測試，壞了。

錯誤訊息一開始很奇怪，不是我熟悉的那種 Appium 錯誤。找了一圈才搞清楚，原來我有好幾個地方撞上了 breaking change——沒有哪一個特別複雜，但每個都需要你知道才能解。

這篇把我踩過的坑整理出來，讓你升的時候不用再自己掃一遍。

---

## 為什麼要升？不升會怎樣？

先說值不值得升。

Appium 3 的核心動機是「清掉舊包袱，讓底層更乾淨」：

- 完全拿掉 JSON Wire Protocol（JSONWP）的殘留支援，只剩 W3C WebDriver
- 移除超過 100 個已 deprecated 的舊端點
- Node.js 最低版本升到 20，確保安全性和效能
- 新增 Inspector 可以直接透過 Appium 安裝，不用另外下載

如果你的專案現在跑得順，短期沒有非升不可的壓力。但如果你在用的 driver（UiAutomator2、XCUITest）持續在更新，它們遲早只支援 Appium 3，拖著不升只會讓日後的升級更痛。

---

## 第一關：Node.js 版本

**Appium 3 最低要求 Node.js 20.19.0、npm 10**

先確認你的版本：

```bash
node -v   # 需要 >= 20.19.0
npm -v    # 需要 >= 10
```

如果用 nvm 管理 Node，升級很簡單：

```bash
nvm install 20
nvm use 20
```

這一關沒什麼坑，但它是後面所有步驟的前提——沒升 Node 就先升這個，再跑其他的。

---

## 第二關：JSONWP 正式移除

這是 Appium 3 最根本的變化。

JSON Wire Protocol 是 Appium 的前身協定，在 Appium 2 的時候還有部分殘留支援。**Appium 3 把它完全拿掉了，只接受 W3C WebDriver 格式。**

對大多數現代測試框架來說，這不會有問題——Python client、Java client 近幾年的版本都已經改成 W3C 了。但如果你的 capabilities 還在用舊格式，就會壞：

**Session 建立時的 capabilities 格式：**

```python
# 舊格式（JSONWP，Appium 3 不接受）
desired_caps = {
    "platformName": "Android",
    "deviceName": "emulator-5554",
    "appPackage": "com.example.app",
}
driver = webdriver.Remote(url, desired_caps)

# 新格式（W3C，Appium 3 要求）
capabilities = {
    "platformName": "Android",
    "appium:deviceName": "emulator-5554",
    "appium:appPackage": "com.example.app",
}
options = UiAutomator2Options().load_capabilities(capabilities)
driver = webdriver.Remote(url, options=options)
```

關鍵差異：Appium 特有的 capabilities（非 W3C 標準的）都要加 `appium:` 前綴。

**POST /session 接受的參數也變了：**

| 舊參數（JSONWP） | 新參數（W3C） |
|-----------------|--------------|
| `desiredCapabilities` | `capabilities` |
| `requiredCapabilities` | 移除 |

如果你的 session 建立收到 `400 Bad Request`，九成是這裡。

---

## 第三關：Security flag 加上 scope 前綴

如果你在 Appium server 啟動時有用 `--allow-insecure`，格式要改。

**Appium 2：**

```bash
appium --allow-insecure=adb_shell
```

**Appium 3：要指定 driver scope**

```bash
# 指定特定 driver
appium --allow-insecure=uiautomator2:adb_shell

# 所有支援的 driver 都允許
appium --allow-insecure=*:adb_shell
```

不加 scope 前綴，Appium 3 會直接噴 error 拒絕啟動。

如果你是在 CI 的啟動腳本裡設定這個，記得去那邊也改。

---

## 第四關：100 多個舊端點消失了

Appium 2 時代就已經標示 deprecated 的端點，Appium 3 全部拿掉了。

最常踩到的幾個：

**App 操作類：**

```python
# 舊（已移除）
driver.launch_app()
driver.close_app()
driver.reset()

# 新（用 execute_script）
driver.execute_script("mobile: launchApp")
driver.execute_script("mobile: terminateApp", {"bundleId": "com.example.app"})
driver.execute_script("mobile: clearApp", {"bundleId": "com.example.app"})
```

**execute 端點：**

```python
# 舊端點 POST /execute（移除）
# 新端點 POST /execute/sync（一直都存在，現在是唯一入口）
# 大多數 client library 會自動處理，但低版本可能沒有
```

**Touch actions（最多人踩）：**

```python
# 舊（Touch Actions API，已移除）
action = TouchAction(driver)
action.press(x=100, y=200).release().perform()

# 新（W3C Actions API）
driver.execute_script("mobile: tap", {"x": 100, "y": 200})
# 或用 ActionChains
from selenium.webdriver.common.action_chains import ActionChains
actions = ActionChains(driver)
actions.w3c_actions.pointer_action.move_to_location(100, 200)
actions.w3c_actions.pointer_action.click()
actions.perform()
```

Touch Actions 如果你還沒換掉，這次一定會踩。

---

## 第五關：Session discovery 端點改名

如果你有自己寫 session 管理的工具，或是用 Appium Inspector 查現有 session，這個要注意：

```
舊端點：GET /sessions
新端點：GET /appium/sessions（需要開 feature flag）
```

要讓新端點生效，啟動 Appium 時要加：

```bash
appium --allow-insecure=*:session_discovery
```

同時，Appium Inspector 要升到 2025.3.1 以上才相容 Appium 3 的 session discovery。

---

## 新功能：Inspector 可以直接裝進 Appium 了

這個算是 Appium 3 裡比較值得說的新東西。

以前用 Appium Inspector 要另外下載一個 standalone app，跟 Appium server 分開管理。**Appium 3 可以把 Inspector 當成 plugin 裝進去：**

```bash
appium plugin install inspector
appium --use-plugins=inspector
```

裝完啟動 Appium，開瀏覽器進 `http://localhost:4723`，Inspector 就在裡面了，不用另外開 app。

對 CI 環境來說，需要 Inspector 做 debug 的情境也變得更方便。

---

## 升級前的 checklist

```
升級步驟
□ Node.js 升到 20.19.0+，npm 升到 10+
□ npm install -g appium@latest
□ 更新所有 Appium driver（appium driver update --installed）
□ 更新 Appium Inspector 到 2025.3.1+

Capabilities 檢查
□ 確認 Appium 特有的 capabilities 都有加 appium: 前綴
□ 確認用 capabilities 而不是 desiredCapabilities

Server 啟動參數
□ --allow-insecure flag 全部加上 scope 前綴（如 uiautomator2:xxx）

程式碼掃描
□ 搜尋 launch_app / close_app / reset() → 換成 mobile: 指令
□ 搜尋 TouchAction → 換成 W3C Actions API 或 mobile: tap
□ 搜尋 /sessions endpoint → 改成 /appium/sessions

測試驗證
□ 跑一次 smoke test，確認 session 可以建立
□ 確認主要測試流程可以跑過
```

---

Appium 3 沒有 Appium 2 那次升級痛，但如果不知道這幾個坑，還是會在裡面繞一陣子。對照 checklist 升，應該一個下午可以搞定。

---

## 參考資料

- [Appium 3 官方 Migration Guide](https://appium.io/docs/en/3.1/guides/migrating-2-to-3/) — 從 Appium 2 升到 3 的官方完整遷移說明
- [Appium 3 Release Blog](https://appium.io/docs/en/3.1/blog/2025/08/07/-appium-3/) — Appium 3 正式發布公告與版本說明
- [Appium GitHub Repository](https://github.com/appium/appium) — Appium 原始碼、issue tracker 與版本歷史
- [W3C WebDriver 規範](https://www.w3.org/TR/webdriver/) — Appium 3 唯一支援的協定標準
- [Appium 官方文件](https://appium.io/docs/en/latest/) — 最新 Appium 完整文件與 API 參考
