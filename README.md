# Sanket (संकेत)

Sanket means "signal". It is the early signal that a health centre is about to run out of medicine.

**Track: Resilience** (Code for Communities 2.0, Smart Health and Supply Chain Resilience)

Sanket warns a District Medical Officer (DMO) before a Primary Health Centre (PHC) runs out of a life-saving medicine, then recommends a safe clinic-to-clinic transfer for the DMO to approve. The demo uses anti-snake venom (ASV) in monsoon season.

- Live app: `ADD LINK AFTER DEPLOY`
- Demo video: `ADD LINK`
- Pitch deck: `ADD LINK`
- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)

> All clinic, stock, bed and doctor data is **sample data** invented for the demo. Not for clinical use.

## What it does

1. Shows medicine stock, beds and doctor attendance per clinic (the Triad of Care).
2. Forecasts footfall and warns when a clinic is projected to run out within 72 hours.
3. Recommends a transfer: same district within 35 km first, then a neighbouring district within 80 km (two DMO approvals). A donor always keeps at least 3 days of its own supply.
4. Gemini explains the choice and writes the waybill in English plus Marathi, Tamil or Hindi. It can also read a clinic's WhatsApp-style stock message.
5. Each state runs its own node. States share only a warning threshold and a sample count (federated averaging), never clinic records.

## Where Gemini is used, and where code guards it

| Job | Gemini does | Plain code does |
|---|---|---|
| Dispatch | Picks one donor from a list that already passed every rule, explains why | Finds eligible donors, sets vial count, dispatch ID and restock token, rejects a bad pick |
| Waybill | Writes a short reason in the local language | Writes drug name, vial count and temperature from templates |
| Language check | Translates the local text back to English for the DMO | Flags languages not yet reviewed by a native speaker |
| Early warning | Writes a 2-sentence alert from real numbers | Calculates the forecast and decides whether to warn |
| Check-in | Reads a stock message in any Indian language | Asks for confirmation when confidence is under 0.7 |

If Gemini fails or takes over 8 seconds, a template waybill is returned and the log says `gemini_fallback`.

## Repository map

| Path | What is in it |
|---|---|
| `server/` | Cloud Run API: `engine.js` (all safety rules), `gemini.js` (Gemini client), `templates.js`, `app.js` (routes) |
| `prompts/` | **Prompt configs**: one system prompt per Gemini job |
| `schemas/` | JSON schemas that force Gemini's structured output |
| `config/` | `rules.json` (thresholds) and `languages.json` (waybill templates and review status) |
| `data/` | Sample clinics for Maharashtra and Tamil Nadu, surge scenarios, federated inputs |
| `test/` | 16 API tests (rules, guardrails, fallback, federated maths) and 17 web tests (the dashboard model against the design, and live API answers) |
| `web/` | The React web app (Vite): dashboard, 3-screen onboarding, and the calls to the API |
| `design/` | The approved design prototype (`Main.dc.html`), kept as a read-only reference |
| `firebase.json`, `Dockerfile` | Firebase Hosting and Cloud Run deployment |
| `docs/` | PRD, design, engineering, plan, progress, checklist, user journey, pitch deck text |
| `CLAUDE.md` | Instructions for Claude Code |

## Run it locally

Needs Node 20 or newer. No dependencies to install for the API.

```bash
npm test                                   # 16 API tests, no key needed
npm run test:web                           # 17 tests for the web app's model and its use of API answers, no key needed
cp .env.example .env                       # add GEMINI_API_KEY from Google AI Studio
export $(grep -v '^#' .env | xargs)
npm start                                  # API on http://localhost:8080
curl http://localhost:8080/api/health
```

Try a dispatch (use the sample data in `data/`):

```bash
node -e "
const fs=require('fs');const d=JSON.parse(fs.readFileSync('data/maharashtra.json'));
d.clinics[0].footfallToday=110;
console.log(JSON.stringify({stateCode:'MH',clinics:d.clinics,recipientId:'MH-01',language:'mr',counter:1}))" \
| curl -s -X POST localhost:8080/api/dispatch -H 'content-type: application/json' -d @- | head -c 1500
```

Expected: `status: recommended`, `vials: 16`, donor `PHC Shivpuri`, ETA 28 minutes.

## Deploy on Google Cloud

Firebase Hosting serves the web app. It forwards `/api/**` to a Cloud Run service. The Gemini key sits in Secret Manager.

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com secretmanager.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# 1. Store the key
printf %s "YOUR_GEMINI_KEY" | gcloud secrets create gemini-api-key --data-file=-

# 2. Deploy the API (from the repo root, where the Dockerfile is)
gcloud run deploy sanket-api --source . --region asia-south1 --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest --set-env-vars GEMINI_MODEL=gemini-3.5-flash-lite,GEMINI_FALLBACK_MODEL=gemini-3.1-flash-lite
# If it says the service account cannot read the secret:
# gcloud secrets add-iam-policy-binding gemini-api-key \
#   --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"

# 3. Deploy the web app
npm run build                              # creates dist/
cp .firebaserc.example .firebaserc         # put your project ID in it
npx firebase-tools deploy --only hosting
```

Then open `https://YOUR_PROJECT_ID.web.app` and check `/api/health`. Cloud Run and Secret Manager need billing enabled on the project. Check whether your hackathon credits cover it.

Model: the API tries `GEMINI_MODEL` (default `gemini-3.5-flash-lite`) first and `GEMINI_FALLBACK_MODEL` (default `gemini-3.1-flash-lite`) second, 8 seconds each, and returns the template waybill if both fail. On 30 Sep 2026 `gemini-3.5-flash` returned 503 "high demand" on a test call, which is why the defaults are the lite models. Google's docs (checked 30 Sep 2026) list `gemini-2.5-flash` for retirement from 16 Oct 2026 and limit new users' access to 2.5 models, and recommend newer models for new projects. Confirm the exact model ID in Google AI Studio and set `GEMINI_MODEL` or `GEMINI_FALLBACK_MODEL` if you prefer others.

Region: the commands use `asia-south1` (Mumbai), which Cloud Run supports. Firebase Hosting can only forward to some Cloud Run regions. If the Hosting deploy rejects the region, redeploy Cloud Run in `us-central1` and change the region in `firebase.json`. Firebase Hosting also cuts a request off after 60 seconds, which is why Gemini calls time out at 8 seconds.

## Frontend

Sanket is a desktop web app, designed at 1440 px wide. The design is in `design/Main.dc.html` and the API shapes are in `docs/API_CONTRACT.md`. The React app in `web/` is built from that design and calls `/api/dispatch` and `/api/warning-brief`. In development run the API (`npm start`) and the web app (`npm run dev:web`) together: Vite proxies `/api` to port 8080. `npm run build` writes `dist/` for Firebase Hosting. If the API cannot be reached, or Gemini fails, the app shows the template waybill and the words "Offline fallback used". A first visit opens a 3-screen onboarding. Status is tracked in `docs/PROGRESS.md`.

## Honest limits

- All data is sample data. No live feed of PHC stock, beds or doctor attendance was found, so live data is simulated.
- The forecast is a straight-line trend on 5 days. The production path is BigQuery ML (AI.FORECAST with TimesFM) or Vertex AI.
- Federated averaging is simulated in one service. Each state's inputs are separate, and only two numbers cross.
- Each warning step in the demo is a snapshot. If stock falls between steps, the warning lead time shrinks.
- Marathi, Hindi and Tamil templates are marked `verified: false` in `config/languages.json` until a native speaker reviews them. The review pack is `docs/LANGUAGE_REVIEW.md`.
- Not yet tested against the live Gemini API from this repo. The tests use a stand-in.
- "Today: about 0 h warning" and "central restock: 14 to 21 days" are assumptions and need a source.
