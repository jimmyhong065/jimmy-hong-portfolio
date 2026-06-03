import { Helmet } from 'react-helmet-async'

const SITE_URL = 'https://jimmy-hong-portfolio.pages.dev'
export default function SEOHead({ title, description, keywords, ogImage, favicon, canonical, type = 'website', publishedAt, jsonLd }) {
  const siteTitle = title ? `${title} | Jimmy Hong` : 'Jimmy Hong — QA Engineer'
  const metaDesc = description ?? '專注測試流程設計與品質架構的 QA Engineer。'
  const image = ogImage ?? null
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : null

  return (
    <Helmet>
      <title>{siteTitle}</title>
      <meta name="description" content={metaDesc} />
      {keywords && <meta name="keywords" content={keywords} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:type" content={type} />
      {image && <meta property="og:image" content={image} />}
      {image && <meta property="og:image:width" content="1200" />}
      {image && <meta property="og:image:height" content="630" />}
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={metaDesc} />
      {image && <meta name="twitter:image" content={image} />}

      {/* Article metadata */}
      {type === 'article' && publishedAt && (
        <meta property="article:published_time" content={publishedAt} />
      )}

      {favicon && <link rel="icon" type="image/svg+xml" href={favicon} />}
      <link rel="alternate" type="application/rss+xml" title="Jimmy Hong | QA Blog" href="/rss.xml" />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  )
}
