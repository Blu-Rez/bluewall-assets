// rp4r3_roll_meas.js — RP4_R3: the roll (dodge) on the REAL game (home map), evaluated in the page by rp4r3_q.py after the hero is started.
// Returns JSON { meta, dirs:[{name, in:[ix,iy], intended:[dx,dz], trace:[[t,x,z,st]...], dist, along, lat, tRoll, vmax, v0, vEnd, camMaxAcc, camMove}], walls:[...], noInput:{...}, release:{...} }.
// Positions are relative to the start point.  Frames are 1/60 s; the trace is sampled every 0.05 s (every 3rd frame).  camYaw = 0 (the camera looks along +z): stick (ix, iy) -> world direction (-ix, iy).
(async () => {
  const rp = __rp, S = rp.S, cam = __bw.camera, out = { meta: {}, dirs: [], walls: [], extra: {} };
  rp.pause(true); S.cool = 99; S.dodgeCool = 0;
  const flat = (() => { for (let x = -300; x <= 300; x += 20) for (let z = -300; z <= 240; z += 20) { let lo = 1e9, hi = -1e9; for (let a = -6; a <= 6; a += 1.5) for (let b = -6; b <= 6; b += 1.5) { const y = rp.baseGround(x + a, z + b); lo = Math.min(lo, y); hi = Math.max(hi, y); } if (hi - lo < 0.05 && lo > 0.5 && rp.surfAt(x, z) < -1e8 && [-4, 0, 4].every((a) => [-4, 0, 4].every((b) => rp.free(x + a, z + b)))) return { x, z }; } return { x: 0, z: 0 }; })();
  out.meta = { flat, HSnote: 'HS 1.12', gait: rp.gait(), knobs: null };
  const DT = 1 / 60, r3 = (v) => Math.round(v * 1000) / 1000;
  async function roll(name, ix, iy, o = {}) {
    const x0 = o.x != null ? o.x : flat.x, z0 = o.z != null ? o.z : flat.z, yaw = o.yaw != null ? o.yaw : 0;
    rp.setPos(x0, z0, yaw); rp.setLook(yaw, 0.25); S.dodgeCool = 0; S.vx = S.vz = 0; rp.setInput(0, 0); rp.sim(0.7, DT);
    const c0 = { x: cam.position.x, y: cam.position.y, z: cam.position.z }, sx = S.x, sz = S.z;
    rp.setInput(ix, iy); rp.dodge();
    const tr = [], camV = [], cams = [{ x: cam.position.x, z: cam.position.z }]; let tRoll = null, endP = null, inside = 0, minFree = 0, f = 0, vprev = null, pPrev = [S.x, S.z];
    const T = o.T || 1.5, n = Math.round(T / DT);
    for (let i = 1; i <= n; i++) {
      rp.sim(DT, DT); const t = i * DT;
      if (o.release && i === 2) rp.setInput(0, 0);
      if (!rp.free(S.x, S.z)) inside++;
      if (tRoll == null && S.st !== 'dodge' && i > 2) { tRoll = t; endP = [S.x - sx, S.z - sz]; }
      const v = Math.hypot(S.x - pPrev[0], S.z - pPrev[1]) / DT; pPrev = [S.x, S.z];
      const cv = Math.hypot(cam.position.x - cams[cams.length - 1].x, cam.position.z - cams[cams.length - 1].z) / DT; cams.push({ x: cam.position.x, z: cam.position.z }); camV.push(cv);
      if (i % 3 === 0) tr.push([r3(t), r3(S.x - sx), r3(S.z - sz), S.st, r3(v), r3(S.body)]);
    }
    const il = Math.hypot(ix, iy) || 1, intended = ix || iy ? [-ix / il, iy / il] : [Math.sin(0), Math.cos(0)];
    const ep = endP || [S.x - sx, S.z - sz], dist = Math.hypot(ep[0], ep[1]), along = ep[0] * intended[0] + ep[1] * intended[1], lat = Math.abs(ep[0] * intended[1] - ep[1] * intended[0]);
    const vs = tr.map((q) => q[4]), vmax = Math.max(...vs), v0 = vs.slice(0, 2).reduce((a, b) => a + b, 0) / 2, tl = tr.filter((q) => q[0] <= (tRoll || 0.9));
    let camAcc = 0, camAt = 0; for (let i = 1; i < camV.length; i++) { const a = Math.abs(camV[i] - camV[i - 1]) / DT; if (a > camAcc) { camAcc = a; camAt = (i + 1) * DT; } }
    const camTr = camV.filter((q, i) => i % 3 === 2).map((q) => r3(q));
    const camMove = Math.hypot(cams[cams.length - 1].x - cams[0].x, cams[cams.length - 1].z - cams[0].z);
    const res = { name, in: [ix, iy], intended: intended.map(r3), trace: tr, dist: r3(dist), along: r3(along), lat: r3(lat), tRoll: tRoll == null ? null : r3(tRoll), vmax: r3(vmax), v0: r3(v0), vEnd: r3(tl.length ? tl[tl.length - 1][4] : 0), camMaxAcc: r3(camAcc), camAt: r3(camAt), camTr, camMove: r3(camMove), insideFrames: inside, finalRel: [r3(S.x - sx), r3(S.z - sz)] };
    return res;
  }
  // 1. eight directions relative to the camera (0 = away from the camera, 180 = towards it) with the stick HELD
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; out.dirs.push(await roll('dir' + (k * 45), Math.sin(a), Math.cos(a))); }
  // 2. no stick (the roll goes along her facing), and stick released one frame after the press
  out.extra.noInput = await roll('noInput', 0, 0);
  out.extra.release = await roll('release_fwd', 0, 1, { release: true });
  // 3. walls: the two longest walls, both sides, approach angle 0 / 45 / 70 degrees from the face normal, start 3.0 m and 1.2 m from the face (the roll is longer than 2.6 m: it must stop at the wall)
  for (let k = 0; k < 2; k++) for (const side of [1, -1]) for (const ang of [0, 45, 70]) for (const d of [3.0, 1.2]) {
    const sp = rp.wallSpot(k, side, d, 0); if (!sp) continue; const a = ang * Math.PI / 180, ix = Math.sin(a) * (ang && (k + (side > 0 ? 1 : 0)) % 2 ? -1 : 1), iy = Math.cos(a);
    const r = await roll('wall' + k + (side > 0 ? 'p' : 'm') + '_' + ang + '_d' + d, ix, iy, { x: sp.x, z: sp.z, yaw: sp.yaw, T: 1.4 }); r.trace = r.trace.filter((q, i) => i % 3 === 0); r.wall = { k, side, ang, d, T: r3(sp.T), h: sp.h }; out.walls.push(r);
  }
  rp.setInput(0, 0); rp.pause(false);
  return JSON.stringify(out);
})()
