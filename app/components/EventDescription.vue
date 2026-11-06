<script setup lang="ts">
import { renderMarkdown } from '#shared/markdown'
const props = defineProps<{ text: string }>()
const { locale } = useSite()
const html = computed(() => renderMarkdown(props.text, locale.value))
</script>
<template><div class="event-markdown" v-html="html" /></template>
