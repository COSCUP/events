import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFileSync } from 'node:fs'
import { readFile, mkdir } from 'node:fs/promises'
import { parseEventCsv } from '../../scripts/events-csv'
import { upcomingEvents, text } from '../../shared/events'

const events = parseEventCsv(readFileSync('event.csv', 'utf8'))
const event = (events.find(item => item.listed && item.state === 'scheduled') || events[0])!
const now = event ? Date.parse(event.startsAt) - 60 * 60_000 : Date.now()
const stamp = (value: string) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(now))
})

test('CSV listing, static deep links and policy return context work under the Pages base', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('./')
  await expect(page.locator('.event-card')).toHaveCount(upcomingEvents(events, now).length)
  test.skip(!event || !upcomingEvents(events, now).includes(event), 'No listed upcoming event')
  await page.locator(`#event-${event.slug}`).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(event.title['zh-TW'])
  await expect(page.locator('main')).not.toHaveClass(/page-enter-active|page-leave-active/)
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  await page.goBack()
  await expect(page.locator(`#event-${event.slug}`)).toBeFocused()
  await page.locator(`#event-${event.slug}`).click()
  await page.locator('#header-conduct').click()
  await expect(page).toHaveURL(new RegExp(`code-of-conduct/\\?from=${event.slug}&entry=header$`))
  await page.locator('.site-header').getByRole('link', { name: 'Switch to English', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('main')).not.toHaveClass(/page-enter-active|page-leave-active/)
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  await page.getByRole('link', { name: '← Back to event' }).click()
  await expect(page).toHaveURL(new RegExp(`/events/en/${event.slug}/#header-conduct$`))
  await expect(page.locator('#header-conduct')).toBeFocused()
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(text(event.title, 'en'))
  expect(errors).toEqual([])
})

test('header and footer language switches preserve anchors and return to the site root', async ({ page }) => {
  const anchor = event?.description?.['zh-TW'] && event.description.en ? 'description' : event?.address || event?.mapUrl ? 'venue' : ''
  test.skip(!anchor, 'No shared section anchor')
  await page.goto(`${event.slug}/?source=preview#${anchor}`)
  await page.locator('.site-header').getByRole('link', { name: 'Switch to English', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/events/en/${event.slug}/\\?source=preview#${anchor}$`))
  await expect(page.locator(`#${anchor}`)).toBeFocused()
  const footerSwitch = page.locator('.site-footer').getByRole('link', { name: '切換為繁體中文', exact: true })
  await footerSwitch.focus()
  await footerSwitch.press('Enter')
  await expect(page).toHaveURL(new RegExp(`/events/${event.slug}/\\?source=preview#${anchor}$`))
  await expect(page.locator(`#${anchor}`)).toBeFocused()
  await page.locator('.site-footer').getByRole('link', { name: 'Switch to English', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/events/en/${event.slug}/\\?source=preview#${anchor}$`))
  await page.goto('./')
  await expect(page).toHaveURL(/\/events\/en\/$/)
  await page.locator('.site-header').getByRole('link', { name: '切換為繁體中文', exact: true }).click()
  await expect(page).toHaveURL(/\/events\/$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW')
})

test('calendar and sharing use the published event data', async ({ page }) => {
  test.skip(!event, 'No published event')
  await page.goto(`${event.slug}/`)
  await page.locator('.registration-panel').getByRole('button', { name: '加入行事曆', exact: true }).click()
  const menu = page.getByRole('menu', { name: '加入行事曆', exact: true })
  const google = new URL((await menu.getByRole('menuitem', { name: /Google Calendar/ }).getAttribute('href'))!)
  expect(google.origin).toBe('https://calendar.google.com')
  expect(google.searchParams.get('dates')).toBe(`${stamp(event.startsAt)}/${stamp(event.endsAt || event.startsAt)}`)
  const downloadEvent = page.waitForEvent('download')
  await menu.getByRole('menuitem', { name: /iCS 下載/ }).click()
  const download = await downloadEvent
  expect(download.suggestedFilename()).toBe(`coscup-${event.slug}.ics`)
  const content = await readFile((await download.path())!, 'utf8')
  expect(content).toContain(`DTSTART:${stamp(event.startsAt)}`)
  if (event.endsAt) expect(content).toContain(`DTEND:${stamp(event.endsAt)}`)
  else expect(content).not.toContain('DTEND')
  await page.evaluate(() => {
    history.replaceState(null, '', `${location.pathname}?source=preview#description`)
    Object.defineProperty(navigator, 'share', { configurable: true, value: async () => { (window as any).nativeShareCalled = true } })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value: string) => {
      (window as any).copiedURL = value
      ;(window as any).copyCount = ((window as any).copyCount || 0) + 1
    } } })
  })
  await page.getByRole('button', { name: '分享', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '分享活動' })
  await expect(dialog.getByRole('status')).toHaveText('已複製連結')
  expect(await page.evaluate(() => (window as any).copiedURL)).toBe(`${new URL(page.url()).origin}/events/${event.slug}/`)
  expect(await page.evaluate(() => (window as any).nativeShareCalled)).toBeUndefined()
  await dialog.getByRole('button', { name: '複製連結', exact: true }).click()
  expect(await page.evaluate(() => (window as any).copyCount)).toBe(2)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: '分享', exact: true })).toBeFocused()
})

test('share offers a selectable URL and a copy icon when clipboard access fails', async ({ page }) => {
  test.skip(!event, 'No published event')
  await page.setViewportSize({ width: 320, height: 900 })
  await page.goto(`en/${event.slug}/`)
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied') } } })
    Object.defineProperty(document, 'execCommand', { configurable: true, value: () => false })
  })
  await page.getByRole('button', { name: 'Share', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Share event' })
  const input = dialog.getByRole('textbox', { name: 'Event URL' })
  const copy = dialog.getByRole('button', { name: 'Copy link', exact: true })
  await expect(input).toBeFocused()
  await expect(dialog.getByRole('status')).toContainText('Could not copy')
  await copy.click()
  await expect(input).toBeFocused()
  expect(await input.evaluate((element: HTMLInputElement) => element.selectionEnd! - element.selectionStart!)).toBe((await input.inputValue()).length)
  await page.evaluate(() => Object.defineProperty(document, 'execCommand', { configurable: true, value: () => true }))
  await copy.click()
  await expect(dialog.getByRole('status')).toHaveText('Link copied')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Share', exact: true })).toBeFocused()
})

test('optional fees and venue details follow the published CSV in both languages', async ({ page }) => {
  test.skip(!event, 'No published event')
  for (const [prefix, locale, feeLabel] of [['', 'zh-TW', '費用'], ['en/', 'en', 'Fee']] as const) {
    await page.goto(prefix || './')
    const card = page.locator('.event-card').filter({ has: page.locator(`#event-${event.slug}`) })
    if (event.listed && upcomingEvents(events, now).includes(event)) {
      await expect(card.locator('.card-fee')).toHaveCount(event.fee ? 1 : 0)
    }
    await page.goto(`${prefix}${event.slug}/`)
    await expect(page.locator('.detail-body dt').filter({ hasText: new RegExp(`^${feeLabel}$`) })).toHaveCount(event.fee ? 1 : 0)
    if (event.fee) await expect(page.locator('.registration-note')).toContainText(text(event.fee, locale))
    else if (!event.registration.platform && !event.registration.closesAt) await expect(page.locator('.registration-note')).toHaveCount(0)
    if (event.address) await expect(page.locator('#venue')).toContainText(text(event.address, locale))
    if (event.mapUrl) await expect(page.locator('#venue .map-link')).toHaveAttribute('href', event.mapUrl)
    await expect(page.locator('#description')).toHaveCount(event.description?.[locale] ? 1 : 0)
  }
})

test('official documents retain their text and safe return links', async ({ page }) => {
  const conduct = JSON.parse(await readFile('app/data/conduct.json', 'utf8'))
  const about = JSON.parse(await readFile('app/data/about.json', 'utf8'))
  for (const [prefix, key] of [['', 'zh'], ['en/', 'en']]) {
    await page.goto(`${prefix}code-of-conduct/?from=https://evil.example`)
    for (const block of conduct[key].blocks) await expect(page.locator('.document-prose')).toContainText(block.text)
    await expect(page.locator('.back-link')).toHaveAttribute('href', `/events/${prefix}`)
    await expect(page.locator('.mail-link')).toHaveAttribute('href', 'mailto:coc@coscup.org')
    await page.goto(`${prefix}about/`)
    for (const block of about[key].blocks.slice(3)) await expect(page.locator('.document-prose')).toContainText(block.text)
  }
})

test('static feeds, Agent content, share images and missing-page handling are complete', async ({ page, request }) => {
  for (const [route, expected] of [['calendar.ics', 'BEGIN:VCALENDAR'], ['feed.xml', '<rss'], ['sitemap.xml', '<urlset'], ['llms.txt', '# COSCUP Events']]) {
    const response = await request.get(route!)
    expect(response.status()).toBe(200)
    const content = await response.text()
    expect(content).toContain(expected!)
    expect(content).not.toMatch(/\/events\/(?:en\/)?events\//)
  }
  for (const [route, locale] of [['./', 'zh-TW'], ['en/', 'en']]) {
    const response = await request.get(route!)
    expect(response.status()).toBe(200)
    const html = await response.text()
    const imageURL = `https://coscup.org/events/og/home-${locale}.png`
    expect(html).toContain(`<meta property="og:image" content="${imageURL}">`)
    expect(html).toContain('<meta property="og:image:width" content="1200">')
    expect(html).toContain('<meta property="og:image:height" content="630">')
    expect(html).toContain('<meta property="og:image:type" content="image/png">')
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">')
    expect(html).toContain(`<meta name="twitter:image" content="${imageURL}">`)
    const image = await request.get(`og/home-${locale}.png`)
    expect(image.status()).toBe(200)
    expect(image.headers()['content-type']).toContain('image/png')
    const png = await image.body()
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
    expect(png.readUInt32BE(16)).toBe(1200)
    expect(png.readUInt32BE(20)).toBe(630)
  }
  for (const item of events) {
    for (const [prefix, locale] of [['', 'zh-TW'], ['en/', 'en']] as const) {
      const response = await request.get(`${prefix}${item.slug}/index.md`)
      expect(response.status()).toBe(200)
      const markdown = await response.text()
      if (item.description?.[locale]) expect(markdown).toContain(item.description[locale])
      if (!item.fee) expect(markdown).not.toContain('- Fee / 費用:')
      const imageURL = `https://coscup.org/events/og/${locale}/${item.slug}.png`
      const html = await (await request.get(`${prefix}${item.slug}/`)).text()
      expect(html).toContain(`<meta property="og:image" content="${imageURL}">`)
      expect(html).toContain('<meta name="twitter:card" content="summary_large_image">')
      const image = await request.get(`og/${locale}/${item.slug}.png`)
      expect(image.status()).toBe(200)
      expect(image.headers()['content-type']).toContain('image/png')
      const png = await image.body()
      expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
      expect(png.readUInt32BE(16)).toBe(1200)
      expect(png.readUInt32BE(20)).toBe(630)
    }
  }
  const rootHTML = await (await request.get('./')).text()
  expect(rootHTML).toContain('href="https://coscup.org/events/"')
  expect(rootHTML).toContain('href="https://coscup.org/events/en/"')
  const response = await page.goto('not-a-real-event/')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

for (const width of [320, 1440]) {
  test(`CSV pages stay within ${width}px and remain accessible`, async ({ page }) => {
    await mkdir('artifacts/screenshots', { recursive: true })
    await page.setViewportSize({ width, height: 900 })
    const routes = ['./', 'en/', ...(event ? [`${event.slug}/`, `en/${event.slug}/`] : [])]
    for (const [index, route] of routes.entries()) {
      await page.goto(route)
      await page.evaluate(() => document.fonts.ready)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await page.screenshot({ path: `artifacts/screenshots/csv-${index}-${width}.png`, fullPage: true })
      if (width === 1440) {
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
        expect(results.violations).toEqual([])
      }
    }
  })
}
