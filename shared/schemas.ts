import { z } from 'zod'

/**
 * One schema per form, used by the `UForm` on the client and by the matching
 * Nitro route on the server. Validation rules can't drift apart because
 * there is only one copy of them.
 */

const email = z
  .string()
  .min(1, 'Enter your email address')
  .email('That does not look like an email address')
  .transform(value => value.trim().toLowerCase())

const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(128, 'Use fewer than 128 characters')

/** Applied on sign-up only, so existing accounts are never locked out. */
const strongPassword = password
  .refine(value => /[a-z]/.test(value), 'Include a lowercase letter')
  .refine(value => /[A-Z]/.test(value), 'Include an uppercase letter')
  .refine(value => /\d/.test(value), 'Include a number')

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
  remember: z.boolean().optional().default(false)
})

export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, 'Enter your full name')
    .max(80, 'Use fewer than 80 characters')
    .transform(value => value.trim()),
  email,
  password: strongPassword,
  // `refine` rather than `literal(true)` so the inferred type stays `boolean`
  // and the checkbox can legitimately start out unchecked.
  terms: z.boolean().refine(value => value, 'Accept the terms to continue')
})

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'This reset link is missing its token'),
    password: strongPassword,
    confirmPassword: z.string().min(1, 'Confirm your new password')
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Both passwords must match',
    path: ['confirmPassword']
  })

export const profileSchema = z.object({
  name: z.string().min(2, 'Enter your full name').max(80),
  email,
  jobTitle: z.string().max(80).optional().default(''),
  company: z.string().max(80).optional().default(''),
  timezone: z.string().min(1, 'Pick a timezone')
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    password: strongPassword,
    confirmPassword: z.string().min(1, 'Confirm your new password')
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Both passwords must match',
    path: ['confirmPassword']
  })

export const notificationSchema = z.object({
  productUpdates: z.boolean(),
  weeklyDigest: z.boolean(),
  paymentFailures: z.boolean(),
  churnAlerts: z.boolean(),
  newSignups: z.boolean(),
  channel: z.enum(['email', 'slack', 'both'])
})

export const inviteSchema = z.object({
  email,
  role: z.enum(['admin', 'member'])
})

export type SignInInput = z.output<typeof signInSchema>
export type SignUpInput = z.output<typeof signUpSchema>
export type ForgotPasswordInput = z.output<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.output<typeof resetPasswordSchema>
export type ProfileInput = z.output<typeof profileSchema>
export type ChangePasswordInput = z.output<typeof changePasswordSchema>
export type NotificationInput = z.output<typeof notificationSchema>
export type InviteInput = z.output<typeof inviteSchema>

/**
 * Scores a password 0–4 for the strength meter on the sign-up form.
 * Deliberately simple and readable — it guides, it does not gatekeep.
 * `strongPassword` above is what actually enforces the rules.
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
