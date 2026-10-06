// The path a squad ring takes to its target: drawn in the language of the rings themselves (squadring.js) — owner 5 Oct 16:32: "the arrow must be unique, in the spirit of the rings".
//   · two bright rails with fine ticks, an inner thin pair, a faint pool of light between them (the ring's rim, its inner line and its pool, stretched into a road)
//   · a band of the same runes the rings carry, with small diamonds on the centre line, flowing towards the target
//   · a pulse of light that runs along the road (the ring's comet) and fades in out of the ring's edge
//   · the head: two nested chevrons in the same thin glowing line, a diamond at the tip
// ONE mesh for all roads and ONE for all heads (normal blending, vertex colour = the squad's colour); the road follows the terrain.  update(list, t, camDist):
//   list = [{ x0, z0, x1, z1, color: THREE.Color, k: 0..1 (how "waiting" it is: a staged road is steadier), a: alpha }]  (world metres, ring edge -> ghost ring edge)
import * as THREE from 'three';

const TAU = Math.PI * 2, NS = 30, MAXP = 12, LIFT = 0.6;
const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
let seed = 20261005; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

function roadTexture() {                                  // 4 : 1 (along : across); the pattern repeats along the road.  Normal blending: a dark soft underlay lets the light line read on bright grass
  const W = 512, H = 128, [c, g] = cvs(W, H);
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (let y = 0; y < H; y++) { const a = Math.pow(Math.sin((Math.PI * (y + 0.5)) / H), 0.9) * 0.34; g.fillStyle = `rgba(24,24,24,${a.toFixed(3)})`; g.fillRect(0, y, W, 1); }      // the dark pool under the light
  for (let y = 0; y < H; y++) { const a = Math.pow(Math.sin((Math.PI * (y + 0.5)) / H), 2.2) * 0.2; g.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`; g.fillRect(0, y, W, 1); }       // a faint light in the middle of it
  const line = (y, wd, al, blur) => { g.shadowBlur = blur; g.shadowColor = '#fff'; g.strokeStyle = '#fff'; g.globalAlpha = al; g.lineWidth = wd; g.beginPath(); g.moveTo(-8, y); g.lineTo(W + 8, y); g.stroke(); };
  g.shadowBlur = 0; g.globalAlpha = 0.5; g.strokeStyle = '#181818'; g.lineWidth = 17; for (const y of [10, H - 10]) { g.beginPath(); g.moveTo(-8, y); g.lineTo(W + 8, y); g.stroke(); }   // dark edge under the rails
  line(10, 8, 1, 12); line(H - 10, 8, 1, 12);                                                                                    // the two rails
  line(27, 3.2, 0.62, 5); line(H - 27, 3.2, 0.62, 5);                                                                            // the inner thin pair
  g.shadowColor = '#fff'; g.strokeStyle = '#fff'; g.shadowBlur = 0; g.globalAlpha = 0.7; g.lineWidth = 3;
  for (let i = 0; i < 32; i++) { const x = i * (W / 32) + 4, l = i % 4 === 0 ? 15 : 8; g.beginPath(); g.moveTo(x, 10); g.lineTo(x, 10 + l); g.moveTo(x, H - 10); g.lineTo(x, H - 10 - l); g.stroke(); }   // ticks
  // the runes (the ring's rune vocabulary): 8 per period, between the inner rails
  g.shadowBlur = 8; g.globalAlpha = 1; g.lineWidth = 5; g.fillStyle = '#fff';
  const cy = H / 2, CELL = W / 8;
  for (let i = 0; i < 8; i++) {
    const cx = (i + 0.5) * CELL, k = (rnd() * 6) | 0, at = (u, v) => [cx + u, cy + v], seg = (u0, v0, u1, v1) => { const p = at(u0, v0), q = at(u1, v1); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); };
    if (k === 0) seg(0, -18, 0, 18);
    else if (k === 1) { seg(0, -18, 0, 18); seg(-10, 0, 10, 0); }
    else if (k === 2) { seg(-10, -18, 0, 0); seg(10, -18, 0, 0); seg(0, 0, 0, 18); }
    else if (k === 3) { seg(0, -18, 0, 6); seg(-10, 18, 0, 6); seg(10, 18, 0, 6); }
    else if (k === 4) { seg(0, -18, 0, 4); g.beginPath(); const p = at(0, 15); g.arc(p[0], p[1], 4.6, 0, TAU); g.fill(); }
    else { seg(-8, -18, -8, 18); seg(8, -18, 8, 18); }
  }
  g.shadowBlur = 12;
  for (const x of [0, W / 2, W]) { const d = 14; g.beginPath(); g.moveTo(x + d, cy); g.lineTo(x, cy + d * 0.62); g.lineTo(x - d, cy); g.lineTo(x, cy - d * 0.62); g.closePath(); g.fill(); }     // diamonds on the centre line
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

function headTexture() {                                  // points along +u: two nested chevrons in the rings' thin glowing line, a diamond at the tip
  const S = 256, [c, g] = cvs(S, S);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const m = S / 2;
  g.fillStyle = 'rgba(255,255,255,0.20)'; g.beginPath(); g.moveTo(24, 38); g.lineTo(214, m); g.lineTo(24, S - 38); g.lineTo(88, m); g.closePath(); g.fill();                  // a faint light inside
  g.shadowBlur = 0; g.strokeStyle = 'rgba(24,24,24,0.5)'; g.lineWidth = 22; g.beginPath(); g.moveTo(18, 26); g.lineTo(206, m); g.lineTo(18, S - 26); g.stroke();                // dark edge under the light line
  g.shadowColor = '#fff'; g.strokeStyle = '#fff'; g.fillStyle = '#fff';
  g.shadowBlur = 16; g.globalAlpha = 1; g.lineWidth = 10;
  g.beginPath(); g.moveTo(18, 26); g.lineTo(206, m); g.lineTo(18, S - 26); g.stroke();                                                                                           // the outer chevron
  g.shadowBlur = 8; g.globalAlpha = 0.8; g.lineWidth = 5;
  g.beginPath(); g.moveTo(80, 70); g.lineTo(168, m); g.lineTo(80, S - 70); g.stroke();                                                                                           // the inner thin chevron
  g.shadowBlur = 14; g.globalAlpha = 1;
  g.beginPath(); g.moveTo(248, m); g.lineTo(228, m + 14); g.lineTo(208, m); g.lineTo(228, m - 14); g.closePath(); g.fill();                                                     // the diamond at the tip
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

export function createRingPaths(scene, { height }) {
  const group = new THREE.Group(); group.name = 'ringPaths'; scene.add(group);
  const TR = roadTexture(), TH = headTexture();
  const NV = (NS + 1) * 2, bpos = new Float32Array(MAXP * NV * 3), buv = new Float32Array(MAXP * NV * 2), bcol = new Float32Array(MAXP * NV * 4), bidx = new Uint16Array(MAXP * NS * 6);
  for (let p = 0; p < MAXP; p++) for (let k = 0; k < NS; k++) { const a = p * NV + k * 2, o = (p * NS + k) * 6; bidx.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], o); }
  const hpos = new Float32Array(MAXP * 12), huv = new Float32Array(MAXP * 8), hcol = new Float32Array(MAXP * 16), hidx = new Uint16Array(MAXP * 6);
  for (let p = 0; p < MAXP; p++) { hidx.set([p * 4, p * 4 + 2, p * 4 + 1, p * 4 + 1, p * 4 + 2, p * 4 + 3], p * 6); huv.set([0, 1, 1, 1, 0, 0, 1, 0], p * 8); }
  const mk = (pos, uv, col, idx, map, order) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 4).setUsage(THREE.DynamicDrawUsage)); geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.setDrawRange(0, 0);
    const m = new THREE.MeshBasicMaterial({ map, vertexColors: true, transparent: true, depthWrite: false, fog: false, toneMapped: false, side: THREE.DoubleSide, blending: THREE.NormalBlending, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
    const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; mesh.renderOrder = order; mesh.name = 'ringPath'; group.add(mesh); return { geo, mesh };
  };
  const B = mk(bpos, buv, bcol, bidx, TR, 3.15), Hd = mk(hpos, huv, hcol, hidx, TH, 3.25);
  const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  return {
    update(list, t, camDist = 170) {
      const n = Math.min(MAXP, list.length);
      B.geo.setDrawRange(0, n * NS * 6); Hd.geo.setDrawRange(0, n * 6);
      if (!n) return;
      TR.offset.x = -t * 0.22;                                                                       // the runes flow towards the target
      const w = Math.max(3.0, Math.min(8.5, camDist * 0.032)), sh = w * 2.6;                           // road width, head size (world metres: about the same on the screen at every zoom)
      for (let p = 0; p < n; p++) {
        const d = list[p], dx = d.x1 - d.x0, dz = d.z1 - d.z0, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L, px = -uz, pz = ux;
        const Lb = Math.max(0.5, L - sh * 0.8), c = d.color, al = d.a == null ? 1 : d.a, k = d.k || 0;
        for (let i = 0; i <= NS; i++) {
          const s = i / NS, dd = s * Lb, cx = d.x0 + ux * dd, cz = d.z0 + uz * dd, v0 = (p * NV + i * 2);
          for (let e = 0; e < 2; e++) {
            const sg = e ? 1 : -1, x = cx + px * sg * w * 0.5, z = cz + pz * sg * w * 0.5, o = (v0 + e) * 3;
            bpos[o] = x; bpos[o + 1] = height(x, z) + LIFT; bpos[o + 2] = z;
            const uo = (v0 + e) * 2; buv[uo] = dd / (w * 4); buv[uo + 1] = e;
            const pulse = 0.5 + 0.5 * Math.cos(TAU * (dd / (w * 9) - t * 0.55)), br = (0.42 + 0.58 * Math.pow(pulse, 2.4)) * (1 - 0.35 * k) + 0.35 * k * 0.8;      // (a light that runs along the road; a waiting road is steadier)
            const a = al * sm(0, 0.16, s) * Math.min(1, br * 1.25), co = (v0 + e) * 4, m = 1.1;
            bcol[co] = c.r * m; bcol[co + 1] = c.g * m; bcol[co + 2] = c.b * m; bcol[co + 3] = a;
          }
        }
        // the head, at the end of the road: its tip on the ghost ring's edge
        const bob = Math.sin(t * 5 + p) * sh * 0.05, tx = d.x1 + ux * bob, tz = d.z1 + uz * bob, bx = tx - ux * sh, bz = tz - uz * sh;
        const corner = (vi, x, z) => { const o = (p * 4 + vi) * 3; hpos[o] = x; hpos[o + 1] = height(x, z) + LIFT + 0.1; hpos[o + 2] = z; const co = (p * 4 + vi) * 4; hcol[co] = c.r * 1.1; hcol[co + 1] = c.g * 1.1; hcol[co + 2] = c.b * 1.1; hcol[co + 3] = al * sm(0, 1, L / (sh * 1.2)); };
        corner(0, bx + px * sh * 0.5, bz + pz * sh * 0.5); corner(1, tx + px * sh * 0.5, tz + pz * sh * 0.5); corner(2, bx - px * sh * 0.5, bz - pz * sh * 0.5); corner(3, tx - px * sh * 0.5, tz - pz * sh * 0.5);
      }
      for (const G of [B.geo, Hd.geo]) { G.attributes.position.needsUpdate = true; G.attributes.color.needsUpdate = true; if (G.attributes.uv) G.attributes.uv.needsUpdate = true; }
    },
    dispose() { scene.remove(group); B.geo.dispose(); B.mesh.material.dispose(); Hd.geo.dispose(); Hd.mesh.material.dispose(); TR.dispose(); TH.dispose(); },
  };
}
