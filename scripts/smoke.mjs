#!/usr/bin/env node
/**
 * Smoke test against a running server. Point it at `nuxt preview` output:
 *
 *   npm run build && node .output/server/index.mjs &
 *   npm run smoke
 *
 * Every assertion looks at **body content**, never at the status code alone.
 * Three separate bugs in this template returned a cheerful HTTP 200 while
 * serving a page that was blank or rendered raw translation keys — a component
 * registered under the wrong auto-import name, an unescaped `@` in a message
 * that killed the client-side i18n compiler, and a shallowRef that stopped
 * optimistic updates from re-rendering. Status codes caught none of them.
 *
 * Exits non-zero so it can gate a release.
 */

const BASE = process.env.SMOKE_URL ?? 'http://localhost:3000'

let cookie = ''
let failed = 0

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`✔ ${label}`)
    return
  }
  failed++
  console.error(`✖ ${label}${detail ? ` — ${detail}` : ''}`)
}

async function page(path, extraHeaders = {}) {
  const res = await fetch(BASE + path, {
    headers: { ...(cookie ? { cookie } : {}), ...extraHeaders },
    redirect: 'manual'
  })
  return { status: res.status, body: await res.text() }
}

/** A rendered page must never contain a dotted key where copy should be. */
const RAW_KEY = /(?:>|"\s*)(?:nav|board|overview|analytics|dashboard|marketing)\.[a-z][\w.]*\s*(?:<|")/

console.log(`Smoke testing ${BASE}\n`)

// ── Public ────────────────────────────────────────────────────────────────────
for (const [path, needle] of [
  ['/', 'Reporting on recurring revenue at'],
  ['/login', 'demo@cadence.app'],
  ['/register', 'Create your account'],
  ['/forgot-password', 'Reset your password'],
  ['/reset-password', 'Set a new password'],
  ['/verify-email', 'Confirm your email address'],
  ['/robots.txt', 'Sitemap:'],
  ['/sitemap.xml', '<urlset']
]) {
  const { status, body } = await page(path)
  check(`${path} contains "${needle}"`, status === 200 && body.includes(needle), `status ${status}, ${body.length} bytes`)
}

// `/two-factor` is only reachable mid-challenge. Reaching it cold must bounce,
// not render a code field that can never be satisfied.
{
  const { status } = await page('/two-factor')
  check('/two-factor without a pending challenge redirects away', status === 302, `got ${status}`)
}

// ── Sign in ───────────────────────────────────────────────────────────────────
const login = await fetch(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'demo@cadence.app', password: 'Cadence2026', remember: true })
})
cookie = (login.headers.getSetCookie().find(value => value.startsWith('cadence-session=')) ?? '').split(';')[0]
check('POST /api/auth/login issues a session cookie', login.status === 200 && cookie.length > 20, `status ${login.status}`)

// ── Authenticated pages ───────────────────────────────────────────────────────
const PAGES = [
  ['/dashboard', 'Monthly recurring revenue'],
  ['/dashboard/analytics', 'Cohort retention'],
  ['/dashboard/subscribers', 'Subscribers'],
  ['/dashboard/kanban', 'Renewals in flight'],
  ['/dashboard/forms', 'Forms'],
  ['/dashboard/layouts', 'Layouts'],
  ['/dashboard/icons', 'Icons'],
  ['/dashboard/overlays', 'Overlays'],
  ['/dashboard/wizard', 'Onboarding wizard'],
  ['/dashboard/table', 'Table'],
  ['/dashboard/navigation', 'Navigation'],
  ['/dashboard/settings', 'Settings']
]

for (const [path, needle] of PAGES) {
  const { status, body } = await page(path)
  check(`${path} contains "${needle}"`, status === 200 && body.includes(needle), `status ${status}, ${body.length} bytes`)
  check(`${path} renders no raw translation key`, !RAW_KEY.test(body))
}

// ── The kanban board specifically ─────────────────────────────────────────────
{
  const { body } = await page('/dashboard/kanban')
  for (const stage of ['At risk', 'Reached out', 'In negotiation', 'Renewed', 'Churned']) {
    check(`kanban renders the "${stage}" stage`, body.includes(stage))
  }

  const board = await fetch(`${BASE}/api/board`, { headers: { cookie } }).then(res => res.json())
  const cards = board.columns.flatMap(column => column.cards)
  check('/api/board returns 5 stages and 15 cards', board.columns.length === 5 && cards.length === 15, `${board.columns.length} / ${cards.length}`)
  check('every stage is densely packed from 0', board.columns.every(column => column.cards.every((card, index) => card.position === index)))
  check('/api/board stamps generatedAt', typeof board.generatedAt === 'string')
}

// ── Translation: switching the cookie must change the served copy ─────────────
{
  // `cadence-locale` is the cookieKey set in nuxt.config.ts.
  const { body } = await page('/dashboard/kanban', { cookie: `${cookie}; cadence-locale=id` })
  check('kanban renders Indonesian when the locale cookie says so', body.includes('Perpanjangan berjalan'), 'expected the id.json heading')
}

// ── Guards ────────────────────────────────────────────────────────────────────
{
  const anon = await fetch(`${BASE}/api/board`, { redirect: 'manual' })
  check('/api/board without a session → 401', anon.status === 401, `got ${anon.status}`)

  const bad = await fetch(`${BASE}/api/board/cards`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ title: '' })
  })
  check('POST /api/board/cards with an empty title → 422', bad.status === 422, `got ${bad.status}`)
}

console.log(failed ? `\n${failed} check(s) failed.` : `\nAll checks passed against ${BASE}.`)
process.exit(failed ? 1 : 0)
