// rp1c2_smooth.js — RP1C-R2 Job 5: SMOOTHNESS of movement, measured on the real game (evaluate inside the hero page).  window.__PARTS = 'ABCD' (A clip analysis, B foot sliding, C start / stop / turns, D fps), window.__TAGN = label.
//   A  per clip (walk, run): the LEFT foot's heel-strike phase (forward extreme), its lowest phase, stance share, the stance foot's speed relative to the body -> the stride length the clip WANTS vs STRIDE_W / STRIDE_R
//   B  foot sliding in cm/s: a planted sole (within 2.5 cm of the ground) should not move in the world; measured at walk / 2.5 / 3.5 / run / sprint (the two clips share ONE S.phase)
//   C  start / stop (time to speed, stopping distance, accel), 180° camera snap (yaw rate, time), reversal of the stick (does the cycle play against her motion?)
//   D  20 / 30 / 60 fps on a fake clock: the largest per-frame change of body yaw, camera position, S.y — per frame and normalised per second; the jerk of the camera
(async () => {
  const B = __bw, T = B.THREE, rp = __rp, S = rp.S, cam = B.camera, PARTS = window.__PARTS || 'ABCD', DEG = 180 / Math.PI;
  const out = { tag: window.__TAGN || '', parts: PARTS }, wrapPi = (a) => { a %= 2 * Math.PI; if (a > Math.PI) a -= 2 * Math.PI; if (a < -Math.PI) a += 2 * Math.PI; return a; };
  const q = (a, p) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))].toFixed(4); };
  const mean = (a) => a.length ? +(a.reduce((s, x) => s + x, 0) / a.length).toFixed(4) : null;
  rp.pause(true); S.cool = 99; rp.setInput(0, 0); rp.sprint(false); if (window.__GAIT && rp.gait) rp.gait(window.__GAIT); out.gait = rp.gait ? rp.gait() : null;
  const h = S.hero, A = h.acts, g = (n) => h.model.getObjectByName(n), FT = [g('L_Foot'), g('R_Foot')], wp = new T.Vector3();
  const ftw = (i) => { FT[i].getWorldPosition(wp); return [wp.x, wp.y, wp.z]; };
  const ftl = (i) => { FT[i].getWorldPosition(wp); h.grp.worldToLocal(wp); return [wp.x, wp.y, wp.z]; };            // in her own frame: z forward, y up
  // a flat, dry, FREE stretch: candidates by the height profile, then a real test run (sprint 2.5 s, no collider may slow her: she must cover >= 12 m)
  let flat = null; const cands = []; for (let x = -300; x <= 300; x += 20) for (let z = -300; z <= 200; z += 20) { let lo = 1e9, hi = -1e9, ok = true; for (let k = 0; k <= 14; k++) { const y = rp.baseGround(x, z + k * 5); if (rp.ground(x, z + k * 5) < -0.2 || rp.surfAt(x, z + k * 5) > -1e8) ok = false; lo = Math.min(lo, y); hi = Math.max(hi, y); } if (ok && hi - lo < 0.5 && lo > 0.3) cands.push({ x, z }); }
  rp.footOn(false); for (const c of cands) { rp.setPos(c.x, c.z, 0); rp.setInput(0, 1); rp.sprint(true); rp.sim(2.5, 1 / 60); const dz = S.z - c.z, dx = Math.abs(S.x - c.x); if (dz > 12 && dx < 1) { flat = { x: c.x, z: c.z }; break; } } rp.setInput(0, 0); rp.sprint(false); rp.footOn(true);
  out.flat = flat; out.nCands = cands.length; if (!flat) flat = { x: 0, z: 0 };
  const ikOn0 = rp.foot() && rp.foot().on;

  // ---------------------------------------------------------------- A
  if (PARTS.includes('A')) {
    out.A = {}; rp.footOn(false);
    for (const name of ['walk', 'run']) {
      const c = A[name]; if (!c) continue; for (const k in A) A[k].a.setEffectiveWeight(0); c.a.setEffectiveWeight(1);
      const N = 120, zs = [[], []], ys = [[], []]; h.grp.updateMatrixWorld(true);
      for (let i = 0; i <= N; i++) { c.a.time = Math.min(c.d - 1e-4, (i / N) * c.d); h.mixer.update(0); for (let f = 0; f < 2; f++) { const p = ftl(f); zs[f].push(p[2]); ys[f].push(p[1]); } }
      const r = { d: +c.d.toFixed(3) };
      for (let f = 0; f < 2; f++) {
        const z = zs[f], y = ys[f], ymin = Math.min(...y), ymax = Math.max(...y); let iz = 0; for (let i = 0; i < N; i++) if (z[i] > z[iz]) iz = i; let iy = 0; for (let i = 0; i < N; i++) if (y[i] < y[iy]) iy = i;
        let st = 0, vs = 0, n = 0; for (let i = 0; i < N; i++) { if (y[i] < ymin + 0.03) { st++; const dz = (z[(i + 1) % (N + 1)] - z[i]) / (c.d / N); vs += -dz; n++; } }
        r[f ? 'R' : 'L'] = { hs: +(iz / N).toFixed(3), low: +(iy / N).toFixed(3), stance: +(st / N).toFixed(3), vStance: n ? +(vs / n).toFixed(3) : null, stride: n ? +((vs / n) * c.d).toFixed(3) : null, zRange: +(Math.max(...z) - Math.min(...z)).toFixed(3), yLift: +(ymax - ymin).toFixed(3) };
      }
      out.A[name] = r;
    }
    out.A.consts = { STRIDE_W: 2.75, STRIDE_R: 5.49 }; rp.footOn(!!ikOn0);
  }

  // ---------------------------------------------------------------- B
  const planted = (i) => { const k = S.hero.ik, p = ftw(i); const sole = p[1] - (k ? k.a0 : 0.134); return { p, h: sole - rp.baseGround(p[0], p[2]) - Math.max(0, (rp.surfAt(p[0], p[2]) || -1e9) - rp.baseGround(p[0], p[2])) }; };
  // stance = a foot whose sole stayed within 3 cm of the ground and (nearly) level for >= 4 frames in a row; its world speed is the slide (a swing foot passing the ground is not stance)
  const mkTrack = () => ({ n: [0, 0], py: [0, 0], pp: [null, null], sp: [], spL: [], spR: [] });
  const trackStep = (tr, F) => { for (let f = 0; f < 2; f++) { const c = ftw(f), pl = planted(f), d = tr.pp[f] ? Math.hypot(c[0] - tr.pp[f][0], c[2] - tr.pp[f][2]) / F : 0, vy = tr.pp[f] ? Math.abs(c[1] - tr.pp[f][1]) / F : 9; tr.pp[f] = c;
      if (pl.h < 0.04 && vy < 0.8) { tr.n[f]++; if (tr.n[f] >= 3) { tr.sp.push(d * 100); (f ? tr.spR : tr.spL).push(d * 100); } } else tr.n[f] = 0; } };
  const trackOut = (tr) => ({ n: tr.sp.length, med: q(tr.sp, 0.5), mean: mean(tr.sp), p90: q(tr.sp, 0.9), medL: q(tr.spL, 0.5), medR: q(tr.spR, 0.5) });
  const holdSpeed = (m, spr, secs, F = 1 / 60) => {                                                                // steady-state run at stick m; returns the stance-foot slide (cm/s)
    rp.setPos(flat.x, flat.z, 0); S.phase = 0; rp.setInput(0, m); rp.sprint(spr); rp.sim(2.2, F);
    const tr = mkTrack(); let v = 0, n = 0; const z0 = S.z;
    for (let i = 0; i < Math.round(secs / F); i++) { rp.sim(F, F); trackStep(tr, F); v += S.speed; n++; }
    return { v: +(v / n).toFixed(2), ...trackOut(tr), dist: +(S.z - z0).toFixed(1) };
  };
  if (PARTS.includes('B')) {
    out.B = {};
    for (const [tag, m, spr] of [['walk', 0.55, false], ['2.5 m/s', 0.76, false], ['3.5 m/s', 0.9, false], ['run', 1, false], ['sprint', 1, true]]) { try { out.B[tag] = holdSpeed(m, spr, m < 0.6 ? 5.0 : 3.2); } catch (e) { out.B[tag] = 'ERR ' + e.message; } }
    rp.setInput(0, 0); rp.sprint(false);
  }

  // ---------------------------------------------------------------- C
  if (PARTS.includes('C')) {
    out.C = {}; const F = 1 / 60;
    for (const [tag, spr] of [['run', false], ['sprint', true]]) {
      rp.setPos(flat.x, flat.z, 0); rp.sim(0.6, F); rp.sprint(spr); rp.setInput(0, 1); const sp = []; for (let i = 0; i < 150; i++) { rp.sim(F, F); sp.push(S.speed); }
      const vf = sp[sp.length - 1], t90 = (sp.findIndex((x) => x >= 0.9 * vf) + 1) * F; let ma = 0; for (let i = 1; i < sp.length; i++) ma = Math.max(ma, Math.abs(sp[i] - sp[i - 1]) / F);
      const z0 = S.z; rp.setInput(0, 0); const sd = []; let ts = null; for (let i = 0; i < 90; i++) { rp.sim(F, F); sd.push(S.speed); if (ts == null && S.speed < 0.05) ts = (i + 1) * F; } let md = 0; for (let i = 1; i < sd.length; i++) md = Math.max(md, Math.abs(sd[i] - sd[i - 1]) / F);
      out.C['start/stop ' + tag] = { vTop: +vf.toFixed(2), t90: +t90.toFixed(3), maxAccel: +ma.toFixed(1), stopT: ts, stopDist: +(S.z - z0).toFixed(2), maxDecel: +md.toFixed(1), speed1: +sd[0].toFixed(2) };
    }
    { rp.setPos(flat.x, flat.z, 0); rp.sim(0.6, F); S.phase = 0; rp.sprint(false); rp.setInput(0, 1); const tr = mkTrack(); for (let i = 0; i < 90; i++) { rp.sim(F, F); trackStep(tr, F); } out.C['stance slide, first 1.5 s of a run start'] = trackOut(tr); rp.setInput(0, 0); const tr2 = mkTrack(); for (let i = 0; i < 60; i++) { rp.sim(F, F); trackStep(tr2, F); } out.C['stance slide, 1 s after the stick is released'] = trackOut(tr2); }
    // 180° camera snap, standing: she turns in place — rate, time to <10°
    { rp.setPos(flat.x, flat.z, 0); rp.sim(0.6, F); S.camYaw = wrapPi(S.camYaw + Math.PI); const ys = [], vs = []; let t10 = null, pb = S.body; for (let i = 0; i < 90; i++) { rp.sim(F, F); const d = wrapPi(S.body - pb) * DEG / F; pb = S.body; ys.push(Math.abs(d)); vs.push(S.speed); if (t10 == null && Math.abs(wrapPi(S.body - S.camYaw)) * DEG < 10) t10 = (i + 1) * F; }
      out.C['snap 180° standing'] = { maxYawRate: +Math.max(...ys).toFixed(0), t10: t10, maxSpeed: +Math.max(...vs).toFixed(2), jumpFrame: +Math.max(...ys.map((d) => d * F)).toFixed(1) }; }
    // run forward, camera dragged 180° in 0.4 s: min speed (turn-in-place?), yaw rate
    { rp.setPos(flat.x, flat.z, 0); rp.setInput(0, 1); rp.sim(1.5, F); const n = Math.round(0.4 / F), ys = [], vs = []; let pb = S.body; for (let i = 0; i < n + 60; i++) { if (i < n) rp.look(Math.PI / n, 0); rp.sim(F, F); ys.push(Math.abs(wrapPi(S.body - pb)) * DEG / F); pb = S.body; vs.push(S.speed); }
      out.C['run + drag 180° in 0.4 s'] = { maxYawRate: +Math.max(...ys).toFixed(0), minSpeed: +Math.min(...vs).toFixed(2), vStart: +vs[0].toFixed(2), settledDeg: +rp.faceInfo().deg.toFixed(1) }; rp.setInput(0, 0); rp.sim(0.8, F); }
    // run, then the stick pulled to the opposite side (towards the camera): which way does the cycle play versus the way she moves?
    { rp.setPos(flat.x, flat.z, 0); rp.setInput(0, 1); rp.sim(1.5, F); rp.setInput(0, -1); const ph0 = []; let wrong = 0, wrongT = 0, minV = 9, pph = S.phase; const rows = [];
      for (let i = 0; i < 120; i++) { rp.sim(F, F); const fx = Math.sin(S.body), fz = Math.cos(S.body), vf = S.vx * fx + S.vz * fz; let dph = S.phase - pph; if (dph > 0.5) dph -= 1; if (dph < -0.5) dph += 1; pph = S.phase; const dirCycle = dph > 1e-5 ? 1 : dph < -1e-5 ? -1 : 0; if (Math.abs(vf) > 0.5 && dirCycle !== 0 && dirCycle !== Math.sign(vf)) { wrong++; } minV = Math.min(minV, vf); if (i % 10 === 0) rows.push([+(i * F).toFixed(2), +vf.toFixed(2), S.bk ? 1 : 0, dirCycle]); }
      out.C['run -> stick back'] = { framesCycleAgainstMotion: wrong, secondsAgainst: +(wrong * F).toFixed(2), minForwardV: +minV.toFixed(2), rows }; rp.setInput(0, 0); rp.sim(0.8, F); }
  }

  // ---------------------------------------------------------------- D
  if (PARTS.includes('D')) {
    out.D = {};
    for (const fps of [20, 30, 60]) {
      const F = 1 / fps; rp.setPos(flat.x, flat.z, 0); rp.sim(0.5, 1 / 60); rp.sprint(true); rp.setInput(0, 1);
      const rows = [], cpos = []; let pb = S.body, py = S.y, pc = null, pcy = null;
      const lag = []; const rec = (tag) => { if (tag === 'run') lag.push(Math.hypot(S.pivot.x - S.x, S.pivot.z - S.z)); const c = cam.position, cy = Math.atan2(c.x - S.x, c.z - S.z); const cur = [c.x, c.y, c.z]; const dB = Math.abs(wrapPi(S.body - pb)) * DEG; const dY = Math.abs(S.y - py); const dC = pc ? Math.hypot(cur[0] - pc[0], cur[1] - pc[1], cur[2] - pc[2]) : 0; cpos.push(cur); rows.push({ tag, dB, dY, dC, v: S.speed }); pb = S.body; py = S.y; pc = cur; };
      for (let i = 0; i < Math.round(1.0 * fps); i++) { rp.sim(F, F); rec('run'); }
      const nd = Math.round(1.0 * fps); for (let i = 0; i < nd; i++) { rp.look(Math.PI / nd, 0); rp.sim(F, F); rec('drag'); }                  // 180° in 1 s
      rp.setInput(0, -1); for (let i = 0; i < Math.round(1.0 * fps); i++) { rp.sim(F, F); rec('back'); }
      rp.setInput(0, 1); rp.jump(); for (let i = 0; i < Math.round(1.0 * fps); i++) { rp.sim(F, F); rec('jump'); }
      rp.setInput(0, 0); for (let i = 0; i < Math.round(0.8 * fps); i++) { rp.sim(F, F); rec('stop'); }
      rows.shift();
      const mx = (k, tag) => Math.max(...rows.filter((r) => !tag || r.tag === tag).map((r) => r[k]));
      // jerk of the camera: second difference of its position (m per frame^2) -> m/s^2
      let jk = 0; for (let i = 2; i < cpos.length; i++) { const a = cpos[i], b = cpos[i - 1], c = cpos[i - 2]; jk = Math.max(jk, Math.hypot(a[0] - 2 * b[0] + c[0], a[1] - 2 * b[1] + c[1], a[2] - 2 * b[2] + c[2]) / (F * F)); }
      out.D[fps + ' fps'] = { bodyDegPerS: +(mx('dB') / F).toFixed(0), bodyDegPerS_drag: +(mx('dB', 'drag') / F).toFixed(0), camMps: +(mx('dC') / F).toFixed(2), camMps_run: +(mx('dC', 'run') / F).toFixed(2), camMps_drag: +(mx('dC', 'drag') / F).toFixed(2), camMps_back: +(mx('dC', 'back') / F).toFixed(2), yMps: +(mx('dY') / F).toFixed(2), camJerk: +jk.toFixed(0), pivotLag: +mean(lag.slice(Math.round(lag.length / 2))).toFixed(3), maxBodyDegFrame: +mx('dB').toFixed(1), maxCamFrame: +mx('dC').toFixed(3) };
    }
    rp.setInput(0, 0); rp.sprint(false);
  }
  rp.setInput(0, 0); rp.sprint(false); rp.footOn(!!ikOn0); rp.pause(false);
  return JSON.stringify(out);
})()
