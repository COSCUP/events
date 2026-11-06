import data from '#event-data'
import { parseEvents, text } from '#shared/events'

const xml = (value: string) => value.replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!)
export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const site = `${config.public.siteURL.replace(/\/$/, '')}${config.app.baseURL.replace(/\/$/, '')}`
  setHeader(event, 'Content-Type', 'application/rss+xml; charset=utf-8')
  const items = parseEvents(data).filter(item => item.listed).sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt)).map(item => `<item><title>${xml(text(item.title, 'zh-TW'))}</title><link>${xml(`${site}/${item.slug}/`)}</link><guid isPermaLink="true">${xml(`${site}/${item.slug}/`)}</guid><description>${xml(text(item.intro, 'zh-TW'))}</description></item>`).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>COSCUP Events</title><link>${xml(`${site}/`)}</link><description>COSCUP 活動與開源社群聚會</description><language>zh-TW</language>${items}</channel></rss>`
})
