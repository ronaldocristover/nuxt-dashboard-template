<template>
  <PanelSection
    title="In context"
    description="Where this template already uses icons, and the rule each one follows."
  >
    <div class="divide-y divide-default">
      <ReferenceRow title="Navigation" description="One icon per destination, from the same set, at the same weight. Mixing sets in a sidebar is the fastest way to make an app look assembled rather than designed.">
        <div class="space-y-1">
          <div
            v-for="item in [
              { icon: 'i-lucide-layout-dashboard', label: 'Overview' },
              { icon: 'i-lucide-chart-line', label: 'Analytics' },
              { icon: 'i-lucide-users', label: 'Subscribers' }
            ]"
            :key="item.label"
            class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-default hover:bg-elevated"
          >
            <UIcon :name="item.icon" class="size-5 text-dimmed" />
            {{ item.label }}
          </div>
        </div>
      </ReferenceRow>

      <ReferenceRow title="Status" description="Colour carries the meaning and the icon reinforces it, so the state survives greyscale printing and colour blindness.">
        <div class="flex flex-wrap gap-2">
          <UBadge icon="i-lucide-circle-check" label="Paid" color="success" variant="subtle" />
          <UBadge icon="i-lucide-clock" label="Open" color="neutral" variant="subtle" />
          <UBadge icon="i-lucide-circle-x" label="Failed" color="error" variant="subtle" />
        </div>
      </ReferenceRow>

      <ReferenceRow title="Direction of travel" description="Up and down arrows are read as good and bad. Pick the arrow from what the number means, not from which way it moved.">
        <div class="flex flex-wrap gap-5">
          <span class="tnum inline-flex items-center gap-1 text-sm font-medium text-success">
            <UIcon name="i-lucide-arrow-up-right" class="size-4" />
            +4.0% revenue
          </span>
          <span class="tnum inline-flex items-center gap-1 text-sm font-medium text-success">
            <UIcon name="i-lucide-arrow-down-right" class="size-4" />
            −12.5% churn
          </span>
        </div>
      </ReferenceRow>

      <ReferenceRow title="Empty states" description="One large, quiet icon. It sets the tone without competing with the sentence that tells someone what to do next.">
        <div class="rounded-[var(--ui-radius)] ring ring-default">
          <EmptyState
            icon="i-lucide-inbox"
            title="No invoices yet"
            description="They will appear here once your billing provider is connected."
            action-label="Connect billing"
          />
        </div>
      </ReferenceRow>

      <ReferenceRow title="Brand marks" description="Simple Icons carries the logos. Use them only for real third-party products — a brand mark standing in for a generic concept misleads.">
        <div class="flex flex-wrap gap-2">
          <UButton icon="i-simple-icons-google" label="Google" color="neutral" variant="subtle" />
          <UButton icon="i-simple-icons-github" label="GitHub" color="neutral" variant="subtle" />
          <UButton icon="i-simple-icons-slack" label="Slack" color="neutral" variant="subtle" />
          <UButton icon="i-simple-icons-stripe" label="Stripe" color="neutral" variant="subtle" />
        </div>
      </ReferenceRow>
    </div>
  </PanelSection>
</template>
