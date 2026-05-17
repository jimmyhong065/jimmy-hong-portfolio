import { Link } from 'react-router-dom'

export default function PhotoCard({ project }) {
  return (
    <Link to={`/photo/${project.id}`} className="block border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {project.cover_url ? (
        <img src={project.cover_url} alt={project.title} className="w-full aspect-[4/3] object-cover" />
      ) : (
        <div className="w-full aspect-[4/3] bg-gray-100" />
      )}
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-2">{project.title}</h3>
        <div className="flex gap-1 flex-wrap">
          {(project.tags ?? []).map(t => (
            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{t}</span>
          ))}
        </div>
      </div>
    </Link>
  )
}
