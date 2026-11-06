import { readFileSync } from 'node:fs'
import { parseEventCsv } from './events-csv.ts'

try {
  const events = parseEventCsv(readFileSync(new URL('../event.csv', import.meta.url), 'utf8'))
  console.log(`event.csv 檢查通過 / Valid: ${events.length} published event(s). Rows with publish=false or blank stay in draft.`)
} catch (error) {
  console.error((error as Error).message)
  process.exitCode = 1
}
