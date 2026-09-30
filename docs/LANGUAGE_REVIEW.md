# Language review pack: Marathi, Hindi, Tamil

Status on 30 Sep 2026: **not reviewed.** No native speaker has read these templates. The app marks all three "Not yet reviewed by a native speaker" until that changes. This file is the whole job for the reviewer. It should take about 10 minutes per language.

Why it matters: this text goes on a waybill that a person may follow to move anti-snake venom. Code, not Gemini, writes the drug name, the vial count and the temperature (rule 1 in `CLAUDE.md`), so a reviewer is checking a fixed sentence, not open-ended text.

## What to review

The waybill sentence is a template in `config/languages.json`. Three things fill it in: the donor clinic, the recipient clinic and the number of vials. The temperature range is always 2 to 8 °C.

The reviewer does not need to read code. The sentences below are what appears on screen.

### Marathi (mr)

| Case | Sentence on the waybill |
|---|---|
| 16 vials | PHC Shivpuri येथून PHC Rampur येथे 16 कुपी अँटी-स्नेक व्हेनम (ASV) पोहोचवा. 2 ते 8 °C तापमान राखा. |
| 1 vial | PHC Shivpuri येथून PHC Rampur येथे 1 कुपी अँटी-स्नेक व्हेनम (ASV) पोहोचवा. 2 ते 8 °C तापमान राखा. |

Word parts: vial `कुपी` (same singular and plural), range word `ते`.

### Hindi (hi)

| Case | Sentence on the waybill |
|---|---|
| 16 vials | PHC Shivpuri से PHC Rampur तक 16 शीशी एंटी-स्नेक वेनम (ASV) पहुँचाएँ। तापमान 2 से 8 °C रखें। |
| 1 vial | PHC Shivpuri से PHC Rampur तक 1 शीशी एंटी-स्नेक वेनम (ASV) पहुँचाएँ। तापमान 2 से 8 °C रखें। |

Word parts: vial `शीशी` (same singular and plural), range word `से`.

### Tamil (ta)

| Case | Sentence on the waybill |
|---|---|
| 16 vials | PHC Shivpuri இலிருந்து PHC Rampur க்கு 16 குப்பிகள் பாம்புக்கடி எதிர்ப்பு மருந்து (ASV) கொண்டு செல்லவும். 2 முதல் 8 °C வெப்பநிலையில் வைக்கவும். |
| 1 vial | PHC Shivpuri இலிருந்து PHC Rampur க்கு 1 குப்பி பாம்புக்கடி எதிர்ப்பு மருந்து (ASV) கொண்டு செல்லவும். 2 முதல் 8 °C வெப்பநிலையில் வைக்கவும். |

Word parts: vial `குப்பி` (singular) and `குப்பிகள்` (plural), range word `முதல்`.

## Questions for the reviewer

Answer yes or no for each language, and write a fix if the answer is no.

1. Would a clinic pharmacist or nurse in the state understand the sentence at once, with no second reading?
2. Is the drug named the way clinics name it? The template uses a transliteration of "anti-snake venom" plus the letters ASV. Is there a more familiar local term that should replace or sit beside it?
3. Is the verb form right for an instruction from an officer to staff (polite, not too formal, not rude)?
4. Do the place words (`येथून … येथे`, `से … तक`, `இலிருந்து … க்கு`) read correctly next to a clinic name written in Latin letters?
5. Is the vial word right, and is the singular and plural handling right (Tamil has two forms)?
6. Is the temperature phrase clear? Is `2 ते 8 °C`, `2 से 8 °C` or `2 முதல் 8 °C` how people write a range?
7. Does anything look wrong on screen (broken letters, wrong line breaks)? Check it in the app at step "Day 4" on the Waybill tab.

Also check the English back-translation the app shows beside each sentence. It is written by Gemini as a second opinion for a reader who cannot read the language. If it says something different from what the sentence means, note it here.

Not covered here: Gemini also writes a short local-language reason for the donor choice. The app does not show that text today. If it is ever shown, it needs its own review.

## Sign-off

Fill in one row per language. Leave the row empty if the language is not reviewed.

| Language | Reviewer name | Role | Date | Result | Changes needed |
|---|---|---|---|---|---|
| Marathi | | | | | |
| Hindi | | | | | |
| Tamil | | | | | |

## After a language passes

1. Apply any changes to that language's `instruction`, `vialWord` or `rangeWord` in `config/languages.json`.
2. In the same entry, set `"verified": true` and put the reviewer's real name in `"reviewer"`. Never set `verified` to true without a named reviewer.
3. Run `npm test`, then check the Waybill tab in the app. The grey "Not yet reviewed" chip disappears for that language.
4. Update `docs/PROGRESS.md` (known issue 2) and the "Honest limits" line in `README.md`.

Until then, leave `verified` as `false`. Do not change it to make a demo look better.
