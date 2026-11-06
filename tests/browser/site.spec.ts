import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFile, mkdir } from 'node:fs/promises'

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-12T10:05:00Z'))
})

test('static deep links, internal navigation and locale context work under the Pages base', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('events/')
  await expect(page.locator('.event-card')).toHaveCount(7)
  await page.locator('#event-community-meetup-taipei').click()
  await expect(page).toHaveURL(/\/events\/events\/community-meetup-taipei\/$/)
  await page.locator('#conduct-entry').click()
  await expect(page).toHaveURL(/code-of-conduct\/\?from=community-meetup-taipei&entry=notes$/)
  await page.locator('.site-header').getByRole('link', { name: 'Switch to English', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page).toHaveURL(/en\/code-of-conduct\/\?from=community-meetup-taipei&entry=notes$/)
  await page.getByRole('link', { name: '← Back to event' }).click()
  await expect(page).toHaveURL(/en\/events\/community-meetup-taipei\/#conduct-entry$/)
  await expect(page.locator('#conduct-entry')).toBeFocused()
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('COSCUP Community Meetup · Taipei')
  expect(errors).toEqual([])
})

test('locale switch preserves semantic anchors and explicit URLs override remembered preference', async ({ page }) => {
  await page.goto('events/community-meetup-taipei/?example=single#agenda')
  await page.locator('.site-header').getByRole('link', { name: 'Switch to English', exact: true }).click()
  await expect(page).toHaveURL(/en\/events\/community-meetup-taipei\/\?example=single#agenda$/)
  await expect(page.locator('#agenda')).toBeFocused()
  const footerSwitch = page.locator('.site-footer').getByRole('link', { name: '切換為繁體中文', exact: true })
  await footerSwitch.focus()
  await footerSwitch.press('Enter')
  await expect(page).toHaveURL(/\/events\/events\/community-meetup-taipei\/\?example=single#agenda$/)
  await expect(page.locator('#agenda')).toBeFocused()
  await page.locator('.site-footer').getByRole('link', { name: 'Switch to English', exact: true }).click()
  await expect(page).toHaveURL(/en\/events\/community-meetup-taipei\/\?example=single#agenda$/)
  await page.goto('events/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW')
  await page.goto('./')
  await expect(page).toHaveURL(/\/en\/events\/$/)
})

test('header and footer policy links return to the activity and the original entry in the current language', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  for (const entry of ['header', 'footer']) {
    await page.goto('events/community-meetup-taipei/')
    await page.locator(`#${entry}-conduct`).click()
    await expect(page).toHaveURL(new RegExp(`code-of-conduct/\\?from=community-meetup-taipei&entry=${entry}$`))
    await page.locator('.site-header').getByRole('link', { name: 'Switch to English', exact: true }).click()
    await page.getByRole('link', { name: '← Back to event' }).click()
    await expect(page).toHaveURL(new RegExp(`en/events/community-meetup-taipei/#${entry}-conduct$`))
    await expect(page.locator(`#${entry}-conduct`)).toBeFocused()
  }
})

test('long untranslated introductions retain the original language on every paragraph', async ({ page }) => {
  await page.goto('en/events/long-translation-example/')
  await expect(page.locator('.translation-notice')).toHaveCount(1)
  await expect(page.locator('#intro .intro-paragraph')).toHaveCount(2)
  const languages = await page.locator('#intro .intro-paragraph').evaluateAll(elements => elements.map(element => element.closest('[lang]')?.getAttribute('lang')))
  expect(languages).toEqual(['zh-TW', 'zh-TW'])
})

test('a short desktop viewport can scroll the complete sticky sidebar and use its final section', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 700 })
  await page.goto('en/events/community-meetup-taipei/')
  await page.evaluate(() => window.scrollTo(0, 400))
  const sidebar = page.locator('.detail-sidebar')
  await sidebar.hover()
  await page.mouse.wheel(0, 1200)
  await expect.poll(() => sidebar.evaluate(element => element.scrollTop)).toBeGreaterThan(0)
  const lastSection = sidebar.getByRole('link', { name: 'Attendee information', exact: true })
  await lastSection.focus()
  const bounds = await lastSection.boundingBox()
  expect(bounds!.y).toBeGreaterThanOrEqual(0)
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(700)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#notes$/)
  await expect(page.locator('#notes')).toBeInViewport()
})

test('calendar download contains real timezone data and share has clipboard feedback', async ({ page }) => {
  await page.goto('events/community-meetup-taipei/')
  await page.getByRole('button', { name: '加入行事曆', exact: true }).click()
  const menu = page.getByRole('menu', { name: '加入行事曆', exact: true })
  await expect(menu.getByRole('menuitem', { name: /Google Calendar/ })).toHaveAttribute('href', /calendar\.google\.com\/calendar\/r\/eventedit\?/)
  const downloadEvent = page.waitForEvent('download')
  await menu.getByRole('menuitem', { name: /iCS 下載/ }).click()
  const download = await downloadEvent
  expect(download.suggestedFilename()).toBe('coscup-community-meetup-taipei.ics')
  const content = await readFile((await download.path())!, 'utf8')
  expect(content).toContain('DTSTART:20261114T050000Z')
  expect(content).toContain('DTEND:20261114T093000Z')
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value: string) => { (window as any).copiedURL = value } } })
  })
  await page.getByRole('button', { name: '分享', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('已複製連結')
  expect(await page.evaluate(() => (window as any).copiedURL)).toMatch(/\/events\/events\/community-meetup-taipei\/$/)
})

test('share cancellation is silent and denied clipboard offers a selectable URL', async ({ page }) => {
  await page.goto('en/events/simple-meetup/')
  await page.evaluate(() => Object.defineProperty(navigator, 'share', { configurable: true, value: async () => { throw new DOMException('Cancelled', 'AbortError') } }))
  await page.getByRole('button', { name: 'Share', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied') } } })
  })
  await page.getByRole('button', { name: 'Share', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('textbox')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Share', exact: true })).toBeFocused()
})

test('mobile registration bar follows the primary action and retreats before past events', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('events/community-meetup-taipei/')
  await expect(page.locator('.sticky-action')).not.toBeVisible()
  await page.locator('#audience').scrollIntoViewIfNeeded()
  await expect(page.locator('.sticky-action')).toBeVisible()
  await page.locator('#past-events').scrollIntoViewIfNeeded()
  await expect(page.locator('.sticky-action')).not.toBeVisible()
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page.locator('.sticky-action')).not.toBeVisible()
})

test('empty, single, minimal and untranslated data render without invented details', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2027-01-01T00:00:00Z'))
  await page.goto('events/')
  await expect(page.getByRole('heading', { name: '尚無排定的活動' })).toBeVisible()
  await expect(page.locator('.event-card')).toHaveCount(0)
  await page.clock.setFixedTime(new Date('2026-12-18T00:00:00Z'))
  await page.goto('events/')
  await expect(page.locator('.event-card')).toHaveCount(1)
  await page.clock.setFixedTime(new Date('2026-11-12T10:05:00Z'))
  await page.goto('events/no-intro/')
  await expect(page.locator('#intro')).toHaveCount(0)
  await expect(page.locator('.short-intro')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /前往官方報名/ }).first()).toBeVisible()
  await page.goto('en/events/translation-example/')
  await expect(page.locator('.translation-notice')).toHaveCount(1)
  await expect(page.locator('.short-intro')).toHaveAttribute('lang', 'zh-TW')
  await page.goto('events/online-gathering/')
  await expect(page.locator('.registration-panel .primary-action').getByRole('button', { name: '加入行事曆', exact: true })).toBeVisible()
  await expect(page.locator('.registration-panel .secondary-actions').getByRole('button', { name: '加入行事曆', exact: true })).toHaveCount(0)
  await expect(page.locator('.registration-panel')).not.toContainText('報名資訊以官方頁面為準')
  await expect(page.getByRole('link', { name: /進入線上/ })).toHaveCount(0)
})

test('both official documents retain source text, lists and safe return links', async ({ page }) => {
  const conduct = JSON.parse(await readFile('app/data/conduct.json', 'utf8'))
  const about = JSON.parse(await readFile('app/data/about.json', 'utf8'))
  for (const [prefix, key] of [['', 'zh'], ['en/', 'en']]) {
    await page.goto(`${prefix}code-of-conduct/?from=https://evil.example`)
    for (const block of conduct[key].blocks) await expect(page.locator('.document-prose')).toContainText(block.text)
    await expect(page.locator('.document-prose ul ul')).toHaveCount(2)
    await expect(page.locator('.back-link')).toHaveAttribute('href', `/events/${prefix}events/`)
    await expect(page.locator('.mail-link')).toHaveAttribute('href', 'mailto:coc@coscup.org')
    await page.goto(`${prefix}about/`)
    for (const block of about[key].blocks.slice(3)) await expect(page.locator('.document-prose')).toContainText(block.text)
  }
})

test('static feeds, alternate-language URLs, missing-page handling and external links are complete', async ({ page, request }) => {
  for (const [route, expected] of [['calendar.ics', 'BEGIN:VCALENDAR'], ['feed.xml', '<rss'], ['sitemap.xml', '<urlset']]) {
    const response = await request.get(route!)
    expect(response.status()).toBe(200)
    expect(await response.text()).toContain(expected!)
  }
  const rootHTML = await (await request.get('./')).text()
  expect(rootHTML).toContain('href="https://coscup.org/events/events/"')
  expect(rootHTML).toContain('href="https://coscup.org/events/en/events/"')
  expect(rootHTML).not.toContain('href="https://coscup.org/events/en/"')
  await page.goto('events/')
  for (const link of await page.locator('a[target="_blank"]').all()) {
    expect(await link.getAttribute('rel')).toContain('noopener')
    expect(await link.getAttribute('rel')).toContain('noreferrer')
  }
  const response = await page.goto('events/not-a-real-event/')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`responsive pages stay within ${width}px and remain accessible`, async ({ page }) => {
    await mkdir('artifacts/screenshots', { recursive: true })
    await page.setViewportSize({ width, height: 900 })
    for (const [name, route] of [['zh-list', 'events/'], ['en-list', 'en/events/'], ['zh-detail', 'events/community-meetup-taipei/'], ['en-minimal', 'en/events/simple-meetup/']]) {
      await page.goto(route!)
      await page.evaluate(() => document.fonts.ready)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await page.screenshot({ path: `artifacts/screenshots/${name}-${width}.png`, fullPage: true })
      if (width === 390 || width === 1440) {
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
        expect(results.violations).toEqual([])
      }
    }
  })
}

test('keyboard focus, reduced motion and policy accessibility work at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('en/code-of-conduct/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main')).toBeFocused()
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(results.violations).toEqual([])
  await page.screenshot({ path: 'artifacts/screenshots/en-conduct-320.png', fullPage: true })
})
