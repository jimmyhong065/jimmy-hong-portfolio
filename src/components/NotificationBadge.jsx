export function NotificationBadge({ count }) {
  if (!count) return null
  return (
    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none pointer-events-none">
      {count > 9 ? '9+' : count}
    </span>
  )
}
