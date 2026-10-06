// Defence preview for the scouting phase (S8, behind FEATURES.scout): the reach of every gun drawn on the ground as a thin ring, in three line styles
//   solid  = hits ground AND air          dashed = ground only (cannon, quad gun)          dotted = air only (none today, kept for the data)
// plus a short red dashed ring for a blind spot (the cannon cannot hit anything closer than that).  Palette: light blue / steel; red only for the danger zone.
// ONE draw call: every ring is a ribbon in a single merged mesh (per-vertex colour + alpha), laid on the terrain once when the battle is built.
// Pure helpers (`gunInfo`, `shareChips`) carry the text and numbers for the defence card and the % chips, so they can be tested without a browser.
import * as THREE from 'three';
import DEFS from './unitdefs.json';

const NAME = { tower: 'Arrow tower', cannon: 'Cannon', wizard: 'Wizard tower', ballista: 'Ballista', quad: 'Quad gun', frost: 'Frost spire', flame: 'Flame tower', dragonbane: 'Dragonbane', keep: 'Keep', tesla: 'Tesla coil' };
// ONE line per gun: what it cannot do / what beats it (no raw HP or damage numbers: owner 16:52)
const WEAK = {
  tower: 'Hits ground and air. Weak against heavy units: send giants or dragons.',
  cannon: 'Ground only, its blast hurts crowds. Blind close up and useless against flyers.',
  wizard: 'Hits ground and air with a small blast. Weak against heavy units.',
  ballista: 'Shoots flyers first, then heavy units. One slow bolt at a time: light swarms slip past it.',
  quad: 'Fast volleys, ground only. It cannot touch flyers.',
  frost: 'Hits ground and air with a chilling blast that slows everything in it. Little damage on its own: it holds the army under the other guns.',
  flame: 'Ground only, short reach. Burns crowds that reach the wall: stay out of its range or send flyers.',
  dragonbane: 'Hits ground and air, but is built for dragons and heavy flyers. Slow bolts: light swarms slip past it.',
  keep: 'Hits everything within reach. The last line of the castle.',
  tesla: 'Chain lightning on ground and air. Weak against heavy units.',
};
export const gunKind = (b) => (b.tesla ? 'tesla' : b.dk || (b.type === 'keep' ? 'keep' : b.type === 'tower' ? 'tower' : b.type === 'ballista' ? 'ballista' : null));
export const isGun = (b) => !!b && !!b.rng && !!gunKind(b);
// -> { kind, name, hits: 'Ground + air' | 'Ground only' | 'Air only', blind: bool, line }
export function gunInfo(b) {
  const k = gunKind(b); if (!k) return null;
  const air = b.air !== false, gnd = b.ground !== false;
  return { kind: k, name: NAME[k] || k, hits: air && gnd ? 'Ground + air' : gnd ? 'Ground only' : 'Air only', blind: (b.minr || 0) > 0, line: WEAK[k] || '' };
}
// share of the destruction % that each part of the base is worth: [{ k: 'Guns', p: 0..1 }, ...] (sums to 1)
export function shareChips(buildings) {
  const c = { Guns: 0, Walls: 0, Houses: 0, Rest: 0 }; let tot = 0;
  for (const b of buildings) {
    const v = b.value || 0; if (v <= 0) continue; tot += v;
    if (b.ring) c.Walls += v; else if (b.type === 'house') c.Houses += v; else if (b.def || b.type === 'keep') c.Guns += v; else c.Rest += v;
  }
  return tot ? Object.entries(c).map(([k, v]) => ({ k, p: v / tot })).filter((e) => e.p > 0.004) : [];
}

const TAU = Math.PI * 2;
export function createThreat(scene, { height }) {
  let mesh = null, own = null, base = null;                                         // own[v] = the gun a vertex belongs to, base = its resting colour (so one gun can be lit and the rest dimmed)
  const REST = 0.55, DIM = 0.16;
  const col = { both: [0.62, 0.83, 1.0, 0.85], ground: [0.86, 0.92, 1.0, 0.85], air: [0.45, 0.89, 1.0, 0.9], blind: [1.0, 0.36, 0.36, 0.9] };
  // pattern: [on, off] in metres along the circle (null = solid)
  const PAT = { both: null, ground: [9, 6], air: [1.6, 4.4], blind: [5, 4] };
  function build(buildings) {
    dispose();
    const pos = [], rgba = [], idx = [], owner = []; let cur = 0;
    const ribbon = (cx, cz, r, a0, a1, w, c) => {                                   // one arc as a strip of quads, following the terrain
      const n = Math.max(2, Math.ceil(((a1 - a0) * r) / 2.2)); let base = pos.length / 3;
      for (let i = 0; i <= n; i++) {
        const a = a0 + ((a1 - a0) * i) / n, ca = Math.cos(a), sa = Math.sin(a);
        for (const rr of [r - w / 2, r + w / 2]) { const x = cx + ca * rr, z = cz + sa * rr; pos.push(x, height(x, z) + 0.45, z); rgba.push(c[0], c[1], c[2], c[3]); owner.push(cur); }
        if (i) { const q = base + (i - 1) * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
      }
    };
    const ring = (cx, cz, r, style, w = 0.9) => {
      const pat = PAT[style], c = col[style]; if (r < 3) return;
      if (!pat) { ribbon(cx, cz, r, 0, TAU, w, c); return; }
      const period = (pat[0] + pat[1]) / r, on = pat[0] / r, N = Math.max(1, Math.round(TAU / period)), per = TAU / N, onA = (on / (period)) * per;
      for (let i = 0; i < N; i++) ribbon(cx, cz, r, i * per, i * per + onA, w, c);
    };
    const seen = new Set();
    for (const b of buildings) {
      if (b.dead || !isGun(b)) continue;
      const key = Math.round(b.x * 2) + ':' + Math.round(b.z * 2) + ':' + Math.round(b.rng); if (seen.has(key)) continue; seen.add(key);
      const air = b.air !== false, gnd = b.ground !== false; cur = b.id;
      ring(b.x, b.z, b.rng, air && gnd ? 'both' : gnd ? 'ground' : 'air');
      if ((b.minr || 0) > 0) ring(b.x, b.z, b.minr, 'blind', 0.8);
    }
    const g = new THREE.BufferGeometry();
    own = Uint32Array.from(owner); base = Float32Array.from(rgba); for (let i = 3; i < base.length; i += 4) base[i] *= REST / 0.85;
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(base.slice(), 4)); g.setIndex(idx);
    const m = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 4; mesh.visible = false; scene.add(mesh);
    return idx.length / 3;
  }
  // light ONE gun's rings (full strength, a touch thicker is not needed) and dim the others; null = all at rest
  function focus(id) {
    if (!mesh) return; const a = mesh.geometry.attributes.color.array;
    for (let i = 0; i < own.length; i++) { const hi = id != null && own[i] === id; a[i * 4 + 3] = hi ? Math.min(1, base[i * 4 + 3] * 1.75) : id != null ? base[i * 4 + 3] * (DIM / REST) : base[i * 4 + 3]; }
    mesh.geometry.attributes.color.needsUpdate = true;
  }
  function dispose() { if (!mesh) return; scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); mesh = null; own = base = null; }
  return { build, focus, show(on) { if (mesh) { mesh.visible = !!on; if (!on) focus(null); } }, get on() { return !!mesh && mesh.visible; }, dispose };
}
