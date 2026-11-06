<script setup lang="ts">
onMounted(() => {
  let english = false
  try { english = localStorage.getItem('coscup-locale') === 'en' } catch { /* Default to Chinese. */ }
  navigateTo(english ? '/en/events/' : '/events/', { replace: true })
})
</script>
<template><EventsList /></template>
