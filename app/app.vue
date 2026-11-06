<script setup lang="ts">
const { t, asset, now } = useSite()
const { $restorePageFocus } = useNuxtApp()
const route = useRoute()
const message = useState('action-message', () => '')
const copyURL = useState('copy-url', () => '')
const shareOpen = useState('share-open', () => false)
const copyStatus = useState<'idle' | 'copied' | 'failed'>('copy-status', () => 'idle')
const { copyLink } = useEventActions()
const dialog = useTemplateRef<HTMLDialogElement>('copy-dialog')
const copyInput = useTemplateRef<HTMLInputElement>('copy-input')
useHead({ link: [{ rel: 'icon', type: 'image/svg+xml', href: asset('favicon.svg') }, { rel: 'alternate', type: 'application/rss+xml', title: 'COSCUP Events', href: asset('feed.xml') }] })
watch(() => route.path, () => { shareOpen.value = false })
watch(shareOpen, async () => {
  await nextTick()
  if (shareOpen.value) { dialog.value?.showModal(); copyInput.value?.select() }
  else dialog.value?.close()
})
function shareClosed() {
  // A queued close event must not dismiss a dialog that has already reopened.
  if (!dialog.value?.open) shareOpen.value = false
}
async function copyAgain() {
  if (!await copyLink(copyURL.value)) {
    copyInput.value?.focus({ preventScroll: true })
    copyInput.value?.select()
  }
}
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
  <NuxtPage :page-key="route => route.path" :transition="{ onAfterEnter: $restorePageFocus }" />
  <SiteFooter />
  <div class="toast" :class="{ visible: message }" role="status" aria-live="polite">{{ message }}</div>
  <dialog ref="copy-dialog" class="copy-dialog" aria-labelledby="copy-title" :inert="!shareOpen" @close="shareClosed">
    <h2 id="copy-title">{{ t('shareTitle') }}</h2>
    <div class="copy-url-field">
      <input ref="copy-input" :value="copyURL" readonly :aria-label="t('eventURL')" @focus="($event.target as HTMLInputElement).select()">
      <button type="button" class="button secondary-button copy-button" :aria-label="t('copyLink')" :title="t('copyLink')" @click="copyAgain">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>
      </button>
    </div>
    <p class="copy-status secondary" role="status">{{ copyStatus === 'copied' ? t('copied') : copyStatus === 'failed' ? t('copyHelp') : '' }}</p>
    <button class="button primary" @click="shareOpen = false">{{ t('close') }}</button>
  </dialog>
</template>
