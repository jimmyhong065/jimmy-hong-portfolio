import { useRef, useEffect } from 'react'
import DOMPurify from 'dompurify'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mermaid from 'mermaid'
import MermaidChart from './MermaidChart'

let mermaidInitialized = false
function initMermaid() {
  if (mermaidInitialized) return
  mermaid.initialize({ startOnLoad: false, theme: 'default' })
  mermaidInitialized = true
}

let htmlMermaidCounter = 0

function MdCode({ inline, className, children }) {
  if (!inline && className === 'language-mermaid') {
    return <MermaidChart definition={String(children).trim()} />
  }
  return <code className={className}>{children}</code>
}

export default function MarkdownContent({ content }) {
  const containerRef = useRef()
  const isHtml = content?.trimStart().startsWith('<')

  useEffect(() => {
    if (!isHtml || !containerRef.current) return
    initMermaid()
    containerRef.current
      .querySelectorAll('pre > code.language-mermaid')
      .forEach(async (el) => {
        const id = `mermaid-html-${++htmlMermaidCounter}`
        try {
          const { svg } = await mermaid.render(id, el.textContent.trim())
          const wrapper = document.createElement('div')
          wrapper.className = 'my-6 flex justify-center overflow-x-auto'
          wrapper.innerHTML = svg
          el.closest('pre').replaceWith(wrapper)
        } catch {
          // leave original code block on parse error
        }
      })
  }, [content, isHtml])

  return isHtml
    ? (
      <div
        ref={containerRef}
        className="prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content ?? '') }}
      />
    )
    : (
      <div className="prose prose-gray max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{ code: MdCode }}
        >
          {content ?? ''}
        </ReactMarkdown>
      </div>
    )
}
