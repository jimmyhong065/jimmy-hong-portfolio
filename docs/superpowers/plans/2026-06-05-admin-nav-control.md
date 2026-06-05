# Admin Nav Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓後台可控制手機 tab bar：顯示/隱藏、排序、修改標籤/URL、新增/刪除 tab，並支援 12 個 SVG 圖示。

**Architecture:** `nav_tabs` JSONB 存在 Supabase `settings` 表（id=1），`NavIconMap.jsx` 共用 SVG_MAP，`Nav.jsx` 改讀 settings.nav_tabs，`AdminSettings.jsx` 加管理 UI。Nav fallback 原本 5 個 tab 當 nav_tabs 為 null。

**Tech Stack:** React, Tailwind CSS, Supabase JS Client

---

## File Map

| 檔案 | 動作 | 說明 |
|------|------|------|
| `src/components/NavIconMap.jsx` | Create | SVG_MAP + FALLBACK_TABS |
| `src/hooks/useSettings.js` | Modify | default state 加 nav_tabs: null |
| `src/components/Nav.jsx` | Modify | 用 settings.nav_tabs 取代 hardcoded TABS |
| `src/pages/admin/AdminSettings.jsx` | Modify | 加手機選單管理區塊 |
| Supabase SQL | Execute | ALTER TABLE settings ADD COLUMN nav_tabs |

---

## Task 1: NavIconMap.jsx

**Files:**
- Create: `src/components/NavIconMap.jsx`

- [ ] **Step 1: 建立 NavIconMap.jsx**

建立 `/Users/jimmyhong/Desktop/qa_self_blog/src/components/NavIconMap.jsx`：

```jsx
const S = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

export const SVG_MAP = {
  projects: <svg {...S}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  blog:     <svg {...S}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M9 12h6M9 16h6"/></svg>,
  saved:    <svg {...S}><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>,
  faq:      <svg {...S}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></svg>,
  about:    <svg {...S}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  camera:   <svg {...S}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  home:     <svg {...S}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  star:     <svg {...S}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  link:     <svg {...S}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  mail:     <svg {...S}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  chart:    <svg {...S}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  code:     <svg {...S}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
}

export const ICON_KEYS = Object.keys(SVG_MAP)

export const FALLBACK_TABS = [
  { id: '1', label: '作品集', url: '/projects', icon_key: 'projects', visible: true, order: 0 },
  { id: '2', label: '部落格', url: '/blog',     icon_key: 'blog',     visible: true, order: 1 },
  { id: '3', label: '收藏',   url: '/saved',    icon_key: 'saved',    visible: true, order: 2 },
  { id: '4', label: 'FAQ',    url: '/faq',      icon_key: 'faq',      visible: true, order: 3 },
  { id: '5', label: '關於我', url: '/about',    icon_key: 'about',    visible: true, order: 4 },
]
```

- [ ] **Step 2: Commit**

```bash
git add src/components/NavIconMap.jsx
git commit -m "feat(nav): add NavIconMap with SVG_MAP and FALLBACK_TABS"
```

---

## Task 2: Supabase Migration

**Files:**
- Supabase SQL Editor

- [ ] **Step 1: 執行 SQL**

在 Supabase Dashboard → SQL Editor 執行：

```sql
ALTER TABLE settings ADD COLUMN IF NOT EXISTS nav_tabs JSONB DEFAULT NULL;
```

Expected: 執行成功，無錯誤。

- [ ] **Step 2: 更新 useSettings default state**

修改 `src/hooks/useSettings.js`，在 `useState` 初始值加 `nav_tabs: null`：

```js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSettings() {
  const [settings, setSettings] = useState({
    email: '', github_url: '', linkedin_url: '', avatar_url: '',
    photo_avatar_url: '', seo_keywords: '', seo_description: '',
    seo_photo_keywords: '', seo_photo_description: '', nav_tabs: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else if (data) setSettings(data)
        setLoading(false)
      })
  }, [])

  return { settings, loading, error }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSettings.js
git commit -m "feat(settings): add nav_tabs field to useSettings"
```

---

## Task 3: Nav.jsx — 動態 Tab Bar

**Files:**
- Modify: `src/components/Nav.jsx`

- [ ] **Step 1: 替換 TABS 區段**

在 `src/components/Nav.jsx` 開頭：

1. 移除整個 `const TABS = [...]` 陣列（第 6–57 行左右，從 `const TABS = [` 到最後的 `]`）
2. 加入 import：

```js
import { SVG_MAP, FALLBACK_TABS } from './NavIconMap'
```

- [ ] **Step 2: 更新 tab bar 渲染邏輯**

找到 `export default function Nav()` 內的這一段：

```js
const { settings } = useSettings()
```

在其下方加：

```js
const rawTabs = settings?.nav_tabs?.length ? settings.nav_tabs : FALLBACK_TABS
const tabs = rawTabs
  .filter(t => t.visible)
  .sort((a, b) => a.order - b.order)
```

- [ ] **Step 3: 替換 tab bar JSX**

找到底部 Mobile tab bar 的 `{TABS.map(tab => {` 區段，替換為：

```jsx
{tabs.map(tab => {
  const active = location.pathname === tab.url || location.pathname.startsWith(tab.url + '/')
  const icon = SVG_MAP[tab.icon_key] ?? SVG_MAP.link
  const isExternal = tab.url.startsWith('http')
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
  return isExternal ? (
    <a key={tab.id} href={tab.url} target="_blank" rel="noreferrer" aria-label={tab.label}>
      {inner}
    </a>
  ) : (
    <Link key={tab.id} to={tab.url} aria-current={active ? 'page' : undefined}>
      {inner}
    </Link>
  )
})}
```

- [ ] **Step 4: 手動驗證**

`npm run dev` → 手機尺寸 → 確認：
- Tab bar 顯示原本 5 個 tab（fallback，因為 nav_tabs 還是 null）
- 各 tab 可點擊、active 狀態正確

- [ ] **Step 5: Commit**

```bash
git add src/components/Nav.jsx
git commit -m "feat(nav): read tab bar from settings.nav_tabs with fallback"
```

---

## Task 4: Admin UI — 手機選單管理

**Files:**
- Modify: `src/pages/admin/AdminSettings.jsx`

- [ ] **Step 1: 加 import 和 state**

在 `AdminSettings.jsx` 頂部現有 import 後加：

```js
import { SVG_MAP, ICON_KEYS, FALLBACK_TABS } from '../../components/NavIconMap'
```

在 `const [form, setForm] = useState(...)` 下方加：

```js
const [navTabs, setNavTabs] = useState(FALLBACK_TABS)
const [navSaving, setNavSaving] = useState(false)
const [navSuccess, setNavSuccess] = useState(false)
const [navError, setNavError] = useState(null)
const [editingId, setEditingId] = useState(null)
const [editForm, setEditForm] = useState({ label: '', url: '', icon_key: 'link' })
const [adding, setAdding] = useState(false)
const [addForm, setAddForm] = useState({ label: '', url: '', icon_key: 'link' })
```

- [ ] **Step 2: 在 useEffect 裡初始化 navTabs**

找到現有 `useEffect`：

```js
useEffect(() => {
  supabase.from('settings').select('*').eq('id', 1).single().then(({ data }) => {
    if (data) setForm(data)
  })
}, [])
```

替換為：

```js
useEffect(() => {
  supabase.from('settings').select('*').eq('id', 1).single().then(({ data }) => {
    if (data) {
      setForm(data)
      if (data.nav_tabs?.length) setNavTabs(data.nav_tabs)
    }
  })
}, [])
```

- [ ] **Step 3: 加 helper functions**

在 `handleSubmit` 後加：

```js
function toggleVisible(id) {
  setNavTabs(tabs => tabs.map(t => t.id === id ? { ...t, visible: !t.visible } : t))
}

function moveTab(id, dir) {
  setNavTabs(tabs => {
    const arr = [...tabs].sort((a, b) => a.order - b.order)
    const idx = arr.findIndex(t => t.id === id)
    const target = idx + dir
    if (target < 0 || target >= arr.length) return tabs
    ;[arr[idx].order, arr[target].order] = [arr[target].order, arr[idx].order]
    return arr
  })
}

function deleteTab(id) {
  setNavTabs(tabs => tabs.filter(t => t.id !== id))
}

function startEdit(tab) {
  setEditingId(tab.id)
  setEditForm({ label: tab.label, url: tab.url, icon_key: tab.icon_key })
}

function saveEdit() {
  setNavTabs(tabs => tabs.map(t => t.id === editingId ? { ...t, ...editForm } : t))
  setEditingId(null)
}

function addTab() {
  const newTab = {
    id: Date.now().toString(),
    ...addForm,
    visible: true,
    order: navTabs.length,
  }
  setNavTabs(tabs => [...tabs, newTab])
  setAdding(false)
  setAddForm({ label: '', url: '', icon_key: 'link' })
}

async function saveNavTabs() {
  setNavSaving(true)
  setNavSuccess(false)
  setNavError(null)
  const normalized = [...navTabs]
    .sort((a, b) => a.order - b.order)
    .map((t, i) => ({ ...t, order: i }))
  const { error } = await supabase.from('settings').update({ nav_tabs: normalized }).eq('id', 1)
  setNavSaving(false)
  if (error) setNavError(error.message)
  else { setNavSuccess(true); setNavTabs(normalized) }
}
```

- [ ] **Step 4: 加 IconPicker 元件（inline，同檔案）**

在 `export default function AdminSettings()` 之前加：

```jsx
function IconPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ICON_KEYS.map(key => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`w-8 h-8 flex items-center justify-center rounded-md border transition-colors ${
            value === key
              ? 'border-gray-900 bg-gray-900 text-white'
              : 'border-gray-200 text-gray-500 hover:border-gray-400'
          }`}
          title={key}
        >
          {SVG_MAP[key]}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: 加 JSX 區塊到表單底部**

在現有表單 `return` 裡，最後一個 `<div>（儲存按鈕）` 之後、`</form>` 之前加：

```jsx
<hr className="border-gray-100" />
<p className="text-xs tracking-widest text-gray-400 uppercase -mb-2">手機底部選單</p>

<div className="flex flex-col gap-2">
  {[...navTabs].sort((a, b) => a.order - b.order).map(tab => (
    <div key={tab.id} className="border border-gray-100 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2">
        <button type="button" onClick={() => toggleVisible(tab.id)} className="text-base leading-none" title={tab.visible ? '隱藏' : '顯示'}>
          {tab.visible ? '👁' : <span className="opacity-30">👁</span>}
        </button>
        <span className="w-5 h-5 flex items-center justify-center text-gray-400">
          {SVG_MAP[tab.icon_key] ?? SVG_MAP.link}
        </span>
        <span className="text-sm flex-1 truncate">{tab.label}</span>
        <span className="text-xs text-gray-400 truncate max-w-[100px]">{tab.url}</span>
        <div className="flex items-center gap-1 ml-auto flex-shrink-0">
          <button type="button" onClick={() => moveTab(tab.id, -1)} className="text-xs text-gray-400 hover:text-gray-700 px-1">⬆</button>
          <button type="button" onClick={() => moveTab(tab.id, 1)} className="text-xs text-gray-400 hover:text-gray-700 px-1">⬇</button>
          <button type="button" onClick={() => editingId === tab.id ? setEditingId(null) : startEdit(tab)} className="text-xs text-gray-400 hover:text-gray-700 px-1">✎</button>
          <button type="button" onClick={() => deleteTab(tab.id)} className="text-xs text-red-400 hover:text-red-600 px-1">🗑</button>
        </div>
      </div>
      {editingId === tab.id && (
        <div className="px-3 pb-3 border-t border-gray-100 pt-3 flex flex-col gap-2">
          <IconPicker value={editForm.icon_key} onChange={v => setEditForm(f => ({ ...f, icon_key: v }))} />
          <input value={editForm.label} onChange={e => setEditForm(f => ({ ...f, label: e.target.value }))}
            placeholder="標籤" className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400" />
          <input value={editForm.url} onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))}
            placeholder="https://... 或 /blog" className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditingId(null)} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-400">取消</button>
            <button type="button" onClick={saveEdit} className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700">確認</button>
          </div>
        </div>
      )}
    </div>
  ))}

  {adding ? (
    <div className="border border-dashed border-gray-200 rounded-xl px-3 py-3 flex flex-col gap-2">
      <IconPicker value={addForm.icon_key} onChange={v => setAddForm(f => ({ ...f, icon_key: v }))} />
      <input value={addForm.label} onChange={e => setAddForm(f => ({ ...f, label: e.target.value }))}
        placeholder="標籤" className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400" />
      <input value={addForm.url} onChange={e => setAddForm(f => ({ ...f, url: e.target.value }))}
        placeholder="https://... 或 /blog" className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400" />
      <div className="flex gap-2">
        <button type="button" onClick={() => setAdding(false)} className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg hover:border-gray-400">取消</button>
        <button type="button" onClick={addTab} disabled={!addForm.label || !addForm.url}
          className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-40">新增</button>
      </div>
    </div>
  ) : (
    <button type="button" onClick={() => setAdding(true)}
      className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl px-3 py-2 hover:border-gray-400 hover:text-gray-600 text-left">
      + 新增 tab
    </button>
  )}
</div>

{navSuccess && <p className="text-sm text-green-600">選單已儲存</p>}
{navError && <p className="text-sm text-red-500">{navError}</p>}
<div>
  <button type="button" onClick={saveNavTabs} disabled={navSaving}
    className="text-sm bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50">
    {navSaving ? '儲存中…' : '儲存選單設定'}
  </button>
</div>
```

- [ ] **Step 6: 手動驗證**

`npm run dev` → 開 `/admin/settings` → 捲到底確認：
- 「手機底部選單」區塊出現
- 5 個 tab 列表顯示，各有 👁 / ⬆⬇ / ✎ / 🗑
- 點 ✎ 展開 icon picker + label + URL 輸入
- 點 🗑 刪除一筆，點「+ 新增 tab」新增一筆
- 點「儲存選單設定」→ 顯示「選單已儲存」
- 重整頁面 → 手機 tab bar 反映更新

- [ ] **Step 7: Commit**

```bash
git add src/pages/admin/AdminSettings.jsx
git commit -m "feat(admin): add mobile tab bar management to AdminSettings"
```

---

## 完成後驗收

- [ ] Supabase `settings` 表有 `nav_tabs` 欄位
- [ ] Admin 可新增/刪除/編輯/排序/切換顯示 tab
- [ ] 儲存後手機 tab bar 即時反映（重整後）
- [ ] 外部 URL（http://...）以 `<a target="_blank">` 開啟
- [ ] nav_tabs 為 null 時 fallback 原本 5 個 tab
- [ ] SVG_MAP 中找不到 icon_key 時 fallback 到 `link` 圖示
