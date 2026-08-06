/**
 * Guards the dashboard. Applied per-page with
 * `definePageMeta({ middleware: 'auth' })`.
 *
 * The intended destination is carried on the redirect so signing in lands the
 * reader where they were headed, not on a generic overview.
 */
export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated.value) return

  return navigateTo({
    path: '/login',
    query: to.fullPath === '/' ? undefined : { redirect: to.fullPath }
  })
})
