# QA scripts

Browser checks used to verify the web app on 30 Sep 2026. They are not part of `npm test` and need a browser, so they are kept here to re-run by hand after a change.

## Set up (once per checkout)

The scripts need three packages that are deliberately not in `package.json`, so the Docker build and the lockfile stay small.

```bash
npm i --no-save playwright-core pngjs pixelmatch   # a later npm install or npm ci removes them again
npx playwright-core install chromium               # skip if a Playwright Chromium is already on the machine
npm run dev:web -- --port 5199 --strictPort        # the scripts expect the web app on http://localhost:5199
```

For the live checks also start the API in another terminal (`npm start`, with `GEMINI_API_KEY` in `.env`). Never print `.env` or the key.

The dashboard scripts skip setup by seeding `localStorage` key `sanket-setup` (`{"district":"A","role":"dmo","lang":"mr"}`; the app only checks role and language), because `#dashboard` no longer opens the dashboard.

Screenshots and diffs go to `$QA_OUT` (default: a `sanket-qa` folder in the system temp directory).

## Scripts

| Script | What it checks | Needs |
|---|---|---|
| `scan-dashboard.mjs` | Text contrast (4.5:1, 3:1 for large text), 44 px touch targets and horizontal overflow, across 5 states, 3 views, 4 tabs and both themes | web app |
| `scan-onboarding.mjs` | Same scan on the splash, the three setup steps (step 2 in all 4 languages) and the tour, plus: `#dashboard` does not open the dashboard and no dashboard is in the page before setup, title focus on each screen, the setup card is the same size on all 3 steps, fits a 900 px window and no step's content overflows it, visible focus ring, Open dashboard disabled until acknowledged, role label in the header, dashboard `inert` during the tour, no animation under reduced motion | web app |
| `aria-tree.mjs` | Prints the accessibility tree (roles and names) of the splash, the three setup steps and the dashboard. Read it for missing names, headings and states | web app |
| `live-check.mjs live` or `offline` | Dashboard against the real API, or with the API stopped: source label, reasons, waybill chips, log lines, warning brief, dispatch number | web app, and the API for `live` |
| `build-ref.mjs` | Builds `ref.html`, which renders `design/Main.dc.html` for any state, so the port can be compared with the design | none |
| `shoot-states.mjs`, `shoot-views.mjs` | Screenshots the design reference and the app for 5 states and 9 views or tabs in both themes | web app, `ref.html` |
| `diff-states.mjs`, `diff-hotspots.mjs` | Pixel diff of app against design, and where the differences cluster | screenshots |
| `shoot-mayurbhanj.mjs` | Screenshots of the Mayurbhanj build in one theme: Odia setup, dashboard calm and day 4, waybill, table, charts, approved, telemetry slide-over, a rejected CSV, an accepted CSV, and the label after each. Prints the telemetry JSON | web app |
| `shoot-onboarding.mjs` | Screenshots of the splash, the three setup steps, the dashboard and moments of the tour, in one theme (`light` or `dark`) | web app |
| `crop.mjs`, `strip.mjs` | Helpers: crop matching regions, or stack screenshots into one image | screenshots |

Expect about 0.2% of pixels to differ in the calm state and about 1.1% in the others. From day 1 on, the action card shows a source label ("Asking Gemini", "Written by Gemini" or "Offline fallback used") that the design file does not have. With the API stopped the dev proxy also logs `502 Bad Gateway` in the console, which the app is built to handle. Anything much higher than that is worth a look.

The design comparison has other known, deliberate differences: the State and Scenario selects are disabled, the footer has an extra line, the header has a role label, the Snowflake icon is Phosphor, and `-` and "to" replace the design's em dash and arrow.

## Not covered

A real screen reader (VoiceOver, NVDA) has not been run. `aria-tree.mjs` shows what one is given, and is not a substitute.
