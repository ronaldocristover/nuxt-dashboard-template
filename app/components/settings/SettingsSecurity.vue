<script setup lang="ts">
/**
 * Email confirmation status and the two-step toggle.
 *
 * Both live here rather than in `SettingsAccount` so that file stays about
 * passwords and sessions. Turning two-step on or off re-asks for the password:
 * a stolen session must not be able to weaken the account it stole.
 */
const { user, isVerified, setTwoFactor, resendVerification } = useAuth()
const { t } = useI18n()
const fmt = useFormat()
const { notify, notifySuccess } = useApiError()

const confirmOpen = ref(false)
const intent = ref(false)
const password = ref('')
const working = ref(false)

function ask(next: boolean) {
  intent.value = next
  password.value = ''
  confirmOpen.value = true
}

async function apply() {
  working.value = true
  try {
    await setTwoFactor(intent.value, password.value)
    confirmOpen.value = false
    password.value = ''
    notifySuccess(
      intent.value ? t('settings.account.enabled') : t('settings.account.disabled'),
      intent.value ? t('settings.account.enabledBody') : t('settings.account.disabledBody')
    )
  } catch (error) {
    notify(error, t('settings.account.twoFactorFailed'))
  } finally {
    working.value = false
  }
}

const sending = ref(false)

async function sendVerification() {
  sending.value = true
  try {
    const result = await resendVerification()
    if (result.devUrl) {
      // Dev only — no mail provider, so hand over the link directly.
      await navigateTo({ path: '/verify-email', query: { devUrl: result.devUrl } })
      return
    }
    notifySuccess(t('auth.verifyEmail.resent'), user.value?.email)
  } catch (error) {
    notify(error, t('auth.verifyEmail.resendFailed'))
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <PanelSection
      :title="$t('settings.account.emailTitle')"
      :description="$t('settings.account.emailUnverifiedBody')"
    >
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-start gap-3">
          <span
            class="mt-0.5 flex size-9 items-center justify-center rounded-full"
            :class="isVerified ? 'bg-success/10' : 'bg-warning/10'"
          >
            <UIcon
              :name="isVerified ? 'i-lucide-mail-check' : 'i-lucide-mail-warning'"
              class="size-4"
              :class="isVerified ? 'text-success' : 'text-warning'"
            />
          </span>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-highlighted">
              {{ user?.email }}
            </p>
            <p class="mt-0.5 text-xs" :class="isVerified ? 'text-muted' : 'text-warning'">
              <template v-if="isVerified && user?.emailVerifiedAt">
                {{ $t('settings.account.emailVerified', { date: fmt.date(user.emailVerifiedAt) }) }}
              </template>
              <template v-else>
                {{ $t('settings.account.emailUnverified') }}
              </template>
            </p>
          </div>
        </div>

        <UButton
          v-if="!isVerified"
          :label="$t('settings.account.verifyNow')"
          variant="subtle"
          size="sm"
          :loading="sending"
          @click="sendVerification"
        />
        <UBadge
          v-else
          :label="$t('status.active')"
          color="success"
          variant="subtle"
          size="sm"
        />
      </div>
    </PanelSection>

    <PanelSection
      :title="$t('settings.account.twoFactorTitle')"
      :description="$t('settings.account.twoFactorDescription')"
    >
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-start gap-3">
          <span
            class="mt-0.5 flex size-9 items-center justify-center rounded-full"
            :class="user?.twoFactorEnabled ? 'bg-success/10' : 'bg-elevated'"
          >
            <UIcon
              name="i-lucide-shield-check"
              class="size-4"
              :class="user?.twoFactorEnabled ? 'text-success' : 'text-dimmed'"
            />
          </span>
          <p class="text-sm" :class="user?.twoFactorEnabled ? 'text-highlighted' : 'text-muted'">
            {{ user?.twoFactorEnabled
              ? $t('settings.account.twoFactorOn')
              : $t('settings.account.twoFactorOff') }}
          </p>
        </div>

        <UButton
          v-if="user?.twoFactorEnabled"
          :label="$t('settings.account.disable')"
          color="neutral"
          variant="subtle"
          size="sm"
          @click="ask(false)"
        />
        <UButton
          v-else
          :label="$t('settings.account.enable')"
          size="sm"
          @click="ask(true)"
        />
      </div>
    </PanelSection>

    <UModal
      v-model:open="confirmOpen"
      :title="intent ? $t('settings.account.enable') : $t('settings.account.disable')"
    >
      <template #body>
        <UFormField
          :label="$t('settings.account.confirmPassword')"
          :help="$t('settings.account.confirmPasswordHelp')"
          required
        >
          <UInput
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="w-full"
            autofocus
            @keydown.enter="password && apply()"
          />
        </UFormField>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            :label="$t('common.cancel')"
            color="neutral"
            variant="ghost"
            :disabled="working"
            @click="confirmOpen = false"
          />
          <UButton
            :label="intent ? $t('settings.account.enable') : $t('settings.account.disable')"
            :color="intent ? 'primary' : 'error'"
            :loading="working"
            :disabled="!password"
            @click="apply"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
