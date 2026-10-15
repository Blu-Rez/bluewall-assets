// pf_probe.js — PF1: the performance probe and the owner's phone benchmark.
//  (1) with `?pf=1` in the page address: window.__pf = a per-frame recorder (CPU ms per frame, per game system through prof.js, renderer calls / triangles / shadow-pass calls / fill-screen passes, heap growth = allocation + GC),
//      a scene census (what a frame is made of, by group) and a texture / geometry / render-target memory report.  Without `?pf=1` nothing in here runs (createProbe returns at the first line).
//  (2) for the owner (opts.owner / dev): window.BW_bench.run() = a 30 s scripted run (10 s map orbit, 10 s hero walk, 10 s idle) that measures what the phone really does and POSTs ONE short report to /api/perf.
// Software GL (the headless test browser) measures the CPU side and the call counts, NOT the phone GPU: calls / triangles / shadow calls / pixels are the GPU proxies.  The recorder allocates nothing per frame.
import * as THREE from 'three';
import { PROF } from './prof.js';

const NF = 8192;
const STALL = 2000;                                           // PF2: a gap between two drawn frames above this (ms) is a STALL (tab hidden / frozen / app switch), counted and reported apart, never part of avg / p95 / fps                                              // frames kept per recording (≈ 2 min at 60 fps)
const sortedCopy = (a, n) => Array.from(a.subarray(0, n)).sort((x, y) => x - y);
const pc = (s, p) => (s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0);
const r1 = (v) => Math.round(v * 10) / 10, r2 = (v) => Math.round(v * 100) / 100;

function makeRecorder(ctx) {
  const R = ctx.renderer, SM = R.shadowMap, raf0 = window.requestAnimationFrame.bind(window);
  const A = { js: 0, rn: 0, sh: 0, calls: 0, shc: 0, tris: 0, fsq: 0, rc: 0 };                          // the frame being built
  const F = { n: 0, on: false, t: new Float64Array(NF), js: new Float32Array(NF), rn: new Float32Array(NF), sh: new Float32Array(NF), calls: new Uint16Array(NF), shc: new Uint16Array(NF),
    tris: new Uint32Array(NF), fsq: new Uint8Array(NF), rc: new Uint8Array(NF), heap: new Float32Array(NF), pr: new Float32Array(NF), dyn: new Float32Array(NF), gov: new Uint8Array(NF) };
  let profWas = false, tick = -1, vis = { n: 0, ms: 0, t: 0 }, keys = [], ps = Object.create(null), pn = 0, kAt = 0, t0 = 0, lt = [], loaf = [];
  const hasMem = !!(performance && performance.memory);
  const heroScene = () => { const h = ctx.getHero && ctx.getHero(); return h && h.scene; };
  const flush = () => {
    if (F.on && A.rn > 0 && F.n < NF && tick > 0) {              // (PF2: tick > 0 — the recorder of a player without ?pf=1 is installed in the middle of the running loop: its first 'frame' carried tick = -1, i.e. the whole page age as the first interval = the owner's «worst 605660 ms · 0.6 fps · drift blank»)
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
  document.addEventListener('visibilitychange', () => { if (!F.on) return; if (document.hidden) { vis.n++; vis.t = performance.now(); } else if (vis.t) { vis.ms += performance.now() - vis.t; vis.t = 0; } });   // PF2
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

  function start() { install(); flush(); tick = -1; vis.n = 0; vis.ms = 0; vis.t = document.hidden ? performance.now() : 0; F.n = 0; ps = Object.create(null); pn = 0; lt = []; loaf = []; A.js = A.rn = A.sh = 0; A.calls = A.shc = A.tris = A.fsq = A.rc = 0; t0 = performance.now(); profWas = PROF.on; PROF.on = true; F.on = true; }
  function summary(a, b) {                                                                   // (everything is over the DRAWN frames a..b; the interval is draw to draw, what the player sees)
    a = a || 0; if (b == null) b = F.n; const n = b - a, o = { n, secs: 0 };
    if (n < 3) return o;
    // PF2: the interval between two drawn frames = the difference of their requestAnimationFrame timestamps (nothing else); an interval above STALL ms is a stall: counted (stalls / stallMs / stallMax), left out of avg / p50 / p95 / p99 / max / fps
    const dtv = []; let sum = 0, o33 = 0, o50 = 0, st = 0, stMs = 0, stMax = 0;
    for (let i = a + 1; i < b; i++) {
      const d = F.t[i] - F.t[i - 1]; if (!(d > 0)) continue;
      if (d > STALL) { st++; stMs += d; if (d > stMax) stMax = d; continue; }
      dtv.push(d); sum += d; if (d > 34) o33++; if (d > 50) o50++;
    }
    o.stalls = st; o.stallMs = Math.round(stMs); o.stallMax = Math.round(stMax);
    if (dtv.length < 2) return o;
    const sd = Float32Array.from(dtv).sort(), m = dtv.length, span = sum / 1000;
    o.secs = r1(sum / 1000); o.fps = r1(m / (sum / 1000)); o.avg = r1(sum / m); o.p50 = r1(pc(sd, 0.5)); o.p95 = r1(pc(sd, 0.95)); o.p99 = r1(pc(sd, 0.99)); o.max = r1(sd[sd.length - 1]); o.o33 = o33; o.o50 = o50;
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
  // PF2: thermal drift of frames a..b: fps over the first 5 s and over the last 5 s of the phase (stalls left out; null when the phase has less than 6 s of valid frames)
  function drift(a, b) {
    const ds = []; let tot = 0;
    for (let i = a + 1; i < b; i++) { const d = F.t[i] - F.t[i - 1]; if (d > 0 && d <= STALL) { ds.push(d); tot += d; } }
    if (tot < 6000) return null;
    let c = 0, n1 = 0, t1 = 0, n2 = 0, t2 = 0;
    for (const d of ds) { if (c < 5000) { n1++; t1 += d; } if (c >= tot - 5000) { n2++; t2 += d; } c += d; }
    return [t1 ? r1(n1 / (t1 / 1000)) : 0, t2 ? r1(n2 / (t2 / 1000)) : 0];
  }
  // PF2: pause / resume the recording without losing it (the bench stops counting while it waits for shaders or loads the hero)
  function hold(on) { if (on) { flush(); F.on = false; } else if (!F.on) { A.js = A.rn = A.sh = 0; A.calls = A.shc = A.tris = A.fsq = A.rc = 0; tick = -1; F.on = true; } }
  const visInfo = () => ({ n: vis.n, ms: Math.round(vis.ms + (vis.t ? performance.now() - vis.t : 0)) });
  function stop() { flush(); F.on = false; PROF.on = profWas; return summary(); }
  return { start, stop, summary, drift, hold, vis: visInfo, idx: () => F.n, raf: raf0, F, get on() { return F.on; } };
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

// ---------------------------------------------------------------- the owner's benchmark (PF2: v2) — FIVE phases of 8 s, ONE card line each, ONE small POST
//   md = strategic map by day (hour 13) · mu = the same UNCAPPED (the adaptive frame cap off: the real headroom) · mn = strategic map by night (hour 23, the bloom composer path) · hn = hero by night · hd = hero by day.
// Every interval comes from the requestAnimationFrame timestamps of the drawn frames and nothing else; a gap above 2000 ms is a STALL: counted and reported (stalls / stallMs / hidden), never averaged.  The hour is forced through
// ctx.setHour (the real clock comes back at the end), the night path is built first when it is not (the bench waits for it; those seconds are not measured), the hero (owner builds) is started for the two hero phases and left again.
function makeBench(ctx, rec) {
  let busy = false, card = null;
  const nProg = () => { try { return (ctx.renderer.info.programs || []).length; } catch (e) { return 0; } };      // shader programs now (every program added DURING a phase is a compile hitch: the owner's phone showed 346)
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const poke = () => { try { window.dispatchEvent(new Event('pointermove')); } catch (e) { /* ignore */ } };           // (the game drops to 30 fps after 3.5 s without a touch: a playing hand keeps it at full rate)
  const show = (lines, ok) => {
    if (!card) { card = document.createElement('div'); card.style.cssText = 'position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:99999;font:600 12px/1.5 ui-monospace,Menlo,Consolas,monospace;color:#eaf6ff;background:rgba(0,12,32,.92);border:1px solid #5fa8ff;border-radius:10px;padding:8px 12px;width:max-content;max-width:94vw;text-align:left;white-space:pre'; card.addEventListener('pointerdown', () => { if (!busy) card.style.display = 'none'; }); document.body.appendChild(card); }
    card.style.display = 'block'; card.style.borderColor = ok === false ? '#ff7a7a' : '#5fa8ff'; card.textContent = lines;
  };
  const buf = () => { try { const z = ctx.renderer.getDrawingBufferSize(new THREE.Vector2()); return z.x + 'x' + z.y; } catch (e) { return ''; } };
  // one phase = `secs` of DRAWN frames, timed by the rAF timestamps of the frames themselves; a wall-clock failsafe (3 x + 4 s) ends it when the tab does not draw at all (hidden / frozen): the stall figures then say so
  const phase = async (name, secs, step) => {
    rec.hold(false);
    const a = rec.idx(), w0 = performance.now(); let last = w0;
    for (;;) {
      await sleep(16);
      const n = performance.now(), b = rec.idx();
      if (step) step((n - last) / 1000, (n - w0) / 1000); last = n;
      if (b - a > 1 && rec.F.t[b - 1] - rec.F.t[a] >= secs * 1000) break;
      if (n - w0 > secs * 3000 + 4000) break;
    }
    rec.hold(true); const b = rec.idx();
    const s = rec.summary(a, b); s.name = name; s.a = a; s.b = b; s.prog = nProg(); s.px = buf(); s.dr = rec.drift(a, b); return s;
  };
  const brief = (s) => (s && s.fps != null ? { n: s.n, fps: s.fps, avg: s.avg, p95: s.p95, max: s.max, o33: s.o33, o50: s.o50, cpu: s.js, calls: s.calls, k: Math.round(s.tris / 1000), pr: s.pr, px: s.px, prog: s.prog, st: s.stalls, stMs: s.stallMs, d: s.dr }
    : s ? { n: s.n, st: s.stalls, stMs: s.stallMs, px: s.px, prog: s.prog } : null);
  const PH = [['md', 'MAP DAY      '], ['mn', 'MAP NIGHT    '], ['hd', 'HERO DAY     '], ['hn', 'HERO NIGHT   '], ['mu', 'MAP UNCAPPED ']];
  async function run(opt) {
    opt = opt || {}; if (busy) return null;
    const ui = ctx.ui, bt = ctx.getBattle && ctx.getBattle(), ctl = ctx.ctl, CAP = ctx.CAP;
    if (bt && bt.active) { show('BENCH: leave the attack first', false); return null; }
    if (ui && ui.root && ui.root.classList.contains('wel')) { show('BENCH: close the welcome card first', false); return null; }
    if (document.querySelector('.bwa.on,.bws.on,.bwu.on,.bwk.on,.bwh.on,.bw-set.on')) { show('BENCH: close the open panel first', false); return null; }       // (a panel behind caps the game at ~16 fps on purpose)
    busy = true; show('BENCH running… about a minute (the night shaders first, if they are not built) — keep your hand off the screen', true);
    const keep = { azim: ctl.azim, dist: ctl.dist, polar: ctl.polar, tx: ctl.target.x, tz: ctl.target.z }, sec = +opt.secs || 8, ph = {}, t00 = performance.now(), errs = [];
    let hero = ctx.getHero && ctx.getHero(), startedHero = false, ip = 0, night = null;
    const MS = ctx.MSKIP || { skip: 0, run: 0, on: false }, ms0 = [MS.skip, MS.run];
    const prog0 = nProg(); rec.start(); rec.hold(true);
    const settle = async (s) => { poke(); await sleep(s * 1000); };
    const orbit = (dt) => { ctl.azim += 0.35 * dt; };
    // the night (bloom composer) path must exist before the night phases: build it now and wait (not measured), at most 3 min
    const nightReady = async () => {
      const t0 = performance.now(); let np = ctx.nightPath ? ctx.nightPath() : null;
      if (!np || !np.comp) return { comp: 0 };
      if (!np.rt && ctx.warmNight) ctx.warmNight();
      while (np && !np.rt && performance.now() - t0 < 180000) { show('BENCH: building the night shaders… ' + (((performance.now() - t0) / 1000) | 0) + ' s (not measured)', true); await sleep(1000); np = ctx.nightPath(); }
      return { comp: 1, rt: np && np.rt ? 1 : 0, used: np && np.used ? 1 : 0, wait: Math.round((performance.now() - t0) / 1000) };
    };
    try {
      if (ctl._skipIntro) ctl._skipIntro();
      ip = setInterval(poke, 700);
      // 1) strategic map by day, 2) the same uncapped
      ctx.setHour(13); await settle(1.5);
      ph.md = await phase('md', sec, orbit);
      const cap0 = CAP ? { off: CAP.off, lvl: CAP.lvl } : null;
      if (CAP) { CAP.off = true; CAP.lvl = 0; }
      try { ph.mu = await phase('mu', sec, orbit); } finally { if (CAP && cap0) { CAP.off = cap0.off; CAP.lvl = cap0.lvl; } }
      // 3) strategic map by night
      ctx.setHour(23); night = await nightReady(); await settle(1.5);
      ph.mn = await phase('mn', sec, orbit);
      // 4) hero (owner builds: the hero module is fetched now if it is not loaded yet): by night, then by day
      ph.hn = ph.hd = null;
      try {
        if (!hero && ctx.PFH && ctx.PFH.make) hero = await ctx.PFH.make();
        if (hero && !hero.active && hero.start) { let key = 'elina'; try { key = localStorage.getItem('bw_rpg_hero') || key; } catch (e) { /* storage blocked */ } await hero.start(key); startedHero = true; await sleep(1200); }
        if (hero && hero.active && hero.dev && hero.dev.setInput) {
          let yaw = 0; const walk = (dt, t) => { yaw += 0.5 * dt; hero.dev.setLook && hero.dev.setLook(yaw, 0.25); hero.dev.setInput(0, 0.8); hero.dev.sprint && hero.dev.sprint(t > 3 && ((t | 0) % 4 === 0)); };
          await settle(1.5); ph.hn = await phase('hn', sec, walk);
          ctx.setHour(13); await settle(1.5); ph.hd = await phase('hd', sec, walk);
          hero.dev.setInput(0, 0);
        }
      } catch (e) { errs.push('hero:' + String(e && e.message || e).slice(0, 60)); }
      if (hero && hero.active && startedHero) { try { hero.exit(); } catch (e) { /* ignore */ } await sleep(1000); }
    } catch (e) { errs.push(String(e && e.message || e).slice(0, 80)); } finally { if (ip) clearInterval(ip); ctx.setHour(null); }
    rec.hold(true); const vis = rec.vis(); rec.stop(); let mchk = null; try { const m = matrixCheck(ctx); mchk = { on: m.on, objs: m.objs, bad: m.badLocal + m.badWorld, sk: MS.skip - ms0[0], run: MS.run - ms0[1] }; } catch (e) { /* ignore */ }
    ctl.azim = keep.azim; ctl.dist = keep.dist; ctl.polar = keep.polar; ctl.target.x = keep.tx; ctl.target.z = keep.tz;
    const res = { bench: 1, v: 2, secs: r1((performance.now() - t00) / 1000), dev: deviceSnap(ctx), ph: {}, night, vis,
      q: { preset: ctx.Q.level, dyn: ctx.DYN ? r2(ctx.DYN.s) : 1, gov: ctx.GOV ? ctx.GOV.lvl : 0, dprNow: r2(ctx.renderer.getPixelRatio()), sh: ctx.renderer.shadowMap.enabled ? 1 : 0, bloom: ctx.getComposer && ctx.getComposer() ? 1 : 0 },
      mskip: mchk, gl: { geo: ctx.renderer.info.memory.geometries, tex: ctx.renderer.info.memory.textures, prog: nProg(), prog0 }, err: errs.length ? errs : undefined };
    let stalls = 0, stallMs = 0; for (const [k] of PH) { res.ph[k] = brief(ph[k]); if (ph[k]) { stalls += ph[k].stalls || 0; stallMs += ph[k].stallMs || 0; } }
    res.stalls = stalls; res.stallMs = stallMs;
    if (ph.hn == null && ph.hd == null) res.hero = 'skipped';
    let posted = false, txt = JSON.stringify(res);
    if (txt.length > 3400 && res.dev) { res.dev.ua = String(res.dev.ua).slice(0, 50); txt = JSON.stringify(res); }
    try { const tk = typeof ctx.token === 'function' ? ctx.token() : ctx.token; if (tk && txt.length < 3500) { const r = await fetch('/api/perf', { method: 'POST', keepalive: true, headers: { Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' }, body: txt }); posted = r.ok; } } catch (e) { /* offline */ }
    res.posted = posted; res.bytes = txt.length;
    const f = (k) => { const p = res.ph[k]; return p && p.fps != null ? p.fps : '-'; };
    res.text = `BENCH day ${f('md')} · night ${f('mn')} · hero ${f('hd')} / ${f('hn')} · uncapped ${f('mu')} fps`;
    busy = false;
    const line = (k, nm) => { const p = res.ph[k]; if (!p) return nm + 'n/a'; if (p.fps == null) return nm + 'no frames (' + (p.st || 0) + ' stalls)'; return `${nm}${p.fps} fps · p95 ${p.p95} · worst ${p.max} ms · ${p.calls} calls · ${p.k}K tris · ${p.px} · q ${ctx.Q.level}`; };
    const dr = res.ph.md && res.ph.md.d;
    show(res.text + '\n' + PH.map(([k, nm]) => line(k, nm)).join('\n') + `\nprograms ${prog0}→${nProg()} · stalls ${stalls} (${stallMs} ms) · hidden ${vis.n}\ndrift ${dr ? dr[0] + '→' + dr[1] : '-'}${night && night.comp ? ' · night path ' + (night.rt ? 'ok' : 'NOT BUILT') : ' · no bloom path'} · ${posted ? 'sent' : 'not sent'}`, true);
    window.__benchLast = res; return res;
  }
  return { run, get busy() { return busy; } };
}

// ---------------------------------------------------------------- PF2: pf_overdraw(view) — how much of the screen the blended layers cost (the gem glow, the keep crystal's halo, light cones, any alpha sprite)
// Pixels x layers, counted on the CPU from the real scene and camera: every visible additive (AdditiveBlending) and alpha-blended (transparent) sprite / mesh is projected, its triangles are rasterised on a coarse grid
// (about 40 000 cells), each covered cell counts one layer.  No GPU, no render, no new shader program: the same numbers on every device for the same camera, so a before / after is comparable.  NOT counted: depth occlusion
// by walls (an upper bound for glows behind buildings) and texture alpha (a sprite quad costs its whole area on the GPU whatever its texture shows).
//   pf_overdraw()                       the current camera, the drawing buffer size
//   pf_overdraw({ camera, w, h })       any camera / size (a dev page that parks the camera at a vault)
//   pf_overdraw({ within: { x, z, r } }) only objects whose centre is within r metres of (x, z) in the ground plane (ST1_R2: one vault / the keep crystal)
//   pf_overdraw({ filter: (obj) => bool, maxTris: 400000 })
// Result: { w, h, px, cell, add: B, alpha: B, glow: { objs, px, ratio, wpx }, top: [...] } with B = { px: pixels x layers, ratio: layers per screen pixel, covered: pixels touched, max: most layers on one pixel, wpx: pixels x layers x opacity
// (the visible strength), objs, tris } and top = the 10 heaviest objects { k: 'add sprite' | 'alpha mesh' ..., name, at: [x, y, z], m: size in metres, op: opacity, px, pct: percent of the screen x layers }.
const _tv = new THREE.Vector3(), _tm = new THREE.Matrix4(), _tm2 = new THREE.Matrix4(), _tf = new THREE.Frustum(), _tpv = new THREE.Matrix4(), _tsp = new THREE.Sphere();
function overdraw(ctx, view) {
  view = view || {};
  const cam = view.camera || ctx.camera; cam.updateMatrixWorld(); if (cam.updateProjectionMatrix && view.camera) cam.updateProjectionMatrix();
  const bz = ctx.renderer.getDrawingBufferSize(new THREE.Vector2()), W = Math.max(8, Math.round(view.w || bz.x)), H = Math.max(8, Math.round(view.h || bz.y));
  const S = Math.max(1, Math.round(Math.sqrt(W * H / 40000))), gw = Math.ceil(W / S), gh = Math.ceil(H / S), cellPx = S * S;
  const gridA = new Uint16Array(gw * gh), gridB = new Uint16Array(gw * gh), wA = new Float32Array(gw * gh), wB = new Float32Array(gw * gh);
  const G = { add: { g: gridA, w: wA, sub: 0, wsub: 0, objs: 0, tris: 0 }, alpha: { g: gridB, w: wB, sub: 0, wsub: 0, objs: 0, tris: 0 } };
  _tpv.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); _tf.setFromProjectionMatrix(_tpv);
  const h = ctx.getHero && ctx.getHero(), root = h && h.active && h.scene && h.scene !== ctx.scene ? h.scene : ctx.scene, maxTris = view.maxTris || 400000;
  const pe = _tpv.elements, objs = []; let tris = 0, truncated = false;
  // clip-space x, y, w of a world point, into out[0..2]  (column-major projection x view)
  const proj = (x, y, z, o, i) => { const w = pe[3] * x + pe[7] * y + pe[11] * z + pe[15]; o[i] = (pe[0] * x + pe[4] * y + pe[8] * z + pe[12]) / w; o[i + 1] = (pe[1] * x + pe[5] * y + pe[9] * z + pe[13]) / w; o[i + 2] = w; };
  // one triangle (NDC x, y of its three vertices; w > 0 for all) into grid B with weight op; cull: 0 both sides, 1 front only (CCW), -1 back only
  const tri = (B, ax, ay, bx, by, cx, cy, op, cull) => {
    const area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);                                      // > 0: counter-clockwise in NDC = front
    if (area === 0 || (cull === 1 && area < 0) || (cull === -1 && area > 0)) return;
    const X = [(ax * 0.5 + 0.5) * W, (bx * 0.5 + 0.5) * W, (cx * 0.5 + 0.5) * W], Y = [(0.5 - ay * 0.5) * H, (0.5 - by * 0.5) * H, (0.5 - cy * 0.5) * H];
    const minx = Math.min(X[0], X[1], X[2]), maxx = Math.max(X[0], X[1], X[2]), miny = Math.min(Y[0], Y[1], Y[2]), maxy = Math.max(Y[0], Y[1], Y[2]);
    if (maxx < 0 || maxy < 0 || minx > W || miny > H) return;
    const c0 = Math.max(0, Math.floor(minx / S - 0.5)), c1 = Math.min(gw - 1, Math.ceil(maxx / S)), r0 = Math.max(0, Math.floor(miny / S - 0.5)), r1_ = Math.min(gh - 1, Math.ceil(maxy / S));
    const d = (X[1] - X[0]) * (Y[2] - Y[0]) - (X[2] - X[0]) * (Y[1] - Y[0]); let hit = 0;
    for (let r = r0; r <= r1_; r++) {
      const py = (r + 0.5) * S;
      for (let c = c0; c <= c1; c++) {
        const px = (c + 0.5) * S;
        const e0 = ((X[1] - px) * (Y[2] - py) - (X[2] - px) * (Y[1] - py)) / d, e1 = ((X[2] - px) * (Y[0] - py) - (X[0] - px) * (Y[2] - py)) / d, e2 = 1 - e0 - e1;
        if (e0 >= 0 && e1 >= 0 && e2 >= 0) { const i = r * gw + c; B.g[i]++; B.w[i] += op; hit++; }
      }
    }
    if (!hit && minx >= 0 && miny >= 0 && maxx <= W && maxy <= H) { const a = Math.abs(d) / 2; B.sub += a; B.wsub += a * op; hit = 1; }   // (smaller than a cell: its analytic area)
    return hit;
  };
  const tmpv = new Float32Array(12);
  const matOf = (o, g) => { const m = o.material; return Array.isArray(m) ? m[(g && g.materialIndex) || 0] : m; };
  const blendKind = (m) => (!m || m.visible === false ? null : m.blending === THREE.AdditiveBlending ? 'add' : m.transparent ? 'alpha' : null);
  const centre = (o) => { _tv.setFromMatrixPosition(o.matrixWorld); return [r1(_tv.x), r1(_tv.y), r1(_tv.z)]; };
  const within = view.within; const near = (o) => { if (!within) return true; _tv.setFromMatrixPosition(o.matrixWorld); return Math.hypot(_tv.x - within.x, _tv.z - within.z) <= within.r; };
  const walk = (o) => {
    if (!o.visible) return;
    if (o.isSprite && o.material) {
      const m = o.material, bk = blendKind(m);
      if (bk && near(o) && (!view.filter || view.filter(o)) && (o.frustumCulled === false || _tf.intersectsSprite(o))) {
        const e = o.matrixWorld.elements, ws = Math.hypot(e[0], e[1], e[2]), hs = Math.hypot(e[4], e[5], e[6]);
        _tv.setFromMatrixPosition(o.matrixWorld).applyMatrix4(cam.matrixWorldInverse);               // the sprite's centre in view space
        const rot = m.rotation || 0, cs = Math.cos(rot), sn = Math.sin(rot), cc = o.center || { x: 0.5, y: 0.5 };
        const corner = (ux, uy) => { const lx = (ux - cc.x) * ws, ly = (uy - cc.y) * hs; return [_tv.x + lx * cs - ly * sn, _tv.y + lx * sn + ly * cs, _tv.z]; };
        const q = [corner(0, 0), corner(1, 0), corner(1, 1), corner(0, 1)], pq = [], pe2 = cam.projectionMatrix.elements; let ok = true;
        for (const v of q) { const w = -v[2]; if (w <= 0.01) { ok = false; break; } pq.push([(pe2[0] * v[0]) / w, (pe2[5] * v[1]) / w]); }
        if (ok) {
          const B = G[bk]; let hit = 0; const op = m.opacity == null ? 1 : m.opacity;
          hit += tri(B, pq[0][0], pq[0][1], pq[1][0], pq[1][1], pq[2][0], pq[2][1], op, 0) || 0; hit += tri(B, pq[0][0], pq[0][1], pq[2][0], pq[2][1], pq[3][0], pq[3][1], op, 0) || 0;
          B.objs++; B.tris += 2; tris += 2;
          objs.push({ bk, kind: 'sprite', name: o.name || (m.map && m.map.name) || 'sprite', at: centre(o), m: r1(Math.max(ws, hs)), op: r2(op), hit });
        }
      }
    } else if (o.isMesh && o.material && o.geometry && o.geometry.attributes && o.geometry.attributes.position && (!view.filter || view.filter(o)) && near(o)) {
      const g = o.geometry, mats = Array.isArray(o.material) ? o.material : [o.material];
      if (mats.some((m) => blendKind(m))) {
        if (!g.boundingSphere) g.computeBoundingSphere();
        const inst = o.isInstancedMesh, okc = o.frustumCulled === false || inst || _tf.intersectsObject(o);
        if (okc && !(o.isSkinnedMesh)) {
          const pos = g.attributes.position, idx = g.index, nI = inst ? Math.min(o.count, 4000) : 1, groups = g.groups && g.groups.length && Array.isArray(o.material) ? g.groups : [{ start: 0, count: idx ? idx.count : pos.count, materialIndex: 0 }];
          let hitObj = 0, first = null;
          for (let ii = 0; ii < nI && tris < maxTris; ii++) {
            if (inst) { o.getMatrixAt(ii, _tm2); _tm.multiplyMatrices(o.matrixWorld, _tm2); if (g.boundingSphere) { _tsp.copy(g.boundingSphere).applyMatrix4(_tm); if (!_tf.intersectsSphere(_tsp)) continue; } } else _tm.copy(o.matrixWorld);
            const te = _tm.elements; let tIn = 0, bk0 = null, opAll = 1;
            for (const gr of groups) {
              const m = mats[gr.materialIndex || 0], bk = blendKind(m); if (!bk) continue; bk0 = bk0 || bk;
              const op = m.opacity == null ? 1 : m.opacity; opAll = op;
              const cull = m.side === THREE.DoubleSide ? 0 : m.side === THREE.BackSide ? -1 : 1, B = G[bk], n = gr.count;
              for (let t = 0; t + 2 < n && tris < maxTris; t += 3) {
                let ok = true;
                for (let k = 0; k < 3; k++) {
                  const vi = idx ? idx.getX(gr.start + t + k) : gr.start + t + k, x = pos.getX(vi), y = pos.getY(vi), z = pos.getZ(vi);
                  const wx = te[0] * x + te[4] * y + te[8] * z + te[12], wy = te[1] * x + te[5] * y + te[9] * z + te[13], wz = te[2] * x + te[6] * y + te[10] * z + te[14];
                  proj(wx, wy, wz, tmpv, k * 3); if (tmpv[k * 3 + 2] <= 0.01) { ok = false; break; }
                }
                if (!ok) continue; tris++; tIn++;
                hitObj += tri(B, tmpv[0], tmpv[1], tmpv[3], tmpv[4], tmpv[6], tmpv[7], op, cull) || 0;
              }
              if (tris >= maxTris) truncated = true;
            }
            if (bk0) { const B = G[bk0]; if (!first) B.objs++; B.tris += tIn; if (!first) { const sc = Math.hypot(te[0], te[1], te[2]) * (g.boundingSphere ? g.boundingSphere.radius * 2 : 1); first = { bk: bk0, kind: inst ? 'imesh' : 'mesh', name: o.name || mats[0].name || g.name || 'mesh', at: centre(o), m: r1(sc), op: r2(opAll), hit: 0 }; } }
          }
          if (first) { first.hit = hitObj; objs.push(first); }
        }
      }
    }
    const ch = o.children; for (let i = 0; i < ch.length && tris < maxTris; i++) walk(ch[i]);
  };
  walk(root);
  const sum = (B) => { let px = 0, cov = 0, mx = 0, wpx = 0; const n = gw * gh; for (let i = 0; i < n; i++) { const c = B.g[i]; if (c) { px += c * cellPx; cov += cellPx; wpx += B.w[i] * cellPx; if (c > mx) mx = c; } } px += B.sub; wpx += B.wsub;
    return { px: Math.round(px), ratio: r2(px / (W * H)), covered: Math.round(cov), max: mx, wpx: Math.round(wpx), objs: B.objs, tris: B.tris }; };
  // the heaviest objects: each one's own footprint = the cells it covered (layers it adds) x cell area
  const top = objs.map((e) => ({ k: e.bk + ' ' + e.kind, name: String(e.name).slice(0, 28), at: e.at, m: e.m, op: e.op, px: Math.round((e.hit || 0) * cellPx), pct: r1(100 * (e.hit || 0) * cellPx / (W * H)) })).sort((a, b) => b.px - a.px).slice(0, 10);
  // glow = the big additive sprites (>= 4 m: the gem / crystal halos and the lamp glows) on their own: pixels x layers, and the share of the screen they cover (layers added up)
  const gl = objs.filter((e) => e.bk === 'add' && e.kind === 'sprite' && e.m >= 4), gpx = gl.reduce((x, e) => x + (e.hit || 0) * cellPx, 0), gw2 = gl.reduce((x, e) => x + (e.hit || 0) * cellPx * e.op, 0);
  return { w: W, h: H, px: W * H, cell: S, add: sum(G.add), alpha: sum(G.alpha), glow: { objs: gl.length, px: Math.round(gpx), ratio: r2(gpx / (W * H)), wpx: Math.round(gw2) }, top, truncated: truncated || undefined, hero: root !== ctx.scene };
}

export function createProbe(ctx) {
  const on = /[?&]pf=1(?:&|$)/.test(location.search);
  if (!on && !ctx.owner) return null;                                                        // (a normal player: not even a hook is installed)
  const rec = makeRecorder(ctx); if (on) rec.start(), rec.stop();                            // (?pf=1: the hooks are in from the first frame)
  const api = { cap: ctx.CAP, mskip: { check: () => matrixCheck(ctx), stats: () => ctx.MSKIP, set on(v) { if (ctx.MSKIP) ctx.MSKIP.on = !!v; }, get on() { return !!(ctx.MSKIP && ctx.MSKIP.on); } }, rec, start: rec.start, stop: rec.stop, census: () => census(ctx), scan: () => scan(ctx), mem: (n) => memReport(ctx, n), device: () => deviceSnap(ctx), info: () => { const I = ctx.renderer.info; return { calls: I.render.calls, tris: I.render.triangles, geo: I.memory.geometries, tex: I.memory.textures, prog: (I.programs || []).length }; } };
  api.overdraw = (view) => overdraw(ctx, view); window.pf_overdraw = api.overdraw;                // PF2: pixels x blended layers on screen (see overdraw() above)
  if (ctx.owner) { const b = makeBench(ctx, rec); window.BW_bench = { run: b.run, get busy() { return b.busy; } }; }
  if (on) window.__pf = api;
  return api;
}
