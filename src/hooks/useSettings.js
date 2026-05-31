import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSettings() {
  const [settings, setSettings] = useState({ email: '', github_url: '', linkedin_url: '', avatar_url: '', photo_avatar_url: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else if (data) setSettings(data)
        setLoading(false)
      })
  }, [])

  return { settings, loading, error }
}
