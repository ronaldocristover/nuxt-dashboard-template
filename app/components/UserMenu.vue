<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { initials } from '#shared/format'

const props = withDefaults(defineProps<{
  collapsed?: boolean
}>(), {
  collapsed: false
})

const { user, signOut } = useAuth()
const { notify } = useApiError()
const colorMode = useColorMode()

const signingOut = ref(false)

async function onSignOut() {
  signingOut.value = true
  try {
    await signOut()
  } catch (error) {
    notify(error, 'Could not sign out')
  } finally {
    signingOut.value = false
  }
}

const items = computed<DropdownMenuItem[][]>(() => [
  [{
    type: 'label',
    label: user.value?.name ?? 'Account',
    avatar: { text: initials(user.value?.name ?? '?'), alt: user.value?.name }
  }],
  [
    { label: 'Profile', icon: 'i-lucide-user', to: '/dashboard/settings' },
    { label: 'Notifications', icon: 'i-lucide-bell', to: '/dashboard/settings?tab=notifications' },
    { label: 'Billing', icon: 'i-lucide-credit-card', to: '/dashboard/settings?tab=billing' }
  ],
  [{
    label: colorMode.value === 'dark' ? 'Light theme' : 'Dark theme',
    icon: colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon',
    // Keep the menu open so the change is visible where it was made.
    onSelect: (event: Event) => {
      event.preventDefault()
      colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
    }
  }],
  [{
    label: 'Sign out',
    icon: 'i-lucide-log-out',
    color: 'error',
    loading: signingOut.value,
    onSelect: () => onSignOut()
  }]
])
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', side: 'bottom', sideOffset: 8 }"
    :ui="{ content: 'w-56' }"
  >
    <UButton
      color="neutral"
      variant="ghost"
      :block="!props.collapsed"
      class="data-[state=open]:bg-elevated"
      :class="props.collapsed ? '' : 'justify-start px-2'"
      :aria-label="`Account menu for ${user?.name ?? 'your account'}`"
    >
      <UAvatar
        :text="initials(user?.name ?? '?')"
        size="xs"
        :style="{ background: user?.avatarColor, color: '#fff' }"
      />
      <span v-if="!props.collapsed" class="min-w-0 flex-1 truncate text-left text-sm font-medium">
        {{ user?.name }}
      </span>
      <UIcon v-if="!props.collapsed" name="i-lucide-chevrons-up-down" class="size-4 shrink-0 text-dimmed" />
    </UButton>
  </UDropdownMenu>
</template>
