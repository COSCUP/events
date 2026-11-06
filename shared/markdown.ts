import MarkdownIt from 'markdown-it'
import type { Locale } from './events.ts'

const markdown = new MarkdownIt({ html: false, linkify: false })

// Article headings sit below the page title and the section heading.
for (const rule of ['heading_open', 'heading_close']) {
  markdown.renderer.rules[rule] = (tokens, index, options, _env, renderer) => {
    const token = tokens[index]!
    token.tag = `h${Math.min(6, Number(token.tag.slice(1)) + 2)}`
    return renderer.renderToken(tokens, index, options)
  }
}
markdown.renderer.rules.link_open = (tokens, index, options, _env, renderer) => {
  const token = tokens[index]!
  if (/^(https?:)?\/\//i.test(String(token.attrGet('href') || ''))) {
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'noopener noreferrer')
  }
  return renderer.renderToken(tokens, index, options)
}
const image = markdown.renderer.rules.image!
markdown.renderer.rules.image = (tokens, index, options, env, renderer) => {
  tokens[index]!.attrSet('loading', 'lazy')
  tokens[index]!.attrSet('decoding', 'async')
  return image(tokens, index, options, env, renderer)
}
markdown.renderer.rules.table_open = (_tokens, _index, _options, env) => `<div class="markdown-table" role="region" tabindex="0" aria-label="${env?.locale === 'en' ? 'Scrollable table' : '可捲動的表格'}"><table>\n`
markdown.renderer.rules.table_close = () => '</table></div>\n'

export function renderMarkdown(value: string, locale: Locale = 'zh-TW'): string {
  return markdown.render(value, { locale })
}
