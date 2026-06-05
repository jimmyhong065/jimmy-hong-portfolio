const S = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

export const SVG_MAP = {
  projects: <svg {...S} width="20" height="20"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  blog:     <svg {...S} width="20" height="20"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M9 12h6M9 16h6"/></svg>,
  saved:    <svg {...S} width="20" height="20"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>,
  faq:      <svg {...S} width="20" height="20"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></svg>,
  about:    <svg {...S} width="20" height="20"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  camera:   <svg {...S} width="20" height="20"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  home:     <svg {...S} width="20" height="20"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  star:     <svg {...S} width="20" height="20"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  link:     <svg {...S} width="20" height="20"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  mail:     <svg {...S} width="20" height="20"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  chart:    <svg {...S} width="20" height="20"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  code:     <svg {...S} width="20" height="20"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  bell:     <svg {...S} width="20" height="20"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
}

export const ICON_KEYS = Object.keys(SVG_MAP)

export const FALLBACK_TABS = [
  { id: '1', label: '作品集', url: '/projects', icon_key: 'projects', visible: true, order: 0 },
  { id: '2', label: '部落格', url: '/blog',     icon_key: 'blog',     visible: true, order: 1 },
  { id: '3', label: '收藏',   url: '/saved',    icon_key: 'saved',    visible: true, order: 2 },
  { id: '4', label: 'FAQ',    url: '/faq',      icon_key: 'faq',      visible: true, order: 3 },
  { id: '5', label: '關於我', url: '/about',    icon_key: 'about',    visible: true, order: 4 },
]
