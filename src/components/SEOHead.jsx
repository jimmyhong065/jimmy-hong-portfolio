import { Helmet } from 'react-helmet-async'

export default function SEOHead({ title, description, ogImage, favicon }) {
  const siteTitle = title ? `${title} | Jimmy Hong` : 'Jimmy Hong — QA Engineer'
  const metaDesc = description ?? '專注測試流程設計與品質架構的 QA Engineer。'

  return (
    <Helmet>
      <title>{siteTitle}</title>
      <meta name="description" content={metaDesc} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={metaDesc} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:type" content="website" />
      {favicon && <link rel="icon" type="image/svg+xml" href={favicon} />}
      <link rel="alternate" type="application/rss+xml" title="Jimmy Hong | QA Blog" href="/rss.xml" />
    </Helmet>
  )
}
