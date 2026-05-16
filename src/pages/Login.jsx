import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SEOHead from '../components/SEOHead'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  return (
    <>
      <SEOHead title="登入" />
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-8">
          <h1 className="text-lg font-bold mb-2">管理員登入</h1>
          <p className="text-xs text-gray-400 mb-6">輸入 email，系統會寄送 magic link。</p>
          {sent ? (
            <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-4">
              Magic link 已寄出！請檢查 <strong>{email}</strong> 的信箱。
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 mb-3 focus:outline-none focus:border-gray-400"
              />
              {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full text-sm bg-gray-900 text-white py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? '傳送中…' : '傳送 Magic Link'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
