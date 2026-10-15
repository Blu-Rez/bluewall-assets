// rp1c2_prof2.js — RP1C-R2 Job 1b (robust version of rp1c2_prof.js): JS CPU ms per drawn frame, but per FRAME and reported as the MEDIAN (and a trimmed mean), because the rig's few-second frames have stalls (GC, shader compiles)
//   that wreck the game's EMA.  The per-frame numbers are recovered from the game's own PROF EMA (a_new = 0.9 a_old + 0.1 m) after every frame (a frame takes >= 1.5 s here, the poll is 250 ms: one frame at a time).
//   window.__VIEW 'gate'|'fields'|'mill', __NF frames (default 40), __MODE 'new'|'old' (old = the Job 1b levers off: no matrix savings, no life radius, no town cells, the castle's own LOD radius).
//   Output: render / update / hero / world / total as median ms; mean of the frames below 3 x median; calls, tris (medians of the frames, the periodic mirror / shadow frames are the high tail), programs.
(async () => {
  const rp = __rp, S = rp.S, B = __bw, PROF = window.__bwProf, wait = (ms) => new Promise((r) => setTimeout(r, ms)), R = rp.knobs(), cull = rp.cull(), diet = rp.diet();
  const views = { gate: [40.95, 21.98, -2.17], fields: [211, 22, 1.57] }, v = window.__VIEW || 'gate', NF = window.__NF || 40, mode = window.__MODE || 'new';
  rp.pause(false); S.cool = 99; if (views[v]) rp.setPos(views[v][0], views[v][1], views[v][2]); else rp.goNear('ws:mill_wind2', 4);
  if (mode === 'old') { cull.setMtx(false); cull.setTown(false); R.life = 0; R.lod = 0; } else { cull.setMtx(true); cull.setTown(true); diet.apply(diet.st.lvl); }
  rp.fakeClock(true); rp.setInput(0, 0);
  await wait(5000); PROF.on = true; for (const k in PROF.avg) delete PROF.avg[k]; for (const k in PROF.ms) delete PROF.ms[k];
  const WORLD = ['weather', 'sky', 'water', 'flames+fairies', 'forest', 'anim', 'lamps+smokers', 'particles', 'dragon', 'units+patrols', 'lateTick', 'life', 'army', 'tesla+dlings', 'extras', 'moat', 'falls+levels+vaults'];
  const rows = []; let prev = null, pf = PROF.frames, calls = [], tris = [], skipped = 0;
  for (let i = 0; i < 4000 && rows.length < NF; i++) {
    await wait(200); if (PROF.frames === pf) continue;
    const d = PROF.frames - pf; pf = PROF.frames; const cur = Object.assign({}, PROF.avg); const p = rp.perf();
    if (prev && d === 1) {
      const m = {}; for (const k in cur) { const a0 = prev[k] === undefined ? 0 : prev[k]; m[k] = prev[k] === undefined ? cur[k] : (cur[k] - 0.9 * a0) / 0.1; }
      let upd = 0, world = 0; for (const k in m) { if (k.charCodeAt(1) === 58 || k === 'render(submit)' || k === 'refl') continue; upd += m[k]; } for (const k of WORLD) world += m[k] || 0;
      rows.push({ render: (m['render(submit)'] || 0) + (m.refl || 0), update: upd, hero: m.battle || 0, world, total: upd + (m['render(submit)'] || 0) + (m.refl || 0), calls: p.calls, tris: p.tris });
    } else skipped++;
    prev = cur;
  }
  const med = (x) => { const s = x.slice().sort((a, b) => a - b); return s.length ? s[s.length >> 1] : 0; };
  const out = { view: v, mode, frames: rows.length, skipped, progs: B.renderer.info.programs.length, px: B.renderer.getPixelRatio(), lvl: diet.st.lvl, cells: cull.info().cells, mx: cull.info().mx };
  for (const k of ['render', 'update', 'hero', 'world', 'total', 'calls', 'tris']) { const x = rows.map((r) => r[k]); const md = med(x); const lim = k === 'calls' || k === 'tris' ? Infinity : md * 3 + 2; const tm = x.filter((q) => q <= lim); out[k] = +md.toFixed(2); out[k + '_tm'] = +(tm.reduce((a, b) => a + b, 0) / (tm.length || 1)).toFixed(2); out[k + '_max'] = +Math.max(...x).toFixed(1); }
  out.raw = rows.map((r) => +r.total.toFixed(1));
  PROF.on = false; rp.fakeClock(false);
  return JSON.stringify(out);
})()
