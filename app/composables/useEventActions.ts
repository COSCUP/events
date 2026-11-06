import type { Event } from '#shared/events'
import { calendar } from '#shared/calendar'

export function useEventActions() {
  const { locale, t, siteRoot } = useSite()
  const message = useState('action-message', () => '')
  const copyURL = useState('copy-url', () => '')
  const copyStatus = useState<'idle' | 'copied' | 'failed'>('copy-status', () => 'idle')
  let timer: ReturnType<typeof setTimeout> | undefined
  const announce = (value: string) => {
    message.value = value
    clearTimeout(timer)
    timer = setTimeout(() => { message.value = '' }, 2000)
  }
  onBeforeUnmount(() => clearTimeout(timer))
  function download(event: Event, reminder = false) {
    const blob = new Blob([calendar([event], locale.value, siteRoot, Date.now(), reminder)], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `coscup-${event.slug}${reminder ? '-registration' : ''}.ics`
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    announce(t('calendarSaved'))
  }
  async function copyLink(value: string) {
    copyStatus.value = 'idle'
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value)
        copyStatus.value = 'copied'
        return true
      } catch { /* Try selection-based copying when clipboard access is unavailable. */ }
    }
    // HTTP LAN previews lack the Clipboard API. Keep copying inside the user gesture.
    const previousFocus = document.activeElement as HTMLElement | null
    const input = document.createElement('textarea')
    input.value = value
    input.readOnly = true
    input.tabIndex = -1
    input.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;font-size:16px'
    // A modal makes the rest of the document inert, so the selection must be inside it.
    const container = document.querySelector('dialog[open]') || document.body
    container.append(input)
    let copied = false
    try { input.select(); copied = document.execCommand('copy') }
    catch { /* Keep the URL available for manual selection. */ }
    finally { input.remove(); previousFocus?.focus({ preventScroll: true }) }
    copyStatus.value = copied ? 'copied' : 'failed'
    return copied
  }
  async function share() {
    const url = new URL(window.location.href)
    url.hash = ''
    url.search = ''
    copyURL.value = url.href
    await copyLink(url.href)
  }
  return { download, share, copyLink }
}
