import { useRef, useState } from 'react'
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import MermaidChart from './MermaidChart'

const STARTER = 'flowchart TD\n    A[開始] --> B[結束]'

export function MermaidNodeView({ node, updateAttributes, deleteNode }) {
  const [localDef, setLocalDef] = useState(node.attrs.definition)
  const debounceRef = useRef()

  function handleChange(e) {
    const val = e.target.value
    setLocalDef(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateAttributes({ definition: val })
    }, 300)
  }

  return (
    <NodeViewWrapper>
      <div className="my-4 border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-200">
          <span className="text-xs text-gray-500 font-mono">⬡ Mermaid</span>
          <button
            type="button"
            title="刪除圖表"
            onClick={deleteNode}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            ✕
          </button>
        </div>
        <textarea
          value={localDef}
          onChange={handleChange}
          rows={5}
          className="w-full text-xs font-mono px-3 py-2 focus:outline-none resize-y border-b border-gray-200"
          placeholder="輸入 mermaid 語法…"
        />
        <div className="px-4 py-3 bg-white">
          <MermaidChart definition={localDef} />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

const MermaidBlockExtension = Node.create({
  name: 'mermaidBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      definition: { default: STARTER },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'pre',
        getAttrs: (node) => {
          const code = node.querySelector('code.language-mermaid')
          if (!code) return false
          return { definition: code.textContent.trim() }
        },
      },
    ]
  },

  renderHTML({ node }) {
    return [
      'pre',
      {},
      ['code', { class: 'language-mermaid' }, node.attrs.definition],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidNodeView)
  },

  addCommands() {
    return {
      insertMermaidBlock:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { definition: STARTER } }),
    }
  },
})

export default MermaidBlockExtension
