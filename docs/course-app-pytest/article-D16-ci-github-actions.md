---
title: 接進 CI：讓 App 自動化變回歸防線
excerpt: 自動化測試的價值，在能擋住合併前的回歸。這篇講把 pytest+Appium 接進 GitHub Actions 的策略——Android emulator 與 iOS self-hosted runner 的差異，並收尾談 QA 在 DevOps 中的角色。
tags: [CI, GitHub Actions, DevOps, QA 實戰]
status: draft
---

# 接進 CI：讓 App 自動化變回歸防線

本機跑得過的測試，只有你一個人知道。接進 CI 之後，每一次 push 都有人幫你守門——這才是自動化的終點。

## CI 的目標

把自動化變回歸防線，流程要做到四件事：

1. **push / PR 觸發**——程式碼一進去就跑，不等人手動。
2. **跑測試、輸出結果**——失敗要可讀，ReportPortal 接收報告、標記失敗項目。
3. **不達標擋合併**——GitHub branch protection 設 required status checks，紅燈就不讓 merge。
4. **結果可追溯**——artifact 存測試截圖、log，事後查問題有憑據。

沒有第三點，自動化只是跑著看的儀表板，不是防線。

## GitHub Actions 跑 Appium 的現實

### Android：可以跑，但要額外設定

GitHub-hosted runner（`ubuntu-latest`）沒有內建 Android emulator，要靠 `reactivecircus/android-emulator-runner` Action 建立 AVD、啟動 emulator、等待 boot 完成。

Android workflow 骨架：

```yaml
name: Android Smoke Tests

on:
  pull_request:
    branches: [main]

jobs:
  android-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Start Appium
        run: |
          npm install -g appium
          appium driver install uiautomator2
          appium &

      - uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 31
          arch: x86_64
          profile: pixel_6
          script: pytest tests/smoke/ --reportportal -q
        env:
          RP_ENDPOINT: ${{ secrets.RP_ENDPOINT }}
          RP_UUID: ${{ secrets.RP_UUID }}
          RP_PROJECT: ${{ secrets.RP_PROJECT }}

      - name: Upload artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-screenshots
          path: screenshots/
```

`reactivecircus/android-emulator-runner` 會啟動 emulator 再執行 `script`；emulator ready 之前它會自動等待，不需要自己寫 polling。

### iOS：hosted runner 不理想

GitHub-hosted macOS runner 有 Xcode，但 iOS Simulator 在虛擬化環境跑不穩，session 建立慢、偶有 kernel panic。實務上有兩條路：

| 方案 | 特點 |
|------|------|
| **Self-hosted Mac runner** | 接一台實體 Mac Mini 當 runner，環境完全自控，成本一次性 |
| **雲端設備農場（D15）** | BrowserStack / Sauce Labs 在 CI 跑真機，`USE_CLOUD=1` 一個環境變數切換 |

iOS 測試建議：PR 階段跑 Android emulator smoke 擋門，iOS 完整回歸改排程跑在 self-hosted 或雲端農場，不用等 hosted runner。

## 策略：哪些測試進 CI

不是所有測試都應該進 PR gate——測試進 CI 的原則是**速度換覆蓋的取捨**：

```
PR 觸發（快，< 5 min）
  └── smoke suite：登入、核心流程、主要 P0 場景
      └── 跑 Android emulator
      └── 失敗擋 merge

夜間排程（慢，可以跑 30 min+）
  └── full regression：所有用例、邊界場景
      └── 雲端農場跑多機型（Samsung / Xiaomi / 舊版 Android / iOS 真機）
      └── 結果送 ReportPortal，失敗發 Slack 通知

Flaky 隔離區（D13）
  └── quarantine 標籤的測試不進 gate
  └── 單獨排程跑，觀察穩定度，穩了再回歸主 suite
```

gate 測試要夠快、夠穩——一旦開發者開始忽略紅燈，防線就形同虛設。

## 收尾：QA 在 DevOps 的角色

自動化測試是品質的安全網，不是取代人的判斷。它能擋住「昨天還好的功能今天壞了」這類回歸，但它擋不住「需求本身就錯了」或「邊界情境沒想到」。

QA 在 DevOps 的價值不是跑測試，而是三件事：

- **設計這張網**——決定哪些場景值得自動化、怎麼分層、怎麼擺進 CI。
- **讀懂它的訊號**——失敗是 bug 還是 flaky？報告在說什麼？該升級優先級還是先隔離？
- **推動可測性**——跟開發討論 testability，讓 app 本身好測，而不是靠硬撬。

這門課從第一個 `assert` 開始，走過 POM、fixture、parametrize、平行、視覺、效能、雲端真機，最後把整套框架接進 CI。從你在本機寫下第一個測試，到可維護的框架，再到團隊的回歸防線——自動化的價值，就在這條路走完之後。

## 帶得走

- PR gate 跑 smoke（< 5 min）、夜間排程跑 full regression；速度和覆蓋分開管。
- Android emulator 用 `reactivecircus/android-emulator-runner@v2`；iOS 優先 self-hosted Mac runner 或雲端農場。
- Flaky 測試進 quarantine，不擋 gate，單獨觀察穩定度後再回主 suite。
- `RP_ENDPOINT` / `RP_UUID` 這類憑證存 GitHub Secrets，不寫進 YAML。
- 失敗截圖上傳 artifact（`if: failure()`），事後查問題有憑據。
- QA 在 DevOps 的角色：設計安全網、讀懂訊號、推動可測性——自動化本身是工具，判斷力才是核心。
