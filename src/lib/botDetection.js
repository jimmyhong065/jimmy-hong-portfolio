// 真人 vs bot 偵測：把行為訊號送進 GA4
//  - human_verified：真人才會觸發的互動（滑鼠/捲動/觸控/鍵盤），每個 session 最多一次
//  - bot_suspected：載入時就抓到的 headless / 自動化旗標
// GA4 報表用「有無 human_verified」當真人分群基準。

function sendBotSignals() {
  if (typeof window.gtag !== 'function') return
  const flags = []
  // navigator.webdriver === true 幾乎鐵定是 Puppeteer/Playwright 等自動化工具
  if (navigator.webdriver) flags.push('webdriver')
  // 真人瀏覽器一定有語言設定
  if (!navigator.languages || navigator.languages.length === 0) flags.push('no-languages')
  // headless Chrome 常見：宣稱是 Chrome 但沒有 window.chrome
  if (!window.chrome && /Chrome/.test(navigator.userAgent)) flags.push('fake-chrome')
  // 無頭環境常缺外掛清單（非絕對，故只當輔助訊號）
  if (navigator.plugins && navigator.plugins.length === 0) flags.push('no-plugins')

  if (flags.length > 0) {
    window.gtag('event', 'bot_suspected', { signals: flags.join(',') })
  }
}

let humanProven = false

export function initBotDetection() {
  if (typeof window === 'undefined') return

  sendBotSignals()

  const markHuman = method => {
    if (humanProven) return
    humanProven = true
    cleanup()
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'human_verified', { method })
    }
  }

  const onMove = () => markHuman('mousemove')
  const onScroll = () => markHuman('scroll')
  const onTouch = () => markHuman('touch')
  const onKey = () => markHuman('keydown')

  function cleanup() {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('touchstart', onTouch)
    window.removeEventListener('keydown', onKey)
  }

  window.addEventListener('mousemove', onMove, { once: true, passive: true })
  window.addEventListener('scroll', onScroll, { once: true, passive: true })
  window.addEventListener('touchstart', onTouch, { once: true, passive: true })
  window.addEventListener('keydown', onKey, { once: true, passive: true })

  return cleanup
}
