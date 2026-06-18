# Admin Post Publish Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lightweight publish checklist to the admin post editor and block saving incomplete posts as published.

**Architecture:** Keep the change local to `AdminPostEdit.jsx` by adding pure publish-check helpers, small local validation state, and a compact checklist UI. Update `AdminPostEdit.test.jsx` to cover checklist visibility, draft saves, blocked published saves, and successful published saves using the existing Supabase mock pattern.

**Tech Stack:** React 18, React Router, Supabase client mock, Vitest, Testing Library.

---

## File Structure

- Modify: `src/pages/admin/AdminPostEdit.jsx`
  - Add local publish-check helper functions.
  - Add validation state for publish-check errors.
  - Render the checklist when `form.published` is true.
  - Block `handleSubmit` before any Supabase write when publish checks fail.
- Modify: `src/pages/admin/__tests__/AdminPostEdit.test.jsx`
  - Replace the current inline Supabase mock with stable mock functions that can assert insert/update behavior.
  - Add publish-check tests.

No schema, API, or notification files should change in this phase.

---

### Task 1: Add Failing Publish-Check Tests

**Files:**
- Modify: `src/pages/admin/__tests__/AdminPostEdit.test.jsx`

- [ ] **Step 1: Replace the Supabase mock with observable mock functions**

Replace the current Supabase `vi.mock` block near the top of `src/pages/admin/__tests__/AdminPostEdit.test.jsx` with this version:

```jsx
const postFixture = {
  id: 'abc',
  title: '測試文章',
  slug: 'test-article',
  content: '<p>內容</p>',
  excerpt: '摘要',
  tags: ['測試策略'],
  published: false,
  published_at: null,
}

const singleMock = vi.fn()
const updateEqMock = vi.fn()
const updateMock = vi.fn()
const insertSingleMock = vi.fn()
const insertSelectMock = vi.fn()
const insertMock = vi.fn()
const selectMock = vi.fn()
const eqMock = vi.fn()

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: selectMock,
      eq: eqMock,
      single: singleMock,
      update: updateMock,
      insert: insertMock,
    })),
  }
}))
```

- [ ] **Step 2: Reset mock behavior in `beforeEach`**

Replace the current `beforeEach(() => { vi.clearAllMocks() })` inside the describe block with:

```jsx
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()

  singleMock.mockResolvedValue({ data: postFixture })
  eqMock.mockReturnThis()
  selectMock.mockReturnThis()
  updateEqMock.mockResolvedValue({})
  updateMock.mockReturnValue({ eq: updateEqMock })
  insertSingleMock.mockResolvedValue({ data: { id: 'new-id' } })
  insertSelectMock.mockReturnValue({ single: insertSingleMock })
  insertMock.mockReturnValue({ select: insertSelectMock })
})
```

- [ ] **Step 3: Add a helper for rendering a new post**

Add this helper below `renderEdit`:

```jsx
function renderNewPost() {
  return renderEdit('new')
}
```

- [ ] **Step 4: Add a test that the checklist is hidden for ordinary drafts**

Add this test inside the existing `describe('AdminPostEdit — auto-save and preview', () => { })` block that already contains the preview and autosave tests:

```jsx
it('keeps publish checklist hidden for an ordinary draft', async () => {
  renderEdit('abc')
  await waitFor(() => screen.getByDisplayValue('測試文章'))
  expect(screen.queryByText('發布檢查')).toBeNull()
})
```

- [ ] **Step 5: Add a test that the checklist appears when publishing is selected**

Add this test after the hidden-checklist test:

```jsx
it('shows publish checklist when publish is checked', async () => {
  renderEdit('abc')
  await waitFor(() => screen.getByDisplayValue('測試文章'))

  fireEvent.click(screen.getByLabelText('發布'))

  expect(screen.getByText('發布檢查')).toBeInTheDocument()
  expect(screen.getByText('標題')).toBeInTheDocument()
  expect(screen.getByText('Slug')).toBeInTheDocument()
  expect(screen.getByText('摘要')).toBeInTheDocument()
  expect(screen.getByText('內容')).toBeInTheDocument()
  expect(screen.getByText('至少一個標籤')).toBeInTheDocument()
})
```

- [ ] **Step 6: Add a test that incomplete published saves are blocked**

Add this test after the checklist visibility tests:

```jsx
it('blocks saving as published when required publish fields are missing', async () => {
  renderNewPost()

  fireEvent.change(screen.getByRole('textbox', { name: /標題/i }), {
    target: { value: '不完整文章' },
  })
  fireEvent.click(screen.getByLabelText('發布'))
  fireEvent.click(screen.getByRole('button', { name: '建立文章' }))

  expect(await screen.findByText('請先完成發布檢查')).toBeInTheDocument()
  expect(insertMock).not.toHaveBeenCalled()
})
```

- [ ] **Step 7: Add a test that draft saves may remain incomplete**

Add this test after the blocked-publish test:

```jsx
it('allows saving an incomplete draft', async () => {
  renderNewPost()

  fireEvent.change(screen.getByRole('textbox', { name: /標題/i }), {
    target: { value: '草稿文章' },
  })
  fireEvent.click(screen.getByRole('button', { name: '建立文章' }))

  await waitFor(() => {
    expect(insertMock).toHaveBeenCalled()
  })
})
```

- [ ] **Step 8: Add a test that complete published saves proceed**

Add this test after the draft-save test:

```jsx
it('allows saving as published when publish checks pass', async () => {
  renderNewPost()

  fireEvent.change(screen.getByRole('textbox', { name: /標題/i }), {
    target: { value: '完整文章' },
  })
  fireEvent.change(screen.getByDisplayValue('完整文章').closest('form').querySelector('input[name="excerpt"]'), {
    target: { value: '這是一段摘要' },
  })
  fireEvent.change(screen.getByDisplayValue('完整文章').closest('form').querySelector('input[name="tags"]'), {
    target: { value: '測試策略' },
  })
  fireEvent.change(screen.getByTestId('rich-editor'), {
    target: { value: '<p>這是一段內容</p>' },
  })
  fireEvent.click(screen.getByLabelText('發布'))
  fireEvent.click(screen.getByRole('button', { name: '建立文章' }))

  await waitFor(() => {
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      title: '完整文章',
      published: true,
      excerpt: '這是一段摘要',
      tags: ['測試策略'],
    }))
  })
})
```

- [ ] **Step 9: Run tests to verify the new tests fail**

Run:

```sh
npm run test:run -- src/pages/admin/__tests__/AdminPostEdit.test.jsx
```

Expected result:

```text
FAIL src/pages/admin/__tests__/AdminPostEdit.test.jsx
```

The new failures should mention missing `發布檢查` UI or missing `請先完成發布檢查` validation behavior.

- [ ] **Step 10: Commit the failing tests**

```sh
git add src/pages/admin/__tests__/AdminPostEdit.test.jsx
git commit -m "test: cover admin post publish checks"
```

---

### Task 2: Implement Publish-Check Helpers and Validation

**Files:**
- Modify: `src/pages/admin/AdminPostEdit.jsx`
- Test: `src/pages/admin/__tests__/AdminPostEdit.test.jsx`

- [ ] **Step 1: Update the React import**

Change the first line of `src/pages/admin/AdminPostEdit.jsx` from:

```jsx
import { useState, useEffect, useRef, useCallback } from 'react'
```

to:

```jsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
```

- [ ] **Step 2: Add publish-check helpers**

Add these helpers after the existing `wordCount` function:

```jsx
function plainText(content) {
  return (content ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseTags(tags) {
  return (tags ?? '').split(',').map(t => t.trim()).filter(Boolean)
}

function buildPublishChecks(form) {
  const tags = Array.isArray(form.tags) ? form.tags.filter(Boolean) : parseTags(form.tags)
  return [
    { key: 'title', label: '標題', passed: Boolean(form.title?.trim()) },
    { key: 'slug', label: 'Slug', passed: Boolean(form.slug?.trim()) },
    { key: 'excerpt', label: '摘要', passed: Boolean(form.excerpt?.trim()) },
    { key: 'content', label: '內容', passed: Boolean(plainText(form.content)) },
    { key: 'tags', label: '至少一個標籤', passed: tags.length > 0 },
  ]
}
```

- [ ] **Step 3: Add validation state in the component**

In `AdminPostEdit`, after:

```jsx
const [slugError, setSlugError] = useState('')
```

add:

```jsx
const [publishCheckError, setPublishCheckError] = useState('')
```

- [ ] **Step 4: Add memoized publish-check values**

In `AdminPostEdit`, after the `const wc = wordCount(form.content)` line, add:

```jsx
const publishChecks = useMemo(() => buildPublishChecks(form), [form])
const publishCheckPassed = publishChecks.every(check => check.passed)
const showPublishCheck = form.published || publishCheckError
```

- [ ] **Step 5: Clear publish-check error when fields change**

In `handleChange`, after:

```jsx
if (name === 'slug') setSlugError('')
```

add:

```jsx
if (publishCheckError) setPublishCheckError('')
```

- [ ] **Step 6: Clear publish-check error when the rich text editor changes**

Replace the current `RichTextEditor` `onChange` prop:

```jsx
onChange={html => setForm(f => ({ ...f, content: html }))}
```

with:

```jsx
onChange={html => {
  if (publishCheckError) setPublishCheckError('')
  setForm(f => ({ ...f, content: html }))
}}
```

- [ ] **Step 7: Clear publish-check error when the markdown editor changes**

Replace the current `MarkdownEditorPane` `onChange` prop:

```jsx
onChange={md => setForm(f => ({ ...f, content: md }))}
```

with:

```jsx
onChange={md => {
  if (publishCheckError) setPublishCheckError('')
  setForm(f => ({ ...f, content: md }))
}}
```

- [ ] **Step 8: Block published submit before Supabase calls**

In `handleSubmit`, immediately after:

```jsx
setSlugError('')
```

add:

```jsx
setPublishCheckError('')

const currentPublishChecks = buildPublishChecks(form)
if (form.published && currentPublishChecks.some(check => !check.passed)) {
  setPublishCheckError('請先完成發布檢查')
  setSaving(false)
  return
}
```

- [ ] **Step 9: Reuse `parseTags` in submit payload**

In `handleSubmit`, replace:

```jsx
const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
```

with:

```jsx
const tags = parseTags(form.tags)
```

- [ ] **Step 10: Reuse `parseTags` in autosave payload**

In `doSave`, replace:

```jsx
tags: f.tags.split(',').map(t => t.trim()).filter(Boolean),
```

with:

```jsx
tags: parseTags(f.tags),
```

- [ ] **Step 11: Render the checklist UI**

In the JSX, insert this block after the publish checkbox/date area and before the notification section:

```jsx
{showPublishCheck && (
  <div className={`border rounded-xl p-4 ${
    publishCheckError ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'
  }`}>
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-medium text-gray-500">發布檢查</p>
      <span className={`text-xs ${publishCheckPassed ? 'text-green-600' : 'text-gray-400'}`}>
        {publishCheckPassed ? '已完成' : '尚未完成'}
      </span>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {publishChecks.map(check => (
        <div key={check.key} className="flex items-center gap-2 text-xs">
          <span className={`inline-flex w-4 h-4 items-center justify-center rounded-full text-[10px] ${
            check.passed ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
          }`}>
            {check.passed ? '✓' : '!'}
          </span>
          <span className={check.passed ? 'text-gray-600' : 'text-gray-500'}>
            {check.label}
          </span>
        </div>
      ))}
    </div>
    {publishCheckError && (
      <p className="text-xs text-red-500 mt-3">{publishCheckError}</p>
    )}
  </div>
)}
```

- [ ] **Step 12: Run the focused test file**

Run:

```sh
npm run test:run -- src/pages/admin/__tests__/AdminPostEdit.test.jsx
```

Expected result:

```text
Test Files  1 passed (1)
```

- [ ] **Step 13: Commit the implementation**

```sh
git add src/pages/admin/AdminPostEdit.jsx src/pages/admin/__tests__/AdminPostEdit.test.jsx
git commit -m "feat: add admin post publish checks"
```

---

### Task 3: Verify Suite Health

**Files:**
- Verify: `src/pages/admin/AdminPostEdit.jsx`
- Verify: `src/pages/admin/__tests__/AdminPostEdit.test.jsx`

- [ ] **Step 1: Run the full test suite**

Run:

```sh
npm run test:run
```

Expected result:

```text
Test Files  33 passed (33)
Tests  199 passed (199)
```

If the number of tests increases after Task 1, the exact `Tests` count should be higher than 199 and all tests should pass.

- [ ] **Step 2: Run ESLint on touched source and test files**

Run:

```sh
npx eslint src/pages/admin/AdminPostEdit.jsx src/pages/admin/__tests__/AdminPostEdit.test.jsx
```

Expected result:

```text
```

The command should exit with code 0 and no output.

- [ ] **Step 3: Check patch formatting**

Run:

```sh
git diff --check
```

Expected result:

```text
```

The command should exit with code 0 and no output.

- [ ] **Step 4: Review final diff**

Run:

```sh
git diff --stat
git diff -- src/pages/admin/AdminPostEdit.jsx src/pages/admin/__tests__/AdminPostEdit.test.jsx
```

Expected:

- Only `AdminPostEdit.jsx` and `AdminPostEdit.test.jsx` are modified for the implementation.
- No schema, API, notification, or unrelated UI files are changed.

- [ ] **Step 5: Commit verification cleanup if needed**

If Task 3 required small lint or test cleanup changes, commit them:

```sh
git add src/pages/admin/AdminPostEdit.jsx src/pages/admin/__tests__/AdminPostEdit.test.jsx
git commit -m "test: verify admin post publish checks"
```

If Task 3 required no changes, do not create an empty commit.

---

## Self-Review

Spec coverage:

- Lightweight publish check: Task 2 adds helpers and checklist UI.
- No schema changes: plan touches only `AdminPostEdit.jsx` and its test.
- Draft saves remain flexible: Task 1 Step 7 tests it; Task 2 validation only runs when `form.published` is true.
- Published save blocked when incomplete: Task 1 Step 6 tests it; Task 2 Step 8 implements it before Supabase calls.
- Checklist visibility: Task 1 Steps 4 and 5 test hidden and visible states; Task 2 Step 11 implements it.
- Existing autosave remains separate: Task 2 only reuses tag parsing in autosave and does not add publish validation to `doSave`.

Placeholder scan:

- No placeholder markers or undefined later references are present.
- Code snippets define every new helper name before use.

Type and naming consistency:

- `buildPublishChecks`, `plainText`, and `parseTags` names are consistent across the plan.
- `publishCheckError`, `publishChecks`, `publishCheckPassed`, and `showPublishCheck` are defined before the JSX uses them.
