// WC1 dev harness (dev only, never shipped).  Loads a sister's GLB + library weapon packs, mounts weapons through the REAL combat/carry.js (a real ES module from assets/rpg/combat/),
// poses the hero with her real clips, renders panels (viewport + scissor) into one canvas for the numbered sheets, and measures clip penetration.   Driver: dev/wc1_*.py   Serve: dir with assets/ + packs/ + this bundle.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const q = new URLSearchParams(location.search);
const W0 = +(q.get('w') || 844), H0 = +(q.get('h') || 390), SC = 1.75 / 0.98;
const parse = (buf, path) => { const l = new GLTFLoader(); l.setMeshoptDecoder(MeshoptDecoder); return l.parseAsync(buf, path); };
const base = new URL('assets/', location.href).href, rpgBase = base + 'rpg/', packBase = new URL('packs/', location.href).href;
const root = document.getElementById('game'); root.style.cssText = 'position:fixed;left:0;top:0;width:' + W0 + 'px;height:' + H0 + 'px;overflow:hidden;background:#0b111b';
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W0, H0); root.appendChild(renderer.domElement); renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2; renderer.setScissorTest(true);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1b2536);
const camera = new THREE.PerspectiveCamera(34, W0 / H0, 0.05, 60); scene.add(camera);
scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x3a2f26, 1.25)); const sun = new THREE.DirectionalLight(0xfff0dc, 2.4); sun.position.set(-3, 6, 5); scene.add(sun); const rim = new THREE.DirectionalLight(0x9ec4ff, 1.1); rim.position.set(4, 3, -5); scene.add(rim);
const floor = new THREE.Mesh(new THREE.CircleGeometry(2.4, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2b3648, roughness: 0.95 })); scene.add(floor);

const hero = { grp: new THREE.Group(), model: null, mixer: null, clips: [], key: '' }; scene.add(hero.grp);
const cache = {};
const fetchGLB = async (url) => { if (cache[url]) return cache[url]; const r = await fetch(url); if (!r.ok) throw new Error('fetch ' + url + ' ' + r.status); return (cache[url] = await parse(await r.arrayBuffer(), url.slice(0, url.lastIndexOf('/') + 1))); };

async function loadHero(key) {
  if (hero.model) { hero.grp.remove(hero.model); hero.model = null; }
  const g = await parse(await (await fetch(rpgBase + key + '.glb')).arrayBuffer(), rpgBase), model = g.scene;
  model.scale.setScalar(SC); hero.model = model; hero.key = key; hero.grp.add(model); model.traverse((o) => { if (o.isMesh || o.isSkinnedMesh) o.frustumCulled = false; });
  hero.mixer = new THREE.AnimationMixer(model); hero.clips = g.animations; hero.acts = {}; hero.cur = null; model.updateMatrixWorld(true);
  return { clips: hero.clips.map((c) => c.name + ':' + c.duration.toFixed(2)), bones: boneInfo() };
}
function boneInfo() {                                                // bind-ish pose (node TRS) of the interesting bones in HERO frame (model root units / scale 1)
  const out = {}, inv = new THREE.Matrix4().copy(hero.model.matrixWorld).invert(), v = new THREE.Vector3();
  hero.model.traverse((o) => { if (o.isBone && /^(Pelvis|Spine0\d|Spine\d|Neck|Head|[LR]_(Hand|UpperArm|Forearm|Clavicle|Shoulder|Thigh|Calf|Foot)|Hips|Root)/.test(o.name)) { v.setFromMatrixPosition(o.matrixWorld).applyMatrix4(inv); out[o.name] = [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)]; } });
  return out;
}
function pose(clip, t) {                                             // freeze the hero in one clip at time t (seconds)
  for (const n in hero.acts) { hero.acts[n].stop(); }
  const c = hero.clips.find((a) => a.name === clip); if (!c) throw new Error('no clip ' + clip);
  const a = hero.acts[clip] || (hero.acts[clip] = hero.mixer.clipAction(c)); a.reset(); a.play(); a.paused = true; a.time = Math.min(t, c.duration - 1e-3); a.setEffectiveWeight(1); a.setEffectiveTimeScale(0); hero.mixer.update(0); hero.model.updateMatrixWorld(true); return c.duration;
}
async function probePack(key) {                                       // every object of a library pack: size, pivot, triangle count (pack scene space)
  const g = await fetchGLB(packBase + key + '/' + key + '.glb'), out = [];
  g.scene.updateMatrixWorld(true);
  const list = g.scene.children.length === 1 && g.scene.children[0].children.length > 1 ? g.scene.children[0].children : g.scene.children;
  for (const o of list) { const b = new THREE.Box3().setFromObject(o); let tris = 0; o.traverse((m) => { if (m.isMesh) tris += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; }); const s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3());
    out.push({ name: o.name, size: [s.x, s.y, s.z].map((x) => +x.toFixed(3)), min: b.min.toArray().map((x) => +x.toFixed(3)), max: b.max.toArray().map((x) => +x.toFixed(3)), pos: o.position.toArray().map((x) => +x.toFixed(3)), rot: [o.rotation.x, o.rotation.y, o.rotation.z].map((x) => +x.toFixed(3)), tris }); }
  return { n: list.length, objs: out };
}
async function pickObject(packKey, name) {                            // a fresh clone of one pack object (the pack is cached; geometry / material shared)
  const g = await fetchGLB(packBase + packKey + '/' + packKey + '.glb'); let found = null;
  g.scene.traverse((o) => { if (!found && o.name === name) found = o; }); if (!found) throw new Error('no object ' + name + ' in ' + packKey);
  const c = found.clone(true); c.position.set(0, 0, 0); c.quaternion.identity(); c.scale.set(1, 1, 1); c.updateMatrixWorld(true); return c;
}
function cam(az, el, dist, ty, fov, tx = 0, tz = 0) {                  // orbit round (tx, ty, tz); az 0 = looking at her FRONT (camera on +Z), PI = from behind
  const ce = Math.cos(el), x = tx + Math.sin(az) * ce * dist, y = ty + Math.sin(el) * dist, z = tz + Math.cos(az) * ce * dist;
  camera.position.set(x, y, z); camera.lookAt(tx, ty, tz); if (fov) camera.fov = fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
}
function panel(x, y, w, h, bg) {                                       // render the scene into a canvas region (CSS px, origin top-left)
  const H = renderer.domElement.height; renderer.setViewport(x, H - y - h, w, h); renderer.setScissor(x, H - y - h, w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  if (bg != null) scene.background.set(bg); renderer.render(scene, camera);
}
const labels = [];
function label(text, x, y, o = {}) { const d = document.createElement('div'); d.className = 'lab'; d.textContent = text; d.style.cssText = `left:${x}px;top:${y}px;font-size:${o.size || 16}px;font-weight:${o.bold ? 700 : 400};color:${o.color || '#fff'}`; root.appendChild(d); labels.push(d); return d; }
function clearLabels() { for (const d of labels) d.remove(); labels.length = 0; }
function resize(w, h) { root.style.width = w + 'px'; root.style.height = h + 'px'; renderer.setSize(w, h); }


// ------------------------------------------------------------------ dress a sister with library weapons through the REAL carry.js, pose her, render panels
let MODS = null, ctl = null; const extras = [];
async function mods() { if (!MODS) MODS = { carry: await import(base + 'rpg/combat/carry.js'), combat: await import(base + 'rpg/combat.js') }; return MODS; }
function haloTexture() { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
const HALO = haloTexture();
function gemOf(M, key) { const el = M.combat.ELEMENTS[M.combat.SISTERS[key].element]; return { ...M.carry.gemLook(THREE, el), el: el.color, name: M.combat.SISTERS[key].element }; }
async function dress(o) {                       // o = { sister, items:[{pack, name, kind, len, slot, carry, gem}], drawn, clip, t, quiet }
  const M = await mods(); if (hero.key !== o.sister || !hero.model) await loadHero(o.sister);
  if (ctl) { ctl.dispose(); ctl = null; } for (const x of extras) x.removeFromParent(); extras.length = 0;
  const items = [];
  for (const s of o.items) { const obj = await pickObject(s.pack, s.name); const grp = M.carry.unitWeapon(THREE, obj, s.kind); grp.traverse((m) => { if (m.isMesh) { m.frustumCulled = false; m.castShadow = false; } }); items.push({ obj: grp, flipped: grp.userData.flipped, w: { slot: s.slot || 'R', len: s.len, kind: s.kind, carry: s.carry, gem: s.gem, grip: s.grip } }); }
  pose(o.clip || 'idle', o.t == null ? 1.0 : o.t);
  const gem = o.nogem ? null : gemOf(M, o.sister); ctl = M.carry.create({ T: THREE, hero, items, gem, emit: null });
  pose(o.clip || 'idle', o.t == null ? 1.0 : o.t); ctl.setDrawn(!!o.drawn); hero.model.updateMatrixWorld(true);
  if (gem) { ctl.items.forEach((e, i) => { if (!e.gem) return; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: HALO, color: new THREE.Color(gem.glow[0], gem.glow[1], gem.glow[2]), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5 })); sp.scale.setScalar(0.15); sp.userData.gi = i; scene.add(sp); extras.push(sp); }); }
  return { gem, kinds: ctl.items.map((e) => e.kind + ':' + e.car) };
}
function syncHalo() { const v = new THREE.Vector3(); for (const sp of extras) { if (ctl.gemWorld(sp.userData.gi, v)) sp.position.copy(v); } }
function setDrawn(b) { ctl.setDrawn(b); hero.model.updateMatrixWorld(true); syncHalo(); }
function weaponBox() { const b = new THREE.Box3(); for (const e of ctl.items) b.expandByObject(e.grp); return b; }
function frameFigure(az, el, fov, dist, ty) { cam(az, el, dist || 3.3, ty == null ? 0.95 : ty, fov || 32); }
function frameWeapon(az, el, fov) { const b = weaponBox(), c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3()), r = Math.max(s.x, s.y, s.z) * 0.62; cam(az, el, r / Math.tan((fov || 32) * Math.PI / 360) + 0.3, c.y, fov || 32, c.x, c.z); }

function showcase(on) {                          // weapons alone, laid horizontally (tip right), stacked: the close-up row of a sheet
  const T = THREE; hero.grp.visible = !on; floor.visible = !on; if (!ctl) return;
  if (!on) { ctl.setDrawn(false); syncHalo(); return; }
  const g = ctl.items; let y = 0; const gap = 0.12;
  g.forEach((e, i) => { scene.add(e.grp); e.grp.scale.setScalar(e.base); e.grp.quaternion.setFromAxisAngle(new T.Vector3(0, 0, 1), -Math.PI / 2); e.grp.position.set(0, 0, 0); e.grp.updateMatrixWorld(true); const b = new T.Box3().setFromObject(e.grp), c = b.getCenter(new T.Vector3()); e.grp.position.set(-c.x, y - c.y, 0); y -= (b.max.y - b.min.y) + gap; });
  scene.updateMatrixWorld(true); const bb = new T.Box3(); g.forEach((e) => bb.expandByObject(e.grp)); const c = bb.getCenter(new T.Vector3()), sz = bb.getSize(new T.Vector3());
  syncHalo(); return { w: sz.x, h: sz.y, cx: c.x, cy: c.y };
}
function frameShowcase(aspect, fov) { const bb = new THREE.Box3(); ctl.items.forEach((e) => bb.expandByObject(e.grp)); const c = bb.getCenter(new THREE.Vector3()), s = bb.getSize(new THREE.Vector3()); const f = fov || 26, need = Math.max(s.y * 1.25, (s.x * 1.12) / aspect), d = need / (2 * Math.tan(f * Math.PI / 360)); cam(0.0, 0.0, d, c.y, f, c.x, 0); }
const getCtl = () => ctl;


// ------------------------------------------------------------------ penetration proxy (dev proof): the weapon's + fittings' surface points against the SKINNED body (all skinned meshes: skin, clothes, cape).
// Signed distance = dot(p - q, n) with q = the nearest sampled skinned vertex (<= 25 cm) and n = its skinned normal (finite difference through applyBoneTransform).  A thin cloth or a concave spot can mis-sign: it is a PROXY, not a collision engine.
const HANDRE = /(Hand|Thumb|Index|Middle|Ring|Pinky|Finger)/i;
function bodySamples(stride) {
  const meshes = []; hero.model.traverse((o) => { if (o.isSkinnedMesh) meshes.push(o); }); const list = [];
  for (const m of meshes) { const g = m.geometry, n = g.attributes.position.count, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, nor = g.attributes.normal, bs = m.skeleton.bones, idx = [], hand = [], tg = [];
    for (let i = 0; i < n; i += stride) { let best = -1, bw = 0; for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; best = si.getComponent(i, k); } } idx.push(i); hand.push(bs[best] && HANDRE.test(bs[best].name) ? 1 : 0); tg.push(m.name + '/' + (bs[best] ? bs[best].name : '?')); }
    list.push({ m, idx, hand, nor, tg }); }
  const N = list.reduce((a, b) => a + b.idx.length, 0); const TG = []; for (const e of list) for (const t of e.tg) TG.push(t); return { list, N, P: new Float32Array(N * 3), Nn: new Float32Array(N * 3), H: new Uint8Array(N), TG };
}
function bodyUpdate(B) {
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(); let o = 0; hero.model.updateMatrixWorld(true);
  for (const e of B.list) { e.m.skeleton.update(); const pos = e.m.geometry.attributes.position;
    for (let j = 0; j < e.idx.length; j++, o++) { const i = e.idx[j]; a.fromBufferAttribute(pos, i); c.fromBufferAttribute(e.nor, i).multiplyScalar(0.02).add(a); e.m.applyBoneTransform(i, a); b.copy(c); e.m.applyBoneTransform(i, b); a.applyMatrix4(e.m.matrixWorld); b.applyMatrix4(e.m.matrixWorld);
      B.P[o * 3] = a.x; B.P[o * 3 + 1] = a.y; B.P[o * 3 + 2] = a.z; b.sub(a).normalize(); B.Nn[o * 3] = b.x; B.Nn[o * 3 + 1] = b.y; B.Nn[o * 3 + 2] = b.z; B.H[o] = e.hand[j]; } }
}
function weaponPoints(maxPer) {                                          // surface points (world, sampled) of every weapon mesh + fitting mesh; tag = item index (-1 = fitting)
  const pts = [], tags = [], v = new THREE.Vector3(); scene.updateMatrixWorld(true);
  const add = (root, tag) => root.traverse((m) => { if (!m.isMesh || !m.visible) return; const a = m.geometry.attributes.position, st = Math.max(1, Math.floor(a.count / maxPer)); for (let i = 0; i < a.count; i += st) { v.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld); pts.push(v.x, v.y, v.z); tags.push(tag); } });
  ctl.items.forEach((e, i) => add(e.grp, i)); for (const bn in ctl.fit) if (ctl.fit[bn].mesh) add(ctl.fit[bn].mesh, -1);
  return { P: new Float32Array(pts), tags };
}
function depthOf(W, B, skipHand, R = 0.12) {                              // worst + counts of penetrating weapon points (cm).  A point is "inside" when >= 80 % of its 6 nearest skinned vertices (<= R) see it BEHIND their surface plane; depth = the mean distance behind those planes
  const r2 = R * R, np = W.tags.length, K = 6, kd = new Float32Array(K), kj = new Int32Array(K); let worst = 0, wi = -1, over1 = 0, over05 = 0, wp = null, wt = '', wF = 0, wW = 0, fp = null, ft = '', per = {};
  let mnx = 1e9, mny = 1e9, mnz = 1e9, mxx = -1e9, mxy = -1e9, mxz = -1e9; for (let i = 0; i < np; i++) { const x = W.P[i * 3], y = W.P[i * 3 + 1], z = W.P[i * 3 + 2]; mnx = Math.min(mnx, x); mxx = Math.max(mxx, x); mny = Math.min(mny, y); mxy = Math.max(mxy, y); mnz = Math.min(mnz, z); mxz = Math.max(mxz, z); }
  const cand = []; for (let j = 0; j < B.N; j++) { if (skipHand && B.H[j]) continue; const x = B.P[j * 3], y = B.P[j * 3 + 1], z = B.P[j * 3 + 2]; if (x < mnx - R || x > mxx + R || y < mny - R || y > mxy + R || z < mnz - R || z > mxz + R) continue; cand.push(j); }
  for (let i = 0; i < np; i++) { const x = W.P[i * 3], y = W.P[i * 3 + 1], z = W.P[i * 3 + 2]; let n = 0; kd.fill(r2);
    for (let k = 0; k < cand.length; k++) { const j = cand[k], dx = x - B.P[j * 3], dy = y - B.P[j * 3 + 1], dz = z - B.P[j * 3 + 2], d = dx * dx + dy * dy + dz * dz; if (d >= kd[K - 1]) continue;
      let m = K - 1; while (m > 0 && kd[m - 1] > d) { kd[m] = kd[m - 1]; kj[m] = kj[m - 1]; m--; } kd[m] = d; kj[m] = j; if (n < K) n++; }
    if (n < 3) continue; let neg = 0, dep = 0; for (let m = 0; m < n; m++) { const j = kj[m], sd = (x - B.P[j * 3]) * B.Nn[j * 3] + (y - B.P[j * 3 + 1]) * B.Nn[j * 3 + 1] + (z - B.P[j * 3 + 2]) * B.Nn[j * 3 + 2]; if (sd < 0) { neg++; dep -= sd; } }
    if (neg < 0.8 * n) continue; const cm = dep / neg * 100; if (W.tags[i] >= 0 && cm > (per[W.tags[i]] || 0)) per[W.tags[i]] = cm; if (W.tags[i] < 0) { if (cm > wF) { wF = cm; fp = [x, y, z]; ft = B.TG[kj[0]]; } } else if (cm > wW) wW = cm; if (cm > worst) { worst = cm; wi = W.tags[i]; wp = [x, y, z]; wt = B.TG[kj[0]]; } if (cm > 1) over1++; if (cm > 0.5) over05++; }
  return { cm: worst, item: wi, over1, over05, wp, wt, wF, wW, fp, ft, per };
}
async function pen(o) {                                                  // o = { stepSec, clips[], drawn(bool), stride, maxPer }   (the hero is already dressed)
  const B = bodySamples(o.stride || 3), res = { clips: {}, worst: { cm: 0 }, samples: 0, over1: 0, over05: 0, bodyN: B.N, fit: { cm: 0 }, wpn: { cm: 0 }, items: {} };
  const names = o.clips || hero.clips.map((c) => c.name);
  for (const n of names) { const c = hero.clips.find((q) => q.name === n); if (!c) continue; let wc = 0, ws = 0, cnt = 0, cf = 0, cw = 0;
    for (let t = 0; t <= c.duration + 1e-6; t += o.stepSec || 0.1) { const tt = Math.min(t, c.duration - 1e-3); pose(n, tt); ctl.setDrawn(!!o.drawn); hero.model.updateMatrixWorld(true); bodyUpdate(B); const W = weaponPoints(o.maxPer || 220), d = depthOf(W, B, !!o.drawn || o.carryAll === 'hand');
      cnt++; res.samples++; for (const k in d.per) if (d.per[k] > (res.items[k] || 0)) res.items[k] = +d.per[k].toFixed(2); if (d.wF > cf) cf = d.wF; if (d.wW > cw) cw = d.wW; if (d.wF > res.fit.cm) res.fit = { cm: d.wF, clip: n, t: +tt.toFixed(2), at: d.fp && d.fp.map((x) => +x.toFixed(3)), near: d.ft }; if (d.wW > res.wpn.cm) res.wpn = { cm: d.wW, clip: n, t: +tt.toFixed(2), at: d.wp && d.item >= 0 ? d.wp.map((x) => +x.toFixed(3)) : null, near: d.item >= 0 ? d.wt : '' }; res.over1 += d.over1 > 0 ? 1 : 0; res.over05 += d.over05 > 0 ? 1 : 0; if (d.cm > wc) { wc = d.cm; ws = tt; } if (d.cm > res.worst.cm) res.worst = { cm: +d.cm.toFixed(2), clip: n, t: +tt.toFixed(2), item: d.item, at: d.wp && d.wp.map((x) => +x.toFixed(3)), near: d.wt }; }
    res.clips[n] = { cm: +wc.toFixed(2), t: +ws.toFixed(2), n: cnt, fit: +cf.toFixed(2), wpn: +cw.toFixed(2) }; }
  res.worst.cm = +res.worst.cm.toFixed(2); res.fit.cm = +res.fit.cm.toFixed(2); res.wpn.cm = +res.wpn.cm.toFixed(2); return res;
}

window.__wc1 = { pen, bodySamples, bodyUpdate, weaponPoints, depthOf, showcase, frameShowcase, dress, syncHalo, setDrawn, weaponBox, frameFigure, frameWeapon, getCtl, mods, extras, THREE, scene, camera, renderer, hero, floor, loadHero, pose, probePack, pickObject, cam, panel, label, clearLabels, resize, fetchGLB, base, rpgBase, packBase, SC, parse };
window.__ready = true;
