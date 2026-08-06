<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'two-factor' })

const { t } = useI18n()
const route = useRoute()
const { verifyTwoFactor, resendTwoFactor } = useAuth()
const { notify, notifySuccess } = useApiError()

useSeoMeta({ title: () => t('auth.twoFactor.title'), robots: 'noindex' })

/** Masked address, so the page can say where the code went. */
const { data: challenge } = await useApiFetch<{ pending: boolean, email: string | null }>(
  '/api/auth/two-factor/challenge'
)

// `number[]`, because `type="number"` on UPinInput brings up the numeric keypad
// on a phone — which matters more for a six-digit code than anything else on
// this page. Each entry is a single digit, so joining preserves leading zeros.
const digits = ref<number[]>([])
const loading = ref(false)
const failed = ref(false)

/** Populated in dev, where there is no email provider. */
const devCode = ref<string | undefined>(
  typeof route.query.devCode === 'string' ? route.query.devCode : undefined
)

const code = computed(() => digits.value.join(''))
const complete = computed(() => code.value.length === 6)

function redirectTarget() {
  const target = route.query.redirect
  // Same rule as the sign-in page: same-origin paths only, never a supplied URL.
  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//')) {
    return '/dashboard'
  }
  return target
}

async function submit() {
  if (!complete.value || loading.value) return

  loading.value = true
  failed.value = false
  try {
    await verifyTwoFactor(code.value)
    await navigateTo(redirectTarget())
  } catch (error) {
    failed.value = true
    // Clear the field so the next attempt starts from an empty box rather than
    // making someone delete six digits by hand.
    digits.value = []
    notify(error, t('auth.twoFactor.failed'))
  } finally {
    loading.value = false
  }
}

/**
 * Submit as soon as the sixth digit lands. A code that is complete has nothing
 * left to confirm, and making someone reach for a button after typing it is
 * the most-complained-about part of every 2FA form.
 */
watch(complete, (isComplete) => {
  if (isComplete) submit()
})

// --- Resend, with a cooldown -------------------------------------------------

const COOLDOWN = 30
const secondsLeft = ref(0)
let ticker: ReturnType<typeof setInterval> | undefined

function startCooldown() {
  secondsLeft.value = COOLDOWN
  clearInterval(ticker)
  ticker = setInterval(() => {
    secondsLeft.value--
    if (secondsLeft.value <= 0) clearInterval(ticker)
  }, 1000)
}

onBeforeUnmount(() => clearInterval(ticker))

const resending = ref(false)

async function resend() {
  if (secondsLeft.value > 0) return

  resending.value = true
  try {
    devCode.value = await resendTwoFactor()
    digits.value = []
    failed.value = false
    startCooldown()
    notifySuccess(t('auth.twoFactor.resent'), challenge.value?.email ?? undefined)
  } catch (error) {
    notify(error, t('auth.twoFactor.resendFailed'))
  } finally {
    resending.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex size-11 items-center justify-center rounded-full bg-primary/10">
      <UIcon name="i-lucide-shield-check" class="size-5 text-primary" />
    </div>

    <h1 class="mt-5 font-display text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
      {{ $t('auth.twoFactor.title') }}
    </h1>

    <i18n-t
      v-if="challenge?.email"
      keypath="auth.twoFactor.sentTo"
      tag="p"
      class="mt-2 text-sm text-muted"
      scope="global"
    >
      <template #email>
        <span class="tnum font-medium text-highlighted">{{ challenge.email }}</span>
      </template>
    </i18n-t>
    <p v-else class="mt-2 text-sm text-muted">
      {{ $t('auth.twoFactor.body') }}
    </p>

    <UAlert
      v-if="devCode"
      class="mt-6"
      color="warning"
      variant="subtle"
      icon="i-lucide-flask-conical"
      :title="$t('auth.forgot.devTitle')"
    >
      <template #description>
        <p class="text-xs">
          {{ $t('auth.twoFactor.devBody') }}
        </p>
        <p class="tnum mt-1 text-base font-semibold tracking-[0.3em] text-highlighted">
          {{ devCode }}
        </p>
      </template>
    </UAlert>

    <div class="mt-7">
      <label for="two-factor-code" class="block text-sm font-medium text-highlighted">
        {{ $t('auth.twoFactor.label') }}
      </label>

      <UPinInput
        id="two-factor-code"
        v-model="digits"
        :length="6"
        otp
        size="xl"
        type="number"
        :color="failed ? 'error' : 'primary'"
        :disabled="loading"
        class="mt-2"
        autofocus
        :aria-describedby="failed ? 'two-factor-error' : undefined"
      />

      <!-- `aria-live` so the failure is announced, not just coloured. -->
      <p
        v-if="failed"
        id="two-factor-error"
        class="mt-2 text-sm text-error"
        aria-live="polite"
      >
        {{ $t('auth.twoFactor.invalid') }}
      </p>
      <p v-else class="mt-2 text-xs text-dimmed">
        {{ $t('auth.twoFactor.autoSubmit') }}
      </p>
    </div>

    <UButton
      :label="$t('auth.twoFactor.submit')"
      size="lg"
      block
      class="mt-5"
      :loading="loading"
      :disabled="!complete"
      @click="submit"
    />

    <div class="mt-5 flex flex-col items-center gap-2 text-center">
      <UButton
        :label="secondsLeft > 0
          ? $t('auth.twoFactor.resendIn', { seconds: secondsLeft })
          : $t('auth.twoFactor.resend')"
        color="neutral"
        variant="ghost"
        size="sm"
        :loading="resending"
        :disabled="secondsLeft > 0"
        @click="resend"
      />
      <NuxtLink
        to="/login"
        class="text-xs text-muted underline-offset-2 transition-colors hover:text-highlighted hover:underline"
      >
        {{ $t('auth.twoFactor.useAnotherAccount') }}
      </NuxtLink>
    </div>
  </div>
</template>
