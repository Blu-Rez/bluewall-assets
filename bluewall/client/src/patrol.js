// Archers patrolling the wall walks of all three rings (Blue Wall, citadel wall, town wall) — and (p22) two sentries on top of every
// weapon tower (opts.sites = ctx.weaponSites), so the towers read as manned archer towers like in the raids.
// Each archer owns a "beat" — a stretch of one wall segment between two towers — and never leaves it, so neighbours can never collide
// and nobody walks into a tower or off the edge. On a beat the archer walks to one end, stops in front of the tower, turns, sometimes
// stops to look out over the parapet, then walks back. All characters are drawn by crowd.js (instanced, baked animation).
import * as THREE from 'three';
import * as L from './layout.js';
import { createKind } from './crowd.js';

const SC = 1.75;                                  // people scale in this game (readable from the strategy camera)
const TURN = 3.4;                                 // rad/s turning on the spot
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const PI2 = Math.PI * 2;

// rings: [polygon, wall dims, segments without a walkway (gates), spacing between archers in metres]
function ringsList(density) {
  const k = 1 / density;
  const r = [{ poly: L.OUTER, w: L.WALL.outer, skip: [L.GATE_SEG], gap: 24 * k }];
  if (L.INNER) r.push({ poly: L.INNER, w: L.WALL.inner, skip: [L.INNER_GATE_SEG], gap: 26 * k });
  if (L.TOWN) r.push({ poly: L.TOWN, w: L.WALL.town, skip: L.TOWN_GATES, gap: 36 * k });
  return r;
}

export function buildPatrols(scene, A, opts = {}) {
  const anims = A.models.anims;
  if (!anims || !A.models.ranger_m) return null;
  const density = opts.density ?? 1;
  const mk = (g) => (g ? createKind({ gltf: g, anims, clips: ['Walk_Loop', 'Idle_Loop'], capacity: 72,
    props: [{ gltf: A.models.bow, bone: 'hand_l', s: 0.55, rot: [Math.PI / 2, 0, Math.PI / 2] }],
    lod1Skip: /Boots|Belt|Bracer|Pauldron/ }) : null);
  const kinds = [mk(A.models.ranger_m), mk(A.models.ranger_f)].filter(Boolean);
  for (const k of kinds) scene.add(k.group);
  const base = kinds[0].stats.walkSpeed || 0.8;       // rig units per second the walk clip was made for
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  const archers = [];
  let n = 0;
  for (const ring of ringsList(density)) {
    const poly = ring.poly, { H, R } = ring.w, y = H + 0.145, end = R + 1.1;      // stop 1.1 m clear of the tower wall
    for (let i = 0; i < poly.length; i++) {
      if (ring.skip.includes(i)) continue;
      const a = poly[i], b = poly[(i + 1) % poly.length], dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), ux = dx / len, uz = dz / len;
      const lo = end, hi = len - end; if (hi - lo < 7) continue;
      const out = L.segNormalOut(poly, i), lookYaw = Math.atan2(out[0], out[1]);
      const cnt = Math.max(1, Math.round((hi - lo) / ring.gap)), bl = (hi - lo) / cnt;
      for (let k = 0; k < cnt; k++) {
        const s0 = lo + k * bl + (k ? 1.0 : 0), s1 = lo + (k + 1) * bl - (k < cnt - 1 ? 1.0 : 0);   // neighbours keep 2 m between their beats
        const kind = kinds[n++ % kinds.length], p = kind.add({ y, scale: SC });
        const f = 0.92 + rnd() * 0.16;                                                          // walking pace differs a little per archer
        const ar = { p, kind, ax: a[0], az: a[1], ux, uz, s0, s1, s: s0 + rnd() * (s1 - s0), dir: rnd() < 0.5 ? -1 : 1, y, lookYaw,
          f, v: base * SC * f, state: 'walk', timer: 0, yawT: 0, flip: false, since: 2 + rnd() * 8 };
        ar.p.yaw = ar.yawT = Math.atan2(ux * ar.dir, uz * ar.dir);
        p.play('Walk_Loop', { fade: false, speed: f, offset: rnd() * 1.3 });
        place(ar); archers.push(ar);
      }
    }
  }
  // sentries: two archers at the outer parapet of each weapon tower, looking out over the land (they never walk)
  const sentries = [];
  for (const s of (opts.sites || [])) {
    const ox = Math.cos(s.a), oz = Math.sin(s.a), tx = -oz, tz = ox, yaw0 = Math.atan2(ox, oz);
    for (const side of [-1, 1]) {
      const kind = kinds[n++ % kinds.length], p = kind.add({ y: s.y, scale: SC });
      if (!p) continue;
      p.x = s.x + ox * 2.9 + tx * side * 2.45; p.z = s.z + oz * 2.9 + tz * side * 2.45; p.y = s.y; p.yaw = yaw0 + side * 0.25;
      p.play('Idle_Loop', { fade: false, speed: 0.9 + rnd() * 0.2, offset: rnd() * 2 });
      sentries.push({ p, yaw0: yaw0 + side * 0.25, ph: rnd() * 6.28, f: 0.12 + rnd() * 0.08 });
    }
  }
  function place(a) { a.p.x = a.ax + a.ux * a.s; a.p.z = a.az + a.uz * a.s; a.p.y = a.y; }
  const travelYaw = (a) => Math.atan2(a.ux * a.dir, a.uz * a.dir);
  function wait(a, secs, yawT, flip) {
    a.state = 'wait'; a.timer = secs; a.yawT = yawT; a.flip = flip; a.p.play('Idle_Loop', { speed: 1 });
  }
  function update(t, dt, camera) {
    for (const a of archers) {
      const p = a.p;
      if (a.state === 'walk') {
        a.s += a.dir * a.v * dt; a.since -= dt;
        if (a.s >= a.s1 || a.s <= a.s0) {                                 // reached the tower end
          a.s = Math.min(a.s1, Math.max(a.s0, a.s));
          // 55%: pause in front of the tower and turn around; otherwise stop and look out over the parapet first
          if (rnd() < 0.55) wait(a, 0.7 + rnd() * 1.2, travelYaw(a), true);
          else wait(a, 3 + rnd() * 4, a.lookYaw, true);
        } else if (a.since <= 0 && a.s - a.s0 > 4 && a.s1 - a.s > 4) {      // a stop in the middle of the beat: look out, then carry on
          a.since = 9 + rnd() * 14; wait(a, 2.5 + rnd() * 3.5, a.lookYaw, false);
        }
        a.yawT = travelYaw(a);
      } else if (a.state === 'wait') {
        if (Math.abs(wrap(a.yawT - p.yaw)) < 0.1) a.timer -= dt;                 // the timer only runs once the archer faces the right way
        if (a.timer <= 0) { if (a.flip) a.dir = -a.dir; a.yawT = travelYaw(a); a.state = 'turn'; }
      }
      if (a.state === 'turn' && Math.abs(wrap(a.yawT - p.yaw)) < 0.08) { a.state = 'walk'; a.since = 6 + rnd() * 12; p.play('Walk_Loop', { speed: a.f }); }
      // turn smoothly (faster while walking so the path direction is followed)
      const dy = wrap(a.yawT - p.yaw), mx = (a.state === 'walk' ? TURN * 2 : TURN) * dt;
      p.yaw += Math.max(-mx, Math.min(mx, dy));
      if (p.yaw > Math.PI) p.yaw -= PI2; else if (p.yaw < -Math.PI) p.yaw += PI2;
      place(a);
    }
    for (const q of sentries) q.p.yaw = q.yaw0 + 0.55 * Math.sin(t * q.f + q.ph) * Math.sin(t * q.f * 0.37 + q.ph * 2);   // looking left and right, slowly
    for (const k of kinds) k.update(t, camera);
  }
  return { update, archers, sentries, kinds };
}
