// rp1c_r6_scan.js — RP1C_R6: the third-person camera over the whole walkable map (the same 12 m grid x 4 headings as rp1c4_cam_scan.js), with the numbers the owner's complaint needs.  Evaluated INSIDE the game page (hero started):  rp1c2_q.py -t TAG evalf rp1c_r6_scan.js
//   per sample (camera fix ON = the default): 3-D distance to her, the view elevation (the camera's direction below the horizon), inside a solid (camCheck), her screen height (px at 844x390), the ground 6 m ahead of her on the screen (y px; > 390 or < 0 = out of the picture), her head on the screen.
//   samples with HER set inside a solid box (the dev teleport does not push her out) are skipped and counted in heroIn.
//   returns { n, d3: {min, p1, p5, mean}, closer: {lt2_15, lt1_2, lt2_4}, inside, insideList, el: {mean, p95, max, gt41, gt50}, hh: {min, mean}, ahead6: {out, outPct}, lists }
(async () => {
  const h = window.__h, d = h.dev, S = d.S, STEP = window.__scanStep || 12, YAWS = [0, 1.57, 3.14, 4.71], B = __bw, cam = B.camera, T = B.THREE, dir = new T.Vector3();
  const rows = []; let inside = 0, heroIn = 0; const insideList = [], closeList = [], heroInList = [], badList = [];
  d.camFix(true);
  for (let x = -330; x <= 330; x += STEP) for (let z = -330; z <= 330; z += STEP) {
    if (!d.free(x, z)) continue;
    for (const y of YAWS) {
      d.setPos(x, z, y); d.sim(0.25);
      { const c0 = cam.position.clone(); cam.position.set(S.x, S.y + 1.0, S.z); const hp = d.camPen(); cam.position.copy(c0); if (hp > 0.05) { heroIn++; if (heroInList.length < 30) heroInList.push([x, z, y, hp]); continue; } }   // she was set INSIDE a wall / tower box (the teleport does not push her out): not a camera sample
      const i = d.camInfo(), cb = d.camCheck();
      cam.updateMatrixWorld(); cam.getWorldDirection(dir); const el = Math.asin(-dir.y) * 57.29578;
      const pen = d.camPen(); const f = Math.sin(S.camYaw), g = Math.cos(S.camYaw), ax = S.x + f * 6, az = S.z + g * 6, ay = d.ground(ax, az);
      const pf = d.proj(S.x, S.y, S.z), ph = d.proj(S.x, S.y + 2.195, S.z), pa = d.proj(ax, ay, az);
      const hh = Math.abs(pf[1] - ph[1]), pz = pa[2];   // pa[2] > 1 = behind the camera / clipped
      rows.push([i.d3, el, hh, pa[1], ph[1], i.xe, i.f]);
      if (pen > 0.05) { inside++; if (insideList.length < 80) insideList.push([x, z, y, (cb.join('+') + ' ' + pen), +i.d3.toFixed(2), +el.toFixed(0)]); }
      if ((ph[1] < 0 || ph[1] > 390 || hh < 60) && badList.length < 60) badList.push([x, z, y, +i.d3.toFixed(2), +el.toFixed(0), +hh.toFixed(0), +ph[1].toFixed(0), +pf[1].toFixed(0), i.xe && +i.xe.toFixed(2), i.f && +i.f.toFixed(2)]);
      if (i.d3 < 2.15 && closeList.length < 80) closeList.push([x, z, y, +i.d3.toFixed(2), +el.toFixed(0), +hh.toFixed(0)]);
    }
  }
  const n = rows.length, col = (k) => rows.map((r) => r[k]).sort((a, b) => a - b), q = (a, p) => a[Math.min(a.length - 1, Math.floor(a.length * p))], mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const D3 = col(0), EL = col(1), HH = col(2);
  const out6 = rows.filter((r) => r[3] > 390 || r[3] < 0).length;
  const headOut = rows.filter((r) => r[4] < 0 || r[4] > 390).length;
  return JSON.stringify({ n, d3: { min: +D3[0].toFixed(2), p1: +q(D3, 0.01).toFixed(2), p5: +q(D3, 0.05).toFixed(2), mean: +mean(D3).toFixed(2) },
    closer: { lt2_15: D3.filter((v) => v < 2.15).length, lt1_2: D3.filter((v) => v < 1.2).length, lt2_4: D3.filter((v) => v < 2.4).length },
    inside, insideList, closeList, heroIn, heroInList, badList,
    el: { mean: +mean(EL).toFixed(1), p95: +q(EL, 0.95).toFixed(1), max: +EL[n - 1].toFixed(1), gt41: EL.filter((v) => v > 41.5).length, gt50: EL.filter((v) => v > 50).length, lt0: EL.filter((v) => v < 0).length },
    hh: { min: +HH[0].toFixed(0), p5: +q(HH, 0.05).toFixed(0), mean: +mean(HH).toFixed(0), gt300: HH.filter((v) => v > 300).length }, ahead6: { out: out6, outPct: +(out6 * 100 / n).toFixed(2) }, headOut,
    raised: rows.filter((r) => r[5] > 0.02).length, shoulderIn: rows.filter((r) => r[6] < 0.95).length });
})()
