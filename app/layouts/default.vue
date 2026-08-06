<template>
  <div class="flex min-h-svh flex-col bg-default">
    <MarketingSiteHeader />
    <main class="flex-1">
      <slot />
    </main>
    <MarketingSiteFooter />
  </div>
</template>
