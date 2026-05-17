import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SEOHead from '../components/SEOHead'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('帳號或密碼錯誤')
      setLoading(false)
    } else {
      navigate('/admin')
    }
  }

  return (
    <>
      <SEOHead title="登入" />
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-8">
          <h1 className="text-lg font-bold mb-2">管理員登入</h1>
          <p className="text-xs text-gray-400 mb-6">輸入帳號與密碼登入後台。</p>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 mb-3 focus:outline-none focus:border-gray-400"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="密碼"
              required
              className="w-full text-sm border border-gray-200 rounded-lg px-4 py-2.5 mb-3 focus:outline-none focus:border-gray-400"
            />
            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-sm bg-gray-900 text-white py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {loading ? '登入中…' : '登入'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
