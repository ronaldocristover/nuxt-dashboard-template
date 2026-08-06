<template>
  <PanelSection
    title="One column"
    description="The default. Every layout in this template starts here and only splits when a wider screen gives it room to."
  >
    <div class="divide-y divide-default">
      <GridExample
        title="Full-width stack"
        description="Sections follow one another at the panel's full width. Used by the overview and analytics pages, where charts want every pixel."
        code="space-y-4"
      >
        <div class="space-y-4">
          <GridBlock label="Section" />
          <GridBlock label="Section" />
          <GridBlock label="Section" />
        </div>
      </GridExample>

      <GridExample
        title="Constrained width"
        description="Caps the line length so long-form settings and forms stay readable. Beyond about 70 characters a line, the eye loses its place returning to the left edge."
        code="mx-auto w-full max-w-3xl space-y-4"
      >
        <div class="mx-auto w-full max-w-3xl space-y-4">
          <GridBlock label="max-w-3xl" />
          <GridBlock label="max-w-3xl" />
        </div>
      </GridExample>

      <GridExample
        title="Centred and narrow"
        description="For a single task with nothing else competing for attention — the sign-in form uses this inside the auth layout."
        code="mx-auto w-full max-w-md space-y-4"
      >
        <div class="mx-auto w-full max-w-md space-y-4">
          <GridBlock label="max-w-md" tone="lead" />
          <GridBlock label="max-w-md" height="sm" />
        </div>
      </GridExample>
    </div>
  </PanelSection>
</template>
