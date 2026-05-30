# Rich Text Editor for Admin Blog Posts

**Date:** 2026-05-30  
**Status:** Approved

## Problem

Admin post editing uses a plain `<textarea>`. Writers must hand-write Markdown syntax, with no toolbar, no preview, and no image upload UX.

## Goal

Replace the textarea with a full WYSIWYG editor (TipTap) so articles can be formatted visually in the admin panel. Content stores as HTML. Old Markdown posts remain readable without migration.

---

## Packages

```
npm install \
  @tiptap/react \
  @tiptap/starter-kit \
  @tiptap/extension-image \
  @tiptap/extension-link \
  @tiptap/extension-table \
  @tiptap/extension-table-row \
  @tiptap/extension-table-cell \
  @tiptap/extension-table-header \
  @tiptap/extension-placeholder \
  dompurify
```

---

## New Files

### `src/components/RichTextEditor.jsx`

TipTap editor instance. Props:
- `value: string` — current HTML content
- `onChange: (html: string) => void` — called on every editor update

Initializes with all extensions. On `onUpdate`, calls `onChange(editor.getHTML())`.

### `src/components/RichTextToolbar.jsx`

Toolbar rendered above the editor. Uses `editor.chain().focus()` API.

Button groups:
```
[ H1 | H2 | H3 ] [ Bold | Italic | Strike | Code ] [ Blockquote | CodeBlock ]
[ BulletList | OrderedList ] [ Link | Image | Table | HR ] [ Undo | Redo ]
```

Active state: buttons highlight when cursor is inside the matching node type.

### Image Insert Dialog

Triggered by the Image toolbar button. Two tabs:

1. **上傳** — file input → `useUpload` hook (existing R2 upload) → on complete, calls `editor.chain().focus().setImage({ src: uploadedUrl }).run()`
2. **URL** — text input → insert on confirm

---

## Changed Files

### `src/pages/admin/AdminPostEdit.jsx`

- Remove `<textarea name="content" ...>`
- Replace with `<RichTextEditor value={form.content} onChange={html => setForm(f => ({ ...f, content: html }))} />`
- Remove `name="content"` from `handleChange` (editor bypasses DOM events)

### `src/components/MarkdownContent.jsx`

Dual-mode rendering to support old Markdown and new HTML posts without DB migration:

```jsx
import DOMPurify from 'dompurify'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MarkdownContent({ content }) {
  const isHtml = content?.trimStart().startsWith('<')
  return isHtml
    ? <div
        className="prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content ?? '') }}
      />
    : <div className="prose prose-gray max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content ?? ''}</ReactMarkdown>
      </div>
}
```

`@tailwindcss/typography` is already installed — prose styles apply to both paths.

---

## TipTap Extensions Config

| Extension | Purpose |
|-----------|---------|
| StarterKit | H1–H3, bold, italic, strike, code, codeBlock, blockquote, bulletList, orderedList, hardBreak, horizontalRule, history (undo/redo) |
| Image | `<img>` insertion |
| Link | `<a>` with `openOnClick: false`, `autolink: true` |
| Table + Row + Cell + Header | Full table editing |
| Placeholder | Hint text when editor is empty |

---

## Content Storage

- **New posts:** editor outputs `editor.getHTML()` → stored as HTML in Supabase `posts.content`
- **Existing posts:** remain as Markdown; `MarkdownContent` detects and routes to the correct renderer
- **No DB migration required**

---

## Security

`DOMPurify.sanitize()` applied at render time on all HTML content. Blocks `<script>`, event handlers (`onerror`, `onclick`), and other XSS vectors. Sanitize happens client-side on read, not on write — this is sufficient since all content is admin-authored.

---

## Out of Scope

- Collaborative editing
- Markdown ↔ HTML migration script for old posts
- Custom image captions / figure elements
- Slash commands (Notion-style `/`)
