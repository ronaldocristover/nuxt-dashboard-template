/**
 * Turns a thrown `$fetch` error into a sentence worth showing someone.
 *
 * Every form in the template funnels failures through here, so an expired
 * session, a rate limit and a validation slip all read in the same voice
 * instead of leaking `FetchError: [POST] "/api/…"` into the interface.
 *
 * Status codes are mapped to translated copy. A `statusMessage` sent by the
 * server is only used as a last resort — it is written in English by the
 * route, so preferring it would leak English into a translated interface.
 */
export function useApiError() {
  const toast = useToast()
  const { t } = useI18n()

  const BY_STATUS: Record<number, string> = {
    401: 'errors.expired',
    403: 'errors.forbidden',
    404: 'errors.notFound',
    409: 'errors.generic',
    422: 'errors.generic',
    429: 'errors.rateLimited',
    500: 'errors.server'
  }

  function messageFor(error: unknown): string {
    const candidate = error as {
      statusCode?: number
      statusMessage?: string
      data?: { statusMessage?: string, message?: string }
    }

    const key = candidate?.statusCode ? BY_STATUS[candidate.statusCode] : undefined
    if (key) return t(key)

    const fromServer = candidate?.data?.statusMessage ?? candidate?.statusMessage ?? candidate?.data?.message
    if (fromServer) return fromServer

    return t('errors.generic')
  }

  /** Shows the error as a toast and returns the message for inline use. */
  function notify(error: unknown, title?: string): string {
    const description = messageFor(error)

    toast.add({
      title: title ?? t('errors.toastTitle'),
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
