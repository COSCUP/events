<script setup lang="ts">
import aboutData from '~/data/about.json'
import conductData from '~/data/conduct.json'
import { conductReturnId } from '#shared/navigation'
const props = defineProps<{ type: 'about' | 'conduct' }>()
const { locale, t, path, events } = useSite()
const route = useRoute()
const key = computed(() => locale.value === 'en' ? 'en' : 'zh')
const data = computed(() => props.type === 'about' ? aboutData[key.value] : conductData[key.value])
const fromEvent = computed(() => typeof route.query.from === 'string' ? events.find(event => event.slug === route.query.from) : undefined)
const backTo = computed(() => fromEvent.value ? `${path(`/events/${fromEvent.value.slug}/`)}#${conductReturnId(route.query.entry, !!fromEvent.value.notices?.length)}` : path())
const aboutAnchors = ['about-coscup', 'origins', 'open-source', 'pillars', 'organization', 'roles']
const blocks = computed(() => {
  if (props.type === 'conduct') return conductData[key.value].blocks
  let heading = 0
  return aboutData[key.value].blocks.slice(3).map(block => ['h2', 'h3'].includes(block.kind) ? { ...block, anchor: aboutAnchors[heading++] } : block)
})
const headings = computed(() => blocks.value.filter(block => 'anchor' in block && block.anchor))
const shortNames = computed(() => locale.value === 'en' ? ['Participants', 'Scope & timing', 'Expected behavior', 'Unacceptable behavior', 'How to report', 'Processing team', 'Our actions', 'References'] : ['關於參與者', '適用時間與範圍', '期許的行為', '不容許的行為', '通報方式', '處理團隊', '我們的處理', '參考資料'])
const aboutCallout = computed(() => aboutData[key.value].blocks[2]!.text.split(/\n+/))
usePageMeta(() => data.value.title, () => props.type === 'about' ? aboutData[key.value].blocks[4]!.text : (locale.value === 'en' ? 'COSCUP Code of Conduct · v20240109 · Reporting & support: coc@coscup.org' : 'COSCUP 社群守則・v20240109・通報與協助：coc@coscup.org'))
</script>
<template>
  <main id="main" tabindex="-1" class="container document-grid" :class="`document-${type}`">
    <div class="document-heading">
      <NuxtLink class="back-link" :to="backTo">← {{ fromEvent ? t('backEvent') : t('back') }}</NuxtLink>
      <h1 id="page-title" tabindex="-1">{{ data.title }}</h1>
      <p v-if="type === 'conduct'" class="mono tertiary">v20240109 · CC BY 4.0</p>
    </div>
    <aside class="document-aside">
      <div v-if="type === 'conduct'" class="document-callout">
        <h2>{{ t('report') }}</h2><p>{{ t('reportNote') }}</p><a class="button primary mail-link" href="mailto:coc@coscup.org">coc@coscup.org</a><p class="tertiary">{{ t('mailHint') }}</p>
      </div>
      <div v-else class="document-callout"><h2>{{ aboutData[key].blocks[1]!.text }}</h2><p>{{ aboutCallout[0] }}</p><NuxtLink class="text-link" :to="path('/code-of-conduct/')">{{ aboutCallout[1] }}</NuxtLink></div>
      <nav v-if="type === 'conduct'" class="section-nav document-toc" :aria-label="t('contents')"><p>{{ t('contents') }}</p><a v-for="(heading, index) in headings" :key="heading.text" :href="`#${'anchor' in heading ? heading.anchor : ''}`" :class="{ 'mobile-priority': 'anchor' in heading && ['report', 'unacceptable', 'actions'].includes(heading.anchor || '') }">{{ shortNames[index] }}</a></nav>
    </aside>
    <article class="document-article">
      <DocumentBody :blocks="blocks" />
      <section v-if="type === 'about'" class="source-attribution" aria-labelledby="source-title"><h2 id="source-title">{{ t('source') }}</h2>
        <p>{{ locale === 'en' ? 'COSCUP 2026 · Official English text' : 'COSCUP 2026・官方中文原文' }}</p><ExternalLink :href="aboutData[key].source">{{ t('officialSource') }}</ExternalLink><p class="tertiary">MIT · Copyright © COSCUP</p>
      </section>
      <nav v-else class="source-attribution" aria-label="HackMD">
        <ExternalLink :href="conductData[key].source">{{ locale === 'en' ? 'English (HackMD)' : '中文（HackMD）' }}</ExternalLink>
      </nav>
    </article>
  </main>
</template>
