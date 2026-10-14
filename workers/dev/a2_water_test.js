// A2: the mountain stream(s) — water continuity, the moat join, bridges, clearances, nothing else moved.  Prints "A2 OK" when everything holds.
import fs from 'fs';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { buildRoads, ROADS } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import { hamlets } from '/home/claude/bot/bluebot_v2/bluewall/client/src/hamlets.js';
import { nomads } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nomads.js';
import { buildNav, bridgesFromLayout } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nav.js';
L.setMap('night'); buildRoads();
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const LV = L.MOAT.level, S = L.STREAMS, courses = [['river', L.RIVER], ...S.map((s) => [s.id, s.pts])];
const segs = (P) => P.slice(1).map((b, i) => [P[i], b]);
const samples = (P, step = 2) => { const out = []; for (const [a, b] of segs(P)) { const l = Math.hypot(b[0] - a[0], b[1] - a[1]); for (let s = 0; s < l; s += step) out.push([a[0] + (b[0] - a[0]) * s / l, a[1] + (b[1] - a[1]) * s / l]); } out.push(P[P.length - 1]); return out; };
ok(S.length >= 1, `${S.length} mountain stream(s) in the layout`);
for (const st of S) {
  const P = st.pts, smp = samples(P);
  // 1. the water: bed under the level everywhere, a wet channel at every sample (no dry gap), the level never rises (one level surface: the drop is the fall at the head)
  const bed = smp.map(([x, z]) => L.height(x, z)); const worst = Math.max(...bed);
  ok(worst <= LV - 0.4, `${st.id}: the bed lies under the water surface along the whole course (highest bed ${worst.toFixed(2)} m, level ${LV})`);

  // wet width across the course (perpendicular), every 6 m
  let minW = 1e9; for (let i = 1; i < smp.length - 1; i += 3) { const p = smp[i], q = smp[i + 1], l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1, nx = -(q[1] - p[1]) / l, nz = (q[0] - p[0]) / l; let w = 0; for (let o = -12; o <= 12; o += 0.5) if (L.height(p[0] + nx * o, p[1] + nz * o) < LV) w += 0.5; minW = Math.min(minW, w); }
  ok(minW >= 8 * (st.k || 1), `${st.id}: the channel is >= ${8 * (st.k || 1)} m of open water wide at every cross-section (narrowest ${minW.toFixed(1)} m)`);
  const levels = smp.map(([x, z]) => Math.max(LV, L.height(x, z) > LV ? L.height(x, z) : LV)); let rises = 0; for (let i = 1; i < levels.length; i++) if (levels[i] > levels[i - 1] + 1e-6) rises++;
  ok(rises === 0, `${st.id}: water surface height never rises along the course (${rises} rises; one level plane, the drop is the waterfall at the head)`);
  // 2. the join: the last point lies in the moat water, at the moat's level
  const e = P[P.length - 1]; const sdE = L.sdTown(e[0], e[1]);
  let near = 1e9; for (let a = 0; a < 360; a += 0.5) { const ca = Math.cos(a * Math.PI / 180), sa = Math.sin(a * Math.PI / 180); let r = 100; while (L.sdTown(ca * r, sa * r) < L.MOAT2.off && r < 400) r += 0.25; const mx = ca * r, mz = sa * r; if (L.height(mx, mz) < LV) near = Math.min(near, Math.hypot(mx - e[0], mz - e[1])); }
  ok(L.height(e[0], e[1]) < LV - 0.4 && Math.abs(sdE - L.MOAT2.off) < 3 && near <= 1, `${st.id}: the course ends IN the moat water (end ${e.map((v) => v.toFixed(0))}, ${near.toFixed(2)} m from the moat's centre line, level equal: ${LV})`);
  // 3. no dead end: flood the wet cells (2 m grid) from the moat end -> the head (P0) must be reached, and the head is a waterfall
  const gx0 = Math.min(...P.map((p) => p[0])) - 30, gz0 = Math.min(...P.map((p) => p[1])) - 30, GS = 2, nxg = Math.ceil((Math.max(...P.map((p) => p[0])) + 30 - gx0) / GS), nzg = Math.ceil((Math.max(...P.map((p) => p[1])) + 30 - gz0) / GS);
  const wetAt = (i, j) => L.height(gx0 + i * GS, gz0 + j * GS) < LV; const seen = new Uint8Array(nxg * nzg), q = []; const si = Math.round((e[0] - gx0) / GS), sj = Math.round((e[1] - gz0) / GS); q.push([si, sj]); seen[sj * nxg + si] = 1;
  while (q.length) { const [i, j] = q.pop(); for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nxg || b >= nzg || seen[b * nxg + a] || !wetAt(a, b)) continue; if (Math.hypot(gx0 + a * GS - e[0], gz0 + b * GS - e[1]) > 700) continue; seen[b * nxg + a] = 1; q.push([a, b]); } }
  const h0 = P[0], reach = seen[Math.round((h0[1] - gz0) / GS) * nxg + Math.round((h0[0] - gx0) / GS)] === 1;
  ok(reach, `${st.id}: one connected body of water from the moat up to the head (no dry gap, no dead end)`);
  const fm = (() => { const [rx, rz] = P[0], [bx, bz] = P[1], len = Math.hypot(rx - bx, rz - bz), ux = (rx - bx) / len, uz = (rz - bz) / len; const H = L.height; let sb = 0; for (let s = 0; s <= 40; s++) if (H(rx + ux * s, rz + uz * s) > 0.5) { sb = s; break; } let hMax = 0; for (let s = sb; s <= sb + 40; s++) hMax = Math.max(hMax, H(rx + ux * s, rz + uz * s)); return { drop: Math.min(hMax, 120) - H(rx + ux * sb, rz + uz * sb) }; })();
  ok(fm.drop > 12, `${st.id}: the head is a waterfall of ~${fm.drop.toFixed(0)} m (falls.js draws it)`);
  // 4. every road crossing is bridged (hamlet spurs excepted: autoBridges skips them — listed if any crosses)
  const inter = (a, b, c, d) => { const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]], den = r[0] * s[1] - r[1] * s[0]; if (Math.abs(den) < 1e-9) return null; const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den, u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den; return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [a[0] + r[0] * t, a[1] + r[1] * t] : null; };
  const onBridge = (p) => L.RBRIDGES.some((b) => { const dx = p[0] - b.x, dz = p[1] - b.z, u = dx * b.nx + dz * b.nz, v = -dx * b.nz + dz * b.nx; return Math.abs(u) <= b.len / 2 && Math.abs(v) <= b.wid / 2; });
  const cross = [], miss = [], spur = []; for (const Rd of ROADS) for (let i = 0; i < Rd.pts.length - 1; i++) for (const [a, b] of segs(P)) { const x = inter(Rd.pts[i], Rd.pts[i + 1], a, b); if (!x) continue; const tag = Rd.name + '@' + x.map((v) => Math.round(v)).join(','); if (Rd.name.startsWith('hamlet')) { spur.push(tag); continue; } cross.push(tag); if (!onBridge(x)) miss.push(tag); }
  ok(miss.length === 0 && spur.length === 0, `${st.id}: every road crossing is bridged (${cross.length} crossing(s): ${cross.join(' ') || '-'}${miss.length ? '; MISSING ' + miss.join(' ') : ''}${spur.length ? '; hamlet spur crossing ' + spur.join(' ') : ''})`);
  // 5. clearances: worksites, camp, mines, fields, other roads' hamlets
  const dmin = (o) => Math.min(...smp.map(([x, z]) => Math.hypot(x - o.x, z - o.z)));
  const bad = []; for (const s of L.SITES) if (!s.nopad && dmin(s) < s.r + 14) bad.push(s.id + ' ' + (dmin(s) - s.r).toFixed(0)); for (const m of L.MINES) if (dmin(m) < 45) bad.push(m.id); if (dmin(L.CAMP) < (L.CAMP.fr ?? L.CAMP.r) + 8) bad.push('CAMP'); for (const o of [L.PASTURE, L.MUSTER, L.LAIR]) if (dmin(o) < (o.fr ?? o.r) + 8) bad.push('zone');
  ok(bad.length === 0, `${st.id}: clear of every worksite (r + 14 m), the three mines, the camp and the open grounds${bad.length ? ' — TOO CLOSE: ' + bad.join(', ') : ''}`);
  // 6. the gorge and the foot: not through the quarry pad, not on top of a field
  ok(Math.min(...smp.map(([x, z]) => L.fieldD(x, z))) > 1.2, `${st.id}: no field is cut (nearest field index ${Math.min(...smp.map(([x, z]) => L.fieldD(x, z))).toFixed(2)})`);
}
// 7. nothing else moved: the nomad camps and ALL hamlets exactly where they were (hamlets.js / nomads.js plan from one random stream: a single changed candidate would re-plan every later one)
const base = JSON.parse(fs.readFileSync('/home/claude/dev/a2_records_base.json', 'utf8')), r1 = (v) => Math.round(v * 10) / 10;
const missing = (A, B) => A.filter((a) => !B.some((b) => r1(a.x) === r1(b.x) && r1(a.z) === r1(b.z)));
const hNow = hamlets(), nNow = nomads() || [];
const hGone = missing(base.HAMLETS, hNow), hNew = missing(hNow, base.HAMLETS);
ok(missing(base.NOMADS, nNow).length === 0 && nNow.length === base.NOMADS.length, `the ${base.NOMADS.length} nomad camps stand exactly where they stood before the streams`);
ok(hGone.length === 0 && hNew.length === 0, `${base.HAMLETS.length - hGone.length} of ${base.HAMLETS.length} hamlets stand where they stood; re-planned by hamlets.js: ${hGone.map((h) => `(${h.x.toFixed(0)},${h.z.toFixed(0)}) -> ${hNew.map((q) => `(${q.x.toFixed(0)},${q.z.toFixed(0)})`).join('')}`).join(', ') || 'none'}`);
// 8. the fishery on the old river is still on a shore: its water point is wet, its pad is dry
{ const f = L.SITES.find((q) => q.id === 'fishery_river'); const wet = L.height(f.water[0], f.water[1]) < LV, dry = L.height(f.x, f.z) > LV + 0.3; ok(f && wet && dry, `fishery_river is still on a shore (water point wet: ${wet}, pad dry: ${dry}, ${L.distPolyline(L.RIVER, f.x, f.z).toFixed(0)} m from the water line)`); }
// 9. nav: the stream is water to the ground units, the bridges are open
{ const nav = buildNav({ height: L.height, bridges: bridgesFromLayout(L) }); const st = S[0]; const mid = st.pts[Math.floor(st.pts.length / 2)];
  ok(nav.isWet(mid[0], mid[1]), 'nav: the stream bed is water to the ground units');
  const br = L.RBRIDGES.filter((b) => st.pts.some((p, i) => i && Math.hypot(b.x - (p[0] + st.pts[i - 1][0]) / 2, b.z - (p[1] + st.pts[i - 1][1]) / 2) < 25));
  let wades = 0; for (const b of br) { const a = [b.x - b.nx * (b.len / 2 + 6), b.z - b.nz * (b.len / 2 + 6)], c = [b.x + b.nx * (b.len / 2 + 6), b.z + b.nz * (b.len / 2 + 6)]; const rt = nav.route(a[0], a[1], c[0], c[1]); if (!rt) { wades += 99; continue; } let px = a[0], pz = a[1]; for (const [x, z] of rt) { for (let k = 0; k <= 20; k++) { const qx = px + (x - px) * k / 20, qz = pz + (z - pz) * k / 20; if (nav.isWet(qx, qz) && !nav.onBridge(qx, qz)) wades++; } px = x; pz = z; } }
  ok(wades === 0, `nav: units cross the stream over its ${br.length} bridge(s), never wading (${wades} wet steps)`); }
console.log(fails ? 'A2 FAILED' : 'A2 OK'); process.exit(fails ? 1 : 0);
