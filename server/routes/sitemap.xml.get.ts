import data from '#event-data'
import { parseEvents } from '#shared/events'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const site = `${config.public.siteURL.replace(/\/$/, '')}${config.app.baseURL.replace(/\/$/, '')}`
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  const pages = ['', 'about/', 'code-of-conduct/', ...parseEvents(data).filter(item => item.listed).map(item => `${item.slug}/`)]
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.flatMap(path => ['', 'en/'].map(locale => `<url><loc>${site}/${locale}${path}</loc></url>`)).join('')}</urlset>`
})
