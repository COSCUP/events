# Event CSV guide

Edit [`event.csv`](../event.csv) as UTF-8 CSV, one event per row. Preserve the headers and existing events; `*` marks required fields. See the [publishing workflow](../README.md#publish-an-event).

- `_zh` is Traditional Chinese; `_en` is English. Fill both when using a localized field, except for independently optional Markdown descriptions.
- Dates accept `YYYY-MM-DD HH:mm` (Taiwan, UTC+8) or ISO 8601 with an offset. Keep spreadsheet date cells as text. URLs must use HTTP(S).
- Blank optional fields are omitted. Draft rows may be incomplete, but the repository and CSV are public.
- Run `npm run check:events` before publishing; errors identify the row and field.
- Each published event gets Chinese and English 1200×630 PNG share images using its title, venue, optional address and start date (Taiwan time). Long text wraps and shrinks, then uses an ellipsis if needed. Images regenerate from the CSV in development and on deployment; no image field is needed.

## Required fields

| Field | Value |
| --- | --- |
| `slug` | Unique, stable URL identifier: lowercase letters, digits and hyphens. `en`, `about` and `code-of-conduct` are reserved. |
| `title_zh`, `title_en` | Event title. |
| `intro_zh`, `intro_en` | Plain-text introduction, also used in listings and calendars. |
| `starts_at` | Start date and time. |
| `format` | `in-person`, `online` or `hybrid`. |
| `venue_zh`, `venue_en` | Venue or online meeting location. |
| `registration_mode` | `external` for a registration link; `free` for no registration required. |

## Publication and status

| Field | Value / default |
| --- | --- |
| `publish` | `true` includes the event; `false` or blank excludes it entirely. |
| `listed` | Defaults to `true`. `false` hides it from lists, feeds and indexes; detail pages remain public. |
| `state` | `scheduled` (default), `cancelled`, `postponed` or `ended`. Scheduled events end automatically at `ends_at`, or at the end of their start date in Taiwan when no end time is given. |

Boolean fields accept `true` / `false`, including uppercase spreadsheet values.

## Optional content

| Field | Content |
| --- | --- |
| `ends_at` | End time, later than `starts_at`. Leave blank if unknown. |
| `description_zh`, `description_en` | Markdown article. Either language may be omitted; only the current language's article is shown. Raw HTML is displayed as text. |
| `category_zh`, `category_en` | Event category. |
| `address_zh`, `address_en` | Full address. |
| `map_url` | Map link. |
| `language_zh`, `language_en` | Format and spoken languages. |
| `language_note_zh`, `language_note_en` | Additional language information. |
| `fee_zh`, `fee_en` | Fee description. Blank hides all fee information without a placeholder. Enter `免費` / `Free` explicitly for free admission. |
| `check_in` | Check-in time in Taiwan, `HH:mm`. |
| `audience_zh`, `audience_en` | Intended participants; one item per line. |
| `preparation_zh`, `preparation_en` | What to prepare; one item per line. |
| `agenda_zh`, `agenda_en` | Schedule; see cell formats below. |
| `travel_zh`, `travel_en` | Travel and accessibility information. |
| `participation_zh`, `participation_en` | Joining instructions. |
| `notices_zh`, `notices_en` | Attendee information. The site's Code of Conduct is shared across events. |
| `record_url` | Recap link. |
| `announcement_url` | Announcement link, including cancellation or postponement updates. |

## Registration

For events without registration, set `registration_mode=free` and leave registration links and status blank. The main action is **Add to calendar**, offering Google Calendar and an iCS download. This does not imply free admission; fees must be entered explicitly.

| Field | Value / default |
| --- | --- |
| `registration_url` | Required for `external` events with `info` or `open` status. |
| `registration_status` | `info` (default), `open`, `soon`, `full` or `closed`. A link alone does not mean registration is open. |
| `registration_platform` | Optional platform name; does not change the Register button label. |
| `registration_opens_at` | Opening time for reminders; reaching it does not automatically mark registration open. |
| `registration_closes_at` | Deadline; closes registration automatically. |
| `registration_note_zh`, `registration_note_en` | Additional registration information. |
| `waitlist_url` | Waitlist link shown when status is `full`. |
| `join_url`, `join_ready` | Set `join_ready=true` only with a confirmed entrance URL. For events without registration, this replaces the main action with **Join the online event**. `join_ready` defaults to `false`. |

Cancelled, postponed, ended and closed events have no primary action; full events only offer a waitlist when provided.

## Cell formats

Use real line breaks inside cells. Spreadsheet CSV export handles commas, quotes and multiline content.

- **Markdown:** write normal Markdown in `description_zh` / `description_en`; do not apply the formats below.
- **Lists and schedules:** match the order and number of lines in both languages, including translations of notes. Do not use `-` as a missing translation.
- **Agenda:** each line is `Time | Title | Note`. Note is optional; times must match across languages.
- **Travel, participation and notices:** `_zh` uses `Label | Value | Note | URL`; `_en` uses `Label | Value | Note`. Note and URL are optional; the URL in `_zh` is shared by both languages. With a URL but no note, use `Label | Value | | https://example.org/map`.

Use `|` only as a separator in structured fields; use `｜` for a literal pipe in text.
