<script setup lang="ts">
import type { Event } from '#shared/events'
import { googleCalendarUrl } from '#shared/calendar'

const props = withDefaults(defineProps<{ event: Event; primary?: boolean }>(), { primary: false })
const { locale, t, siteRoot } = useSite()
const { download } = useEventActions()
const id = useId()
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const menu = useTemplateRef<HTMLElement>('menu')
const open = ref(false)
const googleURL = computed(() => googleCalendarUrl(props.event, locale.value, siteRoot))
const items = () => Array.from(menu.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') || [])
const close = (restoreFocus = false) => {
  menu.value?.hidePopover()
  if (restoreFocus) trigger.value?.focus()
}
function position() {
  if (!trigger.value || !menu.value) return
  const anchor = trigger.value.getBoundingClientRect()
  const bounds = menu.value.getBoundingClientRect()
  const below = anchor.bottom + 8
  const top = below + bounds.height > innerHeight - 8 ? anchor.top - bounds.height - 8 : below
  menu.value.style.left = `${Math.max(8, Math.min(anchor.left, innerWidth - bounds.width - 8))}px`
  menu.value.style.top = `${Math.max(8, Math.min(top, innerHeight - bounds.height - 8))}px`
  menu.value.style.visibility = 'visible'
}
function preparing(event: ToggleEvent) {
  if (event.newState === 'open' && menu.value) menu.value.style.visibility = 'hidden'
}
function toggled(event: ToggleEvent) {
  open.value = event.newState === 'open'
  if (open.value) {
    position()
    if (!menu.value?.contains(document.activeElement)) items()[0]?.focus({ preventScroll: true })
  }
}
function openWithKeyboard(last = false) {
  menu.value?.showPopover()
  position()
  const choices = items()
  choices[last ? choices.length - 1 : 0]?.focus({ preventScroll: true })
}
function navigate(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); close(true); return }
  const choices = items()
  const current = choices.indexOf(document.activeElement as HTMLElement)
  const index = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : event.key === 'ArrowDown' ? (current + 1) % choices.length : event.key === 'ArrowUp' ? (current - 1 + choices.length) % choices.length : -1
  if (index >= 0) { event.preventDefault(); choices[index]?.focus() }
}
function focusLeft(event: FocusEvent) {
  if (event.relatedTarget && !menu.value?.contains(event.relatedTarget as Node)) close()
}
const viewportChanged = () => { if (open.value) close() }
onMounted(() => {
  window.addEventListener('resize', viewportChanged)
  document.addEventListener('scroll', viewportChanged, true)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', viewportChanged)
  document.removeEventListener('scroll', viewportChanged, true)
})
</script>
<template>
  <div class="calendar-action">
    <button ref="trigger" type="button" class="button" :class="primary ? 'primary' : 'secondary-button'" :popovertarget="id" aria-haspopup="menu" :aria-expanded="open" :aria-controls="id" @keydown.down.prevent="openWithKeyboard()" @keydown.up.prevent="openWithKeyboard(true)">
      {{ t('calendar') }}<svg class="calendar-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </button>
    <div :id="id" ref="menu" class="calendar-menu" popover="auto" role="menu" :aria-label="t('calendar')" @beforetoggle="preparing" @toggle="toggled" @keydown="navigate" @focusout="focusLeft">
      <ExternalLink :href="googleURL" role="menuitem" tabindex="-1" @click="close()">Google Calendar</ExternalLink>
      <button type="button" role="menuitem" tabindex="-1" @click="download(event); close(true)">{{ t('downloadICS') }}<span aria-hidden="true">↓</span></button>
    </div>
  </div>
</template>
