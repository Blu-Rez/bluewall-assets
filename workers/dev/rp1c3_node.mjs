// rp1c3_node.mjs — RP1C_R3: the pure parts, in node.   (1) rp_grid.js edt2(): the exact distance transform equals brute force on random fields (the same Float32 arrays and INF the game uses);
//   (2) ramps.js planRamps(): on a synthetic ring (octagon of walls, a few discs / houses / a pond) every ramp keeps the brief: grade <= 0.33, lane width >= 2.4 m, parapets on the outer side, the surface rises from the foot
//   to the wall-walk without a step, no footprint in water / on a disc / on a house, feet >= 3.2 m apart.   run: node /home/claude/dev/rp1c3_node.mjs   -> «NODE OK»
import { edt2 } from '/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/rp_grid.js';
import { planRamps, RAMP, surfaceAt, segHeight } from '/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/ramps.js';
let fails = 0; const ok = (c, m) => { if (!c) { console.log('FAIL', m); fails++; } else console.log('ok  ', m); };
// ---- 1. edt2 vs brute force
{
  const INF = 1e12; let seed = 99; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296; let worst = 0, cases = 0, cells = 0, bad = 0;
  for (const [W, dens] of [[48, 0.004], [64, 0.02], [64, 0.1], [96, 0.0015], [33, 0.3]]) for (let rep = 0; rep < 8; rep++) {
    const f = new Float32Array(W * W).fill(INF), pts = []; for (let k = 0; k < W * W; k++) if (rnd() < dens) { f[k] = 0; pts.push([k % W, (k / W) | 0]); } if (!pts.length) { f[(W * W) >> 1] = 0; pts.push([(W >> 1), (W >> 1)]); }
    const v = new Int32Array(W), z = new Float32Array(W + 1), g = new Float32Array(W); edt2(f, W, v, z, g); cases++;
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { let m = 1e18; for (const [px, py] of pts) { const d = (px - x) * (px - x) + (py - y) * (py - y); if (d < m) m = d; } const e = Math.abs(f[y * W + x] - m); cells++; if (e > 0.5) bad++; worst = Math.max(worst, e); }
  }
  ok(bad === 0, 'edt2: ' + cases + ' random fields, ' + cells + ' cells, exact (worst error ' + worst + ' cell², ' + bad + ' wrong)');
  const f = new Float32Array(16).fill(INF), v = new Int32Array(4), z = new Float32Array(5), g = new Float32Array(4); f[5] = 0; edt2(f, 4, v, z, g); ok(f[5] === 0 && f[6] === 1 && f[10] === 2 && f[15] === 8, 'edt2: a single solid at (1,1): 0 / 1 / 2 / 8 at (1,1) (2,1) (2,2) (3,3)');
}
// ---- 2. the ramp planner on a synthetic ring
{
  const boxes = [], N = 8, R = 60, hw = R * Math.sin(Math.PI / N) + 1; for (let i = 0; i < N; i++) { const a = (i + 0.5) * 2 * Math.PI / N, x = Math.cos(a) * R * Math.cos(Math.PI / N), z = Math.sin(a) * R * Math.cos(Math.PI / N); boxes.push({ x, z, hw, hd: 1.5, rot: -a + Math.PI / 2, h: 8, type: 'wall', ringId: 'outer', id: 'w' + i }); }
  const houses = [{ x: 0, z: 56, hw: 4, hd: 4, rot: 0, h: 5, type: 'house', id: 'h0' }, { x: 40, z: 42, hw: 3, hd: 3, rot: 0.3, h: 5, type: 'house', id: 'h1' }];
  const discs = [[-30, 52, 1.2], [20, -55, 1.5], [-56, 10, 2]];
  const pond = (x, z) => Math.hypot(x - 58, z - 22) < 9 ? -2 : 0;
  const D = { boxes: [...boxes, ...houses], discs, rects: [], ground: pond, wsurf: -0.75, topY: (b) => b.h, max: { outer: 6 } };
  const rs = planRamps(D); ok(rs.length >= 4, 'planner: ' + rs.length + ' ramps on the 8-wall ring (>= 4)');
  let g = 0, lane = 1e9, topOk = true, para = true, stepMax = 0, gMax = 0, overlap = 0, water = 0, foot = [];
  for (const r of rs) {
    g = Math.max(g, r.grade); for (const s of r.segs) if (s.k === 'flight') lane = Math.min(lane, 2 * s.hwid); topOk = topOk && !!r.topSeg && Math.abs(r.topSeg.y1 - 8) < 1e-6; para = para && r.boxes.length >= 4 && r.boxes.every((b) => b.h >= RAMP.para - 1e-9 && b.type === 'ramp');
    const pts = []; for (const s of r.segs) { const n = Math.max(2, Math.ceil(2 * s.hl / 0.25)); for (let k = 0; k <= n; k++) { const a = s.a0 + (s.a1 - s.a0) * k / n, [x, z] = r.W(a, (s.l0 + s.l1) / 2); pts.push([x, z, s]); } }
    for (const [x, z, s] of pts) { if (pond(x, z) < -0.75 + 0.4) water++; for (const d of discs) if (Math.hypot(x - d[0], z - d[1]) < d[2] + 0.5 - 1e-6) overlap++; for (const h of houses) { const c = Math.cos(h.rot), sn = Math.sin(h.rot), u = (x - h.x) * c - (z - h.z) * sn, v = (x - h.x) * sn + (z - h.z) * c; if (Math.abs(u) < h.hw + 1 && Math.abs(v) < h.hd + 1) overlap++; } }
    // the walked line (the centre of every flight): the surface rises smoothly; sample every 0.25 m of the route and measure the local grade + the biggest vertical step
    const R2 = []; for (const s of r.segs) { const n = Math.max(2, Math.ceil(2 * s.hl / 0.25)); for (let k = 0; k <= n; k++) { const a = s.a0 + (s.a1 - s.a0) * k / n, [x, z] = r.W(a, (s.l0 + s.l1) / 2); R2.push([x, z, surfaceAt(r.segs, x, z)]); } }
    for (let k = 1; k < R2.length; k++) { const dd = Math.hypot(R2[k][0] - R2[k - 1][0], R2[k][1] - R2[k - 1][1]); if (dd > 0.05 && dd < 0.6) { const gr = Math.abs(R2[k][2] - R2[k - 1][2]) / dd; gMax = Math.max(gMax, gr); stepMax = Math.max(stepMax, Math.abs(R2[k][2] - R2[k - 1][2])); } }
    foot.push(r.W(r.segs[0].a0 - r.segs[0].da * 2.2, (r.segs[0].l0 + r.segs[0].l1) / 2));
  }
  ok(g <= 0.33 + 1e-9, 'every ramp: planned grade <= 0.33 (max ' + g.toFixed(3) + ')'); ok(gMax <= 0.34, 'walked line: local grade <= 0.34 sampled every 0.25 m (max ' + gMax.toFixed(3) + ')'); ok(stepMax <= 0.1, 'walked line: no step taller than 10 cm (max ' + stepMax.toFixed(3) + ' m per 0.25 m)');
  ok(lane >= 2.4, 'flight width >= 2.4 m (min ' + lane.toFixed(2) + ')'); ok(topOk, 'every ramp ends on the wall-walk at its top height (8 m)'); ok(para, 'parapet boxes on every ramp (type ramp, >= ' + RAMP.para + ' m high)');
  ok(water === 0 && overlap === 0, 'no footprint in water / on a disc / on a house (' + water + ' / ' + overlap + ')'); let near = 1e9; for (let i = 0; i < foot.length; i++) for (let j = i + 1; j < foot.length; j++) near = Math.min(near, Math.hypot(foot[i][0] - foot[j][0], foot[i][1] - foot[j][1])); ok(near > 3.2, 'feet >= 3.2 m apart (closest ' + near.toFixed(1) + ' m)');
  const rs2 = planRamps({ ...D, boxes: D.boxes.map((b) => ({ ...b })) }); ok(rs2.length === rs.length && rs2.every((r, i) => r.wallId === rs[i].wallId && r.design === rs[i].design && r.dir === rs[i].dir), 'deterministic: the same plan twice');
  const D3 = { ...D, boxes: D.boxes.map((b) => ({ ...b, h: b.type === 'wall' ? 1.5 : b.h })) }; ok(planRamps(D3).length === 0, 'walls lower than 2.4 m get no ramp');
}
console.log(fails ? 'NODE FAILED' : 'NODE OK'); process.exit(fails ? 1 : 0);
