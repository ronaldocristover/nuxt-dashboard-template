import { describe, expect, it } from 'vitest'
import { createMemberSchema, MEMBER_DEPARTMENTS, MEMBER_ROLES } from '../shared/schemas'

/**
 * The member form's schema, which both the page and the route validate against.
 *
 * The cases here are the ones that bite in practice: an address pasted with
 * whitespace, a role that arrived from a hand-edited request, and the optional
 * fields defaulting rather than arriving as `undefined` and forcing the
 * database to decide what an absent job title means.
 */

const schema = createMemberSchema()

function valid(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Amara Adeyemi',
    email: 'amara@cadence.app',
    role: 'member',
    status: 'invited',
    department: 'support',
    title: 'Support Lead',
    phone: '+234 1 555 0164',
    location: 'Lagos, Nigeria',
    timezone: 'Africa/Lagos',
    notes: '',
    ...overrides
  }
}

describe('member schema', () => {
  it('accepts a complete member', () => {
    expect(schema.safeParse(valid()).success).toBe(true)
  })

  it('trims and lowercases the email before validating it', () => {
    // A pasted address carrying whitespace is valid input, not a typo.
    const result = schema.safeParse(valid({ email: '  AMARA@Cadence.App  ' }))
    expect(result.success).toBe(true)
    expect(result.data?.email).toBe('amara@cadence.app')
  })

  it('trims the name', () => {
    const result = schema.safeParse(valid({ name: '  Amara Adeyemi  ' }))
    expect(result.data?.name).toBe('Amara Adeyemi')
  })

  it.each([
    ['a blank name', { name: '' }],
    ['a one-character name', { name: 'A' }],
    ['a malformed email', { email: 'amara-at-cadence' }],
    ['an empty email', { email: '' }],
    ['an unknown role', { role: 'superuser' }],
    ['an unknown department', { department: 'legal' }],
    ['an unknown status', { status: 'suspended' }],
    ['a blank timezone', { timezone: '' }]
  ])('rejects %s', (_label, override) => {
    expect(schema.safeParse(valid(override)).success).toBe(false)
  })

  it('defaults the optional text fields to empty strings', () => {
    const result = schema.safeParse({
      name: 'Ugo Dubois',
      email: 'ugo@cadence.app',
      role: 'member',
      department: 'revenue'
    })

    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({
      status: 'invited',
      title: '',
      phone: '',
      location: '',
      notes: '',
      timezone: 'UTC'
    })
  })

  it('accepts a phone number in any shape', () => {
    // A regex here would reject somebody's real number for the sake of tidiness.
    for (const phone of ['+62 811 5550 0999', '(555) 010-4477', '0812-3456-7890', 'ext. 4471']) {
      expect(schema.safeParse(valid({ phone })).success).toBe(true)
    }
  })

  it('rejects notes longer than the column allows', () => {
    expect(schema.safeParse(valid({ notes: 'x'.repeat(2001) })).success).toBe(false)
    expect(schema.safeParse(valid({ notes: 'x'.repeat(2000) })).success).toBe(true)
  })

  it('emits translation keys, not English prose', () => {
    const result = schema.safeParse(valid({ name: '' }))
    expect(result.error?.issues[0]?.message).toMatch(/^validation\./)
  })

  it('covers every role and department the schema advertises', () => {
    for (const role of MEMBER_ROLES) {
      expect(schema.safeParse(valid({ role })).success).toBe(true)
    }
    for (const department of MEMBER_DEPARTMENTS) {
      expect(schema.safeParse(valid({ department })).success).toBe(true)
    }
  })
})
