export default function Footer() {
  return (
    <footer className="border-t border-gray-100 py-7 px-12">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <span className="text-xs text-gray-400">© {new Date().getFullYear()} Jimmy Hong</span>
        <span className="text-xs text-gray-400">Built with Vite + React · Hosted on Cloudflare Pages</span>
      </div>
    </footer>
  )
}
