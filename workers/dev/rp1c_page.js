// rp1c_page.js — evaluated inside the game page by rp1c_page.py AFTER the hero is started (window.__rp) and with window.__pre = the snapshot taken BEFORE it started.
// Returns JSON {checks:[{name,ok,info}], nums:{...}}.  Nothing is mocked except `doors.st.force` (a test-only override of an orb's colour: the offline preview cannot produce an affordable upgrade = green).
(async () => {
  const rp = __rp, S = rp.S, B = __bw, R = B.renderer, T = B.THREE, sc = B.scene, cam = B.camera, checks = [], nums = {}, pre = window.__pre;
  const raf = () => new Promise((r) => requestAnimationFrame(r)), wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const chk = (name, ok, info) => checks.push({ name, ok: !!ok, info: info === undefined ? '' : info });
  const progs = () => R.info.programs.length, mem = () => [R.info.memory.geometries, R.info.memory.textures];
  const meas = () => { R.info.autoReset = false; R.info.reset(); R.render(sc, cam); return { calls: R.info.render.calls, tris: R.info.render.triangles }; };
  const C = rp.cull(), D = rp.doors();
  const settle = async (n = 3) => { for (let i = 0; i < n; i++) await raf(); await wait(2200); };
  const place = async (x, z, yaw, pitch = 0.25) => { rp.pause(true); S.cool = 99; rp.setPos(x, z, yaw); rp.setLook(yaw, pitch); rp.sim(0.3); await settle(); };
  const shot = (w = 130, h = 280) => { const cv = R.domElement, c2 = document.createElement('canvas'); c2.width = w; c2.height = h; const g = c2.getContext('2d'); R.render(sc, cam); g.drawImage(cv, 0, 0, w, h); return g.getImageData(0, 0, w, h).data; };
  const diff = (a, b) => { let s = 0, n = a.length / 4; for (let i = 0; i < a.length; i += 4) s += (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2])) / 3; return +(s / n).toFixed(3); };
  const cullOff = (b) => { for (const P of C.st.list) { P.o.visible = b; for (const W of P.views) W.px.visible = !b && (W.sh ? false : W.n > 0); } C.st.on = !b; };
  const outFront = (it, r) => { let nx = -21 - it.fx, nz = -6.3 - it.fz; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l; for (const k of [r, r * 0.7, r * 0.5]) { const x = it.fx + nx * k, z = it.fz + nz * k; if (rp.free(x, z)) return [x, z, Math.atan2(it.fx - x, it.fz - z)]; } return null; };
  const hiddenNames = () => { const h = []; sc.traverse((o) => { if (o.isInstancedMesh && o.count > 0 && !o.visible && !(o.userData && (o.userData.rpHero || o.userData.rpProxy))) h.push((o.name || o.type) + ':' + o.count); }); return h.sort().join('|'); };

  // ---------------------------------------------------------------- 1 culling: fewer calls / triangles, the same picture
  const views = { gate: [40.95, 21.98, -2.17], fields: [211, 22, 1.57] };
  for (const [name, v] of Object.entries(views)) {
    await place(v[0], v[1], v[2]);
    cullOff(true); const a = shot(), mA = meas(); cullOff(false); const b = shot(), mB = meas(); const d = diff(a, b);
    nums[name] = { off: mA, on: mB, diff: d };
    chk('cull @' + name + ': fewer draw calls and triangles with the proxies than with the originals', mB.calls < mA.calls && mB.tris < mA.tris, mA.calls + '/' + mA.tris + ' -> ' + mB.calls + '/' + mB.tris);
    chk('cull @' + name + ': the picture is the same (mean |diff| of 255 below 3)', d < 3, 'mean diff ' + d);
  }
  const ci = C.info(); chk('cull: the proxies exist and the skipped list is reported', ci.packs > 20, ci.packs + ' packs, ' + ci.skipped.length + ' skipped, tick ' + ci.ms + ' ms');

  // ---------------------------------------------------------------- 2 the doors
  const items = D.items(); const SM = B.SM;
  chk('doors: one for every building / worksite / lot with a T1 sheet (>= 100)', items.length >= 100, items.length + ' doors, ' + new Set(items.map((i) => i.kind)).size + ' kinds');
  let g = 0, bl = 0, other = 0; for (const it of items) { const p = rp.peek(it.id); if (p === 'gold') g++; else if (p === 'blue') bl++; else if (p !== 'green') other++; }
  chk('doors: sheets.peek gives gold (collect) for some, blue (info) for others, nothing else', g >= 1 && bl >= 1 && other === 0, 'gold ' + g + ', blue ' + bl + ', other ' + other);
  // a street with 6 doors, all three colours forced
  const dense = items.find((i) => i.id === 'home:cottage_00') || items[0];
  const near = items.filter((b) => Math.hypot(b.x - dense.x, b.z - dense.z) < 26).sort((p, q) => Math.hypot(p.x - dense.x, p.z - dense.z) - Math.hypot(q.x - dense.x, q.z - dense.z));
  D.st.force = {}; near.forEach((b, i) => { D.st.force[b.id] = ['gold', 'green', 'blue'][i % 3]; }); D.st.peekAt = -1e9;
  const b9 = near.find((b) => outFront(b, 9)) || dense, sp0 = outFront(b9, 9) || [dense.gx, dense.gz, 0]; await place(sp0[0], sp0[1], sp0[2]);
  const inf = D.info(), pv = D.st.items.filter((i) => i.d2 <= 45 * 45 && !i.icon).length;
  chk('doors: every door within 45 m that is not an icon is an orb', inf.orbs === pv && inf.orbs > 0, inf.orbs + ' orbs, expected ' + pv);
  chk('doors: the three colours are all drawn (3 Points, one call each) and the whole thing costs <= 6 draw calls', (function () { let n = 0, k = 0; for (const c of [...(sc.getObjectByName('rp-doors') || { children: [] }).children]) { if (c.isPoints && c.visible) n++; if (c.visible) k++; } return n === 3 && k <= 6; })(), JSON.stringify(inf));
  const st3 = new Set(D.st.items.filter((i) => i.d2 <= 45 * 45).map((i) => i.st)); chk('doors: gold, green and blue each have at least one orb in range', st3.size === 3, [...st3].join(','));
  const mm = meas(); nums.doors_street = { calls: mm.calls, tris: mm.tris, orbs: inf.orbs, icons: inf.icons, ms: inf.ms };
  chk('doors: <= 3 icons at the same time', inf.icons <= 3, inf.icons + ' icons');
  // near icon: 6 m in front of a forced-gold door
  const b6 = near.find((b) => outFront(b, 6)) || near[0]; D.st.force[b6.id] = 'gold'; const sp1 = outFront(b6, 6); if (sp1) await place(sp1[0], sp1[1], sp1[2], 0.2);
  const icn = D.st.items.filter((i) => i.icon); chk('doors: within 12 m and in front of the camera the nearest door turns into an icon', icn.length >= 1 && icn.length <= 3 && Math.sqrt(icn[0].d2) <= 12, icn.map((i) => i.id + ' ' + Math.sqrt(i.d2).toFixed(1) + ' m').join(', '));
  const sprVis = (sc.getObjectByName('rp-doors').children.filter((c) => c.isSprite && c.visible)).length; chk('doors: one glass-plate sprite per icon', sprVis === icn.length, sprVis + ' sprites');
  { cam.updateMatrixWorld(); R.render(sc, cam); const b = progs(); D.exit(); C.exit(); R.render(sc, cam); const a = progs(); C.enter(); D.enter(); D.st.force = {}; near.forEach((q, i) => { D.st.force[q.id] = ['gold', 'green', 'blue'][i % 3]; }); D.st.peekAt = -1e9; await settle(2); R.render(sc, cam); const c2 = progs();
    chk('programs: switching the culling + the door orbs / icons off and on again (3 Points, sprites, proxies) changes the program count by 0', c2 === a && b === a, 'with ' + b + ', without ' + a + ', with again ' + c2); nums.progs_ab = [b, a, c2]; }
  // the door button wears the same icon
  rp.pause(false); const g0 = rp.goNear ? rp.goNear(near[0].id, 1.5) : null; const nid = D.items().find((i) => i.id === near[0].id);
  rp.setPos(nid.gx, nid.gz, Math.atan2(nid.fx - nid.gx, nid.fz - nid.gz)); rp.sim(0.3); await settle(2); await wait(600);
  const btn = [...document.querySelectorAll('[data-rp="act"]')].pop(), nowId = S.near && S.near.id;
  const norm = (h) => { const e = document.createElement('div'); e.innerHTML = h; return e.innerHTML; };
  chk('door button: shows within 2.5 m and wears the icon of the door\'s kind', !!btn && btn.style.display !== 'none' && !!nowId && btn.innerHTML === norm(D.iconSVG(D.kindOf(nowId))), 'near ' + nowId + ', kind ' + (nowId && D.kindOf(nowId)));

  // ---------------------------------------------------------------- 3 tap on an orb from 13 m -> she walks there herself, the sheet opens on arrival, `interact` plays; the joystick cancels
  const tgt = D.items().find((i) => i.id === 'home:cottage_10') || near[0], sp2 = outFront(tgt, 13);
  rp.pause(true); S.cool = 99; rp.setPos(sp2[0], sp2[1], sp2[2]); rp.setLook(sp2[2], 0.25); rp.sim(0.4); rp.pause(false); await settle(2);
  cam.updateMatrixWorld(); const tp = new T.Vector3(tgt.x, tgt.y, tgt.z).project(cam), sx = (tp.x + 1) * 0.5 * innerWidth, sy = (1 - tp.y) * 0.5 * innerHeight;
  const miss = rp.tapDoor(4, innerHeight - 4); chk('tap: empty ground is not a door', miss === false);
  const ok1 = rp.tapDoor(sx, sy); chk('tap: a finger on the orb starts the walk', ok1 === true && !!rp.autoState(), JSON.stringify(rp.autoState()));
  rp.sim(1.2); S.joyOn = true; rp.setInput(0.5, 0.5); rp.sim(0.5); S.joyOn = false; rp.setInput(0, 0); chk('tap: the joystick cancels the walk (no sheet opens)', rp.autoState() === null && !rp.sheetOn(), 'auto ' + JSON.stringify(rp.autoState())); rp.sim(0.3);
  cam.updateMatrixWorld(); const tp2 = new T.Vector3(tgt.x, tgt.y, tgt.z).project(cam); const ok2 = rp.tapDoor((tp2.x + 1) * 0.5 * innerWidth, (1 - tp2.y) * 0.5 * innerHeight); let t = 0, acted = false; const p0 = rp.pos();
  while (!S.sheetOn && t < 45) { rp.sim(0.25); t += 0.25; }
  rp.sim(0.4); acted = !!rp.act(); const pe = rp.pos();
  chk('tap: she walks to the door by herself and the sheet opens on arrival (the T1 sheet)', ok2 === true && S.sheetOn === true && !!document.querySelector('.bsh.on'), 'walked ' + t + ' s from ' + Math.round(Math.hypot(sp2[0] - tgt.gx, sp2[1] - tgt.gz)) + ' m, sheetOn ' + S.sheetOn);
  chk('tap: she ends within 3 m of the door', Math.hypot(pe.x - tgt.fx, pe.z - tgt.fz) < 3.2, Math.hypot(pe.x - tgt.fx, pe.z - tgt.fz).toFixed(2) + ' m');
  chk('tap: the interact clip is played on arrival', acted || !S.hero || !S.hero.acts || !S.hero.acts.interact, 'act ' + JSON.stringify(rp.act()) + ', clip ' + !!(S.hero && S.hero.acts && S.hero.acts.interact));
  const x = document.querySelector('.bsh.on .bsh-x'); if (x) x.click(); for (let i = 0; i < 3; i++) await raf(); await wait(500);
  chk('tap: closing the sheet returns to walking', rp.sheetOn() === false, 'sheetOn ' + rp.sheetOn());
  D.st.force = null;

  // ---------------------------------------------------------------- 4 leaving hero mode leaves nothing
  { R.render(sc, cam); const k0 = mem(); D.exit(); C.exit(); const k1 = mem(); C.enter(); D.enter(); R.render(sc, cam); const k2 = mem(); D.exit(); C.exit(); const k3 = mem(); C.enter(); D.enter(); nums.own_gpu = [k0, k1, k2, k3];
    chk('own resources: culling proxies + door orbs / icons: enter + draw + exit gives back the GPU geometry / texture counts exit gave before (+-2: the world own streaming of castle / town LOD cells moves them by one; the proxies own footprint with-vs-with must stay within 1 geometry, i.e. nothing accumulates)', Math.abs(k3[0] - k1[0]) <= 2 && Math.abs(k3[1] - k1[1]) <= 2 && Math.abs(k2[0] - k0[0]) <= 1 && Math.abs(k2[1] - k0[1]) <= 2, 'with ' + k0.join('/') + ', without ' + k1.join('/') + ', with again ' + k2.join('/') + ', without again ' + k3.join('/')); }
  const shadowHooked = R.shadowMap.render !== pre.shadowRender;
  chk('exit prep: while hero mode is on the shadow pass is hooked (and only then)', shadowHooked);
  rp.pause(false); await rp.exit(); await wait(2500);
  let nd = 0, npx = 0, npt = 0; sc.traverse((o) => { if (o.name === 'rp-doors') nd++; if (o.name && o.name.endsWith('#rp')) npx++; if (o.userData && o.userData.rpHero && (o.isPoints || o.isSprite)) npt++; });
  chk('exit: no rp-doors group, no culling proxy, no orb Points / icon sprite left in the scene', nd === 0 && npx === 0 && npt === 0, nd + ' / ' + npx + ' / ' + npt);
  chk('exit: shadow pass is the original function again', R.shadowMap.render === pre.shadowRender);
  { const hn = hiddenNames().split('|').filter(Boolean), hp = new Set((pre.hidden || '').split('|').filter(Boolean)); chk('exit: every instanced mesh the culling hid is visible again (what is still hidden was hidden by the world before the hero too)', hn.every((x) => hp.has(x)), JSON.stringify(hn) + ' vs before ' + JSON.stringify([...hp])); }
  const m1 = mem();
  await rp.start('elina'); await wait(2500); await rp.exit(); await wait(2500); const m2 = mem();
  await rp.start('elina'); await wait(2500); await rp.exit(); await wait(2500); const m3 = mem(); nums.gpu = [m1, m2, m3];
  chk('info: whole hero sessions (the hero model, the world\'s own streaming of tiers / textures) change the GPU geometry / texture counts like this (not asserted: not RP1C\'s)', true, m1.join('/') + ' -> ' + m2.join('/') + ' -> ' + m3.join('/'));
  chk('programs after the whole session: within the +4 RP1B allows (world content first seen from the ground compiles on sight; the doors / culling share existing programs, see above)', progs() <= pre.progs + 4, pre.progs + ' -> ' + progs());
  return JSON.stringify({ checks, nums });
})()
