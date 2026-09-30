# PROGRESS.md: Sanket

Last updated: 30 Sep 2026. Update this file whenever something changes. Keep it short and true.

Legend: Done = built and checked. Checked = tested or rendered in the build environment only. Not done = not started. Blocked = needs you.

---

## Submission checklist

| Item | Status | Notes |
|---|---|---|
| Track: Resilience | Done | Stated in README |
| Public GitHub repo | Not done | Blocked on you. Code is ready in `sanket-repo.zip` |
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
| Onboarding, 6 steps | Checked | Works. To be redesigned in the morning |
| Dashboard: map, tiles, table, charts, action card, timeline, tabs | Checked | Rendered in every state, light and dark |
| Light and dark themes | Checked | Toggle works. Contrast scan: 0 failures |
| Accessibility review | Checked | Fixed 5 issues. 4 open (see `DESIGN.md`, section 9) |
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
| React app connected to the API | Not done | Notes in `docs/LOVABLE_BACKEND_SWAP.md` |

## Known issues and open questions

1. The exact submission cut-off time is unknown.
2. Marathi, Hindi and Tamil text is unreviewed (`verified: false`).
3. The two comparison numbers "0 hours today" and "14 to 21 days" have no source. They carry an asterisk.
4. `gemini-3.8-flash` appears in the key's model list but was not tested. `gemini-3.5-flash-lite` and `gemini-3.1-flash-lite` both answered live.
5. Whether Firebase Hosting forwards to `asia-south1` was not confirmed.
6. The prototype is a Design artifact with fixed desktop sizing. It is not the deployed React app.
7. Doctor names are sample names.
8. The name Sanket has not been checked as a trademark. Search it before printing it on the deck. Clinic names and coordinates are invented.

## Change log

| Date | Change |
|---|---|
| 30 Sep 2026 | Model fallback: tries `GEMINI_MODEL`, then `GEMINI_FALLBACK_MODEL`, then the template. Defaults changed to the lite models after `gemini-3.5-flash` returned 503. Dispatch reply and log show which model answered. 2 tests added. Key verified against the live API |
| 30 Sep 2026 | App renamed from PulseGrid to **Sanket** (संकेत, "signal") everywhere. Dispatch IDs now start with SK-. Cloud Run service is `sanket-api` |
| 30 Sep 2026 | Docs written: DESIGN, ENGINEERING, PLAN, PROGRESS, CLAUDE. Default model changed to `gemini-3.5-flash`. Accessibility review run and fixes applied |
| 30 Sep 2026 | Dashboard rebuilt action-first: tiles, table and charts views, timeline, vial icons, merged action card |
| 30 Sep 2026 | Six-step onboarding added. Language choice now sets the waybill language |
| 30 Sep 2026 | Cloud Run API, prompt configs, sample data, 14 tests, README and architecture overview written |
| 30 Sep 2026 | Repo checklist audit against the mandatory submission checklist |
