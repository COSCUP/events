import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas'
import { parseEventCsv } from '../scripts/events-csv.ts'
import { generateEventOgImages } from '../scripts/event-og-images.ts'

test('bilingual OG images fit long titles, addresses and unbroken text', async () => {
  const required = {
    publish: 'true', slug: 'required-only', title_zh: 'COSCUP 小聚', title_en: 'COSCUP Meetup',
    intro_zh: '交流開源專案。', intro_en: 'Discuss open-source projects.',
    starts_at: '2026-11-14 18:30', format: 'online', venue_zh: '線上', venue_en: 'Online',
    address_zh: '', address_en: '', registration_mode: 'free',
  }
  const records = [
    required,
    {
      ...required, slug: 'long-title-and-address', format: 'in-person',
      title_zh: '共同打造能長期維護的開源基礎建設：從服務盤點、文件整理到跨社群協作的 COSCUP 維護者交流工作坊',
      title_en: 'Maintaining Open Source Infrastructure Together: A COSCUP Community Workshop on Documentation, Sustainable Services and Collaboration Across Volunteer Teams',
      venue_zh: '臺北開源社群共同工作空間與協作實驗室',
      venue_en: 'Open Source Community Collaboration and Research Centre',
      address_zh: '臺北市中正區重慶南路一段 99 號世界大樓 11 樓 1105 室（請由側門進入，沿走廊走到底）',
      address_en: 'Room 1105, 11th Floor, World Building, No. 99, Section 1, Chongqing South Road, Zhongzheng District, Taipei City, Taiwan; enter through the side entrance',
    },
    {
      ...required, slug: 'unbroken-and-mixed-text', starts_at: '2026-11-14T18:30:00Z',
      title_zh: 'COSCUP 開源基礎建設與長期維護工作坊 '.repeat(8),
      title_en: 'Cafe\u0301OpenSourceInfrastructure'.repeat(12),
      venue_zh: '開源協作實驗室 A 棟\nB 會議室：'.repeat(8),
      venue_en: 'InternationalOpenSourceCommunityResearchCentre'.repeat(6),
      address_zh: '臺北市中正區重慶南路一段九十九號世界大樓十一樓一一零五室'.repeat(4),
      address_en: 'No99Section1ChongqingSouthRoadZhongzhengDistrictTaipeiCityTaiwan'.repeat(4),
    },
  ]
  const columns = Object.keys(required) as (keyof typeof required)[]
  const quote = (value: string) => `"${value.replaceAll('"', '""')}"`
  const csv = [columns, ...records.map(record => columns.map(column => record[column]))].map(row => row.map(quote).join(',')).join('\n')
  const events = parseEventCsv(csv)
  const directory = resolve('artifacts/og-cases')
  type Draw = { text: string; x: number; y: number; left: number; right: number; top: number; bottom: number }
  const frames = new Map<SKRSContext2D, Draw[]>()
  const prototype = Object.getPrototypeOf(createCanvas(1, 1).getContext('2d')) as SKRSContext2D
  const original = prototype.fillText
  // Inspect actual paint calls and native font bounds, without snapshotting raster pixels.
  prototype.fillText = function (...args) {
    const [value, x, y] = args
    const metrics = this.measureText(value)
    const draws = frames.get(this) || []
    draws.push({ text: value, x, y, left: x - metrics.actualBoundingBoxLeft, right: x + metrics.actualBoundingBoxRight, top: y - metrics.actualBoundingBoxAscent, bottom: y + metrics.actualBoundingBoxDescent })
    frames.set(this, draws)
    return original.apply(this, args)
  }
  try {
    await generateEventOgImages(events, directory, resolve('public/images/coscup-green.svg'))
  } finally {
    prototype.fillText = original
  }
  assert.equal(frames.size, events.length * 2)
  for (const draws of frames.values()) {
    for (const draw of draws) {
      assert.ok(draw.left >= 48 && draw.right <= 1152, `Horizontal overflow: ${draw.text}`)
      assert.ok(draw.top >= 32 && draw.bottom <= 614, `Vertical overflow: ${draw.text}`)
    }
    const title = draws.filter(draw => draw.y >= 140 && draw.y < 430)
    const location = draws.filter(draw => draw.x === 576 && draw.y >= 504)
    assert.ok(title.length >= 1 && title.length <= 3)
    assert.ok(title.every(draw => draw.bottom < 406), 'Title overlaps the information band')
    assert.ok(location.length >= 1 && location.length <= 3)
    assert.ok(location.every(draw => draw.left > 544), 'Location overlaps the date')
  }
  const drawnText = [...frames.values()].flat().map(draw => draw.text)
  assert.equal(drawnText.filter(value => value === '2026.11.15').length, 2, 'Dates use Taiwan time')
  assert.ok(drawnText.some(value => value.endsWith('…')), 'Extreme text is visibly truncated')
  assert.ok(drawnText.some(value => value.includes('臺北市中正區')), 'Optional addresses appear')
  for (const event of events) {
    for (const locale of ['zh-TW', 'en']) {
      const image = readFileSync(join(directory, locale, `${event.slug}.png`))
      assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
      assert.equal(image.readUInt32BE(16), 1200)
      assert.equal(image.readUInt32BE(20), 630)
    }
  }
  writeFileSync(join(directory, 'layout.json'), JSON.stringify([...frames.values()], null, 2))
})
