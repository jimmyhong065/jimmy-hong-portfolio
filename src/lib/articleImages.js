const QA_RULES = [
  { keywords: ['自動化', 'Automation', 'Appium', 'Playwright', 'Selenium', 'pytest', 'k6'], img: '/images/3.png' },
  { keywords: ['Bug', 'bug', '缺陷', '回報', '問題追蹤'], img: '/images/2.png' },
  { keywords: ['CI/CD', 'DevOps', 'GitHub Actions', 'Jenkins', 'Pipeline'], img: '/images/5.png' },
  { keywords: ['回歸', 'Regression'], img: '/images/4.png' },
  { keywords: ['Release', '發布', '品質把關', '上線'], img: '/images/6.png' },
  { keywords: ['Test Case', '測試案例', '測試設計', '測試計畫', '測試策略'], img: '/images/1.png' },
]

const PHOTO_RULES = [
  { keywords: ['器材', '鏡頭', '相機'], img: '/images/8.png' },
  { keywords: ['構圖'], img: '/images/9.png' },
  { keywords: ['後製', 'Lightroom', '修圖'], img: '/images/11.png' },
  { keywords: ['作品', '人像'], img: '/images/12.png' },
]

export const QA_DEFAULT = '/images/1.png'
export const PHOTO_DEFAULT = '/images/10.png'

export function getArticleImage(tags = []) {
  for (const { keywords, img } of QA_RULES) {
    if (tags.some(t => keywords.some(k => t.includes(k) || k.includes(t)))) return img
  }
  return QA_DEFAULT
}

export function getPhotoImage(tags = []) {
  for (const { keywords, img } of PHOTO_RULES) {
    if (tags.some(t => keywords.some(k => t.includes(k) || k.includes(t)))) return img
  }
  return PHOTO_DEFAULT
}
