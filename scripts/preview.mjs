import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'

const directory = resolve(process.argv.includes('--demo') ? '.output-demo/public' : '.output/public')
const base = `/${(process.env.NUXT_APP_BASE_URL || '/events/').replace(/^\/+|\/+$/g, '')}/`.replace('//', '/')
const port = Number(process.env.PORT || 4173)
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ics': 'text/calendar; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8' }
await stat(directory).catch(() => { throw new Error(`Build first: ${directory} is missing.`) })
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost')
    if (base !== '/' && url.pathname === base.slice(0, -1)) { response.writeHead(301, { Location: base + url.search }); response.end(); return }
    if (!url.pathname.startsWith(base)) { response.writeHead(404); response.end('Not found'); return }
    let file = resolve(directory, decodeURIComponent(url.pathname.slice(base.length)))
    if (file !== directory && !file.startsWith(directory + sep)) { response.writeHead(404); response.end('Not found'); return }
    let code = 200
    try {
      const info = await stat(file)
      if (info.isDirectory()) {
        if (!url.pathname.endsWith('/')) { response.writeHead(301, { Location: url.pathname + '/' + url.search }); response.end(); return }
        file = resolve(file, 'index.html')
      }
      await stat(file)
    } catch { file = resolve(directory, '404.html'); code = 404 }
    const body = await readFile(file)
    response.writeHead(code, { 'Content-Type': types[extname(file)] || 'application/octet-stream' })
    response.end(request.method === 'HEAD' ? undefined : body)
  } catch { response.writeHead(404); response.end('Not found') }
})
server.listen(port, '127.0.0.1', () => process.stdout.write(`Local: http://127.0.0.1:${port}${base}\n`))
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(() => process.exit(0)))
