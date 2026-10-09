// 給爬蟲的文章內文：純文字但保留連結（<a href>），讓搜尋引擎看得到站內互連。
// 後台編輯過的文章是 HTML、其餘是 markdown，兩種都處理。

const SITE_URL = 'https://qa-lens.com'
const OPEN = ''
const CLOSE = ''

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function normalizeHref(href) {
  const h = href.trim()
  if (h.startsWith('/') && !h.startsWith('//')) return SITE_URL + h
  if (/^https?:\/\//i.test(h)) return h
  return null // 錨點、mailto、javascript: 等一律不輸出連結
}

function stripMarkdown(md) {
  return md
    .replace(/<[^>]+>/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function contentToBodyHtml(content = '') {
  const links = []
  const keep = (text, href) => {
    const url = normalizeHref(href)
    if (!url) return text
    links.push({ text, url })
    return `${OPEN}${links.length - 1}${CLOSE}`
  }

  const withTokens = content
    .replace(/```[\s\S]*?```/g, ' ') // code block 裡的 [x](y) 不是連結
    .replace(/<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => keep(text.replace(/<[^>]+>/g, ''), href))
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g, (_, text, href) => keep(text, href))

  return escapeHtml(stripMarkdown(withTokens)).replace(
    new RegExp(`${OPEN}(\\d+)${CLOSE}`, 'g'),
    (_, i) => {
      const { text, url } = links[Number(i)]
      return `<a href="${escapeHtml(url)}">${escapeHtml(stripMarkdown(text))}</a>`
    },
  )
}
