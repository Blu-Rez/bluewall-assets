// pf_probe.js — PF1: the performance probe and the owner's phone benchmark.
//  (1) with `?pf=1` in the page address: window.__pf = a per-frame recorder (CPU ms per frame, per game system through prof.js, renderer calls / triangles / shadow-pass calls / fill-screen passes, heap growth = allocation + GC),
//      a scene census (what a frame is made of, by group) and a texture / geometry / render-target memory report.  Without `?pf=1` nothing in here runs (createProbe returns at the first line).
//  (2) for the owner (opts.owner / dev): window.BW_bench.run() = a 30 s scripted run (10 s map orbit, 10 s hero walk, 10 s idle) that measures what the phone really does and POSTs ONE short report to /api/perf.
// Software GL (the headless test browser) measures the CPU side and the call counts, NOT the phone GPU: calls / triangles / shadow calls / pixels are the GPU proxies.  The recorder allocates nothing per frame.
import * as THREE from 'three';
import { PROF } from './prof.js';

const NF = 8192;                                              // frames kept per recording (≈ 2 min at 60 fps)
const sortedCopy = (a, n) => Array.from(a.subarray(0, n)).sort((x, y) => x - y);
const pc = (s, p) => (s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0);
const r1 = (v) => Math.round(v * 10) / 10, r2 = (v) => Math.round(v * 100) / 100;

function makeRecorder(ctx) {
  const R = ctx.renderer, SM = R.shadowMap, raf0 = window.requestAnimationFrame.bind(window);
  const A = { js: 0, rn: 0, sh: 0, calls: 0, shc: 0, tris: 0, fsq: 0, rc: 0 };                          // the frame being built
  const F = { n: 0, on: false, t: new Float64Array(NF), js: new Float32Array(NF), rn: new Float32Array(NF), sh: new Float32Array(NF), calls: new Uint16Array(NF), shc: new Uint16Array(NF),
    tris: new Uint32Array(NF), fsq: new Uint8Array(NF), rc: new Uint8Array(NF), heap: new Float32Array(NF), pr: new Float32Array(NF), dyn: new Float32Array(NF), gov: new Uint8Array(NF) };
  let profWas = false, tick = -1, keys = [], ps = Object.create(null), pn = 0, kAt = 0, t0 = 0, lt = [], loaf = [];
  const hasMem = !!(performance && performance.memory);
  const heroScene = () => { const h = ctx.getHero && ctx.getHero(); return h && h.scene; };
  const flush = () => {
    if (F.on && A.rn > 0 && F.n < NF) {
      const i = F.n++;
      F.t[i] = tick; F.js[i] = A.js; F.rn[i] = A.rn; F.sh[i] = A.sh; F.calls[i] = A.calls > 65535 ? 65535 : A.calls; F.shc[i] = A.shc; F.tris[i] = A.tris; F.fsq[i] = A.fsq; F.rc[i] = A.rc;
      F.heap[i] = hasMem ? performance.memory.usedJSHeapSize / 1048576 : 0; F.pr[i] = R.getPixelRatio(); F.dyn[i] = ctx.DYN ? ctx.DYN.s : 1; F.gov[i] = ctx.GOV ? ctx.GOV.lvl : 0;
      if (i - kAt > 90 || !keys.length) { keys = Object.keys(PROF.avg); kAt = i; }
      for (let k = 0; k < keys.length; k++) ps[keys[k]] = (ps[keys[k]] || 0) + PROF.avg[keys[k]]; pn++;
    }
    A.js = A.rn = A.sh = 0; A.calls = A.shc = A.tris = A.fsq = A.rc = 0;
  };
  // --- hooks (installed once, at the first start(): a player who never records never gets them; while a recording runs each costs two performance.now() calls, otherwise one boolean test)
  let done = false;
  function install() {
  if (done) return; done = true;
  const rn0 = R.render.bind(R);
  R.render = function (s, c) {
    if (!F.on) return rn0(s, c);
    const I = R.info, c0 = I.autoReset ? 0 : I.render.calls, g0 = I.autoReset ? 0 : I.render.triangles, a = performance.now();
    rn0(s, c); A.rc++; A.rn += performance.now() - a; A.calls += I.render.calls - c0; A.tris += I.render.triangles - g0;
    if (s !== ctx.scene && s !== heroScene()) A.fsq++;                                       // (a post-processing quad: one more full-screen pass)
  };
  const sh0 = SM.render;
  if (typeof sh0 === 'function') SM.render = function (l, s, c) {
    if (!F.on) return sh0.call(SM, l, s, c);
    const I = R.info, c0 = I.render.calls, a = performance.now();
    sh0.call(SM, l, s, c); A.sh += performance.now() - a; A.shc += I.render.calls - c0;
  };
  window.requestAnimationFrame = (cb) => raf0((t) => {
    if (F.on && t !== tick) { flush(); tick = t; } else if (!F.on) tick = t;
    const a = performance.now();
    try { cb(t); } finally { A.js += performance.now() - a; }
  });
  try {
    if (window.PerformanceObserver && PerformanceObserver.supportedEntryTypes) {
      if (PerformanceObserver.supportedEntryTypes.includes('longtask')) new PerformanceObserver((l) => { if (F.on) for (const e of l.getEntries()) lt.push(Math.round(e.duration)); }).observe({ entryTypes: ['longtask'] });
      if (PerformanceObserver.supportedEntryTypes.includes('long-animation-frame')) new PerformanceObserver((l) => {
        if (!F.on) return;
        for (const e of l.getEntries()) { const sc = (e.scripts || []).slice().sort((x, y) => y.duration - x.duration)[0]; loaf.push({ ms: Math.round(e.duration), fn: sc ? String(sc.sourceFunctionName || sc.invoker || '').slice(0, 48) : '', src: sc ? String(sc.sourceURL || '').split('/').pop().slice(0, 32) : '' }); }
      }).observe({ type: 'long-animation-frame', buffered: false });
    }
  } catch (e) { /* not available */ }
  }

  function start() { install(); flush(); F.n = 0; ps = Object.create(null); pn = 0; lt = []; loaf = []; A.js = A.rn = A.sh = 0; A.calls = A.shc = A.tris = A.fsq = A.rc = 0; t0 = performance.now(); profWas = PROF.on; PROF.on = true; F.on = true; }
  function summary(a, b) {                                                                   // (everything is over the DRAWN frames a..b; the interval is draw to draw, what the player sees)
    a = a || 0; if (b == null) b = F.n; const n = b - a, o = { n, secs: n > 1 ? r1((F.t[b - 1] - F.t[a]) / 1000) : 0 };
    if (n < 3) return o;
    const dt = new Float32Array(n - 1); for (let i = 1; i < n; i++) dt[i - 1] = F.t[a + i] - F.t[a + i - 1];
    const sd = sortedCopy(dt, n - 1), span = (F.t[b - 1] - F.t[a]) / 1000;
    let o33 = 0, o50 = 0, s = 0; for (let i = 0; i < n - 1; i++) { if (dt[i] > 34) o33++; if (dt[i] > 50) o50++; s += dt[i]; }
    o.fps = r1((n - 1) / span); o.avg = r1(s / (n - 1)); o.p50 = r1(pc(sd, 0.5)); o.p95 = r1(pc(sd, 0.95)); o.p99 = r1(pc(sd, 0.99)); o.max = r1(sd[sd.length - 1]); o.o33 = o33; o.o50 = o50;
    const mean = (x) => { let v = 0; for (let i = a; i < b; i++) v += x[i]; return v / n; };
    const sj = sortedCopy(F.js.subarray(a, b), n);
    o.js = r2(mean(F.js)); o.jsP95 = r2(pc(sj, 0.95)); o.render = r2(mean(F.rn)); o.shadow = r2(mean(F.sh)); o.calls = Math.round(mean(F.calls)); o.shCalls = Math.round(mean(F.shc)); o.tris = Math.round(mean(F.tris));
    o.fsq = r1(mean(F.fsq)); o.renders = r1(mean(F.rc)); let pmin = 9, pmax = 0, prc = 0, dc = 0, gc2 = 0; for (let i = a; i < b; i++) { const v = F.pr[i]; if (v < pmin) pmin = v; if (v > pmax) pmax = v; if (i > a) { if (Math.abs(v - F.pr[i - 1]) > 0.001) prc++; if (F.dyn[i] !== F.dyn[i - 1]) dc++; if (F.gov[i] !== F.gov[i - 1]) gc2++; } }
    o.pr = [r2(pmin), r2(pmax)]; o.prChanges = prc; o.dynChanges = dc; o.govChanges = gc2;
    let up = 0, gc = 0, big = 0; for (let i = a + 1; i < b; i++) { const d = F.heap[i] - F.heap[i - 1]; if (d > 0) up += d; else if (d < -0.3) { gc++; big = Math.max(big, -d); } }
    o.allocMBs = hasMem ? r2(up / span) : null; o.gc = hasMem ? gc : null; o.gcMaxMB = hasMem ? r1(big) : null; o.heapMB = hasMem ? r1(F.heap[b - 1]) : null;
    if (a === 0 && b === F.n) { const pr = {}; if (pn) for (const k of Object.keys(ps)) pr[k] = r2(ps[k] / pn); o.prof = pr; o.longTasks = lt.length; o.longTaskMs = lt.reduce((x, y) => x + y, 0); o.loaf = loaf.sort((x, y) => y.ms - x.ms).slice(0, 6); }
    return o;
  }
  function fpsAt(from, to) {                                                                  // fps over the time window [from, to) seconds since the first frame of the recording
    let n = 0, f = -1, l = -1; const t0 = F.t[0]; for (let i = 0; i < F.n; i++) { const t = (F.t[i] - t0) / 1000; if (t >= from && t < to) { n++; if (f < 0) f = F.t[i]; l = F.t[i]; } }
    return n > 2 ? r1((n - 1) / ((l - f) / 1000)) : 0;
  }
  function stop() { flush(); F.on = false; PROF.on = profWas; return summary(); }
  return { start, stop, summary, fpsAt, idx: () => F.n, raf: raf0, F, get on() { return F.on; } };
}

// ---------------------------------------------------------------- scene census: what one frame is made of (draw calls / triangles per group, frustum-culled by the current camera)
function census(ctx) {
  const cam = ctx.camera; cam.updateMatrixWorld(); const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
  const h = ctx.getHero && ctx.getHero(), root = h && h.active && h.scene && h.scene !== ctx.scene ? h.scene : ctx.scene;
  const top = Object.create(null), deep = Object.create(null); let allC = 0, allT = 0, castC = 0;
  const one = (o) => {
    const g = o.geometry; if (!g || !g.attributes || !g.attributes.position) return null;
    const m = o.material, nm = Array.isArray(m) ? Math.max(1, g.groups.length) : 1;
    const pos = g.attributes.position.count, tri = (g.index ? g.index.count : pos) / 3 * (o.isInstancedMesh ? o.count : 1);
    if (o.isInstancedMesh && o.count === 0) return null;
    return { c: nm, t: o.isPoints ? 0 : tri };
  };
  const walk = (o, tk, dk, d) => {
    if (!o.visible) return;
    if ((o.isMesh || o.isPoints || o.isLine || o.isSprite) && (o.frustumCulled === false || o.isSprite || fr.intersectsObject(o))) {
      const r = o.isSprite ? { c: 1, t: 2 } : one(o);
      if (r) {
        const a = top[tk] || (top[tk] = { c: 0, t: 0, cast: 0, objs: 0 }), b = deep[dk] || (deep[dk] = { c: 0, t: 0, cast: 0, objs: 0 });
        a.c += r.c; a.t += r.t; a.objs++; b.c += r.c; b.t += r.t; b.objs++; allC += r.c; allT += r.t; if (o.castShadow) { a.cast += r.c; b.cast += r.c; castC += r.c; }
      }
    }
    const ch = o.children; for (let i = 0; i < ch.length; i++) { const c = ch[i]; walk(c, tk, d === 0 ? tk + '/' + (c.name || c.type) : dk, d + 1); }
  };
  const ch = root.children;
  for (let i = 0; i < ch.length; i++) { const c = ch[i], k = c.name || c.type + '#' + i; walk(c, k, k, 0); }
  const rank = (m, n) => Object.entries(m).sort((a, b) => b[1].c - a[1].c).slice(0, n).map(([k, v]) => ({ k, calls: v.c, tris: Math.round(v.t), cast: v.cast, objs: v.objs }));
  return { calls: allC, tris: Math.round(allT), castCalls: castC, top: rank(top, 40), deep: rank(deep, 60), children: root.children.length };
}


// ---------------------------------------------------------------- scene scan: object counts and the cost of one world-matrix pass (renderer.render does one per call unless scene.matrixWorldAutoUpdate is off)
function scan(ctx) {
  const h = ctx.getHero && ctx.getHero(), root = h && h.active && h.scene && h.scene !== ctx.scene ? h.scene : ctx.scene, o = { objects: 0, visible: 0, autoMatrix: 0, meshes: 0, skinned: 0, instanced: 0, instCount: 0, lights: 0, castShadow: 0, sprites: 0, points: 0, frustumCullOff: 0, depth: 0 };
  const walk = (x, d) => { o.objects++; if (d > o.depth) o.depth = d; if (x.visible) o.visible++; if (x.matrixAutoUpdate) o.autoMatrix++; if (x.isMesh) o.meshes++; if (x.isSkinnedMesh) o.skinned++; if (x.isInstancedMesh) { o.instanced++; o.instCount += x.count; } if (x.isLight) o.lights++; if (x.castShadow) o.castShadow++; if (x.isSprite) o.sprites++; if (x.isPoints) o.points++; if ((x.isMesh || x.isPoints) && x.frustumCulled === false) o.frustumCullOff++; const c = x.children; for (let i = 0; i < c.length; i++) walk(c[i], d + 1); };
  walk(root, 0);
  const t = (f, n) => { const a = performance.now(); for (let i = 0; i < n; i++) f(); return r2((performance.now() - a) / n); };
  o.matrixPassMs = t(() => root.updateMatrixWorld(), 10); o.matrixPassForcedMs = t(() => root.updateMatrixWorld(true), 5); o.autoUpdateFlag = root.matrixWorldAutoUpdate;
  return o;
}

// ---------------------------------------------------------------- memory: textures (w × h × 4 × 1.33 MB), geometries, shadow maps and post-processing targets
function memReport(ctx, nTop) {
  const texs = new Map(), geos = new Map(), seen = new Set();
  const h = ctx.getHero && ctx.getHero(), roots = [ctx.scene]; if (h && h.scene && h.scene !== ctx.scene) roots.push(h.scene);
  const tb = (t) => {
    const im = t.image; if (!im) return 0;
    if (t.isCompressedTexture && t.mipmaps && t.mipmaps.length) { let b = 0; for (const m of t.mipmaps) b += m.data ? m.data.byteLength : 0; return b; }
    const f = Array.isArray(im) ? im[0] : im; if (!f) return 0; const w = f.width || f.videoWidth || (f.data && f.data.width) || 0, hh = f.height || f.videoHeight || (f.data && f.data.height) || 0;
    const faces = t.isCubeTexture ? 6 : 1, d = t.isData3DTexture || t.isDataArrayTexture ? (im.depth || 1) : 1;
    const bpp = t.type === THREE.FloatType ? 16 : t.type === THREE.HalfFloatType ? 8 : (t.format === THREE.RedFormat || t.format === THREE.AlphaFormat || t.format === THREE.LuminanceFormat) ? 1 : 4;
    const mip = t.generateMipmaps && t.minFilter !== THREE.NearestFilter && t.minFilter !== THREE.LinearFilter ? 1.33 : 1;
    return w * hh * bpp * faces * d * mip;
  };
  const addTex = (t, mat, mesh, path) => {
    if (!t || !t.isTexture || !t.image) return; let e = texs.get(t.uuid);
    if (!e) { const im = Array.isArray(t.image) ? t.image[0] : t.image, src = im && typeof im.src === 'string' ? im.src.split('/').slice(-3).join('/').slice(0, 70) : ''; e = { name: String(t.name || '').slice(0, 40), w: (im && (im.width || im.videoWidth)) || 0, h: (im && (im.height || im.videoHeight)) || 0, mb: tb(t) / 1048576, src, type: (im && im.constructor && im.constructor.name) || '', users: 0, mat: String((mat && mat.name) || '').slice(0, 30), path: path.slice(0, 80) }; texs.set(t.uuid, e); }
    e.users++;
  };
  const addGeo = (g, o, path) => {
    if (!g || geos.has(g.uuid)) return; let b = 0; for (const k in g.attributes) { const a = g.attributes[k]; b += a.array ? a.array.byteLength : 0; } if (g.index) b += g.index.array.byteLength;
    if (o.isInstancedMesh && o.instanceMatrix) b += o.instanceMatrix.array.byteLength; geos.set(g.uuid, { name: String(g.name || o.name || '').slice(0, 40), mb: b / 1048576, verts: g.attributes.position ? g.attributes.position.count : 0, path: path.slice(0, 80) });
  };
  const path = (o) => { const p = []; for (let x = o; x && p.length < 3; x = x.parent) p.push(x.name || x.type); return p.reverse().join('/'); };
  const walk = (o) => {
    if (o.material || o.geometry) {
      const ms = Array.isArray(o.material) ? o.material : [o.material], pth = path(o);
      for (const m of ms) { if (!m || seen.has(m.uuid + pth)) continue; seen.add(m.uuid + pth); for (const k in m) { const v = m[k]; if (v && v.isTexture) addTex(v, m, o, pth); } if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k] && m.uniforms[k].value; if (v && v.isTexture) addTex(v, m, o, pth); } }
      if (o.geometry) addGeo(o.geometry, o, pth);
    }
    if (o.isLight && o.shadow && o.shadow.map) shadows.push({ name: o.name || o.type, w: o.shadow.map.width, h: o.shadow.map.height });
    const ch = o.children; for (let i = 0; i < ch.length; i++) walk(ch[i]);
  };
  const shadows = []; for (const r of roots) { walk(r); if (r.environment) addTex(r.environment, null, null, 'scene.environment'); if (r.background && r.background.isTexture) addTex(r.background, null, null, 'scene.background'); }
  const tl = [...texs.values()].sort((a, b) => b.mb - a.mb), gl = [...geos.values()].sort((a, b) => b.mb - a.mb);
  const sum = (a) => a.reduce((x, y) => x + y.mb, 0);
  const rt = []; const comp = ctx.getComposer && ctx.getComposer(), bl = ctx.getBloom && ctx.getBloom();
  if (comp) { for (const t of [comp.renderTarget1, comp.renderTarget2]) if (t) rt.push({ name: 'composer', w: t.width, h: t.height, mb: t.width * t.height * 8 * ((t.samples || 0) > 0 ? 2 : 1) / 1048576 }); }
  if (bl) { for (const t of [bl.renderTargetBright, ...(bl.renderTargetsHorizontal || []), ...(bl.renderTargetsVertical || [])]) if (t) rt.push({ name: 'bloom', w: t.width, h: t.height, mb: t.width * t.height * 8 / 1048576 }); }
  for (const s of shadows) rt.push({ name: 'shadow:' + s.name, w: s.w, h: s.h, mb: s.w * s.h * 8 / 1048576 });
  const bufSz = ctx.renderer.getDrawingBufferSize(new THREE.Vector2());
  rt.push({ name: 'canvas (color+depth)', w: bufSz.x, h: bufSz.y, mb: bufSz.x * bufSz.y * 8 / 1048576 });
  const I = ctx.renderer.info.memory;
  const big = (e) => ({ w: e.w, h: e.h, mb: r1(e.mb), users: e.users, name: e.name, src: e.src, type: e.type, mat: e.mat, path: e.path });
  return { gl: { geometries: I.geometries, textures: I.textures }, texCount: tl.length, texMB: r1(sum(tl)), texTop: tl.slice(0, nTop || 15).map(big), over1024: tl.filter((e) => Math.max(e.w, e.h) > 1024).length, over2048: tl.filter((e) => Math.max(e.w, e.h) > 2048).length,
    geoCount: gl.length, geoMB: r1(sum(gl)), geoTop: gl.slice(0, 10).map((e) => ({ name: e.name, mb: r2(e.mb), verts: e.verts, path: e.path })), rtMB: r1(sum(rt)), rt: rt.map((e) => ({ name: e.name, w: e.w, h: e.h, mb: r1(e.mb) })) };
}

// the invariant the matrix skip (perf.js) must keep: every auto-updating object's local matrix == compose(position, quaternion, scale) and its world matrix == parent world x local.  Run it on the live scene (after a frame).
function matrixCheck(ctx) {
  const h = ctx.getHero && ctx.getHero(), roots = [ctx.scene]; if (h && h.active && h.scene && h.scene !== ctx.scene) roots.push(h.scene);
  const a = new THREE.Matrix4(), b = new THREE.Matrix4(); let n = 0, badL = 0, badW = 0, worst = 0, nFrozen = 0, badFrozen = 0; const ex = [];
  const diff = (x, y) => { let d = 0; for (let i = 0; i < 16; i++) { const e = Math.abs(x[i] - y[i]) / (1 + Math.abs(y[i])); if (e > d) d = e; } return d; };
  const OWN = Object.prototype.hasOwnProperty;
  // RP1C-R2 cull.js freezes the children of a hidden node on purpose (an own-property no-op updateMatrixWorld; thawed, with a forced world update, before the world shows the node again): everything under such a node is
  // counted apart (nFrozen / badFrozen), the invariant is asserted for all the rest
  const walk = (o, frozen) => {
    if (OWN.call(o, 'updateMatrixWorld')) frozen = true;
    if (o.matrixAutoUpdate) {
      if (frozen) { nFrozen++; } else {
        n++;
        if (o.pivot === null) { a.compose(o.position, o.quaternion, o.scale); const d = diff(o.matrix.elements, a.elements); if (d > 1e-9) { badL++; if (d > worst) worst = d; if (ex.length < 4) ex.push([o.name || o.type, 'L', +d.toExponential(1)]); } }
        if (o.matrixWorldAutoUpdate) { if (o.parent) b.multiplyMatrices(o.parent.matrixWorld, o.matrix); else b.copy(o.matrix); const d = diff(o.matrixWorld.elements, b.elements); if (d > 1e-6) { badW++; if (d > worst) worst = d; if (ex.length < 4) ex.push([o.name || o.type, 'W', +d.toExponential(1)]); } }
      }
    }
    const ch = o.children; for (let i = 0; i < ch.length; i++) walk(ch[i], frozen);
  };
  for (const r of roots) walk(r, false);
  const S = ctx.MSKIP || {};
  return { objs: n, frozen: nFrozen, badLocal: badL, badWorld: badW, worst: +worst.toExponential(1), ex, on: !!S.on, skip: S.skip || 0, run: S.run || 0 };
}

function deviceSnap(ctx) {
  const o = { ua: (navigator.userAgent || '').slice(0, 150), hc: navigator.hardwareConcurrency || 0, mem: navigator.deviceMemory || 0, scr: screen.width + 'x' + screen.height, dpr: r2(window.devicePixelRatio || 1), tier: ctx.Q.level };
  try { const gl = ctx.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info'); if (ext) o.gpu = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)).slice(0, 70); } catch (e) { /* ignore */ }
  try { const z = ctx.renderer.getDrawingBufferSize(new THREE.Vector2()); o.buf = z.x + 'x' + z.y; } catch (e) { /* ignore */ }
  return o;
}

// ---------------------------------------------------------------- the owner's benchmark: one continuous recording, three phases (map orbit, hero walk, idle), ONE small POST
function makeBench(ctx, rec) {
  let busy = false, card = null;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const poke = () => { try { window.dispatchEvent(new Event('pointermove')); } catch (e) { /* ignore */ } };           // (the game drops to 30 fps after 3.5 s without a touch: a playing hand keeps it at full rate)
  const show = (lines, ok) => {
    if (!card) { card = document.createElement('div'); card.style.cssText = 'position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:99999;font:600 13px/1.45 ui-monospace,Menlo,Consolas,monospace;color:#eaf6ff;background:rgba(0,12,32,.92);border:1px solid #5fa8ff;border-radius:10px;padding:10px 14px;max-width:88vw;text-align:center;white-space:pre-line'; card.addEventListener('pointerdown', () => { if (!busy) card.style.display = 'none'; }); document.body.appendChild(card); }
    card.style.display = 'block'; card.style.borderColor = ok === false ? '#ff7a7a' : '#5fa8ff'; card.textContent = lines;
  };
  const phase = async (name, secs, step) => { const a = rec.idx(), t0 = performance.now(); let last = t0; while (performance.now() - t0 < secs * 1000) { await sleep(16); const n = performance.now(); step && step((n - last) / 1000, (n - t0) / 1000); last = n; } const s = rec.summary(a, rec.idx()); s.name = name; s.a = a; s.b = rec.idx(); return s; };
  const brief = (s) => s && s.fps != null ? { n: s.n, fps: s.fps, avg: s.avg, p50: s.p50, p95: s.p95, p99: s.p99, max: s.max, o33: s.o33, o50: s.o50, js: s.js, calls: s.calls, tris: Math.round(s.tris / 1000), pr: s.pr } : null;
  async function run(opt) {
    opt = opt || {}; if (busy) return null;
    const ui = ctx.ui, bt = ctx.getBattle && ctx.getBattle(), ctl = ctx.ctl;
    if (bt && bt.active) { show('BENCH: leave the attack first', false); return null; }
    if (ui && ui.root && ui.root.classList.contains('wel')) { show('BENCH: close the welcome card first', false); return null; }
    if (document.querySelector('.bwa.on,.bws.on,.bwu.on,.bwk.on,.bwh.on,.bw-set.on')) { show('BENCH: close the open panel first', false); return null; }       // (a panel behind caps the game at ~16 fps on purpose)
    busy = true; show('BENCH running… 30 s — keep your hand off the screen', true);
    const keep = { azim: ctl.azim, dist: ctl.dist, polar: ctl.polar, tx: ctl.target.x, tz: ctl.target.z }, sec = opt.secs || 10, ph = {}, t00 = performance.now(), errs = [];
    let hero = ctx.getHero && ctx.getHero(), startedHero = false, ip = 0;
    const MS = ctx.MSKIP || { skip: 0, run: 0, on: false }, ms0 = [MS.skip, MS.run];
    rec.start();
    try {
      if (ctl._skipIntro) ctl._skipIntro();
      ip = setInterval(poke, 700);
      // 1) strategic map: a slow orbit round the castle
      ph.map = await phase('map', sec, (dt) => { ctl.azim += 0.35 * dt; });
      // 2) hero walk (owner builds: the hero module is fetched now if it is not loaded yet)
      ph.hero = null;
      try {
        if (!hero && ctx.PFH && ctx.PFH.make) hero = await ctx.PFH.make();
        if (hero && !hero.active && hero.start) { let key = 'elina'; try { key = localStorage.getItem('bw_rpg_hero') || key; } catch (e) { /* storage blocked */ } await hero.start(key); startedHero = true; await sleep(1200); }
        if (hero && hero.active && hero.dev && hero.dev.setInput) {
          let yaw = 0; ph.hero = await phase('hero', sec, (dt, t) => { yaw += 0.5 * dt; hero.dev.setLook && hero.dev.setLook(yaw, 0.25); hero.dev.setInput(0, 0.8); hero.dev.sprint && hero.dev.sprint(t > 3 && ((t | 0) % 4 === 0)); });
          hero.dev.setInput(0, 0);
        }
      } catch (e) { errs.push('hero:' + String(e && e.message || e).slice(0, 60)); }
      if (hero && hero.active && startedHero) { try { hero.exit(); } catch (e) { /* ignore */ } await sleep(1000); }
      clearInterval(ip); ip = 0;
      // 3) idle: no touch at all (the game goes to its 30 fps eco rate after 3.5 s)
      ph.idle = await phase('idle', sec, null);
    } catch (e) { errs.push(String(e && e.message || e).slice(0, 80)); } finally { if (ip) clearInterval(ip); }
    const whole = rec.summary(0, rec.idx()); rec.stop(); let mchk = null; try { const m = matrixCheck(ctx); mchk = { on: m.on, objs: m.objs, bad: m.badLocal + m.badWorld, sk: MS.skip - ms0[0], run: MS.run - ms0[1] }; } catch (e) { /* ignore */ }
    ctl.azim = keep.azim; ctl.dist = keep.dist; ctl.polar = keep.polar; ctl.target.x = keep.tx; ctl.target.z = keep.tz;
    // thermal drift: the first 5 s against the last 5 s of the MAP phase (same mode, same load), and of the whole run (its last 5 s are the idle eco rate on purpose)
    const t0 = rec.F.t[0], mEnd = ph.map ? (rec.F.t[ph.map.b - 1] - t0) / 1000 : 0, tEnd = (rec.F.t[Math.max(0, rec.idx() - 1)] - t0) / 1000;
    const drift = { map5: [rec.fpsAt(0, 5), rec.fpsAt(Math.max(0, mEnd - 5), mEnd + 0.01)], run5: [rec.fpsAt(0, 5), rec.fpsAt(Math.max(0, tEnd - 5), tEnd + 0.01)] };
    const active = [ph.map, ph.hero].filter((p) => p && p.fps != null);
    const res = { bench: 1, v: 1, secs: r1((performance.now() - t00) / 1000), dev: deviceSnap(ctx), ph: { map: brief(ph.map), hero: brief(ph.hero), idle: brief(ph.idle) },
      all: { fps: whole.fps, avg: whole.avg, p50: whole.p50, p95: whole.p95, p99: whole.p99, worst: whole.max, o33: whole.o33, o50: whole.o50 }, act: active.length ? { fps: r1(active.reduce((a, p) => a + p.fps * p.n, 0) / active.reduce((a, p) => a + p.n, 0)), p95: r1(Math.max(...active.map((p) => p.p95))) } : null,
      drift, q: { preset: ctx.Q.level, dyn: ctx.DYN ? r2(ctx.DYN.s) : 1, gov: ctx.GOV ? ctx.GOV.lvl : 0, dprNow: r2(ctx.renderer.getPixelRatio()), pr: whole.pr, prCh: whole.prChanges, dynCh: whole.dynChanges, govCh: whole.govChanges, sh: ctx.renderer.shadowMap.enabled ? 1 : 0, bloom: ctx.getComposer && ctx.getComposer() ? 1 : 0 },
      mskip: mchk, gl: { calls: whole.calls, trisK: Math.round((whole.tris || 0) / 1000), geo: ctx.renderer.info.memory.geometries, tex: ctx.renderer.info.memory.textures, prog: (ctx.renderer.info.programs || []).length }, err: errs.length ? errs : undefined };
    if (ph.hero == null) res.hero = 'skipped';
    let posted = false, txt = JSON.stringify(res);
    if (txt.length > 3400 && res.dev) { res.dev.ua = String(res.dev.ua).slice(0, 50); txt = JSON.stringify(res); }
    try { const tk = typeof ctx.token === 'function' ? ctx.token() : ctx.token; if (tk && txt.length < 3500) { const r = await fetch('/api/perf', { method: 'POST', keepalive: true, headers: { Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' }, body: txt }); posted = r.ok; } } catch (e) { /* offline */ }
    res.posted = posted; res.bytes = txt.length; res.text = `BENCH ${whole.fps} fps avg · p95 ${whole.p95} ms · worst ${whole.max} ms`;
    busy = false;
    const pf = (p, none) => (p && p.fps != null ? p.fps : none);   // (a phase with too few frames has no fps: never print 'undefined' on the card)
    show(res.text + `\nmap ${pf(ph.map, '-')} · hero ${ph.hero == null ? 'n/a' : pf(ph.hero, '-')} · idle ${pf(ph.idle, '-')} fps · q ${ctx.Q.level} · ${res.q.dprNow}x` + `\n>33ms ${whole.o33} · >50ms ${whole.o50} · drift ${drift.map5[0] || '-'}→${drift.map5[1] || '-'} · ${posted ? 'sent' : 'not sent'}`, true);
    window.__benchLast = res; return res;
  }
  return { run, get busy() { return busy; } };
}

export function createProbe(ctx) {
  const on = /[?&]pf=1(?:&|$)/.test(location.search);
  if (!on && !ctx.owner) return null;                                                        // (a normal player: not even a hook is installed)
  const rec = makeRecorder(ctx); if (on) rec.start(), rec.stop();                            // (?pf=1: the hooks are in from the first frame)
  const api = { cap: ctx.CAP, mskip: { check: () => matrixCheck(ctx), stats: () => ctx.MSKIP, set on(v) { if (ctx.MSKIP) ctx.MSKIP.on = !!v; }, get on() { return !!(ctx.MSKIP && ctx.MSKIP.on); } }, rec, start: rec.start, stop: rec.stop, census: () => census(ctx), scan: () => scan(ctx), mem: (n) => memReport(ctx, n), device: () => deviceSnap(ctx), info: () => { const I = ctx.renderer.info; return { calls: I.render.calls, tris: I.render.triangles, geo: I.memory.geometries, tex: I.memory.textures, prog: (I.programs || []).length }; } };
  if (ctx.owner) { const b = makeBench(ctx, rec); window.BW_bench = { run: b.run, get busy() { return b.busy; } }; }
  if (on) window.__pf = api;
  return api;
}
