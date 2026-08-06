<template>
  <PanelSection
    title="Two columns"
    description="A split earns its place when two things are read against each other. If the second column is just leftovers, keep one column."
  >
    <div class="divide-y divide-default">
      <GridExample
        title="Equal halves"
        description="For two things of the same weight — this month against last month, or a chart beside its legend."
        code="grid gap-4 lg:grid-cols-2"
      >
        <div class="grid gap-4 lg:grid-cols-2">
          <GridBlock label="1 / 2" />
          <GridBlock label="1 / 2" />
        </div>
      </GridExample>

      <GridExample
        title="Main and aside — 2:1"
        description="A primary panel with supporting detail. The overview page pairs the activity feed with recent invoices this way."
        code="grid gap-4 lg:grid-cols-3"
        child-code="lg:col-span-2 on the main panel"
      >
        <div class="grid gap-4 lg:grid-cols-3">
          <GridBlock label="lg:col-span-2" tone="lead" class="lg:col-span-2" />
          <GridBlock label="aside" />
        </div>
      </GridExample>

      <GridExample
        title="Aside and main — 1:2"
        description="Put the narrow column first when it drives what the wide one shows, like a filter list beside results."
        code="grid gap-4 lg:grid-cols-3"
        child-code="lg:col-span-2 on the second child"
      >
        <div class="grid gap-4 lg:grid-cols-3">
          <GridBlock label="filters" />
          <GridBlock label="lg:col-span-2" tone="lead" class="lg:col-span-2" />
        </div>
      </GridExample>

      <GridExample
        title="Fluid asymmetry"
        description="An explicit ratio when thirds are too coarse. minmax(0,…) is what stops a long word or a wide chart from blowing the column out."
        code="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]"
      >
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <GridBlock label="1fr" />
          <GridBlock label="1.6fr" tone="lead" />
        </div>
      </GridExample>

      <GridExample
        title="Sticky aside"
        description="Keeps a short column in view while a long one scrolls past it. The FAQ heading on the landing page works this way."
        code="grid gap-4 lg:grid-cols-3"
        child-code="lg:sticky lg:top-4 lg:self-start on the aside"
      >
        <div class="grid gap-4 lg:grid-cols-3">
          <div class="lg:sticky lg:top-4 lg:self-start">
            <GridBlock label="sticky aside" tone="lead" />
          </div>
          <div class="space-y-4 lg:col-span-2">
            <GridBlock label="long content" />
            <GridBlock label="long content" />
            <GridBlock label="long content" />
          </div>
        </div>
      </GridExample>
    </div>
  </PanelSection>
</template>
