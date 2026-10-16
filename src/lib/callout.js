// 彩色 callout：`> [!TIP]` 開頭的引用區塊轉成帶標題的提示框。
// md 文章走 remarkCallout；後台編輯過的 HTML 文章走 applyCalloutsToHtml。
// 兩邊都靠文字標記判斷（不靠 class），TipTap 存檔洗掉 class 也不會壞。

export const CALLOUT_LABELS = {
  tip: '小技巧',
  warning: '注意',
  case: '實際案例',
  key: '重點',
  note: '補充',
}

const TYPES = Object.keys(CALLOUT_LABELS).join('|')
const MD_MARKER = new RegExp(`^\\s*\\[!(${TYPES})\\][ \\t]*\\n?`, 'i')
const HTML_MARKER = new RegExp(`^\\s*\\[!(${TYPES})\\]\\s*(?:<br\\s*/?>\\s*)?`, 'i')

function titleNode(type) {
  return {
    type: 'paragraph',
    data: { hProperties: { className: ['callout-title'] } },
    children: [{ type: 'text', value: CALLOUT_LABELS[type] }],
  }
}

function transformBlockquote(node) {
  const para = node.children[0]
  const first = para?.type === 'paragraph' ? para.children[0] : null
  if (first?.type !== 'text') return
  const m = first.value.match(MD_MARKER)
  if (!m) return
  const type = m[1].toLowerCase()

  first.value = first.value.slice(m[0].length)
  if (!first.value) {
    para.children.shift()
    if (para.children[0]?.type === 'break') para.children.shift()
  }
  if (!para.children.length) node.children.shift()

  node.children.unshift(titleNode(type))
  node.data = { ...node.data, hProperties: { className: ['callout', `callout-${type}`] } }
}

function walk(node) {
  if (node.type === 'blockquote') transformBlockquote(node)
  node.children?.forEach(walk)
}

export function remarkCallout() {
  return tree => walk(tree)
}

export function applyCalloutsToHtml(html) {
  if (!new RegExp(`\\[!(${TYPES})\\]`, 'i').test(html)) return html
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  doc.querySelectorAll('blockquote').forEach(bq => {
    const first = bq.firstElementChild
    if (first?.tagName !== 'P') return
    const m = first.innerHTML.match(HTML_MARKER)
    if (!m) return
    const type = m[1].toLowerCase()

    first.innerHTML = first.innerHTML.slice(m[0].length)
    if (!first.textContent.trim() && !first.querySelector('img')) first.remove()

    const title = doc.createElement('p')
    title.className = 'callout-title'
    title.textContent = CALLOUT_LABELS[type]
    bq.prepend(title)
    bq.classList.add('callout', `callout-${type}`)
  })
  return doc.body.innerHTML
}
