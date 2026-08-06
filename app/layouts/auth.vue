<script setup lang="ts">
/**
 * Split screen: the form on the left, a quiet proof panel on the right.
 *
 * The panel is `hidden lg:flex` rather than stacked above the form on small
 * screens — on a phone, someone opening a sign-in page wants the form, not a
 * testimonial pushing it below the fold.
 */
const { t } = useI18n()

const points = computed(() => [
  t('auth.panel.point1'),
  t('auth.panel.point2'),
  t('auth.panel.point3')
])
</script>

<template>
  <div class="flex min-h-svh bg-default">
    <main class="flex w-full flex-col px-5 py-6 sm:px-8 lg:w-[52%] lg:px-12 xl:px-20">
      <header class="flex items-center justify-between gap-2">
        <NuxtLink to="/" class="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <AppLogo />
        </NuxtLink>
        <div class="flex items-center gap-1">
          <LanguageSwitcher />
          <UColorModeButton />
        </div>
      </header>

      <div class="flex flex-1 items-center py-10">
        <div class="mx-auto w-full max-w-sm">
          <slot />
        </div>
      </div>

      <footer class="flex flex-wrap items-center justify-between gap-3 text-xs text-dimmed">
        <p>&copy; {{ new Date().getFullYear() }} Cadence</p>
        <nav class="flex gap-4">
          <NuxtLink to="/" class="transition-colors hover:text-default">
            {{ $t('auth.panel.privacy') }}
          </NuxtLink>
          <NuxtLink to="/" class="transition-colors hover:text-default">
            {{ $t('auth.panel.terms') }}
          </NuxtLink>
        </nav>
      </footer>
    </main>

    <aside class="panel-ink relative hidden w-[48%] shrink-0 flex-col justify-between overflow-hidden p-12 xl:p-16 lg:flex">
      <!-- One quiet flourish: a soft accent wash behind the panel content. -->
      <div
        class="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full opacity-20 blur-3xl"
        style="background: var(--ui-primary)"
        aria-hidden="true"
      />

      <p class="eyebrow relative text-slate-400">
        {{ $t('auth.panel.eyebrow') }}
      </p>

      <div class="relative">
        <blockquote class="font-display text-3xl font-medium leading-[1.2] tracking-tight text-white xl:text-[2.5rem]">
          &ldquo;{{ $t('auth.panel.quote') }}&rdquo;
        </blockquote>
        <figcaption class="mt-6 flex items-center gap-3">
          <span class="flex size-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
            HN
          </span>
          <span class="text-sm">
            <span class="block font-medium text-white">{{ $t('auth.panel.author') }}</span>
            <span class="block text-slate-400">{{ $t('auth.panel.role') }}</span>
          </span>
        </figcaption>
      </div>

      <ul class="relative space-y-3">
        <li v-for="point in points" :key="point" class="flex gap-2.5 text-sm text-slate-300">
          <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0" style="color: var(--ui-primary)" />
          {{ point }}
        </li>
      </ul>
    </aside>
  </div>
</template>
