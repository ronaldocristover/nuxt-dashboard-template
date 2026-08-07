# Changelog

Notable changes to the Cadence dashboard template. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For a template, "breaking" means a change you would have to reconcile by hand after
copying your own work over the top — a renamed environment variable, a moved file, a
changed database schema. Those are always called out.

## [Unreleased]

### Added

- **Email actually sends.** Five routes used to `console.info` a link or a code; they now
  go through `sendMail` in `server/utils/mail/send.ts`. Drivers: `console` (default, still
  prints, so a fresh clone has working auth flows), `resend` and `postmark` — both plain
  JSON over HTTPS, so neither adds a dependency. Messages are HTML *and* plain text, in the
  reader's own language, taken from the same `mail.*` keys the interface uses so
  `i18n:check` covers them. Expiry copy reads `TTL_MINUTES` from `server/utils/db.ts`, so
  "expires in 30 minutes" cannot drift from the code that enforces it. `sendMail` never
  throws: a provider outage must not turn "your account is created" into a 500.
- **Share previews.** `public/og.png` is a 1200×630 card built from the product's own
  waterfall chart, wired up as `og:image` / `twitter:image` with absolute URLs, plus
  `og:url`, a per-path `canonical`, and translated alt text. Regenerate with `npm run og`.
- **Screenshots.** `docs/screenshots/` holds ten images of the running application —
  light, dark and mobile — captured over the DevTools Protocol by `npm run shots`, so
  they cannot drift from what the template renders.
- **`LICENSE`** — a commercial template license, and this changelog.
- **`npm run smoke` now runs in CI**, against the production build.
- A test that catches Tailwind utilities which do not exist (see Fixed, below).

### Fixed

- **Chart axis labels were invisible in dark mode.** The hand-written charts labelled
  their axes with `class="fill-dimmed"`. Nuxt UI's semantic colours only exist as
  `text-*` utilities, so `fill-dimmed` generated no CSS at all and the SVG text fell
  back to its default black — which reads as deliberate grey on a light background and
  disappears on a dark one. Now `fill="currentColor"` with `class="text-dimmed"`.
  Nothing caught this: it typechecked, linted, passed every test and returned 200.
  Only a dark-mode screenshot showed it, so `test/styles.test.ts` now fails on any
  `fill-<semantic>` class and on any `<text>` without an explicit `fill`.

### Changed

- **Breaking: `NUXT_APP_URL` is now `NUXT_PUBLIC_APP_URL`.** The absolute origin moved
  into `runtimeConfig.public` because the head needs it — `og:image` and `canonical`
  must be absolute, and deriving them from the request host would let a forged `Host`
  header rewrite the canonical URL of every page. Rename the variable wherever you set
  it; nothing else changed.

## [1.0.0] — 2026-08-06

First release.

### Added

- **Marketing site** at `/` — hero, capabilities, proof, pricing and FAQ.
- **Authentication**: sign in, register, forgot password, reset password, verify email,
  and two-step verification. A correct password is not a session while two-step is
  pending — the challenge is held under a separate session key, so every authorisation
  check keeps rejecting until the second factor lands.
- **Dashboard**: overview with the MRR movement waterfall, analytics with cohort
  retention and channel mix, a server-driven subscribers table (search, filter, sort,
  paginate, multi-select, CSV export, detail slideover), and settings covering profile,
  password, notifications, billing and team members.
- **Renewal pipeline** at `/dashboard/kanban` — five stages, drag or keyboard to move a
  card, an editing slideover, and stages you can add, rename, collapse or delete.
  Position maths lives in `shared/board.ts` and runs unchanged on both sides: the client
  applies a move optimistically, the server applies the same function authoritatively.
- **Seven reference pages** documenting the template itself: forms, layouts, icons,
  overlays, wizard, table and navigation.
- **Four languages** — English, Bahasa Indonesia, 简体中文, 繁體中文 — switchable without a
  reload. The server sends keys, parts and timestamps; the client composes the text, so
  changing language never needs a refetch. `npm run i18n:check` gates locale parity.
- **SQLite via Drizzle ORM**, over libsql — point `DATABASE_URL` at Turso to go remote
  without touching a query. Filtering, sorting and paging happen in SQL, not in memory.
- **Hand-written SVG charts** — area, bar, donut and sparkline — with monotone cubic
  interpolation that cannot overshoot values the data never reached.
- **94 unit tests** over the pure modules, and `npm run smoke`, which asserts rendered
  page content rather than status codes.
- Dark mode, `prefers-reduced-motion`, visible focus rings, and a single CSS file
  (`app/assets/css/main.css`) that every colour, radius and typeface flows from.
