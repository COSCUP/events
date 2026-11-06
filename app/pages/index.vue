<script setup lang="ts">
onMounted(() => {
  let english = false
  try { english = localStorage.getItem('coscup-locale') === 'en' } catch { /* Default to Chinese. */ }
  if (english) navigateTo('/en/', { replace: true })
})
</script>
<template><EventsList /></template>
