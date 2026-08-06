<script setup lang="ts">
const toast = useToast()
const { notifySuccess, notify } = useApiError()

function plain() {
  toast.add({ title: 'Saved', icon: 'i-lucide-circle-check', color: 'success' })
}

function withAction() {
  toast.add({
    title: 'Subscriber archived',
    description: 'Riverbend Collective will not appear in the list.',
    icon: 'i-lucide-archive',
    color: 'neutral',
    actions: [{
      label: 'Undo',
      variant: 'subtle',
      onClick: () => notifySuccess('Restored', 'Riverbend Collective is back in the list.')
    }]
  })
}

function failure() {
  notify({ statusCode: 429 })
}

function persistent() {
  toast.add({
    title: 'Export running',
    description: 'This stays until it is dismissed — use it for work that outlives the page.',
    icon: 'i-lucide-loader-circle',
    color: 'info',
    duration: 0
  })
}
</script>

<template>
  <PanelSection
    title="Lightweight overlays"
    description="Everything that appears without taking the page over. The rule of thumb: the more it interrupts, the more it has to be worth interrupting for."
  >
    <div class="divide-y divide-default">
      <ReferenceRow title="Tooltip" description="For a label that does not fit, never for information someone needs. It cannot be reached by touch and disappears the moment you move.">
        <div class="flex flex-wrap gap-2">
          <UTooltip text="Refresh figures">
            <UButton icon="i-lucide-refresh-cw" color="neutral" variant="ghost" aria-label="Refresh figures" />
          </UTooltip>
          <UTooltip text="Committed revenue at the close of this month" :delay-duration="200">
            <UButton label="What is MRR?" color="neutral" variant="subtle" size="sm" />
          </UTooltip>
        </div>
      </ReferenceRow>

      <ReferenceRow title="Popover" description="Holds real content — a form, a colour picker, a date range. Unlike a tooltip it stays open and can be interacted with.">
        <UPopover>
          <UButton label="Pick a range" icon="i-lucide-calendar" color="neutral" variant="subtle" />
          <template #content>
            <div class="w-56 p-3">
              <p class="text-sm font-medium text-highlighted">
                Date range
              </p>
              <div class="mt-2 space-y-1">
                <UButton
                  v-for="range in ['Last 7 days', 'Last 30 days', 'Last 90 days']"
                  :key="range"
                  :label="range"
                  variant="ghost"
                  size="sm"
                  block
                  class="justify-start"
                />
              </div>
            </div>
          </template>
        </UPopover>
      </ReferenceRow>

      <ReferenceRow title="Dropdown menu" description="A list of actions. Keep destructive entries in their own group at the bottom, away from the ones people click often.">
        <UDropdownMenu
          :items="[
            [{ label: 'Open detail', icon: 'i-lucide-panel-right' }, { label: 'Copy account ID', icon: 'i-lucide-clipboard' }],
            [{ label: 'Export CSV', icon: 'i-lucide-download' }],
            [{ label: 'Archive', icon: 'i-lucide-archive', color: 'error' }]
          ]"
        >
          <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="ghost" aria-label="Row actions" />
        </UDropdownMenu>
      </ReferenceRow>

      <ReferenceRow title="Toast" description="Confirms something that already happened. If a person must act on it, it is not a toast — it is a modal or an inline message." wide>
        <div class="flex flex-wrap gap-2">
          <UButton
            label="Success"
            color="success"
            variant="subtle"
            size="sm"
            @click="plain"
          />
          <UButton
            label="With undo"
            color="neutral"
            variant="subtle"
            size="sm"
            @click="withAction"
          />
          <UButton
            label="Error"
            color="error"
            variant="subtle"
            size="sm"
            @click="failure"
          />
          <UButton
            label="Persistent"
            color="info"
            variant="subtle"
            size="sm"
            @click="persistent"
          />
        </div>
        <p class="mt-3 text-xs text-dimmed">
          Errors go through <span class="font-mono">useApiError()</span>, which maps a status code to
          translated copy — so a rate limit reads the same wherever it is thrown.
        </p>
      </ReferenceRow>

      <ReferenceRow title="Context menu" description="Right-click on the block below. Useful in dense tables, but only as a shortcut — never as the only route to an action.">
        <UContextMenu
          :items="[
            [{ label: 'Open detail', icon: 'i-lucide-panel-right' }, { label: 'Copy row', icon: 'i-lucide-clipboard' }],
            [{ label: 'Delete', icon: 'i-lucide-trash-2', color: 'error' }]
          ]"
        >
          <div class="flex h-20 items-center justify-center rounded-[var(--ui-radius)] border border-dashed border-accented text-xs text-dimmed">
            Right-click here
          </div>
        </UContextMenu>
      </ReferenceRow>
    </div>
  </PanelSection>
</template>
