<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { TeamMember } from '#shared/types'
import { createInviteSchema, type InviteInput } from '#shared/schemas'
import { initials } from '#shared/format'

const { t } = useI18n()
const fmt = useFormat()
const { notify, notifySuccess } = useApiError()

const { data, status, refresh } = await useApiFetch<{ members: TeamMember[] }>('/api/settings/members')

const members = computed(() => data.value?.members ?? [])

/** Relative times are measured from the moment the page rendered. */
const renderedAt = new Date().toISOString()

const schema = computed(() => createInviteSchema(t))

const inviteOpen = ref(false)
const inviting = ref(false)

const state = reactive({ email: '', role: 'member' as 'admin' | 'member' })

const ROLES = computed(() => [
  { label: t('settings.members.roleMember'), value: 'member' },
  { label: t('settings.members.roleAdmin'), value: 'admin' }
])

async function onInvite(event: FormSubmitEvent<InviteInput>) {
  inviting.value = true
  try {
    await $fetch('/api/settings/members', { method: 'POST', body: event.data })
    await refresh()
    notifySuccess(t('settings.members.sent'), t('settings.members.sentBody', { email: event.data.email }))
    inviteOpen.value = false
    state.email = ''
    state.role = 'member'
  } catch (error) {
    notify(error, t('settings.members.sendFailed'))
  } finally {
    inviting.value = false
  }
}

const removing = ref<string | null>(null)

async function onRemove(member: TeamMember) {
  removing.value = member.id
  try {
    await $fetch(`/api/settings/members/${member.id}`, { method: 'DELETE' })
    await refresh()
    notifySuccess(t('settings.members.removed'), t('settings.members.removedBody', { name: member.name }))
  } catch (error) {
    notify(error, t('settings.members.removeFailed'))
  } finally {
    removing.value = null
  }
}
</script>

<template>
  <PanelSection
    :title="$t('settings.members.title')"
    :description="$t('settings.members.description')"
  >
    <template #default>
      <div v-if="status === 'pending'" class="space-y-3">
        <div v-for="row in 4" :key="row" class="h-12 animate-pulse rounded bg-elevated" />
      </div>

      <ul v-else class="divide-y divide-default">
        <li
          v-for="member in members"
          :key="member.id"
          class="flex items-center gap-3 py-3 first:pt-0"
        >
          <UAvatar
            :text="initials(member.name)"
            size="sm"
            :style="{ background: member.avatarColor, color: '#fff' }"
          />

          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-highlighted">
              {{ member.name }}
            </p>
            <p class="truncate text-xs text-muted">
              {{ member.email }} ·
              {{ member.lastSeenAt ? fmt.relative(member.lastSeenAt, renderedAt) : $t('status.inviteSent') }}
            </p>
          </div>

          <UBadge
            :label="$t(`roles.${member.role}`)"
            :color="member.role === 'owner' ? 'primary' : 'neutral'"
            variant="subtle"
            size="sm"
            class="shrink-0"
          />

          <UBadge
            v-if="member.status === 'invited'"
            :label="$t('status.pending')"
            color="warning"
            variant="subtle"
            size="sm"
            class="hidden shrink-0 sm:inline-flex"
          />

          <!-- The owner cannot be removed: a workspace without one has no
               administrator. -->
          <UButton
            v-if="member.role !== 'owner'"
            icon="i-lucide-user-minus"
            color="neutral"
            variant="ghost"
            size="sm"
            :loading="removing === member.id"
            :aria-label="$t('settings.members.removeLabel', { name: member.name })"
            @click="onRemove(member)"
          />
          <span v-else class="w-8 shrink-0" />
        </li>
      </ul>
    </template>

    <template #footer>
      <UButton
        :label="$t('settings.members.invite')"
        icon="i-lucide-user-plus"
        @click="inviteOpen = true"
      />
    </template>
  </PanelSection>

  <UModal v-model:open="inviteOpen" :title="$t('settings.members.invite')">
    <template #body>
      <UForm
        id="invite-form"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onInvite"
      >
        <UFormField :label="$t('settings.members.inviteEmail')" name="email" required>
          <UInput
            v-model="state.email"
            type="email"
            :placeholder="$t('settings.members.invitePlaceholder')"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField :label="$t('settings.members.inviteRole')" name="role" required>
          <USelect v-model="state.role" :items="ROLES" class="w-full" />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton :label="$t('common.cancel')" color="neutral" variant="ghost" @click="inviteOpen = false" />
        <UButton type="submit" form="invite-form" :label="$t('settings.members.send')" :loading="inviting" />
      </div>
    </template>
  </UModal>
</template>
