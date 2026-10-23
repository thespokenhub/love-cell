# Love Cell

Nelson's tracker for Love Cell: attendance, first-timers, care, helpers and the WhatsApp report. It's built from design 4a (Journey v3) in `../project/design_handoff_love_cell_tracker/`.

It's a React + Vite web app that can be added to a phone's home screen. Everything is saved on the device (`localStorage`, key `lovecell-data-v1`). There's no server.

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # the rules, checked against the real totals (17 / 25 / 28 / 15, 40 first-timers)
npm run build    # static files in dist/, host them anywhere
```

To try later dates on the same data, add `?today=2026-11-01` or `?today=2026-12-13` to the address.

## Layout
- `src/core/`: the rules, with no React (`rules.ts`), pure data updates (`actions.ts`), the seed roster (`seed.ts`) and the tests.
- `src/store.tsx`: the saved data, the screen state, the toast and tab changes.
- `src/derive.ts`: numbers shared by several screens (care progress, helper stats).
- `src/screens/`: Home, Attendance, Care, People, Stats and the person page.
- `src/sheets/`: Add someone new, Report, Make a helper, Assign and Shepherds' meeting.
