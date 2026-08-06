import type { NavigationMenuItem } from '@nuxt/ui'

/**
 * A three-level sample tree, shared by the sidebar and the navigation
 * reference page so the two can never drift apart.
 *
 * Three levels is the ceiling on purpose. Each one costs indentation, and by
 * the fourth there is no width left for a label in a 240px sidebar — the tree
 * becomes a puzzle rather than a map. If a fourth level feels necessary, the
 * third should be a page with its own in-page navigation instead.
 *
 *   Level 1  group          — always visible
 *   Level 2  section        — revealed by opening level 1
 *   Level 3  leaf, a link   — the deepest thing that should ever be a link
 */
export function sampleNavTree(): NavigationMenuItem[] {
  return [
    {
      label: 'Reports',
      icon: 'i-lucide-folder',
      // `defaultOpen` on the branch someone most likely wants saves a click
      // without opening everything at once.
      defaultOpen: true,
      children: [
        {
          label: 'Revenue',
          icon: 'i-lucide-banknote',
          children: [
            { label: 'MRR movement', icon: 'i-lucide-git-compare-arrows', to: '/dashboard' },
            { label: 'Cohort retention', icon: 'i-lucide-radar', to: '/dashboard/analytics' },
            { label: 'Expansion', icon: 'i-lucide-trending-up', to: '/dashboard/analytics' }
          ]
        },
        {
          label: 'Customers',
          icon: 'i-lucide-users',
          children: [
            { label: 'By plan', icon: 'i-lucide-layers', to: '/dashboard/subscribers' },
            { label: 'By region', icon: 'i-lucide-globe', to: '/dashboard/subscribers' }
          ]
        }
      ]
    },
    {
      label: 'Operations',
      icon: 'i-lucide-settings-2',
      children: [
        {
          label: 'Billing',
          icon: 'i-lucide-credit-card',
          children: [
            { label: 'Invoices', icon: 'i-lucide-receipt-text', to: '/dashboard/settings?tab=billing' },
            { label: 'Dunning', icon: 'i-lucide-bell-ring', to: '/dashboard/settings?tab=notifications' }
          ]
        },
        {
          label: 'Data',
          icon: 'i-lucide-database',
          children: [
            { label: 'Imports', icon: 'i-lucide-upload', to: '/dashboard/forms' },
            { label: 'Exports', icon: 'i-lucide-download', to: '/dashboard/table' }
          ]
        }
      ]
    }
  ]
}
