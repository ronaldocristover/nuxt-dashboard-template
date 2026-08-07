<script setup lang="ts">
import { createMemberSchema } from '#shared/schemas'
import type { MemberRole } from '#shared/types'
import type { MemberFormState } from '~/composables/useMemberMeta'

/**
 * The add and edit forms are the same form.
 *
 * They collect identical fields, so a second copy would only be the thing that
 * drifts. What differs is supplied by the caller: the heading, the submit
 * label, and whether the role select is locked because this is the only owner.
 */

/**
 * The state is a model, not a prop.
 *
 * The fields write back as you type, and a prop that a child mutates is exactly
 * what `vue/no-mutating-props` exists to stop. As a model the ownership is
 * explicit: the page holds the object, this component edits it.
 */
const state = defineModel<MemberFormState>({ required: true })

const props = defineProps<{
  submitLabel: string
  submitting?: boolean
  /** False when this member is the only owner — the role select locks. */
  canChangeRole?: boolean
  cancelTo: string
}>()

const emit = defineEmits<{ submit: [] }>()

const { t } = useI18n()
const meta = useMemberMeta()

// The client passes `t`, so the reader sees validation messages in their own
// language. The server calls the same factory with no argument.
const schema = computed(() => createMemberSchema(t))

const roleLocked = computed(() => props.canChangeRole === false)

/**
 * A locked select still has to show the current value, so it is rendered
 * disabled rather than removed — a role that vanishes while you edit reads as
 * a bug, and the explanation next to it is the actual answer.
 */
const roleOptions = computed(() =>
  meta.value.roleOptions.map(option => ({
    ...option,
    disabled: roleLocked.value && option.value !== state.value.role
  }))
)

/** A short, honest list. Not every IANA zone — a search box over 400 entries. */
const TIMEZONES = [
  'UTC',
  'Africa/Lagos',
  'America/Los_Angeles',
  'America/New_York',
  'America/Sao_Paulo',
  'Asia/Jakarta',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Europe/Berlin',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Oslo',
  'Europe/Paris',
  'Europe/Rome'
]

function describeRole(role: MemberRole) {
  return meta.value.roleHint(role)
}
</script>

<template>
  <UForm
    :schema="schema"
    :state="state"
    class="space-y-4"
    @submit="emit('submit')"
  >
    <PanelSection :title="$t('members.form.identity')">
      <div class="grid max-w-2xl gap-4 sm:grid-cols-2">
        <UFormField :label="$t('members.form.name')" name="name" required>
          <UInput
            v-model="state.name"
            :placeholder="$t('members.form.namePlaceholder')"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField
          :label="$t('members.form.email')"
          name="email"
          required
          :help="$t('members.form.emailHint')"
        >
          <UInput
            v-model="state.email"
            type="email"
            :placeholder="$t('members.form.emailPlaceholder')"
            class="w-full"
          />
        </UFormField>
      </div>
    </PanelSection>

    <PanelSection :title="$t('members.form.placement')">
      <div class="grid max-w-2xl gap-4 sm:grid-cols-2">
        <UFormField :label="$t('members.form.jobTitle')" name="title">
          <UInput
            v-model="state.title"
            :placeholder="$t('members.form.jobTitlePlaceholder')"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="$t('members.form.department')" name="department" required>
          <USelect
            v-model="state.department"
            :items="meta.departmentOptions"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="$t('members.form.location')" name="location">
          <UInput
            v-model="state.location"
            :placeholder="$t('members.form.locationPlaceholder')"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="$t('members.form.timezone')" name="timezone" required>
          <USelectMenu
            v-model="state.timezone"
            :items="TIMEZONES"
            class="w-full"
          />
        </UFormField>
      </div>
    </PanelSection>

    <PanelSection :title="$t('members.form.access')">
      <div class="grid max-w-2xl gap-4">
        <UFormField
          :label="$t('members.form.role')"
          name="role"
          required
          :help="roleLocked ? $t('members.form.ownerLocked') : describeRole(state.role)"
        >
          <URadioGroup
            v-model="state.role"
            :items="roleOptions"
            value-key="value"
            variant="table"
          />
        </UFormField>

        <UFormField
          :label="$t('members.form.status')"
          name="status"
          :help="$t('members.form.statusHint')"
        >
          <USelect
            v-model="state.status"
            :items="meta.statusOptions"
            value-key="value"
            class="w-full max-w-xs"
          />
        </UFormField>
      </div>
    </PanelSection>

    <PanelSection :title="$t('members.form.extra')">
      <div class="grid max-w-2xl gap-4">
        <UFormField :label="$t('members.form.phone')" name="phone">
          <UInput v-model="state.phone" type="tel" class="w-full max-w-xs" />
        </UFormField>

        <UFormField
          :label="$t('members.form.notes')"
          name="notes"
          :help="$t('members.form.notesHint')"
        >
          <UTextarea
            v-model="state.notes"
            :rows="4"
            :placeholder="$t('members.form.notesPlaceholder')"
            class="w-full"
          />
        </UFormField>
      </div>
    </PanelSection>

    <div class="flex items-center gap-3 border-t border-default pt-4">
      <UButton type="submit" :label="submitLabel" :loading="submitting" />
      <UButton
        :label="$t('members.form.cancel')"
        color="neutral"
        variant="ghost"
        :to="cancelTo"
        :disabled="submitting"
      />
    </div>
  </UForm>
</template>
