<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { TeamMember } from '#shared/types'
import { inviteSchema, type InviteInput } from '#shared/schemas'
import { initials } from '#shared/format'

const { notify, notifySuccess } = useApiError()

const { data, status, refresh } = await useApiFetch<{ members: TeamMember[] }>('/api/settings/members')

const members = computed(() => data.value?.members ?? [])

const inviteOpen = ref(false)
const inviting = ref(false)

const state = reactive({ email: '', role: 'member' as 'admin' | 'member' })

const ROLES = [
  { label: 'Member — can read every report', value: 'member' },
  { label: 'Admin — can also manage the team and billing', value: 'admin' }
]

const ROLE_LABELS = { owner: 'Owner', admin: 'Admin', member: 'Member' } as const

async function onInvite(event: FormSubmitEvent<InviteInput>) {
  inviting.value = true
  try {
    await $fetch('/api/settings/members', { method: 'POST', body: event.data })
    await refresh()
    notifySuccess('Invitation sent', `${event.data.email} can now join the workspace.`)
    inviteOpen.value = false
    state.email = ''
    state.role = 'member'
  } catch (error) {
    notify(error, 'Could not send the invitation')
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
    notifySuccess('Member removed', `${member.name} no longer has access.`)
  } catch (error) {
    notify(error, 'Could not remove that member')
  } finally {
    removing.value = null
  }
}
</script>

<template>
  <PanelSection
    title="Team"
    description="Everyone who can read this workspace. Owners and admins can invite others."
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
              {{ member.email }} · {{ member.lastSeenLabel }}
            </p>
          </div>

          <UBadge
            :label="ROLE_LABELS[member.role]"
            :color="member.role === 'owner' ? 'primary' : 'neutral'"
            variant="subtle"
            size="sm"
            class="shrink-0"
          />

          <UBadge
            v-if="member.status === 'invited'"
            label="Pending"
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
            :aria-label="`Remove ${member.name}`"
            @click="onRemove(member)"
          />
          <span v-else class="w-8 shrink-0" />
        </li>
      </ul>
    </template>

    <template #footer>
      <UButton
        label="Invite a teammate"
        icon="i-lucide-user-plus"
        @click="inviteOpen = true"
      />
    </template>
  </PanelSection>

  <UModal v-model:open="inviteOpen" title="Invite a teammate">
    <template #body>
      <UForm
        id="invite-form"
        :schema="inviteSchema"
        :state="state"
        class="space-y-4"
        @submit="onInvite"
      >
        <UFormField label="Email address" name="email" required>
          <UInput
            v-model="state.email"
            type="email"
            placeholder="teammate@company.com"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField label="Role" name="role" required>
          <USelect v-model="state.role" :items="ROLES" class="w-full" />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton label="Cancel" color="neutral" variant="ghost" @click="inviteOpen = false" />
        <UButton type="submit" form="invite-form" label="Send invitation" :loading="inviting" />
      </div>
    </template>
  </UModal>
</template>
