/**
 * Keeps signed-in people off the auth pages. Someone who is already
 * authenticated has no use for a sign-in form.
 */
export default defineNuxtRouteMiddleware(() => {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated.value) {
    return navigateTo('/dashboard')
  }
})
