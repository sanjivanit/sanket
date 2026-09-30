# Pitch deck (12 slides)

Track: **Resilience.** Numbers marked (sample) come from the demo's invented data. Numbers marked (source) have a source. Mark assumptions with an asterisk on the slide.

## 1. Title
Sanket: early warning and safe sharing of life-saving medicine across India's PHCs.
Track: Resilience. Team, event name.

## 2. The problem in a community
A farmer is bitten by a snake in the monsoon. The nearest PHC has run out of anti-snake venom, or has stock but no doctor on duty. Every hour matters.
- India had an average of about 58,000 snakebite deaths a year from 2000 to 2019. About 70% were in eight states, and half in the rainy season. (source: Suraweera et al., eLife, 2020)
- The eight higher-burden states: Bihar, Jharkhand, Madhya Pradesh, Odisha, Uttar Pradesh, Andhra Pradesh with Telangana, Rajasthan and Gujarat. (source: same study)

## 3. Why it happens
Stock, beds and staff are tracked apart. Clinics reorder on fixed cycles. An empty clinic cannot see that a neighbour has spare, in-date stock. Data cannot easily be pooled across states.

## 4. Who we help
- Patients and families in rural areas (first).
- District Medical Officers, who approve.
- PHC medical officers, who report stock by message.
- Drivers, who carry a clear waybill in their language.

## 5. The solution
Screenshot of the state-node screen. Three steps: see, warn early, share safely. A person approves every transfer.

## 6. How it works in the demo
Rampur has 6 vials. A surge hits. The system warns about 61 hours ahead (sample), recommends 16 vials from Shivpuri, 18.4 km and about 28 minutes away (sample), and the DMO approves. Rampur recovers to 2.0 days. It still shows "keep watching".

## 7. What makes it safe
Code decides, Gemini writes. A donor always keeps 3 days. A person approves. If Gemini fails, a template waybill appears. Local-language text is checked by a back-translation and marked until a native speaker reviews it.

## 8. Architecture on Google Cloud
Paste the diagram from ARCHITECTURE.md: Firebase Hosting, Cloud Run, Secret Manager, Gemini API, Cloud Logging. Roadmap: Firestore, BigQuery ML.

## 9. Google AI at work
Four Gemini jobs: donor reasoning, multilingual waybill with back-translation, early-warning brief, WhatsApp-style stock check-in in any Indian language. Structured JSON output, schema checked by code.

## 10. Built for India, across states
Two state nodes (Maharashtra, Tamil Nadu), three local languages, a national view. Federated averaging: only a threshold and a count leave a state. India had about 25,650 functioning PHCs as of March 2017 (source: Rural Health Statistics). Pilot first in the highest-burden states.

## 11. Ready to pilot in weeks
One district, 8 to 12 clinics. Clinics report by WhatsApp message. The DMO approves in the app. No new hardware. What we would measure: warning lead time, time to approval, transfers that kept the donor at 3 days or more.
Risks we know: clinics may not report, donors may not give, data is sample today.

## 12. Impact, roadmap, team
Impact we can claim now: a working prototype, tested rules, and a deployable design. Impact we cannot claim yet: lives saved. Roadmap: real data feeds, trained forecast, multi-donor split, native-language review, a two-week pilot with one DMO office.

## Numbers to mark as assumptions*
- "Today's warning: about 0 h"
- "Central restock: 14 to 21 days"
Remove the asterisk only when you have a source.
