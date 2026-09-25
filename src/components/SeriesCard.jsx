import { Link } from 'react-router-dom'

export default function SeriesCard({ series }) {
  return (
    <Link
      to={`/course/${series.slug}`}
      className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-teal-300 hover:shadow-sm transition-all flex flex-col"
    >
      {series.cover_url && (
        <img src={series.cover_url} alt="" className="w-full aspect-[2/1] object-cover" loading="lazy" />
      )}
      <div className="p-5 flex flex-col flex-1">
        <span className="text-[10px] tracking-widest text-teal-700 bg-teal-50 border border-teal-100 rounded-full px-2.5 py-0.5 mb-3 w-fit">
          系列・{series.chapterCount} 篇
        </span>
        <h3 className="text-sm font-semibold text-gray-900 mb-2 leading-snug group-hover:text-teal-700 transition-colors">
          {series.title}
        </h3>
        {(series.subtitle || series.description) && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1">{series.subtitle || series.description}</p>
        )}
        <span className="text-xs text-teal-600 mt-4">看整個系列 →</span>
      </div>
    </Link>
  )
}
