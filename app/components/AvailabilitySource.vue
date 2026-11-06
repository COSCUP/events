<script setup lang="ts">
import { freshAvailability, registrationStatus, shortDateLabel, timeLabel, type Event } from '#shared/events'
const props = defineProps<{ event: Event }>()
const { now, locale } = useSite()
const availability = computed(() => ['open', 'few'].includes(registrationStatus(props.event, now.value)) ? freshAvailability(props.event, now.value) : undefined)
</script>
<template><p v-if="availability" class="availability-source">{{ availability.source }} · {{ locale === 'en' ? 'Updated ' : '' }}{{ shortDateLabel(availability.updatedAt, locale) }} {{ timeLabel(availability.updatedAt) }}{{ locale === 'en' ? '' : ' 更新' }}</p></template>
