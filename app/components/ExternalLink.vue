<script setup lang="ts">
defineProps<{ href: string; label?: string }>()
const { t } = useSite()
</script>
<template>
  <a :href="href" target="_blank" rel="noopener noreferrer" :aria-label="label ? `${label} (${t('newTab')})` : undefined">
    <slot /><span class="external-arrow" aria-hidden="true"> ↗</span><span v-if="!label" class="sr-only"> ({{ t('newTab') }})</span>
  </a>
</template>
