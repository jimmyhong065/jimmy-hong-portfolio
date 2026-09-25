// 發布流程用純函式（無 IO，可單測）

const FM_RE = /^---\n([\s\S]*?)\n---\n/

// '---\nfm\n---\nbody' -> { fm: 'fm', body: 'body' }；沒有 frontmatter 時 fm 為 null
export function splitFrontmatter(raw) {
  const m = raw.match(FM_RE)
  if (!m) return { fm: null, body: raw }
  return { fm: m[1], body: raw.slice(m[0].length) }
}

export function getField(raw, key) {
  const { fm } = splitFrontmatter(raw)
  if (fm == null) return null
  const m = fm.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'))
  return m ? m[1].trim() : null
}

// 設定 frontmatter 欄位：已存在就地取代，否則加在尾端；沒有 frontmatter 就新建
export function setField(raw, key, value) {
  const { fm, body } = splitFrontmatter(raw)
  if (fm == null) return `---\n${key}: ${value}\n---\n${raw}`
  const line = new RegExp(`^${key}:.*$`, 'm')
  const next = line.test(fm) ? fm.replace(line, `${key}: ${value}`) : `${fm}\n${key}: ${value}`
  return `---\n${next}\n---\n${body}`
}

const CJK = '[\\u3400-\\u9fff\\uf900-\\ufaff]'
const FULL = { ',': '，', ';': '；', ':': '：', '?': '？', '!': '！' }
// 不轉換的片段：fenced code、inline code、連結網址、裸網址
const PROTECTED = /```[\s\S]*?```|`[^`\n]*`|\]\([^)]*\)|https?:\/\/[^\s)]+/g

function normalizeText(text) {
  return text
    // CJK 後的半形標點（吃掉後面空白）；`![` 是圖片語法不轉
    .replace(new RegExp(`(${CJK})([,;:?!])(?!\\[)[ \\t]*`, 'g'), (_, c, p) => c + FULL[p])
    // CJK 前的半形標點（吃掉前面空白）
    .replace(new RegExp(`[ \\t]*([,;:?!])(?=${CJK})`, 'g'), (_, p) => FULL[p])
    // 括號：內容含 CJK，或緊接在 CJK 後
    .replace(new RegExp(`(${CJK})?\\(([^()\\n]*)\\)`, 'g'), (m, before, inner) =>
      before || new RegExp(CJK).test(inner) ? `${before ?? ''}（${inner}）` : m)
}

// 只轉與 CJK 相鄰的半形標點；跳過 frontmatter、程式碼、網址
export function normalizePunctuation(raw) {
  const m = raw.match(FM_RE)
  const head = m ? m[0] : ''
  const body = raw.slice(head.length)
  let out = ''
  let last = 0
  for (const p of body.matchAll(PROTECTED)) {
    out += normalizeText(body.slice(last, p.index)) + p[0]
    last = p.index + p[0].length
  }
  return head + out + normalizeText(body.slice(last))
}

// 回傳錯誤訊息陣列；空陣列代表可以發布
export function validateArticle(raw) {
  const errors = []
  const { body } = splitFrontmatter(raw)
  if (!getField(raw, 'title') && !/^# .+/m.test(body)) errors.push('缺標題（frontmatter title 或 # 標題）')
  const tags = getField(raw, 'tags')
  if (!tags || !/\[\s*[^\]\s]/.test(tags)) errors.push('缺 tags')
  const status = getField(raw, 'status')
  if (status && !['draft', 'published'].includes(status)) errors.push('status 只能是 draft 或 published')
  return errors
}

export function parseTags(value) {
  const m = (value || '').match(/\[([^\]]*)\]/)
  return m ? m[1].split(',').map(t => t.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean) : []
}

// 從檔案內容組出 posts 表要的欄位（content 不含 frontmatter）
export function articleFields(raw) {
  const { body } = splitFrontmatter(raw)
  const heading = body.match(/^# (.+)/m)
  const title = getField(raw, 'title') || (heading ? heading[1].replace(/[`*_]/g, '').trim() : '')
  const tags = getField(raw, 'tags')
  return {
    title,
    content: body,
    excerpt: getField(raw, 'excerpt') || extractExcerpt(body),
    // frontmatter 沒寫 tags 就不帶，避免把 DB 既有 tags 清空
    ...(tags ? { tags: parseTags(tags) } : {}),
  }
}

// 後台（TipTap）編輯過的文章，DB 存的是 HTML；此時 repo 的 markdown 已不是真相，不可覆寫
export function isEditedInAdmin(dbContent) {
  return /^\s*</.test(dbContent ?? '')
}

function extractExcerpt(body) {
  for (const l of body.split('\n')) {
    const line = l.trim()
    if (!line || /^(#|>|---|1\.|-|\||!|```)/.test(line)) continue
    if (line.length > 20) return line.slice(0, 200)
  }
  return ''
}
