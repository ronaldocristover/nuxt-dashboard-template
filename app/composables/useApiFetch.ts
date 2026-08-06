import type { UseFetchOptions } from 'nuxt/app'

/**
 * `useFetch` for authenticated endpoints.
 *
 * During SSR, an internal `$fetch` does not inherit the browser's cookies, so
 * a session-protected route would answer 401 on the server and only succeed
 * after hydration — the dashboard would flash empty on every hard load.
 * Forwarding the cookie header fixes that in one place.
 */
export function useApiFetch<T>(
  url: string | (() => string),
  options: UseFetchOptions<T> = {}
) {
  return useFetch(url, {
    ...options,
    headers: {
      ...(import.meta.server ? useRequestHeaders(['cookie']) : {}),
      ...options.headers
    }
  } as UseFetchOptions<T>)
}
