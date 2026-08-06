<script setup lang="ts">
const { t } = useI18n()

const links = computed(() => [
  { label: t('nav.product'), to: '#product' },
  { label: t('nav.howItWorks'), to: '#how' },
  { label: t('nav.pricing'), to: '#pricing' },
  { label: t('nav.faq'), to: '#faq' }
])

const open = ref(false)
const route = useRoute()
const { isAuthenticated } = useAuth()

// A hash link on the current page does not trigger navigation, so the drawer
// has to be closed explicitly.
watch(() => route.fullPath, () => {
  open.value = false
})
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-default bg-default/85 backdrop-blur-md">
    <div class="mx-auto flex h-16 max-w-(--ui-container) items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <NuxtLink to="/" class="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <AppLogo />
      </NuxtLink>

      <nav class="hidden items-center gap-1 md:flex" :aria-label="$t('nav.main')">
        <a
          v-for="link in links"
          :key="link.to"
          :href="link.to"
          class="rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-elevated hover:text-highlighted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {{ link.label }}
        </a>
      </nav>

      <div class="flex items-center gap-1.5">
        <LanguageSwitcher variant="ghost" class="hidden sm:inline-flex" />
        <UColorModeButton />

        <template v-if="isAuthenticated">
          <UButton to="/dashboard" :label="$t('marketing.openDashboard')" trailing-icon="i-lucide-arrow-right" class="hidden sm:inline-flex" />
          <UButton to="/dashboard" icon="i-lucide-layout-dashboard" aria-:label="$t('marketing.openDashboard')" class="sm:hidden" />
        </template>
        <template v-else>
          <UButton
            to="/login"
            :label="$t('marketing.signIn')"
            color="neutral"
            variant="ghost"
            class="hidden sm:inline-flex"
          />
          <UButton to="/register" :label="$t('marketing.startTrial')" class="hidden sm:inline-flex" />
        </template>

        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-menu"
          class="md:hidden"
          :aria-label="$t('common.openMenu')"
          @click="open = true"
        />
      </div>
    </div>

    <USlideover v-model:open="open" :title="$t('common.menu')" side="right">
      <template #body>
        <nav class="flex flex-col gap-1" :aria-label="$t('nav.mobile')">
          <a
            v-for="link in links"
            :key="link.to"
            :href="link.to"
            class="rounded-md px-3 py-2.5 text-base text-default transition-colors hover:bg-elevated"
            @click="open = false"
          >
            {{ link.label }}
          </a>
        </nav>

        <div class="mt-6 space-y-2 border-t border-default pt-6">
          <div class="pb-2 sm:hidden">
            <LanguageSwitcher variant="ghost" />
          </div>
          <template v-if="isAuthenticated">
            <UButton to="/dashboard" :label="$t('marketing.openDashboard')" block trailing-icon="i-lucide-arrow-right" />
          </template>
          <template v-else>
            <UButton to="/register" :label="$t('marketing.startTrial')" block />
            <UButton
              to="/login"
              :label="$t('marketing.signIn')"
              block
              color="neutral"
              variant="subtle"
            />
          </template>
        </div>
      </template>
    </USlideover>
  </header>
</template>
