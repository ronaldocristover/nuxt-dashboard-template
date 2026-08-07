<script setup lang="ts">
import type { MemberDetail } from '#shared/types'
import { initials } from '#shared/format'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const fmt = useFormat()
const meta = useMemberMeta()
const { notify, notifySuccess } = useApiError()

const id = computed(() => String(route.params.id))

const { data, error, refresh } = await useApiFetch<MemberDetail>(() => `/api/members/${id.value}`)

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Member not found', fatal: true })
}

const detail = computed(() => data.value!)
const member = computed(() => detail.value.member)

useSeoMeta({ title: () => member.value.name, robots: 'noindex' })

/**
 * The open tab lives in the URL.
 *
 * So a link to somebody's renewals is a link to their renewals, reloading keeps
 * you where you were, and the back button steps through tabs the way people
 * expect it to.
 */
const TABS = ['profile', 'access', 'renewals', 'billing', 'activity'] as const
type TabKey = typeof TABS[number]

const tab = computed<TabKey>(() => {
  const requested = String(route.query.tab ?? '')
  return TABS.includes(requested as TabKey) ? (requested as TabKey) : 'profile'
})

function openTab(value: string | number) {
  const next = String(value) as TabKey
  router.replace({ query: { ...route.query, tab: next === 'profile' ? undefined : next } })
}

const tabItems = computed(() => [
  { value: 'profile', label: t('members.tabs.profile'), icon: 'i-lucide-user' },
  { value: 'access', label: t('members.tabs.access'), icon: 'i-lucide-key-round' },
  {
    value: 'renewals',
    label: t('members.tabs.renewals'),
    icon: 'i-lucide-refresh-cw',
    // The count belongs on the tab: it is the reason to open it or not.
    badge: detail.value.renewals.length || undefined
  },
  {
    value: 'billing',
    label: t('members.tabs.billing'),
    icon: 'i-lucide-receipt-text',
    badge: detail.value.invoices.length || undefined
  },
  { value: 'activity', label: t('members.tabs.activity'), icon: 'i-lucide-activity' }
])

const lastSeenLabel = computed(() => {
  if (!member.value.lastSeenAt) return t('members.neverSeen')
  return t('members.lastSeen', {
    when: fmt.value.relative(member.value.lastSeenAt, detail.value.generatedAt)
  })
})

/** Contact rows. Empty fields say so rather than rendering a blank line. */
const contactRows = computed(() => [
  { key: 'email', label: t('members.detail.email'), value: member.value.email, href: `mailto:${member.value.email}` },
  { key: 'phone', label: t('members.detail.phone'), value: member.value.phone, href: member.value.phone ? `tel:${member.value.phone.replace(/\s+/g, '')}` : undefined },
  { key: 'location', label: t('members.detail.location'), value: member.value.location },
  { key: 'timezone', label: t('members.detail.timezone'), value: member.value.timezone }
])

const TONE_COLOR: Record<string, string> = {
  risk: 'text-error',
  progress: 'text-info',
  neutral: 'text-muted',
  won: 'text-success',
  lost: 'text-dimmed'
}

/** Overdue is shown by icon as well as colour. */
function isOverdue(dueAt: string | null): boolean {
  if (!dueAt) return false
  return new Date(dueAt).getTime() < new Date(detail.value.generatedAt).getTime()
}

// --- Removal -----------------------------------------------------------------

const removeOpen = ref(false)
const removing = ref(false)

async function remove() {
  removing.value = true

  try {
    await $fetch(`/api/members/${id.value}`, { method: 'DELETE' })
    notifySuccess(t('members.detail.removed', { name: member.value.name }))
    await navigateTo('/dashboard/members')
  } catch (requestError) {
    notify(requestError)
    removeOpen.value = false
  } finally {
    removing.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="member-detail">
    <template #header>
      <UDashboardNavbar :title="member.name">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            :aria-label="$t('members.refresh')"
            @click="refresh()"
          />
          <UButton
            icon="i-lucide-pencil"
            :label="$t('members.detail.edit')"
            color="neutral"
            variant="subtle"
            :to="`/dashboard/members/${id}/edit`"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-5">
        <AppBreadcrumb :trail="[{ label: member.name }]" />

        <!-- Identity header -->
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex items-center gap-4">
            <span
              class="flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
              :style="{ backgroundColor: member.avatarColor }"
              aria-hidden="true"
            >{{ initials(member.name) }}</span>
            <div class="min-w-0">
              <h2 class="font-display text-2xl font-semibold text-highlighted">
                {{ member.name }}
              </h2>
              <p class="text-sm text-muted">
                {{ member.title || $t('members.noTitle') }} ·
                {{ meta.departmentLabel(member.department) }}
              </p>
              <div class="mt-2 flex flex-wrap items-center gap-1.5">
                <UBadge :color="meta.roleColor(member.role)" variant="subtle" :label="meta.roleLabel(member.role)" />
                <UBadge :color="meta.statusColor(member.status)" variant="subtle" :label="meta.statusLabel(member.status)" />
                <span class="text-xs text-dimmed">{{ lastSeenLabel }}</span>
              </div>
            </div>
          </div>

          <UButton
            v-if="detail.canDelete"
            icon="i-lucide-user-minus"
            :label="$t('members.detail.remove')"
            color="error"
            variant="subtle"
            @click="removeOpen = true"
          />
        </div>

        <UAlert
          v-if="!detail.canChangeRole"
          icon="i-lucide-shield-alert"
          color="warning"
          variant="subtle"
          :description="$t('members.detail.lastOwner')"
        />

        <UTabs
          :items="tabItems"
          :model-value="tab"
          variant="link"
          class="w-full"
          @update:model-value="openTab"
        />

        <!-- Profile ------------------------------------------------------- -->
        <div v-if="tab === 'profile'" class="grid gap-4 lg:grid-cols-2">
          <PanelSection :title="$t('members.detail.contact')">
            <dl class="divide-y divide-default">
              <div v-for="row in contactRows" :key="row.key" class="flex items-baseline justify-between gap-4 py-2.5">
                <dt class="text-sm text-muted">
                  {{ row.label }}
                </dt>
                <dd class="text-right text-sm">
                  <a v-if="row.value && row.href" :href="row.href" class="text-primary hover:underline">{{ row.value }}</a>
                  <span v-else-if="row.value" class="text-highlighted">{{ row.value }}</span>
                  <span v-else class="text-dimmed">{{ $t('members.detail.notProvided') }}</span>
                </dd>
              </div>
            </dl>
          </PanelSection>

          <PanelSection :title="$t('members.detail.history')">
            <dl class="divide-y divide-default">
              <div class="flex items-baseline justify-between gap-4 py-2.5">
                <dt class="text-sm text-muted">
                  {{ $t('members.detail.joinedLabel') }}
                </dt>
                <dd class="text-sm text-highlighted">
                  {{ member.joinedAt ? fmt.date(member.joinedAt) : $t('members.detail.notProvided') }}
                </dd>
              </div>
              <div class="flex items-baseline justify-between gap-4 py-2.5">
                <dt class="text-sm text-muted">
                  {{ $t('members.detail.invitedByLabel') }}
                </dt>
                <dd class="text-sm text-highlighted">
                  {{ member.invitedBy || $t('members.detail.notProvided') }}
                </dd>
              </div>
            </dl>
          </PanelSection>

          <PanelSection :title="$t('members.detail.notes')" class="lg:col-span-2">
            <p v-if="member.notes" class="whitespace-pre-line text-sm text-default">
              {{ member.notes }}
            </p>
            <p v-else class="text-sm text-dimmed">
              {{ $t('members.detail.noNotes') }}
            </p>
          </PanelSection>
        </div>

        <!-- Access -------------------------------------------------------- -->
        <div v-else-if="tab === 'access'" class="grid gap-4 lg:grid-cols-2">
          <PanelSection :title="$t('members.detail.permissions')">
            <div class="space-y-3">
              <div
                v-for="option in meta.roleOptions"
                :key="option.value"
                class="flex gap-3 rounded-[var(--ui-radius)] p-3 ring"
                :class="option.value === member.role ? 'ring-primary bg-primary/5' : 'ring-default'"
              >
                <UIcon
                  :name="option.value === member.role ? 'i-lucide-check-circle-2' : 'i-lucide-circle'"
                  class="mt-0.5 size-4 shrink-0"
                  :class="option.value === member.role ? 'text-primary' : 'text-dimmed'"
                />
                <div>
                  <p class="text-sm font-medium text-highlighted">
                    {{ option.label }}
                  </p>
                  <p class="mt-0.5 text-sm text-muted">
                    {{ option.description }}
                  </p>
                </div>
              </div>
            </div>
          </PanelSection>

          <PanelSection :title="$t('members.detail.accountStatus')">
            <dl class="divide-y divide-default">
              <div class="flex items-center justify-between gap-4 py-2.5">
                <dt class="text-sm text-muted">
                  {{ $t('members.columns.status') }}
                </dt>
                <dd>
                  <UBadge :color="meta.statusColor(member.status)" variant="subtle" :label="meta.statusLabel(member.status)" />
                </dd>
              </div>
              <div class="flex items-center justify-between gap-4 py-2.5">
                <dt class="text-sm text-muted">
                  {{ $t('members.columns.lastSeen') }}
                </dt>
                <dd class="text-sm text-highlighted">
                  {{ member.lastSeenAt ? fmt.relative(member.lastSeenAt, detail.generatedAt) : $t('members.neverSeen') }}
                </dd>
              </div>
              <div class="flex items-center justify-between gap-4 py-2.5">
                <dt class="text-sm text-muted">
                  {{ $t('members.columns.department') }}
                </dt>
                <dd class="flex items-center gap-1.5 text-sm text-highlighted">
                  <UIcon :name="meta.departmentIcon(member.department)" class="size-4" />
                  {{ meta.departmentLabel(member.department) }}
                </dd>
              </div>
            </dl>

            <UButton
              :label="$t('members.detail.edit')"
              icon="i-lucide-pencil"
              variant="subtle"
              class="mt-4"
              :to="`/dashboard/members/${id}/edit`"
            />
          </PanelSection>
        </div>

        <!-- Renewals ------------------------------------------------------ -->
        <div v-else-if="tab === 'renewals'" class="space-y-4">
          <div v-if="detail.renewals.length" class="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div>
              <p class="eyebrow text-dimmed">
                {{ $t('members.detail.renewalsOwned') }}
              </p>
              <p class="tnum text-lg font-semibold text-highlighted">
                {{ fmt.number(detail.renewals.length) }}
              </p>
            </div>
            <div>
              <p class="eyebrow text-dimmed">
                {{ $t('members.detail.mrrAtStake') }}
              </p>
              <p class="tnum text-lg font-semibold text-highlighted">
                {{ fmt.currency(detail.renewalMrr) }}
              </p>
            </div>
            <UButton
              :label="$t('members.detail.openPipeline')"
              icon="i-lucide-kanban"
              color="neutral"
              variant="subtle"
              size="sm"
              class="ms-auto"
              to="/dashboard/kanban"
            />
          </div>

          <ul v-if="detail.renewals.length" class="space-y-2">
            <li
              v-for="renewal in detail.renewals"
              :key="renewal.id"
              class="flex flex-wrap items-center justify-between gap-3 rounded-[var(--ui-radius)] p-3 ring ring-default"
            >
              <div class="min-w-0">
                <p class="truncate font-medium text-highlighted">
                  {{ renewal.account }}
                </p>
                <p class="text-xs" :class="TONE_COLOR[renewal.columnTone] ?? 'text-muted'">
                  {{ renewal.columnTitle }}
                </p>
              </div>
              <div class="flex items-center gap-4">
                <span
                  v-if="renewal.dueAt"
                  class="tnum flex items-center gap-1 text-xs"
                  :class="isOverdue(renewal.dueAt) ? 'text-error' : 'text-muted'"
                >
                  <UIcon
                    :name="isOverdue(renewal.dueAt) ? 'i-lucide-calendar-x-2' : 'i-lucide-calendar'"
                    class="size-3.5"
                  />
                  {{ fmt.date(renewal.dueAt) }}
                </span>
                <span class="tnum font-semibold text-highlighted">{{ fmt.currency(renewal.mrr) }}</span>
              </div>
            </li>
          </ul>

          <div v-else class="rounded-[var(--ui-radius)] border border-dashed border-default py-14 text-center">
            <UIcon name="i-lucide-refresh-cw" class="size-8 text-dimmed" />
            <p class="mt-3 font-medium text-highlighted">
              {{ $t('members.detail.noRenewals') }}
            </p>
            <p class="mx-auto mt-1 max-w-sm text-sm text-muted">
              {{ $t('members.detail.noRenewalsBody') }}
            </p>
          </div>
        </div>

        <!-- Billing ------------------------------------------------------- -->
        <div v-else-if="tab === 'billing'">
          <MemberInvoiceTable
            v-if="detail.invoices.length"
            :invoices="detail.invoices"
            :totals="detail.invoiceTotals"
          />

          <div v-else class="rounded-[var(--ui-radius)] border border-dashed border-default py-14 text-center">
            <UIcon name="i-lucide-receipt-text" class="size-8 text-dimmed" />
            <p class="mt-3 font-medium text-highlighted">
              {{ $t('members.detail.noInvoices') }}
            </p>
            <p class="mx-auto mt-1 max-w-sm text-sm text-muted">
              {{ $t('members.detail.noInvoicesBody') }}
            </p>
          </div>
        </div>

        <!-- Activity ------------------------------------------------------ -->
        <div v-else class="space-y-3">
          <p class="text-sm text-muted">
            {{ $t('members.detail.activityNote') }}
          </p>

          <ul v-if="detail.activity.length" class="divide-y divide-default rounded-[var(--ui-radius)] ring ring-default">
            <li
              v-for="event in detail.activity"
              :key="event.id"
              class="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div class="min-w-0">
                <p class="truncate text-sm text-highlighted">
                  {{ $t(`activity.${event.kind}`, { actor: event.actor, company: event.company }) }}
                </p>
                <p class="text-xs text-dimmed">
                  {{ fmt.relative(event.at, detail.generatedAt) }}
                </p>
              </div>
              <span v-if="event.amount" class="tnum shrink-0 text-sm font-medium text-highlighted">
                {{ fmt.currency(event.amount) }}
              </span>
            </li>
          </ul>

          <div v-else class="rounded-[var(--ui-radius)] border border-dashed border-default py-14 text-center">
            <UIcon name="i-lucide-activity" class="size-8 text-dimmed" />
            <p class="mt-3 font-medium text-highlighted">
              {{ $t('members.detail.noActivity') }}
            </p>
            <p class="mx-auto mt-1 max-w-sm text-sm text-muted">
              {{ $t('members.detail.noActivityBody') }}
            </p>
          </div>
        </div>

        <!-- Removal confirmation lives inside the body: the panel takes one root. -->
        <UModal v-model:open="removeOpen" :title="$t('members.detail.removeTitle', { name: member.name })">
          <template #body>
            <p class="text-sm text-muted">
              {{ $t('members.detail.removeBody') }}
            </p>
          </template>
          <template #footer>
            <div class="flex w-full justify-end gap-2">
              <UButton
                :label="$t('members.detail.keep')"
                color="neutral"
                variant="ghost"
                :disabled="removing"
                @click="removeOpen = false"
              />
              <UButton
                :label="$t('members.detail.removeConfirm')"
                color="error"
                :loading="removing"
                @click="remove"
              />
            </div>
          </template>
        </UModal>
      </div>
    </template>
  </UDashboardPanel>
</template>
