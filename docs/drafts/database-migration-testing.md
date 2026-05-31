# Database Migration 測試：Schema 改了，舊資料會怎樣

---

## 目錄

1. [那個只影響老用戶的 bug](#只影響老用戶的-bug)
2. [Migration 測試在解什麼問題](#在解什麼問題)
3. [三種必測的 Migration 情境](#三種情境)
4. [Rollback 的測試](#rollback-測試)
5. [結尾](#結尾)

---

## 那個只影響老用戶的 bug

我們的 App 有一次 Schema migration：把 `users` 表的 `subscription_type` 欄位從 `ENUM('free', 'pro')` 改成 `ENUM('free', 'pro', 'enterprise')`，同時把所有現有的 `pro` 用戶資料保持不變。

Migration 在 staging 跑完，沒有問題。上線。

上線一個小時後，客服開始收到老用戶的投訴：「我是 Pro 用戶，但 App 說我是免費版。」

查 log：那些用戶的 `subscription_type` 資料是正確的（值是 `pro`），但 App 讀取到的卻是 `free`。

根本原因：App 的後端程式碼有一個地方用了硬編碼的 ENUM index 來判斷訂閱類型——`if subscription_type_index == 1: is_pro`。ENUM 加了新值之後，index 的對應關係改變了，`pro` 的 index 從 1 變成 1（沒有變），但程式碼裡另一個地方用 index 0 當 `free`、index 1 當 `pro`，加了 `enterprise` 之後這個映射壞掉了。

Migration 沒有問題，是 Migration 之後的程式碼和舊的 ENUM 假設不相容。

這個 bug 只影響有特定程式碼路徑的舊用戶，新用戶不受影響，所以功能測試沒有發現。

---

## Migration 測試在解什麼問題

Database migration 的測試有兩個維度：

**1. Migration 本身是否正確**

Schema 改動後，資料是否被正確轉換？Index 是否被正確建立？Constraint 是否被正確加入？

這通常 DBA 或 RD 會驗證，但 QA 要確認的是：「Migration 後，系統的行為是否符合預期？」

**2. 舊資料在新 Schema 下的行為**

這是最容易被忽略的：Migration 之前存在的資料，在新 Schema 下是否仍然被正確處理？

新功能測試只測新的用戶路徑，但上線後面對的是有各種歷史狀態的老用戶。他們的資料可能在 migration 前就有各種邊界值，這些在功能測試中不會出現。

---

## 三種必測的 Migration 情境

**情境一：Migration 前後的資料讀取**

測試：Migration 執行前後，讀取同一筆資料，結果是否一致？

具體做法：
1. 在 staging 建立一批測試資料，覆蓋所有可能的舊格式
2. 執行 Migration
3. 讀取這批資料，確認值沒有意外改變

特別注意：NULL 值、空字串、邊界值（最大整數、最長字串）在 Migration 後的行為。

**情境二：新舊程式碼的相容性**

如果 Migration 是 backward-compatible（新舊 schema 都能讀），要測試舊版 App client 在新 schema 下的行為。

這個情境在 Mobile 特別重要：App 版本更新後，有用戶還在用舊版 App，他們的舊版 client 會遇到新的 DB schema。

測試方法：在測試環境保留一個舊版 App build，執行 Migration 後，用舊版 App 測試基本功能。

**情境三：Migration 中途的行為（Zero-downtime migration）**

對於不能停機的 production 環境，migration 是逐步進行的。在 migration 進行中，新舊兩個版本的 schema 同時存在。

這個「中間狀態」期間的系統行為需要特別測試：
- 同時有讀寫的情況下，資料是否一致
- 如果 migration 卡住或失敗，系統是否能繼續正常運作

---

## Rollback 的測試

Migration 有問題需要 rollback，rollback 本身也需要被測試過。

**Down migration 有沒有寫**

大部分的 migration 工具（Django migrations、Flyway、Liquibase）支援 up migration 和 down migration。Down migration 是「回滾這次改動」的腳本。

問題：很多人只寫 up migration，down migration 留空或不寫。Rollback 的時候發現 down migration 沒有實作，就需要手動修資料。

測試方法：在 staging 跑 up migration，然後跑 down migration，確認 schema 回到原始狀態，資料也沒有損毀。

**Rollback 後的資料完整性**

如果 up migration 已經新增了一些用新 schema 格式的資料，down migration 回滾後，這些資料怎麼辦？

這個問題需要在 migration 設計階段就想清楚，QA 要確認 PM 和 RD 對這個情境有共識。

---

## 實際的測試流程

```bash
# 1. 備份 staging DB（確保可以還原）
pg_dump staging_db > backup_before_migration.sql

# 2. 在 staging 執行 up migration
python manage.py migrate

# 3. 跑自動化測試，確認舊資料讀取正確
pytest tests/test_migration_data_integrity.py

# 4. 手動測試幾個老用戶帳號的功能
# (特別是有特殊歷史狀態的帳號)

# 5. 測試 down migration
python manage.py migrate my_app 0012_previous_migration

# 6. 確認 down migration 後資料完整
pytest tests/test_migration_rollback.py
```

---

## 結尾

那個只影響老用戶的 ENUM bug，事後做了 post-mortem，結論是：Migration 測試只測了「Migration 本身」，沒有測「Migration 後，舊的程式碼假設是否仍然成立」。

加了一條新的測試規則：每次 Schema 有改動，要 review 所有依賴這個欄位的程式碼，確認沒有隱性假設（hardcoded index、隱含的 ENUM 順序等）。

Migration 是後端工作，但它的影響是跨整個系統的。QA 在這裡的價值，是確認「改動後的行為和預期相符」——特別是針對那些最難測的、有歷史狀態的老用戶。
