// rs1_a_page.js — RS1 stage A in the real game page (phone diet).  RS2: the DOM is the fan now (one round button; .rs-f = the 5 sisters that pop out beside it).   python3 rp1c2_q.py -t rs1 evalf rs1_a_page.js   -> { ok, fails, ... }
(async () => {
  const F = [], t = (c, m) => { if (!c) F.push(m); }, sl = (ms) => new Promise((r) => setTimeout(r, ms)), until = async (f, ms = 30000) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (f()) return true; await sl(60); } return !!f(); }, raf = () => new Promise((r) => requestAnimationFrame(r)), out = {};
  window.__rpPhone = true; const h = await window.__rpLoad('?v=' + Date.now()); window.__h = h; const B = window.__bw, R = B.renderer, rp = window.__rp, S = rp.S;
  localStorage.removeItem('bw_rs_v1');
  await h.start('elina'); h.diet.CFG.down_ms = 1e9; await sl(1500); for (let i = 0; i < 4; i++) await raf();
  const tap = (el) => { el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 11, pointerType: 'touch' })); el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 11, pointerType: 'touch' })); };
  const cardEls = () => [...document.querySelectorAll('.rs-wrap .rs-f:not(.cur)')], K = ['elina', 'elika', 'melika', 'mobina', 'aylin', 'aylar'];
  // 1. RS2 the fan: ONE round button closed; opened = 5 sisters (the current one is not in it), every hit area >= 44, inside the screen, not on top of any other HUD button
  const mn = h.sisters.main; t(!!mn && mn.getBoundingClientRect().width >= 44, 'main button missing / < 44'); t(!h.sisters.st.open, 'fan is open at the start'); h.sisters.openFan(); await until(() => h.sisters.tog.getBoundingClientRect().width >= 44, 20000); { let prev = '', same = 0; for (let i = 0; i < 40 && same < 2; i++) { await sl(500); const cur = JSON.stringify(cardEls().concat([h.sisters.tog]).map((e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width]; })); same = cur === prev ? same + 1 : 0; prev = cur; } }      // (software GL: ~1 frame/s, the fan's transitions need real frames; wait until nothing moves)
  const cs = cardEls(); t(cs.length === 5, 'five sisters in the fan: ' + cs.length); out.cards = cs.map((c) => c.dataset.k);
  const others = [...document.querySelectorAll('.rp-b')].filter((b) => b.offsetParent && getComputedStyle(b).visibility !== 'hidden').map((b) => b.getBoundingClientRect());
  const boxes = []; for (const c of cs) { const r = c.getBoundingClientRect(); boxes.push([c.dataset.k, Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]); t(r.width >= 44 && r.height >= 44, c.dataset.k + ': hit ' + r.width + 'x' + r.height); t(r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, c.dataset.k + ': outside the screen');
    for (const o of others) t(!(r.left < o.right && r.right > o.left && r.top < o.bottom && r.bottom > o.top), c.dataset.k + ': overlaps a HUD button'); }
  const mr = mn.getBoundingClientRect(); boxes.push(['main', Math.round(mr.x), Math.round(mr.y), Math.round(mr.width), Math.round(mr.height)]); const tg = document.querySelector('.rs-t'); if (tg) { const r = tg.getBoundingClientRect(); t(r.width >= 44 && r.height >= 44, 'toggle < 44'); boxes.push(['toggle', Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]); }
  out.boxes = boxes; out.viewport = [innerWidth, innerHeight]; t(document.querySelector('.rs-f.cur') && document.querySelector('.rs-f.cur').dataset.k === 'elina', 'the current sister is not elina'); h.sisters.closeFan(); await sl(500);
  t(!/ربات|\bbot\b/i.test(document.querySelector('.rs-wrap').outerHTML + (document.querySelector('.rs-hint') || {}).outerHTML), 'forbidden word in the strip');
  // 2. memory + budget before
  const mem = () => ({ tex: R.info.memory.textures, geo: R.info.memory.geometries, prog: (R.info.programs || []).length, keys: Object.keys(S.models) });
  const m0 = mem(); out.mem0 = m0; const frame = () => { const p = rp.perf(); return [p.calls, p.tris]; }; await raf(); await raf(); out.f0 = frame();
  const pos0 = [S.x, S.y, S.z, S.body, S.camYaw], cam0 = B.camera.position.toArray();
  // 3. a long sweep: every sister in turn.  Each switch: the key changes, the position / camera stay, memory returns to the baseline, the marker follows, only ONE model is cached
  const seq = ['aylar', 'aylin', 'elika', 'melika', 'mobina', 'elina'], rows = [];
  for (const k of seq) {
    const x0 = S.x, z0 = S.z, c0 = B.camera.position.clone(); const t0 = performance.now(); tap(document.querySelector('.rs-f[data-k=' + k + ']'));
    const ld = h.sisters.main.classList.contains('ld'); let n = 0; while (S.key !== k && n++ < 600) await sl(50); const ms = Math.round(performance.now() - t0);
    t(S.key === k, k + ': never became the sister in play'); if (S.key !== k) continue;
    t(ld, k + ': no spinner on the round button'); t(!document.querySelector('.bwb-load'), k + ': a blue loading card'); t(!h.sisters.st.open, k + ': the fan stays open after the pick'); S.fixed = 0.1; await until(() => h.sisters.st.fx === 0 && S.grounded, 60000); S.fixed = 0; await sl(300); for (let i = 0; i < 3; i++) await raf();
    const m = mem(); const mk = h.marker ? h.marker.info() : null;
    t(Math.hypot(S.x - x0, S.z - z0) < 0.5, k + ': moved ' + Math.hypot(S.x - x0, S.z - z0).toFixed(2) + ' m at the swap'); t(B.camera.position.distanceTo(c0) < 0.5, k + ': camera jumped ' + B.camera.position.distanceTo(c0).toFixed(2));
    t(m.tex === m0.tex && m.geo === m0.geo, k + ': memory ' + JSON.stringify(m) + ' vs ' + JSON.stringify(m0)); t(m.keys.length === 1 && m.keys[0] === k, k + ': cache ' + m.keys);
    t(!!mk && mk.markers === 1, k + ': markers ' + (mk && mk.markers)); t(document.querySelectorAll('.rs-f.cur').length === 1 && document.querySelector('.rs-f.cur').dataset.k === k, k + ': current sister');
    t(S.hero.grp.parent === B.scene, k + ': her group is not in the scene'); t(!document.querySelector('.rs-m.ld'), k + ': spinner stays'); t(!document.querySelector('.rs-chip'), k + ': the chip stays'); t(h.active, k + ': hero mode ended');
    let heroSk = 0; B.scene.traverse((o) => { if (o.isSkinnedMesh && o.userData.rpHero && !o.userData.rpMarker) heroSk++; }); t(heroSk === 1, k + ': skinned hero meshes in the scene ' + heroSk);
    rows.push({ k, ms, tex: m.tex, geo: m.geo, prog: m.prog, f: frame(), t: h.sisT });
  }
  out.rows = rows; out.f1 = frame();
  // 4. the same sister again = nothing; a tap while loading is ignored
  const k0 = S.key; tap(document.querySelector('.rs-f[data-k=' + k0 + ']')); await sl(200); t(S.key === k0 && !document.querySelector('.rs-m.ld'), 'tapping the active card did something');
  tap(document.querySelector('.rs-f[data-k=aylin]')); tap(document.querySelector('.rs-f[data-k=aylar]')); let q = 0; while (S.key === k0 && q++ < 600) await sl(50); await sl(500); t(S.key === 'aylin', 'a second tap while loading was not ignored: ' + S.key);
  S.fixed = 0.1; await until(() => h.sisters.st.fx === 0 && S.grounded, 90000); S.fixed = 0; await sl(500); for (let i = 0; i < 3; i++) await raf();        // RS2: (let the drop-in + the GPU backlog of her upload finish: the next step counts frames in a 12.5 s window on a ~1 fps rig)
  // 5. the sister in play walks on while the next one is fetched: the glb request is held 14 s; meanwhile the frame loop runs, she walks (fixed 1/30 s frames), her card shows the spinner, the old one is still the sister in play
  const f0 = window.fetch; window.fetch = (u, ...a) => (/\.glb/.test(String(u && u.url || u)) ? new Promise((r) => setTimeout(r, 14000)).then(() => f0(u, ...a)) : f0(u, ...a));
  S.fixed = 1 / 30; let fr0 = 0, run = true; (async () => { while (run) { await raf(); fr0++; } })(); rp.setInput(0, 1); const xz0 = [S.x, S.z]; tap(document.querySelector('.rs-f[data-k=elika]'));
  await sl(12500); const during = { key: S.key, ld: !!document.querySelector('.rs-m.ld'), chip: !!document.querySelector('.rs-chip'), blue: !!document.querySelector('.bwb-load'), frames: fr0, walked: Math.hypot(S.x - xz0[0], S.z - xz0[1]) };
  let w = 0; while (S.key !== 'elika' && w++ < 600) await sl(50); const dd = Math.hypot(S.x - xz0[0], S.z - xz0[1]); rp.setInput(0, 0); run = false; S.fixed = 0; window.fetch = f0;
  t(S.key === 'elika', 'swap while walking failed'); t(during.key !== 'elika' && during.ld && during.chip && !during.blue, 'during the load: ' + JSON.stringify(during)); t(during.frames >= 1 && during.walked > 0.02, 'she did not walk during the load: ' + JSON.stringify(during)); out.during = during; out.walkedTotal = +dd.toFixed(3);
  // 6. exit / re-enter: the strip goes and comes back, no stray sister left in the scene
  h.exit(); await sl(300); t(!document.querySelector('.rs-wrap') && !document.querySelector('.rs-chip'), 'the fan / chip stays after exit'); let leftover = 0; B.scene.traverse((o) => { if (o.isSkinnedMesh && o.userData.rpHero) leftover++; }); t(leftover === 0, 'a hero mesh stays in the scene: ' + leftover);
  out.memAfterExit = mem(); await h.start('elina'); await sl(500); h.exit(); await sl(300); out.memAfterReenter = mem(); out.fails = F; out.ok = F.length === 0; return JSON.stringify(out);
})()
