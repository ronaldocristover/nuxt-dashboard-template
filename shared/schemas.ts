import { z } from 'zod'

/**
 * One schema per form, used by the `UForm` on the client and by the matching
 * Nitro route on the server. Validation rules can't drift apart because there
 * is only one copy of them.
 *
 * Each schema is a factory taking a translate function. Messages are stored as
 * translation keys, so:
 *
 * - the client passes `useI18n().t` and the reader sees their own language;
 * - the server calls the factory with no argument, and messages stay as keys.
 *
 * That second case is deliberate. Server-side issues are never rendered — the
 * routes answer with a single `statusMessage` and the client validates before
 * anything is submitted — so there is no reason to keep a second copy of the
 * English strings on the server just to throw them away.
 */

export type Translate = (key: string, params?: Record<string, unknown>) => string

/** Returns the key untouched. Used server-side, where messages aren't shown. */
const identity: Translate = key => key

function emailField(t: Translate) {
  return z
    .string()
    .min(1, t('validation.email.required'))
    .email(t('validation.email.invalid'))
    .transform(value => value.trim().toLowerCase())
}

function passwordField(t: Translate) {
  return z
    .string()
    .min(8, t('validation.password.tooShort'))
    .max(128, t('validation.password.tooLong'))
}

/** Applied on sign-up only, so existing accounts are never locked out. */
function strongPasswordField(t: Translate) {
  return passwordField(t)
    .refine(value => /[a-z]/.test(value), t('validation.password.lowercase'))
    .refine(value => /[A-Z]/.test(value), t('validation.password.uppercase'))
    .refine(value => /\d/.test(value), t('validation.password.number'))
}

export function createSignInSchema(t: Translate = identity) {
  return z.object({
    email: emailField(t),
    password: z.string().min(1, t('validation.password.required')),
    remember: z.boolean().optional().default(false)
  })
}

export function createSignUpSchema(t: Translate = identity) {
  return z.object({
    name: z
      .string()
      .min(2, t('validation.name.required'))
      .max(80, t('validation.name.tooLong'))
      .transform(value => value.trim()),
    email: emailField(t),
    password: strongPasswordField(t),
    // `refine` rather than `literal(true)` so the inferred type stays `boolean`
    // and the checkbox can legitimately start out unchecked.
    terms: z.boolean().refine(value => value, t('validation.terms'))
  })
}

export function createForgotPasswordSchema(t: Translate = identity) {
  return z.object({ email: emailField(t) })
}

export function createResetPasswordSchema(t: Translate = identity) {
  return z
    .object({
      token: z.string().min(1, t('validation.token.missing')),
      password: strongPasswordField(t),
      confirmPassword: z.string().min(1, t('validation.password.confirmRequired'))
    })
    .refine(data => data.password === data.confirmPassword, {
      message: t('validation.password.mismatch'),
      path: ['confirmPassword']
    })
}

export function createProfileSchema(t: Translate = identity) {
  return z.object({
    name: z.string().min(2, t('validation.name.required')).max(80, t('validation.name.tooLong')),
    email: emailField(t),
    jobTitle: z.string().max(80).optional().default(''),
    company: z.string().max(80).optional().default(''),
    timezone: z.string().min(1, t('validation.timezone'))
  })
}

export function createChangePasswordSchema(t: Translate = identity) {
  return z
    .object({
      currentPassword: z.string().min(1, t('validation.password.currentRequired')),
      password: strongPasswordField(t),
      confirmPassword: z.string().min(1, t('validation.password.confirmRequired'))
    })
    .refine(data => data.password === data.confirmPassword, {
      message: t('validation.password.mismatch'),
      path: ['confirmPassword']
    })
}

export function createNotificationSchema() {
  return z.object({
    productUpdates: z.boolean(),
    weeklyDigest: z.boolean(),
    paymentFailures: z.boolean(),
    churnAlerts: z.boolean(),
    newSignups: z.boolean(),
    channel: z.enum(['email', 'slack', 'both'])
  })
}

export function createInviteSchema(t: Translate = identity) {
  return z.object({
    email: emailField(t),
    role: z.enum(['admin', 'member'])
  })
}

// Server-side instances. Messages stay as keys; the routes never render them.
export const signInSchema = createSignInSchema()
export const signUpSchema = createSignUpSchema()
export const forgotPasswordSchema = createForgotPasswordSchema()
export const resetPasswordSchema = createResetPasswordSchema()
export const profileSchema = createProfileSchema()
export const changePasswordSchema = createChangePasswordSchema()
export const notificationSchema = createNotificationSchema()
export const inviteSchema = createInviteSchema()

export type SignInInput = z.output<ReturnType<typeof createSignInSchema>>
export type SignUpInput = z.output<ReturnType<typeof createSignUpSchema>>
export type ForgotPasswordInput = z.output<ReturnType<typeof createForgotPasswordSchema>>
export type ResetPasswordInput = z.output<ReturnType<typeof createResetPasswordSchema>>
export type ProfileInput = z.output<ReturnType<typeof createProfileSchema>>
export type ChangePasswordInput = z.output<ReturnType<typeof createChangePasswordSchema>>
export type NotificationInput = z.output<ReturnType<typeof createNotificationSchema>>
export type InviteInput = z.output<ReturnType<typeof createInviteSchema>>

/**
 * Scores a password 0–4 for the strength meter on the sign-up form.
 * Deliberately simple and readable — it guides, it does not gatekeep.
 * `strongPasswordField` above is what actually enforces the rules.
 */
export function scorePassword(value: string): number {
  if (!value) return 0
  let score = 0
  if (value.length >= 8) score++
  if (value.length >= 12) score++
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++
  if (/\d/.test(value) && /[^\w\s]/.test(value)) score++
  return Math.min(score, 4)
}
