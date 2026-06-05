import { useEffect, useRef, useState } from 'react'

const MERMAID_CONFIG = {
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    background: '#ffffff',
    primaryColor: '#dbeafe',
    primaryBorderColor: '#3b82f6',
    primaryTextColor: '#1e293b',
    lineColor: '#64748b',
    edgeLabelBackground: '#f8fafc',
    fontSize: '14px',
  },
}

let initialized = false
let counter = 0

export default function MermaidChart({ definition }) {
  const ref = useRef()
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!definition) return
    let cancelled = false

    import('mermaid').then(({ default: mermaid }) => {
      if (cancelled) return
      if (!initialized) {
        mermaid.initialize(MERMAID_CONFIG)
        initialized = true
      }
      const id = `mermaid-${++counter}`
      setError(null)
      mermaid.render(id, definition)
        .then(({ svg }) => {
          if (!cancelled && ref.current) ref.current.innerHTML = svg
        })
        .catch(() => {
          if (!cancelled) setError('圖表語法錯誤')
        })
    })

    return () => { cancelled = true }
  }, [definition])

  if (error) {
    return (
      <div className="my-6 p-3 border border-red-200 rounded text-sm text-red-500">
        [mermaid 圖表語法錯誤]
      </div>
    )
  }

  return <div ref={ref} className="my-6 flex justify-center overflow-x-auto" />
}
