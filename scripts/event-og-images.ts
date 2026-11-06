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
  // Preserve short names separated by spaces (e.g. 小聚); segment longer CJK phrases.
  const tokens: string[] = []
  for (const chunk of value.replace(/\s+/g, ' ').trim().match(/\s+|\S+/gu) || []) {
    const parts = context.measureText(chunk).width <= width ? [chunk] : Array.from(words.segment(chunk), item => item.segment)
    for (const part of parts) {
      if (/^[，。！？；：、）》」』】,.!?:;%)]+$/u.test(part) && tokens.length) tokens[tokens.length - 1] += part
      else tokens.push(part)
    }
  }
  for (const segment of tokens) {
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

type TextBox = { x: number; y: number; width: number; height: number; size: number; minSize: number; maxLines: number; weight?: number; leading?: number; balance?: boolean; centered?: boolean }
const colors = { green: '#0c3c23', paper: '#f4f7f1', accent: '#d2edb3' }
const titleBox: TextBox = { x: 56, y: 156, width: 1088, height: 250, size: 100, minSize: 36, maxLines: 3, weight: 800, leading: 1.12, balance: true, centered: true }

function drawText(context: SKRSContext2D, value: string, locale: Locale, box: TextBox) {
  let size = box.size
  let lines: string[] = []
  const leading = box.leading ?? 1.2
  for (; size >= box.minSize; size -= 2) {
    context.font = `${box.weight ?? 700} ${size}px ${fontFamily}`
    lines = wrapText(context, value, box.width, locale)
    if ((lines.length <= box.maxLines && lines.length * size * leading <= box.height) || size === box.minSize) break
  }
  if (lines.length > box.maxLines) {
    lines = lines.slice(0, box.maxLines)
    const original = lines.at(-1)!
    const last = Array.from(new Intl.Segmenter(locale, { granularity: 'grapheme' }).segment(original), item => item.segment)
    while (last.length && context.measureText(`${last.join('')}…`).width > box.width) last.pop()
    let ending = last.join('').trimEnd()
    // Prefer a complete final word; unbroken strings still fall back to grapheme-safe clipping.
    if (ending !== original.trimEnd() && /[a-z\p{M}]$/iu.test(ending) && ending.includes(' ')) ending = ending.slice(0, ending.lastIndexOf(' ')).trimEnd()
    lines[lines.length - 1] = `${ending}…`
  } else if (box.balance && lines.length > 1) {
    // Keep the same line count while avoiding one short word stranded on the last line.
    let low = box.width / 2
    let high = box.width
    while (high - low > 1) {
      const width = (low + high) / 2
      const balanced = wrapText(context, value, width, locale)
      if (balanced.length <= lines.length) { high = width; lines = balanced }
      else low = width
    }
  }
  const top = box.y + (box.centered ? (box.height - lines.length * size * leading) / 2 : 0)
  lines.forEach((line, index) => context.fillText(line, box.x, top + index * size * leading))
}

export async function generateEventOgImages(events: Event[], directory: string, logoPath: string, backgroundPath: string) {
  loadFonts()
  const [logo, background] = await Promise.all([loadImage(logoPath), loadImage(backgroundPath)])
  // Reuse the supplied brand artwork in white without depending on a second asset.
  const whiteLogo = createCanvas(logo.width, logo.height)
  const logoContext = whiteLogo.getContext('2d')
  logoContext.drawImage(logo, 0, 0)
  logoContext.globalCompositeOperation = 'source-in'
  logoContext.fillStyle = colors.paper
  logoContext.fillRect(0, 0, logo.width, logo.height)
  const createImage = (home = false) => {
    const canvas = createCanvas(1200, 630)
    const context = canvas.getContext('2d')
    context.textBaseline = 'top'
    context.fillStyle = home ? colors.accent : colors.green
    context.fillRect(0, 0, 1200, 630)
    // Cover the canvas without stretching; opacity applies only to the photograph.
    const scale = Math.max(1200 / background.width, 630 / background.height)
    const width = background.width * scale
    const height = background.height * scale
    context.save()
    context.globalAlpha = home ? 0.18 : 0.48
    context.drawImage(background, (1200 - width) / 2, (630 - height) / 2, width, height)
    context.restore()
    if (!home) context.drawImage(whiteLogo, 52, 46, 154, 154 * logo.height / logo.width)
    context.fillStyle = home ? colors.green : colors.accent
    context.font = `500 24px ${fontFamily}`
    context.textAlign = 'right'
    context.fillText('coscup.org/events', 1144, 56)
    context.textAlign = 'left'
    context.fillStyle = home ? colors.green : colors.paper
    return { canvas, context }
  }
  // This directory contains generated images only; removed CSV rows leave no stale images.
  rmSync(directory, { recursive: true, force: true })
  for (const locale of ['zh-TW', 'en'] as const) {
    const output = join(directory, locale)
    mkdirSync(output, { recursive: true })
    const home = createImage(true)
    home.context.drawImage(logo, 40, 114, 720, 720 * logo.height / logo.width)
    drawText(home.context, locale === 'en' ? 'Events' : '活動', locale, { x: 56, y: 392, width: 710, height: 160, size: 132, minSize: 132, maxLines: 1, weight: 800 })
    home.context.font = `500 32px ${fontFamily}`
    const topics = locale === 'en' ? ['Meetups', 'Workshops', 'Open-source events'] : ['社群聚會', '工作坊', '開源活動']
    topics.forEach((topic, index) => home.context.fillText(topic, 820, 416 + index * 48))
    writeFileSync(join(directory, `home-${locale}.png`), await home.canvas.encode('png'))
    for (const event of events) {
      const { canvas, context } = createImage()
      drawText(context, text(event.title, locale), locale, titleBox)
      drawText(context, text(event.venue, locale), locale, { x: 56, y: 444, width: 744, height: 80, size: 36, minSize: 30, maxLines: 2, leading: 1.12 })
      const address = text(event.address, locale)
      if (address) drawText(context, address, locale, { x: 56, y: 530, width: 744, height: 64, size: 26, minSize: 24, maxLines: 2, weight: 400 })
      context.fillStyle = colors.accent
      const date = taipeiDate(event.startsAt)
      context.font = `500 30px ${fontFamily}`
      context.fillText(date.slice(0, 4), 876, 444)
      context.font = `800 88px ${fontFamily}`
      context.fillText(date.slice(5).replace('-', '.'), 876, 488)
      writeFileSync(join(output, `${event.slug}.png`), await canvas.encode('png'))
    }
  }
}
