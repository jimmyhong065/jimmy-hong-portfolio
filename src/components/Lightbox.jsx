import { useEffect, useCallback, useRef } from 'react'

export default function Lightbox({ images, index, onClose, onPrev, onNext }) {
  const total = images.length
  const touchStartX = useRef(0)

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft') onPrev()
    if (e.key === 'ArrowRight') onNext()
  }, [onClose, onPrev, onNext])

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [handleKey])

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e) {
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta > 60) onPrev()
    else if (delta < -60) onNext()
  }

  const current = images[index]
  const src = typeof current === 'string' ? current : current?.url
  const caption = typeof current === 'object' ? current?.caption : null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl leading-none p-2"
        onClick={onClose}
      >
        ✕
      </button>

      {/* Counter */}
      <span className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/50">
        {index + 1} / {total}
      </span>

      {/* Prev */}
      {total > 1 && (
        <button
          className="absolute left-3 md:left-6 text-white/60 hover:text-white text-3xl p-3"
          onClick={e => { e.stopPropagation(); onPrev() }}
        >
          ‹
        </button>
      )}

      {/* Image */}
      <div className="max-w-5xl max-h-[90vh] mx-16 flex flex-col items-center" onClick={e => e.stopPropagation()}>
        <img
          src={src}
          alt={caption || ''}
          className="max-h-[82vh] max-w-full object-contain rounded-sm"
          draggable="false"
        />
        {caption && (
          <p className="mt-3 text-xs text-white/60 text-center">{caption}</p>
        )}
      </div>

      {/* Next */}
      {total > 1 && (
        <button
          className="absolute right-3 md:right-6 text-white/60 hover:text-white text-3xl p-3"
          onClick={e => { e.stopPropagation(); onNext() }}
        >
          ›
        </button>
      )}
    </div>
  )
}
