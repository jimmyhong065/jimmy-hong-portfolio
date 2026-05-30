import { useRef, useEffect } from 'react'
import DOMPurify from 'dompurify'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mermaid from 'mermaid'
import MermaidChart from './MermaidChart'
import { slugify } from '../lib/toc'

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

let mermaidInitialized = false
function initMermaid() {
  if (mermaidInitialized) return
  mermaid.initialize(MERMAID_CONFIG)
  mermaidInitialized = true
}

let htmlMermaidCounter = 0

function MdCode({ inline, className, children }) {
  if (!inline && className === 'language-mermaid') {
    return <MermaidChart definition={String(children).trim()} />
  }
  return <code className={className}>{children}</code>
}

function MdH2({ children }) {
  return <h2 id={slugify(String(children))}>{children}</h2>
}
function MdH3({ children }) {
  return <h3 id={slugify(String(children))}>{children}</h3>
}

export default function MarkdownContent({ content }) {
  const containerRef = useRef()
  const isHtml = content?.trimStart().startsWith('<')

  function addHeadingIds(html) {
    return html.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi, (_, tag, attrs, inner) => {
      const text = inner.replace(/<[^>]+>/g, '').trim()
      return `<${tag}${attrs} id="${slugify(text)}">${inner}</${tag}>`
    })
  }

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
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(addHeadingIds(content ?? '')) }}
      />
    )
    : (
      <div className="prose prose-gray max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{ code: MdCode, h2: MdH2, h3: MdH3 }}
        >
          {content ?? ''}
        </ReactMarkdown>
      </div>
    )
}
