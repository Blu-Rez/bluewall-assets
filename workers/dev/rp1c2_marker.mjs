// rp1c2_marker.mjs — RP1C_R3: the marker over every character (rp_marker.js): the sign (a faceted gem, NOT a crown) exactly above the head bone with a clear gap, a same-colour halo (the light) and a small
// same-colour ring on the ground, 3 draw calls per character, nothing leaks after exit().   run: cd client && node /home/claude/dev/rp1c2_marker.mjs  -> «MARKER OK»
import { createRequire } from 'module'; import fs from 'fs'; const require = createRequire('/home/claude/bot/bluebot_v2/bluewall/client/package.json'); const THREE = require('three');
const ctxStub = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : (k === 'measureText') ? () => ({ width: 10 }) : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctxStub }) }; globalThis.Path2D = class {};
const M = await import('/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/rp_marker.js');
let fails = 0; const ok = (c, m) => { if (!c) { console.log('FAIL', m); fails++; } else console.log('ok  ', m); };
const SIS = { elina: '#ff6a3a', elika: '#9fe8ff', melika: '#7fe06a', mobina: '#f0a666', aylin: '#4fb0ff', aylar: '#cfeeff' };
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(50, 844 / 390, 0.3, 500); camera.position.set(0, 2.2, 5); camera.lookAt(0, 1.5, 0); camera.updateMatrixWorld(true);
const S = { mode: 'third', key: 'elina', shLook: 2, hero: null };
function mkHero(key) {                                                                                         // a hero group with a head bone and a contact-shadow blob
  const grp = new THREE.Group(), model = new THREE.Group(), head = new THREE.Object3D(), blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial());
  head.position.set(0.0, 1.85, 0.0); model.add(head); grp.add(model); grp.add(blob); blob.scale.setScalar(0.72); scene.add(grp); return { grp, model, head, blob, key };
}
const H = { THREE, camera, scene }, calls = (mk) => mk.info().calls;
// 1. every sister: own colour for the halo + ring + the sign's colour, 3 calls, above the head with a gap
let allUp = true, allVert = true, allColour = true, gaps = [];
for (const key of Object.keys(SIS)) {
  const hero = mkHero(key); S.hero = hero; S.key = key; const mk = M.createMarker(H, S, { colour: (k) => SIS[k], head: 1.85, look: 1 });
  mk.enter(); scene.updateMatrixWorld(true); mk.tick(1000); const e = mk.ents[0];
  ok(mk.info().markers === 1 && mk.info().colours[0] === SIS[key], key + ': one marker, its own colour ' + SIS[key]);
  const hc = new THREE.Color(SIS[key]); allColour = allColour && Math.abs(e.mHalo.color.r - hc.r) + Math.abs(e.mHalo.color.g - hc.g) + Math.abs(e.mHalo.color.b - hc.b) < 1e-6 && Math.abs(e.mRing.color.r - hc.r) + Math.abs(e.mRing.color.g - hc.g) + Math.abs(e.mRing.color.b - hc.b) < 1e-6;
  hero.grp.updateMatrixWorld(true); const hw = new THREE.Vector3(); hero.head.getWorldPosition(hw); const sw = new THREE.Vector3(); e.sign.getWorldPosition(sw);
  gaps.push(sw.y - hw.y); allUp = allUp && sw.y - hw.y > 0.2 + 0.5 * e.sign.scale.y - 0.12; allVert = allVert && Math.abs(sw.x - hw.x) < 1e-6 && Math.abs(sw.z - hw.z) < 1e-6;
  // the head sways (cape / lean): the sign follows exactly, in x and z
  hero.head.position.x = 0.12; hero.head.position.z = -0.07; hero.grp.updateMatrixWorld(true); mk.tick(1100); hero.head.getWorldPosition(hw); e.sign.getWorldPosition(sw); allVert = allVert && Math.abs(sw.x - hw.x) < 1e-6 && Math.abs(sw.z - hw.z) < 1e-6;
  ok(e.sign.visible && e.halo.visible && e.ring.visible && calls(mk) === 3, key + ': sign + halo + ring visible, 3 draw calls');
  ok(e.ring.parent === hero.blob, key + ': the ring hangs on the contact shadow (follows it in the air)');
  mk.exit(); ok(hero.grp.children.filter((o) => o.userData && o.userData.rpMarker).length === 0 && hero.blob.children.length === 0, key + ': exit removes sign / halo / ring');
  scene.remove(hero.grp);
}
ok(allColour, 'the halo and the ring wear the sister\'s colour (all six)'); ok(allUp, 'the sign floats above the head with a clear gap (min gap ' + Math.min(...gaps).toFixed(2) + ' m above the head bone, ' + Math.max(...gaps).toFixed(2) + ' max)'); ok(allVert, 'the sign is exactly vertical over the head bone (also when the head sways 12 cm / 7 cm)');
// 2. the ring: 1.3 m outer in every shadow look, whatever the blob scale
{ const hero = mkHero('elina'); S.hero = hero; const mk = M.createMarker(H, S, { colour: (k) => SIS[k], head: 1.85 }); mk.enter(); scene.updateMatrixWorld(true);
  for (const [look, bs] of [[1, 1], [2, 0.72], [3, 0.72]]) { S.shLook = look; hero.blob.scale.setScalar(bs); hero.grp.updateMatrixWorld(true); mk.tick(1000); const e = mk.ents[0]; ok(Math.abs(e.ring.scale.x * bs - 1.3) < 1e-6, 'ring outer diameter 1.3 m in shadow look ' + look + ' (blob scale ' + bs + ')'); }
  // self marker: hidden in first person, gone when the camera is squeezed against her
  S.mode = 'first'; mk.tick(1200); ok(!mk.ents[0].sign.visible, 'first person: her own marker is hidden'); S.mode = 'third';
  camera.position.set(0, 1.2, 0.8); camera.updateMatrixWorld(true); mk.tick(1300); ok(!mk.ents[0].sign.visible, 'camera squeezed against her (1.4 m from her feet): the sign is gone instead of filling the screen'); camera.position.set(0, 1.9, 1.7); camera.updateMatrixWorld(true); mk.tick(1350); ok(mk.ents[0].sign.visible && mk.ents[0].mSign.opacity > 0 && mk.ents[0].mSign.opacity < 1, 'camera at 2.5 m: the sign is half faded (' + mk.ents[0].mSign.opacity.toFixed(2) + ')'); camera.position.set(0, 2.2, 5); camera.updateMatrixWorld(true);
  // far away: faded out
  camera.position.set(0, 2.2, 400); camera.updateMatrixWorld(true); mk.tick(1400); ok(!mk.ents[0].sign.visible, '400 m away: not drawn (0 calls)'); camera.position.set(0, 2.2, 5); camera.updateMatrixWorld(true);
  // sessions: enter / exit 5 times leaves nothing behind
  mk.exit(); for (let i = 0; i < 5; i++) { mk.enter(); mk.tick(2000 + i); mk.exit(); } ok(mk.ents.length === 0 && hero.grp.children.length === 2 && hero.blob.children.length === 0, 'enter / exit x5: no marker, no child left on the hero'); scene.remove(hero.grp); }
// 3. static: no crown anywhere (owner 18:40), no allocation in tick(), no Persian text / «bot» word in code strings, a second look is a pure data switch
{ const src = fs.readFileSync('/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/rp_marker.js', 'utf8'); const code = src.split('\n').map((l) => l.split('//')[0]).join('\n');
  const dr = code.slice(code.indexOf('export function drawRing'), code.indexOf('export function createMarker')); ok(!/drawCrown\(|emblem\b|crown/i.test(dr.replace(/emblemUnused/g, '')), 'drawRing draws no crown (owner 18:40: «no crown in the ring»)');
  const tk = code.slice(code.indexOf('  function tick('), code.indexOf('  function setLook')); const bad = tk.match(/\bnew [A-Z]\w*|\.clone\(|\.map\(|\.filter\(|\.slice\(|\[\.\.\.|Object\.(keys|entries)/g); ok(!bad, 'no allocation in tick()' + (bad ? ' ' + bad : ''));
  ok(!/[؀-ۿ]/.test(code) && !/'[^']*\b(bot|ربات)\b[^']*'/i.test(code), 'no Persian text / «bot» word in the code'); }
console.log(fails ? 'MARKER FAILED' : 'MARKER OK'); process.exit(fails ? 1 : 0);
