<script setup lang="ts">
import { monthDayLabel, timeRange, timeLabel, plainIntro, taipeiDate, registrationStatus, type Event } from '#shared/events'
const props = defineProps<{ event: Event }>()
const { locale, local, lang, t, path, now } = useSite()
const parts = computed(() => taipeiDate(props.event.startsAt).split('-'))
const month = computed(() => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Taipei', month: 'short' }).format(new Date(props.event.startsAt)))
const excerpt = computed(() => {
  const paragraphs = local(props.event.intro).trim().split(/\n\s*\n/)
  return plainIntro(paragraphs[0] || '') + (paragraphs.length > 1 ? '…' : '')
})
const format = computed(() => locale.value === 'en' ? { 'in-person': 'In person', online: 'Online', hybrid: 'Hybrid' }[props.event.format] : { 'in-person': '實體活動', online: '線上活動', hybrid: '混合活動' }[props.event.format])
</script>
<template>
  <article class="event-card" :aria-labelledby="`event-${event.slug}`">
    <div class="card-date">
      <span class="date-year">{{ parts[0] }}</span>
      <time class="date-numbers mono" :datetime="event.startsAt"><template v-if="locale === 'en'"><span>{{ parts[2] }}</span> <span>{{ month }}</span></template><template v-else>{{ parts[1] }}.{{ parts[2] }}</template></time>
      <span class="weekday">{{ new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'Asia/Taipei' }).format(new Date(event.startsAt)) }}</span>
      <span class="card-desktop-time mono">{{ timeRange(event, locale) }}</span>
      <span class="card-desktop-time tertiary">UTC+8</span>
    </div>
    <div class="card-info">
      <p class="event-kicker"><strong v-if="event.category" :lang="lang(event.category)">{{ local(event.category) }} <span aria-hidden="true"> · </span></strong>{{ format }}</p>
      <h2><NuxtLink :id="`event-${event.slug}`" :to="path(`/${event.slug}/`)" :lang="lang(event.title)" data-remember-focus>{{ local(event.title) }}</NuxtLink></h2>
      <p v-if="local(event.intro).trim()" class="card-summary" :lang="lang(event.intro)">{{ excerpt }}</p>
      <p class="card-mobile-time mono">{{ timeRange(event, locale) }} · UTC+8</p>
      <dl class="card-facts">
        <div class="card-venue"><dt>{{ t('venue') }}</dt><dd :lang="lang(event.venue)">{{ local(event.venue) }}<span v-if="event.address" class="fact-note" :class="{ 'venue-address': event.format !== 'online' }" :lang="lang(event.address)">{{ local(event.address) }}</span></dd></div>
        <div v-if="event.fee" class="card-fee"><dt>{{ t('fee') }}</dt><dd :lang="lang(event.fee)">{{ local(event.fee) }}</dd></div>
        <div v-if="event.registration.closesAt" class="card-deadline"><dt>{{ t('closes') }}</dt><dd>{{ monthDayLabel(event.registration.closesAt, locale) }} {{ timeLabel(event.registration.closesAt) }}</dd></div>
      </dl>
    </div>
    <div class="card-actions">
      <div class="status-line"><StatusBadge :status="registrationStatus(event, now)" /></div>
      <EventPrimaryAction :event="event" />
      <p v-if="event.registration.mode === 'external' && event.registration.status === 'info'" class="tertiary">{{ t('officialNote') }}</p>
      <NuxtLink :id="`detail-${event.slug}`" class="detail-link" :to="path(`/${event.slug}/`)" data-remember-focus>{{ t('details') }} <span aria-hidden="true">→</span><span class="sr-only"> — {{ local(event.title) }}</span></NuxtLink>
    </div>
  </article>
</template>
