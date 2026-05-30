# Admin Posts Enhancements Design

**Date:** 2026-05-30  
**Status:** Approved

## Goal

Four UX improvements to the admin panel:
1. Batch publish/unpublish/delete on the posts list
2. Search + filter (status, tag) on the posts list
3. Auto-save every 30 seconds in the post editor
4. Preview button to open the public post in a new tab

---

## Changed Files

| File | Changes |
|------|---------|
| `src/pages/admin/AdminPosts.jsx` | Search bar, status filter, tag filter, checkbox column, batch action bar |
| `src/pages/admin/AdminPostEdit.jsx` | 30-second debounce auto-save, save status indicator, preview button |

---

## Feature 1: Search + Filter (AdminPosts)

A filter bar appears between the page header and the table.

```
┌────────────────────────────────────────────────────────┐
│  🔍 搜尋標題...        [全部] [草稿] [已發布]  [標籤 ▾] │
└────────────────────────────────────────────────────────┘
```

**Search:** `<input>` that filters `posts` array client-side by `post.title.includes(query)` (case-insensitive). Updates on every keystroke.

**Status filter:** Three pill buttons — 全部 / 草稿 / 已發布. Clicking a pill sets `statusFilter` state. Default: 全部.

**Tag filter:** `<select>` dropdown populated from all unique tags across loaded posts (computed once on load). Default option: 全部標籤. Selecting a tag filters to posts that include that tag.

All three filters compose: `visiblePosts = posts.filter(matchesSearch && matchesStatus && matchesTag)`.

No server round-trips — all filtering is client-side on the already-fetched `posts` array.

---

## Feature 2: Batch Operations (AdminPosts)

**Checkbox column:** Added as the first column in the table. Header checkbox toggles all visible posts.

**Selection state:** `selectedIds` — a `Set<string>` of post IDs. Updates on individual checkbox change or select-all toggle.

**Batch action bar:** Rendered below the table. Only visible when `selectedIds.size > 0`.

```
已選 3 篇  [發布]  [取消發布]  [刪除]
```

- **發布:** `supabase.from('posts').update({ published: true, published_at: new Date().toISOString() }).in('id', [...selectedIds])`
- **取消發布:** `supabase.from('posts').update({ published: false, published_at: null }).in('id', [...selectedIds])`
- **刪除:** Confirm dialog first, then `supabase.from('posts').delete().in('id', [...selectedIds])`

After any batch operation: clear `selectedIds`, re-fetch posts.

When status filter is active, "select all" only selects visible (filtered) posts — not all posts.

---

## Feature 3: Auto-Save (AdminPostEdit)

**Trigger:** `useEffect` watching `form` state, with a 30-second debounce (trailing).

**Conditions:**
- Only fires when `!isNew` (editing existing post)
- Only fires when `form` has changed since last save (track `lastSavedForm` ref)
- Does NOT change `published` or `published_at` — saves content, title, slug, excerpt, tags only

**Save status indicator:** Small text, top-right of form:
- Idle / no changes: nothing shown
- Debounce pending (user still typing): `• 未儲存變更`
- Saving: `儲存中…`
- Saved: `已自動儲存 HH:MM`
- Error: `自動儲存失敗`

**Implementation:**

```jsx
const autoSaveRef = useRef()
const lastSavedRef = useRef(null)
const [saveStatus, setSaveStatus] = useState('') // '', 'pending', 'saving', 'saved', 'error'

useEffect(() => {
  if (isNew) return
  setSaveStatus('pending')
  clearTimeout(autoSaveRef.current)
  autoSaveRef.current = setTimeout(async () => {
    const payload = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      content: form.content,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    }
    setSaveStatus('saving')
    const { error } = await supabase.from('posts').update(payload).eq('id', id)
    setSaveStatus(error ? 'error' : 'saved')
  }, 30000)
  return () => clearTimeout(autoSaveRef.current)
}, [form, id, isNew])
```

---

## Feature 4: Preview Button (AdminPostEdit)

Only shown when `!isNew`.

```jsx
{!isNew && (
  <button type="button"
    onClick={() => window.open(`/blog/${form.slug}`, '_blank')}
    className="text-sm border border-gray-200 px-6 py-2.5 rounded-lg hover:border-gray-400">
    預覽
  </button>
)}
```

Position: between the 儲存 button and 取消 button.

Final button row:
```
[儲存]  [預覽]  [取消]          已自動儲存 10:35
```

---

## Out of Scope

- Server-side search / pagination (posts fit client-side at current scale)
- Auto-save for new posts (no ID yet)
- Conflict resolution if two tabs edit the same post
- Scheduled publishing
