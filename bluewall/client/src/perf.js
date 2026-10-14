// The flight recorder.  When a phone freezes ("Telegram isn't responding") nobody can see why, so the game keeps a tiny black box:
//   * every animation frame that took much longer than it should (> 350 ms) is noted with what the game was doing at that moment (`phase`),
//   * the browser's own "long task" reports (> 300 ms) too,
//   * once per session a snapshot of the device (GPU name, screen, quality tier, memory the scene holds),
// and sends a short JSON report to the server (POST /api/perf, written to the service log as "perf uid=...").  Nothing personal is in it; nothing is sent
// while everything runs smoothly except one small "hello" with the device snapshot per launch.
export function createPerf({ renderer, tier, token }) {
  let phase = 'boot', last = 0, hidden = false, sentHello = false, dirty = false, lastSend = 0;
  const ev = [], marks = [], c = { f: 0, s100: 0, s200: 0, s500: 0, max: 0 };
  // PERF2: the server cuts a report at 4000 characters, so one report is kept < LIM: at most EVN events (the longest ones win), a stall that the browser reports twice
  // (a long task / a slow frame AND a long-animation-frame entry) is kept once - as the loaf entry, which also names the function - and a last trim in send().
  const LIM = 3800, EVN = 14;
  const note = (kind, ms, extra) => {
    ms = Math.round(ms); const at = Math.round(performance.now() / 1000);
    const near = (e) => e.k !== kind && Math.abs(e.ms - ms) <= Math.max(80, ms * 0.15) && Math.abs(e.at - at) <= 3;
    if (kind === 'loaf') { for (let i = ev.length - 1; i >= 0; i--) if ((ev[i].k === 'task' || ev[i].k === 'frame') && near(ev[i])) ev.splice(i, 1); }
    else if (ev.some((e) => e.k === 'loaf' && near(e))) return;
    const e = { k: kind, ms, ph: phase, at, ...extra };
    if (ev.length < EVN) ev.push(e); else { let m = 0; for (let i = 1; i < ev.length; i++) if (ev[i].ms < ev[m].ms) m = i; if (ev[m].ms < ms) ev[m] = e; }
    dirty = true;
  };
  // per phase (home:intro / home / battle:load / battle ...): frames, the mean and the 95th percentile of the frame interval (ms) -> `ph` in every report.  Histogram: 1 ms bins to 50 ms, then 50 ms bins.
  const PH = {};
  const bin = (d) => (d < 50 ? d | 0 : Math.min(63, 50 + (((d - 50) / 50) | 0)));
  const phStat = () => {
    const o = {};
    for (const k of Object.keys(PH)) { const a = PH[k]; if (!a.n) continue; let acc = 0, b = 0; for (; b < 64; b++) { acc += a.h[b]; if (acc >= a.n * 0.95) break; } o[k] = [a.n, +(a.s / a.n).toFixed(1), b < 50 ? b + 1 : 50 + (b - 50) * 50 + 50]; }
    return o;
  };
  const dev = () => {
    const o = { tier, dpr: +(window.devicePixelRatio || 1).toFixed(2), scr: screen.width + 'x' + screen.height, hc: navigator.hardwareConcurrency || 0, mem: navigator.deviceMemory || 0, ua: (navigator.userAgent || '').slice(-96) };
    try { const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info'); if (ext) o.gpu = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)).slice(0, 80); } catch (e) { /* ignore */ }
    try { const sz = renderer.getDrawingBufferSize({ x: 0, y: 0, set(a, b) { this.x = a; this.y = b; return this; } }); o.buf = sz.x + 'x' + sz.y; } catch (e) { /* ignore */ }
    return o;
  };
  const stat = () => {
    const o = { cnt: { ...c } };
    o.ph = phStat();
    try { const i = renderer.info; o.gl = { geo: i.memory.geometries, tex: i.memory.textures, prog: (i.programs || []).length, calls: i.render.calls, tris: i.render.triangles }; } catch (e) { /* ignore */ }
    try { if (performance.memory) o.heapMB = Math.round(performance.memory.usedJSHeapSize / 1048576); } catch (e) { /* ignore */ }
    return o;
  };
  function send(why) {
    const t = typeof token === 'function' ? token() : token; if (!t) return;
    if (sentHello && !dirty) return;
    const body = { v: 1, why, phase, ...(marks.length ? { marks: marks.splice(0) } : {}), ...(sentHello ? {} : { dev: dev() }), ...stat(), ev: ev.splice(0) }; sentHello = true; dirty = false; lastSend = performance.now();
    let txt = JSON.stringify(body);
    while (txt.length > LIM && body.ev.length) { let m = 0; for (let i = 1; i < body.ev.length; i++) if (body.ev[i].ms < body.ev[m].ms) m = i; body.ev.splice(m, 1); txt = JSON.stringify(body); }      // (too long: the shortest stalls go first)
    const lessUseful = (m) => /^(v|u:b):/.test(m[0]);                                                       // (per-unit marks go before the totals and the counts)
    while (txt.length > LIM && body.marks && body.marks.length > 6) { let i = body.marks.findIndex(lessUseful); if (i < 0) i = body.marks.length - 1; body.marks.splice(i, 1); txt = JSON.stringify(body); }
    try { fetch('/api/perf', { method: 'POST', keepalive: true, headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: txt }).catch(() => {}); } catch (e) { /* ignore */ }
  }
  try {
    if (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes && PerformanceObserver.supportedEntryTypes.includes('longtask'))
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.duration > 300) note('task', e.duration); }).observe({ entryTypes: ['longtask'] });
  } catch (e) { /* ignore */ }
  // p39: the browser's "long animation frame" report says WHICH script / call held the main thread (Chrome 123+; absent elsewhere)
  try {
    if (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes && PerformanceObserver.supportedEntryTypes.includes('long-animation-frame'))
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.duration > 400) { const sc = (e.scripts || []).slice().sort((a, b) => b.duration - a.duration)[0]; note('loaf', e.duration, { blk: Math.round(e.blockingDuration || 0), fn: sc ? String(sc.sourceFunctionName || sc.invoker || '').slice(0, 40) : '', sd: sc ? Math.round(sc.duration) : 0 }); } }).observe({ type: 'long-animation-frame', buffered: true });
  } catch (e) { /* ignore */ }
  document.addEventListener('visibilitychange', () => { hidden = document.hidden; if (hidden) send('hide'); else last = 0; });
  return {
    // named durations of the load / compile stages (ms), sent with the next report
    mark(name, ms) { if (marks.length < 60) marks.push([name, Math.round(ms), Math.round(performance.now() / 1000)]); dirty = true; },
    phase(p) { if (p === phase) return; const was = phase; phase = p; if (was.startsWith('battle') && !p.startsWith('battle') && (dirty || !sentHello)) send('leave-battle'); else if (was === 'battle:load' && p === 'battle' && dirty) send('battle-ready'); },     // (the load numbers arrive when the attack is playable, not 45 s later; the server allows 30 reports a minute)
    // call once per animation frame
    frame(now) {
      if (hidden) return;
      if (last) {
        const d = now - last; c.f++;
        if (d < 2000) { const a = PH[phase] || (PH[phase] = { n: 0, s: 0, h: new Uint32Array(64) }); a.n++; a.s += d; a.h[bin(d)]++; }
        if (d > 100) c.s100++; if (d > 200) c.s200++; if (d > 500) c.s500++; if (d > c.max) c.max = Math.round(d);
        if (d > 350 && d < 20000) note('frame', d);
      }
      last = now;
      if (dirty && now - lastSend > 45000) send('tick');
    },
    send,
  };
}
