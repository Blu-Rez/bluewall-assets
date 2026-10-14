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
import { Frustum, Matrix4 } from 'three';
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
  function collect(path) {
    const done = setFor(path), out = [], here = new Set();
    scene.traverse((o) => {
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
  function issue(u, rt) {
    const o = u.o, kids = o.children, one = kids && kids.length > 0;
    try { if (one) o.children = []; renderer.setRenderTarget(rt); renderer.compile(o, camera, scene); } finally { if (one) o.children = kids; renderer.setRenderTarget(null); }
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
  async function compile(rt, { progress, target = 90, canRun, gap = 0, path, duty = 0, k0 = 2, maxNew = 0, slow = onSlow } = {}) {
    const getRt = typeof rt === 'function' ? rt : () => rt;
    const key = path || (getRt() ? 'rt' : 'screen'), done = setFor(key), sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let k = k0;
    for (let round = 0; round < 3; round++) {                // (a second look picks up what a unit added: a late bucket)
      const list = collect(key); if (!list.length) break;
      let i = 0;
      while (i < list.length) {
        if (canRun) { while (!canRun()) await sleep(250); }
        const r = getRt(); if (r === undefined) { await sleep(250); continue; }
        const t0 = now(), progs = renderer.info.programs, n0 = progs ? progs.length : 0, first = list[i], i0 = i; st.slices++;
        const stop = Math.min(list.length, i + k);
        while (i < stop) { issue(list[i], r); done.add(list[i].key); st.units++; i++; if (maxNew && progs && progs.length - n0 >= maxNew) break; }
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

  // the numbers since the last lap(): { w: worst compile slice (ms), p: programs, u: units, s: slices, ww: worst warm-draw chunk (ms) }
  const lap = () => { const o = { w: Math.round(lapW), p: lapP, u: lapU, s: lapS, ww: Math.round(lapWW) }; lapW = lapP = lapU = lapS = lapWW = 0; return o; };
  return { compile, warmDraw, stats: st, collect, lap };
}
