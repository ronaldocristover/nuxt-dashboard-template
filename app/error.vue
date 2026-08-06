<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

/**
 * Errors explain what happened and offer a way forward. They do not apologise
 * and they are never vague — "Something went wrong" tells the reader nothing
 * they did not already know.
 */
const copy = computed(() => {
  if (props.error.statusCode === 404) {
    return {
      code: '404',
      title: 'That page does not exist',
      body: 'The link may be out of date, or the page may have moved. The dashboard and the home page are both still where you left them.'
    }
  }

  if (props.error.statusCode === 403) {
    return {
      code: '403',
      title: 'You do not have access to this',
      body: 'Your account is signed in but is not permitted to view this page. An admin on your workspace can change that.'
    }
  }

  return {
    code: String(props.error.statusCode || 500),
    title: 'This page could not be loaded',
    body: 'The request reached us but did not complete. Trying again often works; if it does not, the status page will say why.'
  }
})

const { isAuthenticated } = useAuth()

useSeoMeta({
  title: copy.value.title,
  robots: 'noindex'
})
</script>

<template>
  <div class="flex min-h-svh flex-col bg-default">
    <header class="border-b border-default">
      <div class="mx-auto flex h-16 max-w-(--ui-container) items-center justify-between px-4 sm:px-6 lg:px-8">
        <NuxtLink to="/" class="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          <AppLogo />
        </NuxtLink>
        <UColorModeButton />
      </div>
    </header>

    <main class="flex flex-1 items-center px-4 py-16 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-xl">
        <p class="tnum-display font-display text-display-lg font-semibold leading-none text-primary/20 sm:text-display-xl">
          {{ copy.code }}
        </p>

        <h1 class="mt-4 font-display text-display-sm font-semibold tracking-tight text-highlighted sm:text-display-md">
          {{ copy.title }}
        </h1>

        <p class="mt-4 text-base text-muted">
          {{ copy.body }}
        </p>

        <div class="mt-8 flex flex-col gap-3 sm:flex-row">
          <UButton
            :to="isAuthenticated ? '/dashboard' : '/'"
            :label="isAuthenticated ? 'Back to the dashboard' : 'Back to the home page'"
            size="lg"
            block
            class="sm:w-auto"
            @click="clearError()"
          />
          <UButton
            label="Try again"
            size="lg"
            color="neutral"
            variant="subtle"
            icon="i-lucide-refresh-cw"
            block
            class="sm:w-auto"
            @click="clearError({ redirect: $route.fullPath })"
          />
        </div>

        <!-- The message is useful while building and noise in production. -->
        <details v-if="error.message" class="mt-10 border-t border-default pt-5">
          <summary class="cursor-pointer text-sm text-dimmed transition-colors hover:text-muted">
            Technical detail
          </summary>
          <pre class="mt-3 overflow-x-auto rounded-md bg-elevated p-3 font-mono text-xs text-muted">{{ error.message }}</pre>
        </details>
      </div>
    </main>
  </div>
</template>
