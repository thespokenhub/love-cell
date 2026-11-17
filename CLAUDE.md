# Love Cell

A personal phone app for Nelson Ansah, Cell Shepherd of Love Cell (part of Oasis Bacenta). It tracks attendance at two services a week (LC Live on Wednesdays, MGS on Sundays), first-timers through their first 8 weeks, weekly care, helpers and shepherds' meetings, and writes the WhatsApp attendance report.

Most changes come from Nelson's feedback, sent from the app as a GitHub issue. Read the issue as a request from the person who uses the app every week. He isn't a developer.

## Code
- `app/`: React + Vite + TypeScript, deployed on Vercel (the Vercel project's Root Directory is `app`). Data is saved only on the phone (`localStorage`). There's no server.
- `app/src/core/`: the rules, with no React. `rules.ts` holds statuses, flags, the next service and the report; `actions.ts` holds pure data updates; `seed.ts` holds the 47 people and 4 real services.
- `app/src/screens/`, `app/src/sheets/`: the UI. Shared bits are in `ui.tsx`, colours in `theme.ts`, numbers used on several screens in `derive.ts`.
- `project/`: the original designs from Claude Design. `project/design_handoff_love_cell_tracker/README.md` has the full spec: rules, tokens and every screen. Match its look (Geist / Geist Mono, the token colours, 16px page sides, cards with a 20px radius).

## Rules that must not change unless asked
- First visit = the first service someone was marked present. First 8 weeks = 56 days from it.
- After 8 weeks: 75%+ = Coming regularly, 40–74% = On and off, under 40% = Needs a follow-up.
- Not seen for 21+ days = flagged (never Nelson).
- First-timers per week counts people, not visits.
- Attendance list (both services): `*OASIS BACENTA ATTENDANCE*`, `🔥 *MGS* - DD/MM/YYYY` or `💻 *LC LIVE* - DD/MM/YYYY`, `*SS - Fred Adzah*` and `CS - Nelson Ansah` if present, then a numbered list of full names: Ella first, then Nelson's people, then Ella's people. Optional `*ABSENT (n)*` list after it.
- MGS also has the Mega Gathering Service report (`mgsReportText`): shepherds = leaders present, first timers = first-timers whose first visit was that service, members = everyone else present; pastors, teens, MC and busing are typed in and saved on the service.
- Use full names for people from now on.
- Seed totals (unit-tested): M11 = 17, L14 = 25, M18 = 28, L21 = 15; 40 first-timers.
- Real data lives only on Nelson's phone. To change saved records (names, past attendance), add an update to `app/src/core/updates.ts`; never rely on the seed. Never remove or reorder existing updates.

## Writing
Plain words everywhere, written for Nelson. No jargon, no settings screens. Buttons say what they do.

## Before you finish
Run from the repository root:
- `npm --prefix app test`
- `npm --prefix app run build`

Both must pass. Saved data must keep loading: if you change the saved shape (`Data` in `app/src/core/types.ts`), make old data still work.
