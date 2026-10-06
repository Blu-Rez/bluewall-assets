// The flight recorder.  When a phone freezes ("Telegram isn't responding") nobody can see why, so the game keeps a tiny black box:
//   * every animation frame that took much longer than it should (> 350 ms) is noted with what the game was doing at that moment (`phase`),
//   * the browser's own "long task" reports (> 300 ms) too,
//   * once per session a snapshot of the device (GPU name, screen, quality tier, memory the scene holds),
// and sends a short JSON report to the server (POST /api/perf, written to the service log as "perf uid=...").  Nothing personal is in it; nothing is sent
// while everything runs smoothly except one small "hello" with the device snapshot per launch.
export function createPerf({ renderer, tier, token }) {
  let phase = 'boot', last = 0, hidden = false, sentHello = false, dirty = false, lastSend = 0;
  const ev = [], c = { f: 0, s100: 0, s200: 0, s500: 0, max: 0 };
  const note = (kind, ms, extra) => { if (ev.length < 24) ev.push({ k: kind, ms: Math.round(ms), ph: phase, at: Math.round(performance.now() / 1000), ...extra }); dirty = true; };
  const dev = () => {
    const o = { tier, dpr: +(window.devicePixelRatio || 1).toFixed(2), scr: screen.width + 'x' + screen.height, hc: navigator.hardwareConcurrency || 0, mem: navigator.deviceMemory || 0, ua: (navigator.userAgent || '').slice(-96) };
    try { const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info'); if (ext) o.gpu = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)).slice(0, 80); } catch (e) { /* ignore */ }
    try { const sz = renderer.getDrawingBufferSize({ x: 0, y: 0, set(a, b) { this.x = a; this.y = b; return this; } }); o.buf = sz.x + 'x' + sz.y; } catch (e) { /* ignore */ }
    return o;
  };
  const stat = () => {
    const o = { cnt: { ...c } };
    try { const i = renderer.info; o.gl = { geo: i.memory.geometries, tex: i.memory.textures, prog: (i.programs || []).length, calls: i.render.calls, tris: i.render.triangles }; } catch (e) { /* ignore */ }
    try { if (performance.memory) o.heapMB = Math.round(performance.memory.usedJSHeapSize / 1048576); } catch (e) { /* ignore */ }
    return o;
  };
  function send(why) {
    const t = typeof token === 'function' ? token() : token; if (!t) return;
    if (sentHello && !dirty) return;
    const body = { v: 1, why, phase, ...(sentHello ? {} : { dev: dev() }), ...stat(), ev: ev.splice(0) }; sentHello = true; dirty = false; lastSend = performance.now();
    try { fetch('/api/perf', { method: 'POST', keepalive: true, headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {}); } catch (e) { /* ignore */ }
  }
  try {
    if (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes && PerformanceObserver.supportedEntryTypes.includes('longtask'))
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.duration > 300) note('task', e.duration); }).observe({ entryTypes: ['longtask'] });
  } catch (e) { /* ignore */ }
  document.addEventListener('visibilitychange', () => { hidden = document.hidden; if (hidden) send('hide'); else last = 0; });
  return {
    phase(p) { if (p === phase) return; const was = phase; phase = p; if (was.startsWith('battle') && !p.startsWith('battle') && (dirty || !sentHello)) send('leave-battle'); },
    // call once per animation frame
    frame(now) {
      if (hidden) return;
      if (last) {
        const d = now - last; c.f++;
        if (d > 100) c.s100++; if (d > 200) c.s200++; if (d > 500) c.s500++; if (d > c.max) c.max = Math.round(d);
        if (d > 350 && d < 20000) note('frame', d);
      }
      last = now;
      if (dirty && now - lastSend > 45000) send('tick');
    },
    send,
  };
}
