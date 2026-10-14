import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { makeCam } from '/home/claude/dev/a2_cam.mjs';
import { fallsMetrics } from '/home/claude/dev/a2_fallsm.mjs';
L.setMap('night'); L.STREAMS.length = 0;
const res = [];
const cam = makeCam();
for (let x = -112; x <= -56; x += 4) for (let z = -430; z <= -392; z += 4) {
  for (const ang of [90, 80, 100, 70, 110]) { // direction of travel from P0 to the mouth, degrees (90 = +z, i.e. south toward the town)
    const a = ang * Math.PI / 180, mx = x + Math.cos(a) * 30, mz = z + Math.sin(a) * 30;
    const nat = L.height(x, z), natM = L.height(mx, mz);
    L.STREAMS.length = 0; L.STREAMS.push({ pts: [[x, z], [mx, mz], [mx + Math.cos(a) * 20, mz + Math.sin(a) * 20]], k: 1 });
    const f = fallsMetrics(L.STREAMS[0].pts);
    if (f.fall && f.drop > 40 && natM < 30) { const a1 = cam.proj(f.foot[0], 2, f.foot[1]), a2 = cam.proj(f.crest[0], f.hTop, f.crest[1]); res.push({ x, z, ang, natM: +natM.toFixed(0), drop: f.drop, foot: f.foot.join(','), crest: f.crest.join(','), px_foot: a1.slice(0, 2).map(Math.round).join(','), px_crest: a2.slice(0, 2).map(Math.round).join(',') }); }
  }
}
res.sort((a, b) => b.drop - a.drop); console.log(res.length, 'candidates'); for (const r of res.slice(0, 14)) console.log(JSON.stringify(r));
