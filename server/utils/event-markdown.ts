import data from '#event-data'
import { parseEvents, type Locale } from '#shared/events'
import { eventMarkdown } from '#shared/agents'

export const eventMarkdownHandler = (locale: Locale) => defineEventHandler((request) => {
  const event = parseEvents(data).find(item => item.slug === getRouterParam(request, 'slug'))
  if (!event) throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  const config = useRuntimeConfig()
  const site = `${config.public.siteURL.replace(/\/$/, '')}${config.app.baseURL.replace(/\/$/, '')}`
  setHeader(request, 'Content-Type', 'text/markdown; charset=utf-8')
  return eventMarkdown(event, locale, site)
})
