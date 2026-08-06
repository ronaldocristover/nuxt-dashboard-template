<script setup lang="ts">
const a = ref('')
const b = ref('')
const c = ref('not-an-email')
const d = ref('')
</script>

<template>
  <PanelSection
    title="Anatomy of a field"
    description="Every part of UFormField has one job. Using two of them for the same job is what makes a form feel noisy."
  >
    <div class="divide-y divide-default">
      <FormsRow title="Label and required" description="The asterisk marks what cannot be left blank. If almost everything is required, mark the optional ones instead.">
        <UFormField label="Workspace name" name="a" required>
          <UInput v-model="a" placeholder="Northwind Labs" class="w-full" />
        </UFormField>
      </FormsRow>

      <FormsRow title="Description and help" description="Description explains the field before it is filled. Help sits below and answers what someone asks while filling it.">
        <UFormField
          label="Billing email"
          name="b"
          description="Invoices and payment failures go here."
          help="Use a shared inbox — personal addresses break when people leave."
        >
          <UInput v-model="b" type="email" placeholder="billing@company.com" class="w-full" />
        </UFormField>
      </FormsRow>

      <FormsRow title="Hint" description="A short aside opposite the label. Good for optionality and for a link out.">
        <UFormField label="Slack channel" name="d" hint="Optional">
          <UInput v-model="d" placeholder="#revenue" class="w-full" />
        </UFormField>
      </FormsRow>

      <FormsRow title="Error" description="Says what is wrong and what to do instead. It replaces help text rather than stacking on top of it.">
        <UFormField
          label="Work email"
          name="c"
          error="That does not look like an email address"
          required
        >
          <UInput v-model="c" class="w-full" />
        </UFormField>
      </FormsRow>

      <FormsRow title="Side by side" description="Two fields share a row only when they are read as one value — a name, or a date range.">
        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField label="First name" name="first">
            <UInput placeholder="Amara" class="w-full" />
          </UFormField>
          <UFormField label="Last name" name="last">
            <UInput placeholder="Adeyemi" class="w-full" />
          </UFormField>
        </div>
      </FormsRow>
    </div>
  </PanelSection>
</template>
