import rawEvents from '#event-data'
import { defineLink } from 'unhead'
import { parseEvents, type Locale, type Localized } from '#shared/events'
import { text, textLang } from '#shared/events'
import type { ConductEntry } from '#shared/navigation'

const events = parseEvents(rawEvents)
const messages = {
  'zh-TW': {
    events: '活動', upcoming: '近期活動', conference: 'COSCUP 年會', about: '關於 COSCUP', conduct: '行為準則',
    skip: '跳至主要內容',
    timezone: '台灣時間 UTC+8', calendar: '加入行事曆', downloadICS: 'iCS 下載', share: '分享', details: '活動詳情', back: '近期活動',
    date: '日期', time: '時間', venue: '地點', format: '形式', fee: '費用', closes: '報名截止',
    intro: '活動簡介', description: '活動介紹', audience: '適合對象', preparation: '行前準備', agenda: '議程', travel: '地點與交通', join: '參加方式', notices: '參加須知',
    contents: '本頁內容', past: '過去的活動', viewAll: '查看全部', recap: '活動紀錄', newsletter: '訂閱電子報',
    empty: '尚無排定的活動', emptyNote: '下一場公布時間：未定', stayInformed: '活動通知', calendarFeed: '訂閱活動行事曆',
    calendarSupport: 'Google 日曆・Apple 行事曆・Outlook', rssSupport: '任何 RSS 閱讀器', subscribe: '訂閱行事曆',
    fallback: '部分活動資訊尚無英文版本，以下保留原文。', officialNote: '報名資訊以官方頁面為準',
    opens: '報名開放', reminder: '加入報名提醒', waitlist: '登記候補', enter: '進入線上活動', register: '前往報名',
    copied: '已複製連結', calendarSaved: '已下載行事曆', shareTitle: '分享活動', eventURL: '活動網址', copyLink: '複製連結', copyHelp: '未能複製，請重試或選取網址手動複製。', close: '關閉', newTab: '在新分頁開啟',
    info: '報名資訊', open: '開放報名', soon: '即將開放', full: '已額滿', closed: '報名截止', free: '免報名',
    cancelled: '已取消', postponed: '已延期', ended: '已結束',
    report: '通報與協助', reportNote: '可向現場工作人員求助，或寄信通報。', mailHint: '開啟郵件程式',
    source: '內容來源', sourceLicense: '來源與授權', officialSource: '查看官方原文',
    also: '同期活動', openMap: '在地圖中開啟', applies: '全體參與者適用', readConduct: '閱讀行為準則',
    backEvent: '返回活動', notFound: '找不到這個頁面', notFoundNote: '網址可能已變更，請回近期活動查看最新資訊。',
    announcement: '查看活動公告', demoAction: '此為示範活動；此連結開啟 COSCUP 的 KKTIX 活動列表。',
  },
  en: {
    events: 'Events', upcoming: 'Upcoming events', conference: 'Conference', about: 'About COSCUP', conduct: 'Code of conduct',
    skip: 'Skip to main content',
    timezone: 'Taiwan time UTC+8', calendar: 'Add to calendar', downloadICS: 'Download iCS', share: 'Share', details: 'Event details', back: 'Upcoming events',
    date: 'Date', time: 'Time', venue: 'Venue', format: 'Format', fee: 'Fee', closes: 'Closes',
    intro: 'About this event', description: 'Event description', audience: 'Who it’s for', preparation: 'Before you arrive', agenda: 'Schedule', travel: 'Venue & travel', join: 'How to join', notices: 'Attendee information',
    contents: 'On this page', past: 'Past events', viewAll: 'View all', recap: 'Recap', newsletter: 'Subscribe to newsletter',
    empty: 'No upcoming events', emptyNote: 'Next announcement: to be confirmed', stayInformed: 'Stay informed', calendarFeed: 'Subscribe to calendar',
    calendarSupport: 'Google Calendar · Apple Calendar · Outlook', rssSupport: 'Use any RSS reader', subscribe: 'Subscribe',
    fallback: 'Some event information is not yet available in English. The original text is shown below.', officialNote: 'See the official page for registration details',
    opens: 'Registration opens', reminder: 'Remind me when registration opens', waitlist: 'Join the waitlist', enter: 'Join the online event', register: 'Register',
    copied: 'Link copied', calendarSaved: 'Calendar downloaded', shareTitle: 'Share event', eventURL: 'Event URL', copyLink: 'Copy link', copyHelp: 'Could not copy. Try again or select the URL to copy it manually.', close: 'Close', newTab: 'Opens in a new tab',
    info: 'Registration info', open: 'Open', soon: 'Opening soon', full: 'Full', closed: 'Registration closed', free: 'No registration required',
    cancelled: 'Cancelled', postponed: 'Postponed', ended: 'Ended',
    report: 'Reporting & support', reportNote: 'Ask onsite staff for help, or report by email.', mailHint: 'Opens your email app',
    source: 'Source', sourceLicense: 'Source & license', officialSource: 'View official source',
    also: 'Also coming up', openMap: 'Open map', applies: 'Applies to all participants', readConduct: 'Read the code of conduct',
    backEvent: 'Back to event', notFound: 'Page not found', notFoundNote: 'This address may have changed. Visit upcoming events for the latest information.',
    announcement: 'View announcement', demoAction: 'This is an example event. This link opens COSCUP’s event directory on KKTIX.',
  },
} as const

export type MessageKey = keyof typeof messages.en

export function useSite() {
  const route = useRoute()
  const locale = computed<Locale>(() => route.path.startsWith('/en/') || route.path === '/en' ? 'en' : 'zh-TW')
  const config = useRuntimeConfig()
  const now = useState('event-clock', () => Date.now())
  const t = (key: MessageKey) => messages[locale.value][key]
  const local = (value: Localized | undefined) => text(value, locale.value)
  const lang = (value: Localized | undefined) => textLang(value, locale.value)
  const path = (value = '/events/') => `${locale.value === 'en' ? '/en' : ''}${value}`
  const asset = (value: string) => `${config.app.baseURL}${value.replace(/^\//, '')}`
  const siteRoot = `${config.public.siteURL.replace(/\/$/, '')}${config.app.baseURL.replace(/\/$/, '')}`
  const conductLink = (entry: ConductEntry) => {
    const event = events.find(event => event.slug === route.params.slug)
    return { path: path('/code-of-conduct/'), query: event ? { from: event.slug, entry } : undefined }
  }
  return { locale, t, local, lang, path, asset, events, now, demo: config.public.demo, siteRoot, conductLink }
}

export function usePageMeta(title: MaybeRefOrGetter<string>, description: MaybeRefOrGetter<string>) {
  const { locale, siteRoot, demo } = useSite()
  const route = useRoute()
  const cleanPath = computed(() => {
    const pathname = route.path === '/' ? '/events/' : route.path.replace(/^\/en(?=\/)/, '')
    return `${pathname.replace(/\/$/, '')}/`
  })
  const canonical = computed(() => `${siteRoot}${locale.value === 'en' ? '/en' : ''}${cleanPath.value}`)
  useSeoMeta({
    title: () => `${toValue(title)}｜COSCUP ${locale.value === 'en' ? 'Events' : '活動'}`,
    description: () => toValue(description),
    ogTitle: () => `${toValue(title)}｜COSCUP Events`,
    ogDescription: () => toValue(description),
    ogType: 'website',
    ogUrl: () => canonical.value,
    robots: demo ? 'noindex, nofollow' : 'index, follow',
  })
  useHead(() => ({
    htmlAttrs: { lang: locale.value },
    link: [
      { rel: 'canonical', href: canonical.value },
      { rel: 'alternate', hreflang: 'zh-TW', href: `${siteRoot}${cleanPath.value}` },
      { rel: 'alternate', hreflang: 'en', href: `${siteRoot}/en${cleanPath.value}` },
      defineLink({ rel: 'describedby', type: 'text/plain', href: `${siteRoot}/llms.txt` }),
      ...(route.params.slug ? [{ rel: 'alternate' as const, type: 'text/markdown', href: `${canonical.value}index.md` }] : []),
    ],
  }))
}
