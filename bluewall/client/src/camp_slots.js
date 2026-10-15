// BT1_R2: the camp as DATA.  camp_slots.json says which model stands in each kind of slot (null = today's piece); this module (pure maths, no three.js - dev/bt1r2_test.sh runs it in node)
// turns the plan of campplan.js into SLOT RECORDS  { kind, x, z, ry, ... }  that camp.js builds.
//   kind  command | barracks | supply | siege | healer | banner | palisade
//   x, z  world position of the slot's centre on the ground;  ry = the world yaw (radians, about +y) of the piece
import TABLE from './camp_slots.json';
import UD from './unitdefs.json';

export const CAMP_TABLE = TABLE;
export const TENT_KINDS = ['command', 'barracks', 'supply', 'siege', 'healer'];
export const SLOT_KINDS = [...TENT_KINDS, 'banner', 'palisade'];
export const PAVILION_R = 4.15;                          // (campplan.js: a tent's radius = PAVILION_R * k)

// the problems of the table (empty = fine)
export function checkCampTable(table = TABLE) {
  const bad = [];
  if (!table || typeof table !== 'object') return ['no table'];
  const K = table.kinds || {};
  for (const k of SLOT_KINDS) {
    const r = K[k];
    if (!r || typeof r !== 'object') { bad.push(k + ': no row'); continue; }
    if (r.model != null && (typeof r.model !== 'string' || !/^[A-Za-z0-9_\-]+$/.test(r.model))) bad.push(k + ': model must be an asset key or null');
    for (const f of ['h', 'r']) if (r[f] != null && !(typeof r[f] === 'number' && r[f] > 0.2 && r[f] < 60)) bad.push(k + ': ' + f + ' in metres (0.2 .. 60) or null');
    if (typeof r.yaw !== 'number' || !isFinite(r.yaw) || Math.abs(r.yaw) > 360) bad.push(k + ': yaw = degrees, a number');
    if (r.model == null && (r.h != null || r.r != null)) bad.push(k + ': a row without a model keeps h / r null');
    if (r.model != null && r.h == null) bad.push(k + ': a model needs h (its height in metres)');
    if (r.model != null && TENT_KINDS.includes(k) && r.r == null) bad.push(k + ': a tent model needs r (its footprint radius in metres)');
    if (k === 'palisade' && !(typeof r.len === 'number' && r.len > 0.5 && r.len < 30)) bad.push('palisade: len = the section length in metres');
    if (!r.fallback) bad.push(k + ': fallback names the piece used when the model is null (pavilion | standard | none)');
  }
  for (const [fam, kind] of Object.entries(table.byFam || {})) if (!TENT_KINDS.includes(kind)) bad.push('byFam.' + fam + ' -> ' + kind + ' is not a tent kind');
  if (!TENT_KINDS.includes(table.defaultKind)) bad.push('defaultKind must be a tent kind');
  if (table.commandRule != null && table.commandRule !== 'biggest') bad.push("commandRule is 'biggest' or null");
  return bad;
}

// the tent kind of every squad:  squads = [{ t (unit key), n (head-count) }] in the order of the plan -> [kind]
export function squadKinds(squads, table = TABLE) {
  let big = -1;
  if (table.commandRule === 'biggest') { let m = -1; squads.forEach((q, i) => { if (q.n > m) { m = q.n; big = i; } }); }
  return squads.map((q, i) => {
    if (i === big) return 'command';
    const fam = UD.units && UD.units[q.t] ? UD.units[q.t].fam : null;
    return (fam && table.byFam && table.byFam[fam]) || table.defaultKind;
  });
}

// tent slots from the plan: items = campplan.js `items` ({ i (squad index), l, b, yaw, k, r }), at(l, b) -> [x, z], frameYaw = the camp frame's yaw, kinds = squadKinds(...)
export function tentSlots({ items, at, frameYaw, kinds, squads }) {
  return items.map((t) => { const [x, z] = at(t.l, t.b); return { kind: kinds[t.i], x, z, ry: frameYaw + t.yaw, k: t.k, r: t.r, squad: squads[t.i].t, l: t.l, b: t.b }; });
}

// the standard's slot (the pole of the plan)
export const bannerSlot = ({ pole, at, frameYaw }) => { const [x, z] = at(pole.l, pole.b); return { kind: 'banner', x, z, ry: frameYaw, l: pole.l, b: pole.b }; };

// palisade slots: sections of `len` metres, end to end along the back edge and the two sides of the camp rect (l0..l1 lateral, b0..b1 back), `inset` m inside the rect,
// skipping the places where something solid stands (blocked(l, b, r)).  The front (towards the enemy) stays open: that is where the army stands.
export function palisadeSlots({ rect, at, frameYaw, len = 4, inset = 3, blocked = () => false }) {
  const out = [], push = (l, b, alongL) => {
    if (blocked(l, b, len * 0.6)) return;
    const [x, z] = at(l, b);
    out.push({ kind: 'palisade', x, z, ry: frameYaw + (alongL ? 0 : Math.PI / 2), l, b });
  };
  const l0 = rect.l0 + inset, l1 = rect.l1 - inset, b0 = rect.b0 + inset, b1 = rect.b1 - inset;
  for (let l = l0 + len / 2; l <= l1 - len / 2 + 1e-6; l += len) push(l, b1, true);          // (the back)
  for (let b = b0 + len / 2; b <= b1 - len * 1.5 + 1e-6; b += len) { push(l0, b, false); push(l1, b, false); }     // (the two sides; the corners belong to the back)
  return out;
}
