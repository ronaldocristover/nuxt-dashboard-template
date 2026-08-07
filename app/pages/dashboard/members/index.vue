<script setup lang="ts">
import type { MembersResponse } from '#shared/types'
import { initials } from '#shared/format'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { t } = useI18n()
const fmt = useFormat()
const meta = useMemberMeta()

useSeoMeta({ title: () => t('members.title'), robots: 'noindex' })

type SortKey = 'name' | 'email' | 'role' | 'department' | 'joinedAt' | 'lastSeenAt'

const search = ref('')
const role = ref<'all' | 'owner' | 'admin' | 'member'>('all')
const status = ref<'all' | 'active' | 'invited'>('all')
const department = ref<'all' | 'revenue' | 'finance' | 'product' | 'support' | 'leadership'>('all')
const sort = ref<SortKey>('role')
const order = ref<'asc' | 'desc'>('asc')
const page = ref(1)
const pageSize = ref(10)

/** Typing must not fire a request per keystroke. */
const debouncedSearch = ref('')
let searchTimer: ReturnType<typeof setTimeout> | undefined

watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedSearch.value = value
  }, 300)
})

onBeforeUnmount(() => clearTimeout(searchTimer))

// Changing a filter while on page 4 should show the first page of the new
// result, not an empty page 4 of it.
watch([debouncedSearch, role, status, department, sort, order, pageSize], () => {
  page.value = 1
})

const { data, pending, refresh } = await useApiFetch<MembersResponse>('/api/members', {
  query: {
    q: debouncedSearch,
    role,
    status,
    department,
    sort,
    order,
    page,
    pageSize
  }
})

const rows = computed(() => data.value?.rows ?? [])
const total = computed(() => data.value?.total ?? 0)
const counts = computed(() => data.value?.counts)

const from = computed(() => (total.value === 0 ? 0 : (page.value - 1) * pageSize.value + 1))
const to = computed(() => Math.min(page.value * pageSize.value, total.value))

const roleItems = computed(() => [
  { value: 'all', label: t('members.allRoles') },
  ...meta.value.roleOptions.map(option => ({ value: option.value, label: option.label }))
])

const statusItems = computed(() => [
  { value: 'all', label: t('members.allStatuses') },
  ...meta.value.statusOptions
])

const departmentItems = computed(() => [
  { value: 'all', label: t('members.allDepartments') },
  ...meta.value.departmentOptions.map(option => ({ value: option.value, label: option.label }))
])

/** Clicking a header sorts by it; clicking the active one flips direction. */
function sortBy(key: SortKey) {
  if (sort.value === key) {
    order.value = order.value === 'asc' ? 'desc' : 'asc'
    return
  }
  sort.value = key
  order.value = 'asc'
}

function ariaSort(key: SortKey) {
  if (sort.value !== key) return 'none'
  return order.value === 'asc' ? 'ascending' : 'descending'
}

/**
 * "Last seen" for someone who has never signed in is not a date — it is the
 * absence of one, and saying so beats printing a dash.
 */
function lastSeen(value: string | null): string {
  if (!value) return t('members.neverSeen')
  return fmt.value.relative(value, data.value?.generatedAt ?? new Date().toISOString())
}
</script>

<template>
  <UDashboardPanel id="members">
    <template #header>
      <UDashboardNavbar :title="$t('members.title')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            :loading="pending"
            :aria-label="$t('members.refresh')"
            @click="refresh()"
          />
          <UButton
            icon="i-lucide-user-plus"
            :label="$t('members.add')"
            to="/dashboard/members/new"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-4">
        <AppBreadcrumb />

        <div>
          <h2 class="font-display text-xl font-semibold text-highlighted">
            {{ $t('members.title') }}
          </h2>
          <p class="mt-1 text-sm text-muted">
            {{ $t('members.subtitle') }}
          </p>
        </div>

        <!-- Counts describe the whole team, not the filtered page, so they stay
             put while you filter and are worth reading. -->
        <div v-if="counts" class="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <p class="eyebrow text-dimmed">
              {{ $t('members.count') }}
            </p>
            <p class="tnum text-lg font-semibold text-highlighted">
              {{ fmt.number(counts.all) }}
            </p>
          </div>
          <div>
            <p class="eyebrow text-dimmed">
              {{ $t('members.activeCount') }}
            </p>
            <p class="tnum text-lg font-semibold text-highlighted">
              {{ fmt.number(counts.active) }}
            </p>
          </div>
          <div>
            <p class="eyebrow text-dimmed">
              {{ $t('members.invitedCount') }}
            </p>
            <p class="tnum text-lg font-semibold text-highlighted">
              {{ fmt.number(counts.invited) }}
            </p>
          </div>
        </div>

        <!-- Filters -->
        <div class="flex flex-col gap-2 lg:flex-row lg:items-center">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            :placeholder="$t('members.search')"
            class="lg:max-w-xs lg:flex-1"
          />
          <div class="flex flex-wrap gap-2">
            <USelect v-model="role" :items="roleItems" value-key="value" class="min-w-36" />
            <USelect v-model="status" :items="statusItems" value-key="value" class="min-w-36" />
            <USelect v-model="department" :items="departmentItems" value-key="value" class="min-w-40" />
          </div>
        </div>

        <!-- Empty state is an invitation to act, not a shrug. -->
        <div
          v-if="!pending && rows.length === 0"
          class="rounded-[var(--ui-radius)] border border-dashed border-default py-14 text-center"
        >
          <UIcon name="i-lucide-users" class="size-8 text-dimmed" />
          <p class="mt-3 font-medium text-highlighted">
            {{ $t('members.empty') }}
          </p>
          <p class="mt-1 text-sm text-muted">
            {{ $t('members.emptyBody') }}
          </p>
          <UButton
            :label="$t('members.add')"
            icon="i-lucide-user-plus"
            variant="subtle"
            class="mt-4"
            to="/dashboard/members/new"
          />
        </div>

        <template v-else>
          <!-- Desktop: a table. Sortable headers are real buttons and expose
               aria-sort, so the order is announced, not just drawn. -->
          <div class="hidden overflow-x-auto rounded-[var(--ui-radius)] ring ring-default md:block">
            <table class="w-full text-sm">
              <thead class="bg-elevated/50">
                <tr>
                  <th class="px-4 py-3 text-left font-medium text-muted" :aria-sort="ariaSort('name')">
                    <button type="button" class="flex items-center gap-1 hover:text-highlighted" @click="sortBy('name')">
                      {{ $t('members.columns.member') }}
                      <UIcon v-if="sort === 'name'" :name="order === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'" class="size-3.5" />
                    </button>
                  </th>
                  <th class="px-4 py-3 text-left font-medium text-muted" :aria-sort="ariaSort('role')">
                    <button type="button" class="flex items-center gap-1 hover:text-highlighted" @click="sortBy('role')">
                      {{ $t('members.columns.role') }}
                      <UIcon v-if="sort === 'role'" :name="order === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'" class="size-3.5" />
                    </button>
                  </th>
                  <th class="px-4 py-3 text-left font-medium text-muted" :aria-sort="ariaSort('department')">
                    <button type="button" class="flex items-center gap-1 hover:text-highlighted" @click="sortBy('department')">
                      {{ $t('members.columns.department') }}
                      <UIcon v-if="sort === 'department'" :name="order === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'" class="size-3.5" />
                    </button>
                  </th>
                  <th class="px-4 py-3 text-left font-medium text-muted">
                    {{ $t('members.columns.status') }}
                  </th>
                  <th class="px-4 py-3 text-left font-medium text-muted" :aria-sort="ariaSort('lastSeenAt')">
                    <button type="button" class="flex items-center gap-1 hover:text-highlighted" @click="sortBy('lastSeenAt')">
                      {{ $t('members.columns.lastSeen') }}
                      <UIcon v-if="sort === 'lastSeenAt'" :name="order === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'" class="size-3.5" />
                    </button>
                  </th>
                  <th class="w-px px-4 py-3">
                    <span class="sr-only">{{ $t('members.columns.actions') }}</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default">
                <tr v-for="member in rows" :key="member.id" class="hover:bg-elevated/40">
                  <td class="px-4 py-3">
                    <NuxtLink :to="`/dashboard/members/${member.id}`" class="flex items-center gap-3 group">
                      <span
                        class="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                        :style="{ backgroundColor: member.avatarColor }"
                        aria-hidden="true"
                      >{{ initials(member.name) }}</span>
                      <span class="min-w-0">
                        <span class="block truncate font-medium text-highlighted group-hover:underline">{{ member.name }}</span>
                        <span class="block truncate text-xs text-muted">{{ member.title || $t('members.noTitle') }}</span>
                      </span>
                    </NuxtLink>
                  </td>
                  <td class="px-4 py-3">
                    <UBadge :color="meta.roleColor(member.role)" variant="subtle" :label="meta.roleLabel(member.role)" />
                  </td>
                  <td class="px-4 py-3">
                    <span class="flex items-center gap-1.5 text-muted">
                      <UIcon :name="meta.departmentIcon(member.department)" class="size-4" />
                      {{ meta.departmentLabel(member.department) }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <UBadge :color="meta.statusColor(member.status)" variant="subtle" :label="meta.statusLabel(member.status)" />
                  </td>
                  <td class="px-4 py-3 text-muted">
                    {{ lastSeen(member.lastSeenAt) }}
                  </td>
                  <td class="px-4 py-3">
                    <UButton
                      icon="i-lucide-chevron-right"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      :to="`/dashboard/members/${member.id}`"
                      :aria-label="member.name"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile: cards. A five-column table on a phone is a table nobody
               reads, so it becomes a stack rather than scrolling sideways. -->
          <ul class="space-y-2 md:hidden">
            <li v-for="member in rows" :key="member.id">
              <NuxtLink
                :to="`/dashboard/members/${member.id}`"
                class="block rounded-[var(--ui-radius)] p-3 ring ring-default transition-shadow hover:ring-accented"
              >
                <div class="flex items-start gap-3">
                  <span
                    class="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                    :style="{ backgroundColor: member.avatarColor }"
                    aria-hidden="true"
                  >{{ initials(member.name) }}</span>
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-medium text-highlighted">
                      {{ member.name }}
                    </p>
                    <p class="truncate text-xs text-muted">
                      {{ member.title || $t('members.noTitle') }}
                    </p>
                    <div class="mt-2 flex flex-wrap items-center gap-1.5">
                      <UBadge size="sm" :color="meta.roleColor(member.role)" variant="subtle" :label="meta.roleLabel(member.role)" />
                      <UBadge size="sm" :color="meta.statusColor(member.status)" variant="subtle" :label="meta.statusLabel(member.status)" />
                      <span class="text-xs text-dimmed">{{ meta.departmentLabel(member.department) }}</span>
                    </div>
                  </div>
                  <UIcon name="i-lucide-chevron-right" class="size-4 shrink-0 text-dimmed" />
                </div>
              </NuxtLink>
            </li>
          </ul>

          <div class="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p class="tnum text-sm text-muted">
              {{ $t('members.showing', { from, to, total }) }}
            </p>
            <UPagination
              v-model:page="page"
              :total="total"
              :items-per-page="pageSize"
            />
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
