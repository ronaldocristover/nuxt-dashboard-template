import type { H3Event } from 'h3'
import type { User } from '#shared/types'
import { db, publicUser } from './db'

/**
 * Session handling built on h3's sealed cookie sessions: the payload is
 * encrypted and signed with `NUXT_SESSION_PASSWORD`, so a client cannot read
 * or forge it. Only the user id is stored — everything else is looked up
 * fresh, so a role or email change takes effect immediately.
 */

interface SessionData {
  /** Set only once every factor has passed. This IS the session.  */
  userId?: string
  /**
   * A half-finished sign-in: the password was right, the second factor has
   * not been given yet. Deliberately a different key from `userId` so that
   * every existing authorisation check keeps failing until 2FA completes —
   * a pending challenge can never be mistaken for a session.
   */
  pendingUserId?: string
  pendingSince?: number
  pendingRemember?: boolean
}

const SESSION_NAME = 'cadence-session'
const MAX_AGE_DEFAULT = 60 * 60 * 24 // 1 day
const MAX_AGE_REMEMBERED = 60 * 60 * 24 * 30 // 30 days

function sessionPassword(): string {
  const configured = useRuntimeConfig().sessionPassword

  if (configured && configured.length >= 32) return configured

  // A missing secret must never silently degrade a real deployment.
  if (import.meta.dev) {
    return 'cadence-development-session-password-change-me'
  }

  throw createError({
    statusCode: 500,
    statusMessage: 'NUXT_SESSION_PASSWORD is missing or shorter than 32 characters.'
  })
}

function sessionConfig(maxAge: number = MAX_AGE_DEFAULT) {
  return {
    name: SESSION_NAME,
    password: sessionPassword(),
    cookie: {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: !import.meta.dev,
      path: '/',
      maxAge
    },
    maxAge
  }
}

export async function setUserSession(event: H3Event, userId: string, remember = false): Promise<void> {
  const config = sessionConfig(remember ? MAX_AGE_REMEMBERED : MAX_AGE_DEFAULT)
  const session = await useSession<SessionData>(event, config)
  await session.clear()
  await session.update({ userId })
}

/** A challenge is only good for ten minutes. */
const CHALLENGE_TTL = 10 * 60 * 1000

/**
 * Records that the password step passed. Grants nothing on its own — no
 * `userId` is written, so `requireUser` still rejects every request.
 */
export async function setPendingSession(event: H3Event, userId: string, remember: boolean): Promise<void> {
  const session = await useSession<SessionData>(event, sessionConfig())
  await session.clear()
  await session.update({ pendingUserId: userId, pendingSince: Date.now(), pendingRemember: remember })
}

/** The user part-way through signing in, or `null` if there is no live challenge. */
export async function getPendingUser(event: H3Event): Promise<{ user: User, remember: boolean } | null> {
  const session = await useSession<SessionData>(event, sessionConfig())
  const { pendingUserId, pendingSince, pendingRemember } = session.data

  if (!pendingUserId || !pendingSince) return null

  if (Date.now() - pendingSince > CHALLENGE_TTL) {
    // An expired challenge is cleared here rather than left to linger, so the
    // page can say "start again" instead of failing on submit.
    await session.clear()
    return null
  }

  const stored = await db.findUserById(pendingUserId)
  if (!stored) {
    await session.clear()
    return null
  }

  return { user: publicUser(stored), remember: pendingRemember ?? false }
}

/** Turns a passed challenge into a real session. */
export async function promotePendingSession(event: H3Event, userId: string, remember: boolean): Promise<void> {
  await setUserSession(event, userId, remember)
}

export async function clearUserSession(event: H3Event): Promise<void> {
  const session = await useSession<SessionData>(event, sessionConfig())
  await session.clear()
}

/** Returns the signed-in user, or `null` for an anonymous request. */
export async function getCurrentUser(event: H3Event): Promise<User | null> {
  const session = await useSession<SessionData>(event, sessionConfig())
  const userId = session.data.userId
  if (!userId) return null

  const user = await db.findUserById(userId)
  if (!user) {
    // The session outlived its user. Drop it rather than 500.
    await session.clear()
    return null
  }

  return publicUser(user)
}

/** Same as `getCurrentUser`, but throws 401 instead of returning `null`. */
export async function requireUser(event: H3Event): Promise<User> {
  const user = await getCurrentUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Sign in to continue' })
  }
  return user
}
