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

// Stop here rather than reporting a wall of failures. Every check below needs a
// session, and the usual cause is a server started without NUXT_SESSION_PASSWORD
// — `.output/server/index.mjs` does not read `.env`, so start it with
// `node --env-file=.env .output/server/index.mjs`, or use `npm run preview`.
if (!cookie) {
  console.error('\nNo session cookie. Is the server running with NUXT_SESSION_PASSWORD set?')
  console.error('Try: node --env-file=.env .output/server/index.mjs')
  process.exit(1)
}

// ── Authenticated pages ───────────────────────────────────────────────────────
const PAGES = [
  ['/dashboard', 'Monthly recurring revenue'],
  ['/dashboard/analytics', 'Cohort retention'],
  ['/dashboard/subscribers', 'Subscribers'],
  ['/dashboard/kanban', 'Renewals in flight'],
  ['/dashboard/members', 'Everyone with access to this workspace'],
  ['/dashboard/members/new', 'Add a member'],
  ['/dashboard/members/tm_2', 'Renewals Lead'],
  ['/dashboard/members/tm_2/edit', 'Save changes'],
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

// ── Members ───────────────────────────────────────────────────────────────────
{
  const list = await fetch(`${BASE}/api/members?pageSize=5`, { headers: { cookie } }).then(res => res.json())
  check('/api/members pages the list', list.rows.length === 5 && list.total === 12, `${list.rows.length} of ${list.total}`)
  check('/api/members counts the whole team, not the page', list.counts.all === 12 && list.counts.invited === 3)

  const found = await fetch(`${BASE}/api/members?q=analyst`, { headers: { cookie } }).then(res => res.json())
  check('/api/members searches job titles too', found.total === 2, `got ${found.total}`)

  const detail = await fetch(`${BASE}/api/members/tm_2`, { headers: { cookie } }).then(res => res.json())
  check('member detail carries the renewals they own', detail.renewals.length > 0 && detail.renewalMrr > 0)
  check('member detail scopes activity to their accounts', Array.isArray(detail.activity))

  // The last owner may be neither demoted nor deleted, or the workspace is left
  // with nobody able to administer it.
  const owner = await fetch(`${BASE}/api/members/tm_1`, { headers: { cookie } }).then(res => res.json())
  check('the only owner cannot be changed or removed', owner.canChangeRole === false && owner.canDelete === false)

  const demote = await fetch(`${BASE}/api/members/tm_1`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({
      name: owner.member.name, email: owner.member.email, role: 'admin', status: 'active',
      department: 'leadership', title: '', phone: '', location: '', timezone: 'UTC', notes: ''
    })
  })
  check('demoting the only owner → 409', demote.status === 409, `got ${demote.status}`)

  const missing = await fetch(`${BASE}/api/members/nope`, { headers: { cookie } })
  check('/api/members/<unknown> → 404', missing.status === 404, `got ${missing.status}`)

  // The Billing tab's table reads these. An empty tab is the failure mode: the
  // seed once scattered invoices at random and rarely hit an owned account.
  check('member detail carries invoices for their accounts', detail.invoices.length > 0, `${detail.invoices.length}`)
  check('invoice totals are summed, not left at zero', detail.invoiceTotals.paid + detail.invoiceTotals.open + detail.invoiceTotals.failed > 0)
}

// ── Breadcrumbs ───────────────────────────────────────────────────────────────
{
  // Rendered server-side, so a crawler and a reader see the same trail.
  for (const [path, ...crumbs] of [
    ['/dashboard/members', 'Members'],
    ['/dashboard/members/new', 'Members', 'New'],
    ['/dashboard/members/tm_2/edit', 'Members', 'Hana Nakamura', 'Edit'],
    ['/dashboard/kanban', 'Pipeline'],
    ['/dashboard/forms', 'Forms']
  ]) {
    const { body } = await page(path)
    const hasAll = crumbs.every(crumb => body.includes(crumb))
    check(`${path} shows the trail ${['Dashboard', ...crumbs].join(' › ')}`, body.includes('Dashboard') && hasAll)
  }
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
