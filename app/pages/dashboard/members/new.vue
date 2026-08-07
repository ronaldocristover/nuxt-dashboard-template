<script setup lang="ts">
import type { TeamMember } from '#shared/types'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { t } = useI18n()
const { notify, notifySuccess } = useApiError()

useSeoMeta({ title: () => t('members.form.newTitle'), robots: 'noindex' })

const state = reactive(emptyMember())
const submitting = ref(false)

async function submit() {
  submitting.value = true

  try {
    const member = await $fetch<TeamMember>('/api/members', { method: 'POST', body: state })
    notifySuccess(t('members.form.created', { name: member.name }))
    // Straight to the record that was just made, not back to the list — the
    // next thing you want is to look at what you created.
    await navigateTo(`/dashboard/members/${member.id}`)
  } catch (error) {
    notify(error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="member-new">
    <template #header>
      <UDashboardNavbar :title="$t('members.form.newTitle')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-4">
        <!-- The breadcrumb is the way back up, so the separate back button that
             sat here would have been a second control doing the same job. -->
        <AppBreadcrumb :trail="[{ label: $t('breadcrumb.new') }]" />

        <div>
          <h2 class="font-display text-xl font-semibold text-highlighted">
            {{ $t('members.form.newTitle') }}
          </h2>
          <p class="mt-1 text-sm text-muted">
            {{ $t('members.form.newSubtitle') }}
          </p>
        </div>

        <MemberForm
          v-model="state"
          :submit-label="$t('members.form.save')"
          :submitting="submitting"
          cancel-to="/dashboard/members"
          @submit="submit"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
