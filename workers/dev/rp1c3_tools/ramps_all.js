(async () => {
  const a = window.__rp, S = a.S, cam = window.__bw.camera; const res = []; let py = null, maxDy = 0, at = '';
  S.tap = () => { const y = cam.position.y; if (py !== null && Math.abs(y - py) > maxDy && Math.abs(y - py) < 3) { maxDy = Math.abs(y - py); at = S.layer + '@' + cam.position.x.toFixed(1) + ',' + cam.position.z.toFixed(1); } py = y; };
  const n = a.ramps().st.ramps.length;
  for (let i = 0; i < n; i++) { py = null; const t = a.rampTest(i, {}); res.push([i, t.ok, t.up.ok, t.down.ok, t.camBad, t.fall, t.up.maxGrade].join(' ')); }
  S.tap = null; return JSON.stringify({ res, maxDy: +maxDy.toFixed(3), at });
})()
