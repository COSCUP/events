<script setup lang="ts">
import { primaryAction, type Event } from '#shared/events'
const props = defineProps<{ event: Event }>()
const { t, now, demo } = useSite()
const { download } = useEventActions()
const action = computed(() => primaryAction(props.event, now.value))
const label = computed(() => {
  switch (action.value?.kind) {
    case 'register':
    case 'official': return t('register')
    case 'waitlist': return t('waitlist')
    case 'join': return t('enter')
    case 'reminder': return t('reminder')
    default: return t('calendar')
  }
})
</script>
<template>
  <ExternalLink v-if="action?.url" class="button primary" :href="action.url" :title="demo ? t('demoAction') : undefined">{{ label }}</ExternalLink>
  <CalendarAction v-else-if="action?.kind === 'calendar'" :event="event" primary />
  <button v-else-if="action" class="button primary" @click="download(event, action.kind === 'reminder')">{{ label }}</button>
</template>
