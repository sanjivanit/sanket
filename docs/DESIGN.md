# DESIGN.md: Sanket

Status: locked for the submission build. Decisions on 30 Sep 2026: onboarding is a splash and one setup screen, with an optional tour on the dashboard (section 13), and Sanket is a desktop web app fixed at 1440 px wide (no responsive layout for now). Section 10 lists what remains as debt.
Live prototype: https://claude.ai/artifact/BXZcM8UJMTFXFGioHwNgDz
All clinic, stock, bed and doctor data on screen is sample data. Not for clinical use.

---

## 1. What this design is for

One person, one decision. A District Medical Officer (DMO) has minutes to decide whether a clinic that is running out of anti-snake venom (ASV) should receive vials from a neighbour. The screen must let them:

1. See that a problem exists, and how long they have.
2. See who can safely help, and why the others cannot.
3. Approve in one click.
4. Follow the medicine to delivery.

Everything else is support. If a feature does not help one of those four things, it lives behind a tab, a toggle or a link.

### Design principles

| Principle | What it means on screen |
|---|---|
| Action first | The alert, the transfer plan and the Approve button sit together in one card at the top right |
| Show the reason | Every recommendation can show why each other clinic was rejected |
| Never colour alone | Every status has a text label or a shape, as well as a colour |
| Honest data | "Sample data" is on every screen. Assumptions carry an asterisk. Unreviewed languages are marked |
| Calm until it matters | The screen is quiet when all clinics are stable and loud only when a clinic is at risk |
| A person approves | Nothing moves until a DMO clicks Approve. The API only recommends |

## 2. Tools and process used

| Tool | Used? | How |
|---|---|---|
| Anthropic Frontend Design (base layer) | Yes | Read before designing. Applied throughout |
| Design canvas artifact type | Yes | The prototype is a Design artifact, so it is editable and shareable |
| Taste Skill | Not in the design chat | Not installed in the chat that built the prototype. Its parameters were applied by hand. It is installed in your Claude Code, so use it there (see section 11) |
| UI/UX Pro Max | Onboarding only | Style driver for the 2 onboarding screens, the splash and the setup screen (decision 30 Sep 2026). Only one style driver per screen: Taste drives the dashboard, UI/UX Pro Max drives onboarding |
| Interface Design | Not in the design chat | Installed in your Claude Code. Its job is to persist these tokens across sessions. This file is that record |
| Emil Kowalski Design | No | Skipped on purpose. This is an internal tool, not a delight-driven consumer product |
| Designer Skills (63-skill suite) | No | It is for UX research work, not for building screens |
| GStack (AI-slop and quality score) | No | Not available in the design chat. Run it in Claude Code before the design is locked for good |
| Design critique and accessibility review skills | Yes | Run on 30 Sep 2026. Results in section 9 |
| Headless-browser renders and a contrast script | Yes | Every state, both themes, checked for overflow and contrast |

Taste parameters, as applied by hand and to be re-applied in Claude Code:

| Parameter | Value | Why |
|---|---|---|
| DESIGN_VARIANCE | 3 | An operations tool should feel predictable. Structure beats surprise |
| MOTION_INTENSITY | 2 | Motion only where it carries meaning: the pulse on a clinic at risk, vials moving on a transfer, bars filling |
| VISUAL_DENSITY | 6 | Lowered from 8 after the first review called the screen too busy |

### Brand

Name: **Sanket** (संकेत, "signal"). The mark is a rounded square with a heartbeat line, kept from the first design: a signal that something is changing. The Devanagari name appears next to the Latin name on the onboarding rail. Tagline: "Know before a clinic runs out." Subtitle: "National Health Resource Command".

## 3. Locked design tokens

### Colour

Semantic meaning is fixed. Do not reuse a status colour for decoration.

| Token | Light | Dark | Meaning |
|---|---|---|---|
| `--bg` | `#F3F5F8` | `#080C14` | Page ground |
| `--panel` | `#FFFFFF` | `#0A101B` | Cards and panels |
| `--text` | `#0F172A` | `#E2E8F0` | Main text |
| `--muted` | `#4B5768` | `#94A3B8` | Secondary text |
| `--rule` / `--rule2` | `#E1E6EE` / `#C8D0DC` | `#1E293B` / `#334155` | Borders |
| `--ok` (text `--ok-t`) | `#16A34A` (`#166534`) | `#22C55E` (`#4ADE80`) | Stable |
| `--warn` (text `--warn-t`) | `#B45309` (`#92400E`) | `#F59E0B` (`#FBBF24`) | Early warning, beds nearly full, expiring |
| `--crit` (text `--crit-t`) | `#DC2626` (`#B91C1C`) | `#EF4444` (`#F87171`) | Critical |
| `--acc` (text `--acc-t`) | `#0E7490` | `#22D3EE` (`#67E8F9`) | Actions, transfers, the proposed donor |
| `--doc` (text `--doc-t`) | `#6D28D9` (`#5B21B6`) | `#A78BFA` (`#C4B5FD`) | No doctor on duty. Used for nothing else |
| `--ok-btn` (text `--ok-btn-on`) | `#166534` (`#FFFFFF`) | `#22C55E` (`#04220F`) | Fill and label of the green "Mark delivered" button only. Added 30 Sep 2026: white on `--ok` measured 3.3:1 in light and 2.3:1 in dark |

Verified contrast: normal text at least 4.5:1 and large text at least 3:1 in both themes on 30 Sep 2026 (scripted scan of every text node: 0 failures). The warning bar colour `#B45309` replaced `#D97706`, which measured 2.9:1 against the page ground.

### Type

| Use | Family | Sizes |
|---|---|---|
| Interface | Public Sans (fallback system-ui) | 12 minimum, 13 secondary, 14 to 15 body, 16 to 18 titles, 26 to 40 numbers |
| Log and technical lines | IBM Plex Mono | 12 |
| Devanagari and Tamil text | Noto Sans Devanagari, Noto Sans Tamil | 13 |

Numbers use tabular figures so columns and counters do not jitter. No text is smaller than 12 px. Labels are sentence case, never all caps.

### Space, shape, depth

| Token | Value |
|---|---|
| Spacing scale | 4, 8, 10, 12, 16, 20, 24, 28 |
| Radius | 12 for panels, 8 for controls and segmented switches, 4 for chips, 50% for dots and rings |
| Depth | One soft shadow on panels (`--shadow`), nothing else |
| Touch targets | At least 44 by 44 px (doctor pills use an enlarged hit area) |
| Board | 1440 px wide. Left column 880, right column 560 |

### Motion

Three moving things only, all off when the person asks for reduced motion:

1. A slow pulse ring on a clinic at risk.
2. Vials travelling along the transfer arc while a transfer is in transit.
3. Bars and rings easing to new values (0.7 s).

### Icons and data shapes

| Concept | Shape |
|---|---|
| Vial | A small rounded tube. Solid means on hand. Dashed means still needed. Filled and faded means on the way |
| Bed | One square per bed. Filled means occupied. Amber when the clinic is 85% full or more |
| Doctor | A dot with a text label. Green ring means on duty. A violet pill means no doctor |
| Days of supply | A bar or ring on a 14-day scale, with ticks at 1 and 3 days |
| Clinic size on the map | Circle size follows vials in stock |

## 4. Layout

```
Header: brand, screens, state, scenario, theme
Status line (3 px, changes colour with the situation)
Timeline strip: demo controls and the surge story
Stats strip: clinics, beds, doctors, district reserve
+----------------------------------+--------------------------+
| Who can help Rampur (map)        | Action card              |
|  callouts: vials, donors,        |  hours left, plan,       |
|  distance, time                  |  vial icons, Approve     |
+----------------------------------+  Details (folded)        |
| Clinics: Tiles | Table | Charts  | Progress stepper         |
|                                  | Tabs: Forecast, Waybill, |
|                                  |  Log, Impact             |
+----------------------------------+--------------------------+
```

Reading path: the eye lands on the large red number in the action card and on the big callouts on the map, then moves down to the clinics.

## 5. Screens and flows

| # | Screen | Status |
|---|---|---|
| 1 to 2 | Onboarding: a splash, then one setup screen (district, role, language with a live waybill, safety acknowledgement). An optional 30-second tour sits on the dashboard | Built. The dashboard cannot be opened until setup is done. Design record in section 13 |
| 7 | State node dashboard | Built and clickable end to end |
| 8 | National view | Planned. The National tab is a placeholder |
| 9 | Anonymized export | Planned, optional |

Dashboard states, all built: calm, early warning (days 1 to 3), critical (day 4), transfer in transit, delivered. The delivered state is amber, not green, because 2.0 days is still under the 3-day target. The design refuses to show a false all-clear.

## 6. Key UX decisions

| Decision | Reason |
|---|---|
| Alert, plan and Approve in one card | Splitting them made the DMO hunt for the action |
| Details folded by default | The before and after bars and the rejected donors are proof, not the decision |
| Tiles are the default clinic view | A ring and a doctor pill scan faster than a row of numbers. The table is one click away |
| A supply bar with ticks at 1 and 3 days | The two thresholds that matter are visible without reading |
| Donor clinics listed with a reason for each rejection | It builds trust in the recommendation and shows the rules working |
| Violet for no doctor | A clinic with stock but no doctor cannot treat anyone. It must never look like red or green |
| Amber, not green, after a delivery under 3 days | Honest status. It tells the DMO to keep watching |
| Timeline strip labelled "Demo" | It lets a viewer jump to Approved. In a real product that would be an approval bypass |
| Local-language text carries a "not yet reviewed" chip and a back-translation | A DMO who cannot read the language can still check it |
| Sign-in and role choice before data | The user's district and language are set once, and the safety rules are acknowledged once |
| Light theme by default, dark available | Offices are bright and waybills are printed on paper. Dark stays for control-room use |

## 7. Onboarding

Decision 30 Sep 2026: onboarding is 2 screens (splash and setup) plus an optional tour, recorded in section 13. The six-step flow below, and the 3-screen version that replaced it earlier the same day, are superseded and is kept only as a record of what `design/Main.dc.html` contains.

Old flow: six steps, left rail with progress, one card on the right. The last step opens the dashboard calm, with a tip to press Advance day. The language chosen in step 3 sets the waybill language. "Replay setup" restarts it. Sign-in is simulated.

## 8. Check against generic AI-design defaults

| Generic default | What was done instead |
|---|---|
| Grid of identical rounded cards with a coloured border | Rings, a distance map and a supply bar with meaningful ticks. Tiles differ by state |
| Near-black background with one acid accent | Light theme is default. The dark theme uses one teal accent and reserves violet for a single meaning |
| Gradient washes and glassmorphism | None. Flat surfaces with one soft shadow. The dotted map grid is a functional pattern |
| All-caps eyebrow labels | Sentence case throughout |
| Monospace for small labels | Monospace only for the log |
| Charts as decoration | Each chart answers a question: who is lowest, who is too full, how fast is Rampur falling |
| Emoji as icons | None |

Tells that remain: the dark theme is close to the "dark dashboard" look, and the header plus timeline plus stats strip is three bands of chrome. Both are logged in section 10.

## 9. Design critique and accessibility review (30 Sep 2026)

Method: design-critique and accessibility-review skills, a scripted scan of both themes and the onboarding, headless-browser renders of every state.

Fixed:

- Touch targets under 44 px on the theme toggle, view switch, tabs, District B toggle, Details link and setup links.
- No landmarks or headings: banner, navigation, main and heading roles added.
- Alert changes were silent to screen readers: now a polite live region.
- The setup overlay was not marked as a dialog: now `role="dialog"` with `aria-modal`.
- The timeline could skip approval: relabelled as demo controls.

Open:

- The board is a fixed 1440 px desktop layout and does not reflow at 200% zoom or on a phone.
- The old 6-step setup let the dashboard behind it be tabbed to. The two-screen onboarding no longer sits over the dashboard: the dashboard is not in the page until setup is done (checked, section 13).
- No real screen reader or keyboard-only pass has been done.
- The map dots have no individual text status. The tiles and table carry it.

## 10. Design debt and the morning brief

1. **Onboarding: done as 2 screens and an optional tour (section 13).** Not yet reviewed by a person and not run through GStack.
2. Merge or hide the stats strip so only two bands of chrome remain above the content.
3. Standardise corner radii and chip styles.
4. Reword unclear labels: "Standby plan", "Inject crisis surge".
5. Build the National screen.
6. Responsive layout: not planned. Decided to ship as a desktop web app at 1440 px.
7. Run GStack and the Taste and Interface Design skills in Claude Code, then lock.

## 11. How to use your Claude Code skills on this

1. Frontend Design is the base layer for every UI change.
2. Use Taste as the one style driver on the dashboard with DESIGN_VARIANCE 3, MOTION_INTENSITY 2, VISUAL_DENSITY 6. The 2 onboarding screens use UI/UX Pro Max as their driver instead. Never enable both on the same screen.
3. Keep Interface Design on so these tokens persist. If a token changes, change section 3 of this file first.
4. Do not add Emil Kowalski or Designer Skills.
5. Run GStack on the onboarding and get approval before building more.

## 12. Self-check against a generic design doc

- A generic design doc lists colours and fonts. This one states what each colour means, and reserves violet for one meaning.
- A generic doc claims "accessible". This one lists what was measured, what was fixed and what is still open.
- A generic doc hides its debt. Section 10 lists it, including the parts of the screen that are still busy.
- Weak spots left honest: the Marathi, Hindi and Tamil text is unreviewed, the doctor names are sample names, and the layout is desktop only.

## 13. Onboarding design record (UI/UX Pro Max, 30 Sep 2026, second revision)

Status: **built, checked by script, not yet reviewed by a person.** It replaces the 3-screen version approved on 30 Sep 2026. A first visit opens the splash. The dashboard is not in the page until setup is finished, and no URL opens it: `#dashboard` and `#onboarding` do nothing.

### Method

| Step | What was done |
|---|---|
| Base layer | Anthropic Frontend Design |
| Style driver | UI/UX Pro Max, on these 2 screens only. Taste was not used here. Same dials as before: variance 3, motion 2, density 5. Its search script was not re-run for this revision, because the style (minimalism and Swiss) and the rules used were already chosen and recorded in the 30 Sep version |
| Fixed, not open to the skill | Brand, the semantic colours in section 3, Public Sans, the radius scale (12 panel, 8 control, 4 chip), the 1440 px desktop rule |

### The two screens and the tour

| Piece | Layout | Behaviour |
|---|---|---|
| Splash | Centred on the page ground: the logo mark, "Sanket" with "संकेत", one line ("Warns your district before a clinic runs out of anti-snake venom, then recommends a safe transfer for you to approve."), one primary button "Get started", and "Sample data. Not for clinical use." A theme button is top right | Nothing moves. The title takes focus on load |
| Setup | One card, 1120 px wide, two columns. Left: district, role, language. Right: the live waybill preview, the four safety rules, the acknowledgement checkbox. Footer: Back and "Open dashboard" | District A is preselected and labelled "Current". District B is shown as Roadmap and cannot be chosen, as before. Role is a single choice with District Medical Officer preselected, plus Facility in-charge and State programme officer. **The role is a label only.** It appears in the dashboard header and changes nothing else, and the screen says so. The language list is a 2 by 2 grid. The preview asks the real API for the chosen language and shows the Gemini waybill, its back-translation, its source ("Written by Gemini, model" or "Offline fallback used") and the "Not yet reviewed by a native speaker" chip for Marathi, Hindi and Tamil. "Open dashboard" stays disabled until the box is ticked, and a status line says why |
| Tour | A "Take a 30-second tour" button in the demo strip, beside "Inject crisis surge". It starts the same coach bar and spotlight as before: 7 moments over 30 seconds, driven by the dashboard's own model, with Pause and "End the tour" | Optional and never shown on its own. The dashboard is `inert` while it runs. It ends with "Back to dashboard", resets the demo to its calm state and puts focus at the top of the dashboard |

### Decisions

| Decision | Reason |
|---|---|
| The dashboard is a separate component that is mounted only when setup is done | "Not reachable" then holds in the page itself, not only in the URL. A `#dashboard` hash is dropped, also when it changes while the page is open |
| The setup flag is one `localStorage` key, `sanket-setup`, holding `{district, role, language}` | Setup survives a reload. A value that does not parse, or names a role or language that does not exist, counts as not set up. If storage is blocked, the code keeps setup in memory for the session and asks again next time (by design, not tested) |
| The logo is a button on the splash, the setup screen and the dashboard header. It clears the flag and returns to the splash | The rule asked for it. Its accessible name starts with the visible word ("Sanket. Clear setup and return to the start screen") |
| Back on the setup screen returns to the splash and keeps the choices | The logo also leaves setup, but it discards them, so a plain Back is needed for someone who only wants to look again |
| "Skip setup", the district map, the step indicator, the guided run inside setup and "Replay setup" were removed | Skipping conflicts with the gate. The map chose between one real district and one that cannot be chosen. The logo replaces Replay |
| Role rows carry no description | The role changes nothing, so a line such as "approve transfers" would promise access that does not exist (`CLAUDE.md`, rule 9) |
| The language was persisted with the flag | Before, a reload returned to the default language. Setup now keeps it |

### Verified on 30 Sep 2026

Run against the dev server with the API stopped, so every waybill preview used the template and said "Offline fallback used".

| Check | Result |
|---|---|
| Contrast, both themes: splash, setup in all 4 languages, the tour at 4 moments | 516 text nodes, 0 failures (4.5:1 text, 3:1 large text) |
| Contrast, dashboard with the role label and tour button, 5 states, 3 views, 4 tabs, both themes | 19,056 text nodes, 0 failures, no small targets, no horizontal overflow |
| Touch targets | Every button and radio on the new screens is at least 44 px |
| Fit | The setup card ends at 847 px in a 1440 by 900 window, so it does not scroll |
| The gate | With no flag, `#dashboard` shows the splash, the hash is removed and there is no dashboard in the page. A flag of `1`, or a flag with an unknown role, shows the splash. After setup a reload stays on the dashboard |
| The logo | On the dashboard it clears the flag and shows the splash. On the setup screen it returns to the splash. On the splash it leaves the splash in place |
| Keyboard | The splash and setup titles take focus on load. Language and role can be chosen with Space. Enter on "Open dashboard" opens the dashboard and puts focus at its heading. The primary button has a visible focus ring. The tour bar takes focus when it opens and focus returns to the dashboard heading when it ends |
| Role label | Shows in the header after setup |
| Reduced motion | 0 running animations on the setup screen |
| Accessibility tree | Read for the splash, the setup screen and the dashboard. The logo, radiogroups, checkbox and disabled button all have names and states |
| Tests | `npm test` 16 of 16, `npm run test:web` 17 of 17. Neither covers the interface, which is why the scripts in `scripts/qa/` were rewritten for this flow |

Not done: **a real screen-reader run (VoiceOver, NVDA)**, a check with the live API on the new setup screen (the earlier screen 2 was checked live and this one shares its code, but it was not re-run), native-speaker review of the three languages (`docs/LANGUAGE_REVIEW.md`), and GStack. A window narrower than 1440 px is out of scope by decision.

### Self-check against the generic defaults (section 8)

| Generic default | Result |
|---|---|
| Grid of identical rounded cards | No. Options are hairline rows with a side bar. The waybill is the only inner panel |
| Near-black background with one acid accent | No. Light is the default and dark uses the locked teal |
| Gradient washes and glassmorphism | None |
| All-caps eyebrow labels, monospace small labels | None |
| Emoji as icons | None. Icons are Phosphor |
| Em dashes, middle dots, arrows, fake numbers | None added. The waybill numbers come from the model or the API |

Tells that remain:

- A centred logo, name, one line and one button is the most familiar splash there is. It is clear and short, and it is not distinctive.
- The setup screen is dense for one screen: three choices, a live preview, four rules and a checkbox. It fits the window, and it is the price of having one screen.
- A person has not looked at either screen yet.
