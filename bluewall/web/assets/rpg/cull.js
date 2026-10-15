// RP1C — the hero mode's spatial culling of repeated geometry.  A lazy ES module (fetched with rpg.js, owner-only; nothing of it is in the boot bundle).
// The strategic view draws every tree / rock / worker pack of the whole map with ONE call each, because the camera is high.  A walking player sees a few hundred metres, so:
//   · every spread-out InstancedMesh (trees, rocks, props, worksite life, ...) gets a lightweight PROXY: an InstancedMesh that shares the original's geometry and material (so: no new shader program) and
//     holds only the copies near the hero.  The original is hidden; the proxy is refilled when the hero has moved a few metres, and — for packs the game animates (instanceMatrix rewritten by the world,
//     seen through its `version`) — every time the game has written them.  Colours and per-instance geometry attributes are copied along.  One call per pack at most (none when nothing of it is near).
//   · a pack that casts shadows gets a second proxy for the shadow pass only (copies inside the sun's shadow box), swapped in while the shadow map is drawn: casters outside the box leave the shadow pass.
//   · the PLANNED TOWN (group `planned-town`): the world bakes it into a few chunk meshes that each span the whole town (300 m): one draw for 235 k triangles, whatever the camera sees, and the same again in the shadow pass.
//     RP1C-R2 Job 3: each such chunk is cut ONCE into 64 m cells (same material, same attributes, same triangles; the original is hidden) -> three's frustum test works per cell, and a cell farther than the diet's
//     draw radius is not drawn at all (nor cast).  `exit()` removes the cells and shows the chunk again.
//   · RP1C-R2 Job 1b — MATRICES.  three recomputes the world matrix of every node of the scene on every draw (4300 nodes at the gate = ~40 % of the renderer's CPU time), even of the 2000 nodes inside hidden unit pools.
//     (1) a subtree under an invisible node is skipped by the update (its children's updateMatrixWorld is a no-op until the node is visible again: checked every frame, before the draw);
//     (2) the world only moves its own nodes inside world.update, which in hero mode runs every REACH.upd-th drawn frame: main.js switches scene.matrixWorldAutoUpdate off on the frames in between,
//         and `era()` recomputes just the nodes that did NOT exist when the hero module was made (her, the doors, the foes, the trail, our proxies).  The picture is the same: nothing else has a new position.
// Nothing here edits a world file; the world keeps writing its own meshes, and `exit()` puts every original back (visible, no proxy left in the scene).  The strategic view / a normal player never loads this.
const DYN = 35048;                                                                   // THREE.DynamicDrawUsage
const MOVE = 6;                                                                       // metres the hero may walk before a static pack is refilled (the scan radius carries this margin, so nothing pops inside the radius)
const BUDGET = 1.2;                                                                    // ms of refill work per frame (the rest of the late packs wait for the next frame)

// ---- the planned town's chunk meshes -> cells (pure: THREE passed in; exported for the node test) -----------------------------------------------------------------------------------------------------------
// `mesh` = a Mesh whose geometry is in world space (bakeTr2), one material, no groups.  Returns [{ geo, x0, x1, z0, z1, tris }] — every triangle of the chunk lands in exactly one cell (by its centre), vertices are re-indexed per cell,
// every attribute (position, normal, uv, the game's `aB` ...) is copied along.  Returns null when the geometry is not a plain one (interleaved / instanced / morph / groups): the chunk is then left alone.
export function splitCells(T, mesh, CELL = 64) {
  const g = mesh.geometry; if (!g || !g.attributes.position || (g.groups && g.groups.length > 1) || (g.morphAttributes && Object.keys(g.morphAttributes).length)) return null;
  const names = Object.keys(g.attributes); for (const k of names) { const a = g.attributes[k]; if (a.isInterleavedBufferAttribute || a.isInstancedBufferAttribute) return null; }
  const P = g.attributes.position, I = g.index, n = I ? (I.count / 3) | 0 : (P.count / 3) | 0, cells = new Map();
  for (let t = 0; t < n; t++) {
    const a = I ? I.getX(t * 3) : t * 3, b = I ? I.getX(t * 3 + 1) : t * 3 + 1, c = I ? I.getX(t * 3 + 2) : t * 3 + 2;
    const cx = (P.getX(a) + P.getX(b) + P.getX(c)) / 3, cz = (P.getZ(a) + P.getZ(b) + P.getZ(c)) / 3, key = Math.floor(cx / CELL) * 4096 + Math.floor(cz / CELL);
    let e = cells.get(key); if (!e) cells.set(key, e = []); e.push(t);
  }
  const remap = new Int32Array(P.count), out = [];
  for (const tris of cells.values()) {
    remap.fill(-1); let nv = 0; const idx = new Uint32Array(tris.length * 3), src = [];
    for (let q = 0; q < tris.length; q++) for (let k = 0; k < 3; k++) { const v = I ? I.getX(tris[q] * 3 + k) : tris[q] * 3 + k; let m = remap[v]; if (m < 0) { m = remap[v] = nv++; src.push(v); } idx[q * 3 + k] = m; }
    const geo = new T.BufferGeometry();
    for (const k of names) { const A = g.attributes[k], sz = A.itemSize, arr = new A.array.constructor(nv * sz); for (let i = 0; i < nv; i++) for (let j = 0; j < sz; j++) arr[i * sz + j] = A.array[src[i] * sz + j]; geo.setAttribute(k, new T.BufferAttribute(arr, sz, A.normalized)); }
    geo.setIndex(new T.BufferAttribute(nv > 65535 ? idx : new Uint16Array(idx), 1)); geo.computeBoundingSphere(); geo.computeBoundingBox();
    const bb = geo.boundingBox; out.push({ geo, x0: bb.min.x, x1: bb.max.x, z0: bb.min.z, z1: bb.max.z, tris: tris.length });
  }
  return out;
}

export function createCull(H, S, diet) {
  const T = H.THREE, { renderer, scene } = H, STRUCT = diet.STRUCT, STEPS = diet.STEPS;
  const st = { town: new Map(), townAt: -1e9, nCells: 0, nCellsOn: 0, on: false, rr: 0, rrNext: -1, list: [], map: new Map(), candAt: -1e9, nNear: 0, nSrc: 0, nTaken: 0, nRef: 0, ms: 0, skipped: [], sm: null };
  const mw = new T.Matrix4(), inv = new T.Matrix4(), v = new T.Vector3();
  const pathOf = (o) => { let s = ''; for (let p = o; p && p !== scene; p = p.parent) s += (p.name || '') + '>'; return s; };
  const ident = (m) => { const e = m.elements; return e[0] === 1 && e[5] === 1 && e[10] === 1 && e[12] === 0 && e[14] === 0 && e[1] === 0 && e[2] === 0 && e[4] === 0 && e[6] === 0 && e[8] === 0 && e[9] === 0; };

  // ---- RP1C-R2 Job 1b: matrices (see the header) — `mx.on` is the A/B switch of the proof (setMtx)
  const NOOP = function () { /* RP1C: a hidden subtree keeps no matrices */ };
  const mx = { on: true, base: new Set(scene.children), era: [], len: -1, last: null, frozen: [], nFrozen: 0, nodes: 0, scanAt: -1e9, skip: 0, full: 0 };
  function mxFreeze(root) {
    const kids = root.children.slice(), f = { root, kids, n: 0 };
    for (const c of kids) { if (Object.prototype.hasOwnProperty.call(c, 'updateMatrixWorld')) continue; c.updateMatrixWorld = NOOP; f.n += 1; }
    let n = 0; for (const c of kids) c.traverse(() => n++); f.nodes = n; mx.frozen.push(f);
  }
  function mxThaw(f) { for (const c of f.kids) if (c.updateMatrixWorld === NOOP) delete c.updateMatrixWorld; }
  function mxScan() {                                                                                                // the topmost invisible nodes that have children (a hidden pool of units, a hidden prop group)
    const keep = new Set(), roots = [];
    const walk = (o) => { const ch = o.children; for (let i = 0; i < ch.length; i++) { const c = ch[i]; if (!c.visible && c.children.length && !c.userData.rpHero) roots.push(c); else if (c.children.length) walk(c); } };
    walk(scene); for (const r of roots) keep.add(r);
    for (let i = mx.frozen.length - 1; i >= 0; i--) { const f = mx.frozen[i]; if (!keep.has(f.root) || !f.root.parent) { mxThaw(f); mx.frozen.splice(i, 1); } else keep.delete(f.root); }
    for (const r of keep) mxFreeze(r);
    let n = 0; for (const f of mx.frozen) n += f.nodes; mx.nodes = n; mx.nFrozen = mx.frozen.length;
  }
  function mxTick(now) {
    if (!mx.on) return;
    for (let i = mx.frozen.length - 1; i >= 0; i--) { const f = mx.frozen[i]; if (f.root.visible || !f.root.parent) { mxThaw(f); mx.frozen.splice(i, 1); mx.nFrozen = mx.frozen.length; } }      // (the world showed it again: matrices again, before the draw)
    if (now - mx.scanAt > 2000) { mx.scanAt = now; mxScan(); }
    if (scene.matrixWorldAutoUpdate) { mx.full++; return; }
    mx.skip++;                                                                                                            // main.js left the scene's own update off for this frame: only the nodes that are new since the hero started
    const ch = scene.children;
    if (ch.length !== mx.len || ch[ch.length - 1] !== mx.last) { mx.len = ch.length; mx.last = ch[ch.length - 1]; mx.era.length = 0; for (let i = 0; i < ch.length; i++) if (!mx.base.has(ch[i])) mx.era.push(ch[i]); }
    for (let i = 0; i < mx.era.length; i++) mx.era[i].updateMatrixWorld();
  }
  function mxOff() { for (const f of mx.frozen) mxThaw(f); mx.frozen.length = 0; mx.nFrozen = mx.nodes = 0; scene.matrixWorldAutoUpdate = true; mx.len = -1; H.reach.mtx = false; }
  function setMtx(on) { mx.on = !!on; if (!on) mxOff(); else { mx.scanAt = -1e9; H.reach.mtx = st.on; } }

  // ---- which packs are taken over: spread out (the whole-map bounding sphere is what the strategic view culls by), not a crowd (their per-instance animation attributes + the diet's own radius), not a structure
  function wants(o) {
    if (!o.isInstancedMesh || o.userData.rpHero || o.userData.rpKeep || o.userData.rpProxy || o.userData.a) return false;
    const n = Math.min(o.count, (o.instanceMatrix.array.length / 16) | 0); if (n < 1) return false;
    if (STRUCT.test(pathOf(o))) return false;
    if (n > 6000) { if (st.skipped.length < 20) st.skipped.push(pathOf(o) + ' n=' + n); return false; }              // a big meadow cell: the game's own thinning (assets.js meadowLod) handles it
    if (!o.boundingSphere) o.computeBoundingSphere();
    const g = o.geometry, ti = (g.index ? g.index.count : g.attributes.position ? g.attributes.position.count : 0) / 3;
    return n > 400 || (o.boundingSphere && o.boundingSphere.radius > 40) || ti * n >= 12000;               // spread out, or a tight pack that is heavy anyway (a farm's pumpkins: 28 x 1.9 k triangles)
  }
  function make(o) {
    const g = o.geometry, cap = Math.max(o.count, (o.instanceMatrix.array.length / 16) | 0, 1), P = { o, cap, dyn: o.instanceMatrix.usage === DYN, col: !!o.instanceColor, at: [], fx: 1e9, fz: 1e9, ver: -1, cnt: -1, R: -1, root: null, views: [] };
    if (!g.boundingSphere) g.computeBoundingSphere();
    P.gr = g.boundingSphere ? g.boundingSphere.radius : 1;
    { const a = o.instanceMatrix.array, n = Math.min(o.count, (a.length / 16) | 0); let sc = 0, k = 0; for (let i = 0; i < n && k < 40; i += Math.max(1, (n / 40) | 0)) { const j = i * 16; sc += Math.max(Math.hypot(a[j], a[j + 1], a[j + 2]), Math.hypot(a[j + 4], a[j + 5], a[j + 6])); k++; } P.er = P.gr * (k ? sc / k : 1); }       // er = the real size of one copy
    P.k = Math.min(1.7, Math.max(0.65, 0.65 + P.er / 12));                                                         // a big copy (a tall tree) is seen from further away than a rock or a bush: radius = step radius x k
    P.m = Math.min(24, Math.max(1.5, P.er * 1.6));
    P.ti = (g.index ? g.index.count : g.attributes.position ? g.attributes.position.count : 0) / 3; P.heavy = P.ti >= 3000;                            // a copy of 3 k+ triangles (the attacker tents: 8.9 k) goes at the diet's heavy radius
    const inst = []; for (const k in g.attributes) if (g.attributes[k].isInstancedBufferAttribute) inst.push(k);
    P.root = o.matrixWorld; P.ident = ident(o.matrixWorld); if (!P.ident) P.inv = new T.Matrix4().copy(o.matrixWorld).invert();
    const casts = !!o.castShadow;
    for (let w = 0; w < (casts ? 2 : 1); w++) {                                                                  // view 0 = what the main pass draws, view 1 (casters only) = what the shadow pass draws
      let geo = g, attrs = [];
      if (inst.length) { geo = new T.BufferGeometry(); for (const k in g.attributes) { const a = g.attributes[k]; if (a.isInstancedBufferAttribute) { const na = new T.InstancedBufferAttribute(new Float32Array(cap * a.itemSize), a.itemSize, a.normalized, a.meshPerAttribute); na.setUsage(DYN); geo.setAttribute(k, na); attrs.push({ k, src: a, dst: na, s: a.itemSize }); } else geo.setAttribute(k, a); } if (g.index) geo.setIndex(g.index); for (const gr of g.groups) geo.addGroup(gr.start, gr.count, gr.materialIndex); geo.boundingSphere = g.boundingSphere; geo.boundingBox = g.boundingBox; }
      const px = new T.InstancedMesh(geo, o.material, cap); px.name = (o.name || 'pack') + '#rp'; px.userData.rpProxy = 1; px.userData.rpKeep = 1; px.instanceMatrix.setUsage(DYN);
      if (P.col) { px.instanceColor = new T.InstancedBufferAttribute(new Float32Array(cap * 3), 3); px.instanceColor.setUsage(DYN); }
      px.castShadow = casts && w === 1; px.receiveShadow = o.receiveShadow; px.renderOrder = o.renderOrder; px.layers.mask = o.layers.mask; px.frustumCulled = true; px.count = 0; px.visible = false;
      if (o.customDepthMaterial) px.customDepthMaterial = o.customDepthMaterial; if (o.customDistanceMaterial) px.customDistanceMaterial = o.customDistanceMaterial;
      px.position.copy(o.position); px.quaternion.copy(o.quaternion); px.scale.copy(o.scale); px.matrixAutoUpdate = o.matrixAutoUpdate; px.boundingSphere = new T.Sphere();
      o.parent.add(px); px.updateMatrixWorld(true); P.views.push({ px, attrs, sh: w === 1, R: -1 });
    }
    return P;
  }
  function drop(P) {
    for (const V of P.views) { V.px.removeFromParent(); V.px.dispose(); if (V.attrs.length) V.px.geometry.dispose(); }
    P.o.userData.rpCull = 0; st.map.delete(P.o);
  }
  function collect() {
    st.skipped.length = 0; const seen = new Set();
    scene.traverse((o) => {
      if (!o.isInstancedMesh || !o.parent) return;
      const P0 = st.map.get(o);
      if (P0) { seen.add(o); if (P0.col !== !!o.instanceColor || Math.min(o.count, (o.instanceMatrix.array.length / 16) | 0) > P0.cap) { drop(P0); o.visible = true; } else return; }
      if (!(o.visible || o.userData.rpOff === 1) || !wants(o)) return;
      if (o.userData.rpOff === 1) { o.userData.rpOff = 0; if (diet.st.mine) diet.st.mine.delete(o); }             // (the diet had hidden it: it is ours now)
      const P = make(o); o.userData.rpCull = 1; st.map.set(o, P); seen.add(o);
    });
    for (const [o, P] of st.map) if (!seen.has(o) || !o.parent) { drop(P); st.map.delete(o); }                 // (a pack the world removed / rebuilt: its proxy goes with it, the new pack is taken over on this or the next pass)
    st.list = [...st.map.values()]; st.nTaken = st.list.length;
  }

  // ---- fill the proxies of one pack with the copies within `R` of the hero (+ the hero-move margin); returns the number copied
  function fill(P, hx, hz, R) {
    const o = P.o, src = o.instanceMatrix.array, n = Math.min(o.count, (src.length / 16) | 0), cs = P.col && o.instanceColor ? o.instanceColor.array : null;
    let lx = hx, lz = hz; if (!P.ident) { mw.copy(o.matrixWorld); inv.copy(mw).invert(); v.set(hx, 0, hz).applyMatrix4(inv); lx = v.x; lz = v.z; }
    for (const V of P.views) {
      const r = (V.sh ? Math.min(R, V.R2 || R) : R) + P.m, r2 = r * r, px = V.px, dst = px.instanceMatrix.array, cd = cs ? px.instanceColor.array : null;
      let m = 0, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (let i = 0; i < n; i++) {
        const j = i * 16, x = src[j + 12], z = src[j + 14], dx = x - lx, dz = z - lz; if (dx * dx + dz * dz > r2) continue;
        const q = m * 16; for (let k = 0; k < 16; k++) dst[q + k] = src[j + k];
        if (cs) { const c = m * 3, d = i * 3; cd[c] = cs[d]; cd[c + 1] = cs[d + 1]; cd[c + 2] = cs[d + 2]; }
        for (const A of V.attrs) { const s = A.s, a = A.src.array, b = A.dst.array; for (let k = 0; k < s; k++) b[m * s + k] = a[i * s + k]; }
        const y = src[j + 13]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; m++;
      }
      px.count = m; V.n = m;
      if (m) {
        px.instanceMatrix.clearUpdateRanges(); px.instanceMatrix.addUpdateRange(0, m * 16); px.instanceMatrix.needsUpdate = true;
        if (cs) { px.instanceColor.clearUpdateRanges(); px.instanceColor.addUpdateRange(0, m * 3); px.instanceColor.needsUpdate = true; }
        for (const A of V.attrs) { A.dst.clearUpdateRanges(); A.dst.addUpdateRange(0, m * A.s); A.dst.needsUpdate = true; }
        const bs = px.boundingSphere; bs.center.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); bs.radius = 0.5 * Math.hypot(x1 - x0, y1 - y0, z1 - z0) + P.m + 1;
      }
      V.hide = !m; if (!V.sh) px.visible = m > 0;
    }
    P.fx = hx; P.fz = hz; P.ver = o.instanceMatrix.version; P.cnt = o.count; P.R = R; st.nRef++;
  }

  // ---- the shadow pass sees the shadow proxies, the main pass the main ones (WebGLShadowMap.render is wrapped for the time hero mode is on)
  function swap(shadow) {
    for (const P of st.list) { if (P.views.length < 2) continue; const a = P.views[0], b = P.views[1]; a.px.visible = !shadow && a.n > 0; b.px.visible = shadow && b.n > 0; }
  }
  function hook() {
    const sm = renderer.shadowMap; if (st.sm) return; const orig = sm.render; st.sm = { sm, orig };
    sm.render = function (...a) { if (!st.on || !(sm.enabled && (sm.autoUpdate || sm.needsUpdate))) return orig.apply(this, a); swap(true); try { return orig.apply(this, a); } finally { swap(false); } };
  }
  function unhook() { if (st.sm) { st.sm.sm.render = st.sm.orig; st.sm = null; } }

  // ---- the planned town: cut each giant chunk into cells once, hide the cells that are too far
  const sceneTown = (o) => { for (let p = o.parent; p; p = p.parent) if (p.name === 'planned-town') return true; return false; };
  function townDrop(e) { for (const c of e.cells) { c.mesh.removeFromParent(); c.geo.dispose(); } e.cells.length = 0; if (e.src.parent) e.src.visible = true; }
  function setTown(on) { st.townOff = !on; if (!on) { for (const e of st.town.values()) townDrop(e); st.town.clear(); st.nCells = st.nCellsOn = 0; } else townCollect(99); }                  // (dev / A-B: the cells off = the world's own chunks)
  function townCollect(maxN = 1) {                                                                                             // (a chunk is cut in one go: ~0.2 s for 235 k triangles; at enter() all of them — behind the loading screen — later one per pass)
    if (st.townOff) return; const seen = new Set(); let cut = 0;
    scene.traverse((o) => {
      if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || !o.parent || o.userData.rpProxy || !o.geometry || !sceneTown(o)) return;
      seen.add(o); if (st.town.has(o) || cut >= maxN) return;
      const g = o.geometry, tri = (g.index ? g.index.count : g.attributes.position.count) / 3; if (tri < 6000) return;
      if (!g.boundingBox) g.computeBoundingBox(); const bb = g.boundingBox; if (Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) < 90) return;          // a chunk that is already compact stays as it is
      o.updateWorldMatrix(true, false); if (!ident(o.matrixWorld)) return; cut++;                                                    // (the world bakes in world space; anything else is left alone)
      const parts = splitCells(T, o, 64); if (!parts || parts.length < 2) { st.town.set(o, { src: o, cells: [] }); return; }
      const e = { src: o, cells: [] };
      for (const q of parts) {
        const m = new T.Mesh(q.geo, o.material); m.name = o.name + '#cell'; m.userData.rpProxy = 1; m.userData.rpKeep = 1; m.castShadow = o.castShadow; m.receiveShadow = o.receiveShadow; m.renderOrder = o.renderOrder; m.layers.mask = o.layers.mask;
        if (o.customDepthMaterial) m.customDepthMaterial = o.customDepthMaterial; if (o.customDistanceMaterial) m.customDistanceMaterial = o.customDistanceMaterial; m.matrixAutoUpdate = o.matrixAutoUpdate;
        m.position.copy(o.position); m.quaternion.copy(o.quaternion); m.scale.copy(o.scale); m.visible = true; o.parent.add(m); m.updateMatrixWorld(true); e.cells.push({ mesh: m, geo: q.geo, x0: q.x0, x1: q.x1, z0: q.z0, z1: q.z1, on: true });
      }
      o.visible = false; st.town.set(o, e);
    });
    for (const [o, e] of st.town) if (!seen.has(o) || !o.parent) { townDrop(e); st.town.delete(o); }                         // (the world rebuilt the town: its cells go with the old chunk, the new one is cut at the next pass)
    let nc = 0; for (const e of st.town.values()) nc += e.cells.length; st.nCells = nc;
  }
  function townTick(hx, hz, R) {                                                                                           // no allocation: a loop over a few dozen cells
    let on = 0;
    for (const e of st.town.values()) {
      if (!e.cells.length) continue; if (e.src.visible) e.src.visible = false;                                              // (the world may set it again)
      for (let i = 0; i < e.cells.length; i++) {
        const c = e.cells[i], dx = hx < c.x0 ? c.x0 - hx : hx > c.x1 ? hx - c.x1 : 0, dz = hz < c.z0 ? c.z0 - hz : hz > c.z1 ? hz - c.z1 : 0, d = Math.sqrt(dx * dx + dz * dz);
        const vis = c.on ? d < R + 12 : d < R; if (vis !== c.on) { c.on = vis; c.mesh.visible = vis; } if (vis) on++;
      }
    }
    st.nCellsOn = on;
  }

  function shadowR() { const k = H.world && H.world.key; const c = k && k.shadow && k.shadow.camera; return c ? Math.max(Math.abs(c.left), Math.abs(c.right)) * 1.5 + 6 : 90; }
  function tick(now) {
    if (!st.on || S.where !== 'home') return;
    mxTick(now);
    const t0 = performance.now(); if (now - st.candAt > 4000) { collect(); townCollect(); st.candAt = now; }
    const s = STEPS[diet.st.lvl], hx = S.x, hz = S.z, rs = shadowR(), L = st.list, n = L.length; let near = 0, src = 0, nf = 0; if (st.rr >= n) st.rr = 0;
    for (let q = 0; q < n; q++) {                                                                            // round robin: a pack that is late for its refill waits for the next frame, never starves
      const P = L[(st.rr + q) % n], o = P.o; if (!o.parent) { for (const V of P.views) V.px.visible = false; continue; }                  // (the world took the pack away: its proxy goes now, the bookkeeping at the next collect)
      o.visible = false;                                              // (the world sets `visible` again when it flushes a pack: say it again just before the draw)
      let R = P.dyn ? s.hideR : s.cullR * P.k; if (P.heavy && s.hideH < R) R = s.hideH; if (P.views[1]) P.views[1].R2 = rs;
      if (Math.abs(hx - P.fx) + Math.abs(hz - P.fz) > MOVE || o.instanceMatrix.version !== P.ver || o.count !== P.cnt || R !== P.R || (P.views[1] && P.views[1].R2 !== P.rs)) {
        if (nf < 4 || performance.now() - t0 < BUDGET || Math.abs(hx - P.fx) + Math.abs(hz - P.fz) > MOVE * 2) { fill(P, hx, hz, R); P.rs = rs; nf++; } else if (st.rrNext < 0) st.rrNext = (st.rr + q) % n;   // (over budget: next frame starts here; a pack that fell 2x behind is never put off)
      }
      for (const V of P.views) if (!V.sh) near += V.n || 0; src += Math.min(o.count, 1e9);
    }
    if (st.rrNext >= 0) { st.rr = st.rrNext; st.rrNext = -1; }
    if (st.town.size) townTick(hx, hz, s.cullR * 1.35);
    st.nNear = near; st.nSrc = src; st.ms = performance.now() - t0;
  }
  function enter() { st.on = true; hook(); H.reach.mtx = mx.on; collect(); townCollect(99); st.candAt = performance.now(); }
  function exit() {
    if (!st.on) return; st.on = false; unhook(); mxOff();
    for (const P of st.list) { P.o.visible = P.o.count > 0; drop(P); } st.list = []; st.map.clear(); st.nNear = st.nSrc = st.nTaken = 0;
    for (const e of st.town.values()) townDrop(e); st.town.clear(); st.nCells = st.nCellsOn = 0;
  }
  const info = () => ({ cells: st.nCells, cellsOn: st.nCellsOn, packs: st.nTaken, near: st.nNear, src: st.nSrc, refills: st.nRef, ms: +st.ms.toFixed(2), skipped: st.skipped.slice(), mx: { on: mx.on, frozenRoots: mx.nFrozen, frozenNodes: mx.nodes, skipFrames: mx.skip, fullFrames: mx.full, era: mx.era.length } });
  return { enter, exit, tick, info, st, collect, fill, setTown, setMtx, mx };
}
