# CLAUDE.md: Sanket

Read this first. It tells you what this project is, the rules that must not break, and how to work on it.

## Name

The app is called **Sanket** (संकेत), which means "signal". Use the name in the UI, docs and code. The descriptor "National Health Resource Command" stays as the subtitle. Dispatch IDs start with `SK-`. The Cloud Run service is `sanket-api`. Do not reintroduce the old working name.

## What this is

Sanket warns a District Medical Officer (DMO) before a Primary Health Centre (PHC) in India runs out of a life-saving medicine, then recommends a safe clinic-to-clinic transfer for the DMO to approve. The demo uses anti-snake venom (ASV) in monsoon season. Built for Code for Communities 2.0, track: Resilience.

All clinic, stock, bed and doctor data is sample data. Say so wherever data appears. Never present it as real.

## Files to read

| File | Read it for |
|---|---|
| `PRD.md` | Problem, users, goals, scope, user stories |
| `DESIGN.md` | Design tokens, screens, decisions, design debt |
| `ENGINEERING.md` | Architecture, tool choices, API, tests, risks |
| `PLAN.md` | What to do next and what to cut |
| `PROGRESS.md` | What is done, checked and open |
| `API_CONTRACT.md` | Request and response shapes the web app uses |
| `ARCHITECTURE.md`, `README.md` | Google Cloud setup and run instructions |
| `design/Main.dc.html` | The approved dashboard prototype (its 6-step onboarding is superseded). Read-only reference for layout, copy, states and tokens. It is a Claude Design file with its own runtime, so it cannot be deployed. Port it, do not edit it |

## Commands

```bash
npm test          # 16 API tests, no API key needed
npm run test:web  # 17 web model tests, no API key needed
npm start         # API on http://localhost:8080 (needs GEMINI_API_KEY for live Gemini)
npm run dev:web   # web app on http://localhost:5173, /api proxied to the API on 8080
npm run build     # web app to dist/, served by Cloud Run
```

Browser checks (contrast, targets, keyboard, accessibility tree, design diff) are in `scripts/qa/`. See its README.

No dependencies to install for the API. The web app needs `npm install` at the repo root. Node 20 or newer.

## Rules that must not break

1. **Code decides, Gemini writes, a person approves.**
   - Vial counts, eligibility, donor limits, dispatch IDs and restock tokens come from `server/engine.js`, never from a model.
   - Gemini may only choose among donors that already passed every rule, and write a short reason.
   - The drug name, vial count and temperature in a waybill come from `config/languages.json` templates.
2. A donor must always keep at least 3 days of its own supply. Never weaken this rule.
3. Nothing is dispatched until a DMO approves. The API only recommends. Cross-district transfers need two approvals.
4. If Gemini fails or takes over 8 seconds, return the template fallback. Never show a raw error to the user.
5. The Gemini key lives only in Secret Manager and the server environment. Never put it in the browser or the repo.
6. Only `{ state, threshold, sampleCount }` may cross a state boundary. Reject anything else on `/api/federated`.
7. Local-language text stays marked "not yet reviewed" (`verified: false`) until a native speaker reviews it. A named reviewer goes in the file.
8. Do not invent numbers. Anything without a source carries an asterisk and the words "assumption, source needed".
9. Do not claim what is not built. Sample data, simulated federation and simulated sign-in must be labelled.

## Model

The primary model is `gemini-3.5-flash-lite`, set by `GEMINI_MODEL`. The fallback is `gemini-3.1-flash-lite`, set by `GEMINI_FALLBACK_MODEL`. Each gets 8 seconds, then the template waybill is used. `gemini-2.5-flash` is scheduled for retirement and limited for new keys, so do not use it. Confirm model IDs in Google AI Studio before changing them, because model names change.

## Product decisions already made

- Sanket is a **desktop web app**. The layout is fixed at 1440 px wide by decision. Do not build a responsive or mobile layout. Show a short note "Best viewed on a desktop browser, 1440 px or wider" and let smaller windows scroll sideways.
- The onboarding is **2 screens and an optional tour** (decision 30 Sep 2026), and it is the default entry. The old 6-step flow in `design/Main.dc.html` and the 3-screen version are superseded and must not be ported. (1) A splash: the logo, one line on what the app does, "Get started". (2) One setup screen: district (District A, current), role (District Medical Officer preselected, plus Facility in-charge and State programme officer), language with the real waybill and its "not yet reviewed by a native speaker" chip, and one safety acknowledgement, then "Open dashboard". The role is only a label in the header and changes nothing. The dashboard is not mounted until setup is done and no URL opens it, including `#dashboard`. Pressing the logo anywhere clears the setup flag (`localStorage` key `sanket-setup`) and returns to the splash. The 30-second tour is a "Take a 30-second tour" button on the dashboard. Sign-in is simulated and must be labelled. Onboarding uses Frontend Design plus UI/UX Pro Max. The design record is `DESIGN.md`, section 13.
- The visual design is locked. Port it faithfully first. Polish comes after it works.

## Frontend build

The web app lives in `web/` (Vite and React). `npm run build` writes to `dist/`, which Firebase Hosting serves. The API stays dependency-free. Frontend dependencies are dev dependencies at the repo root and are not copied into the Docker image.

Build in phases. Finish and check each phase before starting the next:

1. **Port.** Done. The approved dashboard is in `web/`, in both themes and every dashboard state. It must keep matching `design/Main.dc.html` (`npm run test:web` checks the model against the design file).
2. **Wire.** Done. `/api/dispatch` and `/api/warning-brief` feed the waybill, reasons, dispatch number and warning brief (see `API_CONTRACT.md`). The app shows the template and "Offline fallback used" if a call fails. On-screen numbers stay computed in the browser.
3. **Check.** Done for the current build: run against the API and with it stopped, in light and dark, `npm test` and `npm run test:web`. Repeat after every change.
4. **Deploy.** Follow the README.

## Working on the design

Follow `DESIGN.md`. In Claude Code, use this order:

1. Anthropic **Frontend Design** is always the base layer.
2. Use **Taste** as the one style driver on the dashboard with DESIGN_VARIANCE 3, MOTION_INTENSITY 2, VISUAL_DENSITY 6. The 2 onboarding screens use **UI/UX Pro Max** as their one style driver instead, and not Taste. Never use both drivers on the same screen.
3. Keep **Interface Design** on so the tokens persist. If a token changes, update `DESIGN.md`, section 3, first.
4. Do not use Emil Kowalski Design. This is an internal tool.
5. Do not use Designer Skills. That suite is for UX research.
6. For any new or redesigned screen: build one proof screen first, run **GStack** on it for an AI-slop and quality score, and get approval before building more.
7. Check every change in light and dark, and for contrast (4.5:1 text, 3:1 large text and graphics), touch targets (44 px) and reduced motion.

Semantic colours are fixed: green stable, amber early warning, red critical, teal action and transfer, violet no doctor on duty. Never reuse violet for anything else. Never use colour alone to show status.

## Working on the engine and API

- Change a rule in `server/engine.js` and add or update a test in `test/server.test.js` in the same change.
- Change a prompt in `prompts/` and its schema in `schemas/` together. The server checks the schema again after Gemini answers.
- Keep the server dependency-free unless there is a strong reason.
- Log with `{ severity, event, ... }` JSON lines so Cloud Logging can read them.

## Next tasks, in order

1. Deploy (Frontend phase 4). It needs a billing account and your approval, so it is yours to trigger. Follow the README.
2. Native-speaker review of Marathi, Hindi and Tamil (`docs/LANGUAGE_REVIEW.md`), then a real screen-reader pass (VoiceOver or NVDA).
3. After the submission: the National screen, and replacing the two assumption numbers ("0 hours today", "14 to 21 days") with sources or removing them.

## Style for docs and copy

Plain language. Short sentences. Say what was checked and what was not. No filler and no marketing words. Sentence case for labels.

## Keep these files current

After any change, update `PROGRESS.md`. If a decision changes, update the relevant doc and the decision table in `PLAN.md`.
