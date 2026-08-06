<template>
  <PanelSection
    title="Rules worth keeping"
    description="What separates a wizard someone finishes from one they abandon."
  >
    <ul class="divide-y divide-default">
      <li
        v-for="rule in [
          {
            title: 'Validate the current step, not the whole form',
            body: 'One schema per step. A single schema checked on every step flags fields nobody has reached yet, which reads as the form being broken rather than incomplete.'
          },
          {
            title: 'Back is always free',
            body: 'Going back must never validate, never warn, and never lose what was typed. The moment someone fears losing input, they stop exploring and start abandoning.'
          },
          {
            title: 'Forward is earned, backward is not',
            body: 'Clicking a future step in the stepper does nothing — it would show a summary built from empty fields. Clicking a past step goes straight there.'
          },
          {
            title: 'Show the running total',
            body: 'Anything that affects price or scope should show its effect as it changes. Revealing the number only at the end is how people feel ambushed at checkout.'
          },
          {
            title: 'Every review line links to its step',
            body: 'A summary that shows a typo but makes you press Back four times to fix it is worse than no summary.'
          },
          {
            title: 'Re-validate everything before submitting',
            body: 'Someone can jump back and edit after reaching Review. Checking only the last step means an invalid earlier field reaches your API.'
          },
          {
            title: 'Success replaces the form',
            body: 'Leaving the filled-in wizard on screen after a successful submit invites a second submission. Swap it for a confirmation with one clear next action.'
          }
        ]"
        :key="rule.title"
        class="py-4 first:pt-0 last:pb-0"
      >
        <h3 class="flex items-start gap-2 text-sm font-medium text-highlighted">
          <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0 text-primary" />
          {{ rule.title }}
        </h3>
        <p class="mt-1 ps-6 text-sm text-muted">
          {{ rule.body }}
        </p>
      </li>
    </ul>
  </PanelSection>
</template>
