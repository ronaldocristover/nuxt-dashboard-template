<script setup lang="ts">
const snippet = `const tree: NavigationMenuItem[] = [{
  label: 'Reports',
  icon: 'i-lucide-folder',
  defaultOpen: true,          // open the branch holding the current route
  children: [{                // ── level 2
    label: 'Revenue',
    icon: 'i-lucide-banknote',
    children: [{              // ── level 3, and the deepest a link should go
      label: 'MRR movement',
      icon: 'i-lucide-git-compare-arrows',
      to: '/dashboard'        // only leaves carry \`to\`
    }]
  }]
}]`

const { notifySuccess } = useApiError()

async function copy() {
  try {
    await navigator.clipboard.writeText(snippet)
    notifySuccess('Copied')
  } catch {
    notifySuccess('Select and copy the snippet below')
  }
}
</script>

<template>
  <PanelSection
    title="The item shape"
    description="One recursive type all the way down — a child is just another item. The template keeps this tree in app/utils/sample-nav.ts so the sidebar and this page render the same data."
  >
    <div class="flex justify-end pb-2">
      <UButton
        label="Copy snippet"
        icon="i-lucide-copy"
        color="neutral"
        variant="ghost"
        size="xs"
        @click="copy"
      />
    </div>
    <pre class="overflow-x-auto rounded-[var(--ui-radius)] bg-elevated/60 p-4 font-mono text-xs text-muted">{{ snippet }}</pre>
  </PanelSection>
</template>
