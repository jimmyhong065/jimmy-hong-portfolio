import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DOMPurify from 'dompurify'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import { githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript'
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python'
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash'
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml'
import MermaidChart from './MermaidChart'
import { slugify, headingId, headingText } from '../lib/toc'
import Lightbox from './Lightbox'

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

let htmlMermaidCounter = 0

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy}
      className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors sm:opacity-0 sm:group-hover:opacity-100">
      {copied ? '✓' : '複製'}
    </button>
  )
}

function MdCode({ inline, className, children }) {
  const lang = className?.replace('language-', '') ?? ''
  if (!inline && lang === 'mermaid') {
    return <MermaidChart definition={String(children).trim()} />
  }
  if (!inline && lang) {
    const code = String(children).trim()
    return (
      <div className="relative group">
        <CopyButton text={code} />
        <SyntaxHighlighter language={lang} style={githubGist} PreTag="div"
          customStyle={{ borderRadius: '0.5rem', fontSize: '0.8rem', margin: '1.5rem 0', overflowX: 'auto' }}>
          {code}
        </SyntaxHighlighter>
      </div>
    )
  }
  return <code className={className}>{children}</code>
}

function MdH2({ children }) {
  const raw = String(children)
  return <h2 id={headingId(raw)}>{headingText(raw)}</h2>
}
function MdH3({ children }) {
  const raw = String(children)
  return <h3 id={headingId(raw)}>{headingText(raw)}</h3>
}

function MdLink({ href, children }) {
  const isExternal = href?.startsWith('http')
  // 站內路徑（/blog/...）用 react-router Link 做軟導航，避免整頁重整
  const isInternalRoute = href?.startsWith('/') && !href.startsWith('//')
  function handleClick() {
    if (isExternal && typeof window.gtag === 'function') {
      window.gtag('event', 'outbound_click', {
        link_url: href,
        link_text: String(children),
      })
    }
  }
  if (isInternalRoute) {
    return <Link to={href}>{children}</Link>
  }
  return (
    <a href={href} onClick={handleClick}
      {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}>
      {children}
    </a>
  )
}

function MdImg({ src, alt }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <img src={src} alt={alt ?? ''} loading="lazy"
        className="cursor-zoom-in rounded-lg hover:opacity-95 transition-opacity w-full"
        onClick={() => setOpen(true)} />
      {open && (
        <Lightbox images={[src]} index={0} onClose={() => setOpen(false)}
          onPrev={() => {}} onNext={() => {}} />
      )}
    </>
  )
}

export default function MarkdownContent({ content }) {
  const containerRef = useRef()
  const isHtml = content?.trimStart().startsWith('<')

  function addHeadingIds(html) {
    return html.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, inner) => {
      if (/\bid=/.test(attrs)) return match
      const text = inner.replace(/<[^>]+>/g, '').trim()
      return `<${tag}${attrs} id="${slugify(text)}">${inner}</${tag}>`
    })
  }

  useEffect(() => {
    if (!containerRef.current) return
    const links = containerRef.current.querySelectorAll('a[href^="http"]')
    const handlers = []
    links.forEach(link => {
      const handler = () => {
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'outbound_click', {
            link_url: link.href,
            link_text: link.innerText,
          })
        }
      }
      link.addEventListener('click', handler)
      handlers.push({ link, handler })
    })
    return () => handlers.forEach(({ link, handler }) => link.removeEventListener('click', handler))
  }, [content])

  useEffect(() => {
    if (!isHtml || !containerRef.current) return
    const els = containerRef.current.querySelectorAll('pre > code.language-mermaid')
    if (!els.length) return
    import('mermaid').then(({ default: mermaid }) => {
      if (!mermaidInitialized) {
        mermaid.initialize(MERMAID_CONFIG)
        mermaidInitialized = true
      }
      els.forEach(async (el) => {
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
    })
  }, [content, isHtml])

  return isHtml
    ? (
      <div
        ref={containerRef}
        className="prose prose-gray max-w-none [&_pre]:overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(addHeadingIds(content ?? '')) }}
      />
    )
    : (
      <div className="prose prose-gray max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{ code: MdCode, h2: MdH2, h3: MdH3, img: MdImg, a: MdLink }}
        >
          {content ?? ''}
        </ReactMarkdown>
      </div>
    )
}
