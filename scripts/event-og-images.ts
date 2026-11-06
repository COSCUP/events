import { createCanvas, GlobalFonts, loadImage, type SKRSContext2D } from '@napi-rs/canvas'
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { taipeiDate, text, type Event, type Locale } from '../shared/events.ts'

const require = createRequire(import.meta.url)
let fontFamily = ''

function loadFonts() {
  if (fontFamily) return fontFamily
  const directory = join(dirname(require.resolve('@fontsource-variable/noto-sans-tc/package.json')), 'files')
  // Each subset gets its own family so CJK fallback uses the bundled glyphs.
  fontFamily = readdirSync(directory).filter(file => file.endsWith('.woff2')).sort().map((file, index) => {
    const name = `CoscupOg${index}`
    if (!GlobalFonts.has(name) && !GlobalFonts.registerFromPath(join(directory, file), name)) throw new Error(`Cannot load OG font: ${file}`)
    return name
  }).join(', ')
  return fontFamily
}

function wrapText(context: SKRSContext2D, value: string, width: number, locale: Locale) {
  const lines: string[] = []
  let line = ''
  const words = new Intl.Segmenter(locale, { granularity: 'word' })
  const characters = new Intl.Segmenter(locale, { granularity: 'grapheme' })
  for (const { segment } of words.segment(value.replace(/\s+/g, ' ').trim())) {
    if (context.measureText(line + segment).width <= width) { line += segment; continue }
    if (line.trim()) lines.push(line.trimEnd())
    line = ''
    for (const { segment: character } of characters.segment(segment.trimStart())) {
      if (line && context.measureText(line + character).width > width) { lines.push(line); line = '' }
      line += character
    }
  }
  if (line) lines.push(line.trimEnd())
  return lines
}

type TextBox = { x: number; y: number; width: number; height: number; size: number; minSize: number; maxLines: number; centered?: boolean }

function drawText(context: SKRSContext2D, value: string, locale: Locale, box: TextBox) {
  let size = box.size
  let lines: string[] = []
  for (; size >= box.minSize; size -= 2) {
    context.font = `700 ${size}px ${fontFamily}`
    lines = wrapText(context, value, box.width, locale)
    if ((lines.length <= box.maxLines && lines.length * size * 1.2 <= box.height) || size === box.minSize) break
  }
  if (lines.length > box.maxLines) {
    lines = lines.slice(0, box.maxLines)
    const last = Array.from(new Intl.Segmenter(locale, { granularity: 'grapheme' }).segment(lines.at(-1)!), item => item.segment)
    while (last.length && context.measureText(`${last.join('')}…`).width > box.width) last.pop()
    lines[lines.length - 1] = `${last.join('').trimEnd()}…`
  }
  const lineHeight = size * 1.2
  const top = box.y + (box.centered ? (box.height - lines.length * lineHeight) / 2 : 0)
  lines.forEach((line, index) => context.fillText(line, box.x, top + index * lineHeight))
}

export async function generateEventOgImages(events: Event[], directory: string, logoPath: string) {
  loadFonts()
  const logo = await loadImage(logoPath)
  // This directory contains generated images only; removed CSV rows leave no stale images.
  rmSync(directory, { recursive: true, force: true })
  for (const locale of ['zh-TW', 'en'] as const) {
    const output = join(directory, locale)
    mkdirSync(output, { recursive: true })
    for (const event of events) {
      const canvas = createCanvas(1200, 630)
      const context = canvas.getContext('2d')
      context.textBaseline = 'top'
      context.fillStyle = '#f4f7f1'
      context.fillRect(0, 0, 1200, 630)
      context.fillStyle = '#3b9838'
      context.fillRect(0, 0, 1200, 8)
      context.drawImage(logo, 64, 56, 168, 168 * logo.height / logo.width)
      context.fillStyle = '#2c762a'
      context.font = `500 24px ${fontFamily}`
      context.textAlign = 'right'
      context.fillText('coscup.org/events', 1136, 74)
      context.textAlign = 'left'
      context.fillStyle = '#0c3c23'
      drawText(context, text(event.title, locale), locale, { x: 64, y: 164, width: 1072, height: 220, size: 76, minSize: 40, maxLines: 3, centered: true })
      context.fillRect(0, 430, 1200, 200)
      context.fillStyle = '#5e8069'
      context.fillRect(520, 468, 1, 114)
      context.fillStyle = '#c3cfbd'
      context.font = `500 22px ${fontFamily}`
      context.fillText(locale === 'en' ? 'DATE' : '日期', 64, 464)
      context.fillText(locale === 'en' ? 'VENUE' : '地點', 576, 464)
      context.fillStyle = '#ffffff'
      context.font = `700 46px ${fontFamily}`
      context.fillText(taipeiDate(event.startsAt).replaceAll('-', '.'), 64, 504)
      const location = [text(event.venue, locale), text(event.address, locale)].filter(Boolean).join(' · ')
      drawText(context, location, locale, { x: 576, y: 504, width: 560, height: 96, size: 40, minSize: 24, maxLines: 3 })
      writeFileSync(join(output, `${event.slug}.png`), await canvas.encode('png'))
    }
  }
}
