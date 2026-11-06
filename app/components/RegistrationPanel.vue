<script setup lang="ts">
import { dateLabel, shortDateLabel, taipeiDate, timeRange, primaryAction, registrationStatus, timeLabel, type Event } from '#shared/events'
defineProps<{ event: Event }>()
const { locale, local, lang, t, now } = useSite()
const { share } = useEventActions()
</script>
<template>
  <div class="registration-panel">
    <div class="status-line"><StatusBadge :status="registrationStatus(event, now)" /></div>
    <div class="registration-date">
      <p class="date-large mono">{{ locale === 'en' ? dateLabel(event.startsAt, locale, true) : taipeiDate(event.startsAt).replaceAll('-', '.') }}</p>
      <p class="registration-time">{{ timeRange(event, locale).replace('–', '-') }} (UTC+8)</p>
      <p v-if="event.checkIn" class="secondary">{{ locale === 'en' ? `Check-in from ${event.checkIn}` : `${event.checkIn} 開始報到` }}</p>
      <p class="panel-venue secondary" :lang="lang(event.venue)">{{ local(event.venue) }}</p>
    </div>
    <p v-if="registrationStatus(event, now) === 'soon' && event.registration.opensAt" class="tertiary">{{ t('opens') }} · {{ dateLabel(event.registration.opensAt, locale) }} {{ timeLabel(event.registration.opensAt) }} (UTC+8)</p>
    <div class="primary-action" data-primary-action><EventPrimaryAction :event="event" /></div>
    <p v-if="event.registration.platform || event.fee || event.registration.closesAt" class="registration-note tertiary">
      <span v-if="event.registration.platform">{{ event.registration.platform }}</span><span v-if="event.fee" :lang="lang(event.fee)">{{ local(event.fee) }}</span><span v-if="event.registration.closesAt">{{ t('closes') }} {{ shortDateLabel(event.registration.closesAt, locale) }} {{ timeLabel(event.registration.closesAt) }}</span>
    </p>
    <p v-if="event.registration.mode === 'external' && event.registration.status === 'info'" class="tertiary">{{ t('officialNote') }}</p>
    <p v-if="event.registration.note" :lang="lang(event.registration.note)">{{ local(event.registration.note) }}</p>
    <div class="secondary-actions">
      <CalendarAction v-if="primaryAction(event, now)?.kind !== 'calendar'" :event="event" />
      <button class="button secondary-button" @click="share()">{{ t('share') }}</button>
    </div>
    <ExternalLink v-if="event.announcementUrl" :href="event.announcementUrl">{{ t('announcement') }}</ExternalLink>
    <ExternalLink v-if="event.recordUrl" :href="event.recordUrl">{{ t('recap') }}</ExternalLink>
  </div>
</template>
