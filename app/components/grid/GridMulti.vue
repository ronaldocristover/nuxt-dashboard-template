<template>
  <PanelSection
    title="Three columns and more"
    description="Past two columns the count becomes a function of screen width, not of the content. Step it up one breakpoint at a time."
  >
    <div class="divide-y divide-default">
      <GridExample
        title="Stat row"
        description="Four figures across, two on a tablet, one on a phone. This is what the KPI row on the overview and analytics pages uses."
        code="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <GridBlock label="stat" height="sm" />
          <GridBlock label="stat" height="sm" />
          <GridBlock label="stat" height="sm" />
          <GridBlock label="stat" height="sm" />
        </div>
      </GridExample>

      <GridExample
        title="Card grid"
        description="For a collection whose items are peers — plans, integrations, templates. Three across is usually the ceiling before cards get too narrow to read."
        code="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <GridBlock label="card" />
          <GridBlock label="card" />
          <GridBlock label="card" />
          <GridBlock label="card" />
          <GridBlock label="card" />
          <GridBlock label="card" />
        </div>
      </GridExample>

      <GridExample
        title="Hairline grid"
        description="Cards sharing borders instead of gaps. Cheaper visually than six separate outlines, and used by the capabilities block on the landing page."
        code="grid gap-px overflow-hidden rounded-[calc(var(--ui-radius)*1.5)] ring ring-default sm:grid-cols-2"
        child-code="bg-default p-6 outline outline-default"
      >
        <div class="grid gap-px overflow-hidden rounded-[calc(var(--ui-radius)*1.5)] ring ring-default sm:grid-cols-2">
          <div class="flex min-h-24 items-center justify-center bg-default p-6 outline outline-default">
            <span class="eyebrow text-dimmed">cell</span>
          </div>
          <div class="flex min-h-24 items-center justify-center bg-default p-6 outline outline-default">
            <span class="eyebrow text-dimmed">cell</span>
          </div>
          <div class="flex min-h-24 items-center justify-center bg-default p-6 outline outline-default">
            <span class="eyebrow text-dimmed">cell</span>
          </div>
          <div class="flex min-h-24 items-center justify-center bg-default p-6 outline outline-default">
            <span class="eyebrow text-dimmed">cell</span>
          </div>
        </div>
      </GridExample>

      <GridExample
        title="Auto-fit"
        description="Lets the browser decide the column count from a minimum width. Useful when the number of items is unknown and you would rather not pick breakpoints."
        code="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(12rem,1fr))]"
      >
        <div class="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(12rem,1fr))]">
          <GridBlock label="auto" height="sm" />
          <GridBlock label="auto" height="sm" />
          <GridBlock label="auto" height="sm" />
          <GridBlock label="auto" height="sm" />
          <GridBlock label="auto" height="sm" />
        </div>
      </GridExample>
    </div>
  </PanelSection>
</template>
