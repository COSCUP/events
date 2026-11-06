<script setup lang="ts">
const { locale } = useSite()
const route = useRoute()
const targetLocale = computed(() => locale.value === 'en' ? 'zh-TW' : 'en')
const label = computed(() => locale.value === 'en' ? '切換為繁體中文' : 'Switch to English')
const target = computed(() => ({
  path: locale.value === 'en' ? route.path.replace(/^\/en(?=\/|$)/, '') || '/' : `/en${route.path}`,
  query: route.query,
  hash: route.hash === '#changelog' ? '' : route.hash,
}))
function saveLanguage() {
  try { localStorage.setItem('coscup-locale', targetLocale.value) } catch { /* Preferences are optional. */ }
}
</script>

<template>
  <NuxtLink class="language-button" :to="target" :lang="targetLocale" :hreflang="targetLocale" :aria-label="label" :title="label" @click="saveLanguage">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <path d="M3 5h12M9 3v2M6 5c0 6 6 9 6 9M12 5c0 6-6 9-6 9M13 21l4-10 4 10M14.2 18h5.6" />
    </svg>
  </NuxtLink>
</template>
