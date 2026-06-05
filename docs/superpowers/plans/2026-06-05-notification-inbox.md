# Notification Inbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/notifications` page where blog readers can see all push notifications ever sent, with unread count badge on the tab bar icon.

**Architecture:** Supabase `notifications` table (public read) stores each push broadcast; `useNotifications` hook fetches the list and computes unread count from localStorage; `Nav.jsx` renders a red badge on the `/notifications` tab; `push-send.js` writes a record after a successful broadcast.

**Tech Stack:** React, Supabase JS v2, localStorage, Vitest + Testing Library, Cloudflare Pages Functions

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Execute SQL | Supabase SQL Editor | Create `notifications` table + RLS |
| Create | `src/hooks/useNotifications.js` | Fetch notifications, compute unreadCount, markAllRead |
| Create | `src/hooks/__tests__/useNotifications.test.js` | Unit tests for hook |
| Create | `src/components/NotificationBadge.jsx` | Red dot badge UI |
| Create | `src/components/__tests__/NotificationBadge.test.jsx` | Badge render tests |
| Create | `src/pages/Notifications.jsx` | Inbox page |
| Create | `src/pages/__tests__/Notifications.test.jsx` | Page tests |
| Modify | `src/components/NavIconMap.jsx` | Add `bell` icon key |
| Modify | `src/components/Nav.jsx` | Import useNotifications + NotificationBadge, render badge on /notifications tab |
| Modify | `src/App.jsx` | Add `/notifications` lazy route |
| Modify | `functions/api/push-send.js` | INSERT to notifications after successful send |

---

## Task 1: Supabase Migration

**Files:**
- Execute SQL in Supabase SQL Editor (no code file to edit)

- [ ] **Step 1: Run this SQL in Supabase SQL Editor**

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

- [ ] **Step 2: Verify table exists**

In Supabase Table Editor, confirm `notifications` table appears with columns: `id`, `title`, `body`, `url`, `sent_at`.

- [ ] **Step 3: Insert a test row to confirm RLS allows service-role writes**

```sql
INSERT INTO notifications (title, body, url)
VALUES ('測試通知', '這是測試內容', 'https://jimmy-hong-portfolio.pages.dev/blog/test');
```

Expected: 1 row inserted.

- [ ] **Step 4: Confirm public SELECT works**

```sql
SELECT * FROM notifications;
```

Expected: 1 row visible (public read policy active).

- [ ] **Step 5: Delete the test row**

```sql
DELETE FROM notifications WHERE title = '測試通知';
```

No commit needed for this task (SQL only).

---

## Task 2: `useNotifications` Hook

**Files:**
- Create: `src/hooks/useNotifications.js`
- Create: `src/hooks/__tests__/useNotifications.test.js`

### Context

The project uses Supabase JS v2. Other hooks follow this pattern (see `src/hooks/useSettings.js`):
```js
import { supabase } from '../lib/supabase'
supabase.from('table').select('*').then(({ data }) => { ... })
```

Tests mock `../../lib/supabase` using `vi.mock`. See `src/components/__tests__/Nav.test.jsx` for mock pattern.

localStorage key: `qa_read_notifs` — stores a JSON array of notification UUID strings.

- [ ] **Step 1: Write the failing test**

Create `src/hooks/__tests__/useNotifications.test.js`:

```js
import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useNotifications } from '../useNotifications'

const MOCK_NOTIFS = [
  { id: 'aaa', title: '文章 A', body: '內容 A', url: '/blog/a', sent_at: '2026-06-01T00:00:00Z' },
  { id: 'bbb', title: '文章 B', body: '內容 B', url: '/blog/b', sent_at: '2026-06-02T00:00:00Z' },
]

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: MOCK_NOTIFS }),
      }),
    }),
  },
}))

describe('useNotifications', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('returns notifications from supabase', async () => {
    const { result } = renderHook(() => useNotifications())
    await act(async () => {})
    expect(result.current.notifications).toHaveLength(2)
    expect(result.current.notifications[0].id).toBe('aaa')
  })

  it('unreadCount equals total when nothing in localStorage', async () => {
    const { result } = renderHook(() => useNotifications())
    await act(async () => {})
    expect(result.current.unreadCount).toBe(2)
  })

  it('unreadCount is 0 when all IDs in localStorage', async () => {
    localStorage.setItem('qa_read_notifs', JSON.stringify(['aaa', 'bbb']))
    const { result } = renderHook(() => useNotifications())
    await act(async () => {})
    expect(result.current.unreadCount).toBe(0)
  })

  it('markAllRead writes all IDs to localStorage and sets unreadCount to 0', async () => {
    const { result } = renderHook(() => useNotifications())
    await act(async () => {})
    expect(result.current.unreadCount).toBe(2)
    act(() => result.current.markAllRead())
    expect(result.current.unreadCount).toBe(0)
    const stored = JSON.parse(localStorage.getItem('qa_read_notifs') ?? '[]')
    expect(stored).toContain('aaa')
    expect(stored).toContain('bbb')
  })

  it('loading starts true and becomes false after fetch', async () => {
    const { result } = renderHook(() => useNotifications())
    expect(result.current.loading).toBe(true)
    await act(async () => {})
    expect(result.current.loading).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/hooks/__tests__/useNotifications.test.js
```

Expected: FAIL with "Cannot find module '../useNotifications'"

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useNotifications.js`:

```js
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'qa_read_notifs'

function getReadIds() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')) }
  catch { return new Set() }
}

function saveReadIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [readIds, setReadIds] = useState(() => getReadIds())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('notifications')
      .select('id, title, body, url, sent_at')
      .order('sent_at', { ascending: false })
      .then(({ data }) => {
        setNotifications(data ?? [])
        setLoading(false)
      })
  }, [])

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  const markAllRead = useCallback(() => {
    const allIds = new Set(notifications.map(n => n.id))
    saveReadIds(allIds)
    setReadIds(allIds)
  }, [notifications])

  return { notifications, unreadCount, loading, markAllRead }
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
npx vitest run src/hooks/__tests__/useNotifications.test.js
```

Expected: 5 passed

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useNotifications.js src/hooks/__tests__/useNotifications.test.js
git commit -m "feat(notifications): add useNotifications hook with localStorage read tracking"
```

---

## Task 3: `NotificationBadge` Component

**Files:**
- Create: `src/components/NotificationBadge.jsx`
- Create: `src/components/__tests__/NotificationBadge.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/NotificationBadge.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { NotificationBadge } from '../NotificationBadge'

describe('NotificationBadge', () => {
  it('renders count when count > 0', () => {
    render(<NotificationBadge count={3} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders 9+ when count > 9', () => {
    render(<NotificationBadge count={12} />)
    expect(screen.getByText('9+')).toBeInTheDocument()
  })

  it('renders nothing when count is 0', () => {
    const { container } = render(<NotificationBadge count={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when count is undefined', () => {
    const { container } = render(<NotificationBadge />)
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/components/__tests__/NotificationBadge.test.jsx
```

Expected: FAIL with "Cannot find module '../NotificationBadge'"

- [ ] **Step 3: Implement the component**

Create `src/components/NotificationBadge.jsx`:

```jsx
export function NotificationBadge({ count }) {
  if (!count) return null
  return (
    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none pointer-events-none">
      {count > 9 ? '9+' : count}
    </span>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
npx vitest run src/components/__tests__/NotificationBadge.test.jsx
```

Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add src/components/NotificationBadge.jsx src/components/__tests__/NotificationBadge.test.jsx
git commit -m "feat(notifications): add NotificationBadge component"
```

---

## Task 4: `Notifications` Page

**Files:**
- Create: `src/pages/Notifications.jsx`
- Create: `src/pages/__tests__/Notifications.test.jsx`

### Context

Other pages in `src/pages/` use a similar pattern — import a hook, render a list, handle empty state. The page uses Tailwind classes matching the rest of the site's style. Nav is NOT rendered inside pages (it wraps all routes in App.jsx).

The page calls `markAllRead()` on mount via `useEffect`. All notifications are shown — even those already marked read — so the user can see the full history.

- [ ] **Step 1: Write the failing test**

Create `src/pages/__tests__/Notifications.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import Notifications from '../Notifications'

const mockMarkAllRead = vi.fn()

vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [
      { id: 'aaa', title: '新文章：測試', body: '這是摘要', url: '/blog/test', sent_at: '2026-06-01T00:00:00Z' },
      { id: 'bbb', title: '另一篇文章', body: '另一個摘要', url: '/blog/other', sent_at: '2026-05-01T00:00:00Z' },
    ],
    unreadCount: 2,
    loading: false,
    markAllRead: mockMarkAllRead,
  }),
}))

describe('Notifications', () => {
  it('renders page title', () => {
    render(<Notifications />)
    expect(screen.getByText('通知')).toBeInTheDocument()
  })

  it('renders all notifications', () => {
    render(<Notifications />)
    expect(screen.getByText('新文章：測試')).toBeInTheDocument()
    expect(screen.getByText('另一篇文章')).toBeInTheDocument()
  })

  it('renders notification body text', () => {
    render(<Notifications />)
    expect(screen.getByText('這是摘要')).toBeInTheDocument()
  })

  it('calls markAllRead on mount', () => {
    mockMarkAllRead.mockClear()
    render(<Notifications />)
    expect(mockMarkAllRead).toHaveBeenCalledOnce()
  })
})

describe('Notifications — empty state', () => {
  it('shows empty state when no notifications', () => {
    vi.mocked(vi.importActual).mockImplementation(() => {})
  })
})
```

Replace the empty describe block with a proper separate mock setup:

```jsx
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Notifications from '../Notifications'

const mockMarkAllRead = vi.fn()
let mockNotifications = [
  { id: 'aaa', title: '新文章：測試', body: '這是摘要', url: '/blog/test', sent_at: '2026-06-01T00:00:00Z' },
  { id: 'bbb', title: '另一篇文章', body: '另一個摘要', url: '/blog/other', sent_at: '2026-05-01T00:00:00Z' },
]
let mockLoading = false

vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    unreadCount: 0,
    loading: mockLoading,
    markAllRead: mockMarkAllRead,
  }),
}))

describe('Notifications', () => {
  beforeEach(() => {
    mockNotifications = [
      { id: 'aaa', title: '新文章：測試', body: '這是摘要', url: '/blog/test', sent_at: '2026-06-01T00:00:00Z' },
      { id: 'bbb', title: '另一篇文章', body: '另一個摘要', url: '/blog/other', sent_at: '2026-05-01T00:00:00Z' },
    ]
    mockLoading = false
    mockMarkAllRead.mockClear()
  })

  it('renders page title', () => {
    render(<Notifications />)
    expect(screen.getByText('通知')).toBeInTheDocument()
  })

  it('renders all notifications', () => {
    render(<Notifications />)
    expect(screen.getByText('新文章：測試')).toBeInTheDocument()
    expect(screen.getByText('另一篇文章')).toBeInTheDocument()
  })

  it('renders notification body text', () => {
    render(<Notifications />)
    expect(screen.getByText('這是摘要')).toBeInTheDocument()
  })

  it('calls markAllRead on mount', () => {
    render(<Notifications />)
    expect(mockMarkAllRead).toHaveBeenCalledOnce()
  })

  it('shows loading state', () => {
    mockLoading = true
    mockNotifications = []
    render(<Notifications />)
    expect(screen.getByText('載入中…')).toBeInTheDocument()
  })

  it('shows empty state when no notifications', () => {
    mockNotifications = []
    render(<Notifications />)
    expect(screen.getByText('還沒有通知')).toBeInTheDocument()
  })
})
```

Write the above (the second, complete version) to the test file.

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/pages/__tests__/Notifications.test.jsx
```

Expected: FAIL with "Cannot find module '../Notifications'"

- [ ] **Step 3: Implement the page**

Create `src/pages/Notifications.jsx`:

```jsx
import { useEffect } from 'react'
import { useNotifications } from '../hooks/useNotifications'

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(0, mins)} 分鐘前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小時前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  return `${Math.floor(days / 30)} 個月前`
}

export default function Notifications() {
  const { notifications, loading, markAllRead } = useNotifications()

  useEffect(() => {
    markAllRead()
  }, [markAllRead])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-32">
      <h1 className="text-lg font-bold mb-6">通知</h1>
      {loading ? (
        <p className="text-sm text-gray-400">載入中…</p>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-gray-400">還沒有通知</p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {notifications.map(n => (
            <a
              key={n.id}
              href={n.url}
              className="py-4 block hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
            >
              <p className="text-sm font-medium text-gray-900 mb-1">{n.title}</p>
              <p className="text-xs text-gray-500 line-clamp-2 mb-1">{n.body}</p>
              <p className="text-xs text-gray-400">{relativeTime(n.sent_at)}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
npx vitest run src/pages/__tests__/Notifications.test.jsx
```

Expected: 6 passed

- [ ] **Step 5: Commit**

```bash
git add src/pages/Notifications.jsx src/pages/__tests__/Notifications.test.jsx
git commit -m "feat(notifications): add Notifications inbox page"
```

---

## Task 5: NavIconMap + Nav + App Integration

**Files:**
- Modify: `src/components/NavIconMap.jsx`
- Modify: `src/components/Nav.jsx`
- Modify: `src/App.jsx`

### Context

**NavIconMap.jsx** uses a shared props object `S` for SVG attributes. Add `bell` to `SVG_MAP` following the same pattern.

**Nav.jsx** currently renders the bottom tab bar like this:
```jsx
const inner = (
  <span
    aria-label={tab.label}
    className={`flex items-center justify-center rounded-xl py-3 px-4 transition-colors ${
      active ? 'text-white bg-white/15' : 'text-gray-500 hover:text-gray-300'
    }`}
  >
    {icon}
  </span>
)
```

The badge needs absolute positioning, so the `<span>` needs `relative` added to its className, and `<NotificationBadge>` is added inside it.

**App.jsx** uses lazy imports for all pages. Add `Notifications` as a lazy import and add the route.

Nav.test.jsx currently mocks `useSettings`. The new Nav also calls `useNotifications` — that mock must also be added to the existing Nav test file.

- [ ] **Step 1: Add `bell` icon to NavIconMap.jsx**

In `src/components/NavIconMap.jsx`, add `bell` as the last entry in `SVG_MAP`:

```jsx
export const SVG_MAP = {
  // ...existing entries...
  bell: <svg {...S} width="20" height="20"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
}
```

- [ ] **Step 2: Update Nav.jsx**

In `src/components/Nav.jsx`:

Add imports at the top (after existing imports):
```jsx
import { useNotifications } from '../hooks/useNotifications'
import { NotificationBadge } from './NotificationBadge'
```

Inside `export default function Nav()`, after the existing hook calls, add:
```jsx
const { unreadCount } = useNotifications()
```

In the bottom tab bar's `tabs.map`, find the `inner` span and:
1. Add `relative` to the span's className
2. Add `<NotificationBadge count={tab.url === '/notifications' ? unreadCount : 0} />` inside the span after `{icon}`

The updated `inner` element:
```jsx
const inner = (
  <span
    aria-label={tab.label}
    className={`relative flex items-center justify-center rounded-xl py-3 px-4 transition-colors ${
      active ? 'text-white bg-white/15' : 'text-gray-500 hover:text-gray-300'
    }`}
  >
    {icon}
    <NotificationBadge count={tab.url === '/notifications' ? unreadCount : 0} />
  </span>
)
```

- [ ] **Step 3: Update Nav.test.jsx to mock useNotifications**

In `src/components/__tests__/Nav.test.jsx`, add this mock after the existing `vi.mock('../../hooks/useSettings', ...)` line:

```js
vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: () => ({ unreadCount: 0, notifications: [], loading: false, markAllRead: vi.fn() }),
}))
```

- [ ] **Step 4: Run Nav tests to verify they still pass**

```bash
npx vitest run src/components/__tests__/Nav.test.jsx
```

Expected: all existing tests pass

- [ ] **Step 5: Add route to App.jsx**

In `src/App.jsx`, add lazy import after existing lazy imports:

```jsx
const Notifications = lazy(() => import('./pages/Notifications'))
```

Add route inside `<Routes>`, after the `/faq` route:

```jsx
<Route path="/notifications" element={<Notifications />} />
```

- [ ] **Step 6: Run full test suite**

```bash
npx vitest run
```

Expected: same pre-existing failures as before (AdminPostEdit, AdminPosts, AdminSubscribers, MarkdownContent), no new failures

- [ ] **Step 7: Commit**

```bash
git add src/components/NavIconMap.jsx src/components/Nav.jsx src/components/__tests__/Nav.test.jsx src/App.jsx
git commit -m "feat(notifications): add bell icon, Nav badge, /notifications route"
```

---

## Task 6: `push-send.js` — Write Notification Record on Send

**Files:**
- Modify: `functions/api/push-send.js`

### Context

`push-send.js` is a Cloudflare Pages Function at `/functions/api/push-send.js`. It sends VAPID push notifications to all subscribers. At the end, it returns `json({ sent, removed })`.

`env.SUPABASE_URL` and `env.SUPABASE_SERVICE_KEY` are already used in this file to fetch `push_subscriptions`. The same pattern is used to write to `notifications`.

Only write the record when `sent > 0` — if nobody received the push, don't log a phantom notification.

The `SITE_URL` env var is available (used by email-broadcast.js).

- [ ] **Step 1: Locate the return statement in push-send.js**

The file ends with:
```js
  return json({ sent, removed: toRemove.length })
```

- [ ] **Step 2: Add the notification INSERT before the return**

Replace the final `return json(...)` with:

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

  return json({ sent, removed: toRemove.length })
```

Note: `stripMarkdown` is already imported at the top of this file — no new import needed.

- [ ] **Step 3: Verify the full push-send.js looks correct**

The complete modified file should have this structure:
1. Imports (`buildVapidAuth`, `encryptPushPayload`, `stripMarkdown`)
2. CORS constant + `json()` helper
3. `onRequestOptions` export
4. `onRequestPost` export containing:
   - Auth check (`PUSH_SECRET`)
   - Parse `{ title, excerpt, slug }` from body
   - Fetch `push_subscriptions` from Supabase
   - Send loop with VAPID encryption
   - Remove expired subscriptions
   - **New:** INSERT to `notifications` if `sent > 0`
   - Return `json({ sent, removed })`

- [ ] **Step 4: Run full test suite to confirm no regressions**

```bash
npx vitest run
```

Expected: same pre-existing failure count, no new failures

- [ ] **Step 5: Commit**

```bash
git add functions/api/push-send.js
git commit -m "feat(notifications): write notification record to Supabase after push send"
```

---

## Self-Review Checklist

After writing this plan, checking against the spec:

**Spec coverage:**
- ✅ Supabase `notifications` table + RLS — Task 1
- ✅ `useNotifications` hook with localStorage tracking — Task 2
- ✅ `NotificationBadge` component — Task 3
- ✅ `/notifications` page with markAllRead on mount — Task 4
- ✅ `bell` icon in NavIconMap — Task 5
- ✅ Nav badge on /notifications tab — Task 5
- ✅ `/notifications` route in App — Task 5
- ✅ push-send.js writes to notifications — Task 6

**Placeholder scan:** No TBDs or incomplete steps.

**Type consistency:** `useNotifications` returns `{ notifications, unreadCount, loading, markAllRead }` — used consistently in Notifications.jsx (destructures `notifications, loading, markAllRead`) and Nav.jsx (destructures `unreadCount`). `NotificationBadge` exported as named export `{ NotificationBadge }` — imported consistently.
