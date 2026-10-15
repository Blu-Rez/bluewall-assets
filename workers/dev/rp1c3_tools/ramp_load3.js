(async () => {
  const r0 = window.__bw.renderer;
  try { if (window.__rp && window.__rp.exit) window.__rp.exit(); } catch (e) {}
  const n0 = r0.info.programs.length; const t0 = performance.now();
  await window.__rpLoad('?v=' + Date.now());
  const api = window.__rp;
  await api.start('elina');
  await new Promise(r => setTimeout(r, 1200));
  const g = api.grid ? api.grid() : null; const gi = g ? g.info() : null;
  return JSON.stringify({ progs0: n0, progs: r0.info.programs.length, ms: Math.round(performance.now() - t0), grid: gi, boxes: api.S.boxes.length, discs: api.S.discs.length });
})()
