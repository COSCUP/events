import { text, type Event, type Locale } from './events.ts'

const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')
const stamp = (value: string | number) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')

export function googleCalendarUrl(event: Event, locale: Locale, siteURL: string): string {
  const permalink = `${siteURL.replace(/\/$/, '')}/${locale === 'en' ? 'en/' : ''}${event.slug}/`
  const endNote = event.endsAt ? '' : locale === 'en' ? 'The end time has not been announced. Please confirm it before saving.' : '結束時間尚未公布，儲存前請確認並調整。'
  const parameters = new URLSearchParams({
    action: 'TEMPLATE',
    text: text(event.title, locale),
    dates: `${stamp(event.startsAt)}/${stamp(event.endsAt || event.startsAt)}`,
    stz: 'Asia/Taipei', etz: 'Asia/Taipei',
    details: [text(event.intro, locale), endNote, permalink].filter(Boolean).join('\n\n'),
    location: [text(event.venue, locale), text(event.address, locale)].filter(Boolean).join(' · '),
  })
  return `https://calendar.google.com/calendar/r/eventedit?${parameters}`
}

// RFC 5545 folds by UTF-8 octets, without splitting a multi-byte character.
export function foldLine(line: string): string {
  const lines: string[] = []
  let current = ''
  let bytes = 0
  for (const char of line) {
    const length = new TextEncoder().encode(char).length
    if (bytes + length > 75) { lines.push(current); current = ' '; bytes = 1 }
    current += char
    bytes += length
  }
  lines.push(current)
  return lines.join('\r\n')
}
export function calendar(events: Event[], locale: Locale, siteURL: string, now = Date.now(), reminder = false): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//COSCUP//Events//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:COSCUP Events', 'X-WR-TIMEZONE:Asia/Taipei']
  for (const event of events) {
    const start = reminder ? event.registration.opensAt : event.startsAt
    if (!start) continue
    const prefix = reminder ? (locale === 'en' ? 'Registration opens: ' : '報名開放：') : ''
    const permalink = `${siteURL.replace(/\/$/, '')}/${locale === 'en' ? 'en/' : ''}${event.slug}/`
    lines.push('BEGIN:VEVENT', `UID:${event.slug}${reminder ? '-registration' : ''}@events.coscup.org`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(start)}`)
    if (!reminder && event.endsAt) lines.push(`DTEND:${stamp(event.endsAt)}`)
    lines.push(`SUMMARY:${escape(prefix + text(event.title, locale))}`, `LOCATION:${escape([text(event.venue, locale), text(event.address, locale)].filter(Boolean).join(' · '))}`, `DESCRIPTION:${escape([text(event.intro, locale), permalink].filter(Boolean).join('\n\n'))}`, `URL:${permalink}`)
    if (event.state === 'cancelled') lines.push('STATUS:CANCELLED')
    if (reminder) lines.push('BEGIN:VALARM', 'TRIGGER:PT0S', 'ACTION:DISPLAY', `DESCRIPTION:${escape(prefix + text(event.title, locale))}`, 'END:VALARM')
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.map(foldLine).join('\r\n') + '\r\n'
}
