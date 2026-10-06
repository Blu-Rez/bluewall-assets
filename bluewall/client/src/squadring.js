// Squad rings: every squad of the army stands inside a glowing "ground sigil" in its own colour (the same colour edges the squad's card in the HUD and paints its tent
// in the camp), so the army reads as tidy, separate blocks.  Redesigned (owner 4 Oct 21:51: "realistic, beautiful, high quality").
//
//   · one soft pool of light on the ground, a thin bright rim with fine ticks and a breathing halo  (static layer)
//   · an engraved ring of runes between two thin circles, turning slowly one way                     (rune layer)
//   · a comet of light chasing round the rim the other way — bright on the selected squad              (comet layer)
//   · the squad's medallion in the middle of the pool: a deep coin with the soldier's portrait, lying on the ground, upright for the camera (squadicon.js)   (icon layer)
// p34: the rings are also the CONTROLS (drag a ring to send its squad).  Every squad has a second, "ghost" slot (same textures, same four draw calls): the ring that goes ahead to
// the finger while it is dragged, and the ring that stays on the target while a squad waits for the others (a staged target).  update(sim, lit, dt, t, ghosts) takes the lit squads
// (a Set) and the ghosts [{t, x, z, mode:'drag'|'staged'}]; info(type) gives the screen code the ring's centre / radius for hit tests, tags and lines.
// All rings of the army share FOUR draw calls (one merged mesh per layer, per-vertex colour/alpha), three 1024 px canvas textures with mipmaps and anisotropy, and a polar
// grid per ring whose vertices follow the terrain (so a ring never sinks into a slope).  The two turning layers rotate by their texture matrix: no per-ring work.
import * as THREE from 'three';
import { paintAtlas, CELL, COLS } from './squadicon.js';
import { ringMargin } from './armyplan.js';

export const SQUAD_COLOR = {
  spear: '#ff6b6b', sword: '#ffa94d', guard: '#ffd43b', archer: '#8ce99a', cavalry: '#38d9a9', axerider: '#20c997', pegasus: '#74c0fc', baby: '#4dabf7', dragon: '#9775fa', catapult: '#f783ac', giant: '#e599f7',
  imp: '#ff8787', mage: '#b197fc', ram: '#ffc078', cannon: '#ced4da', werewolf: '#66d9e8', trebuchet: '#c0eb75', hill: '#fcc419', shieldmaiden: '#63e6be', lord: '#ffe066',
  legionary: '#ff9a9a', captain: '#8ce0ff', ogre: '#d0a5ff', gryphon: '#99e6ff', lich: '#b8a2ff', treant: '#a0e86e', gryphonknight: '#ffd27a', darkrider: '#8a7bff', baby3: '#6cc6ff', dragon3: '#b08cff',
};

const HANDLE_R = 30;                                       // (the largest ring drawn: a squad that spreads out keeps a handle of this size)
const TAU = Math.PI * 2, NA = 56, RF = [0, 0.34, 0.6, 0.8, 0.9, 0.955, 1.0], NR = RF.length, NV = NR * NA, LIFT = 0.5;
const COS = new Float32Array(NA), SIN = new Float32Array(NA); for (let j = 0; j < NA; j++) { COS[j] = Math.cos((j / NA) * TAU); SIN[j] = Math.sin((j / NA) * TAU); }

// ------------------------------------------------------------------ textures (drawn once, shared by all squads)
const cvs = (S, h = S) => { const c = document.createElement('canvas'); c.width = S; c.height = h; return [c, c.getContext('2d')]; };
const mkTex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.center.set(0.5, 0.5); return t; };
let seed = 20261004; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

function poolTexture() {                       // the pool of light, the rim, its ticks and the halo
  const S = 1024, m = S / 2, [c, g] = cvs(S);
  let gr = g.createRadialGradient(m, m, m * 0.9, m, m, m);                                   // the halo outside the rim
  gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(m, m, m, 0, TAU); g.arc(m, m, m * 0.9, 0, TAU); g.fill('evenodd');                // (an annulus: a gradient would also fill the inside with its first colour)
  gr = g.createRadialGradient(m, m, 0, m, m, m * 0.955);                                      // the pool: faint in the middle, brighter towards the rim
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.04)'); gr.addColorStop(0.86, 'rgba(255,255,255,0.13)'); gr.addColorStop(1, 'rgba(255,255,255,0.34)');
  g.fillStyle = gr; g.beginPath(); g.arc(m, m, m * 0.955, 0, TAU); g.fill();
  g.strokeStyle = '#fff'; g.lineCap = 'round';
  g.shadowColor = '#fff'; g.shadowBlur = 22; g.lineWidth = 10; g.beginPath(); g.arc(m, m, m * 0.955, 0, TAU); g.stroke();      // the rim, with a soft glow
  g.shadowBlur = 0; g.lineWidth = 4; g.globalAlpha = 0.95; g.beginPath(); g.arc(m, m, m * 0.955, 0, TAU); g.stroke();
  g.globalAlpha = 0.5; g.lineWidth = 2.2; g.beginPath(); g.arc(m, m, m * 0.915, 0, TAU); g.stroke();                              // the inner thin line
  g.globalAlpha = 0.55; g.lineWidth = 2;
  for (let i = 0; i < 144; i++) { const a = (i / 144) * TAU, l = i % 6 === 0 ? 22 : 10, r0 = m * 0.915; g.beginPath(); g.moveTo(m + Math.cos(a) * r0, m + Math.sin(a) * r0); g.lineTo(m + Math.cos(a) * (r0 - l), m + Math.sin(a) * (r0 - l)); g.stroke(); }
  g.globalAlpha = 1; g.lineWidth = 6;
  for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2, r0 = m * 0.955; g.beginPath(); g.moveTo(m + Math.cos(a) * (r0 - 14), m + Math.sin(a) * (r0 - 14)); g.lineTo(m + Math.cos(a) * (r0 + 22), m + Math.sin(a) * (r0 + 22)); g.stroke(); }   // four marks through the rim
  return mkTex(c);
}

function runeTexture() {                       // the engraved ring: two circles with a band of runes between them
  const S = 1024, m = S / 2, [c, g] = cvs(S);
  g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineCap = 'round'; g.lineJoin = 'round';
  g.shadowColor = '#fff'; g.shadowBlur = 10;
  g.globalAlpha = 0.9; g.lineWidth = 4; for (const r of [0.865, 0.705]) { g.beginPath(); g.arc(m, m, m * r, 0, TAU); g.stroke(); }
  g.globalAlpha = 0.45; g.lineWidth = 1.8; for (const r of [0.832, 0.738]) { g.beginPath(); g.arc(m, m, m * r, 0, TAU); g.stroke(); }
  g.shadowBlur = 6;
  const P = (a, r) => [m + Math.cos(a) * m * r, m + Math.sin(a) * m * r];
  for (let i = 0; i < 72; i++) {                                                                  // fine ticks on the outer circle
    const a = (i / 72) * TAU, p = P(a, 0.865), q = P(a, i % 3 === 0 ? 0.885 : 0.877); g.globalAlpha = 0.7; g.lineWidth = 2; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke();
  }
  const N = 36;
  for (let i = 0; i < N; i++) {                                                                   // the runes
    const a = ((i + 0.5) / N) * TAU, k = (rnd() * 6) | 0, ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;     // u: outward, v: along the band
    const at = (r, w) => [m + ux * m * r + vx * w, m + uy * m * r + vy * w];
    const seg = (r0, w0, r1, w1) => { const p = at(r0, w0), q = at(r1, w1); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); };
    g.globalAlpha = 0.92; g.lineWidth = 4.2;
    if (k === 0) seg(0.752, 0, 0.82, 0);
    else if (k === 1) { seg(0.752, 0, 0.82, 0); seg(0.79, -9, 0.79, 9); }
    else if (k === 2) { seg(0.755, 0, 0.8, -10); seg(0.755, 0, 0.8, 10); seg(0.8, -10, 0.82, -10); seg(0.8, 10, 0.82, 10); }
    else if (k === 3) { seg(0.752, 0, 0.79, 0); seg(0.79, 0, 0.82, -10); seg(0.79, 0, 0.82, 10); }
    else if (k === 4) { seg(0.752, 0, 0.775, 0); const p = at(0.805, 0); g.beginPath(); g.arc(p[0], p[1], 6.5, 0, TAU); g.fill(); }
    else { seg(0.752, -6, 0.82, -6); seg(0.752, 6, 0.82, 6); }
  }
  g.globalAlpha = 1; g.shadowBlur = 12;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, p = P(a, 0.705); g.beginPath(); const d = 11; g.moveTo(p[0] + Math.cos(a) * d, p[1] + Math.sin(a) * d); g.lineTo(p[0] - Math.sin(a) * d * 0.55, p[1] + Math.cos(a) * d * 0.55); g.lineTo(p[0] - Math.cos(a) * d, p[1] - Math.sin(a) * d); g.lineTo(p[0] + Math.sin(a) * d * 0.55, p[1] - Math.cos(a) * d * 0.55); g.closePath(); g.fill(); }   // twelve diamonds on the inner circle
  return mkTex(c);
}

function cometTexture() {                      // a comet of light on the rim: a bright head with a tail that fades over ~130 degrees (segments: no conic-gradient needed)
  const S = 1024, m = S / 2, [c, g] = cvs(S); g.lineCap = 'round';
  const SEG = 90, SPAN = (130 / 180) * Math.PI;
  for (let i = 0; i < SEG; i++) {
    const k = i / (SEG - 1), a0 = -SPAN * (1 - k) - 0.02, a1 = a0 + SPAN / SEG + 0.02, al = Math.pow(k, 2.2);
    g.strokeStyle = `rgba(255,255,255,${(al * 0.95).toFixed(3)})`; g.lineWidth = 5 + 7 * k; g.shadowColor = '#fff'; g.shadowBlur = 16 * k;
    g.beginPath(); g.arc(m, m, m * 0.955, a0, a1); g.stroke();
  }
  g.shadowBlur = 0; const hx = m + m * 0.955, gr = g.createRadialGradient(hx, m, 0, hx, m, 34);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(hx, m, 34, 0, TAU); g.fill();
  return mkTex(c);
}

function iconAtlas(types) {                    // one coin per squad (squadicon.js): real colours, painted once; the portraits arrive a moment later and repaint their cell
  let tex = null; const a = paintAtlas(types, (t) => SQUAD_COLOR[t] || '#9fe6ff', () => { if (tex) tex.needsUpdate = true; });
  tex = mkTex(a.canvas); tex.center.set(0, 0); return { tex, W: a.W, H: a.H, rows: a.rows };
}

// ------------------------------------------------------------------ the rings
export function createSquadRings(scene, { height, types }) {
  const n = types.length, m = n * 2, atlas = iconAtlas(types), group = new THREE.Group(); group.name = 'squadRings'; scene.add(group);      // (slots 0..n-1 = the rings, n..2n-1 = their ghosts)
  const TA = poolTexture(), TB = runeTexture(), TC = cometTexture();
  // geometry shared by the three disc layers: one polar grid per ring (positions shared, uv + colour per layer)
  const pos = new Float32Array(m * NV * 3), uv = new Float32Array(NV * 2), idx = new Uint32Array(m * (NR - 1) * NA * 6);
  for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) { uv[(i * NA + j) * 2] = 0.5 + 0.5 * RF[i] * COS[j]; uv[(i * NA + j) * 2 + 1] = 0.5 + 0.5 * RF[i] * SIN[j]; }
  const uvAll = new Float32Array(m * NV * 2); for (let k = 0; k < m; k++) uvAll.set(uv, k * NV * 2);
  let q = 0;
  for (let k = 0; k < m; k++) for (let i = 0; i < NR - 1; i++) for (let j = 0; j < NA; j++) {
    const a = k * NV + i * NA + j, b = k * NV + i * NA + ((j + 1) % NA), c = k * NV + (i + 1) * NA + j, d = k * NV + (i + 1) * NA + ((j + 1) % NA);
    idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d;
  }
  const posAttr = new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage), idxAttr = new THREE.BufferAttribute(idx, 1);
  for (let k = 0; k < m; k++) for (let v = 0; v < NV; v++) pos[(k * NV + v) * 3 + 1] = -9999;                         // (hidden until the squad exists)
  const mat = (map, blending, order, polygon = -2) => { const m = new THREE.MeshBasicMaterial({ map, vertexColors: true, transparent: true, depthWrite: false, fog: false, toneMapped: false, side: THREE.DoubleSide, blending, polygonOffset: true, polygonOffsetFactor: polygon, polygonOffsetUnits: polygon }); m.userData.order = order; return m; };
  const layers = [];
  for (const [map, blending, order] of [[TA, THREE.NormalBlending, 3], [TB, THREE.AdditiveBlending, 3.1], [TC, THREE.AdditiveBlending, 3.2]]) {
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', posAttr); geo.setIndex(idxAttr);
    geo.setAttribute('uv', new THREE.BufferAttribute(uvAll, 2));
    const col = new THREE.BufferAttribute(new Float32Array(m * NV * 4), 4).setUsage(THREE.DynamicDrawUsage); geo.setAttribute('color', col);
    const mesh = new THREE.Mesh(geo, mat(map, blending, order, -2)); mesh.frustumCulled = false; mesh.renderOrder = order; mesh.name = 'squadRingLayer'; group.add(mesh);
    layers.push({ geo, col, mesh, map });
  }
  // the medallions: a small grid per ring (it follows the ground), lying in the middle of the pool, turned so that it reads upright from where the camera is
  const NI = 6, NIV = NI * NI, ipos = new Float32Array(m * NIV * 3), iuv = new Float32Array(m * NIV * 2), iidx = new Uint16Array(m * (NI - 1) * (NI - 1) * 6), icol = new THREE.BufferAttribute(new Float32Array(m * NIV * 4), 4).setUsage(THREE.DynamicDrawUsage);
  { let q2 = 0; for (let k = 0; k < m; k++) for (let y = 0; y < NI - 1; y++) for (let x = 0; x < NI - 1; x++) { const a = k * NIV + y * NI + x, b = a + 1, c = a + NI, d = c + 1; iidx[q2++] = a; iidx[q2++] = c; iidx[q2++] = b; iidx[q2++] = b; iidx[q2++] = c; iidx[q2++] = d; } }
  for (let k = 0; k < m; k++) for (let v = 0; v < NIV; v++) ipos[(k * NIV + v) * 3 + 1] = -9999;
  const iposAttr = new THREE.BufferAttribute(ipos, 3).setUsage(THREE.DynamicDrawUsage), igeo = new THREE.BufferGeometry();
  igeo.setAttribute('position', iposAttr); igeo.setAttribute('uv', new THREE.BufferAttribute(iuv, 2)); igeo.setAttribute('color', icol); igeo.setIndex(new THREE.BufferAttribute(iidx, 1));
  for (let k = 0; k < m; k++) {
    const i = k % n, u0 = (i % COLS) * CELL / atlas.W, u1 = ((i % COLS) + 1) * CELL / atlas.W, r = (i / COLS) | 0, v1 = 1 - r * CELL / atlas.H, v0 = 1 - (r + 1) * CELL / atlas.H;
    for (let y = 0; y < NI; y++) for (let x = 0; x < NI; x++) { const o = (k * NIV + y * NI + x) * 2; iuv[o] = u0 + (u1 - u0) * (x / (NI - 1)); iuv[o + 1] = v1 - (v1 - v0) * (y / (NI - 1)); }       // (row 0 = the top of the coin)
  }
  const imesh = new THREE.Mesh(igeo, mat(atlas.tex, THREE.NormalBlending, 3.3, -3)); imesh.frustumCulled = false; imesh.renderOrder = 3.3; imesh.name = 'squadRingIcons'; group.add(imesh);

  const mk = (t, k, ghost) => ({ t, k, ghost, col: new THREE.Color(SQUAD_COLOR[t] || '#9fe6ff'), r: 6, cx: 0, cz: 0, init: false, vis: false, sel: 0, a: new Float32Array(4), px: 1e9, pz: 1e9, pr: -1, pux: 0, puz: 0, pk: 0 });
  const rings = types.map((t, k) => mk(t, k, false)), ghosts = types.map((t, k) => mk(t, n + k, true)), byType = {}; rings.forEach((R) => { byType[R.t] = R; });
  const acc = {}, _f = { x: 0, z: -1 }, W = new Float32Array(4);
  const hide = (R) => { for (let v = 0; v < NV; v++) pos[(R.k * NV + v) * 3 + 1] = -9999; for (let v = 0; v < NIV; v++) ipos[(R.k * NIV + v) * 3 + 1] = -9999; R.vis = false; R.pux = R.puz = 0; R.px = 1e9; posAttr.needsUpdate = true; iposAttr.needsUpdate = true; };
  const writeColor = (R, w) => {                                                      // (per ring and layer: colour x brightness, alpha)
    const c = R.col;
    for (let li = 0; li < 3; li++) {
      const L = layers[li], ar = L.col.array, br = (li === 0 ? 1 : li === 1 ? 1.1 : 1.2) + R.sel * (li === 0 ? 0.25 : li === 1 ? 0.3 : 0.4), al = w[li];
      for (let i = 0; i < NV; i++) { const o = (R.k * NV + i) * 4; ar[o] = c.r * br; ar[o + 1] = c.g * br; ar[o + 2] = c.b * br; ar[o + 3] = al; }
      L.col.needsUpdate = true;
    }
    const ia = icol.array, bw = 1 + 0.18 * R.sel; for (let v = 0; v < NIV; v++) { const o = (R.k * NIV + v) * 4; ia[o] = bw; ia[o + 1] = bw; ia[o + 2] = bw; ia[o + 3] = w[3]; } icol.needsUpdate = true;       // (the coin is painted in real colours: white = as painted)
  };
  const place = (R) => {
    const cx = R.cx, cz = R.cz, rad = R.r;
    for (let i = 0; i < NR; i++) { const r = RF[i] * rad; for (let j = 0; j < NA; j++) { const x = cx + COS[j] * r, z = cz + SIN[j] * r, o = (R.k * NV + i * NA + j) * 3; pos[o] = x; pos[o + 1] = height(x, z) + LIFT; pos[o + 2] = z; } }
    posAttr.needsUpdate = true;
  };
  // the coin: lies in the middle of the pool (about half the ring across), its top pointing away from the camera (so it stands upright on the screen)
  // (k: how much the emblem is stretched away from the camera, so that the low viewing angle does not squash it: it looks round on the screen)
  const placeIcon = (R, ux, uz, k) => {
    const hx = Math.max(3.6, Math.min(14, R.r * 0.84)), hu = Math.min(hx * k, R.r * 0.92), rx = -uz, rz = ux;
    for (let y = 0; y < NI; y++) for (let x = 0; x < NI; x++) {
      const sx = (x / (NI - 1)) * 2 - 1, su = 1 - (y / (NI - 1)) * 2, px = R.cx + rx * hx * sx + ux * hu * su, pz = R.cz + rz * hx * sx + uz * hu * su, o = (R.k * NIV + y * NI + x) * 3;
      ipos[o] = px; ipos[o + 1] = height(px, pz) + LIFT + 0.4; ipos[o + 2] = pz;
    }
    iposAttr.needsUpdate = true; R.pux = ux; R.puz = uz; R.pk = k;
  };
  const upOf = (R, cam) => {
    let ux = _f.x, uz = _f.z, k = 1.6;
    if (cam) { const dx = R.cx - cam.x, dz = R.cz - cam.z, L = Math.hypot(dx, dz); if (L > 1e-3) { ux = dx / L; uz = dz / L; } const dy = cam.y - height(R.cx, R.cz), D = Math.hypot(L, dy) || 1; k = Math.max(1, Math.min(2, 1 / Math.max(0.34, dy / D))); }
    return [ux, uz, k];
  };
  return {
    update(sim, lit, dt, t, gl, cam) {                                                                        // cam: {x, z} the camera's ground position (the coins turn to face it)
      TB.rotation = t * 0.13; TC.rotation = -t * 0.42;                                                        // the runes turn one way, the comet runs the other
      const isLit = lit instanceof Set ? (x) => lit.has(x) : (x) => x === lit;
      const uu = ((sim.base && sim.base.ur) || 2) / 2;
      const dp = sim.deploy; if (dp) { const L = Math.hypot(dp.nx, dp.nz) || 1; _f.x = -dp.nx / L; _f.z = -dp.nz / L; }
      for (const k in acc) { acc[k].n = 0; acc[k].x = 0; acc[k].z = 0; acc[k].r = 0; acc[k].rb = 0; }
      for (const u of sim.units) {
        if (u.dead || u.hp <= 0) continue;
        const a = acc[u.type] || (acc[u.type] = { n: 0, x: 0, z: 0, r: 0 }); a.n++; a.x += u.x; a.z += u.z; if (u.r > (a.rb || 0)) a.rb = u.r;
      }
      for (const u of sim.units) {
        if (u.dead || u.hp <= 0) continue; const a = acc[u.type]; if (!a.n) continue; const dx = u.x - a.x / a.n, dz = u.z - a.z / a.n, d = Math.hypot(dx, dz); if (d > a.r) a.r = d;
      }
      for (const R of rings) {
        const a = acc[R.t];
        if (!a || !a.n) { if (R.vis) hide(R); continue; }                                                     // (fallen squads have no ring)
        const cx = a.x / a.n, cz = a.z / a.n, tr = Math.max(4.5 * uu, Math.min(80, a.r + ringMargin(a.rb || 0, uu))), k = 1 - Math.exp(-dt * 8);       // (p37: the ring is the circle round the soldiers — the farthest one + half the biggest body + 1.2 m — the very formula armyplan.js lays the army out by, so that at the start no two rings touch)
        if (!R.init) { R.cx = cx; R.cz = cz; R.r = tr; R.init = true; } else { R.cx += (cx - R.cx) * k; R.cz += (cz - R.cz) * k; R.r += (tr - R.r) * k; }
        R.sel += ((isLit(R.t) ? 1 : 0) - R.sel) * Math.min(1, dt * 7);
        // a squad that has spread out over the field keeps a smaller, fainter ring: it is the handle the player drags, so it must never vanish while the squad lives
        const spread = Math.max(0, Math.min(1, (R.r - 30) / 26)), breath = 0.5 + 0.5 * Math.sin(t * 1.7 + R.k), f = 1 - 0.5 * spread;
        R.dr = Math.min(R.r, HANDLE_R);
        // p35 K1: a soldier squad that has been sent takes no more orders, so its ring is no handle any more: it only marks where the squad fights (thinner, dimmer, no comet)
        const hnd = !sim.canSend || sim.canSend(R.t), dm = hnd ? 1 : 0.42;
        W[0] = f * dm * (0.78 + 0.22 * R.sel) * (0.92 + 0.08 * breath); W[1] = f * (hnd ? 0.5 + 0.45 * R.sel : 0.16); W[2] = hnd ? f * (0.14 + 0.86 * R.sel) : 0; W[3] = f * (hnd ? 0.92 + 0.08 * R.sel : 0.7);
        const rr = R.r; R.r = R.dr;                                                                           // (place() reads R.r: the drawn radius; R.r itself stays the true spread)
        const moved = !R.vis || Math.abs(R.cx - R.px) > 0.08 || Math.abs(R.cz - R.pz) > 0.08 || Math.abs(R.r - R.pr) > 0.08; if (moved) { place(R); R.px = R.cx; R.pz = R.cz; R.pr = R.r; R.vis = true; }
        { const [ux, uz, k2] = upOf(R, cam); if (moved || ux * R.pux + uz * R.puz < 0.9998 || Math.abs(k2 - R.pk) > 0.04) placeIcon(R, ux, uz, k2); }
        R.r = rr;
        if (Math.abs(W[0] - R.a[0]) > 0.004 || Math.abs(W[1] - R.a[1]) > 0.004 || Math.abs(W[2] - R.a[2]) > 0.004 || Math.abs(W[3] - R.a[3]) > 0.004) { writeColor(R, W); R.a.set(W); }
      }
      // ghosts: the ring that goes ahead to the finger ('drag') or waits on its target ('staged'); same textures, own slot
      const want = {}; if (gl) for (const g of gl) want[g.t] = g;
      for (const G of ghosts) {
        const g = want[G.t], R = byType[G.t];
        if (!g || !R || !R.vis) { if (G.vis) hide(G); G.init = false; continue; }
        const kf = G.init ? 1 - Math.exp(-dt * 22) : 1;
        if (!G.init) { G.cx = g.x; G.cz = g.z; G.r = R.dr; G.init = true; } else { G.cx += (g.x - G.cx) * kf; G.cz += (g.z - G.cz) * kf; G.r += (R.dr - G.r) * 0.3; }
        const sk = g.mode === 'staged' ? 1 : Math.max(0, Math.min(1, g.prog || 0)), pulse = 0.5 + 0.5 * Math.sin(t * 3.2 + G.k);       // (a dragged ghost turns into the waiting look while the finger holds still on the target)
        G.sel = 0.2 + 0.35 * sk;
        W[0] = 0.5 + sk * (0.2 + 0.2 * pulse); W[1] = 0.4 + 0.3 * sk; W[2] = 0.15 + sk * (0.35 + 0.4 * pulse); W[3] = 0.85 + 0.15 * sk;
        const rr = G.r; G.r = Math.min(G.r, HANDLE_R);
        const moved = !G.vis || Math.abs(G.cx - G.px) > 0.08 || Math.abs(G.cz - G.pz) > 0.08 || Math.abs(G.r - G.pr) > 0.08; if (moved) { place(G); G.px = G.cx; G.pz = G.cz; G.pr = G.r; G.vis = true; }
        { const [ux, uz, k2] = upOf(G, cam); if (moved || ux * G.pux + uz * G.puz < 0.9998 || Math.abs(k2 - G.pk) > 0.04) placeIcon(G, ux, uz, k2); }
        G.r = rr;
        if (!G.a || Math.abs(W[0] - G.a[0]) > 0.004 || Math.abs(W[1] - G.a[1]) > 0.004 || Math.abs(W[2] - G.a[2]) > 0.004 || Math.abs(W[3] - G.a[3]) > 0.004) { writeColor(G, W); G.a.set(W); }
      }
    },
    // where a ring stands and how big it is drawn (null: no ring: the squad has fallen) — for hit tests, tags and lines
    info(type) { const R = byType[type]; return R && R.vis ? { cx: R.cx, cz: R.cz, r: R.dr || R.r, front: _f } : null; },
    dispose() { scene.remove(group); for (const L of layers) { L.geo.dispose(); L.mesh.material.dispose(); L.map.dispose(); } igeo.dispose(); imesh.material.dispose(); atlas.tex.dispose(); },
  };
}
