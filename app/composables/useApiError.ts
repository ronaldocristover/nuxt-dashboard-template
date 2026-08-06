/**
 * Turns a thrown `$fetch` error into a sentence worth showing someone.
 *
 * Every form in the template funnels failures through here, so an expired
 * session, a rate limit and a validation slip all read in the same voice
 * instead of leaking `FetchError: [POST] "/api/…"` into the interface.
 */
export function useApiError() {
  const toast = useToast()

  function messageFor(error: unknown): string {
    const candidate = error as {
      statusCode?: number
      statusMessage?: string
      data?: { statusMessage?: string, message?: string }
    }

    const fromServer = candidate?.data?.statusMessage ?? candidate?.statusMessage ?? candidate?.data?.message

    if (fromServer) return fromServer

    switch (candidate?.statusCode) {
      case 401: return 'Your session has expired. Sign in again to continue.'
      case 403: return 'You do not have access to that.'
      case 404: return 'We could not find what you were looking for.'
      case 429: return 'Too many attempts. Wait a moment and try again.'
      case 500: return 'Something broke on our side. Try again in a moment.'
      default: return 'That did not go through. Check your connection and try again.'
    }
  }

  /** Shows the error as a toast and returns the message for inline use. */
  function notify(error: unknown, title = 'That did not work'): string {
    const description = messageFor(error)

    toast.add({
      title,
      description,
      icon: 'i-lucide-circle-alert',
      color: 'error'
    })

    return description
  }

  function notifySuccess(title: string, description?: string): void {
    toast.add({
      title,
      description,
      icon: 'i-lucide-circle-check',
      color: 'success'
    })
  }

  return { messageFor, notify, notifySuccess }
}
