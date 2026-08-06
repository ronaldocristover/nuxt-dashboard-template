import type { User } from '#shared/types'
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

  async function signIn(input: SignInInput): Promise<User> {
    const { user: signedIn } = await $fetch('/api/auth/login', {
      method: 'POST',
      body: input
    })
    user.value = signedIn
    return signedIn
  }

  async function signUp(input: SignUpInput): Promise<User> {
    const { user: created } = await $fetch('/api/auth/register', {
      method: 'POST',
      body: input
    })
    user.value = created
    return created
  }

  async function signOut(): Promise<void> {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    await navigateTo('/login')
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
    fetchUser,
    signIn,
    signUp,
    signOut,
    updateProfile,
    changePassword
  }
}
