// WC1 — WHERE A HERO CARRIES HER WEAPON (+ the sister's gem).  Lazy module, loaded by combat/fx.js in hero mode only.  No imports: THREE comes in as T.   Nothing here allocates per frame.
// The owner's rule (11:12, 15 Oct 2026):  short sword = on the HIP (left side, hilt forward) · big sword = on the SHOULDER / back · staff = IN THE HAND · bow = on the SHOULDER (slung across the back).
//   spear / hammer / axe (not named by him) = on the back, shaft diagonal;  two daggers = one on each hip.  In a fight the weapon is in the hand (bow: left, everything else: as the kit's `grip` says); 3 s after the last blow it goes back.
// How it works: every mount is written in the HERO FRAME (model units, +X = her left, +Y up, +Z forward, relative to the bone's origin in the bind pose), so ONE table serves all six sisters (same skeleton); create() converts it to
//   bone-local numbers with the bone's bind-pose rotation, so it follows animation and any hero scale (RP1C: x1.12) without absolute metres.  Nothing is tied on her (owner, 12:04: no belt, no strap, no baldric):
//   a hip sword / dagger gets only its own slim scabbard (one merged vertex-coloured mesh on the Pelvis bone); back weapons and the quiver carry no fitting.  The gem is one small vertex-coloured mesh per weapon.
// No draw / swap clip exists: the swap is a 0.12 s scale-out / scale-in at the hand or the mount, with a flare callback (fx.js emits its own additive Points flash); a weapon is never visible in two places.
export const KINDS = ['short_sword', 'sword', 'big_sword', 'dagger', 'staff', 'bow', 'spear', 'hammer', 'axe', 'quiver'];
export const CARRY_OF = { short_sword: 'hip', sword: 'hip', dagger: 'hip', big_sword: 'back', axe: 'back', hammer: 'back', spear: 'back', bow: 'back', quiver: 'hip', staff: 'hand' };
// where in the weapon (fraction of its length from the base end) the hand holds it = the origin of the unit weapon;  hilt = fraction where the guard / head starts (the scabbard begins there)
// the staff / spear / bow default grip: vertical in the bind pose, leaned INWARD by this much (x per unit y) so the idle arm (which hangs closer to the body than the bind pose) ends up with the shaft upright at her side
const STAFF_TILT = 0.70;
export const HOLD = { short_sword: 0.10, sword: 0.10, big_sword: 0.14, dagger: 0.17, staff: 0.52, spear: 0.42, hammer: 0.22, axe: 0.24, bow: 0.5, quiver: 0.5 };
export const HILT = { short_sword: 0.22, sword: 0.20, big_sword: 0.22, dagger: 0.30 };
// mounts in the hero frame: pos = the weapon's grip point, dir = base -> tip.  `side`: hip weapons go to the LEFT hip (the right one only for the 2nd weapon of a pair).
export const MOUNT = {
  hip: { bone: 'Pelvis', pos: [0.165, 0.000, 0.045], dir: [0.10, -0.74, -0.66] },
  hip_pair: { bone: 'Pelvis', pos: [0.185, 0.000, -0.030], dir: [0.14, -0.62, -0.77] },
  quiver: { bone: 'Pelvis', pos: [-0.125, 0.130, -0.095], dir: [-0.18, 0.93, -0.32] },
  back_blade: { bone: 'Spine02', pos: [-0.070, 0.205, -0.160], dir: [0.46, -0.88, -0.10] },
  back_pole: { bone: 'Spine02', pos: [0.020, 0.050, -0.132], dir: [-0.62, 0.78, -0.03] },
  back_bow: { bone: 'Spine02', pos: [0.010, 0.080, -0.150], dir: [-0.50, 0.86, -0.04] },
};
const MOUNT_OF = { short_sword: 'hip', sword: 'hip', dagger: 'hip', quiver: 'quiver', big_sword: 'back_blade', axe: 'back_blade', hammer: 'back_pole', spear: 'back_pole', bow: 'back_bow' };
export function weaponKind(w) {                                          // kit field `kind` wins; else read the file name; else the length
  if (w.kind && KINDS.indexOf(w.kind) >= 0) return w.kind; const n = (w.url || '').toLowerCase(), len = w.len || 1;
  if (/quiver/.test(n)) return 'quiver'; if (/staff|sceptre|cane|crook/.test(n)) return 'staff'; if (/bow/.test(n)) return 'bow';
  if (/spear|lance|pike|trident|javelin|glaive|naginata|halberd|polearm|voulge|bardiche|poleaxe/.test(n)) return 'spear'; if (/hammer|maul|club|mace/.test(n)) return 'hammer'; if (/axe/.test(n)) return 'axe';
  if (/dagger|knife|dirk|stiletto|kris|khanjar|kukri|tanto|sica/.test(n) || len < 0.55) return 'dagger'; if (/greatsword|claymore|zweihander|nodachi|flamberge|xl_|_xl/.test(n) || len >= 1.25) return 'big_sword';
  return len < 0.85 ? 'short_sword' : 'sword';
}
export const carryOf = (w) => (w.carry && ['hip', 'back', 'hand'].indexOf(w.carry) >= 0 ? w.carry : CARRY_OF[weaponKind(w)]);

/** The two ends of a library object (a clone of one pack node): lateral extent (x + z) of its lowest and highest 10 % - tells which end is the point / head, because the packs do not agree on which way up a sword stands. */
function endExtents(T, obj) {
  obj.updateMatrixWorld(true); const box = new T.Box3().setFromObject(obj), h = box.max.y - box.min.y || 1, lo = [9, -9, 9, -9], hi = [9, -9, 9, -9], v = new T.Vector3();
  obj.traverse((m) => { if (!m.isMesh) return; const a = m.geometry.attributes.position; for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld); const t = (v.y - box.min.y) / h, r = t < 0.10 ? lo : t > 0.90 ? hi : null; if (!r) continue; r[0] = Math.min(r[0], v.x); r[1] = Math.max(r[1], v.x); r[2] = Math.min(r[2], v.z); r[3] = Math.max(r[3], v.z); } });
  const e = (r) => (r[1] - r[0]) + (r[3] - r[2]); return [e(lo), e(hi)];
}
const POINTED = { short_sword: 1, sword: 1, big_sword: 1, dagger: 1, spear: 1 }, HEADED = { hammer: 1, axe: 1, staff: 1 };
/** A library object (a clone of one pack node: pivot at its base centre, ymin = 0) -> the UNIT weapon: length 1, base -> tip along +Y (point / head up), origin at the hold point (the convention of combat/sword_arming.glb).
 *  The pack stores some swords tip-down: a pointed weapon is turned so its narrow end is +Y, a headed one (hammer / axe / staff) so its heavy end is +Y; bows and quivers are left alone.  g.userData.flipped tells. */
export function unitWeapon(T, obj, kind) {
  const [el, eh] = endExtents(T, obj), big = Math.max(el, eh) || 1, ok = Math.abs(el - eh) / big > 0.12; let flipped = false;
  if (ok && ((POINTED[kind] && eh > el) || (HEADED[kind] && el > eh))) { obj.rotateZ(Math.PI); flipped = true; obj.updateMatrixWorld(true); }
  const box = new T.Box3().setFromObject(obj), h = box.max.y - box.min.y || 1, s = 1 / h, g = new T.Group(), inner = new T.Group(); inner.add(obj); inner.scale.setScalar(s);
  inner.position.set(-(box.min.x + box.max.x) * 0.5 * s, -box.min.y * s - (HOLD[kind] != null ? HOLD[kind] : 0.1), -(box.min.z + box.max.z) * 0.5 * s); g.add(inner); g.name = 'wc1_weapon'; g.userData.flipped = flipped; g.userData.ends = [el, eh]; return g;
}

// ------------------------------------------------------------------ small geometry kit (vertex coloured, flat, merged)
function mergeParts(T, parts) {
  let n = 0; for (const p of parts) n += p.g.attributes.position.count; const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
  for (const p of parts) { const g = p.g, c = p.c, cnt = g.attributes.position.count, P = g.attributes.position.array, Nn = g.attributes.normal.array;
    for (let i = 0; i < cnt; i++) { pos[(o + i) * 3] = P[i * 3]; pos[(o + i) * 3 + 1] = P[i * 3 + 1]; pos[(o + i) * 3 + 2] = P[i * 3 + 2]; nor[(o + i) * 3] = Nn[i * 3]; nor[(o + i) * 3 + 1] = Nn[i * 3 + 1]; nor[(o + i) * 3 + 2] = Nn[i * 3 + 2];
      const f = p.facet ? 0.78 + 0.5 * ((((i / 3) | 0) * 2654435761 >>> 0) % 1000) / 1000 : 1; col[(o + i) * 3] = Math.min(1, c[0] * f); col[(o + i) * 3 + 1] = Math.min(1, c[1] * f); col[(o + i) * 3 + 2] = Math.min(1, c[2] * f); }
    o += cnt; g.dispose(); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('normal', new T.BufferAttribute(nor, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3)); return g;
}
/** The sister's own gem colour from combat.js ELEMENTS[el]: body = the deep tone (facets), glow = the element colour (emissive + halo); very pale elements (ice, wind) are pulled towards the deep tone so the stone is blue, not white. */
export function gemLook(T, el) { const c = new T.Color(el.color), d = el.glow[1], lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b, k = lum > 0.7 ? 1 : 0, pale = k > 0; return { ei: pale ? 0.5 : 0.85, body: pale ? [d[0] * 0.7, d[1] * 0.7, d[2] * 0.75] : [d[0] * 0.65, d[1] * 0.65, d[2] * 0.65], glow: [c.r + (d[0] - c.r) * k, c.g + (d[1] - c.g) * k, c.b + (d[2] - c.b) * k] }; }
const LEATHER = [0.16, 0.10, 0.07], LEATHER2 = [0.24, 0.15, 0.10], GOLD = [0.86, 0.66, 0.24];

export function create(opts) {
  const { T, hero, items } = opts, emit = opts.emit || null, model = hero.model, msc = model.scale.x || 1, gemCol = opts.gem || null;      // gemCol = { body: [r,g,b], glow: [r,g,b] } (the sister's own colour) or null
  const V = (x, y, z) => new T.Vector3(x, y, z), Q = () => new T.Quaternion(), M4 = () => new T.Matrix4();
  const bones = {}, skinned = []; model.traverse((o) => { if (o.isBone) bones[o.name] = o; if (o.isSkinnedMesh) skinned.push(o); });
  // ---- bind pose: the hero frame numbers need the rest pose (the mixer rewrites the bones on the host's next frame, so nothing is restored)
  for (const m of skinned) m.skeleton.pose(); model.updateMatrixWorld(true);
  const inv = M4().copy(model.matrixWorld).invert(), qRoot = model.getWorldQuaternion(Q()), qRootInv = qRoot.clone().invert();
  const restQ = (name) => bones[name].getWorldQuaternion(Q()).premultiply(qRootInv), restP = (name) => V(0, 0, 0).setFromMatrixPosition(bones[name].matrixWorld).applyMatrix4(inv);
  // ---- one entry per weapon
  const list = []; let nHip = 0; for (const it of items) if (carryOf(it.w) === 'hip' && weaponKind(it.w) !== 'quiver') nHip++;
  const tmpQ = Q(), tmpV = V(0, 0, 0), ref = V(1, 0, 0), bX = V(0, 0, 0), bZ = V(0, 0, 0), bY = V(0, 0, 0), mm = M4();
  const frameQ = (dir, side) => { bY.set(dir[0], dir[1], dir[2]).normalize(); ref.set(side, 0, 0); bX.copy(ref).addScaledVector(bY, -ref.dot(bY)).normalize(); bZ.crossVectors(bX, bY); return Q().setFromRotationMatrix(mm.makeBasis(bX, bY, bZ)); };
  for (const it of items) {
    const w = it.w, kind = weaponKind(w), car = carryOf(w), grp = it.obj, e = { grp, w, kind, car, where: 'hand', phase: 0, t: 0, to: '', base: w.len / msc, gem: null, hand: null, mountQ: Q(), mountP: V(0, 0, 0), handQ: Q(), handP: V(0, 0, 0), bone: null, handBone: null };
    // the hand transform: the kit's `grip` (blade direction in the hand bone's frame) exactly like RP4 did it; no grip = a default by kind
    const handName = kind === 'bow' ? 'L_Hand' : (w.slot === 'L' ? 'L_Hand' : 'R_Hand'); e.handBone = bones[handName]; if (!e.handBone) continue;
    const SWORDY = kind !== 'staff' && kind !== 'spear' && kind !== 'bow', grip = w.grip || (SWORDY ? { b: [handName === 'L_Hand' ? 0.8 : -0.8, 0.6, 0], pos: [0, 0.035, 0] } : null);
    if (grip) { const b = V(grip.b[0], grip.b[1], grip.b[2]).normalize(), wv0 = V(b.y, -b.x, 0).normalize(), zz = V(0, 0, 0).crossVectors(wv0, b); e.handQ.setFromRotationMatrix(mm.makeBasis(wv0, b, zz)); e.handP.set(grip.pos[0], grip.pos[1], grip.pos[2]); }
    else { const qh = restQ(handName), L = handName === 'L_Hand', up = (kind === 'staff' || kind === 'spear' || kind === 'bow') ? [L ? -STAFF_TILT : STAFF_TILT, 1, 0] : [L ? 0.15 : -0.15, 0.7, 0.7]; const q = frameQ(up, L ? -1 : 1); e.handQ.copy(qh).invert().multiply(q); e.handP.set(0, 0.035, 0); }
    // the carry transform (hero frame -> bone-local)
    if (car !== 'hand') { const mname = kind === 'quiver' ? 'quiver' : car === 'hip' ? (nHip > 1 ? 'hip_pair' : 'hip') : MOUNT_OF[kind] || 'back_blade', M = MOUNT[mname]; let side = (car === 'hip' && kind !== 'quiver') ? 1 : -1, px = M.pos[0], dx = M.dir[0];
      if (mname === 'hip_pair' && w.slot === 'R') { px = -px; dx = -dx; side = -1; } if (kind === 'quiver') side = -1;
      const qb = restQ(M.bone), qh = frameQ([dx, M.dir[1], M.dir[2]], side); e.bone = bones[M.bone]; e.mountQ.copy(qb).invert().multiply(qh); e.mountP.set(px, M.pos[1], M.pos[2]).applyQuaternion(tmpQ.copy(qb).invert()); e.mname = mname; e.mpx = px; e.mdx = dx; e.mside = side; }
    // the gem (the sister's own colour): one small flat-faceted stone in a gold bezel, set in the weapon at the place of its kind
    if (gemCol && w.gem !== false && kind !== 'quiver') {
      const r = Math.max(0.019, 0.016 / Math.max(0.2, w.len)), hold = HOLD[kind] != null ? HOLD[kind] : 0.1, pomm = kind === 'staff' || kind === 'spear' || kind === 'bow' ? null : -hold - r * 0.9;
      const oct = new T.OctahedronGeometry(r, 0).scale(0.9, 1.45, 0.9).toNonIndexed(); oct.computeVertexNormals(); const ring = new T.TorusGeometry(r * 0.92, r * 0.13, 6, 14).rotateX(Math.PI / 2).toNonIndexed(); ring.computeVertexNormals();
      const parts = [{ g: oct, c: gemCol.body, facet: true }, { g: ring, c: GOLD }], gg = mergeParts(T, parts), mesh = new T.Mesh(gg, gemMaterial(T, gemCol));
      if (kind === 'bow') { mesh.position.set(0, 0, 0.010 / Math.max(0.2, w.len)); } else if (kind === 'staff') { mesh.position.set(0, 1 - hold + r * 0.2, 0); } else if (kind === 'spear') { mesh.position.set(0, 0.76 - hold, 0.010 / Math.max(0.2, w.len)); } else { mesh.position.set(0, pomm, 0); }
      mesh.frustumCulled = false; mesh.castShadow = false; mesh.name = 'wc1_gem'; grp.add(mesh); e.gem = mesh; e.gemR = r; e.gemT = Math.random() * 6; }
    list.push(e);
  }
  // ---- the scabbard (owner, 12:04: NOTHING is tied round her waist or over her shoulder: no belt, no frog, no baldric, no straps, no rings).  A hip sword / dagger keeps only its OWN slim scabbard (cone + gold throat, locket, chape),
  //      one merged vertex-coloured mesh on the Pelvis bone; back weapons (big sword, spear, hammer, axe, bow) and the quiver carry no fitting at all.
  const fit = {};
  const sheaths = list.filter((e) => e.car === 'hip' && e.kind !== 'quiver' && HILT[e.kind] != null);
  if (sheaths.length) {
    const bn = 'Pelvis', o = restP(bn), qb = restQ(bn), qInv = qb.clone().invert(), P = [], F = fit[bn] = { sheaths, mesh: null };
    for (const e of sheaths) {
      const L = e.base, h0 = HOLD[e.kind] || 0.1, lo = HILT[e.kind] - h0, hi = 1 - h0 + 0.012, L2 = (hi - lo) * L, qw = e.mountQ.clone().premultiply(qb), pa = e.mountP.clone().applyQuaternion(qb);
      const r0 = Math.min(0.019, 0.015 * Math.max(0.55, Math.min(1.1, L * 1.6))), r1 = r0 * 0.5, mat = mm.clone().compose(V(0, 0, 0), qw, V(1, 1, 1)), at = (g, y) => { g.translate(0, y, 0).applyMatrix4(mat).translate(pa.x, pa.y, pa.z); return g; };
      const cone = new T.CylinderGeometry(r1, r0, L2, 10, 1, false).toNonIndexed(); cone.computeVertexNormals(); P.push({ g: at(cone, lo * L + L2 / 2), c: LEATHER });
      const th = new T.CylinderGeometry(r0 * 1.14, r0 * 1.14, 0.014, 10, 1, false).toNonIndexed(); th.computeVertexNormals(); P.push({ g: at(th, lo * L + 0.005), c: GOLD });
      const lk = new T.CylinderGeometry(r0 * 0.86, r0 * 0.86, 0.008, 10, 1, false).toNonIndexed(); lk.computeVertexNormals(); P.push({ g: at(lk, lo * L + L2 * 0.46), c: GOLD });
      const ch = new T.SphereGeometry(r1 * 1.25, 8, 6).scale(1, 1.5, 1).toNonIndexed(); ch.computeVertexNormals(); P.push({ g: at(ch, hi * L - r1 * 0.3), c: GOLD });
    }
    const g = mergeParts(T, P); g.applyMatrix4(mm.clone().makeRotationFromQuaternion(qInv)); const mesh = new T.Mesh(g, fitMaterial(T)); mesh.frustumCulled = false; mesh.castShadow = false; mesh.name = 'wc1_scabbard'; bones[bn].add(mesh); F.mesh = mesh;
  }
  // ---- start state: carried (or in the hand for a hand weapon)
  const place = (e, where) => { const par = where === 'hand' ? e.handBone : e.bone; if (!par) return; par.add(e.grp); if (where === 'hand') { e.grp.quaternion.copy(e.handQ); e.grp.position.copy(e.handP); } else { e.grp.quaternion.copy(e.mountQ); e.grp.position.copy(e.mountP); } e.where = where; };
  const SW = 0.06; let linger = 0, drawnNow = false, gemClk = 0;
  for (const e of list) { place(e, e.car === 'hand' ? 'hand' : 'carry'); e.grp.scale.setScalar(e.base); }
  const flash = (e) => { if (!emit) return; e.grp.getWorldPosition(tmpV); emit(tmpV.x, tmpV.y, tmpV.z, 0, 0, 0, 0.14, 0.9, gemCol ? gemCol.glow : [1, 0.9, 0.7], 1); };
  const ctl = {
    items: list, fit, restQ, restP,
    /** wantDrawn = a fight is on (the host / fx.js decides: attack, skill, hit, block, lock-on ...).  The weapon is drawn at once, sheathed 3 s after the last blow. */
    update(dt, wantDrawn) {
      if (wantDrawn) linger = 3; else if (linger > 0) linger -= dt; const drawn = wantDrawn || linger > 0; drawnNow = drawn;
      for (const e of list) {
        const want = e.car === 'hand' ? 'hand' : e.kind === 'quiver' ? 'carry' : drawn ? 'hand' : 'carry';        // (a quiver never leaves the hip)
        if (e.phase === 0 && e.where !== want) { e.phase = 1; e.t = 0; e.to = want; flash(e); }
        if (e.phase === 1) { e.t += dt; const s = Math.max(0.001, 1 - e.t / SW); e.grp.scale.setScalar(e.base * s); if (e.t >= SW) { place(e, e.to); e.phase = 2; e.t = 0; flash(e); } }
        else if (e.phase === 2) { e.t += dt; const s = Math.min(1, e.t / SW); e.grp.scale.setScalar(e.base * Math.max(0.001, s)); if (e.t >= SW) { e.phase = 0; e.grp.scale.setScalar(e.base); } }
      }
      gemClk += dt; if (emit && gemCol && gemClk > 0.09) { gemClk = 0; for (const e of list) if (e.gem) { e.gem.getWorldPosition(tmpV); const t = performance.now() * 0.0022 + e.gemT; emit(tmpV.x, tmpV.y, tmpV.z, 0, 0, 0, 0.12, 0.30 + 0.07 * Math.sin(t), gemCol.glow, 0.55 + 0.2 * Math.sin(t * 1.3)); } }
    },
    setDrawn(b) { linger = b ? 3 : 0; drawnNow = !!b; for (const e of list) { if (e.car === 'hand') continue; const want = b && e.kind !== 'quiver' ? 'hand' : 'carry'; place(e, want); e.phase = 0; e.grp.scale.setScalar(e.base); } },
    drawn: () => drawnNow,
    /** true when this weapon object sits in the hand and is not mid-swap (the trail asks) */
    inHand(grp) { for (let i = 0; i < list.length; i++) if (list[i].grp === grp) return list[i].where === 'hand' && list[i].phase === 0; return true; },
    /** draw calls this module adds on top of the weapons themselves: the fitting meshes + one gem per weapon */
    calls() { let n = 0; for (const bn in fit) if (fit[bn].mesh) n++; for (const e of list) if (e.gem) n++; return n; },
    setVisible(b) { for (const e of list) e.grp.visible = b; for (const bn in fit) if (fit[bn].mesh) fit[bn].mesh.visible = b; },
    state: () => list.map((e) => ({ kind: e.kind, carry: e.car, where: e.where, phase: e.phase, scale: e.grp.scale.x / e.base, parent: e.grp.parent ? e.grp.parent.name : null })),
    gemWorld(i, out) { const e = list[i]; if (!e || !e.gem) return null; return e.gem.getWorldPosition(out); },
    dispose() { for (const e of list) { if (e.gem) { e.gem.geometry.dispose(); e.gem.removeFromParent(); } e.grp.removeFromParent(); } for (const bn in fit) if (fit[bn].mesh) { fit[bn].mesh.geometry.dispose(); fit[bn].mesh.removeFromParent(); } },
  };
  return ctl;
}
let _fit = null, _gem = new Map();
function fitMaterial(T) { return _fit || (_fit = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.35 })); }
function gemMaterial(T, c) { const k = c.glow.join(',') + '/' + (c.ei || 0.9); if (!_gem.has(k)) _gem.set(k, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.05, emissive: new T.Color(c.glow[0], c.glow[1], c.glow[2]), emissiveIntensity: c.ei || 0.9 })); return _gem.get(k); }
