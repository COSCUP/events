<script setup lang="ts">
type Block = { kind: string; text: string; anchor?: string | null; level?: number; url?: string }
type ListItem = { block: Block; children: Block[] }
const props = defineProps<{ blocks: Block[] }>()
const groups = computed(() => {
  const result: ({ kind: 'list'; items: ListItem[] } | { kind: 'block'; block: Block })[] = []
  for (const block of props.blocks) {
    if (block.kind === 'bullet' || block.kind === 'li') {
      let group = result.at(-1)
      if (group?.kind !== 'list') { group = { kind: 'list', items: [] }; result.push(group) }
      if (block.level && group.items.length) group.items.at(-1)!.children.push(block)
      else group.items.push({ block, children: [] })
    } else result.push({ kind: 'block', block })
  }
  return result
})
</script>
<template>
  <div class="document-prose">
    <template v-for="(group, index) in groups" :key="index">
      <ul v-if="group.kind === 'list'"><li v-for="(item, itemIndex) in group.items" :key="itemIndex">{{ item.block.text }}<ul v-if="item.children.length"><li v-for="(child, childIndex) in item.children" :key="childIndex">{{ child.text }}</li></ul></li></ul>
      <template v-else><component :is="group.block.kind === 'h3' ? 'h3' : 'h2'" v-if="['heading', 'h2', 'h3'].includes(group.block.kind)" :id="group.block.anchor" tabindex="-1">{{ group.block.text }}</component><p v-else-if="group.block.kind === 'reference'"><ExternalLink :href="group.block.url!">{{ group.block.text }}</ExternalLink></p><p v-else>{{ group.block.text }}</p></template>
    </template>
  </div>
</template>
