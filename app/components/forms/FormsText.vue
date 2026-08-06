<script setup lang="ts">
const plain = ref('')
const withIcon = ref('')
const amount = ref('2400')
const domain = ref('northwind')
const secret = ref('')
const search = ref('Bellweather')
const note = ref('')
const readOnly = ref('sub_0041')

const showSecret = ref(false)

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const
</script>

<template>
  <PanelSection
    title="Text fields"
    description="The default control. Reach for anything else only when the value is not free text."
  >
    <div class="divide-y divide-default">
      <FormsRow title="Default" description="A plain single-line field with a placeholder.">
        <UInput v-model="plain" placeholder="Acme Corporation" class="w-full" />
      </FormsRow>

      <FormsRow title="With an icon" description="Use an icon only when it names the field's content faster than the label does.">
        <UInput
          v-model="withIcon"
          icon="i-lucide-building-2"
          placeholder="Account name"
          class="w-full"
        />
      </FormsRow>

      <FormsRow title="Prefix and suffix" description="Units belong beside the field, not inside the placeholder.">
        <div class="space-y-2">
          <UInput v-model="amount" class="w-full" :ui="{ base: 'ps-7 pe-16' }">
            <template #leading>
              <span class="text-sm text-dimmed">$</span>
            </template>
            <template #trailing>
              <span class="text-xs text-dimmed">/ month</span>
            </template>
          </UInput>

          <UInput v-model="domain" class="w-full" :ui="{ base: 'pe-28' }">
            <template #trailing>
              <span class="text-sm text-dimmed">.cadence.app</span>
            </template>
          </UInput>
        </div>
      </FormsRow>

      <FormsRow title="Password" description="Always offer a reveal toggle. Hiding a password nobody can check causes more failed sign-ins than it prevents shoulder-surfing.">
        <UInput
          v-model="secret"
          :type="showSecret ? 'text' : 'password'"
          placeholder="Enter your password"
          autocomplete="new-password"
          class="w-full"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              :icon="showSecret ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :aria-label="showSecret ? 'Hide password' : 'Show password'"
              :aria-pressed="showSecret"
              @click="showSecret = !showSecret"
            />
          </template>
        </UInput>
      </FormsRow>

      <FormsRow title="Search" description="A clear button appears once there is something to clear.">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search accounts"
          class="w-full"
          :ui="{ trailing: 'pe-1' }"
        >
          <template v-if="search" #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              icon="i-lucide-x"
              aria-label="Clear search"
              @click="search = ''"
            />
          </template>
        </UInput>
      </FormsRow>

      <FormsRow title="Textarea" description="Grows with its content up to a limit, so long notes do not hide the submit button.">
        <UTextarea
          v-model="note"
          autoresize
          :rows="3"
          :maxrows="8"
          placeholder="Why is this account being flagged?"
          class="w-full"
        />
      </FormsRow>

      <FormsRow title="Disabled and read-only" description="Disabled means you cannot change it now. Read-only means you can copy it but never change it.">
        <div class="space-y-2">
          <UInput placeholder="Disabled" disabled class="w-full" />
          <UInput v-model="readOnly" readonly class="w-full tnum" />
        </div>
      </FormsRow>

      <FormsRow title="Sizes" description="Auth pages use lg. Dashboard filters use md. Toolbars use sm.">
        <div class="space-y-2">
          <UInput
            v-for="size in SIZES"
            :key="size"
            :size="size"
            :placeholder="`size=&quot;${size}&quot;`"
            class="w-full"
          />
        </div>
      </FormsRow>
    </div>
  </PanelSection>
</template>
