// town_build.js — p41 (THREE side): the lots of B1's town plan become houses and civic buildings.
//   registerTownTargets(ctx, level)   one destructible battle target per ~26 m block of lots (the same rule the old town used) and one per chapel; returns Map(lot id -> target id).
//                                     Must run in the loading phase, before initDestruct() reads ctx.targets (world.js).
//   createPlannedTown({...})          { rebuild(), tick(), idle } — homes (B2, kit_homes.glb) baked in chunks of <= 40 per call, civic lots (B3, kit_civic.glb) in ONE bake call.
//                                     rebuild() is cheap to call: it only does work when the castle level changed what stands (a lot unlocked, a house tier 1 / 6 / 12 / 18 / 24 / 30).
//                                     New meshes are made next to the old ones (hidden) and swapped in when the last chunk is done, so the town never shows half a rebuild.
import * as THREE from 'three';
import { bakePieces } from './village.js';
import { HOME_KINDS, homePieces, homeSmoke, homeTier } from './b2_homes.js';
import { homeLots, civicLots, civicBuild, toWorld, townTargetSpecs } from './town_plan.js';

const CHUNK = 40, UP = new THREE.Vector3(0, 1, 0);
const Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(), M4 = () => new THREE.Matrix4();
const place = (x, y, z, ry, s = 1) => M4().compose(P.set(x, y, z), Q.setFromAxisAngle(UP, ry), S.set(s, s, s));

export function registerTownTargets(ctx, level) {
  const tids = new Map();
  for (const { ids, t } of townTargetSpecs(level)) { const id = ctx.tgt(t); for (const k of ids) tids.set(k, id); }
  ctx.B.bid(0);
  return tids;
}

export function createPlannedTown({ scene, kitHomes, kitCivic, height, shadows, ctx, tids = new Map(), level, civicCap = 30 }) {
  const st = { sig: null, group: null, staging: null, queue: [], smoke: [], pend: [], picked: new Set() };
  // the ground a lot stands on: the lowest of its corners and middle (like the old houses: a plinth never floats), never below the water line
  const ground = (l) => { const c = Math.cos(l.ry), s = Math.sin(l.ry), hw = l.w / 2, hd = l.d / 2; let y = height(l.x, l.z); for (const [a, b] of [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]]) y = Math.min(y, height(l.x + a * c + b * s, l.z - a * s + b * c)); return Math.max(0.2, y); };
  const dispose = (g) => { if (!g) return; g.parent && g.parent.remove(g); g.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); };   // (the kit's materials are shared: never disposed)
  function pick(l) {                                                    // the tap boxes (main.js: house / church / market open their card)
    if (st.picked.has(l.id) || l.kind === 'well') return; st.picked.add(l.id);
    const top = l.kind === 'chapel' ? 40 : l.kind === 'market' ? 7 : HOME_KINDS[l.kind] ? 4 + HOME_KINDS[l.kind].floors * 3.2 : 12;
    ctx.pick({ x: l.x, z: l.z, y0: 0, y1: top, r: l.kind === 'market' ? 15 : Math.max(l.w, l.d) / 2 }, l.kind === 'chapel' ? 'church' : l.kind === 'market' ? 'market' : 'house');
  }
  function swap(group, smoke) {
    const old = st.group; st.group = group; group.visible = true; dispose(old);
    for (const s of st.smoke) s.off = true; st.smoke = smoke; st.pend = [];
  }
  function rebuild() {
    const lv = level(), homes = homeLots(lv), civic = civicLots(lv).map((c) => ({ ...c, lv: Math.min(c.lv, civicCap) }));
    const sig = [homes.map((h) => h.id).join(','), homeTier(lv), civic.map((c) => c.id + ':' + c.lv).join(','), shadows ? 1 : 0].join('|');
    if (sig === st.sig) return false;
    st.sig = sig; st.queue.length = 0; if (st.staging) { dispose(st.staging); st.staging = null; } for (const q of st.pend) q.off = true;          // (a rebuild still under way is dropped, with its smoke)
    const group = st.staging = new THREE.Group(); group.name = 'planned-town'; group.visible = !st.group; scene.add(group);       // the very first build stays under the hidden bucket until it is revealed
    const smoke = st.pend = [];
    if (kitCivic && civic.length) st.queue.push(() => {
      const list = [];
      for (const lot of civic) { const y = ground(lot), bid = tids.get(lot.id) || 0; for (const p of civicBuild(lot)) list.push({ name: p.n, matrix: place(p.x, y, p.z, p.ry, p.s), bid }); }
      bakePieces(group, kitCivic, list, { shadows, tag: 'civic' });
    });
    if (kitHomes) for (let i = 0; i < homes.length; i += CHUNK) {
      const chunk = homes.slice(i, i + CHUNK);
      st.queue.push(() => {
        const list = [];
        for (const lot of chunk) {
          const y = ground(lot), bid = tids.get(lot.id) || 0;
          for (const p of homePieces(lot.kind, lv, lot.seed)) { const w = toWorld(lot, p); list.push({ name: p.n, matrix: place(w.x, y, w.z, w.ry, p.s), bid }); }
          if (lot.seed % 3 === 0 && smoke.length < 18) for (const c of homeSmoke(lot.kind, lv, lot.seed).slice(0, 1)) { const w = toWorld(lot, { n: '', x: c.x, z: c.z, ry: 0, s: 1 }); smoke.push(ctx.smokeAt(w.x, y + c.y, w.z)); }
        }
        bakePieces(group, kitHomes, list, { shadows, tag: 'homes' });
      });
    }
    st.queue.push(() => { st.staging = null; for (const l of [...homes, ...civic]) pick(l); swap(group, smoke); });
    return true;
  }
  return { rebuild, tick() { const f = st.queue.shift(); if (f) f(); return st.queue.length; }, get idle() { return st.queue.length === 0; }, get state() { return st; } };
}
