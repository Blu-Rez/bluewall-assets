// rp1c4_cam_scan.js — RP1C_R4: the third-person camera over the walkable map, fix OFF vs ON.  Run in hero mode:  rp1c2_q.py -t TAG evalf rp1c4_cam_scan.js
(async () => {
  const h = window.__h, d = h.dev, S = d.S, STEP = window.__scanStep || 12, YAWS = [0, 1.57, 3.14, 4.71], out = { pts: 0, off: [], on: [] };
  const pass = (on) => {
    d.camFix(on); const bad = [], mins = []; let n = 0, lt = 0, min = 99, cc = 0;
    for (let x = -330; x <= 330; x += STEP) for (let z = -330; z <= 330; z += STEP) {
      if (!d.free(x, z)) continue; for (const y of YAWS) {
        d.setPos(x, z, y); d.sim(0.25); const i = d.camInfo(); n++; { const cb = d.camCheck(); if (cb.length) { cc++; if (on && (out.ins = out.ins || []).length < 10) out.ins.push([x, z, y, cb.join('+'), +i.d3.toFixed(2)]); } } if (i.d3 < min) min = i.d3; if (i.d3 < 2.15) { lt++; if (bad.length < 4000) bad.push([x, z, y, +i.d3.toFixed(2), +i.camD.toFixed(2), +i.camR.toFixed(2)]); }
      }
    }
    return { n, lt, min: +min.toFixed(2), bad, cc };
  };
  const a = pass(false), b = pass(true); d.camFix(true);
  const cl = (bad) => { const m = new Map(); for (const p of bad) { const k = Math.round(p[0] / 25) + ',' + Math.round(p[1] / 25); if (!m.has(k) || m.get(k)[3] > p[3]) m.set(k, p); } return [...m.values()].sort((u, v) => u[3] - v[3]).slice(0, 40); };
  return { n: a.n, offLt: a.lt, offMin: a.min, onLt: b.lt, onMin: b.min, offInside: a.cc, onInside: b.cc, worstOff: cl(a.bad), worstOn: cl(b.bad), ins: out.ins };
})()
