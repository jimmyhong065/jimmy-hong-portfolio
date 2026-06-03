# Web Push Notifications — Design Spec

Date: 2026-06-03

## Overview

Add Web Push notifications to the personal blog so subscribers receive a browser notification when a new article is published. Trigger is manual: admin clicks "送出通知" after publishing.

## Architecture

```
User clicks Nav bell
  → request Notification permission
  → create PushSubscription (endpoint + keys)
  → POST /api/push-subscribe → stored in Supabase

Admin clicks "送出通知" on published post
  → POST /api/push-send (title, excerpt, slug)
  → Pages Function fetches all subscriptions
  → signs VAPID JWT via Web Crypto API
  → sends push to each subscriber endpoint
  → device receives push → Service Worker shows notification
  → user clicks notification → opens /blog/[slug]
```

## Components

| Component | Location |
|-----------|----------|
| `push_subscriptions` table | Supabase |
| VAPID keys + secrets | Cloudflare Pages env vars |
| `/api/push-subscribe.js` | `/functions/api/` |
| `/api/push-send.js` | `/functions/api/` |
| `sw.js` | `/public/` |
| Bell icon + subscription logic | `Nav.jsx` |
| Send notification button | `AdminPostEdit.jsx` |

## Data Model

### Supabase: `push_subscriptions`

```sql
create table push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz default now()
);
```

- `endpoint`: unique push server URL identifying one browser subscription
- `p256dh` / `auth`: encryption keys used when sending push payload
- `unique` on endpoint prevents duplicate rows for the same browser
- All writes use Supabase service role key (bypasses RLS)

### Cloudflare Pages Environment Variables

| Variable | Description |
|----------|-------------|
| `VAPID_PUBLIC_KEY` | Base64url public key — also exposed to frontend |
| `VAPID_PRIVATE_KEY` | Private key — server only |
| `VAPID_SUBJECT` | `mailto:jimmyhong@seekrtech.com` |
| `SUPABASE_URL` | Same as existing `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_KEY` | New — service role key, bypasses RLS |
| `PUSH_SECRET` | Protects `/api/push-send` (same pattern as `UPLOAD_SECRET`) |

VAPID keys are generated once via `npx web-push generate-vapid-keys` and stored as env vars. Never regenerate — all existing subscriptions become invalid if keys change.

## Pages Functions

### `POST /api/push-subscribe`

- **Auth**: none (public)
- **Body**: `{ endpoint, keys: { p256dh, auth } }`
- **Action**: upsert into `push_subscriptions` (conflict on endpoint → ignore)
- **Response**: `200 OK`

### `DELETE /api/push-subscribe`

- **Auth**: none (public)
- **Body**: `{ endpoint }`
- **Action**: delete row where `endpoint = ?`
- **Response**: `200 OK`

### `POST /api/push-send`

- **Auth**: `Authorization: Bearer <PUSH_SECRET>`
- **Body**: `{ title, excerpt, slug }`
- **Action**:
  1. Fetch all rows from `push_subscriptions`
  2. For each subscription, sign VAPID JWT using Web Crypto API (P-256 ECDSA)
  3. POST encrypted payload to `subscription.endpoint`
  4. On 410 / 404 response → delete subscription (expired device cleanup)
- **Response**: `{ sent: N, removed: M }`
- **VAPID signing**: implemented via Web Crypto API — no npm packages needed, native in CF Pages Functions runtime

## Service Worker (`public/sw.js`)

Scope: push notifications only. No caching or offline support.

### `push` event

```
data: { title, excerpt, slug }
→ self.showNotification(title, {
    body: excerpt,
    icon: '/avatar.jpg',
    badge: '/favicon.svg',
    data: { slug },
    tag: slug,           // prevents duplicate notifications for same post
  })
```

### `notificationclick` event

```
→ close notification
→ clients.openWindow('/blog/' + event.notification.data.slug)
```

### Registration

Registered in `Nav.jsx` (or `main.jsx`) on component mount:
```js
navigator.serviceWorker.register('/sw.js')
```

## Frontend UI

### Nav Bell Icon (`Nav.jsx`)

Three states based on `Notification.permission` + SW pushManager subscription check:

| State | Icon | On Click |
|-------|------|----------|
| `default` (unknown) | bell outline | request permission → subscribe |
| `subscribed` | bell filled | unsubscribe (DELETE /api/push-subscribe) |
| `denied` | hidden | not shown |

**Subscribe flow:**
```
click
→ Notification.requestPermission()
→ if granted:
    swReg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY  // from import.meta.env
    })
→ POST /api/push-subscribe with subscription data
→ set state to subscribed
```

### Admin Send Button (`AdminPostEdit.jsx`)

Shown only when `post.published === true`. Appears as a section below the editor:

```
┌─────────────────────────────────┐
│  推播通知                        │
│  標題：[post.title]              │
│  摘要：[post.excerpt first 100]  │
│  [送出通知給所有訂閱者]  [結果]   │
└─────────────────────────────────┘
```

On click → POST `/api/push-send` → show result: `已送出 N 人` or error message.

## Mobile Support

- **Android Chrome/Firefox**: full support, no extra steps
- **iOS Safari 16.4+**: requires user to "Add to Home Screen" before push subscription is possible. Bell icon is shown on iOS but subscription only succeeds after PWA install. On failure, show a tooltip: "iOS 需先將網站加入主畫面"

## Error Handling

| Scenario | Handling |
|----------|---------|
| Permission denied | Hide bell icon |
| SW registration fails | Bell icon hidden, no crash |
| 410 / 404 from push server | Auto-delete subscription in push-send |
| push-send called on draft | Button not shown (guarded by `published` check) |
| Network error during subscribe | Show inline error, don't change state |
