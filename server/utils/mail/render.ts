import en from '~~/i18n/locales/en.json'
import id from '~~/i18n/locales/id.json'
import zhHans from '~~/i18n/locales/zh-Hans.json'
import zhHant from '~~/i18n/locales/zh-Hant.json'
import type { Mail } from './send'

/**
 * Builds the three transactional emails, in the reader's own language.
 *
 * The copy comes from the same locale files the interface uses, so a phrase is
 * translated once. `npm run i18n:check` therefore covers the emails too — a key
 * added to `en.json` and forgotten in `id.json` fails CI rather than reaching
 * an inbox in the wrong language.
 *
 * Everything is a pure function of its inputs: no clock, no database, no
 * network. That is what makes `test/mail.test.ts` able to assert the output.
 */

const MESSAGES = { 'en': en, 'id': id, 'zh-Hans': zhHans, 'zh-Hant': zhHant }

export type MailLocale = keyof typeof MESSAGES

export function isMailLocale(value: string | undefined): value is MailLocale {
  return Boolean(value && value in MESSAGES)
}

/** Reads a dotted key, and returns the key itself if it is missing. */
function translate(locale: MailLocale, key: string, values: Record<string, string | number> = {}): string {
  const found = key.split('.').reduce<unknown>(
    (node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined),
    MESSAGES[locale]
  )

  if (typeof found !== 'string') return key

  return found.replace(/\{(\w+)\}/g, (whole, name: string) =>
    (name in values ? String(values[name]) : whole))
}

/** Escapes text before it goes anywhere near the HTML part. */
function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface Layout {
  locale: MailLocale
  dir: 'ltr' | 'rtl'
  title: string
  intro: string
  /** Rendered between the intro and the sign-off. */
  body: string
  outro: string
}

/**
 * One layout for every message.
 *
 * Styles are inline and the structure is tables, because that is what email
 * clients from 2003 still require and several of them are still in use. No
 * webfonts: they are stripped by most clients, and a message that falls back to
 * a system stack cleanly beats one that ships two faces and renders in neither.
 */
function layout({ locale, dir, title, intro, body, outro }: Layout): string {
  return `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${escape(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#101828;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f9;padding:32px 16px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;border:1px solid #e4e7ec;">
    <tr><td style="padding:32px 32px 0 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle;">
          <!-- The mark, drawn in table cells rather than fetched as an image.
               Most clients block remote images by default, so a hosted logo
               arrives as a broken icon on the one email you most want people to
               trust. Four bars of rising height, same as the favicon. -->
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:28px;height:28px;border-radius:7px;background:#2D5BFF;">
            <tr>
              <td style="padding:0 0 7px 5px;vertical-align:bottom;"><div style="width:3px;height:8px;background:#ffffff;opacity:0.5;font-size:1px;line-height:1px;">&nbsp;</div></td>
              <td style="padding:0 0 7px 2px;vertical-align:bottom;"><div style="width:3px;height:12px;background:#ffffff;opacity:0.7;font-size:1px;line-height:1px;">&nbsp;</div></td>
              <td style="padding:0 0 7px 2px;vertical-align:bottom;"><div style="width:3px;height:16px;background:#ffffff;opacity:0.85;font-size:1px;line-height:1px;">&nbsp;</div></td>
              <td style="padding:0 5px 7px 2px;vertical-align:bottom;"><div style="width:3px;height:21px;background:#ffffff;font-size:1px;line-height:1px;">&nbsp;</div></td>
            </tr>
          </table>
        </td>
        <td style="vertical-align:middle;padding-inline-start:10px;font-size:18px;font-weight:600;letter-spacing:-0.01em;">
          ${escape(translate(locale, 'app.name'))}
        </td>
      </tr></table>
    </td></tr>

    <tr><td style="padding:24px 32px 0 32px;">
      <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:600;letter-spacing:-0.02em;">${escape(title)}</h1>
      <p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#475467;">${escape(intro)}</p>
    </td></tr>

    <tr><td style="padding:24px 32px 0 32px;">${body}</td></tr>

    <tr><td style="padding:20px 32px 32px 32px;">
      <p style="margin:0;font-size:13px;line-height:1.6;color:#667085;">${escape(outro)}</p>
    </td></tr>
  </table>

  <p style="max-width:520px;margin:16px auto 0 auto;font-size:12px;line-height:1.6;color:#98a2b3;text-align:center;">
    ${escape(translate(locale, 'mail.footer', { app: translate(locale, 'app.name') }))}
  </p>
</td></tr>
</table>
</body>
</html>`
}

/** A call to action that survives clients which drop CSS. */
function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:8px;background:#1a42e6;">
  <a href="${escape(href)}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${escape(label)}</a>
</td></tr></table>`
}

function fallbackLink(locale: MailLocale, href: string): string {
  return `<p style="margin:20px 0 0 0;font-size:13px;line-height:1.6;color:#667085;">
  ${escape(translate(locale, 'mail.fallback'))}<br>
  <a href="${escape(href)}" style="color:#1a42e6;word-break:break-all;">${escape(href)}</a>
</p>`
}

/** The plain-text part. Same information, no markup, links on their own line. */
function textPart(lines: Array<string | undefined>): string {
  return lines.filter(Boolean).join('\n\n')
}

export interface LinkMail {
  to: string
  locale: MailLocale
  dir?: 'ltr' | 'rtl'
  url: string
  /** How long the link is good for, in minutes. Passed in so copy and code agree. */
  expiresInMinutes: number
}

export function resetPasswordMail({ to, locale, dir = 'ltr', url, expiresInMinutes }: LinkMail): Mail {
  const title = translate(locale, 'mail.reset.title')
  const intro = translate(locale, 'mail.reset.intro')
  const label = translate(locale, 'mail.reset.button')
  const expiry = translate(locale, 'mail.reset.expires', { minutes: expiresInMinutes })
  const outro = translate(locale, 'mail.reset.ignore')

  return {
    to,
    subject: translate(locale, 'mail.reset.subject', { app: translate(locale, 'app.name') }),
    html: layout({
      locale,
      dir,
      title,
      intro,
      body: `${button(url, label)}
        <p style="margin:16px 0 0 0;font-size:13px;color:#667085;">${escape(expiry)}</p>
        ${fallbackLink(locale, url)}`,
      outro
    }),
    text: textPart([title, intro, url, expiry, outro])
  }
}

export function verifyEmailMail({ to, locale, dir = 'ltr', url, expiresInMinutes }: LinkMail): Mail {
  const title = translate(locale, 'mail.verify.title')
  const intro = translate(locale, 'mail.verify.intro')
  const label = translate(locale, 'mail.verify.button')
  const expiry = translate(locale, 'mail.verify.expires', { hours: Math.round(expiresInMinutes / 60) })
  const outro = translate(locale, 'mail.verify.ignore')

  return {
    to,
    subject: translate(locale, 'mail.verify.subject', { app: translate(locale, 'app.name') }),
    html: layout({
      locale,
      dir,
      title,
      intro,
      body: `${button(url, label)}
        <p style="margin:16px 0 0 0;font-size:13px;color:#667085;">${escape(expiry)}</p>
        ${fallbackLink(locale, url)}`,
      outro
    }),
    text: textPart([title, intro, url, expiry, outro])
  }
}

export interface CodeMail {
  to: string
  locale: MailLocale
  dir?: 'ltr' | 'rtl'
  code: string
  expiresInMinutes: number
}

export function twoStepCodeMail({ to, locale, dir = 'ltr', code, expiresInMinutes }: CodeMail): Mail {
  const title = translate(locale, 'mail.code.title')
  const intro = translate(locale, 'mail.code.intro')
  const expiry = translate(locale, 'mail.code.expires', { minutes: expiresInMinutes })
  const outro = translate(locale, 'mail.code.ignore')

  return {
    to,
    subject: translate(locale, 'mail.code.subject', { code }),
    html: layout({
      locale,
      dir,
      title,
      intro,
      // The code is the message. No button — there is nothing to click, and a
      // link in a "someone is signing in" email is what phishing looks like.
      body: `<div style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:34px;font-weight:600;letter-spacing:0.22em;padding:16px 20px;background:#f4f5f9;border-radius:10px;text-align:center;">${escape(code)}</div>
        <p style="margin:16px 0 0 0;font-size:13px;color:#667085;">${escape(expiry)}</p>`,
      outro
    }),
    text: textPart([title, intro, code, expiry, outro])
  }
}
