<script setup lang="ts">
import type { MemberDetail, TeamMember } from '#shared/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const { t } = useI18n()
const { notify, notifySuccess } = useApiError()

const id = computed(() => String(route.params.id))

const { data, error } = await useApiFetch<MemberDetail>(() => `/api/members/${id.value}`)

// A missing member is a 404 page, not an edit form bound to nothing.
if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Member not found', fatal: true })
}

const member = computed(() => data.value!.member)

useSeoMeta({
  title: () => t('members.form.editTitle', { name: member.value.name }),
  robots: 'noindex'
})

const state = reactive(toFormState(member.value))
const submitting = ref(false)

async function submit() {
  submitting.value = true

  try {
    const updated = await $fetch<TeamMember>(`/api/members/${id.value}`, {
      method: 'PATCH',
      body: state
    })
    notifySuccess(t('members.form.updated', { name: updated.name }))
    await navigateTo(`/dashboard/members/${updated.id}`)
  } catch (requestError) {
    // Conflicts land here too — a duplicate email, or demoting the last owner.
    // Both carry a sentence from the server worth reading.
    notify(requestError)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="member-edit">
    <template #header>
      <UDashboardNavbar :title="$t('members.form.editTitle', { name: member.name })">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-4">
        <UButton
          :label="member.name"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="link"
          class="-ml-2"
          :to="`/dashboard/members/${id}`"
        />

        <div>
          <h2 class="font-display text-xl font-semibold text-highlighted">
            {{ $t('members.form.editTitle', { name: member.name }) }}
          </h2>
          <p class="mt-1 text-sm text-muted">
            {{ $t('members.form.editSubtitle') }}
          </p>
        </div>

        <UAlert
          v-if="!data!.canChangeRole"
          icon="i-lucide-shield-alert"
          color="warning"
          variant="subtle"
          :description="$t('members.detail.lastOwner')"
        />

        <MemberForm
          v-model="state"
          :submit-label="$t('members.form.saveChanges')"
          :submitting="submitting"
          :can-change-role="data!.canChangeRole"
          :cancel-to="`/dashboard/members/${id}`"
          @submit="submit"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
