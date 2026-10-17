// rs1_b_page.js — RS1 stage B in the real game page (phone diet): sisters stand where they were left, switch / bring / persistence / LOD / budget / underworld.
//   python3 rp1c2_q.py -t rs1 evalf rs1_b_page.js   -> { ok, fails, ... }
(async () => {
  const F = [], t = (c, m) => { if (!c) F.push(m); }, sl = (ms) => new Promise((r) => setTimeout(r, ms)), raf = () => new Promise((r) => requestAnimationFrame(r)), out = {};
  const until = async (f, ms = 60000) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (f()) return true; await sl(100); } return false; };
  window.__rpPhone = true; const h = await window.__rpLoad('?v=' + Date.now()); window.__h = h; const B = window.__bw, R = B.renderer, rp = window.__rp, S = rp.S;
  localStorage.removeItem('bw_rs_v1'); await h.start('elina'); await sl(1500); for (let i = 0; i < 3; i++) await raf(); h.exit(); await sl(500); await h.start('elina'); h.diet.CFG.down_ms = 1e9; await sl(1200); for (let i = 0; i < 3; i++) await raf(); const sis = h.sisters;   // (warm-up: the first session uploads the world's own textures / builds the hero modules; the baseline is taken in the second)
  const tap = (el) => { el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 21, pointerType: 'touch' })); el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 21, pointerType: 'touch' })); };
  const card = (k) => document.querySelector('.rs-f[data-k=' + k + ']');       // RS2: the sisters are the fan's items now (the DOM events work with the fan closed too)
  const mem = () => ({ tex: R.info.memory.textures, geo: R.info.memory.geometries });
  const heroMeshes = () => { const a = []; B.scene.traverse((o) => { if (o.isSkinnedMesh && o.userData.rpHero) { const m = Array.isArray(o.material) ? o.material[0] : o.material; const im = m && m.map && m.map.image; a.push({ w: im ? im.width : 0, vis: (() => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; })(), x: o.parent.parent ? 0 : 0 }); } }); return a; };
  const frame = () => { const p = rp.perf(); return [p.calls, p.tris]; };
  const tickOnce = async () => { await raf(); };
  const swapTo = async (k) => { tap(card(k)); const ok = await until(() => S.key === k, 120000); await sl(300); await raf(); return ok; };
  rp.S.fixed = 0; const m0 = mem(); out.mem0 = m0; await raf(); await raf(); out.f0 = frame();
  // ---- 1. the switch: default OFF, remembered
  t(sis.st.stand === false, 'stand is not OFF by default'); const tg = document.querySelector('.rs-t'); tap(tg); await sl(200);
  t(sis.st.stand === true && JSON.parse(localStorage.getItem('bw_rs_v1')).on === 1, 'toggle ON did not stick'); t(tg.classList.contains('on') && tg.getAttribute('aria-pressed') === 'true', 'toggle not shown ON');
  t(document.querySelector('.rs-hint').classList.contains('on') && /[؀-ۿ]/.test(document.querySelector('.rs-hint').textContent), 'no hint shown');
  // ---- 2. elina is left where she stands; aylar steps out beside her
  const P0 = [S.x, S.z, S.body]; t(await swapTo('aylar'), 'aylar never became the sister in play'); const dA = Math.hypot(S.x - P0[0], S.z - P0[1]);
  t(dA > 1.4 && dA < 2.6, 'aylar is ' + dA.toFixed(2) + ' m from elina'); t(S.y > -50, 'bad y');
  t(!!sis.ents.elina && !!sis.ents.elina.m && sis.ents.elina.m.rsStand, 'elina is not a stand-in'); t(Math.hypot(sis.ents.elina.x - P0[0], sis.ents.elina.z - P0[1]) < 0.01, 'elina moved');
  t(sis.st.places.elina && Math.abs(sis.st.places.elina[0] - P0[0]) < 0.01, 'elina place not stored'); t(JSON.parse(localStorage.getItem('bw_rs_v1')).p.elina[0] !== undefined, 'places not in storage');
  t(S.discs.some((d) => Math.hypot(d[0] - P0[0], d[1] - P0[1]) < 0.01 && d[2] === 0.4), 'no collision disc for elina'); t(card('elina').classList.contains('st'), 'no «stands» dot on elina in the fan');
  for (let i = 0; i < 4; i++) await raf(); const hm = heroMeshes(); out.heroes2 = hm; t(hm.length === 2, 'skinned hero meshes: ' + hm.length); t(hm.filter((x) => x.w === 1024).length === 1 && hm.filter((x) => x.w === 2048).length === 1, 'texture sizes: ' + JSON.stringify(hm.map((x) => x.w)));
  t(sis.ents.elina.m.grp.parent === B.scene, 'elina not in the scene');
  // ---- 3. a far spot: aylar stays there, elika steps out beside her; then elina's card: control goes to HER place, aylar and elika keep theirs
  const far = [P0[0] - 40, P0[1] + 10]; rp.setPos(far[0], far[1], 0.5); await sl(300); const P1 = [S.x, S.z, S.body];
  t(await swapTo('elika'), 'elika never became the sister in play'); const dist1 = Math.hypot(S.x - P1[0], S.z - P1[1]); t(dist1 > 1.4 && dist1 < 2.6, 'elika ' + dist1.toFixed(2) + ' from aylar');
  t(Object.keys(sis.st.places).sort().join() === 'aylar,elina', 'places: ' + Object.keys(sis.st.places));
  const cam1 = B.camera.position.clone(); t(await swapTo('elina'), 'elina never became the sister in play (stand-in -> control)');
  t(Math.hypot(S.x - P0[0], S.z - P0[1]) < 1.0, 'control did not move to her place: ' + Math.hypot(S.x - P0[0], S.z - P0[1]).toFixed(2)); t(B.camera.position.distanceTo(cam1) > 20, 'the camera did not follow the control');
  t(!sis.ents.elina, 'her stand-in is still there'); t(Object.keys(sis.st.places).sort().join() === 'aylar,elika', 'places after: ' + Object.keys(sis.st.places));
  for (let i = 0; i < 3; i++) await raf(); out.heroes3 = heroMeshes().map((x) => x.w + (x.vis ? 'v' : '-')); t(S.models && Object.keys(S.models).join() === 'elina', 'S.models ' + Object.keys(S.models));
  // ---- 4. solid bodies: aylar's place is moved to open ground (the first of a few candidate spots round the gate where a full-stick run [5.5 m/s] from 4 m away reaches her); she is never closer than disc + body (0.4 + 0.56 = 0.96 m) and does get that close (sliding round the disc is the right behaviour)
  let dSolid = null, tried = [];
  for (let i = 0; i < 40 && dSolid === null; i++) {
    const ang = i * 2.4, rad = 12 + (i % 7) * 7, cx = P0[0] + Math.sin(ang) * rad, cz = P0[1] + Math.cos(ang) * rad; sis.st.places.aylar = [cx, cz, 0]; sis.setStand(false); sis.setStand(true);   // (OFF -> ON: the stand-ins are made again from the places and the collision list is rebuilt)
    rp.setPos(cx + 4, cz, 0); await sl(100); S.fixed = 1 / 30; rp.setLook(Math.atan2(cx - S.x, cz - S.z), 0.1); rp.setInput(0, 1);
    let mn = 1e9; for (let j = 0; j < 60; j++) { rp.frame(performance.now(), 1 / 30); mn = Math.min(mn, Math.hypot(S.x - cx, S.z - cz)); } rp.setInput(0, 0); S.fixed = 0; tried.push(+mn.toFixed(2)); if (mn < 1.2) dSolid = mn;
  }
  out.dSolid = dSolid === null ? tried.slice(0, 12) : +dSolid.toFixed(2); t(dSolid !== null && dSolid > 0.9 && dSolid < 1.1, 'solid: closest approach ' + JSON.stringify(out.dSolid));
  // ---- 5. «bring her here»: hold aylar's card
  const c = card('aylar'); c.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 22 })); await sl(800); c.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 22 })); await sl(300);
  const b = sis.st.places.aylar; const dB = Math.hypot(b[0] - S.x, b[1] - S.z); t(dB > 1.4 && dB < 2.6, 'bring: she is ' + dB.toFixed(2) + ' from me'); t(S.key === 'elina', 'a hold switched the control'); t(Math.hypot(sis.ents.aylar.x - b[0], sis.ents.aylar.z - b[1]) < 0.01, 'her stand-in did not move');
  // ---- 6. persistence + start at the place: leave hero mode, enter as aylar: she begins where she was left (not at the gate); elina and elika stand
  const saved = JSON.parse(localStorage.getItem('bw_rs_v1')); h.exit(); await sl(300); const sv2 = JSON.parse(localStorage.getItem('bw_rs_v1')); t(Object.keys(sv2.p).sort().join() === 'aylar,elika,elina', 'saved at exit: ' + Object.keys(sv2.p)); t(!document.querySelector('.rs-wrap') && !heroMeshes().length, 'fan / stand-ins left behind after exit');
  const mx = mem(); out.memExit = mx; const want = sv2.p.aylar; await h.start('aylar'); await sl(800); t(Math.hypot(S.x - want[0], S.z - want[1]) < 1.0, 'did not start at her place: ' + Math.hypot(S.x - want[0], S.z - want[1]).toFixed(1));
  await until(() => Object.values(sis.ents).some((e) => e.m), 60000); await sl(500); out.ents6 = sis.info().ents;
  // ---- 7. LOD: the others are near (<= 70 m): resident; go 300 m away: freed; come back: loaded again
  t(Object.values(sis.ents).filter((e) => e.m).length >= 1, 'no stand-in resident near them'); const near = mem();
  rp.setPos(far[0] + 300, far[1], 0); await sl(600); for (let i = 0; i < 3; i++) await raf(); const resFar = Object.values(sis.ents).filter((e) => e.m || e.load).length; t(resFar === 0, 'stand-ins still resident 300 m away: ' + resFar); const farMem = mem(); out.mem = { base: m0, near, far: farMem };
  rp.setPos(want[0] + 5, want[1], 0); await until(() => Object.values(sis.ents).some((e) => e.m), 60000); t(Object.values(sis.ents).some((e) => e.m), 'they did not load again on return');
  // ---- 8. the cap: five others standing near the sister in play: at most 2 are resident (phone); budget with 0 / 1 / 2 in view
  await sl(500);
  const ring = ['elina', 'elika', 'melika', 'mobina', 'aylin'], sp = [S.x, S.z]; const fx = Math.sin(S.camYaw), fz = Math.cos(S.camYaw), rx = -Math.cos(S.camYaw), rz = Math.sin(S.camYaw);
  S.paused = false; rp.setPos(sp[0], sp[1], S.camYaw);
  // (clear the view first: no stand-ins -> baseline numbers of THIS spot)
  sis.setStand(false); await sl(300); for (let i = 0; i < 4; i++) await raf(); const f_none = frame(); await raf(); const f_none2 = frame(); out.f_none = [f_none, f_none2];
  sis.setStand(true); ring.forEach((k, i) => { sis.st.places[k] = [sp[0] + fx * (7 + i * 2.2) + rx * (i % 2 ? 2 : -2), sp[1] + fz * (7 + i * 2.2) + rz * (i % 2 ? 2 : -2), S.body + 3.14]; sis.ents[k] = null; delete sis.ents[k]; });
  for (const k of Object.keys(sis.st.places)) if (k !== S.key) sis.ents[k] = (function mk(k) { return { key: k, m: null, load: null, x: sis.st.places[k][0], z: sis.st.places[k][1], y: 0, yaw: sis.st.places[k][2], vis: false, acc: 0, ph: 0.3 }; })(k);
  await until(() => Object.values(sis.ents).filter((e) => e.m).length >= 2, 90000); await sl(1500); for (let i = 0; i < 4; i++) await raf();
  const res = Object.values(sis.ents).filter((e) => e.m).length, vis = Object.values(sis.ents).filter((e) => e.m && e.vis).length; out.cap = { res, vis, mx: sis.st.mx, loading: Object.values(sis.ents).filter((e) => e.load).length }; t(res <= 2, 'resident stand-ins ' + res + ' > 2 on a phone');
  const count = () => { const sm = R.shadowMap, s0 = [sm.autoUpdate, sm.needsUpdate]; sm.autoUpdate = false; sm.needsUpdate = false; const ar = R.info.autoReset; R.info.autoReset = false; R.info.reset(); R.render(B.scene, B.camera); const o = { calls: R.info.render.calls, tris: R.info.render.triangles }; sm.autoUpdate = s0[0]; sm.needsUpdate = s0[1]; R.info.autoReset = ar; return o; };
  const resid = Object.values(sis.ents).filter((e) => e.m), was = resid.map((e) => e.m.grp.visible); const bud = {};
  resid.forEach((e) => { e.m.grp.visible = false; }); bud.none = count();
  resid.forEach((e, i) => { e.m.grp.visible = i === 0 && was[0]; }); bud.one = count();
  resid.forEach((e, i) => { e.m.grp.visible = was[i]; }); bud.all = count(); out.budget = { ...bud, visible: vis, perSister: { calls: +((bud.all.calls - bud.none.calls) / Math.max(1, vis)).toFixed(1), tris: Math.round((bud.all.tris - bud.none.tris) / Math.max(1, vis)) } };
  const gpu = (() => { let mb = 0; B.scene.traverse((o) => { if (o.isSkinnedMesh && o.userData.rpHero) { const m = Array.isArray(o.material) ? o.material[0] : o.material; const im = m && m.map && m.map.image; if (im) mb += im.width * im.height * 4 * 1.333 / 1048576; } }); return +mb.toFixed(1); })(); out.gpuHeroTexMB = gpu;
  // ---- 9b. no leak: at ONE spot, take four sisters in turn (each becomes a stand-in) and switch the setting OFF.  The renderer's own counters include the WORLD's first renders (a mesh the moved camera newly reveals adds a geometry: seen +1..+4 in a cycle, and a control with nothing happening adds one too), so the proof is made on what THIS feature creates: every geometry / texture that the renderer registered (hook on the 'dispose' listener it adds at first render) during a cycle and is still alive after OFF while NOT referenced by anything in the scene = an orphan; there must be none.  Counters are still recorded (out.leak) and bounded.
  sis.setStand(false); await sl(300); for (let i = 0; i < 3; i++) await raf(); rp.setPos(far[0] - 6, far[1] + 6, 0.3); await sl(300); for (let i = 0; i < 3; i++) await raf(); out.leak = [];
  let gProto = null, tProto = null; B.scene.traverse((o) => { if (!gProto && o.geometry) gProto = o.geometry; if (!tProto && o.material) { const m = Array.isArray(o.material) ? o.material[0] : o.material; if (m && m.map) tProto = m.map; } });
  const upTo = (o, own) => { while (o && !Object.prototype.hasOwnProperty.call(o, own)) o = Object.getPrototypeOf(o); return o; };
  gProto = upTo(Object.getPrototypeOf(gProto), 'computeVertexNormals'); tProto = upTo(Object.getPrototypeOf(tProto), 'updateMatrix'); t(gProto && tProto, 'leak: no prototypes to hook');
  const aliveG = new Map(), aliveT = new Map(), origG = gProto.addEventListener, origT = tProto.addEventListener; let hooked = true;
  const hookOf = (alive, orig) => function (type, fn, ...r) { if (hooked && type === 'dispose' && !alive.has(this)) { alive.set(this, 1); orig.call(this, 'dispose', () => alive.delete(this)); } return orig.call(this, type, fn, ...r); };
  gProto.addEventListener = hookOf(aliveG, origG); tProto.addEventListener = hookOf(aliveT, origT);
  const inSceneSets = () => { const gs = new Set(), ts = new Set(); B.scene.traverse((o) => { if (o.geometry) gs.add(o.geometry); if (o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) { for (const k in m) { const v = m[k]; if (v && v.isTexture) ts.add(v); } if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k] && m.uniforms[k].value; if (v && v.isTexture) ts.add(v); } } }); if (B.scene.background && B.scene.background.isTexture) ts.add(B.scene.background); if (B.scene.environment) ts.add(B.scene.environment); return [gs, ts]; };
  out.orphans = [];
  for (let cyc = 0; cyc < 3; cyc++) {
    const L0 = mem(), g0 = new Set(aliveG.keys()), t0 = new Set(aliveT.keys()); sis.setStand(true);
    for (const k of ['aylar', 'aylin', 'melika', 'mobina', 'elika', 'elina']) { if (S.key === k) continue; if (k === 'elika' || k === 'elina') continue; t(await swapTo(k), 'cycle ' + cyc + ': ' + k); }
    for (let i = 0; i < 3; i++) await raf(); const L1 = mem(); const nSt = Object.values(sis.ents).filter((e) => e.m).length; sis.setStand(false); await sl(300); for (let i = 0; i < 3; i++) await raf(); const L2 = mem(); out.leak.push({ before: L0, withStandins: L1, resident: nSt, after: L2 });
    const [gs, ts] = inSceneSets(); const og = [...aliveG.keys()].filter((g) => !g0.has(g) && !gs.has(g)), ot = [...aliveT.keys()].filter((x) => !t0.has(x) && !ts.has(x) && ((x.image && x.image.width) || 0) >= 64);   // (>= 64 px: the world re-makes ONE 20 x 20 data texture it feeds a shader uniform with — found by rs1_leak2.js: registered inside setValue while drawing, a different one each cycle, the old one disposed, the counter constant — not a hero part; every hero texture is 1024 / 2048)
    out.orphans.push({ geo: og.map((g) => ({ n: g.attributes.position ? g.attributes.position.count : 0, skin: !!g.attributes.skinIndex })), tex: ot.map((x) => (x.image && x.image.width) || 0), tiny: [...aliveT.keys()].filter((x) => !t0.has(x) && !ts.has(x) && ((x.image && x.image.width) || 0) < 64).length });
    t(og.length === 0, 'leak: cycle ' + cyc + ' left ' + og.length + ' geometries alive outside the scene'); t(ot.length === 0, 'leak: cycle ' + cyc + ' left ' + ot.length + ' textures alive outside the scene');
    t(L2.tex <= L0.tex + 12 && L2.geo <= L0.geo + 12, 'leak (cycle ' + cyc + ' grew > 12): ' + JSON.stringify(L2) + ' vs ' + JSON.stringify(L0));
  }
  hooked = false; gProto.addEventListener = origG; tProto.addEventListener = origT;
  // (the textures come back exactly in the 2nd / 3rd cycle in every run seen; a real leak of a 2048 hero texture grows in EVERY cycle)
  t(out.leak.slice(1).some((c) => c.after.tex === c.before.tex), 'leak: no later cycle came back exact in textures: ' + JSON.stringify(out.leak.map((c) => [c.before.tex, c.after.tex])));
  // ---- 10. the toggle OFF (tapped): everything is removed again; the memory counters come back to where they were with nothing standing
  sis.setStand(true); for (const k of ['elika']) if (!sis.st.places[k]) sis.st.places[k] = [S.x + 3, S.z, 0]; await sl(200); t(sis.st.stand, 'ON again before the last step'); tap(document.querySelector('.rs-t')); await sl(400); t(sis.st.stand === false && Object.keys(sis.ents).length === 0 && sis.discs().length === 0, 'OFF left stand-ins / discs'); for (let i = 0; i < 3; i++) await raf(); t(heroMeshes().length === 1, 'OFF: hero meshes ' + heroMeshes().length);
  const mEnd = mem(); out.memEnd = mEnd; /* (the far trips / the spots above show the world's own first uploads: the leak proof is 9b) */
  // ---- 9. underworld: the strip is gone and a tap does nothing; stand-ins are not drawn there
  await rp.goUnder(); await until(() => S.where === 'under', 120000); await until(() => getComputedStyle(document.querySelector('.rs-wrap')).display === 'none', 120000); const fanHidden = getComputedStyle(document.querySelector('.rs-wrap')).display === 'none'; t(fanHidden, 'fan still shown in the underworld'); const kU = S.key; tap(card(kU === 'aylar' ? 'elika' : 'aylar')); await sl(1500); t(S.key === kU, 'switched in the underworld'); t(sis.canSwitch() === false, 'canSwitch true below');
  await rp.goHome(); await until(() => S.where === 'home', 120000); await until(() => getComputedStyle(document.querySelector('.rs-wrap')).display !== 'none', 120000); t(getComputedStyle(document.querySelector('.rs-wrap')).display !== 'none', 'fan not back at home');
  out.fails = F; out.ok = F.length === 0; return JSON.stringify(out);
})()
