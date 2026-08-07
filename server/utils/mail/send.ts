/**
 * The one place this template sends email.
 *
 * Four routes need to send something — a reset link, a verification link, a
 * resent verification link, and a two-step code. They all call `sendMail`, so
 * swapping providers is one file rather than four.
 *
 * Drivers are chosen with `MAIL_DRIVER` and cost no dependencies: `resend` and
 * `postmark` are plain JSON over HTTPS, and `console` (the default) prints the
 * message so the auth flows are testable the moment you clone the repo.
 *
 * Nothing here throws. A transactional provider having a bad afternoon must not
 * turn "your account is created" into a 500 — the account exists either way,
 * and the user can ask for another link. Failures are logged loudly instead.
 */

export interface Mail {
  to: string
  subject: string
  html: string
  /** Always send both parts. A text/plain fallback is what spam filters read. */
  text: string
}

type Driver = (mail: Mail, from: string) => Promise<void>

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

/** Prints the message. The default, so a fresh clone has working auth flows. */
const consoleDriver: Driver = async (mail) => {
  console.info(`\n[cadence:mail] to: ${mail.to}\n[cadence:mail] subject: ${mail.subject}\n${mail.text}\n`)
}

const resendDriver: Driver = async (mail, from) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${required('RESEND_API_KEY')}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, html: mail.html, text: mail.text })
  })

  if (!response.ok) throw new Error(`Resend responded ${response.status}: ${await response.text()}`)
}

const postmarkDriver: Driver = async (mail, from) => {
  const response = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'X-Postmark-Server-Token': required('POSTMARK_TOKEN'),
      'content-type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify({
      From: from,
      To: mail.to,
      Subject: mail.subject,
      HtmlBody: mail.html,
      TextBody: mail.text,
      MessageStream: process.env.POSTMARK_STREAM ?? 'outbound'
    })
  })

  if (!response.ok) throw new Error(`Postmark responded ${response.status}: ${await response.text()}`)
}

const DRIVERS: Record<string, Driver> = {
  console: consoleDriver,
  resend: resendDriver,
  postmark: postmarkDriver
}

/**
 * Sends the message, and reports whether it went.
 *
 * The boolean is for the caller's own logging; no route changes its response
 * based on it. In particular `/api/auth/forgot-password` must answer the same
 * way whether or not the address exists, so it cannot reveal a send failure
 * either — that would be the same oracle by a slower route.
 */
export async function sendMail(mail: Mail): Promise<boolean> {
  const name = process.env.MAIL_DRIVER ?? 'console'
  const driver = DRIVERS[name]

  if (!driver) {
    console.error(`[cadence:mail] unknown MAIL_DRIVER "${name}" — known: ${Object.keys(DRIVERS).join(', ')}`)
    return false
  }

  const from = process.env.MAIL_FROM ?? 'Cadence <onboarding@resend.dev>'

  try {
    await driver(mail, from)
    return true
  } catch (error) {
    // Loud, because a silently broken mailer looks exactly like a user who has
    // not checked their inbox yet.
    console.error(`[cadence:mail] "${mail.subject}" to ${mail.to} failed:`, error instanceof Error ? error.message : error)
    return false
  }
}
