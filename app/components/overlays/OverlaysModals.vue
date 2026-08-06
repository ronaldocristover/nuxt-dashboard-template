<script setup lang="ts">
const basic = ref(false)
const form = ref(false)
const destructive = ref(false)
const locked = ref(false)
const wide = ref(false)

const { notifySuccess } = useApiError()

const planName = ref('')
const confirmText = ref('')
const canDelete = computed(() => confirmText.value.trim().toLowerCase() === 'delete')

const working = ref(false)

async function saveAndClose() {
  working.value = true
  await new Promise(resolve => setTimeout(resolve, 700))
  working.value = false
  form.value = false
  planName.value = ''
  notifySuccess('Saved', 'The modal closes only after the request succeeds.')
}

function destroy() {
  destructive.value = false
  confirmText.value = ''
  notifySuccess('Deleted', 'In a real app this is where the row disappears.')
}
</script>

<template>
  <PanelSection
    title="Modals"
    description="A modal interrupts. Use one when the next step cannot happen anywhere else — a decision, a short form, a confirmation. Anything a person might want to compare against the page behind it belongs in a slideover instead."
  >
    <div class="divide-y divide-default">
      <ReferenceRow title="Basic" description="Title, body, and a single way out. Escape and a click outside both close it.">
        <UButton label="Open modal" variant="subtle" @click="basic = true" />

        <UModal v-model:open="basic" title="Trailing twelve months" description="How this figure is calculated.">
          <template #body>
            <p class="text-sm text-muted">
              Closing MRR for each of the last twelve months, taken on the last day of the month
              after invoices have settled. Months still in progress are excluded, which is why the
              current month appears only once it closes.
            </p>
          </template>
        </UModal>
      </ReferenceRow>

      <ReferenceRow title="With a form" description="The modal stays open while the request is in flight and closes on success — closing first would hide the error if it failed.">
        <UButton label="Create a plan" @click="form = true" />

        <UModal v-model:open="form" title="Create a plan">
          <template #body>
            <UFormField label="Plan name" name="plan" required help="Shown to customers at checkout.">
              <UInput v-model="planName" placeholder="Growth" class="w-full" autofocus />
            </UFormField>
          </template>
          <template #footer>
            <div class="flex w-full justify-end gap-2">
              <UButton
                label="Cancel"
                color="neutral"
                variant="ghost"
                :disabled="working"
                @click="form = false"
              />
              <UButton
                label="Create plan"
                :loading="working"
                :disabled="!planName.trim()"
                @click="saveAndClose"
              />
            </div>
          </template>
        </UModal>
      </ReferenceRow>

      <ReferenceRow title="Destructive confirmation" description="Name what is being destroyed and make the confirmation deliberate. A dialog whose default button destroys things gets clicked by momentum.">
        <UButton label="Delete workspace" color="error" variant="subtle" @click="destructive = true" />

        <UModal v-model:open="destructive" title="Delete this workspace">
          <template #body>
            <p class="text-sm text-muted">
              This removes the workspace and every report in it. Exports are not kept and this
              cannot be undone. Type
              <span class="font-mono font-medium text-highlighted">delete</span> to confirm.
            </p>
            <UInput
              v-model="confirmText"
              class="mt-4 w-full"
              placeholder="delete"
              aria-label="Type delete to confirm"
            />
          </template>
          <template #footer>
            <div class="flex w-full justify-end gap-2">
              <UButton label="Keep it" color="neutral" variant="ghost" @click="destructive = false" />
              <UButton label="Delete workspace" color="error" :disabled="!canDelete" @click="destroy" />
            </div>
          </template>
        </UModal>
      </ReferenceRow>

      <ReferenceRow title="Cannot be dismissed" description="Only for a step that genuinely must be finished. Escape and the backdrop are switched off, so the modal must provide its own way out — or it is a trap.">
        <UButton label="Open locked modal" color="neutral" variant="subtle" @click="locked = true" />

        <UModal
          v-model:open="locked"
          title="Accept the updated terms"
          :dismissible="false"
          :close="false"
        >
          <template #body>
            <p class="text-sm text-muted">
              Escape and clicking outside are disabled here. Note that this modal still gives you a
              button — a dismissible-false modal with no exit is a bug, not a design.
            </p>
          </template>
          <template #footer>
            <UButton label="I accept" block @click="locked = false" />
          </template>
        </UModal>
      </ReferenceRow>

      <ReferenceRow title="Wider content" description="Widen only for content that genuinely needs it — a table, a diff. A wide modal full of short paragraphs just makes the lines hard to read.">
        <UButton label="Open wide modal" color="neutral" variant="subtle" @click="wide = true" />

        <UModal v-model:open="wide" title="Invoice CAD-2026-4180" :ui="{ content: 'max-w-3xl' }">
          <template #body>
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-default text-left text-muted">
                  <th class="pb-2 font-medium">
                    Description
                  </th>
                  <th class="pb-2 text-right font-medium">
                    Seats
                  </th>
                  <th class="pb-2 text-right font-medium">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default">
                <tr
                  v-for="line in [
                    { label: 'Growth plan', seats: 18, amount: '$522.00' },
                    { label: 'Additional seats', seats: 3, amount: '$87.00' },
                    { label: 'Proration credit', seats: 0, amount: '−$12.40' }
                  ]"
                  :key="line.label"
                >
                  <td class="py-2 text-default">
                    {{ line.label }}
                  </td>
                  <td class="tnum py-2 text-right text-muted">
                    {{ line.seats || '—' }}
                  </td>
                  <td class="tnum py-2 text-right font-medium text-highlighted">
                    {{ line.amount }}
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </UModal>
      </ReferenceRow>
    </div>
  </PanelSection>
</template>
