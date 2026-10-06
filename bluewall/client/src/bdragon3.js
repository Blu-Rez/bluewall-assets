// The three-headed dragons (p35: baby3, dragon3): the Prowler dragon (bdragon.js / bdragon_live.js) with TWO MORE NECKS AND HEADS, composed in three.js on its own rig.
//   const g3 = makeMultiHead(pw, { heads: 3, yaw: 0.42, spread: 2.4, neckK: 1.1, lag: 0.2 })  ->  { scene, animations }  (one skinned mesh again: createLiveKind takes it like any dragon)
// What it does (once per look, from the loaded + prowlerFly()-prepared model):
//   - the whole chain below Neck_66 (Neck, Head, Jaw1/2, Tongue1-3, Eye L/R, Vision, Jaw_IK, Brow L/R = 15 bones) is cloned per extra head under the same parent (Torso_118): names get the suffix _h1 / _h2;
//   - every triangle of the body mesh that touches the head set (any vertex with a head weight > HEAD_W, i.e. the neck base blends into the torso exactly like the original) and the whole eye mesh are
//     copied once per extra head into the same geometry, the joint indices re-mapped onto the cloned bones (their inverse bind matrices are the originals': bind pose = the single-neck dragon);
//   - the animation tracks of the chain are cloned onto the new bones: the side necks are turned out by `yaw` about the torso's vertical axis, set apart by `spread` (bone units, along the shoulder line),
//     longer (`neckK`: the neck is stretched along its own axis and the head counter-scaled: the head keeps its size) and play `lag` s behind the middle head (the second one 1.6 x as far), so the three move out of phase.
// Head order everywhere: 0 = middle, 1 = the unit's right (-x), 2 = the unit's left (+x)  (the sim's breath events: side = [0, -1, +1] along the unit's x axis).
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const HEAD_W = 0.02;                                                    // a vertex with at least this much weight on the head set is copied with its triangle
const ROOT = 'Neck_66', PARENT = 'Torso_118', HEAD = 'Head_65';
const SIDE = [0, -1, 1];                                                // head index -> side (-1 = the unit's right = -x)

export function makeMultiHead(pw, opt = {}) {
  const { heads = 3, yaw = 0.42, spread = 2.4, neckK = 1.1, lag = 0.2, splay = 0.08, pitch = 0, dbg = null } = opt;
  const scene = SkeletonUtils.clone(pw.scene), junk = [];
  scene.traverse((o) => { if (o.isMesh && !o.isSkinnedMesh) junk.push(o); });                                  // (the source file carries the rig's control-shape widgets as invisible plain meshes: dropped)
  for (const o of junk) o.parent && o.parent.remove(o);
  const neck = scene.getObjectByName(ROOT), parent = scene.getObjectByName(PARENT);
  if (!neck || !parent) throw new Error('multihead: no neck bone');
  const chain = []; neck.traverse((o) => { if (o.isBone) chain.push(o); });                                       // (parents before children)
  const chainNames = new Set(chain.map((b) => b.name));
  // ---- bones: one copy of the chain per extra head
  const clones = [null];                                                                                       // clones[h][originalName] = the bone of head h
  for (let h = 1; h < heads; h++) {
    const map = {};
    for (const b of chain) {
      const nb = new THREE.Bone(); nb.name = b.name + '_h' + h; nb.position.copy(b.position); nb.quaternion.copy(b.quaternion); nb.scale.copy(b.scale); map[b.name] = nb;
      (b === neck ? parent : map[b.parent.name]).add(nb);
    }
    const s = SIDE[h], nk = map[ROOT];
    nk.position.x += s * spread;                                                                                // (rest value; every clip of this rig carries its own position / scale tracks for the neck: the length is set in the tracks below)
    clones.push(map);
  }
  scene.updateMatrixWorld(true);
  // ---- geometry: copy the head triangles per extra head, re-pointed to the cloned bones
  const skinned = []; scene.traverse((o) => { if (o.isSkinnedMesh) skinned.push(o); });
  for (const sm of skinned) {
    const old = sm.skeleton, bones = old.bones.slice(), inv = old.boneInverses.map((m) => m.clone());
    const idx = {}; bones.forEach((b, i) => { idx[b.name] = i; });
    const remap = [null];                                                                                       // remap[h][oldJointIndex] = joint index of the clone (head set only)
    for (let h = 1; h < heads; h++) {
      const r = new Map();
      for (const b of chain) { const i = idx[b.name]; if (i === undefined) continue; r.set(i, bones.length); bones.push(clones[h][b.name]); inv.push(inv[i].clone()); }
      remap.push(r);
    }
    const g = sm.geometry, n0 = g.attributes.position.count, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, ix = g.index;
    const inSet = new Set(remap.length > 1 ? remap[1].keys() : []);
    const hw = new Float32Array(n0); for (let i = 0; i < n0; i++) for (let c = 0; c < 4; c++) if (inSet.has(si.getComponent(i, c))) hw[i] += sw.getComponent(i, c);
    const tris = []; const nt = ix ? ix.count / 3 : n0 / 3;
    for (let t = 0; t < nt; t++) { const a = ix ? ix.getX(t * 3) : t * 3, b = ix ? ix.getX(t * 3 + 1) : t * 3 + 1, c = ix ? ix.getX(t * 3 + 2) : t * 3 + 2; if (hw[a] > HEAD_W || hw[b] > HEAD_W || hw[c] > HEAD_W) tris.push(a, b, c); }
    const used = []; { const seen = new Set(); for (const v of tris) if (!seen.has(v)) { seen.add(v); used.push(v); } }
    const per = used.length, N = n0 + per * (heads - 1);
    const out = new THREE.BufferGeometry();
    const f = (name, k) => { const a = g.attributes[name]; if (!a) return null; const arr = new Float32Array(N * k); for (let i = 0; i < n0; i++) for (let c = 0; c < k; c++) arr[i * k + c] = a.getComponent(i, c); return arr; };
    const P = f('position', 3), Nm = f('normal', 3), U = f('uv', 2), Tg = f('tangent', 4), SW = f('skinWeight', 4), SI = new Uint16Array(N * 4);
    for (let i = 0; i < n0; i++) for (let c = 0; c < 4; c++) SI[i * 4 + c] = si.getComponent(i, c);
    const index = []; for (let t = 0; t < tris.length; t++) index.push(0);                                      // (filled below)
    const full = []; for (let t = 0; t < nt * 3; t++) full.push(ix ? ix.getX(t) : t);
    const newTris = [];
    for (let h = 1; h < heads; h++) {
      const base = n0 + per * (h - 1), map = new Map(); used.forEach((v, j) => map.set(v, base + j));
      used.forEach((v, j) => {
        const d = base + j;
        for (let c = 0; c < 3; c++) { P[d * 3 + c] = P[v * 3 + c]; Nm && (Nm[d * 3 + c] = Nm[v * 3 + c]); }
        if (U) for (let c = 0; c < 2; c++) U[d * 2 + c] = U[v * 2 + c];
        if (Tg) for (let c = 0; c < 4; c++) Tg[d * 4 + c] = Tg[v * 4 + c];
        for (let c = 0; c < 4; c++) { SW[d * 4 + c] = SW[v * 4 + c]; const j0 = SI[v * 4 + c]; SI[d * 4 + c] = remap[h].has(j0) ? remap[h].get(j0) : j0; }
      });
      for (const v of tris) newTris.push(map.get(v));
    }
    out.setAttribute('position', new THREE.BufferAttribute(P, 3)); if (Nm) out.setAttribute('normal', new THREE.BufferAttribute(Nm, 3)); if (U) out.setAttribute('uv', new THREE.BufferAttribute(U, 2));
    if (Tg) out.setAttribute('tangent', new THREE.BufferAttribute(Tg, 4));
    out.setAttribute('skinIndex', new THREE.BufferAttribute(SI, 4)); out.setAttribute('skinWeight', new THREE.BufferAttribute(SW, 4));
    out.setIndex(new THREE.BufferAttribute(N > 65535 ? new Uint32Array(full.concat(newTris)) : new Uint16Array(full.concat(newTris)), 1));
    out.computeBoundingSphere(); out.computeBoundingBox();
    if (dbg && dbg.color) {                                                                                      // (debug: vertex colours by head set weight)
      const col = new Float32Array(N * 3); for (let i = 0; i < n0; i++) { col[i * 3] = hw[i]; col[i * 3 + 1] = 1 - hw[i]; col[i * 3 + 2] = 0.2; } for (let i = n0; i < N; i++) { col[i * 3] = 0.2; col[i * 3 + 1] = 0.3; col[i * 3 + 2] = 1; }
      out.setAttribute('color', new THREE.BufferAttribute(col, 3)); sm.material = sm.material.clone(); sm.material.vertexColors = true; sm.material.map = null;
    }
    sm.geometry = out;
    const sk = new THREE.Skeleton(bones, inv); sm.bind(sk, sm.bindMatrix);
    sm.userData.heads = heads; sm.userData.tris = [nt, tris.length / 3];
  }
  // ---- animation: the chain's tracks cloned per head (yaw on the neck, lag in time)
  const anims = [];
  const yawQ = (a) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, -1), a);                  // the torso's local -z is world up in this rig: positive angle = turn to the unit's left (+x)
  for (const clip of pw.animations) {
    if (clip.name !== 'Fly' && clip.name !== 'Perch') continue;                                                // (the only two the battle uses)
    const tracks = clip.tracks.slice(), D = clip.duration;
    // neck length: scale tracks of the neck (y = along the bone: the head sits at +y of the neck) x neckK and of the head x 1/neckK, so the neck stretches (its skin with it) and the head keeps its size.
    // (the centre neck gets it too, in copies of the tracks: the model's own clips are shared with the ordinary dragons and never touched)
    const stretch = (tr, node) => {
      const n = tr.times.length, vals = Float32Array.from(tr.values), f = node === ROOT ? neckK : 1 / neckK;
      for (let i = 0; i < n; i++) vals[i * 3 + 1] *= f;
      return vals;
    };
    for (let i = 0; i < tracks.length; i++) { const tr = tracks[i], nm = tr.name; if (nm === ROOT + '.scale' || nm === HEAD + '.scale') tracks[i] = new tr.constructor(nm, tr.times.slice(), stretch(tr, nm.slice(0, -6))); }
    for (let h = 1; h < heads; h++) {
      const dt = D > 0.3 ? lag * (h === 1 ? 1 : 1.6) : 0, side = SIDE[h];
      for (const tr of clip.tracks) {
        const [node, prop] = [tr.name.slice(0, tr.name.lastIndexOf('.')), tr.name.slice(tr.name.lastIndexOf('.') + 1)];
        if (!chainNames.has(node)) continue;
        if (node === ROOT && prop === 'position') continue;                                                     // (the clone keeps its own rest position: set apart)
        const n = tr.times.length, k = tr.getValueSize(), vals = new Float32Array(n * k), it = tr.createInterpolant();
        for (let i = 0; i < n; i++) {
          let t = tr.times[i] - dt; if (D > 0.3) t = ((t % D) + D) % D;
          const r = it.evaluate(t); for (let c = 0; c < k; c++) vals[i * k + c] = r[c];
        }
        if (prop === 'quaternion' && (node === ROOT || node === HEAD)) {
          const q = yawQ(side * (node === ROOT ? yaw : splay)), cur = new THREE.Quaternion();
          for (let i = 0; i < n; i++) { cur.fromArray(vals, i * 4); cur.premultiply(q).toArray(vals, i * 4); }
        }
        if (prop === 'scale' && (node === ROOT || node === HEAD)) vals.set(stretch({ times: tr.times, values: vals }, node));
        tracks.push(new tr.constructor(node + '_h' + h + '.' + prop, tr.times.slice(), vals));
      }
      // (a track that does not exist in the clip but whose rest rotation must carry the yaw: the root has one in every clip of this rig, so nothing to add)
    }
    anims.push(new THREE.AnimationClip(clip.name, clip.duration, tracks));
  }
  return { scene, animations: anims, heads };
}
