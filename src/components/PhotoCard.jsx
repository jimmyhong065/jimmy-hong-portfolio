import { Link } from 'react-router-dom'

export default function PhotoCard({ project }) {
  return (
    <Link to={`/photo/${project.id}`} className="block group relative overflow-hidden aspect-[4/5]">
      {project.cover_url ? (
        <img
          src={project.cover_url}
          alt={project.title}
          draggable="false"
          onContextMenu={e => e.preventDefault()}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] pointer-events-none select-none"
        />
      ) : (
        <div className="w-full h-full bg-gray-200" />
      )}
      {/* Hover overlay */}
      <div
        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-5"
        onContextMenu={e => e.preventDefault()}
      >
        <div className="flex justify-end">
          <span className="text-xs text-white/80 tracking-widest">More+</span>
        </div>
        <div>
          <h3 className="text-sm font-medium text-white leading-snug">{project.title}</h3>
          {(project.tags ?? []).length > 0 && (
            <p className="text-xs text-white/50 mt-1">{(project.tags ?? []).join(' · ')}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
