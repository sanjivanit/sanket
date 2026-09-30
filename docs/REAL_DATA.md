# REAL_DATA.md: from simulated to real data

Status on 30 Sep 2026. The Mayurbhanj pilot runs on **simulated** numbers. This file says what was checked against public sources, what can become real without a partner, and what cannot.

## What "simulated" means here

`data/odisha-mayurbhanj.json` holds six facilities. Stock, beds, staffing, burn rates, batches, expiry dates and visit counts are invented for the demo. Every screen that shows them carries a "Simulated data" label. After a CSV import the label reads "Imported data: <file name>".

Facility names were checked against public sources. Positions are approximate. The table below says which is which.

## The six facilities: what was checked

Sources used on 30 Sep 2026:

- **Official list**: Odisha Health and Family Welfare Department, "List of major health institutions", Mayurbhanj (`health.odisha.gov.in/sites/default/files/2020-03/mayurbhanj.pdf`, 2020). Gives the facility type and block.
- **OpenStreetMap** (queried through Nominatim and Overpass). Gives a mapped position for some facilities.
- The ABDM Health Facility Registry and NHM Odisha were **not** checked. The Registry was not tried, and no NHM Odisha facility list came up in a web search. Checking the Registry is the first step to make the names fully verified.

| Facility in the data | Name | Block | Position |
|---|---|---|---|
| PHC Badasahi | **Not verified.** The official list and OpenStreetMap show **CHC Badasahi** (Badasahi block). No PHC with this name was found | Badasahi block (official list) | Approximate. Anchored at the OpenStreetMap position of CHC Badasahi (node 7048704978) |
| CHC Betnoti | Verified (official list, OpenStreetMap node 7087495315) | Betnoti block | Approximate. Real position in the next table |
| CHC Khunta | Verified (official list, OpenStreetMap node 7074150972) | **Unclear.** The official list places CHC Khunta under Gopabandhunagar block, and Khunta is also a block name | Approximate |
| SDH Udala | Verified (official list, OpenStreetMap node 7087305303; also mapped as Kaptipada Sub-divisional Hospital) | Udala | Approximate |
| PHC Baripada Rural | **Not verified.** No facility with this name in the official list or OpenStreetMap | Baripada (assumed from the name) | Approximate. The direction was chosen so the map is readable |
| CHC Dukura | Verified (official list, OpenStreetMap node 7081842675) | Khunta block | Approximate |

### Why the coordinates are approximate

The demo brief fixes the distance from PHC Badasahi to each facility (16.4, 22.8, 29.5, 24.1 and 31.0 km). The real positions do not give those distances. The engine measures distance in a straight line from coordinates, so each facility is placed at the stated distance along its real compass bearing from Badasahi (except Baripada Rural, see above). The map is to scale for those distances and is not a survey.

Real straight-line distances from the CHC Badasahi position, from OpenStreetMap:

| Facility | OpenStreetMap position | Real distance | Stated in the data |
|---|---|---|---|
| CHC Betnoti | 21.7429, 86.8504 | 11.6 km | 16.4 km |
| CHC Khunta | 21.7125, 86.6245 | 12.0 km | 22.8 km |
| SDH Udala | 21.5767, 86.5650 | 24.6 km | 29.5 km |
| CHC Dukura | 21.7909, 86.6599 | 10.9 km | 31.0 km |

**Decision for you:** with real positions the nearest donor would be CHC Dukura at 10.9 km, not CHC Betnoti, and the demo story changes. To switch, replace `lat` and `lng` in the JSON with the real values above, remove `"coordinates": "approximate"`, and update the tests that assert 16.4, 22.8, 29.5, 24.1 and 31.0.

## What can be real today, and what needs a partner

| Layer | Real today? | Source | Notes |
|---|---|---|---|
| Facility names and types | Yes | Odisha health department list, ABDM Health Facility Registry | The 2020 list may be out of date. The Registry was not checked |
| Blocks | Yes | Same, plus Census or LGD codes | Check the Khunta and Gopabandhunagar case above |
| Coordinates | Partly | OpenStreetMap for many CHCs and hospitals, the Registry for others | Some PHCs are not mapped. Positions from OpenStreetMap are volunteer-mapped, so spot-check them |
| ASV stock and batch | **No, needs a partner** | The district or state medical store, or whatever stock system it uses | Live numbers. A daily CSV from the district store would be enough to start |
| Baseline burn per day | **No, needs a partner** | Past issue registers from each facility | Real history is needed before any forecast is trusted |
| Beds total and occupied | Total: partly, from the Registry. Occupied: **needs a partner** | Facility or district hospital reporting | Occupied changes daily |
| Medical officer on duty | **No, needs a partner** | A roster or attendance record kept by the district | Sensitive. Share a yes or no, never a name |
| Daily visits for snakebite | **No, needs a partner** | Facility registers, HMIS | Needed for the early warning |

## The data-source layer

`web/src/dataSource.js` is the one way the app gets its data.

- **simulated** (default): `data/odisha-mayurbhanj.json`.
- **csv**: a file the person picks with "Import CSV" on the Facilities panel. It is read in the browser and never uploaded. It replaces the simulated numbers and switches the label to "Imported data: <file name>". "Use simulated data" goes back.

Both modes give the same shape, so the model, map and API calls do not change. The template is `data/templates/facilities.csv` (also the "Template" button).

### Columns

| Column | Required | Notes |
|---|---|---|
| `facility_name` | Yes | |
| `block` | Yes | Stored, not shown |
| `latitude`, `longitude` | Yes | Decimal degrees. Distances are straight-line |
| `asv_stock` | Yes | Whole number of vials, 0 or more |
| `baseline_burn_per_day` | Yes | Vials a day in a normal week |
| `beds_total`, `beds_occupied` | Yes | Occupied cannot exceed total |
| `doctor_on_duty` | Yes | yes/no or true/false. No names |
| `batch_number`, `expiry_date` | No | If `expiry_date` is missing the batch expiry is **not checked**, and the import says so |

### Rules the import follows

- The **first row** is the surge target. The rest can donate. The demo surge is applied to the first row.
- At least 2 and at most 50 facilities. Bad rows are refused with the row and column named. Nothing is imported partly.
- Normal visits are set to 20 a day everywhere, because they are not in the file. The surge is always simulated.
- All rows count as one district. The 35 km and 80 km rules and the safety rules in `server/engine.js` are unchanged.

## Next steps

1. Ask the Mayurbhanj district office for one real daily file with the columns above. Keep it as CSV.
2. Replace names, blocks and coordinates with registry values first. That needs no partner.
3. Only then replace stock, beds and staffing with the partner's numbers. Keep the "Imported data" label. Do not call anything "live" until it is fed automatically.
4. Have a clinical coder confirm the telemetry disease code (see below) before real use.

## Telemetry code

The anonymised telemetry (`web/src/telemetry.js`) names the condition with **ICD-11 extension code XM4KN1, "Snake venom"**. It was looked up in the WHO ICD-11 MMS tabulation file (release dated 2026 Sep 29 UTC, downloaded from `icd.who.int/dev11/Downloads`). ICD-11 has no single "snakebite envenoming" category in that file. A search result that suggested `XM4MC9` was checked and **does not exist** in the WHO file, so it was not used. The injury chapter has `NE61` (harmful effects of noxious substances, chiefly nonmedicinal as to source) and the external-cause category `PA78` (unintentionally stung or envenomated by animal). Whether a coder would use those with XM4KN1 is not decided here.

The payload holds only: the code and title, surge velocity (visits a day), surge class, a bucket for the number of affected facilities, the district position to one decimal place, the week of the year, the shared threshold and whether the data is simulated or imported. It holds no facility names, no staff, no patient data and no exact coordinates. `test/web-model.test.js` checks that.
