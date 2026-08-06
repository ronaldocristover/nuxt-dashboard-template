<template>
  <PanelSection
    title="UTable or hand-built markup"
    description="This template ships both, on purpose. They solve different problems, and picking the wrong one is the most expensive table decision you will make."
  >
    <div class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-[var(--ui-radius)] bg-elevated/40 p-4 ring ring-default">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-highlighted">
          <UIcon name="i-lucide-table" class="size-4 text-primary" />
          UTable
        </h3>
        <p class="mt-1.5 text-sm text-muted">
          Used by the page you are reading.
        </p>
        <ul class="mt-3 space-y-1.5 text-sm">
          <li
            v-for="point in [
              'Sorting, selection, expansion and column visibility for free',
              'Column definitions live in one array — easy to reorder or extend',
              'Best for internal tools and dense, wide datasets'
            ]"
            :key="point"
            class="flex gap-2 text-muted"
          >
            <UIcon name="i-lucide-plus" class="mt-0.5 size-3.5 shrink-0 text-success" />
            {{ point }}
          </li>
          <li
            v-for="point in [
              'A table cannot reflow — small screens get horizontal scroll',
              'Cell content is written as render functions, not template markup'
            ]"
            :key="point"
            class="flex gap-2 text-muted"
          >
            <UIcon name="i-lucide-minus" class="mt-0.5 size-3.5 shrink-0 text-warning" />
            {{ point }}
          </li>
        </ul>
      </div>

      <div class="rounded-[var(--ui-radius)] bg-elevated/40 p-4 ring ring-default">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-highlighted">
          <UIcon name="i-lucide-layout-list" class="size-4 text-primary" />
          Hand-built markup
        </h3>
        <p class="mt-1.5 text-sm text-muted">
          Used by <span class="font-mono text-xs">/dashboard/subscribers</span>.
        </p>
        <ul class="mt-3 space-y-1.5 text-sm">
          <li
            v-for="point in [
              'Becomes a stacked card list below lg — no sideways scrolling on a phone',
              'Cells are ordinary template markup, so slots and transitions just work',
              'Best for anything customer-facing'
            ]"
            :key="point"
            class="flex gap-2 text-muted"
          >
            <UIcon name="i-lucide-plus" class="mt-0.5 size-3.5 shrink-0 text-success" />
            {{ point }}
          </li>
          <li
            v-for="point in [
              'Sorting, selection and pagination are yours to write',
              'Two layouts to keep in sync when a column changes'
            ]"
            :key="point"
            class="flex gap-2 text-muted"
          >
            <UIcon name="i-lucide-minus" class="mt-0.5 size-3.5 shrink-0 text-warning" />
            {{ point }}
          </li>
        </ul>
      </div>
    </div>

    <div class="mt-4 flex gap-2.5 rounded-[var(--ui-radius)] bg-primary/5 p-4 ring ring-primary/20">
      <UIcon name="i-lucide-lightbulb" class="mt-0.5 size-4 shrink-0 text-primary" />
      <p class="text-sm text-default">
        <span class="font-medium text-highlighted">The deciding question is the phone.</span>
        If a customer will open this on one, hand-build it and reflow to cards. If it is an
        internal tool on a laptop with fifteen columns, reach for UTable and let it scroll.
      </p>
    </div>
  </PanelSection>
</template>
