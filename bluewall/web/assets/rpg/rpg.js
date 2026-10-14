// RP1 — owner-only hero mode.  A plain ES module that main.js loads ONLY when the owner taps the hero button (nothing of this is in the boot bundle).
//   pick a sister -> her `<key>.glb` is fetched (loader with %) -> she stands at the castle gate of the home map; joystick (left half) + look (right half) + buttons;
//   3rd-person camera behind the shoulder (pulled in by walls) or 1st person with the body visible; a glowing door at the foot of the keep -> the underworld test area (rpg_under.js) -> a portal back.
// It uses the game's own data: world.targets (castle / wall / tower / house boxes), nav (water), staticSolids (cottages, mill ...), world.fastHeight.  No game file other than main.js (3 small hooks) is touched.
const SIS = [   // the element is shown by the emblem from the owner's character sheet (e_<key>.png), not by a word; c = its accent colour
  { k: 'elina', n: 'ELINA', c: '#ff6a3a' }, { k: 'elika', n: 'ELIKA', c: '#9fe8ff' }, { k: 'melika', n: 'MELIKA', c: '#7fe06a' },
  { k: 'mobina', n: 'MOBINA', c: '#f0a666' }, { k: 'aylin', n: 'AYLIN', c: '#4fb0ff' }, { k: 'aylar', n: 'AYLAR', c: '#cfeeff' },
];
const GATE_HALF = { outer: 7.5, inner: 4.5, town: 5.2 };
const HERO_H = 1.75, MODEL_H = 0.98, SC = HERO_H / MODEL_H;
const R_BODY = 0.45, WALK = 1.18, RUN = 4.39, SPRINT_K = 1.28, STRIDE_W = 2.75, STRIDE_R = 5.49;
const GRAV = 22, JUMP_V = 7;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const wrapPi = (a) => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI; };

const CSS = `
.rp-on>*:not(canvas):not(.rp-k){visibility:hidden!important}
.rp-k{font-family:Vazirmatn,system-ui,sans-serif;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;touch-action:none}
.rp-touch{position:absolute;inset:0;z-index:40;touch-action:none}
.rp-joy{position:absolute;z-index:41;width:124px;height:124px;margin:-62px 0 0 -62px;border-radius:50%;border:1.5px solid rgba(205,214,224,.5);background:radial-gradient(circle,rgba(40,46,54,.18),rgba(20,24,30,.42));box-shadow:0 0 14px rgba(61,245,224,.22),inset 0 0 18px rgba(255,255,255,.05);pointer-events:none;display:none}
.rp-joy i{position:absolute;left:50%;top:50%;width:54px;height:54px;margin:-27px 0 0 -27px;border-radius:50%;background:radial-gradient(circle at 35% 30%,rgba(235,240,246,.75),rgba(120,130,142,.55));border:1.5px solid rgba(61,245,224,.8);box-shadow:0 0 12px rgba(61,245,224,.45)}
.rp-b{position:absolute;z-index:42;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#e6ecf2;border:1.5px solid rgba(205,214,224,.5);background:radial-gradient(circle at 50% 35%,rgba(66,74,84,.62),rgba(22,26,32,.72));box-shadow:0 0 12px rgba(61,245,224,.2),inset 0 0 14px rgba(255,255,255,.07),0 3px 10px rgba(0,0,0,.45);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);transition:transform .08s,box-shadow .12s,border-color .12s,opacity .15s}
.rp-b::after{content:"";position:absolute;inset:5px;border-radius:50%;border:1px solid rgba(205,214,224,.18)}
.rp-b svg{width:46%;height:46%;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 4px rgba(61,245,224,.7))}
.rp-b.on{transform:scale(.92);color:#3df5e0;border-color:#3df5e0;box-shadow:0 0 20px rgba(61,245,224,.65),inset 0 0 16px rgba(61,245,224,.22)}
.rp-perf{position:absolute;z-index:43;top:calc(env(safe-area-inset-top,0px) + 8px);right:8px;min-width:46px;padding:4px 7px;border-radius:7px;background:rgba(5,15,25,.62);color:#aef;font:11px/1.35 ui-monospace,Menlo,monospace;white-space:pre;direction:ltr;text-align:left}
.rp-pick{position:absolute;inset:0;z-index:90;background:radial-gradient(120% 90% at 50% 0%,#12354a 0%,#07111d 70%);display:flex;flex-direction:column;align-items:center;justify-content:safe center;color:#e8fffb;overflow:auto}
.rp-pick h2{margin:calc(env(safe-area-inset-top,0px) + 14px) 0 2px;font-size:21px;font-weight:900}
.rp-pick p{margin:0 0 10px;font-size:12px;opacity:.7}
.rp-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:30px 10px;width:min(92vw,820px);padding:6px 0 28px}
@media (orientation:landscape){.rp-grid{grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}}
.rp-card{position:relative;border-radius:15px;cursor:pointer;border:1.5px solid rgba(205,214,224,.32);background:#222;box-shadow:0 5px 16px rgba(0,0,0,.55);transition:transform .12s,box-shadow .15s,border-color .15s}
.rp-card:active,.rp-card.sel{transform:translateY(-3px);border-color:var(--ac);box-shadow:0 0 20px var(--ac),0 5px 16px rgba(0,0,0,.55)}
.rp-art{aspect-ratio:4/5;border-radius:13px;overflow:hidden}.rp-art img{display:block;width:100%;height:100%;object-fit:cover}
.rp-em{position:absolute;left:50%;bottom:-19px;width:38px;height:38px;margin-left:-19px;border-radius:50%;background:rgba(6,12,20,.92);border:1.5px solid var(--ac);box-shadow:0 0 12px var(--ac);display:flex;align-items:center;justify-content:center}
.rp-em img{width:23px;height:23px;object-fit:contain;filter:drop-shadow(0 0 4px var(--ac))}
.rp-x{position:absolute;left:12px;top:calc(env(safe-area-inset-top,0px) + 10px);width:42px;height:42px;border-radius:50%;border:1.5px solid rgba(205,214,224,.5);background:radial-gradient(circle at 50% 35%,rgba(66,74,84,.62),rgba(22,26,32,.72));box-shadow:0 0 12px rgba(61,245,224,.2);display:flex;align-items:center;justify-content:center;color:#e6ecf2;padding:0}
.rp-x svg{width:46%;height:46%;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;filter:drop-shadow(0 0 4px rgba(61,245,224,.7))}

`;

export function create(H) {
  const T = H.THREE, { renderer, scene, camera, root, ctl, world, L } = H;
  const BASE = H.base, V = H.v || '';
  const dev = !!H.dev;
  const api = { active: false, dev: {} };
  const S = {
    key: null, where: 'home', mode: 'third', paused: false, fixed: 0,
    x: 0, y: 0, z: 0, vx: 0, vz: 0, vy: 0, grounded: true, yaw: 0, pitch: 0.18, camYaw: 0, body: 0,
    st: 'loco', stT: 0, dodgeCool: 0, cool: 0, phase: 0, speed: 0, sprint: false,
    inp: { x: 0, y: 0 }, keys: new Set(), pivot: new T.Vector3(), camD: 3.6, burst: { x: 0, z: 0 },
    saved: null, models: {}, hero: null, door: null, under: null, nav: null, boxes: [], discs: [], cache: 0,
  };
  let hudEl = null, pickEl = null, perfEl = null, styleEl = null, joyEl = null, knobEl = null, btns = {};
  const stats = { f: [], t: 0, n: 0, fps: 0, p95: 0, calls: 0, tris: 0, progs: 0, pr: 0, txt: '', open: true };

  // ------------------------------------------------------------------ collision data (home map)
  const gateBoxes = (t) => {                                  // a gate target is ONE box across the whole gatehouse: the arch passage is cut out of it
    const gh = GATE_HALF[t.ringId] || 5.2, cs = Math.cos(t.rot), sn = Math.sin(t.rot), hw = t.w / 2, side = (hw - gh) / 2;
    if (side <= 0.2) return [];
    return [-1, 1].map((s) => { const c = s * (gh + side); return { x: t.x + cs * c, z: t.z - sn * c, hw: side, hd: t.d / 2, rot: t.rot, h: t.h, type: 'gate', id: t.id }; });
  };
  function refreshColliders() {
    const out = [], vis = (world.rings && world.rings.state) ? world.rings.state().vis : {};
    for (const t of world.targets || []) {
      if (t.dead || t.down || t.destroyed) continue;
      if (t.ringId && vis[t.ringId] === false) continue;
      if (t.type === 'gate') { out.push(...gateBoxes(t)); continue; }
      out.push({ x: t.x, z: t.z, hw: t.w / 2, hd: t.d / 2, rot: t.rot || 0, h: t.h || 6, type: t.type, id: t.id });
    }
    for (const b of out) { b.ux = Math.cos(b.rot); b.uz = -Math.sin(b.rot); b.vx = Math.sin(b.rot); b.vz = Math.cos(b.rot); b.R2 = (b.hw + b.hd + 2.5) ** 2; }
    S.boxes = out; S.cache = performance.now();
  }
  function ensureHome() {
    if (!S.nav) { S.nav = H.buildNav({ height: world.fastHeight, bridges: H.bridgesFromLayout(L), solids: H.staticSolids() }); S.discs = H.staticSolids(); }
    refreshColliders();
  }
  const homeGround = (x, z) => S.nav.groundY(x, z, world.fastHeight(x, z));
  const homeWorld = {
    ground: (x, z) => homeGround(x, z),
    wet: (x, z) => S.nav.isWet(x, z),
    boxes: () => S.boxes, discs: () => S.discs,
    inside: (x, z) => Math.hypot(x, z) < 335,
  };
  let underWorld = null;
  const W = () => (S.where === 'under' ? underWorld : homeWorld);

  // push a circle (radius r) out of the boxes and discs; returns true when it moved
  function pushOut(p, r, wd) {
    let moved = false;
    for (let it = 0; it < 3; it++) {
      let any = false;
      for (const b of wd.boxes()) {
        const dx = p.x - b.x, dz = p.z - b.z; if (dx * dx + dz * dz > b.R2) continue;
        const lx = dx * b.ux + dz * b.uz, lz = dx * b.vx + dz * b.vz, cx = clamp(lx, -b.hw, b.hw), cz = clamp(lz, -b.hd, b.hd), ox = lx - cx, oz = lz - cz, d2 = ox * ox + oz * oz;
        if (d2 >= r * r) continue;
        let nx, nz, pen;
        if (d2 > 1e-8) { const d = Math.sqrt(d2); nx = ox / d; nz = oz / d; pen = r - d; }
        else { const px = b.hw - Math.abs(lx), pz = b.hd - Math.abs(lz); if (px < pz) { nx = Math.sign(lx) || 1; nz = 0; pen = px + r; } else { nx = 0; nz = Math.sign(lz) || 1; pen = pz + r; } }
        p.x += (nx * b.ux + nz * b.vx) * pen; p.z += (nx * b.uz + nz * b.vz) * pen; any = true;
      }
      for (const [sx, sz, sr] of wd.discs()) {
        const dx = p.x - sx, dz = p.z - sz, rr = sr + r, d2 = dx * dx + dz * dz; if (d2 >= rr * rr) continue;
        const d = Math.sqrt(d2) || 1e-4; p.x += (dx / d) * (rr - d); p.z += (dz / d) * (rr - d); any = true;
      }
      if (!any) break; moved = true;
    }
    return moved;
  }
  // can a body stand here? (used by the reachability check and by moves)
  function free(x, z, wd = W()) { const p = { x, z }; if (wd.wet && wd.wet(x, z)) return false; if (!wd.inside(x, z)) return false; return !pushOut(p, R_BODY - 0.02, wd); }

  function tryMove(dx, dz) {
    const wd = W(); const p = { x: S.x + dx, z: S.z + dz };
    pushOut(p, R_BODY, wd);
    const [cx, cz] = wd.clampXZ ? wd.clampXZ(p.x, p.z) : [p.x, p.z]; p.x = cx; p.z = cz;
    if (wd.wet && wd.wet(p.x, p.z)) {                                                // water: slide along one axis if that one is dry
      if (!wd.wet(S.x + dx, S.z)) { p.x = S.x + dx; p.z = S.z; } else if (!wd.wet(S.x, S.z + dz)) { p.x = S.x; p.z = S.z + dz; } else { p.x = S.x; p.z = S.z; }
      pushOut(p, R_BODY, wd);
    }
    if (!wd.inside(p.x, p.z)) return;
    if (S.grounded) {                                                                // no climbing: a rise steeper than ~40 degrees stops the move
      const run = Math.hypot(p.x - S.x, p.z - S.z), rise = wd.ground(p.x, p.z) - S.y;
      if (run > 1e-4 && rise > 0.85 * run + 0.06) return;
    }
    S.x = p.x; S.z = p.z;
  }

  // ------------------------------------------------------------------ the door at the foot of the keep
  function buildDoor() {
    const k = (world.targets || []).find((t) => t.type === 'keep'); if (!k) return null;
    const cs = Math.cos(k.rot || 0), sn = Math.sin(k.rot || 0), faces = [[cs, -sn, k.w / 2], [-cs, sn, k.w / 2], [sn, cs, k.d / 2], [-sn, -cs, k.d / 2]];
    const gx = L.GATE ? L.GATE.x : 49, gz = L.GATE ? L.GATE.z : 26, tx = gx - k.x, tz = gz - k.z, tl = Math.hypot(tx, tz) || 1;
    let best = faces[0], bd = -9; for (const f of faces) { const d = (f[0] * tx + f[1] * tz) / tl; if (d > bd) { bd = d; best = f; } }
    const off = (H.doorOff != null ? H.doorOff : 0.5), nx = best[0], nz = best[1], cx = k.x + nx * (best[2] + off), cz = k.z + nz * (best[2] + off);
    const gy = homeGround(cx, cz);
    const grp = new T.Group(); grp.position.set(cx, gy, cz); grp.rotation.y = Math.atan2(nx, nz);
    const tex = (draw, w = 128, h = 256) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t; };
    const glowT = tex((g, w, h) => { const a = g.createLinearGradient(0, h, 0, 0); a.addColorStop(0, 'rgba(120,255,240,1)'); a.addColorStop(0.5, 'rgba(40,200,210,.85)'); a.addColorStop(1, 'rgba(30,120,200,.55)'); g.fillStyle = a; g.fillRect(0, 0, w, h); const b = g.createLinearGradient(0, 0, w, 0); b.addColorStop(0, 'rgba(0,0,0,.55)'); b.addColorStop(0.5, 'rgba(0,0,0,0)'); b.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = b; g.fillRect(0, 0, w, h); });
    const beamT = tex((g, w, h) => { const a = g.createLinearGradient(0, h, 0, 0); a.addColorStop(0, 'rgba(120,255,240,.9)'); a.addColorStop(1, 'rgba(120,255,240,0)'); g.fillStyle = a; g.fillRect(0, 0, w, h); }, 16, 128);
    const plane = new T.Mesh(new T.PlaneGeometry(2.7, 4.2), new T.MeshBasicMaterial({ map: glowT, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); plane.position.set(0, 2.1, 0); grp.add(plane);
    const fm = new T.MeshBasicMaterial({ color: 0x45f0dc }), dark = new T.MeshBasicMaterial({ color: 0x0a2430 });
    const post = (x, w, h, y, m = fm) => { const b = new T.Mesh(new T.BoxGeometry(w, h, 0.35), m); b.position.set(x, y, 0.05); grp.add(b); };
    post(-1.5, 0.3, 4.5, 2.25); post(1.5, 0.3, 4.5, 2.25); post(0, 3.3, 0.3, 4.4);
    for (let i = 0; i < 3; i++) { const s = new T.Mesh(new T.BoxGeometry(3.6 + i * 0.7, 0.14, 0.7), i === 2 ? fm : dark); s.position.set(0, 0.07 + (2 - i) * 0.0, 0.5 + i * 0.7); s.scale.y = 1; s.position.y = 0.07; grp.add(s); }
    const beam = new T.Mesh(new T.CylinderGeometry(1.5, 1.9, 26, 20, 1, true), new T.MeshBasicMaterial({ map: beamT, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, opacity: 0.55 })); beam.position.set(0, 13, 0.1); grp.add(beam);
    return { grp, x: cx, z: cz, y: gy, nx, nz, R: 1.7, planeMat: plane.material };
  }

  // ------------------------------------------------------------------ hero model + animation
  async function loadHero(key, lv) {
    if (S.models[key]) return S.models[key];
    const url = BASE + 'rpg/' + key + '.glb' + V;
    const res = await fetch(url); if (!res.ok) throw new Error('hero ' + res.status);
    const total = +res.headers.get('content-length') || 2.7e6; let buf;
    if (res.body && res.body.getReader) {
      const rd = res.body.getReader(), parts = []; let got = 0;
      for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; lv.progress(Math.min(0.85, (got / total) * 0.85)); }
      buf = new Uint8Array(got); let o = 0; for (const p of parts) { buf.set(p, o); o += p.length; } buf = buf.buffer;
    } else { buf = await res.arrayBuffer(); lv.progress(0.85); }
    const gltf = await H.parseGLB(buf, BASE + 'rpg/'); lv.progress(0.95, 'Preparing…');
    const model = gltf.scene, grp = new T.Group(); model.scale.setScalar(SC); grp.add(model);
    model.traverse((o) => { if (o.isMesh || o.isSkinnedMesh) { o.frustumCulled = false; o.castShadow = true; o.receiveShadow = true; } });
    const mixer = new T.AnimationMixer(model), acts = {};
    for (const n of ['idle', 'walk', 'run', 'jump', 'fall', 'land', 'dodge']) {
      const clip = gltf.animations.find((a) => a.name === n); if (!clip) { console.warn('rpg: no clip', n); continue; }
      const a = mixer.clipAction(clip); a.timeScale = 0; a.setEffectiveWeight(0); a.play(); acts[n] = { a, d: clip.duration, w: 0 };
    }
    const head = model.getObjectByName('Head') || model.getObjectByName('head');
    return (S.models[key] = { grp, model, mixer, acts, head });
  }
  const setW = (name, w) => { const o = S.hero.acts[name]; if (o) o.tw = w; };
  function animate(dt) {
    const h = S.hero, A = h.acts; if (!A.idle) return;
    for (const n in A) A[n].tw = 0;
    const v = S.speed;
    if (S.st === 'loco') {
      const wr = clamp((v - WALK) / (RUN - WALK), 0, 1), ww = v < WALK ? clamp(v / WALK, 0, 1) : 1 - wr, wi = v < WALK ? 1 - ww : 0;
      A.idle.tw = wi; if (A.walk) A.walk.tw = ww * (1 - wr); if (A.run) A.run.tw = wr;
      const rate = (A.walk ? (A.walk.tw * v / STRIDE_W) : 0) + (A.run ? (A.run.tw * v / STRIDE_R) : 0), tw = (A.walk ? A.walk.tw : 0) + (A.run ? A.run.tw : 0);
      if (tw > 0.01) S.phase = (S.phase + (rate / tw) * dt) % 1;
      if (A.walk) A.walk.a.time = S.phase * A.walk.d; if (A.run) A.run.a.time = S.phase * A.run.d;
      A.idle.a.time = (A.idle.a.time + dt) % A.idle.d;
    } else if (S.st === 'jump') { if (A.jump) { A.jump.tw = 1; A.jump.a.time = Math.min(A.jump.d - 0.001, S.stT * (A.jump.d / 0.42)); } }
    else if (S.st === 'fall') { if (A.fall) { A.fall.tw = 1; A.fall.a.time = (S.stT % A.fall.d); } }
    else if (S.st === 'land') { if (A.land) { A.land.tw = 1; A.land.a.time = Math.min(A.land.d - 0.001, S.stT * 2.2); } }
    else if (S.st === 'dodge') { if (A.dodge) { A.dodge.tw = 1; A.dodge.a.time = Math.min(A.dodge.d - 0.001, S.stT * 1.9); } }
    let sum = 0; const k = Math.min(1, dt / 0.11);
    for (const n in A) { const o = A[n]; o.w += (o.tw - o.w) * k; sum += o.w; }
    for (const n in A) { const o = A[n]; o.a.setEffectiveWeight(sum > 1e-4 ? o.w / sum : (n === 'idle' ? 1 : 0)); }
    h.mixer.update(0);
    if (S.mode === 'first' && h.head) { h.head.scale.setScalar(0.001); } else if (h.head) h.head.scale.setScalar(1);
  }

  // ------------------------------------------------------------------ one tick of the hero (physics + state)
  function update(dt) {
    if (!S.hero) return;
    const wd = W(); S.cool = Math.max(0, S.cool - dt); S.dodgeCool = Math.max(0, S.dodgeCool - dt);
    // input -> a vector (x right, y forward), 0..1
    let ix = S.inp.x, iy = S.inp.y; const K = S.keys;
    if (K.has('KeyW') || K.has('ArrowUp')) iy += 1; if (K.has('KeyS') || K.has('ArrowDown')) iy -= 1; if (K.has('KeyD')) ix += 1; if (K.has('KeyA')) ix -= 1;
    if (K.has('ArrowLeft')) S.camYaw += 1.9 * dt; if (K.has('ArrowRight')) S.camYaw -= 1.9 * dt;
    let m = Math.hypot(ix, iy); if (m > 1) { ix /= m; iy /= m; m = 1; }
    if (m < 0.1) { ix = iy = 0; m = 0; }
    const sprint = S.sprint || K.has('ShiftLeft') || K.has('ShiftRight');
    const sp = Math.sin(S.camYaw), cp = Math.cos(S.camYaw), fx = sp, fz = cp, rx = -cp, rz = sp;
    const wantX = (fx * iy + rx * ix), wantZ = (fz * iy + rz * ix);
    let target = 0; if (m > 0) target = m < 0.55 ? WALK * (m / 0.55) : WALK + (RUN - WALK) * ((m - 0.55) / 0.45); if (sprint && m > 0.5) target *= SPRINT_K;
    S.stT += dt;
    const air = !S.grounded;
    if (S.st === 'dodge') {
      const t = S.stT, sb = 1.5 + 5.0 * Math.pow(Math.max(0, 1 - t / 0.6), 2);
      S.vx = S.burst.x * sb; S.vz = S.burst.z * sb;
      if (S.stT >= 1.7 / 1.9) { S.st = 'loco'; S.stT = 0; }
    } else {
      const ml = Math.hypot(wantX, wantZ) || 1, tvx = (wantX / ml) * target, tvz = (wantZ / ml) * target, acc = (air ? 5 : 16) * dt;
      S.vx += clamp(tvx - S.vx, -acc, acc); S.vz += clamp(tvz - S.vz, -acc, acc);
    }
    // jump / dodge requests
    if (S.reqJump) { S.reqJump = false; if (S.grounded && S.st !== 'dodge') { S.vy = JUMP_V; S.grounded = false; S.st = 'jump'; S.stT = 0; } }
    if (S.reqDodge) {
      S.reqDodge = false;
      if (S.grounded && S.st !== 'dodge' && S.dodgeCool <= 0) {
        let dx = wantX, dz = wantZ; if (m < 0.1) { dx = Math.sin(S.body); dz = Math.cos(S.body); } const l = Math.hypot(dx, dz) || 1;
        S.burst = { x: dx / l, z: dz / l }; S.st = 'dodge'; S.stT = 0; S.dodgeCool = 1.0; S.body = Math.atan2(S.burst.x, S.burst.z);
      }
    }
    // horizontal move in short steps
    const sx = S.vx * dt, sz = S.vz * dt, n = Math.max(1, Math.ceil(Math.hypot(sx, sz) / 0.2));
    for (let i = 0; i < n; i++) tryMove(sx / n, sz / n);
    // vertical
    const gy = wd.ground(S.x, S.z);
    if (!S.grounded) {
      S.vy -= GRAV * dt; S.y += S.vy * dt;
      if (S.y <= gy && S.vy <= 0) { S.y = gy; S.vy = 0; S.grounded = true; if (S.st === 'jump' || S.st === 'fall') { S.st = 'land'; S.stT = 0; } }
      else if (S.st === 'jump' && S.stT > 0.42 || (S.st === 'loco' && S.y > gy + 0.6)) { if (S.st !== 'fall') { S.st = 'fall'; S.stT = 0; } }
    } else {
      if (S.y - gy > 0.35) { S.grounded = false; S.vy = 0; if (S.st === 'loco') { S.st = 'fall'; S.stT = 0; } }   // walked off an edge
      else S.y += (gy - S.y) * Math.min(1, dt * 18);
    }
    if (S.st === 'land' && (S.stT > 0.52 || (m > 0.3 && S.stT > 0.18))) { S.st = 'loco'; S.stT = 0; }
    S.speed = Math.hypot(S.vx, S.vz) * (S.st === 'loco' ? 1 : 0.0) + (S.st === 'loco' ? 0 : 0);
    if (S.st === 'loco') S.speed = Math.hypot(S.vx, S.vz); else S.speed = Math.hypot(S.vx, S.vz) * 0.0;
    // body yaw
    if (S.mode === 'first') S.body = S.camYaw;
    else if (S.st !== 'dodge' && Math.hypot(S.vx, S.vz) > 0.25) S.body += wrapPi(Math.atan2(S.vx, S.vz) - S.body) * Math.min(1, dt * 13);
    // triggers
    if (S.where === 'home' && S.door && S.cool <= 0 && S.grounded && Math.hypot(S.x - S.door.x - S.door.nx * 0.3, S.z - S.door.z - S.door.nz * 0.3) < S.door.R) goUnder();
    else if (S.where === 'under' && S.cool <= 0 && underWorld && Math.hypot(S.x - underWorld.portal.x, S.z - underWorld.portal.z) < underWorld.portal.r && S.y < underWorld.portal.y + 3) goHome();
    // place the model
    const g = S.hero.grp; g.position.set(S.x, S.y, S.z); g.rotation.y = S.body;
    animate(dt);
  }

  // ------------------------------------------------------------------ the camera
  function segHit(ax, ay, az, bx, bz, by, wd) {                           // first hit of the segment A->B with the boxes / discs / ground; returns t in 0..1 (1 = clear)
    let best = 1; const mg = 0.38;
    for (const b of wd.boxes()) {
      const mx = (ax + bx) / 2 - b.x, mz = (az + bz) / 2 - b.z, rr = (b.hw + b.hd + mg + Math.hypot(bx - ax, bz - az) / 2); if (mx * mx + mz * mz > rr * rr) continue;
      const a0x = (ax - b.x) * b.ux + (az - b.z) * b.uz, a0z = (ax - b.x) * b.vx + (az - b.z) * b.vz, d0x = (bx - ax) * b.ux + (bz - az) * b.uz, d0z = (bx - ax) * b.vx + (bz - az) * b.vz;
      let t0 = 0, t1 = 1, ok = true;
      for (const [p, d, h] of [[a0x, d0x, b.hw + mg], [a0z, d0z, b.hd + mg]]) {
        if (Math.abs(d) < 1e-7) { if (Math.abs(p) > h) ok = false; }
        else { let ta = (-h - p) / d, tb = (h - p) / d; if (ta > tb) { const q = ta; ta = tb; tb = q; } t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) ok = false; }
        if (!ok) break;
      }
      if (ok && t0 > 0 && t0 < best) { const yy = ay + (by - ay) * t0; if (yy < wd.ground(ax + (bx - ax) * t0, az + (bz - az) * t0) + b.h) best = t0; }
    }
    for (const [sx, sz, sr] of wd.discs()) {
      const dx = bx - ax, dz = bz - az, fx = ax - sx, fz = az - sz, a = dx * dx + dz * dz, b2 = 2 * (fx * dx + fz * dz), c = fx * fx + fz * fz - (sr + mg) ** 2, disc = b2 * b2 - 4 * a * c;
      if (a < 1e-8 || disc < 0 || c < 0) continue; const t = (-b2 - Math.sqrt(disc)) / (2 * a); if (t > 0 && t < best) best = t;
    }
    for (let i = 1; i <= 10; i++) { const t = i / 10; if (t >= best) break; if (ay + (by - ay) * t < wd.ground(ax + (bx - ax) * t, az + (bz - az) * t) + 0.35) { best = Math.max(0, t - 0.1); break; } }
    return best;
  }
  const tmpV = new T.Vector3();
  function placeCamera(dt) {
    const wd = W(), cy = Math.cos(S.camYaw), sy = Math.sin(S.camYaw), cp = Math.cos(S.pitch), sp = Math.sin(S.pitch);
    const vx = sy * cp, vy = -sp, vz = cy * cp, rx = -cy, rz = sy;
    if (S.mode === 'first') {
      const ex = S.x + Math.sin(S.body) * 0.17, ez = S.z + Math.cos(S.body) * 0.17, ey = S.y + 1.62;
      camera.position.set(ex, ey, ez); camera.lookAt(ex + vx, ey + vy, ez + vz);
      S.pivot.set(S.x, S.y + 1.45, S.z); return;
    }
    const k = Math.min(1, dt * 16); S.pivot.x += (S.x - S.pivot.x) * k; S.pivot.z += (S.z - S.pivot.z) * k; S.pivot.y += (S.y + 1.45 - S.pivot.y) * Math.min(1, dt * 10);
    if (dt === 0 || S.snap) { S.pivot.set(S.x, S.y + 1.45, S.z); S.snap = false; }
    const D = 3.6, sh = 0.55, px = S.pivot.x, py = S.pivot.y, pz = S.pivot.z;
    const tx = px - vx * D + rx * sh, ty = py - vy * D + 0.1, tz = pz - vz * D + rz * sh;           // wanted camera spot (behind, a little to the right)
    const t = segHit(px, py, pz, tx, tz, ty, wd), want = Math.max(0.55, t * D - 0.25);
    S.camD += (want - S.camD) * Math.min(1, dt * (want < S.camD ? 24 : 3.5)); if (dt === 0) S.camD = want;
    const dd = Math.min(S.camD, D), kk = dd / D;
    const cx = px + (tx - px) * kk, cyy = py + (ty - py) * kk, cz = pz + (tz - pz) * kk;
    camera.position.set(cx, Math.max(cyy, wd.ground(cx, cz) + 0.3), cz); camera.lookAt(camera.position.x + vx, camera.position.y + vy, camera.position.z + vz);
  }

  // ------------------------------------------------------------------ DOM: HUD, pick screen, perf overlay
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  function ensureStyle() { if (styleEl) return; styleEl = el('style'); styleEl.textContent = CSS; document.head.appendChild(styleEl); }
  function buildHud() {
    if (hudEl) return; ensureStyle();
    hudEl = el('div', 'rp-k'); hudEl.style.cssText = 'position:absolute;inset:0;z-index:40;display:none;pointer-events:none';
    const touch = el('div', 'rp-touch rp-k'); touch.style.pointerEvents = 'auto'; hudEl.appendChild(touch);
    joyEl = el('div', 'rp-joy rp-k', '<i></i>'); knobEl = joyEl.firstChild; hudEl.appendChild(joyEl);
    const ICON = {
      jump: '<svg viewBox="0 0 24 24"><path d="M6 12.5l6-6 6 6M6 19l6-6 6 6"/></svg>',
      dodge: '<svg viewBox="0 0 24 24"><path d="M19.5 12a7.5 7.5 0 1 1-2.4-5.5"/><path d="M19.8 3.6v4.2h-4.2"/><circle cx="12" cy="12" r="1.7"/><path d="M1.5 9.5h3M1 12.5h3.4M1.5 15.5h3"/></svg>',
      sprint: '<svg viewBox="0 0 24 24"><path d="M13.5 2.5L5.5 13.5h6l-1.2 8 8-11.5h-6z"/></svg>',
      cam: '<svg viewBox="0 0 24 24"><path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
      exit: '<svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
    };
    const mk = (id, css, fn, hold) => {
      const b = el('div', 'rp-b rp-k', ICON[id]); b.style.cssText = css + ';pointer-events:auto'; btns[id] = b;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); b.setPointerCapture(e.pointerId); b.classList.add('on'); fn(true); });
      const up = (e) => { e.stopPropagation(); b.classList.remove('on'); if (hold) fn(false); };
      b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
      hudEl.appendChild(b); return b;
    };
    const sb = 'calc(env(safe-area-inset-bottom,0px) + ';
    mk('jump', `right:22px;bottom:${sb}92px);width:78px;height:78px`, (d) => { if (d) S.reqJump = true; });
    mk('dodge', `right:110px;bottom:${sb}56px);width:62px;height:62px`, (d) => { if (d) S.reqDodge = true; });
    mk('sprint', `right:30px;bottom:${sb}186px);width:58px;height:58px`, (d) => { S.sprint = d; }, true);
    mk('cam', 'left:12px;top:calc(env(safe-area-inset-top,0px) + 58px);width:46px;height:46px', (d) => { if (d) setMode(S.mode === 'third' ? 'first' : 'third'); });
    mk('exit', 'left:12px;top:calc(env(safe-area-inset-top,0px) + 6px);width:42px;height:42px', (d) => { if (d) exit(); });
    perfEl = el('div', 'rp-perf rp-k'); perfEl.style.pointerEvents = 'auto'; perfEl.addEventListener('pointerdown', (e) => { e.stopPropagation(); stats.open = !stats.open; stats.txt = ''; drawPerf(); }); hudEl.appendChild(perfEl);
    // pointers: left half = joystick, right half = look
    let joy = null, lk = null; const R = 56;
    touch.addEventListener('pointerdown', (e) => {
      e.preventDefault(); touch.setPointerCapture(e.pointerId);
      if (e.clientX < innerWidth * 0.5) { if (joy) return; joy = { id: e.pointerId, x0: e.clientX, y0: e.clientY }; joyEl.style.left = e.clientX + 'px'; joyEl.style.top = e.clientY + 'px'; joyEl.style.display = 'block'; knobEl.style.transform = ''; }
      else if (!lk) lk = { id: e.pointerId, x: e.clientX, y: e.clientY };
    });
    touch.addEventListener('pointermove', (e) => {
      if (joy && e.pointerId === joy.id) { let dx = e.clientX - joy.x0, dy = e.clientY - joy.y0; const l = Math.hypot(dx, dy), c = Math.min(1, l / R); if (l > 0) { dx /= l; dy /= l; } S.inp.x = dx * c; S.inp.y = -dy * c; knobEl.style.transform = `translate(${dx * c * R * 0.8}px,${dy * c * R * 0.8}px)`; }
      else if (lk && e.pointerId === lk.id) { S.camYaw -= (e.clientX - lk.x) * 0.006; S.pitch = clamp(S.pitch + (e.clientY - lk.y) * 0.005, -0.75, 1.25); lk.x = e.clientX; lk.y = e.clientY; }
    });
    const end = (e) => { if (joy && e.pointerId === joy.id) { joy = null; S.inp.x = S.inp.y = 0; joyEl.style.display = 'none'; } else if (lk && e.pointerId === lk.id) lk = null; };
    touch.addEventListener('pointerup', end); touch.addEventListener('pointercancel', end);
    root.appendChild(hudEl);
  }
  const onKey = (e) => {
    if (!api.active) return; const c = e.code;
    if (e.type === 'keydown') {
      S.keys.add(c);
      if (c === 'Space') { S.reqJump = true; e.preventDefault(); } else if (c === 'ControlLeft' || c === 'KeyQ' || c === 'KeyE') S.reqDodge = true; else if (c === 'KeyV' || c === 'KeyC') setMode(S.mode === 'third' ? 'first' : 'third'); else if (c === 'Escape') exit();
    } else S.keys.delete(c);
  };
  function drawPerf() {
    if (!perfEl) return;
    const txt = stats.open ? `${stats.fps} fps  ${stats.p95.toFixed(1)} ms p95\ncalls ${stats.calls}  tris ${(stats.tris / 1000).toFixed(0)}k\nprogs ${stats.progs}  px ${stats.pr}\n${S.where === 'under' ? 'UNDERWORLD' : 'HOME MAP'} · ${S.mode === 'first' ? '1st' : '3rd'}` : `${stats.fps}`;
    if (txt !== stats.txt) { perfEl.textContent = txt; stats.txt = txt; }
  }
  function perfTick(dt) {
    const i = renderer.info; stats.calls = i.render.calls; stats.tris = i.render.triangles; stats.progs = (i.programs || []).length; stats.pr = +renderer.getPixelRatio().toFixed(2);
    i.reset();
    stats.f.push(dt * 1000); if (stats.f.length > 180) stats.f.shift(); stats.t += dt; stats.n++;
    if (stats.t >= 0.5) { stats.fps = Math.round(stats.n / stats.t); const s = stats.f.slice().sort((a, b) => a - b); stats.p95 = s[Math.min(s.length - 1, Math.floor(s.length * 0.95))] || 0; stats.t = 0; stats.n = 0; drawPerf(); }
  }

  function openPick() {
    if (api.active || pickEl) return; ensureStyle();
    let last = null; try { last = localStorage.getItem('bw_rpg_hero'); } catch (e) { /* storage blocked */ }
    pickEl = el('div', 'rp-pick rp-k'); pickEl.style.pointerEvents = 'auto';
    pickEl.innerHTML = '<div class="rp-grid"></div>';
    const grid = pickEl.querySelector('.rp-grid');
    for (const s of SIS) {
      const c = el('div', 'rp-card' + (s.k === last ? ' sel' : ''), `<div class="rp-art"><img alt="" src="${BASE}rpg/c_${s.k}.webp${V}"></div><div class="rp-em"><img alt="" src="${BASE}rpg/e_${s.k}.png${V}"></div>`); c.dataset.k = s.k; c.style.setProperty('--ac', s.c);
      c.addEventListener('click', () => start(s.k)); grid.appendChild(c);
    }
    const x = el('button', 'rp-x rp-k', '<svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>'); x.type = 'button'; x.addEventListener('click', closePick); pickEl.appendChild(x);
    root.appendChild(pickEl); api.pickEl = pickEl;
  }
  function closePick() { if (pickEl) { pickEl.remove(); pickEl = null; api.pickEl = null; } }

  // ------------------------------------------------------------------ enter / exit / scene switching
  let busy = false;
  async function start(key) {
    if (busy) return; busy = true;
    try { localStorage.setItem('bw_rpg_hero', key); } catch (e) { /* storage blocked */ }
    const sis = SIS.find((s) => s.k === key), lv = H.createLoadView(root, { title: sis.n, sub: 'Loading…', z: 300 }); lv.el.classList.add('rp-k'); lv.show(); lv.progress(0.02);
    try {
      ensureHome(); lv.progress(0.05);
      const m = await loadHero(key, lv);
      closePick(); enter(m, key); lv.progress(1); setTimeout(() => lv.hide(), 250);
    } catch (e) { console.warn('hero start', e); lv.setTitle('Error'); lv.progress(1, String(e && e.message || e)); setTimeout(() => lv.hide(), 1800); }
    busy = false;
  }
  function enter(m, key) {
    S.key = key; S.hero = m; ensureStyle(); buildHud();
    S.saved = { tx: ctl.target.x, ty: ctl.target.y, tz: ctl.target.z, dist: ctl.dist, azim: ctl.azim, polar: ctl.polar, near: camera.near, pos: camera.position.clone(), quat: camera.quaternion.clone(), autoReset: renderer.info.autoReset };
    ctl.vel.set(0, 0); ctl.vAz = 0; renderer.info.autoReset = false;
    camera.near = 0.3; camera.updateProjectionMatrix();
    root.classList.add('rp-on'); hudEl.style.display = 'block'; window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
    if (!S.door) S.door = buildDoor();
    if (S.door) scene.add(S.door.grp);
    // the castle gate of HIS map: just inside, facing the keep
    const G = L.GATE, k = (world.targets || []).find((t) => t.type === 'keep') || { x: 0, z: 0 };
    let sx = G.x - G.nx * 9, sz = G.z - G.nz * 9; const p = { x: sx, z: sz }; pushOut(p, R_BODY + 0.1, homeWorld);
    S.where = 'home'; underWorld = null; S.x = p.x; S.z = p.z; S.y = homeGround(S.x, S.z); S.vx = S.vz = S.vy = 0; S.grounded = true; S.st = 'loco'; S.stT = 0;
    S.camYaw = Math.atan2(k.x - S.x, k.z - S.z); S.body = S.camYaw; S.pitch = 0.2; S.snap = true; S.camD = 3.6; S.mode = 'third'; S.cool = 0.5;
    S.hero.grp.visible = true; scene.add(S.hero.grp); api.active = true; S.hero.mixer.update(0);
    if (m.head) m.head.scale.setScalar(1);
  }
  function exit() {
    if (!api.active) return;
    api.active = false; window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); S.keys.clear(); S.inp.x = S.inp.y = 0; S.sprint = false;
    const sv = S.saved; S.hero.grp.removeFromParent(); if (S.hero.head) S.hero.head.scale.setScalar(1);
    if (S.door) scene.remove(S.door.grp);
    if (sv) { ctl.target.set(sv.tx, sv.ty, sv.tz); ctl.dist = sv.dist; ctl.azim = sv.azim; ctl.polar = sv.polar; ctl.vel.set(0, 0); ctl.vAz = 0; camera.near = sv.near; camera.updateProjectionMatrix(); camera.position.copy(sv.pos); camera.quaternion.copy(sv.quat); renderer.info.autoReset = sv.autoReset; }
    S.where = 'home'; underWorld = null; hudEl.style.display = 'none'; root.classList.remove('rp-on');
    if (S.under) { S.under.dispose(); S.under = null; }
  }
  function setMode(m) { S.mode = m; if (m === 'first') { camera.near = 0.12; } else camera.near = 0.3; camera.updateProjectionMatrix(); S.snap = true; if (m === 'first') S.body = S.camYaw; }
  async function goUnder() {
    if (S.busy2) return; S.busy2 = true; S.cool = 3;
    const lv = H.createLoadView(root, { title: 'UNDERWORLD', sub: 'Descending…', z: 300 }); lv.el.classList.add('rp-k'); lv.show(); lv.progress(0.05);
    try {
      const mod = await import(/* @vite-ignore */ new URL('rpg_under.js' + (new URL(import.meta.url).search || V), import.meta.url).href); lv.progress(0.35, 'Building…'); if (dev && window.__rpHold) await new Promise((res) => setTimeout(res, window.__rpHold));
      await new Promise((r) => setTimeout(r, 30));
      const u = mod.buildUnder(T); S.under = u; lv.progress(0.7, 'Lighting…');
      u.scene.add(S.hero.grp);
      underWorld = {
        ground: (x, z) => u.hgt(x, z), boxes: () => [], discs: () => u.colliders, inside: () => true, clampXZ: u.clampXZ, portal: u.portal,
      };
      S.where = 'under'; S.x = u.spawn.x; S.z = u.spawn.z; S.y = u.hgt(S.x, S.z); S.vx = S.vz = S.vy = 0; S.grounded = true; S.st = 'loco'; S.camYaw = u.spawn.yaw; S.body = u.spawn.yaw; S.snap = true; S.camD = 3.6;
      S.hero.grp.position.set(S.x, S.y, S.z); u.update(0, 0, camera.position); placeCamera(0);
      try { if (renderer.compileAsync) await renderer.compileAsync(u.scene, camera); else renderer.compile(u.scene, camera); } catch (e) { /* first draw compiles instead */ }
      lv.progress(1); S.cool = 1.2; setTimeout(() => lv.hide(), 200);
    } catch (e) { console.warn('underworld', e); S.where = 'home'; scene.add(S.hero.grp); lv.setTitle('Error'); lv.progress(1, String(e && e.message || e)); setTimeout(() => lv.hide(), 1800); }
    S.busy2 = false;
  }
  async function goHome() {
    if (S.busy2) return; S.busy2 = true; S.cool = 3;
    const lv = H.createLoadView(root, { title: 'RETURN', sub: 'To the castle…', z: 300 }); lv.el.classList.add('rp-k'); lv.show(); lv.progress(0.3);
    await new Promise((r) => setTimeout(r, 120));
    scene.add(S.hero.grp); S.where = 'home'; underWorld = null;
    const d = S.door; if (d) { S.x = d.x + d.nx * 2.6; S.z = d.z + d.nz * 2.6; S.camYaw = Math.atan2(d.nx, d.nz); S.body = S.camYaw; } else { S.x = L.GATE.x - L.GATE.nx * 9; S.z = L.GATE.z - L.GATE.nz * 9; }
    S.y = homeGround(S.x, S.z); S.vx = S.vz = S.vy = 0; S.grounded = true; S.st = 'loco'; S.snap = true; S.camD = 3.6; S.hero.grp.position.set(S.x, S.y, S.z);
    if (S.under) { S.under.dispose(); S.under = null; }
    lv.progress(1); S.cool = 1.5; setTimeout(() => lv.hide(), 200); S.busy2 = false;
  }

  // ------------------------------------------------------------------ called by main.js every frame while active
  function frame(now, dt0) {
    let dt = S.paused ? 0 : (S.fixed || dt0);
    if (S.cache && S.where === 'home' && performance.now() - S.cache > 2500) refreshColliders();
    update(dt);
    ctl.target.set(S.x, S.y + 1, S.z);                                                                  // (the sun's shadow box follows ctl.target)
    placeCamera(dt);
    camera.updateMatrixWorld();
    if (S.where === 'under' && S.under) { S.under.fill.position.set(S.x, S.y + 2.8, S.z); S.under.update(now / 1000, dt0, camera.position); renderer.toneMappingExposure = 1.25; }
    if (btns.dodge) { btns.dodge.style.opacity = S.dodgeCool > 0 ? 0.45 : 1; btns.jump.style.opacity = S.grounded ? 1 : 0.55; }
    perfTick(dt0);
  }

  Object.defineProperty(api, 'scene', { get: () => (S.where === 'under' && S.under ? S.under.scene : scene) });
  Object.assign(api, { openPick, closePick, exit, frame, start, SIS });
  // ------------------------------------------------------------------ dev / proof API (only reachable through window.__rp in the dev page)
  api.dev = {
    S, setInput: (x, y) => { S.inp.x = x; S.inp.y = y; }, look: (dyaw, dp) => { S.camYaw += dyaw; S.pitch = clamp(S.pitch + dp, -0.75, 1.25); },
    setLook: (yaw, pitch) => { S.camYaw = yaw; if (pitch != null) S.pitch = pitch; },
    jump: () => { S.reqJump = true; }, dodge: () => { S.reqDodge = true; }, sprint: (b) => { S.sprint = !!b; }, cam: (m) => setMode(m),
    setPos: (x, z, yaw) => { S.x = x; S.z = z; S.y = W().ground(x, z); S.vx = S.vz = S.vy = 0; S.grounded = true; S.st = 'loco'; if (yaw != null) { S.camYaw = yaw; S.body = yaw; } S.snap = true; S.camD = 3.6; },
    pos: () => ({ x: S.x, y: S.y, z: S.z, yaw: S.camYaw, st: S.st, where: S.where, grounded: S.grounded, speed: S.speed, camD: S.camD }),
    sim: (sec, step = 1 / 60) => { const n = Math.round(sec / step); for (let i = 0; i < n; i++) { update(step); placeCamera(step); } },
    pause: (b) => { S.paused = !!b; }, fixed: (dt) => { S.fixed = dt; },
    goUnder, goHome, door: () => S.door && { x: S.door.x, z: S.door.z, nx: S.door.nx, nz: S.door.nz, y: S.door.y },
    boxes: () => S.boxes.length, free, W: () => W(),
    reach(cell = 1) {                                                                                   // BFS over the home map from where the hero stands: which cells can a body reach, and can it reach the door?
      const wd = homeWorld, R = 335, N = Math.ceil((R * 2) / cell), idx = (i, j) => j * N + i, seen = new Uint8Array(N * N); const x0 = -R, q = []; const ci = (v) => Math.floor((v - x0) / cell);
      const si = ci(S.x), sj = ci(S.z); q.push(si, sj); seen[idx(si, sj)] = 1; let cnt = 0, doorHit = false, hx = 0, hz = 0; const D = S.door;
      for (let h = 0; h < q.length; h += 2) {
        const i = q[h], j = q[h + 1], x = x0 + (i + 0.5) * cell, z = x0 + (j + 0.5) * cell; cnt++;
        if (D && Math.hypot(x - D.x - D.nx * 0.3, z - D.z - D.nz * 0.3) < D.R) { doorHit = true; hx = x; hz = z; }
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N || seen[idx(ni, nj)]) continue; const nx = x0 + (ni + 0.5) * cell, nz = x0 + (nj + 0.5) * cell; if (!free(nx, nz, wd)) continue; if (Math.abs(wd.ground(nx, nz) - wd.ground(x, z)) > 1.1 * cell) continue; seen[idx(ni, nj)] = 1; q.push(ni, nj); }
      }
      return { cells: cnt, doorHit, hx, hz };
    },
    walkTo(tx, tz, maxSec = 150) {                                                                      // proof: BFS path over the free cells, then walk it with the real physics (steering only)
      const wd = homeWorld, cell = 1, R = 335, N = Math.ceil((R * 2) / cell), x0 = -R, idx = (i, j) => j * N + i, ci = (v) => Math.floor((v - x0) / cell), par = new Int32Array(N * N).fill(-2);
      const si = ci(S.x), sj = ci(S.z), ti = ci(tx), tj = ci(tz); const q = [idx(si, sj)]; par[idx(si, sj)] = -1; let found = false;
      for (let h = 0; h < q.length && !found; h++) {
        const k = q[h], i = k % N, j = (k / N) | 0, x = x0 + (i + 0.5) * cell, z = x0 + (j + 0.5) * cell;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N || par[idx(ni, nj)] !== -2) continue; const nx = x0 + (ni + 0.5) * cell, nz = x0 + (nj + 0.5) * cell;
          if (!free(nx, nz, wd) || Math.abs(wd.ground(nx, nz) - wd.ground(x, z)) > 1.1 * cell || (di && dj && (!free(x + di * cell, z, wd) || !free(x, z + dj * cell, wd)))) continue;
          par[idx(ni, nj)] = k; q.push(idx(ni, nj)); if (ni === ti && nj === tj) { found = true; break; }
        }
      }
      if (!found) return { ok: false, why: 'no path' };
      const pts = []; for (let k = idx(ti, tj); k >= 0; k = par[k]) pts.push([x0 + ((k % N) + 0.5) * cell, x0 + (((k / N) | 0) + 0.5) * cell]); pts.reverse();
      let wi = 1, t = 0, chk = 2, stuck = 0, lx = S.x, lz = S.z; S.inp.x = 0;
      while (t < maxSec && wi < pts.length) {
        const look = pts[Math.min(pts.length - 1, wi + 2)], dx = look[0] - S.x, dz = look[1] - S.z; S.camYaw = Math.atan2(dx, dz); S.inp.y = 1;
        update(1 / 30); placeCamera(1 / 30); t += 1 / 30;
        while (wi < pts.length - 1 && Math.hypot(pts[wi][0] - S.x, pts[wi][1] - S.z) < 1.6) wi++;
        if (wi >= pts.length - 1 && Math.hypot(pts[pts.length - 1][0] - S.x, pts[pts.length - 1][1] - S.z) < 1.6) break;
        if (t >= chk) { chk += 2; if (Math.hypot(S.x - lx, S.z - lz) < 0.5) stuck++; else stuck = 0; lx = S.x; lz = S.z; if (stuck > 2) { S.inp.y = 0; return { ok: false, why: 'stuck', x: S.x, z: S.z, t, pathLen: pts.length }; } }
      }
      S.inp.y = 0; return { ok: Math.hypot(tx - S.x, tz - S.z) < 3, x: S.x, z: S.z, t: +t.toFixed(1), pathLen: pts.length };
    },
    start, exit, gates: () => S.boxes.filter((b) => b.type === 'gate').map((b) => [+b.x.toFixed(1), +b.z.toFixed(1), +b.hw.toFixed(1), +b.hd.toFixed(1)]),
    perf: () => ({ ...stats, f: undefined }), stats: () => (S.under ? S.under.stats() : null),
  };
  return api;
}
