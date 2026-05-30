// src/components/TableOfContents.jsx
function TocList({ headings, activeId }) {
  return (
    <ul className="space-y-1.5">
      {headings.map(({ level, text, id }) => (
        <li key={id} className={level === 3 ? 'pl-3' : ''}>
          <a
            href={`#${id}`}
            className={`text-xs block transition-colors ${
              activeId === id
                ? 'text-gray-900 font-medium'
                : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            {text}
          </a>
        </li>
      ))}
    </ul>
  )
}

export default function TableOfContents({ headings, activeId = '', mobile = false }) {
  if (mobile) {
    return (
      <details className="border border-gray-100 rounded-xl p-4">
        <summary className="text-sm font-medium text-gray-700 cursor-pointer select-none">
          目錄
        </summary>
        <nav className="mt-3">
          <TocList headings={headings} activeId={activeId} />
        </nav>
      </details>
    )
  }
  return (
    <nav>
      <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-widest">目錄</p>
      <TocList headings={headings} activeId={activeId} />
    </nav>
  )
}
