import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseEvents, eventSchema, introMode, registrationStatus, freshAvailability, primaryAction, eventState, hasFallback, text, timeRange, upcomingEvents } from '../shared/events.ts'
import { calendar } from '../shared/calendar.ts'
import { parseEventCsv } from '../scripts/events-csv.ts'
import { eventMarkdown, llmsIndex } from '../shared/agents.ts'

const examples = parseEventCsv(readFileSync(new URL('../fixtures/events.csv', import.meta.url), 'utf8'), { designExamples: true })
const base = examples[0]!
const now = Date.parse('2026-11-12T18:05:00+08:00')
const copy = () => structuredClone(base)

test('all content is valid and duplicate slugs or unsafe URLs fail the build', () => {
  assert.ok(Array.isArray(parseEventCsv(readFileSync(new URL('../event.csv', import.meta.url), 'utf8'))))
  assert.throws(() => parseEvents([base, base]), /unique/)
  const invalid = copy(); invalid.registration.url = 'javascript:alert(1)'
  assert.equal(eventSchema.safeParse(invalid).success, false)
  const noURL = copy(); delete noURL.registration.url
  assert.equal(eventSchema.safeParse(noURL).success, false)
})
test('intro layout depends on Unicode content, paragraphs and lists', () => {
  assert.equal(introMode('   '), 'none')
  assert.equal(introMode('😀'.repeat(80)), 'short')
  assert.equal(introMode('😀'.repeat(81)), 'long')
  assert.equal(introMode('One\n\nTwo'), 'long')
  assert.equal(introMode('- One item'), 'long')
})
test('link presence does not claim registration is open', () => {
  const event = copy(); event.registration.status = 'info'
  assert.equal(registrationStatus(event, now), 'info')
  assert.equal(primaryAction(event, now)?.kind, 'official')
})
test('only fresh, valid availability can imply few places left', () => {
  const event = copy(); event.availability!.remaining = 6
  assert.equal(registrationStatus(event, now), 'few')
  assert.equal(freshAvailability(event, now + 15 * 60_000), undefined)
  assert.equal(registrationStatus(event, now + 15 * 60_000), 'open')
  assert.equal(freshAvailability(event, now - 10 * 60_000), undefined)
  event.availability!.valid = false
  assert.equal(freshAvailability(event, now), undefined)
})
test('cancelled, postponed, closed and full states survive stale capacity', () => {
  for (const state of ['cancelled', 'postponed', 'ended'] as const) {
    const event = copy(); event.state = state
    assert.equal(registrationStatus(event, now + 60 * 60_000), state)
    assert.equal(primaryAction(event, now), undefined)
  }
  for (const status of ['closed', 'full'] as const) {
    const event = copy(); event.registration.status = status
    assert.equal(registrationStatus(event, now + 60 * 60_000), status)
    assert.equal(primaryAction(event, now), undefined)
  }
  const event = copy(); event.registration.status = 'full'; event.registration.waitlistUrl = 'https://coscup-tw.kktix.cc/'
  assert.equal(primaryAction(event, now)?.kind, 'waitlist')
})
test('known deadlines close registration and reminder expiry does not open it', () => {
  assert.equal(primaryAction(base, Date.parse(base.registration.closesAt!) + 1), undefined)
  const event = copy(); event.registration.status = 'soon'; event.registration.opensAt = '2026-11-12T18:10:00+08:00'
  assert.equal(primaryAction(event, now)?.kind, 'reminder')
  assert.equal(registrationStatus(event, now + 10 * 60_000), 'info')
})
test('registration-free events offer calendar without a URL; online entry requires confirmation', () => {
  const event = copy(); event.registration = { mode: 'free', status: 'info', joinReady: false }
  assert.equal(eventSchema.safeParse(event).success, true)
  assert.equal(registrationStatus(event, now), 'free')
  assert.deepEqual(primaryAction(event, now), { kind: 'calendar' })
  event.registration.joinUrl = 'https://meet.jit.si/example'
  assert.equal(primaryAction(event, now)?.kind, 'calendar')
  event.registration.joinReady = true
  assert.equal(primaryAction(event, now)?.kind, 'join')
})
test('start-only activities remain available on the event day, with no invented duration', () => {
  const event = copy(); delete event.endsAt
  assert.equal(timeRange(event), '13:00')
  assert.equal(eventState(event, Date.parse('2026-11-14T17:00:00+08:00')), 'scheduled')
  assert.equal(eventState(event, Date.parse('2026-11-15T00:00:00+08:00')), 'ended')
  assert.ok(!calendar([event], 'en', 'https://coscup.github.io/events', now).includes('DTEND'))
})
test('calendar exports correct UTC, CRLF, escaped text, Unicode folding and stable event IDs', () => {
  const event = copy(); event.title = { 'zh-TW': '測試,分號;反斜線\\\n換行'.repeat(12) }
  const ics = calendar([event], 'zh-TW', 'https://coscup.github.io/events', now)
  assert.ok(ics.includes('DTSTART:20261114T050000Z\r\n'))
  assert.ok(ics.includes('DTEND:20261114T093000Z\r\n'))
  assert.ok(ics.replace(/\r\n /g, '').includes('SUMMARY:測試\\,分號\\;反斜線\\\\\\n換行'))
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75)
  assert.ok(ics.includes(`UID:${event.slug}@events.coscup.org`))
  const reminder = calendar([base], 'en', 'https://coscup.github.io/events', now, true)
  assert.ok(!reminder.includes('BEGIN:VEVENT'), 'Do not fabricate an unknown registration opening time')
})
test('locale fallback is per field; omitted fields do not trigger a warning', () => {
  assert.equal(hasFallback(examples[2]!, 'en'), false)
  assert.equal(hasFallback(examples[4]!, 'en'), true)
  assert.equal(text(examples[4]!.intro, 'en'), examples[4]!.intro!['zh-TW'])
})
test('listing handles zero, one and multiple events; private fixtures stay off the list', () => {
  assert.equal(upcomingEvents([], now).length, 0)
  assert.equal(upcomingEvents([base], now).length, 1)
  assert.equal(upcomingEvents(examples, now).length, 2)
  assert.equal(upcomingEvents(examples, Date.parse('2027-01-01')).length, 0)
})

const csv = (rows: Record<string, string>[]) => {
  const columns = [...new Set(rows.flatMap(row => Object.keys(row)))]
  const quote = (value: string) => `"${value.replaceAll('"', '""')}"`
  return '\ufeff' + [columns, ...rows.map(row => columns.map(column => row[column] || ''))].map(row => row.map(quote).join(',')).join('\r\n')
}
const csvEvent = { publish: 'true', 'slug*': 'csv-event', 'title_zh*': '活動,「開源」', title_en: 'Open "Source", Meetup', intro_zh: '歡迎一起交流開源專案。', intro_en: 'Join us to discuss open-source projects.', 'starts_at*': '2027-01-16 13:00', 'format*': 'in-person', 'venue_zh*': '台北', venue_en: 'Taipei', 'registration_mode*': 'free' }

test('spreadsheet CSV preserves bilingual quoted/multiline content and defaults local dates to Taiwan', () => {
  const [event] = parseEventCsv(csv([{ ...csvEvent, intro_zh: '第一段,有逗號\n\n第二段', intro_en: 'First paragraph\n\nSecond paragraph', audience_zh: '新手\n維護者', audience_en: 'Newcomers\nMaintainers', agenda_zh: '13:00 | 開場 | 歡迎\n14:00 | 分享', agenda_en: '13:00 | Welcome | Hello\n14:00 | Sharing', travel_zh: '捷運 | 公館站 | 1 號出口 | https://example.org/map', travel_en: 'Metro | Gongguan | Exit 1' }]))
  assert.equal(event!.title.en, 'Open "Source", Meetup')
  assert.equal(event!.intro!['zh-TW'], '第一段,有逗號\n\n第二段')
  assert.equal(event!.startsAt, '2027-01-16T13:00:00+08:00')
  assert.equal(event!.endsAt, undefined)
  assert.equal(event!.audience![0]!.en, 'Newcomers')
  assert.equal(event!.audience![1]!.en, 'Maintainers')
  assert.equal(event!.agenda![1]!.title.en, 'Sharing')
  assert.equal(event!.travel![0]!.url, 'https://example.org/map')
})
test('invalid publish flags, required fields, duplicate slugs and malformed sections have actionable CSV errors', () => {
  assert.throws(() => parseEventCsv(csv([{ ...csvEvent, publish: 'yes' }])), /row 2.*\[publish\]/)
  assert.throws(() => parseEventCsv(csv([{ ...csvEvent, 'title_zh*': '' }])), /row 2.*\[title_zh\].*Required/)
  for (const field of ['title_en', 'venue_en', 'intro_zh', 'intro_en']) {
    assert.throws(() => parseEventCsv(csv([{ ...csvEvent, [field]: '  ' }])), new RegExp(`row 2.*\\[${field}\\].*Required`))
  }
  assert.throws(() => parseEventCsv(csv([{ ...csvEvent, category_zh: '聚會' }])), /\[category_en\].*Required/)
  assert.throws(() => parseEventCsv(csv([{ ...csvEvent, audience_zh: '新手', audience_en: '-' }])), /\[audience_en\].*Required/)
  assert.throws(() => parseEventCsv(csv([{ ...csvEvent, agenda_zh: '13:00 | 開場 | 歡迎', agenda_en: '13:00 | Welcome' }])), /\[agenda_en\].*Required/)
  assert.throws(() => parseEventCsv(csv([{ ...csvEvent, 'starts_at*': '2027-02-30 13:00' }])), /\[starts_at\]/)
  assert.throws(() => parseEventCsv(csv([csvEvent, csvEvent])), /row 3.*\[slug\].*Duplicate/)
  assert.throws(() => parseEventCsv(csv([{ ...csvEvent, 'registration_mode*': 'external' }])), /\[registration_url\]/)
  assert.throws(() => parseEventCsv(csv([{ ...csvEvent, audience_zh: '甲\n乙', audience_en: 'One' }])), /\[audience_en\]/)
  assert.throws(() => parseEventCsv(csv([{ ...csvEvent, agenda_zh: '13:00 | 開場', agenda_en: '14:00 | Welcome' }])), /\[agenda_en\]/)
  assert.throws(() => parseEventCsv('publish,slug,slug\ntrue,a,a'), /Duplicate columns/)
})
test('only explicitly published CSV records enter pages and agent indexes; incomplete drafts are allowed', () => {
  const events = parseEventCsv(csv([csvEvent, { ...csvEvent, publish: 'false', 'slug*': 'secret-draft', 'title_zh*': '' }, { ...csvEvent, publish: '', 'slug*': 'unfinished' }]))
  assert.deepEqual(events.map(event => event.slug), ['csv-event'])
  const index = llmsIndex(events, 'https://example.org/custom', { now })
  assert.ok(index.startsWith('# COSCUP Events'))
  assert.ok(index.includes('https://example.org/custom/events/csv-event/index.md'))
  assert.ok(index.includes('https://example.org/custom/en/events/csv-event/index.md'))
  assert.ok(!index.includes('secret-draft') && !index.includes('unfinished'))
  assert.ok(!llmsIndex([{ ...events[0]!, listed: false }], 'https://example.org/custom', { now }).includes('csv-event'))
})
test('agent details include full localized content and preserve fallback and freshness rules', () => {
  const event = copy()
  event.registration.joinUrl = 'https://example.org/not-ready'
  const markdown = eventMarkdown(event, 'en', 'https://example.org/events', { now: now + 16 * 60_000 })
  assert.ok(markdown.includes(event.title.en!))
  assert.ok(markdown.includes('Birds of a Feather'))
  assert.ok(markdown.includes('https://example.org/events/en/events/community-meetup-taipei/'))
  assert.ok(!markdown.includes('not-ready') && !markdown.includes('Remaining at observation'))
  delete event.intro!.en
  const fallback = eventMarkdown(event, 'en', 'https://example.org/events', { now })
  assert.ok(fallback.includes('original Chinese is retained'))
  assert.ok(fallback.includes(event.intro!['zh-TW']))
})
