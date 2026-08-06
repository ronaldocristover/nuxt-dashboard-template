<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { signInSchema, type SignInInput } from '#shared/schemas'

definePageMeta({ layout: 'auth', middleware: 'guest' })

useSeoMeta({
  title: 'Sign in',
  description: 'Sign in to your Cadence workspace.',
  robots: 'noindex'
})

const route = useRoute()
const config = useRuntimeConfig()
const { signIn } = useAuth()
const { notify } = useApiError()

const state = reactive({
  email: '',
  password: '',
  remember: false
})

const loading = ref(false)
const showPassword = ref(false)

/** Only ever redirect to a path on this origin — never to a supplied URL. */
const redirectTo = computed(() => {
  const target = route.query.redirect
  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//')) {
    return '/dashboard'
  }
  return target
})

async function onSubmit(event: FormSubmitEvent<SignInInput>) {
  loading.value = true
  try {
    await signIn(event.data)
    await navigateTo(redirectTo.value)
  } catch (error) {
    notify(error, 'Could not sign you in')
  } finally {
    loading.value = false
  }
}

function useDemoAccount() {
  state.email = 'demo@cadence.app'
  state.password = 'Cadence2026'
}
</script>

<template>
  <div>
    <h1 class="font-display text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
      Sign in to Cadence
    </h1>
    <p class="mt-2 text-sm text-muted">
      New here?
      <NuxtLink to="/register" class="font-medium text-primary underline-offset-2 hover:underline">
        Create an account
      </NuxtLink>
    </p>

    <UAlert
      v-if="config.public.demoMode"
      class="mt-6"
      color="neutral"
      variant="subtle"
      icon="i-lucide-key-round"
      title="Demo workspace"
      :actions="[{ label: 'Fill in demo credentials', variant: 'subtle', size: 'xs', onClick: useDemoAccount }]"
    >
      <template #description>
        <span class="tnum text-xs">demo@cadence.app · Cadence2026</span>
      </template>
    </UAlert>

    <UForm
      :schema="signInSchema"
      :state="state"
      class="mt-6 space-y-4"
      @submit="onSubmit"
    >
      <UFormField label="Email address" name="email" required>
        <UInput
          v-model="state.email"
          type="email"
          autocomplete="email"
          placeholder="you@company.com"
          size="lg"
          class="w-full"
        />
      </UFormField>

      <!-- The reset link goes in `hint`, which UFormField already places
           opposite the label. Putting it inside `label` pushed the required
           marker onto its own line. -->
      <UFormField label="Password" name="password" required>
        <template #hint>
          <NuxtLink
            to="/forgot-password"
            class="text-xs font-normal text-muted underline-offset-2 hover:text-primary hover:underline"
          >
            Forgot your password?
          </NuxtLink>
        </template>
        <UInput
          v-model="state.password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          placeholder="Enter your password"
          size="lg"
          class="w-full"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <UCheckbox v-model="state.remember" name="remember" label="Keep me signed in for 30 days" />

      <UButton
        type="submit"
        label="Sign in"
        size="lg"
        block
        :loading="loading"
      />
    </UForm>

    <USeparator label="or" class="my-6" />

    <div class="grid gap-2 sm:grid-cols-2">
      <UButton
        label="Google"
        icon="i-simple-icons-google"
        color="neutral"
        variant="subtle"
        size="lg"
        block
        disabled
      />
      <UButton
        label="GitHub"
        icon="i-simple-icons-github"
        color="neutral"
        variant="subtle"
        size="lg"
        block
        disabled
      />
    </div>
    <p class="mt-2.5 text-center text-xs text-dimmed">
      Social sign-in is wired up but disabled in the demo. See
      <span class="font-mono">README.md</span> to connect a provider.
    </p>
  </div>
</template>
