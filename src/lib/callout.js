// 彩色 callout：`> [!TIP]` 開頭的引用區塊轉成帶標題的提示框。
// md 文章走 remarkCallout；後台編輯過的 HTML 文章走 applyCalloutsToHtml。
// 兩邊都靠文字標記判斷（不靠 class），TipTap 存檔洗掉 class 也不會壞。
// [!BAD] 緊接 [!GOOD] 時包成 .compare-pair 並排對照。

export const CALLOUT_LABELS = {
  tip: '小技巧',
  warning: '注意',
  case: '實際案例',
  key: '重點',
  note: '補充',
  bad: '不建議',
  good: '建議',
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
  node.data = { ...node.data, calloutType: type, hProperties: { className: ['callout', `callout-${type}`] } }
}

const typeOf = node => node?.type === 'blockquote' && node.data?.calloutType

function pairCompareMd(parent) {
  const kids = parent.children
  for (let i = 0; i < kids.length - 1; i++) {
    if (typeOf(kids[i]) === 'bad' && typeOf(kids[i + 1]) === 'good') {
      kids.splice(i, 2, {
        type: 'comparePair',
        data: { hName: 'div', hProperties: { className: ['compare-pair'] } },
        children: [kids[i], kids[i + 1]],
      })
    }
  }
}

function walk(node) {
  if (node.type === 'blockquote') transformBlockquote(node)
  node.children?.forEach(walk)
  if (node.children) pairCompareMd(node)
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
  doc.querySelectorAll('blockquote.callout-bad').forEach(bad => {
    const good = bad.nextElementSibling
    if (!good?.matches('blockquote.callout-good')) return
    const pair = doc.createElement('div')
    pair.className = 'compare-pair'
    bad.before(pair)
    pair.append(bad, good)
  })
  return doc.body.innerHTML
}
