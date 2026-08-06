<script setup lang="ts">
/**
 * One settings block: a title, a description of what the block controls, and
 * its fields. The description carries the explanation so individual fields do
 * not each need helper text.
 */
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <section class="rounded-[calc(var(--ui-radius)*1.5)] bg-default ring ring-default">
    <div class="border-b border-default px-4 py-4 sm:px-6">
      <h2 class="text-base font-semibold text-highlighted">
        {{ title }}
      </h2>
      <p v-if="description" class="mt-1 text-sm text-muted">
        {{ description }}
      </p>
    </div>

    <div class="px-4 py-5 sm:px-6">
      <slot />
    </div>

    <div v-if="$slots.footer" class="flex items-center justify-end gap-2 border-t border-default px-4 py-3 sm:px-6">
      <slot name="footer" />
    </div>
  </section>
</template>
