import { Helmet } from 'react-helmet-async'

export default function SEOHead({ title, description, ogImage }) {
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
    </Helmet>
  )
}
