// pf4/exp_step.js — hero mode: what does a diet step (apply(lvl)) cost in the frame it lands in, call by call?  (rig, CPU side)
const b = __bw, r = b.renderer; const sleep = (ms) => new Promise((x) => setTimeout(x, ms));
window.__nd.on = true; const poke = () => window.dispatchEvent(new Event('pointermove')); const ip = setInterval(poke, 600);
await __rpLoad('?v=' + Date.now()); await __rp.start('elina'); await sleep(3500);
const d = __rp.diet(); d.gov.lastChange = 1e12; d.gov.lockUp = 1e12;               // freeze the governor: only OUR steps happen
const T = {}; const wrap = (obj, name, key) => { if (!obj || typeof obj[name] !== 'function') return; const o = obj[name].bind(obj); obj[name] = function (...a) { const t = performance.now(); try { return o(...a); } finally { T[key] = (T[key] || 0) + (performance.now() - t); } }; };
wrap(r, 'setSize', 'renderer.setSize'); wrap(r, 'render', 'renderer.render'); wrap(r, 'compile', 'renderer.compile'); wrap(b.refl, 'update', 'refl.update'); wrap(b.world, 'update', 'world.update'); wrap(b.world.weather, 'setPx', 'weather.setPx'); wrap(b.ctl, 'setView', 'ctl.setView');
wrap(d, 'pass', 'diet.pass'); wrap(d, 'collect', 'diet.collect'); wrap(d, 'syncQ', 'diet.syncQ');
const comp = b.composer(); if (comp) { wrap(comp, 'render', 'composer.render'); wrap(comp, 'setSize', 'composer.setSize'); }
const frameCosts = []; const f0 = () => { for (const k of Object.keys(T)) T[k] = 0; };
const raf = () => new Promise((x) => requestAnimationFrame(() => x()));
const measure = async (label, act) => {
  const rows = [];
  for (let rep = 0; rep < 3; rep++) {
    await sleep(1500); poke(); await raf(); f0();
    const t0 = performance.now(); if (act) act(); const fs = b.frames; while (b.frames < fs + 2) await raf(); const wall = performance.now() - t0;
    rows.push({ wall: Math.round(wall), ...Object.fromEntries(Object.entries(T).filter(([, v]) => v > 3).map(([k, v]) => [k, Math.round(v)])) });
  }
  return rows;
};
const out = {};
out.steady = await measure('steady', null);
const L = d.st.lvl;
out['apply(+1: shadows thin..)'] = await measure('step', () => d.apply(Math.min(4, d.st.lvl + 1)));
out['apply(5 = px 0.85)'] = await measure('px', () => d.apply(5));
out['apply(7 = px 0.55)'] = await measure('px', () => d.apply(7));
out['apply(1 = back to px 1.0)'] = await measure('px', () => d.apply(1));
clearInterval(ip); return out;
