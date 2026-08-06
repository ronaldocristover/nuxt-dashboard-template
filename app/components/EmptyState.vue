<script setup lang="ts">
/**
 * An empty screen is an invitation to act, so this always offers the next
 * step. Never used for errors — those carry their own recovery.
 */
withDefaults(defineProps<{
  icon?: string
  title: string
  description?: string
  actionLabel?: string
}>(), {
  icon: 'i-lucide-inbox'
})

defineEmits<{ action: [] }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center px-6 py-14 text-center">
    <div class="flex size-11 items-center justify-center rounded-full bg-elevated">
      <UIcon :name="icon" class="size-5 text-dimmed" />
    </div>
    <h3 class="mt-4 text-sm font-semibold text-highlighted">
      {{ title }}
    </h3>
    <p v-if="description" class="mt-1 max-w-sm text-sm text-muted">
      {{ description }}
    </p>
    <UButton
      v-if="actionLabel"
      :label="actionLabel"
      variant="subtle"
      class="mt-4"
      @click="$emit('action')"
    />
    <slot />
  </div>
</template>
