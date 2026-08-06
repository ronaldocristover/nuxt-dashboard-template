<script setup lang="ts">
import type { RadioGroupItem } from '@nuxt/ui'

const plan = ref('growth')
const account = ref('Northwind Labs')
const accounts = ref(['Northwind Labs', 'Kestrel Systems'])
const country = ref('Indonesia')
const cycle = ref('monthly')
const alerts = ref(['failed-payment', 'churn'])
const agreed = ref(true)
const digest = ref(true)
const token = ref('cad_live_8f2b')

const PLANS = [
  { label: 'Starter', value: 'starter' },
  { label: 'Growth', value: 'growth' },
  { label: 'Scale', value: 'scale' }
]

const ACCOUNTS = [
  'Northwind Labs', 'Kestrel Systems', 'Halcyon Group', 'Solstice Digital',
  'Inkwell Works', 'Bellweather Group', 'Riverbend Collective', 'Verdant Digital'
]

const COUNTRIES = [
  'Indonesia', 'Singapore', 'Malaysia', 'Japan', 'Australia',
  'Germany', 'Netherlands', 'United States', 'Brazil', 'Nigeria'
]

const CYCLES = ref<RadioGroupItem[]>([
  { label: 'Monthly', value: 'monthly', description: 'Billed on the first of each month. Cancel any time.' },
  { label: 'Annual', value: 'annual', description: 'Two months free. Charged once, up front.' },
  { label: 'Custom', value: 'custom', description: 'Agreed terms on an invoice. Talk to sales first.' }
])

const ALERTS = [
  { label: 'Failed payments', value: 'failed-payment' },
  { label: 'Cancellations', value: 'churn' },
  { label: 'New signups', value: 'signup' },
  { label: 'Plan upgrades', value: 'upgrade' }
]

const { notifySuccess } = useApiError()

function copyToken() {
  navigator.clipboard?.writeText(token.value)
  notifySuccess('Copied', 'The API token is on your clipboard.')
}
</script>

<template>
  <PanelSection
    title="Choosing from a set"
    description="Which control depends on how many options there are and whether more than one can be picked."
  >
    <div class="divide-y divide-default">
      <ReferenceRow title="Select" description="Up to about seven options that all fit on screen at once.">
        <USelect v-model="plan" :items="PLANS" class="w-full" />
      </ReferenceRow>

      <ReferenceRow title="Searchable select" description="Once a list is long enough to scroll, it needs a search box.">
        <USelectMenu
          v-model="account"
          :items="ACCOUNTS"
          searchable
          search-input-placeholder="Search accounts"
          class="w-full"
        />
      </ReferenceRow>

      <ReferenceRow title="Multiple selection" description="Chosen values stay visible in the trigger, so nothing is picked and then forgotten.">
        <USelectMenu
          v-model="accounts"
          :items="ACCOUNTS"
          multiple
          searchable
          class="w-full"
        />
      </ReferenceRow>

      <ReferenceRow title="Autocomplete" description="Type to filter, but any typed value is still accepted.">
        <UInputMenu v-model="country" :items="COUNTRIES" class="w-full" />
      </ReferenceRow>

      <ReferenceRow
        title="Radio group"
        description="One choice from a few, where the trade-off between them needs explaining."
        wide
      >
        <URadioGroup v-model="cycle" :items="CYCLES" variant="table" />
      </ReferenceRow>

      <ReferenceRow title="Checkbox group" description="Any number of independent options, including none.">
        <UCheckboxGroup v-model="alerts" :items="ALERTS" />
      </ReferenceRow>

      <ReferenceRow title="Single checkbox" description="For consent and acknowledgement, where the label is a sentence.">
        <UCheckbox v-model="agreed" label="Email me when an account at risk crosses $1,000 MRR" />
      </ReferenceRow>

      <ReferenceRow title="Switch" description="An immediate on/off setting. If it needs a save button, use a checkbox instead.">
        <USwitch v-model="digest" label="Weekly digest" description="Sent Monday at 09:00 in your timezone." />
      </ReferenceRow>

      <ReferenceRow title="Field group" description="Joins a field to the action that operates on it.">
        <UFieldGroup class="w-full">
          <UInput v-model="token" class="w-full tnum" readonly />
          <UButton
            color="neutral"
            variant="subtle"
            icon="i-lucide-clipboard"
            aria-label="Copy API token"
            @click="copyToken"
          />
        </UFieldGroup>
      </ReferenceRow>
    </div>
  </PanelSection>
</template>
