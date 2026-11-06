# COSCUP Events

A bilingual hub for COSCUP activities, built with **Nuxt 4, Vue 3 and TypeScript**, and generated as static HTML for GitHub Pages. Registration takes place on each organizer's external website.

The site includes responsive event listings and details, About COSCUP, the official Code of Conduct, calendar downloads and subscriptions, an RSS feed, and Chinese/English navigation. Events are published from [`event.csv`](event.csv), with `llms.txt` and bilingual Markdown generated alongside the pages. Fonts and icons are served locally; no third-party scripts or analytics are required.

## 填表上架活動

1. 編輯根目錄的 [`event.csv`](event.csv)，一列一場活動；`*` 欄位為必填，活動名稱、簡介與地點皆須填中英雙語。其他選填內容若有填寫，也須提供對應英文。
2. 完成並確認資訊後把 `publish` 改為 `true`。目前七筆範例均為 `false`，不會自動公告。
3. 合併至 `main` 後，GitHub Actions 自動檢查、建置並部署 GitHub Pages。也可在 Actions 手動執行 **Validate and deploy Pages**，選擇 `main` 重建。

完整欄位、議程填法與上架流程見 [event.csv 填寫說明](docs/event-csv.md)。無須編輯 JSON 或產出檔；必填或格式有誤時不部署，Action log 會指出列號與欄位。

## Development

Use Node.js 24.15+ (or 22.22.3+ in the Node 22 line).

```bash
npm ci
npm run dev
```

Open the local URL printed by Nuxt. The default deployment prefix is `/events/`.

Development uses the examples in `fixtures/events.csv`, parsed through the same CSV pipeline and rendered with the same components as production. All upcoming and past activities come from the CSV; their details and registration states are **illustrative, not announcements**. The listing includes seven upcoming examples: two with only required fields, several with selected optional sections, and two with full details. Events with `registration_mode=free` and no registration URL offer an **Add to calendar** menu with Google Calendar and an iCS download. Only the unlisted design fixtures allow incomplete content to exercise missing-content and translation-fallback layouts; `event.csv` always uses the stricter publication rules. Example registration links open COSCUP's KKTIX directory.

Production uses **only rows with `publish=true` in `event.csv`**. The initial examples are drafts, so production renders the empty state until confirmed events are published. Set `EVENTS_DEMO=0` when running the development server to preview this catalog; CSV changes reload the server. Draft rows never enter the site output, but the repository itself is public.

## Build and preview

```bash
# Production: confirmed content only
npm run generate
npm run preview

# Review the design examples separately
npm run generate:demo
npm run preview:demo
```

Production output is `.output/public`; example output is `.output-demo/public`. The preview server serves the same prefix as Pages and returns HTTP 404 for unknown files. It binds to `127.0.0.1:4173`; use `PORT=4174` to run another instance.

Paths below are application paths, appended to the deployment prefix:

| Page | Chinese | English |
| --- | --- | --- |
| Upcoming events | `/events/` | `/en/events/` |
| Event detail | `/events/<slug>/` | `/en/events/<slug>/` |
| About COSCUP | `/about/` | `/en/about/` |
| Code of Conduct | `/code-of-conduct/` | `/en/code-of-conduct/` |

For example, with the default prefix, an event URL is `/events/events/<slug>/`. The root `/events/` is a rendered listing and chooses the remembered language after the page becomes interactive. Explicit language URLs always take precedence over preferences.

The `open-source-afternoon` and `documentation-circle` examples contain only required fields. `online-gathering`, `community-lightning-night`, and `open-source-tools-workshop` use different subsets of optional fields. The `simple-meetup`, `no-intro`, `translation-example`, and `long-translation-example` detail slugs remain unlisted defensive-rendering fixtures. List counts and past activities follow the CSV and current date; query parameters do not inject or replace event data.

## Publishing events

The [CSV authoring guide](docs/event-csv.md) documents all 52 columns. The ten required fields are `slug`, `title_zh`, `title_en`, `intro_zh`, `intro_en`, `starts_at`, `format`, `venue_zh`, `venue_en`, and `registration_mode`; `registration_url` is also required for external registration in `info` or `open` status. Other content is optional. Localized fields require both Chinese and English, including individual list items and schedule notes, except for the independently optional Markdown descriptions below. `publish=true` explicitly opts a record into the build.

Use `description_zh` and `description_en` for a Markdown event description. Each field is independently optional: Chinese only, English only, both, or neither can be published. The current language's article appears in a separate **活動介紹 / Event description** section, including page navigation; a missing translation omits that section. Headings, lists, links, images, quotes, tables, and fenced code blocks are supported; raw HTML is displayed as text. Required `intro_zh` / `intro_en` remain the plain-text introduction used by listings, metadata, and calendars. Event Markdown for Agents includes the current language's description with its formatting preserved.

Use UTF-8 CSV; spreadsheet quotes, commas, CRLF and multiline cells are supported. Local dates such as `2027-01-16 13:00` default to Taiwan (UTC+8); explicit offsets are preserved. Slugs must be unique and stable. External links must use HTTP or HTTPS. CSV parsing runs through the existing [event schema](shared/events.ts) before any pages are built.

Missing required content or translations blocks publication; incomplete draft rows remain allowed. Optional sections are omitted when empty; missing fees or end times are never invented. Registration details are handled by the linked organizer website. `listed=false` hides a published event from lists and feeds but leaves its detail pages public; use `publish=false` to remove it from the build entirely.

For activities without registration, set `registration_mode=free` and leave `registration_url` blank. The primary action is **加入行事曆 / Add to calendar**, with Google Calendar and iCS download options. A confirmed online entrance may take the primary position while the detail page retains the calendar action. See the [registration-free event rules](docs/event-csv.md#免報名活動).

Visible time-sensitive status refreshes in the browser every 30 seconds and when the tab returns to the foreground. HTML, RSS, subscription calendars, the sitemap and Agent files are static snapshots refreshed on deployment. Subscribers control their calendar polling interval.

## Agent-readable content

The build generates `/events/llms.txt` using the [llms.txt format](https://llmstxt.org/), with links to the full Chinese and English event Markdown at `/events/events/<slug>/index.md` and `/events/en/events/<slug>/index.md`. All use the same validated CSV data as the HTML pages. The HTML declares `rel="describedby"` for the index and `rel="alternate"` for event Markdown. Drafts are excluded; demo builds explicitly label their examples.

## Validation

```bash
npm run check:events
npm run typecheck
npm test
npm run generate
```

These are the core publishing checks used by CI. Domain tests include CSV parsing, publication rules and Agent output as well as the existing registration and calendar rules. The optional browser suite remains available when changing the interface:

```bash
npm run generate:demo
npx playwright install chromium
npm run test:e2e
```

Browser tests run against the generated example site under `/events/`, covering direct links and reloads, language and return context, sharing, calendar downloads, mobile registration controls, official text, keyboard navigation, accessibility, and 320/390/768/1024/1440px layouts.

Screenshots are saved to the ignored `artifacts/screenshots/` directory. If a compatible Chromium is already installed, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its executable path. Automated browser checks do not constitute physical-device or screen-reader testing. Tests never submit registrations or newsletter subscriptions.

## GitHub Pages

[`.github/workflows/pages.yml`](.github/workflows/pages.yml) runs on pushes to `main` (including every `event.csv` update), pull requests targeting `main`, and manual dispatch. Only a successful, non-PR build on `main` deploys `.output/public`; example builds are never uploaded to Pages. Failed CSV validation prevents deployment and leaves the previous site intact.

The repository's publishing source is already **GitHub Actions**, with the site at [coscup.org/events](https://coscup.org/events/). The default configuration matches that host and `/events/` prefix. For another host or path, set `NUXT_PUBLIC_SITE_URL` and `NUXT_APP_BASE_URL` at build time, then regenerate; `.env.example` documents the defaults.

No server, database, secrets or API tokens are required. The workflow uses GitHub's normal Pages permissions. Review implementation changes on their branch before merging to `main`.

## Content and assets

- About COSCUP reproduces the official Chinese and English text from the [2026 website](https://coscup.org/2026/about/), under the [COSCUP repository's MIT license](public/licenses/coscup-2026-MIT.txt).
- The Code of Conduct preserves the official `v20240109` Chinese and English text, including its existing translation differences, references and Chinese changelog. It is attributed on each page under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- COSCUP logos are official supplied assets. Trademark rights remain with their owner.
- Social icons are from Tabler Icons, with the [MIT notice](public/licenses/tabler-MIT.txt) retained.
- Noto Sans TC and IBM Plex Mono use the SIL Open Font License; copies are in `public/licenses/`.

Design review exports and local QA artifacts are excluded from the published repository and build output.
