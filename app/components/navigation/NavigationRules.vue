<template>
  <PanelSection
    title="Rules for nesting"
    description="What keeps a nested sidebar navigable rather than a filing cabinet."
  >
    <ul class="divide-y divide-default">
      <li
        v-for="rule in [
          {
            title: 'Three levels, and no more',
            body: 'Each level costs indentation. By the fourth there is no width left for a label in a 240px sidebar. If you need a fourth, make the third a page with its own in-page navigation.'
          },
          {
            title: 'A parent expands, it does not navigate',
            body: 'Giving a branch both children and a `to` makes one click do two things, and people hit the wrong one. Only leaves get links.'
          },
          {
            title: 'Open the branch they are in',
            body: 'Use `defaultOpen` on the section that contains the current route. Landing on a page whose own place in the tree is collapsed makes the sidebar feel unrelated to the page.'
          },
          {
            title: 'Do not open everything',
            body: 'A tree that starts fully expanded is a wall of links. Open the one branch that matters and let the rest be discovered.'
          },
          {
            title: 'Collapsed means level one only',
            body: 'When the sidebar is icons-only, nested levels are unreachable. Every icon needs a tooltip, and nothing important should live exclusively at level three.'
          },
          {
            title: 'Depth is not a substitute for search',
            body: 'If people need three clicks to reach a common destination, the answer is a command palette, not another level.'
          }
        ]"
        :key="rule.title"
        class="py-4 first:pt-0 last:pb-0"
      >
        <h3 class="flex items-start gap-2 text-sm font-medium text-highlighted">
          <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-primary" />
          {{ rule.title }}
        </h3>
        <p class="mt-1 ps-6 text-sm text-muted">
          {{ rule.body }}
        </p>
      </li>
    </ul>
  </PanelSection>
</template>
