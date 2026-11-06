# COSCUP Events

The bilingual [COSCUP event website](https://coscup.org/events/), built with Nuxt 4, Vue 3 and TypeScript for GitHub Pages. Pages, calendar/RSS feeds and `llms.txt` with event Markdown are generated from one CSV.

## Publish an event

1. Edit [`event.csv`](event.csv), one event per row. See the [CSV guide](docs/event-csv.md) for fields and formatting.
2. Set `publish=true` when ready; leave drafts as `false` or blank.
3. Merge into `main`. [GitHub Actions](.github/workflows/pages.yml) validates, builds and deploys the site. Failed checks leave the existing site intact.

To rebuild without editing, run **Validate and deploy Pages** in Actions on `main`. Development and production use the same published CSV rows.

## Develop

Use Node.js 24 ([`.nvmrc`](.nvmrc)).

```bash
npm ci
npm run dev
```

Open [localhost:3000/events/](http://localhost:3000/events/). CSV edits reload the server. For LAN access, use `npm run dev -- --host 0.0.0.0`.

## Check and build

```bash
npm run check:events
npm run typecheck
npm test
npm run generate
npm run preview
```

Static output: `.output/public`. Preview: [localhost:4173/events/](http://localhost:4173/events/). Host and path settings are in [`.env.example`](.env.example).

For UI changes, install Chromium with `npx playwright install chromium`, then run `npm run test:e2e` after generating the site.

## Licenses

Source code is licensed under the [MIT License](LICENSE).

The Code of Conduct is [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). About-page content and icons use MIT; fonts use SIL OFL. [License notices](public/licenses/) are included. COSCUP retains rights to its logos.
