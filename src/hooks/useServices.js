import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useServices(type) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let query = supabase.from('services').select('*').order('display_order')
    if (type) query = query.eq('type', type)
    query.then(({ data }) => {
      if (data) setServices(data)
      setLoading(false)
    })
  }, [type])

  return { services, loading }
}
