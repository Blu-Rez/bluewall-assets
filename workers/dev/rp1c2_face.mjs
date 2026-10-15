// rp1c2_face.mjs — RP1C-R2 Job 0, the pure part of the face-rule proof (no browser): sweeps the REAL step functions exported by rpg.js (FACE, faceTarget, faceLoco, faceGuard)
//   over 360° of camera drag, every stick direction, every drag speed and frame time, stick reversals every 0.2 s, and the guard against anything else turning her (combat sim / wall climb).
//   run:  node dev/rp1c2_face.mjs      -> prints a table and «FACE_NODE OK» (exit 1 on a failed assertion)
import { FACE, faceTarget, faceLoco, faceGuard } from '/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/rpg.js';
const DEG = 180 / Math.PI, wrap = (a) => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI; };
let fails = 0; const rows = [];
const check = (name, ok, info) => { if (!ok) { fails++; console.log('FAIL', name, info || ''); } };
const gap = (s) => Math.abs(wrap(s.body - s.camYaw)) * DEG;                                    // the angle between her forward and the camera forward (the camera looks along camYaw, she faces body)
// stick (ix, iy) -> world velocity the way rpg.js maps it: forward = (sin c, cos c), right = (-cos c, sin c)
const vel = (c, ix, iy, sp) => { const fx = Math.sin(c), fz = Math.cos(c), rx = -Math.cos(c), rz = Math.sin(c), m = Math.hypot(ix, iy) || 1; return [(fx * iy + rx * ix) / m * sp, (fz * iy + rz * ix) / m * sp]; };

// ---- A. settled angle: 360° of camera yaw (1° steps), each stick direction (8 + idle), walk / run / dodge speeds ----
const STICKS = [[0, 0], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];
for (const sp of [1.2, 4.4, 5.6]) {
  let worst = 0;
  for (let c0 = 0; c0 < 360; c0 += 1) for (const [ix, iy] of STICKS) {
    const s = { camYaw: c0 / DEG, body: c0 / DEG + 2.5, bk: 0 };
    for (let i = 0; i < 90; i++) { const [vx, vz] = (ix || iy) ? vel(s.camYaw, ix, iy, sp) : [0, 0]; faceLoco(s, 1 / 60, vx, vz); }
    worst = Math.max(worst, gap(s));
  }
  rows.push(['A settled (360° x 9 sticks)', 'speed ' + sp, worst.toFixed(1) + '°', '< 35°']); check('A settled ' + sp, worst < 35, worst);
}

// ---- B. camera drag at constant rates, every stick direction, reversals every 0.2 s: the angle in EVERY frame, and after the drag stops ----
for (const dtf of [1 / 120, 1 / 60, 1 / 30, 1 / 15]) for (const rate of [90, 180, 360, 720, 1440]) {
  let mx = 0, mxSettled = 0, flips = 0, frames = 0;
  for (const [ix, iy] of STICKS) for (const rev of [0, 1]) {
    const s = { camYaw: 0, body: 0, bk: 0 }; let t = 0, k = 1, bk0 = 0;
    for (; t < 2.0; t += dtf) {                                                                // 2 s of dragging (720°/s = 4 turns) with the stick held / reversed every 0.2 s
      s.camYaw += rate / DEG * dtf; if (rev && Math.floor(t / 0.2) % 2 === 1) k = -1; else k = 1;
      const [vx, vz] = (ix || iy) ? vel(s.camYaw, ix * k, iy * k, 4.4) : [0, 0]; faceLoco(s, dtf, vx, vz); mx = Math.max(mx, gap(s)); frames++; if (s.bk !== bk0) { flips++; bk0 = s.bk; }
    }
    for (let i = 0; i < 90; i++) { const [vx, vz] = (ix || iy) ? vel(s.camYaw, ix, iy, 4.4) : [0, 0]; faceLoco(s, 1 / 60, vx, vz); } mxSettled = Math.max(mxSettled, gap(s));
  }
  rows.push(['B drag ' + rate + '°/s, dt ' + (dtf * 1000).toFixed(0) + ' ms', 'every frame max', mx.toFixed(1) + '°', '≤ 55° (limit 75°)']); check('B ' + rate + '/' + dtf, mx <= FACE.bodyMax * DEG + 0.01 && mx < 75, mx); check('B settle ' + rate, mxSettled < 35, mxSettled);
}

// ---- C. lag: the camera jumps 180° (a fast flick): how long until she is within 5° of where she belongs, and what the worst frame looked like ----
{
  const s = { camYaw: 0, body: 0, bk: 0 }; s.camYaw = Math.PI; let t = 0, worst = 0, t5 = null;
  for (; t < 1; t += 1 / 120) { faceLoco(s, 1 / 120, 0, 0); const g = gap(s); if (t === 0) worst = g; if (t5 == null && g < 5) t5 = t; }
  rows.push(['C 180° flick, idle', 'first frame / within 5° at', worst.toFixed(1) + '° / ' + (t5 * 1000).toFixed(0) + ' ms', '≤ 55° / ≤ 250 ms']); check('C worst', worst <= 56, worst); check('C lag', t5 != null && t5 <= 0.25, t5);
}

// ---- D. back-pedal hysteresis: a stick that wobbles +-10° around the switch angle must not flip walk <-> back-pedal every frame ----
{
  let flips = 0, last = 0; const s = { camYaw: 0, body: 0, bk: 0 };
  for (let i = 0; i < 600; i++) { const a = (FACE.backOn + FACE.backOff) / 2 + Math.sin(i * 0.9) * 0.17; faceLoco(s, 1 / 60, Math.sin(a) * 4, Math.cos(a) * 4); if (s.bk !== last) { flips++; last = s.bk; } }
  rows.push(['D stick wobbling at the switch', 'flips in 10 s', String(flips), '≤ 2']); check('D hysteresis', flips <= 2, flips);
}

// ---- E. the guard: the combat sim / the wall sets HER yaw to anything each frame (target 180° away, a snap turn): the camera must be pulled so |her - camera| <= hard, every frame ----
{
  let mx = 0, mxEnd = 0; const hard = FACE.hard * DEG;
  for (let seed = 0; seed < 200; seed++) {
    const s = { camYaw: (seed * 37 % 360) / DEG, body: 0, bk: 0 }; let r = seed * 7919 + 1;
    for (let i = 0; i < 300; i++) {
      if (i % 40 === 0) { r = (r * 1103515245 + 12345) & 0x7fffffff; s.body = (r % 6283) / 1000 - Math.PI; }                // a new facing every 0.67 s, anywhere on the circle
      faceGuard(s, 1 / 60, FACE.chase); mx = Math.max(mx, gap(s));
    }
    for (let i = 0; i < 90; i++) faceGuard(s, 1 / 60, FACE.chase); mxEnd = Math.max(mxEnd, gap(s));
  }
  rows.push(['E guard (something else turns her)', 'every frame / after 1.5 s', mx.toFixed(1) + '° / ' + mxEnd.toFixed(1) + '°', '≤ ' + hard.toFixed(0) + '° / ≤ ' + (FACE.soft * DEG).toFixed(0) + '°']); check('E hard', mx <= hard + 0.01, mx); check('E settle', mxEnd <= FACE.soft * DEG + 0.01, mxEnd);
}

// ---- F. faceTarget: nothing turns her towards the camera, whatever the push (offset never beyond `lean`) ----
{
  let mx = 0;
  for (let a = -180; a <= 180; a += 0.5) for (const b of [false, true]) { const r = faceTarget(0, Math.sin(a / DEG) * 3, Math.cos(a / DEG) * 3, b); mx = Math.max(mx, Math.abs(r.off) * DEG); }
  rows.push(['F faceTarget offset', 'max over 360° of push', mx.toFixed(1) + '°', '≤ ' + (FACE.lean * DEG).toFixed(0) + '°']); check('F lean', mx <= FACE.lean * DEG + 0.01, mx);
}

const w = [38, 28, 22, 20]; for (const r of rows) console.log(r.map((c, i) => String(c).padEnd(w[i])).join(''));
if (fails) { console.log('FACE_NODE FAILED x' + fails); process.exit(1); } console.log('FACE_NODE OK');
