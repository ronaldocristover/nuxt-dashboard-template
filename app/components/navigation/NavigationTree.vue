<script setup lang="ts">
import { sampleNavTree } from '~/utils/sample-nav'

const collapsed = ref(false)
const tree = sampleNavTree()
</script>

<template>
  <PanelSection
    title="A three-level tree"
    description="The same data the sidebar renders. Open a group, then a section, to reach the links at level three."
  >
    <div class="flex items-center justify-between gap-3 pb-3">
      <p class="text-sm text-muted">
        Toggle the collapsed state to see what happens to a nested tree when the
        sidebar is narrowed to icons.
      </p>
      <USwitch v-model="collapsed" label="Collapsed" />
    </div>

    <!-- Rendered inside a fixed-width frame, because a nav tree only tells you
         the truth at the width it will actually live in. -->
    <div class="flex gap-4">
      <div
        class="shrink-0 rounded-[var(--ui-radius)] bg-elevated/40 p-2 ring ring-default transition-[width] duration-200"
        :class="collapsed ? 'w-14' : 'w-64'"
      >
        <UNavigationMenu
          :items="tree"
          :collapsed="collapsed"
          orientation="vertical"
          tooltip
          class="w-full"
        />
      </div>

      <div class="min-w-0 flex-1 space-y-2 text-sm text-muted">
        <p>
          <span class="font-medium text-highlighted">Level 1</span> — a group.
          Always visible, never a link. Clicking it opens the level below.
        </p>
        <p>
          <span class="font-medium text-highlighted">Level 2</span> — a section.
          Also not a link, for the same reason: a parent that both navigates and
          expands does two things on one click and gets one of them wrong.
        </p>
        <p>
          <span class="font-medium text-highlighted">Level 3</span> — the leaf.
          This is where <span class="font-mono text-xs">to</span> belongs.
        </p>
        <p v-if="collapsed" class="text-warning">
          Collapsed, only level 1 icons remain and the tooltip carries the label.
          A tree deeper than three levels has nowhere to go in this state, which
          is the practical reason for the ceiling.
        </p>
      </div>
    </div>
  </PanelSection>
</template>
