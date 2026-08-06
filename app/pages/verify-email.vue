<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { t } = useI18n()
const route = useRoute()
const { user, isAuthenticated, isVerified, verifyEmail, resendVerification } = useAuth()
const { notify, notifySuccess } = useApiError()

useSeoMeta({ title: () => t('auth.verifyEmail.title'), robots: 'noindex' })

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))

/**
 * Four states, and the page decides which by what it was given:
 *
 * - `verifying` — arrived with a token, checking it now
 * - `verified`  — the token was good, or the account was already verified
 * - `failed`    — the token was expired or already used
 * - `pending`   — no token: just signed up, waiting on the email
 */
type State = 'verifying' | 'verified' | 'failed' | 'pending'

const state = ref<State>(token.value ? 'verifying' : isVerified.value ? 'verified' : 'pending')

const devUrl = ref<string | undefined>(
  typeof route.query.devUrl === 'string' ? route.query.devUrl : undefined
)

/**
 * Verification runs on the client only.
 *
 * It mutates state, and a link in an email is often opened by a scanner that
 * fetches it before the person does. Doing this during SSR would let a preview
 * bot burn a single-use token.
 */
onMounted(async () => {
  if (!token.value) return

  try {
    await verifyEmail(token.value)
    state.value = 'verified'
  } catch {
    state.value = 'failed'
  }
})

const resending = ref(false)

async function resend() {
  resending.value = true
  try {
    const result = await resendVerification()
    if (result.alreadyVerified) {
      state.value = 'verified'
      return
    }
    devUrl.value = result.devUrl
    notifySuccess(t('auth.verifyEmail.resent'), user.value?.email)
  } catch (error) {
    notify(error, t('auth.verifyEmail.resendFailed'))
  } finally {
    resending.value = false
  }
}
</script>

<template>
  <div>
    <!-- Checking ------------------------------------------------------------->
    <template v-if="state === 'verifying'">
      <div class="flex size-11 items-center justify-center rounded-full bg-elevated">
        <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-dimmed" />
      </div>
      <h1 class="mt-5 font-display text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
        {{ $t('auth.verifyEmail.checkingTitle') }}
      </h1>
      <p class="mt-2 text-sm text-muted">
        {{ $t('auth.verifyEmail.checkingBody') }}
      </p>
    </template>

    <!-- Done ----------------------------------------------------------------->
    <template v-else-if="state === 'verified'">
      <div class="flex size-11 items-center justify-center rounded-full bg-success/10">
        <UIcon name="i-lucide-circle-check" class="size-5 text-success" />
      </div>
      <h1 class="mt-5 font-display text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
        {{ $t('auth.verifyEmail.doneTitle') }}
      </h1>
      <p class="mt-2 text-sm text-muted">
        {{ $t('auth.verifyEmail.doneBody') }}
      </p>

      <UButton
        :to="isAuthenticated ? '/dashboard' : '/login'"
        :label="isAuthenticated ? $t('errors.backToDashboard') : $t('auth.signIn.submit')"
        size="lg"
        block
        class="mt-6"
        trailing-icon="i-lucide-arrow-right"
      />
    </template>

    <!-- Bad token ------------------------------------------------------------>
    <template v-else-if="state === 'failed'">
      <div class="flex size-11 items-center justify-center rounded-full bg-warning/10">
        <UIcon name="i-lucide-link-2-off" class="size-5 text-warning" />
      </div>
      <h1 class="mt-5 font-display text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
        {{ $t('auth.verifyEmail.failedTitle') }}
      </h1>
      <p class="mt-2 text-sm text-muted">
        {{ $t('auth.verifyEmail.failedBody') }}
      </p>

      <UAlert
        v-if="devUrl"
        class="mt-6"
        color="warning"
        variant="subtle"
        icon="i-lucide-flask-conical"
        :title="$t('auth.forgot.devTitle')"
      >
        <template #description>
          <p class="text-xs">
            {{ $t('auth.forgot.devBody') }}
          </p>
          <UButton
            :to="devUrl"
            :label="$t('auth.verifyEmail.devOpen')"
            size="xs"
            variant="subtle"
            color="warning"
            class="mt-2"
            trailing-icon="i-lucide-arrow-right"
          />
        </template>
      </UAlert>

      <div class="mt-6 space-y-2">
        <!-- Resending needs a session, because the address to send to comes
             from the account rather than from the dead link. -->
        <UButton
          v-if="isAuthenticated"
          :label="$t('auth.verifyEmail.resend')"
          size="lg"
          block
          :loading="resending"
          @click="resend"
        />
        <UButton
          v-else
          to="/login"
          :label="$t('auth.verifyEmail.signInToResend')"
          size="lg"
          block
        />
        <UButton
          to="/"
          :label="$t('errors.backHome')"
          size="lg"
          color="neutral"
          variant="ghost"
          block
        />
      </div>
    </template>

    <!-- Waiting on the email ------------------------------------------------->
    <template v-else>
      <div class="flex size-11 items-center justify-center rounded-full bg-primary/10">
        <UIcon name="i-lucide-mail-check" class="size-5 text-primary" />
      </div>
      <h1 class="mt-5 font-display text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
        {{ $t('auth.verifyEmail.title') }}
      </h1>

      <i18n-t
        v-if="user"
        keypath="auth.verifyEmail.sentTo"
        tag="p"
        class="mt-2 text-sm text-muted"
        scope="global"
      >
        <template #email>
          <span class="font-medium text-highlighted">{{ user.email }}</span>
        </template>
      </i18n-t>
      <p v-else class="mt-2 text-sm text-muted">
        {{ $t('auth.verifyEmail.pendingBody') }}
      </p>

      <UAlert
        v-if="devUrl"
        class="mt-6"
        color="warning"
        variant="subtle"
        icon="i-lucide-flask-conical"
        :title="$t('auth.forgot.devTitle')"
      >
        <template #description>
          <p class="text-xs">
            {{ $t('auth.forgot.devBody') }}
          </p>
          <UButton
            :to="devUrl"
            :label="$t('auth.verifyEmail.devOpen')"
            size="xs"
            variant="subtle"
            color="warning"
            class="mt-2"
            trailing-icon="i-lucide-arrow-right"
          />
        </template>
      </UAlert>

      <!-- The product is usable while unverified. Blocking the dashboard until
           someone finds an email loses more sign-ups than it protects. -->
      <div class="mt-6 space-y-2">
        <UButton
          v-if="isAuthenticated"
          to="/dashboard"
          :label="$t('auth.verifyEmail.continueAnyway')"
          size="lg"
          block
          trailing-icon="i-lucide-arrow-right"
        />
        <UButton
          v-if="isAuthenticated"
          :label="$t('auth.verifyEmail.resend')"
          size="lg"
          color="neutral"
          variant="subtle"
          block
          :loading="resending"
          @click="resend"
        />
        <UButton
          v-else
          to="/login"
          :label="$t('auth.signIn.submit')"
          size="lg"
          block
        />
      </div>

      <p class="mt-4 text-xs text-dimmed">
        {{ $t('auth.verifyEmail.spamHint') }}
      </p>
    </template>
  </div>
</template>
