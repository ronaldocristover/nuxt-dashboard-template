<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

useSeoMeta({ title: 'Settings', robots: 'noindex' })

const route = useRoute()
const router = useRouter()

const TABS = [
  { value: 'profile', label: 'Profile', icon: 'i-lucide-user' },
  { value: 'account', label: 'Account', icon: 'i-lucide-shield' },
  { value: 'notifications', label: 'Notifications', icon: 'i-lucide-bell' },
  { value: 'billing', label: 'Billing', icon: 'i-lucide-credit-card' },
  { value: 'members', label: 'Team', icon: 'i-lucide-users' }
]

function parseTab(value: unknown): string {
  return TABS.some(tab => tab.value === value) ? (value as string) : 'profile'
}

const tab = ref(parseTab(route.query.tab))

/**
 * The tab lives in the URL so a settings screen can be linked to directly —
 * the user menu points straight at `?tab=billing`.
 */
watch(tab, (value) => {
  router.replace({ query: value === 'profile' ? {} : { tab: value } })
})

watch(() => route.query.tab, (value) => {
  tab.value = parseTab(value)
})
</script>

<template>
  <UDashboardPanel id="settings">
    <template #header>
      <UDashboardNavbar title="Settings">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto w-full max-w-3xl space-y-5">
        <UTabs
          v-model="tab"
          :items="TABS"
          :content="false"
          variant="link"
          class="w-full"
          :ui="{ list: 'overflow-x-auto' }"
        />

        <!-- `KeepAlive` would hold unsaved edits across tab switches, which
             quietly hides them. Each tab mounts fresh instead. -->
        <SettingsProfile v-if="tab === 'profile'" />
        <SettingsAccount v-else-if="tab === 'account'" />
        <SettingsNotifications v-else-if="tab === 'notifications'" />
        <SettingsBilling v-else-if="tab === 'billing'" />
        <SettingsMembers v-else-if="tab === 'members'" />
      </div>
    </template>
  </UDashboardPanel>
</template>
