// rp1c2_cull.mjs — RP1C-R2 Job 3: the planned-town cell split (pure part of cull.js), without a browser.   run: cd client && node /home/claude/dev/rp1c2_cull.mjs  -> «CULL OK»
import { createRequire } from 'module'; const require = createRequire('/home/claude/bot/bluebot_v2/bluewall/client/package.json'); const T = require('three');
import { mergeGeometries } from '/home/claude/bot/bluebot_v2/bluewall/client/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js';
import { splitCells, createCull } from '/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/cull.js';
let fails = 0; const ok = (c, m) => { if (!c) { console.log('FAIL', m); fails++; } else console.log('ok  ', m); };
let rng = 7; const rnd = () => (rng = (rng * 1664525 + 1013904223) % 4294967296) / 4294967296;
// a "town": 400 boxes spread over 300 m, baked into world space, merged into ONE geometry with the game's per-vertex `aB`
const geos = []; for (let i = 0; i < 400; i++) { const g = new T.BoxGeometry(2 + rnd() * 6, 3 + rnd() * 6, 2 + rnd() * 6); g.translate((rnd() - 0.5) * 300, 3, (rnd() - 0.5) * 300); const ab = new Float32Array(g.attributes.position.count).fill(i % 7); g.setAttribute('aB', new T.BufferAttribute(ab, 1)); geos.push(g); }
const geo = mergeGeometries(geos, false), mat = new T.MeshBasicMaterial(), mesh = new T.Mesh(geo, mat); mesh.name = 'homes-tr2:test';
const tri = geo.index.count / 3, t0 = Date.now(), parts = splitCells(T, mesh, 64), ms = Date.now() - t0;
ok(parts && parts.length >= 12, 'the chunk is cut into ' + (parts && parts.length) + ' cells of 64 m (' + tri + ' triangles, ' + ms + ' ms)');
ok(parts.reduce((s, p) => s + p.tris, 0) === tri && parts.reduce((s, p) => s + p.geo.index.count / 3, 0) === tri, 'every triangle is in exactly one cell (' + tri + ' in, ' + parts.reduce((s, p) => s + p.geo.index.count / 3, 0) + ' out)');
// each triangle's world vertices survive: compare a signature (sum of all coordinates + aB) of the whole chunk and of the cells
const sig = (g) => { let s = 0, b = 0; const P = g.attributes.position, A = g.attributes.aB, I = g.index; for (let i = 0; i < I.count; i++) { const v = I.getX(i); s += P.getX(v) * 1.3 + P.getY(v) * 0.7 + P.getZ(v) * 1.1; b += A.getX(v); } return [s, b]; };
const s0 = sig(geo), s1 = parts.reduce((a, p) => { const q = sig(p.geo); return [a[0] + q[0], a[1] + q[1]]; }, [0, 0]);
ok(Math.abs(s0[0] - s1[0]) < 1e-2 * Math.abs(s0[0] / 1e3 + 1) && s0[1] === s1[1], 'positions and the `aB` attribute are carried over unchanged (checksums ' + s0[0].toFixed(1) + ' / ' + s1[0].toFixed(1) + ', aB ' + s0[1] + ' / ' + s1[1] + ')');
ok(['position', 'normal', 'uv', 'aB'].every((k) => parts.every((p) => p.geo.attributes[k] && p.geo.attributes[k].count === p.geo.attributes.position.count)), 'every attribute (position, normal, uv, aB) is present with the cell\'s own vertex count');
ok(parts.every((p) => p.x1 - p.x0 < 64 + 12 + 1 && p.z1 - p.z0 < 64 + 12 + 1), 'a cell is at most 64 m + one box wide: ' + Math.max(...parts.map((p) => Math.max(p.x1 - p.x0, p.z1 - p.z0))).toFixed(0) + ' m');
ok(parts.every((p) => p.geo.boundingSphere && p.geo.boundingSphere.radius > 0), 'bounding spheres exist (three culls each cell by its own sphere)');
// not-plain geometries are left alone
{ const m2 = new T.Mesh(geo.clone(), mat); m2.geometry.addGroup(0, 30, 0); m2.geometry.addGroup(30, 30, 1); ok(splitCells(T, m2) === null, 'a geometry with groups is not cut (null)'); }
{ const g3 = new T.BoxGeometry(1, 1, 1).toNonIndexed(); g3.clearGroups(); g3.translate(30, 2, 30); const r = splitCells(T, new T.Mesh(g3, mat), 64); ok(r && r.length === 1 && r[0].tris === 12, 'a non-indexed geometry works (' + (r && r[0].tris) + ' triangles)'); }

// ---- RP1C-R2 Job 1b: the matrix savings (subtrees under an invisible node; the frames between two world updates) — the picture must be IDENTICAL to a scene that is fully updated every frame
{
  const mk = () => {
    const scene = new T.Scene(), w = { stat: [], anim: [], pool: null, hero: null };
    for (let i = 0; i < 60; i++) { const m = new T.Mesh(new T.BoxGeometry(1, 1, 1), mat); m.position.set(i * 3, 0, 0); scene.add(m); w.stat.push(m); }
    const grp = new T.Group(); grp.name = 'life'; scene.add(grp); for (let i = 0; i < 20; i++) { const m = new T.Mesh(new T.BoxGeometry(1, 1, 1), mat); grp.add(m); w.anim.push(m); }
    const pool = new T.Group(); pool.name = 'pool'; scene.add(pool); w.pool = pool; pool.visible = false;
    for (let i = 0; i < 40; i++) { const g = new T.Group(); pool.add(g); for (let j = 0; j < 20; j++) { const m = new T.Group(); g.add(m); } }
    return { scene, w };
  };
  const A = mk(), B = mk(); B.scene.name = 'ref';                                                         // A = with the savings, B = reference: every node recomputed every frame
  const S = { where: 'home', x: 0, z: 0 }, key = new T.DirectionalLight(); key.castShadow = true;
  const H = { THREE: T, renderer: { shadowMap: { enabled: false, render() { } } }, scene: A.scene, world: { key }, reach: { mtx: false } };
  const diet = { STRUCT: /^$/, STEPS: [{ cullR: 100, hideR: 90, hideH: 160 }], st: { lvl: 0 } };
  const C = createCull(H, S, diet); C.enter();
  // the world: animates its group on world-update frames only (every 2nd drawn frame), the hero node is moved every frame
  const hero = (sc) => { const g = new T.Group(); g.name = 'hero'; sc.add(g); return g; }; const hA = hero(A.scene), hB = hero(B.scene);
  let maxDiff = 0, nSkip = 0, frame = 0, rendered = 0;
  const diff = (a, b) => { let d = 0; const la = [], lb = []; a.traverse((o) => { if (o.visible !== false) la.push(o); }); b.traverse((o) => { if (o.visible !== false) lb.push(o); });
    if (la.length !== lb.length) return 1e9; for (let i = 0; i < la.length; i++) { const x = la[i].matrixWorld.elements, y = lb[i].matrixWorld.elements; for (let k = 0; k < 16; k++) d = Math.max(d, Math.abs(x[k] - y[k])); } return d; };
  for (frame = 0; frame < 120; frame++) {
    const worldFrame = frame % 2 === 0;
    for (const W of [A, B]) if (worldFrame) W.w.anim.forEach((m, i) => { m.position.set(i * 2, Math.sin(frame * 0.1 + i), 3); m.rotation.y = frame * 0.05; });
    if (frame === 60) { A.w.pool.visible = true; B.w.pool.visible = true; A.w.pool.position.set(5, 0, 0); B.w.pool.position.set(5, 0, 0); A.w.pool.children[3].children[4].position.set(1, 2, 3); B.w.pool.children[3].children[4].position.set(1, 2, 3); }   // the world shows a pooled unit
    if (frame === 90) { A.w.pool.visible = false; B.w.pool.visible = false; A.w.pool.children[2].children[1].position.set(9, 9, 9); B.w.pool.children[2].children[1].position.set(9, 9, 9); }                 // hides again, moves a hidden child
    for (const [h, W] of [[hA, A], [hB, B]]) h.position.set(frame * 0.1, 0, 0);
    A.scene.matrixWorldAutoUpdate = worldFrame;                                                          // main.js: off on the frames in between
    C.tick(5e6 + frame * 16.7);                                                                         // cull.js tick = thaw/freeze + the hero's own nodes
    if (!A.scene.matrixWorldAutoUpdate) nSkip++;
    A.scene.updateMatrixWorld(); if (A.scene.matrixWorldAutoUpdate === false) { /* the renderer skips it too */ }   // (three's renderer.render calls scene.updateMatrixWorld() only when matrixWorldAutoUpdate)
    B.scene.updateMatrixWorld();
    const d = diff(A.scene, B.scene); maxDiff = Math.max(maxDiff, d); rendered++;
    if (frame === 2) ok(C.mx.frozen.length >= 1 && C.mx.nodes >= 800, 'the hidden pool (' + C.mx.nodes + ' nodes below it) is frozen out of the matrix update');
  }
  ok(maxDiff < 1e-9, 'identical picture: over ' + rendered + ' frames (' + nSkip + ' of them without the scene update) the world matrices of every VISIBLE node equal the fully updated reference (max diff ' + maxDiff.toExponential(1) + ')');
  C.tick(5e6 + 120 * 16.7 + 2500); ok(A.w.pool.visible === false && C.mx.frozen.length >= 1, 'the pool is hidden again and frozen again at the next scan (2 s) after the world hid it');
  // a node that gets visible is thawed BEFORE the draw, and its children have current matrices at once
  A.w.pool.visible = true; B.w.pool.visible = true; A.w.pool.children[5].children[2].position.set(4, 4, 4); B.w.pool.children[5].children[2].position.set(4, 4, 4); A.scene.matrixWorldAutoUpdate = true; C.tick(9e6); A.scene.updateMatrixWorld(); B.scene.updateMatrixWorld();
  ok(diff(A.scene, B.scene) < 1e-9 && C.mx.frozen.length === 0, 'shown again: thawed in the same frame, matrices right (' + C.mx.frozen.length + ' frozen)');
  // exit puts everything back
  A.w.pool.visible = false; C.tick(9.1e6); C.tick(9.2e6 + 3000); const nNoop = []; A.scene.traverse((o) => { if (Object.prototype.hasOwnProperty.call(o, 'updateMatrixWorld')) nNoop.push(o); });
  const had = nNoop.length; C.exit(); const left = []; A.scene.traverse((o) => { if (Object.prototype.hasOwnProperty.call(o, 'updateMatrixWorld')) left.push(o); });
  ok(had > 0 && left.length === 0 && A.scene.matrixWorldAutoUpdate === true, 'exit(): ' + had + ' no-op update functions removed, scene.matrixWorldAutoUpdate back to true');
  // what it saves (node, rough): scene of 4300 nodes, 2000 of them hidden
  const big = new T.Scene(); for (let i = 0; i < 2300; i++) { const m = new T.Object3D(); m.position.set(i, 0, 0); big.add(m); } const bp = new T.Group(); bp.visible = false; big.add(bp); for (let i = 0; i < 100; i++) { const g = new T.Group(); bp.add(g); for (let j = 0; j < 19; j++) g.add(new T.Object3D()); }
  const tm = (f) => { f(); const t = process.hrtime.bigint(); for (let i = 0; i < 60; i++) f(); return Number(process.hrtime.bigint() - t) / 60e6; };
  const full = tm(() => big.updateMatrixWorld()); const kids = bp.children.slice(); const NO = function () { }; for (const c of kids) c.updateMatrixWorld = NO; const cut = tm(() => big.updateMatrixWorld());
  console.log('     (node, desktop JIT: scene of ' + (2300 + 1 + 100 * 20) + ' nodes, 2000 hidden: update ' + full.toFixed(3) + ' ms -> ' + cut.toFixed(3) + ' ms with the hidden pool frozen)'); ok(cut < full * 0.7, 'the frozen pool makes the matrix update ' + (full / cut).toFixed(1) + 'x cheaper');
}
console.log(fails ? 'CULL FAILED' : 'CULL OK'); process.exit(fails ? 1 : 0);
