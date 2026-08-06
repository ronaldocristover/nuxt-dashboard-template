<script setup lang="ts">
/**
 * Shared shell for every chart: a titled header, an optional legend, and a
 * fixed-height plot area that renders a skeleton until the chart has been
 * measured on the client.
 *
 * Charts draw in pixel space, which means they cannot be drawn during SSR.
 * Reserving the height here keeps the layout from jumping when they appear.
 */
defineProps<{
  title: string
  subtitle?: string
  height?: number
}>()
</script>

<template>
  <div class="rounded-[calc(var(--ui-radius)*1.5)] ring ring-default bg-default">
    <div class="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
      <div class="min-w-0">
        <h3 class="text-sm font-semibold text-highlighted">
          {{ title }}
        </h3>
        <p v-if="subtitle" class="mt-0.5 text-xs text-muted">
          {{ subtitle }}
        </p>
      </div>
      <slot name="actions" />
    </div>

    <div class="px-1 pb-2 pt-3 sm:px-2 sm:pb-3">
      <ClientOnly>
        <slot />
        <template #fallback>
          <div
            class="mx-3 animate-pulse rounded-md bg-elevated"
            :style="{ height: `${height ?? 260}px` }"
          />
        </template>
      </ClientOnly>
    </div>

    <div v-if="$slots.footer" class="border-t border-default px-4 py-3 sm:px-5">
      <slot name="footer" />
    </div>
  </div>
</template>
