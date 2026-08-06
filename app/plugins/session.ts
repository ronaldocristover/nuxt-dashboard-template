/**
 * Loads the session once, during SSR, before the first route renders.
 *
 * `useState` is serialised into the payload, so the client hydrates with the
 * user already in memory — no second request, and no authenticated page
 * flashing its signed-out state first.
 */
export default defineNuxtPlugin(async () => {
  const { user, fetchUser } = useAuth()

  if (user.value === null) {
    await callOnce('session', fetchUser)
  }
})
