<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { CalendarDate } from '@internationalized/date'

/**
 * Everything above, wired together the way a real form is built: one Zod
 * schema drives validation, `UForm` maps each issue onto the field with the
 * matching `name`, and submit is blocked until the shape is valid.
 *
 * The schema lives here because this form is a demo. A form that posts to the
 * server belongs in `shared/schemas.ts`, so the route can validate the body
 * with the same rules.
 */
const schema = z.object({
  name: z
    .string()
    .min(3, 'Give the alert a name you will recognise in Slack')
    .max(60, 'Keep it under 60 characters'),
  trigger: z.enum(['payment-failed', 'mrr-drop', 'churn-spike']),
  threshold: z
    .number()
    .min(1, 'A threshold of zero would fire on everything')
    .max(100_000, 'That is higher than any single account'),
  segments: z.array(z.string()).min(1, 'Pick at least one segment to watch'),
  channel: z.enum(['email', 'slack', 'both']),
  recipients: z
    .array(z.string().email('Every recipient must be a valid email address'))
    .min(1, 'Add at least one recipient'),
  startsOn: z.custom<CalendarDate>(value => value != null, 'Pick a start date'),
  active: z.boolean(),
  notes: z.string().max(280, 'Keep the note under 280 characters')
})

type Schema = z.output<typeof schema>

/**
 * `shallowReactive`, not `reactive`: deep reactivity rewrites the `CalendarDate`
 * class instance into a plain object, which loses its identity. Nothing here
 * is mutated in place — every control replaces its value outright — so shallow
 * tracking is both correct and cheaper.
 */
const state = shallowReactive<Partial<Schema>>({
  name: '',
  trigger: 'payment-failed',
  threshold: 1000,
  segments: ['Enterprise'],
  channel: 'slack',
  recipients: ['revenue@cadence.app'],
  startsOn: new CalendarDate(2026, 9, 1),
  active: true,
  notes: ''
})

const TRIGGERS = [
  { label: 'A payment fails', value: 'payment-failed', description: 'Fires the hour a charge is declined.' },
  { label: 'MRR drops', value: 'mrr-drop', description: 'Fires when an account contracts by more than the threshold.' },
  { label: 'Churn spikes', value: 'churn-spike', description: 'Fires when cancellations exceed the threshold in a week.' }
]

const SEGMENTS = ['Enterprise', 'Mid-market', 'Self-serve', 'APAC', 'EMEA', 'Americas', 'Trialing']

const CHANNELS = [
  { label: 'Email', value: 'email' },
  { label: 'Slack', value: 'slack' },
  { label: 'Email and Slack', value: 'both' }
]

const { notifySuccess } = useApiError()

const loading = ref(false)
const submitted = ref<Schema | null>(null)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true

  // Stands in for the POST. Replace with `$fetch('/api/alerts', …)`.
  await new Promise(resolve => setTimeout(resolve, 700))

  submitted.value = event.data
  loading.value = false

  const count = event.data.segments.length
  notifySuccess(
    'Alert created',
    `"${event.data.name}" is now watching ${count} ${count === 1 ? 'segment' : 'segments'}.`
  )
}

function reset() {
  submitted.value = null
  state.name = ''
  state.threshold = 1000
  state.segments = ['Enterprise']
  state.recipients = ['revenue@cadence.app']
  state.notes = ''
  state.active = true
}
</script>

<template>
  <UForm
    :schema="schema"
    :state="state"
    @submit="onSubmit"
  >
    <PanelSection
      title="A complete form"
      description="Validation, error mapping, a loading submit and a result. Try submitting with the name empty."
    >
      <div class="grid max-w-2xl gap-5">
        <UFormField
          label="Alert name"
          name="name"
          required
          help="Shown as the message title wherever the alert is delivered."
        >
          <UInput v-model="state.name" placeholder="Enterprise payment failures" class="w-full" />
        </UFormField>

        <UFormField label="Fire this alert when" name="trigger" required>
          <URadioGroup v-model="state.trigger" :items="TRIGGERS" variant="table" />
        </UFormField>

        <div class="grid gap-5 sm:grid-cols-2">
          <UFormField
            label="Threshold"
            name="threshold"
            required
            description="The alert stays quiet below this amount."
          >
            <UInputNumber
              v-model="state.threshold"
              :min="0"
              :step="100"
              class="w-full"
              :format-options="{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }"
            />
          </UFormField>

          <UFormField label="Starts on" name="startsOn" required>
            <UInputDate v-model="state.startsOn" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Segments to watch" name="segments" required>
          <USelectMenu
            v-model="state.segments"
            :items="SEGMENTS"
            multiple
            searchable
            class="w-full"
          />
        </UFormField>

        <div class="grid gap-5 sm:grid-cols-2">
          <UFormField label="Deliver by" name="channel" required>
            <USelect v-model="state.channel" :items="CHANNELS" class="w-full" />
          </UFormField>

          <UFormField
            label="Recipients"
            name="recipients"
            required
            hint="Press Enter to add"
          >
            <UInputTags v-model="state.recipients" placeholder="name@company.com" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Notes" name="notes" hint="Optional">
          <UTextarea
            v-model="state.notes"
            autoresize
            :rows="2"
            placeholder="What should whoever receives this do first?"
            class="w-full"
          />
        </UFormField>

        <UFormField name="active">
          <USwitch
            v-model="state.active"
            label="Enable straight away"
            description="Turn this off to create the alert without arming it."
          />
        </UFormField>
      </div>

      <!-- The result of a successful submit, so the demo has somewhere to
           land instead of just clearing itself. -->
      <div v-if="submitted" class="mt-6 rounded-[var(--ui-radius)] bg-elevated p-4">
        <p class="text-sm font-medium text-highlighted">
          Submitted payload
        </p>
        <pre class="mt-2 overflow-x-auto font-mono text-xs text-muted">{{ JSON.stringify(submitted, null, 2) }}</pre>
      </div>

      <template #footer>
        <UButton
          label="Reset"
          color="neutral"
          variant="ghost"
          @click="reset"
        />
        <UButton type="submit" label="Create alert" :loading="loading" />
      </template>
    </PanelSection>
  </UForm>
</template>
