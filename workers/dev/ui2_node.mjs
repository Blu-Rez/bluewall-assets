// ui2_node.mjs — UI2: the blue / silver look of the hero markers, chip, pill and go-up icon (rp_ui2.js) + the three head-marker looks (rp_marker.js).   run: cd client && node /home/claude/dev/ui2_node.mjs  -> «UI2_NODE OK»
import { createRequire } from 'module'; import fs from 'fs'; const require = createRequire('/home/claude/bot/bluebot_v2/bluewall/client/package.json'); const THREE = require('three');
const ctxStub = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : (k === 'measureText') ? () => ({ width: 10 }) : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctxStub }) }; globalThis.Path2D = class {};
const A = '/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/';
const U = await import(A + 'rp_ui2.js'), M = await import(A + 'rp_marker.js');
let fails = 0; const ok = (c, m, i = '') => { if (!c) { console.log('FAIL', m, i); fails++; } else console.log('ok  ', m, i); };
// 1. rp_ui2.js
const ui = U.createUi2({}); ok(ui.look === 1, 'default look = 1 (the plaque)');
ok(ui.setLook(9) === 3 && ui.setLook(0) === 1 && ui.setLook(2) === 2, 'setLook clamps to 1..3'); ui.setLook(1);
const css = ui.css('10px', '20px'); ok(['1', '2', '3'].every((l) => css.includes('[data-l="' + l + '"]')), 'css() carries all three chip looks'); ok(css.includes('calc(10px + 8px)'), 'the chip sits in the top row (top + 8 px), not over the hero'); ok(css.includes('calc(20px + 34px)'), 'the pill keeps its place above the controls');
const GOLD = /#(ffe9a6|f5d583|c0892a|6b4510|a8731d|dba51f|f5c94c|ffe58c|fffbe2|ffd700|b8860b)/i;
ok(!GOLD.test(css) && !GOLD.test(JSON.stringify(U.PAL)), 'no brown / gold in the chip, pill or tokens (blue / silver only)');
const html = ui.chipHtml(); ok(/^<svg[^>]*>.*<\/svg><i><\/i>$/.test(html), 'chip markup: the arrow svg first, the number <i> last (rp_goup.js rotates the one, writes the other)');
const tx = U.worldIcon(THREE); ok(tx && tx.isCanvasTexture === true, 'worldIcon returns a CanvasTexture (same Points material class: +0 programs)');
ok(Object.keys(U.LOOKS).length === 3, 'three numbered chip looks');
// 2. the marker looks
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(50, 844 / 390, 0.3, 500); camera.position.set(0, 2.2, 5); camera.lookAt(0, 1.5, 0); camera.updateMatrixWorld(true);
const S = { mode: 'third', key: 'elina', shLook: 2, hero: null };
const grp = new THREE.Group(), model = new THREE.Group(), head = new THREE.Object3D(), blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial());
head.position.set(0, 1.85, 0); model.add(head); grp.add(model); grp.add(blob); blob.scale.setScalar(0.72); scene.add(grp); S.hero = { grp, model, head, blob, key: 'elina' };
const H = { THREE, camera, scene };
const BASE = { 1: 0.77, 2: 0.75, 3: 0.64 };                                  // the lowest drawn point of each look (fraction of the sprite): the test's own copy of rp_marker.js LOOK[n].base
ok(Object.keys(M.LOOKS).length === 3 && /crown/i.test(M.LOOKS[1]), 'marker: three looks, look 1 is the crown', M.LOOKS[1]);
for (const L of [1, 2, 3]) {
  const mk = M.createMarker(H, S, { colour: () => '#ff6a3a', head: 1.85, look: L }); mk.enter(); scene.updateMatrixWorld(true); mk.tick(1000); const e = mk.ents[0];
  ok(mk.info().look === L && e.sign.visible && e.halo.visible && e.ring.visible && mk.info().calls === 3, 'look ' + L + ': sign + halo + ring, 3 draw calls');
  const hw = new THREE.Vector3(), sw = new THREE.Vector3(); head.getWorldPosition(hw); e.sign.getWorldPosition(sw); const bottom = sw.y - hw.y - (BASE[L] - 0.5) * e.sign.scale.y;
  ok(bottom > 0.10 && bottom < 0.30, 'look ' + L + ': the lowest point rests ' + (bottom * 100).toFixed(0) + ' cm above her head (10..30)');
  ok(Math.abs(e.sign.scale.x * (L === 1 ? 0.70 : L === 2 ? 0.72 : 0.64) - 0.36) < 1e-6, 'look ' + L + ': the drawn width is 0.36 m at the near distance');
  mk.exit();
}
{ const mk = M.createMarker(H, S, { colour: () => '#ff6a3a', head: 1.85 }); mk.enter(); mk.tick(1000); ok(mk.setLook(3) === 3 && mk.setLook(7) === 1, 'setLook(3) switches, an unknown look falls back to 1'); mk.tick(1100); ok(mk.ents[0].drawn === 1, 'the sign is repainted at the next tick after a look switch'); mk.exit(); }
// 3. static
const srcOf = (f) => fs.readFileSync(A + f, 'utf8'); const code = (f) => srcOf(f).split('\n').map((l) => l.split('//')[0]).join('\n');
for (const f of ['rp_ui2.js', 'rp_marker.js']) { ok(!/[؀-ۿ]/.test(code(f)) && !/'[^']*\b(bot|ربات)\b[^']*'/i.test(code(f)), f + ': no Persian text / «bot» word in the code'); ok(!GOLD.test(code(f)), f + ': no brown / gold colour'); }
const n = (f) => srcOf(f).split('\n').filter((l) => l.includes('// UI2:')).length; ok(n('rpg.js') <= 4, 'rpg.js: ' + n('rpg.js') + ' // UI2: lines (<= 4)'); ok(n('rp_goup.js') <= 4, 'rp_goup.js: ' + n('rp_goup.js') + ' // UI2: lines (<= 4)');
console.log(fails ? 'UI2_NODE FAILED' : 'UI2_NODE OK'); process.exit(fails ? 1 : 0);
