<script setup lang="ts">
import type { MrrMovement } from '#shared/types'
import { formatCurrency } from '#shared/format'

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Revenue reporting for subscription businesses',
  description: 'Cadence breaks every month of recurring revenue into new business, expansion, contraction and churn — reconciled to the account and the invoice.',
  ogTitle: 'Cadence — know what moved your MRR',
  ogDescription: 'New business, expansion, contraction, churn. Every month, traced to the account that caused it.'
})

/**
 * Marketing figures are fixed on purpose. The hero is a claim about what the
 * product shows, so it should read identically to everyone.
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

const capabilities = [
  {
    icon: 'i-lucide-git-compare-arrows',
    title: 'Movement, not just totals',
    body: 'A total tells you where you landed. Cadence shows the four forces that got you there, each one traceable down to the subscription that moved.'
  },
  {
    icon: 'i-lucide-receipt-text',
    title: 'Reconciled to invoices',
    body: 'Every figure ties back to a settled invoice. When finance and growth disagree about MRR, there is a row to point at.'
  },
  {
    icon: 'i-lucide-radar',
    title: 'Retention by cohort',
    body: 'Watch each signup cohort hold or decay month over month, so a good quarter for acquisition never hides a bad one for retention.'
  },
  {
    icon: 'i-lucide-bell-ring',
    title: 'Alerts worth acting on',
    body: 'A failed payment on a $6,000 account and one on a $12 trial are not the same event. Cadence tells them apart before it tells you.'
  }
]

/** A real sequence, so the steps are numbered. */
const steps = [
  {
    title: 'Connect your billing',
    body: 'Point Cadence at Stripe, Chargebee, or your own subscriptions table. Historical invoices backfill in minutes.'
  },
  {
    title: 'Confirm your definitions',
    body: 'Decide what counts as expansion, when a trial becomes revenue, and how to treat annual prepayment. Cadence holds those rules for everyone.'
  },
  {
    title: 'Report the same number',
    body: 'Finance, growth and the board read from one dashboard. Month-end becomes a review, not a reconciliation.'
  }
]

const proof = [
  { figure: '4 days', label: 'cut from month-end close at Northwind Labs' },
  { figure: '106.4%', label: 'net revenue retention, visible daily instead of quarterly' },
  { figure: '1 source', label: 'for every MRR figure across finance, growth and the board' }
]

const tiers = [
  {
    name: 'Starter',
    price: 12,
    tagline: 'For a founder who needs the number to be right.',
    features: ['Up to 5 seats', 'MRR movement breakdown', '12 months of history', 'Weekly email digest'],
    cta: 'Start free trial',
    featured: false
  },
  {
    name: 'Growth',
    price: 29,
    tagline: 'For a revenue team that reports every week.',
    features: ['Up to 25 seats', 'Cohort retention', 'Unlimited history', 'Failed payment alerts', 'Slack delivery'],
    cta: 'Start free trial',
    featured: true
  },
  {
    name: 'Scale',
    price: 64,
    tagline: 'For finance teams who have to defend the figure.',
    features: ['Unlimited seats', 'Invoice-level audit trail', 'Custom revenue rules', 'SSO and SCIM', 'Named support engineer'],
    cta: 'Talk to sales',
    featured: false
  }
]

const faqs = [
  {
    label: 'Does Cadence replace our accounting system?',
    content: 'No. Cadence reads from billing and reports on recurring revenue. Your ledger stays where it is — Cadence just stops the two from disagreeing.'
  },
  {
    label: 'How long does setup take?',
    content: 'Connecting a billing provider takes a few minutes and backfill runs on historical invoices. Agreeing your revenue definitions is the part that takes a conversation, and it is the part worth spending time on.'
  },
  {
    label: 'What counts as expansion versus new business?',
    content: 'You decide, once. Seat increases, plan upgrades and add-on purchases can each be classified as expansion or as new business, and the choice applies everywhere so two reports never disagree.'
  },
  {
    label: 'Can we export the data?',
    content: 'Every view exports to CSV, and the API returns the same figures the dashboard shows. Nothing is trapped behind the interface.'
  },
  {
    label: 'Is there a free trial?',
    content: 'Fourteen days on the Growth plan, no card required. If your billing data is not connected by the end of it, the trial extends.'
  }
]
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
              Revenue operations
            </p>

            <h1
              class="rise mt-4 font-display text-display-sm font-semibold text-highlighted sm:text-display-md lg:text-display-lg"
              style="--stagger: 1"
            >
              Your MRR moved. Cadence tells you which four things moved it.
            </h1>

            <p class="rise mt-5 max-w-xl text-base text-muted sm:text-lg" style="--stagger: 2">
              New business, expansion, contraction, churn. Every month, reconciled to
              the account and the invoice — so the number in your board deck is one
              you can defend.
            </p>

            <div class="rise mt-8 flex flex-col gap-3 sm:flex-row" style="--stagger: 3">
              <UButton
                to="/register"
                label="Start free trial"
                size="xl"
                trailing-icon="i-lucide-arrow-right"
                block
                class="sm:w-auto"
              />
              <UButton
                to="/login"
                label="Open the live dashboard"
                size="xl"
                color="neutral"
                variant="subtle"
                block
                class="sm:w-auto"
              />
            </div>

            <p class="rise mt-4 text-xs text-dimmed" style="--stagger: 4">
              14 days on Growth. No card, no sales call.
            </p>
          </div>

          <!-- The signature element, in its largest form. -->
          <div
            class="rise rounded-[calc(var(--ui-radius)*2)] bg-default p-5 ring ring-default shadow-xl shadow-black/5 sm:p-7 dark:shadow-black/20"
            style="--stagger: 3"
          >
            <MrrWaterfall :movement="heroMovement" variant="hero" />
            <p class="mt-6 border-t border-default pt-4 text-xs text-dimmed">
              March 2026 · 148 subscriptions · reconciled against
              {{ formatCurrency(heroMovement.ending) }} of settled invoices
            </p>
          </div>
        </div>

        <div class="mt-14 border-t border-default pt-8 sm:mt-20">
          <p class="eyebrow text-dimmed">
            Reporting on recurring revenue at
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
            What you get
          </p>
          <h2 class="mt-3 font-display text-display-sm font-semibold text-highlighted sm:text-display-md">
            Built for the meeting where the number gets questioned
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
            How it works
          </p>
          <h2 class="mt-3 font-display text-display-sm font-semibold text-highlighted sm:text-display-md">
            Three steps, in this order
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
            &ldquo;Month-end used to be three people rebuilding the same spreadsheet.
            Now it is one dashboard and a fifteen-minute conversation about what to
            do next.&rdquo;
          </blockquote>
          <figcaption class="mt-6 text-sm text-muted">
            <span class="font-medium text-highlighted">Hana Nakamura</span>
            — VP Finance, Northwind Labs
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
            Pricing
          </p>
          <h2 class="mt-3 font-display text-display-sm font-semibold text-highlighted sm:text-display-md">
            Priced per seat, billed monthly
          </h2>
          <p class="mt-3 text-base text-muted">
            Every plan reports on unlimited revenue. You pay for the people reading it.
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
              <UBadge v-if="tier.featured" label="Most chosen" variant="subtle" size="sm" />
            </div>

            <!-- Fixed height for a one- or two-line tagline, so the price and
                 the feature lists line up across all three cards. -->
            <p class="mt-1.5 min-h-10 text-sm text-muted">
              {{ tier.tagline }}
            </p>

            <p class="mt-5 flex items-baseline gap-1.5">
              <span class="tnum-display text-display-sm font-semibold text-highlighted">${{ tier.price }}</span>
              <span class="text-sm text-dimmed">per seat / month</span>
            </p>

            <ul class="mt-6 flex-1 space-y-2.5">
              <li v-for="feature in tier.features" :key="feature" class="flex gap-2.5 text-sm text-default">
                <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-primary" />
                {{ feature }}
              </li>
            </ul>

            <UButton
              :to="tier.cta === 'Talk to sales' ? '#faq' : '/register'"
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
              Questions
            </p>
            <h2 class="mt-3 font-display text-display-sm font-semibold text-highlighted">
              Before you start
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
            Find out what actually moved last month
          </h2>
          <p class="mx-auto mt-4 max-w-xl text-base text-slate-300">
            Connect billing, agree your definitions, and stop rebuilding the
            spreadsheet.
          </p>
          <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <UButton
              to="/register"
              label="Start free trial"
              size="xl"
              block
              class="sm:w-auto"
            />
            <!-- The panel is dark in both themes, so this button is styled
                 against the panel rather than against the page. -->
            <UButton
              to="/login"
              label="Open the live dashboard"
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
