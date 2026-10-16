// qa1_page.js (QA1) — evaluated INSIDE the loaded game page (rp1_dev.html).  READ-ONLY on the game: it moves the camera / the hero and reads the scene, it changes no game file.
// Defines window.QA1 = { strat(st), startHero(), place(st), checks(st), frame(), ... }.  Every function returns plain JSON.
(() => {
  const B = () => __bw, T = () => __bw.THREE, rp = () => __rp;
  const r2 = (v) => Math.round(v * 100) / 100;
  const raf = () => new Promise((r) => requestAnimationFrame(r)), wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const settle = async (n = 3, ms = 1500) => { for (let i = 0; i < n; i++) await raf(); await wait(ms); for (let i = 0; i < 2; i++) await raf(); };
  const SKIP = /cloud|bird|star|smoke|rain|snow|sky|dragon|particle|sprite|fairy|firefly|butterfl|mist|fog|aurora|moon|dust|spark|steam|vapor|ember|water-life|crowd/i;      // (v2: flags, banners, torches, glows are scanned too: their masts are tall dark poles)
  const BLD = /castle|static-tr2|pack#|tower|keep|gate|wall|church|mill|ballista|catapult|defenses|worksites|ws:|townplan|civic|homes|st1crystal|gem-pile|stable|forge|workshop|blacksmith|market|storage|vault|barn|house|hut|tent|camp/i;
  const TREE = /tree|pine|oak|fir\b|forest|bush|shrub|grass|crop|wheat|reed|flower|hedge|vine|leaf|foliage|canopy/i;

  // ---- the game loop is paused during the walk; shot() draws ONE frame by the same steps the loop takes (hero.frame -> world.update -> sun shadow box -> reflection -> composer / render) and reads the canvas
  const inHero = () => { try { return !!(rp() && rp().pos().where === 'home' && window.__qa1.hero); } catch (e) { return false; } };
  async function shot() {
    const b = B(), R = b.renderer, w = b.world, ctl = b.ctl, P = b.P();
    if (window.__qa1.hero) { for (let i = 0; i < 3; i++) rp().frame(performance.now(), 0.016); } else { for (let i = 0; i < 8; i++) ctl.update(0.03); }
    R.toneMappingExposure = P.exposure * (w.exposureMul ? w.exposureMul(false) : 1); if (b.bloom && b.bloom()) b.bloom().strength = P.bloom;
    // the game loop is paused, so b.t is frozen and every 4 Hz LOD throttle (castle cells, town cells, worksites, defences, meadow, forest) would stay at the camera of the moment of the pause: advance our own clock
    const Q = window.__qa1; Q.tt = Math.max(Q.tt || 0, b.t || 0); b.scene.matrixWorldAutoUpdate = true;
    for (let i = 0; i < 2; i++) { Q.tt += 0.6; w.update(Q.tt, 0.016, b.camera); }
    // TR2_H_R4: the town bakes ONE lazy cell mesh per world.update; after a teleport it needs ~22 updates before it leaves the far (lo) mode, so a 2-update frame always showed the far town next to the hero.  Keep updating until the town has nothing left to bake (max 90), as the running game does within ~0.4 s.
    { const TT = window.__tr2Town; if (TT) for (let i = 0; i < 90 && !(TT.idle && (TT.state.mode === 'mixed' || i > 8)); i++) { Q.tt += 0.6; w.update(Q.tt, 0.016, b.camera); } }
    const kk = w.key; if (kk && kk.shadow && kk.castShadow) { const sx = Math.round(ctl.target.x / 20) * 20, sz = Math.round(ctl.target.z / 20) * 20; kk.target.position.set(sx, 0, sz); kk.target.updateMatrixWorld(); R.shadowMap.autoUpdate = false; R.shadowMap.needsUpdate = true; }
    try { b.refl.update(0.016, { battle: false }); } catch (e) { /* no reflection on this tier */ }
    const comp = b.useComposer() ? b.composer() : null; if (comp) comp.render(); else R.render(b.scene, b.camera);
    const t0 = performance.now(); const url = R.domElement.toDataURL('image/png'); return url;
  }
  // ---- strategic camera (the real game's closest zoom = 90 m, the default azimuth); hero NOT active
  async function strat(st, dist = 90) {
    const b = B(), ctl = b.ctl, G = window.__qa1.gate;
    ctl.intro = null; ctl.dist = dist; ctl.azim = Math.atan2(G.nx, G.nz) + 0.22; ctl.target.set(st.x, 0, st.z); ctl.vel.set(0, 0); ctl.vAz = 0; ctl._los = 0;
    for (let i = 0; i < 10; i++) ctl.update(0.03);
    return { cam: b.camera.position.toArray().map(r2), tgt: ctl.target.toArray().map(r2), dist: ctl.dist };
  }
  async function startHero(key = 'elina') {
    const q = '?v=' + Date.now(); await window.__rpLoad(q); await rp().start(key); await wait(2500); const p = rp().pos(); rp().pause(true); rp().S.cool = 99; window.__qa1.hero = true;
    return { where: p.where, x: r2(p.x), z: r2(p.z) };
  }
  // ---- nearest free, dry, not too steep spot to (x,z) (spiral); the hero is put there and looks at (lx,lz)
  function standSpot(x, z) {
    const W = rp().W(), free = rp().free;
    const ok = (px, pz) => free(px, pz) && !W.wet(px, pz);
    if (ok(x, z)) return [x, z, 0];
    for (let r = 1; r <= 40; r += 1) for (let k = 0; k < Math.max(8, Math.round(r * 3)); k++) { const a = (k / Math.max(8, Math.round(r * 3))) * 6.2832, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (ok(px, pz)) return [px, pz, r]; }
    return null;
  }
  async function place(st, mode = 'third') {
    const S = rp().S, W = rp().W(), sp = standSpot(st.x, st.z); if (!sp) return { ok: false, why: 'no free spot within 40 m of ' + st.x + ',' + st.z };
    const [px, pz, moved] = sp, yaw = st.yaw != null ? st.yaw : Math.atan2((st.lx != null ? st.lx : px) - px, (st.lz != null ? st.lz : pz + 1) - pz);
    rp().cam(mode); rp().setPos(px, pz, yaw); rp().setLook(yaw, mode === 'first' ? 0.04 : 0.2); rp().sim(0.6);
    for (let i = 0; i < 4; i++) rp().sim(0.05);
    return { ok: true, x: r2(S.x), y: r2(S.y), z: r2(S.z), ground: r2(W.ground(S.x, S.z)), moved: r2(moved), yaw: r2(yaw), grounded: !!S.grounded, mode };
  }
  // ---- hero checks at the spot she stands on: inside a solid, falling, trapped, stuck on open ground, camera inside a solid (both views)
  function heroChecks() {
    const S = rp().S, W = rp().W(), free = rp().free, out = { defects: [] };
    const x0 = S.x, z0 = S.z, y0 = S.y, yaw0 = S.camYaw;
    out.insideSolid = !free(x0, z0); if (out.insideSolid) out.defects.push({ sev: 'A', what: 'hero stands inside a solid (free() = false) at the spot' });
    const g0 = W.ground(x0, z0); if (y0 < g0 - 0.3) out.defects.push({ sev: 'A', what: 'hero is ' + r2(g0 - y0) + ' m below the ground at the spot (falling / under the ground)' });
    out.cam = {}; for (const m of ['third', 'first']) { rp().cam(m); rp().sim(0.3); const c = rp().camCheck(); out.cam[m] = c; if (c.length) out.defects.push({ sev: 'A', what: m + '-person camera inside a solid: ' + c.join('+'), cam: m }); }
    rp().cam('third');
    // 8 directions x 0.8 s walk: blocked on open ground = stuck; falling; NaN
    const dirs = []; let blocked = 0, stuckOpen = [];
    for (let k = 0; k < 8; k++) {
      const a = yaw0 + (k * Math.PI) / 4; rp().setPos(x0, z0, a); rp().setLook(a, 0.2); rp().setInput(0, 1); rp().sprint(false);
      let minY = 1e9, nan = false; for (let i = 0; i < 24; i++) { rp().sim(1 / 30, 1 / 30); if (!isFinite(S.x + S.y + S.z)) { nan = true; break; } minY = Math.min(minY, S.y - W.ground(S.x, S.z)); }
      const d = Math.hypot(S.x - x0, S.z - z0), ax = x0 + Math.sin(a) * 1.2, az = z0 + Math.cos(a) * 1.2, openAhead = free(ax, az) && !W.wet(ax, az) && Math.abs(W.ground(ax, az) - g0) < 0.45;
      dirs.push({ k, d: r2(d), openAhead }); if (d < 0.3) { blocked++; if (openAhead) stuckOpen.push(k); }
      if (nan || minY < -0.8) out.defects.push({ sev: 'A', what: 'hero ' + (nan ? 'position became NaN' : 'sank ' + r2(-minY) + ' m under the ground') + ' walking direction ' + k });
      rp().setInput(0, 0);
    }
    out.walk = dirs; out.blocked = blocked;
    if (stuckOpen.length) out.defects.push({ sev: 'A', what: 'hero does not move (< 0.3 m in 0.8 s) on OPEN ground in ' + stuckOpen.length + ' of 8 directions (' + stuckOpen.join(',') + ') — stuck / invisible collider' });
    if (blocked >= 7) out.defects.push({ sev: 'A', what: 'hero is trapped: ' + blocked + ' of 8 directions blocked at the spot' });
    rp().setPos(x0, z0, yaw0); rp().setLook(yaw0, 0.2); rp().sim(0.3); rp().setInput(0, 0);
    return out;
  }
  // ---- scene scan around (cx,cz) radius R: tall things that are not buildings / trees, pole-like things, floating things, missing materials
  function scan(cx, cz, R = 70) {
    const b = B(), T_ = T(), W = b.world, sc = b.scene, out = { tall: [], pole: [], floating: [], nomat: [], count: 0 };
    const picks = (W.picks || []).map((p) => p.box), tg = (W.targets || []);
    const inBuilding = (x, z) => { for (const bx of picks) if (x > bx.min.x - 3 && x < bx.max.x + 3 && z > bx.min.z - 3 && z < bx.max.z + 3) return true; for (const t of tg) { const hw = Math.max(t.w || 0, t.d || 0) / 2 + 3; if (Math.abs(x - t.x) < hw && Math.abs(z - t.z) < hw) return true; } return false; };
    const nm = (o) => { let s = o.name || ''; for (let p = o.parent, i = 0; p && i < 7 && (i < 3 || !s || /^\(|^Object|^Mesh|^Cube|^Plane/.test(s.split('/').pop())); p = p.parent, i++) s = (p.name ? p.name + '/' : '') + s; return s || ('(' + o.type + ')'); };
    sc.updateMatrixWorld(true);
    const v = new T_.Vector3(), box = new T_.Box3(), m4 = new T_.Matrix4(), seen = {};
    const rec = (kind, o, name, x, y0, z, w, h, d) => { const key = kind + '|' + name + '|' + Math.round(x / 6) + ',' + Math.round(z / 6); if (seen[key]) { seen[key].n++; return; } const e = { name, x: r2(x), z: r2(z), y0: r2(y0), w: r2(w), h: r2(h), d: r2(d), n: 1 }; seen[key] = e; out[kind].push(e); };
    sc.traverse((o) => {
      if (!(o.isMesh || o.isInstancedMesh) || o.isSkinnedMesh || !o.geometry) return;
      let hid = false; for (let p = o; p; p = p.parent) if (p.visible === false) { hid = true; break; } if (hid) return;
      const name = nm(o); if (SKIP.test(name)) return;
      const mat = o.material; if (mat && !Array.isArray(mat) && (mat.transparent && mat.opacity < 0.9 || mat.depthWrite === false)) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const gb = o.geometry.boundingBox; if (!gb) return;
      if (mat && !Array.isArray(mat) && mat.map && mat.map.image === undefined && mat.map.isTexture === true && !mat.map.source) out.nomat.push(name);
      const n = o.isInstancedMesh ? o.count : 1;
      for (let i = 0; i < n; i++) {
        if (o.isInstancedMesh) { o.getMatrixAt(i, m4); m4.premultiply(o.matrixWorld); } else m4.copy(o.matrixWorld);
        box.copy(gb).applyMatrix4(m4); const w = box.max.x - box.min.x, d = box.max.z - box.min.z, h = box.max.y - box.min.y, x = (box.min.x + box.max.x) / 2, z = (box.min.z + box.max.z) / 2;
        if (Math.abs(x - cx) > R || Math.abs(z - cz) > R) continue; out.count++;
        if (w > 120 || d > 120) continue;                                    // terrain / sky domes / rings
        const gnd = W.fastHeight(x, z), bot = box.min.y - Math.max(gnd, 0);
        const asp = h / Math.max(0.05, Math.max(w, d)), bld = BLD.test(name);
        if (h > 4 && asp > 1.5 && !bld && !TREE.test(name) && !inBuilding(x, z)) rec('tall', o, name, x, box.min.y, z, w, h, d);
        if (h > 4 && asp > 3 && !/castle|tower|keep|gate|church|watchtower|ballista|st1crystal/i.test(name) && !TREE.test(name)) rec('pole', o, name, x, box.min.y, z, w, h, d);
        if (bot > 0.35 && Math.max(w, d, h) < 4 && !inBuilding(x, z) && !TREE.test(name)) rec('floating', o, name, x, box.min.y, z, w, h, d);
      }
    });
    out.nomat = Array.from(new Set(out.nomat)).slice(0, 10);
    for (const k of ['tall', 'pole', 'floating']) out[k].sort((a, b2) => b2.h - a.h || b2.n - a.n); out.tall = out.tall.slice(0, 25); out.pole = out.pole.slice(0, 15); out.floating = out.floating.slice(0, 15);
    return out;
  }
  // ---- what is the stuff right next to her?  Every mesh (instance) whose box is within r m of (cx,cz): name chain + material facts, so a grey blob / floating lantern / untextured block can be NAMED
  function near(cx, cz, r = 8) {
    const b = B(), T_ = T(), sc = b.scene, out = [], seen = {}; sc.updateMatrixWorld(true);
    const box = new T_.Box3(), m4 = new T_.Matrix4();
    const nm = (o) => { let s = o.name || ''; for (let p = o.parent, i = 0; p && i < 8; p = p.parent, i++) s = (p.name ? p.name + '/' : '') + s; return s || ('(' + o.type + ')'); };
    sc.traverse((o) => {
      if (!(o.isMesh || o.isInstancedMesh) || o.isSkinnedMesh || !o.geometry) return;
      let hid = false; for (let p = o; p; p = p.parent) if (p.visible === false) { hid = true; break; } if (hid) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const gb = o.geometry.boundingBox; if (!gb) return;
      const mat = Array.isArray(o.material) ? o.material[0] : o.material; const n = o.isInstancedMesh ? Math.min(o.count, 4000) : 1;
      for (let i = 0; i < n; i++) {
        if (o.isInstancedMesh) { o.getMatrixAt(i, m4); m4.premultiply(o.matrixWorld); } else m4.copy(o.matrixWorld);
        box.copy(gb).applyMatrix4(m4); const w = box.max.x - box.min.x, d = box.max.z - box.min.z, h = box.max.y - box.min.y; if (w > 60 || d > 60) continue;
        const dx = Math.max(box.min.x - cx, 0, cx - box.max.x), dz = Math.max(box.min.z - cz, 0, cz - box.max.z), dist = Math.hypot(dx, dz); if (dist > r) continue;
        const name = nm(o), key = name + '|' + Math.round((box.min.x + box.max.x) / 4) + ',' + Math.round((box.min.z + box.max.z) / 4); if (seen[key]) { seen[key].n++; continue; }
        const e = { name, type: o.type, dist: r2(dist), x: r2((box.min.x + box.max.x) / 2), z: r2((box.min.z + box.max.z) / 2), y0: r2(box.min.y), w: r2(w), h: r2(h), d: r2(d), n: 1, geo: o.geometry.type, tris: o.geometry.index ? o.geometry.index.count / 3 : (o.geometry.attributes.position ? o.geometry.attributes.position.count / 3 : 0), mat: mat ? { type: mat.type, name: mat.name || '', color: mat.color ? '#' + mat.color.getHexString() : '', map: !!mat.map, flat: !!mat.flatShading, vcol: !!mat.vertexColors, side: mat.side, tr: !!mat.transparent, op: mat.opacity } : null };
        seen[key] = e; out.push(e);
      }
    });
    out.sort((a, b2) => a.dist - b2.dist); return out.slice(0, 60);
  }
  // ---- third-person camera spring after the shot: how far behind her the camera really is (CAM_D = 3.6 normally; < 1.5 = squeezed against something)
  function camInfo() { const S = rp().S, c = B().camera.position; return { camD: r2(S.camD), dist: r2(Math.hypot(c.x - S.x, c.y - (S.y + 1.4), c.z - S.z)), base: r2(3.6) }; }
  // ---- diagnostics for a walk that got stuck: what the ground / colliders look like along the line to the target, and the game's own reach map (RP1B)
  function probeAhead(x, z, tx, tz) { const W = rp().W(), free = rp().free, l = Math.hypot(tx - x, tz - z) || 1, dx = (tx - x) / l, dz = (tz - z) / l, out = []; for (let d = 0; d <= 10; d += 0.5) { const px = x + dx * d, pz = z + dz * d; out.push([d, free(px, pz) ? 1 : 0, W.wet(px, pz) ? 1 : 0, r2(W.ground(px, pz))]); } return out; }
  function reach() { const r = rp().reachMap(2, {}); const o = Object.assign({}, r); const png = o.png; delete o.png; o.pngLen = png ? png.length : 0; o.png = png; return o; }
  // ---- z-fight probe: the same view drawn twice with a 3 cm sideways shift; static flat areas must not change except at edges (coplanar surfaces flicker in stripes / dots)
  async function zfight() {
    const b = B(), R = b.renderer, cam = b.camera, T_ = T(), cv = R.domElement, w = 422, h = 195, c2 = document.createElement('canvas'); c2.width = w; c2.height = h; const g = c2.getContext('2d', { willReadFrequently: true });
    const hg = window.__qa1.hero && rp().S.hero && rp().S.hero.grp, hv = hg ? hg.visible : true; if (hg) hg.visible = false;
    const p0 = cam.position.clone(), q0 = cam.quaternion.clone(), side = new T_.Vector3(1, 0, 0).applyQuaternion(q0), grabs = [];
    for (const s of [0, 0.03]) { cam.position.copy(p0).addScaledVector(side, s); cam.updateMatrixWorld(true); if (b.useComposer()) b.composer().render(); else R.render(b.scene, cam); g.drawImage(cv, 0, 0, w, h); const d = g.getImageData(0, 0, w, h).data, l = new Float32Array(w * h); for (let i = 0; i < w * h; i++) l[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]; grabs.push(l); }
    cam.position.copy(p0); cam.quaternion.copy(q0); cam.updateMatrixWorld(true); if (hg) hg.visible = hv;
    const A = grabs[0], Bm = grabs[1]; let n = 0, tot = 0; const cells = new Array(32).fill(0);
    for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) { const i = y * w + x; const gx = Math.abs(A[i + 1] - A[i - 1]) + Math.abs(A[i + w] - A[i - w]); if (gx > 14) continue; tot++; if (Math.abs(A[i] - Bm[i]) > 34) { n++; cells[Math.floor(y / (h / 4)) * 8 + Math.floor(x / (w / 8))]++; } }
    return { flat: tot, flicker: n, frac: +(n / Math.max(1, tot)).toFixed(5), cells };
  }
  // ---- can she walk there?  The real physics + a BFS path (rpg.js dev.walkTo) from where she stands to the spot of the station; collects the camera-inside-solid count on the way
  function walkTo(tx, tz, maxSec = 260) {
    const sp = standSpot(tx, tz); if (!sp) return { ok: false, why: 'no free spot near the target' };
    const S = rp().S; const r = rp().walkTo(sp[0], sp[1], maxSec, {}); rp().setInput(0, 0);
    return { ok: !!r.ok, why: r.why || '', t: r.t, cam: r.cam, x: r2(S.x), z: r2(S.z), target: [r2(sp[0]), r2(sp[1])] };
  }

  // ---- bridge cross-section: for a bridge {x,z,nx,nz,len,wid} the game's own free() / ground() / wet() on a grid along (n) x across (s) the deck, to see whether the parapets are colliders everywhere
  function bridgeX(b) {
    const W = rp().W(), free = rp().free, s = [-b.nz, b.nx], rows = [], half = b.wid / 2, L = b.len / 2;
    for (let al = -L - 6; al <= L + 6; al += 1) {
      let fr = '', g = [];
      for (let la = -(half + 3.5); la <= half + 3.5 + 1e-6; la += 0.5) { const px = b.x + b.nx * al + s[0] * la, pz = b.z + b.nz * al + s[1] * la; fr += free(px, pz) ? '.' : '#'; }
      for (const la of [-(half + 3), -half, 0, half, half + 3]) { const px = b.x + b.nx * al + s[0] * la, pz = b.z + b.nz * al + s[1] * la; g.push(r2(W.ground(px, pz))); }
      rows.push({ al, fr, g });
    }
    return { rows, lat0: -(half + 3.5), step: 0.5 };
  }
  // ---- trace a walk in 1 s chunks: where she is, how high, and what the ground is, each second (to see WHERE she leaves the deck)
  function trace(tx, tz, maxSec = 40) {
    const S = rp().S, W = rp().W(), out = []; let still = 0, ok = false;
    for (let t = 0; t < maxSec; t++) {
      const x0 = S.x, z0 = S.z; const r = rp().walkTo(tx, tz, 1, {}); rp().setInput(0, 0);
      out.push([t, r2(S.x), r2(S.y), r2(S.z), r2(W.ground(S.x, S.z)), !!S.grounded]);
      if (r && r.ok) { ok = true; break; }
      if (Math.hypot(S.x - x0, S.z - z0) < 0.3) { if (++still >= 4) break; } else still = 0;
    }
    return { ok, samples: out };
  }

  // ---- lateral push: stand on the deck at 3 stations along it, push straight across towards each parapet for 3 s: does she stay on the deck (blocked) or drop off the side?
  function latWalk(b) {
    const S = rp().S, W = rp().W(), out = [], sv = [-b.nz, b.nx];
    for (const al of [-0.3, 0, 0.3]) for (const sg of [1, -1]) {
      const cx = b.x + b.nx * al * b.len, cz = b.z + b.nz * al * b.len, a = Math.atan2(sv[0] * sg, sv[1] * sg);
      rp().setPos(cx, cz, a); rp().setLook(a, 0.2); rp().sim(0.5); const y0 = S.y; rp().setInput(0, 1); rp().sprint(false);
      let minY = S.y; for (let i = 0; i < 90; i++) { rp().sim(1 / 30, 1 / 30); minY = Math.min(minY, S.y); }
      const lat = (S.x - cx) * sv[0] * sg + (S.z - cz) * sv[1] * sg; rp().setInput(0, 0);
      out.push({ al, sg, y0: r2(y0), yEnd: r2(S.y), minY: r2(minY), lat: r2(lat), dropped: r2(y0 - S.y), gEnd: r2(W.ground(S.x, S.z)) });
    }
    return out;
  }

  // ---- find dark / flat-coloured bars and slabs: meshes (instances) within R of (cx,cz) whose longest side is >= minLong and whose material is unmapped or very dark: names the black things seen in frames
  function findDark(cx, cz, R = 60, minLong = 2.2) {
    const b = B(), T_ = T(), sc = b.scene, out = [], seen = {}; sc.updateMatrixWorld(true);
    const box = new T_.Box3(), m4 = new T_.Matrix4();
    const nm = (o) => { let s = o.name || ''; for (let p = o.parent, i = 0; p && i < 8; p = p.parent, i++) s = (p.name ? p.name + '/' : '') + s; return s || ('(' + o.type + ')'); };
    sc.traverse((o) => {
      if (!(o.isMesh || o.isInstancedMesh) || o.isSkinnedMesh || !o.geometry) return;
      let hid = false; for (let p = o; p; p = p.parent) if (p.visible === false) { hid = true; break; } if (hid) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const gb = o.geometry.boundingBox; if (!gb) return;
      const mat = Array.isArray(o.material) ? o.material[0] : o.material; const col = mat && mat.color ? mat.color : null; const lum = col ? 0.2126 * col.r + 0.7152 * col.g + 0.0722 * col.b : 1;
      const n = o.isInstancedMesh ? Math.min(o.count, 6000) : 1;
      for (let i = 0; i < n; i++) {
        if (o.isInstancedMesh) { o.getMatrixAt(i, m4); m4.premultiply(o.matrixWorld); } else m4.copy(o.matrixWorld);
        box.copy(gb).applyMatrix4(m4); const w = box.max.x - box.min.x, d = box.max.z - box.min.z, h = box.max.y - box.min.y; const x = (box.min.x + box.max.x) / 2, z = (box.min.z + box.max.z) / 2;
        if (!isFinite(x + z + w + d + h) || Math.hypot(x - cx, z - cz) > R || Math.max(w, d, h) < minLong || Math.max(w, d) > 60) continue;
        if (!(lum < 0.3 || !(mat && mat.map))) continue;
        const key = nm(o) + '|' + Math.round(x / 3) + ',' + Math.round(z / 3); if (seen[key]) { seen[key].n++; continue; }
        const e = { name: nm(o), x: r2(x), z: r2(z), y0: r2(box.min.y), w: r2(w), h: r2(h), d: r2(d), lum: r2(lum), map: !!(mat && mat.map), mat: mat && mat.name, n: 1 }; seen[key] = e; out.push(e);
      }
    });
    out.sort((a, b2) => (a.lum - b2.lum) || (Math.max(b2.w, b2.d) - Math.max(a.w, a.d))); return out.slice(0, 40);
  }
  window.QA1 = { v: 7, findDark, bridgeX, trace, latWalk, probeAhead, reach, camInfo, near, walkTo, shot, strat, startHero, place, heroChecks, scan, zfight, settle, standSpot, init: () => { __bw.pause(true); window.__qa1 = window.__qa1 || {}; return 'paused'; } };
  return 'QA1 ready';
})()
