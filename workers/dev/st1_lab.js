// st1_lab.js — ST1 lab: renders numbered contact sheets lit like the game, from the real tr2 loader + the real storeyards.js (when it exists).
//   window.__models(cells, {cw,ch,cols})   cells = [{ spec, o:{w|h|k}, label, az, polar, dist, ty }]    single Tripo models / pack nodes (no atlas)
//   window.__yards(cells, {cw,ch,cols})    cells = [{ look, id, fill, lv, label, az, polar, dist, ty, w, h }]   the real storeyards.js
import * as THREE from 'three';
import { tr2 } from '../bot/bluebot_v2/bluewall/client/src/tr2lib.js';
import { makeMaterials } from '../bot/bluebot_v2/bluewall/client/src/materials.js';
import { Batcher } from '../bot/bluebot_v2/bluewall/client/src/util.js';
import { applySkin, uLv } from '../bot/bluebot_v2/bluewall/client/src/skin.js';
import { buildAtlas, fileOfSpec, specOf } from '../bot/bluebot_v2/bluewall/client/src/tr2atlas.js';
import { bakeTr2 } from '../bot/bluebot_v2/bluewall/client/src/village.js';
import * as Y from '../bot/bluebot_v2/bluewall/client/src/storeyards.js';
import { gemGeometry, gemMaterial, gemPileMaterial } from '../bot/bluebot_v2/bluewall/client/src/gemgeo.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fb8d8); scene.fog = new THREE.Fog(0x9fb8d8, 120, 320);
scene.add(new THREE.HemisphereLight(0xdbe7ff, 0x55603f, 1.5));
const sun = new THREE.DirectionalLight(0xfff1d6, 3.0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 220 }); scene.add(sun); scene.add(sun.target);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: 0x6d8f4a, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 1000);
const label = (c2, x, y, n, text, sub, cw) => {
  c2.fillStyle = 'rgba(8,12,28,0.8)'; c2.fillRect(x, y, cw, 34); c2.fillStyle = '#fff'; c2.font = 'bold 22px sans-serif'; c2.fillText(String(n), x + 8, y + 25);
  c2.font = '14px sans-serif'; c2.fillStyle = '#cfe3ff'; c2.fillText(text, x + 44, y + 15); if (sub) { c2.fillStyle = '#9fd'; c2.fillText(sub, x + 44, y + 30); }
};
function frame(c, cw, ch, bb) {
  const ctr = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3()), R = Math.max(sz.x, sz.z, sz.y * 1.2) * 0.5;
  const dist = c.dist || R * 3.0, az = c.az != null ? c.az : 0.6, po = c.polar != null ? c.polar : 1.0, ty = c.ty != null ? c.ty : ctr.y * 0.9;
  camera.aspect = cw / ch; camera.position.set(ctr.x + Math.sin(az) * Math.sin(po) * dist, Math.cos(po) * dist + ty, ctr.z + Math.cos(az) * Math.sin(po) * dist); camera.lookAt(ctr.x, ty, ctr.z); camera.updateProjectionMatrix();
  sun.position.set(ctr.x + 40, 70, ctr.z + 50); sun.target.position.set(ctr.x, 0, ctr.z);
}
async function sheet(cells, o, build) {
  const cw = o.cw || 360, ch = o.ch || 300, cols = o.cols || 3, rows = Math.ceil(cells.length / cols);
  renderer.setSize(cw, ch); const cv = document.getElementById('out'); cv.width = cw * cols; cv.height = ch * rows; const c2 = cv.getContext('2d'); c2.fillStyle = '#10151f'; c2.fillRect(0, 0, cv.width, cv.height);
  const stats = [];
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i], g = new THREE.Group(); scene.add(g);
    let info = {}; try { info = (await build(c, g)) || {}; } catch (e) { console.warn('cell', i + 1, e); info = { err: String(e).slice(0, 80) }; }
    const bb = new THREE.Box3().setFromObject(g); if (bb.isEmpty()) bb.set(new THREE.Vector3(-3, 0, -3), new THREE.Vector3(3, 3, 3));
    frame(c, cw, ch, bb); renderer.info.reset(); renderer.render(scene, camera);
    const x = (i % cols) * cw, y = Math.floor(i / cols) * ch; c2.drawImage(renderer.domElement, x, y);
    const sz = bb.getSize(new THREE.Vector3());
    label(c2, x, y, c.n || i + 1, c.label || c.spec || (c.look + ' ' + c.id), `${sz.x.toFixed(1)}×${sz.y.toFixed(1)}×${sz.z.toFixed(1)} m · ${info.tris != null ? Math.round(info.tris / 100) / 10 + 'k tris · ' : ''}${renderer.info.render.calls} calls${info.err ? ' ERR ' + info.err : ''}`, cw);
    c2.strokeStyle = '#000'; c2.strokeRect(x, y, cw, ch); stats.push({ n: c.n || i + 1, size: sz.toArray().map((v) => +v.toFixed(2)), calls: renderer.info.render.calls, ...info });
    scene.remove(g); g.traverse((m) => { if (m.geometry && !m.userData.keep) m.geometry.dispose(); });
  }
  return stats;
}
const triOf = (g) => { let t = 0; g.traverse((m) => { if (m.isMesh) t += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3 * (m.isInstancedMesh ? m.count : 1); }); return t; };
let ready = tr2.init().then(() => { window.__ready = true; }).catch((e) => { window.__err = String(e); });
window.__models = async (cells, o = {}) => {
  await ready;
  await tr2.load([...new Set(cells.map((c) => c.spec.split('/')[0]))]);
  return sheet(cells, o, async (c, g) => {
    for (const p of tr2.parts(c.spec, c.o || {})) { const m = new THREE.Mesh(p.geometry, p.material); m.castShadow = m.receiveShadow = true; m.userData.keep = true; g.add(m); }
    return { tris: triOf(g), info: tr2.info(c.spec, c.o || {}).size.map((v) => +v.toFixed(2)) };
  });
};

// ---- the yards: the real storeyards.js on flat ground, lit like the game
const M = makeMaterials(); applySkin(M.stone, 0); applySkin(M.stoneDark, 1); applySkin(M.roof, 2); applySkin(M.gold, 3); applySkin(M.rune, 4);
let atlas = null;
const ALLHAVE = Object.fromEntries(Object.keys(Y.STORAGE).map((id) => [id, Y.storageSpec(id)]));      // the storage_* family (cell flag `have`)
async function getAtlas() {
  if (atlas) return atlas;
  Y.setStorageHave({}); const n0 = Y.yardPieceNames(0); Y.setStorageHave(ALLHAVE); const names = [...new Set([...n0, ...Y.yardPieceNames(0)])], files = [...new Set(names.map((n) => fileOfSpec(specOf(n).spec)))];
  await tr2.load(files); const H = {}; for (const n of names) { try { const { spec, o } = specOf(n); H[n] = tr2.info(spec, o).size[1]; } catch (e) {} } Y.setPieceHeights(H); console.log('HALLH', JSON.stringify(H)); atlas = buildAtlas(tr2, names, { name: 'st1', width: 2112 }); return atlas;
}
window.__yards = async (cells, o = {}) => {
  await ready; const A = await getAtlas(); Y.initYardLevels();
  return sheet(cells, o, async (c, g) => {
    Y.setStorageHave(c.have ? ALLHAVE : {});
    const B = new Batcher(), tri = [];
    const ctx = { torch(x, y, z) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, y, 6), M.wood); post.position.set(x, y / 2, z); g.add(post); const f = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), M.fire); f.position.set(x, y + 0.3, z); g.add(f); },
      banner() {}, pool() {}, tgt() { return 1; }, pick() {}, live() {}, levelHooks: [] };
    const env = { B, M, height: () => 0, tri, ctx, bid: 0 };
    const ids = c.ids || [c.id], pitch = c.pitch || 19;
    ids.forEach((id, i) => Y.labBuildYard(env, c.look || 1, { id, x: (i - (ids.length - 1) / 2) * pitch, z: 0, ry: c.ry || 0, r: 13, kind: 'store' }));
    if (c.fill != null) for (const id of ids) Y.setHeapFill(id, c.fill);
    B.build(g, { cast: true, receive: true });
    bakeTr2(g, A, tri, { shadows: true, tag: 'st1' });
    g.traverse((m) => { if (m.isMesh) m.userData.keep = true; });
    return { tris: triOf(g), pieces: tri.length };
  });
};
window.__tiers = async (cells, o = {}) => {
  await ready;
  return sheet(cells, o, async (c, g) => {
    const B = new Batcher(); const lv = [2, 5, 9, 13, 17, 20];
    lv.forEach((L, i) => { uLv.value[17 + i] = L; B.tag(17 + i, 1);
      const x = (i - 2.5) * 5; const mk = (mat, y, sx, sy, sz, tint) => B.add(new THREE.BoxGeometry(1, 1, 1), M[mat], new THREE.Matrix4().compose(new THREE.Vector3(x, y, 0), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sz)), { worldUV: 0.1, tint });
      mk('stone', 1.5, 3.4, 3, 3.4, 0xffffff); mk('stoneDark', 0.3, 4, 0.6, 4, 0xffffff); mk('gold', 3.4, 3.4, 0.4, 3.4, 0xffffff);
      B.add(new THREE.CylinderGeometry(0.01, 2.6, 2, 4), M.roof, new THREE.Matrix4().makeTranslation(x, 4.6, 0), { tint: 0xffffff, uvScale: [2, 2] }); });
    B.build(g); g.traverse((m) => { if (m.isMesh) m.userData.keep = true; }); return {};
  });
};

// ---- the gem vaults (static hall from storeyards.js + a lab copy of vault.js's live parts: crown gem, floating gem, pile) and the central crystal
const GEMC = { ruby: 0xff3a5c, emerald: 0x3dff94, turq: 0x4ae8ff };
function labCtx(g) {
  return { torch(x, y, z) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, y, 6), M.wood); post.position.set(x, y / 2, z); g.add(post); const f = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), M.fire); f.position.set(x, y + 0.3, z); g.add(f); },
    banner() {}, pool() {}, tgt() { return 1; }, pick() {}, live() {}, levelHooks: [] };
}
window.__vaults = async (cells, o = {}) => {
  await ready; const A = await getAtlas(); Y.initYardLevels();
  return sheet(cells, o, async (c, g) => {
    Y.setStorageHave(c.have ? ALLHAVE : {});
    const B = new Batcher(), tri = [], ctx = labCtx(g), env = { B, M, height: () => 0, tri, ctx, bid: 0 };
    const ids = c.ids || [c.id], pitch = c.pitch || 19;
    ids.forEach((id, i) => {
      const H = Y.labBuildVault(env, c.look || 1, { id, x: (i - (ids.length - 1) / 2) * pitch, z: 0, ry: c.ry || 0, kind: 'vault' });
      const cs = Math.cos(c.ry || 0), sn = Math.sin(c.ry || 0), P = (lx, lz) => [H.P ? H.P(lx, lz)[0] : 0, H.P ? H.P(lx, lz)[1] : 0];
      const [cx, cz] = H.P(0, -3); const geo = gemGeometry(id);
      const crown = new THREE.Mesh(geo, gemMaterial(id, { envMapIntensity: 1.25, glow: 0.32 })); crown.position.set(cx, H.y0 + H.crownY, cz); crown.scale.setScalar(c.k || 4.6); g.add(crown);
      const hero = new THREE.Mesh(geo, gemMaterial(id, { envMapIntensity: 1.6, glow: 0.45 })); hero.position.set(cx, H.y0 + H.heroY, cz); hero.scale.setScalar(1.6); g.add(hero);
      const [px, pz] = H.P(H.basin[0], H.basin[1]); const N = Math.round(120 * (c.fill != null ? c.fill : 0.6)); const pile = new THREE.InstancedMesh(geo, gemPileMaterial(id), N); let sd = 7; const rd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < N; i++) { const rr = H.pileR * Math.sqrt(rd()), a = rd() * 6.283, h = 0.4 + 1.9 * Math.pow(1 - rr / (H.pileR + 0.2), 1.5), sc = 0.5 + rd() * 0.38; const m4 = new THREE.Matrix4().compose(new THREE.Vector3(px + Math.cos(a) * rr, H.y0 + 1.05 + h * 0.9, pz + Math.sin(a) * rr), new THREE.Quaternion().setFromEuler(new THREE.Euler(rd() * 1.6 - 0.8, rd() * 6.28, rd() * 1.6 - 0.8)), new THREE.Vector3(sc, sc, sc)); pile.setMatrixAt(i, m4); }
      g.add(pile);
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.glowWhite, color: GEMC[id], blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.4 })); gl.position.copy(hero.position); gl.scale.setScalar(11); g.add(gl);
    });
    B.build(g, { cast: true, receive: true });
    bakeTr2(g, A, tri, { shadows: true, tag: 'st1' });
    g.traverse((m) => { if (m.isMesh || m.isSprite) m.userData.keep = true; });
    return { tris: triOf(g), pieces: tri.length };
  });
};
window.__crystal = async (cells, o = {}) => {
  await ready; const A = await getAtlas(); Y.initYardLevels();
  return sheet(cells, o, async (c, g) => {
    const B = new Batcher(), tri = [], ctx = { ...labCtx(g), B, tri }, y0 = 0.15;
    // the old plinth + pillars of buildings.js (they stay under every look)
    B.tag(0); const T0 = { worldUV: 0.25 };
    B.add(new THREE.CylinderGeometry(3.4, 4, 0.7, 20), M.stoneDark, new THREE.Matrix4().makeTranslation(0, y0 + 0.35, 0), { ...T0, tint: 0xa9adb8 });
    B.add(new THREE.CylinderGeometry(2.2, 2.9, 1.3, 16), M.stone, new THREE.Matrix4().makeTranslation(0, y0 + 1.3, 0), { ...T0, tint: 0xffffff });
    B.add(new THREE.CylinderGeometry(2.25, 2.25, 0.3, 16, 1, true), M.rune, new THREE.Matrix4().makeTranslation(0, y0 + 1.5, 0), { uvScale: [1.3, 1] });
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28, x = Math.cos(a) * 6.8, z = Math.sin(a) * 6.8; B.add(new THREE.BoxGeometry(0.9, 3.6, 0.9), M.stone, new THREE.Matrix4().compose(new THREE.Vector3(x, 1.8, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a), new THREE.Vector3(1, 1, 1)), T0); B.add(new THREE.OctahedronGeometry(0.45), M.crystal, new THREE.Matrix4().makeTranslation(x, 4.1, z)); }
    const C = Y.labBuildCrystal(ctx, M, 0, y0 + 5.4, 0, c.look || 1, { atlas: A }, (sc, at, list, op) => bakeTr2(sc, at, list, op));
    B.build(g, { cast: true, receive: true });
    bakeTr2(g, A, tri, { shadows: true, tag: 'st1' });
    if (C && C.mesh) { C.mesh.position.set(0, y0 + 5.4 + (C.lift || 0), 0); g.add(C.mesh); }
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.glowBlue, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 })); gl.position.set(0, y0 + 5.4, 0); gl.scale.setScalar(13); g.add(gl);
    g.traverse((m) => { if (m.isMesh || m.isSprite) m.userData.keep = true; });
    return { tris: triOf(g) };
  });
};
