import { Link } from 'react-router-dom'

export default function PhotoCard({ project }) {
  return (
    <Link to={`/photo/${project.id}`} className="block group">
      {project.cover_url ? (
        <img
          src={project.cover_url}
          alt={project.title}
          className="w-full h-auto object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gray-100" />
      )}
      <div className="pt-2 pb-4">
        <h3 className="text-sm font-semibold mb-1">{project.title}</h3>
        <div className="flex gap-1 flex-wrap">
          {(project.tags ?? []).map(t => (
            <span key={t} className="text-xs text-gray-400">{t}</span>
          ))}
        </div>
      </div>
    </Link>
  )
}
