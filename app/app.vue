<script setup lang="ts">
useSeoMeta({
  titleTemplate: title => (title ? `${title} · Cadence` : 'Cadence — revenue reporting for subscription businesses'),
  ogSiteName: 'Cadence',
  ogType: 'website',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp :toaster="{ position: 'top-right', duration: 4500 }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
