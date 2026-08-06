# Cadence — Nuxt 4 dashboard template

A production-ready dashboard template built with **Nuxt 4**, **Nuxt UI v4** and **Tailwind CSS v4**.
Ships with a marketing site, a complete authentication flow, and a six-page dashboard —
all mobile-first, keyboard accessible, translated into four languages, and themed from a
single CSS file.

The demo product is *Cadence*, a revenue-reporting tool for subscription businesses.
The domain is fictional; every page is built to be rebranded and rewired.

---

## What's included

**Marketing**

- `/` — hero, capabilities, how-it-works, testimonial, pricing, FAQ, closing CTA

**Authentication**

- `/login` — email + password, show/hide, remember me, redirect-back, demo credentials
- `/register` — sign-up with a live password strength meter
- `/verify-email` — confirmation from an emailed link; four states in one page
- `/two-factor` — six-digit challenge with auto-submit, resend cooldown and attempt limits
- `/forgot-password` — request a reset link, with a distinct success screen
- `/reset-password` — set a new password from a single-use token

**Dashboard**

- `/dashboard` — KPI cards, the MRR movement breakdown, revenue trend, activity feed, invoices
- `/dashboard/analytics` — date-range switching, area / grouped-bar / donut charts, channels, cohort retention
- `/dashboard/subscribers` — server-driven table: search, filter, sort, paginate, multi-select, CSV export, detail slideover
- `/dashboard/settings` — profile, account and password, notifications, billing, team members

**Developer reference** — six pages documenting the template itself

- `/dashboard/forms` — every form control, plus a fully validated example form
- `/dashboard/layouts` — 21 grid patterns, each showing the exact classes that produce it
- `/dashboard/icons` — searchable index of both bundled icon sets, with sizing and a11y rules
- `/dashboard/overlays` — modals, slideovers, drawers, popovers, menus and toasts, all live
- `/dashboard/wizard` — a four-step flow with per-step validation and an editable review
- `/dashboard/table` — `UTable` with sorting, selection, expansion and column visibility
- `/dashboard/navigation` — a three-level nested sidebar tree, live in the sidebar too

**Everywhere**

- Four languages — English, Bahasa Indonesia, 简体中文, 繁體中文 — switchable live, with no reload
- Light and dark themes with no flash on load
- Skeletons, empty states, error states and toasts on every async surface
- `404` / `500` pages that explain what happened and offer a way forward
- Charts written as plain SVG components — no charting dependency

---

## Requirements

- Node.js 20.19+ or 22.12+
- npm, pnpm, yarn or bun

## Getting started

```bash
npm install
cp .env.example .env      # then set NUXT_SESSION_PASSWORD
npm run db:migrate        # creates .data/cadence.db
npm run db:seed           # 148 subscribers, 24 months of history
npm run dev
```

Open <http://localhost:3000>.

Sign in with the demo account:

| Email | Password |
| --- | --- |
| `demo@cadence.app` | `Cadence2026` |

Both are shown on the sign-in page while `NUXT_PUBLIC_DEMO_MODE` is `true`. Set it to
`false` to hide that panel.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build into `.output/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `vue-tsc` across app and server |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run i18n:check` | Compares every locale file against `en.json` |
| `npm run db:migrate` | Applies pending migrations |
| `npm run db:seed` | Loads the demo dataset (idempotent) |
| `npm run db:generate` | Generates a migration from schema changes |
| `npm run db:studio` | Opens Drizzle Studio |
| `npm run db:reset` | Deletes the database, migrates, reseeds |
| `npm run test` / `test:watch` | Vitest unit suite |
| `npm run verify` | Everything CI runs: lint, typecheck, locales, tests |

---

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `NUXT_SESSION_PASSWORD` | **In production** | Seals the session cookie. Must be ≥ 32 characters. Generate with `openssl rand -base64 32`. |
| `NUXT_APP_URL` | For reset emails | Absolute origin used to build password-reset links. |
| `DATABASE_URL` | No | libsql connection string. Defaults to `file:./.data/cadence.db`. |
| `DATABASE_AUTH_TOKEN` | For Turso | Auth token when `DATABASE_URL` points at a hosted database. |
| `NUXT_PUBLIC_DEMO_MODE` | No | Shows the demo credentials on the sign-in page. Default `true`. |

In development a fallback session secret is used so the template runs with no setup.
**In production the server refuses to start an auth request without a real one** — it returns
a 500 rather than silently sealing sessions with a public key.

---

## Rebranding

### Colours, radius and fonts

Everything visual comes from `app/assets/css/main.css`. Replace the eleven `--color-cobalt-*`
shades with your own scale and every button, chart, badge and focus ring follows. Define all
eleven — Nuxt UI picks different shades for light and dark, so a partial scale breaks contrast.

```css
@theme static {
  --color-cobalt-500: #2d5bff;   /* …and 50 through 950 */

  --font-display: 'Your Display Face', sans-serif;
  --font-sans:    'Your Body Face', sans-serif;
  --font-mono:    'Your Mono Face', monospace;
}

:root {
  --ui-radius: 0.5rem;           /* corner radius, everywhere */
  --ui-container: var(--container-6xl);
}
```

If you rename the colour, update `app.config.ts` to match:

```ts
export default defineAppConfig({
  ui: { colors: { primary: 'cobalt', neutral: 'slate' } }
})
```

The four revenue-movement colours (`--cadence-new`, `--cadence-expansion`,
`--cadence-contraction`, `--cadence-churn`) are semantic. They are used by the waterfall, the
bar chart and the activity feed so the same concept keeps the same colour across the app.

### Languages

Translations live in `i18n/locales/*.json`. `en.json` is the source of truth; anything missing
from another file falls back to the English sentence rather than showing a raw key.

To add a language:

1. Copy `i18n/locales/en.json` to `i18n/locales/<code>.json` and translate the values.
2. Add the locale to `i18n.locales` in `nuxt.config.ts`.
3. Map it to a Nuxt UI locale in `app/app.vue` so the component internals — pagination,
   calendar, "clear" — follow too.
4. Add its `Intl` tag to `INTL_TAGS` in `shared/format.ts`.
5. Run `npm run i18n:check`.

Three things worth knowing:

- **The server never formats display text.** Metric labels, activity sentences and relative
  times are assembled on the client from keys and timestamps. That is what lets the language
  switch without refetching, and it is why every API response carries `generatedAt` — relative
  times are measured from that fixed moment so SSR and hydration cannot disagree.
- **`@` must be escaped in messages.** vue-i18n reads `@` as the start of a linked message, so
  an email address in placeholder copy is written `you{'@'}company.com`.
- **Currency is not a locale setting.** What you bill in is a property of the business, so
  `CURRENCY` in `shared/format.ts` stays fixed while the number formatting follows the reader.
  Expect `$86,945` in English and `US$86.945` in Indonesian — `Intl` disambiguates the dollar
  sign for readers whose region uses a different one.

Routing uses the `no_prefix` strategy: one canonical URL set, with the choice stored in a
cookie. Nothing has to remember to localise a link, which is the failure mode that produces
half-translated apps. If you want per-language URLs for marketing SEO, set
`strategy: 'prefix_except_default'` in `nuxt.config.ts` and replace every `to="/…"` with
`:to="localePath('/…')"`.

### Fonts

Fonts are self-hosted through `@fontsource`, so there are no third-party requests at runtime.
Swap the packages in `package.json`, update the imports in `nuxt.config.ts`, then point
`--font-*` at the new family names.

### Name and copy

The product name lives in `app.name` in each `i18n/locales/*.json`, plus
`app/components/AppLogo.vue` and `public/robots.txt`. All other copy is in the locale files —
there are no hard-coded sentences in the pages, apart from the two developer reference pages
noted below. The logo mark is inline SVG, so there are no image assets to regenerate.

**Not translated:** the six reference pages are developer documentation for whoever buys the
template, so their prose stays in English — only the sidebar entries that lead to them are
translated. They sit in their own sidebar group under a "Reference" separator, so removing them
is one obvious edit: delete `app/pages/dashboard/{forms,layouts,icons,overlays,wizard,table}.vue`,
their components (`app/components/{forms,grid,icons,overlays,wizard,table}/`),
`server/api/icons.get.ts`, and the `reference` array in `app/layouts/dashboard.vue`.

---

## The database

**SQLite via Drizzle**, over the `libsql` driver. Real tables, real migrations, real
persistence — a session, a pending two-step code and a verification token all survive a restart.

```
app/pages, app/components     never call an API directly
  └── app/composables         useAuth, useApiFetch — the only callers
        └── server/api/*      validate input, check the session
              └── server/utils/db.ts        every query lives here
                    └── server/database/    schema, client, migrations, seed
```

`server/utils/db.ts` is the only file that issues a query. The API routes call nothing else, so
moving to Postgres means changing the dialect in `server/database/{client,schema}.ts` and the
queries in that one file — no page, component or composable is affected.

### Why libsql

It ships prebuilt, so `npm install` needs no compiler — unlike `better-sqlite3`, which fails on
any machine without build tools. And the same driver talks to a local file *or* to Turso, so
going from a file to a hosted database is one environment variable:

```bash
DATABASE_URL=libsql://your-db.turso.io
DATABASE_AUTH_TOKEN=…
```

### Filtering happens in SQL

The subscribers list runs two queries per request — one for the page, one for the totals — with
`WHERE`, `ORDER BY` and `LIMIT` done by the database. Aggregates for the metrics pipeline are
`SUM` and `GROUP BY`, not JavaScript over an array. That is the point of having a database: the
work does not grow with the row count.

### Migrations

`npm run db:migrate` applies them; `npm run db:generate` creates a new one after a schema
change. In development a Nitro plugin runs pending migrations on boot, so a fresh clone works
with no database step. In production it does **not** — migrations are a deploy step, so a
rollout that fails halfway cannot leave a half-migrated schema behind a live process.

### The seed

`server/database/seed.ts` builds the demo dataset from a fixed-seed PRNG, so the figures are
identical on every machine and in every screenshot. It clears the tables it owns first, so
running it twice does not double the data. Delete the file once you have real data — nothing
else imports it.

### Still to wire up

- Send real email where `server/api/auth/{forgot-password,resend-verification}.post.ts` and
  `login.post.ts` currently log the link or code to the console.
- Move the rate limiter in `server/utils/ratelimit.ts` off process memory if you run more than
  one instance.
- Turn on SQLite foreign keys (`PRAGMA foreign_keys = ON`) or move to a database that enforces
  them by default — the schema declares the relationships, but SQLite ignores them unless asked.

### Other integration points

| What | Where |
| --- | --- |
| Password hashing | `server/utils/password.ts` — swap `scrypt` if your platform lacks `node:crypto` |
| Session storage | `server/utils/session.ts` — sealed cookies via `h3`'s `useSession` |
| Rate limiting | `server/utils/ratelimit.ts` — in-process; move to Redis behind a load balancer |
| Social sign-in | Buttons on `/login` are disabled placeholders; add an OAuth handler and enable them |
| Billing | `app/components/settings/SettingsBilling.vue` is presentational; shapes match Stripe's objects |

---

## The auth flows

Six pages, and two of them change how signing in works — so it is worth knowing the shape.

### Two-step verification

A correct password is **not** a session when two-step is on. The server writes a *challenge*
under a different session key (`pendingUserId`, never `userId`), so every existing
authorisation check keeps rejecting the request until the second factor lands. That is the
whole security property, and it is the one worth keeping if you rewrite this:

```
POST /api/auth/login          → { requiresTwoFactor: true, user: null }   ← nothing granted
POST /api/auth/two-factor/verify → promotes the challenge into a real session
```

Codes are six digits from `randomInt`, single-use, ten-minute lifetime, one live code per
account, and five wrong guesses end the whole attempt rather than just the code — otherwise an
attacker simply asks for another and keeps going. Turn it on from **Settings → Account**, which
re-asks for the password because a stolen session must not be able to weaken the account.

### Email verification

A fresh sign-up is created **unverified but signed in**. Blocking the product until someone
finds an email loses more sign-ups than it protects, so `/verify-email` offers "continue to the
dashboard" alongside the resend. Verification runs on the client only — a link in an email is
often fetched by a scanner before a person opens it, and doing this during SSR would let a
preview bot burn a single-use token.

In development both flows print their code or link to the server console and surface it in the
page, the same way `/forgot-password` does, so the whole thing is walkable with no mail
provider.

---

## Security notes

What the template already does:

- Sessions are sealed and signed, `HttpOnly`, `SameSite=Lax`, and `Secure` outside development
- Passwords are hashed with `scrypt` and compared in constant time
- Sign-in returns one message for both unknown accounts and wrong passwords, so the endpoint
  cannot be used to discover which emails are registered
- Password reset says the same thing whether or not the address exists; tokens are single-use
  and expire after 30 minutes
- Auth endpoints are rate limited per IP, with resend limited harder than verify
- A pending two-step challenge is stored under a different key from a real session, so it can
  never be mistaken for one
- Two-step codes and verification tokens are single-use and time-limited; changing a security
  setting re-asks for the password
- The `redirect` query parameter on `/login` only accepts same-origin paths
- Every request body and query string is validated with Zod before it reaches any logic

What you must still do before shipping:

- Set a real `NUXT_SESSION_PASSWORD`
- Move rate limiting to shared storage if you run more than one instance
- Add CSRF protection if you introduce cookie-authenticated form posts from other origins
- Replace the in-memory store, which loses every account on restart

---

## Project structure

```
app/
  assets/css/main.css      design tokens — start here to rebrand
  components/
    charts/                AreaChart, BarChart, DonutChart, Sparkline, ChartFrame
    forms/                 form reference, split by control family
    grid/                  layout reference, split by column count
    icons/                 icon reference — browser, usage rules, in-context
    overlays/              modal, slideover, drawer, popover and toast reference
    wizard/                multi-step form reference
    table/                 UTable reference
    ReferenceShell.vue     shared chrome for all six reference pages
    ReferenceRow.vue       one labelled example row
    marketing/             site header and footer
    settings/              one component per settings tab
    PanelSection.vue       titled card with an optional footer — used by both
    MrrWaterfall.vue       the signature revenue-movement bar
  composables/
    useAuth.ts             the only place the app calls /api/auth
    useFormat.ts           formatters bound to the active locale
    useApiFetch.ts         useFetch that forwards cookies during SSR
    useApiError.ts         turns thrown errors into readable messages
  layouts/                 default (marketing), auth (split screen), dashboard
  middleware/              auth, guest
  pages/
  plugins/session.ts       loads the session once during SSR
  utils/chart.ts           tick scaling and monotone curve maths
server/
  api/                     auth, metrics, subscribers, settings
  utils/                   db, metrics, password, session, ratelimit
i18n/
  i18n.config.ts           vue-i18n options (fallback locale)
  locales/                 en, id, zh-Hans, zh-Hant
scripts/check-locales.mjs  locale parity + placeholder check
shared/                    types, Zod schemas and formatters used by both sides
```

### Building a form

`/dashboard/forms` is the reference. Every control there is live and styled by the same
tokens as the rest of the app, so copying a row and changing its label gives you a field that
already matches.

Forms follow one pattern throughout the template:

```vue
<UForm :schema="schema" :state="state" @submit="onSubmit">
  <UFormField label="Work email" name="email" required>
    <UInput v-model="state.email" class="w-full" />
  </UFormField>
</UForm>
```

`UForm` matches each Zod issue to the `UFormField` whose `name` it belongs to, so error
messages land on the right field without any wiring. Put the schema in `shared/schemas.ts`
whenever the form posts to the server — the route then validates the body with the same rules.

One caveat worth knowing: `@internationalized/date` values are class instances, and Vue's deep
`reactive()` rewrites them into plain objects. Hold form state containing a date in
`shallowReactive()` instead, as `FormsExample.vue` does.

### Building a page

`/dashboard/layouts` is the layout reference. Every example is live at the width you read it
and shows the classes that produce it, so a new page can be assembled by copying rows.

The shape almost every dashboard page uses:

```vue
<UDashboardPanel id="your-page">
  <template #header>
    <UDashboardNavbar title="Your page">
      <template #leading><UDashboardSidebarCollapse /></template>
    </UDashboardNavbar>
  </template>

  <template #body>
    <div class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">…</div>
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">…</div>
    </div>
  </template>
</UDashboardPanel>
```

Each row is its own grid rather than one grid describing the whole page — easier to change, and
each row can pick the breakpoint that suits its content.

Two things worth knowing:

- `minmax(0,1fr)` rather than plain `1fr`. A grid track's default minimum is `auto`, so one wide
  chart or one long unbroken string will push a column past its share. `minmax(0,…)` prevents it.
- `sm:` and `lg:` are **viewport** media queries. Collapsing the sidebar changes the panel width
  but not the breakpoint. When a component needs to respond to the space it actually occupies,
  mark its parent `@container` and use `@md:` / `@2xl:` instead — the last example on the layouts
  page is a container you can drag to see the difference.

### Two tables, on purpose

`/dashboard/subscribers` hand-builds its table markup; `/dashboard/table` uses `UTable`. That is
not an inconsistency — it is the trade-off, kept visible:

- **Hand-built** reflows into a stacked card list below `lg`, so a phone never scrolls sideways.
  Use it for anything customer-facing. You write sorting and pagination yourself.
- **`UTable`** gives sorting, selection, expansion and column visibility from a column array, but
  a `<table>` cannot reflow — small screens scroll. Use it for internal tools and wide datasets.

The deciding question is whether a customer will open it on a phone. `/dashboard/table` lays the
comparison out in full.

### Why the charts are hand-written

Every chart is a small SVG component with no runtime dependency. They inherit the theme through
CSS variables, respect `prefers-reduced-motion`, expose an `aria-label` summary, and the area
chart is keyboard navigable with the arrow keys. Adding a charting library means adding a second
theming system to keep in sync; these are a few hundred lines you own outright.

They draw in real pixels using a `ResizeObserver`, so a gridline is exactly 1px and an axis
label exactly 10px at any width. That means they render on the client only — `ChartFrame`
reserves their height during SSR so nothing shifts when they appear.

---

## Accessibility

- Every interactive element has a visible `:focus-visible` ring
- Charts carry text summaries; the area chart supports arrow keys, Home, End and Escape
- Sortable table headers expose `aria-sort` and are real buttons
- Movement direction is encoded by a hatch pattern as well as colour
- Motion is disabled under `prefers-reduced-motion`
- `<html lang>` and `dir` follow the active language, so screen readers announce it correctly
- The subscribers table becomes a stacked card list on small screens rather than scrolling sideways

---

## Tests and CI

`npm run test` runs a Vitest suite over the pure modules — formatters, Zod schemas, chart
maths, password hashing and the metric aggregation. It finishes in under half a second, which
is the point: a suite nobody minds running is a suite that actually runs.

What it locks down, rather than what it merely covers:

- **The waterfall reconciles.** `opening + new + expansion − contraction − churn === closing`,
  and the headline MRR equals the plan-mix total, the end of the trend series, and the sum of
  the subscriber rows. Four figures that must agree, asserted to agree.
- **`formatRelative` never reads the clock.** It takes `now` as an argument, which is what stops
  SSR and hydration disagreeing on "3 hours ago".
- **Locale formatting really reaches `Intl`.** `86.945` for Indonesian, `86,945` for English —
  if the locale stopped being passed, both would say the same thing and nothing else would fail.
- **`monotonePath` cannot overshoot.** A plain cubic would dip below values the data never
  reached, which on a revenue chart means inventing revenue.
- **`verifyPassword` returns false rather than throwing** on a malformed stored hash, so one
  corrupt row cannot 500 the sign-in route.
- **Schemas emit translation keys**, not English prose.

`.github/workflows/ci.yml` runs `lint`, `typecheck`, `i18n:check`, `test` and a production
build on every push and pull request. `npm run verify` runs the same gate locally.

Rendering and flows are checked by hand rather than in the suite — a screenshot makes a better
assertion about a chart than any DOM query, and adding `@nuxt/test-utils` would triple the
install for worse tests.

## Deployment

`npm run build` produces a Node server in `.output/`:

```bash
NUXT_SESSION_PASSWORD=… node .output/server/index.mjs
```

Nitro also targets Vercel, Netlify, Cloudflare and others — see the
[Nuxt deployment docs](https://nuxt.com/docs/getting-started/deployment). On an edge runtime,
replace `server/utils/password.ts`, which uses `node:crypto`.

---

## License

The template code is yours to use under the terms of your purchase.
Third-party licenses: Nuxt (MIT), Nuxt UI (MIT), Tailwind CSS (MIT), Lucide icons (ISC),
IBM Plex (OFL), Bricolage Grotesque (OFL).
