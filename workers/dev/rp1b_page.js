// rp1b_page.js — evaluated inside the game page by rp1b_page.py, AFTER the hero is started (window.__rp).  Returns JSON {checks:[{name,ok,info}], ...}.
// Everything here is the hero's own physics / colliders / sheets; nothing is mocked.
(async () => {
  const rp = __rp, S = rp.S, w = __bw.world, P = w.picks, checks = [], raf = () => new Promise((r) => requestAnimationFrame(r)), wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const chk = (name, ok, info) => checks.push({ name, ok: !!ok, info: info === undefined ? '' : info });
  const sp = [40.95, 21.97], WS = -0.75, fh = w.fastHeight, depth = (x, z) => Math.max(0, WS - fh(x, z)), gate0 = () => rp.setPos(sp[0], sp[1], 0);
  const box = (p) => { const b = p.box; return [(b.min.x + b.max.x) / 2, (b.min.z + b.max.z) / 2, Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / 2]; };
  const byId = (id) => P.find((p) => p.id === id);
  const nearFree = (x, z, r0 = 2.5, wantWet = false) => { for (let r = r0; r < 60; r += 0.5) for (let a = 0; a < 6.283; a += 0.2) { const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (!rp.free(px, pz)) continue;
    if (wantWet) { let ok = false; for (const [dx, dz] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) if (rp.W().wet(px + dx, pz + dz)) ok = true; if (!ok) continue; } return [px, pz]; } return null; };
  let camViol = 0;
  const go = (name, t, sec = 420) => { if (!t) { chk(name, false, 'no target'); return false; } const r = rp.walkTo(t[0], t[1], sec); camViol += r.cam || 0; chk(name, r.ok, r.ok ? r.t + ' s' : (r.why || 'not there') + ' at ' + Math.round(r.x) + ',' + Math.round(r.z)); return r.ok; };

  // ---------------------------------------------------------------- 1 the reach map (BFS from the gate over what the body can enter)
  gate0();
  const rw = rp.reachMap(2, { edge: 440, png: false, nb: 30 }), rs = rp.reachMap(2, { edge: 440, swim: true, png: false, nb: 30 });
  const OLD = 64.39, THRESH = 97;
  chk('reach on foot (wading allowed) above the old ' + OLD + ' % and above ' + THRESH + ' %', rw.reachPct > OLD && rw.reachPct >= THRESH, rw.reachPct + ' %');
  chk('reach with swimming above 98.5 %', rs.reachPct >= 98.5, rs.reachPct + ' %');
  const odd = rs.blobs.filter((b) => b.area > 1000);
  chk('no unreachable land blob over 1000 m2 left (swimming counted)', odd.length === 0, odd.map((b) => b.area + ' m2 at ' + b.x + ',' + b.z).join('; ') || (rs.blobs.length + ' small pockets, biggest ' + (rs.blobs[0] ? rs.blobs[0].area + ' m2' : '-')));

  // ---------------------------------------------------------------- 2 walk there with the real physics: outer mill, gem mine, hamlet, shore, bridges, gates
  gate0(); { const b = box(byId('ws:mill_wind2')); go('walk to the farthest outer mill (ws:mill_wind2)', nearFree(b[0], b[1], b[2] + 2)); }
  gate0(); { const b = box(byId('mine_ruby')); go('walk to a gem mine (mine_ruby)', nearFree(b[0], b[1], b[2] + 2)); }
  gate0(); { const hs = P.filter((p) => p.id === 'house').map(box).filter((b) => Math.hypot(b[0], b[1]) > 180).sort((a, b) => Math.hypot(a[0] - sp[0], a[1] - sp[1]) - Math.hypot(b[0] - sp[0], b[1] - sp[1])); const b = hs[0]; go('walk to the nearest hamlet house (r ' + Math.round(Math.hypot(b[0], b[1])) + ')', nearFree(b[0], b[1], b[2] + 2)); }
  gate0(); { const b = box(byId('ws:fishery_lake')); go('walk to the lake shore', nearFree(b[0], b[1], 2, true)); }
  const br = S.nav.bridges; let bi = 0, brOk = 0;
  for (const b of br) { const h = b.len / 2 + 7, A = nearFree(b.x - b.nx * h, b.z - b.nz * h, 0), B = nearFree(b.x + b.nx * h, b.z + b.nz * h, 0); if (!A || !B) continue;
    rp.setPos(A[0], A[1], 0); const a = rp.walkTo(B[0], B[1], 200); rp.setPos(B[0], B[1], 0); const c = rp.walkTo(A[0], A[1], 200); camViol += (a.cam || 0) + (c.cam || 0); if (a.ok && c.ok) brOk++; else chk('bridge #' + bi + ' (' + Math.round(b.x) + ',' + Math.round(b.z) + ') both ways', false, a.why || c.why); bi++; }
  chk('every bridge crossed both ways', brOk === br.length && br.length > 0, brOk + ' / ' + br.length);
  const gs = rp.gates(); let gi = 0, gOk = 0;
  for (let i = 0; i < gs.length; i += 2) { const a = gs[i], b = gs[i + 1], cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2, tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz), nx = -tz / tl, nz = tx / tl;
    const A = nearFree(cx + nx * 12, cz + nz * 12, 0), B = nearFree(cx - nx * 12, cz - nz * 12, 0); if (!A || !B) { gi++; continue; } rp.setPos(A[0], A[1], 0); const p = rp.walkTo(B[0], B[1], 200); rp.setPos(B[0], B[1], 0); const q = rp.walkTo(A[0], A[1], 200); camViol += (p.cam || 0) + (q.cam || 0); if (p.ok && q.ok) gOk++; else chk('gate #' + gi + ' (' + Math.round(cx) + ',' + Math.round(cz) + ') both ways', false, p.why || q.why); gi++; }
  chk('every gate passed both ways', gOk === gi && gi > 0, gOk + ' / ' + gi);
  gate0(); { const b = br[0], h = b.len / 2 + 14, A = nearFree(b.x + b.nx * h, b.z + b.nz * h, 0); const r1 = rp.walkTo(A[0], A[1], 200), r2 = rp.walkTo(sp[0], sp[1], 200); camViol += (r1.cam || 0) + (r2.cam || 0); chk('gate -> over the main bridge -> back to the gate', r1.ok && r2.ok, (r1.t + r2.t).toFixed(1) + ' s'); }
  chk('the camera was never inside a wall / building / the ground during those walks', camViol === 0, camViol + ' violating frames');

  // ---------------------------------------------------------------- 3 walls: climb up, walk on top, climb down on the other side (camera stays out of the stone)
  for (const [k, side] of [[0, 1], [1, -1]]) { const c = rp.climbTest(k, side); chk('wall #' + k + ': climbs up, walks the wall-walk and comes down (' + (c.hw ? 'len ' + Math.round(c.hw * 2) + ' m, h ' + c.h : '') + ')', c.top && c.walked && c.walked.leftTop === 0 && c.down === true && c.cam === 0, 'climb ' + c.tClimb + ' s, walked u ' + (c.walked ? c.walked.u.join('..') : '-') + ', camera violations ' + c.cam); }

  // ---------------------------------------------------------------- 4 water: wade the shallows, swim the deep, haul out onto the far shore
  const lake = (() => { let best = null; for (let x = -220; x <= -60; x += 4) for (let z = 220; z <= 380; z += 4) { const d = depth(x, z); if (d > 1.4 && (!best || d > best.d)) best = { x, z, d }; } return best; })();
  chk('a deep lake exists to test in', !!lake, lake ? 'depth ' + lake.d.toFixed(2) + ' m at ' + Math.round(lake.x) + ',' + Math.round(lake.z) : '');
  if (lake) {
    rp.setPos(lake.x, lake.z, 0); S.y = WS - 0.2; S.grounded = true; S.inp.y = 0; rp.sim(2.5);
    chk('standing in deep water = swimming (state 2), camera above the surface', S.sw === 2 && rp.camCheck().length === 0, 'sw ' + S.sw + ', y ' + S.y.toFixed(2));
    S.camYaw = 0; S.inp.y = 1; rp.sim(3); const v = Math.hypot(S.vx, S.vz); chk('swimming forward at a swimmer\'s pace (1.2..2.6 m/s), body leaning', S.sw === 2 && v > 1.2 && v < 2.6 && S.lean > 0.5, v.toFixed(2) + ' m/s, lean ' + S.lean.toFixed(2)); S.inp.y = 0;
    S.reqJump = true; rp.sim(0.3); chk('no jump in deep water', S.grounded === true && S.sw === 2, 'st ' + S.st);
    let wc = null; for (let x = -220; x <= -60 && !wc; x += 1) for (let z = 220; z <= 380; z += 1) { const d = depth(x, z); if (d > 0.4 && d < 0.6 && rp.free(x, z)) { wc = { x, z, d }; break; } }
    gate0(); S.camYaw = 0; S.inp.y = 1; rp.sim(1.5); const vd = Math.hypot(S.vx, S.vz); S.inp.y = 0;
    if (wc) { rp.setPos(wc.x, wc.z, 0); S.camYaw = 0; S.inp.y = 1; rp.sim(0.5); const vw = Math.hypot(S.vx, S.vz); chk('wading a ' + wc.d.toFixed(2) + ' m shallow: state 1, slower than dry land', S.sw === 1 && vw < vd, 'wade ' + vw.toFixed(2) + ' vs dry ' + vd.toFixed(2) + ' m/s'); S.inp.y = 0; } else chk('a 0.4..0.6 m shallow exists to test in', false);
    const ring = (cx, cz, r0, r1) => { const pts = []; for (let a = 0; a < 6.283; a += 0.1) for (let r = r0; r < r1; r += 1) { const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; if (depth(x, z) === 0 && rp.free(x, z) && rp.free(x + 1, z) && rp.free(x - 1, z) && rp.free(x, z + 1) && rp.free(x, z - 1)) { pts.push({ x, z }); break; } } return pts; };
    const sh = ring(lake.x, lake.z, 4, 90); let A = sh[0], B = sh[0], bd = 0; for (const p of sh) for (const q of sh) { const d = Math.hypot(p.x - q.x, p.z - q.z); if (d > bd && Math.hypot(p.x - lake.x, p.z - lake.z) < 60 && Math.hypot(q.x - lake.x, q.z - lake.z) < 60) { bd = d; A = p; B = q; } }
    rp.setPos(A.x, A.z, 0); const sw = rp.walkTo(B.x, B.z, 300, { swim: true }); camViol += sw.cam || 0; let swam = S.sw === 2;
    { let t = 0; while (t < 10 && S.sw !== 0) { S.camYaw = Math.atan2(B.x - S.x, B.z - S.z); S.inp.y = 0.8; rp.sim(1 / 30, 1 / 30); t += 1 / 30; } S.inp.y = 0; }
    chk('swims across the lake (' + Math.round(bd) + ' m, ' + (swam ? 'still swimming at the end of the path' : 'out of the deep water') + ') and ends standing on the far shore', sw.ok && S.sw === 0 && Math.hypot(S.x - B.x, S.z - B.z) < 6 && rp.camCheck().length === 0, (sw.ok ? sw.t + ' s' : (sw.why || '') + ' at ' + Math.round(sw.x) + ',' + Math.round(sw.z)) + ', end state ' + S.sw + ', ' + Math.hypot(S.x - B.x, S.z - B.z).toFixed(1) + ' m from the landing');
  }

  // ---------------------------------------------------------------- 5 buildings used by walking: a button for every building / worksite / lot with a sheet; none where there is none
  const items = rp.doorItems(), dt = rp.doorTest(), bad = dt.filter((x) => !x.ok);
  const kinds = new Set(items.map((i) => i.id.replace(/[0-9_]+$/, '').replace(/^(ws|home|civic):/, '$1:').replace(/:[a-z]+_.*$/, ':*')));
  chk('every building / worksite / lot with a sheet yields a button id 1.5 m from its face', items.length >= 100 && bad.length === 0, dt.length + ' tested, ' + bad.length + ' failing' + (bad.length ? ': ' + bad.slice(0, 6).map((x) => x.id + ' (' + (x.why || x.got) + ')').join(', ') : ''));
  chk('where it is not the building itself it is a neighbouring sheet at most 1.6 m away (town lots side by side)', dt.filter((x) => x.got !== x.id).every((x) => x.d <= 1.6), dt.filter((x) => x.got === x.id).length + ' of ' + dt.length + ' name the building itself, the rest a neighbour');
  chk('many kinds covered', kinds.size >= 10, kinds.size + ' kinds');
  { let spot = null; for (let r = 90; r < 330 && !spot; r += 6) for (let a = 0; a < 6.283 && !spot; a += 0.3) { const x = Math.cos(a) * r, z = Math.sin(a) * r; if (!rp.free(x, z)) continue; if (items.every((i) => Math.hypot(i.cx - x, i.cz - z) > Math.max(i.hx, i.hz) + 12)) spot = [x, z]; }
    if (spot) { rp.setPos(spot[0], spot[1], 0); rp.sim(0.2); chk('no building within reach -> no button', rp.nearNow() === null, Math.round(spot[0]) + ',' + Math.round(spot[1])); } else chk('an empty spot exists to test in', false); }
  { const ws = rp.wallSpot(0, 1, 1.2, 0); if (ws) { rp.setPos(ws.x, ws.z, ws.yaw); rp.sim(0.2); const n = rp.nearNow(); chk('a wall has no panel -> no button at its foot', !n || !/^(wall|gate|tower)/.test(n.id), n ? n.id : 'none'); } }
  // the same sheet as the strategic view: open it by the button, it is on, joystick is hidden, close it, walking again
  { const it = items.find((i) => i.id === 'barracks') || items[0]; rp.goNear(it.id); rp.sim(0.2); const n = rp.tickNear(); chk('at the door of ' + it.id + ' the button names it', !!n && n.id === it.id, n && n.id);
    rp.useNear(); for (let i = 0; i < 3; i++) await raf(); await wait(400);
    const open = !!document.querySelector('.bsh.on'), cls = document.documentElement.classList.contains('rp-sheet') || !!document.querySelector('.rp-sheet');
    chk('the button opens the sheet (the same T1 sheet), walking controls hidden while it is open', rp.sheetOn() === true && open, 'sheetOn ' + rp.sheetOn() + ', .bsh.on ' + open + ', rp-sheet class ' + cls);
    const x = document.querySelector('.bsh.on .bsh-x'); if (x) x.click(); for (let i = 0; i < 3; i++) await raf(); await wait(400);
    chk('closing the sheet returns to walking', rp.sheetOn() === false && !document.querySelector('.bsh.on'), 'sheetOn ' + rp.sheetOn());
    S.camYaw = 0; const x0 = S.x, z0 = S.z; S.inp.y = 1; rp.sim(1.0); S.inp.y = 0; chk('and she walks again', Math.hypot(S.x - x0, S.z - z0) > 1, Math.hypot(S.x - x0, S.z - z0).toFixed(1) + ' m in 1 s'); }

  // ---------------------------------------------------------------- 6 the diet is really thinning the picture
  { gate0(); const d = rp.diet(); d.st.candAt = -1e9; d.pass(performance.now() + 1e6); chk('the diet hides far life / far heavy packs at the gate', d.st.nHid + d.st.nHidS > 0, d.st.nHid + ' packs + ' + d.st.nHidS + ' figures hidden'); }
  gate0();
  return JSON.stringify({ checks, progs: (__bw.renderer.info.programs || []).length });
})()
