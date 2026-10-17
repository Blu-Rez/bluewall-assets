// rp1c_r6_jump.js — RP1C_R6: the jump, frame by frame (60 fps physics + clips + the real camera).  Evaluated INSIDE the game page (hero started):  window.__R6J = { x, z, yaw, run: bool, fps: 60, secs: 1.6, cam: 'default' }  -> JSON { rows: [...], sum: {...} }
//   per frame: t, st (state), h (S.y - ground, m), vy, soleMin (the lowest toe bone above the ground under her, m), pose weights (idle/walk/run/jump/fall/land: 0..1), jump clip time / duration, camY (above her feet), camD3 (camera - pivot), camPivotY, grounded
//   camAbsRange / camAbsStep = the camera's own height range / largest 1-frame step (m, world), scrFeetRange / scrHeadRange = how far her feet / head travel on the screen in px (844x390).
//   summary: take-off frame (physics leaves the ground), first frame the lowest sole is > 2 cm off the ground, apex (m, s), touch-down frame, soles below ground (max, m) / above ground while grounded (max, m), jump-clip weight at take-off + 50 ms, camera y range / its largest 1-frame step.
(async () => {
  const rp = __rp, S = rp.S, B = __bw, T = B.THREE, P = window.__R6J || {}, fps = P.fps || 60, st = 1 / fps, secs = P.secs || 1.8;
  if (rp.pause) rp.pause(true); S.cool = 99; rp.contact({ rigid: true, rib: true }); rp.footOn(true);
  rp.setPos(P.x, P.z, P.yaw); rp.sprint(false); rp.setInput(0, P.run ? 1 : 0); rp.sim(1.5, 1 / 60);
  const rows = [], v = new T.Vector3(); const A = () => S.hero.acts; const toes = S.hero.toes || [];
  const gAt = () => rp.ground(S.x, S.z); const g0 = gAt();
  const sample = (t) => {
    let lo = 9; S.hero.model.updateMatrixWorld(true); for (const o of toes) { o.getWorldPosition(v); lo = Math.min(lo, v.y); }
    const a = A(), w = (n) => (a[n] ? +a[n].w.toFixed(3) : 0), cam = B.camera, info = rp.camInfo();
    rows.push({ t: +t.toFixed(3), st: S.st, h: +(S.y - gAt()).toFixed(3), vy: +S.vy.toFixed(2), sole: toes.length ? +(lo - gAt()).toFixed(3) : null, gr: S.grounded ? 1 : 0, w: [w('idle'), w('walk'), w('run'), w('jump'), w('fall'), w('land')], jt: a.jump ? +(a.jump.a.time / a.jump.d).toFixed(3) : null,
      camY: +(cam.position.y - S.y).toFixed(3), cam3: +info.d3.toFixed(3), pivY: +(S.pivot.y - S.y).toFixed(3), mY: +S.hero.model.position.y.toFixed(3), v: +S.speed.toFixed(2), camAbs: +(cam.position.y - g0).toFixed(3), scrF: +rp.proj(S.x, S.y, S.z)[1].toFixed(1), scrH: +rp.proj(S.x, S.y + 2.195, S.z)[1].toFixed(1) });
  };
  sample(0); rp.jump(); let t = 0;
  for (let i = 0; i < Math.ceil(secs / st); i++) { rp.sim(st, st); t += st; sample(t); }
  rp.setInput(0, 0);
  const r0 = rows[0]; const iTo = rows.findIndex((r, i) => i > 0 && r.gr === 0), iSole = rows.findIndex((r, i) => i > 0 && r.sole != null && r.sole > r0.sole + 0.02);
  let iApex = 0; for (let i = 0; i < rows.length; i++) if (rows[i].h > rows[iApex].h) iApex = i; const iLand = rows.findIndex((r, i) => i > iTo && r.gr === 1);
  let sMinG = 9, sMaxG = -9; for (const r of rows) if (r.gr === 1 && r.sole != null && r.st !== 'land') { sMinG = Math.min(sMinG, r.sole - r0.sole); sMaxG = Math.max(sMaxG, r.sole - r0.sole); }
  let landMin = 9; for (let i = iLand; i < rows.length && i < iLand + 40; i++) if (rows[i].sole != null) landMin = Math.min(landMin, rows[i].sole - r0.sole);
  let cMin = 9, cMax = -9, cStep = 0, p3 = rows[0].cam3, p3s = 0; for (const r of rows) { cMin = Math.min(cMin, r.camY); cMax = Math.max(cMax, r.camY); } for (let i = 1; i < rows.length; i++) { cStep = Math.max(cStep, Math.abs(rows[i].camY - rows[i - 1].camY)); p3s = Math.max(p3s, Math.abs(rows[i].cam3 - rows[i - 1].cam3)); }
  const wAt = (i, k) => rows[Math.min(rows.length - 1, i)].w[k];
  const sum = { fps, run: !!P.run, sole0: r0.sole, takeoffT: iTo > 0 ? rows[iTo].t : null, soleLiftT: iSole > 0 ? rows[iSole].t : null, apexH: rows[iApex].h, apexT: rows[iApex].t, landT: iLand > 0 ? rows[iLand].t : null, airT: iLand > 0 && iTo > 0 ? +(rows[iLand].t - rows[iTo].t).toFixed(3) : null,
    jumpW_at_takeoff: iTo > 0 ? wAt(iTo, 3) : null, jumpW_50ms: iTo > 0 ? wAt(iTo + Math.round(0.05 * fps), 3) : null, jumpW_apex: wAt(iApex, 3), soleApexAbove: +(rows[iApex].sole - r0.sole).toFixed(3),
    solePenGrounded: +(-sMinG).toFixed(3), soleFloatGrounded: +sMaxG.toFixed(3), landSoleMin: +landMin.toFixed(3), camYmin: cMin, camYmax: cMax, camYstep: +cStep.toFixed(3), cam3step: +p3s.toFixed(3), camAbsRange: +(Math.max(...rows.map((r) => r.camAbs)) - Math.min(...rows.map((r) => r.camAbs))).toFixed(3), camAbsStep: +Math.max(...rows.slice(1).map((r, i) => Math.abs(r.camAbs - rows[i].camAbs))).toFixed(3), scrFeetRange: +(Math.max(...rows.map((r) => r.scrF)) - Math.min(...rows.map((r) => r.scrF))).toFixed(1), scrHeadRange: +(Math.max(...rows.map((r) => r.scrH)) - Math.min(...rows.map((r) => r.scrH))).toFixed(1), seq: rows.filter((r, i) => i === 0 || r.st !== rows[i - 1].st).map((r) => r.st + '@' + r.t) };
  rp.pause(false);
  return JSON.stringify({ sum, rows: P.rows ? rows : undefined });
})()
