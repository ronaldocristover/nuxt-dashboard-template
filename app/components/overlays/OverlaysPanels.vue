<script setup lang="ts">
const right = ref(false)
const left = ref(false)
const drawer = ref(false)

const SIDES = [
  { value: 'right' as const, label: 'right', note: 'Detail beside a list — the default.' },
  { value: 'left' as const, label: 'left', note: 'Filters and navigation.' },
  { value: 'top' as const, label: 'top', note: 'Search and command bars.' },
  { value: 'bottom' as const, label: 'bottom', note: 'Rarely — usually a drawer is better.' }
]

const side = ref<'right' | 'left' | 'top' | 'bottom'>('right')
const sideOpen = ref(false)

function show(next: typeof side.value) {
  side.value = next
  sideOpen.value = true
}
</script>

<template>
  <PanelSection
    title="Slideovers and drawers"
    description="A slideover keeps the page behind it visible, which is what makes it right for detail views: someone can read a row's detail while still seeing where it sat in the list."
  >
    <div class="divide-y divide-default">
      <ReferenceRow title="Detail slideover" description="The subscribers table uses exactly this. The list stays on screen, so closing the panel returns you to your place rather than to the top.">
        <UButton label="Open detail" variant="subtle" @click="right = true" />

        <USlideover v-model:open="right" title="Northwind Labs" description="Growth · 18 seats">
          <template #body>
            <dl class="divide-y divide-default border-y border-default">
              <div
                v-for="fact in [
                  { label: 'Plan', value: 'Growth' },
                  { label: 'MRR', value: '$522' },
                  { label: 'Seats', value: '18' },
                  { label: 'Country', value: 'Indonesia' }
                ]"
                :key="fact.label"
                class="flex items-baseline justify-between gap-4 py-3"
              >
                <dt class="text-sm text-muted">
                  {{ fact.label }}
                </dt>
                <dd class="tnum text-sm font-medium text-highlighted">
                  {{ fact.value }}
                </dd>
              </div>
            </dl>
          </template>
          <template #footer>
            <UButton
              label="Close"
              color="neutral"
              variant="subtle"
              block
              @click="right = false"
            />
          </template>
        </USlideover>
      </ReferenceRow>

      <ReferenceRow title="Which side" description="The side should match what the panel does. A filter panel sliding in from the right, away from the list it filters, makes the connection harder to see." wide>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="item in SIDES"
            :key="item.value"
            :label="item.label"
            color="neutral"
            variant="subtle"
            size="sm"
            @click="show(item.value)"
          />
        </div>
        <ul class="mt-3 space-y-1">
          <li v-for="item in SIDES" :key="item.value" class="text-xs text-dimmed">
            <span class="font-mono text-muted">{{ item.label }}</span> — {{ item.note }}
          </li>
        </ul>

        <USlideover v-model:open="sideOpen" :side="side" :title="`side=&quot;${side}&quot;`">
          <template #body>
            <p class="text-sm text-muted">
              {{ SIDES.find(item => item.value === side)?.note }}
            </p>
          </template>
        </USlideover>
      </ReferenceRow>

      <ReferenceRow title="Filter panel" description="On a phone this is how the subscribers filters would be presented rather than stacking four selects above the list.">
        <UButton
          label="Filters"
          icon="i-lucide-sliders-horizontal"
          color="neutral"
          variant="subtle"
          @click="left = true"
        />

        <USlideover v-model:open="left" side="left" title="Filters">
          <template #body>
            <div class="space-y-4">
              <UFormField label="Plan">
                <USelect :items="['All plans', 'Starter', 'Growth', 'Scale']" model-value="All plans" class="w-full" />
              </UFormField>
              <UFormField label="Status">
                <USelect :items="['All statuses', 'Active', 'Trialing', 'Churned']" model-value="All statuses" class="w-full" />
              </UFormField>
            </div>
          </template>
          <template #footer>
            <div class="flex w-full gap-2">
              <UButton label="Reset" color="neutral" variant="ghost" class="flex-1" />
              <UButton label="Apply" class="flex-1" @click="left = false" />
            </div>
          </template>
        </USlideover>
      </ReferenceRow>

      <ReferenceRow title="Drawer" description="Drags from the bottom with a grab handle. It reads as native on a phone, which a bottom slideover does not.">
        <UButton label="Open drawer" color="neutral" variant="subtle" @click="drawer = true" />

        <UDrawer v-model:open="drawer" title="Quick actions">
          <template #body>
            <div class="space-y-2 pb-4">
              <UButton
                label="Export this view"
                icon="i-lucide-download"
                variant="ghost"
                block
                class="justify-start"
              />
              <UButton
                label="Email the account"
                icon="i-lucide-mail"
                variant="ghost"
                block
                class="justify-start"
              />
              <UButton
                label="Open billing"
                icon="i-lucide-credit-card"
                variant="ghost"
                block
                class="justify-start"
              />
            </div>
          </template>
        </UDrawer>
      </ReferenceRow>
    </div>
  </PanelSection>
</template>
