// rs2_start.js — RS2: load the CURRENT rpg.js / rp_sisters.js into the persistent browser and start a sister (phone diet).   python3 rp1c2_q.py -t rs2 evalf rs2_start.js
(async () => {
  const sl = (ms) => new Promise((r) => setTimeout(r, ms)), raf = () => new Promise((r) => requestAnimationFrame(r));
  window.__rpPhone = true; const h = await window.__rpLoad('?v=' + Date.now()); window.__h = h; window.__rpNoWarm = window.__rpNoWarm || false;
  localStorage.removeItem('bw_rs_v1');
  const key = (window.__rs2Key || 'elina'); await h.start(key); h.diet.CFG.down_ms = 1e9; await sl(1200); for (let i = 0; i < 4; i++) await raf();
  const r = h.sisters.main ? h.sisters.main.getBoundingClientRect() : null;
  return JSON.stringify({ key: h.dev.S.key, active: h.active, main: r && [r.x, r.y, r.width, r.height], viewport: [innerWidth, innerHeight], fx: h.sisters.st.fx });
})()
