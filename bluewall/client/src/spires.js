// p35: the two new roof-top defences of the castle (owner: "new defences").  castle.js lifts the roof off a roofed tower and asks for a 'frost' or a 'flame' site on its cap
// (ctx.weapon(x, y, z, a, kind, R): y = the top of the cap, R = the tower radius); here the thing that stands on it is built, as plain meshes of a few dozen triangles each:
//   FROST SPIRE  a tall spire of ice crystals (a main spire, a ring of leaning shards, icicles hanging from the rim) with a cold blue glow that pulses; it flares when it fires
//   FLAME TOWER  a black-iron brazier bowl on three legs with outward spikes, glowing coals and a roaring flame (additive sprites, no real light); it flares when it fires
// Same handle as wizards.js / cannons.js:  update(t, dt, camera)  fire(tid, x, y, z)  hide(tid)  reset()  replace(tids)  setManual(on)  has(tid)  count
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const _c = new THREE.Color(), _d = new THREE.Color();
// a vertex gradient bottom -> top on a geometry (any bounds)
function grad(g, lo, hi, p = 1) {
  g = g.index ? g.toNonIndexed() : g;
  const pos = g.attributes.position, n = pos.count, col = new Float32Array(n * 3); let y0 = 1e9, y1 = -1e9;
  for (let i = 0; i < n; i++) { y0 = Math.min(y0, pos.getY(i)); y1 = Math.max(y1, pos.getY(i)); }
  _c.set(lo); _d.set(hi);
  for (let i = 0; i < n; i++) { const k = Math.pow((pos.getY(i) - y0) / (y1 - y0 || 1), p), c = new THREE.Color().copy(_c).lerp(_d, k); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.deleteAttribute('uv'); return g;
}
const flat = (g, hex) => { g = g.index ? g.toNonIndexed() : g; const n = g.attributes.position.count, col = new Float32Array(n * 3); _c.set(hex); for (let i = 0; i < n; i++) { col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; } g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.deleteAttribute('uv'); return g; };
// one ice crystal: a hexagonal prism that ends in a point, base at the origin, along +y; tilted by (tx, tz) radians, turned by `spin`
function crystal(r, h, tip, tx, tz, spin, px, py, pz) {
  const prism = new THREE.CylinderGeometry(r, r * 1.08, h - tip, 6, 1, true); prism.translate(0, (h - tip) / 2, 0);
  const cone = new THREE.ConeGeometry(r, tip, 6); cone.translate(0, h - tip + tip / 2, 0);
  const g = mergeGeometries([prism.toNonIndexed(), cone.toNonIndexed()], false);
  g.rotateY(spin); g.rotateX(tx); g.rotateZ(tz); g.translate(px, py, pz);
  return g;
}
function frostGeo(R) {
  const g = [];
  const rr = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647, rnd = rr(11);
  g.push(grad(crystal(1.0, 12.5, 4.2, 0, 0, 0.3, 0, 0, 0), 0x2f6fd0, 0xeaf9ff, 0.8));                                  // the great spire
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + 0.2, lean = 0.34 + 0.14 * rnd(); g.push(grad(crystal(0.62 + 0.14 * rnd(), 6.2 + 2.2 * rnd(), 2.4, lean * Math.cos(a), -lean * Math.sin(a), rnd() * 3, Math.sin(a) * 1.3, -0.1, Math.cos(a) * 1.3), 0x2760c0, 0xcff1ff, 0.9)); }
  for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.9, lean = 0.12; g.push(grad(crystal(0.5, 4 + 1.2 * rnd(), 1.7, lean * Math.cos(a), -lean * Math.sin(a), rnd() * 3, Math.sin(a) * 0.5, 4.2 + 1.5 * rnd(), Math.cos(a) * 0.5), 0x4a8be0, 0xf4fdff, 0.9)); }
  const n = 14;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + 0.1, len = 1.0 + 1.6 * rnd(), c = new THREE.ConeGeometry(0.26, len, 5); c.rotateX(Math.PI); c.translate(Math.sin(a) * (R + 1.15), -len / 2 - 0.15, Math.cos(a) * (R + 1.15)); g.push(grad(c, 0xe8f8ff, 0x7fb6f0, 1)); }   // icicles from the rim
  g.push(flat(new THREE.CylinderGeometry(R + 1.2, R + 1.2, 0.3, 18).translate(0, 0.0, 0), 0xdfeaf6));                    // a rim of frost on the cap
  return mergeGeometries(g, false);
}
function flameGeo(R) {
  const g = [], S = 0x232a38, N = 0x1a2f66;
  const bowl = new THREE.LatheGeometry([[0, 0.0], [0.8, 0.02], [1.7, 0.7], [2.45, 1.8], [2.7, 2.5], [2.42, 2.5], [2.2, 1.95], [1.4, 1.15], [0, 1.0]].map(([r, y]) => new THREE.Vector2(r, y + 1.6)), 14);
  g.push(flat(bowl, S));
  g.push(flat(new THREE.TorusGeometry(2.58, 0.17, 5, 20).rotateX(Math.PI / 2).translate(0, 4.1, 0), N));                    // a navy rim band
  g.push(flat(new THREE.CylinderGeometry(0.55, 0.9, 1.7, 8).translate(0, 0.85, 0), S));                                    // the stem
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2, c = new THREE.CylinderGeometry(0.16, 0.24, 2.6, 5); c.translate(0, 1.3, 0); c.rotateZ(0.5); c.rotateY(a); g.push(flat(c, S)); }   // three legs to the cap
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, c = new THREE.ConeGeometry(0.2, 1.3, 5); c.translate(0, 0.65, 0); c.rotateZ(-0.7); c.rotateY(a); c.translate(Math.sin(a) * 2.6, 4.1, Math.cos(a) * 2.6); g.push(flat(c, 0x3a4458)); }   // spikes round the rim
  g.push(flat(new THREE.CylinderGeometry(R + 1.3, R + 1.3, 0.35, 18).translate(0, 0.0, 0), 0x2d3547));                      // an iron collar on the cap
  return mergeGeometries(g, false);
}

export function createSpires({ scene, M, sites }) {
  const none = { update() {}, count: 0, fire() {}, hide() {}, reset() {}, replace() {}, setManual() {}, has: () => false };
  if (!sites || !sites.length) return none;
  const iceM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.18, metalness: 0.05, emissive: 0x3d8cff, emissiveIntensity: 0.55, flatShading: true, transparent: true, opacity: 0.94 });
  const ironM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.7, flatShading: true });
  const coalM = new THREE.MeshBasicMaterial({ color: 0xff5a1a, toneMapped: false });
  const mkSprite = (map, color, op) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: op })); return s; };
  const geoF = new Map(), geoB = new Map();
  const S = sites.map((s, i) => {
    const R = s.r || 3, grp = new THREE.Group(); grp.position.set(s.x, s.y, s.z);
    const o = { s, grp, flare: 0, dead: false, repl: false, seed: Math.random() * 10 + i, parts: {} };
    if (s.kind === 'frost') {
      if (!geoF.has(R)) geoF.set(R, frostGeo(R));
      const m = new THREE.Mesh(geoF.get(R), iceM); m.position.y = 0.2; m.castShadow = true; grp.add(m);
      const gl = mkSprite(M.glowBlue, 0x7fc4ff, 0.55); gl.position.y = 6.4; gl.scale.setScalar(15); grp.add(gl);
      const core = mkSprite(M.glowWhite, 0xcfeeff, 0.5); core.position.y = 7.4; core.scale.setScalar(6); grp.add(core);
      o.parts = { gl, core };
    } else {
      if (!geoB.has(R)) geoB.set(R, flameGeo(R));
      const m = new THREE.Mesh(geoB.get(R), ironM); m.position.y = 0.2; m.castShadow = true; grp.add(m);
      const coals = new THREE.Mesh(new THREE.CircleGeometry(2.3, 14).rotateX(-Math.PI / 2), coalM); coals.position.y = 0.2 + 2.62; grp.add(coals);
      const f1 = mkSprite(M.glow, 0xff5a14, 0.95), f2 = mkSprite(M.glow, 0xffa030, 0.95), f3 = mkSprite(M.glowWhite, 0xfff0b0, 0.9), halo = mkSprite(M.glow, 0xff7a24, 0.35);
      for (const f of [halo, f1, f2, f3]) grp.add(f);
      o.parts = { f1, f2, f3, halo, coals };
    }
    scene.add(grp); return o;
  });
  let manual = false, tt = 0;
  const vis = (b) => { b.grp.visible = !(b.dead || b.repl); };
  function update(t, dt) {
    tt += dt;
    for (const b of S) {
      if (b.dead || b.repl) continue;
      b.flare = Math.max(0, b.flare - dt * 2.2);
      const k = tt + b.seed, fl = b.flare;
      if (b.s.kind === 'frost') {
        const p = 0.5 + 0.5 * Math.sin(k * 1.7), { gl, core } = b.parts;
        iceM.emissiveIntensity = 0.55 + 0.15 * Math.sin(tt * 1.3);
        gl.scale.setScalar(14 + 2.5 * p + fl * 9); gl.material.opacity = 0.5 + 0.12 * p + fl * 0.4;
        core.scale.setScalar(5.5 + p + fl * 5); core.material.opacity = 0.45 + 0.15 * p + fl * 0.5;
      } else {
        const { f1, f2, f3, halo } = b.parts, j = (a) => Math.sin(k * a) * 0.5 + Math.sin(k * a * 1.9 + 1) * 0.3;
        f1.position.set(j(7.1) * 0.3, 6.6 + 0.3 * j(5.3) + fl * 0.8, j(6.3) * 0.3); f1.scale.set(10.5 + j(9) * 1.4 + fl * 5, 15 + j(11) * 2.2 + fl * 8, 1);
        f2.position.set(j(8.3) * 0.25, 7.6 + 0.4 * j(6.1) + fl * 1.2, j(7.7) * 0.25); f2.scale.set(6.6 + j(12) * 1.1 + fl * 4, 12 + j(10) * 2 + fl * 6, 1);
        f3.position.set(0, 5.6 + 0.2 * j(9.7), 0); f3.scale.set(4.4 + j(13) * 0.6 + fl * 2.5, 6.8 + j(14) * 1.0 + fl * 3.5, 1);
        halo.position.set(0, 6.6, 0); halo.scale.setScalar(26 + fl * 10); halo.material.opacity = 0.32 + 0.06 * j(4) + fl * 0.3;
      }
    }
  }
  return {
    update, count: S.length, S,
    has: (tid) => S.some((b) => b.s.tid === tid),
    setManual(on) { manual = on; void manual; },
    fire(tid) { for (const b of S) if (b.s.tid === tid && !b.dead) b.flare = 1; },
    hide(tid) { for (const b of S) if (b.s.tid === tid) { b.dead = true; vis(b); } },
    replace(tids) { const set = new Set(tids || []); for (const b of S) { b.repl = set.has(b.s.tid); vis(b); } },
    reset() { for (const b of S) { b.dead = false; b.flare = 0; vis(b); } },
  };
}
