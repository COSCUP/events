import { parse } from 'csv-parse/sync'
import { eventSchema, type Event, type Localized } from '../shared/events.ts'

const coreRequired = ['slug', 'title_zh', 'starts_at', 'format', 'venue_zh', 'registration_mode']
const required = [...coreRequired, 'title_en', 'venue_en', 'intro_zh', 'intro_en']
const localizedFields = {
  title: 'title', venue: 'venue', intro: 'intro', category: 'category', address: 'address',
  language: 'language', language_note: 'languageNote', fee: 'fee',
} as const
const scalarFields = {
  slug: 'slug', starts_at: 'startsAt', ends_at: 'endsAt', format: 'format', state: 'state',
  map_url: 'mapUrl', check_in: 'checkIn', record_url: 'recordUrl', announcement_url: 'announcementUrl',
} as const
const registrationFields = {
  registration_mode: 'mode', registration_status: 'status', registration_url: 'url',
  registration_platform: 'platform', registration_opens_at: 'opensAt', registration_closes_at: 'closesAt',
  waitlist_url: 'waitlistUrl', join_url: 'joinUrl',
} as const

export const eventCsvColumns = [
  'publish', 'slug', 'title_zh', 'title_en', 'starts_at', 'ends_at', 'format', 'venue_zh', 'venue_en',
  'registration_mode', 'registration_url', 'registration_status',
  'intro_zh', 'intro_en', 'description_zh', 'description_en', 'category_zh', 'category_en', 'address_zh', 'address_en', 'map_url',
  'language_zh', 'language_en', 'language_note_zh', 'language_note_en', 'fee_zh', 'fee_en', 'check_in',
  'registration_platform', 'registration_opens_at', 'registration_closes_at', 'registration_note_zh', 'registration_note_en',
  'waitlist_url', 'join_url', 'join_ready', 'audience_zh', 'audience_en', 'preparation_zh', 'preparation_en',
  'agenda_zh', 'agenda_en', 'travel_zh', 'travel_en', 'participation_zh', 'participation_en', 'notices_zh', 'notices_en',
  'state', 'listed', 'record_url', 'announcement_url',
]
export const eventCsvHeaders = eventCsvColumns.map(column => required.includes(column) ? `${column}*` : column)

// Spreadsheet-friendly local times default to Taiwan; explicit offsets are preserved.
function instant(value: string | undefined) {
  if (!value) return undefined
  const match = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(:\d{2})?(Z|[+-]\d{2}:\d{2})?$/.exec(value)
  return match ? `${match[1]}T${match[2]}${match[3] || ':00'}${match[4] || '+08:00'}` : value
}

function issueColumn(path: PropertyKey[]): string {
  const [root, field] = path
  const suffix = path.includes('en') ? '_en' : '_zh'
  if (root === 'description') return `description${suffix}`
  if (['agenda', 'travel', 'participation', 'notices', 'audience', 'preparation'].includes(String(root))) return `${String(root)}${suffix}`
  if (root === 'registration') {
    if (field === 'note') return `registration_note${suffix}`
    if (field === 'joinReady') return 'join_ready'
    return Object.entries(registrationFields).find(([, value]) => value === field)?.[0] || String(field)
  }
  const localized = Object.entries(localizedFields).find(([, value]) => value === root)
  return localized ? `${localized[0]}${suffix}` : Object.entries(scalarFields).find(([, value]) => value === root)?.[0] || String(root)
}

export function parseEventCsv(input: string, options: { source?: string; designExamples?: boolean } = {}): Event[] {
  const source = options.source || 'event.csv'
  let headers: string[] = []
  let records: { record: Record<string, string>; info: { records: number; lines: number } }[]
  try {
    records = parse(input, {
      bom: true, skip_empty_lines: true, trim: true, info: true,
      columns: (values: string[]) => {
        headers = values.map(value => value.trim().replace(/\*$/, ''))
        if (new Set(headers).size !== headers.length) throw new Error('欄位名稱重複 / Duplicate columns')
        const unknown = headers.filter(value => !eventCsvColumns.includes(value))
        if (unknown.length) throw new Error(`未知欄位 / Unknown columns: ${unknown.join(', ')}`)
        return headers
      },
    })
  } catch (error) {
    throw new Error(`${source}: CSV 格式錯誤 / Invalid CSV: ${(error as Error).message}`)
  }
  const missing = ['publish', ...required].filter(column => !headers.includes(column))
  if (missing.length) throw new Error(`${source}: 缺少欄位 / Missing columns: ${missing.join(', ')}`)

  const events: Event[] = []
  const slugs = new Map<string, number>()
  for (const { record, info } of records) {
    if (Object.values(record).every(value => !value.trim())) continue
    const rowNumber = info.records + 1
    const fail = (column: string, message: string): never => {
      throw new Error(`${source}: 第 ${rowNumber} 列 / row ${rowNumber} (file line ${info.lines}${record.slug ? `, ${record.slug}` : ''}) [${column}]: ${message}`)
    }
    const cell = (column: string) => record[column]?.trim() || undefined
    const boolean = (column: string): boolean | undefined => {
      const value = cell(column)?.toLowerCase()
      if (!value) return undefined
      if (value !== 'true' && value !== 'false') fail(column, '請填 true 或 false / Expected true or false')
      return value === 'true'
    }
    const publish = boolean('publish') ?? false
    if (!publish) continue
    // Incomplete design fixtures exercise defensive rendering; published CSV content must be bilingual.
    for (const column of options.designExamples ? coreRequired : required) if (!cell(column)) fail(column, '必填 / Required')
    const pair = (zh: string | undefined, en: string | undefined, column: string): Localized | undefined => {
      if (!zh && en) fail(`${column}_zh`, '英文有內容時須填對應中文 / Chinese is required when English is supplied')
      if (zh && (!en || en === '-') && !options.designExamples) fail(`${column}_en`, '必填：請提供對應英文 / Required: provide the English translation')
      return zh ? { 'zh-TW': zh, ...(en ? { en } : {}) } : undefined
    }
    const localized = (column: string) => pair(cell(`${column}_zh`), cell(`${column}_en`), column)
    const lines = (column: string) => cell(column)?.split(/\r?\n/).map(value => value.trim()) || []
    const pairedLines = (column: string) => {
      const zh = lines(`${column}_zh`), en = lines(`${column}_en`)
      if (en.length && en.length !== zh.length) fail(`${column}_en`, '中英項目數必須相同 / Match Chinese and English line counts')
      return zh.map((value, index) => [value, en[index] === '-' ? '' : en[index] || ''] as const)
    }
    const parts = (line: string, column: string, min: number, max: number) => {
      if (!line) return []
      const values = line.split('|').map(value => value.trim())
      if (values.length < min || values.length > max) fail(column, `每行需 ${min}–${max} 個欄位，以 | 分隔 / Separate fields with |`)
      return values
    }
    const values: Record<string, unknown> = {}
    for (const [column, key] of Object.entries(scalarFields)) values[key] = column.endsWith('_at') ? instant(cell(column)) : cell(column)
    for (const [column, key] of Object.entries(localizedFields)) values[key] = localized(column)
    const descriptionZh = cell('description_zh') ? record.description_zh : undefined
    const descriptionEn = cell('description_en') ? record.description_en : undefined
    if (descriptionZh || descriptionEn) values.description = {
      ...(descriptionZh ? { 'zh-TW': descriptionZh } : {}),
      ...(descriptionEn ? { en: descriptionEn } : {}),
    }
    values.listed = boolean('listed')
    const registration: Record<string, unknown> = {}
    for (const [column, key] of Object.entries(registrationFields)) registration[key] = column.endsWith('_at') ? instant(cell(column)) : cell(column)
    registration.joinReady = boolean('join_ready')
    registration.note = localized('registration_note')
    values.registration = registration
    for (const column of ['audience', 'preparation']) {
      const items = pairedLines(column).map(([zh, en]) => pair(zh, en, column))
      if (items.length) values[column] = items
    }
    const agenda = pairedLines('agenda').map(([zh, en]) => {
      const [time, title, note] = parts(zh, 'agenda_zh', 2, 3)
      const [enTime, enTitle, enNote] = parts(en, 'agenda_en', 2, 3)
      if (!time || !title) fail('agenda_zh', '每行須有時間與標題 / Each line needs a time and title')
      if (enTime && enTime !== time) fail('agenda_en', '中英議程時間必須相同 / Schedule times must match')
      return { time, title: pair(title, enTitle, 'agenda'), note: pair(note, enNote, 'agenda') }
    })
    if (agenda.length) values.agenda = agenda
    for (const column of ['travel', 'participation', 'notices']) {
      const items = pairedLines(column).map(([zh, en]) => {
        const [label, value, note, url] = parts(zh, `${column}_zh`, 2, 4)
        const [enLabel, enValue, enNote] = parts(en, `${column}_en`, 2, 3)
        if (!label || !value) fail(`${column}_zh`, '每行須有名稱與內容 / Each line needs a label and value')
        return { label: pair(label, enLabel, column), value: pair(value, enValue, column), note: pair(note, enNote, column), url: url || undefined }
      })
      if (items.length) values[column] = items
    }
    const result = eventSchema.safeParse(values)
    if (!result.success) {
      const issue = result.error.issues[0]!
      fail(issueColumn(issue.path), issue.message)
    }
    const event = result.data!
    if (slugs.has(event.slug)) fail('slug', `與第 ${slugs.get(event.slug)} 列重複 / Duplicate slug`)
    slugs.set(event.slug, rowNumber)
    events.push(event)
  }
  return events
}
