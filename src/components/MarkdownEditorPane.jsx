import { useState } from 'react'
import MarkdownContent from './MarkdownContent'

export default function MarkdownEditorPane({ value, onChange }) {
  const [tab, setTab] = useState('edit')

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200">
        <button type="button" onClick={() => setTab('edit')}
          className={`text-xs px-3 py-1 rounded transition-colors ${tab === 'edit' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'}`}>
          ✏️ 編輯
        </button>
        <button type="button" onClick={() => setTab('preview')}
          className={`text-xs px-3 py-1 rounded transition-colors ${tab === 'preview' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'}`}>
          👁 預覽
        </button>
        <span className="text-xs text-gray-300 ml-auto">Markdown 模式</span>
      </div>

      {/* Edit pane */}
      {tab === 'edit' && (
        <div>
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={28}
            spellCheck={false}
            placeholder={`## 標題\n\n段落文字\n\n\`\`\`javascript\n// 程式碼\n\`\`\`\n\n- 清單項目`}
            className="w-full text-sm font-mono px-4 py-3 focus:outline-none resize-none leading-relaxed"
          />
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-400">支援 GFM Markdown：## 標題、**粗體**、*斜體*、\`程式碼\`、表格、清單</p>
          </div>
        </div>
      )}

      {/* Preview pane */}
      {tab === 'preview' && (
        <div className="min-h-[400px] px-4 py-4">
          {value?.trim()
            ? <MarkdownContent content={value} />
            : <p className="text-sm text-gray-300">沒有內容</p>
          }
        </div>
      )}
    </div>
  )
}
