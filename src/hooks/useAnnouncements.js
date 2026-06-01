import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('announcements')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setAnnouncements(data)
        setLoading(false)
      })
  }, [])

  return { announcements, loading }
}
