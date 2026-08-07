import type { H3Event } from 'h3'
import { isMailLocale, type MailLocale } from './render'

/**
 * The language to write to someone in.
 *
 * Read from the same `cadence-locale` cookie the interface uses, so the email
 * arrives in whatever language the person was just reading. Falls back to
 * English rather than guessing from `Accept-Language`: someone browsing in
 * Indonesian on a machine set to English chose Indonesian, and the cookie is
 * the record of that choice.
 */
export function mailLocale(event: H3Event): MailLocale {
  const cookie = getCookie(event, 'cadence-locale')
  return isMailLocale(cookie) ? cookie : 'en'
}
