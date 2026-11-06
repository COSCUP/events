<script setup lang="ts">
import { dateLabel, eventState } from '#shared/events'
const { locale, local, lang, t, path, events, now } = useSite()
const ended = computed(() => events.filter(event => event.listed && eventState(event, now.value) === 'ended').sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt)).slice(0, 3))
</script>
<template>
  <section v-if="ended.length" id="past-events" class="past-events" aria-labelledby="past-title">
    <div class="container">
      <div class="section-header"><h2 id="past-title">{{ t('past') }}</h2><ExternalLink href="https://blog.coscup.org/">{{ t('viewAll') }}</ExternalLink></div>
      <ul class="past-list">
        <li v-for="event in ended" :key="event.slug"><time class="mono" :datetime="event.startsAt">{{ dateLabel(event.startsAt, locale, true) }}</time><NuxtLink class="past-name" :to="path(`/events/${event.slug}/`)" :lang="lang(event.title)">{{ local(event.title) }}</NuxtLink><span class="past-place" :lang="lang(event.venue)">{{ local(event.venue) }}</span><ExternalLink v-if="event.recordUrl || event.announcementUrl" :href="(event.recordUrl || event.announcementUrl)!">{{ event.recordUrl ? t('recap') : t('announcement') }}</ExternalLink></li>
      </ul>
    </div>
  </section>
</template>
