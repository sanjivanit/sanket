# Submission checklist audit

Today is 30 Sep 2026. The prototype submission phase in the guide ends on 30 Sep 2026. Check the portal now for the exact cut-off time.

## Mandatory Submission Checklist

| Requirement | Status | What is done | What you must still do |
|---|---|---|---|
| Theme alignment: one official track | Met | Track is **Resilience**: health supply-chain resilience for PHCs. Stated at the top of README and slide 1 | Pick "Resilience" if the form asks for a track |
| Public GitHub repo with app logic, prompt configs and run instructions | Ready to publish | App logic: `server/engine.js`, `server/app.js`. Prompt configs: `prompts/`, `schemas/`, `config/`. Instructions: `README.md`. 14 passing tests | Create a public repo, push the repo folder plus the Lovable app. Paste the repo link into the form |
| Architecture overview: Google Cloud with Gemini | Written | `ARCHITECTURE.md` has a diagram and a walk-through: Firebase Hosting, Cloud Run, Secret Manager, Gemini API, Cloud Logging | Deploy it (README, "Deploy on Google Cloud"). Put the diagram on slide 8 |
| Pitch deck: how it helps real communities | Drafted | `docs/PITCH_DECK.md` has 12 slides with a community-impact slide and sourced numbers | Build the slides. Add screenshots. Export as PDF |

## Earlier guide items

| Item | Status | Still to do |
|---|---|---|
| Demo video, 3 to 5 minutes | Script written in `Sanket_Solution_v2.md` | Record it on the live link |
| Deployed link | Not deployed | Deploy (about 20 minutes if billing is enabled) |
| 2 to 3 line description | Written (see below) | Paste it |
| Google AI mandatory | Met by design: Gemini does real work in 4 jobs | Confirm it works with your key |
| Built for India, multi-state | Maharashtra and Tamil Nadu nodes, 3 languages, federated design | Note the 8 highest-burden states in the deck |
| Multilingual | English plus Marathi, Hindi, Tamil templates | Native speaker review, then set `verified: true` |
| Real or realistic data | Sample data, labelled | Optional: swap in real facility names from data.gov.in |

**2 to 3 line description:** Sanket is a federated health-resource platform for India's PHC network. It forecasts stock-outs, warns early, and recommends clinic-to-clinic transfers for a District Medical Officer to approve, with Gemini writing the multilingual dispatch on Google Cloud.

## Order of work for today

1. Check the portal for the cut-off time (2 minutes).
2. Create the public GitHub repo and push (10 minutes).
3. Deploy: Secret Manager, Cloud Run, Firebase Hosting (20 to 40 minutes, longer if billing or credits need sorting).
4. Run the live-link test: Reset, Advance day x4, Approve, Mark delivered, Light/Dark, Tamil Nadu.
5. Record the video (20 minutes).
6. Build and export the deck (40 minutes).
7. Submit. Submit early, then improve if there is time and the form allows edits.

## If you run short

Submit with what exists. Cut in this order: message check-in, deck polish, native-speaker review (keep the "not yet reviewed" chip), federated panel. Keep the live link, the repo and the architecture page. Those are mandatory.

## Not verified

- Not deployed and not tested against the live Gemini API. The tests use a stand-in for Gemini.
- The Gemini model ID (`gemini-3.5-flash`) must be confirmed in Google AI Studio. The older `gemini-2.5-flash` is scheduled for retirement and may not be available to new keys.
- Cloud Run and Secret Manager need billing on the project. Confirm your credits.
- Marathi, Hindi and Tamil text has not been reviewed by a native speaker.
