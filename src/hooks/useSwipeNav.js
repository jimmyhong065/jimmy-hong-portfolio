import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useSwipeNav({ prevSlug, nextSlug }) {
  const ref = useRef(null)
  const navigate = useNavigate()
  const startXRef = useRef(0)
  const startYRef = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    function onStart(e) {
      startXRef.current = e.touches[0].clientX
      startYRef.current = e.touches[0].clientY
    }

    function onEnd(e) {
      const deltaX = e.changedTouches[0].clientX - startXRef.current
      const deltaY = e.changedTouches[0].clientY - startYRef.current
      if (Math.abs(deltaY) > 50) return
      if (deltaX > 80 && prevSlug) navigate(`/blog/${prevSlug}`)
      if (deltaX < -80 && nextSlug) navigate(`/blog/${nextSlug}`)
    }

    const opts = { passive: true }
    el.addEventListener('touchstart', onStart, opts)
    el.addEventListener('touchend', onEnd, opts)
    return () => {
      el.removeEventListener('touchstart', onStart, opts)
      el.removeEventListener('touchend', onEnd, opts)
    }
  }, [prevSlug, nextSlug, navigate])

  return ref
}
