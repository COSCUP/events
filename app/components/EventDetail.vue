<script setup lang="ts">
import { introMode, hasFallback, dateLabel, monthDayLabel, taipeiDate, timeRange, timeLabel, primaryAction, registrationStatus, upcomingEvents, type Fact } from '#shared/events'
const { locale, local, lang, t, path, events, now, conductLink } = useSite()
const route = useRoute()
const event = events.find(event => event.slug === route.params.slug)
if (!event) throw createError({ statusCode: 404, statusMessage: 'Event not found' })
const mode = computed(() => introMode(local(event.intro)))
const description = computed(() => event.description?.[locale.value] || '')
const hasVenueDetails = Boolean(event.travel?.length || event.address || event.mapUrl)
const fallback = computed(() => hasFallback(event, locale.value))
const activeSection = ref('intro')
const stickyVisible = ref(false)
const registration = useTemplateRef<HTMLElement>('registration')
const sections = computed(() => [
  ...(mode.value === 'long' ? [{ id: 'intro', title: t('intro') }] : []),
  ...(description.value ? [{ id: 'description', title: t('description') }] : []),
  ...(event.audience?.length ? [{ id: 'audience', title: t('audience') }] : []),
  ...(event.preparation?.length ? [{ id: 'preparation', title: t('preparation') }] : []),
  ...(event.agenda?.length ? [{ id: 'agenda', title: t('agenda') }] : []),
  ...(hasVenueDetails ? [{ id: 'venue', title: t('travel') }] : []),
  ...(event.participation?.length ? [{ id: 'join', title: t('join') }] : []),
  ...(event.notices?.length ? [{ id: 'notes', title: t('notices') }] : []),
])
const mobileSections = computed(() => sections.value.filter(section => ['intro', 'description', 'agenda', 'venue', 'join'].includes(section.id)))
const others = computed(() => upcomingEvents(events, now.value).filter(item => item.slug !== event.slug))
const siblingDate = (date: string) => locale.value === 'en' ? monthDayLabel(date, locale.value) : `${taipeiDate(date).slice(5).replace('-', '.')} ${new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', weekday: 'short' }).format(new Date(date))}`
const basicFacts = computed<Fact[]>(() => {
  const labels = (zh: string, en: string) => ({ 'zh-TW': zh, en })
  return [
    { label: labels('地點', 'Venue'), value: event.venue, note: event.address },
    ...(event.language ? [{ label: labels('形式', 'Format'), value: event.language, note: event.languageNote }] : []),
    ...(event.fee ? [{ label: labels('費用', 'Fee'), value: event.fee }] : []),
    ...(event.registration.closesAt ? [{ label: labels('報名截止', 'Closes'), value: labels(`${monthDayLabel(event.registration.closesAt, 'zh-TW')} ${timeLabel(event.registration.closesAt)}`, `${monthDayLabel(event.registration.closesAt, 'en')} ${timeLabel(event.registration.closesAt)}`) }] : []),
  ]
})
usePageMeta(() => local(event.title), () => local(event.intro) || `${local(event.title)} · ${dateLabel(event.startsAt, locale.value)} · ${local(event.venue)}`)

onMounted(() => {
  const action = registration.value?.querySelector('[data-primary-action]')
  const past = document.querySelector('#past-events') || document.querySelector('.site-footer')
  const updateSticky = () => {
    stickyVisible.value = !!action && action.getBoundingClientRect().bottom < 0 && !!past && past.getBoundingClientRect().top > window.innerHeight
  }
  const observer = new IntersectionObserver(updateSticky)
  if (action) observer.observe(action)
  if (past) observer.observe(past)
  const updateSection = () => {
    const candidates = sections.value.map(section => document.getElementById(section.id)).filter((element): element is HTMLElement => !!element)
    const active = candidates.filter(element => element.getBoundingClientRect().top < 180).at(-1) || candidates[0]
    if (active) activeSection.value = active.id
    updateSticky()
  }
  window.addEventListener('scroll', updateSection, { passive: true })
  window.addEventListener('resize', updateSticky)
  updateSection()
  onBeforeUnmount(() => { observer.disconnect(); window.removeEventListener('scroll', updateSection); window.removeEventListener('resize', updateSticky) })
})
</script>
<template>
  <main id="main" tabindex="-1" class="detail-page">
    <div class="container detail-grid">
      <div class="detail-heading">
        <NuxtLink class="back-link" :to="`${path()}#event-${event.slug}`"><span aria-hidden="true">← </span>{{ t('back') }}</NuxtLink>
        <p v-if="event.category" class="event-kicker"><strong :lang="lang(event.category)">{{ local(event.category) }}</strong> · {{ locale === 'en' ? { 'in-person': 'In person', online: 'Online', hybrid: 'Hybrid' }[event.format] : { 'in-person': '實體活動', online: '線上活動', hybrid: '混合活動' }[event.format] }}</p>
        <h1 id="page-title" :lang="lang(event.title)" tabindex="-1">{{ local(event.title) }}</h1>
        <p v-if="mode === 'short'" class="short-intro secondary" :lang="lang(event.intro)">{{ local(event.intro) }}</p>
        <p v-if="fallback" class="translation-notice" role="note">{{ t('fallback') }}</p>
      </div>
      <aside ref="registration" class="detail-sidebar" :aria-label="t('info')">
        <RegistrationPanel :event="event" />
        <nav v-if="sections.length > 1" class="section-nav desktop-toc" :aria-label="t('contents')"><p>{{ t('contents') }}</p><a v-for="section in sections" :key="section.id" :href="`#${section.id}`" :class="{ active: activeSection === section.id }" :aria-current="activeSection === section.id ? 'location' : undefined">{{ section.title }}</a></nav>
      </aside>
      <div class="detail-body">
        <nav v-if="mobileSections.length > 1" class="mobile-toc" :aria-label="t('contents')"><a v-for="section in mobileSections" :key="section.id" :href="`#${section.id}`">{{ section.id === 'venue' ? (locale === 'en' ? 'Travel' : '交通') : section.title }}</a></nav>
        <dl class="fact-rows desktop-datetime"><div><dt>{{ t('date') }}</dt><dd>{{ dateLabel(event.startsAt, locale) }}</dd></div><div><dt>{{ t('time') }}</dt><dd>{{ timeRange(event, locale) }}<span class="fact-note">{{ t('timezone') }}<template v-if="event.checkIn"> · {{ locale === 'en' ? `Check-in from ${event.checkIn}` : `${event.checkIn} 開始報到` }}</template></span></dd></div></dl>
        <FactRows :rows="basicFacts" />
        <div v-if="others.length" class="other-events"><h2>{{ t('also') }}</h2><NuxtLink v-for="other in others" :key="other.slug" :to="path(`/events/${other.slug}/`)"><span class="mono secondary">{{ siblingDate(other.startsAt) }}</span><span :lang="lang(other.title)">{{ local(other.title) }} →</span></NuxtLink></div>
        <section v-if="mode === 'long'" id="intro" class="event-section" tabindex="-1"><h2>{{ t('intro') }}</h2><IntroText :text="local(event.intro)" :lang="lang(event.intro)" /></section>
        <section v-if="description" id="description" class="event-section" tabindex="-1"><h2>{{ t('description') }}</h2><EventDescription :text="description" :lang="locale" /></section>
        <section v-if="event.audience?.length" id="audience" class="event-section" tabindex="-1"><h2>{{ t('audience') }}</h2><ul class="prose-list"><li v-for="(item, index) in event.audience" :key="index" :lang="lang(item)">{{ local(item) }}</li></ul></section>
        <section v-if="event.preparation?.length" id="preparation" class="event-section" tabindex="-1"><h2>{{ t('preparation') }}</h2><ul class="prose-list"><li v-for="(item, index) in event.preparation" :key="index" :lang="lang(item)">{{ local(item) }}</li></ul></section>
        <section v-if="event.agenda?.length" id="agenda" class="event-section" tabindex="-1"><h2>{{ t('agenda') }}</h2><dl class="agenda"><div v-for="(item, index) in event.agenda" :key="index"><dt class="mono">{{ item.time }}</dt><dd><span :lang="lang(item.title)">{{ local(item.title) }}</span><span v-if="item.note" class="fact-note" :lang="lang(item.note)">{{ local(item.note) }}</span></dd></div></dl></section>
        <section v-if="hasVenueDetails" id="venue" class="event-section" tabindex="-1"><h2>{{ t('travel') }}</h2><dl class="fact-rows"><div><dt>{{ locale === 'en' ? 'Address' : '地址' }}</dt><dd><span :lang="lang(event.venue)">{{ local(event.venue) }}</span><span v-if="event.address" class="fact-note" :lang="lang(event.address)">{{ local(event.address) }}</span><ExternalLink v-if="event.mapUrl" :href="event.mapUrl" class="map-link">{{ t('openMap') }}</ExternalLink></dd></div></dl><FactRows v-if="event.travel" :rows="event.travel" /></section>
        <section v-if="event.participation?.length" id="join" class="event-section" tabindex="-1"><h2>{{ t('join') }}</h2><FactRows :rows="event.participation" /></section>
        <section v-if="event.notices?.length" id="notes" class="event-section" tabindex="-1"><h2>{{ t('notices') }}</h2><dl class="fact-rows"><div><dt>{{ t('conduct') }}</dt><dd>{{ t('applies') }}<NuxtLink id="conduct-entry" class="fact-link" :to="conductLink('notes')" data-remember-focus>{{ t('readConduct') }}</NuxtLink></dd></div></dl><FactRows :rows="event.notices" /></section>
      </div>
    </div>
    <PastEvents />
    <div v-if="primaryAction(event, now)" class="sticky-action" :class="{ 'is-visible': stickyVisible }" :inert="!stickyVisible" :aria-hidden="!stickyVisible">
      <div class="sticky-summary"><span class="mono">{{ dateLabel(event.startsAt, locale, true) }} · {{ timeLabel(event.startsAt) }}</span><StatusBadge :status="registrationStatus(event, now)" /></div>
      <EventPrimaryAction :event="event" />
    </div>
  </main>
</template>
