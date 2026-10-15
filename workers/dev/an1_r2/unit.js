// AN1_R2 unit checks (node): the walking kit — limited turn rate, start / stop ramps, no teleport, the grid blocks a wall and the A* route goes round it, the floor follows a raised pad.
import * as THREE from 'three';
import { steer, turnTo, approach, makeGrid, wrapA } from '../../bot/bluebot_v2/bluewall/client/src/walk_kit.js';
let bad = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad = 1; };
const dt = 1 / 30;
// 1. goal straight behind: the people pivot (no instant 180°, no sideways slide), then walk
{
  const p = { x: 0, z: 0, yaw: 0 }, m = { v: 0 }; let maxDy = 0, maxSideSlip = 0, vWhileFacingAway = 0, prev = p.yaw, t = 0, tFace = -1, hist = [];
  for (let i = 0; i < 300 && Math.hypot(0 - p.x, -10 - p.z) > 0.05; i++) {
    const x0 = p.x, z0 = p.z; steer(p, m, 0, -10, dt, { vmax: 1.4, turn: 3 }); t += dt;
    maxDy = Math.max(maxDy, Math.abs(wrapA(p.yaw - prev))); prev = p.yaw;
    const mx = p.x - x0, mz = p.z - z0, L = Math.hypot(mx, mz);
    if (L > 1e-6) { const slip = Math.abs(wrapA(Math.atan2(mx, mz) - p.yaw)); maxSideSlip = Math.max(maxSideSlip, slip); }
    if (Math.abs(wrapA(Math.atan2(0 - p.x, -10 - p.z) - p.yaw)) > 1.5) vWhileFacingAway = Math.max(vWhileFacingAway, m.v);
    if (tFace < 0 && Math.abs(wrapA(Math.atan2(0 - p.x, -10 - p.z) - p.yaw)) < 0.3) tFace = t; hist.push(m.v);
  }
  ok(maxDy <= 3 * dt * 1.001, 'turn rate limited: max ' + (maxDy / dt).toFixed(2) + ' rad/s (limit 3), a 180° turn takes ' + tFace.toFixed(2) + ' s, not one frame');
  ok(maxSideSlip < 1e-6, 'the walker only moves along its facing (sideways slip ' + maxSideSlip.toExponential(1) + ' rad)');
  ok(vWhileFacingAway < 0.05, 'standing still while the goal is still behind it (v ' + vWhileFacingAway.toFixed(3) + ' m/s)');
}
// 2. start / stop ramps: acceleration 1.3 and braking 1.8 m/s², arrives on the goal, no overshoot
{
  const p = { x: 0, z: 0, yaw: 0 }, m = { v: 0 }; let vPrev = 0, maxA = 0, maxD = 0, maxV = 0, minLeft = 1e9, d0 = 12;
  for (let i = 0; i < 900; i++) { const left = steer(p, m, 0, d0, dt, { vmax: 1.4, acc: 1.3, dec: 1.8, stopD: 0.03 }); minLeft = Math.min(minLeft, left); const a = (m.v - vPrev) / dt; maxA = Math.max(maxA, a); if (vPrev > 0.12) maxD = Math.max(maxD, -a);   // the last 0.1 m/s crawl is snapped to 0 on arrival (3 cm)
     maxV = Math.max(maxV, m.v); vPrev = m.v; if (left < 0.03 && m.v === 0) break; }
  ok(maxA <= 1.3 * 1.01, 'start ramp: max acceleration ' + maxA.toFixed(2) + ' m/s² (limit 1.3)');
  ok(maxD <= 1.8 * 1.01, 'stop ramp: max braking ' + maxD.toFixed(2) + ' m/s² (limit 1.8)');
  ok(Math.abs(p.z - d0) < 0.05 && m.v === 0, 'arrives on the goal and stops (z ' + p.z.toFixed(3) + ' of ' + d0 + ', v ' + m.v + ')');
  ok(maxV <= 1.4 * 1.001, 'never above the walking speed (' + maxV.toFixed(2) + ' m/s)');
}
// 3. the collision guard holds the walker in front of a blocked cell
{
  const p = { x: 0, z: 0, yaw: 0 }, m = { v: 0 }; const free = (x, z) => z < 3.0; let maxZ = 0;
  for (let i = 0; i < 600; i++) { steer(p, m, 0, 8, dt, { vmax: 1.4, free }); maxZ = Math.max(maxZ, p.z); }
  ok(maxZ < 3.0 && m.blocked === true, 'guard: the walker stops in front of a blocked cell (z max ' + maxZ.toFixed(2) + ' < 3.0)');
}
// 4. turnTo / approach
{ const p = { yaw: 0 }; let n = 0; while (turnTo(p, Math.PI, 2.0, dt) > 1e-3 && n++ < 1000); ok(n >= Math.PI / 2.0 / dt - 2 && n < 100, 'turnTo: 180° at 2 rad/s takes ' + (n * dt).toFixed(2) + ' s'); ok(Math.abs(approach(0, 5, 1.3, 1.8, dt) - 1.3 * dt) < 1e-9 && Math.abs(approach(2, 0, 1.3, 1.8, dt) - (2 - 1.8 * dt)) < 1e-9, 'approach ramps'); }
// 5. the grid: a flat floor, a wall across it with a gap, and a raised pad (soup pad / pen floor): the wall blocks, the route goes through the gap, the floor height follows the pad
{
  const floorG = new THREE.PlaneGeometry(40, 40); floorG.rotateX(-Math.PI / 2);
  const wallG = new THREE.BoxGeometry(0.4, 2.0, 12); wallG.translate(0, 1.0, -4);        // wall along z from -10 to 2 at x=0 (gap for z > 2)
  const padG = new THREE.BoxGeometry(4, 0.3, 4); padG.translate(10, 0.15 - 0.0, 10);       // raised pad 30 cm
  const meshes = [new THREE.Mesh(floorG), new THREE.Mesh(wallG), new THREE.Mesh(padG)];
  const g = makeGrid({ cx: 0, cz: 0, R: 18, meshes, height: () => 0 }); let guard = 0; while (!g.pump(50) && guard++ < 2000);
  ok(g.ready, 'grid built from the site meshes (' + g.tris + ' triangles, ' + g.ms.toFixed(0) + ' ms)');
  ok(g.blockedAt(0, -4) && g.blockedAt(0, -9), 'the wall cells are blocked');
  ok(!g.blockedAt(-5, -4) && !g.blockedAt(5, -4), 'open floor next to the wall is free');
  const path = g.path(-5, 0, 5, 0);
  ok(path && path.length >= 1 && path.every(([x, z]) => !g.blockedAt(x, z)), 'A* finds a route round the wall (' + (path ? path.length : 0) + ' way-points)');
  if (path) { let x = -5, z = 0, okSeg = true; for (const [px, pz] of path) { if (!g.clear(x, z, px, pz, 0.15)) okSeg = false; x = px; z = pz; } ok(okSeg, 'every leg of the route is clear'); ok(path.some(([, z]) => z > 1.9), 'the route uses the gap (goes past z = 2)'); }
  const yP = g.y(10, 10), yF = g.y(-10, 10);
  ok(Math.abs(yP - 0.3) < 0.08 && Math.abs(yF) < 0.05, 'floor height: pad ' + yP.toFixed(2) + ' m (0.30), ground ' + yF.toFixed(2) + ' m (0)');
}
// 6. water: a plank at the water level is walked on, open shallow water is waded on the bed, water deeper than 30 cm is blocked
{
  const bedG = new THREE.PlaneGeometry(40, 40); bedG.rotateX(-Math.PI / 2); bedG.translate(0, -1.0, 0);                  // (the terrain is not a site mesh; this one stands for a site floor far below: out of the band)
  const plank = new THREE.BoxGeometry(2, 0.06, 6); plank.translate(0, -0.75 + 0.03 + 0.02, 0);                            // plank top 5 cm over the water
  const H = (x, z) => (x > 8 ? -0.95 : x < -8 ? -1.5 : -0.9);                                                           // x > 8: 20 cm deep; x < -8: 75 cm deep; the middle: 15 cm deep
  const g = makeGrid({ cx: 0, cz: 0, R: 14, meshes: [new THREE.Mesh(plank)], height: H, waterY: -0.75 }); let n = 0; while (!g.pump(50) && n++ < 2000);
  const yPlank = g.y(0, 0), yWade = g.y(10, 5), yDeep = g.blockedAt(-10, 0);
  ok(Math.abs(yPlank - (-0.67)) < 0.04, 'a plank over the water is walked on (floor ' + yPlank.toFixed(2) + ', plank top -0.67)');
  ok(Math.abs(yWade - (-0.95)) < 0.04, 'open shallow water is waded on the bed (floor ' + yWade.toFixed(2) + ', bed -0.95, water surface -0.75)');
  ok(yDeep, 'water deeper than 30 cm is blocked');
}
process.exit(bad);
