import type {
  ActivityEvent,
  Invoice,
  NotificationPreferences,
  Plan,
  Subscriber,
  SubscriberStatus,
  TeamMember,
  User
} from '#shared/types'
import { hashPassword } from './password'

/**
 * ============================================================================
 * DEMO DATA STORE — replace this file
 * ============================================================================
 *
 * Everything the template needs lives behind the exported `db` object. It is
 * an in-memory store seeded from a fixed PRNG, so the numbers are identical on
 * every boot and the dashboard never looks broken in a screenshot.
 *
 * To connect a real backend, keep the method signatures below and change the
 * bodies. The API routes in `server/api/` call nothing else, so no page,
 * component or composable needs to be touched.
 *
 * State is per-process and resets on restart. That is intentional for a demo;
 * a real deployment needs a real database.
 */

/** Mulberry32. Small, fast, and seeded — same data every boot. */
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

/** Plan pricing per seat. Drives every MRR figure in the template. */
export const PLAN_PRICING: Record<Plan, { label: string, perSeat: number }> = {
  starter: { label: 'Starter', perSeat: 12 },
  growth: { label: 'Growth', perSeat: 29 },
  scale: { label: 'Scale', perSeat: 64 }
}

const STATUS_WEIGHTS: Array<[SubscriberStatus, number]> = [
  ['active', 0.7],
  ['trialing', 0.12],
  ['past_due', 0.08],
  ['churned', 0.1]
]

function weightedStatus(): SubscriberStatus {
  const roll = rand()
  let cumulative = 0
  for (const [status, weight] of STATUS_WEIGHTS) {
    cumulative += weight
    if (roll <= cumulative) return status
  }
  return 'active'
}

const DAY = 86_400_000

/** Seed timestamps are relative to boot so "last seen" labels stay believable. */
const BOOT = new Date()

function seedSubscribers(count: number): Subscriber[] {
  const rows: Subscriber[] = []
  const seenEmails = new Set<string>()

  for (let i = 0; i < count; i++) {
    const first = pick(FIRST_NAMES)
    const last = pick(LAST_NAMES)
    const name = `${first} ${last}`
    const company = `${pick(COMPANY_HEADS)} ${pick(COMPANY_TAILS)}`
    const domain = company.split(' ')[0]!.toLowerCase()

    let email = `${first.toLowerCase()}@${domain}.com`
    let suffix = 2
    while (seenEmails.has(email)) {
      email = `${first.toLowerCase()}${suffix++}@${domain}.com`
    }
    seenEmails.add(email)

    const plan = pick(['starter', 'starter', 'growth', 'growth', 'growth', 'scale'] as const)
    const status = weightedStatus()
    // Seat bands are deliberately overlapping and narrow enough that no single
    // plan swamps the plan-mix chart.
    const seats = plan === 'starter' ? intBetween(2, 8) : plan === 'growth' ? intBetween(4, 30) : intBetween(15, 45)

    rows.push({
      id: `sub_${(i + 1).toString().padStart(4, '0')}`,
      name,
      email,
      company,
      plan,
      status,
      // Churned accounts contribute nothing, which keeps the totals honest.
      mrr: status === 'churned' ? 0 : seats * PLAN_PRICING[plan].perSeat,
      seats,
      country: pick(COUNTRIES),
      avatarColor: pick(AVATAR_COLORS),
      joinedAt: new Date(BOOT.getTime() - intBetween(1, 900) * DAY).toISOString(),
      lastSeenAt: new Date(BOOT.getTime() - intBetween(0, 5000) * 60_000).toISOString()
    })
  }

  return rows.sort((a, b) => b.mrr - a.mrr)
}

const ACTIVITY_KINDS: Array<{ kind: ActivityEvent['kind'], hasAmount: boolean }> = [
  { kind: 'signup', hasAmount: false },
  { kind: 'upgrade', hasAmount: true },
  { kind: 'downgrade', hasAmount: true },
  { kind: 'churn', hasAmount: true },
  { kind: 'payment', hasAmount: true },
  { kind: 'invite', hasAmount: false }
]

function seedActivity(subscribers: Subscriber[], count: number): ActivityEvent[] {
  const events: ActivityEvent[] = []

  for (let i = 0; i < count; i++) {
    const subscriber = subscribers[intBetween(0, subscribers.length - 1)]!
    const template = pick(ACTIVITY_KINDS)
    const at = new Date(BOOT.getTime() - i * intBetween(20, 260) * 60_000)

    events.push({
      id: `evt_${(i + 1).toString().padStart(4, '0')}`,
      kind: template.kind,
      actor: subscriber.name,
      company: subscriber.company,
      plan: subscriber.plan,
      amount: template.hasAmount ? Math.max(12, Math.round(subscriber.mrr || 240)) : undefined,
      at: at.toISOString()
    })
  }

  return events
}

function seedInvoices(subscribers: Subscriber[], count: number): Invoice[] {
  return Array.from({ length: count }, (_, i) => {
    const subscriber = subscribers[intBetween(0, subscribers.length - 1)]!
    const status: Invoice['status'] = subscriber.status === 'past_due'
      ? 'failed'
      : rand() > 0.18 ? 'paid' : 'open'

    return {
      id: `inv_${(i + 1).toString().padStart(4, '0')}`,
      number: `CAD-${2026}-${(4180 + i).toString()}`,
      subscriber: subscriber.company,
      amount: Math.max(12, subscriber.mrr || 290),
      status,
      issuedAt: new Date(BOOT.getTime() - i * intBetween(1, 4) * DAY).toISOString()
    }
  })
}

/**
 * 24 months of MRR, built as a compounding walk so the trend is upward but
 * not suspiciously smooth. Index 23 is the current month.
 *
 * The walk is then scaled so the closing month equals the MRR actually held
 * by the seeded subscribers. Without that, the headline MRR and the plan-mix
 * total would disagree — the fastest way to make a demo look untrustworthy.
 */
function seedMrrHistory(closingTarget: number): number[] {
  const walk: number[] = []
  let value = 41_500
  for (let i = 0; i < 24; i++) {
    value *= 1 + between(0.012, 0.058) - (i % 7 === 0 ? between(0.01, 0.03) : 0)
    walk.push(value)
  }

  const scale = closingTarget / walk[walk.length - 1]!

  return walk.map((point, index) =>
    // The closing month must match exactly; earlier months can round.
    index === walk.length - 1 ? closingTarget : Math.round((point * scale) / 50) * 50
  )
}

/** 90 days of daily revenue, used by the analytics ranges. */
function seedDailyRevenue(): number[] {
  const days: number[] = []
  let value = 2_950
  for (let i = 0; i < 90; i++) {
    // Weekends are quieter — a shape buyers recognise from their own data.
    const weekday = (i + 3) % 7
    const weekendDip = weekday === 5 || weekday === 6 ? 0.72 : 1
    value *= 1 + between(-0.035, 0.05)
    days.push(Math.round(value * weekendDip))
  }
  return days
}

// --- Mutable state -----------------------------------------------------------

const DEMO_PASSWORD = 'Cadence2026'

interface StoredUser extends User {
  passwordHash: string
}

const users = new Map<string, StoredUser>()

const owner: StoredUser = {
  id: 'usr_0001',
  name: 'Ronaldo Cristover',
  email: 'demo@cadence.app',
  role: 'owner',
  jobTitle: 'Head of Revenue Operations',
  company: 'Cadence',
  timezone: 'Asia/Jakarta',
  avatarColor: '#2d5bff',
  createdAt: new Date(BOOT.getTime() - 420 * DAY).toISOString(),
  passwordHash: hashPassword(DEMO_PASSWORD)
}

users.set(owner.email, owner)

const subscribers = seedSubscribers(148)
const activity = seedActivity(subscribers, 40)
const invoices = seedInvoices(subscribers, 24)
const mrrHistory = seedMrrHistory(subscribers.reduce((sum, row) => sum + row.mrr, 0))
const dailyRevenue = seedDailyRevenue()

const HOUR = 3_600_000

const teamMembers: TeamMember[] = [
  { id: 'tm_1', name: owner.name, email: owner.email, role: 'owner', status: 'active', avatarColor: '#2d5bff', lastSeenAt: BOOT.toISOString() },
  { id: 'tm_2', name: 'Hana Nakamura', email: 'hana@cadence.app', role: 'admin', status: 'active', avatarColor: '#0d9488', lastSeenAt: new Date(BOOT.getTime() - 2 * HOUR).toISOString() },
  { id: 'tm_3', name: 'Mateo Rossi', email: 'mateo@cadence.app', role: 'member', status: 'active', avatarColor: '#d97706', lastSeenAt: new Date(BOOT.getTime() - 28 * HOUR).toISOString() },
  { id: 'tm_4', name: 'Priya Ibrahim', email: 'priya@cadence.app', role: 'member', status: 'invited', avatarColor: '#7c3aed', lastSeenAt: null }
]

let memberSequence = teamMembers.length

let notifications: NotificationPreferences = {
  productUpdates: true,
  weeklyDigest: true,
  paymentFailures: true,
  churnAlerts: true,
  newSignups: false,
  channel: 'email'
}

/** Reset tokens, keyed by token. Cleared on use and on expiry. */
const resetTokens = new Map<string, { email: string, expiresAt: number }>()

const RESET_TTL = 30 * 60 * 1000

export const db = {
  demoCredentials: { email: owner.email, password: DEMO_PASSWORD },

  findUserByEmail(email: string): StoredUser | undefined {
    return users.get(email.trim().toLowerCase())
  },

  findUserById(id: string): StoredUser | undefined {
    for (const user of users.values()) {
      if (user.id === id) return user
    }
    return undefined
  },

  createUser(input: { name: string, email: string, passwordHash: string }): StoredUser {
    const user: StoredUser = {
      id: `usr_${(users.size + 1).toString().padStart(4, '0')}`,
      name: input.name,
      email: input.email,
      role: 'admin',
      jobTitle: '',
      company: '',
      timezone: 'Asia/Jakarta',
      avatarColor: AVATAR_COLORS[users.size % AVATAR_COLORS.length]!,
      createdAt: new Date().toISOString(),
      passwordHash: input.passwordHash
    }
    users.set(user.email, user)
    return user
  },

  updateUser(id: string, patch: Partial<Omit<User, 'id'>>): StoredUser | undefined {
    const user = this.findUserById(id)
    if (!user) return undefined

    const nextEmail = patch.email?.trim().toLowerCase()
    if (nextEmail && nextEmail !== user.email) {
      users.delete(user.email)
      user.email = nextEmail
      users.set(nextEmail, user)
    }

    Object.assign(user, { ...patch, email: user.email })
    return user
  },

  setPassword(id: string, passwordHash: string): boolean {
    const user = this.findUserById(id)
    if (!user) return false
    user.passwordHash = passwordHash
    return true
  },

  createResetToken(email: string, token: string): void {
    resetTokens.set(token, { email, expiresAt: Date.now() + RESET_TTL })
  },

  consumeResetToken(token: string): string | undefined {
    const entry = resetTokens.get(token)
    if (!entry) return undefined
    resetTokens.delete(token)
    if (entry.expiresAt < Date.now()) return undefined
    return entry.email
  },

  subscribers: () => subscribers,
  activity: () => activity,
  invoices: () => invoices,
  mrrHistory: () => mrrHistory,
  dailyRevenue: () => dailyRevenue,
  teamMembers: () => teamMembers,

  notifications: () => notifications,
  setNotifications(next: NotificationPreferences) {
    notifications = next
    return notifications
  },

  inviteMember(email: string, role: 'admin' | 'member'): TeamMember {
    // A monotonic counter, not `length + 1` — removing a member and inviting
    // another would otherwise reuse an id that is still referenced elsewhere.
    const member: TeamMember = {
      id: `tm_${++memberSequence}`,
      name: email.split('@')[0]!.replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      email,
      role,
      status: 'invited',
      avatarColor: AVATAR_COLORS[teamMembers.length % AVATAR_COLORS.length]!,
      lastSeenAt: null
    }
    teamMembers.push(member)
    return member
  },

  removeMember(id: string): boolean {
    const index = teamMembers.findIndex(member => member.id === id)
    if (index === -1 || teamMembers[index]!.role === 'owner') return false
    teamMembers.splice(index, 1)
    return true
  }
}

/** Strips the password hash before a user object crosses the network. */
export function publicUser(user: StoredUser): User {
  const { passwordHash: _passwordHash, ...rest } = user
  return rest
}
