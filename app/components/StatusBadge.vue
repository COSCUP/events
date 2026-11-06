<script setup lang="ts">
import type { Status } from '#shared/events'
defineProps<{ status: Status }>()
const { t } = useSite()
</script>
<template><span class="status-badge" :class="`status-${status}`"><span aria-hidden="true">{{ ['cancelled', 'closed', 'ended'].includes(status) ? '−' : '●' }}</span>{{ t(status) }}</span></template>
