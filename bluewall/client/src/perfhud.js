// On-device performance overlay (settings -> Graphics -> "Performance info"). OFF by default and not even created until it is switched on:
// while off nothing here runs and the profiler (prof.js) is off too, so the cost is zero. Meant for screenshots: it shows what the phone really does.
import { PROF } from './prof.js';

export function createPerfHud({ root, renderer, info, gpu }) {
  let el = null, on = false, acc = 0, n = 0, worst = 0, lastT = 0, text = '', batt = '', battAt = 0, snap = { calls: 0, tris: 0 };
  const fmt = (v) => (v >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : v >= 1e3 ? Math.round(v / 1e3) + 'k' : String(v | 0));
  function ensure() {
    if (el) return;
    el = document.createElement('div');
    el.style.cssText = 'position:absolute;left:6px;top:calc(var(--st,0px) + 150px);z-index:60;font:600 8.5px/1.25 ui-monospace,Menlo,Consolas,monospace;color:#bfe6ff;background:rgba(0,10,28,.62);padding:4px 6px;border-radius:6px;pointer-events:none;white-space:pre-wrap;word-break:break-word;max-width:calc(100vw - 14px);overflow:hidden';
    root.appendChild(el);
  }
  function battery() {
    const now = Date.now(); if (now - battAt < 20000) return; battAt = now;
    try { if (navigator.getBattery) navigator.getBattery().then((b) => { batt = Math.round(b.level * 100) + '%' + (b.charging ? '⚡' : ''); }).catch(() => {}); } catch (e) { /* not available */ }
  }
  return {
    get on() { return on; },
    set(v, state) {
      on = !!v; PROF.on = on;
      if (on) { ensure(); el.style.display = 'block'; info.autoReset = false; info.reset(); lastT = performance.now(); acc = 0; n = 0; worst = 0; }
      else { if (el) el.style.display = 'none'; info.autoReset = true; }
    },
    // once per drawn frame (before the frame is rendered): `state()` returns the quality state of this moment
    frame(dt, state) {
      if (!on) return;
      snap.calls += info.render.calls; snap.tris += info.render.triangles; info.reset();
      acc += dt; n++; if (dt * 1000 > worst) worst = dt * 1000;
      if (acc < 0.5) return;
      battery(); if (gpu) gpu.poll();
      const st = state(), a = PROF.avg, ks = Object.keys(a).sort((x, y) => a[y] - a[x]); let tot = 0; for (const k of ks) tot += a[k];
      const top = ks.slice(0, 6).map((k) => k.replace('render(submit)', 'render') + ' ' + a[k].toFixed(1)).join(' · ');
      const m = info.memory, fps = n / acc;
      text = `${fps.toFixed(0)} fps · ${(1000 * acc / n).toFixed(1)} ms · worst ${worst.toFixed(0)} ms${batt ? ' · 🔋' + batt : ''}\n` +
        `res ${st.dpr.toFixed(2)} (dpr ${st.basedpr.toFixed(2)} × dyn ${st.dyn.toFixed(2)}) · ${st.w}×${st.h}\n` +
        `calls ${(snap.calls / n) | 0} · tris ${fmt(snap.tris / n)} · prog ${info.programs ? info.programs.length : '?'} · tex ${m.textures} · geo ${m.geometries}\n` +
        `JS ${tot.toFixed(1)} ms: ${top}\n` +
        `${gpu ? gpu.summary() : 'gpu n/a'}\n` +
        `${st.preset} · shadow ${st.shadow} · refl ${st.refl} · bloom ${st.bloom} · cap ${st.cap} · cool ${st.cool}${st.gov ? ' · gov ' + st.gov : ''}`;
      el.textContent = text; acc = 0; n = 0; worst = 0; snap.calls = 0; snap.tris = 0;
    },
  };
}
