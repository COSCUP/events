import { fileURLToPath } from 'node:url'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { parseEventCsv } from './scripts/events-csv'
import { generateEventOgImages } from './scripts/event-og-images'

const development = process.env.NODE_ENV === 'development'
const csvSource = fileURLToPath(new URL('./event.csv', import.meta.url))
const events = parseEventCsv(readFileSync(csvSource, 'utf8'))
// Only publishable records enter the client/server bundles; the source CSV is never served.
const source = fileURLToPath(new URL('./.data/events.json', import.meta.url))
mkdirSync(fileURLToPath(new URL('./.data/', import.meta.url)), { recursive: true })
const compiled = JSON.stringify(events)
if (!existsSync(source) || readFileSync(source, 'utf8') !== compiled) writeFileSync(source, compiled)
const baseURL = `/${(process.env.NUXT_APP_BASE_URL || '/events/').replace(/^\/+|\/+$/g, '')}/`.replace('//', '/')
const siteURL = process.env.NUXT_PUBLIC_SITE_URL || 'https://coscup.org'
const ogDirectory = fileURLToPath(new URL('./.data/og', import.meta.url))
mkdirSync(ogDirectory, { recursive: true })
const logo = fileURLToPath(new URL('./public/images/coscup-green.svg', import.meta.url))
const ogBackground = fileURLToPath(new URL('./app/assets/og/tito-rollis-s9vNTRLoWl8-unsplash.jpg', import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2026-11-05',
  devtools: { enabled: false },
  watch: [csvSource, fileURLToPath(new URL('./scripts/events-csv.ts', import.meta.url)), fileURLToPath(new URL('./scripts/event-og-images.ts', import.meta.url)), logo, ogBackground],
  hooks: {
    'nitro:config': async () => { await generateEventOgImages(events, ogDirectory, logo, ogBackground) },
  },
  app: {
    baseURL,
    pageTransition: { name: 'page', mode: 'out-in' },
    head: { meta: [{ name: 'theme-color', content: '#0C3C23' }] },
  },
  alias: { '#event-data': source },
  css: [
    '@fontsource-variable/noto-sans-tc',
    '@fontsource/ibm-plex-mono/latin-400.css',
    '@fontsource/ibm-plex-mono/latin-500.css',
    '~/assets/main.css',
  ],
  runtimeConfig: { public: { siteURL } },
  experimental: { payloadExtraction: false },
  typescript: { strict: true },
  nitro: {
    preset: 'static',
    publicAssets: [{ dir: ogDirectory, baseURL: '/og/' }],
    // Nitro clears its output on startup; keep dev away from the static build.
    output: development
      ? { dir: '.nuxt/dev-output', publicDir: '.nuxt/dev-output/public' }
      : undefined,
    prerender: {
      failOnError: true,
      routes: [
        '/', '/en/', '/about/', '/en/about/',
        '/code-of-conduct/', '/en/code-of-conduct/', '/calendar.ics', '/feed.xml', '/robots.txt', '/sitemap.xml', '/llms.txt',
        ...events.flatMap(event => [`/${event.slug}/`, `/en/${event.slug}/`, `/${event.slug}/index.md`, `/en/${event.slug}/index.md`]),
      ].map(route => `${baseURL.replace(/\/$/, '')}${route}`),
    },
  },
})
