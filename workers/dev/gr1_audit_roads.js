import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads, ROADS, YARDS } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { planTown } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b1_townplan.js';
import { layoutFromGame } from '/home/claude/bot/bluebot_v2/bluewall/client/src/b1_layout.js';
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
// crossings between different roads in the open country (not at endpoints)
const inter = (a, b, c, d) => { const rx=b[0]-a[0], rz=b[1]-a[1], sx=d[0]-c[0], sz=d[1]-c[1], den=rx*sz-rz*sx; if (Math.abs(den)<1e-9) return null; const t=((c[0]-a[0])*sz-(c[1]-a[1])*sx)/den, u=((c[0]-a[0])*rz-(c[1]-a[1])*rx)/den; return t>0.02&&t<0.98&&u>0.02&&u<0.98?[a[0]+rx*t,a[1]+rz*t]:null; };
for (let i = 0; i < ROADS.length; i++) for (let j = i+1; j < ROADS.length; j++) { const A = ROADS[i], B = ROADS[j]; for (let p = 0; p < A.pts.length-1; p++) for (let q = 0; q < B.pts.length-1; q++) { const x = inter(A.pts[p], A.pts[p+1], B.pts[q], B.pts[q+1]); if (x) out.cross.push(A.name + ' x ' + B.name + ' @' + x.map(v=>+v.toFixed(0))); } }
console.log(JSON.stringify(out, null, 1));

import fs from 'fs';
const geo = { roads: ROADS.map(r=>({n:r.name,k:r.kind,w:r.w,c:!!r.closed,p:r.pts})), plan: plan.map(p=>({id:p.id,k:p.kind,x:p.x,z:p.z,ry:p.ry,w:p.w,d:p.d,r:p.r})), sites:(L.SITES||[]).map(s=>({id:s.id,k:s.kind,x:s.x,z:s.z,r:s.r})), mines:L.MINES.map(m=>({id:m.id,x:m.x,z:m.z,a:m.a})), br:L.RBRIDGES, ham:hamlets().map(h=>({x:h.x,z:h.z})), nom:nomads().map(h=>({x:h.x,z:h.z})), camp:L.CAMP, pasture:L.PASTURE, lake:L.LAKE, plaza:L.PLAZA, windmill:L.WINDMILL, farms:L.FARMS.map(F=>({x:F.x,z:F.z,w:F.w,d:F.d,rot:F.rot})), gate:L.GATE, tg:L.TGATES.map(g=>({x:g.x,z:g.z,nx:g.nx,nz:g.nz})), town:L.TOWN, outer:L.OUTER, muster:L.MUSTER, dead:out.dead };
fs.writeFileSync('/home/claude/work/gr1/geo.json', JSON.stringify(geo));
const N = 1040, STEP = 1, h = new Float32Array(N*N); for (let j=0;j<N;j++) for (let i=0;i<N;i++) h[j*N+i] = L.height(i*STEP-520, j*STEP-520);
fs.writeFileSync('/home/claude/work/gr1/height.f32', Buffer.from(h.buffer));
