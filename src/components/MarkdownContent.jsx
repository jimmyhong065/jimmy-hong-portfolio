import { useRef, useEffect } from 'react'
import DOMPurify from 'dompurify'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mermaid from 'mermaid'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import { githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript'
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python'
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash'
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml'
import MermaidChart from './MermaidChart'
import { slugify } from '../lib/toc'

SyntaxHighlighter.registerLanguage('javascript', js)
SyntaxHighlighter.registerLanguage('js', js)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('sh', bash)
SyntaxHighlighter.registerLanguage('yaml', yaml)
SyntaxHighlighter.registerLanguage('yml', yaml)

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
  const lang = className?.replace('language-', '') ?? ''
  if (!inline && lang === 'mermaid') {
    return <MermaidChart definition={String(children).trim()} />
  }
  if (!inline && lang) {
    return (
      <SyntaxHighlighter language={lang} style={githubGist} PreTag="div"
        customStyle={{ borderRadius: '0.5rem', fontSize: '0.8rem', margin: '1.5rem 0' }}>
        {String(children).trim()}
      </SyntaxHighlighter>
    )
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
