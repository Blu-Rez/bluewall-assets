// BT1_R2: the SOLDIER -> MODEL pipeline.  A unit's body is a row of DATA (unit_models.json), not code:
//   { model, anims, h, yaw, clips, ref, lod2 }  per unit key (every key of unitdefs.json `order` + the foe's e_* kinds).
// bunits.js calls applySwaps() once per battle, after the first kinds are built: every key whose row names a model (and that is in this battle's army) gets its own crowd kind made from that file,
// and its recipe (TYPE[key]) is pointed at it; everything else - and every failure (missing file, no rig, a clip the file does not have) - keeps today's body.  Nothing is hand-built or recoloured here.
// A row is filled ONLY with the owner's number from a sheet; the table ships with every `model` = null.
//   views.slots()  -> { key: { state: 'body' | 'model' | 'failed', model, why } }   (one slot per unit key; dev/bt1r2_test.sh checks that every unit key has one)
import * as THREE from 'three';
import TABLE from './unit_models.json';

export const SWAP_TABLE = TABLE;
export const swapKeys = (table = TABLE) => Object.keys(table.units);
const CLIP_KEYS = ['idle', 'run', 'walk', 'atk', 'hit'];
const isHex = (v) => typeof v === 'number' && v >= 0 && v <= 0xffffff;

// the problems of one row (empty = fine); used by the test and before a model is loaded
export function checkRow(key, row) {
  const bad = [];
  if (!row || typeof row !== 'object') return ['no row'];
  if (row.model != null && (typeof row.model !== 'string' || !/^[A-Za-z0-9_\-]+$/.test(row.model))) bad.push('model must be an asset key (web/assets/<key>.glb) or null');
  if (row.anims != null && (typeof row.anims !== 'string' || !/^[A-Za-z0-9_\-]+$/.test(row.anims))) bad.push('anims must be an asset key or null');
  if (row.h != null && !(typeof row.h === 'number' && row.h > 0.2 && row.h < 60)) bad.push('h = standing height in metres (0.2 .. 60) or null');
  if (typeof row.yaw !== 'number' || !isFinite(row.yaw) || Math.abs(row.yaw) > 360) bad.push('yaw = degrees, a number');
  if (row.ref != null && !(typeof row.ref === 'number' && row.ref > 0)) bad.push('ref must be a speed in m/s or null');
  if (row.clips != null) {
    if (typeof row.clips !== 'object') bad.push('clips must be an object or null');
    else for (const [k, v] of Object.entries(row.clips)) {
      if (!CLIP_KEYS.includes(k)) bad.push('unknown clip slot ' + k);
      else if (!(typeof v === 'string' || (Array.isArray(v) && v.length && v.every((s) => typeof s === 'string')))) bad.push('clips.' + k + ' must be a name or a list of names');
    }
  }
  if (row.lod2 != null) { const c = row.lod2; if (typeof c !== 'object' || !isHex(c.cloth) || (c.legs != null && !isHex(c.legs)) || (c.skin != null && !isHex(c.skin))) bad.push('lod2 = { cloth, legs, skin } as numbers (0xRRGGBB), h optional'); }
  if (row.model == null && (row.anims != null || row.h != null || row.clips != null)) bad.push('a row without a model must keep its other fields null (they would do nothing)');
  return bad;
}

// All the slots of a table against a list of keys: what the test (and the dev page) print.
export function slotReport(keys, table = TABLE) {
  const out = {};
  for (const k of keys) { const row = table.units[k]; out[k] = { row: !!row, problems: row ? checkRow(k, row) : ['no row'], model: row ? row.model : null }; }
  return out;
}

const heightOf = (gltf) => new THREE.Box3().setFromObject(gltf.scene, true).getSize(new THREE.Vector3()).y || 0;
const names = (v) => (Array.isArray(v) ? v : [v]);

// ctx = { table, count, TYPE, K, M, need, step, createKind }  ->  { slots: { key: { state, model, why } }, restore }
// (TYPE is the module-wide recipe table of bunits.js: a swapped recipe is put back by restore() when the battle's views are disposed, so the next battle starts from today's bodies)
// (`count` = the unit keys this battle has: only those are loaded, so a table of 37 rows costs nothing until a model is named)
export async function applySwaps({ table = TABLE, count, TYPE, K, M, need, step, createKind }) {
  const slots = {}, orig = {};
  for (const key of swapKeys(table)) {
    const row = table.units[key], bad = checkRow(key, row);
    slots[key] = { state: 'body', model: row ? row.model : null, why: '' };
    if (!row || !row.model) continue;
    if (bad.length) { slots[key] = { state: 'failed', model: row.model, why: bad.join('; ') }; console.warn('unit swap', key, bad); continue; }
    if (!count[key] || !TYPE[key]) { slots[key].why = 'not in this battle'; continue; }
    try {
      const gltf = await need(row.model); if (!gltf || !gltf.scene) throw new Error('model file ' + row.model + ' did not load');
      const src = row.anims ? await need(row.anims) : gltf; if (!src || !src.animations || !src.animations.length) throw new Error('no clips (' + (row.anims || row.model) + ')');
      const base = TYPE[key], P0 = base.parts[0], clipMap = { ...P0.clip, ...(row.clips || {}) };
      const wanted = [...new Set(CLIP_KEYS.flatMap((c) => (clipMap[c] ? names(clipMap[c]) : [])))];
      for (const c of src.animations) c.name = c.name.replace(/^.*\|/, '');       // ('Armature|Walk' -> 'Walk': the same strip the other units' loaders do)
      const have = new Set(src.animations.map((c) => c.name));
      const miss = wanted.filter((n) => !have.has(n)); if (miss.length) throw new Error('clips missing: ' + miss.join(', '));
      const kname = 'swap_' + key, hb = row.h ? heightOf(gltf) : 0;
      await step(kname, () => createKind({ gltf, anims: src, clips: wanted, capacity: count[key] + 6, lod2: row.lod2 ? { h: 1.8, ...row.lod2 } : undefined }));
      if (!K[kname]) throw new Error('kind not built');
      const part = { ...P0, k: kname, clip: clipMap, scale: row.h && hb > 0 ? row.h / hb : P0.scale, yawOff: ((row.yaw || 0) * Math.PI) / 180 };
      if (row.ref) part.ref = row.ref;
      delete part.crAbs; if (row.h && hb > 0) part.crAbs = row.h;                  // (the culling sphere follows the real height, in metres)
      if (!(key in orig)) orig[key] = base;
      TYPE[key] = { ...base, parts: [part] };
      slots[key] = { state: 'model', model: row.model, why: '' };
    } catch (e) { slots[key] = { state: 'failed', model: row.model, why: String(e.message || e).slice(0, 160) }; console.warn('unit swap ->', key, 'keeps its body:', e); }
  }
  return { slots, restore: () => { for (const k of Object.keys(orig)) TYPE[k] = orig[k]; } };
}
