import { Helmet } from 'react-helmet-async'

const SITE_URL = 'https://jimmy-hong-portfolio.pages.dev'
const DEFAULT_OG_IMAGE = `${SITE_URL}/avatar.jpg`

export default function SEOHead({ title, description, keywords, ogImage, favicon, canonical, type = 'website', publishedAt }) {
  const siteTitle = title ? `${title} | Jimmy Hong` : 'Jimmy Hong — QA Engineer'
  const metaDesc = description ?? '專注測試流程設計與品質架構的 QA Engineer。'
  const image = ogImage ?? DEFAULT_OG_IMAGE
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
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content={image} />

      {/* Article metadata */}
      {type === 'article' && publishedAt && (
        <meta property="article:published_time" content={publishedAt} />
      )}

      {favicon && <link rel="icon" type="image/svg+xml" href={favicon} />}
      <link rel="alternate" type="application/rss+xml" title="Jimmy Hong | QA Blog" href="/rss.xml" />
    </Helmet>
  )
}
