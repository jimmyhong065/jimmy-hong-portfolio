const FONT_LABELS = { sm: '14px', md: '16px', lg: '18px' }

export default function ArticleToolbar({ fontSize, dark, onInc, onDec, onToggleDark, bookmarked = false, onToggleBookmark = () => {} }) {
  return (
    <div
      className="fixed left-0 right-0 lg:hidden z-40 border-t shadow-sm"
      style={{
        bottom: 'calc(4.5rem + env(safe-area-inset-bottom))',
        ...(dark
          ? { backgroundColor: '#1e1e1e', borderColor: '#333' }
          : { backgroundColor: '#ffffff', borderColor: '#f3f4f6' }),
      }}
    >
      <div className="flex items-center justify-between px-6 h-12">
        <div className="flex items-center gap-3">
          <button
            onClick={onDec}
            disabled={fontSize === 'sm'}
            className="text-sm disabled:opacity-30 px-1"
            style={{ color: dark ? '#9ca3af' : '#6b7280' }}
            aria-label="縮小字體"
          >
            A−
          </button>
          <span
            className="text-xs w-8 text-center"
            style={{ color: dark ? '#6b7280' : '#9ca3af' }}
          >
            {FONT_LABELS[fontSize]}
          </span>
          <button
            onClick={onInc}
            disabled={fontSize === 'lg'}
            className="text-sm disabled:opacity-30 px-1"
            style={{ color: dark ? '#9ca3af' : '#6b7280' }}
            aria-label="放大字體"
          >
            A+
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleBookmark}
            className="text-lg leading-none"
            style={{ color: bookmarked ? (dark ? '#e5e7eb' : '#111827') : (dark ? '#6b7280' : '#d1d5db') }}
            aria-label={bookmarked ? '取消收藏' : '加入收藏'}
          >
            {bookmarked ? '★' : '☆'}
          </button>
          <button
            onClick={onToggleDark}
            className="text-lg leading-none"
            aria-label={dark ? '切換亮色模式' : '切換暗色模式'}
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </div>
  )
}
