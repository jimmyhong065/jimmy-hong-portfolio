import { Link } from 'react-router-dom'

export default function ProjectCard({ project }) {
  return (
    <Link to={`/projects/${project.id}`} className="block border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {project.cover_url ? (
        <img src={project.cover_url} alt={project.title} loading="lazy" className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-gray-50 flex items-center justify-center text-gray-300 text-4xl">🗂</div>
      )}
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-1">{project.title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{project.description}</p>
        <div className="flex gap-1 flex-wrap">
          {(project.tags ?? []).map(tag => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{tag}</span>
          ))}
        </div>
      </div>
    </Link>
  )
}
