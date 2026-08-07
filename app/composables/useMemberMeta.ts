import type { MemberDepartment, MemberRole, MemberStatus, TeamMember } from '#shared/types'

/**
 * The presentation rules for a member, in one place.
 *
 * Role colours, department icons and status wording are needed by the list, the
 * detail page and both forms. Four copies of the same mapping is how a role
 * ends up amber in one view and grey in another.
 */
export function useMemberMeta() {
  const { t } = useI18n()

  const ROLE_COLOR: Record<MemberRole, 'primary' | 'info' | 'neutral'> = {
    owner: 'primary',
    admin: 'info',
    member: 'neutral'
  }

  const DEPARTMENT_ICON: Record<MemberDepartment, string> = {
    revenue: 'i-lucide-trending-up',
    finance: 'i-lucide-receipt-text',
    product: 'i-lucide-box',
    support: 'i-lucide-life-buoy',
    leadership: 'i-lucide-compass'
  }

  return computed(() => ({
    roleLabel: (role: MemberRole) => t(`members.roles.${role}`),
    roleHint: (role: MemberRole) => t(`members.roleHints.${role}`),
    roleColor: (role: MemberRole) => ROLE_COLOR[role],
    statusLabel: (status: MemberStatus) => t(`members.statuses.${status}`),
    // Status is carried by colour *and* by a word, never colour alone.
    statusColor: (status: MemberStatus): 'success' | 'warning' => (status === 'active' ? 'success' : 'warning'),
    departmentLabel: (department: MemberDepartment) => t(`members.departments.${department}`),
    departmentIcon: (department: MemberDepartment) => DEPARTMENT_ICON[department],

    /** Options for the selects, built from the translations so they follow the language. */
    roleOptions: (['owner', 'admin', 'member'] as const).map(value => ({
      value,
      label: t(`members.roles.${value}`),
      description: t(`members.roleHints.${value}`)
    })),
    statusOptions: (['invited', 'active'] as const).map(value => ({
      value,
      label: t(`members.statuses.${value}`)
    })),
    departmentOptions: (['revenue', 'finance', 'product', 'support', 'leadership'] as const).map(value => ({
      value,
      label: t(`members.departments.${value}`),
      icon: DEPARTMENT_ICON[value]
    }))
  }))
}

/** Exactly the fields the form owns — no id, no avatar colour, no timestamps. */
export interface MemberFormState {
  name: string
  email: string
  role: MemberRole
  status: MemberStatus
  department: MemberDepartment
  title: string
  phone: string
  location: string
  timezone: string
  notes: string
}

/**
 * The blank member a create form starts from.
 *
 * Kept beside the metadata so a new field is added once, not once per form.
 */
export function emptyMember(): MemberFormState {
  return {
    name: '',
    email: '',
    role: 'member',
    status: 'invited',
    department: 'revenue',
    title: '',
    phone: '',
    location: '',
    timezone: 'UTC',
    notes: ''
  }
}

/** Narrows a stored member to just the fields the form owns. */
export function toFormState(member: TeamMember): MemberFormState {
  return {
    name: member.name,
    email: member.email,
    role: member.role,
    status: member.status,
    department: member.department,
    title: member.title,
    phone: member.phone,
    location: member.location,
    timezone: member.timezone,
    notes: member.notes
  }
}
