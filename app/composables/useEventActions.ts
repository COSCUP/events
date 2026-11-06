import type { Event } from '#shared/events'
import { calendar } from '#shared/calendar'

export function useEventActions() {
  const { locale, local, t, siteRoot } = useSite()
  const message = useState('action-message', () => '')
  const copyURL = useState('copy-url', () => '')
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
  async function share(event: Event) {
    const url = new URL(window.location.href)
    url.hash = ''
    url.search = ''
    if (navigator.share) {
      try { await navigator.share({ title: local(event.title), url: url.href }); return }
      catch (error) { if (error instanceof Error && error.name === 'AbortError') return }
    }
    try { await navigator.clipboard.writeText(url.href); announce(t('copied')) }
    catch { copyURL.value = url.href }
  }
  return { download, share }
}
