import { Helmet } from 'react-helmet-async'
import { SITE_URL } from '../config/site.js'

/**
 * Per-page <title>/meta/OG/canonical tags. Every route sharing index.html's
 * static title otherwise means search engines and link previews can't tell
 * one vendor or category page from another - see docs on SEO scope for why
 * this is CSR-only (react-helmet-async, no SSR/prerendering).
 */
export default function SeoHead({ title, description, path, image, jsonLd }) {
  const url = `${SITE_URL}${path}`
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  )
}
