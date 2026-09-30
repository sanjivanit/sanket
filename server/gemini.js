// Thin Gemini API client (REST). Structured JSON output, timeout, and a small schema check.
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

const upper = (s) => {
  if (Array.isArray(s)) return s.map(upper);
  if (s && typeof s === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(s)) o[k] = k === 'type' && typeof v === 'string' ? v.toUpperCase() : upper(v);
    return o;
  }
  return s;
};
export const toGeminiSchema = upper;

export function validate(value, schema, path = 'value') {
  const t = schema.type;
  if (value === null) { if (schema.nullable) return; throw new Error(`${path} is null`); }
  if (t === 'object') {
    if (typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path} is not an object`);
    for (const k of schema.required || []) if (!(k in value)) throw new Error(`${path}.${k} is missing`);
    for (const [k, sub] of Object.entries(schema.properties || {})) if (k in value) validate(value[k], sub, `${path}.${k}`);
  } else if (t === 'string') { if (typeof value !== 'string') throw new Error(`${path} is not a string`); }
  else if (t === 'boolean') { if (typeof value !== 'boolean') throw new Error(`${path} is not a boolean`); }
  else if (t === 'integer') { if (!Number.isInteger(value)) throw new Error(`${path} is not an integer`); }
  else if (t === 'number') { if (typeof value !== 'number') throw new Error(`${path} is not a number`); }
}

export async function callGemini({ apiKey, model, system, user, schema, timeoutMs = 8000, fetchImpl = fetch }) {
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(`${BASE}/${model}:generateContent`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: typeof user === 'string' ? user : JSON.stringify(user) }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: toGeminiSchema(schema), temperature: 0.2 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini returned no text');
    const parsed = JSON.parse(text);
    validate(parsed, schema);
    return parsed;
  } finally {
    clearTimeout(timer);
  }
}
