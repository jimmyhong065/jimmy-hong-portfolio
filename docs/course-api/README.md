# API 自動化測試課程 — 從觀念到工程化

> 定位：獨立新課，講「API 自動化測試怎麼想、怎麼設計、怎麼用 Python 做出來、怎麼進 CI」。
> 教學哲學：**觀念與方法論先行，Python 範例（requests + pytest + jsonschema）當落地支撐**——跟效能測試課（`docs/course-perf/`）同一個節奏。
> 視角：QA IC 講師。每篇 hook 開場、含可跑範例、收尾「帶得走」。
> 狀態：草稿（本地）。一課一檔 `article-Axx/Bxx/Cxx/Dxx-*.md`。

## 課程定位

- **甜蜜點**：API 測試在測試金字塔的中層——比 UI 測試穩定快速、比單元測試貼近真實業務行為，是自動化投報率最高的一層。
- **觀念為主**：先講「測什麼、怎麼設計用例、驗什麼」，再講「用 Python 怎麼寫」。工具會換，方法論不會。
- **可跑**：Python 範例以 `requests` 發請求、`pytest` 組織斷言、`jsonschema` 守契約。練習站用 `automationintesting.online` 與 `restful-booker.herokuapp.com`。

## 與其他課的交叉（可選內鏈，不強綁）

| 本課 | 連到 |
|---|---|
| D18 API 也要壓效能 | 效能測試課 L01〜、k6 課 K01〜 |
| D17 接 CI 當品質門檻 | k6 課 K07 GitHub Actions、perf L20 常態化 |
| B07 驗副作用（DB 狀態） | perf L14 DB 瓶頸（同一個「副作用要落到資料層驗」精神） |

## 課綱（20 課 / 4 模組）

### 模組 A · 觀念與底層
- **A01** 為什麼 API 測試是自動化的甜蜜點（金字塔中層、比 UI 穩、比 unit 貼業務）
- **A02** 一支 API 你該知道什麼：URL／method／header／body／status code／契約
- **A03** 沒有 API 文件怎麼辦：用 DevTools 逆推一支 API
- **A04** HTTP／REST 必備底層：status code 語義、冪等性、Content-Type、認證機制總覽

### 模組 B · 測試設計
- **B05** API 用例設計：正常／異常／邊界，把黑箱測試技術套到 API
- **B06** 分型別設計：Search／CRUD／Import／Export 各自的測試發想
- **B07** 到底驗什麼：status／body／schema／副作用（DB、狀態）／冪等
- **B08** 認證與授權測試：token／cookie／session、權限矩陣、越權

### 模組 C · Python 實作
- **C09** requests 發第一支 API 測試
- **C10** 用 session 串多步測試流程
- **C11** API Object 設計：把 API 封裝成可複用物件
- **C12** 接 pytest：斷言、fixture、參數化、測試組織
- **C13** Schema 驗證：jsonschema／pydantic 守住契約
- **C14** 測試資料管理：準備／清理、隔離、可重跑與冪等

### 模組 D · 進階與工程化
- **D15** Mock／Stub：依賴隔離，第三方不可控時怎麼測
- **D16** 契約測試（Contract Testing）：消費者驅動、Pact 概念、微服務為何需要
- **D17** 接 CI：GitHub Actions 跑 API 回歸、報告、當品質門檻
- **D18** 與效能／安全交界：API 也要壓（連 k6 課）、基本安全檢查
- **D19** 反模式與最佳實踐：脆弱測試、硬編碼、過度驗證、金字塔失衡
- **D20** 收尾：把 API 自動化變成團隊能力（左移、常態化、覆蓋率思維）

## 每篇格式規範

- **frontmatter**：`title` / `excerpt` / `tags`（含「API 測試」+ 主題標籤）/ `status: draft`
- **結構**：hook 開場（痛點或反直覺場景）→ 觀念 → 實戰案例（可跑 Python 範例）→ 收尾「帶得走」條列 → 內鏈
- **字數**：觀念篇 ~1300〜1500 字；實作篇可較長（含 code）
- **語言慣例**：繁中正文用全形標點（跳過 frontmatter／inline code／code fence）；不提來源書名／作者，當通用知識寫
- **圖**：流程或架構需要時用 Mermaid（diamond `{}` label 不放 `\n`）

## 來源素材

- iThome 鐵人賽 Day20「認識 API 測試」、Day21「應用 Python 作 API 測試」→ A03／B05／B06／C09／C10／C11 的種子。
- 其餘篇章為通用 API 測試最佳實踐擴寫。

## 狀態

全 20 課待起草。發布走 publish-qa-blog 流程（一次一篇 upload 到 Supabase）。
