// shaderwarm.js (p39) — shader precompile and first-draw warm-up in SMALL SLICES.
//
// Why: on a phone every program link / first draw of a program costs 50-300 ms in the GPU process.  The old loader did ~200 of them in one go
// (compileAsync of the whole scene), then a full-scene warm-up render with culling off, then ~200 more for the bloom path: three main-thread
// stalls of 9-16 s each = Android's "Telegram isn't responding".  Here every step is ONE material unit followed by a sync point (the link-status
// wait of exactly that unit's new programs), and the loop yields to the browser between slices, so no task is longer than ~`target` ms plus one program.
//
//   const sw = createShaderWarm({ renderer, scene, camera });
//   await sw.compile(null,           { progress, target });   // the screen path  (render target null)
//   await sw.compile(rt,             { progress, target, canRun });   // another path (a render target), e.g. the bloom composer's
//   await sw.warmDraw(render, { progress });                  // draw what is off screen once, a few thousand triangles at a time
//
// PF3 adds what the scene walk could not see (every one of these was a synchronous compile INSIDE a frame = a hitch on a phone):
//   await sw.warmShadow({ rt, progress })                        // the DEPTH (shadow) programs of every caster variant: a 1-px rehearsal of the shadow pass on a private layer, a few casters per slice
//   await sw.compileLoose(list, { progress })                    // materials that are in no scene: the post-processing quads (bloom chain, output pass)
//   await sw.compile(rt, { root, lightsFrom, path })             // a scene of its own (the PMREM sky scene: its night-only dome was first compiled at dusk)
import { Frustum, Matrix4, Mesh, BufferGeometry, Float32BufferAttribute, WebGLRenderTarget, Vector4 } from 'three';
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
const isR = (o) => o.isMesh || o.isPoints || o.isLine || o.isSprite;
const mats = (o) => (Array.isArray(o.material) ? o.material : [o.material]);

// what, besides the material, decides which program an object needs
function flagsOf(o) {
  const g = o.geometry, a = g && g.attributes;
  return (o.isInstancedMesh ? 'i' : '') + (o.instanceColor ? 'c' : '') + (o.isSkinnedMesh ? 's' : '') + (o.isPoints ? 'p' : o.isLine ? 'l' : o.isSprite ? 'x' : '') + (o.receiveShadow ? 'r' : '') +
    (o.morphTargetInfluences && o.morphTargetInfluences.length ? 'm' : '') + (a && a.color ? 'v' + a.color.itemSize : '') + (a && a.normal ? '' : 'N') + (a && a.tangent ? 't' : '') + (a && a.uv1 ? 'u1' : '') + (a && a.uv2 ? 'u2' : '');
}

export function createShaderWarm({ renderer, scene, camera, now = () => performance.now(), onSlow }) {
  const seen = new Map();                                    // path key -> Set of unit keys already compiled for it
  const setFor = (k) => { let s = seen.get(k); if (!s) seen.set(k, s = new Set()); return s; };
  const st = { units: 0, programs: 0, ms: 0, worst: 0, slices: 0, top: [], wChunks: 0, wWorst: 0 };
  let lapW = 0, lapP = 0, lapU = 0, lapS = 0, lapWW = 0;                   // (PERF2: worst slice / programs / units / slices since the last lap(): the battle load reads its own numbers)

  // one object per distinct (material, flags) that is still to do for this path
  function collect(path, root = scene) {                     // (PF3: root = a scene of its own)
    const done = setFor(path), out = [], here = new Set();
    root.traverse((o) => {
      if (!isR(o) || !o.material) return;
      const f = flagsOf(o), ms = mats(o);
      let key = ''; for (const m of ms) key += (m ? m.id : 0) + ',';
      key += '|' + f;
      if (done.has(key) || here.has(key)) return;
      here.add(key); out.push({ o, key });
    });
    return out;
  }

  // compile one unit for a render target (links are only ISSUED here; they finish in parallel where the driver can)
  // PERF2: only the object itself, not its children (renderer.compile walks the whole subtree): a mesh that carries other meshes used to link all of them in ONE slice; each child is a unit of its own
  function issue(u, rt, from = scene) {                      // (PF3: from = the scene that gives the lights / fog)
    const o = u.o, kids = o.children, one = kids && kids.length > 0;
    try { if (one) o.children = []; renderer.setRenderTarget(rt); renderer.compile(o, camera, from); } finally { if (one) o.children = kids; renderer.setRenderTarget(null); }
  }

  // slice loop.  A slice = a small BATCH of units: issue their links, then wait for exactly those programs (the sync point), then yield to the browser.
  // The batch size adapts to the device so that a slice takes about `target` ms: a slow phone gets 1-2 units per slice, a fast one more.
  //   rt        null = the screen path, a render target = another path, or a function returning either (evaluated per batch; `undefined` = "not available right now, wait")
  //   canRun    optional () => bool; while false the loop waits (idle compile that must not disturb play)
  //   gap       extra ms to wait between slices (idle compile)
  //   path      key of the path in the "done" book (default: 'rt' / 'screen')
  //   duty      idle compile: after a slice of d ms wait so that the main thread is busy at most `duty` of the time (gap = max(gap, d * (1 / duty - 1)))
  //   maxNew    > 0: a slice ends as soon as its units have created that many programs (a run of cheap cache hits may be long, a slice never links more than ~maxNew programs: the batch size alone could not know)
  //   k0        units in the first slice (default 2; 1 = the careful start of the battle load)    slow   per-call (name, ms, programs) report of a slice > 250 ms (default: the one given to createShaderWarm)
  //   root / lightsFrom   (PF3) another scene: walk it instead of the main one, with ITS lights / fog (the PMREM sky scene has none: other program keys)
  async function compile(rt, { progress, target = 90, canRun, gap = 0, path, duty = 0, k0 = 2, maxNew = 0, slow = onSlow, root = scene, lightsFrom = scene } = {}) {
    const getRt = typeof rt === 'function' ? rt : () => rt;
    const key = path || (getRt() ? 'rt' : 'screen'), done = setFor(key), sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let k = k0;
    for (let round = 0; round < 3; round++) {                // (a second look picks up what a unit added: a late bucket)
      const list = collect(key, root); if (!list.length) break;
      let i = 0;
      while (i < list.length) {
        if (canRun) { while (!canRun()) await sleep(250); }
        const r = getRt(); if (r === undefined) { await sleep(250); continue; }
        const t0 = now(), progs = renderer.info.programs, n0 = progs ? progs.length : 0, first = list[i], i0 = i; st.slices++;
        const stop = Math.min(list.length, i + k);
        while (i < stop) { issue(list[i], r, lightsFrom); done.add(list[i].key); st.units++; i++; if (maxNew && progs && progs.length - n0 >= maxNew) break; }
        const n1 = progs ? progs.length : 0;
        for (let j = n0; j < n1; j++) { try { progs[j].getUniforms(); } catch (e) { /* ignore */ } }     // = the LINK_STATUS wait of the programs of this batch only
        const d = now() - t0, np = n1 - n0; st.ms += d; st.programs += np;
        if (np && d > st.worst) st.worst = d;
        lapS++; lapU += i - i0; if (np) { lapP += np; if (d > lapW) lapW = d; }
        if (np && d > 250) { const m = mats(first.o)[0], nm = ((m && (m.name || m.type)) || '?') + '|' + (first.o.name || '').slice(0, 14); if (slow) slow(nm, d, np); st.top.push([Math.round(d), nm, np, k]); st.top.sort((a, b) => b[0] - a[0]); if (st.top.length > 12) st.top.length = 12; }
        k = Math.max(1, Math.min(24, Math.round(k * Math.min(2, target / Math.max(d, 8)))));        // (cache hits are nearly free, real links are not: aim for `target` ms per slice)
        if (progress) progress(i / list.length);
        if (gap || duty) await sleep(Math.max(gap, duty && np ? d * (1 / duty - 1) : 0));
        await nextFrame();
      }
    }
  }

  // first draw of everything that is not in view right now, in chunks: the chunk's objects get frustumCulled = false for ONE render, so their
  // buffers / textures / pipelines are created now (not when the player first turns the camera), without a single huge frame.
  //   filter   (PERF2) (object) => bool: only these are drawn off screen (the battle loader: what was NOT on the map at the tap, the home warm-up has done the rest)
  //   target   (PERF2) > 0: the chunk size adapts so that one chunk's render takes about `target` ms (a draw of a few big instanced meshes can cost more than its triangle count says)
  async function warmDraw(render, { progress, maxTris = 220000, maxDraws = 60, target = 0, filter } = {}) {
    const fr = new Frustum(), pm = new Matrix4();
    camera.updateMatrixWorld(); pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); fr.setFromProjectionMatrix(pm);
    const list = [];
    scene.traverse((o) => {
      if (!isR(o) || !o.frustumCulled || (filter && !filter(o))) return;
      for (let a = o; a; a = a.parent) if (!a.visible) return;                               // (hidden things are not drawn, so there is nothing to warm)
      let inView = false; try { inView = o.isSprite ? fr.intersectsSprite(o) : fr.intersectsObject(o); } catch (e) { /* draw it */ }
      if (!inView) list.push(o);
    });
    const tri = (o) => { const g = o.geometry; if (!g) return 1; const n = g.index ? g.index.count : g.attributes && g.attributes.position ? g.attributes.position.count : 0; return (n / 3) * (o.isInstancedMesh ? Math.max(1, o.count) : 1); };
    let i = 0, md = maxDraws, mt = maxTris;
    while (i < list.length) {
      const chunk = []; let tris = 0;
      while (i < list.length && chunk.length < md && (chunk.length === 0 || tris + tri(list[i]) <= mt)) { tris += tri(list[i]); chunk.push(list[i++]); }
      for (const o of chunk) o.frustumCulled = false;
      const t0 = now();
      try { render(); } finally { for (const o of chunk) o.frustumCulled = true; }
      const d = now() - t0; st.wChunks++; if (d > st.wWorst) st.wWorst = d; if (d > lapWW) lapWW = d;
      if (target) { const f = Math.min(2, Math.max(0.25, target / Math.max(d, 8))); md = Math.max(4, Math.min(maxDraws, Math.round(md * f))); mt = Math.max(20000, Math.min(maxTris, Math.round(mt * f))); }
      if (progress) progress(i / list.length);
      await nextFrame();
    }
    return list.length;
  }


  // ------------------------------------------------------------------ PF3
  // one small slice loop for the three new warm-ups: `work(batch)` does the batch, then the sync point (the link wait of exactly the programs it made), then a yield.
  //   The batch size adapts to `target` ms per slice (cache hits are almost free, a real link is not); `canRun` / `gap` / `duty` as in compile().
  async function runSlices(list, work, { progress, target = 60, canRun, gap = 0, duty = 0, k0 = 2, slow = onSlow, name } = {}) {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let i = 0, k = k0, made = 0;
    while (i < list.length) {
      if (canRun) { while (!canRun()) await sleep(250); }
      const t0 = now(), progs = renderer.info.programs, n0 = progs ? progs.length : 0, i0 = i; st.slices++;
      const batch = list.slice(i, i + k); i += batch.length;
      work(batch);
      const n1 = progs ? progs.length : 0;
      for (let j = n0; j < n1; j++) { try { progs[j].getUniforms(); } catch (e) { /* ignore */ } }
      const d = now() - t0, np = n1 - n0; st.ms += d; st.programs += np; made += np; if (np && d > st.worst) st.worst = d;
      lapS++; lapU += i - i0; if (np) { lapP += np; if (d > lapW) lapW = d; }
      if (np && d > 250) { const nm = (name ? name(batch[0]) : '?'); if (slow) slow(nm, d, np); st.top.push([Math.round(d), nm, np, k]); st.top.sort((a, b) => b[0] - a[0]); if (st.top.length > 12) st.top.length = 12; }
      k = Math.max(1, Math.min(24, Math.round(k * Math.min(2, target / Math.max(d, 8)))));
      if (progress) progress(i / list.length);
      if (gap || duty) await sleep(Math.max(gap, duty && np ? d * (1 / duty - 1) : 0));
      await nextFrame();
    }
    return made;
  }

  // (1) the SHADOW programs.  A shadow pass draws every caster with a MeshDepthMaterial whose program depends on the caster (skinned, instanced, instance colour, morph targets, an alpha-tested map ...); renderer.compile()
  // cannot make them and the first real shadow pass that met a new variant (a crowd, a skinned hero, a wolf) compiled it inside the frame.  Here every caster is drawn ONCE by a rehearsal render (a few per slice): camera on the
  // private layer 31, the batch and the lights (the ones the real camera counts) on that layer, the batch forced visible with culling off, the colour pass cut to 1 px (scissor), the shadow map flagged for a redraw
  // afterwards (the rehearsal wrote only those casters into it).  (A first version drew one representative per signature of the caster's traits and missed variants: a horse's morph count, a wolf's colours; a second look at
  // each object costs nothing, a missed variant costs a hitch, so there is no de-duplication: an object already rehearsed is skipped, that is all.)  Returns the programs it made.
  let shSeen = new WeakSet();
  const chainVisible = (o) => { for (let a = o; a; a = a.parent) if (!a.visible) return false; return true; };
  function rehearse(batch, rtTarget, cam31) {
    const lights = []; scene.traverse((l) => { if (l.isLight && chainVisible(l) && l.layers.test(camera.layers)) lights.push(l); });   // (decided BEFORE anything is made visible)
    const saved = [], fcs = [], hid = [], hooks = [];
    const sm = renderer.shadowMap, v4 = new Vector4(), sciT = renderer.getScissorTest(), sci = renderer.getScissor(v4).clone();
    const rtOld = renderer.getRenderTarget(), rtSci = rtTarget ? [rtTarget.scissorTest, rtTarget.scissor.clone()] : null;
    try {
      for (const l of lights) { saved.push([l, l.layers.mask]); l.layers.enable(31); }
      for (const o of batch) {
        saved.push([o, o.layers.mask]); o.layers.enable(31); fcs.push([o, o.frustumCulled]); o.frustumCulled = false; for (let a = o; a; a = a.parent) if (!a.visible && !hid.includes(a)) hid.push(a);
        // three draws every caster with ONE shared depth material and re-decides its program only when a trait of the object (skinned, instanced, morph ...) changed since the previous draw — NOT when the caster's map / side
        // changed.  So which depth programs a real pass makes depends on the draw order.  A version bump before each caster's draw makes the rehearsal decide for EVERY caster: the program of its own state.
        const had = Object.prototype.hasOwnProperty.call(o, 'onBeforeShadow'), prev = o.onBeforeShadow; hooks.push([o, had, prev]);
        o.onBeforeShadow = function (...a) { if (a[5]) a[5].needsUpdate = true; return prev.apply(this, a); };
      }
      for (const a of hid) a.visible = true;
      cam31.copy(camera, false); cam31.layers.set(31); cam31.updateMatrixWorld(true);
      if (rtTarget) { rtTarget.scissorTest = true; rtTarget.scissor.set(0, 0, 1, 1); } else { renderer.setScissorTest(true); renderer.setScissor(0, 0, 1, 1); }
      renderer.setRenderTarget(rtTarget || null);
      sm.needsUpdate = true; renderer.render(scene, cam31);
    } finally {
      renderer.setRenderTarget(rtOld);
      if (rtTarget) { rtTarget.scissorTest = rtSci[0]; rtTarget.scissor.copy(rtSci[1]); } else { renderer.setScissorTest(sciT); renderer.setScissor(sci.x, sci.y, sci.z, sci.w); }
      for (const a of hid) a.visible = false;
      for (const [o, had, prev] of hooks) { if (had) o.onBeforeShadow = prev; else delete o.onBeforeShadow; }
      for (const [o, f] of fcs) o.frustumCulled = f;
      for (const [o, m] of saved) o.layers.mask = m;
      sm.needsUpdate = true;
    }
  }
  async function warmShadow({ rt = null, progress, target = 60, canRun, gap = 0, duty = 0, k0 = 2, slow = onSlow } = {}) {
    if (!renderer.shadowMap.enabled) return 0;
    let made = 0, cam31 = null;
    for (let round = 0; round < 2; round++) {                                            // (a second look: a rehearsal can reveal a late bucket)
      const list = [];
      scene.traverse((o) => { if (o.castShadow && (o.isMesh || o.isPoints || o.isLine) && o.material && !shSeen.has(o)) list.push(o); });
      if (!list.length) break;
      cam31 = cam31 || new camera.constructor();
      made += await runSlices(list, (batch) => { try { rehearse(batch, typeof rt === 'function' ? rt() : rt, cam31); } finally { for (const o of batch) shSeen.add(o); } },
        { progress, target, canRun, gap, duty, k0, slow, name: (o) => 'depth|' + (o.name || o.type) });
    }
    return made;
  }

  // (2) materials that are in no scene (a post-processing chain draws full-screen quads): one per slice.  `list` = [{ mat, screen?, prep?, geo? }]: `screen` = drawn to the canvas (the output pass),
  // otherwise to a render target; `prep()` runs first (the output pass fixes its defines in its own render()).  No lights, no fog: the quad is its own scene, as in the real draw.
  let quadGeo = null, looseRT = null;
  const quad = () => quadGeo || (() => { const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)); g.setAttribute('uv', new Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2)); return (quadGeo = g); })();
  const loose = () => looseRT || (looseRT = new WebGLRenderTarget(1, 1));        // (any render target gives the same keys: linear output, no tone mapping)
  const looseSeen = new Set();
  async function compileLoose(list, { progress, target = 60, canRun, gap = 0, duty = 0, k0 = 1, slow = onSlow } = {}) {
    const todo = list.filter((e) => e && e.mat && !looseSeen.has(e.mat.id + (e.screen ? 's' : 'r')));
    return runSlices(todo, (batch) => {
      for (const e of batch) {
        if (e.skip && e.skip()) continue;                                              // (its composer was rebuilt meanwhile)
        const m = new Mesh(e.geo || quad(), e.mat); m.frustumCulled = false;
        try { if (e.prep) e.prep(); renderer.setRenderTarget(e.screen ? null : loose()); renderer.compile(m, camera, m); } catch (err) { /* the first real draw compiles instead */ } finally { renderer.setRenderTarget(null); }
        looseSeen.add(e.mat.id + (e.screen ? 's' : 'r'));
      }
    }, { progress, target, canRun, gap, duty, k0, slow, name: (e) => 'loose|' + ((e.mat && (e.mat.name || e.mat.type)) || '?') });
  }
  // the materials of an EffectComposer's passes (the bloom chain: high-pass, 5 blurs, composite, blend; the output pass), ready for compileLoose
  function passLoose(composer) {
    const out = [], seen = new Set(), add = (m, extra) => { if (m && m.isShaderMaterial && !seen.has(m)) { seen.add(m); out.push({ mat: m, ...extra }); } };
    for (const p of (composer && composer.passes) || []) {
      if (p.isOutputPass) { add(p.material, { screen: true, prep: () => outputPrep(p, composer) }); continue; }
      for (const k of Object.keys(p)) { const v = p[k]; if (Array.isArray(v)) v.forEach((m) => add(m)); else add(v); }
    }
    return out;
  }
  // OutputPass sets its tone-mapping / colour-space defines inside render(); run that part against a stand-in renderer that draws nothing, so the compiled program is the one the real pass will ask for
  function outputPrep(p, composer) {
    const fake = { outputColorSpace: renderer.outputColorSpace, toneMapping: renderer.toneMapping, toneMappingExposure: renderer.toneMappingExposure, setRenderTarget() {}, clear() {}, render() {} };
    p.render(fake, composer.writeBuffer || composer.readBuffer, composer.readBuffer, 0, false);
  }

  // the numbers since the last lap(): { w: worst compile slice (ms), p: programs, u: units, s: slices, ww: worst warm-draw chunk (ms) }
  const lap = () => { const o = { w: Math.round(lapW), p: lapP, u: lapU, s: lapS, ww: Math.round(lapWW) }; lapW = lapP = lapU = lapS = lapWW = 0; return o; };
  return { compile, warmDraw, warmShadow, compileLoose, passLoose, looseRT: loose, stats: st, collect, lap, forgetShadow: () => { shSeen = new WeakSet(); }, shadowSeen: (o) => shSeen.has(o) };
}
