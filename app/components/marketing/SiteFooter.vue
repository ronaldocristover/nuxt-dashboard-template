<script setup lang="ts">
const { t } = useI18n()

const columns = computed(() => [
  {
    title: t('marketing.footer.product'),
    links: [
      { label: t('marketing.footer.overview'), to: '#product' },
      { label: t('nav.howItWorks'), to: '#how' },
      { label: t('nav.pricing'), to: '#pricing' },
      { label: t('marketing.footer.changelog'), to: '#' }
    ]
  },
  {
    title: t('marketing.footer.company'),
    links: [
      { label: t('marketing.footer.about'), to: '#' },
      { label: t('marketing.footer.customers'), to: '#proof' },
      { label: t('marketing.footer.careers'), to: '#' },
      { label: t('marketing.footer.contact'), to: '#' }
    ]
  },
  {
    title: t('marketing.footer.resources'),
    links: [
      { label: t('marketing.footer.docs'), to: '#' },
      { label: t('marketing.footer.api'), to: '#' },
      { label: t('marketing.footer.statusPage'), to: '#' },
      { label: t('marketing.footer.security'), to: '#' }
    ]
  }
])

const social = [
  { icon: 'i-simple-icons-github', label: 'GitHub', to: 'https://github.com' },
  { icon: 'i-simple-icons-x', label: 'X', to: 'https://x.com' },
  { icon: 'i-simple-icons-linkedin', label: 'LinkedIn', to: 'https://linkedin.com' }
]
</script>

<template>
  <footer class="border-t border-default bg-muted/40">
    <div class="mx-auto max-w-(--ui-container) px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div class="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div class="max-w-xs">
          <AppLogo />
          <p class="mt-3 text-sm text-muted">
            {{ $t('marketing.footer.blurb') }}
          </p>
          <div class="mt-5 flex gap-1">
            <UButton
              v-for="item in social"
              :key="item.label"
              :to="item.to"
              :icon="item.icon"
              :aria-label="item.label"
              color="neutral"
              variant="ghost"
              size="sm"
              target="_blank"
              rel="noopener"
            />
          </div>
          <div class="mt-4">
            <LanguageSwitcher variant="ghost" />
          </div>
        </div>

        <div v-for="column in columns" :key="column.title">
          <h3 class="text-sm font-semibold text-highlighted">
            {{ column.title }}
          </h3>
          <ul class="mt-3 space-y-2.5">
            <li v-for="link in column.links" :key="link.label">
              <a
                :href="link.to"
                class="rounded text-sm text-muted transition-colors hover:text-highlighted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {{ link.label }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-10 flex flex-col gap-3 border-t border-default pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-xs text-dimmed">
          {{ $t('marketing.footer.rights', { year: new Date().getFullYear() }) }}
        </p>
        <p class="text-xs text-dimmed">
          {{ $t('marketing.footer.builtWith') }}
        </p>
      </div>
    </div>
  </footer>
</template>
