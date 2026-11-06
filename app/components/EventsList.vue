<script setup lang="ts">
import { upcomingEvents, eventState, monthDayLabel, taipeiDate } from '#shared/events'
const { locale, local, lang, path, t, events, now, asset, siteRoot } = useSite()
const upcoming = computed(() => upcomingEvents(events, now.value))
const previousEvent = computed(() => events.filter(event => event.listed && eventState(event, now.value) === 'ended').sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt))[0])
const previousDate = computed(() => {
  if (!previousEvent.value) return ''
  const date = previousEvent.value.startsAt
  return locale.value === 'en' ? monthDayLabel(date, locale.value) : `${taipeiDate(date).slice(5).replace('-', '.')} ${new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', weekday: 'short' }).format(new Date(date))}`
})
const subscribeURL = `${siteRoot.replace(/^https?:/, 'webcal:')}/calendar.ics`
usePageMeta(() => t('upcoming'), () => locale.value === 'en' ? 'Find COSCUP meetups, workshops, and open-source community events.' : '探索 COSCUP 社群聚會、工作坊與開源活動，查看活動資訊及參加方式。')
</script>
<template>
  <main id="main" tabindex="-1">
    <section class="container events-section" :class="{ 'empty-list': !upcoming.length }" aria-labelledby="page-title">
      <div class="list-heading">
        <div><h1 id="page-title" tabindex="-1">{{ t('upcoming') }}</h1><p v-if="upcoming.length" class="secondary">{{ upcoming.length }} {{ locale === 'en' ? (upcoming.length === 1 ? 'event' : 'events') : '場' }} · {{ t('timezone') }}</p></div>
      </div>
      <div v-if="upcoming.length" class="event-list"><EventCard v-for="event in upcoming" :key="event.slug" :event="event" /></div>
      <template v-else>
        <div class="empty-state">
          <h2>{{ t('empty') }}</h2><p class="secondary">{{ t('emptyNote') }}</p>
        </div>
        <h2 class="notification-title">{{ t('stayInformed') }}</h2>
        <div class="notification-grid">
          <article><h3>{{ locale === 'en' ? 'Calendar subscription' : '行事曆訂閱' }}</h3><p>{{ t('calendarSupport') }}</p><a class="text-link" :href="subscribeURL">{{ t('subscribe') }} ↗</a></article>
          <article><h3>RSS</h3><p>{{ t('rssSupport') }}</p><ExternalLink :href="asset('feed.xml')">{{ locale === 'en' ? 'RSS feed' : 'RSS 網址' }}</ExternalLink></article>
          <article><h3>{{ locale === 'en' ? 'Telegram community' : 'Telegram 社群' }}</h3><p>@coscupchat</p><ExternalLink href="https://t.me/coscupchat">{{ locale === 'en' ? 'Join the conversation' : '加入社群' }}</ExternalLink></article>
        </div>
        <section v-if="previousEvent" class="last-event-section" aria-labelledby="last-event-title">
          <h2 id="last-event-title">{{ locale === 'en' ? 'Most recent event' : '上一場活動' }}</h2>
          <article class="last-event">
            <div class="last-event-info">
              <div class="last-event-meta"><time class="mono" :datetime="previousEvent.startsAt">{{ previousDate }}</time><StatusBadge status="ended" /></div>
              <h3 :lang="lang(previousEvent.title)">{{ local(previousEvent.title) }}</h3>
              <p v-if="previousEvent.recordUrl" class="secondary">{{ locale === 'en' ? 'Slides, recordings, and notes' : '簡報・錄影・共筆' }}</p>
            </div>
            <div class="last-event-actions">
              <ExternalLink v-if="previousEvent.recordUrl" class="button secondary-button" :href="previousEvent.recordUrl">{{ t('recap') }}</ExternalLink>
              <NuxtLink class="text-link" :to="path(`/events/${previousEvent.slug}/`)">{{ locale === 'en' ? 'Event page' : '活動頁' }} →</NuxtLink>
            </div>
          </article>
        </section>
      </template>
    </section>
    <PastEvents />
  </main>
</template>
