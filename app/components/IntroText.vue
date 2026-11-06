<script setup lang="ts">
const props = defineProps<{ text: string }>()
const blocks = computed(() => props.text.trim().split(/\n\s*\n/).map(block => {
  const lines = block.split('\n')
  return lines.every(line => /^\s*[-*•]\s+/.test(line)) ? { list: lines.map(line => line.replace(/^\s*[-*•]\s+/, '')) } : { paragraph: block }
}))
</script>
<template><div class="intro-text"><template v-for="(block, index) in blocks" :key="index"><ul v-if="block.list" class="prose-list"><li v-for="line in block.list" :key="line">{{ line }}</li></ul><p v-else class="intro-paragraph">{{ block.paragraph }}</p></template></div></template>
