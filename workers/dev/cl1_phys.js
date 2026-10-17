// cl1_phys.js — CL1 (ROUND6): the hero walks INTO every type of static prop of the home map; before / after numbers per type.
// Evaluated in the game page (hero started, grid built WITH the instance layer).  Async (returns a Promise): the answer is in window.__cl1p and the resolved value.
//   window.__cl1popt = { per: 10 (samples per type), sec: 2.6, types: [regex] }
// Per type (= per instanced-pack key of grid.info().inst.pos, plus the blacksmith meshes): up to `per` instances spread over the map.  For each: the hero starts 4 m from its centre (the first of 8 free approach angles),
// stick FORWARD (1.0) aimed at the centre, real physics (rp.phys, 30 fps) for `sec` seconds.  «through» = she got within 0.35 m of the centre or ended on the far side.  The same samples are walked with the instance layer OFF
// (before: grid.build({inst:false})) and ON (after).  A sample counts only if the BEFORE walk really arrived (nothing else stopped her: the path is free): `valid`.
(async () => {
  const rp = window.__rp, S = rp.S, GR = rp.grid(), O = window.__cl1popt || {}, PER = O.per || 14, SEC = O.sec || 2.6, dt = 1 / 30, steps = Math.ceil(SEC / dt);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const info = GR.info(); const pos = info.inst && info.inst.pos; if (!pos) return JSON.stringify({ err: 'no instance positions: the grid has no instance pass' });
  const types = [];
  for (const [key, a] of Object.entries(pos)) { const n = a.length / 4; const pick = []; const k = Math.min(PER, n); for (let i = 0; i < k; i++) { const j = Math.floor((i + 0.5) * n / k); pick.push([a[j * 4], a[j * 4 + 1], a[j * 4 + 2]]); } types.push({ key, path: a[3], n, pts: pick }); }
  const R = rp.rbody, ANG = [0, 3, 6, 1, 4, 7, 2, 5];
  const walk = (cx, cz, a0, rad) => {                                                             // -> { ok: bool, minD, side } for the first free approach angle
    for (const ai of ANG) {
      const ang = a0 + ai * Math.PI / 4, D0 = 3.5 + rad, sx = cx - Math.sin(ang) * D0, sz = cz - Math.cos(ang) * D0; if (GR.solidAll(sx, sz)) continue;
      rp.setPos(sx, sz, ang); rp.setLook(ang, 0.2); S.cool = 99; S.sw = 0; S.inp.x = 0; S.inp.y = 1; S.sprint = false; S.st = 'loco'; S.vx = S.vz = 0; S.reqDodge = false; S.dodgeCool = 0; S.layer = 0; S.top = S.climb = null; S.camYaw = ang; S.dCool = 0; S.dHold = 0; S.sheetOn = false; S.doorHook = null;
      let minD = 1e9, side = 0, px = S.x, pz = S.z, tp = false;
      for (let i = 0; i < steps; i++) { rp.phys(dt, dt); const j = Math.hypot(S.x - px, S.z - pz); if (j > 0.6) { tp = true; break; } px = S.x; pz = S.z; const d = Math.hypot(S.x - cx, S.z - cz); if (d < minD) minD = d; side = (S.x - cx) * Math.sin(ang) + (S.z - cz) * Math.cos(ang); if (minD < 0.3 || side > 0.3) break; }
      S.inp.y = 0; return { minD, side, ang, tp };
    }
    return null;
  };
  const res = {}; const run = (tag) => { for (const T of types) { if (O.types && !O.types.some((re) => re.test(T.key))) continue; const L = (res[T.key] || (res[T.key] = { key: T.key, path: T.path, n: T.n, s: [] })); T.pts.forEach((p, i) => { const w = walk(p[0], p[1], (i * 0.37) % 6.28, p[2]); (L.s[i] || (L.s[i] = { at: [+p[0].toFixed(1), +p[1].toFixed(1)] }))[tag] = w ? { m: +w.minD.toFixed(2), s: +w.side.toFixed(2), tp: w.tp } : null; }); } };
  // BEFORE: the instance layer off
  await GR.build({ inst: false }); rp.useGrid(true); await wait(50); run('before');
  // AFTER: the instance layer on
  await GR.build(); rp.useGrid(true); await wait(50);
  // (the blacksmith meshes are in the first layer: only the AFTER build has them — the BEFORE of that type is the build of the previous code = the flag below)
  run('after');
  const through = (w) => !!w && !w.tp && w.m < 0.35;
  const rows = Object.values(res).map((L) => { const ok = L.s.filter((q) => q.before && q.after); const valid = ok.filter((q) => through(q.before)); return { key: L.key, path: L.path, n: L.n, tested: L.s.length, valid: valid.length, beforeThrough: valid.length, afterThrough: valid.filter((q) => through(q.after)).length, afterMinD: valid.length ? +(valid.reduce((a, q) => a + q.after.m, 0) / valid.length).toFixed(2) : null }; });
  window.__cl1p = { rows, res }; return JSON.stringify({ rows });
})()
