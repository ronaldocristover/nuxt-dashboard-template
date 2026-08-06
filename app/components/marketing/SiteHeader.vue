<script setup lang="ts">
const links = [
  { label: 'Product', to: '#product' },
  { label: 'How it works', to: '#how' },
  { label: 'Pricing', to: '#pricing' },
  { label: 'FAQ', to: '#faq' }
]

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

      <nav class="hidden items-center gap-1 md:flex" aria-label="Main">
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
        <UColorModeButton />

        <template v-if="isAuthenticated">
          <UButton to="/dashboard" label="Open dashboard" trailing-icon="i-lucide-arrow-right" class="hidden sm:inline-flex" />
          <UButton to="/dashboard" icon="i-lucide-layout-dashboard" aria-label="Open dashboard" class="sm:hidden" />
        </template>
        <template v-else>
          <UButton
            to="/login"
            label="Sign in"
            color="neutral"
            variant="ghost"
            class="hidden sm:inline-flex"
          />
          <UButton to="/register" label="Start free trial" class="hidden sm:inline-flex" />
        </template>

        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-menu"
          class="md:hidden"
          aria-label="Open menu"
          @click="open = true"
        />
      </div>
    </div>

    <USlideover v-model:open="open" title="Menu" side="right">
      <template #body>
        <nav class="flex flex-col gap-1" aria-label="Mobile">
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
          <template v-if="isAuthenticated">
            <UButton to="/dashboard" label="Open dashboard" block trailing-icon="i-lucide-arrow-right" />
          </template>
          <template v-else>
            <UButton to="/register" label="Start free trial" block />
            <UButton
              to="/login"
              label="Sign in"
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
