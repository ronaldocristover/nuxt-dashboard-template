# Cadence — Nuxt 4 dashboard template

A production-ready dashboard template built with **Nuxt 4**, **Nuxt UI v4** and **Tailwind CSS v4**.
Ships with a marketing site, a complete authentication flow, and a four-page dashboard —
all mobile-first, keyboard accessible, and themed from a single CSS file.

The demo product is *Cadence*, a revenue-reporting tool for subscription businesses.
The domain is fictional; every page is built to be rebranded and rewired.

---

## What's included

**Marketing**

- `/` — hero, capabilities, how-it-works, testimonial, pricing, FAQ, closing CTA

**Authentication**

- `/login` — email + password, show/hide, remember me, redirect-back, demo credentials
- `/register` — sign-up with a live password strength meter
- `/forgot-password` — request a reset link, with a distinct success screen
- `/reset-password` — set a new password from a single-use token

**Dashboard**

- `/dashboard` — KPI cards, the MRR movement breakdown, revenue trend, activity feed, invoices
- `/dashboard/analytics` — date-range switching, area / grouped-bar / donut charts, channels, cohort retention
- `/dashboard/subscribers` — server-driven table: search, filter, sort, paginate, multi-select, CSV export, detail slideover
- `/dashboard/forms` — a live reference for every form control, plus a fully validated example form
- `/dashboard/settings` — profile, account and password, notifications, billing, team members

**Everywhere**

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

---

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `NUXT_SESSION_PASSWORD` | **In production** | Seals the session cookie. Must be ≥ 32 characters. Generate with `openssl rand -base64 32`. |
| `NUXT_APP_URL` | For reset emails | Absolute origin used to build password-reset links. |
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

### Fonts

Fonts are self-hosted through `@fontsource`, so there are no third-party requests at runtime.
Swap the packages in `package.json`, update the imports in `nuxt.config.ts`, then point
`--font-*` at the new family names.

### Name and copy

The product name appears in `app/components/AppLogo.vue`, `app/app.vue` (title template),
`app/pages/index.vue`, and `public/robots.txt`. The logo mark is inline SVG — no image assets
to regenerate.

---

## Connecting a real backend

The demo runs on an in-memory store. It resets on restart, which is intentional for a demo and
unsuitable for anything else.

**One file holds all of it: `server/utils/db.ts`.** Keep the method signatures, change the
bodies, and no page, component or composable needs to be touched.

```
app/pages, app/components     never call an API directly
  └── app/composables         useAuth, useApiFetch — the only callers
        └── server/api/*      validate input, check the session
              └── server/utils/db.ts   ← replace this
```

Types in `shared/types.ts` describe the API contract; Zod schemas in `shared/schemas.ts` are
used by the form on the client **and** the route on the server, so validation rules cannot
drift apart.

### A typical migration

1. Add your database client (Drizzle, Prisma, Mongo — anything).
2. Rewrite the methods in `server/utils/db.ts` to read and write real rows.
3. Replace the aggregation in `server/utils/metrics.ts` with your own queries.
4. Send real email where `server/api/auth/forgot-password.post.ts` currently logs the reset link.
5. Delete the seed helpers at the top of `db.ts`.

### Other integration points

| What | Where |
| --- | --- |
| Password hashing | `server/utils/password.ts` — swap `scrypt` if your platform lacks `node:crypto` |
| Session storage | `server/utils/session.ts` — sealed cookies via `h3`'s `useSession` |
| Rate limiting | `server/utils/ratelimit.ts` — in-process; move to Redis behind a load balancer |
| Social sign-in | Buttons on `/login` are disabled placeholders; add an OAuth handler and enable them |
| Billing | `app/components/settings/SettingsBilling.vue` is presentational; shapes match Stripe's objects |

---

## Security notes

What the template already does:

- Sessions are sealed and signed, `HttpOnly`, `SameSite=Lax`, and `Secure` outside development
- Passwords are hashed with `scrypt` and compared in constant time
- Sign-in returns one message for both unknown accounts and wrong passwords, so the endpoint
  cannot be used to discover which emails are registered
- Password reset says the same thing whether or not the address exists; tokens are single-use
  and expire after 30 minutes
- Auth endpoints are rate limited per IP
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
    forms/                 the form reference page, split by control family
    marketing/             site header and footer
    settings/              one component per settings tab
    PanelSection.vue       titled card with an optional footer — used by both
    MrrWaterfall.vue       the signature revenue-movement bar
  composables/
    useAuth.ts             the only place the app calls /api/auth
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
- The subscribers table becomes a stacked card list on small screens rather than scrolling sideways

---

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
