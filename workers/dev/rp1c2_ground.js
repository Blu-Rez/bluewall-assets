// rp1c2_ground.js — RP1C-R2 Job 4 (+ the measuring half of Job 5): GROUND CONTACT in the real game.  Evaluate INSIDE the game page with the hero started; window.__MODE = 'old' | 'new' (old = the kit's low-pass S.y, no road lift,
//   no leg IK;  new = rigid contact + road surface + IK).  The measuring is the mother's (workers/dev/ground_walk.py): a raycast of the VISIBLE surface (every visible non-skinned mesh) under her, walk / sprint over 14 starts,
//   a sample every 0.1 s — plus the same raycast under EACH FOOT while it is planted ("foot sink" = visible surface - sole height: > 0 means the sole is inside the ground).
//   Output: JSON  { mode, root:{n,p50,p90,p99,max,below}, onStreet:{...}, slope:{'0-10':{...},...}, feet:{...}, ik:{avgMs,maxMs} }   (all in metres; root = visible - S.y; p99 of |visible - S.y| is the acceptance number)
(async () => {
  const B = __bw, T = B.THREE, sc = B.scene, rp = __rp, S = rp.S, W = B.world, mode = window.__MODE || 'new', STEPS = +(window.__STEPS || 60);
  rp.pause(true); S.cool = 99; rp.contact(mode === 'old' ? { rigid: false, rib: false } : { rigid: true, rib: true }); rp.footOn(mode !== 'old');
  const ray = new T.Raycaster(); ray.far = 400; const down = new T.Vector3(0, -1, 0), o = new T.Vector3();
  const meshes = []; sc.updateMatrixWorld(true);
  sc.traverse((m) => { if (!m.isMesh || m.isSkinnedMesh) return; let p = m, hid = false; while (p) { if (p.visible === false) { hid = true; break; } p = p.parent; } if (hid) return; if (m.material && (m.material.transparent || m.material.depthWrite === false)) return; if (m.userData && m.userData.rpHero) return; meshes.push(m); });
  // the town's chunk meshes are millions of triangles: a ray against them in JS is ~100 ms.  For each start we cut the triangles that touch a 70 m box around it (exact world-space triangles, same material side) and ray only those.
  const gMeshes = meshes.filter((m) => m.name === 'terrain' || m.name === 'streets'); let curG = gMeshes;
  const BIG = 40000, T3 = new T.Vector3(); const pre = new Map(); let cur = meshes.slice();
  const prep = (m) => { let e = pre.get(m); if (e) return e; const g = m.geometry, P = g.attributes.position, I = g.index, n = (I ? I.count : P.count) / 3, mw = m.matrixWorld, mnx = new Float32Array(n), mxx = new Float32Array(n), mnz = new Float32Array(n), mxz = new Float32Array(n), W3 = new Float32Array(n * 9);
    for (let t = 0; t < n; t++) { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (let k = 0; k < 3; k++) { const vi = I ? I.getX(t * 3 + k) : t * 3 + k; T3.fromBufferAttribute(P, vi).applyMatrix4(mw); W3[t * 9 + k * 3] = T3.x; W3[t * 9 + k * 3 + 1] = T3.y; W3[t * 9 + k * 3 + 2] = T3.z; if (T3.x < a) a = T3.x; if (T3.x > b) b = T3.x; if (T3.z < c) c = T3.z; if (T3.z > d) d = T3.z; } mnx[t] = a; mxx[t] = b; mnz[t] = c; mxz[t] = d; }
    e = { n, mnx, mxx, mnz, mxz, W3 }; pre.set(m, e); return e; };
  const localize = (cx, cz, R) => { cur = meshes.map((m) => { const g = m.geometry; const n = (g.index ? g.index.count : g.attributes.position.count) / 3; if (m.isInstancedMesh || n < BIG) return m;
    const e = prep(m), keep = []; for (let t = 0; t < e.n; t++) if (e.mxx[t] > cx - R && e.mnx[t] < cx + R && e.mxz[t] > cz - R && e.mnz[t] < cz + R) keep.push(t);
    const arr = new Float32Array(keep.length * 9); keep.forEach((t, i) => arr.set(e.W3.subarray(t * 9, t * 9 + 9), i * 9)); const ng = new T.BufferGeometry(); ng.setAttribute('position', new T.BufferAttribute(arr, 3)); const lm = new T.Mesh(ng, m.material); lm.name = m.name; lm.matrixWorld.identity(); lm.matrixAutoUpdate = false; ng.computeBoundingSphere(); return lm; }); curG = cur.filter((m) => m.name === 'terrain' || m.name === 'streets'); };
  let lastHit = null;
  const vis = (x, z, y0, win = 1.2, list = null) => { ray.set(o.set(x, y0 + win, z), down); const hs = ray.intersectObjects(list || cur, false); let t = -1e9; lastHit = null; for (const h of hs) if (h.point.y <= y0 + win + 0.01 && h.point.y > t) { t = h.point.y; lastHit = h.object; } return t; };
  const nameOf = (m) => { if (!m) return '-'; const a = []; for (let p = m; p && a.length < 4; p = p.parent) a.push(p.name || p.type); return a.join('<'); };
  const slopeDeg = (x, z) => { const e = 1, gx = rp.baseGround(x + e, z) - rp.baseGround(x - e, z), gz = rp.baseGround(x, z + e) - rp.baseGround(x, z - e); return Math.atan(Math.hypot(gx, gz) / (2 * e)) * 57.2958; };
  const q = (a, p) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))].toFixed(4); };
  const stat = (a) => ({ n: a.length, p50: q(a, 0.5), p90: q(a, 0.9), p99: q(a, 0.99), max: a.length ? +Math.max(...a).toFixed(4) : null, min: a.length ? +Math.min(...a).toFixed(4) : null });
  // starting points: the mother's 14 spiral points + points ON the street ribbon (centres of ribbon triangles) + steep spots (found on a grid, slope 12-35°)
  const starts = []; for (let a = 0; a < 14; a++) { const ang = a * 0.9, r = 40 + a * 13; starts.push({ x: Math.cos(ang) * r, z: Math.sin(ang) * r, yaw: ang + 1.0, tag: 'spiral' }); }
  const sm = sc.getObjectByName('streets'); const sPts = [];
  if (sm) { const pos = sm.geometry.attributes.position, idx = sm.geometry.index, n = idx.count / 3, step = Math.max(1, Math.floor(n / 60)); for (let t = 0; t < n; t += step) { const i = [0, 1, 2].map((k) => idx.getX(t * 3 + k)); const x = (pos.getX(i[0]) + pos.getX(i[1]) + pos.getX(i[2])) / 3, z = (pos.getZ(i[0]) + pos.getZ(i[1]) + pos.getZ(i[2])) / 3; const dx = pos.getX(i[1]) - pos.getX(i[0]), dz = pos.getZ(i[1]) - pos.getZ(i[0]); sPts.push({ x, z, yaw: Math.atan2(dx, dz), tag: 'street', s: slopeDeg(x, z) }); } }
  sPts.sort((a, b) => b.s - a.s); const stSel = []; for (let i = 0; i < sPts.length && stSel.length < 12; i += Math.max(1, Math.floor(sPts.length / 12))) stSel.push(sPts[i]); starts.push(...stSel);
  const steep = []; for (let x = -300; x <= 300 && steep.length < 40; x += 12) for (let z = -300; z <= 300; z += 12) { const s = slopeDeg(x, z), g = rp.baseGround(x, z); if (s >= 14 && s <= 35 && g > 0.5 && W.fastHeight(x, z) > 0) steep.push({ x, z, yaw: Math.atan2(-Math.sin(0), 1), tag: 'steep', s }); }
  steep.sort((a, b) => b.s - a.s); { const pick = []; for (let i = 0; i < steep.length && pick.length < 8; i += Math.max(1, Math.floor(steep.length / 8))) pick.push(steep[i]); starts.push(...pick); }
  let nSwim = 0; const out0 = [], strict = [], fo = new T.Vector3(), root = [], onSt = [], feet = [], bySlope = { '0-10': [], '10-20': [], '20-30': [], '30-35': [] }, feetBySlope = { '0-10': [], '10-20': [], '20-30': [], '30-35': [] }, runs = [];
  const K = () => (S.hero && S.hero.ik) || null;
  for (const spr of [false, true]) for (const s0 of starts) {
    if (W.fastHeight(s0.x, s0.z) < (rp.WSURF || -0.75) + 0.5) continue;
    // a steep spot: walk UP the slope (the gradient direction); others: the start's own yaw
    let yaw = s0.yaw; if (s0.tag === 'steep') { const e = 1, gx = rp.baseGround(s0.x + e, s0.z) - rp.baseGround(s0.x - e, s0.z), gz = rp.baseGround(s0.x, s0.z + e) - rp.baseGround(s0.x, s0.z - e); yaw = Math.atan2(gx, gz); }
    rp.setPos(s0.x, s0.z, yaw); localize(s0.x, s0.z, 75); rp.setInput(0, 1); rp.sprint(spr); rp.sim(0.6, 1 / 60);
    let trav = 0, px = S.x, pz = S.z; const r = []; const f = [];
    for (let i = 0; i < STEPS; i++) {
      rp.sim(0.1, 1 / 60); const sl = slopeDeg(S.x, S.z); trav += Math.hypot(S.x - px, S.z - pz); px = S.x; pz = S.z; if (S.sw) { nSwim++; continue; }                   // (wading / swimming is not ground contact)
      const v = vis(S.x, S.z, S.y, 1.2, curG), hm = lastHit;
      if (v > -5) { const d = v - S.y; r.push(d); root.push(d); const v2 = vis(S.x, S.z, S.y, 0.45, cur); if (v2 > -5) strict.push(v2 - S.y); if (Math.abs(d) > 0.05 && out0.length < 400) out0.push({ d: +d.toFixed(2), x: +S.x.toFixed(1), z: +S.z.toFixed(1), sl: +sl.toFixed(1), tag: s0.tag, mesh: nameOf(hm), st: rp.surfAt(S.x, S.z) > -1e8 ? 1 : 0 }); if (S.where === 'home' && rp.surfAt(S.x, S.z) > -1e8) onSt.push(d); const b = sl < 10 ? '0-10' : sl < 20 ? '10-20' : sl < 30 ? '20-30' : '30-35'; if (sl <= 35) bySlope[b].push(d);
        const k = K(), g = S.hero.grp; if (k) { for (const l of k.legs) { l.ft.getWorldPosition(fo); const fx = fo.x, fy = fo.y, fz = fo.z, lf = fy - S.y - k.a0; if (lf > 0.03) continue; const vf = vis(fx, fz, S.y, 0.45, curG), sole = fy - k.a0; if (vf > -5) { const sink = vf - sole; feet.push(sink); f.push(sink); if (sl <= 35) feetBySlope[b].push(sink); } } } }
    }
    if (trav < 3) continue;
    runs.push({ spr, tag: s0.tag, x: Math.round(s0.x), z: Math.round(s0.z), trav: +trav.toFixed(0), rootMax: r.length ? +Math.max(...r).toFixed(3) : null, rootP99: q(r, 0.99), footMax: f.length ? +Math.max(...f).toFixed(3) : null, slope: +(s0.s || 0).toFixed(1) });
  }
  rp.setInput(0, 0); rp.sprint(false);
  const worst = runs.slice().sort((a, b) => (b.rootMax || 0) - (a.rootMax || 0)).slice(0, 6), absq = (a) => q(a.map(Math.abs), 0.99);
  const byMesh = {}; for (const e of out0) { const k = e.mesh + (e.d > 0 ? ' +' : ' -'); const b = byMesh[k] || (byMesh[k] = { n: 0, dMax: 0, ex: e }); b.n++; if (Math.abs(e.d) > Math.abs(b.dMax)) { b.dMax = e.d; b.ex = e; } }
  const outl = Object.entries(byMesh).sort((a, b) => b[1].n - a[1].n).slice(0, 14).map(([k, v]) => ({ mesh: k, n: v.n, dMax: v.dMax, at: [v.ex.x, v.ex.z], slope: v.ex.sl, tag: v.ex.tag, onStreet: v.ex.st }));
  const out = { mode, nSwim, outliers: outl, strict: { ...stat(strict), absP99: absq(strict), over02: strict.filter((x) => x > 0.02).length, under05: strict.filter((x) => x < -0.05).length }, runs: runs.length, starts: starts.length, root: { ...stat(root), absP99: absq(root) }, onStreet: { ...stat(onSt), absP99: absq(onSt) }, slope: {}, feet: { ...stat(feet), absP99: absq(feet) }, feetSlope: {}, worst, ik: rp.foot() };
  for (const k in bySlope) { out.slope[k] = { ...stat(bySlope[k]), absP99: absq(bySlope[k]) }; out.feetSlope[k] = { ...stat(feetBySlope[k]), p99: q(feetBySlope[k], 0.99) }; }
  rp.contact({ rigid: true, rib: true }); rp.footOn(true); rp.pause(false);
  return JSON.stringify(out);
})()
