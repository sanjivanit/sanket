> **Superseded in one place.** Prompt P3 and P4 below mention a Supabase Edge Function. The submitted architecture uses Cloud Run behind Firebase Hosting instead. Use `API_CONTRACT.md` for the backend calls. Everything else here still applies.

# Sanket v2: Full Solution (PRD + Design + Engineering + Build Prompts + Submission)

Built for Code for Communities 2.0, Smart Health & Supply Chain Resilience.
Sample data only. Not for clinical use. Status: rewritten to match the official problem statement.

How to use this file: read sections 1 to 3 once (10 minutes). Then paste the prompts in section 4 into Lovable, one at a time, in order. Test with section 5 after each prompt. Sections 6 to 8 are the video, deck and checklist.

---

## 1. PRD

### 1.1 Problem (from the challenge)
India's PHC network cannot see medicine stock, patient footfall, beds and doctor attendance in real time. Clinics run out of medicines when it matters most, and the country cannot respond as one system.

### 1.2 Chosen solution
Sanket is a federated health-resource platform. Every state runs its own node that holds clinic data (stock, beds, doctor attendance, daily footfall). A national layer sees only summaries and shared model numbers, never clinic records. Each node does four things:
1. Shows live Triad of Care (medicine, beds, doctor) for every PHC.
2. Forecasts footfall and stock-out time, and warns early.
3. Recommends a transfer from a nearby clinic (same district first, then a neighbouring district). A District Medical Officer (DMO) approves.
4. Shares only a learned warning threshold with other states (federated averaging), so states learn from each other without sharing data.

Gemini does the language and reasoning work. Plain code does all safety maths.

### 1.3 Problem statement to feature map

| The challenge asks for | Feature | Where |
|---|---|---|
| Real-time visibility: medicines, beds, staff, across India | Clinic cards + National rollup (state, district, PHC) | P1, P5 |
| Forecast demand | 14-day footfall history + trend forecast per clinic | P0, P2 |
| Early warnings for stock-outs | Early Warning at 72 hours or less, before Critical | P2 |
| Automated cross-district redistribution | Tier 1 (same district, 35 km) and Tier 2 (neighbouring district, 80 km), DMO approval | P3 |
| Federated AI, shared modelling across states | State nodes + federated averaging of the warning threshold | P5 |
| Multilingual (India) | Waybill and alert in English + Marathi, Tamil or Hindi; message check-in in any language | P4, P6 |
| Real or realistic data | Sample data, labelled. Real facility list can be swapped in later (data.gov.in directory) | P0 |

### 1.4 Users

| User | Job they want done | What they see |
|---|---|---|
| District Medical Officer (primary) | "Tell me which clinic will run out and who can help, so I can approve in one click" | State node view, warnings, recommendation, Approve |
| State / national health cell | "Show me where the network is weak across states" | National view, federated panel |
| PHC Medical Officer | "Get stock without paperwork" | Check-in message; receives waybill |
| Emergency driver | "Clear route, cold-chain rules, receipt" | Printable waybill with QR |

Primary user is the DMO. Everything else supports that user. Two of the three PRD v1 personas (PHC doctor, driver) have no full app screen in v2. They are served by the check-in and the waybill.

### 1.5 Prioritisation (judgement, not measured)

| Feature | Reach | Impact | Confidence | Effort | Decision |
|---|---|---|---|---|---|
| Surge, DSR, donor filter, quantity | High | High | High | Low | MUST |
| Gemini dispatch + waybill + languages | High | High | Med | Med | MUST |
| DMO approval | High | High | High | Low | MUST |
| Forecast + early warning | High | High | Med | Med | MUST (challenge asks for it) |
| Cross-district tier | Med | High | High | Low | MUST (challenge asks for it) |
| National rollup | High | Med | High | Low | MUST |
| Federated panel | Med | Med | Med | Med | SHOULD |
| Message check-in | Med | Med | Med | Med | COULD (cut first if late) |
| Anonymized export | Low | Low | High | Low | COULD |
| Dengue scenario, real map, restock-token ledger, multi-donor split | - | - | - | High | CUT (say "roadmap") |

### 1.6 Goals and metrics
North star: hours of warning before projected stock-out. Today's process gives about 0 hours (found out when stock runs out).

| Goal | Today (assumption, needs a source) | Sanket demo |
|---|---|---|
| Warning lead time | about 0 h | About 61 hours for the sample surge (see section 5). Simplified: stock held as reported |
| Restock time | 14 to 21 days from the central store (assumption) | Transit ETA about 28 min (same district) or about 78 min (neighbouring district) at 40 km/h. Approval time not included |
| Coverage | one clinic sees only itself | 2 states, 3 districts, 16 sample clinics; design supports one node per state |
| Data shared upward | none possible | 2 numbers per state (threshold, sample count) plus anonymized alerts |

Tracking plan (log to the terminal and console): surge_injected, day_advanced, warning_fired, tier_escalated, dispatch_recommended, dmo_approved, delivered, checkin_parsed, federated_round_run, gemini_fallback_used.

### 1.7 Scope
In: what is in 1.3. Out: real inventory integration, real doctor attendance feed, user login, payment, multi-donor split, other medicines than anti-snake venom (ASV), real map.

### 1.8 Honest limits (put these in the deck notes)
- All stock, bed, doctor and footfall numbers are simulated.
- Forecast is a simple trend model on sample history. Production path: BigQuery ML or Vertex AI.
- Federated learning is simulated inside one app. Each node keeps its own data, and only numbers cross.
- Each early-warning step is a snapshot: if stock falls between steps, the lead time shrinks.
- ASV cold-chain range 2 to 8 degrees C is used as sample; confirm with a pharmacist before real use.

---

## 2. Design

Kept from PRD v1 (a dark operations console suits DMO use): dark slate background `#080C14`, borders `#1E293B`, glass cards, high-density layout for a 16:9 desktop, monospace for the log.

Tokens: STABLE green `#22C55E`, WARNING amber `#F59E0B`, CRITICAL red `#EF4444`, transfer line cyan `#22D3EE`, text `#E2E8F0`, muted `#94A3B8`. Font: Inter for UI, JetBrains Mono for log and waybill numbers.

Screens:
1. State Node view: header, clinic cards grouped by district (left 65%), Gemini Dispatch Console (right 35%).
2. National view: state, district, PHC rollup.
3. Federated panel (slide-over).
4. Anonymized export (slide-over).

UX decisions:
- Status is never colour-only: every badge has a label (STABLE / EARLY WARNING / CRITICAL).
- Every recommendation shows why each other clinic failed.
- Nothing is dispatched until a DMO clicks Approve.
- Avoid the "AI dashboard" look: no purple gradients, no decorative charts. Every number on screen is one the DMO acts on.

---

## 3. Engineering

Architecture (text):
- Browser app (React, Tailwind, Lucide) holds all state in memory.
- `engine.ts`: pure functions, no AI. DSR, forecast, warning, donor filter, quantity, tiers.
- One server function `gemini` (Supabase Edge Function or similar) with modes `warning_brief`, `dispatch`, `checkin`. Secret `GEMINI_API_KEY` lives only there.
- Nodes: `MH` (Maharashtra: District A with 8 clinics, District B with 3 clinics) and `TN` (Tamil Nadu: 1 district, 5 clinics). National layer: a rollup plus federated averaging.

Trade-offs (one line each):
- In-memory state instead of a database: fastest to build and demo, but no persistence.
- Rules in code, Gemini for language and choice among safe options: safer for medicine, slightly less "AI-driven".
- Linear trend forecast: explainable and quick, less accurate than a trained model.
- Simulated federation: shows the design honestly, but no real network between nodes.
- Gemini Flash model: fast and cheap; use the current Flash model listed in Google AI Studio.

Data contract (TypeScript):
```ts
interface PHCNode {
  id: string; name: string; stateCode: "MH" | "TN"; districtId: string; subDistrict: string;
  distanceFromTargetKm: number;            // sample; production: from coordinates
  triadOfCare: {
    inventory: { itemCode: "ASV"; itemName: string; batchNumber: string; expiryDate: string;
                 stockVials: number; baselineDailyBurn: number;
                 coldChainRequired: boolean; tempRangeCelsius: "2-8" };
    beds: { total: number; occupied: number };
    personnel: { medicalOfficerName: string; onDuty: boolean; nursingStaffCount: number };
  };
  footfall: { baseline: number; history: number[] };  // 14 days, last = today
}
```

Engine rules (exact):
- alpha = max(0, (todayFootfall - baselineFootfall) / baselineFootfall)
- currentBurn = baselineBurn x (1 + alpha)
- DSR (days) = usableStock / currentBurn (expired batches = 0 usable)
- Status now: DSR < 1 CRITICAL; DSR < 3 WARNING; else STABLE
- Forecast: linear fit on the last 5 days of footfall. Project 10 days ahead, never below baseline. Burn(day) = baselineBurn x footfall(day) / baselineFootfall. Deplete stock day by day; projectedStockoutHours = the fractional point where stock reaches 0, times 24.
- EARLY WARNING if projectedStockoutHours <= 72 AND (today / yesterday - 1) >= node threshold AND status is not CRITICAL.
- recipientNeed = ceil(2.0 x recipientCurrentBurn - recipientStock)
- donorMax = floor(donorStock - 3.0 x donorCurrentBurn)  (donor keeps 3 days at its own current burn)
- Donor eligible if: doctor on duty; beds occupied < 85%; batch not expired; donorMax >= recipientNeed (one donor must cover the full need); and distance within the tier.
- Tier 1: same district, 35 km or less. If nobody qualifies, Tier 2: other districts in the same state, 80 km or less, needing approval from both DMOs.
- Rank by distance. Transit minutes = distance / 40 x 60.

---

## 4. Build prompts (paste one at a time into Lovable)

### P0 (MUST): Data and engine. No UI yet.

Create a React + Tailwind + Lucide app called "Sanket // National Health Resource Command". Dark slate theme (#080C14), borders #1E293B, glass cards. Inter and JetBrains Mono fonts. In-memory state only, no login.

Create `engine.ts` with the exact rules below, as pure functions with no AI. Also create sample data, labelled "sample data" in the UI.

RULES:
- alpha = max(0, (todayFootfall - baselineFootfall) / baselineFootfall). currentBurn = baselineBurn x (1 + alpha). DSR = usableStock / currentBurn.
- Status: DSR < 1 CRITICAL (red), DSR < 3 WARNING (amber), else STABLE (green).
- Forecast: linear regression on the last 5 days of footfall, project 10 days, never below baseline, burn(day) = baselineBurn x footfall(day) / baselineFootfall, deplete stock day by day, return projectedStockoutHours (fractional).
- EARLY WARNING if projectedStockoutHours <= 72 AND (today/yesterday - 1) >= the node's threshold AND status is not CRITICAL.
- recipientNeed = ceil(2.0 x recipientCurrentBurn - recipientStock). donorMax = floor(donorStock - 3.0 x donorCurrentBurn).
- Donor eligible if: doctor on duty; occupied beds / total beds < 0.85; batch not expired; donorMax >= recipientNeed; distance within tier.
- Tier 1 = same district and <= 35 km. If nobody qualifies, Tier 2 = other district, same state, <= 80 km, needs both DMOs.
- Rank by distance. transitMinutes = distance / 40 x 60.

FOOTFALL HISTORY: for every clinic, history = baseline + [0,-1,1,0,2,-1,0,1,0,0] for 10 days. Then 4 scenario steps (see P2) extend it to 14 days.

STATE MH, District A ("District A"), distances are km from PHC Rampur:

| id | name | stock | burn | beds | doctor | baseline OPD | km | batch | expiry |
|---|---|---|---|---|---|---|---|---|---|
| MH-01 | PHC Rampur (target) | 6 | 2 | 7/8 | Dr. A. Verma, on duty | 20 | 0 | ASV-26-A | 2027-05-31 |
| MH-02 | PHC Shivpuri | 44 | 3 | 4/10 | Dr. S. Kulkarni, on duty | 25 | 18.4 | ASV-26-B | 2027-03-31 |
| MH-03 | PHC Khed | 28 | 2 | 3/6 | Dr. N. Patil, on duty | 18 | 27.0 | ASV-25-K | 2026-12-15 |
| MH-04 | PHC Bhor | 12 | 4 | 6/8 | Dr. R. Deshmukh, ABSENT | 22 | 22.5 | ASV-26-C | 2027-02-28 |
| MH-05 | PHC Alibag Rural | 8 | 2 | 9/10 | Dr. K. Joshi, on duty | 16 | 31.0 | ASV-26-D | 2027-04-30 |
| MH-06 | PHC Junnar | 36 | 3 | 3/10 | Dr. M. Shinde, on duty | 24 | 41.0 | ASV-26-E | 2027-06-30 |
| MH-07 | PHC Daund | 18 | 3 | 6/10 | Dr. V. Rao, ABSENT | 20 | 29.0 | ASV-26-F | 2027-01-31 |
| MH-08 | PHC Saswad | 30 | 2 | 4/8 | Dr. P. Mane, on duty | 18 | 33.5 | ASV-26-G | 2027-03-15 |

STATE MH, District B (neighbouring district, km from Rampur):

| id | name | stock | burn | beds | doctor | baseline OPD | km | batch | expiry |
|---|---|---|---|---|---|---|---|---|---|
| MH-09 | PHC Lonand | 40 | 3 | 3/10 | on duty | 24 | 52 | ASV-26-H | 2027-03-31 |
| MH-10 | PHC Nimgaon | 26 | 2 | 4/8 | on duty | 18 | 68 | ASV-26-J | 2027-02-28 |
| MH-11 | PHC Pargaon | 9 | 3 | 8/10 | on duty | 22 | 47 | ASV-26-K | 2027-04-30 |

STATE TN, District "Ariyalur-Perambalur (sample)", km from PHC Ariyalur Rural:

| id | name | stock | burn | beds | doctor | baseline OPD | km | expiry |
|---|---|---|---|---|---|---|---|---|
| TN-01 | PHC Ariyalur Rural (target) | 6 | 2 | 6/8 | on duty | 20 | 0 | 2027-05-31 |
| TN-02 | PHC Perambalur | 40 | 3 | 4/10 | on duty | 25 | 22 | 2027-03-31 |
| TN-03 | PHC Jayankondam | 24 | 2 | 3/8 | on duty | 18 | 30 | 2027-02-28 |
| TN-04 | PHC Udayarpalayam | 15 | 3 | 6/10 | ABSENT | 20 | 12 | 2027-01-31 |
| TN-05 | PHC Sendurai | 7 | 2 | 7/8 | on duty | 16 | 26 | 2027-04-30 |

(Give TN clinics sample doctor names and batch numbers in the same style. Sample names only.)

Per-state thresholds (used by early warning): MH 0.129, TN 0.159 (these are updated in P5).

Show a temporary test page printing DSR for each clinic. Expected: MH-01 3.0, MH-02 14.7, MH-04 3.0, MH-05 4.0.

### P1 (MUST): Layout

Build the app shell.
Header: title "Sanket // National Health Resource Command"; tabs "State Node" and "National"; State dropdown (Maharashtra, Tamil Nadu); Scenario dropdown ("Normal Baseline", "Monsoon Snakebite Surge (one clinic, +450%)", "District-wide Monsoon Surge"); buttons "Advance Day", "Inject Crisis Surge", "Reset"; summary numbers: District Reserve % (average of min(DSR,14)/14 across clinics), Total Beds, Active Deliveries.
State Node view: left 65% clinic cards grouped by district; right 35% "Gemini Dispatch Console" (terminal log area, recommendation area, waybill area, empty for now).
Every clinic card: name, sub-district, ASV vials, DSR number and status badge with a text label, bed progress bar with %, doctor pill (green "Doctor On Duty" / red "Doctor Absent"), an "Expiring soon" badge if the batch has under 90 days left, and a tiny footfall sparkline. Border colour follows status.

### P2 (MUST): Scenarios, forecast, early warning

Scenario steps. "Advance Day" moves the scenario forward one step (steps 1 to 4). "Inject Crisis Surge" jumps to step 4. "Reset" returns to step 0. Each step appends one day to the footfall history.

Scenario A (one clinic): the target clinic's footfall multiplier per step is 1.2, 1.7, 2.6, 5.5 x baseline (Rampur: 24, 34, 52, 110). Nobody else changes.
Scenario B (district-wide): the target uses the same multipliers as A. Every other clinic in the target's district uses 1.1, 1.5, 2.2, 3.5 x baseline. District B clinics never change.
Applies to the selected state's target clinic (MH-01 or TN-01). For TN only Scenario A applies.

After every step, recompute DSR, status, forecast, warnings. When a clinic gets EARLY WARNING: card turns amber with the label "EARLY WARNING", and the console shows a banner: "Projected stock-out in about X hours. Warned Y hours before running out. Today's process: 0."
When a clinic hits CRITICAL: pulsing red border.
Log each computation line in the terminal.
Expected for Rampur in Scenario A: step 1 about 61 h (EARLY WARNING), step 2 about 42 h, step 3 about 27 h, step 4 about 13 h and DSR 0.55 (CRITICAL).
Also show a small "Forecast" mini-chart in the console for the selected clinic (history + projected footfall).

### P3 (MUST): Redistribution and approval

When any clinic is EARLY WARNING or CRITICAL, show a "Find Transfer" button (auto-run on Inject Crisis Surge).
1. Run Tier 1. Log every clinic as PASS or FAIL with the reason (doctor absent / beds at or above 85% / too far / not enough surplus after keeping 3 days / expired).
2. If a donor passes, recommend the nearest one. If none passes, log "No donor in district. Escalating to Tier 2" and run Tier 2 with the 80 km limit on the other district(s).
3. Show a recommendation card: recipient, donor, vials, distance, ETA, tier. If the recipient's beds are 85% or more, add an amber note: "Recipient beds nearly full: overflow patients may need referral."
4. Buttons: Tier 1 needs "Approve as DMO (District A)". Tier 2 needs two: "Approve as DMO (District A)" and "Approve as DMO (District B)". Plus "Reject". Nothing is dispatched until all approvals are clicked.
5. After approval: animated cyan line from donor card to recipient card, Active Deliveries +1, button "Mark Delivered". On delivered: donor stock minus vials, recipient stock plus vials, recompute everything, log it.
Expected Scenario A (MH): eligible Shivpuri, Khed, Saswad. Pick Shivpuri, 16 vials, 18.4 km, ETA 28 min.
Expected Scenario B (MH): all District A donors fail on surplus (Shivpuri 12, Khed 7, Saswad 9 vials available, need 16). Tier 2: Lonand passes (52 km, ETA 78 min), Nimgaon passes (68 km), Pargaon fails. Pick Lonand, 16 vials. Shivpuri, Khed and Saswad still show green (about 4 days) because they look healthy but are being drained too.
Expected TN Scenario A: eligible Perambalur and Jayankondam. Pick Perambalur, 16 vials.

### P4 (MUST): Gemini server function, waybill, languages

Add ONE server function `gemini` (Supabase Edge Function). The key is read from the server secret `GEMINI_API_KEY`. No key field in the UI. Use the current Gemini Flash model. Use structured JSON output (responseSchema).

Mode `warning_brief`: input = clinic, forecast numbers. Output {headline, explanation (2 sentences, plain language), suggestedAction}. Show it in the warning banner.

Mode `dispatch`: input = recipient, the list of ELIGIBLE donors already filtered by engine.ts, the engine's quantity, the tier, and the language (Marathi for MH, Tamil for TN, Hindi selectable). Output: {crisisAssessment, selectedDonorId, transferQuantityVials, transitDistanceKm, estimatedTransitMinutes, coldChainVerification {required, tempRange, carrierType}, batchNumber, expiryDate, instructions {english, localLanguageName, local}, auditTrail[]}.
Gemini chooses among the eligible donors and explains the choice in 2 to 3 plain sentences. Gemini writes the instructions in English and the local language.

CODE MAKES: dispatchId (format SK-2026-MH-0001) and the restock token ("RGT-" + first 10 characters of a SHA-256 hash of the dispatch JSON). Gemini must not make either.
GUARDRAIL: after Gemini answers, code checks the donor is in the eligible list and the quantity equals the engine's quantity. If not, use the engine's top pick and log "Guardrail override".
FALLBACK: if Gemini fails or takes over 8 seconds, build the waybill from templates (English + prewritten Marathi/Tamil/Hindi text) and log "Offline fallback used". The demo must never show an error screen.

Waybill card: header "GOVERNMENT HEALTH LOGISTICS DISPATCH", dispatch number, tier, vials, batch, expiry, cold chain 2 to 8 degrees C with carrier box, English steps, local-language steps, restock token, approvals list, status (Awaiting approval / Approved / Delivered), QR code with the dispatch JSON, Print button, and a language dropdown that regenerates the local text.

### P5 (MUST for National, SHOULD for Federated): National view and federated panel

National tab: a rollup table: State > District > PHCs. Columns: PHCs shown, clinics below 3 days, beds occupied %, doctors on duty %, active warnings, active transfers. Click a row to open that state node view. A note under the table: "16 sample clinics. Production design: one node per state; India has about 25,650 functioning PHCs (data.gov.in, 2017)."

Federated panel (button "Federated Model"): each state node keeps a local early-warning threshold = mean daily footfall growth that came before past stock-outs. Hardcode past episodes: MH [0.10, 0.14, 0.12, 0.11, 0.13] (mean 0.12), TN [0.16, 0.20, 0.18, 0.19, 0.17] (mean 0.18). Button "Run federated round": each node sends ONLY {threshold, sampleCount} (MH 0.12 with 11 clinics, TN 0.18 with 5 clinics). The national layer averages weighted by sampleCount: (0.12 x 11 + 0.18 x 5) / 16 = about 0.139. Each node then uses 50% local + 50% national: MH about 0.129, TN about 0.159. Update the thresholds used by the engine. Show a diagram: two state boxes with "clinic records stay here", arrows carrying 2 numbers, and a national box. Label it "Federated averaging, simulated in one app".

### P6 (COULD, cut first if late): Message check-in

Add a "Clinic Check-in" box. The user pastes a WhatsApp or SMS message in any Indian language, for example "PHC Rampur: ASV 6 vial, doctor upasthit, bed 7/8, aaj OPD 45". Add mode `checkin` to the `gemini` function with structured output: {clinicName, stockVials, doctorOnDuty, occupiedBeds, totalBeds, opdFootfallToday, detectedLanguage, confidence}. Match the clinic, update its card and recompute. If confidence is under 0.7, show the parsed values and ask to confirm. If Gemini fails, show "Could not read the message, please retype."

### P7 (COULD): Anonymized export

Header button "Export Anonymized Telemetry" opens a slide-over with the JSON: {diseaseCode (ICD-11 code for snakebite envenoming. LOOK IT UP on the WHO ICD-11 browser and paste the real code. Do not guess), surgeVelocity (footfall change per day), surgeClass, affectedFacilitiesBucket "1-5", districtLatLng rounded to 1 decimal, weekOfYear, sharedThreshold}. No clinic names, doctor names or exact coordinates. Green checklist: names removed, doctors removed, location generalized, no patient data collected.

### P8 (MUST): Deploy

1. README: what it does (2 lines), how the engine works, where Gemini is used and where code guards it, the honest limits (section 1.8), how to run. Footer: "Sample data. Not for clinical use."
2. The published link works with no login on a 16:9 desktop.
3. Connect GitHub (public repo) and Publish.

---

## 5. Test script (run on the LIVE link before submitting)

1. Reset. State = Maharashtra. Scenario A. Advance Day once: Rampur EARLY WARNING at about 61 h. Advance to step 4: CRITICAL, DSR 0.55.
2. Find Transfer: Shivpuri, 16 vials, 18.4 km. Approve as DMO (District A). Mark Delivered. Rampur recovers to about 2 days.
3. Reset. Scenario B. Inject Crisis Surge: District A donors fail, escalates to Tier 2, Lonand, 16 vials, both DMO approvals needed.
4. Federated Model: run a round. Thresholds update.
5. Switch to Tamil Nadu. Scenario A. Waybill in Tamil.
6. Break the Gemini key on purpose: the fallback waybill still appears.
7. National tab shows both states.
8. (If built) paste the Hindi check-in message.

---

## 6. Demo video script (about 4:30)

- 0:00 to 0:40 Problem: "A clinic has 6 vials and 3 days of stock. A snakebite surge hits. Today, nobody knows until it is empty."
- 0:40 to 1:20 Early warning: press Advance Day. "Footfall rises 20%. Sanket forecasts stock-out in about 61 hours and warns the DMO now."
- 1:20 to 2:10 Surge and transfer: Inject Crisis Surge. "By surge peak, 13 hours left. The engine checks every clinic, skips absent doctors, full beds and thin stock, and recommends Shivpuri, 16 vials, 28 minutes. Gemini explains and writes the waybill in Marathi and English. The DMO approves."
- 2:10 to 2:50 Cross-district: Scenario B. "When the whole district is surging, neighbours look healthy but cannot give. Sanket escalates to the next district and needs both DMOs."
- 2:50 to 3:30 Federated: "Each state keeps its data. States share one learned number and a sample count. The national layer averages it and sends it back."
- 3:30 to 4:00 National view: "16 clinics here, designed for one node per state across India's PHC network."
- 4:00 to 4:30 Close: language switch to Tamil, then "The engine does the safety math. Gemini explains and writes. A person approves."
Do not say: "100% privacy compliant", "real data", "production ready".

---

## 7. Pitch deck (12 slides)

1. Title + one line
2. Problem (stock-outs, thin buffers; cite your source or mark as assumption)
3. Who it serves (DMO primary)
4. Solution overview (one screenshot)
5. Early warning + forecast (screenshot of the warning banner)
6. Redistribution: Tier 1 and Tier 2 with DMO approval
7. AI approach: what Gemini does, what code guards, fallback
8. Federated design: one node per state, 2 numbers shared
9. Data: sample now, path to real (data.gov.in facility directory, state inventory systems)
10. Multilingual + India scale (25,650 PHCs as of 2017, 28 states path)
11. Deployability: pilot in weeks (one district, 8 to 12 clinics, WhatsApp check-in, DMO approval), cost, risks
12. Impact + roadmap + team

Maps to scoring: fit 20%, AI and execution 25%, India reach 20%, impact 15%, deployability 20%.

---

## 8. Plan, priorities, submission checklist

Build order if time is short: P0, P1, P2, P3, P4, P8 first (working end to end). Then P5, then P7, then P6.
Cut list if late: P6, then P7, then the federated diagram (keep the numbers).

Submission checklist (from the guide):
- [ ] Public GitHub repo with README
- [ ] Demo video, 3 to 5 minutes
- [ ] Pitch deck, 10 to 12 slides
- [ ] 2 to 3 line description: "Sanket is a federated health-resource platform for India's PHC network. It forecasts stock-outs, warns early, and recommends clinic-to-clinic transfers (same or neighbouring district) for a District Medical Officer to approve, with Gemini writing the multilingual dispatch."
- [ ] Deployed link works with no login
- [ ] Live-link test script (section 5) passed
- [ ] Sample-data label visible in the app

Progress tracker (tick as you go): P0 [ ] P1 [ ] P2 [ ] P3 [ ] P4 [ ] P5 [ ] P6 [ ] P7 [ ] P8 [ ] Video [ ] Deck [ ] Submitted [ ]

Rules for the AI builder (keep in Lovable's project instructions): engine.ts is the only place with safety maths; never let Gemini generate IDs, tokens or quantities; never show a raw error to the user; every number on screen must come from engine.ts.
