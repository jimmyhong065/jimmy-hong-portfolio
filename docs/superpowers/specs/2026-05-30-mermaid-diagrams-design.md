# Mermaid Diagrams Support Design

**Date:** 2026-05-30  
**Status:** Approved

## Goal

Add Mermaid.js diagram support to the blog — both in the public renderer and the TipTap admin editor — then embed specific diagrams into five existing articles.

---

## Sub-project A: Infrastructure

### New Files

#### `src/components/MermaidChart.jsx`

Shared rendering component. Props: `definition: string`.

- Calls `mermaid.initialize({ startOnLoad: false, theme: 'default' })` once (guard with module-level flag)
- Uses `mermaid.render(uniqueId, definition)` in a `useEffect` → injects returned SVG into a `div` ref
- Shows a neutral loading placeholder while rendering
- Shows an inline error message if mermaid throws (invalid syntax)
- Exports only the component; mermaid init is an internal concern

#### `src/components/MermaidBlockExtension.jsx`

Custom TipTap Node extension with a React NodeView for real-time editing preview.

**Node schema:**
- Name: `mermaidBlock`
- Content: inline text (the mermaid source)
- Marks: none
- Group: `block`

**HTML serialization:**
- To HTML: `<pre><code class="language-mermaid">{content}</code></pre>`
- From HTML: parse `pre > code.language-mermaid` → restore as `mermaidBlock` node

**NodeView UI (two-panel layout):**
```
┌────────────────────────────────┐
│  [⬡ Mermaid]  [✕ delete]      │
├────────────────────────────────┤
│  <textarea>  (editable source) │
├────────────────────────────────┤
│  rendered SVG preview          │
└────────────────────────────────┘
```

- `textarea` onChange → debounce 300ms → re-render SVG via `MermaidChart`
- ✕ button calls `deleteNode()` via TipTap NodeView API
- Header label "⬡ Mermaid" is non-editable, serves as drag handle hint

**insertMermaidBlock command:** inserts a mermaidBlock node with a starter template:
```
graph TD
    A[開始] --> B[結束]
```

---

### Changed Files

#### `src/components/MarkdownContent.jsx`

**react-markdown path** — add custom `code` component:

```jsx
function Code({ inline, className, children }) {
  if (!inline && className === 'language-mermaid')
    return <MermaidChart definition={String(children).trim()} />
  return <code className={className}>{children}</code>
}
// Pass to ReactMarkdown: components={{ code: Code }}
```

**HTML path (dangerouslySetInnerHTML)** — add `useRef` + `useEffect` to scan and replace mermaid blocks after mount:

```jsx
const containerRef = useRef()

useEffect(() => {
  if (!isHtml || !containerRef.current) return
  containerRef.current
    .querySelectorAll('pre > code.language-mermaid')
    .forEach(async (el) => {
      const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`
      try {
        const { svg } = await mermaid.render(id, el.textContent.trim())
        const wrapper = document.createElement('div')
        wrapper.className = 'my-6 flex justify-center overflow-x-auto'
        wrapper.innerHTML = svg
        el.closest('pre').replaceWith(wrapper)
      } catch {
        // leave original code block intact on parse error
      }
    })
}, [content, isHtml])

// Attach ref to the HTML-rendered div
```

#### `src/components/RichTextToolbar.jsx`

Add "⬡ 圖表" button to the Insert group (after the Image button):

```jsx
<Btn title="Mermaid 圖表" active={false}
  onClick={() => editor.chain().focus().insertMermaidBlock().run()}>⬡</Btn>
```

#### `src/components/RichTextEditor.jsx`

Add `MermaidBlockExtension` to the extensions array (after `Placeholder`).

---

## Sub-project B: Article Diagrams

Diagrams are embedded as mermaid code blocks immediately after the relevant section in each article file.

### appium-article-revised.md — Appium Architecture

Insert after the "架構" section heading, replacing the existing ASCII art:

```mermaid
flowchart TD
    A["你的腳本（Python / JS）"] --> B["Appium Server\n（Node.js 翻譯官）"]
    B --> C["Driver\n（UIAutomator2 / XCUITest）"]
    C --> D["真實裝置 / 模擬器"]
    
    A -. "問題來源" .-> E1["腳本邏輯\n等待時間不足"]
    B -. "問題來源" .-> E2["Session 超時\nPort 衝突"]
    C -. "問題來源" .-> E3["Android/iOS\n版本不符"]
    D -. "問題來源" .-> E4["UI 未渲染完\n動畫進行中"]
```

### k6-article-revised.md — Two diagrams

**Diagram 1:** After "效能測試不是只有一種" section, after the table:

```mermaid
timeline
    title 各種效能測試的流量特徵
    Smoke    : 1–2 VU / 1 分鐘
    Load     : 緩慢爬升 → 穩定 → 降載
    Stress   : 慢慢加壓到服務極限
    Spike    : 瞬間打滿 → 觀察恢復
    Soak     : 中等負載持續 8–24 小時
```

**Diagram 2:** After "怎麼知道服務是被你打掛的" section, replacing ASCII art:

```mermaid
flowchart LR
    K6["k6 執行壓測"] --> IDB["InfluxDB\n（指標儲存）"]
    IDB --> GF["Grafana\n（視覺化 Dashboard）"]
    CW["AWS CloudWatch\nCPU / Memory / RDS / Redis"] --> GF
    GF --> AL["Slack Alert\n（P95 超過 threshold 時）"]
```

### qa-team-collaboration.md — Collaboration Workflow

Insert after "現在怎麼協作" heading:

```mermaid
flowchart TD
    A["Sprint 開始\n一起看 AC 30 分鐘"] --> B["識別跨模組流程"]
    B --> C["各自撰寫測試案例"]
    C --> D["測試案例互審\n（10 分鐘）"]
    D --> E["分工執行測試"]
    E --> F["High-risk 案例\n兩人一起跑"]
    F --> G{"發現問題？"}
    G -->|"是"| H["記入共用 QA Wiki"]
    G -->|"否"| I["Release 準備完成"]
    H --> I
```

### unit-test-100-but-qa-finds-bugs.md — Testing Pyramid

Insert after "測試金字塔的真正意義" heading:

```mermaid
flowchart BT
    U["🟢 Unit 測試<br/>多・快・便宜<br/>測函數邏輯正確性"]
    I["🟡 Integration 測試<br/>中等數量<br/>測服務之間的契約"]
    E["🔴 E2E 測試<br/>少・慢・貴<br/>測完整用戶流程"]
    U --> I --> E
```

### when-to-ship.md — Bug Severity Decision Tree

Insert after "我用來判斷的框架" heading:

```mermaid
flowchart TD
    START["發現 Bug"] --> Q1{"影響用戶範圍？"}
    Q1 -->|"< 5%"| Q2A{"嚴重程度？"}
    Q1 -->|"> 50%"| Q2B{"核心功能壞掉？"}
    Q2A -->|"視覺異常"| SHIP["✅ 可上線\n下個 Sprint 修"]
    Q2A -->|"功能受損"| Q3{"有 workaround？"}
    Q2B -->|"是"| BLOCK["🚫 不應上線"]
    Q2B -->|"否"| Q3
    Q3 -->|"有"| RISK["⚠️ 評估延遲代價\n再決定"]
    Q3 -->|"無"| BLOCK
```

---

## Package Requirements

- `mermaid` — already a browser-standard library, install via npm
- No additional TipTap packages needed (NodeView uses `@tiptap/react` already installed)

```bash
npm install mermaid
```

---

## Out of Scope

- Mermaid syntax validation in the editor (rely on mermaid's own error)
- Dark mode theming for diagrams
- Export diagram as image from editor
- Mermaid in the public page's SEO / og:image
