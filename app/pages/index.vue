<script setup lang="ts">
import type { MrrMovement } from '#shared/types'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const fmt = useFormat()

useSeoMeta({
  title: () => t('app.description'),
  description: () => t('marketing.hero.body'),
  ogTitle: () => `${t('app.name')} — ${t('app.description')}`,
  ogDescription: () => t('marketing.hero.body')
})

/**
 * Marketing figures are fixed on purpose. The hero is a claim about what the
 * product shows, so it should read identically to everyone — only the wording
 * and the number formatting follow the reader's language.
 */
const heroMovement: MrrMovement = {
  starting: 52_400,
  new: 2_340,
  expansion: 1_205,
  contraction: 472,
  churn: 1_093,
  ending: 54_380
}

const usedBy = ['Northwind Labs', 'Kestrel Systems', 'Halcyon Group', 'Solstice Digital', 'Inkwell Works']

const capabilities = computed(() => [
  { icon: 'i-lucide-git-compare-arrows', title: t('marketing.capabilities.movementTitle'), body: t('marketing.capabilities.movementBody') },
  { icon: 'i-lucide-receipt-text', title: t('marketing.capabilities.invoicesTitle'), body: t('marketing.capabilities.invoicesBody') },
  { icon: 'i-lucide-radar', title: t('marketing.capabilities.cohortTitle'), body: t('marketing.capabilities.cohortBody') },
  { icon: 'i-lucide-bell-ring', title: t('marketing.capabilities.alertsTitle'), body: t('marketing.capabilities.alertsBody') }
])

/** A real sequence, so the steps are numbered. */
const steps = computed(() => [
  { title: t('marketing.how.step1Title'), body: t('marketing.how.step1Body') },
  { title: t('marketing.how.step2Title'), body: t('marketing.how.step2Body') },
  { title: t('marketing.how.step3Title'), body: t('marketing.how.step3Body') }
])

const proof = computed(() => [
  { figure: t('marketing.proof.stat1Figure'), label: t('marketing.proof.stat1Label') },
  { figure: t('marketing.proof.stat2Figure'), label: t('marketing.proof.stat2Label') },
  { figure: t('marketing.proof.stat3Figure'), label: t('marketing.proof.stat3Label') }
])

const tiers = computed(() => [
  {
    name: t('plans.starter'),
    price: 12,
    tagline: t('marketing.pricing.starterTagline'),
    features: [1, 2, 3, 4].map(n => t(`marketing.pricing.starter${n}`)),
    cta: t('marketing.startTrial'),
    featured: false
  },
  {
    name: t('plans.growth'),
    price: 29,
    tagline: t('marketing.pricing.growthTagline'),
    features: [1, 2, 3, 4, 5].map(n => t(`marketing.pricing.growth${n}`)),
    cta: t('marketing.startTrial'),
    featured: true
  },
  {
    name: t('plans.scale'),
    price: 64,
    tagline: t('marketing.pricing.scaleTagline'),
    features: [1, 2, 3, 4, 5].map(n => t(`marketing.pricing.scale${n}`)),
    cta: t('marketing.pricing.talkToSales'),
    featured: false
  }
])

const faqs = computed(() =>
  [1, 2, 3, 4, 5].map(n => ({
    label: t(`marketing.faq.q${n}`),
    content: t(`marketing.faq.a${n}`)
  }))
)
</script>

<template>
  <div>
    <!-- ------------------------------------------------------------------ -->
    <!-- Hero. The waterfall is the thesis: this is what the product shows. -->
    <!-- ------------------------------------------------------------------ -->
    <section class="relative overflow-hidden border-b border-default">
      <div class="mx-auto max-w-(--ui-container) px-4 pb-14 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8">
        <div class="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          <div>
            <p class="eyebrow rise text-primary" style="--stagger: 0">
              {{ $t('marketing.hero.eyebrow') }}
            </p>

            <h1
              class="rise mt-4 font-display text-display-sm font-semibold text-highlighted sm:text-display-md lg:text-display-lg"
              style="--stagger: 1"
            >
              {{ $t('marketing.hero.title') }}
            </h1>

            <p class="rise mt-5 max-w-xl text-base text-muted sm:text-lg" style="--stagger: 2">
              {{ $t('marketing.hero.body') }}
            </p>

            <div class="rise mt-8 flex flex-col gap-3 sm:flex-row" style="--stagger: 3">
              <UButton
                to="/register"
                :label="$t('marketing.hero.primary')"
                size="xl"
                trailing-icon="i-lucide-arrow-right"
                block
                class="sm:w-auto"
              />
              <UButton
                to="/login"
                :label="$t('marketing.hero.secondary')"
                size="xl"
                color="neutral"
                variant="subtle"
                block
                class="sm:w-auto"
              />
            </div>

            <p class="rise mt-4 text-xs text-dimmed" style="--stagger: 4">
              {{ $t('marketing.hero.note') }}
            </p>
          </div>

          <!-- The signature element, in its largest form. -->
          <div
            class="rise rounded-[calc(var(--ui-radius)*2)] bg-default p-5 ring ring-default shadow-xl shadow-black/5 sm:p-7 dark:shadow-black/20"
            style="--stagger: 3"
          >
            <MrrWaterfall :movement="heroMovement" variant="hero" />
            <p class="mt-6 border-t border-default pt-4 text-xs text-dimmed">
              {{ $t('marketing.hero.caption', { amount: fmt.currency(heroMovement.ending) }) }}
            </p>
          </div>
        </div>

        <div class="mt-14 border-t border-default pt-8 sm:mt-20">
          <p class="eyebrow text-dimmed">
            {{ $t('marketing.hero.usedBy') }}
          </p>
          <ul class="mt-4 flex flex-wrap gap-x-8 gap-y-3">
            <li v-for="name in usedBy" :key="name" class="font-mono text-sm text-muted">
              {{ name }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- ------------------------------------------------------------------ -->
    <!-- Capabilities                                                       -->
    <!-- ------------------------------------------------------------------ -->
    <section id="product" class="section-y border-b border-default scroll-mt-16">
      <div class="mx-auto max-w-(--ui-container) px-4 sm:px-6 lg:px-8">
        <div class="max-w-2xl">
          <p class="eyebrow text-primary">
            {{ $t('marketing.capabilities.eyebrow') }}
          </p>
          <h2 class="mt-3 font-display text-display-sm font-semibold text-highlighted sm:text-display-md">
            {{ $t('marketing.capabilities.title') }}
          </h2>
        </div>

        <div class="mt-10 grid gap-px overflow-hidden rounded-[calc(var(--ui-radius)*1.5)] bg-default ring ring-default sm:grid-cols-2">
          <div
            v-for="capability in capabilities"
            :key="capability.title"
            class="bg-default p-6 outline outline-default sm:p-8"
          >
            <UIcon :name="capability.icon" class="size-5 text-primary" />
            <h3 class="mt-4 text-base font-semibold text-highlighted">
              {{ capability.title }}
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-muted">
              {{ capability.body }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ------------------------------------------------------------------ -->
    <!-- How it works. Numbered because it genuinely is a sequence.         -->
    <!-- ------------------------------------------------------------------ -->
    <section id="how" class="section-y border-b border-default scroll-mt-16">
      <div class="mx-auto max-w-(--ui-container) px-4 sm:px-6 lg:px-8">
        <div class="max-w-2xl">
          <p class="eyebrow text-primary">
            {{ $t('marketing.how.eyebrow') }}
          </p>
          <h2 class="mt-3 font-display text-display-sm font-semibold text-highlighted sm:text-display-md">
            {{ $t('marketing.how.title') }}
          </h2>
        </div>

        <ol class="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
          <li v-for="(step, index) in steps" :key="step.title" class="border-t-2 border-primary pt-5">
            <span class="tnum text-sm font-semibold text-primary">
              {{ String(index + 1).padStart(2, '0') }}
            </span>
            <h3 class="mt-2 text-base font-semibold text-highlighted">
              {{ step.title }}
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-muted">
              {{ step.body }}
            </p>
          </li>
        </ol>
      </div>
    </section>

    <!-- ------------------------------------------------------------------ -->
    <!-- Proof                                                              -->
    <!-- ------------------------------------------------------------------ -->
    <section id="proof" class="section-y border-b border-default scroll-mt-16">
      <div class="mx-auto max-w-(--ui-container) px-4 sm:px-6 lg:px-8">
        <figure class="mx-auto max-w-3xl text-center">
          <blockquote class="font-display text-2xl font-medium leading-tight tracking-tight text-highlighted sm:text-display-sm">
            &ldquo;{{ $t('marketing.proof.quote') }}&rdquo;
          </blockquote>
          <figcaption class="mt-6 text-sm text-muted">
            <span class="font-medium text-highlighted">{{ $t('marketing.proof.author') }}</span>
            — {{ $t('marketing.proof.role') }}
          </figcaption>
        </figure>

        <dl class="mt-12 grid gap-8 border-t border-default pt-10 sm:grid-cols-3">
          <div v-for="item in proof" :key="item.figure">
            <dt class="tnum-display font-display text-display-sm font-semibold text-highlighted">
              {{ item.figure }}
            </dt>
            <dd class="mt-1.5 text-sm text-muted">
              {{ item.label }}
            </dd>
          </div>
        </dl>
      </div>
    </section>

    <!-- ------------------------------------------------------------------ -->
    <!-- Pricing                                                            -->
    <!-- ------------------------------------------------------------------ -->
    <section id="pricing" class="section-y border-b border-default scroll-mt-16">
      <div class="mx-auto max-w-(--ui-container) px-4 sm:px-6 lg:px-8">
        <div class="max-w-2xl">
          <p class="eyebrow text-primary">
            {{ $t('marketing.pricing.eyebrow') }}
          </p>
          <h2 class="mt-3 font-display text-display-sm font-semibold text-highlighted sm:text-display-md">
            {{ $t('marketing.pricing.title') }}
          </h2>
          <p class="mt-3 text-base text-muted">
            {{ $t('marketing.pricing.body') }}
          </p>
        </div>

        <div class="mt-10 grid gap-5 lg:grid-cols-3">
          <div
            v-for="tier in tiers"
            :key="tier.name"
            class="flex flex-col rounded-[calc(var(--ui-radius)*1.5)] p-6 sm:p-7"
            :class="tier.featured
              ? 'bg-default ring-2 ring-primary shadow-lg shadow-primary/5'
              : 'bg-default ring ring-default'"
          >
            <div class="flex items-center justify-between gap-3">
              <h3 class="text-base font-semibold text-highlighted">
                {{ tier.name }}
              </h3>
              <UBadge v-if="tier.featured" :label="$t('marketing.pricing.mostChosen')" variant="subtle" size="sm" />
            </div>

            <!-- Fixed height for a one- or two-line tagline, so the price and
                 the feature lists line up across all three cards. -->
            <p class="mt-1.5 min-h-10 text-sm text-muted">
              {{ tier.tagline }}
            </p>

            <p class="mt-5 flex flex-wrap items-baseline gap-x-1.5">
              <span class="tnum-display text-display-sm font-semibold text-highlighted">
                {{ fmt.currency(tier.price) }}
              </span>
              <span class="text-sm text-dimmed">{{ $t('marketing.pricing.perSeat') }}</span>
            </p>

            <ul class="mt-6 flex-1 space-y-2.5">
              <li v-for="feature in tier.features" :key="feature" class="flex gap-2.5 text-sm text-default">
                <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-primary" />
                {{ feature }}
              </li>
            </ul>

            <UButton
              :to="tier.featured || tier.cta === $t('marketing.startTrial') ? '/register' : '#faq'"
              :label="tier.cta"
              :variant="tier.featured ? 'solid' : 'subtle'"
              :color="tier.featured ? 'primary' : 'neutral'"
              size="lg"
              block
              class="mt-7"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- ------------------------------------------------------------------ -->
    <!-- FAQ                                                                -->
    <!-- ------------------------------------------------------------------ -->
    <section id="faq" class="section-y border-b border-default scroll-mt-16">
      <div class="mx-auto max-w-(--ui-container) px-4 sm:px-6 lg:px-8">
        <div class="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <!-- Sticky on desktop: the answer list is long, and a heading that
               scrolls away leaves a tall empty column beside it. -->
          <div class="lg:sticky lg:top-24 lg:self-start">
            <p class="eyebrow text-primary">
              {{ $t('marketing.faq.eyebrow') }}
            </p>
            <h2 class="mt-3 font-display text-display-sm font-semibold text-highlighted">
              {{ $t('marketing.faq.title') }}
            </h2>
          </div>

          <UAccordion :items="faqs" :ui="{ item: 'border-b border-default py-1' }" />
        </div>
      </div>
    </section>

    <!-- ------------------------------------------------------------------ -->
    <!-- Closing CTA                                                        -->
    <!-- ------------------------------------------------------------------ -->
    <section class="section-y">
      <div class="mx-auto max-w-(--ui-container) px-4 sm:px-6 lg:px-8">
        <div class="panel-ink rounded-[calc(var(--ui-radius)*2)] px-6 py-12 text-center sm:px-12 sm:py-16">
          <h2 class="mx-auto max-w-2xl font-display text-display-sm font-semibold text-white sm:text-display-md">
            {{ $t('marketing.cta.title') }}
          </h2>
          <p class="mx-auto mt-4 max-w-xl text-base text-slate-300">
            {{ $t('marketing.cta.body') }}
          </p>
          <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <UButton
              to="/register"
              :label="$t('marketing.hero.primary')"
              size="xl"
              block
              class="sm:w-auto"
            />
            <!-- The panel is dark in both themes, so this button is styled
                 against the panel rather than against the page. -->
            <UButton
              to="/login"
              :label="$t('marketing.hero.secondary')"
              size="xl"
              color="neutral"
              variant="ghost"
              block
              class="text-white ring-1 ring-inset ring-white/25 hover:bg-white/10 hover:text-white sm:w-auto"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
