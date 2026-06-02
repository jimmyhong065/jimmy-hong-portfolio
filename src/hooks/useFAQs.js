import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useFAQs() {
  const [faqs, setFAQs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('faqs')
      .select('*')
      .eq('published', true)
      .order('category')
      .order('display_order')
      .then(({ data }) => {
        setFAQs(data ?? [])
        setLoading(false)
      })
  }, [])

  return { faqs, loading }
}
