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

// PF1: adaptive frame cap (60 -> 45 -> 30).  A steady 30 beats a swinging 60 on a hot phone, and a lower pixel ratio does nothing for a frame that is bound by the CPU.
//   gap()      the minimum ms between two drawn frames at the current level (10 = the old 60-90 fps cap, 20 = ~45 fps, 29 = 30 fps).  On a 60 Hz screen 45 can only be 30 (a frame comes every 16.7 ms), on 90 / 120 Hz it is 45 / 40.
//   frame(...) once per drawn frame: `real` = the real time since the previous drawn frame (ms, NOT the clamped dt of the simulation), `work` = the ms this frame spent in JS, `rf` = the display's frame interval.
//              Over 3 s windows: the real frame time above the budget (> 20 ms at the top level) steps DOWN; only after `wait` ms (10 s, doubled when the last step up had to be undone within 40 s, never above 80 s) of headroom
//              (frames on time AND the JS work under 70 % of the next level's budget) does it step UP again.  A stall (tab switch, panel, intro, loading screen) resets the window: it is not a trend.
//   cpuBound   the last window's JS work was >= 80 % of its frame time: lowering the resolution would not help (main.js leaves the pixel ratio alone then).
export function createCap(off) {
  const G = [10, 20, 29], C = { off: !!off, lvl: 0, cpuBound: false, wait: 10000, hold: 0, upAt: -1e9, t: 0, n: 0, js: 0, rf: 16.7, log: [] };
  const exp = (g) => C.rf * Math.ceil(g / C.rf);
  C.gap = () => G[C.lvl];
  C.reset = () => { C.t = C.n = C.js = 0; };
  C.frame = (real, work, rf, now, skip) => {
    if (C.off) return;
    if (rf > 3 && rf < 40) C.rf = rf;
    if (skip || real > 250) { C.reset(); return; }
    C.t += Math.min(real, 3 * exp(G[C.lvl])); C.n++; C.js += work;   // PF4: one hitch (a shader slice, a GC, a resize) counts at most 3 frames: it is not a trend (the idle compile's 60-300 ms slices kept pushing the window average over the line and the step up never came)
    if (C.t < 3000) return;
    const avg = C.t / C.n, js = C.js / C.n; C.cpuBound = js >= 0.8 * avg; C.jsm = js; C.reset();
    if (C.lvl < 2 && avg > Math.max(20, exp(G[C.lvl]) * 1.15)) {
      if (now - C.upAt < 40000) C.wait = Math.min(80000, C.wait * 2);
      C.lvl++; C.hold = 0; if (C.log.length < 12) C.log.push([Math.round(now / 1000), C.lvl, Math.round(avg), Math.round(js)]);
    } else if (C.lvl > 0 && avg <= exp(G[C.lvl]) * 1.1 && js < exp(G[C.lvl - 1]) * 0.92) {   // PF4: was 0.7 = JS under 11.7 ms for 60 fps, which ~600 draw calls never meet on a phone: the step up never happened (the cap sat at 30 for good).  The JS time only says "it cannot fit"; whether it DOES is tried: the next window judges it (step down + doubled wait, above)
      C.hold += 3000;
      if (C.hold >= C.wait) { C.lvl--; C.hold = 0; C.upAt = now; if (C.log.length < 12) C.log.push([Math.round(now / 1000), C.lvl, Math.round(avg), Math.round(js)]); }
    } else C.hold = 0;
  };
  return C;
}

// PF1: matrix skip.  three.js recomputes (compose + multiply, ~2.5 ms and ~2 MB of garbage per frame on this scene) the local and world matrix of EVERY auto-updating object each frame, 4,900 of them, while
// ~80 % never move.  This keeps the numbers each object was last composed from (position, quaternion, scale, parent) and, when all ten are bit-identical, skips the compose AND leaves `matrixWorldNeedsUpdate`
// alone, so neither the local nor the world matrix is recomputed (a moved ancestor still forces its whole subtree: updateMatrixWorld passes `force` down, untouched).  The result is bit-for-bit the matrix the old code
// produced, so nothing on screen changes.  `?nomskip=1` switches it off (A/B on a phone with BW_bench); window.__pf.mskip.check() proves the invariant on the live scene.
export function installMatrixSkip(THREE, on = true) {
  const P = THREE.Object3D.prototype, orig = P.updateMatrix, S = { on, skip: 0, run: 0 };
  P.updateMatrix = function () {
    const c = this._pq;
    if (c !== undefined && S.on && this._pp === this.parent && this.pivot === null) {
      const p = this.position, q = this.quaternion, s = this.scale;
      if (c[0] === p.x && c[1] === p.y && c[2] === p.z && c[3] === q._x && c[4] === q._y && c[5] === q._z && c[6] === q._w && c[7] === s.x && c[8] === s.y && c[9] === s.z) { S.skip++; return; }
    }
    S.run++; orig.call(this);
    if (this.pivot === null) {
      const p = this.position, q = this.quaternion, s = this.scale;
      if (c === undefined) this._pq = new Float64Array([p.x, p.y, p.z, q._x, q._y, q._z, q._w, s.x, s.y, s.z]);
      else { c[0] = p.x; c[1] = p.y; c[2] = p.z; c[3] = q._x; c[4] = q._y; c[5] = q._z; c[6] = q._w; c[7] = s.x; c[8] = s.y; c[9] = s.z; }
      this._pp = this.parent;
    }
  };
  // Two things vanilla gets for free because updateMatrix() ALWAYS raised matrixWorldNeedsUpdate, and the skip must give back:
  //  (1) r186 updateWorldMatrix() (getWorldPosition, lookAt, attach, ...) refreshes the ANCESTORS of a node and clears their flag without touching their other children.  Raise the flag before (so a skipped
  //      updateMatrix cannot leave a stale world behind) and again after (so the next scene.updateMatrixWorld() redoes this node and forces its children, as it always did).
  //  (2) a node taken out and put back under the SAME parent while that parent moved: its cached matrices are dropped on remove(), so the next update recomputes it.
  const ouw = P.updateWorldMatrix, orm = P.remove;
  P.updateWorldMatrix = function (up, uc, force) { if (S.on && this.matrixAutoUpdate) this.matrixWorldNeedsUpdate = true; ouw.call(this, up, uc, force); if (S.on && this.matrixAutoUpdate) this.matrixWorldNeedsUpdate = true; };
  P.remove = function (...objs) { for (let i = 0; i < objs.length; i++) if (objs[i]) objs[i]._pq = undefined; return orm.apply(this, objs); };
  P._pq = undefined; P._pp = null;
  return S;
}

// PF2 (F2): is the night render path (the bloom composer: +82..90 shader programs) needed soon?  One real hour is one game day (tod.js DAY_MAP); `night > 0.25` (the switch to the bloom path) starts at game hour
// 18.0, and game hour 16.7 is ≈ 4 real minutes before that (dev/pf2/unit.mjs measures it from tod.js).  Dawn: night < 0.25 again at ≈ 6.1.  Before this hour the path is not built (a day-only session never pays for it),
// after it the idle compile (main.js bgCompile: ≤ 25 % busy, ≈ 60-110 s) has time to finish before the first night frame; if it has not, useComposer() stays on the plain path until it has (no hitch, just no bloom yet).
export const nightPathWanted = (h) => h >= 16.7 || h < 6.5;
