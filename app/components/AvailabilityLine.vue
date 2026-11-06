<script setup lang="ts">
import { freshAvailability, registrationStatus, type Event } from '#shared/events'
const props = withDefaults(defineProps<{ event: Event; showSource?: boolean }>(), { showSource: true })
const { now, locale, t } = useSite()
const status = computed(() => registrationStatus(props.event, now.value))
const availability = computed(() => ['open', 'few'].includes(status.value) ? freshAvailability(props.event, now.value) : undefined)
</script>
<template>
  <div class="availability">
    <div class="status-line">
      <StatusBadge :status="status" />
      <span v-if="availability" class="remaining mono" :class="{ warning: status === 'few' }">{{ locale === 'en' ? `${availability.remaining} places left` : `剩 ${availability.remaining} 名` }}</span>
    </div>
    <AvailabilitySource v-if="showSource" :event="event" />
  </div>
</template>
