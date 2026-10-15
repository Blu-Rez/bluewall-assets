// AN1_R3 A3 job 2 — the numbered lineup sheet (dev only): everything in a row on flat ground in front of a house door, orthographic front view, 844 x 390.
// Body of an async function for an1_r3_page.py (RPC).  ARGS = { sheet: 'people' | 'animals' | 'cart', state: 'now' | 'after', hero: 2 }.
// 'after' = the sizes of walk_kit.SZ (the same numbers the game now uses, re-measured in the game by an1_r3/scale_live.js); 'now' = the sizes before R3 (x1.7 people, x2.6 horses ...), drawn from the same models.
// The hero is drawn at 3 scales next to the others (1 = today's 1.96 m, 2 = +12 %, 3 = +25 %); the number in the circle above each figure is the number the owner picks (dev page only: rpg.js is untouched).
const R = window.__R3, THREE = R.THREE, SU = R.SkeletonUtils, B = __bw, r = B.renderer;
const A = ARGS, now = A.state === 'now';
const SZ = { man: 1.75, woman: 1.65, child: 1.2, horse: 1.45, draught: 1.55, barded: 1.6, cow: 1.3, sheep: 0.75, pig: 0.9, dog: 0.6, wolf: 0.8, hen: 0.4, rider: 1.85 };
const NOW = { man: 3.0, woman: 2.8, child: null, horse: 3.79, draught: 1.72, barded: 3.79, cow: 2.79, sheep: 1.1, pig: 0.84, dog: 0.94, wolf: 1.2, hen: 0.78, rider: 3.83 };
const T = (k) => (now ? (NOW[k] != null ? NOW[k] : SZ[k]) : SZ[k]);
const loadG = async (u) => R.load(u);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xcfe0ee);
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a9a6a, 1.5)); const sun = new THREE.DirectionalLight(0xfff2d8, 1.9); sun.position.set(-8, 14, 22); scene.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 60), new THREE.MeshStandardMaterial({ color: 0x7d8f5a, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, -20); scene.add(ground);
const items = []; let cursor = 0; const GAP = 0.45;
const box = (o) => new THREE.Box3().setFromObject(o, true);
const standOn = (o) => { o.updateMatrixWorld(true); const b = box(o); o.position.y -= b.min.y; o.updateMatrixWorld(true); };
const add = (o, label, meas, opts = {}) => { o.updateMatrixWorld(true); const b = box(o), w = b.max.x - b.min.x, cx = (b.min.x + b.max.x) / 2; o.position.x += cursor + w / 2 - cx; cursor += w + (opts.gap != null ? opts.gap : GAP); o.updateMatrixWorld(true); const b2 = box(o); scene.add(o); items.push({ o, label, h: b2.max.y - b2.min.y, top: b2.max.y, w, x: (b2.min.x + b2.max.x) / 2, meas, num: opts.num !== false }); return o; };
const pose = (rig, clips, name, t = 0) => { const c = clips.find((a) => a.name === name) || clips[0]; if (!c) return; const m = new THREE.AnimationMixer(rig); m.clipAction(c).play(); m.setTime(t); rig.updateMatrixWorld(true); };
const clone = (g) => SU.clone(g.scene);
// ---- the models
const heroModel = async (k, mult) => { const g = await loadG('assets/rpg/' + k + '.glb'), m = clone(g); pose(m, g.animations, 'idle', 0); m.scale.setScalar(2.0 * mult); const h = new THREE.Group(); h.add(m); standOn(h); return h; };       // SC = HERO_H / MODEL_H = 1.96 / 0.98 = 2.0 (rpg.js)
const villager = async (key, height) => { const v = window.__tr2life.vill[key], rig = SU.clone(v.scene); const S = window.__tr2dev.study(rig, v.walk); const m = new THREE.AnimationMixer(rig); m.clipAction(v.walk).play(); m.setTime(S.tf); rig.updateMatrixWorld(true); const k = height / S.height; rig.scale.setScalar(k); const h = new THREE.Group(); h.add(rig); standOn(h); return h; };
const quad = async (url, clip, back, backOf, yaw = Math.PI / 2) => { const g = await loadG(url), m = clone(g); pose(m, g.animations, clip, 0); m.scale.setScalar(back / backOf); const h = new THREE.Group(); h.add(m); h.rotation.y = yaw; standOn(h); return h; };      // backOf = the model's measured back height (scale_models.js)
const BACK = { horse: 1.619, cow: 4.587, sheep: 4.075, pig: 4.575, wolf: 2.263 };
const hens = () => { const m = B.scene.getObjectByName('hens'); if (!m) return null; const o = new THREE.Mesh(m.geometry, m.material); const s = (T('hen')) / 0.678; o.scale.setScalar(s); o.rotation.y = Math.PI / 2; const g = new THREE.Group(); g.add(o); standOn(g); return g; };
const rows = [];
if (A.sheet === 'people') {
  const M = { 1: 1.0, 2: 1.12, 3: 1.25 }; const hk = 'elina';
  for (const n of [1, 2, 3]) add(await heroModel(hk, M[n]), 'hero x' + M[n].toFixed(2) + (n === 2 ? ' (default)' : ''), 1.96 * M[n]);
  add(await villager('villager_man', T('man')), 'man', T('man')); add(await villager('villager_woman', T('woman')), 'woman', T('woman'));
  add(await villager('villager_woman', T('child')), 'child (stand-in: the woman model; no child model yet)', T('child'));
  // a mounted knight: the live one (moved into this scene for the shot), at the sizes of the game now (after) or scaled back to the old ones (now)
  const kn = (window.__knights || [])[0];
  if (kn) { const parent = kn.root.parent, p0 = kn.root.position.clone(), s0 = kn.root.scale.clone(), y0 = kn.root.rotation.y;
    const vis0 = []; kn.root.traverse((o) => { vis0.push([o, o.visible, o.frustumCulled]); o.visible = true; o.frustumCulled = false; });
    scene.add(kn.root); kn.root.position.set(0, 0, 0); kn.root.rotation.y = Math.PI / 2; if (now) kn.root.scale.multiplyScalar(3.79 / 1.6);          // before R3: the barded horse had withers 3.79 (rider 3.83): the whole horseman x 2.37 (the horse exact, the rider ~15 % over the old size)
    kn.root.updateMatrixWorld(true); const bb = box(kn.root), hh = new THREE.Group(); scene.remove(kn.root); hh.add(kn.root); kn.root.position.y = -bb.min.y; hh.updateMatrixWorld(true);
    add(hh, 'knight on a war horse' + (now ? ' (x2.37: horse exact)' : ''), box(hh).max.y - box(hh).min.y, { gap: 1.0 }); rows.push({ restore: () => { for (const [o, v, f] of vis0) { o.visible = v; o.frustumCulled = f; } hh.remove(kn.root); if (parent) parent.add(kn.root); kn.root.position.copy(p0); kn.root.scale.copy(s0); kn.root.rotation.y = y0; } }); }
} else if (A.sheet === 'animals') {
  add(await villager('villager_man', T('man')), 'man (reference)', T('man'), { num: false });
  add(await quad('assets/horse_m2m_bay.glb', 'Idle', T('horse'), BACK.horse), 'horse (pasture / yard)', T('horse'), { gap: 0.8 });
  add(await quad('assets/cow.glb', 'Idle', T('cow'), BACK.cow), 'cow', T('cow'));
  add(await quad('assets/an_sheep.glb', 'Idle', T('sheep'), BACK.sheep), 'sheep', T('sheep'));
  add(await quad('assets/an_pig.glb', 'Idle', T('pig'), BACK.pig), 'pig', T('pig'));
  add(await quad('assets/wolf.glb', 'Idle', T('wolf'), BACK.wolf), 'wolf', T('wolf'));
  add(await quad('assets/wolf.glb', 'Idle', T('dog'), BACK.wolf), 'dog', T('dog'));
  const h = hens(); if (h) add(h, 'hen', T('hen'));
} else if (A.sheet === 'cart') {
  add(await villager('villager_man', T('man')), 'man (reference)', T('man'), { num: false });
  add(await quad('assets/horse_m2m_bay.glb', 'Walk', T('draught'), BACK.horse), 'draught horse', T('draught'), { gap: 0.2 });
  const kit = await loadG('assets/kit_ws.glb'); let cn = kit.scene.getObjectByName('ws_cart1'); if (!cn) kit.scene.traverse((o) => { if (!cn && /cart/i.test(o.name) && o.children.length) cn = o; }); const cart = SU.clone(cn); cart.visible = true; cart.position.set(0, 0, 0); cart.rotation.set(0, 0, 0); const cg = new THREE.Group(); cg.add(cart); standOn(cg); add(cg, 'cart (kit piece, 4.8 m)', 2.25);
  add(await villager('villager_woman', T('woman')), 'woman (reference)', T('woman'), { num: false });
}
// ---- the houses behind (the front of the cottage with its door), the camera and the overlay
const swap = await (await fetch('assets/tr2/swap.json')).json();
const house = async (key, w, x) => { const g = await loadG('assets/tr2/' + key + '.glb'), m = g.scene.clone(true), h = new THREE.Group(); h.add(m); h.rotation.y = ((swap.models[key] && swap.models[key].ry) || 0) * Math.PI / 180; h.updateMatrixWorld(true); let b = box(h), s = w / Math.max(b.max.x - b.min.x, b.max.z - b.min.z); h.scale.setScalar(s); h.updateMatrixWorld(true); b = box(h); h.position.set(x - (b.min.x + b.max.x) / 2, -b.min.y, -3.5 - (b.max.z + b.min.z) / 2); scene.add(h); return h; };
const total = cursor, cx0 = total / 2;
// center the row on x = 0 and put the cottage door (x = 0 of the model) at the man
for (const it of items) { it.o.position.x -= cx0; it.o.updateMatrixWorld(true); const b = box(it.o); it.x = (b.min.x + b.max.x) / 2; it.top = b.max.y; }
const manIt = items.find((i) => /^man/.test(i.label)); const doorX = manIt ? manIt.x : 0;
await house('house_cottage_0', 6.6, doorX); await house('house_cottage_1', 6.6, doorX + 6.2); await house('house_cottage_0', 6.6, doorX - 6.2);
const W = 844, H = 390, groundPx = 318, ppm = Math.min(60, (W - 40) / (total + 1));
const cam = new THREE.OrthographicCamera(-W / 2 / ppm, W / 2 / ppm, (groundPx) / ppm, -(H - groundPx) / ppm, 0.1, 200); cam.position.set(0, 0, 60); cam.lookAt(0, 0, 0);
const rt = new THREE.WebGLRenderTarget(W, H, { samples: 0 }); const old = r.getRenderTarget();
r.setRenderTarget(rt); r.render(scene, cam); const buf = new Uint8Array(W * H * 4); r.readRenderTargetPixels(rt, 0, 0, W, H, buf); r.setRenderTarget(old); rt.dispose();
for (const o of rows) if (o.restore) o.restore();
const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c2 = cv.getContext('2d'), im = c2.createImageData(W, H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const a = ((H - 1 - y) * W + x) * 4, b = (y * W + x) * 4; im.data[b] = buf[a]; im.data[b + 1] = buf[a + 1]; im.data[b + 2] = buf[a + 2]; im.data[b + 3] = 255; }
c2.putImageData(im, 0, 0);
const gy = groundPx; c2.font = '10px sans-serif'; c2.textBaseline = 'middle';
for (let m = 1; m <= 5; m++) { const y = gy - m * ppm; if (y < 14) break; c2.strokeStyle = 'rgba(190,0,0,0.35)'; c2.lineWidth = 1; c2.beginPath(); c2.moveTo(0, y); c2.lineTo(W, y); c2.stroke(); c2.fillStyle = '#a00'; c2.fillText(m + ' m', 3, y - 6); c2.fillText(m + ' m', W - 28, y - 6); }
let n = 0; const legend = [];
for (const it of items) { const px = W / 2 + it.x * ppm; c2.strokeStyle = 'rgba(0,0,0,0.5)'; c2.lineWidth = 1; c2.beginPath(); c2.moveTo(px, gy - it.top * ppm - 2); c2.lineTo(px, gy - it.top * ppm - 12); c2.stroke();
  if (it.num) { n++; const y = gy - it.top * ppm - 22; c2.fillStyle = '#fff'; c2.beginPath(); c2.arc(px, y, 9, 0, 7); c2.fill(); c2.strokeStyle = '#000'; c2.stroke(); c2.fillStyle = '#000'; c2.font = 'bold 12px sans-serif'; c2.textAlign = 'center'; c2.fillText(String(n), px, y + 1); c2.textAlign = 'left'; legend.push(n + ' ' + it.label + ' ' + it.meas.toFixed(2) + ' m'); } }
c2.fillStyle = 'rgba(255,255,255,0.88)'; c2.fillRect(0, gy + 4, W, H - gy - 4); c2.fillStyle = '#000'; c2.font = '11px sans-serif';
c2.font = 'bold 11px sans-serif'; c2.fillText('AN1_R3 lineup · ' + (now ? 'NOW (before R3)' : 'AFTER (real sizes)') + ' · sheet ' + A.sheet + ' · orthographic, ' + ppm.toFixed(0) + ' px/m, red lines every 1 m', 6, gy + 16); c2.font = '11px sans-serif';
let lx = 6, ly = gy + 32; for (const t of legend) { const w = c2.measureText(t).width + 16; if (lx + w > W - 4) { lx = 6; ly += 14; } c2.fillText(t, lx, ly); lx += w; }
return { png: cv.toDataURL('image/png'), items: items.map((i) => ({ label: i.label, meas: +i.meas.toFixed(3), h: +i.h.toFixed(3), w: +i.w.toFixed(2) })), ppm };
