// layout_ui.js — TR2-S5: the editor.  The player rearranges his own town: homes, civic buildings, production buildings and the six storehouses.
//
//   const ed = createLayoutUI({ root, world, camera, renderer, ctl, scene, blocked(), save(rec), toast(msg) })
//   ed.update(dt)    every frame (cheap when closed)       ed.open() / ed.close()       ed.active
//
// How it plays (landscape, 844 x 390 is the design size; everything is a 44 px+ touch target):
//   • the «Arrange» button opens the editor.  Tap a building to pick it (a yellow outline), drag it by its body: a ghost (green = fits, red = does not, with the reason in words) follows the finger,
//     snapped to 1 m.  ⟲ ⟳ turn it by 15°.  ✓ puts it there, ✕ drops the change.  Release the ghost on ANOTHER building and the two trade places (if both fit).
//   • green dots on the ground show where the picked building fits (a town this full has few free places: the dots are the map of them).
//   • ↶ undoes the last move, «Default» puts the picked building back, «Reset all» puts the whole town back (asks twice).  «Done» leaves; the layout is saved after every ✓ / undo / reset.
//   • one finger on empty ground pans, two fingers zoom / turn the camera, exactly like the rest of the game.
// All rules live in layout_rules.js (checkPose); this file only draws and routes the pointer.
import * as THREE from 'three';
import { SNAP, ROT_STEP } from './layout_rules.js';

const WHY = {
  WALL: 'Too close to the town wall', MOAT: 'Too close to the moat', GATE: 'Blocks the gate', MARKET: 'Too close to the market square', VAULT: 'Too close to a vault', STREET: 'On a street',
  RIVER: 'Too close to the river', WATER: 'Needs to stand by the water', STREAM: 'On a stream bed', DRY: 'Ground too wet', SLOPE: 'Ground too steep', OVERLAP: 'Another building is in the way', GEN: 'A house is in the way', UNKNOWN: 'Cannot move this',
};
const NAME = { cottage: 'Cottage', craftsman: 'Craftsman house', merchant: 'Merchant house', noble: 'Noble house', tavern: 'Tavern', townhall: 'Town hall', chapel: 'Chapel', well: 'Well', sawmill: 'Sawmill', masonry: 'Masonry', smelter: 'Smelter', mint: 'Mint',
  refinery: 'Refinery', mill: 'Mill', bakery: 'Bakery', butcher: 'Butcher', smokehouse: 'Smokehouse', jeweler: 'Jeweler', store: 'Storehouse' };
const STORE_NAME = { wood: 'Timber', stone: 'Stone', iron: 'Iron', gold: 'Gold', oil: 'Oil', food: 'Food' };
const HEIGHT = { cottage: 8, craftsman: 10, merchant: 12, noble: 14, tavern: 11, townhall: 16, chapel: 30, well: 4, store: 10 };
const GREEN = 0x3dff7a, RED = 0xff4a4a, BLUE = 0x4ab4ff, GOLD = 0xffd54a;
const CSS = `
.bw-ui.bwl-hide{visibility:hidden}
.bwl{--lt:max(env(safe-area-inset-top,0px),calc(var(--tg-safe-area-inset-top,0px) + var(--tg-content-safe-area-inset-top,0px)));--lb:max(env(safe-area-inset-bottom,0px),calc(var(--tg-safe-area-inset-bottom,0px) + var(--tg-content-safe-area-inset-bottom,0px)));--ll:max(env(safe-area-inset-left,0px),calc(var(--tg-safe-area-inset-left,0px) + var(--tg-content-safe-area-inset-left,0px)));--lr:max(env(safe-area-inset-right,0px),calc(var(--tg-safe-area-inset-right,0px) + var(--tg-content-safe-area-inset-right,0px)))}
.bwl{position:fixed;inset:0;pointer-events:none;z-index:40;font:600 12px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#eaf2ff;-webkit-user-select:none;user-select:none}
.bwl *{box-sizing:border-box}
.bwl .b{pointer-events:auto;position:absolute;min-width:46px;height:46px;padding:0 10px;border-radius:14px;border:1px solid rgba(160,200,255,.45);background:linear-gradient(#27487f,#17294d);color:#eaf2ff;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.45);font:inherit;-webkit-tap-highlight-color:transparent}
.bwl .b i{font-style:normal;font-size:19px;line-height:19px}.bwl .b small{font:600 9px/10px system-ui,sans-serif;opacity:.85;letter-spacing:.02em}
.bwl .b:active{transform:scale(.95)}.bwl .b[disabled]{opacity:.35;pointer-events:none}
.bwl .b.ok{background:linear-gradient(#2c9a55,#16613a);border-color:#8dffb4}.bwl .b.no{background:linear-gradient(#a23a3a,#661e1e);border-color:#ffa0a0}
.bwl .top{position:absolute;left:50%;top:calc(8px + var(--lt));transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:5px;max-width:56vw}
.bwl .pill{padding:6px 12px;border-radius:999px;background:rgba(10,20,44,.78);border:1px solid rgba(160,200,255,.35);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.bwl .pill.g{border-color:#8dffb4;color:#d7ffe5}.bwl .pill.r{border-color:#ffa0a0;color:#ffe0e0}
.bwl .ent{pointer-events:auto;position:fixed;left:calc(10px + var(--ll));bottom:calc(10px + var(--lb));z-index:39}
`;

export function createLayoutUI({ root = document.body, world, camera, renderer, ctl, scene, blocked = () => false, save = () => {}, toast = () => {} }) {
  const live = () => world.layout, dom = renderer.domElement, H = world.fastHeight || ((x, z) => 0);
  const S = { on: false, sel: null, pose: null, check: null, drag: null, hover: null, spots: null, spotJob: null, undo0: 0, confirmReset: 0, saveT: 0, focus: null, lastMinD: null, lastOnTap: null };
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), v3 = new THREE.Vector3(), box = new THREE.Box3(), hitP = new THREE.Vector3();

  // ------------------------------------------------------------------ DOM
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const el = document.createElement('div'); el.className = 'bwl'; el.style.display = 'none';
  el.innerHTML = `
    <div class="top"><div class="pill" data-k="hint">Tap a building to pick it</div><div class="pill" data-k="why" style="display:none"></div></div>
    <button class="b" data-a="done" style="right:calc(10px + var(--lr));top:calc(8px + var(--lt))" aria-label="Done"><i>✔</i><small>Done</small></button>
    <button class="b" data-a="undo" style="left:calc(10px + var(--ll));top:calc(8px + var(--lt))" aria-label="Undo"><i>↶</i><small>Undo</small></button>
    <button class="b" data-a="def" style="left:calc(10px + var(--ll));top:calc(62px + var(--lt))" aria-label="Put back"><i>⌂</i><small>Default</small></button>
    <button class="b" data-a="all" style="left:calc(10px + var(--ll));bottom:calc(10px + var(--lb))" aria-label="Reset all"><i>⟲</i><small>Reset all</small></button>
    <button class="b" data-a="rotl" style="right:calc(10px + var(--lr));bottom:calc(10px + var(--lb))" aria-label="Turn left"><i>⟲</i><small>15°</small></button>
    <button class="b" data-a="rotr" style="right:calc(calc(10px + var(--lr)) + 54px);bottom:calc(10px + var(--lb))" aria-label="Turn right"><i>⟳</i><small>15°</small></button>
    <button class="b ok" data-a="ok" style="right:calc(10px + var(--lr));bottom:calc(62px + var(--lb))" aria-label="Put here"><i>✓</i><small>Place</small></button>
    <button class="b no" data-a="cancel" style="right:calc(calc(10px + var(--lr)) + 54px);bottom:calc(62px + var(--lb))" aria-label="Cancel"><i>✕</i><small>Cancel</small></button>`;
  root.appendChild(el);
  const q = (a) => el.querySelector(`[data-a="${a}"]`), hint = el.querySelector('[data-k="hint"]'), why = el.querySelector('[data-k="why"]');
  const ent = document.createElement('button'); ent.className = 'bwl b ent'; ent.style.cssText = 'position:fixed;pointer-events:auto;display:none'; ent.innerHTML = '<i>✥</i><small>Arrange</small>'; ent.setAttribute('aria-label', 'Arrange your town');
  // (the entry button reuses the .b look but lives outside the editor layer)
  const entWrap = document.createElement('div'); entWrap.className = 'bwl'; entWrap.style.zIndex = 38; ent.className = 'b ent'; entWrap.appendChild(ent); root.appendChild(entWrap);
  ent.style.cssText = 'left:calc(10px + var(--ll));bottom:calc(10px + var(--lb));display:none';

  // ------------------------------------------------------------------ the 3D bits: ghost (footprint draped on the ground + a volume box + a front arrow), the picked outline, the green dots
  // (built on the FIRST open(), not at start: `renderer.compileAsync(scene)` in main.js compiles the materials of invisible objects too, so objects made at start would cost +7 shader programs for every player;
  //  made on the first open they are linked in the background (compileAsync below) while the player is still looking at the buttons)
  let root3 = null, drape, ghostMat, ghostBoxMat, outlineMat, ghost, fill, boxM, arrow, loop, selLoop, dots; const GRID = 6, DOTS = 700;
  const mat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, side: THREE.DoubleSide });
  function build3d() {
    if (root3) return;
    root3 = new THREE.Group(); root3.name = 'layout-editor'; root3.visible = false;
    drape = new THREE.BufferGeometry(); {
      const pos = new Float32Array((GRID + 1) * (GRID + 1) * 3), idx = []; for (let j = 0; j < GRID; j++) for (let i = 0; i < GRID; i++) { const a = j * (GRID + 1) + i; idx.push(a, a + 1, a + GRID + 1, a + 1, a + GRID + 2, a + GRID + 1); }
      drape.setAttribute('position', new THREE.BufferAttribute(pos, 3)); drape.setIndex(idx);
    }
    ghostMat = mat(GREEN, 0.4); ghostBoxMat = mat(GREEN, 0.18); outlineMat = new THREE.LineBasicMaterial({ color: GREEN, transparent: true, opacity: 0.95, depthTest: false });
    ghost = new THREE.Group(); fill = new THREE.Mesh(drape, ghostMat); boxM = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), ghostBoxMat);
    arrow = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 3), mat(GREEN, 0.9)); loop = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]), outlineMat);
    fill.renderOrder = 60; boxM.renderOrder = 59; arrow.renderOrder = 61; loop.renderOrder = 62; loop.frustumCulled = false; fill.frustumCulled = false;
    ghost.add(fill, boxM, arrow, loop); ghost.visible = false; root3.add(ghost);
    selLoop = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.95, depthTest: false }));
    selLoop.renderOrder = 63; selLoop.frustumCulled = false; selLoop.visible = false; root3.add(selLoop);
    dots = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 12).rotateX(-Math.PI / 2), mat(GREEN, 0.85), DOTS); dots.count = 0; dots.renderOrder = 58; dots.frustumCulled = false; root3.add(dots);
    scene.add(root3);
    try { if (renderer.compileAsync) renderer.compileAsync(root3, camera, scene).catch(() => {}); } catch (e) { /* the first draw compiles instead */ }
  }

  const corners = (x, z, ry, fp) => { const c = Math.cos(ry), s = Math.sin(ry), ox = fp.ox || 0, oz = fp.oz || 0, cx = x + ox * c + oz * s, cz = z - ox * s + oz * c; return { cx, cz, pts: [[-fp.w / 2, -fp.d / 2], [fp.w / 2, -fp.d / 2], [fp.w / 2, fp.d / 2], [-fp.w / 2, fp.d / 2]].map(([lx, lz]) => [cx + lx * c + lz * s, cz - lx * s + lz * c]) }; };
  function poseGhost(r, pose, ok) {
    const fp = r.fp, { cx, cz, pts } = corners(pose.x, pose.z, pose.ry, fp), c = Math.cos(pose.ry), s = Math.sin(pose.ry), p = drape.attributes.position;
    for (let j = 0; j <= GRID; j++) for (let i = 0; i <= GRID; i++) { const lx = (i / GRID - 0.5) * fp.w, lz = (j / GRID - 0.5) * fp.d, x = cx + lx * c + lz * s, z = cz - lx * s + lz * c; p.setXYZ(j * (GRID + 1) + i, x, H(x, z) + 0.3, z); }
    p.needsUpdate = true; drape.computeBoundingSphere();
    const gy = Math.max(...pts.map(([x, z]) => H(x, z))), h = HEIGHT[r.kind] || 9;
    boxM.position.set(cx, gy + h / 2, cz); boxM.scale.set(fp.w, h, fp.d); boxM.rotation.y = pose.ry;
    const fx = cx + (fp.d / 2 + 1.6) * s, fz = cz + (fp.d / 2 + 1.6) * c; arrow.position.set(fx, H(fx, fz) + 1.2, fz); arrow.rotation.set(Math.PI / 2, 0, 0); arrow.rotation.order = 'YXZ'; arrow.rotation.y = pose.ry + Math.PI; arrow.scale.setScalar(1);
    const g = loop.geometry.attributes.position; pts.forEach(([x, z], k) => g.setXYZ(k, x, H(x, z) + 0.5, z)); g.needsUpdate = true;
    const col = ok ? GREEN : RED; ghostMat.color.setHex(col); ghostBoxMat.color.setHex(col); arrow.material.color.setHex(col); outlineMat.color.setHex(col);
    ghost.visible = true;
  }
  function poseOutline(r) {
    const { pts } = corners(r.x, r.z, r.ry, r.fp), g = selLoop.geometry.attributes.position; pts.forEach(([x, z], k) => g.setXYZ(k, x, H(x, z) + 0.45, z)); g.needsUpdate = true; selLoop.visible = true;
  }

  // ------------------------------------------------------------------ picking: ray vs the buildings' boxes, ray vs the ground
  const setRay = (x, y) => { const r = dom.getBoundingClientRect(); ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); };
  const eventXY = (e) => (ctl && ctl.map ? ctl.map(e.clientX, e.clientY) : [e.clientX, e.clientY]);
  function recordAt(x, y, skip = null) {
    // (the boxes are AABBs of the whole volume: a tall chapel in front of a cottage swallows the tap on the cottage.  Of the boxes the ray crosses, the one whose CENTRE is nearest to the finger on the screen wins —
    //  a tap on a cottage is nearest its own centre, a tap on the chapel's roof is nearest the chapel's)
    setRay(x, y); let best = null, bd = 1e9; const asp = dom.getBoundingClientRect(); const ax = asp.width / Math.max(1, asp.height);
    for (const r of live().visible()) {
      if (r.id === skip) continue; const { pts } = corners(r.x, r.z, r.ry, r.fp);
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, gy = 1e9; for (const [px, pz] of pts) { x0 = Math.min(x0, px); x1 = Math.max(x1, px); z0 = Math.min(z0, pz); z1 = Math.max(z1, pz); gy = Math.min(gy, H(px, pz)); }
      const h = HEIGHT[r.kind] || 9; box.min.set(x0, gy - 0.5, z0); box.max.set(x1, gy + h, z1);
      if (!ray.ray.intersectBox(box, hitP)) continue;
      v3.set(r.x, gy + h * 0.4, r.z).project(camera); const d = Math.hypot((v3.x - ndc.x) * ax, v3.y - ndc.y);
      if (d < bd) { bd = d; best = r; }
    }
    return best;
  }
  function standingOn(x, z, skip) {                         // «drop it ON another building»: the ghost's centre is inside that building's footprint (+0.5 m); not a ray test: a tall chapel's box must not swallow drops behind it
    let best = null, bd = 1e9;
    for (const r of live().visible()) {
      if (r.id === skip) continue; const { cx, cz } = corners(r.x, r.z, r.ry, r.fp), c = Math.cos(r.ry), s = Math.sin(r.ry), dx = x - cx, dz = z - cz, lx = dx * c - dz * s, lz = dx * s + dz * c;
      if (Math.abs(lx) <= r.fp.w / 2 + 0.5 && Math.abs(lz) <= r.fp.d / 2 + 0.5) { const d = Math.hypot(dx, dz); if (d < bd) { bd = d; best = r; } }
    }
    return best;
  }
  function groundAt(x, y) {
    setRay(x, y); const o = ray.ray.origin, d = ray.ray.direction; let t0 = 0, t1 = 0, prev = 0;
    for (let t = 2; t < 1800; t += 2) { v3.copy(d).multiplyScalar(t).add(o); if (v3.y <= H(v3.x, v3.z)) { t1 = t; break; } prev = t; t0 = prev; }
    if (!t1) return null; for (let k = 0; k < 8; k++) { const m = (t0 + t1) / 2; v3.copy(d).multiplyScalar(m).add(o); if (v3.y <= H(v3.x, v3.z)) t1 = m; else t0 = m; }
    return v3.copy(d).multiplyScalar((t0 + t1) / 2).add(o).clone();
  }

  // ------------------------------------------------------------------ selection / pose
  const titleOf = (r) => (r.kind === 'store' ? (STORE_NAME[r.res] || '') + ' storehouse' : NAME[r.kind] || r.kind);
  function setWhy(msg, cls) { why.style.display = msg ? '' : 'none'; why.textContent = msg || ''; why.className = 'pill' + (cls ? ' ' + cls : ''); }
  function evaluate() {
    if (!S.sel) return; const c = live().check(S.sel.id, S.pose); S.check = c;
    poseGhost(S.sel, S.pose, c.ok);
    const moved = Math.hypot(S.pose.x - S.sel.x, S.pose.z - S.sel.z) > 0.01 || Math.abs(S.pose.ry - S.sel.ry) > 0.001;
    if (!moved) setWhy('', ''); else setWhy(c.ok ? '✓ It fits here' : c.why.map((w) => WHY[w] || w).slice(0, 2).join(' · '), c.ok ? 'g' : 'r');
    q('ok').disabled = !moved || !c.ok; q('ok').style.display = moved ? '' : 'none'; q('cancel').style.display = moved ? '' : 'none';
  }
  function select(r) {
    S.sel = r; S.drag = null; S.spots = null; dots.count = 0;
    if (!r) { ghost.visible = false; selLoop.visible = false; setWhy('', ''); hint.textContent = 'Tap a building to pick it'; ui_buttons(); return; }
    S.pose = { x: r.x, z: r.z, ry: r.ry }; poseOutline(r); ghost.visible = false; setWhy('', '');
    hint.textContent = titleOf(r) + ' — drag it, turn it, or drop it on another building to swap';
    S.focus = { x: r.x, z: r.z, t: 0 }; startSpots(); ui_buttons();
  }
  function ui_buttons() {
    const sel = !!S.sel; q('rotl').style.display = q('rotr').style.display = sel ? '' : 'none'; q('def').style.display = sel && S.sel.moved ? '' : 'none';
    q('ok').style.display = q('cancel').style.display = 'none'; q('undo').disabled = !live().canUndo();
    q('all').disabled = !live().count; q('all').querySelector('small').textContent = S.confirmReset > performance.now() ? 'Sure?' : 'Reset all';
  }
  function startSpots() {                                    // green dots where the picked thing fits at its present turn (a 2 m grid within 40 m), found 90 checks per frame
    const r = S.sel; if (!r) return; S.spotJob = { id: r.id, ry: S.pose ? S.pose.ry : r.ry, cx: r.x, cz: r.z, i: 0, n: 0, list: [], N: 40, recs: live().records() };
  }
  function stepSpots() {
    const j = S.spotJob; if (!j || !S.sel || S.sel.id !== j.id || S.drag) return; const L = live(), N = j.N, step = 2, R = N * step / 2;
    for (let k = 0; k < 90 && j.i < N * N; k++, j.i++) {
      const x = Math.round((j.cx - R + (j.i % N) * step) / SNAP) * SNAP, z = Math.round((j.cz - R + Math.floor(j.i / N) * step) / SNAP) * SNAP;
      if (Math.hypot(x - j.cx, z - j.cz) < 3) continue;
      if (j.list.length < DOTS && L.search(j.id, { x, z, ry: j.ry }, j.recs)) j.list.push([x, z]);
    }
    if (j.i >= N * N) { S.spotJob = null; const m = new THREE.Matrix4(); j.list.forEach(([x, z], k) => { m.makeScale(0.95, 1, 0.95).setPosition(x, H(x, z) + 0.35, z); dots.setMatrixAt(k, m); }); dots.count = j.list.length; dots.instanceMatrix.needsUpdate = true; if (!j.list.length) hint.textContent = titleOf(S.sel) + ' — no free place nearby; trade places with another building'; }
  }

  // ------------------------------------------------------------------ pointer routing (capture phase: before the camera controls see it)
  function down(e) {
    if (!S.on || e.button > 0) return; const [x, y] = eventXY(e);
    if (!S.sel) return;
    const r = recordAt(x, y);
    if (r && r.id === S.sel.id) {
      const g = groundAt(x, y); if (!g) return;
      S.drag = { id: e.pointerId, gx: g.x - S.pose.x, gz: g.z - S.pose.z, moved: false, x0: x, y0: y, over: null }; dots.visible = false;
      e.stopImmediatePropagation(); e.preventDefault(); try { dom.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    }
  }
  function move(e) {
    const d = S.drag; if (!d || e.pointerId !== d.id) return; e.stopImmediatePropagation(); const [x, y] = eventXY(e);
    if (!d.moved && Math.hypot(x - d.x0, y - d.y0) < 6) return; d.moved = true;
    const g = groundAt(x, y); if (!g) return;
    S.pose.x = Math.round((g.x - d.gx) / SNAP) * SNAP; S.pose.z = Math.round((g.z - d.gz) / SNAP) * SNAP;
    d.over = standingOn(S.pose.x, S.pose.z, S.sel.id);
    if (d.over) { const c = live().swapCheck(S.sel.id, d.over.id); poseGhost(d.over, { x: S.sel.x, z: S.sel.z, ry: S.sel.ry }, c.ok); S.check = c; setWhy(c.ok ? '⇄ Release to trade places with the ' + titleOf(d.over) : c.why.map((w) => WHY[w] || w).slice(0, 2).join(' · '), c.ok ? 'g' : 'r'); q('ok').style.display = q('cancel').style.display = 'none'; }
    else evaluate();
  }
  function up(e) {
    const d = S.drag; if (!d || e.pointerId !== d.id) return; e.stopImmediatePropagation(); try { dom.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    S.drag = null; dots.visible = true;
    if (d.moved && d.over) { const id = S.sel.id, o = d.over, res = live().swap(id, o.id); if (res.ok) { toast('Traded places'); persist(); S.sel = null; select(null); live().tick(); } else { S.pose = { x: S.sel.x, z: S.sel.z, ry: S.sel.ry }; ghost.visible = false; setWhy(res.why.map((w) => WHY[w] || w).slice(0, 2).join(' · '), 'r'); } return; }
    if (d.moved) { magnet(); evaluate(); } else select(S.sel);
  }
  function magnet() {                                        // a finger is not a millimetre: on release a spot that breaks a rule jumps to the nearest spot within 2 m that does not (green dots are the same spots on a 2 m grid)
    const r = S.sel, L = live(); if (!r || L.search(r.id, S.pose)) return;
    const c = []; for (let dx = -2; dx <= 2; dx += SNAP) for (let dz = -2; dz <= 2; dz += SNAP) { const dd = Math.hypot(dx, dz); if (dd > 0 && dd <= 2.01) c.push([dd, dx, dz]); }
    c.sort((a, b) => a[0] - b[0]);
    for (const [, dx, dz] of c) { const p = { x: S.pose.x + dx, z: S.pose.z + dz, ry: S.pose.ry }; if (L.search(r.id, p)) { S.pose.x = p.x; S.pose.z = p.z; return; } }
  }
  const onTap = (x, y) => {
    if (!S.on) return; const r = recordAt(x, y);
    if (S.sel && r && r.id === S.sel.id) return;
    select(r && r.id ? r : null);
  };

  // ------------------------------------------------------------------ buttons
  function persist() { clearTimeout(S.saveT); S.saveT = setTimeout(() => { try { save(live().save()); } catch (e) { console.warn('layout save', e); } }, 500); }
  function act(a) {
    const L = live();
    if (a === 'done') return close();
    if (a === 'undo') { if (L.undo()) { persist(); const id = S.sel && S.sel.id; select(id ? L.records().find((r) => r.id === id) : null); toast('Undone'); } return; }
    if (a === 'all') { if (S.confirmReset > performance.now()) { S.confirmReset = 0; L.resetAll(); persist(); select(null); toast('Town put back'); } else { S.confirmReset = performance.now() + 3000; ui_buttons(); setTimeout(ui_buttons, 3100); } return; }
    if (!S.sel) return;
    if (a === 'def') { const id = S.sel.id, res = L.reset(id); if (!res.ok) { setWhy('Its old place is taken (' + res.why.map((w) => WHY[w] || w).slice(0, 1).join('') + ')', 'r'); return; } persist(); select(L.records().find((r) => r.id === id)); toast('Put back'); return; }
    if (a === 'rotl' || a === 'rotr') { S.pose.ry += (a === 'rotl' ? 1 : -1) * ROT_STEP; evaluate(); dots.count = 0; startSpots(); return; }
    if (a === 'cancel') { S.pose = { x: S.sel.x, z: S.sel.z, ry: S.sel.ry }; ghost.visible = false; setWhy('', ''); q('ok').style.display = q('cancel').style.display = 'none'; startSpots(); return; }
    if (a === 'ok') {
      const id = S.sel.id, res = L.commit(id, S.pose);
      if (!res.ok) { setWhy(res.why.map((w) => WHY[w] || w).slice(0, 2).join(' · '), 'r'); return; }
      persist(); toast('Moved'); L.tick(); select(L.records().find((r) => r.id === id));
    }
  }
  el.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b) act(b.dataset.a); });
  ent.addEventListener('click', () => open());
  for (const [t, f] of [['pointerdown', down], ['pointermove', move], ['pointerup', up], ['pointercancel', up]]) dom.addEventListener(t, f, true);

  function open() {
    if (S.on || blocked()) return; build3d(); S.on = true; el.style.display = ''; ent.style.display = 'none'; root3.visible = true; hudHide(true);
    S.lastMinD = ctl.minD; ctl.minD = Math.min(ctl.minD, 46); S.lastOnTap = ctl.onTap; ctl.onTap = onTap; select(null);
  }
  const hudHide = (on) => { const h = document.querySelector('.bw-ui'); if (h) h.classList.toggle('bwl-hide', on); };      // the game's own HUD (badge, gems, attack button) is out of the way while arranging: the editor has the whole screen
  function close() {
    if (!S.on) return; S.on = false; hudHide(false); el.style.display = 'none'; if (root3) { root3.visible = false; ghost.visible = false; selLoop.visible = false; dots.count = 0; } S.sel = null; S.drag = null;
    if (S.lastMinD != null) ctl.minD = S.lastMinD; if (S.lastOnTap) ctl.onTap = S.lastOnTap; clearTimeout(S.saveT); try { save(live().save()); } catch (e) { console.warn('layout save', e); }
  }

  let ft = 0;
  function update(dt) {
    const can = !blocked() && world.layout; ent.style.display = !S.on && can ? '' : 'none';
    if (S.on && !can) close();
    if (!S.on) return;
    stepSpots(); if (live().pending) ui_buttons();
    if (S.focus) {                                           // the camera drifts to the picked building (target only: the player keeps his zoom and angle)
      S.focus.t += dt; const k = Math.min(1, dt * 5); ctl.target.x += (S.focus.x - ctl.target.x) * k; ctl.target.z += (S.focus.z - ctl.target.z) * k;
      if (Math.hypot(S.focus.x - ctl.target.x, S.focus.z - ctl.target.z) < 0.5 || S.focus.t > 1.2) S.focus = null;
    }
    ft += dt; const pulse = 0.82 + 0.18 * Math.sin(ft * 5); outlineMat.opacity = pulse;
  }
  return { open, close, update, get active() { return S.on; }, get state() { return S; }, get dotCount() { return dots ? dots.count : 0; }, select: (id) => select(id ? live().records().find((r) => r.id === id) : null), setPose: (p) => { if (S.sel) { S.pose = { ...S.pose, ...p }; evaluate(); } }, act, get root3() { return root3; } };
}
