import data from '#event-data'
import { parseEvents } from '#shared/events'
import { llmsIndex } from '#shared/agents'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const site = `${config.public.siteURL.replace(/\/$/, '')}${config.app.baseURL.replace(/\/$/, '')}`
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return llmsIndex(parseEvents(data), site)
})
