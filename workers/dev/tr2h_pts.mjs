// tr2h_pts.mjs — camera stations for the TR2_H bridge / water-gate / quay audit (world coords from the layout the game builds)
import * as L from '../bot/bluebot_v2/bluewall/client/src/layout.js';
import { bridgesFromLayout } from '../bot/bluebot_v2/bluewall/client/src/nav.js';
const br = bridgesFromLayout(L), out = [];
const pick = Object.fromEntries((process.env.PICK || '0:gate_moat_E,1:gate_moat_W,2:road_stone_22x7,4:foot_22x5,8:long_50x5').split(',').map((x) => { const [i, n] = x.split(':'); return [i, n]; }));      // PICK=index:name,... (the bridge list of nav.js bridgesFromLayout)
for (const [i, name] of Object.entries(pick)) {
  const b = br[+i]; if (!b) continue; const fl = new Set((process.env.FLIP || '').split(',')).has(i) ? -1 : 1;    // FLIP=index,...: the hero starts at the other end and looks back
  const n = [b.nx * fl, b.nz * fl], yaw = Math.atan2(n[0], n[1]), half = b.len / 2;
  out.push({ name, kind: 'bridge', len: b.len, wid: b.wid, x: +b.x.toFixed(1), z: +b.z.toFixed(1), yaw: +yaw.toFixed(3),
    startPos: [+(b.x - n[0] * (half + 9)).toFixed(1), +(b.z - n[1] * (half + 9)).toFixed(1)], midPos: [+(b.x - n[0] * 4).toFixed(1), +(b.z - n[1] * 4).toFixed(1)] });
}
// water gates (river through the town wall)
for (const [k, W] of (L.WGATES || []).entries()) {
  const a = L.TOWN[W.seg], b = L.TOWN[(W.seg + 1) % L.TOWN.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]), cx = a[0] + (b[0] - a[0]) / l * W.c, cz = a[1] + (b[1] - a[1]) / l * W.c;
  const no = L.segNormalOut(L.TOWN, W.seg), yaw = Math.atan2(-no[0], -no[1]);       // looking INTO the town through the gate
  out.push({ name: 'water_gate_' + k, kind: 'wgate', x: +cx.toFixed(1), z: +cz.toFixed(1), yaw: +yaw.toFixed(3), startPos: [+(cx + no[0] * 14).toFixed(1), +(cz + no[1] * 14).toFixed(1)], midPos: [+(cx + no[0] * 5).toFixed(1), +(cz + no[1] * 5).toFixed(1)] });
}
// the stone quay of the river canal inside the town: the first river segment well inside the wall that is not under a bridge
const P = L.RIVER; let q = null;
for (let i = 0; i < P.length - 1 && !q; i++) { const a = P[i], b = P[i + 1], cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2; if (L.sdTown(cx, cz) < -8 && !br.some((B) => Math.hypot(B.x - cx, B.z - cz) < 22)) { const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l; q = { cx, cz, nx, nz, ux: dx / l, uz: dz / l }; } }
if (q) out.push({ name: 'river_quay', kind: 'quay', x: +q.cx.toFixed(1), z: +q.cz.toFixed(1), yaw: +Math.atan2(-q.nx, -q.nz).toFixed(3), startPos: [+(q.cx + q.nx * 14).toFixed(1), +(q.cz + q.nz * 14).toFixed(1)], midPos: [+(q.cx + q.nx * 7.5).toFixed(1), +(q.cz + q.nz * 7.5).toFixed(1)] });
console.log(JSON.stringify({ lakeJettyAng: null, pts: out }));
