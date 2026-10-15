// RP1C-R2 Job 4 — GROUND CONTACT of the hero.  A lazy ES module (fetched with rpg.js, owner-only; nothing of it is in the boot bundle).
// The owner: «her foot goes down in many places on the map; the movement is not smooth, not real».  Three causes, three fixes:
//   1. the street ribbon (town.js `streets`: height + 0.07, and between its vertices a straight line over a curved hill) and the market disc lie ABOVE her ground (up to +0.15 m) -> the soles were inside the cobbles.
//      `surf(x, z)` = the height of THAT mesh at (x, z): the triangles of the real `streets` object (read from its geometry, never a constant) in a 3 m hash grid, barycentric interpolation.  rpg.js lifts her ground by it.
//   2. `S.y` followed the ground through a low-pass (lag = v_y / 18 below the surface on a hill) -> rpg.js now sets S.y = ground whenever |gy - S.y| < 0.12 (the smoothing stays for curbs and steps).
//   3. no foot placement: on a slope one foot was inside the hill.  `ik(dt)` = a 2-bone leg IK on the rig the six heroes share (`L_/R_ Thigh / Calf / Foot`, `Hip`): the ground height under each foot bone in stance,
//      the pelvis follows the LOWEST planted foot (limited to -0.25 .. +0.10 m), the sole is tilted to the ground normal (<= 25°).  Off (smoothly) while she swims / climbs / is in the air / dodges / is hit, knocked down or dead.
// Runs AFTER the whole pose is made (locomotion clips + the combat blend), so it is the last word on the leg bones; the mixer overwrites the bones every frame, so nothing needs to be undone.  No allocation per frame,
// no new material / shader program / light.  Exports pure helpers (`smooth`, `solve2`) for the node test.
const MAXD = 0.25, PMIN = -0.25, PMAX = 0.1, TILT = 0.436;                     // IK range (m), pelvis range (m), the sole tilt limit (25°)
export const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---- the road surface: triangles of the `streets` mesh in a hash grid ----------------------------------------------------------------------------------------------------------------------------------
function makeSurf(T, scene) {
  const S = { mesh: null, key: '', P: null, grid: new Map(), n: 0, cell: 3, checkAt: -1e9 };
  const ck = (ix, iz) => (ix + 4096) * 8192 + (iz + 4096);
  function build(mesh) {
    mesh.updateWorldMatrix(true, false); const g = mesh.geometry, pos = g.attributes.position, idx = g.index, n = idx ? (idx.count / 3) | 0 : (pos.count / 3) | 0, v = new T.Vector3();
    const P = new Float32Array(n * 9), grid = new Map(), c = S.cell;
    for (let t = 0; t < n; t++) {
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (let k = 0; k < 3; k++) { const i = idx ? idx.getX(t * 3 + k) : t * 3 + k; v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld); P[t * 9 + k * 3] = v.x; P[t * 9 + k * 3 + 1] = v.y; P[t * 9 + k * 3 + 2] = v.z; if (v.x < x0) x0 = v.x; if (v.x > x1) x1 = v.x; if (v.z < z0) z0 = v.z; if (v.z > z1) z1 = v.z; }
      for (let ix = Math.floor(x0 / c); ix <= Math.floor(x1 / c); ix++) for (let iz = Math.floor(z0 / c); iz <= Math.floor(z1 / c); iz++) { const key = ck(ix, iz); let a = grid.get(key); if (!a) grid.set(key, a = []); a.push(t); }
    }
    S.mesh = mesh; S.P = P; S.grid = grid; S.n = n; S.key = mesh.uuid + ':' + mesh.geometry.uuid + ':' + pos.count + ':' + (idx ? idx.count : 0);
  }
  S.check = (now) => {                                                                // (the world builds / rebuilds the ribbon: find it again every 2 s, rebuild when the object or its geometry changed)
    if (now - S.checkAt < 2000) return; S.checkAt = now;
    const m = scene.getObjectByName('streets');
    if (!m || !m.isMesh || !m.geometry || !m.geometry.attributes.position) { if (S.mesh) { S.mesh = null; S.P = null; S.grid = new Map(); S.n = 0; S.key = ''; } return; }
    const g = m.geometry, key = m.uuid + ':' + g.uuid + ':' + g.attributes.position.count + ':' + (g.index ? g.index.count : 0);
    if (key !== S.key) build(m);
  };
  // the highest triangle of the ribbon that contains (x, z): its interpolated y, or -Infinity
  S.height = (x, z) => {
    if (!S.P) return -Infinity; const a = S.grid.get(ck(Math.floor(x / S.cell), Math.floor(z / S.cell))); if (!a) return -Infinity; const P = S.P; let best = -Infinity;
    for (let q = 0; q < a.length; q++) {
      const o = a[q] * 9, ax = P[o], az = P[o + 2], bx = P[o + 3], bz = P[o + 5], cx = P[o + 6], cz = P[o + 8];
      const d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz); if (d > -1e-9 && d < 1e-9) continue;
      const u = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / d, w = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / d, r = 1 - u - w; if (u < -1e-4 || w < -1e-4 || r < -1e-4) continue;
      const y = u * P[o + 1] + w * P[o + 4] + r * P[o + 7]; if (y > best) best = y;
    }
    return best;
  };
  return S;
}

// ---- the two-bone solve (pure: THREE vectors passed in), exported for the node test --------------------------------------------------------------------------------------------------------------------
// hip A, knee B, ankle C (world) and the wanted ankle T: returns the new knee position Bn in `out` and the reachable ankle Cn in `out2`; `pole` = the direction the knee points to when the leg is straight
export function solve2(A, B, C, Tg, pole, out, out2, tmp) {
  const l1 = B.distanceTo(A), l2 = C.distanceTo(B), max = (l1 + l2) * 0.998, min = Math.abs(l1 - l2) * 1.02 + 1e-4;
  tmp.subVectors(Tg, A); let d = tmp.length(); if (d < 1e-6) { tmp.set(0, -1, 0); d = 1; } tmp.multiplyScalar(1 / d); d = Math.min(max, Math.max(min, d));           // tmp = unit A->T
  out2.copy(A).addScaledVector(tmp, d);
  const bx = B.x - A.x, by = B.y - A.y, bz = B.z - A.z, k = bx * tmp.x + by * tmp.y + bz * tmp.z;
  const pk = pole.x * tmp.x + pole.y * tmp.y + pole.z * tmp.z;
  let qx = pole.x - tmp.x * pk, qy = pole.y - tmp.y * pk, qz = pole.z - tmp.z * pk; const ql = Math.hypot(qx, qy, qz) || 1; qx /= ql; qy /= ql; qz /= ql;                      // the pole, flattened onto the new axis
  let px = bx - tmp.x * k, py = by - tmp.y * k, pz = bz - tmp.z * k; const pl = Math.hypot(px, py, pz);
  if (pl > 1e-6) { px /= pl; py /= pl; pz /= pl; }
  // the knee keeps the side the clip bends it to; a (nearly) straight leg, or a new axis that would throw it to the other side, takes the pole side instead (blended, so the knee never pops)
  const wk = pl < 1e-6 ? 0 : smooth(-0.15, 0.35, px * qx + py * qy + pz * qz) * smooth(0, 0.03, pl);
  px = px * wk + qx * (1 - wk); py = py * wk + qy * (1 - wk); pz = pz * wk + qz * (1 - wk); { const l = Math.hypot(px, py, pz) || 1; px /= l; py /= l; pz /= l; }
  const x = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  out.set(A.x + tmp.x * x + px * h, A.y + tmp.y * x + py * h, A.z + tmp.z * x + pz * h);
  return d;
}

export function createFoot(H, S, ops) {
  const T = H.THREE, scene = H.scene, ground = ops.ground;                         // ops.ground(x, z) = the current world's ground height INCLUDING the road lift
  const surf = makeSurf(T, scene);
  const A = new T.Vector3(), B = new T.Vector3(), C = new T.Vector3(), Tg = new T.Vector3(), Bn = new T.Vector3(), Cn = new T.Vector3(), tmp = new T.Vector3(), pole = new T.Vector3(), wp = new T.Vector3(), nrm = new T.Vector3(), up = new T.Vector3(0, 1, 0);
  const q1 = new T.Quaternion(), q2 = new T.Quaternion(), q3 = new T.Quaternion(), qI = new T.Quaternion(), qp = new T.Quaternion(), qw = new T.Quaternion();
  const st = { on: true, w: 0, P: 0, calls: 0, ms: 0, maxMs: 0, bound: false, a0: 0, legs: [{ d: 0, pw: 0, tilt: 0 }, { d: 0, pw: 0, tilt: 0 }] };
  const clampN = (x, a, b) => (x < a ? a : x > b ? b : x);

  // her ground with the road: the road surface when it is above the terrain by less than 0.5 m (a ribbon vertex is clamped to 0.2 over low ground: that case is a real step, the smoothing in rpg.js handles it)
  const lift = (x, z, base) => { const y = surf.height(x, z); return y > base && y - base < 0.5 ? y - base : 0; };

  // bind to the hero that was just loaded: the bones and the ankle height of her idle pose (a0: how high the ankle bone is above the sole plane)
  function bind(h) {
    const m = h.model, g = (n) => m.getObjectByName(n); const K = { legs: [], hip: g('Hip'), a0: 0, ok: false };
    for (const s of ['L', 'R']) K.legs.push({ th: g(s + '_Thigh'), ca: g(s + '_Calf'), ft: g(s + '_Foot'), tb: g(s + '_ToeBase') });
    if (!K.hip || K.legs.some((l) => !l.th || !l.ca || !l.ft)) { h.ik = null; return null; }
    const A0 = h.acts; for (const n in A0) A0[n].a.setEffectiveWeight(n === 'idle' ? 1 : 0); if (A0.idle) A0.idle.a.time = 0; h.mixer.update(0); h.grp.updateMatrixWorld(true);
    let a = 0; for (const l of K.legs) { l.ft.getWorldPosition(wp); h.grp.worldToLocal(wp); a += wp.y; } K.a0 = a / 2; K.ok = true; K.legs.forEach((l) => { l.d = 0; l.pw = 0; l.tilt = 0; l.pn = 0; }); K.w = 0; K.P = 0;
    h.ik = K; st.a0 = K.a0; st.bound = true; return K;
  }

  function allowed() {
    if (!st.on) return false;
    if (S.sw === 2 || S.layer !== 0 || !S.grounded) return false;
    if (S.st === 'loco' || S.st === 'land') return true;
    if (S.st === 'cmb') { const c = S.cmb && S.cmb.sim && S.cmb.sim.hero; const s = c && c.state; return !!c && s !== 'hit' && s !== 'down' && s !== 'dead' && s !== 'dodge'; }
    return false;                                                                  // jump / fall / dodge / the rest: the clip owns the legs
  }

  // rotate `bone` by the WORLD rotation q (its children follow)
  function rotWorld(bone, q) {
    bone.updateWorldMatrix(true, false); bone.getWorldQuaternion(qw); qw.premultiply(q); bone.parent.getWorldQuaternion(qp); bone.quaternion.copy(qp.invert().multiply(qw)); bone.updateMatrixWorld(true);
  }
  function setWorldQuat(bone, q) { bone.parent.getWorldQuaternion(qp); bone.quaternion.copy(qp.invert().multiply(q)); bone.updateMatrixWorld(true); }

  // called at the very end of update(): the pose is final
  function ik(dt) {
    const h = S.hero; if (!h) return; let K = h.ik; if (K === undefined) K = bind(h); if (!K || !K.ok) return;
    const t0 = performance.now(), want = allowed(), g = h.grp;
    K.w += ((want ? 1 : 0) - K.w) * (dt > 0 ? Math.min(1, dt * 14) : 1);
    if (K.w < 0.004) { K.w = 0; K.P = 0; for (const l of K.legs) { l.d = 0; l.pw = 0; l.tilt = 0; } st.w = 0; st.P = 0; return; }
    g.updateMatrixWorld(true); const gy = g.position.y, k = dt > 0 ? Math.min(1, dt * 28) : 1;
    // 1. what the animation asks of each foot (ankle height above the sole plane -> planted weight) and what the ground under it is
    let Pn = 0, have = false;
    for (const l of K.legs) {
      l.ft.getWorldPosition(l.C0 || (l.C0 = new T.Vector3())); l.ft.getWorldQuaternion(l.Q0 || (l.Q0 = new T.Quaternion()));
      const lf = l.C0.y - gy - K.a0; l.pw = 1 - smooth(0.02, 0.085, lf);               // planted: the ankle within 2 cm of its resting height; off the ground at 8.5 cm
      const gh = ground(l.C0.x, l.C0.z), dT = clampN(gh - gy, -MAXD, MAXD);
      l.d += (dT - l.d) * k; if (dt === 0) l.d = dT;
      if (l.pw > 0.5 && (!have || l.d < Pn)) { Pn = l.d; have = true; }
    }
    if (!have) Pn = 0; Pn = clampN(Pn, PMIN, PMAX); K.P += (Pn - K.P) * (dt > 0 ? Math.min(1, dt * 14) : 1);
    // 2. the pelvis follows the lowest planted foot
    const dy = K.P * K.w;
    if (Math.abs(dy) > 1e-4) { K.hip.getWorldPosition(wp); wp.y += dy; K.hip.parent.worldToLocal(wp); K.hip.position.copy(wp); g.updateMatrixWorld(true); }
    // 3. each leg: reach the planted ankle's wanted height (the animation's ankle moved by the ground step under it), keep the animation's knee direction
    pole.set(Math.sin(S.body), 0, Math.cos(S.body));
    for (const l of K.legs) {
      if (l.pw < 0.01 && Math.abs(dy) < 1e-3) continue;
      l.th.getWorldPosition(A); l.ca.getWorldPosition(B); l.ft.getWorldPosition(C);
      const wgt = l.pw * K.w; Tg.set(l.C0.x, l.C0.y + l.d * wgt, l.C0.z); Tg.lerp(C, 1 - l.pw);                       // swing foot: where the hierarchy put it; planted foot: the animation's ankle + the ground step
      solve2(A, B, C, Tg, pole, Bn, Cn, tmp);
      tmp.subVectors(B, A).normalize(); wp.subVectors(Bn, A).normalize(); q1.setFromUnitVectors(tmp, wp); rotWorld(l.th, q1);
      l.ca.getWorldPosition(B); l.ft.getWorldPosition(C);
      tmp.subVectors(C, B).normalize(); wp.subVectors(Cn, B).normalize(); q2.setFromUnitVectors(tmp, wp); rotWorld(l.ca, q2);
      // the sole: the animation's world orientation, tilted to the ground normal under the foot (planted only)
      if (l.pw > 0.01) {
        const e = 0.25, fx = Tg.x, fz = Tg.z, hx = ground(fx + e, fz) - ground(fx - e, fz), hz = ground(fx, fz + e) - ground(fx, fz - e);
        nrm.set(-hx / (2 * e), 1, -hz / (2 * e)).normalize(); q3.setFromUnitVectors(up, nrm); const ang = 2 * Math.acos(Math.min(1, q3.w));
        if (ang > TILT) q3.slerp(qI, 1 - TILT / ang); l.tilt = Math.min(ang, TILT);
        q3.slerp(qI, 1 - wgt); q3.multiply(l.Q0); setWorldQuat(l.ft, q3);
      } else setWorldQuat(l.ft, l.Q0);
    }
    st.w = K.w; st.P = K.P; st.calls++; const ms = performance.now() - t0; st.ms += ms; if (ms > st.maxMs) st.maxMs = ms;
  }
  const info = () => { const K = S.hero && S.hero.ik; return { w: +(K ? K.w : 0).toFixed(2), P: +(K ? K.P : 0).toFixed(3), a0: +(K ? K.a0 : 0).toFixed(3), legs: K ? K.legs.map((l) => ({ d: +l.d.toFixed(3), pw: +l.pw.toFixed(2), tilt: +(l.tilt * 57.3).toFixed(1) })) : [], calls: st.calls, avgMs: st.calls ? +(st.ms / st.calls).toFixed(3) : 0, maxMs: +st.maxMs.toFixed(3), road: !!surf.P, tris: surf.n }; };
  return { surf, lift, tick: (now) => surf.check(now), ik, bind, info, st, allowed, setOn: (b) => { st.on = !!b; }, solve2 };
}
