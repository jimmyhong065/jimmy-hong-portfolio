import { useState } from 'react'
import { useUpload } from '../hooks/useUpload'

function Btn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-2 py-1 text-xs rounded transition-colors ${
        active ? 'bg-gray-800 text-white' : 'hover:bg-gray-200 text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

export default function RichTextToolbar({ editor }) {
  const [imageOpen, setImageOpen] = useState(false)
  const [imageTab, setImageTab] = useState('upload')
  const [imageUrl, setImageUrl] = useState('')
  const { uploading, uploadError, uploadOne } = useUpload()

  if (!editor) return null

  function insertImage(url) {
    editor.chain().focus().setImage({ src: url }).run()
    setImageOpen(false)
    setImageUrl('')
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    uploadOne(file, insertImage)
  }

  function handleLink() {
    const url = window.prompt('連結網址')
    if (url) editor.chain().focus().setLink({ href: url, target: '_blank' }).run()
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 border border-gray-200 border-b-0 rounded-t-lg bg-gray-50">
      {/* Headings */}
      <Btn title="H1" active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</Btn>
      <Btn title="H2" active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Btn>
      <Btn title="H3" active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</Btn>

      <span className="w-px bg-gray-200 mx-1" />

      {/* Inline marks */}
      <Btn title="粗體" active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></Btn>
      <Btn title="斜體" active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></Btn>
      <Btn title="刪除線" active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></Btn>
      <Btn title="行內程式碼" active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}>`</Btn>

      <span className="w-px bg-gray-200 mx-1" />

      {/* Blocks */}
      <Btn title="引用" active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}>"</Btn>
      <Btn title="程式碼區塊" active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}>{'{ }'}</Btn>

      <span className="w-px bg-gray-200 mx-1" />

      {/* Lists */}
      <Btn title="無序清單" active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}>•</Btn>
      <Btn title="有序清單" active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</Btn>

      <span className="w-px bg-gray-200 mx-1" />

      {/* Insert */}
      <Btn title="連結" active={editor.isActive('link')} onClick={handleLink}>🔗</Btn>
      <Btn title="圖片" active={false} onClick={() => setImageOpen(true)}>🖼</Btn>
      <Btn title="表格" active={editor.isActive('table')}
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>⊞</Btn>
      <Btn title="水平線" active={false}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}>—</Btn>

      <span className="w-px bg-gray-200 mx-1" />

      {/* History */}
      <Btn title="復原" active={false}
        onClick={() => editor.chain().focus().undo().run()}>↩</Btn>
      <Btn title="重做" active={false}
        onClick={() => editor.chain().focus().redo().run()}>↪</Btn>

      {/* Image dialog */}
      {imageOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-80 shadow-xl">
            <h3 className="text-sm font-semibold mb-4">插入圖片</h3>
            <div className="flex gap-2 mb-4">
              <button type="button"
                onClick={() => setImageTab('upload')}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${imageTab === 'upload' ? 'bg-gray-900 text-white' : 'border border-gray-200 hover:border-gray-400'}`}>
                上傳
              </button>
              <button type="button"
                onClick={() => setImageTab('url')}
                className={`text-xs px-3 py-1 rounded-full transition-colors ${imageTab === 'url' ? 'bg-gray-900 text-white' : 'border border-gray-200 hover:border-gray-400'}`}>
                URL
              </button>
            </div>

            {imageTab === 'upload' ? (
              <div>
                <input type="file" accept="image/*" onChange={handleFileChange}
                  disabled={uploading}
                  className="w-full text-sm text-gray-600" />
                {uploading && <p className="text-xs text-gray-500 mt-2">上傳中…</p>}
                {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
              </div>
            ) : (
              <div>
                <input type="text" value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400" />
                <button type="button"
                  onClick={() => insertImage(imageUrl)}
                  disabled={!imageUrl}
                  className="mt-3 w-full text-sm bg-gray-900 text-white py-2 rounded-lg disabled:opacity-50 hover:bg-gray-700">
                  插入
                </button>
              </div>
            )}

            <button type="button"
              onClick={() => setImageOpen(false)}
              className="mt-3 w-full text-sm border border-gray-200 py-2 rounded-lg hover:border-gray-400">
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
