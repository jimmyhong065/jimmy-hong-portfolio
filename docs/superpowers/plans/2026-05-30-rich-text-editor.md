# Rich Text Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain textarea in AdminPostEdit with a full WYSIWYG TipTap editor; store content as HTML; render HTML or legacy Markdown on the frontend.

**Architecture:** TipTap editor wrapped in `RichTextEditor.jsx` (holds `useEditor` + `EditorContent`), with a `RichTextToolbar.jsx` that receives the `editor` instance as a prop and renders buttons + image insert dialog. `MarkdownContent.jsx` gains dual-mode rendering: HTML via `DOMPurify.sanitize()`, or Markdown via `react-markdown` (backward-compatible with existing posts, no DB migration).

**Tech Stack:** `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-table` (+ row/cell/header), `@tiptap/extension-placeholder`, `dompurify`; vitest + @testing-library/react for tests.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/test-setup.js` | Add jsdom polyfills for TipTap/ProseMirror |
| Modify | `src/components/MarkdownContent.jsx` | Dual-mode: HTML or Markdown rendering |
| Create | `src/components/__tests__/MarkdownContent.test.jsx` | Tests for dual-mode rendering + XSS sanitization |
| Create | `src/components/RichTextToolbar.jsx` | Toolbar buttons + image insert dialog |
| Create | `src/components/__tests__/RichTextToolbar.test.jsx` | Toolbar rendering + button behavior tests |
| Create | `src/components/RichTextEditor.jsx` | TipTap editor wrapper (`useEditor` + toolbar + `EditorContent`) |
| Create | `src/components/__tests__/RichTextEditor.test.jsx` | Smoke test: renders, calls onChange |
| Modify | `src/pages/admin/AdminPostEdit.jsx` | Replace textarea with `<RichTextEditor>` |

---

## Task 1: Install Dependencies

**Files:** `package.json`

- [ ] **Step 1: Install packages**

```bash
npm install @tiptap/react @tiptap/starter-kit \
  @tiptap/extension-image \
  @tiptap/extension-link \
  @tiptap/extension-table \
  @tiptap/extension-table-row \
  @tiptap/extension-table-cell \
  @tiptap/extension-table-header \
  @tiptap/extension-placeholder \
  dompurify
```

- [ ] **Step 2: Verify install**

```bash
npm run build 2>&1 | tail -5
```

Expected: build completes with no errors (warnings about unused packages are OK).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install tiptap and dompurify"
```

---

## Task 2: Add jsdom Polyfills for TipTap Tests

**Files:**
- Modify: `src/test-setup.js`

TipTap / ProseMirror calls `document.createRange`, `window.getSelection`, and `getBoundingClientRect` which jsdom doesn't fully implement. Add stubs so editor renders without crashing in tests.

- [ ] **Step 1: Update test-setup.js**

Replace the entire content of `src/test-setup.js` with:

```js
import '@testing-library/jest-dom'

// ProseMirror / TipTap requires these browser APIs not fully in jsdom
if (!global.document.createRange) {
  global.document.createRange = () => ({
    setStart: () => {},
    setEnd: () => {},
    commonAncestorContainer: {
      nodeName: 'BODY',
      ownerDocument: document,
    },
    getBoundingClientRect: () => ({ top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 }),
    getClientRects: () => [],
  })
}

if (!global.window.getSelection) {
  global.window.getSelection = () => ({
    addRange: () => {},
    removeAllRanges: () => {},
    rangeCount: 0,
    getRangeAt: () => null,
  })
}

Element.prototype.scrollIntoView = () => {}
```

- [ ] **Step 2: Verify existing tests still pass**

```bash
npx vitest run
```

Expected: all existing tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/test-setup.js
git commit -m "test: add jsdom polyfills for tiptap/prosemirror"
```

---

## Task 3: Dual-Mode MarkdownContent

**Files:**
- Modify: `src/components/MarkdownContent.jsx`
- Create: `src/components/__tests__/MarkdownContent.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/__tests__/MarkdownContent.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MarkdownContent from '../MarkdownContent'

describe('MarkdownContent', () => {
  it('renders markdown content via react-markdown', () => {
    render(<MarkdownContent content="**bold text**" />)
    expect(screen.getByRole('strong')).toBeInTheDocument()
  })

  it('renders HTML content via dangerouslySetInnerHTML', () => {
    render(<MarkdownContent content="<p>hello <strong>world</strong></p>" />)
    expect(screen.getByText('world')).toBeInTheDocument()
  })

  it('strips XSS from HTML content', () => {
    const { container } = render(
      <MarkdownContent content='<p>safe</p><script>alert("xss")</script>' />
    )
    expect(container.querySelector('script')).toBeNull()
    expect(screen.getByText('safe')).toBeInTheDocument()
  })

  it('strips inline event handlers from HTML content', () => {
    const { container } = render(
      <MarkdownContent content='<img src="x" onerror="alert(1)" />' />
    )
    const img = container.querySelector('img')
    expect(img?.getAttribute('onerror')).toBeNull()
  })

  it('handles null/undefined content without crashing', () => {
    const { container } = render(<MarkdownContent content={null} />)
    expect(container.firstChild).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/__tests__/MarkdownContent.test.jsx
```

Expected: FAIL (component doesn't have dual-mode logic yet).

- [ ] **Step 3: Update MarkdownContent.jsx**

Replace the entire file content with:

```jsx
import DOMPurify from 'dompurify'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MarkdownContent({ content }) {
  const isHtml = content?.trimStart().startsWith('<')
  return isHtml
    ? (
      <div
        className="prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content ?? '') }}
      />
    )
    : (
      <div className="prose prose-gray max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content ?? ''}</ReactMarkdown>
      </div>
    )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/__tests__/MarkdownContent.test.jsx
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/MarkdownContent.jsx src/components/__tests__/MarkdownContent.test.jsx
git commit -m "feat: add dual-mode rendering to MarkdownContent (HTML + Markdown)"
```

---

## Task 4: RichTextToolbar Component

**Files:**
- Create: `src/components/RichTextToolbar.jsx`
- Create: `src/components/__tests__/RichTextToolbar.test.jsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/__tests__/RichTextToolbar.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RichTextToolbar from '../RichTextToolbar'

function makeRun() {
  return vi.fn()
}

function makeEditor(runMock) {
  const chain = () => ({
    focus: () => ({
      toggleBold: () => ({ run: runMock }),
      toggleItalic: () => ({ run: runMock }),
      toggleStrike: () => ({ run: runMock }),
      toggleCode: () => ({ run: runMock }),
      toggleHeading: () => ({ run: runMock }),
      toggleBlockquote: () => ({ run: runMock }),
      toggleCodeBlock: () => ({ run: runMock }),
      toggleBulletList: () => ({ run: runMock }),
      toggleOrderedList: () => ({ run: runMock }),
      setLink: () => ({ run: runMock }),
      setImage: () => ({ run: runMock }),
      insertTable: () => ({ run: runMock }),
      setHorizontalRule: () => ({ run: runMock }),
      undo: () => ({ run: runMock }),
      redo: () => ({ run: runMock }),
    }),
  })
  return {
    chain,
    can: () => ({ chain }),
    isActive: vi.fn().mockReturnValue(false),
  }
}

describe('RichTextToolbar', () => {
  it('renders null when editor is null', () => {
    const { container } = render(<RichTextToolbar editor={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders H1, H2, H3 buttons', () => {
    const run = makeRun()
    render(<RichTextToolbar editor={makeEditor(run)} />)
    expect(screen.getByText('H1')).toBeInTheDocument()
    expect(screen.getByText('H2')).toBeInTheDocument()
    expect(screen.getByText('H3')).toBeInTheDocument()
  })

  it('renders Bold button', () => {
    const run = makeRun()
    render(<RichTextToolbar editor={makeEditor(run)} />)
    expect(screen.getByTitle('粗體')).toBeInTheDocument()
  })

  it('clicking Bold calls editor chain run', () => {
    const run = makeRun()
    render(<RichTextToolbar editor={makeEditor(run)} />)
    fireEvent.click(screen.getByTitle('粗體'))
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('clicking H1 calls editor chain run', () => {
    const run = makeRun()
    render(<RichTextToolbar editor={makeEditor(run)} />)
    fireEvent.click(screen.getByText('H1'))
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('Image button opens insert dialog', () => {
    const run = makeRun()
    render(<RichTextToolbar editor={makeEditor(run)} />)
    fireEvent.click(screen.getByTitle('圖片'))
    expect(screen.getByText('插入圖片')).toBeInTheDocument()
  })

  it('dialog Cancel button closes dialog', () => {
    const run = makeRun()
    render(<RichTextToolbar editor={makeEditor(run)} />)
    fireEvent.click(screen.getByTitle('圖片'))
    fireEvent.click(screen.getByText('取消'))
    expect(screen.queryByText('插入圖片')).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/__tests__/RichTextToolbar.test.jsx
```

Expected: FAIL (file doesn't exist yet).

- [ ] **Step 3: Create RichTextToolbar.jsx**

Create `src/components/RichTextToolbar.jsx`:

```jsx
import { useState } from 'react'
import { useUpload } from '../hooks/useUpload'

function Btn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-2 py-1 text-xs rounded transition-colors ${
        active ? 'bg-gray-800 text-white' : 'hover:bg-gray-200 text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

export default function RichTextToolbar({ editor }) {
  const [imageOpen, setImageOpen] = useState(false)
  const [imageTab, setImageTab] = useState('upload')
  const [imageUrl, setImageUrl] = useState('')
  const { uploading, uploadError, uploadOne } = useUpload()

  if (!editor) return null

  function insertImage(url) {
    editor.chain().focus().setImage({ src: url }).run()
    setImageOpen(false)
    setImageUrl('')
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    uploadOne(file, insertImage)
  }

  function handleLink() {
    const url = window.prompt('連結網址')
    if (url) editor.chain().focus().setLink({ href: url, target: '_blank' }).run()
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 border border-gray-200 border-b-0 rounded-t-lg bg-gray-50">
      {/* Headings */}
      <Btn title="H1" active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</Btn>
      <Btn title="H2" active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Btn>
      <Btn title="H3" active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</Btn>

      <span className="w-px bg-gray-200 mx-1" />

      {/* Inline marks */}
      <Btn title="粗體" active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></Btn>
      <Btn title="斜體" active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></Btn>
      <Btn title="刪除線" active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></Btn>
      <Btn title="行內程式碼" active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}>`</Btn>

      <span className="w-px bg-gray-200 mx-1" />

      {/* Blocks */}
      <Btn title="引用" active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}>"</Btn>
      <Btn title="程式碼區塊" active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}>{'{ }'}</Btn>

      <span className="w-px bg-gray-200 mx-1" />

      {/* Lists */}
      <Btn title="無序清單" active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}>•</Btn>
      <Btn title="有序清單" active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</Btn>

      <span className="w-px bg-gray-200 mx-1" />

      {/* Insert */}
      <Btn title="連結" active={editor.isActive('link')} onClick={handleLink}>🔗</Btn>
      <Btn title="圖片" active={false} onClick={() => setImageOpen(true)}>🖼</Btn>
      <Btn title="表格" active={editor.isActive('table')}
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>⊞</Btn>
      <Btn title="水平線" active={false}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}>—</Btn>

      <span className="w-px bg-gray-200 mx-1" />

      {/* History */}
      <Btn title="復原" active={false}
        onClick={() => editor.chain().focus().undo().run()}>↩</Btn>
      <Btn title="重做" active={false}
        onClick={() => editor.chain().focus().redo().run()}>↪</Btn>

      {/* Image dialog */}
      {imageOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
            <h3 className="text-sm font-semibold mb-4">插入圖片</h3>
            <div className="flex gap-2 mb-4">
              <button type="button"
                onClick={() => setImageTab('upload')}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${imageTab === 'upload' ? 'bg-gray-900 text-white' : 'border border-gray-200 hover:border-gray-400'}`}>
                上傳
              </button>
              <button type="button"
                onClick={() => setImageTab('url')}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${imageTab === 'url' ? 'bg-gray-900 text-white' : 'border border-gray-200 hover:border-gray-400'}`}>
                URL
              </button>
            </div>

            {imageTab === 'upload' ? (
              <div>
                <input type="file" accept="image/*" onChange={handleFileChange}
                  disabled={uploading}
                  className="w-full text-sm text-gray-600" />
                {uploading && <p className="text-xs text-gray-500 mt-2">上傳中…</p>}
                {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
              </div>
            ) : (
              <div>
                <input type="text" value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400" />
                <button type="button"
                  onClick={() => insertImage(imageUrl)}
                  disabled={!imageUrl}
                  className="mt-3 w-full text-sm bg-gray-900 text-white py-2 rounded-lg disabled:opacity-50 hover:bg-gray-700">
                  插入
                </button>
              </div>
            )}

            <button type="button"
              onClick={() => setImageOpen(false)}
              className="mt-3 w-full text-sm border border-gray-200 py-2 rounded-lg hover:border-gray-400">
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/__tests__/RichTextToolbar.test.jsx
```

Expected: all 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/RichTextToolbar.jsx src/components/__tests__/RichTextToolbar.test.jsx
git commit -m "feat: add RichTextToolbar with image insert dialog"
```

---

## Task 5: RichTextEditor Component

**Files:**
- Create: `src/components/RichTextEditor.jsx`
- Create: `src/components/__tests__/RichTextEditor.test.jsx`

- [ ] **Step 1: Write failing smoke test**

Create `src/components/__tests__/RichTextEditor.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import RichTextEditor from '../RichTextEditor'

describe('RichTextEditor', () => {
  it('renders the editor container without crashing', () => {
    const onChange = vi.fn()
    const { container } = render(<RichTextEditor value="" onChange={onChange} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders with initial HTML content', () => {
    const onChange = vi.fn()
    render(<RichTextEditor value="<p>hello</p>" onChange={onChange} />)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/__tests__/RichTextEditor.test.jsx
```

Expected: FAIL (file doesn't exist yet).

- [ ] **Step 3: Create RichTextEditor.jsx**

Create `src/components/RichTextEditor.jsx`:

```jsx
import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Placeholder from '@tiptap/extension-placeholder'
import RichTextToolbar from './RichTextToolbar'

export default function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: '開始撰寫文章…' }),
    ],
    content: value ?? '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  // Sync external value changes (e.g. when existing post loads from Supabase)
  useEffect(() => {
    if (editor && !editor.isFocused && value !== editor.getHTML()) {
      editor.commands.setContent(value ?? '')
    }
  }, [editor, value])

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <RichTextToolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="min-h-[400px] text-sm px-4 py-3 focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[380px]"
      />
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/__tests__/RichTextEditor.test.jsx
```

Expected: both tests PASS.

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/RichTextEditor.jsx src/components/__tests__/RichTextEditor.test.jsx
git commit -m "feat: add RichTextEditor with TipTap and all formatting extensions"
```

---

## Task 6: Wire RichTextEditor into AdminPostEdit

**Files:**
- Modify: `src/pages/admin/AdminPostEdit.jsx`

- [ ] **Step 1: Update AdminPostEdit.jsx**

In `src/pages/admin/AdminPostEdit.jsx`:

Add import at the top (after existing imports):
```jsx
import RichTextEditor from '../../components/RichTextEditor'
```

Replace lines 82–84 (the textarea block):
```jsx
        <div>
          <label className="text-xs text-gray-500 mb-1 block">內容（Markdown）</label>
          <textarea name="content" value={form.content} onChange={handleChange} rows={16}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-gray-400 font-mono" />
        </div>
```

With:
```jsx
        <div>
          <label className="text-xs text-gray-500 mb-1 block">內容</label>
          <RichTextEditor
            value={form.content}
            onChange={html => setForm(f => ({ ...f, content: html }))}
          />
        </div>
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 3: Start dev server and manually verify**

```bash
npm run dev
```

Open `http://localhost:5173/admin/posts` in browser, click an existing post to edit:

- [ ] Editor loads with existing content rendered as formatted text
- [ ] Toolbar visible with all buttons
- [ ] Bold / H1 / H2 buttons toggle active state when cursor inside formatted text
- [ ] Image button opens dialog with Upload / URL tabs
- [ ] Saving the post redirects back to `/admin/posts` without error
- [ ] Opening saved post again shows content correctly in editor

Then open the public blog post page and verify the HTML content renders with correct styling.

- [ ] **Step 4: Commit**

```bash
git add src/pages/admin/AdminPostEdit.jsx
git commit -m "feat: replace textarea with RichTextEditor in AdminPostEdit"
```

---

## Done

All four files created/modified, all tests passing. The admin can now edit articles in a full WYSIWYG editor. Old Markdown posts continue to render correctly on the frontend without any DB migration.
