<script setup lang="ts">
import type { StepperItem } from '@nuxt/ui'

const horizontal = ref(1)
const vertical = ref(1)

const items: StepperItem[] = [
  { title: 'Connect', description: 'Point at your billing provider', icon: 'i-lucide-plug' },
  { title: 'Define', description: 'Agree what counts as expansion', icon: 'i-lucide-scale' },
  { title: 'Report', description: 'One number for everyone', icon: 'i-lucide-chart-line' }
]

const progress = ref(2)
</script>

<template>
  <PanelSection
    title="Progress patterns"
    description="How far along someone is, shown three ways. Pick by how much room you have and how much the step names matter."
  >
    <div class="divide-y divide-default">
      <ReferenceRow title="Horizontal stepper" description="The default. Names and descriptions are visible at every step, which sets expectations about how long this will take." wide>
        <UStepper v-model="horizontal" :items="items" class="w-full" />
      </ReferenceRow>

      <ReferenceRow title="Vertical stepper" description="For a narrow column, or when each step needs its own body of content beneath the title." wide>
        <UStepper v-model="vertical" :items="items" orientation="vertical" class="w-full" />
      </ReferenceRow>

      <ReferenceRow title="Bare progress" description="When the steps have no names worth showing — an upload, a migration. A bar with a count says everything a stepper would.">
        <div class="w-full">
          <div class="flex items-baseline justify-between">
            <span class="text-sm text-default">Backfilling invoices</span>
            <span class="tnum text-sm text-muted">{{ progress }} of 4</span>
          </div>
          <UProgress :model-value="progress" :max="4" class="mt-2" />
          <div class="mt-3 flex gap-2">
            <UButton
              label="−"
              color="neutral"
              variant="subtle"
              size="xs"
              :disabled="progress === 0"
              @click="progress--"
            />
            <UButton
              label="+"
              color="neutral"
              variant="subtle"
              size="xs"
              :disabled="progress === 4"
              @click="progress++"
            />
          </div>
        </div>
      </ReferenceRow>
    </div>
  </PanelSection>
</template>
