# 設計文件：後台 Email 訂閱管理頁面

日期：2026-06-04

---

## 功能範圍

在現有後台新增「訂閱管理」頁面，提供：
1. 訂閱者清單（唯讀）
2. 廣播文章通知（選文章 → 預覽 → 確認送出）

---

## 頁面結構

**路由：** `/admin/subscribers`
**Sidebar：** 新增 `📧 訂閱管理` NavLink

### 上半：訂閱者清單

- 資料來源：Supabase `email_subscribers` 表
- 欄位顯示：`email`、`confirmed`（✅ 已確認 / ⏳ 待確認）、`created_at`
- 排序：`created_at` 倒序
- 頂部顯示已確認訂閱者總數

### 下半：發送文章通知

1. 下拉選單：載入已發布文章（`posts` where `published = true`），顯示標題
2. 預覽區：根據選定文章即時渲染 email HTML（與 `email-send.js` 模板一致）
3. 訂閱者數量提示：「將發送給 N 位已確認訂閱者」
4. 「發送通知」按鈕 → `window.confirm` 確認 → 呼叫 API → 顯示送出結果（`已發送給 N 位訂閱者`）

---

## API

### 新建 `functions/api/admin/email-broadcast.js`

**Method：** POST

**認證：** Supabase JWT（前端從 `supabase.auth.getSession()` 取得）
- CF Function 用 `SUPABASE_URL + /auth/v1/user` 驗證 JWT
- 確認 user email === `env.ADMIN_EMAIL`（已存在的環境變數）

**Request body：**
```json
{ "title": "...", "excerpt": "...", "slug": "..." }
```

**行為：**
1. 驗證 JWT 為 admin
2. 從 Supabase 取 `email_subscribers` where `confirmed = true`（`email`, `token`）
3. 逐一用 Brevo 發送（`Promise.allSettled`）
4. 回傳 `{ sent: N }`

**Response：**
- `200 { sent: N }` — 成功
- `401 { error: 'Unauthorized' }` — JWT 無效或非 admin
- `400 { error: '...' }` — 參數缺失

---

## 新增 / 修改檔案

| 動作 | 檔案 | 說明 |
|------|------|------|
| 新建 | `functions/api/admin/email-broadcast.js` | 廣播 API，JWT 認證 |
| 新建 | `src/pages/admin/AdminSubscribers.jsx` | 訂閱管理頁面 |
| 修改 | `src/pages/admin/AdminLayout.jsx` | 加 sidebar 連結 |
| 修改 | `src/App.jsx` | 加 `/admin/subscribers` 路由 |

---

## 不在範圍內

- 手動刪除訂閱者（唯讀清單）
- 自動發送（需手動觸發）
- 匯出 CSV
- 分頁（訂閱者若超過 100 筆再評估）
