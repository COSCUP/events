<script setup lang="ts">
const { t, asset, now } = useSite()
const message = useState('action-message', () => '')
const copyURL = useState('copy-url', () => '')
const dialog = useTemplateRef<HTMLDialogElement>('copy-dialog')
const copyInput = useTemplateRef<HTMLInputElement>('copy-input')
useHead({ link: [{ rel: 'icon', type: 'image/svg+xml', href: asset('favicon.svg') }, { rel: 'alternate', type: 'application/rss+xml', title: 'COSCUP Events', href: asset('feed.xml') }] })
watch(copyURL, async (value) => {
  if (value) { await nextTick(); dialog.value?.showModal(); copyInput.value?.select() }
  else dialog.value?.close()
})
onMounted(() => {
  const refresh = () => { now.value = Date.now() }
  refresh()
  const timer = setInterval(refresh, 30_000)
  document.addEventListener('visibilitychange', refresh)
  onBeforeUnmount(() => { clearInterval(timer); document.removeEventListener('visibilitychange', refresh) })
})
</script>

<template>
  <a class="skip-link" href="#main">{{ t('skip') }}</a>
  <SiteHeader />
  <NuxtPage :page-key="route => route.path" />
  <SiteFooter />
  <div class="toast" :class="{ visible: message }" role="status" aria-live="polite">{{ message }}</div>
  <dialog ref="copy-dialog" class="copy-dialog" aria-labelledby="copy-title" @close="copyURL = ''">
    <h2 id="copy-title">{{ t('copyHelp') }}</h2>
    <input ref="copy-input" :value="copyURL" readonly :aria-label="t('copyHelp')" @focus="($event.target as HTMLInputElement).select()">
    <button class="button primary" @click="copyURL = ''">{{ t('close') }}</button>
  </dialog>
</template>
