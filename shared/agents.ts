import { eventState, hasFallback, registrationStatus, text, type Event, type Locale, type Localized } from './events.ts'

const escape = (value: string) => value.replace(/([\\`*_[\]<>#|])/g, '\\$1')
const inline = (value: string) => escape(value.replace(/\s+/g, ' ').trim())
const link = (label: string, url: string) => `[${inline(label)}](<${new URL(url).href.replace(/[<>\s]/g, encodeURIComponent)}>)`
type Options = { demo?: boolean; now?: number }

export function llmsIndex(events: Event[], site: string, options: Options = {}): string {
  const now = options.now ?? Date.now()
  const published = events.filter(event => event.listed).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
  const lines = [
    '# COSCUP Events / COSCUP 活動', '',
    '> COSCUP 開源社群活動的中英雙語資訊、報名連結及參加指南。 Bilingual event information for the COSCUP open-source community.', '',
    ...(options.demo ? ['This is a design demo. All event data is illustrative, not an announcement. 設計示意，非正式公告。', ''] : []),
    `Generated at ${new Date(now).toISOString()}. This is a static snapshot updated on deployment.`,
    'Dates use Asia/Taipei (UTC+8) unless an explicit offset is given. Published event content is available in Traditional Chinese and English.',
    'Registration takes place on the linked organizer website. A link alone does not mean registration is open; verify availability there.',
    'Missing fees or end times are unknown and must not be inferred.',
    '活動以主辦單位公告為準；報名詳情與時間請至活動連結確認。', '',
    ...(!published.length ? ['目前沒有已公布的活動資料。 No published event records.', ''] : [
      '## Events / 活動', '',
      ...published.flatMap(event => (['zh-TW', 'en'] as const).map(locale => {
        const prefix = locale === 'en' ? '/en' : ''
        return `- ${link(`${text(event.title, locale)} (${locale})`, `${site}${prefix}/events/${event.slug}/index.md`)}: ${event.startsAt}; ${inline(text(event.venue, locale))}; ${eventState(event, now)}. Markdown details.`
      })), '',
    ]),
    '## Website / 網站', '',
    `- ${link('近期活動 / Upcoming events — 繁體中文', `${site}/events/`)}: Current event listing.`,
    `- ${link('Upcoming events — English', `${site}/en/events/`)}: English event listing.`,
    `- ${link('關於 COSCUP / About COSCUP', `${site}/about/`)}: Official Chinese introduction.`,
    `- ${link('About COSCUP — English', `${site}/en/about/`)}: Official English introduction.`,
    `- ${link('行為準則 / Code of conduct', `${site}/code-of-conduct/`)}: Participation and reporting policy in Chinese.`,
    `- ${link('Code of conduct — English', `${site}/en/code-of-conduct/`)}: Participation and reporting policy in English.`, '',
    '## Optional', '',
    `- ${link('Activity calendar', `${site}/calendar.ics`)}: iCalendar subscription.`,
    `- ${link('RSS feed', `${site}/feed.xml`)}: Event feed.`,
    `- ${link('Sitemap', `${site}/sitemap.xml`)}: Public HTML pages.`, '',
  ]
  return lines.join('\n')
}

export function eventMarkdown(event: Event, locale: Locale, site: string, options: Options = {}): string {
  const now = options.now ?? Date.now()
  const local = (value: Localized | undefined) => text(value, locale)
  const lines = [`# ${inline(local(event.title))}`, '']
  const field = (label: string, value: string | number | undefined) => {
    if (value !== undefined && value !== '') lines.push(`- ${inline(label)}: ${inline(String(value))}`)
  }
  const url = (label: string, value?: string) => { if (value) lines.push(`- ${link(label, value)}`) }
  if (options.demo) lines.push('> Design example only; not an announcement. 設計示意，非正式公告。', '')
  if (hasFallback(event, locale)) lines.push('Some fields are not translated into English. The original Chinese is retained.', '')
  lines.push(`Generated at ${new Date(now).toISOString()}; static snapshot. Verify current registration details with the organizer.`, '')
  url('Web page / 活動網頁', `${site}${locale === 'en' ? '/en' : ''}/events/${event.slug}/`)
  field('Starts / 開始', event.startsAt)
  field('Ends / 結束', event.endsAt)
  field('Check-in / 報到 (Asia/Taipei)', event.checkIn)
  field('Event status / 活動狀態', eventState(event, now))
  field('Category / 類別', local(event.category))
  field('Format / 形式', event.format)
  field('Venue / 地點', local(event.venue))
  field('Address / 地址', local(event.address))
  url('Map / 地圖', event.mapUrl)
  field('Language / 語言', local(event.language))
  field('Language note / 語言補充', local(event.languageNote))
  field('Fee / 費用', local(event.fee))
  lines.push('', '## Registration / 報名', '')
  field('Mode / 方式', event.registration.mode === 'free' ? 'No registration required / 免報名 (does not imply free entry)' : 'External registration / 外部報名')
  field('Status at generation / 產生時狀態', registrationStatus(event, now))
  field('Platform / 平台', event.registration.platform)
  field('Opens / 開放', event.registration.opensAt)
  field('Closes / 截止', event.registration.closesAt)
  field('Note / 補充', local(event.registration.note))
  url('Official registration information / 官方報名資訊', event.registration.url)
  url('Waitlist / 候補', event.registration.waitlistUrl)
  if (event.registration.joinReady) url('Confirmed online entrance / 已確認的線上入口', event.registration.joinUrl)
  if (local(event.intro)) lines.push('', '## About this event / 活動簡介', '', escape(local(event.intro)))
  const description = event.description?.[locale]
  if (description) lines.push('', '## Event description / 活動介紹', '', description)
  for (const [key, title] of [['audience', 'Who it is for / 適合對象'], ['preparation', 'Preparation / 行前準備']] as const) {
    if (event[key]?.length) lines.push('', `## ${title}`, '', ...event[key].map(item => `- ${inline(local(item))}`))
  }
  if (event.agenda?.length) {
    lines.push('', '## Schedule / 議程', '')
    for (const item of event.agenda) lines.push(`- ${inline(item.time)} — ${inline(local(item.title))}${item.note ? `: ${inline(local(item.note))}` : ''}`)
  }
  for (const [key, title] of [['travel', 'Venue and travel / 地點與交通'], ['participation', 'How to join / 參加方式'], ['notices', 'Attendee information / 參加須知']] as const) {
    if (!event[key]?.length) continue
    lines.push('', `## ${title}`, '')
    for (const item of event[key]) {
      field(local(item.label), `${local(item.value)}${item.note ? ` — ${local(item.note)}` : ''}`)
      url(local(item.label), item.url)
    }
  }
  lines.push('', '## Related links / 相關連結', '')
  url('Code of conduct / 行為準則', `${site}${locale === 'en' ? '/en' : ''}/code-of-conduct/`)
  url('Announcement / 活動公告', event.announcementUrl)
  url('Recap / 活動紀錄', event.recordUrl)
  return `${lines.join('\n')}\n`
}
