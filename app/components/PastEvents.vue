<script setup lang="ts">
import { dateLabel, eventState } from '#shared/events'
const { locale, local, lang, t, path, events, now, demo } = useSite()
const showExamples = computed(() => demo)
const ended = computed(() => events.filter(event => event.listed && eventState(event, now.value) === 'ended').sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt)).slice(0, 3))
</script>
<template>
  <section id="past-events" class="past-events" aria-labelledby="past-title">
    <div class="container">
      <div class="section-header"><h2 id="past-title">{{ t('past') }}</h2><ExternalLink href="https://blog.coscup.org/">{{ t('viewAll') }}</ExternalLink></div>
      <ul class="past-list">
        <li v-for="event in ended" :key="event.slug"><time class="mono" :datetime="event.startsAt">{{ dateLabel(event.startsAt, locale, true) }}</time><NuxtLink class="past-name" :to="path(`/events/${event.slug}/`)" :lang="lang(event.title)">{{ local(event.title) }}</NuxtLink><span class="past-place" :lang="lang(event.venue)">{{ local(event.venue) }}</span><ExternalLink v-if="event.recordUrl" :href="event.recordUrl">{{ t('recap') }}</ExternalLink></li>
        <li><time class="mono" datetime="2026-08-08">{{ locale === 'en' ? '8–9 Aug 2026' : '2026.08.08–09' }}</time><span class="past-name">{{ locale === 'en' ? 'COSCUP 2026' : 'COSCUP 2026 開源人年會' }}</span><span class="past-place">{{ locale === 'en' ? 'Taipei · NTUST' : '台北・臺灣科技大學' }}</span><ExternalLink href="https://coscup.org/2026/">{{ locale === 'en' ? 'Event website' : '活動官網' }}</ExternalLink></li>
        <template v-if="showExamples">
          <li><time class="mono" datetime="2026-05-23">{{ locale === 'en' ? '23 May 2026' : '2026.05.23' }}</time><span class="past-name">{{ locale === 'en' ? 'COSCUP Community Meetup · Taichung' : 'COSCUP 社群聚會・台中' }}</span><span class="past-place">{{ locale === 'en' ? 'Taichung · NCHU' : '台中・中興大學' }}</span><span class="past-record" role="link" aria-disabled="true" :title="locale === 'en' ? 'Example event; recap link is not available.' : '示範活動，尚無活動紀錄連結。'">{{ t('recap') }} ↗</span></li>
          <li><time class="mono" datetime="2026-03-14">{{ locale === 'en' ? '14 Mar 2026' : '2026.03.14' }}</time><span class="past-name">{{ locale === 'en' ? 'Open-source Documentation Translation Sprint' : '開源文件翻譯松' }}</span><span class="past-place">{{ locale === 'en' ? 'Online' : '線上' }}</span><span class="past-record" role="link" aria-disabled="true" :title="locale === 'en' ? 'Example event; recap link is not available.' : '示範活動，尚無活動紀錄連結。'">{{ t('recap') }} ↗</span></li>
        </template>
      </ul>
    </div>
  </section>
</template>
