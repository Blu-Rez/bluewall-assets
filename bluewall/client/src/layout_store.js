// layout_store.js — TR2-S5: the player's OWN map layout = only the things he moved.  Pure data (no THREE, no DOM, no imports): runs in the game, in node tests and (as a spec) on the server.
//
//   record  { v: 1, g: <plan id>, m: { "<record id>": [x, z, ry], ... } }      (x, z in metres, 2 decimals; ry in radians, 3 decimals)
//   a record id is the id the game already uses: "cottage_03", "tavern_00", "sawmill_00" (the town plan's lots), "store_wood" … "store_food" (the six storehouses).
//   MISSING id = the default place (the plan the game computes from the map) — an empty record = the default layout.  A layout is therefore always small: ≤ MAX_BYTES (8 KB) ≈ 190 moved things.
//   `g` = which default plan the overrides were made against (planId(): a hash of the default records' ids + the map); a record with another `g` is still read, but an id that no longer exists is dropped.
//
// The modules that place things (town_plan.js, stores.js, worksites.js via town_plan.js) read ovr(id) when they hand out a record; rev() tells them when to forget their caches.
export const LAYOUT_V = 1, MAX_BYTES = 8192;
const OVR = new Map(); let REV = 0; const SUBS = new Set();
const r2 = (v) => Math.round(v * 100) / 100, r3 = (v) => Math.round(v * 1000) / 1000;
const bump = () => { REV++; for (const f of SUBS) { try { f(REV); } catch (e) { console.warn('layout subscriber', e); } } };
export const quant = (x, z, ry) => ({ x: r2(x), z: r2(z), ry: r3(ry) });                 // the numbers as they are STORED: a pose is checked (and drawn) at these, never at the unrounded ones
export const rev = () => REV;
export const ovr = (id) => OVR.get(id) || null;                 // [x, z, ry] or null (= the default place)
export const count = () => OVR.size;
export const ids = () => [...OVR.keys()];
export const subscribe = (f) => { SUBS.add(f); return () => SUBS.delete(f); };
export function setOne(id, x, z, ry) { OVR.set(id, [r2(x), r2(z), r3(ry)]); bump(); return OVR.get(id); }
export function clearOne(id) { if (OVR.delete(id)) bump(); }
export function clearAll() { if (OVR.size) { OVR.clear(); bump(); } }
export function getLayout(g = null) {                           // the record to save (sorted ids: the same layout is the same bytes)
  const m = {}; for (const id of [...OVR.keys()].sort()) m[id] = OVR.get(id).slice();
  const o = { v: LAYOUT_V }; if (g) o.g = g; o.m = m; return o;
}
export const sizeOf = (rec) => JSON.stringify(rec).length;
// shape check only (the rules — dry, off the streets, no overlap … — are layout_rules.js): { ok, why }
export function shapeOk(rec) {
  if (!rec || typeof rec !== 'object') return { ok: false, why: 'not an object' };
  if (rec.v !== LAYOUT_V) return { ok: false, why: 'version' };
  if (!rec.m || typeof rec.m !== 'object' || Array.isArray(rec.m)) return { ok: false, why: 'm' };
  if (sizeOf(rec) > MAX_BYTES) return { ok: false, why: 'size' };
  for (const [id, a] of Object.entries(rec.m)) {
    if (!/^[a-z0-9_]{1,32}$/.test(id)) return { ok: false, why: 'id ' + id };
    if (!Array.isArray(a) || a.length !== 3 || a.some((v) => typeof v !== 'number' || !isFinite(v))) return { ok: false, why: 'triple ' + id };
    if (Math.abs(a[0]) > 5000 || Math.abs(a[1]) > 5000 || Math.abs(a[2]) > 20) return { ok: false, why: 'range ' + id };
  }
  return { ok: true };
}
// replace the whole layout (a loaded record).  accept(id, [x, z, ry]) -> true | false lets the caller drop what no longer fits (unknown id, rules): returns { applied, dropped: [ids] }.
export function setLayout(rec, accept = null) {
  const s = shapeOk(rec); if (!s.ok) return { applied: 0, dropped: [], error: s.why };
  const next = new Map(), dropped = [];
  for (const [id, a] of Object.entries(rec.m)) { const t = [r2(a[0]), r2(a[1]), r3(a[2])]; if (accept && !accept(id, t)) { dropped.push(id); continue; } next.set(id, t); }
  const same = next.size === OVR.size && [...next].every(([k, v]) => { const o = OVR.get(k); return o && o[0] === v[0] && o[1] === v[1] && o[2] === v[2]; });
  if (!same) { OVR.clear(); for (const [k, v] of next) OVR.set(k, v); bump(); }
  return { applied: next.size, dropped };
}
export const snapshot = () => [...OVR].map(([k, v]) => [k, v.slice()]);                 // for one-level undo
export function restore(snap) { OVR.clear(); for (const [k, v] of snap) OVR.set(k, v.slice()); bump(); }
