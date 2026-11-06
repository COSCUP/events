<script setup lang="ts">
import type { Fact } from '#shared/events'
defineProps<{ rows: Fact[] }>()
const { local, lang } = useSite()
</script>
<template><dl class="fact-rows"><div v-for="(row, index) in rows" :key="index"><dt :lang="lang(row.label)">{{ local(row.label) }}</dt><dd><ExternalLink v-if="row.url" :href="row.url" :lang="lang(row.value)">{{ local(row.value) }}</ExternalLink><span v-else :lang="lang(row.value)">{{ local(row.value) }}</span><span v-if="row.note" class="fact-note" :lang="lang(row.note)">{{ local(row.note) }}</span></dd></div></dl></template>
