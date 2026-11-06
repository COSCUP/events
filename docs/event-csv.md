# 填寫 event.csv 上架活動

網站的正式活動資料只有根目錄的 [`event.csv`](../event.csv)。**一列一場活動**，可用 Excel、LibreOffice 或 Google 試算表編輯，再匯出為 UTF-8 CSV（逗號分隔）。第一列是欄名，請保留；欄名的 `*` 代表上架時必填。

## 上架流程

1. 下載或複製 `event.csv`，保留其他人的活動列。檔案目前有兩筆完整示範，`publish=false`，不會上架。
2. 新增一列，填好核心欄位與已確認的資訊。未完成時讓 `publish` 保持 `false` 或空白。
3. 準備上架時將 `publish` 設為 `true`，透過 Pull Request 合併到 `main`（有直接寫入權限也可以直接更新 main 的檔案）。
4. GitHub Actions 的 **Validate and deploy Pages** 會驗證 CSV、產生雙語網頁、RSS、行事曆與 Agent 文件，成功後部署 GitHub Pages。只要 main 有更新就會觸發，包含 `event.csv`；也可在 Actions 按 **Run workflow** 並選 `main` 手動重建。

不必維護 JSON、手寫網頁或複製產出檔。驗證失敗就不部署，既有網站保持原狀；在 Action log 依 `row`（含標題列的試算表列號）、欄位名稱修正即可。多行儲存格會另外顯示純文字檔案的行號。

`publish=false` 的列不會進入 HTML、JavaScript、Markdown 或任何 feed。這是上架開關，**CSV 所在的 GitHub repository 仍是公開的，草稿不可填私人資料**。設計範例請先換成主辦單位確認的內容再發布。

## 核心欄位

| 欄位 | 必填 | 說明與範例 |
| --- | --- | --- |
| `publish` | 上架需 `true` | `true` 上架；`false` 或空白為草稿。Excel 輸出的 `TRUE` / `FALSE` 也可用。 |
| `slug*` | 是 | 網址識別，限小寫英數與連字號，例如 `community-meetup-taipei`；不可重複，上架後避免更改。 |
| `title_zh*` | 是 | 中文活動名稱。 |
| `title_en*` | 是 | 英文活動名稱。 |
| `intro_zh*` | 是 | 中文活動簡介，可換行、分段或列點；網站自動產生列表摘要、短簡介或完整內文，不需另填摘要。 |
| `intro_en*` | 是 | 對應的英文活動簡介。 |
| `starts_at*` | 是 | 開始時間，例如 `2027-01-16 13:00`，省略時區時使用台灣 UTC+8。 |
| `ends_at` | 否 | 結束時間；未填就不臆測活動長度。 |
| `format*` | 是 | `in-person` 實體、`online` 線上、`hybrid` 混合。 |
| `venue_zh*` | 是 | 中文地點或線上方式，例如 `臺科大國際大樓`、`線上・Jitsi Meet`。 |
| `venue_en*` | 是 | 英文地點或線上方式。 |
| `registration_mode*` | 是 | `external` 外部報名；`free` 免報名（不是免費入場，費用另填）。 |
| `registration_url` | 條件必填 | `external` 且狀態為 `info` 或 `open` 時必填；填官方 HTTP(S) 報名網址。 |
| `registration_status` | 否 | `info` 報名資訊（預設）、`open` 已確認開放、`soon` 即將開放、`full` 額滿、`closed` 截止。只有網址不會自動宣稱已開放。 |

所有 `*_at` 欄位皆可使用 `YYYY-MM-DD HH:mm`，或含秒、明確時區的 ISO 格式，例如 `2027-01-16T13:00:00+08:00`。請把試算表日期欄設為純文字，避免匯出成地區格式或日期序號；結束時間必須晚於開始時間。

## 免報名活動

活動不需要報名時，將 `registration_mode` 設為 `free`，`registration_url` 與 `registration_status` 可留白；不需要為了顯示按鈕填入報名網址。`free` 表示免報名，活動是否收費仍由 `fee_zh` / `fee_en` 說明。

- 一般免報名活動的列表卡片、詳情頁，以及顯示中的手機底部操作列，主要按鈕直接使用 **「加入行事曆」／「Add to calendar」**。
- 點擊後下載該活動的 `.ics` 行事曆檔，包含活動名稱、開始時間、地點與活動頁連結；有提供結束時間才加入結束時間，不經過報名網站。
- 主要按鈕已是行事曆時，不再重複顯示第二個行事曆按鈕，也不顯示外部報名資訊提示。
- 若免報名的線上活動已提供 `join_url` 並明確設定 `join_ready=true`，沿用線上活動規則：主要按鈕為「進入線上活動」，詳情頁仍直接提供「加入行事曆」作為次要按鈕。

已確認的取消、延期、結束、額滿或截止狀態仍優先處理，不因免報名而恢復可參加的主要按鈕。

## 選填內容（填寫時須提供中英）

`_zh` 為繁體中文，`_en` 為英文。上架時活動名稱、簡介與地點的中英欄位皆必填；以下選填內容若填任一語言，就必須提供另一語言，包含每筆議程、交通或須知的名稱、內容與補充。缺少翻譯會阻擋上架，不會自動翻譯。完全未填的選填區塊會省略；`publish=false` 的草稿可保留未完成內容。

| 欄位 | 用途 |
| --- | --- |
| `category_zh`, `category_en` | 類別，如社群聚會 / Meetup、工作坊 / Workshop。 |
| `address_zh`, `address_en` | 詳細地址，線上活動也可填連結公布方式。 |
| `map_url` | 地圖 HTTP(S) 網址。 |
| `language_zh`, `language_en` | 活動形式與使用語言，例如「實體・華語」/ `In person · Mandarin`。 |
| `language_note_zh`, `language_note_en` | 語言補充，例如「部分講題英語」。 |
| `fee_zh`, `fee_en` | 費用說明；未填不會推定免費。 |
| `capacity` | 總名額，正整數；未填不會推定不限額。 |
| `check_in` | 台灣時間的報到時間，24 小時制 `HH:mm`。 |
| `audience_zh`, `audience_en` | 適合對象，儲存格內一行一項。 |
| `preparation_zh`, `preparation_en` | 行前準備，儲存格內一行一項。 |
| `agenda_zh`, `agenda_en` | 議程，格式見下。 |
| `travel_zh`, `travel_en` | 交通、停車、無障礙資訊，格式見下。 |
| `participation_zh`, `participation_en` | 線上參加方式，格式見下。 |
| `notices_zh`, `notices_en` | 求助、攝影等參加須知，格式見下；行為準則使用網站共用頁面，不必重填。 |

多筆資料都填在同一個儲存格內，以換行分項。中英順序與項目數需一致，每項都須有翻譯，不能以空白或 `-` 代替。分隔符號使用半形 `|`，文字若需要直線請改用全形 `｜`。

**議程：每行 `時間 | 標題 | 補充`**，補充可省略。

`agenda_zh`：

```text
12:30 | 報到 | 領取名牌
13:00 | 開場
13:20 | Lightning Talks | 8 場，每場 5 分鐘
```

`agenda_en`：

```text
12:30 | Check-in | Pick up your badge
13:00 | Welcome
13:20 | Lightning Talks | 8 talks, 5 minutes each
```

**交通、參加方式與須知：中文每行 `名稱 | 內容 | 補充 | 網址`；英文每行 `Label | Value | Note`。** 補充和網址可省略；網址放中文欄，雙語共用。

```text
捷運 | 公館站 1 號出口 | 步行約 10 分鐘
無障礙 | 一樓設有坡道 | 需要協助請在報名時註明
會場地圖 | 查看路線 | | https://example.org/venue
```

例如英文欄可填：

```text
Metro | Gongguan Station, Exit 1 | About a 10-minute walk
Accessibility | Ramp on the ground floor | Request assistance when registering
Venue map | See directions
```

## 其他選填欄位

| 欄位 | 用途與預設 |
| --- | --- |
| `registration_platform` | 報名平台名稱；未填時網站從網址辨識平台。 |
| `registration_opens_at` | 報名開放時間；可產生報名提醒，時間到不會自行改為已開放。 |
| `registration_closes_at` | 報名截止時間。 |
| `registration_note_zh`, `registration_note_en` | 報名補充說明。 |
| `waitlist_url` | 額滿時的候補網址。 |
| `join_url` | 線上參加入口。 |
| `join_ready` | 已確認入口可用才填 `true`；預設 `false`。免報名活動可顯示進入活動按鈕。 |
| `availability_remaining` | 名額快照，非負整數；不可超過總名額。 |
| `availability_source` | 名額資料來源，如 KKTIX。 |
| `availability_updated_at` | 名額快照觀測時間。前三個 availability 欄位需一併提供。 |
| `availability_valid` | 快照是否有效，預設 `true`。只有 15 分鐘內的有效快照顯示剩餘數字；不含自動同步。一般填表者可把這四欄全部留白。 |
| `state` | `scheduled`（預設）、`cancelled`、`postponed`、`ended`。未手動指定已結束時，網站依結束時間判斷；無結束時間則保留至活動當天的台灣時間 23:59:59。 |
| `listed` | 預設 `true`；`false` 只從列表、RSS、行事曆、sitemap 與 llms 索引隱藏，詳情仍公開。要撤下整場活動請用 `publish=false`。 |
| `record_url` | 活動紀錄網址。 |
| `announcement_url` | 正式公告網址，供取消、延期等狀態參考。 |

所有網址欄位只接受 HTTP(S)。取消、延期、截止與額滿會優先於一般報名狀態；過期名額不會把已確認的狀態改回可報名。

## 本機檢查與 Agent 文件

```bash
npm run check:events
EVENTS_DEMO=0 npm run dev
# 或產生正式靜態檔
npm run generate
npm run preview
```

正式活動資料與 Agent 文件一起由同一批 CSV 資料產生：

- `/events/llms.txt`：活動索引、雙語入口、時區與資料解讀說明。
- `/events/events/<slug>/index.md`：中文完整活動內容。
- `/events/en/events/<slug>/index.md`：英文完整活動內容。

以上包含 GitHub Pages 的 `/events/` 前綴。HTML 也提供 `rel="describedby"` 和活動 Markdown 的 `rel="alternate"`，方便 Agents 發現。格式依據 [llms.txt 提案](https://llmstxt.org/)；這些檔案與頁面在同次部署更新，不是即時報名或名額 API。
