import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { hashPassword } from '../utils/password'
import { ensureDatabaseDirectory } from './paths'
import * as schema from './schema'

/**
 * Seeds the demo dataset.
 *
 * Run with `npm run db:seed`. Idempotent: it clears the tables it owns first,
 * so running it twice does not double the data.
 *
 * Every number comes from a fixed-seed PRNG, so the dashboard shows the same
 * figures on every machine and in every screenshot. That matters for a template
 * — a demo whose numbers move looks broken.
 *
 * Delete this file once you have real data. Nothing else imports it.
 */

const DEMO_EMAIL = 'demo@cadence.app'
const DEMO_PASSWORD = 'Cadence2026'

/** Mulberry32. Small, fast, and seeded — same data every run. */
function prng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = prng(20260806)
const pick = <T>(items: readonly T[]): T => items[Math.floor(rand() * items.length)]!
const between = (min: number, max: number) => min + rand() * (max - min)
const intBetween = (min: number, max: number) => Math.floor(between(min, max + 1))

const FIRST_NAMES = [
  'Amara', 'Bennet', 'Citra', 'Dara', 'Elias', 'Farah', 'Gideon', 'Hana',
  'Ilya', 'Jonas', 'Kiran', 'Lena', 'Mateo', 'Nadia', 'Osman', 'Priya',
  'Quinn', 'Rafael', 'Sasha', 'Tobias', 'Ugo', 'Vera', 'Wren', 'Ximena',
  'Yusuf', 'Zara', 'Anton', 'Bianca', 'Cyrus', 'Delphine'
] as const

const LAST_NAMES = [
  'Adeyemi', 'Bergström', 'Costa', 'Dubois', 'Eriksen', 'Fontaine', 'Gallo',
  'Halvorsen', 'Ibrahim', 'Jansen', 'Kovač', 'Lindqvist', 'Moreau', 'Nakamura',
  'Okonkwo', 'Petrov', 'Quintero', 'Rossi', 'Salvatierra', 'Tanaka',
  'Ueda', 'Volkov', 'Wijaya', 'Xu', 'Yilmaz', 'Zieliński'
] as const

const COMPANY_HEADS = [
  'Northwind', 'Lumen', 'Basalt', 'Verdant', 'Kestrel', 'Halcyon', 'Ironwood',
  'Meridian', 'Cobalt', 'Solstice', 'Thistle', 'Aperture', 'Bellweather',
  'Cinder', 'Driftwood', 'Everline', 'Foundry', 'Glasshouse', 'Harborview',
  'Inkwell', 'Juniper', 'Keystone', 'Lantern', 'Mosswood', 'Nightjar',
  'Orchard', 'Pallas', 'Quarry', 'Riverbend', 'Sandpiper'
] as const

const COMPANY_TAILS = ['Labs', 'Studio', 'Group', 'Systems', 'Collective', 'Works', 'Partners', 'Digital'] as const
const COUNTRIES = ['Indonesia', 'Singapore', 'United States', 'Germany', 'Japan', 'Brazil', 'Nigeria', 'Netherlands', 'Australia', 'Canada'] as const
const AVATAR_COLORS = ['#2d5bff', '#0d9488', '#d97706', '#e11d48', '#7c3aed', '#0891b2', '#65a30d', '#c026d3'] as const

const PER_SEAT = { starter: 12, growth: 29, scale: 64 } as const

const STATUS_WEIGHTS = [
  ['active', 0.7],
  ['trialing', 0.12],
  ['past_due', 0.08],
  ['churned', 0.1]
] as const

function weightedStatus() {
  const roll = rand()
  let cumulative = 0
  for (const [status, weight] of STATUS_WEIGHTS) {
    cumulative += weight
    if (roll <= cumulative) return status
  }
  return 'active' as const
}

const DAY = 86_400_000
const HOUR = 3_600_000
const BOOT = new Date()

function buildSubscribers(count: number) {
  const rows: Array<typeof schema.subscribers.$inferInsert> = []
  const seen = new Set<string>()

  for (let i = 0; i < count; i++) {
    const first = pick(FIRST_NAMES)
    const last = pick(LAST_NAMES)
    const company = `${pick(COMPANY_HEADS)} ${pick(COMPANY_TAILS)}`
    const domain = company.split(' ')[0]!.toLowerCase()

    let email = `${first.toLowerCase()}@${domain}.com`
    let suffix = 2
    while (seen.has(email)) email = `${first.toLowerCase()}${suffix++}@${domain}.com`
    seen.add(email)

    const plan = pick(['starter', 'starter', 'growth', 'growth', 'growth', 'scale'] as const)
    const status = weightedStatus()
    // Seat bands overlap and stay narrow enough that no single plan swamps the
    // plan-mix chart.
    const seats = plan === 'starter' ? intBetween(2, 8) : plan === 'growth' ? intBetween(4, 30) : intBetween(15, 45)

    rows.push({
      id: `sub_${String(i + 1).padStart(4, '0')}`,
      name: `${first} ${last}`,
      email,
      company,
      plan,
      status,
      // Churned accounts contribute nothing, which keeps the totals honest.
      mrr: status === 'churned' ? 0 : seats * PER_SEAT[plan],
      seats,
      country: pick(COUNTRIES),
      avatarColor: pick(AVATAR_COLORS),
      joinedAt: new Date(BOOT.getTime() - intBetween(1, 900) * DAY).toISOString(),
      lastSeenAt: new Date(BOOT.getTime() - intBetween(0, 5000) * 60_000).toISOString()
    })
  }

  return rows
}

const ACTIVITY_KINDS = [
  { kind: 'signup', hasAmount: false },
  { kind: 'upgrade', hasAmount: true },
  { kind: 'downgrade', hasAmount: true },
  { kind: 'churn', hasAmount: true },
  { kind: 'payment', hasAmount: true },
  { kind: 'invite', hasAmount: false }
] as const

function buildActivity(subscribers: Array<typeof schema.subscribers.$inferInsert>, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const subscriber = subscribers[intBetween(0, subscribers.length - 1)]!
    const template = pick(ACTIVITY_KINDS)
    return {
      id: `evt_${String(i + 1).padStart(4, '0')}`,
      kind: template.kind,
      actor: subscriber.name,
      company: subscriber.company,
      plan: subscriber.plan,
      amount: template.hasAmount ? Math.max(12, Math.round(subscriber.mrr || 240)) : null,
      at: new Date(BOOT.getTime() - i * intBetween(20, 260) * 60_000).toISOString()
    }
  })
}

function buildInvoices(subscribers: Array<typeof schema.subscribers.$inferInsert>, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const subscriber = subscribers[intBetween(0, subscribers.length - 1)]!
    return {
      id: `inv_${String(i + 1).padStart(4, '0')}`,
      number: `CAD-2026-${4180 + i}`,
      subscriber: subscriber.company,
      amount: Math.max(12, subscriber.mrr || 290),
      // A past-due account's invoice is the one that failed — that is what
      // put it past due.
      status: subscriber.status === 'past_due' ? 'failed' : rand() > 0.18 ? 'paid' : 'open',
      issuedAt: new Date(BOOT.getTime() - i * intBetween(1, 4) * DAY).toISOString()
    } as typeof schema.invoices.$inferInsert
  })
}

/**
 * 24 months of MRR as a compounding walk, then scaled so the closing month
 * equals the MRR actually held by the seeded subscribers.
 *
 * Without that scaling the headline figure and the plan-mix total disagree,
 * which is the fastest way to make a demo look untrustworthy.
 */
function buildMonthlyHistory(closingTarget: number) {
  const walk: number[] = []
  let value = 41_500
  for (let i = 0; i < 24; i++) {
    value *= 1 + between(0.012, 0.058) - (i % 7 === 0 ? between(0.01, 0.03) : 0)
    walk.push(value)
  }
  const scale = closingTarget / walk[walk.length - 1]!
  return walk.map((point, index) =>
    index === walk.length - 1 ? closingTarget : Math.round((point * scale) / 50) * 50
  )
}

/** 90 days of daily revenue, with the weekend dip people recognise. */
function buildDailyHistory() {
  const days: number[] = []
  let value = 2_950
  for (let i = 0; i < 90; i++) {
    const weekday = (i + 3) % 7
    const weekendDip = weekday === 5 || weekday === 6 ? 0.72 : 1
    value *= 1 + between(-0.035, 0.05)
    days.push(Math.round(value * weekendDip))
  }
  return days
}

async function main() {
  const url = process.env.DATABASE_URL ?? 'file:./.data/cadence.db'
  ensureDatabaseDirectory(url)
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN })
  const db = drizzle(client, { schema })

  console.info(`[seed] ${url}`)

  // Idempotent: clear what this script owns before inserting.
  await db.delete(schema.authTokens)
  await db.delete(schema.notificationPrefs)
  await db.delete(schema.revenueHistory)
  await db.delete(schema.invoices)
  await db.delete(schema.activity)
  await db.delete(schema.subscribers)
  await db.delete(schema.teamMembers)
  await db.delete(schema.users)

  const owner = {
    id: 'usr_0001',
    name: 'Ronaldo Cristover',
    email: DEMO_EMAIL,
    passwordHash: hashPassword(DEMO_PASSWORD),
    role: 'owner' as const,
    jobTitle: 'Head of Revenue Operations',
    company: 'Cadence',
    timezone: 'Asia/Jakarta',
    avatarColor: '#2d5bff',
    createdAt: new Date(BOOT.getTime() - 420 * DAY).toISOString(),
    // Verified with two-step off, so signing in stays a single step. Turn
    // two-step on from Settings → Account to walk that flow.
    emailVerifiedAt: new Date(BOOT.getTime() - 420 * DAY).toISOString(),
    twoFactorEnabled: false
  }

  await db.insert(schema.users).values(owner)

  const subscribers = buildSubscribers(148)
  const mrrTotal = subscribers.reduce((sum, row) => sum + row.mrr, 0)

  // SQLite caps variables per statement, so insert in chunks rather than one
  // 148-row statement that would work locally and fail on a smaller limit.
  for (let i = 0; i < subscribers.length; i += 50) {
    await db.insert(schema.subscribers).values(subscribers.slice(i, i + 50))
  }

  await db.insert(schema.activity).values(buildActivity(subscribers, 40))
  await db.insert(schema.invoices).values(buildInvoices(subscribers, 24))

  await db.insert(schema.teamMembers).values([
    { id: 'tm_1', name: owner.name, email: owner.email, role: 'owner', status: 'active', avatarColor: '#2d5bff', lastSeenAt: BOOT.toISOString() },
    { id: 'tm_2', name: 'Hana Nakamura', email: 'hana@cadence.app', role: 'admin', status: 'active', avatarColor: '#0d9488', lastSeenAt: new Date(BOOT.getTime() - 2 * HOUR).toISOString() },
    { id: 'tm_3', name: 'Mateo Rossi', email: 'mateo@cadence.app', role: 'member', status: 'active', avatarColor: '#d97706', lastSeenAt: new Date(BOOT.getTime() - 28 * HOUR).toISOString() },
    { id: 'tm_4', name: 'Priya Ibrahim', email: 'priya@cadence.app', role: 'member', status: 'invited', avatarColor: '#7c3aed', lastSeenAt: null }
  ])

  const monthly = buildMonthlyHistory(mrrTotal)
  const daily = buildDailyHistory()

  await db.insert(schema.revenueHistory).values([
    ...monthly.map((value, seq) => ({ kind: 'month' as const, seq, value })),
    ...daily.map((value, seq) => ({ kind: 'day' as const, seq, value }))
  ])

  await db.insert(schema.notificationPrefs).values({ userId: owner.id })

  console.info(
    `[seed] done — 1 user, ${subscribers.length} subscribers, `
    + `${monthly.length} months, ${daily.length} days, MRR ${mrrTotal}`
  )
  console.info(`[seed] sign in with ${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
}

main().catch((error) => {
  console.error('[seed] failed', error)
  process.exit(1)
})
