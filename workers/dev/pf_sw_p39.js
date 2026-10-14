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
  const st = { units: 0, programs: 0, ms: 0, worst: 0, slices: 0, top: [] };

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
  function issue(u, rt) {
    try { renderer.setRenderTarget(rt); renderer.compile(u.o, camera, scene); } finally { renderer.setRenderTarget(null); }
  }

  // slice loop.  A slice = a small BATCH of units: issue their links, then wait for exactly those programs (the sync point), then yield to the browser.
  // The batch size adapts to the device so that a slice takes about `target` ms: a slow phone gets 1-2 units per slice, a fast one more.
  //   rt        null = the screen path, a render target = another path, or a function returning either (evaluated per batch; `undefined` = "not available right now, wait")
  //   canRun    optional () => bool; while false the loop waits (idle compile that must not disturb play)
  //   gap       extra ms to wait between slices (idle compile)
  //   path      key of the path in the "done" book (default: 'rt' / 'screen')
  async function compile(rt, { progress, target = 90, canRun, gap = 0, path } = {}) {
    const getRt = typeof rt === 'function' ? rt : () => rt;
    const key = path || (getRt() ? 'rt' : 'screen'), done = setFor(key), sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let k = 2;
    for (let round = 0; round < 3; round++) {                // (a second look picks up what a unit added: a late bucket)
      const list = collect(key); if (!list.length) break;
      let i = 0;
      while (i < list.length) {
        if (canRun) { while (!canRun()) await sleep(250); }
        const r = getRt(); if (r === undefined) { await sleep(250); continue; }
        const t0 = now(), progs = renderer.info.programs, n0 = progs ? progs.length : 0, first = list[i]; st.slices++;
        const stop = Math.min(list.length, i + k);
        for (; i < stop; i++) { issue(list[i], r); done.add(list[i].key); st.units++; }
        const n1 = progs ? progs.length : 0;
        for (let j = n0; j < n1; j++) { try { progs[j].getUniforms(); } catch (e) { /* ignore */ } }     // = the LINK_STATUS wait of the programs of this batch only
        const d = now() - t0, np = n1 - n0; st.ms += d; st.programs += np;
        if (np && d > st.worst) st.worst = d;
        if (np && d > 250) { const m = mats(first.o)[0], nm = ((m && (m.name || m.type)) || '?') + '|' + (first.o.name || '').slice(0, 14); if (onSlow) onSlow(nm, d, np); st.top.push([Math.round(d), nm, np, k]); st.top.sort((a, b) => b[0] - a[0]); if (st.top.length > 12) st.top.length = 12; }
        k = Math.max(1, Math.min(24, Math.round(k * Math.min(2, target / Math.max(d, 8)))));        // (cache hits are nearly free, real links are not: aim for `target` ms per slice)
        if (progress) progress(i / list.length);
        if (gap) await sleep(gap);
        await nextFrame();
      }
    }
  }

  // first draw of everything that is not in view right now, in chunks: the chunk's objects get frustumCulled = false for ONE render, so their
  // buffers / textures / pipelines are created now (not when the player first turns the camera), without a single huge frame.
  async function warmDraw(render, { progress, maxTris = 220000, maxDraws = 60 } = {}) {
    const fr = new Frustum(), pm = new Matrix4();
    camera.updateMatrixWorld(); pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); fr.setFromProjectionMatrix(pm);
    const list = [];
    scene.traverse((o) => {
      if (!isR(o) || !o.frustumCulled) return;
      for (let a = o; a; a = a.parent) if (!a.visible) return;                               // (hidden things are not drawn, so there is nothing to warm)
      let inView = false; try { inView = o.isSprite ? fr.intersectsSprite(o) : fr.intersectsObject(o); } catch (e) { /* draw it */ }
      if (!inView) list.push(o);
    });
    const tri = (o) => { const g = o.geometry; if (!g) return 1; const n = g.index ? g.index.count : g.attributes && g.attributes.position ? g.attributes.position.count : 0; return (n / 3) * (o.isInstancedMesh ? Math.max(1, o.count) : 1); };
    let i = 0;
    while (i < list.length) {
      const chunk = []; let tris = 0;
      while (i < list.length && chunk.length < maxDraws && (chunk.length === 0 || tris + tri(list[i]) <= maxTris)) { tris += tri(list[i]); chunk.push(list[i++]); }
      for (const o of chunk) o.frustumCulled = false;
      try { render(); } finally { for (const o of chunk) o.frustumCulled = true; }
      if (progress) progress(i / list.length);
      await nextFrame();
    }
    return list.length;
  }

  return { compile, warmDraw, stats: st, collect };
}
