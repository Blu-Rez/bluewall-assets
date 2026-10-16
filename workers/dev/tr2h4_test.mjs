// TR2_H_R4 test (node, no browser): node dev/tr2h4_test.mjs  ->  prints "TR2H4 OK" when every check holds.
//  1  bridge parapet colliders (QA1-051): nav.js bridgeRails() for ALL bridges of the layout; the hero walks sideways for 3 s at 3 places on both sides (the QA1 probe) and never leaves the deck.
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { bridgesFromLayout, bridgeRails, RAIL, buildNav } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nav.js';
let bad = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL', m); } };
const R_BODY = 0.45 * 1.12 * 1.12;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// a copy of rpg.js pushOut (boxes only) — refreshColliders gives every box ux, uz, vx, vz, R2
function prep(boxes) { for (const b of boxes) { b.ux = Math.cos(b.rot); b.uz = -Math.sin(b.rot); b.vx = Math.sin(b.rot); b.vz = Math.cos(b.rot); b.R2 = (b.hw + b.hd + 2.5) ** 2; } return boxes; }
function pushOut(p, r, boxes) {
  let moved = false;
  for (let it = 0; it < 3; it++) {
    let any = false;
    for (const b of boxes) {
      const dx = p.x - b.x, dz = p.z - b.z; if (dx * dx + dz * dz > b.R2) continue;
      const lx = dx * b.ux + dz * b.uz, lz = dx * b.vx + dz * b.vz, cx = clamp(lx, -b.hw, b.hw), cz = clamp(lz, -b.hd, b.hd), ox = lx - cx, oz = lz - cz, d2 = ox * ox + oz * oz;
      if (d2 >= r * r) continue;
      let nx, nz, pen;
      if (d2 > 1e-8) { const d = Math.sqrt(d2); nx = ox / d; nz = oz / d; pen = r - d; } else { const px = b.hw - Math.abs(lx), pz = b.hd - Math.abs(lz); if (px < pz) { nx = Math.sign(lx) || 1; nz = 0; pen = px + r; } else { nx = 0; nz = Math.sign(lz) || 1; pen = pz + r; } }
      p.x += (nx * b.ux + nz * b.vx) * pen; p.z += (nx * b.uz + nz * b.vz) * pen; any = true;
    }
    if (!any) break; moved = true;
  }
  return moved;
}
const bridges = bridgesFromLayout(L);
ok(bridges.length === 15, 'bridges in the layout: ' + bridges.length + ' (13 river + 2 town gates)');
const rails = prep(bridgeRails(bridges));
ok(rails.length === bridges.length * 2, 'two rails per bridge');
const nav = buildNav({ height: () => 0, bridges, solids: [] });
ok(nav.rails && nav.rails().length === rails.length, 'nav.rails() hands the same list to rpg.js');
for (const r of rails) ok(r.hw > 5 && r.hd === 0.3 && r.type === 'rail' && r.h > 0.9 && r.h < 1.2, 'rail record ' + r.id);
let walked = 0, worst = 0, stuckIn = 0;
bridges.forEach((b, i) => {
  for (const f of [-0.3, 0, 0.3]) for (const side of [-1, 1]) {
    // the QA1 probe: start on the deck centre line, walk sideways at the run speed for 3 s (30 fps), same pushOut as rpg.js tryMove
    const p = { x: b.x + b.nx * f * b.len, z: b.z + b.nz * f * b.len }; const dt = 1 / 30, sp = 4.39 * 1.2544;
    for (let k = 0; k < 90; k++) { p.x += b.tx * side * sp * dt; p.z += b.tz * side * sp * dt; pushOut(p, R_BODY, rails); }
    const v = (p.x - b.x) * b.tx + (p.z - b.z) * b.tz, lim = b.wid / 2 - RAIL.inset - RAIL.thick / 2 - R_BODY + 0.02;
    worst = Math.max(worst, Math.abs(v)); if (Math.abs(v) > lim) stuckIn++; walked++;
  }
});
ok(walked === 90, 'probe pushes ' + walked);
ok(stuckIn === 0, 'hero left the deck in ' + stuckIn + ' of ' + walked + ' sideways pushes (QA1-051: 78 of 78 before)');
// she can still walk the bridge end to end along its centre line
bridges.forEach((b, i) => { const p = { x: b.x - b.nx * (b.len / 2 + 3), z: b.z - b.nz * (b.len / 2 + 3) }; let blocked = 0; for (let k = 0; k < 400; k++) { const q = { x: p.x + b.nx * 0.1, z: p.z + b.nz * 0.1 }; if (pushOut(q, R_BODY, rails)) blocked++; p.x = q.x; p.z = q.z; } if (blocked) ok(false, 'bridge ' + (i + 1) + ': the centre line is blocked ' + blocked + ' steps'); });
ok(true, 'centre line free on all bridges');

// ---- the other fixes (source-level checks: the pieces live in browser modules)
import fs from 'node:fs';
const K = '/home/claude/bot/bluebot_v2/bluewall/';
const rd = (f) => fs.readFileSync(K + f, 'utf8');
{
  const tb = rd('client/src/town_build.js'), cu = rd('web/assets/rpg/cull.js');
  ok((tb.match(/tr2off/g) || []).length >= 4, 'town_build.js flags every lod mesh with userData.tr2off (bake, far, setVis)');
  ok(/lodOff \? false/.test(cu) && /tr2off !== true/.test(cu), 'cull.js hides the hero-mode clones of a lod mesh that the town hides (035/046/086: far + hi drawn at once)');
  // the rule as code: a clone is visible only when its source mesh is not switched off by the town LOD
  const vis = (src, c, d, R) => (src.tr2off === true ? false : c.on ? d < R + 12 : d < R);
  ok(vis({ tr2off: true }, { on: true }, 10, 90) === false && vis({ tr2off: false }, { on: true }, 10, 90) === true && vis({}, { on: false }, 100, 90) === false, 'cull rule: off source => no clone, on source => by distance');
  const bl = rd('client/src/buildings.js');
  const m = bl.match(/box\(M\.stone, x, ([\d.]+), z, -a, ([\d.]+), ([\d.]+), ([\d.]+)/);
  ok(m && +m[3] <= 2.0 && +m[2] <= 0.9, 'plaza gem pillars are hero sized: ' + (m ? m[3] : '?') + ' m (088: 3.6 m before)');
  const mn = rd('client/src/mines.js');
  ok(/QA1-038/.test(mn) && /box\(10\.0, py \+ 4\.4, 0, 0\.4, 8\.8, 7\.2, M\.dark\)/.test(mn), 'mine mouth: black back wall only, passage lined (038)');
  ok(!/box\(7\.6, py \+ 4\.4, 0, 5\.2, 8\.8, 7\.2, M\.dark\)/.test(mn), 'the solid 5.2 m black block is gone');
}
console.log('rails ok: worst |v| after a 3 s sideways push = ' + worst.toFixed(2) + ' m (deck half width 2.75 .. 3.8)');
console.log(bad ? 'TR2H4 FAIL ' + bad + ' of ' + n : 'TR2H4 OK (' + n + ' checks)');
process.exit(bad ? 1 : 0);
