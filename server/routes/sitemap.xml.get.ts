/**
 * Sitemap for the pages that should actually be indexed.
 *
 * `robots.txt` advertised this path before it existed, which pointed every
 * crawler that read it at a 404. It also hard-coded `localhost`, so the URL was
 * wrong in every deployment — the host now comes from `NUXT_PUBLIC_APP_URL`.
 *
 * Only public marketing pages are listed. Everything behind the session cookie
 * carries `robots: noindex` and is excluded in `robots.txt`; listing it here
 * would contradict both.
 */
const PUBLIC_PATHS = [
  { path: '/', changefreq: 'weekly', priority: '1.0' }
]

export default defineEventHandler((event) => {
  const base = useRuntimeConfig().public.appUrl.replace(/\/+$/, '')
  const lastmod = new Date().toISOString().slice(0, 10)

  const urls = PUBLIC_PATHS.map(entry => `  <url>
    <loc>${base}${entry.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'public, max-age=3600')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
})
