/**
 * Served from a route rather than `public/`, so the sitemap URL can carry the
 * real host. The static file hard-coded `localhost`, which is wrong everywhere
 * except a developer's machine.
 */
const DISALLOW = [
  '/dashboard',
  '/login',
  '/register',
  '/verify-email',
  '/two-factor',
  '/forgot-password',
  '/reset-password',
  '/api/'
]

export default defineEventHandler((event) => {
  const base = useRuntimeConfig().public.appUrl.replace(/\/+$/, '')

  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')

  return [
    'User-agent: *',
    'Allow: /',
    ...DISALLOW.map(path => `Disallow: ${path}`),
    '',
    `Sitemap: ${base}/sitemap.xml`,
    ''
  ].join('\n')
})
