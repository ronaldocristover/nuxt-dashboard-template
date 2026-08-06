<template>
  <PanelSection
    title="Combinations"
    description="Real pages mix widths row by row. Each row is its own grid — that is simpler to reason about than one grid trying to describe the whole page."
  >
    <div class="divide-y divide-default">
      <GridExample
        title="The overview page"
        description="Stacked rows, each with its own column count: four stats, then an uneven pair, then another. Copy this shape for any new dashboard page."
        code="space-y-4
  ├─ grid gap-4 sm:grid-cols-2 xl:grid-cols-4
  ├─ grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]
  └─ grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
      >
        <div class="space-y-4">
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <GridBlock label="stat" height="sm" />
            <GridBlock label="stat" height="sm" />
            <GridBlock label="stat" height="sm" />
            <GridBlock label="stat" height="sm" />
          </div>
          <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <GridBlock label="movement" tone="lead" />
            <GridBlock label="trend chart" />
          </div>
          <div class="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <GridBlock label="activity" />
            <GridBlock label="invoices" />
          </div>
        </div>
      </GridExample>

      <GridExample
        title="Twelve-column grid"
        description="When rows need to share one set of gutters. Spans read as fractions of twelve, so 8 + 4 and 6 + 3 + 3 line up with each other."
        code="grid grid-cols-12 gap-4"
        child-code="col-span-12 lg:col-span-8 / lg:col-span-4 / lg:col-span-6 / lg:col-span-3"
      >
        <div class="grid grid-cols-12 gap-4">
          <GridBlock label="8" tone="lead" height="sm" class="col-span-12 lg:col-span-8" />
          <GridBlock label="4" height="sm" class="col-span-12 lg:col-span-4" />
          <GridBlock label="6" height="sm" class="col-span-12 lg:col-span-6" />
          <GridBlock label="3" height="sm" class="col-span-12 lg:col-span-3" />
          <GridBlock label="3" height="sm" class="col-span-12 lg:col-span-3" />
        </div>
      </GridExample>

      <GridExample
        title="Full-bleed row inside a grid"
        description="One item breaks out to the full width without leaving the grid. Good for a callout or an empty state between rows of cards."
        code="grid gap-4 sm:grid-cols-3"
        child-code="col-span-full on the breakout item"
      >
        <div class="grid gap-4 sm:grid-cols-3">
          <GridBlock label="card" height="sm" />
          <GridBlock label="card" height="sm" />
          <GridBlock label="card" height="sm" />
          <GridBlock label="col-span-full" tone="lead" height="sm" class="col-span-full" />
          <GridBlock label="card" height="sm" />
          <GridBlock label="card" height="sm" />
          <GridBlock label="card" height="sm" />
        </div>
      </GridExample>

      <GridExample
        title="Bento"
        description="Mixed row and column spans for a landing section or a feature overview. Keep it to one tall block — two competing for attention cancel each other out."
        code="grid gap-4 sm:grid-cols-3 sm:grid-rows-2"
        child-code="sm:col-span-2 sm:row-span-2 on the feature block"
      >
        <div class="grid gap-4 sm:grid-cols-3 sm:grid-rows-2">
          <GridBlock label="feature" tone="lead" height="lg" class="sm:col-span-2 sm:row-span-2" />
          <GridBlock label="detail" height="sm" />
          <GridBlock label="detail" height="sm" />
        </div>
      </GridExample>

      <GridExample
        title="Unequal heights"
        description="Grid children stretch to the tallest in their row by default. items-start stops a short card being padded out to match a tall neighbour."
        code="grid items-start gap-4 sm:grid-cols-3"
      >
        <div class="grid items-start gap-4 sm:grid-cols-3">
          <GridBlock label="tall" height="lg" />
          <GridBlock label="short" height="sm" />
          <GridBlock label="medium" height="md" />
        </div>
      </GridExample>
    </div>
  </PanelSection>
</template>
