# QA 中控後台：讓工讀生不需要找人就能完成測試任務

---

## 目錄

1. [工讀生的第一個問題](#第一個問題)
2. [中控後台解決了什麼](#解決了什麼)
3. [Email 帳號查詢：主要入口](#email-帳號查詢)
4. [App 工具與帳號管理](#app-工具)
5. [樹種、CI/CD、裝置](#其他功能)
6. [結尾](#結尾)

---

## 工讀生的第一個問題

QA 團隊加入工讀生之後，最常見的問題不是測試技能，是「我要去哪裡找這個資料？」Capgemini《World Quality Report 2024-25》的調查顯示，測試人員每天花在查詢測試資料和確認測試環境上的時間，平均超過工作時數的 30%——這些時間，本來應該用在真正的測試上。

- 「我要確認這個用戶有沒有收到生日禮盒，要怎麼查？」
- 「這個帳號的硬幣是多少、訂閱到什麼時候？」
- 「這個 APK 要裝到哪台裝置，哪台現在可以用？」

每個問題單獨看都不難，但每次都要找人問，就會打斷其他人的工作，也讓工讀生覺得自己很麻煩。

觀察了一個月後，發現這些問題有共同點：需要的資料存在，但沒有一個地方可以直接看到。

---

## 中控後台解決了什麼

我做了一個內部 Web 工具，叫 QA Portal（中控後台）。

目標很簡單：讓工讀生能自己找到測試需要的資料和工具，不需要問人。

整個 Portal 分成四個區塊：ADB 裝置、App/檔案工具、圖片/樹種、CI/CD 工具。

---

## Email 帳號查詢：主要入口

`/email_query` 是使用頻率最高的頁面。

輸入 Email 查到帳號後，右側展開一個 Drawer，裡面有 7 個 tab，涵蓋這個帳號的所有測試相關資料：

| Tab | 內容 |
|---|---|
| 帳號資訊 | email、service_level、coin、gem、統計數字 |
| 種植紀錄 | 種植歷史、每筆記錄的樹種圖片 |
| 陽光精華 | IAP 記錄 + 訂閱生效期間 |
| 產品解鎖 | 已解鎖的樹種和地皮清單 |
| 地皮擁有 | 擁有的地皮和取得來源 |
| 貨幣歷程 | 金幣 / 寶石異動記錄，delta 正負標色 |
| Delivery Items | 印花 / 金幣 / 寶石 / 樹種的 delivery 記錄，可按 type 篩選 |

測試訂閱流程的時候，不需要開 DB，在這裡就能看到這個帳號的 service_level 是不是 pro、陽光精華的生效期間是否正確、硬幣的異動是否符合預期。

---

## App 工具與帳號管理

**App/檔案工具**選單集中了測試過程中最常用的操作入口：

| 頁面 | 路由 | 說明 |
|---|---|---|
| Email 帳號查詢 | `/email_query` | 同上 |
| APK/IPA 管理 | `/apk` | 上傳、版本標籤、安裝面板 |
| 帳號管理工具 | `/account_tools` | 見下方 |
| 陽光精華日曆 | `/sunshine_essence` | 日曆視圖查詢 |
| 地皮資源檔確認 | `/land_skins_confirm` | 確認地皮 asset 完整性 |
| 地皮用戶查詢 | `/land_skin_user_query` | 地皮 → 擁有用戶（反向查詢） |
| 生日活動進度 | `/birthday_challenge` | 任務進度表 + 日曆，狀態篩選 |

**帳號管理工具**下面還有五個子模組：

| 模組 | 說明 |
|---|---|
| ADB 操作 | Kill / 重啟 Forest App、批量裝置操作 |
| 批量創建測試帳號 | 貼上匯入、格式驗證 |
| 升級專業版 | 多筆 user_id + 確認碼，批量升級 |
| Mock 種植紀錄 | 手動建立測試用種植資料 |
| Revoke Token | 強制 session 失效 |

生日活動那個頁面最常用。活動上線後，可以搜尋特定 Email，看到任務進度是 16/60 還是 60/60，狀態是 active、completed、reward_delivered 還是 failed，Available At 和 Completed At 的時間戳記一目了然。過去這些資料要開 DB 查，現在工讀生自己就能確認。

---

## 樹種、CI/CD、裝置

**圖片/樹種**選單處理樹種相關的資料管理：

| 頁面 | 路由 | 說明 |
|---|---|---|
| 樹種圖鑑 | `/tree_gallery` | 瀏覽所有樹種圖片 |
| 樹種屬性 | `/tree_catalog_admin` | 編輯樹種名稱和屬性 |
| 樹種 ZIP 上傳 | `/tree_zip_upload` | 批量上傳樹種圖包 |

測試新樹種上線的時候，工讀生可以直接在這裡確認圖片是否正確顯示，不需要在 App 裡一棵一棵找。

**CI/CD 工具**選單目前有一個頁面：

| 頁面 | 路由 | 說明 |
|---|---|---|
| GitHub Action 觸發器 | `/github_trigger` | 觸發 workflow、查最新執行狀態 |

可以直接從 Portal 觸發 CI workflow，不需要開 GitHub 。

**ADB 裝置**（頂層頁面）：

| 頁面 | 路由 | 說明 |
|---|---|---|
| ADB 裝置 | `/adb_device` | 裝置清單、連線狀態 |

測試開始前先確認哪台裝置在線，不用走去測試機旁邊看。

---

## 結尾

QA 工具不只是給自動化腳本用的。

一個讓工讀生能自主操作的中控介面，比多一份 SOP 文件更有效——SOP 回答「怎麼做」，工具直接讓人「做得到」。

Portal 建好之後，工讀生問「我要去哪裡找這個」這類問題的頻率明顯降低。DORA 的研究指出，降低流程中的「摩擦力」（friction）是提升工程效率最高投資報酬率的手段之一——而 QA Portal 的核心邏輯，正是把反覆查詢的摩擦力轉化為一次性的工具建置成本。更重要的是：他們在測試過程中發現異常，可以自己查資料確認，再決定要不要回報。不是每個奇怪的現象都要先問人才能繼續。

如果你的 QA 團隊有工讀生或新人，值得想一下：他們現在靠什麼找到測試需要的資料？如果答案是「問人」，那可能有個工具值得做。

---

## 參考資料

1. [Capgemini World Quality Report 2024-25](https://www.capgemini.com/insights/research-library/world-quality-report-2024-25/) — 測試環境與測試資料管理的全球挑戰調查
2. [DORA 2024 State of DevOps Report](https://dora.dev/research/2024/dora-report/) — 降低流程摩擦力對工程效能的影響研究
3. [Google Testing Blog](https://testing.googleblog.com/) — 測試基礎建設與工具化實踐的工程分享
4. [Ministry of Testing — Articles & Resources](https://www.ministryoftesting.com/) — QA 工具設計、測試流程優化與團隊效率的社群資源
5. [ISTQB — Software Testing Certification](https://www.istqb.org/) — 測試環境管理與測試資料管理的標準化定義
