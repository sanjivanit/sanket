# PRD: Sanket

Version 2.0 | Status: ready to build, pending design approval | Owner: Sanju
Event: Code for Communities 2.0, Smart Health & Supply Chain Resilience | Submission closes 30 Sep 2026 (check the portal for the exact time)
All numbers about clinics are sample data. Not for clinical use.

---

## 1. Summary

Sanket is a federated health-resource platform for India's Primary Health Centres (PHCs). Each state runs its own node. A node shows every clinic's medicine stock, beds and doctor attendance, forecasts when a clinic will run out, and recommends a clinic-to-clinic transfer that a District Medical Officer (DMO) approves. States share one learned warning number with each other, never clinic records.

The demo is anti-snake venom (ASV) in monsoon season, because a snakebite surge is sudden, ASV is cold-chain, and a clinic with ASV but no doctor cannot treat anyone.

## 2. Problem

**Who hurts.** A patient bitten by a snake at a rural PHC that has run out of ASV, or has stock but no doctor on duty. A DMO who finds out only when the clinic calls.

**Why it happens (from the challenge and the earlier PRD).**
1. Stock, beds, and staff are tracked separately, and not in real time across the network.
2. Clinics reorder on fixed schedules. A surge is faster than a reorder cycle.
3. A clinic that is empty cannot see that a neighbour has spare, unexpired stock.
4. Data cannot simply be pooled in one central place across states.

**What we know and what we do not.**

| Claim | Status |
|---|---|
| India had 25,650 functioning PHCs (31 Mar 2017); Maharashtra 1,814; Tamil Nadu 1,835 | Sourced: data.gov.in / Rural Health Statistics |
| Central restock takes 14 to 21 days | Assumption from the earlier PRD. Needs a source or a DMO to confirm |
| 8 to 15% batch waste at low-use clinics | Assumption. Needs a source. Do not use in the deck as fact |
| A live public API for PHC stock, beds or doctor attendance exists | Not found. Live data in v1 is simulated |

## 3. Users and jobs to be done

| User | Job (when, I want, so that) | Priority |
|---|---|---|
| District Medical Officer | When a clinic in my district is about to run out of a life-saving drug, I want to see who can safely help and approve in one step, so patients are not turned away | Primary |
| State or national health cell | When a district is under strain, I want to see it early across states, so I can act before central restocking | Secondary |
| PHC Medical Officer | When I am running low, I want to report stock with one message, so I avoid forms | Supporting (via check-in) |
| Emergency driver | When I am dispatched, I want cold-chain and delivery steps in my language, so the medicine arrives usable | Supporting (via waybill) |

We design for the DMO. The other three are served by a message box and a printable waybill, not full screens.

## 4. Options considered, and why this one

| Option | Why not (or why partly) |
|---|---|
| A district buffer store of ASV | Real competitor. Ties up stock and does not fix expiry or uneven use. Sanket can recommend where a buffer should sit later |
| DMO phones every clinic each morning | Works at small scale, but is slow in a surge and invisible to the state. Our $0 pilot is exactly this, with Sanket on top |
| One central forecasting system | Legally and practically hard across states (data location rules). Conflicts with the "federated" ask |
| Move the patient instead of the vial | Sometimes better for snakebite. Roadmap idea: refer overflow patients |
| **Clinic-to-clinic transfers with forecast, approval and shared learning (chosen)** | Fits the challenge wording, uses existing spare stock, needs no new warehouse |

## 5. Goals, non-goals, metrics

**Goals (by submission).**
- G1. A judge can run an end-to-end flow on a live link: warning, recommendation, approval, delivery.
- G2. Google AI does real work in the flow and is guarded by plain code.
- G3. The design visibly works beyond one state.

**Non-goals.** Real inventory integration. Login and roles. Other medicines. Payments. A real map. Multi-donor splits. Any clinical claim.

**North star metric.** Hours of warning before projected stock-out. Today's process gives about 0 (found out at empty). Demo target: 48 hours or more for the sample surge. Measured value in the sample: about 61 hours (Rampur, first warning step).

**Supporting metrics.**
- Time from recommendation to approved dispatch (target in the demo: under 60 seconds).
- Transit ETA (about 28 min same district; about 78 min next district, at 40 km/h).
- Share of transfers where the donor keeps at least 3 days of its own supply (must be 100%).

**Guardrail metrics (must stay at zero or near).**
- Transfers that leave a donor below 3 days: 0.
- Gemini answers that fail the code check (overrides): tracked, expected low.
- Offline fallback used: tracked. Demo must never show an error screen.
- False early warnings: tracked in testing.

## 6. Scope

**In (v1).** Clinic status with the Triad of Care (medicine, beds, doctor). 14-day footfall history and a trend forecast. Early warning at 72 hours or less. Transfer recommendation, same district (35 km) then next district (80 km). DMO approval (two DMOs for cross-district). Gemini dispatch with waybill in English plus Marathi, Tamil or Hindi. National rollup. Federated averaging panel (simulated in one app). Anonymized export.

**Could (cut first if late).** Message check-in. Anonymized export.

**Out (say "roadmap").** Dengue scenario. Real map and routing. Restock-token ledger. Multi-donor split. Real feeds from state inventory systems. Vertex AI or BigQuery ML model training.

## 7. Prioritisation (RICE, judgement not measured)

Reach is relative, out of 10. Impact 0.25 to 3. Confidence in %. Effort in days. RICE = Reach x Impact x Confidence / Effort.

| # | Feature | R | I | C | E | RICE | Decision |
|---|---|---|---|---|---|---|---|
| 1 | DMO approval step | 10 | 2 | 90% | 1 | 18.0 | Must |
| 2 | Donor filter + quantity engine | 10 | 3 | 90% | 2 | 13.5 | Must |
| 3 | Forecast + early warning | 10 | 3 | 60% | 3 | 6.0 | Must |
| 4 | Gemini dispatch + waybill | 10 | 2 | 80% | 3 | 5.3 | Must |
| 5 | Cross-district tier | 5 | 2 | 80% | 1.5 | 5.3 | Must |
| 6 | National rollup | 8 | 1 | 90% | 1.5 | 4.8 | Must |
| 7 | Federated panel | 4 | 1 | 60% | 2 | 1.2 | Should (see note) |
| 8 | Message check-in | 6 | 1 | 50% | 2.5 | 1.2 | Could |
| 9 | Anonymized export | 2 | 0.5 | 90% | 1 | 0.9 | Could |
| 10 | Dengue scenario | 3 | 1 | 30% | 4 | 0.2 | Cut |

Note on #7: it scores low on RICE, but the challenge names federated shared modelling, and judges score problem fit at 20%. It stays, built small and labelled "simulated in one app".

## 8. Requirements

**Functional (engine rules, all in plain code).**
- alpha = max(0, (today footfall - baseline) / baseline). Current burn = baseline burn x (1 + alpha). Days of supply (DSR) = usable stock / current burn. Expired stock counts as zero.
- Status: under 1 day Critical, under 3 days Warning, otherwise Stable.
- Forecast: straight-line trend on the last 5 days, projected 10 days, never below baseline. Early warning when projected stock-out is 72 hours or less AND daily footfall growth is at or above the node's threshold AND the clinic is not already Critical.
- Need = ceil(2.0 x recipient current burn - recipient stock). Donor can give floor(donor stock - 3.0 x donor current burn).
- Donor eligible: doctor on duty, beds under 85% occupied, batch unexpired, can cover the full need, within distance for the tier. Nearest first.
- Gemini may only pick from eligible donors and write text. Code makes the dispatch ID and restock token, and rejects any Gemini answer that breaks the rules.

**Non-functional.**
- Speed: recommendation visible within 2 seconds after Find Transfer (Gemini call under 8 seconds or fallback).
- Reliability: offline template fallback for the waybill, so no error screens.
- Privacy: shared upward data limited to a threshold, a sample count and anonymized alerts. No clinic names, doctor names or patient data.
- Accessibility: status never shown by colour alone. Text contrast at least 4.5:1. Keyboard reachable buttons.
- Language: English plus Marathi, Tamil or Hindi. Native speaker check on the local text before the video.

## 9. User stories and acceptance criteria

| # | Story | Acceptance (Given / When / Then) | Pri |
|---|---|---|---|
| 1 | As a DMO I see every clinic's medicine, beds and doctor in one view | Given a state node, when I open it, then each clinic shows days of supply, bed use and doctor status with text labels | Must |
| 2 | As a DMO I get warned before a clinic runs out | Given rising footfall, when the forecast says 72 hours or less, then the clinic shows Early warning and hours left | Must |
| 3 | As a DMO I see a clinic turn Critical | Given days of supply under 1, when it updates, then the clinic shows Critical and the alert names hours left | Must |
| 4 | As a DMO I get a safe transfer recommendation | Given a warned clinic, when I click Find Transfer, then I see the donor, vials, distance, ETA and a pass/fail reason for every other clinic | Must |
| 5 | As a DMO I approve before anything moves | Given a recommendation, when I do not click Approve, then nothing is dispatched | Must |
| 6 | As a DMO I get help from the next district when mine cannot | Given no same-district donor can cover the need, when I click Find Transfer, then the system escalates and requires both DMOs to approve | Must |
| 7 | As a driver I get a waybill I can read | Given an approved transfer, when it is created, then I see English and local-language steps, batch, expiry, cold-chain range, QR and Print | Must |
| 8 | As a state officer I see all states | Given the National tab, when I open it, then I see states, districts and clinics with counts of warnings and transfers | Must |
| 9 | As a state officer I learn from other states without sharing records | Given the Federated panel, when I run a round, then only a threshold and sample count leave each state and the shared value updates both nodes | Should |
| 10 | As a PHC officer I report stock with a message | Given a pasted message in any Indian language, when I submit, then the clinic card updates or asks me to confirm if unsure | Could |
| 11 | As anyone I never see a raw error | Given Gemini fails, when a waybill is requested, then a template waybill appears and the log says "Offline fallback used" | Must |
| 12 | As a judge I can tell what is simulated | Given any screen, when I look at the footer and README, then sample data and simulated federation are stated | Must |

## 10. Analytics and tracking plan

Purpose in v1: prove the flow works and measure the north star. Events go to an on-screen event log and the browser console. Production path: BigQuery.

| Event | Properties |
|---|---|
| scenario_started | state, scenario, step |
| day_advanced | step, clinic_id, footfall, dsr, projected_stockout_hours |
| warning_fired | clinic_id, projected_stockout_hours, growth, threshold |
| transfer_searched | tier, eligible_count, rejected_reasons |
| tier_escalated | from_tier, to_tier |
| dispatch_recommended | donor_id, vials, distance_km, eta_min, source (gemini or fallback) |
| guardrail_override | reason |
| dmo_approved | district, role_index |
| delivered | vials, recipient_dsr_after |
| federated_round_run | state_count, global_threshold |
| checkin_parsed | language, confidence, applied |
| gemini_fallback_used | mode, reason |

Derived: warning lead time = projected stock-out hours at the first warning_fired; approval time = time between dispatch_recommended and last dmo_approved.

## 11. Risks and open questions

| Risk or question | What we do |
|---|---|
| Deadline is one day away | Build order: engine, layout, scenarios, transfer, Gemini, deploy. Then national, federated, export, check-in |
| Unsourced 14 to 21 day and 8 to 15% figures | Label as assumptions in the deck |
| Lead time is measured on a snapshot with stock held as reported | State this in the README and speaker notes |
| Will clinics actually report and donors actually give? | Not tested. Roadmap: a two-week manual pilot with one DMO office |
| Gemini model name and quota | Use the Flash model shown in Google AI Studio; key stays server-side; fallback ready |
| Local-language text quality | Have a native speaker read Marathi and Tamil before recording |
| Is one donor covering the full need too strict? | Accepted for v1. Roadmap: split across donors |

## 12. Self-check against a generic PRD

- A generic PRD lists features without ranking. This one ranks with RICE and says where it overrides the score (federated).
- A generic PRD invents baselines. This one marks every unsourced number as an assumption.
- A generic PRD has a vanity metric. This one uses one behavioural north star plus guardrails that must stay at zero.
- Weak spot left honest: the RICE scores are my judgement, not data.
