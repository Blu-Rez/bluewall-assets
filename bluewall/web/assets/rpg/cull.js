// RP1C — the hero mode's spatial culling of repeated geometry.  A lazy ES module (fetched with rpg.js, owner-only; nothing of it is in the boot bundle).
// The strategic view draws every tree / rock / worker pack of the whole map with ONE call each, because the camera is high.  A walking player sees a few hundred metres, so:
//   · every spread-out InstancedMesh (trees, rocks, props, worksite life, ...) gets a lightweight PROXY: an InstancedMesh that shares the original's geometry and material (so: no new shader program) and
//     holds only the copies near the hero.  The original is hidden; the proxy is refilled when the hero has moved a few metres, and — for packs the game animates (instanceMatrix rewritten by the world,
//     seen through its `version`) — every time the game has written them.  Colours and per-instance geometry attributes are copied along.  One call per pack at most (none when nothing of it is near).
//   · a pack that casts shadows gets a second proxy for the shadow pass only (copies inside the sun's shadow box), swapped in while the shadow map is drawn: casters outside the box leave the shadow pass.
// Nothing here edits a world file; the world keeps writing its own meshes, and `exit()` puts every original back (visible, no proxy left in the scene).  The strategic view / a normal player never loads this.
const DYN = 35048;                                                                   // THREE.DynamicDrawUsage
const MOVE = 6;                                                                       // metres the hero may walk before a static pack is refilled (the scan radius carries this margin, so nothing pops inside the radius)
const BUDGET = 1.2;                                                                    // ms of refill work per frame (the rest of the late packs wait for the next frame)

export function createCull(H, S, diet) {
  const T = H.THREE, { renderer, scene } = H, STRUCT = diet.STRUCT, STEPS = diet.STEPS;
  const st = { on: false, rr: 0, rrNext: -1, list: [], map: new Map(), candAt: -1e9, nNear: 0, nSrc: 0, nTaken: 0, nRef: 0, ms: 0, skipped: [], sm: null };
  const mw = new T.Matrix4(), inv = new T.Matrix4(), v = new T.Vector3();
  const pathOf = (o) => { let s = ''; for (let p = o; p && p !== scene; p = p.parent) s += (p.name || '') + '>'; return s; };
  const ident = (m) => { const e = m.elements; return e[0] === 1 && e[5] === 1 && e[10] === 1 && e[12] === 0 && e[14] === 0 && e[1] === 0 && e[2] === 0 && e[4] === 0 && e[6] === 0 && e[8] === 0 && e[9] === 0; };

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
      o.parent.add(px); P.views.push({ px, attrs, sh: w === 1, R: -1 });
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

  function shadowR() { const k = H.world && H.world.key; const c = k && k.shadow && k.shadow.camera; return c ? Math.max(Math.abs(c.left), Math.abs(c.right)) * 1.5 + 6 : 90; }
  function tick(now) {
    if (!st.on || S.where !== 'home') return;
    const t0 = performance.now(); if (now - st.candAt > 4000) { collect(); st.candAt = now; }
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
    st.nNear = near; st.nSrc = src; st.ms = performance.now() - t0;
  }
  function enter() { st.on = true; hook(); collect(); st.candAt = performance.now(); }
  function exit() {
    if (!st.on) return; st.on = false; unhook();
    for (const P of st.list) { P.o.visible = P.o.count > 0; drop(P); } st.list = []; st.map.clear(); st.nNear = st.nSrc = st.nTaken = 0;
  }
  const info = () => ({ packs: st.nTaken, near: st.nNear, src: st.nSrc, refills: st.nRef, ms: +st.ms.toFixed(2), skipped: st.skipped.slice() });
  return { enter, exit, tick, info, st, collect, fill };
}
