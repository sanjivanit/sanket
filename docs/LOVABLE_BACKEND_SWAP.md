# Lovable: use the Cloud Run API instead of a Supabase function

Use this in place of the old prompt that asked for a Supabase Edge Function. The web app calls the same-origin path `/api/...`. Firebase Hosting forwards it to Cloud Run.

## Paste into Lovable

Do not use Supabase or any backend inside Lovable. All AI calls go to the same-origin paths below with `fetch`. Keep the engine rules in `engine.ts` for the on-screen numbers.

1. `POST /api/dispatch`
   Body: `{ "stateCode": "MH", "clinics": [ ...all clinics with today's footfall ], "recipientId": "MH-01", "language": "mr", "counter": 1 }`
   Response fields to show: `status` (`recommended`, `no_transfer_needed`, `no_donor`), `tier`, `approvalsRequired`, `donor` (`name`, `distanceKm`, `etaMinutes`, `keepsDaysAfter`), `vials`, `batchNumber`, `expiryDate`, `coldChain`, `waybill.english`, `waybill.local`, `waybill.languageName`, `waybill.languageVerified`, `waybill.backTranslation.instruction.english`, `reasoning.english`, `dispatchId`, `restockToken`, `source`, `rejected`.
   Show a green chip "English back-translation matches" only when `backTranslation.instruction` exists. If `languageVerified` is false show a grey chip "Not yet reviewed by a native speaker".
2. `POST /api/warning-brief` with `{ "clinic": {...}, "history": [14 daily footfall numbers], "threshold": 0.129 }`. Show `brief.headline`, `brief.explanation`.
3. `POST /api/checkin` with `{ "message": "...", "knownClinics": ["PHC Rampur", ...] }`. If `needsConfirmation` is true, show the parsed values and ask the user to confirm. If `ok` is false show the `error` text.
4. `POST /api/federated` with `{ "nodes": [{ "state": "MH", "threshold": 0.12, "sampleCount": 11 }, { "state": "TN", "threshold": 0.18, "sampleCount": 5 }] }`. Show `global` and `perNode`.

Never show a raw error. If a call fails, show the offline template waybill and the text "Offline fallback used".
There is no API key field anywhere in the app.

## Data contract for each clinic

`id, name, stateCode, districtId, lat, lng, stock, baselineBurn, bedsTotal, bedsOcc, doctorOnDuty, doctorName, baselineFootfall, footfallToday, batchNumber, expiryDate`. See `data/maharashtra.json`.
