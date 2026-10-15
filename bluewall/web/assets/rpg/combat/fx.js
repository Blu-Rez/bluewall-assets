// RP4 — presentation + controller.  build(ctx) is called by combat.js attach().  It owns: the sim, the hero's combat clips + sword, ONE additive ribbon mesh (slash trail, enemy telegraph wedges,
// flame-wave crescents, burst rings), ONE pooled additive Points mesh (sparks / flares / embers), camera shake, damage digits (Latin digits, DOM), the HUD, and the placeholder enemies.
// Draw calls added: sword 1 + ribbon 1 + points 1 + WC1 carry (belt / scabbard / strap mesh 1 per mount bone, <= 2; one gem per weapon, <= 2) (+ the enemies' own meshes).  Programs added: MeshBasic(vertex colours, additive) + the Points shader (+ the sword's MeshStandard = the hero's own program).
// Nothing here allocates per frame (scratch vectors / typed arrays are made once).  No PointLight (adding a light recompiles every lit material).
const PI = Math.PI, TAU = PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const wrap = (a) => { a = (a + PI) % TAU; if (a < 0) a += TAU; return a - PI; };
const QUALITY = [                                                          // setQuality(step 0..3): 0 = full ... 3 = lowest (as the governor counts); skip = enemy poses refreshed every (skip + 1)th frame, except while they wind up / strike
  { part: 1.0, trail: 1, embers: 1, shake: 1.0, skip: 0 }, { part: 0.7, trail: 1, embers: 1, shake: 1.0, skip: 0 }, { part: 0.4, trail: 1, embers: 0, shake: 0.8, skip: 1 }, { part: 0.0, trail: 0, embers: 0, shake: 0.5, skip: 2 }];

export async function build(ctx) {
  const { createSim, kit, hud: HUD, foes: FOES, under, hero, opts, ELEMENTS, TUNE, KINDS, base, v } = ctx;
  const T = opts.THREE, camera = opts.camera, scene = opts.scene || under.scene, root = opts.root, hgt = (under && under.hgt) || opts.hgt || (() => 0);
  const key = kit.id, el = ELEMENTS[kit.element], GL = el.glow, hostMove = opts.hostMove || null;
  const sim = createSim({ kit, seed: opts.seed || 1, selfMove: false, collide: null });
  const perf = { pre: 0, post: 0, frame: 0 };
  let seedF = 0x9E3779B9 ^ (opts.seed || 1); const rnd = () => { seedF ^= seedF << 13; seedF ^= seedF >>> 17; seedF ^= seedF << 5; return ((seedF >>> 0) % 100000) / 100000; };   // visual-only noise (the sim has its own seeded PRNG)
  const col = (hex) => { const c = new T.Color(hex); return [c.r, c.g, c.b]; };
  const C0 = col(el.trail[0]), C1 = col(el.trail[1]), CE = col(el.color);

  // ------------------------------------------------------------------ assets: the hero GLB's own clips (RP0B: slash_a/b/c, heavy, block ...) + the sword
  const get = async (rel) => { const r = await fetch(base + rel + (v || '')); if (!r.ok) throw new Error('RP4 asset ' + rel + ' ' + r.status); return opts.parseGLB(await r.arrayBuffer(), base + 'combat/'); };
  const weaponG = await Promise.all(kit.weapons.map((w) => get(w.url)));
  const mixer = hero.mixer, CL = {};
  const addClip = (c) => { if (!c || CL[c.name]) return; const a = mixer.clipAction(c); a.play(); a.timeScale = 0; a.setEffectiveWeight(0); CL[c.name] = { a, d: c.duration, w: 0, shared: !!(hero.acts && hero.acts[c.name] && hero.acts[c.name].a === a) }; };
  for (const n of kit.clips) { addClip((hero.clips || []).find((c) => c.name === n) || (hero.acts && hero.acts[n] && hero.acts[n].a.getClip())); if (!CL[n]) throw new Error('RP4: the hero GLB has no clip ' + n); }
  // WC1: the weapons are only LOADED here; combat/carry.js mounts them (hip / back / hand by weapon class, kit field `carry`), draws them when a fight starts, sheathes them 3 s after the last blow and sets the sister's gem (a library weapon is cut to length 1, grip centre at the origin: scale = length / model scale)
  const weapons = [];
  kit.weapons.forEach((w, i) => { const grp = new T.Group(), m = weaponG[i].scene.children[0] || weaponG[i].scene; grp.add(m); m.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = false; } }); weapons.push({ obj: grp, w }); });
  const tw0 = kit.trail ? (weapons[kit.trailWeapon] || weapons[0] || null) : null, sword = tw0 ? tw0.obj : null, WP = tw0 ? tw0.w : null;      // (the weapon that draws the trail)
  const heroMats = []; hero.model.traverse((o) => { if ((o.isMesh || o.isSkinnedMesh) && o.material && o.material.emissive) { if (!heroMats.includes(o.material)) heroMats.push(o.material); } });   // (WC1: collected BEFORE carry adds its fittings, so their materials never get the hero tint)
  const CARRY = weapons.length ? await import(/* @vite-ignore */ base + 'combat/carry.js' + (v || '')) : null;
  const carry = CARRY ? CARRY.create({ T, hero, items: weapons, emit, gem: CARRY.gemLook(T, el) }) : null;
  const foes = FOES.create({ T, scene, parseGLB: opts.parseGLB, base, v, hgt });
  const kinds = opts.kinds || ['soldier', 'beast', 'brute'];
  const foeInfo = await foes.load(kinds);

  // ------------------------------------------------------------------ the ribbon mesh (trail + telegraph + crescents + rings)
  const NT = 22, SUB = 3, NPAIR = (NT - 1) * SUB + 1, NSG = 10, TV = (NSG + 2) + 2 * (NSG + 1), NWV = 3, WV = 2 * 13, NBR = 2, BV = 2 * 29, MAXE = TUNE.enemy.max;
  const OFF_T = 0, OFF_E = NPAIR * 2, OFF_W = OFF_E + MAXE * TV, OFF_B = OFF_W + NWV * WV, NV = OFF_B + NBR * BV;
  const rp = new Float32Array(NV * 3), rc = new Float32Array(NV * 3), ri = []; const quad = (a, b, c, d) => ri.push(a, b, c, b, d, c);
  for (let i = 0; i < NPAIR - 1; i++) quad(OFF_T + i * 2, OFF_T + i * 2 + 1, OFF_T + i * 2 + 2, OFF_T + i * 2 + 3);
  for (let k = 0; k < MAXE; k++) { const b = OFF_E + k * TV; for (let i = 0; i < NSG; i++) ri.push(b, b + 1 + i, b + 2 + i); const r0 = b + NSG + 2; for (let i = 0; i < NSG; i++) quad(r0 + i * 2, r0 + i * 2 + 1, r0 + i * 2 + 2, r0 + i * 2 + 3); }
  for (let k = 0; k < NWV; k++) { const b = OFF_W + k * WV; for (let i = 0; i < 12; i++) quad(b + i * 2, b + i * 2 + 1, b + i * 2 + 2, b + i * 2 + 3); }
  for (let k = 0; k < NBR; k++) { const b = OFF_B + k * BV; for (let i = 0; i < 28; i++) quad(b + i * 2, b + i * 2 + 1, b + i * 2 + 2, b + i * 2 + 3); }
  const rg = new T.BufferGeometry(); rg.setAttribute('position', new T.BufferAttribute(rp, 3).setUsage(T.DynamicDrawUsage)); rg.setAttribute('color', new T.BufferAttribute(rc, 3).setUsage(T.DynamicDrawUsage)); rg.setIndex(ri);
  const rmat = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false, toneMapped: false });
  const ribbon = new T.Mesh(rg, rmat); ribbon.frustumCulled = false; ribbon.renderOrder = 8; ribbon.name = 'rp4_ribbon'; scene.add(ribbon);
  const wv = (i, x, y, z, r, g, b, a) => { const o = i * 3; rp[o] = x; rp[o + 1] = y; rp[o + 2] = z; rc[o] = r * a; rc[o + 1] = g * a; rc[o + 2] = b * a; };
  const zero = (i0, n) => { rp.fill(0, i0 * 3, (i0 + n) * 3); rc.fill(0, i0 * 3, (i0 + n) * 3); };

  // trail samples: ring buffer of (tip, root) world points with the time they were taken
  const tr = { x0: new Float32Array(NT), y0: new Float32Array(NT), z0: new Float32Array(NT), x1: new Float32Array(NT), y1: new Float32Array(NT), z1: new Float32Array(NT), t: new Float32Array(NT), brk: new Uint8Array(NT), n: 0, head: 0, on: false, last: -1 };
  const vTip = new T.Vector3(), vRoot = new T.Vector3();
  function trailPush(brk) {
    sword.updateWorldMatrix(true, false); vTip.set(0, WP.tip, 0).applyMatrix4(sword.matrixWorld); vRoot.set(0, WP.root, 0).applyMatrix4(sword.matrixWorld);
    const h = tr.head; tr.x0[h] = vTip.x; tr.y0[h] = vTip.y; tr.z0[h] = vTip.z; tr.x1[h] = vRoot.x; tr.y1[h] = vRoot.y; tr.z1[h] = vRoot.z; tr.t[h] = 0; tr.brk[h] = brk ? 1 : 0; tr.head = (h + 1) % NT; tr.n = Math.min(NT, tr.n + 1);
  }
  const TRAIL_LIFE = 0.26;
  const ix = (k) => ((tr.head - 1 - k) % NT + NT) % NT;                          // k-th newest sample
  const cr = (a0, a1, a2, a3, t) => { const t2 = t * t, t3 = t2 * t; return 0.5 * (2 * a1 + (a2 - a0) * t + (2 * a0 - 5 * a1 + 4 * a2 - a3) * t2 + (3 * a1 - a0 - 3 * a2 + a3) * t3); };
  function trailWrite(dt) {                                                      // Catmull-Rom through the samples (x SUB): a fast swing reads as an arc, not a polygon
    for (let i = 0; i < tr.n; i++) tr.t[i] += dt;
    let live = 0, o = 0;
    for (let k = 0; k < NT - 1; k++) {
      for (let s2 = 0; s2 < SUB; s2++, o++) {
        const i0 = OFF_T + o * 2;
        if (k >= tr.n - 1 && !(k === tr.n - 1 && s2 === 0 && tr.n > 0)) { wv(i0, 0, 0, 0, 0, 0, 0, 0); wv(i0 + 1, 0, 0, 0, 0, 0, 0, 0); continue; }
        const j1 = ix(k), j2 = ix(Math.min(k + 1, tr.n - 1)), cut = tr.brk[j1] && k + 1 < tr.n;       // sample k opened a new strip: no link to the older one
        const jA = k > 0 && !tr.brk[ix(k - 1)] ? ix(k - 1) : j1, jB = k + 2 < tr.n && !tr.brk[j2] ? ix(k + 2) : j2, t = s2 / SUB;
        const age = (tr.t[j1] + (tr.t[j2] - tr.t[j1]) * t) / TRAIL_LIFE; let a = age >= 1 ? 0 : Math.pow(1 - age, 1.4); if (cut && s2 > 0) a = 0;
        if (a <= 0) { wv(i0, 0, 0, 0, 0, 0, 0, 0); wv(i0 + 1, 0, 0, 0, 0, 0, 0, 0); continue; }
        wv(i0, cr(tr.x0[jA], tr.x0[j1], tr.x0[j2], tr.x0[jB], t), cr(tr.y0[jA], tr.y0[j1], tr.y0[j2], tr.y0[jB], t), cr(tr.z0[jA], tr.z0[j1], tr.z0[j2], tr.z0[jB], t), C1[0], C1[1], C1[2], a * 0.85);
        wv(i0 + 1, cr(tr.x1[jA], tr.x1[j1], tr.x1[j2], tr.x1[jB], t), cr(tr.y1[jA], tr.y1[j1], tr.y1[j2], tr.y1[jB], t), cr(tr.z1[jA], tr.z1[j1], tr.z1[j2], tr.z1[jB], t), C0[0], C0[1], C0[2], a * 0.12); live++;
      }
    }
    for (let i = o; i < NPAIR; i++) { const i0 = OFF_T + i * 2; wv(i0, 0, 0, 0, 0, 0, 0, 0); wv(i0 + 1, 0, 0, 0, 0, 0, 0, 0); }
    return live;
  }

  // ------------------------------------------------------------------ pooled Points: sparks, flares, embers
  const NP = 96, pp = new Float32Array(NP * 3), pc = new Float32Array(NP * 4), ps = new Float32Array(NP), pv = new Float32Array(NP * 3), pl = new Float32Array(NP), pa = new Float32Array(NP), p0 = new Float32Array(NP), pg = new Float32Array(NP), pk = new Float32Array(NP * 3);
  let pNext = 0;
  const pgeo = new T.BufferGeometry(); pgeo.setAttribute('position', new T.BufferAttribute(pp, 3).setUsage(T.DynamicDrawUsage)); pgeo.setAttribute('aCol', new T.BufferAttribute(pc, 4).setUsage(T.DynamicDrawUsage)); pgeo.setAttribute('aSize', new T.BufferAttribute(ps, 1).setUsage(T.DynamicDrawUsage));
  const pmat = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { uScale: { value: 600 }, uMax: { value: 80 } },
    vertexShader: 'attribute vec4 aCol;attribute float aSize;uniform float uScale;uniform float uMax;varying vec4 vC;void main(){vC=aCol;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*uScale/max(0.1,-mv.z),0.0,uMax);}',
    fragmentShader: 'varying vec4 vC;void main(){float d=length(gl_PointCoord-0.5)*2.0;float a=1.0-smoothstep(0.0,1.0,d);a*=a;gl_FragColor=vec4(vC.rgb*vC.a*a*2.1,1.0);}' });
  const points = new T.Points(pgeo, pmat); points.frustumCulled = false; points.renderOrder = 9; points.name = 'rp4_points'; scene.add(points);
  pa.fill(0); ps.fill(0);
  let Q = QUALITY[0], qStep = 0;
  function emit(x, y, z, vx, vy, vz, life, size, c, a, grav, drag) {
    const i = pNext; pNext = (pNext + 1) % NP; const o = i * 3;
    pp[o] = x; pp[o + 1] = y; pp[o + 2] = z; pv[o] = vx; pv[o + 1] = vy; pv[o + 2] = vz; pl[i] = life; pa[i] = 0; p0[i] = size; ps[i] = size; pg[i] = grav || 0; pk[o] = c[0]; pk[o + 1] = c[1]; pk[o + 2] = c[2]; pc[i * 4] = c[0]; pc[i * 4 + 1] = c[1]; pc[i * 4 + 2] = c[2]; pc[i * 4 + 3] = a == null ? 1 : a;
    pk[o] = c[0]; pk[o + 1] = c[1]; pk[o + 2] = c[2]; pd[i] = drag == null ? 0 : drag;
  }
  const pd = new Float32Array(NP);
  function partUpdate(dt) {
    for (let i = 0; i < NP; i++) {
      if (pl[i] <= 0) { if (ps[i] !== 0) { ps[i] = 0; pc[i * 4 + 3] = 0; } continue; }
      pa[i] += dt; const k = pa[i] / pl[i]; if (k >= 1) { pl[i] = 0; ps[i] = 0; pc[i * 4 + 3] = 0; continue; }
      const o = i * 3, dr = Math.exp(-pd[i] * dt); pv[o] *= dr; pv[o + 1] = pv[o + 1] * dr - pg[i] * dt; pv[o + 2] *= dr; pp[o] += pv[o] * dt; pp[o + 1] += pv[o + 1] * dt; pp[o + 2] += pv[o + 2] * dt;
      const fade = 1 - k; pc[i * 4 + 3] = fade * fade; ps[i] = p0[i] * (0.4 + 0.6 * fade);
    }
  }
  const nP = (n) => Math.max(0, Math.round(n * Q.part));

  // ------------------------------------------------------------------ camera shake (host adds it to ITS camera: removed at pre(), added at frame())
  let nAlert = 0; const shk = { a0: 0, t: 9, ox: 0, oy: 0, oz: 0 }, vR = new T.Vector3(), vU = new T.Vector3(), vF = new T.Vector3(), SH = { k: 0 };
  const SHAKE_T = 0.18; function shake(a) { a *= TUNE.shake * Q.shake; const cur = shk.t < SHAKE_T ? shk.a0 * Math.pow(1 - shk.t / SHAKE_T, 2) : 0; if (a > cur) { shk.a0 = a; shk.t = 0; } }
  // The camera is the host's (behind the hero).  While a fight is on it is nudged OVER THE SHOULDER (right 0.55 m, up 0.25 m, back 0.7 m: eased in 0.4 s, out 0.9 s) so her back does not hide the enemy in front of her; the shake rides on top.
  const FRAME = TUNE.frame || { right: 0.8, shift: 0.4, up: 0.3, back: 0.6 };
  function fightOn() { if (HS.hasLock || HS.state === 'atk' || HS.state === 'skill' || HS.state === 'hit' || HS.state === 'down' || HS.state === 'block') return 1; for (const e of sim.enemies) { if (e.state === 'dead' || e.passive) continue; if (e.state !== 'idle' && Math.hypot(e.x - HS.x, e.z - HS.z) < 14) return 1; } return 0; }
  const cols = under && under.colliders, BND = (under && under.BOUND) || 1e9; let frameOn = 1;
  function camBlocked(x, z) { if (x * x + z * z > (BND - 0.4) * (BND - 0.4)) return true; if (cols) for (let i = 0; i < cols.length; i++) { const c = cols[i], dx = x - c[0], dz = z - c[1], rr = c[2] + 0.4; if (dx * dx + dz * dz < rr * rr) return true; } return false; }
  function cameraApply(dt) {
    let tgt = HS.state === 'dead' ? 0 : fightOn() * frameOn;
    vR.set(1, 0, 0).applyQuaternion(camera.quaternion); vU.set(0, 1, 0).applyQuaternion(camera.quaternion); vF.set(0, 0, -1).applyQuaternion(camera.quaternion);
    // sideways: the host camera already sits 0.55 m over her right shoulder; add only what is missing to put her at FRAME.shift of the half-width left of the centre (a phone in portrait already is past that: nothing added, only up / back)
    const hx = HS.x - camera.position.x, hy = heroY + 1.2 - camera.position.y, hz = HS.z - camera.position.z, dep = hx * vF.x + hy * vF.y + hz * vF.z, lat = hx * vR.x + hy * vR.y + hz * vR.z, th = Math.tan(camera.fov * PI / 360) * camera.aspect;
    const fcur = dep > 0.5 ? -lat / (dep * th) : 0, r1 = clamp((FRAME.shift - fcur) * dep * th, 0, FRAME.right), u1 = FRAME.up, f1 = -FRAME.back; let blocked = false;
    if (tgt > 0 && camBlocked(camera.position.x + vR.x * r1 + vU.x * u1 + vF.x * f1, camera.position.z + vR.z * r1 + vU.z * u1 + vF.z * f1)) { tgt = 0; blocked = true; }   // a pillar / the cave wall would be in the way: no framing there
    SH.k += (tgt - SH.k) * Math.min(1, dt / (blocked ? 0.12 : tgt > SH.k ? 0.4 : 0.9)); if (SH.k < 0.002) SH.k = 0;
    let s = 0, c = 0; if (shk.t < SHAKE_T) { shk.t += dt; if (shk.t < SHAKE_T) { const a = shk.a0 * Math.pow(1 - shk.t / SHAKE_T, 2); s = Math.sin(shk.t * 78) * a; c = Math.cos(shk.t * 64) * a * 0.7; } }
    if (!s && !c && !SH.k) return;
    const r = r1 * SH.k + s, u = u1 * SH.k + c, f = f1 * SH.k;
    shk.ox = vR.x * r + vU.x * u + vF.x * f; shk.oy = vR.y * r + vU.y * u + vF.y * f; shk.oz = vR.z * r + vU.z * u + vF.z * f;
    camera.position.x += shk.ox; camera.position.y += shk.oy; camera.position.z += shk.oz; camera.updateMatrixWorld();
  }
  const shakeUndo = () => { if (shk.ox || shk.oy || shk.oz) { camera.position.x -= shk.ox; camera.position.y -= shk.oy; camera.position.z -= shk.oz; shk.ox = shk.oy = shk.oz = 0; } };

  // ------------------------------------------------------------------ HUD + screen projection
  const emblem = opts.emblem === undefined ? base + 'e_' + key + '.png' : opts.emblem;
  const keyq = { attack: false, dodge: false, skill1: false, skill2: false, lock: false, lockNext: false }; let blockTouch = false;
  const press = (n) => { if (n === 'lock') { if (sim.hero.hasLock && tLockT > 0 && performance.now() - tLockT < 400) keyq.lockNext = true; else keyq.lock = true; tLockT = performance.now(); } else if (n in keyq) keyq[n] = true; };
  let tLockT = 0;
  const hud = HUD.create({ root, accent: el.color, emblem, icons: kit.icons, combo: kit.combo.length, onPress: (n, down) => { if (n === 'block') blockTouch = !!down; else if (down) press(n); } });
  if (opts.btns) hud.moveHost(opts.btns);
  let W = 1, Hh = 1, wcheck = 0; const vP = new T.Vector3();
  const sizeUpd = () => { W = root.clientWidth || 1; Hh = root.clientHeight || 1; const dpr = opts.pixelRatio || (typeof devicePixelRatio === 'number' ? devicePixelRatio : 1); pmat.uniforms.uScale.value = Hh * dpr / (2 * Math.tan(camera.fov * PI / 360)); pmat.uniforms.uMax.value = Hh * dpr * 0.07; };
  sizeUpd();
  const scr = { x: 0, y: 0, on: false };
  function project(x, y, z) { vP.set(x, y, z).project(camera); scr.on = vP.z < 1 && vP.z > -1; scr.x = (vP.x * 0.5 + 0.5) * W; scr.y = (-vP.y * 0.5 + 0.5) * Hh; return scr; }

  // ------------------------------------------------------------------ the hero's pose (host animate() has already run): blend our clips over the host's
  let cw = 0, shown = '', shownT = 0, flashRed = 0, flashPerfect = 0, heroY = 0, hurtT = 0;
  const HS = sim.hero;
  function poseApply(dt) {
    const P = HS.pose; if (P.clip) { shown = P.clip; shownT = P.t; }
    const tgt = P.clip ? 1 : 0, rate = tgt > cw ? dt / 0.05 : dt / 0.14; cw = clamp(cw + clamp(tgt - cw, -rate, rate), 0, 1);
    if (cw < 0.002 && !P.clip) { cw = 0; }
    const hostA = hero.acts; let any = cw > 0.002;
    if (hostA) for (const n in hostA) { const o = hostA[n]; o.a.setEffectiveWeight(o.a.getEffectiveWeight() * (1 - cw)); }
    for (const n in CL) {
      const c = CL[n], on = any && n === shown, k = Math.min(1, dt / 0.06); c.w += ((on ? 1 : 0) - c.w) * k;
      const base0 = c.shared ? c.a.getEffectiveWeight() : 0; c.a.setEffectiveWeight(base0 + cw * c.w);
      if (on) c.a.time = Math.min(shownT, c.d - 0.001);
    }
    mixer.update(0);
  }

  // ------------------------------------------------------------------ events -> effects
  const heroPos = { x: 0, y: 0, z: 0 };
  function fxHit(e) {
    if (e.kind === 'burn') { const sb = project(e.x, e.y + 0.55, e.z); if (sb.on) hud.digit(sb.x + (rnd() - 0.5) * 20, sb.y, String(Math.round(e.dmg)), '#ff9a3a', 0.8, (rnd() - 0.5) * 20); if (Q.part > 0) emit(e.x, e.y + 0.3, e.z, 0, 1.2, 0, 0.3, 0.14, C0, 1, -1, 1); return; }
    const fin = e.kind === 'finisher', big = fin || e.kind === 'burst', pw = e.mult > 1.01 ? 1 : e.mult < 0.99 ? -1 : 0;
    const n = nP((e.kind === 'burst' ? 8 : 12) + (big ? 8 : 0));
    for (let i = 0; i < n; i++) { const sp = 3 + rnd() * 5, ang = (rnd() - 0.5) * 2.1, ca = Math.cos(ang), sa = Math.sin(ang), dx = e.a * ca - e.b * sa, dz = e.a * sa + e.b * ca; emit(e.x, e.y + (rnd() - 0.5) * 0.4, e.z, dx * sp, 1.2 + rnd() * 3.2, dz * sp, 0.22 + rnd() * 0.24, 0.11 + rnd() * 0.1, rnd() < 0.5 ? C1 : CE, 1, 9, 1.2); }
    if (Q.part > 0) emit(e.x, e.y, e.z, 0, 0, 0, 0.12, big ? 1.5 : 1.0, [1, 0.8, 0.45], 1, 0, 0);          // impact flare
    shake((big ? 0.05 : e.kind === 'proj' ? 0.03 : 0.015) * (pw > 0 ? 1.2 : 1));
    const s = project(e.x, e.y + 0.55, e.z); if (s.on) hud.digit(s.x + (rnd() - 0.5) * 26, s.y, String(Math.round(e.dmg)), pw > 0 ? '#ffd24a' : pw < 0 ? '#a9b4bf' : '#ffffff', (fin ? 1.3 : 1) * (pw > 0 ? 1.3 : pw < 0 ? 0.82 : 1), (rnd() - 0.5) * 30);
    const en = sim.enemyById(e.id); if (en) hud.target(e.hp / en.hpMax, e.hp, (ELEMENTS[en.element] || el).color);
    hud.hot(true); hotT = 0.1;
  }
  let hotT = 0;
  function onEvents() {
    const evs = sim.events;
    for (let i = 0; i < evs.length; i++) {
      const e = evs[i];
      switch (e.type) {
        case 'hit': fxHit(e); break;
        case 'kill': { const en = sim.enemyById(e.id); const c = en && ELEMENTS[en.element] ? col(ELEMENTS[en.element].color) : CE, n = nP(14); for (let k = 0; k < n; k++) { const a = rnd() * TAU, sp = 1.5 + rnd() * 3.5; emit(e.x, 0.9 + rnd() * 0.8, e.z, Math.cos(a) * sp, 1 + rnd() * 3, Math.sin(a) * sp, 0.4 + rnd() * 0.4, 0.1 + rnd() * 0.1, rnd() < 0.5 ? c : [1, 1, 1], 1, 5, 1.5); } if (Q.part > 0) emit(e.x, 1.1, e.z, 0, 0, 0, 0.16, 1.6, c, 1, 0, 0); shake(0.03); hud.targetOff(); break; }
        case 'dodge': { const n = nP(7); for (let k = 0; k < n; k++) { const a = rnd() * TAU; emit(HS.x, heroY + 0.08, HS.z, Math.cos(a) * 1.6, 0.4 + rnd(), Math.sin(a) * 1.6, 0.35, 0.16, [0.55, 0.6, 0.65], 0.7, -1, 2); } break; }
        case 'dodge-perfect': { flashPerfect = 0.35; const n = nP(14); for (let k = 0; k < n; k++) { const a = (k / 14) * TAU; emit(HS.x, heroY + 1.0, HS.z, Math.cos(a) * 4, 0.3, Math.sin(a) * 4, 0.4, 0.1, [0.5, 0.95, 1], 1, 0, 2.5); } if (Q.part > 0) emit(HS.x, heroY + 1.0, HS.z, 0, 0, 0, 0.22, 1.5, [0.5, 0.95, 1], 1, 0, 0); break; }
        case 'hero-hit': { flashRed = 0.14; hud.hurt(); shake(e.flag ? 0.05 : 0.03); const n = nP(9); for (let k = 0; k < n; k++) { const a = rnd() * TAU; emit(HS.x, heroY + 1.1, HS.z, Math.cos(a) * 3, 1 + rnd() * 2, Math.sin(a) * 3, 0.3, 0.08, [1, 0.35, 0.25], 1, 8, 1.5); } const s = project(HS.x, heroY + 1.9, HS.z); if (s.on) hud.digit(s.x, s.y, String(Math.round(e.dmg)), '#ff5a4a', 1.15, 0); break; }
        case 'burst': { burstFx.t = 0; burstFx.x = e.x; burstFx.z = e.z; burstFx.R = e.a; burstFx.yaw = e.c; burstFx.arc = e.b; burstFx.on = true; shake(0.05); const n = nP(26); for (let k = 0; k < n; k++) { const a = e.b >= TAU - 0.01 ? rnd() * TAU : (HS.yaw ? 0 : 0) + e.c + (rnd() - 0.5) * e.b, sp = 2 + rnd() * 6, ca = e.b >= TAU - 0.01 ? Math.cos(a) : Math.sin(a), sa = e.b >= TAU - 0.01 ? Math.sin(a) : Math.cos(a); emit(e.x, heroY + 0.3, e.z, ca * sp, 1 + rnd() * 4, sa * sp, 0.5 + rnd() * 0.4, 0.12 + rnd() * 0.1, rnd() < 0.5 ? C0 : C1, 1, 4, 1.2); } if (Q.part > 0) emit(e.x, heroY + 0.6, e.z, 0, 0, 0, 0.2, 2.2, C1, 1, 0, 0); break; }
        case 'swing': trailBreak = true; break;
        case 'skill': trailBreak = true; break;
        case 'proj': if (Q.part > 0) emit(e.x, heroY + 1.1, e.z, 0, 0, 0, 0.12, 1.0, C1, 1, 0, 0); break;
        case 'block': {                                                  // a blocked hit: sparks off the guard, a flare, a short shake; a broken guard is red
          const fr = e.flag, gx = HS.x + Math.sin(HS.yaw) * 0.85, gz = HS.z + Math.cos(HS.yaw) * 0.85, n = nP(fr ? 16 : 10);
          for (let k = 0; k < n; k++) { const a = HS.yaw + (rnd() - 0.5) * 2.4, sp = 2.5 + rnd() * 4; emit(gx, heroY + 1.05 + (rnd() - 0.5) * 0.5, gz, Math.sin(a) * sp, 0.6 + rnd() * 2.4, Math.cos(a) * sp, 0.18 + rnd() * 0.2, 0.09 + rnd() * 0.08, rnd() < 0.5 ? [0.78, 0.92, 1] : C1, 1, 7, 1.4); }
          if (Q.part > 0) emit(gx, heroY + 1.05, gz, 0, 0, 0, 0.14, fr ? 1.9 : 1.3, fr ? [1, 0.4, 0.3] : [0.8, 0.95, 1], 1, 0, 0);
          shake(fr ? 0.05 : 0.022);
          if (fr) { flashRed = 0.14; hud.hurt(); } else { const sb = project(HS.x, heroY + 1.9, HS.z); if (sb.on) hud.digit(sb.x + (rnd() - 0.5) * 16, sb.y, String(Math.round(e.dmg)), '#9fd8ff', 0.8, (rnd() - 0.5) * 20); }
          break; }
        case 'absorb': { const n = nP(8); for (let k = 0; k < n; k++) { const a = rnd() * TAU; emit(HS.x + Math.sin(a) * 0.5, heroY + 1.1, HS.z + Math.cos(a) * 0.5, Math.sin(a) * 2.5, 0.5 + rnd() * 1.5, Math.cos(a) * 2.5, 0.25, 0.1, [1, 1, 1], 1, 2, 1.5); } shake(0.015); const sb = project(HS.x, heroY + 1.9, HS.z); if (sb.on) hud.digit(sb.x, sb.y, String(Math.round(e.dmg)), '#dfe8ef', 0.85, 0); break; }
        case 'heal': { const n = nP(16); for (let k = 0; k < n; k++) { const a = rnd() * TAU, r = 0.3 + rnd() * 0.6; emit(HS.x + Math.cos(a) * r, heroY + 0.1 + rnd() * 0.5, HS.z + Math.sin(a) * r, 0, 1.2 + rnd() * 1.4, 0, 0.7 + rnd() * 0.4, 0.14, rnd() < 0.5 ? [0.55, 1, 0.7] : C1, 0.9, -0.5, 0.5); } if (Q.part > 0) emit(HS.x, heroY + 1.0, HS.z, 0, 0, 0, 0.2, 1.6, [0.6, 1, 0.75], 1, 0, 0); const sb = project(HS.x, heroY + 2.0, HS.z); if (sb.on) { if (e.b > 0) hud.digit(sb.x + 38, sb.y + 10, '+' + Math.round(e.a / e.b) + '/s', '#aaffd0', 0.8, 14); else hud.digit(sb.x, sb.y, '+' + Math.round(e.a), '#7dffb0', 1.1, 0); } break; }
        case 'shield': { const n = nP(16); for (let k = 0; k < n; k++) { const a = (k / 16) * TAU; emit(HS.x + Math.sin(a) * 0.9, heroY + 0.9, HS.z + Math.cos(a) * 0.9, Math.sin(a) * 0.6, 0.4, Math.cos(a) * 0.6, 0.5, 0.13, k & 1 ? [1, 1, 1] : C1, 1, 0, 1.5); } if (Q.part > 0) emit(HS.x, heroY + 1.0, HS.z, 0, 0, 0, 0.22, 1.7, [1, 1, 1], 1, 0, 0); break; }
        case 'buff': case 'stamina': { const n = nP(12), c2 = e.type === 'stamina' ? [1, 0.9, 0.4] : C1; for (let k = 0; k < n; k++) { const a = rnd() * TAU; emit(HS.x + Math.cos(a) * 0.5, heroY + 0.2, HS.z + Math.sin(a) * 0.5, 0, 1.6 + rnd() * 1.6, 0, 0.55, 0.11, rnd() < 0.5 ? c2 : C0, 1, -0.5, 0.6); } break; }
        case 'status': { const en = sim.enemyById(e.id), h = (en ? foes.heightOf(en.kind) : 1.8) * 0.55, c2 = e.kind === 'freeze' ? [0.7, 0.92, 1] : e.kind === 'burn' ? [1, 0.5, 0.15] : e.kind === 'root' ? [0.5, 1, 0.45] : [0.5, 0.75, 1], n = nP(e.kind === 'freeze' ? 14 : 8); for (let k = 0; k < n; k++) { const a = rnd() * TAU; emit(e.x + Math.cos(a) * 0.4, h + (rnd() - 0.5) * 0.8, e.z + Math.sin(a) * 0.4, Math.cos(a) * 1.6, 0.4 + rnd() * 1.2, Math.sin(a) * 1.6, 0.4, 0.1, c2, 1, 2, 1.2); } if (Q.part > 0) emit(e.x, h, e.z, 0, 0, 0, 0.18, 1.3, c2, 1, 0, 0); break; }
        case 'stagger': if (Q.part > 0) emit(e.x, 2.1, e.z, 0, 0.6, 0, 0.35, 0.55, [1, 0.9, 0.4], 1, 0, 0); break;
        case 'windup': if (Q.part > 0) { const en = sim.enemyById(e.id); emit(e.x, (en ? foes.heightOf(en.kind) : 1.8) + 0.45, e.z, 0, 0.8, 0, 0.3, 0.7, [1, 0.25, 0.15], 1, 0, 0); } break;
        default: break;
      }
    }
  }
  let trailBreak = false;
  const burstFx = { on: false, t: 0, x: 0, z: 0, R: 5, yaw: 0, arc: TAU };

  // ------------------------------------------------------------------ ribbon writers
  function telegraphWrite() {
    let k = 0;
    for (const e of sim.enemies) {
      if (k >= MAXE) break; const b = OFF_E + k * TV;
      if (e.state !== 'windup' && !(e.state === 'attack')) { continue; }
      k++; const p = e.state === 'windup' ? clamp(e.sT / e.K.tele, 0, 1) : 1, hot = e.state === 'attack', R = e.K.reach + e.r * 0.0, half = e.K.arc / 2, yaw = e.state === 'windup' && e.sT >= e.K.tele * 0.5 ? e.lockYaw : e.yaw, gy = hgt(e.x, e.z) + 0.06, rr = R * (0.15 + 0.85 * p);
      const fa = hot ? 0.8 : 0.16 + 0.34 * p, ca = hot ? [1, 0.95, 0.8] : [1, 0.22 + 0.4 * p * p, 0.12], ra = hot ? 1 : 0.55 + 0.45 * Math.sin(e.sT * 22) * p;
      wv(b, e.x, gy, e.z, ca[0], ca[1], ca[2], fa * 0.35);
      for (let i = 0; i <= NSG; i++) { const a = yaw - half + (2 * half) * (i / NSG), s = Math.sin(a), c = Math.cos(a); wv(b + 1 + i, e.x + s * rr, gy, e.z + c * rr, ca[0], ca[1], ca[2], fa); }
      const r0 = b + NSG + 2;
      for (let i = 0; i <= NSG; i++) { const a = yaw - half + (2 * half) * (i / NSG), s = Math.sin(a), c = Math.cos(a); wv(r0 + i * 2, e.x + s * R, gy, e.z + c * R, 1, 0.5, 0.35, ra * 0.9); wv(r0 + i * 2 + 1, e.x + s * (R - 0.14), gy, e.z + c * (R - 0.14), 1, 0.2, 0.1, ra * 0.5); }
    }
    for (; k < MAXE; k++) zero(OFF_E + k * TV, TV);
  }
  function waveWrite(dt) {
    let k = 0;
    for (const pr of sim.projectiles) {
      if (!pr.on) continue; const s = pr.sk, gy = hgt(pr.x, pr.z);
      if (s.vis !== 'crescent') {                                          // a bolt: a bright head + a few sparks (Points only)
        if (Q.part > 0) { emit(pr.x, gy + 1.05, pr.z, 0, 0, 0, 0.07, 0.8, C1, 1, 0, 0); if (rnd() < 0.7) emit(pr.x + (rnd() - 0.5) * 0.2, gy + 1.0 + (rnd() - 0.5) * 0.25, pr.z + (rnd() - 0.5) * 0.2, -pr.dx * 1.2 + (rnd() - 0.5) * 0.6, (rnd() - 0.5) * 0.8, -pr.dz * 1.2 + (rnd() - 0.5) * 0.6, 0.25 + rnd() * 0.15, 0.12, C0, 0.9, 0, 1.2); }
        continue;
      }
      if (k >= NWV) continue; const b = OFF_W + k * WV; k++; const dx = pr.dx, dz = pr.dz, lx = -dz, lz = dx, life = clamp(pr.t / (s.range / s.speed), 0, 1), fade = 1 - Math.pow(life, 3), Rw = s.radius;
      for (let i = 0; i < 13; i++) {
        const f = i / 12, phi = (f - 0.5) * PI * 0.96, sn = Math.sin(phi), cs = Math.cos(phi), lat = sn * Rw, up = 0.12 + cs * 0.95, fwd = -0.45 * (1 - cs) * 1.6, th = 0.38 * cs * cs;
        const ox = pr.x + lx * lat + dx * fwd, oz = pr.z + lz * lat + dz * fwd, ix = pr.x + lx * lat * 0.96 + dx * (fwd - th), iz = pr.z + lz * lat * 0.96 + dz * (fwd - th);
        wv(b + i * 2, ox, gy + up, oz, GL[0][0], GL[0][1], GL[0][2], fade * (0.25 + 0.75 * cs)); wv(b + i * 2 + 1, ix, gy + up - th * 0.9, iz, GL[1][0], GL[1][1], GL[1][2], fade * 0.55 * cs);
      }
      if (Q.embers && rnd() < 0.55) { const f = (rnd() - 0.5) * 1.7; emit(pr.x + lx * f * Rw * 0.9, gy + 0.2 + rnd() * 0.9, pr.z + lz * f * Rw * 0.9, -dx * 0.8 + (rnd() - 0.5), 0.8 + rnd() * 1.4, -dz * 0.8 + (rnd() - 0.5), 0.35 + rnd() * 0.3, 0.1 + rnd() * 0.08, rnd() < 0.5 ? C0 : C1, 1, -1.5, 0.8); }
    }
    for (; k < NWV; k++) zero(OFF_W + k * WV, WV);
  }
  function burstWrite(dt) {
    zero(OFF_B, NBR * BV); if (!burstFx.on) return; burstFx.t += dt; const t = burstFx.t, D = 0.55; if (t >= D) { burstFx.on = false; return; }
    const k = t / D, gy = hgt(burstFx.x, burstFx.z) + 0.08;
    for (let r = 0; r < NBR; r++) { const b = OFF_B + r * BV, kk = clamp(k * (r ? 0.8 : 1), 0, 1), R = burstFx.R * (1 - Math.pow(1 - kk, 2.6)), w = (r ? 0.28 : 0.6) * (1 - kk) + 0.12, a = Math.pow(1 - kk, 1.1) * (r ? 0.6 : 1);
      for (let i = 0; i < 29; i++) { const an = burstFx.yaw - burstFx.arc / 2 + (i / 28) * burstFx.arc, s = Math.sin(an), c = Math.cos(an); wv(b + i * 2, burstFx.x + s * R, gy, burstFx.z + c * R, GL[0][0], GL[0][1], GL[0][2], a); wv(b + i * 2 + 1, burstFx.x + s * Math.max(0, R - w), gy, burstFx.z + c * Math.max(0, R - w), GL[1][0], GL[1][1], GL[1][2], a * 0.6); } }
  }

  // ------------------------------------------------------------------ the controller
  const mv = { x: 0, z: 0 }, inp = { mx: 0, mz: 0, camYaw: 0, block: false, attack: false, dodge: false, skill1: false, skill2: false, lock: false, lockNext: false };
  let deadT = 0, wasBusy = false, enabled = true, spawnN = opts.spawn | 0;
  const ctrl = {
    sim, foes, hud, carry, VERSION: ctx.VERSION, quality: 3, info: { foes: foeInfo },
    /** host frame, BEFORE the host moves the hero.  S = the host's state { x, y, z, body, camYaw, st, grounded }; (wantX, wantZ) = the stick in world space, m = its length 0..1.  Returns true while the sim owns the hero (attack / roll / hurt / skill): the host must not move or turn her */
    pre(dt, S, wantX, wantZ, m) {
      const t0 = performance.now(); shakeUndo(); heroY = S.y;
      const L = Math.hypot(wantX, wantZ) || 1; inp.mx = m > 0 ? (wantX / L) * m : 0; inp.mz = m > 0 ? (wantZ / L) * m : 0; inp.camYaw = S.camYaw;
      if (S.reqDodge) { keyq.dodge = true; S.reqDodge = false; }                    // the host's own dodge button / keys feed the sim's roll
      const air = S.grounded === false || S.mode === 'first';                         // (no combat in the air or in first person)
      inp.attack = keyq.attack && !air; inp.dodge = keyq.dodge && !air; inp.skill1 = keyq.skill1 && !air; inp.skill2 = keyq.skill2 && !air; inp.lock = keyq.lock; inp.lockNext = keyq.lockNext; inp.block = (blockTouch || !!(S.keys && S.keys.has('KeyF'))) && !air; keyq.attack = keyq.dodge = keyq.skill1 = keyq.skill2 = keyq.lock = keyq.lockNext = false;
      sim.syncHero(S.x, S.z, S.body); if (spawnN) { ctrl.spawnTest(spawnN); spawnN = 0; }            // (opts.spawn: placeholder enemies around the hero's FIRST synced position)
      if (enabled) sim.update(dt, inp); else sim.update(0, inp);
      sim.takeMove(mv); if ((mv.x || mv.z) && hostMove) hostMove(mv.x, mv.z);
      const busy = HS.state !== 'loco' && !air;
      if (busy) { S.vx = S.vz = 0; S.body = HS.yaw; S.st = 'cmb'; S.reqJump = false; } else if (S.st === 'cmb') S.st = 'loco';
      const ly = sim.lockYaw(); if (ly != null && HS.state !== 'dead') S.camYaw += wrap(ly - S.camYaw) * Math.min(1, dt * 3.2);       // camera yaw assist: eases behind the locked target; the look-drag still wins (it adds on top each frame)
      if (HS.state === 'dead') { deadT += dt; if (deadT > 2.8) { sim.revive(); deadT = 0; } } else deadT = 0;
      onEvents(); wasBusy = busy; perf.pre += (performance.now() - t0 - perf.pre) * 0.1;
      return busy;
    },
    /** host frame, AFTER the host's animate(): blend the combat clip over the host's, sample the trail */
    post(dt) {
      const t0 = performance.now(); poseApply(dt);
      if (carry) { const hs = HS.state; carry.update(dt, enabled && !!(HS.hasLock || hs === 'atk' || hs === 'skill' || hs === 'hit' || hs === 'block' || hs === 'down')); }      // WC1
      if (sword && Q.trail) {
        let on = false; if (HS.state === 'atk') { const c = kit.combo[HS.n]; const tw = c.trail; if (c.type === 'shot') on = false; else if (tw) { for (let i = 0; i < tw.length; i++) if (HS.sT >= tw[i][0] && HS.sT <= tw[i][1]) on = true; } else on = HS.sT >= c.hit[0] - 0.12 && HS.sT <= c.hit[1] + 0.14; } else if (HS.state === 'skill') { const s = kit.skills[HS.skill]; on = s.effects.some((f) => f.type === 'projectile' && f.vis === 'crescent') && HS.sT >= s.at - 0.14 && HS.sT <= s.at + 0.14; }
        if (on && carry && !carry.inHand(sword)) on = false;      // WC1: nothing to trail while the blade is being swapped
        if (on && !HS.freeze) { trailPush(trailBreak || !tr.on); trailBreak = false; } tr.on = on; if (!on) trailBreak = true;
      }
      perf.post += (performance.now() - t0 - perf.post) * 0.1;
    },
    /** host frame, AFTER placeCamera() + camera.updateMatrixWorld(): shake, particles, ribbons, enemies, HUD */
    frame(dt, now) {
      const t0 = performance.now(); if (++wcheck > 45) { wcheck = 0; sizeUpd(); }
      cameraApply(dt);
      camera.updateMatrixWorld();
      foes.sync(sim, dt); partUpdate(dt); trailWrite(dt); telegraphWrite(); waveWrite(dt); burstWrite(dt);
      rg.attributes.position.needsUpdate = true; rg.attributes.color.needsUpdate = true; pgeo.attributes.position.needsUpdate = true; pgeo.attributes.aCol.needsUpdate = true; pgeo.attributes.aSize.needsUpdate = true;
      // hero tint: i-frames (cyan pulse, truthful: it follows sim.invulnerable()), perfect dodge (white), hurt (red)
      flashRed = Math.max(0, flashRed - dt); flashPerfect = Math.max(0, flashPerfect - dt);
      const inv = sim.invulnerable() ? 1 : 0, pul = 0.55 + 0.45 * Math.sin((now || 0) * 0.04), shd = HS.sh > 0 ? 0.045 + 0.03 * pul : 0, gd = sim.guarding() ? 0.035 : 0, er = flashRed / 0.14 * 0.5 + flashPerfect * 0.9 + inv * 0.02 * pul + CE[0] * shd + gd * 0.4, eg = flashPerfect * 1.0 + inv * 0.2 * pul + flashRed / 0.14 * 0.1 + CE[1] * shd + gd * 0.9, eb = flashPerfect * 1.1 + inv * 0.26 * pul + flashRed / 0.14 * 0.08 + CE[2] * shd + gd;
      for (const m of heroMats) m.emissive.setRGB(er, eg, eb);
      // attackers outside the frame (behind her): a red arrow on the screen edge towards each enemy that is winding up / striking
      camera.matrixWorldInverse.copy(camera.matrixWorld).invert(); let ai = 0;
      for (const e of sim.enemies) {
        if (ai >= 3) break; if (e.state !== 'windup' && e.state !== 'attack') continue;
        vP.set(e.x, hgt(e.x, e.z) + 1.0, e.z).applyMatrix4(camera.matrixWorldInverse); const cz = vP.z, cx = vP.x, cy = vP.y;
        const th = Math.tan(camera.fov * PI / 360), ndx = cz < 0 ? cx / (-cz * th * camera.aspect) : 9, ndy = cz < 0 ? cy / (-cz * th) : 9;
        if (cz < 0 && Math.abs(ndx) < 0.92 && Math.abs(ndy) < 0.92) continue;                       // on screen: the ground wedge is enough
        let dx = cx, dy = -cy; const l = Math.hypot(dx, dy); if (l < 1e-4) { dx = 0; dy = 1; } else { dx /= l; dy /= l; }
        const mx = W * 0.5 - 30, myT = Hh * 0.5 - (Hh > W ? 118 : 56), myB = Hh * 0.5 - (Hh > W ? 130 : 60), k = Math.min(dx ? mx / Math.abs(dx) : 1e9, dy > 0 ? myB / dy : dy < 0 ? myT / -dy : 1e9);   // (kept clear of Telegram's header and of the stick)
        hud.alert(ai++, W * 0.5 + dx * k, Hh * 0.5 + dy * k, Math.atan2(dy, dx), e.state === 'attack' ? 1 : 0.55 + 0.45 * Math.sin(e.sT * 24));
      }
      hud.alertsEnd(ai); nAlert = ai;
      // HUD
      hotT -= dt; if (hotT <= 0) hud.hot(false);
      const tg = sim.lockTarget(); if (tg) { const s = project(tg.x, hgt(tg.x, tg.z) + foes.heightOf(tg.kind) * 0.62, tg.z); hud.marker(s.x, s.y, s.on); hud.target(tg.hp / tg.hpMax, tg.hp, (ELEMENTS[tg.element] || el).color, 0.5); } else hud.marker(0, 0, false);
      hud.set({ hp: HS.hp, hpMax: HS.hpMax, st: HS.st, stMax: HS.stMax, cd: HS.cd, cdMax: HS.cdMax, n: HS.state === 'atk' ? HS.n : HS.grace > 0 ? HS.graceN : -1, lock: HS.hasLock, sh: HS.sh > 0 ? HS.sh / HS.shMax : 0, guard: HS.state === 'block' }, dt); hud.digits(dt);
      perf.frame += (performance.now() - t0 - perf.frame) * 0.1;
    },
    press, setBlock(b) { blockTouch = !!b; }, key(code) { const m = { KeyJ: 'attack', KeyK: 'dodge', KeyU: 'skill1', KeyI: 'skill2', KeyL: 'lock', KeyO: 'lockNext' }[code]; if (!m) return false; keyq[m] = true; return true; },
    setQuality(step) { qStep = clamp(step | 0, 0, 3); Q = QUALITY[qStep]; ctrl.quality = qStep; foes.setSkip(Q.skip); if (!Q.trail) { tr.n = 0; } if (!Q.part) { pl.fill(0); ps.fill(0); } },
    spawnTest(n, kindsList) {                                               // n placeholder enemies in a half ring in front of the hero
      const ks = kindsList || kinds, out = []; for (let i = 0; i < n; i++) { const a = HS.yaw + (n === 1 ? 0 : (i / (n - 1) - 0.5) * 2.2), r = 7 + (i % 2) * 1.5, e = sim.spawn(ks[i % ks.length], HS.x + Math.sin(a) * r, HS.z + Math.cos(a) * r, { yaw: a + PI }); if (e) out.push(e); } return out;
    },
    setEnabled(b) { enabled = !!b; ribbon.visible = points.visible = !!b && true; for (const q of weapons) q.obj.visible = !!b; if (carry) carry.setVisible(!!b); hud.setVisible(!!b); if (!b) foes.dispose(); },
    stats() { const f = foes.stats(); return { jsMs: +(perf.pre + perf.post + perf.frame).toFixed(3), pre: +perf.pre.toFixed(3), post: +perf.post.toFixed(3), frame: +perf.frame.toFixed(3), foeCalls: f.calls, foeTris: f.tris, ownCalls: 3 + (carry ? carry.calls() : 0), carryCalls: carry ? carry.calls() : 0, ownTris: ri.length / 3 + NP * 0 + (swordTris), swordTris, trailLive: tr.n, ribbonVerts: NV, particles: NP, partLive: (() => { let c = 0; for (let i = 0; i < NP; i++) if (pl[i] > 0) c++; return c; })(), quality: qStep, alerts: nAlert, frameK: +SH.k.toFixed(3) }; },
    burstFx, shake, setFrame(k) { frameOn = k; },
    dispose() { shakeUndo(); scene.remove(ribbon); scene.remove(points); rg.dispose(); pgeo.dispose(); rmat.dispose(); pmat.dispose(); if (carry) carry.dispose(); for (const q of weapons) q.obj.removeFromParent(); for (const m of heroMats) m.emissive.setRGB(0, 0, 0); for (const n in CL) { CL[n].a.stop(); } foes.dispose(); hud.dispose(); },
  };
  let swordTris = 0; for (const q of weapons) q.obj.traverse((o) => { if (o.isMesh) { const g = o.geometry; swordTris += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
  return ctrl;
}
