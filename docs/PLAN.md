# PLAN.md: Sanket

Written 30 Sep 2026. The guide's prototype submission phase ends on 30 Sep 2026. The exact cut-off time is not known. Check the portal first.

---

## 1. Definition of done for the submission

All of these must be true before you submit:

- [ ] Public GitHub repository with the app, the API, the prompt configs and run instructions
- [ ] A live link that opens with no login and works end to end
- [ ] An architecture overview showing Google Cloud with Gemini
- [ ] A pitch deck of 10 to 12 slides that explains how it helps real communities
- [ ] A demo video of 3 to 5 minutes
- [ ] A 2 to 3 line description
- [ ] Track named: Resilience

## 2. Today, in order

Each step lists who does it. "You" means only you can (accounts, billing, recording). "Me" means I can do it in this chat.

| # | Step | Who | Time | Done when |
|---|---|---|---|---|
| 0 | Find the exact cut-off time on the portal | You | 2 min | You know the deadline |
| 1 | Push this repo to GitHub (it is public). The web app goes in `web/` | You | 15 min | Link opens for anyone |
| 2 | Confirm billing or credits on the Google Cloud project | You | 10 min | Cloud Run and Secret Manager can be enabled |
| 3 | Confirm the Gemini model ID in Google AI Studio and create the API key | You | 5 min | Key works |
| 4 | Deploy: Secret Manager, Cloud Run, then Firebase Hosting (README) | You, with my help on errors | 30 to 60 min | `/api/health` returns ok on the live link |
| 5 | Run the live-link test (section 3) | You | 10 min | Every step passes, or failures are noted |
| 6 | Record the video (script in `Sanket_Solution_v2.md`, section 6) | You | 30 min | 3 to 5 minutes, recorded on the live link |
| 7 | Build the deck from `docs/PITCH_DECK.md`, paste the architecture diagram, export as PDF | You, with my help on text | 45 min | 10 to 12 slides |
| 8 | Fill the submission form and submit | You | 10 min | Confirmation received |

Critical path: 0, 1, 2, 3, 4, 5, then 6 and 7 in parallel, then 8. Submit as early as you can. Improve afterwards only if the form allows edits.

## 3. Live-link test

1. Open the live link. Onboarding appears. Go through all six steps.
2. On the dashboard, press Advance day four times. The early warning appears on day 1, then critical on day 4.
3. Press Approve. Vials move on the map. Press Mark delivered. Rampur recovers to 2.0 days.
4. Switch Tiles, Table and Charts. Open the Waybill tab in Marathi, Hindi and Tamil.
5. Switch Light and Dark.
6. Call `/api/health`. Confirm the model name and that the key is set.
7. Break the Gemini key on purpose. Confirm the fallback waybill still appears and nothing shows a raw error.
8. Tab through with the keyboard. Confirm focus is visible.

## 4. If time runs short

Submit with what exists. Cut in this order, last cut first kept:

1. Message check-in (already optional).
2. Deck polish. Ten plain slides are enough.
3. Native-speaker review. Keep the "not yet reviewed" chip.
4. Federated card on the dashboard.

Never cut: the live link, the repo, the architecture overview, the video.

If you cannot deploy to Google Cloud in time: submit the repo, the prototype link, the architecture document and the video, and say plainly in the description that the Cloud Run deployment is documented and tested locally but not deployed. Do not claim a live deployment you do not have.

## 5. After submission

| When | What | Notes |
|---|---|---|
| 1 to 15 Oct | Prototype evaluation phase | Keep the live link up. Do not break it |
| Morning after submission | Redesign onboarding so it feels seamless and memorable | Brief in `DESIGN.md`, section 10. Use Taste, Interface Design and GStack in Claude Code |
| Same week | Native-speaker review of Marathi, Hindi and Tamil, then set `verified: true` in `config/languages.json` | A named reviewer goes in the file |
| Same week | Build the National screen | One table with state, district and clinic rollups, same look, theme toggle |
| Same week | Replace the two assumption numbers with sources or remove them | "0 hours today" and "14 to 21 days" |
| 16 Oct | Top 20 announced | |
| By 23 Oct | Prepare the virtual demo day | Two-minute pitch, live demo, a fallback recording |

## 6. Roadmap beyond the hackathon

1. A two-week manual pilot with one DMO office and 8 to 12 clinics. Measure warning lead time, time to approval, and transfers that kept the donor at 3 days or more.
2. Real data: a stock feed from a state inventory system, or clinic messages through WhatsApp.
3. Firestore for live state and an audit log, one node per state.
4. A trained forecast in BigQuery ML.
5. Multi-donor splits and referral of overflow patients.
6. Pilot first in the eight highest-burden states for snakebite (Bihar, Jharkhand, Madhya Pradesh, Odisha, Uttar Pradesh, Andhra Pradesh with Telangana, Rajasthan, Gujarat).

## 7. Decisions made so far

| Decision | Why |
|---|---|
| Code decides, Gemini writes, a person approves | Safety in a medicine workflow |
| Cloud Run behind Firebase Hosting, not Supabase | The checklist asks for Google Cloud with Gemini |
| `gemini-3.5-flash-lite` primary and `gemini-3.1-flash-lite` fallback, both configurable | `gemini-2.5-flash` is scheduled for retirement and limited for new users |
| Light theme default, dark on a toggle | Bright offices and printed waybills |
| Action-first dashboard with folded details | The first version was too busy |
| Federated design kept small and labelled "simulated" | The challenge names it; it is not a real network yet |
| Onboarding redesign deferred to the morning | You asked for it to be done properly |
| Onboarding is a splash and one setup screen, with the tour as an optional dashboard button (30 Sep 2026) | Simpler to use. The dashboard cannot be opened before setup, and the logo resets it. Replaces the 3-screen version |
| App name: Sanket (संकेत, "signal") | A pan-Indian word, understood across Indo-Aryan and Dravidian languages, and it says what the app does: the early signal. Trademark not checked. Ask a Malayalam speaker about the related word, which can mean "refuge" |

## 8. Risks

| Risk | Likelihood | Effect | Plan |
|---|---|---|---|
| Cut-off is earlier than expected | Unknown | Could miss the window | Step 0. Submit the minimum first |
| Billing not set up | Medium | Cannot deploy Cloud Run | Check step 2 early. Fall back to the honest local-only description |
| Model ID rejected | Medium | Gemini calls fail | Change `GEMINI_MODEL`. The fallback waybill keeps the demo working |
| Hosting rejects the Cloud Run region | Medium | `/api` unreachable | Redeploy in `us-central1`, edit `firebase.json` |
| Local-language errors | Medium | Credibility | Back-translation, visible chip, native review after submission |
| Claims exceed evidence | Low | Credibility | Sample data label and asterisks stay |

## 9. Self-check against a generic plan

- A generic plan lists phases. This one assigns each step to you or me and says when it is done.
- A generic plan ignores the deadline. This one starts with finding it and says what to cut.
- A generic plan promises everything. This one says what will not be claimed if it cannot be deployed.
- Weak spot left honest: the time estimates for deployment assume billing and credits are already sorted. They may not be.
