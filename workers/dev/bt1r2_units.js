// bt1r2_units.js - BT1_R2 job 3: the SOLDIER -> MODEL dev page.  Shows every unit key of the game twice: its BODY (today's figure, from bunits.js) and its MODEL (what the swap table
// unit_models.json puts in the slot; an empty slot says so).  Uses the REAL bunits.js (createUnitViews) with a fake sim: one unit per key, standing.
//   ?page=N      the N-th page of the gallery (4 keys a page, by size class)       ?stand=1   dev-only: fills the humanoid slots with an existing asset (ranger_m) to show the pipeline works
//   ?table=url   a table to use instead of unit_models.json (same format)         window.__units.report() -> JSON (slots, states, calls, tris)
import * as THREE from 'three';
import { createUnitViews } from '../bot/bluebot_v2/bluewall/client/src/bunits.js';
import { SWAP_TABLE, swapKeys } from '../bot/bluebot_v2/bluewall/client/src/unit_swap.js';
import DEFS from '../bot/bluebot_v2/bluewall/client/src/unitdefs.json';

const Q = new URLSearchParams(location.search), W = +(Q.get('w') || 1500), H = +(Q.get('h') || 620);
const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); R.setSize(W, H); R.setPixelRatio(1); R.shadowMap.enabled = false; document.body.style.margin = '0'; document.body.appendChild(R.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xa9c8e6); scene.add(new THREE.HemisphereLight(0xffffff, 0x556644, 1.25)); const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(40, 80, 30); scene.add(dl);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshStandardMaterial({ color: 0x6f8f4a, roughness: 1 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
const cam = new THREE.PerspectiveCamera(36, W / H, 0.5, 4000);

// the table of the page: the shipped one, or ?table=, or ?stand=1 (the dev stand-in: an existing humanoid file in the slot of the foot soldiers)
const STAND = ['spear', 'sword', 'guard', 'archer'], STAND_CLIPS = { spear: { idle: 'Idle_Loop' }, sword: { atk: ['Sword_Attack'] } };
async function pageTable() {
  let t = JSON.parse(JSON.stringify(SWAP_TABLE));
  if (Q.get('table')) t = await (await fetch(Q.get('table'))).json();
  if (Q.get('stand')) for (const k of STAND) t.units[k] = { ...t.units[k], model: 'ranger_m', anims: 'anims', h: 4.6, yaw: 0, clips: STAND_CLIPS[k] || null, ref: null, lod2: null };       // (the clip map shows the per-row clips: spear / sword idle and attack live in another clip file today)
  if (Q.get('broken')) t.units.sword = { ...t.units.sword, model: 'no_such_model_zz', anims: null, h: 4.6, yaw: 0 };       // a slot whose file does not exist: must keep the body and say so
  return t;
}
const empty = (t) => { const e = JSON.parse(JSON.stringify(t)); for (const k of Object.keys(e.units)) { const r = e.units[k]; r.model = null; r.anims = null; r.h = null; r.clips = null; r.ref = null; } return e; };

const SIZE_PX = { light: 0, medium: 1, heavy: 2, huge: 3 };
const ALL = swapKeys(SWAP_TABLE);
const sizeOf = (k) => { const b = k.startsWith('e_') ? k.slice(2) : k; return (DEFS.units[b] && DEFS.units[b].size) || 'medium'; };
const ORDER = ALL.slice().sort((a, b) => SIZE_PX[sizeOf(a)] - SIZE_PX[sizeOf(b)] || ALL.indexOf(a) - ALL.indexOf(b));
const PER = 4, SP = [20, 27, 42, 64], PAGES = Math.ceil(ORDER.length / PER);

let state = null;
async function show(page) {
  if (state) { state.vA.dispose(); state.vB.dispose(); state = null; }                  // (the previous page's figures go; dispose also puts the swapped recipes back)
  const keys = ORDER.slice(page * PER, page * PER + PER), table = await pageTable();
  const big = Math.max(...keys.map((k) => SIZE_PX[sizeOf(k)])), sp = SP[big];
  const mk = (xs, tb) => { const units = [], defs = []; keys.forEach((k, i) => { if (tb && !(tb.units[k] && tb.units[k].model)) return; const e = k.startsWith('e_'), b = e ? k.slice(2) : k, o = { id: (e ? 1000 : 0) + i + (xs > 0 ? 100 : 0), type: b, x: i * sp + xs, z: 0, face: Math.PI * 0.15, side: e ? 'D' : 'A', active: true, tier: 0, hp: 1, dead: false, hpMax: 1 }; (e ? defs : units).push(o); }); return { units, defenders: defs }; };
  const simA = mk(0), simB = mk(sp * 0.4, table);
  const mkViews = (sim, tb) => createUnitViews({ M: {}, scene, sim, forgeLevel: 1, enemyLevel: 1, height: () => 0, hooks: {}, swap: tb });
  const vA = await mkViews(simA, empty(table)), vB = await mkViews(simB, table);   // (B holds only the units whose slot names a model)
  const halfW = (keys.length - 1) * sp * 0.5 + sp * 0.6, D = Math.max([36, 50, 80, 130][big], (halfW / (Math.tan((18 * Math.PI) / 180) * (W / H))) * 1.05), cx = (keys.length - 1) * sp * 0.5 + sp * 0.2;
  cam.position.set(cx, 3.2 + big * 4, D); cam.lookAt(cx, 2.2 + big * 3.4, 0); cam.updateMatrixWorld(true);
  for (let i = 0; i < 40; i++) { vA.update(i / 30, 1 / 30, cam); vB.update(i / 30, 1 / 30, cam); }
  R.render(scene, cam);
  const slotsB = vB.slots(), rows = keys.map((k) => ({ key: k, body: vA.slots()[k].state, model: slotsB[k].state, file: slotsB[k].model, why: slotsB[k].why }));
  state = { page, pages: PAGES, keys, sp, rows, vA, vB, info: { calls: R.info.render.calls, tris: R.info.render.triangles } };
  return rows;
}
window.__units = {
  pages: PAGES, per: PER, order: ORDER, show,
  report: () => ({ page: state.page, rows: state.rows, calls: state.info.calls, tris: state.info.tris, stats: [state.vA.stats && state.vA.stats(), state.vB.stats && state.vB.stats()] }),
  png: () => R.domElement.toDataURL('image/png'),
  labels: () => state.keys.map((k, i) => { const v = new THREE.Vector3(i * state.sp + state.sp * 0.2, 0, 0).project(cam); return { key: k, x: Math.round((v.x * 0.5 + 0.5) * W), y: Math.round((-v.y * 0.5 + 0.5) * H) }; }),
};

// ---- LOD2 colour calibration (bt1r2_lod2cal.py): the same figure at LOD0 and forced to LOD2 on a magenta field, the mean colour of its head / body / legs
async function cal(keys, tier) {
  const bg = scene.background; scene.background = new THREE.Color(0xff00ff); ground.visible = false;
  const units = [], defs = []; keys.forEach((k, i) => { const e = k.startsWith('e_'), b = e ? k.slice(2) : k, o = { id: i + 1, type: b, x: i * 9, z: 0, face: Math.PI * 0.15, side: e ? 'D' : 'A', active: true, tier, hp: 1, dead: false, hpMax: 1 }; (e ? defs : units).push(o); });
  const v = await createUnitViews({ M: {}, scene, sim: { units, defenders: defs }, forgeLevel: 1, enemyLevel: 1, height: () => 0, hooks: {}, swap: empty(SWAP_TABLE) });
  const cx = (keys.length - 1) * 4.5; cam.position.set(cx, 2.6, 34); cam.lookAt(cx, 2.3, 0); cam.updateMatrixWorld(true);
  const c2 = document.createElement('canvas'); c2.width = W; c2.height = H; const g2 = c2.getContext('2d', { willReadFrequently: true });
  const res = {};
  for (const pass of ['lod0', 'lod2']) {
    for (let i = 0; i < 40; i++) v.update(i / 30, 1 / 30, cam);
    if (pass === 'lod2') for (const k of Object.values(v.kinds)) k.update(2, cam, { lodDist: 0, lod2Dist: 0 });
    R.render(scene, cam); g2.drawImage(R.domElement, 0, 0);
    keys.forEach((k, i) => {
      const p0 = new THREE.Vector3(i * 9 - 3.2, 0, 0).project(cam), p1 = new THREE.Vector3(i * 9 + 3.2, 0, 0).project(cam), x0 = Math.floor((p0.x * 0.5 + 0.5) * W), x1 = Math.ceil((p1.x * 0.5 + 0.5) * W);
      const d = g2.getImageData(x0, 0, x1 - x0, H).data, w = x1 - x0; let top = H, bot = -1;
      const isBg = (r, g, b) => r - g > 60 && b - g > 60;
      for (let y = 0; y < H; y++) for (let x = 0; x < w; x++) { const o = (y * w + x) * 4; if (!isBg(d[o], d[o + 1], d[o + 2])) { top = Math.min(top, y); bot = Math.max(bot, y); } }
      const reg = { head: [0, 0.17], body: [0.17, 0.62], legs: [0.62, 1] }, out = {};
      for (const [rn, [a, b]] of Object.entries(reg)) {
        let n = 0, sr = 0, sg = 0, sb = 0; const y0 = Math.round(top + (bot - top) * a), y1 = Math.round(top + (bot - top) * b);
        for (let y = y0; y < y1; y++) for (let x = 0; x < w; x++) { const o = (y * w + x) * 4; if (isBg(d[o], d[o + 1], d[o + 2])) continue; n++; sr += d[o]; sg += d[o + 1]; sb += d[o + 2]; }
        out[rn] = n ? [Math.round(sr / n), Math.round(sg / n), Math.round(sb / n), n] : null;
      }
      (res[k] = res[k] || {})[pass] = { ...out, h: bot - top };
    });
  }
  v.dispose(); scene.background = bg; ground.visible = true; return res;
}
window.__units.cal = cal;
window.__unitsReady = true;
