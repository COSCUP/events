<script setup lang="ts">
defineProps<{ error: { statusCode?: number } }>()
const { t, path, asset } = useSite()
useHead({ title: '404 · COSCUP Events', meta: [{ name: 'robots', content: 'noindex' }] })
</script>
<template><main id="main" class="container error-page"><img :src="asset('images/coscup-green.svg')" width="100" height="38" alt="COSCUP"><p class="mono">{{ error.statusCode || 404 }}</p><h1>{{ t('notFound') }}</h1><p>{{ t('notFoundNote') }}</p><a class="button primary" :href="asset(path())">{{ t('back') }}</a></main></template>
