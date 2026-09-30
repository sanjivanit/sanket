# PROGRESS.md: Sanket

Last updated: 30 Sep 2026. Update this file whenever something changes. Keep it short and true.

Legend: Done = built and checked. Checked = tested or rendered in the build environment only. Not done = not started. Blocked = needs you.

---

## Submission checklist

| Item | Status | Notes |
|---|---|---|
| Track: Resilience | Done | Stated in README |
| Public GitHub repo | Not done | Repo is public. Push the doc fixes and `web/` when built |
| App logic, prompt configs, run instructions in the repo | Done | `server/`, `prompts/`, `schemas/`, `config/`, `README.md` |
| Architecture overview, Google Cloud plus Gemini | Done | `ARCHITECTURE.md` with a diagram |
| Pitch deck | Drafted | Text in `docs/PITCH_DECK.md`. Slides not built |
| Demo video | Not done | Script in `Sanket_Solution_v2.md` |
| Live deployed link | Not done | Blocked on billing and deploy |
| 2 to 3 line description | Done | In `docs/SUBMISSION_CHECKLIST.md` |

## Product

| Area | Status | Notes |
|---|---|---|
| PRD | Done | `PRD.md` |
| Design system and tokens | Done | `DESIGN.md` |
| Engineering doc | Done | `ENGINEERING.md`, tools checked 30 Sep 2026 |
| Onboarding, splash, 3-step setup and a tour | Checked | A splash, then setup in three steps on one fixed-size card (1: district and role; 2: language with a live waybill; 3: safety acknowledgement). The dashboard is not in the page until setup is done, and no URL opens it. The logo clears setup and returns to the splash. The 30-second tour is an optional button on the dashboard. The role is a header label only. Scans clean: 426 text nodes on onboarding, 19,056 on the dashboard. **Not yet reviewed by a person, GStack not run, checked with the API stopped.** Design record: `DESIGN.md`, section 13
| Dashboard: map, tiles, table, charts, action card, timeline, tabs | Checked | Ported to `web/` (Vite and React) on scripted data. Ported logic matches the design's own on 2,044 checks. Screenshots of 5 states and 9 views or tabs in both themes differ from the design by 0.2% of pixels or less, all accounted for |
| Light and dark themes | Checked | Toggle works. Contrast scan of the ported dashboard: 0 failures on 18,480 text nodes. Fixed "Mark delivered" (was 3.3:1 light, 2.3:1 dark) with new tokens |
| Accessibility review | Checked | Scripted scans (contrast, 44 px targets, keyboard, reduced motion, `inert`) and an accessibility-tree read of every screen, both themes. Fixed 3 issues from the tree read and 1 from the scan. **A real screen-reader run (VoiceOver or NVDA) is not done.** 4 older items open (see `DESIGN.md`, section 9) |
| National screen | Not done | Placeholder tab only |
| Anonymized export | Not done | Optional |
| Responsive layout | Not done | Desktop 1440 px only |

## Engineering

| Area | Status | Notes |
|---|---|---|
| Engine rules | Checked | 16 of 16 tests pass (14 original, 2 for model fallback) |
| Cloud Run API and routes | Checked | Tested with a stand-in for Gemini |
| Gemini client, prompts, schemas | Checked | One live dispatch (Marathi) on 30 Sep 2026 answered by `gemini-3.5-flash-lite` in 2.5 s, with back-translation. Other routes not run live |
| Fallback and guardrails | Checked | Covered by tests, including first model failing and both models failing |
| Models | Done | `GEMINI_MODEL=gemini-3.5-flash-lite`, then `GEMINI_FALLBACK_MODEL=gemini-3.1-flash-lite`, 8 s each, then template waybill. Dispatch reply has a `model` field. `gemini-3.5-flash` returned 503 "high demand" in a live test, so it is no longer the default |
| Firebase Hosting rewrite | Not done | Written in `firebase.json`, not deployed. Region support to be confirmed |
| Secret Manager and Cloud Run deploy | Not done | Commands in README |
| React app: dashboard port (phase 1) | Checked | `web/`, `npm run dev:web`, `npm run build` to `dist/`. Runs on scripted demo data |
| React app connected to the API (phase 2) | Checked | `/api/dispatch` and `/api/warning-brief` feed the waybill, reasons, dispatch number and warning brief. Tested live against Gemini and with the API stopped (template plus "Offline fallback used", no errors). 17 tests in `npm run test:web` |
| Firebase Hosting deploy of `dist/` | Not done | Needs a billing account and your approval. `npm run build` works and `firebase.json` already points at `dist/` |

## Known issues and open questions

1. The exact submission cut-off time is unknown.
2. Marathi, Hindi and Tamil text is unreviewed (`verified: false`). Nobody has reviewed it, and no reviewer name is recorded. The review pack is `docs/LANGUAGE_REVIEW.md`.
3. The two comparison numbers "0 hours today" and "14 to 21 days" have no source. They carry an asterisk.
4. `gemini-3.8-flash` appears in the key's model list but was not tested. `gemini-3.5-flash-lite` and `gemini-3.1-flash-lite` both answered live.
5. Whether Firebase Hosting forwards to `asia-south1` was not confirmed.
6. The Design prototype is a reference only. The React port in `web/` is the app. It is not deployed.
11. Google returned HTTP 429 (rate limit) on both Gemini models after heavy testing on 30 Sep 2026. The app handled it as designed (template plus "Offline fallback used"). Expect it under a busy demo on a free-tier key, and check the quota before recording the demo video.
12. The warning-brief prompt let Gemini call a Day 1 early warning "Critical". Fixed with two rules in `prompts/warning_brief.system.md`, checked on days 1 to 3. Not covered by a test, because the tests use a stand-in for Gemini.
13. If Gemini picks a donor other than Shivpuri, the action card and waybill show it but the map still highlights Shivpuri, and the card says so. Gemini picked Shivpuri in every live run.
9. The State and Scenario selects in the header are disabled: the demo has one state and one scenario. The National tab is a placeholder.
10. The design's Snowflake icon was replaced by a Phosphor icon, and `—` and `→` in copy by `-` and "to", following the Taste rules.
7. Doctor names are sample names.
8. The name Sanket has not been checked as a trademark. Search it before printing it on the deck. Clinic names and coordinates are invented.

## Change log

| Date | Change |
|---|---|
| 30 Sep 2026 | Setup split again into three steps (district and role, language with the waybill preview, safety), with one card size on all three. Earlier the same day: setup split into two steps after the single setup card proved too heavy: step 1 district, role and language with the waybill preview, step 2 the safety acknowledgement. Splash unchanged. QA scripts updated |
| 30 Sep 2026 | Onboarding simplified from 3 screens to a splash and one setup screen. Role added as a header label. Guided run removed from setup and offered as "Take a 30-second tour" on the dashboard. Dashboard is unreachable until setup is done, including via `#dashboard`. Logo clears setup. QA scripts in `scripts/qa/` updated for the new flow (dashboard scripts now seed the `sanket-setup` key). API, data and engine untouched |
| 30 Sep 2026 | Onboarding approved and made the default entry. Guided run now has a spotlight. Frontend phase 2: the app calls `/api/dispatch` and `/api/warning-brief`, with an offline fallback. Warning-brief prompt tightened. `npm run test:web` added (17 tests). `docs/LANGUAGE_REVIEW.md` added. Accessibility-tree pass done. Not committed |
| 30 Sep 2026 | Frontend phase 1: dashboard ported to `web/`. Onboarding redesigned to 3 screens as a proof (district and role on one screen, language with a live waybill, safety acknowledgement and a skippable 30-second run). New tokens `--ok-btn` and `--ok-btn-on`. Docs updated to say onboarding is being redesigned. Not committed, awaiting approval of the proof |
| 30 Sep 2026 | Model fallback: tries `GEMINI_MODEL`, then `GEMINI_FALLBACK_MODEL`, then the template. Defaults changed to the lite models after `gemini-3.5-flash` returned 503. Dispatch reply and log show which model answered. 2 tests added. Key verified against the live API |
| 30 Sep 2026 | App renamed from PulseGrid to **Sanket** (संकेत, "signal") everywhere. Dispatch IDs now start with SK-. Cloud Run service is `sanket-api` |
| 30 Sep 2026 | Docs written: DESIGN, ENGINEERING, PLAN, PROGRESS, CLAUDE. Default model changed to `gemini-3.5-flash`. Accessibility review run and fixes applied |
| 30 Sep 2026 | Dashboard rebuilt action-first: tiles, table and charts views, timeline, vial icons, merged action card |
| 30 Sep 2026 | Six-step onboarding added. Language choice now sets the waybill language |
| 30 Sep 2026 | Cloud Run API, prompt configs, sample data, 14 tests, README and architecture overview written |
| 30 Sep 2026 | Repo checklist audit against the mandatory submission checklist |
