<script setup lang="ts">
import { z } from 'zod'
import type { StepperItem } from '@nuxt/ui'

/**
 * A four-step onboarding flow.
 *
 * The rule that makes a wizard work: **each step validates only its own
 * fields.** One giant schema validated on every step would flag "company is
 * required" while someone is still on the account step, which reads as the
 * form being broken rather than incomplete.
 *
 * So there is a schema per step, and one derived schema for the final submit.
 * Nothing can be skipped, but going back is always free and never loses input.
 */

const { notifySuccess } = useApiError()

const accountSchema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().min(1, 'Enter your email address').email('That does not look like an email address'),
  company: z.string().min(2, 'Enter your company name')
})

const planSchema = z.object({
  plan: z.enum(['starter', 'growth', 'scale']),
  seats: z.number().int().min(1, 'At least one seat').max(500, 'Talk to sales above 500 seats'),
  cycle: z.enum(['monthly', 'annual'])
})

const teamSchema = z.object({
  // Optional by design — a wizard that will not let you skip an optional step
  // is just a form with extra clicks.
  invites: z.array(z.string().email('Every invite must be a valid email address')),
  role: z.enum(['admin', 'member'])
})

const STEP_SCHEMAS = [accountSchema, planSchema, teamSchema] as const

type Draft = z.infer<typeof accountSchema> & z.infer<typeof planSchema> & z.infer<typeof teamSchema>

const draft = reactive<Draft>({
  name: '',
  email: '',
  company: '',
  plan: 'growth',
  seats: 5,
  cycle: 'monthly',
  invites: [],
  role: 'member'
})

const current = ref(0)
const submitting = ref(false)
const done = ref(false)

/** Field-level errors for the step on screen. Cleared whenever the step changes. */
const errors = ref<Record<string, string>>({})

watch(current, () => {
  errors.value = {}
})

const items = computed<StepperItem[]>(() => [
  { title: 'Account', description: 'Who you are', icon: 'i-lucide-user' },
  { title: 'Plan', description: 'What you need', icon: 'i-lucide-credit-card' },
  { title: 'Team', description: 'Who else', icon: 'i-lucide-users' },
  { title: 'Review', description: 'Confirm and finish', icon: 'i-lucide-check' }
])

const isLastInput = computed(() => current.value === STEP_SCHEMAS.length - 1)
const isReview = computed(() => current.value === STEP_SCHEMAS.length)

/** Validates the current step and reports which fields failed. */
function validateStep(index: number): boolean {
  const schema = STEP_SCHEMAS[index]
  if (!schema) return true

  const result = schema.safeParse(draft)
  if (result.success) {
    errors.value = {}
    return true
  }

  const next: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = String(issue.path[0])
    // Keep the first message per field — a stack of them under one input is noise.
    if (!next[key]) next[key] = issue.message
  }
  errors.value = next
  return false
}

function back() {
  if (current.value > 0) current.value--
}

function next() {
  if (!validateStep(current.value)) return
  current.value++
}

/**
 * Jumping via the stepper is allowed backwards only. Letting someone click
 * ahead to Review would show them a summary built from fields they have not
 * filled in.
 */
function onStepChange(index: number) {
  if (index < current.value) current.value = index
}

const PLAN_PRICES = { starter: 12, growth: 29, scale: 64 } as const

const monthly = computed(() => draft.seats * PLAN_PRICES[draft.plan])
const total = computed(() => (draft.cycle === 'annual' ? monthly.value * 10 : monthly.value))

const fmt = useFormat()

const PLAN_ITEMS = [
  { label: 'Starter', value: 'starter', description: '$12 per seat — for a founder who needs the number to be right.' },
  { label: 'Growth', value: 'growth', description: '$29 per seat — for a revenue team that reports every week.' },
  { label: 'Scale', value: 'scale', description: '$64 per seat — for finance teams who defend the figure.' }
]

const CYCLE_ITEMS = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Annual — two months free', value: 'annual' }
]

const ROLE_ITEMS = [
  { label: 'Member — can read every report', value: 'member' },
  { label: 'Admin — can also manage the team and billing', value: 'admin' }
]

async function submit() {
  // Re-run every step, not just the last. Someone can edit an earlier step
  // after reaching Review, and the summary must not be the only thing checked.
  for (let index = 0; index < STEP_SCHEMAS.length; index++) {
    if (!validateStep(index)) {
      current.value = index
      return
    }
  }

  submitting.value = true
  await new Promise(resolve => setTimeout(resolve, 900))
  submitting.value = false
  done.value = true
  notifySuccess('Workspace created', `${draft.company} is ready.`)
}

function restart() {
  Object.assign(draft, {
    name: '',
    email: '',
    company: '',
    plan: 'growth',
    seats: 5,
    cycle: 'monthly',
    invites: [],
    role: 'member'
  })
  errors.value = {}
  current.value = 0
  done.value = false
}

const summary = computed(() => [
  { label: 'Name', value: draft.name, step: 0 },
  { label: 'Email', value: draft.email, step: 0 },
  { label: 'Company', value: draft.company, step: 0 },
  { label: 'Plan', value: PLAN_ITEMS.find(item => item.value === draft.plan)?.label ?? '', step: 1 },
  { label: 'Seats', value: String(draft.seats), step: 1 },
  { label: 'Billing', value: draft.cycle === 'annual' ? 'Annual' : 'Monthly', step: 1 },
  {
    label: 'Invites',
    value: draft.invites.length ? `${draft.invites.length} pending` : 'None',
    step: 2
  }
])
</script>

<template>
  <PanelSection
    title="Onboarding wizard"
    description="Four steps, each validating only its own fields. Try pressing Continue with the form empty — the error appears on the step you are on, not on fields you have not reached."
  >
    <!-- Success replaces the wizard rather than sitting under it. Leaving the
         form on screen after submitting invites a second submission. -->
    <div v-if="done" class="py-6 text-center">
      <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-success/10">
        <UIcon name="i-lucide-check" class="size-6 text-success" />
      </div>
      <h3 class="mt-4 font-display text-lg font-semibold text-highlighted">
        {{ draft.company }} is ready
      </h3>
      <p class="mx-auto mt-1 max-w-sm text-sm text-muted">
        {{ fmt.currency(total) }} {{ draft.cycle === 'annual' ? 'per year' : 'per month' }} ·
        {{ draft.seats }} {{ draft.seats === 1 ? 'seat' : 'seats' }} on
        {{ PLAN_ITEMS.find(item => item.value === draft.plan)?.label }}
      </p>
      <UButton label="Run it again" variant="subtle" class="mt-5" @click="restart" />
    </div>

    <div v-else>
      <UStepper
        :model-value="current"
        :items="items"
        class="w-full"
        :ui="{ root: 'gap-6' }"
        @update:model-value="value => onStepChange(Number(value))"
      />

      <div class="mt-6 min-h-64">
        <!-- Step 1 — account -->
        <div v-if="current === 0" class="grid max-w-lg gap-4">
          <UFormField label="Full name" required :error="errors.name">
            <UInput v-model="draft.name" placeholder="Amara Adeyemi" class="w-full" autofocus />
          </UFormField>
          <UFormField label="Work email" required :error="errors.email">
            <UInput v-model="draft.email" type="email" placeholder="you@company.com" class="w-full" />
          </UFormField>
          <UFormField label="Company" required :error="errors.company">
            <UInput v-model="draft.company" placeholder="Northwind Labs" class="w-full" />
          </UFormField>
        </div>

        <!-- Step 2 — plan -->
        <div v-else-if="current === 1" class="grid max-w-xl gap-5">
          <UFormField label="Plan" required :error="errors.plan">
            <URadioGroup v-model="draft.plan" :items="PLAN_ITEMS" variant="table" />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Seats" required :error="errors.seats">
              <UInputNumber v-model="draft.seats" :min="1" :max="500" class="w-full" />
            </UFormField>
            <UFormField label="Billing cycle" required :error="errors.cycle">
              <USelect v-model="draft.cycle" :items="CYCLE_ITEMS" class="w-full" />
            </UFormField>
          </div>

          <!-- Running total, updated as they choose. Showing the price only at
               the end is how people end up surprised at checkout. -->
          <div class="flex items-baseline justify-between rounded-[var(--ui-radius)] bg-elevated px-4 py-3">
            <span class="text-sm text-muted">
              {{ draft.seats }} × {{ fmt.currency(PLAN_PRICES[draft.plan]) }}
              {{ draft.cycle === 'annual' ? '× 10 months' : '' }}
            </span>
            <span class="tnum text-lg font-semibold text-highlighted">
              {{ fmt.currency(total) }}
              <span class="text-xs font-normal text-dimmed">
                {{ draft.cycle === 'annual' ? '/ year' : '/ month' }}
              </span>
            </span>
          </div>
        </div>

        <!-- Step 3 — team -->
        <div v-else-if="current === 2" class="grid max-w-lg gap-4">
          <UFormField
            label="Invite teammates"
            hint="Optional"
            help="Press Enter after each address. You can do this later from Settings."
            :error="errors.invites"
          >
            <UInputTags v-model="draft.invites" placeholder="teammate@company.com" class="w-full" />
          </UFormField>

          <UFormField label="Their role" :error="errors.role">
            <USelect v-model="draft.role" :items="ROLE_ITEMS" class="w-full" />
          </UFormField>
        </div>

        <!-- Step 4 — review -->
        <div v-else class="max-w-lg">
          <dl class="divide-y divide-default border-y border-default">
            <div v-for="row in summary" :key="row.label" class="flex items-baseline justify-between gap-4 py-3">
              <dt class="text-sm text-muted">
                {{ row.label }}
              </dt>
              <dd class="flex items-baseline gap-3">
                <span class="text-sm font-medium text-highlighted">{{ row.value || '—' }}</span>
                <!-- Every summary line links back to the step that owns it, so
                     fixing a typo is one click rather than four Backs. -->
                <UButton
                  label="Edit"
                  variant="link"
                  color="neutral"
                  size="xs"
                  :aria-label="`Edit ${row.label}`"
                  @click="current = row.step"
                />
              </dd>
            </div>
          </dl>

          <div class="mt-4 flex items-baseline justify-between rounded-[var(--ui-radius)] bg-elevated px-4 py-3">
            <span class="text-sm text-muted">Due today</span>
            <span class="tnum text-lg font-semibold text-highlighted">{{ fmt.currency(total) }}</span>
          </div>
        </div>
      </div>

      <div class="mt-6 flex items-center justify-between gap-3 border-t border-default pt-4">
        <UButton
          label="Back"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          :disabled="current === 0 || submitting"
          @click="back"
        />

        <div class="flex items-center gap-3">
          <span class="tnum text-xs text-dimmed">
            Step {{ current + 1 }} of {{ items.length }}
          </span>
          <UButton
            v-if="!isReview"
            :label="isLastInput ? 'Review' : 'Continue'"
            trailing-icon="i-lucide-arrow-right"
            @click="next"
          />
          <UButton
            v-else
            label="Create workspace"
            :loading="submitting"
            @click="submit"
          />
        </div>
      </div>
    </div>
  </PanelSection>
</template>
