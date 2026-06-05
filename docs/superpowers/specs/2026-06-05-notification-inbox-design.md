# Notification Inbox — Design Spec

Date: 2026-06-05

## Goal

讓訂閱推播的讀者可以在 `/notifications` 頁面看到所有曾發送的通知，並追蹤已讀/未讀狀態。

---

## Architecture

```
push-send.js (CF Worker)
  └── 發完推播後 INSERT INTO notifications

Supabase notifications 表
  └── 公開讀取（任何人）
      管理員寫入（service key）

/notifications 頁面
  └── 從 Supabase 拉全部通知
      localStorage 追蹤已讀 ID
      頁面開啟時 markAllRead()

Tab bar
  └── Admin 後台手動新增「通知」tab（url=/notifications, icon=bell）
      未讀 badge 顯示在 tab icon 旁
```

---

## Data Schema

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON notifications
  FOR SELECT USING (true);

CREATE POLICY "service insert" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

---

## Notification Record Schema

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | UUID | 主鍵，前端用來追蹤已讀 |
| `title` | TEXT | 文章標題 |
| `body` | TEXT | 摘要（最多 120 字） |
| `url` | TEXT | 文章完整 URL（e.g. `https://…/blog/slug`） |
| `sent_at` | TIMESTAMPTZ | 發送時間，預設 now() |

---

## localStorage 已讀追蹤

- Key: `qa_read_notifs`
- Value: `["uuid1", "uuid2", ...]`（已讀通知 ID 陣列）
- 頁面開啟時讀取，並加入所有當前通知 ID → 全標為已讀
- 未讀 count = 全部通知 ID 集合 - localStorage 已讀集合

---

## Files

| 動作 | 路徑 |
|------|------|
| 新增 | `src/hooks/useNotifications.js` |
| 新增 | `src/pages/Notifications.jsx` |
| 新增 | `src/components/NotificationBadge.jsx` |
| 修改 | `src/components/NavIconMap.jsx` — 新增 `bell` icon |
| 修改 | `src/components/Nav.jsx` — tab icon 旁加 badge |
| 修改 | `src/App.jsx` — 新增 `/notifications` 路由 |
| 修改 | `functions/api/push-send.js` — 發完後 INSERT notifications |
| 執行 | Supabase SQL Migration |

---

## `useNotifications.js`

```js
export function useNotifications() {
  // 從 Supabase 讀 notifications（order by sent_at desc）
  // 從 localStorage 讀已讀 ID set
  // 回傳: { notifications, unreadCount, markAllRead }
}
```

介面：
- `notifications` — `[{ id, title, body, url, sent_at }]`
- `unreadCount` — number
- `markAllRead()` — 把所有 ID 寫進 localStorage

---

## `Notifications.jsx`

- 頁面 mount 時呼叫 `markAllRead()`
- 每則通知顯示：
  - 標題（未讀：字體較深 + 左側 3px 藍色邊線；已讀：正常灰色）
  - 相對時間（e.g. 「3 天前」）
  - 點擊 → 跳轉 `url`
- 空狀態：「還沒有通知」
- 無需分頁（通知數量少）

---

## `NotificationBadge.jsx`

```jsx
// 紅點數字，count=0 時不 render
export function NotificationBadge({ count }) { ... }
```

---

## `Nav.jsx` 修改

在 Nav 層級呼叫 `useNotifications()` 取得 `unreadCount`。

每個 tab icon 旁都疊加 `<NotificationBadge count={...} />`，但只有 `/notifications` tab 才傳入 `unreadCount`，其餘 tab 傳 `0`。`count=0` 時 badge 不 render，視覺上只有通知 tab 有紅點。

```jsx
const notifCount = tab.url === '/notifications' ? unreadCount : 0
// icon 旁: <NotificationBadge count={notifCount} />
```

---

## `NavIconMap.jsx` 修改

新增 `bell` key：

```jsx
bell: (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
),
```

---

## `push-send.js` 修改

在 `return json({ sent, removed })` 前新增：

```js
if (sent > 0) {
  await fetch(`${env.SUPABASE_URL}/rest/v1/notifications`, {
    method: 'POST',
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      title,
      body: stripMarkdown(excerpt).slice(0, 120),
      url: `${env.SITE_URL}/blog/${slug}`,
    }),
  })
}
```

只有 `sent > 0` 才寫紀錄（至少一個裝置收到才算有效通知）。

---

## `App.jsx` 修改

```jsx
import Notifications from './pages/Notifications'
// 在路由裡加：
<Route path="/notifications" element={<Notifications />} />
```

---

## Supabase Migration

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON notifications
  FOR SELECT USING (true);

CREATE POLICY "service insert" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

---

## Out of Scope

- email-broadcast 不寫 notifications（email 訂閱族群不同）
- 刪除通知紀錄功能
- 分頁（通知數量少）
- 跨裝置已讀同步
- Push 訂閱綁定（非訂閱者也能看通知列表）
