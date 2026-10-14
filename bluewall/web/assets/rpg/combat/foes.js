// RP4 — placeholder enemies (TEST ONLY, owner only; the real enemies are RP6 and come from a sheet the owner picks from).
// The sim (combat.js) knows nothing about meshes: this module mirrors sim.enemies into pooled model instances cloned from three models the game already ships
// (u1_legionary.glb = `soldier`, werewolf.glb = `beast`, troll.glb = `brute`) and maps the sim's pose names (idle/move/windup/attack/recover/stagger/dead) onto their clips.
// No THREE import: the host passes its own THREE (nothing is bundled twice).
const SPEC = {
  soldier: { url: 'u1_legionary.glb', height: 1.55, idle: 'Idle_A', move: 'Running_A', moveRate: 1.0, atk: 'Melee_1H_Attack_Slice_Horizontal', c0: 0.50, c1: 0.80, hit: 'Hit_A', die: 'Death_A', dieLen: 0.8 },
  beast:   { url: 'werewolf.glb',    height: 2.2, lift: [1.7, 0.11, 0.18, 0.31, 0.5], idle: 'Stand - 1', move: 'Walk', moveRate: 2.4, atk: 'Attack - 1', c0: 0.40, c1: 0.62, hit: null, die: 'Death', dieLen: 2.0 },
  brute:   { url: 'troll.glb',       height: 3.0, idle: 'idle', move: 'walk', moveRate: 1.0, atk: 'attack1', c0: 0.86, c1: 1.05, hit: null, die: null, dieLen: 0 },
};
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export function create(ctx) {
  const T = ctx.T, scene = ctx.scene, hgt = ctx.hgt || (() => 0), live = new Map(), free = {}, models = {};
  let calls = 0, tris = 0, skip = 0, frameNo = 0;

  function cloneSkinned(src) {                                           // the same job as three's SkeletonUtils.clone (not importable from a lazy module)
    const clone = src.clone(), a2b = new Map(), b2a = new Map();
    (function par(a, b) { b2a.set(b, a); a2b.set(a, b); for (let i = 0; i < a.children.length; i++) par(a.children[i], b.children[i]); })(src, clone);
    clone.traverse((n) => {
      if (!n.isSkinnedMesh) return; const s = b2a.get(n);
      n.skeleton = s.skeleton.clone(); n.bindMatrix.copy(s.bindMatrix); n.skeleton.bones = s.skeleton.bones.map((b) => a2b.get(b)); n.bind(n.skeleton, n.bindMatrix);
    });
    return clone;
  }
  function trim(clips) {                                                // clips cut from one long timeline start at their original time (the troll's idle at 3.5 s): shift each to 0
    for (const c of clips) { if (c.__t0) continue; let t0 = 1e9; for (const tr of c.tracks) if (tr.times.length) t0 = Math.min(t0, tr.times[0]); if (t0 > 0.05 && t0 < 1e9) { for (const tr of c.tracks) tr.shift(-t0); c.resetDuration(); } c.__t0 = true; }
  }
  async function loadKind(kind) {
    if (models[kind]) return models[kind];
    const sp = SPEC[kind], res = await fetch(ctx.base + '../' + sp.url + (ctx.v || '')); if (!res.ok) throw new Error('foe ' + sp.url + ' ' + res.status);
    const gltf = await ctx.parseGLB(await res.arrayBuffer(), ctx.base); trim(gltf.animations);
    gltf.scene.updateMatrixWorld(true); const bb = new T.Box3().setFromObject(gltf.scene, true), h = bb.getSize(new T.Vector3()).y || 1;
    let n = 0, m = 0; gltf.scene.traverse((o) => { if (o.isMesh) { m++; const g = o.geometry; n += (g.index ? g.index.count : g.attributes.position.count) / 3; } });
    return (models[kind] = { gltf, scale: sp.height / h, foot: -bb.min.y * (sp.height / h), meshes: m, tris: n });
  }
  function make(kind) {
    const M = models[kind], sp = SPEC[kind], root = new T.Group(), body = cloneSkinned(M.gltf.scene), pivot = new T.Group();
    body.scale.setScalar(M.scale); pivot.add(body); root.add(pivot); root.userData.placeholder = true;
    const mats = [];
    body.traverse((o) => {
      if (!(o.isMesh || o.isSkinnedMesh)) return; o.frustumCulled = false; let m = o.material.clone();
      if (m.transparent) {                                                  // the werewolf / troll hair ship as transparent + double sided = two draw passes each: placeholders go opaque / alpha-cut (1 call)
        if (m.isMeshBasicMaterial) m = new T.MeshStandardMaterial({ map: m.map, color: m.color, roughness: 0.85, metalness: 0, side: m.side });
        m.transparent = false; m.depthWrite = true; m.alphaTest = 0.4;
      }
      o.material = m; if (m.emissive) mats.push(m); if (sp.lift && m.color) m.color.setScalar(sp.lift[0]);
    });
    const mixer = new T.AnimationMixer(body), acts = {};
    for (const n of [sp.idle, sp.move, sp.atk, sp.hit, sp.die]) { if (!n || acts[n]) continue; const c = M.gltf.animations.find((x) => x.name === n); if (!c) continue; const a = mixer.clipAction(c); a.play(); a.timeScale = 0; a.setEffectiveWeight(0); acts[n] = { a, d: c.duration, w: 0 }; }
    const e0 = sp.lift ? [sp.lift[1] * sp.lift[4], sp.lift[2] * sp.lift[4], sp.lift[3] * sp.lift[4]] : [0, 0, 0];
    return { kind, sp, M, root, pivot, body, mixer, acts, mats, id: 0, cur: sp.idle, e0 };
  }
  function setPose(inst, e, dt) {
    const sp = inst.sp, A = inst.acts; let name = sp.idle, t = 0, rate = 1;
    switch (e.pose.clip) {
      case 'move': name = sp.move; t = e.pose.t * sp.moveRate; break;
      case 'windup': name = sp.atk; t = (e.pose.t / e.K.tele) * sp.c0; break;
      case 'attack': name = sp.atk; t = sp.c0 + (sp.c1 - sp.c0) * clamp(e.pose.t / 0.15, 0, 1); break;
      case 'recover': name = sp.atk; { const d = A[sp.atk] ? A[sp.atk].d : 1.2; t = sp.c1 + (d - sp.c1) * clamp(e.pose.t / 0.8, 0, 1) * 0.9; } break;
      case 'stagger': name = sp.hit || sp.idle; t = sp.hit ? e.pose.t * 0.95 : e.pose.t; break;
      case 'dead': name = sp.die || sp.idle; t = Math.min(e.pose.t, sp.dieLen || 0); break;
      default: name = sp.idle; t = e.pose.t;
    }
    const o = A[name] || A[sp.idle]; if (!o) return; inst.cur = o === A[name] ? name : sp.idle;
    o.a.time = o.d > 0 ? (e.pose.clip === 'idle' || e.pose.clip === 'move' ? t % o.d : Math.min(t, o.d - 0.001)) : 0;
    const k = Math.min(1, dt / 0.09); for (const n in A) { const q = A[n]; q.w += ((n === inst.cur ? 1 : 0) - q.w) * k; q.a.setEffectiveWeight(q.w); }
    inst.mixer.update(0);
    // procedural bits the placeholders lack: a lean when staggered (no hit clip), a topple when dead (no death clip), a sink at the end of the death
    let lean = 0, sink = 0;
    if (e.state === 'stagger' && !sp.hit) lean = -0.35 * Math.sin(clamp(e.sT / 0.7, 0, 1) * Math.PI);
    if (e.state === 'dead') { if (!sp.die) lean = -1.45 * (1 - Math.pow(1 - clamp(e.sT / 0.6, 0, 1), 2)); sink = clamp((e.sT - 0.75) / 0.45, 0, 1) * 0.9; }
    inst.pivot.rotation.x = lean; inst.sink = sink;
  }

  const api = {
    /** load the models of these kinds (parallel).  Returns the stats of each */
    async load(kinds) { await Promise.all(kinds.map(loadKind)); const out = {}; for (const k of kinds) out[k] = { meshes: models[k].meshes, tris: models[k].tris, scale: +models[k].scale.toFixed(5) }; return out; },
    /** mirror sim.enemies: create / reuse / hide instances, place them, play their clips.  Call once per rendered frame */
    setSkip(n) { skip = n | 0; },
    sync(sim, dt) {
      calls = 0; tris = 0; frameNo++;
      for (const e of sim.enemies) {
        let inst = live.get(e.id);
        if (!inst) { const f = free[e.kind] && free[e.kind].pop(); if (!models[e.kind]) continue; inst = f || make(e.kind); inst.id = e.id; inst.root.visible = true; scene.add(inst.root); live.set(e.id, inst); for (const n in inst.acts) inst.acts[n].w = n === inst.sp.idle ? 1 : 0; }
        inst.seen = sim.S.ticks;
        const y = hgt(e.x, e.z) - (inst.sink || 0); inst.root.position.set(e.x, y, e.z); inst.root.rotation.y = e.yaw;
        if (!skip || e.state === 'windup' || e.state === 'attack' || (frameNo + e.id) % (skip + 1) === 0) setPose(inst, e, dt);
        const f = e.flash > 0 ? Math.min(1, e.flash / 0.12) : 0, wp = e.state === 'windup' ? Math.min(1, e.sT / e.K.tele) : 0, pul = wp * (0.35 + 0.25 * Math.sin(e.sT * 34)); const fz = e.fzT > 0 ? 1 : 0, bn = e.burnT > 0 ? 0.55 + 0.25 * Math.sin(e.sT * 21 + e.id) : 0, sl = e.slowT > 0 ? 1 : 0, rt = e.rootT > 0 ? 1 : 0;   // status tints: freeze = ice blue, burn = flickering orange, slow = pale blue, root = green
        const er = f * 0.55 + pul * 0.9 + inst.e0[0] + bn * 0.7 + fz * 0.20 + sl * 0.03, eg = f * 0.33 + pul * 0.08 + inst.e0[1] + bn * 0.25 + fz * 0.50 + sl * 0.10 + rt * 0.30, eb = f * 0.18 + pul * 0.04 + inst.e0[2] + fz * 0.70 + sl * 0.22 + rt * 0.05;
        for (const m of inst.mats) m.emissive.setRGB(er, eg, eb);
        calls += inst.M.meshes; tris += inst.M.tris;
      }
      for (const [id, inst] of live) if (inst.seen !== sim.S.ticks) { live.delete(id); inst.root.removeFromParent(); inst.root.visible = false; (free[inst.kind] || (free[inst.kind] = [])).push(inst); }
    },
    get(id) { return live.get(id); },
    stats() { return { calls, tris, live: live.size }; },
    heightOf(kind) { return SPEC[kind].height; },
    dispose() { for (const [, inst] of live) inst.root.removeFromParent(); live.clear(); },
  };
  return api;
}
