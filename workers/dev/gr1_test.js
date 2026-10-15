import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads, ROADS, YARDS } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { planTown } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b1_townplan.js';
import { layoutFromGame } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b1_layout.js';
import * as THREE from 'three';
import { __buildMap, __HALF, GLSL_SRC, LOOKS, groundKind, groundH, createGround } from '/home/claude/bot/bluebot_v2/bluewall/client/src/ground_near.js';
import { hamlets } from '/home/claude/bot/bluebot_v2/bluewall/client/src/hamlets.js';
import { nomads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nomads.js';
import { planQuarter } from '/home/claude/bot/bluebot_v2/bluewall/client/src/storeyards.js';          // mother (GR1 + ST1 merge): the door of every Treasury Quarter yard is a destination
L.setMap('night'); buildRoads();
const LV = L.MOAT.level, out = { dead: [], wet: [], houses: [], cross: [], stats: {} };
const segD = (px, pz, a, b) => { const dx = b[0]-a[0], dz = b[1]-a[1], l2 = dx*dx+dz*dz||1, t = Math.max(0, Math.min(1, ((px-a[0])*dx+(pz-a[1])*dz)/l2)); return Math.hypot(px-(a[0]+dx*t), pz-(a[1]+dz*t)); };
const dRoad = (x, z, skip) => { let d = 1e9, who = null; for (const R of ROADS) { if (R === skip) continue; for (let i = 0; i < R.pts.length-1; i++) { const q = segD(x, z, R.pts[i], R.pts[i+1]) - R.w/2; if (q < d) { d = q; who = R.name; } } } return [d, who]; };
// destinations an end may legitimately stop at
const dest = [];
const G = L.GATE; dest.push(['gate', G.x, G.z, 12]);
for (const g of L.TGATES) dest.push(['tgate', g.x, g.z, 12]);
for (const m of L.MINES) dest.push(['mine_' + m.id, m.x, m.z, 40]);
for (const s of L.SITES || []) dest.push(['site_' + s.id, s.x, s.z, s.r + 6]);
dest.push(['camp', L.CAMP.x, L.CAMP.z, L.CAMP.r + 8]); dest.push(['pasture', L.PASTURE.x, L.PASTURE.z, L.PASTURE.r + 10]);
dest.push(['lake', L.LAKE.x, L.LAKE.z, L.LAKE.r + 14]); dest.push(['plaza', L.PLAZA.x, L.PLAZA.z, L.PLAZA.r + 6]);
for (const h of hamlets()) dest.push(['hamlet', h.x, h.z, 24]);
for (const n of nomads()) dest.push(['nomad', n.x, n.z, 20]);
for (const F of L.FARMS) dest.push(['field', F.x, F.z, Math.max(F.w, F.d) / 2 + 20]);
dest.push(['windmill', L.WINDMILL.x, L.WINDMILL.z, 24]);
for (const y of YARDS) dest.push(['yard_'+y.kind, y.x, y.z, y.r+2]);
{ const Q = planQuarter(); if (Q) for (const y of [...Q.stores, ...Q.vaults]) dest.push(['storeyard_' + y.id, y.x + Math.sin(y.ry) * 8, y.z + Math.cos(y.ry) * 8, 6]); }      // (door = local +z)
const nearWater = (x,z)=>{for(let a=0;a<6.3;a+=0.7)for(const r of [3,6,9])if(L.height(x+Math.cos(a)*r,z+Math.sin(a)*r)<LV+0.2)return true;return false;};
const nearDest = (x, z) => { let b = null, bd = 1e9; for (const [n, dx, dz, r] of dest) { const d = Math.hypot(x-dx, z-dz) - r; if (d < bd) { bd = d; b = n; } } return [bd, b]; };
// bridges
const gateZone = (x, z) => (L.TGATES||[]).some((g) => Math.hypot(g.x-x, g.z-z) < 34);
const onBridge = (x, z) => (L.RBRIDGES || []).some((b) => { const rx = x-b.x, rz = z-b.z, along = rx*b.nx+rz*b.nz, side = -rx*b.nz+rz*b.nx; return Math.abs(along) <= b.len/2+1 && Math.abs(side) <= b.wid/2+1.5; });
for (const R of ROADS) {
  if (R.closed) continue;
  let len = 0; for (let i = 0; i < R.pts.length-1; i++) len += Math.hypot(R.pts[i+1][0]-R.pts[i][0], R.pts[i+1][1]-R.pts[i][1]);
  for (const [k, p] of [['start', R.pts[0]], ['end', R.pts[R.pts.length-1]]]) {
    const [dr, who] = dRoad(p[0], p[1], R), [dd, dn] = nearDest(p[0], p[1]);
    if (dr > 2.75 && dd > 3 && !nearWater(p[0],p[1])) out.dead.push({ road: R.name, end: k, at: p.map((v) => +v.toFixed(0)), nearestRoadGap: +dr.toFixed(1), nearestRoad: who, nearestDest: dn, destGap: +dd.toFixed(1) });
  }
  // water: sample centre + both edges every 2 m
  let wetRun = 0, worst = 0, wp = null;
  for (let i = 0; i < R.pts.length-1; i++) { const a = R.pts[i], b = R.pts[i+1], l = Math.hypot(b[0]-a[0], b[1]-a[1]), nx = -(b[1]-a[1])/l, nz = (b[0]-a[0])/l;
    for (let s = 0; s < l; s += 2) { const x = a[0]+(b[0]-a[0])*s/l, z = a[1]+(b[1]-a[1])*s/l;
      for (const o of [0, R.w/2, -R.w/2]) { const px = x+nx*o, pz = z+nz*o; const h = L.height(px, pz); if (h < LV+0.05 && !onBridge(px, pz) && !gateZone(px, pz)) { wetRun++; if (LV+0.05-h > worst) { worst = LV+0.05-h; wp = [+px.toFixed(0), +pz.toFixed(0)]; } } } } }
  if (wetRun) out.wet.push({ road: R.name, wetSamples: wetRun, deepest: +worst.toFixed(2), at: wp });
}
// houses vs roads (planTown level 50 = the whole plan)
const lay = layoutFromGame(); const plan = planTown(lay, 50);
const inRect = (x, z, p, m) => { const c = Math.cos(p.ry), s = Math.sin(p.ry), rx = x-p.x, rz = z-p.z, u = rx*c - rz*s, v = rx*s + rz*c; return Math.abs(u) <= p.w/2+m && Math.abs(v) <= p.d/2+m; };
const inRect2 = (x, z, p, m) => inRect(x, z, p, m) || (() => { const c = Math.cos(-p.ry), s = Math.sin(-p.ry), rx = x-p.x, rz = z-p.z, u = rx*c - rz*s, v = rx*s + rz*c; return Math.abs(u) <= p.w/2+m && Math.abs(v) <= p.d/2+m; })();
const hits = {};
for (const R of ROADS) for (let i = 0; i < R.pts.length-1; i++) { const a = R.pts[i], b = R.pts[i+1], l = Math.hypot(b[0]-a[0], b[1]-a[1]);
  for (let s = 0; s <= l; s += 1.5) { const x = a[0]+(b[0]-a[0])*s/l, z = a[1]+(b[1]-a[1])*s/l;
    for (const p of plan) { if (!p.w || !p.d) continue; if (Math.abs(p.x-x) > 40 || Math.abs(p.z-z) > 40) continue; if ((p.kind==='stores'||p.kind==='vault'||p.kind==='market') ? false : inRect(x, z, p, R.w/2 - 0.2)) { const key = R.name + '|' + p.id; hits[key] = (hits[key]||0)+1; } } } }

// stores / vaults / market are circles of radius r (fixed items)
for (const R of ROADS) for (let i = 0; i < R.pts.length-1; i++) { const a = R.pts[i], b = R.pts[i+1], l = Math.hypot(b[0]-a[0], b[1]-a[1]);
  for (let s = 0; s <= l; s += 1.5) { const x = a[0]+(b[0]-a[0])*s/l, z = a[1]+(b[1]-a[1])*s/l;
    for (const p of plan) { if (p.kind !== 'stores' && p.kind !== 'vault') continue; const c_=Math.cos(p.ry), s_=Math.sin(p.ry), rx_=x-p.x, rz_=z-p.z, u_=rx_*c_-rz_*s_, v_=rx_*s_+rz_*c_-0.9; if (Math.abs(u_) < 7.8 + R.w/2 - 0.2 && Math.abs(v_) < 6.8 + R.w/2 - 0.2) { const key = R.name + '|' + p.id + '(r' + (p.r||'?') + ')'; hits[key] = (hits[key]||0)+1; } } } }
out.items = plan.filter(p=>p.kind==='stores'||p.kind==='vault'||p.kind==='market').map(p=>[p.id,p.kind,+p.x.toFixed(1),+p.z.toFixed(1),p.r,p.w,p.d].join(' '));
out.houses = Object.entries(hits).map(([k, n]) => k + ' x' + n);
out.stats = { roads: ROADS.length, open: ROADS.filter(r => !r.closed).length, plan: plan.length, bridges: L.RBRIDGES.length, level: LV };

// ---------------------------------------------------------------- GR1 checks
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const wet = out.wet.filter((w) => !(/^ws_mill_water/.test(w.road) && w.wetSamples <= 2 && w.deepest <= 0.6));      // a water mill's landing may touch the shore
ok(wet.length === 0, 'roads in water: ' + JSON.stringify(wet));
ok(out.dead.length <= 2, 'dead ends > 2: ' + JSON.stringify(out.dead));
ok(out.houses.length <= 6, 'road/house overlaps: ' + out.houses.length + ' ' + JSON.stringify(out.houses.slice(0, 6)));
ok(ROADS.every((r) => r.tier >= 1 && r.tier <= 4 && /^(cobble|gravel|packed|track)$/.test(r.surf)), 'every road must have tier + surface');
ok(ROADS.filter((r) => r.name === 'mainst')[0].surf === 'cobble', 'main street = cobbles');
// the near-ground map: builds, is quick, paints the roads and nothing under water
const t0 = Date.now();
const { data, px } = __buildMap(1024, [{ disc: true, x: L.PLAZA.x, z: L.PLAZA.z, r: L.PLAZA.r }], L.height);
const ms = Date.now() - t0;
ok(ms < 20000, 'map build too slow: ' + ms + ' ms');
const N = 1024, at = (x, z, c) => data[((Math.floor((z + __HALF) / px)) * N + Math.floor((x + __HALF) / px)) * 4 + c];
let onRoad = 0, tot = 0;
for (const R of ROADS) for (let i = 0; i < R.pts.length - 1; i++) { const a = R.pts[i], b = R.pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let s = 0; s < l; s += 3) { const x = a[0] + (b[0] - a[0]) * s / l, z = a[1] + (b[1] - a[1]) * s / l; if (L.height(x, z) < LV + 0.05) continue; tot++; const c = R.surf === 'cobble' ? 0 : R.surf === 'track' ? 2 : 1; if (at(x, z, c) >= 128) onRoad++; } }
ok(onRoad / tot > 0.97, 'only ' + onRoad + '/' + tot + ' road samples are painted in the map');
ok(at(L.PLAZA.x, L.PLAZA.z, 0) >= 128, 'plaza paved');
ok(at(L.CAMP.x, L.CAMP.z, 3) > 20, 'camp is trodden');
// shader budget: 3 new samplers, one program (patch of the terrain program), looks defined
const g = GLSL_SRC();
const nS = [...g.matchAll(/uniform\s+sampler\w+\s+([^;]+);/g)].reduce((a, m) => a + m[1].split(',').length, 0);
ok(nS === 3, 'GR1 must add exactly 3 samplers (map, albedo[], normal[])');
ok([1, 2, 3].every((k) => LOOKS[k] && LOOKS[k].p1 && LOOKS[k].p2 && LOOKS[k].p3 && LOOKS[k].p4), 'looks A/B/C');

(async () => {
// ---------------------------------------------------------------- the module headless: builds, uniforms, scatter budget, dispose frees
{
  const kids = []; const scene = { add: (m) => kids.push(m), remove: (m) => { const i = kids.indexOf(m); if (i >= 0) kids.splice(i, 1); } };
  const G = createGround({ renderer: null, T: {}, quality: 'high', scene });
  G.setPaved([{ disc: true, x: L.PLAZA.x, z: L.PLAZA.z, r: L.PLAZA.r }]);
  G.attach(L.height); G.build(); await new Promise((r) => setTimeout(r, 40));
  ok(G.U.uGrMap.value && G.U.uGrA.value && G.U.uGrN.value, 'GR1 uniforms: map / albedo[] / normal[]');
  ok(typeof groundH === 'function' && Math.abs(groundH(10, 10) - L.height(10, 10)) < 1e-6, 'groundH = the height of the ground');
  ok(groundKind(L.PLAZA.x, L.PLAZA.z) === 1, 'groundKind: plaza is paved');
  ok(G.detail() === 3 && G.look() >= 1 && G.look() <= 3, 'defaults: detail 3, a look');
  G.setLook(3); ok(G.U.uGrS.value.w === 3 && G.U.uGrP5.value.y > 0.5, 'look C switches uniforms');
  const hx = -128, hz = -40, h0 = L.height(hx, hz);
  const cam = { position: { x: hx, y: h0 + 1.7, z: hz } };
  G.update(cam, 0.016, 0);
  const st = G.stats();
  ok(st.tufts > 0 && st.pebbles > 0, 'scatter exists at hero height (look C): ' + JSON.stringify(st));
  ok(st.calls <= 3 && st.tris <= 400000, 'scatter budget: ' + JSON.stringify(st));
  ok(kids.length === st.calls, 'scene children = draw calls');
  ok(kids.every((m) => m.userData && m.userData.rpKeep === 1), 'scatter meshes carry rpKeep (the hero diet / pack culling must not hide them)');
  cam.position.y = h0 + 80; for (let i = 0; i < 130; i++) G.update(cam, 0.016, i);
  ok(G.stats().calls === 0 && kids.length === 0, 'scatter disposed when the camera goes up (strategic view)');
  cam.position.y = h0 + 1.7; G.update(cam, 0.016, 0); G.setDetail(0); G.update(cam, 0.016, 0);
  ok(G.stats().calls === 0 || (() => { for (let i = 0; i < 130; i++) G.update(cam, 0.016, i); return G.stats().calls === 0; })(), 'detail 0 = no scatter');
  G.setDetail(3); G.update(cam, 0.016, 0); G.dispose(); ok(kids.length === 0 && G.stats().calls === 0, 'dispose frees the scatter');
  const Gl = createGround({ renderer: null, T: {}, quality: 'low', scene });
  ok(Gl.detail() === 0, 'low quality = detail 0');
}
if (fails.length) { console.log('GR1 FAIL\n - ' + fails.join('\n - ')); process.exit(1); }
console.log('GR1 OK  (roads ' + ROADS.length + ', dead ' + out.dead.length + ', map ' + ms + ' ms, painted ' + onRoad + '/' + tot + ')');

})();
