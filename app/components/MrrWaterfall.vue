<script setup lang="ts">
import type { MrrMovement } from '#shared/types'

/**
 * The template's signature element, used on the marketing hero and again as
 * the lead card on the dashboard.
 *
 * Four forces turn last month's MRR into this month's: new business and
 * expansion add, contraction and churn subtract. Segment widths are the
 * share of *total movement*, not of revenue — the question this answers is
 * "which force moved the number most", and absolute magnitude is what makes
 * that comparable.
 */
const props = withDefaults(defineProps<{
  movement: MrrMovement
  variant?: 'hero' | 'card'
}>(), {
  variant: 'card'
})

interface Segment {
  key: string
  label: string
  value: number
  color: string
  direction: 'up' | 'down'
}

const { t } = useI18n()
const fmt = useFormat()

const segments = computed<Segment[]>(() => [
  { key: 'new', label: t('waterfall.new'), value: props.movement.new, color: 'var(--cadence-new)', direction: 'up' },
  { key: 'expansion', label: t('waterfall.expansion'), value: props.movement.expansion, color: 'var(--cadence-expansion)', direction: 'up' },
  { key: 'contraction', label: t('waterfall.contraction'), value: -props.movement.contraction, color: 'var(--cadence-contraction)', direction: 'down' },
  { key: 'churn', label: t('waterfall.churn'), value: -props.movement.churn, color: 'var(--cadence-churn)', direction: 'down' }
])

const ariaLabel = computed(() => t('waterfall.aria', {
  new: fmt.value.signedCurrency(props.movement.new),
  expansion: fmt.value.signedCurrency(props.movement.expansion),
  contraction: fmt.value.signedCurrency(-props.movement.contraction),
  churn: fmt.value.signedCurrency(-props.movement.churn)
}))

const totalMovement = computed(() =>
  segments.value.reduce((sum, segment) => sum + Math.abs(segment.value), 0) || 1
)

const bars = computed(() => segments.value.map(segment => ({
  ...segment,
  share: Math.abs(segment.value) / totalMovement.value
})))

const net = computed(() => props.movement.ending - props.movement.starting)

const netPercent = computed(() =>
  props.movement.starting === 0 ? 0 : (net.value / props.movement.starting) * 100
)

/**
 * Segments grow from zero once, after mount. Gated on a flag rather than a
 * CSS animation so it does not replay on every reactive update, and the
 * reduced-motion rule in `main.css` collapses the duration to nothing.
 */
const grown = ref(false)
onMounted(() => requestAnimationFrame(() => {
  grown.value = true
}))

const hovered = ref<string | null>(null)
</script>

<template>
  <!-- `h-full` plus `justify-between` so the card fills its grid row instead
       of leaving a gap under the legend when a taller card sits beside it. -->
  <div class="flex h-full flex-col justify-between gap-5">
    <!-- Stacked below `sm`: the figure and the opening/closing pair are both
         set in monospace and will not fit one line on a phone. -->
    <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-x-6 sm:gap-y-2">
      <div>
        <p class="eyebrow text-dimmed">
          {{ $t('waterfall.eyebrow') }}
        </p>
        <div class="mt-1 flex items-baseline gap-2.5">
          <span
            class="tnum-display font-semibold text-highlighted"
            :class="variant === 'hero' ? 'text-display-sm sm:text-display-md' : 'text-2xl sm:text-3xl'"
          >
            {{ fmt.signedCurrency(net) }}
          </span>
          <span
            class="tnum inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium"
            :class="net >= 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'"
          >
            <UIcon :name="net >= 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'" class="size-3" />
            {{ fmt.signed(netPercent) }}
          </span>
        </div>
      </div>

      <dl class="flex items-end gap-4 sm:gap-5 sm:text-right">
        <div>
          <dt class="eyebrow text-dimmed">
            {{ $t('waterfall.opening') }}
          </dt>
          <dd class="tnum text-sm font-medium text-muted">
            {{ fmt.currency(movement.starting) }}
          </dd>
        </div>
        <UIcon name="i-lucide-arrow-right" class="mb-1 size-4 shrink-0 text-dimmed" />
        <div>
          <dt class="eyebrow text-dimmed">
            {{ $t('waterfall.closing') }}
          </dt>
          <dd class="tnum text-sm font-semibold text-highlighted">
            {{ fmt.currency(movement.ending) }}
          </dd>
        </div>
      </dl>
    </div>

    <!-- The bar itself. Gains on the left, losses on the right, so the
         balance between them is visible at a glance. -->
    <div
      class="flex w-full gap-1 overflow-hidden"
      :class="variant === 'hero' ? 'h-14 sm:h-16' : 'h-12'"
      role="img"
      :aria-label="ariaLabel"
      @pointerleave="hovered = null"
    >
      <div
        v-for="bar in bars"
        :key="bar.key"
        class="relative min-w-1 rounded-[3px] transition-[width,opacity] duration-700 ease-out"
        :style="{
          width: grown ? `${bar.share * 100}%` : '0%',
          background: bar.color,
          opacity: hovered === null || hovered === bar.key ? 1 : 0.4
        }"
        @pointerenter="hovered = bar.key"
      >
        <!-- Downward movement gets a hatch, so the two directions stay
             distinguishable without relying on colour alone. -->
        <div
          v-if="bar.direction === 'down'"
          class="absolute inset-0 rounded-[3px] opacity-30"
          style="background-image: repeating-linear-gradient(45deg, transparent 0 4px, rgb(0 0 0 / 0.5) 4px 8px)"
        />
      </div>
    </div>

    <dl
      class="grid gap-x-6 gap-y-3"
      :class="variant === 'hero' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 xl:grid-cols-4'"
    >
      <div
        v-for="bar in bars"
        :key="bar.key"
        class="min-w-0"
        @pointerenter="hovered = bar.key"
        @pointerleave="hovered = null"
      >
        <dt class="flex items-center gap-1.5 text-xs text-muted">
          <span class="size-2 shrink-0 rounded-sm" :style="{ background: bar.color }" />
          <span class="truncate">{{ bar.label }}</span>
        </dt>
        <dd class="tnum mt-0.5 text-sm font-semibold" :class="bar.direction === 'up' ? 'text-highlighted' : 'text-muted'">
          {{ fmt.signedCurrency(bar.value) }}
        </dd>
      </div>
    </dl>
  </div>
</template>
