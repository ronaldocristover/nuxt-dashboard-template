/**
 * Guards `/two-factor`.
 *
 * The page is only meaningful mid-sign-in. Someone already authenticated goes
 * to the dashboard; someone with no live challenge goes back to sign in, so a
 * bookmarked or stale URL never shows a code field that cannot succeed.
 */
export default defineNuxtRouteMiddleware(async () => {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated.value) return navigateTo('/dashboard')

  const { pending } = await $fetch('/api/auth/two-factor/challenge', {
    headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined
  })

  if (!pending) return navigateTo('/login')
})
