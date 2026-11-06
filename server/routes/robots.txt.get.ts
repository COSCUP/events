export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return `User-agent: *\nAllow: /\nSitemap: ${config.public.siteURL.replace(/\/$/, '')}${config.app.baseURL}sitemap.xml\n`
})
