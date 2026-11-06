import { z } from 'zod'

export type Locale = 'zh-TW' | 'en'
const localized = z.object({ 'zh-TW': z.string().trim().min(1), en: z.string().trim().min(1).optional() })
const url = z.url().refine(value => /^https?:\/\//.test(value), 'Use an http(s) URL')
const instant = z.iso.datetime({ offset: true })
const fact = z.object({ label: localized, value: localized, note: localized.optional(), url: url.optional() })

export const eventSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: localized,
  intro: z.object({ 'zh-TW': z.string().trim(), en: z.string().trim().optional() }).optional(),
  category: localized.optional(),
  startsAt: instant,
  endsAt: instant.optional(),
  state: z.enum(['scheduled', 'cancelled', 'postponed', 'ended']).default('scheduled'),
  listed: z.boolean().default(true),
  format: z.enum(['in-person', 'online', 'hybrid']),
  venue: localized,
  address: localized.optional(),
  mapUrl: url.optional(),
  language: localized.optional(),
  languageNote: localized.optional(),
  fee: localized.optional(),
  capacity: z.number().int().positive().optional(),
  checkIn: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  registration: z.object({
    mode: z.enum(['external', 'free']),
    status: z.enum(['info', 'open', 'soon', 'full', 'closed']).default('info'),
    url: url.optional(),
    platform: z.string().trim().min(1).optional(),
    opensAt: instant.optional(),
    closesAt: instant.optional(),
    waitlistUrl: url.optional(),
    joinUrl: url.optional(),
    joinReady: z.boolean().default(false),
    note: localized.optional(),
  }),
  availability: z.object({
    remaining: z.number().int().nonnegative(),
    source: z.string().trim().min(1),
    updatedAt: instant,
    valid: z.boolean().default(true),
  }).optional(),
  audience: z.array(localized).optional(),
  preparation: z.array(localized).optional(),
  agenda: z.array(z.object({ time: z.string(), title: localized, note: localized.optional() })).optional(),
  travel: z.array(fact).optional(),
  participation: z.array(fact).optional(),
  notices: z.array(fact).optional(),
  recordUrl: url.optional(),
  announcementUrl: url.optional(),
}).superRefine((event, context) => {
  if (event.endsAt && Date.parse(event.endsAt) <= Date.parse(event.startsAt)) {
    context.addIssue({ code: 'custom', path: ['endsAt'], message: 'End must follow start' })
  }
  if (event.registration.mode === 'external' && ['info', 'open'].includes(event.registration.status) && !event.registration.url) {
    context.addIssue({ code: 'custom', path: ['registration', 'url'], message: 'External registration needs a URL' })
  }
  if (event.registration.joinReady && !event.registration.joinUrl) {
    context.addIssue({ code: 'custom', path: ['registration', 'joinUrl'], message: 'A confirmed online entrance needs a URL' })
  }
  if (event.capacity && event.availability && event.availability.remaining > event.capacity) {
    context.addIssue({ code: 'custom', path: ['availability', 'remaining'], message: 'Remaining exceeds capacity' })
  }
})

export type Event = z.infer<typeof eventSchema>
export type Localized = z.infer<typeof localized>
export type Fact = z.infer<typeof fact>
export type Status = 'info' | 'open' | 'soon' | 'full' | 'closed' | 'few' | 'free' | 'cancelled' | 'postponed' | 'ended'
export type EventAction = { kind: 'register' | 'official' | 'waitlist' | 'join' | 'calendar' | 'reminder'; url?: string }
export const CAPACITY_FRESHNESS_MS = 15 * 60 * 1000

export function parseEvents(input: unknown): Event[] {
  const events = z.array(eventSchema).parse(input)
  if (new Set(events.map(event => event.slug)).size !== events.length) throw new Error('Event slugs must be unique')
  return events
}

export function text(value: Localized | undefined, locale: Locale): string {
  return value?.[locale] || value?.['zh-TW'] || ''
}
export function textLang(value: Localized | undefined, locale: Locale): Locale {
  return locale === 'en' && !value?.en ? 'zh-TW' : locale
}
export function hasFallback(event: Event, locale: Locale): boolean {
  if (locale !== 'en') return false
  const visit = (value: unknown): boolean => {
    if (!value || typeof value !== 'object') return false
    if ('zh-TW' in value) return Boolean(value['zh-TW']) && !('en' in value && value.en)
    return Object.values(value).some(visit)
  }
  return visit(event)
}
export function introMode(intro: string): 'none' | 'short' | 'long' {
  const value = intro.trim()
  if (!value) return 'none'
  return !/\n|^\s*[-*•]\s|^\d+\.\s/.test(value) && [...value].length <= 80 ? 'short' : 'long'
}
export function plainIntro(intro: string): string {
  return intro.replace(/^\s*[-*•]\s+/gm, '').replace(/\s+/g, ' ').trim()
}
export function eventState(event: Event, now: number): Event['state'] {
  if (event.state !== 'scheduled') return event.state
  // Without an end time, keep the event for its entire calendar day in Taiwan.
  const end = event.endsAt ? Date.parse(event.endsAt) : Date.parse(`${taipeiDate(event.startsAt)}T23:59:59+08:00`)
  return end <= now ? 'ended' : 'scheduled'
}
export function freshAvailability(event: Event, now: number, maxAge = CAPACITY_FRESHNESS_MS) {
  const value = event.availability
  if (!value || !value.valid || !value.source.trim() || !Number.isInteger(value.remaining) || value.remaining < 0) return undefined
  const age = now - Date.parse(value.updatedAt)
  if (!Number.isFinite(age) || age < 0 || age > maxAge || (event.capacity && value.remaining > event.capacity)) return undefined
  return value
}
export function registrationStatus(event: Event, now: number): Status {
  const state = eventState(event, now)
  if (state !== 'scheduled') return state
  const registration = event.registration
  if (registration.status === 'closed' || registration.status === 'full') return registration.status
  if (registration.closesAt && Date.parse(registration.closesAt) <= now) return 'closed'
  if (registration.mode === 'free') return 'free'
  if (registration.status === 'soon') return registration.opensAt && Date.parse(registration.opensAt) <= now ? 'info' : 'soon'
  if (registration.status === 'open') {
    const available = freshAvailability(event, now)
    return available && event.capacity && available.remaining / event.capacity <= 0.2 ? 'few' : 'open'
  }
  return 'info'
}
export function primaryAction(event: Event, now: number): EventAction | undefined {
  const status = registrationStatus(event, now)
  if (['cancelled', 'postponed', 'ended', 'closed'].includes(status)) return undefined
  if (status === 'full') return event.registration.waitlistUrl ? { kind: 'waitlist', url: event.registration.waitlistUrl } : undefined
  if (status === 'soon') return { kind: event.registration.opensAt ? 'reminder' : 'calendar' }
  if (status === 'free') {
    if (event.registration.joinReady && event.registration.joinUrl) return { kind: 'join', url: event.registration.joinUrl }
    return { kind: 'calendar' }
  }
  return event.registration.url ? { kind: status === 'info' ? 'official' : 'register', url: event.registration.url } : undefined
}
export function platform(event: Event): string {
  if (event.registration.platform) return event.registration.platform
  const value = event.registration.url || event.registration.joinUrl
  if (!value) return ''
  const hostname = new URL(value).hostname
  if (/(^|\.)(kktix\.(cc|com))$/.test(hostname)) return 'KKTIX'
  if (hostname === 'meet.jit.si') return 'Jitsi Meet'
  return hostname.replace(/^www\./, '')
}
export function taipeiDate(value: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value))
  const part = (type: string) => parts.find(part => part.type === type)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}
export function dateLabel(value: string, locale: Locale, compact = false): string {
  if (locale === 'en') return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Taipei', year: 'numeric', month: 'short', day: 'numeric', ...(compact ? {} : { weekday: 'short' }) }).format(new Date(value))
  const [year, month, day] = taipeiDate(value).split('-').map(Number)
  const weekday = new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', weekday: 'narrow' }).format(new Date(value))
  return `${year} 年 ${month} 月 ${day} 日${compact ? '' : `（${weekday}）`}`
}
export function shortDateLabel(value: string, locale: Locale): string {
  if (locale === 'en') return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Taipei', month: 'short', day: 'numeric' }).format(new Date(value))
  const [, month, day] = taipeiDate(value).split('-').map(Number)
  return `${month}/${day}`
}
export function monthDayLabel(value: string, locale: Locale): string {
  if (locale === 'en') return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Taipei', weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(value))
  const [, month, day] = taipeiDate(value).split('-').map(Number)
  const weekday = new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', weekday: 'narrow' }).format(new Date(value))
  return `${month} 月 ${day} 日（${weekday}）`
}
export function timeLabel(value: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value))
}
export function timeRange(event: Event, locale: Locale = 'zh-TW'): string {
  if (!event.endsAt) return timeLabel(event.startsAt)
  return `${timeLabel(event.startsAt)}–${taipeiDate(event.startsAt) === taipeiDate(event.endsAt) ? '' : `${dateLabel(event.endsAt, locale, true)} `}${timeLabel(event.endsAt)}`
}
export function upcomingEvents(events: Event[], now: number): Event[] {
  return events.filter(event => event.listed && eventState(event, now) !== 'ended').sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
}
