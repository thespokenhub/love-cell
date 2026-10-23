# Handoff: Love Cell Tracker (Journey v3)

## Overview
A personal mobile app for **Nelson Ansah**, Cell Shepherd of **Love Cell** (part of Oasis Bacenta). It tracks only his cell's growth. The church already has a general tracker, so this one is private and simple. It covers:
- Attendance at two services a week: **LC Live** (cell meeting, Wednesdays) and **MGS** (Sunday service)
- First-timers through their first 8 weeks
- Weekly care actions (praying, audio messages, praying with them, Bible plan)
- **Helpers**: old members who are becoming leaders and get assigned new people
- **Shepherds' meetings** attendance
- People who stop coming
- A WhatsApp-ready attendance report

Plain words everywhere. No jargon, no settings screens.

## About the Design Files
The files in this bundle are **design references built in HTML**. They're working prototypes that show the intended look and behaviour, not production code to copy directly. The task is to **recreate them in the target codebase's environment** using its usual patterns. If there's no codebase yet, a good fit is **React Native (Expo)** or a **PWA (React + Vite)** with local storage first (SQLite or IndexedDB). There's one user and no backend is needed at first, but sync or backup should be easy to add later.

`lovecell-core.js` holds **all the business rules and seed data** as plain JS. Port this logic first, and test it against the expected totals below.

## Fidelity
**High-fidelity.** Final colours, type, spacing, copy and interactions. Recreate it pixel-perfect at a 402×874 phone viewport (iPhone 15/16 Pro size). The phone frame (`ios-frame.jsx`) is presentation only. Don't build it.

---

## People & roles
| Person | Role | Notes |
|---|---|---|
| Fred Adzah | Senior Shepherd (SS) | Oversees Nelson. Attendance is tracked, but he is **not a member**. |
| Nelson Ansah | Cell Shepherd (CS) | The user. Never flagged. |
| Emmanuella Lithur ("Ella") | Shepherd | Helps Nelson and has her own people. Shown as "Emmanuella Lithur (Ella)". |
| Members | – | Each one has `owner: 'Nelson' \| 'Ella'` and `kind: 'first' \| 'old'`. Old members are people from earlier this year who came back. |

Optional flags on a member: `helper: true` (old members only), `helperId` (the helper looking after them), `left: 'YYYY-MM-DD'` (stopped coming).

## Business rules (must match exactly)
- **First visit** = date of the first service where the person is marked present.
- **First 2 months** = 56 days (8 weeks) from the first visit. The window is `[firstVisit, firstVisit + 56d)`.
- **Services held in the window** = recorded services whose date falls in the window. Show "X of Y", for example "3 of 4".
- **Status (first-timers):**
  - Inside the window: `New · week N of 8`, where `N = min(8, floor(daysSince(firstVisit)/7) + 1)`
  - After the window: attended/held ≥ 75% → **Coming regularly**, 40–74% → **On and off**, under 40% → **Needs a follow-up**
  - No visits at all: **Not seen yet**
- **Old members** show **Old member**. **Leaders** show their role.
- **Stopped coming** (`left` set): the status is **Stopped coming**. They're hidden from attendance lists, care lists and the 3-week flag, and are listed under the "Stopped coming" filter.
- **Flag:** anyone (except Nelson) not seen for **21+ days** gets a "3+ weeks" badge.
- **First-timers per week** counts **people, not visits**. Group by the week (Sunday to Saturday) of their first visit.
- **Effective today** = max(real today, latest recorded service date).
- **Next service:** the next Sunday (MGS) or Wednesday (LC Live) after the latest recorded service.
- **Pray with them** opens 45 days (1½ months) after the first visit for first-timers. Old members can start straight away.
- **"Came back"** = first-timers with 2 or more visits.

## Seed data
Four services: M11 = MGS Sun 11/10/26, L14 = LC Live Wed 14/10/26, M18 = MGS Sun 18/10/26, L21 = LC Live Wed 21/10/26. The full roster with the services each person attended is in `SEED` in `lovecell-core.js` (47 people). Anyone not marked present at a service is absent. **Vickybel belongs to Ella.**

**Expected totals (use as unit tests):** M11 = 17 present, L14 = 25, M18 = 28, L21 = 15. First-timers = **40**: Nelson's 26, Ella's 14. Came back = 17. Weekly first-timers: week of 11 Oct = 26, week of 18 Oct = 14.

## Report format (Generate report)
```
*OASIS BACENTA ATTENDANCE*
LC LIVE - 21/10/26
*SS - Fred Adzah
*CS - Nelson Ansah
*S - Emmanuella Lithur
- Josephine
- Benedicta
...
- Audrey (from Ella)
```
- The header line is `LC LIVE` or `MGS`, followed by `DD/MM/YY`.
- The SS, CS and S lines appear only if that leader was present.
- Nelson's people come first, in roster order, then Ella's people with " (from Ella)" after each name.
- The sheet has **Copy** (clipboard) and **Send on WhatsApp** (`https://wa.me/?text=<encoded>`).

---

## Screens / Views
The layout is a 402×874 screen: a 54px status-bar spacer, a scrolling content area (16px side padding, 12px gap between cards), an optional bottom action bar, and the tab bar. The fonts are **Geist** (UI) and **Geist Mono** (labels, small numbers and dates), from Google Fonts. All numbers use `font-variant-numeric: tabular-nums`.

**Card style:** `#FFFFFF` background, `1px solid #E6E4DE` border, 20px radius (18px for list cards), 16px padding. Row dividers inside a card are `1px solid #EFEDE8`.

**Eyebrow labels:** Geist Mono 11px/600, letter-spacing .08em, `#66655F`, uppercase. **Page titles:** Geist 28px/600, letter-spacing −0.03em.

### Tab bar (5 tabs)
Home · Attendance · Care · People · Stats. `#FFFFFF` background, top border `#E6E4DE`, padding `0 8px 28px`. Each tab has a 2px top indicator (`#FF5B1F` when active, otherwise transparent) and a label in Geist 13px/600 (`#111111` active, `#8A887F` inactive). Switching tabs scrolls the content back to the top and closes the person page.

### 1. Home
1. **Header:** eyebrow "LOVE CELL · Fri 23 Oct" and title "Hi, Nelson". On the right, a 48px black circle **+** (white glyph 28px), which opens the **Add someone new** sheet.
2. **Next service card:** `#111111` background, 22px radius, 12px padding.
   - Left: a white date tile (54×58, radius 14) with the day in Mono 10px and the date in 22px/600.
   - Middle: "NEXT · In 2 days" (Mono 10px `#B8B6AE`), then the service name in 17px/600.
   - Right: an **Attendance** button (`#FF5B1F` background, `#111` text, 44px tall, radius 12), which opens Attendance on that service.
3. **KPI strip:** one card split into 3 columns by 1px dividers.
   - **First-timers:** 30px/600, sub "+N this week" in Mono 11 `#16663A`.
   - **Came back:** sub "43% of them".
   - **Not seen 3+ wks:** sub "see who →", opens People filtered to the flagged list.
4. **First-timers chart card:**
   - Title "First-timers", sub "People counted once, at their first visit".
   - A segmented control (`#ECEAE4` track, white active pill with a shadow) switches **By week / By service**.
   - Stacked bars: Ella `#2D5BFF` on top, Nelson `#FF5B1F` below, radius 8, 2px gap, max height 120px, max bar width 70px, total shown above each bar. Up to 6 bars.
   - Labels under each bar ("Week of" / "This week" or the service name, then the date in Mono). Legend: "Nelson's · 26", "Ella's · 14".
5. **This week's care:** title plus the week range in Mono. Four rows (task label, "x/44 done", a 6px progress bar in `#FF5B1F` on `#ECEAE4`, and a hint). Tapping a row opens the Care tab on that task.
6. **Last service:**
   - Name and date, with a black **Report** pill.
   - Count in 40px, then a change versus the previous service of the same type (green `#16663A` when up, red `#B42318` when down).
   - A split bar (leaders `#111`, Nelson's `#FF5B1F`, Ella's `#2D5BFF`) with a legend.
7. **New people:** the first 5 people still in their 8 weeks, oldest first.
   - Each row: a 32px owner-tinted initial tile, the name, "Week 2 of 8 · came 3 of 4", and on the right a dot (12px circle) for each service since their first visit. Filled in the owner colour means present; a 1.5px `#CFCCC4` ring means absent.
   - "All 40 →" link (`#C2410C`).
8. **Nelson's / Ella's cards:** 2 columns. People count, then "N new · N at last".
9. A small underlined link: "Start again from the 4 real services" (demo reset; can be dropped in production).

### 2. Attendance
- Header: eyebrow, service name (28px), long date (plus " · not taken yet" for an upcoming service), and on the right "**17**/47".
- **Service chips** (scroll sideways, newest first; the next service is shown as "Next · MGS" with a dashed border). The selected chip is `#111` with white text.
- Filter control: Everyone / Nelson's / Ella's (`#ECEAE4` track, active `#111` with white text), plus a "Find" search box.
- A dashed button, "+ Someone new? Add and mark them here", opens the Add sheet with this service already chosen.
- Group cards: Leaders, Nelson's people, Ella's people, each with "x of y here". Each row is name + status, a "Here" / "Not here" label in Mono 11, and an iOS-style switch (46×28; track is the owner colour when on, `#E2DFD8` when off; 22px white knob). **Tapping anywhere on the row toggles it.**
- The bottom action bar shows "17 here" and "3 leaders · 6 Nelson's · 6 Ella's", with a black **Generate report** button (46px tall, radius 12) that opens the Report sheet.
- Marking someone at an unrecorded service creates that service, and Attendance stays on it.

### 3. Care ("Helping them grow")
- Header: eyebrow "CARE", title, and "This week · 18 Oct – 24 Oct · tick what you've done".
- 2×2 task cards: Pray for / Audio / Pray with / Bible plan. Each shows "x/44 done" in 24px and a progress bar. The selected card is `#111` with white text.
- Below is a list card: the task label, a hint, a note (for example "4 ready now · more from 25 Nov"), and a Both / Nelson's / Ella's filter. Each row has an owner-tinted initial, the name and status (tap opens the person), and a 34px tick box (`#FF5B1F` with ✓ when done). For "Pray with", people who aren't ready yet are greyed out with "Ready from Wed 25 Nov" and can't be ticked.
- **Weekly tasks** (pray, audio, pray with) are stored per week (key = the Sunday the week starts). **Bible plan** is a single on/off per person ("reading").

### 4. People
- Header, then a **view switch: Everyone / Helpers · N**.
- **Everyone view:**
  - The Both / Nelson's / Ella's filter plus "Find".
  - Filter chips that scroll sideways: Everyone, Not seen 3+ weeks, New, Coming regularly, On and off, Needs a follow-up, Not seen yet, Old members, Leaders, Stopped coming. A chip with a count of 0 is hidden unless it's the active one.
  - A table card with the header row "NAME · STATUS | CAME | SEEN" in Mono 10. Each row: an 8px owner-colour square, the name, an optional "3+ weeks" badge (red) and "Helper" badge (black), a status pill, "3/4" in Mono, and the last-seen date.
- **Helpers view:**
  - An intro line, then the **Shepherds' meetings** card: a list of meetings with "x of N came →", and a black "+ New" button that opens the Meeting sheet. The people counted are Ella plus all helpers.
  - One card per helper: initial, name, "Looking after N people", an **Assign** button, three stats (Services = attended out of the last 4; Meetings = attended out of all; Their people last time = how many of their people were at the last service), and initials of the people they look after.
  - A dashed button, "+ Make an old member a helper", opens the Pick sheet.

### 5. Stats ("At a glance")
- 2×2 KPI cards: Average per service, Biggest service, MGS average, LC Live average.
- **People at each service:** stacked bars (Ella blue, Nelson orange, leaders black, radius 6, max height 100px). Tapping a bar opens Attendance on that service.
- **Did first-timers come back?** Horizontal bars for "Came once" (`#CFCCC4`), "Came 2 times", "Came 3 times" and "Came 4+ times" (`#FF5B1F`), with counts.
- **After their first 8 weeks:** until anyone finishes, shows "Nobody has finished their 8 weeks yet. The first group finishes on Sun 6 Dec." After that, it lists Coming regularly, On and off and Needs a follow-up with counts.
- **Care this week:** 4 progress rows.
- **Not seen for 3+ weeks:** count and names. **Stopped coming:** count and names.
- **Helpers / Shepherds' meetings:** the two counts.

### 6. Person page (full screen, over everything)
- A "← Back" pill, the name in 28px, an owner tag and a status pill.
- **Attendance card:** "3 of 4" in 36px, "services since first visit", an 8-segment week bar (W1–W8, filled in `#FF5B1F` up to the current week) and "Week 2 of 8 · ends Sat 5 Dec". FIRST VISIT and LAST SEEN in two columns.
- If they've stopped coming: a grey banner, "Stopped coming with us · Marked on …", with a **They're back** button.
- If they're a helper: a black card with "HELPER · Looking after N people", an orange **Assign people** button, 3 stats, their people (tap to open), and the link "No longer a helper".
- Otherwise, **Looked after by:** chips for "Nobody" plus each helper. If there are no helpers yet, a hint explains how to make one.
- For an old member who isn't a helper: a black button, "Make {name} a helper".
- **Care this week:** 4 rows with tick boxes. Weekly rows also show how many weeks have been done so far.
- **Attendance history:** a vertical timeline. Each service has a 12px dot (owner colour if present, `#ECEAE4` if not) and a 2px line. Service type and date on the left; "Here" (green `#16663A`) or "Not here" on the right; "First visit" in Mono 10 `#C2410C` on their first one.
- **Fix a mistake:** two controls, Nelson's people / Ella's people and First-timer / Old member.
- At the bottom, a red-text outline button: **They won't be coming anymore**.

### Sheets (slide up from the bottom)
All sheets have a white background, top radius 24, padding `10px 16px 34px`, a 40×5 `#D8D5CD` grab handle, and a `rgba(17,17,17,.45)` backdrop. Tapping the backdrop closes the sheet.
- **Add someone new**
  - A name field (52px tall, `#F5F5F2` background).
  - "MARK THEM AS HERE AT" chips: the last 3 services, the next one, and "Not yet / Hasn't come". The default is the latest service if it was within the last 3 days, otherwise the next one.
  - A tick box: "Old member coming back (not a first-timer)".
  - Two 54px buttons, **Nelson's person** (`#FF5B1F`) and **Ella's person** (`#2D5BFF`, white text). These stay grey (`#E2DFD8`) until a name is typed. **Tapping one adds the person and closes the sheet** (one step), then a toast confirms it.
- **Report:** title, service and date, "N here" badge, the report text in Mono 13 on `#F5F5F2`, then Copy ("Copied ✓" for 1.8s) and Send on WhatsApp.
- **Make a helper:** a list of old members who aren't helpers yet. Tapping one makes them a helper.
- **Assign:** "Who is {name} looking after?" with an "N picked" badge. A list of active members (first-timers first) with tick boxes. Someone assigned to another helper shows "With X · tap to move". **Done** closes it.
- **Shepherds' meeting:** a date with ‹ › buttons to move it a day either way, "N of M came", rows with switches (Ella plus all helpers), **Done**, and the link "Remove this meeting".

### Toast
Black (`#111`) with white text, radius 12, padding `13px 16px`, 160px from the bottom, centred, auto-hides after 2.6s.

---

## State
Persisted data (one document, saved locally after every change):
```ts
type Person = { id; name; owner: 'Nelson'|'Ella'|null; kind: 'leader'|'first'|'old'; role?;
                helper?: boolean; helperId?: string|null; left?: string|null };
type Service = { id; type: 'MGS'|'LC'; date: 'YYYY-MM-DD' };
type Data = {
  people: Person[]; services: Service[];
  att: Record<serviceId, personId[]>;                 // present list
  care?: { pray?: Record<weekStart, personId[]>; audio?: Record<weekStart, personId[]>;
           prayWith?: Record<weekStart, personId[]>; plan?: personId[] };
  meetings?: { id; date; present: personId[] }[];
};
```
Screen state: `tab`, `svcId` (the selected service in Attendance), `mf` and `q` (Attendance filter and search), `pf`, `po` and `pq` (People filter, owner and search), `pv` ('people' or 'helpers'), `careTask`, `co`, `ftMode` ('week' or 'service'), `personId`, `reportId`, `sheet` ('assign', 'pick', 'meeting' or none), `assignFor`, `meetingId`, `addOpen`, `addName`, `addSvc`, `addOld`, `toast`, `copied`.

Everything shown (statuses, counts, charts) is calculated from `Data` plus "today". The calculations are `compute()`, `vals()` and `vals2()` in `lovecell-core.js`.

## Design tokens
- **Ink** `#111111` · **Muted** `#66655F` · **Faint text** `#8A887F` · **Canvas** `#F5F5F2` · **Card** `#FFFFFF`
- **Borders and lines:** `#E6E4DE`, row divider `#EFEDE8`, dashed `#CFCCC4`/`#D8D5CD`
- **Tracks:** segmented and progress `#ECEAE4`, switch off `#E2DFD8`
- **Accent / Nelson:** `#FF5B1F` (text on it `#111`); tint `#FFE6DA`, text on tint `#A33208`; link `#C2410C`
- **Ella:** `#2D5BFF` (text on it `#FFF`); tint `#E0E7FF`, text on tint `#1E3FB8`
- **Dark card:** `#111111`, inner tiles `#1E1E1C`, divider `#2A2A27`, secondary text `#B8B6AE`
- **Status pills** (background / text):

  | Status | Background | Text |
  |---|---|---|
  | New | `#F0EFEA` | `#3A3934` |
  | Coming regularly | `#DDF3E4` | `#16663A` |
  | On and off | `#FFF0C9` | `#7A5300` |
  | Needs a follow-up | `#FFE0D9` | `#B42318` |
  | Old member | `#EEE6FA` | `#5B3A9E` |
  | Leader | `#111111` | `#FFFFFF` |
  | Stopped coming | `#ECEAE4` | `#66655F` |

- **Chart colours:** Nelson `#FF5B1F`, Ella `#2D5BFF`, leaders `#111111`; regular `#16A34A`, on and off `#F5B83D`, follow-up `#E5484D`
- **Up / down:** `#16663A` / `#B42318`
- **Radius:** cards 18–22; buttons 12–14; chips and tiles 8–12; pills 5–6 (status pills 999); FAB circle
- **Spacing:** 16px page sides, 12px between cards, 14–16px inside cards, 4/6/8/10px small gaps
- **Type:**
  - Page title: Geist 28/600, −0.03em
  - Big numbers: 30–40/600, −0.03 to −0.04em
  - Card titles: 16/600
  - Body: 14–15/500
  - Secondary: 12–13 `#66655F`
  - Labels: Geist Mono 10–11, uppercase eyebrows with .06–.08em tracking

## Assets
No images or icons. The glyphs used are + ‹ › ← → ✓, all typed characters. Fonts are Geist and Geist Mono from Google Fonts.

## Files
- `LoveCell Journey v3.dc.html`: the prototype template, with all screens and sheets as inline-styled markup. Open it in a browser next to the other files.
- `lovecell-core.js`: **the source of truth for the rules**. Contains the seed roster, `compute()` (statuses and flags), `nextSlot()`, `reportText()`, the actions (toggle attendance, add a person, care ticks, meetings, helpers) and the view-model builders `vals()` and `vals2()`.
- `ios-frame.jsx`: the phone frame for presentation only.
- `support.js`: the prototype runtime. Not needed in production.
