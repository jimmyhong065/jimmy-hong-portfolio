import Nav from '../components/Nav'
import Footer from '../components/Footer'
import SEOHead from '../components/SEOHead'
import SeriesCard from '../components/SeriesCard'
import { useSeries } from '../hooks/useSeries'

export default function Series() {
  const { series, loading } = useSeries()

  return (
    <>
      <SEOHead title="系列" description="QA Lens 的主題系列文章：一個主題從頭讀到尾。" canonical="/series" />
      <Nav />
      <main className="max-w-5xl mx-auto px-4 md:px-12 py-16">
        <p className="text-xs tracking-widest text-gray-400 uppercase mb-2">Series</p>
        <h1 className="text-xl font-bold mb-8">系列</h1>
        {loading ? null : series.length === 0 ? (
          <p className="text-sm text-gray-400">還沒有上線的系列。</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {series.map(s => <SeriesCard key={s.id} series={s} />)}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
