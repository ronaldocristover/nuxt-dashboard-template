<script setup lang="ts">
/**
 * One layout example: what it is, when to use it, the live grid, and the
 * exact classes that produce it.
 *
 * The `code` string is written by hand rather than derived, so it can drift
 * from the markup in the slot. Whenever you change one, change the other —
 * a reference whose snippet does not match what it renders is worse than
 * no reference.
 */
const props = defineProps<{
  title: string
  description?: string
  /** The container classes a reader would copy. */
  code: string
  /** Classes applied to individual children, when they carry the layout. */
  childCode?: string
}>()

const { notifySuccess } = useApiError()

const copied = ref(false)
let resetTimer: ReturnType<typeof setTimeout> | undefined

const snippet = computed(() =>
  props.childCode ? `${props.code}\n  └─ child: ${props.childCode}` : props.code
)

async function copy() {
  try {
    await navigator.clipboard.writeText(snippet.value)
    copied.value = true
    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Clipboard access is denied in some embedded contexts; say so rather
    // than showing a success state that did not happen.
    notifySuccess('Select and copy the classes below', 'Clipboard access was refused by the browser.')
  }
}

onBeforeUnmount(() => clearTimeout(resetTimer))
</script>

<template>
  <div class="py-6 first:pt-0 last:pb-0">
    <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div class="min-w-0">
        <h3 class="text-sm font-medium text-highlighted">
          {{ title }}
        </h3>
        <p v-if="description" class="mt-1 max-w-2xl text-sm text-muted">
          {{ description }}
        </p>
      </div>

      <UButton
        :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
        :label="copied ? 'Copied' : 'Copy classes'"
        :color="copied ? 'success' : 'neutral'"
        variant="ghost"
        size="xs"
        @click="copy"
      />
    </div>

    <div class="mt-4">
      <slot />
    </div>

    <div class="mt-3 overflow-x-auto rounded-[var(--ui-radius)] bg-elevated/60 px-3 py-2">
      <code class="whitespace-pre font-mono text-xs text-muted">{{ snippet }}</code>
    </div>
  </div>
</template>
