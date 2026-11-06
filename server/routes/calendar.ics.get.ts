import data from '#event-data'
import { parseEvents } from '#shared/events'
import { calendar } from '#shared/calendar'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  setHeader(event, 'Content-Type', 'text/calendar; charset=utf-8')
  const site = `${config.public.siteURL.replace(/\/$/, '')}${config.app.baseURL.replace(/\/$/, '')}`
  return calendar(parseEvents(data).filter(item => item.listed), 'zh-TW', site)
})
