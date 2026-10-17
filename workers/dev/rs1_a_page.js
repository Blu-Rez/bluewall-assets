// rs1_a_page.js — RS1 stage A in the real game page (phone diet).   python3 rp1c2_q.py -t rs1 evalf rs1_a_page.js   -> { ok, fails, ... }
(async () => {
  const F = [], t = (c, m) => { if (!c) F.push(m); }, sl = (ms) => new Promise((r) => setTimeout(r, ms)), raf = () => new Promise((r) => requestAnimationFrame(r)), out = {};
  window.__rpPhone = true; const h = await window.__rpLoad('?v=' + Date.now()); window.__h = h; const B = window.__bw, R = B.renderer, rp = window.__rp, S = rp.S;
  localStorage.removeItem('bw_rs_v1');
  await h.start('elina'); h.diet.CFG.down_ms = 1e9; await sl(1500); for (let i = 0; i < 4; i++) await raf();
  const tap = (el) => { el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 11, pointerType: 'touch' })); el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 11, pointerType: 'touch' })); };
  const cardEls = () => [...document.querySelectorAll('.rs-strip .rs-c')], K = ['elina', 'elika', 'melika', 'mobina', 'aylin', 'aylar'];
  // 1. the strip: six cards, every hit area >= 44, inside the screen, not on top of any other HUD button
  const cs = cardEls(); t(cs.length === 6, 'six cards: ' + cs.length); out.cards = cs.map((c) => c.dataset.k);
  const others = [...document.querySelectorAll('.rp-b')].filter((b) => b.offsetParent && getComputedStyle(b).visibility !== 'hidden').map((b) => b.getBoundingClientRect());
  const boxes = []; for (const c of cs) { const r = c.getBoundingClientRect(); boxes.push([c.dataset.k, Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]); t(r.width >= 44 && r.height >= 44, c.dataset.k + ': hit ' + r.width + 'x' + r.height); t(r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, c.dataset.k + ': outside the screen');
    for (const o of others) t(!(r.left < o.right && r.right > o.left && r.top < o.bottom && r.bottom > o.top), c.dataset.k + ': overlaps a HUD button'); }
  const tg = document.querySelector('.rs-t'); if (tg) { const r = tg.getBoundingClientRect(); t(r.width >= 44 && r.height >= 44, 'toggle < 44'); boxes.push(['toggle', Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]); }
  out.boxes = boxes; out.viewport = [innerWidth, innerHeight]; t(document.querySelector('.rs-c.on') && document.querySelector('.rs-c.on').dataset.k === 'elina', 'the active card is not elina');
  t(!/ربات|\bbot\b/i.test(document.querySelector('.rs-strip').outerHTML + (document.querySelector('.rs-hint') || {}).outerHTML), 'forbidden word in the strip');
  // 2. memory + budget before
  const mem = () => ({ tex: R.info.memory.textures, geo: R.info.memory.geometries, prog: (R.info.programs || []).length, keys: Object.keys(S.models) });
  const m0 = mem(); out.mem0 = m0; const frame = () => { const p = rp.perf(); return [p.calls, p.tris]; }; await raf(); await raf(); out.f0 = frame();
  const pos0 = [S.x, S.y, S.z, S.body, S.camYaw], cam0 = B.camera.position.toArray();
  // 3. a long sweep: every sister in turn.  Each switch: the key changes, the position / camera stay, memory returns to the baseline, the marker follows, only ONE model is cached
  const seq = ['aylar', 'aylin', 'elika', 'melika', 'mobina', 'elina'], rows = [];
  for (const k of seq) {
    const x0 = S.x, z0 = S.z, c0 = B.camera.position.clone(); const t0 = performance.now(); tap(document.querySelector('.rs-c[data-k=' + k + ']'));
    const ld = document.querySelector('.rs-c[data-k=' + k + ']').classList.contains('ld'); let n = 0; while (S.key !== k && n++ < 600) await sl(50); const ms = Math.round(performance.now() - t0);
    t(S.key === k, k + ': never became the sister in play'); if (S.key !== k) continue;
    t(ld, k + ': no spinner on the tapped card'); await sl(300); for (let i = 0; i < 3; i++) await raf();
    const m = mem(); const mk = h.marker ? h.marker.info() : null;
    t(Math.hypot(S.x - x0, S.z - z0) < 0.5, k + ': moved ' + Math.hypot(S.x - x0, S.z - z0).toFixed(2) + ' m at the swap'); t(B.camera.position.distanceTo(c0) < 0.5, k + ': camera jumped ' + B.camera.position.distanceTo(c0).toFixed(2));
    t(m.tex === m0.tex && m.geo === m0.geo, k + ': memory ' + JSON.stringify(m) + ' vs ' + JSON.stringify(m0)); t(m.keys.length === 1 && m.keys[0] === k, k + ': cache ' + m.keys);
    t(!!mk && mk.markers === 1, k + ': markers ' + (mk && mk.markers)); t(document.querySelectorAll('.rs-c.on').length === 1 && document.querySelector('.rs-c.on').dataset.k === k, k + ': active card');
    t(S.hero.grp.parent === B.scene, k + ': her group is not in the scene'); t(!document.querySelector('.rs-c.ld'), k + ': spinner stays'); t(h.active, k + ': hero mode ended');
    let heroSk = 0; B.scene.traverse((o) => { if (o.isSkinnedMesh && o.userData.rpHero && !o.userData.rpMarker) heroSk++; }); t(heroSk === 1, k + ': skinned hero meshes in the scene ' + heroSk);
    rows.push({ k, ms, tex: m.tex, geo: m.geo, prog: m.prog, f: frame(), t: h.sisT });
  }
  out.rows = rows; out.f1 = frame();
  // 4. the same sister again = nothing; a tap while loading is ignored
  const k0 = S.key; tap(document.querySelector('.rs-c[data-k=' + k0 + ']')); await sl(200); t(S.key === k0 && !document.querySelector('.rs-c.ld'), 'tapping the active card did something');
  tap(document.querySelector('.rs-c[data-k=aylin]')); tap(document.querySelector('.rs-c[data-k=aylar]')); let q = 0; while (S.key === k0 && q++ < 600) await sl(50); await sl(500); t(S.key === 'aylin', 'a second tap while loading was not ignored: ' + S.key);
  // 5. the sister in play walks on while the next one is fetched: the glb request is held 14 s; meanwhile the frame loop runs, she walks (fixed 1/30 s frames), her card shows the spinner, the old one is still the sister in play
  const f0 = window.fetch; window.fetch = (u, ...a) => (/\.glb/.test(String(u && u.url || u)) ? new Promise((r) => setTimeout(r, 14000)).then(() => f0(u, ...a)) : f0(u, ...a));
  S.fixed = 1 / 30; let fr0 = 0, run = true; (async () => { while (run) { await raf(); fr0++; } })(); rp.setInput(0, 1); const xz0 = [S.x, S.z]; tap(document.querySelector('.rs-c[data-k=elika]'));
  await sl(12500); const during = { key: S.key, ld: !!document.querySelector('.rs-c[data-k=elika].ld'), frames: fr0, walked: Math.hypot(S.x - xz0[0], S.z - xz0[1]) };
  let w = 0; while (S.key !== 'elika' && w++ < 600) await sl(50); const dd = Math.hypot(S.x - xz0[0], S.z - xz0[1]); rp.setInput(0, 0); run = false; S.fixed = 0; window.fetch = f0;
  t(S.key === 'elika', 'swap while walking failed'); t(during.key !== 'elika' && during.ld, 'during the load: ' + JSON.stringify(during)); t(during.frames >= 1 && during.walked > 0.02, 'she did not walk during the load: ' + JSON.stringify(during)); out.during = during; out.walkedTotal = +dd.toFixed(3);
  // 6. exit / re-enter: the strip goes and comes back, no stray sister left in the scene
  h.exit(); await sl(300); t(!document.querySelector('.rs-strip'), 'strip stays after exit'); let leftover = 0; B.scene.traverse((o) => { if (o.isSkinnedMesh && o.userData.rpHero) leftover++; }); t(leftover === 0, 'a hero mesh stays in the scene: ' + leftover);
  out.memAfterExit = mem(); await h.start('elina'); await sl(500); h.exit(); await sl(300); out.memAfterReenter = mem(); out.fails = F; out.ok = F.length === 0; return JSON.stringify(out);
})()
