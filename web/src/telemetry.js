// The anonymised telemetry a state node could share. It carries no facility names, no staff, no patient data
// and no exact coordinates. A test checks this list of keys, so a new field cannot slip in unnoticed.
//
// ICD-11 code: looked up in the WHO ICD-11 MMS tabulation (release file dated 2026 Sep 29 UTC). ICD-11 has no single
// "snakebite envenoming" category there. The agent is coded with the extension code XM4KN1 "Snake venom"
// (the WHO title). Whether a coder would also add a harm or external-cause code is a question for a clinical
// coder, not for this app. See docs/REAL_DATA.md.
export const ICD11 = { code: 'XM4KN1', title: 'Snake venom', kind: 'ICD-11 MMS extension code, agent' };

export const TELEMETRY_KEYS = ['icd11Code', 'icd11Title', 'surgeVelocityVisitsPerDay', 'surgeClass', 'affectedFacilitiesBucket', 'districtLatLng', 'weekOfYear', 'sharedThreshold', 'dataSource'];

export const isoWeek = (d) => {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  return Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7);
};

const bucket = (n) => (n === 0 ? '0' : n <= 5 ? '1-5' : '6+');
const one = (x) => Math.round(x * 10) / 10;

// v: a view from buildView. ds: its data set. Nothing is read from a facility except its number of days of supply.
export function buildTelemetry(v, ds, today = new Date()) {
  const h = v.history;
  const affected = v.rowsA.concat(v.rowsB).filter((r) => r.dsr < 3).length;
  const lat = ds.all.reduce((a, c) => a + c.lat, 0) / ds.all.length;
  const lng = ds.all.reduce((a, c) => a + c.lng, 0) / ds.all.length;
  return {
    icd11Code: ICD11.code,
    icd11Title: ICD11.title,
    surgeVelocityVisitsPerDay: one(h[h.length - 1] - h[h.length - 2]),
    surgeClass: v.status === 'crit' ? 'critical' : v.status === 'warn' ? 'early_warning' : 'normal',
    affectedFacilitiesBucket: bucket(affected),
    districtLatLng: [one(lat), one(lng)],
    weekOfYear: isoWeek(today),
    sharedThreshold: 0.129,
    dataSource: ds.source.mode === 'csv' ? 'imported' : 'simulated',
  };
}
