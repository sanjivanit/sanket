# DESIGN.md: Sanket

Status: locked for the submission build. Decisions on 30 Sep 2026: onboarding stays as built, and Sanket is a desktop web app fixed at 1440 px wide (no responsive layout for now). Section 10 lists what remains as debt.
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
| UI/UX Pro Max | No | Only one style driver is allowed. Taste is the driver because the desired feel is known precisely |
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
| 1 to 6 | Onboarding: sign in, role, district and language, clinic data, safety rules, ready | Built. Reopened for redesign (section 10) |
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

## 7. Onboarding as built

Six steps, left rail with progress, one card on the right. The last step opens the dashboard calm, with a tip to press Advance day. The language chosen in step 3 sets the waybill language. "Replay setup" restarts it. Sign-in is simulated.

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
- While setup is open, the dashboard behind it can still be tabbed to. The real app should use `inert`.
- No real screen reader or keyboard-only pass has been done.
- The map dots have no individual text status. The tiles and table carry it.

## 10. Design debt and the morning brief

1. **Onboarding: decided to keep as built for the submission.** The ideas below are kept for later, not scheduled:
   - One screen that changes as you answer. Pick your district by tapping the map. The map and a sample dashboard preview build behind the card as choices are made.
   - Choosing a language shows the waybill in that language live, with its "not reviewed" status.
   - Fewer steps: merge role and district, and fold the safety rules into a single acknowledgement on the last card.
   - A 30-second guided first run that plays the surge for you (a skip button stays visible).
   - Keep sign-in honest: real Google sign-in is Firebase Authentication.
2. Merge or hide the stats strip so only two bands of chrome remain above the content.
3. Standardise corner radii and chip styles.
4. Reword unclear labels: "Standby plan", "Inject crisis surge".
5. Build the National screen.
6. Responsive layout: not planned. Decided to ship as a desktop web app at 1440 px.
7. Run GStack and the Taste and Interface Design skills in Claude Code, then lock.

## 11. How to use your Claude Code skills on this

1. Frontend Design is the base layer for every UI change.
2. Use Taste as the one style driver with DESIGN_VARIANCE 3, MOTION_INTENSITY 2, VISUAL_DENSITY 6. Do not also enable UI/UX Pro Max on the same screen.
3. Keep Interface Design on so these tokens persist. If a token changes, change section 3 of this file first.
4. Do not add Emil Kowalski or Designer Skills.
5. Generate the redesigned onboarding as a proof screen, run GStack on it, and get approval before building more.

## 12. Self-check against a generic design doc

- A generic design doc lists colours and fonts. This one states what each colour means, and reserves violet for one meaning.
- A generic doc claims "accessible". This one lists what was measured, what was fixed and what is still open.
- A generic doc hides its debt. Section 10 lists it, including the parts of the screen that are still busy.
- Weak spots left honest: the Marathi, Hindi and Tamil text is unreviewed, the doctor names are sample names, and the layout is desktop only.
