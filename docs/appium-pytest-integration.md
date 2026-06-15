---
tags: ['Appium', 'pytest', 'CI/CD', '自動化測試', 'GitHub Actions', '行動測試']
---

# Appium 搭配 pytest 完整實務：從 fixture 設計到 CI 執行

Appium 測試最難的不是讓第一個測試跑起來，而是三個月後維護一個 50 個測試案例的專案時，還能快速加測試、快速找問題、CI 上跑起來不是每次都賭運氣。

這篇整理我在實際行動 App 自動化測試專案裡用 pytest + Appium 累積的做法——包含哪些設計決策是踩過才知道要這樣做的，不只是「複製貼上能跑」的教學。

---

## 為什麼選 pytest，不用 unittest？

Appium 官方文件的範例大多用 unittest，初學者很容易就跟著走。切換到 pytest 的理由很簡單：

**fixture 的 scope 控制是關鍵。** unittest 的 `setUp` 每個 test 都跑一次，沒辦法輕鬆做「整個測試 session 只建立一次 driver」或「同一個 class 共用一個 app session」。pytest 的 `function`、`class`、`module`、`session` scope 讓這件事可以精確控制。

**conftest.py 讓設定不需要 import。** driver 初始化、裝置設定、測試資料——全部放在 conftest，測試檔直接用 fixture 名稱，不用每個檔都 import。

**marker 讓測試分類有彈性。** 我現在的專案有 30 幾個 marker——功能分類、優先級、平台限制、用戶身份。CI 可以依情境選擇要跑哪一組。

---

## 專案結構：不要把所有東西塞進一個 conftest.py

新手第一版通常是這樣：

```
tests/
├── conftest.py   ← 500 行，所有東西都在這
├── test_login.py
└── test_home.py
```

這樣幾個月後會變成一個沒人敢動的檔案。

我現在用的結構：

```
tests/
├── conftest.py          ← 只做 pytest_plugins 宣告 + 基本設定
├── pytest.ini
├── test/
│   ├── fixtures/        ← fixture 按職責拆分
│   │   ├── driver.py    ← driver 建立/銷毀
│   │   ├── report.py    ← 測試報告截圖
│   │   ├── logging.py   ← log 設定
│   │   └── errors.py    ← 失敗處理
│   ├── core/            ← 核心功能測試
│   ├── account/         ← 帳號相關測試
│   └── store/           ← 商店功能測試
├── pageObject/          ← Page Object
├── config/
│   └── devices.yml      ← 裝置設定（不寫死在 code 裡）
└── utils/               ← 工具函數
```

conftest.py 只做一件事：

```python
# test/conftest.py
pytest_plugins = [
    "fixtures.driver",
    "fixtures.report",
    "fixtures.logging",
    "fixtures.errors",
]
```

fixture 的實作拆到各自的檔案，conftest 只負責宣告。這樣不同功能的 fixture 可以獨立修改，不會互相影響。

---

## devices.yml：裝置設定不寫死在 code 裡

很多教學的 capabilities 是寫死在 conftest.py 裡的：

```python
options.device_name = "Pixel 5"
options.udid = "emulator-5554"
```

這在真實專案會爆炸：不同環境要用不同裝置、CI 和本機不同、多台裝置並行要不同 port。

解法是用 YAML 設定檔管理裝置：

```yaml
# config/devices.yml
android:
  - name: "Pixel5_GP"
    udid: "emulator-5554"
    platformVersion: "13"
    port: 4723
    flavor: "gp"

  - name: "Pixel5_CN"
    udid: "emulator-5556"
    platformVersion: "13"
    port: 4725
    flavor: "cn"

ios:
  - name: "iPhone15"
    udid: "6d87b278-xxxx-xxxx-xxxx"
    platformVersion: "17.0"
    port: 4730
```

driver fixture 讀這個 YAML，或從 CLI 參數接收裝置資訊：

```python
# fixtures/driver.py
@pytest.fixture(scope="session")
def device_config(pytestconfig):
    device_name = pytestconfig.getoption("--device_name", default=None)
    udid = pytestconfig.getoption("--device_udid", default=None)

    if device_name and udid:
        # 單台模式：從 CLI 參數
        return {"name": device_name, "udid": udid, ...}
    else:
        # 多台模式：從 devices.yml 讀第一台（或依 --flavor 篩選）
        return load_first_device_from_config()
```

本機跑特定裝置：

```bash
pytest --device_name="Pixel5_GP" --device_udid="emulator-5554" --platform=android -m smoke
```

CI 跑全部：不帶參數，讀 devices.yml 全部裝置。

---

## Marker 設計：不只是功能分類

初期的 marker 設計通常只有功能分類：

```python
markers =
    smoke: 冒煙測試
    regression: 回歸測試
```

隨著專案成長，我加了幾個對 CI 很實用的分類：

```ini
# pytest.ini
markers =
    # 功能分類
    core: 核心功能測試
    account: 帳號功能測試
    store: 商店功能測試

    # 優先級（決定 CI 發現問題的速度）
    p0: blocker，必須在 release 前修復
    p1: 重要，影響主流程
    p2: 一般

    # 平台限制
    ios_only: 只在 iOS 執行
    android_only: 只在 Android 執行

    # 用戶身份（不同帳號狀態需要不同測試資料）
    guest: 訪客模式
    signup: 免費用戶
    premium: 訂閱用戶

    # 穩定性標記
    flaky: 已知不穩定，暫時隔離
```

實際執行範例：

```bash
# 只跑 p0 的 smoke test（PR check 最快方式）
pytest -m "smoke and p0"

# 只跑 iOS 的帳號測試
pytest -m "account and ios_only"

# 跑全部但排除不穩定測試
pytest -m "not flaky"
```

`flaky` marker 是我覺得最實用的一個：不穩定的測試先不刪，加上 marker 隔離，避免它影響整體 CI 結果，等時間處理。

---

## 自動重試：Appium 測試的標準配置

Appium 測試在真實環境有一個繞不開的問題：偶發失敗。不是 bug，是裝置抖動、網路延遲、UI 渲染時序。

`pytest-rerunfailures` 是這個問題的標準答案：

```ini
# pytest.ini
addopts = --reruns=1 --reruns-delay=3
```

一次重試，失敗後等 3 秒再跑。

這個設定的背後有取捨：重試讓 CI 穩定，但也可能讓真正的 bug 被掩蓋（跑兩次才失敗，QA 可能以為是環境問題）。

我的做法：CI 上開 `--reruns=1`，但同時監控「重試後才通過」的測試數量。如果某個測試一直需要重試，那就是真的問題，不是環境問題——加進追蹤清單。

---

## Base Page：比你想的要複雜

教學文章的 BasePage 通常只有 wait + click。真實專案的 BasePage 隨著時間會長出很多東西：

**截圖整合**：每個重要步驟截圖記錄，失敗時自動截圖上傳。

```python
class BasePage:
    def __init__(self, driver, take_screenshot, logger):
        self.driver = driver
        self.take_screenshot = take_screenshot  # fixture 注入
        self.logger = logger
        self.wait = WebDriverWait(driver, 15)
```

**多種 locator 策略**：用字典管理 locator 類型映射，避免在測試裡寫死 `AppiumBy.XPATH`：

```python
self.appium_mapping = {
    "accessibility_id": AppiumBy.ACCESSIBILITY_ID,
    "xpath": AppiumBy.XPATH,
    "android_uiautomator": AppiumBy.ANDROID_UIAUTOMATOR,
    "predicate": AppiumBy.IOS_PREDICATE,
    "class_chain": AppiumBy.IOS_CLASS_CHAIN,
}
```

**Log 整合**：每個 Page Object 有自己的 logger，不用 `print`：

```python
# 在 BasePage.__init__
self.logger = setup_logger(name=self.__class__.__name__)
```

我的 base_page 現在有 300+ 行，包含圖片比對（OpenCV）、手勢操作（swipe/pinch）、截圖管理。這不是一開始就有的，是跑過幾百個測試案例後慢慢長出來的。

---

## 報告系統：HTML 報告 vs ReportPortal

小專案用 `pytest-html` 夠了：

```ini
addopts = --html=reports/report.html --self-contained-html
```

跑完打開 HTML，清楚看到哪些過、哪些失敗、截圖都在。

當測試量增加、多台裝置並行、需要跨 release 比較趨勢時，企業級的選擇是 **ReportPortal**。

ReportPortal 是開源的測試報告平台，可以自己架設（Docker Compose 幾行搞定）。優點：
- 每次 CI 的結果自動累積，可以看「這個測試案例過去 30 次的穩定率」
- 多台裝置的結果合併到同一個 Launch，不用看 4 個獨立 HTML
- 可以標記哪些失敗是「known issue」，過濾掉雜訊

整合方式：安裝 `pytest-reportportal`，在 pytest.ini 加設定：

```ini
rp_endpoint = https://your-reportportal.com
rp_project = your_project
rp_launch = "MyApp_$(date +%%Y-%%m-%%d)"
rp_log_batch_size = 50
rp_log_level = ERROR
rp_skip_connection_errors = True  # 連接失敗時不中斷測試
```

`rp_skip_connection_errors = True` 這行很重要——ReportPortal 掛掉不應該讓測試跟著失敗。

---

## GitHub Actions：self-hosted runner 是關鍵

這是很多人卡住的地方：GitHub 的 hosted runner（雲端機器）沒有實體 Android/iOS 裝置，只能跑模擬器。

如果你的測試需要真實裝置，必須用 **self-hosted runner**。

```yaml
# .github/workflows/e2e.yml
jobs:
  test:
    runs-on: [self-hosted, macOS, android]  # 跑在你自己管理的 Mac 上

    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        run: |
          uv venv venv
          source venv/bin/activate
          uv pip install -r requirements-ci.txt

      - name: Check devices
        run: adb devices

      - name: Start Appium server
        run: |
          nohup python3 start_appium.py android 4723 > logs/appium.log 2>&1 &
          sleep 5
          curl -s http://localhost:4723/status

      - name: Run smoke tests
        run: |
          source venv/bin/activate
          pytest -m "smoke and p0" \
            --device_name="Pixel5" \
            --device_udid="$DEVICE_UDID" \
            --platform=android \
            --html=reports/report.html \
            --self-contained-html

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-report
          path: reports/
```

**self-hosted runner 實際架設**：在你的 Mac 上跑幾行指令，GitHub repo Settings → Actions → Runners → Add Runner 裡有完整步驟。讓 Mac 作為 runner 在背景持續跑，有 CI 觸發就接任務。

我的設置：一台 MacBook Pro 連 Android 裝置（GP 版），一台 Mac mini 連 iOS 裝置和另一台 Android（CN 版）。CI 根據 APK 類型把 job 分派到不同的 runner。

---

## 多台裝置並行：matrix 策略

```yaml
strategy:
  fail-fast: false
  matrix:
    device: [GP_Android, CN_Android, iOS]

jobs:
  test:
    runs-on: [self-hosted, "${{ matrix.device }}"]
```

每台裝置跑一個獨立的 job，同時進行。`fail-fast: false` 讓一台裝置失敗不影響其他台繼續跑。

關鍵是每個 job 要有自己的 Appium server port，不然多個 job 同時在同一台機器上跑會打架：

```yaml
- name: Run tests
  env:
    APPIUM_PORT: ${{ matrix.appium_port }}
  run: pytest --appium_port=${{ matrix.appium_port }}
```

---

## 幾個減少 CI 時間的細節

**關掉不必要的 log**。第三方 library 的 DEBUG log 會讓 CI 慢很多——Appium client、Selenium、urllib3 每個請求都在記東西：

```python
# conftest.py
import logging
logging.getLogger('urllib3.connectionpool').setLevel(logging.WARNING)
logging.getLogger('selenium.webdriver.remote.remote_connection').setLevel(logging.WARNING)
logging.getLogger('appium.webdriver.webdriver').setLevel(logging.WARNING)
```

這個調整讓我的專案 CI 時間減少了大約 15%。

**`uv` 取代 `pip`**。在 CI 上安裝 Python 依賴，`uv pip install` 比 `pip install` 快 5~10 倍。requirements.txt 幾十個套件，從 2 分鐘降到 20 秒。

**依賴快取**。把 venv 快取起來，lock file 沒變就跳過安裝：

```yaml
- uses: actions/cache@v4
  with:
    path: venv
    key: ${{ runner.os }}-venv-${{ hashFiles('requirements-ci.txt') }}
```

---

## 常見問題

**Q：conftest.py 和 fixtures/ 目錄的 fixture，pytest 都找得到嗎？**
A：需要在 conftest.py 裡用 `pytest_plugins` 明確宣告。每個 fixtures/ 裡的 .py 檔案作為模組名稱（不帶路徑分隔符）加進去，例如 `"fixtures.driver"`。pytest 掃到 conftest.py 時，會自動載入所有宣告的 plugin。

**Q：多台裝置並行的時候，測試資料會衝突嗎？**
A：取決於測試設計。如果每台裝置用獨立的測試帳號（不共用），通常沒問題。我的做法是依裝置 UDID 映射到不同的測試帳號，透過環境變數注入。同一個帳號被兩個測試同時操作是最常見的衝突來源。

**Q：`--reruns` 會不會讓 CI 時間加倍？**
A：只有失敗的測試才會重試，穩定通過的測試不受影響。如果大部分測試都穩定，整體時間增加很有限。如果每次 CI 都有很多重試，那是要解決測試穩定性問題，不是調整重試次數。

**Q：ReportPortal 和 Allure 哪個比較好？**
A：Allure 設定簡單、報告漂亮，適合小型專案或個人。ReportPortal 需要自己架設伺服器，但多個 launch 的歷史資料、失敗趨勢分析、跨裝置比較是 Allure 做不到的。裝置超過 2 台、測試量超過 100 個時，ReportPortal 的管理優勢才開始明顯。
