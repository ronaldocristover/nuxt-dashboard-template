import type { SignInResult, User } from '#shared/types'
import type { ChangePasswordInput, ProfileInput, SignInInput, SignUpInput } from '#shared/schemas'

/**
 * The only place the app talks to the auth API.
 *
 * The signed-in user lives in `useState`, so it is fetched once during SSR,
 * serialised into the payload, and read from memory on the client. Pages and
 * middleware read `user` — they never call `/api/auth/*` themselves.
 */
export function useAuth() {
  const user = useState<User | null>('auth.user', () => null)
  const isAuthenticated = computed(() => user.value !== null)
  const isVerified = computed(() => user.value?.emailVerifiedAt != null)

  /** Reads the session cookie and refreshes `user`. Safe to call repeatedly. */
  async function fetchUser(): Promise<User | null> {
    try {
      const { user: fetched } = await $fetch('/api/auth/session', {
        headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined
      })
      user.value = fetched
    } catch {
      // A failed session read means anonymous, not broken.
      user.value = null
    }
    return user.value
  }

  /**
   * Signs in, or reports that a second factor is still needed.
   *
   * `user` is only populated when the sign-in actually completed — with
   * two-step on, the server has a pending challenge and nothing is
   * authenticated yet, so the caller must route to `/two-factor`.
   */
  async function signIn(input: SignInInput): Promise<SignInResult> {
    const result = await $fetch('/api/auth/login', { method: 'POST', body: input })
    user.value = result.user
    return result
  }

  /** Completes the second step and turns the challenge into a session. */
  async function verifyTwoFactor(code: string): Promise<User | null> {
    const { user: signedIn } = await $fetch('/api/auth/two-factor/verify', {
      method: 'POST',
      body: { code }
    })
    user.value = signedIn
    return signedIn
  }

  async function resendTwoFactor(): Promise<string | undefined> {
    const { devCode } = await $fetch('/api/auth/two-factor/resend', { method: 'POST' })
    return devCode
  }

  async function setTwoFactor(enabled: boolean, password: string): Promise<User | null> {
    const { user: updated } = await $fetch('/api/auth/two-factor/settings', {
      method: 'POST',
      body: { enabled, password }
    })
    user.value = updated
    return updated
  }

  async function signUp(input: SignUpInput): Promise<{ user: User, devVerifyUrl?: string }> {
    const result = await $fetch('/api/auth/register', { method: 'POST', body: input })
    user.value = result.user
    return result
  }

  async function signOut(): Promise<void> {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/login')
  }

  /** Confirms an email address from a link. Works whether or not signed in. */
  async function verifyEmail(token: string): Promise<User> {
    const { user: verified } = await $fetch('/api/auth/verify-email', {
      method: 'POST',
      body: { token }
    })
    // Only adopt it as the current session when it is the same account —
    // someone may open a verification link while signed in as somebody else.
    if (!user.value || user.value.id === verified.id) user.value = verified
    return verified
  }

  async function resendVerification(): Promise<{ alreadyVerified: boolean, devUrl?: string }> {
    return await $fetch('/api/auth/resend-verification', { method: 'POST' })
  }

  async function updateProfile(input: ProfileInput): Promise<User> {
    const { user: updated } = await $fetch('/api/auth/profile', {
      method: 'PATCH',
      body: input
    })
    user.value = updated
    return updated
  }

  async function changePassword(input: ChangePasswordInput): Promise<void> {
    await $fetch('/api/auth/change-password', { method: 'POST', body: input })
  }

  return {
    user: readonly(user),
    isAuthenticated,
    isVerified,
    fetchUser,
    signIn,
    verifyTwoFactor,
    resendTwoFactor,
    setTwoFactor,
    signUp,
    signOut,
    verifyEmail,
    resendVerification,
    updateProfile,
    changePassword
  }
}
