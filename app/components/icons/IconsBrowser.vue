<script setup lang="ts">
/**
 * Searchable index of the two icon sets the template bundles.
 *
 * Names come from `/api/icons` rather than a client-side list — a few thousand
 * strings is more weight than the icons they describe. Results are capped
 * server-side, and the cap is stated in the interface rather than silently
 * truncating, so nobody concludes an icon does not exist.
 */
const { notifySuccess } = useApiError()

const set = ref<'lucide' | 'simple-icons'>('lucide')
const search = ref('')

/** One request per word, not per keystroke. */
const debounced = ref('')
let timer: ReturnType<typeof setTimeout> | undefined

watch(search, (value) => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    debounced.value = value
  }, 250)
})

onBeforeUnmount(() => clearTimeout(timer))

const { data, status } = await useApiFetch<{
  set: string
  total: number
  matched: number
  names: string[]
  truncated: boolean
}>(() => `/api/icons?set=${set.value}&q=${encodeURIComponent(debounced.value)}`, {
  watch: [set, debounced]
})

const pending = computed(() => status.value === 'pending')

function fullName(name: string) {
  return `i-${set.value}-${name}`
}

async function copy(name: string) {
  const value = fullName(name)
  try {
    await navigator.clipboard.writeText(value)
    notifySuccess('Copied', value)
  } catch {
    notifySuccess('Copy the name below', value)
  }
}

const SETS = [
  { label: 'Lucide', value: 'lucide' as const, hint: 'Interface icons' },
  { label: 'Simple Icons', value: 'simple-icons' as const, hint: 'Brand marks' }
]
</script>

<template>
  <PanelSection
    title="Find an icon"
    description="Both sets are installed and tree-shaken — only the icons you actually reference end up in the build. Click any icon to copy its full name."
  >
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
      <UFieldGroup>
        <UButton
          v-for="item in SETS"
          :key="item.value"
          :label="item.label"
          :color="set === item.value ? 'primary' : 'neutral'"
          :variant="set === item.value ? 'solid' : 'outline'"
          :aria-pressed="set === item.value"
          @click="set = item.value"
        />
      </UFieldGroup>

      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search by name — chart, user, arrow…"
        class="w-full sm:max-w-xs"
        :ui="{ trailing: 'pe-1' }"
      >
        <template v-if="search" #trailing>
          <UButton
            color="neutral"
            variant="link"
            size="sm"
            icon="i-lucide-x"
            aria-label="Clear search"
            @click="search = ''"
          />
        </template>
      </UInput>

      <p class="tnum text-xs text-dimmed sm:ms-auto">
        <template v-if="pending">
          Searching…
        </template>
        <template v-else-if="data">
          {{ data.matched }} of {{ data.total }}
          <span v-if="data.truncated"> · showing first {{ data.names.length }}</span>
        </template>
      </p>
    </div>

    <div v-if="pending" class="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-10">
      <div v-for="i in 40" :key="i" class="aspect-square animate-pulse rounded-[var(--ui-radius)] bg-elevated" />
    </div>

    <EmptyState
      v-else-if="!data?.names.length"
      icon="i-lucide-search-x"
      title="No icon matches that"
      description="Icon names use whole words — try “chart” rather than “graph”, or “trash” rather than “bin”."
      action-label="Clear search"
      @action="search = ''"
    />

    <div v-else class="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-10">
      <UTooltip v-for="name in data.names" :key="name" :text="fullName(name)" :delay-duration="300">
        <button
          type="button"
          class="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-[var(--ui-radius)] bg-elevated/50 p-1 text-dimmed transition-colors hover:bg-elevated hover:text-highlighted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :aria-label="`Copy ${fullName(name)}`"
          @click="copy(name)"
        >
          <UIcon :name="fullName(name)" class="size-5 shrink-0" />
          <span class="w-full truncate px-0.5 text-[9px] leading-tight">{{ name }}</span>
        </button>
      </UTooltip>
    </div>

    <p v-if="data?.truncated" class="mt-4 text-xs text-dimmed">
      More icons match than are shown. Narrow the search to see the rest — the list is capped so
      the page does not render a thousand SVGs at once.
    </p>
  </PanelSection>
</template>
