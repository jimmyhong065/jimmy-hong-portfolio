const CALENDLY_URL = 'https://calendly.com/pklaz0078/30min'

export default function PhotoFooter() {
  return (
    <footer className="border-t border-gray-100 pt-8 pb-24 md:pb-10 px-4 md:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Desktop */}
        <div className="hidden md:flex justify-between items-center">
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">r.bing recording</p>
            <div className="flex gap-4">
              <a href="/photo" className="text-xs text-gray-400 hover:text-gray-700">攝影作品</a>
              <button
                onClick={() => window.Calendly?.initPopupWidget({ url: CALENDLY_URL })}
                className="text-xs text-gray-400 hover:text-gray-700"
              >
                預約諮詢
              </button>
              <a href="https://www.instagram.com/r.bing_recording/" target="_blank" rel="noreferrer"
                className="text-xs text-gray-400 hover:text-gray-700">Instagram</a>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} r.bing recording</p>
          </div>
        </div>
        {/* Mobile */}
        <div className="md:hidden flex flex-col gap-4">
          <p className="text-xs font-medium text-gray-700">r.bing recording</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <a href="/photo" className="text-xs text-gray-400 hover:text-gray-700">攝影作品</a>
            <button
              onClick={() => window.Calendly?.initPopupWidget({ url: CALENDLY_URL })}
              className="text-xs text-gray-400 hover:text-gray-700"
            >
              預約諮詢
            </button>
            <a href="https://www.instagram.com/r.bing_recording/" target="_blank" rel="noreferrer"
              className="text-xs text-gray-400 hover:text-gray-700">Instagram</a>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} r.bing recording</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
