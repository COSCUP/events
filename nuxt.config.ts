import { fileURLToPath } from 'node:url'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parseEventCsv } from './scripts/events-csv'

const demo = process.env.EVENTS_DEMO === '1' || (process.env.NODE_ENV === 'development' && process.env.EVENTS_DEMO !== '0')
const csvSource = fileURLToPath(new URL(demo ? './fixtures/events.csv' : './event.csv', import.meta.url))
const events = parseEventCsv(readFileSync(csvSource, 'utf8'), { source: demo ? 'fixtures/events.csv' : 'event.csv', designExamples: demo })
// Only publishable records enter the client/server bundles; the source CSV is never served.
const source = fileURLToPath(new URL(demo ? './.data/events-demo.json' : './.data/events.json', import.meta.url))
mkdirSync(fileURLToPath(new URL('./.data/', import.meta.url)), { recursive: true })
const compiled = JSON.stringify(events)
if (!existsSync(source) || readFileSync(source, 'utf8') !== compiled) writeFileSync(source, compiled)
const baseURL = `/${(process.env.NUXT_APP_BASE_URL || '/events/').replace(/^\/+|\/+$/g, '')}/`.replace('//', '/')
const siteURL = process.env.NUXT_PUBLIC_SITE_URL || 'https://coscup.org'

export default defineNuxtConfig({
  compatibilityDate: '2026-11-05',
  devtools: { enabled: false },
  watch: [csvSource, fileURLToPath(new URL('./scripts/events-csv.ts', import.meta.url))],
  app: {
    baseURL,
    head: { meta: [{ name: 'theme-color', content: '#0C3C23' }] },
  },
  alias: { '#event-data': source },
  css: [
    '@fontsource-variable/noto-sans-tc',
    '@fontsource/ibm-plex-mono/latin-400.css',
    '@fontsource/ibm-plex-mono/latin-500.css',
    '~/assets/main.css',
  ],
  runtimeConfig: { public: { demo, siteURL } },
  experimental: { payloadExtraction: false },
  typescript: { strict: true },
  nitro: {
    preset: 'static',
    output: demo ? { dir: '.output-demo', publicDir: '.output-demo/public' } : undefined,
    prerender: {
      failOnError: true,
      routes: [
        '/', '/events/', '/en/events/', '/about/', '/en/about/',
        '/code-of-conduct/', '/en/code-of-conduct/', '/calendar.ics', '/feed.xml', '/robots.txt', '/sitemap.xml', '/llms.txt',
        ...events.flatMap(event => [`/events/${event.slug}/`, `/en/events/${event.slug}/`, `/events/${event.slug}/index.md`, `/en/events/${event.slug}/index.md`]),
      ].map(route => `${baseURL.replace(/\/$/, '')}${route}`),
    },
  },
})
