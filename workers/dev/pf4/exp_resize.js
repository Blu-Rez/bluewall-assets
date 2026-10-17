// pf4/exp_resize.js — what does one resize() cost, and which call inside it?  (rig, software GL: CPU side; the share between the calls is the point, not the ms)
const b = __bw, r = b.renderer; const sleep = (ms) => new Promise((x) => setTimeout(x, ms));
const T = {}; const wrap = (obj, name, key) => { const o = obj[name].bind(obj); obj[name] = function (...a) { const t = performance.now(); try { return o(...a); } finally { T[key] = (T[key] || 0) + (performance.now() - t); } }; };
wrap(r, 'setPixelRatio', 'renderer.setPixelRatio'); wrap(r, 'setSize', 'renderer.setSize');
const comp = b.composer(); if (comp) { wrap(comp, 'setPixelRatio', 'composer.setPixelRatio'); wrap(comp, 'setSize', 'composer.setSize'); }
const out = {};
for (const [name, ov] of [['day (composer idle)', { night: 0 }], ['night (composer used)', { night: 1 }]]) {
  b.ov = ov; await sleep(2500); window.dispatchEvent(new Event('pointermove'));
  const rows = [];
  for (const s of [0.9, 0.8, 0.7, 1, 0.9, 1]) {
    for (const k of Object.keys(T)) T[k] = 0;
    const f0 = b.frames; b.dynTo(s);
    let tF = 0; await new Promise((res) => { const t0 = performance.now(); const id = setInterval(() => { if (b.frames > f0 + 1) { clearInterval(id); tF = performance.now() - t0; res(); } }, 5); });
    const px = r.getDrawingBufferSize(new b.THREE.Vector2());
    rows.push({ s, buf: px.x + 'x' + px.y, ms: Object.fromEntries(Object.entries(T).map(([k, v]) => [k, Math.round(v)])), wait_ms: Math.round(tF) });
    await sleep(1200); window.dispatchEvent(new Event('pointermove'));
  }
  out[name] = rows;
}
b.ov = {}; b.dynTo(1);
return out;
