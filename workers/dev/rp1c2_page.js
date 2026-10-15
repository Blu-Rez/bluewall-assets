// rp1c2_page.js — RP1C-R2 Job 0, the in-game face-rule proof.  Evaluated INSIDE the real game page (hero already started: __rp = hero.dev); returns a JSON string.
//   per scripted scenario it records, in EVERY simulated frame (update + placeCamera), the angle between her forward vector (the model's +Z in the world) and the camera's forward vector,
//   measured on the real Object3D / camera (dev.faceInfo) — and after the drag stops, the SETTLED angle.   Limits: every frame <= 75° (R1), settled < 35° (R2); first person excluded.
//   Scenarios A..I run on the home map; J (combat: attack / block / lock / dodge with enemies BEHIND the camera) and K (underworld spawn, exit, enter) are in rp1c2_page2.js.
(async () => {
  const rp = window.__rp, S = rp.S, out = { v: 1, sc: {}, fail: [] }, DEG = 180 / Math.PI, F = 1 / 30;
  const rec = { n: 0, max: 0, at: null, st: {} };
  S.tap = () => { const f = rp.faceInfo(); rec.n++; if (f.deg > rec.max) { rec.max = f.deg; rec.at = { st: f.st, bk: f.bk }; } rec.st[f.st] = (rec.st[f.st] || 0) + 1; };
  const reset = () => { rec.n = 0; rec.max = 0; rec.at = null; rec.st = {}; };
  const step = (n = 1, dt = F) => { for (let i = 0; i < n; i++) rp.sim(dt, dt); };
  const settle = (sec = 1.4) => { step(Math.round(sec / F)); return rp.faceInfo().deg; };
  const home = (x = 40.95, z = 21.975, yaw = -2.166) => { rp.cam('third'); rp.setPos(x, z, yaw); S.sprint = false; S.sw = 0; rp.setInput(0, 0); step(10); };
  const drag = (deg, sec, dt = F) => { const n = Math.max(1, Math.round(sec / dt)), d = deg / DEG / n; for (let i = 0; i < n; i++) { rp.look(d, 0); rp.sim(dt, dt); } };
  const done = (name, extra = {}) => { const settled = settle(); const r = { frames: rec.n, max: +rec.max.toFixed(1), settled: +settled.toFixed(1), worst: rec.at, states: Object.keys(rec.st).join(','), ...extra }; out.sc[name] = r; if (rec.max > 75) out.fail.push(name + ' max ' + r.max); if (settled >= 35) out.fail.push(name + ' settled ' + r.settled); return r; };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const closeSheet = async () => { const x = document.querySelector('.bsh.on .bsh-x'); if (x) x.click(); const f0 = __bw.frames; rp.pause(false); for (let i = 0; i < 480 && (S.sheetOn || document.querySelector('.bsh.on') || __bw.frames < f0 + 3); i++) await wait(250); rp.pause(true); };       // (sheetOn is reset by the REAL frame loop: give it a few frames)
  S.cool = 99; rp.pause(true); if (S.sheetOn || document.querySelector('.bsh.on')) await closeSheet();

  // A. idle: 360° of camera drag, slow and fast, both directions, a flick
  for (const [deg, sec, tag] of [[360, 2, 'A idle drag 180°/s'], [-360, 2, 'A idle drag -180°/s'], [360, 0.5, 'A idle drag 720°/s'], [-720, 0.5, 'A idle 2 turns in 0.5 s'], [180, 0.1, 'A idle flick 180° in 0.1 s']]) { home(); reset(); drag(deg, sec); done(tag); }

  // B. walk / run / sprint / strafe L+R / diagonals while the camera turns 360°
  const mv = { 'walk fwd': [0, 0.5, 0], 'run fwd': [0, 1, 0], 'sprint': [0, 1, 1], 'strafe L': [-1, 0.0001, 0], 'strafe R': [1, 0.0001, 0], 'diag FL': [-0.7, 0.7, 0], 'diag FR': [0.7, 0.7, 0], 'diag BL': [-0.7, -0.7, 0], 'diag BR': [0.7, -0.7, 0] };
  for (const k in mv) { home(); reset(); const [x, y, sp] = mv[k]; rp.setInput(x, y); S.sprint = !!sp; step(15); drag(360, 2.5); const mset = settle(1.4); rp.setInput(0, 0); S.sprint = false; const r = done('B ' + k + ' + drag 360°', { settledMoving: +mset.toFixed(1) }); if (mset >= 35) out.fail.push('B ' + k + ' settled while moving ' + mset.toFixed(1)); }

  // C. walk BACKWARDS (stick towards the camera): the camera still / turning — she never faces the camera and never slides
  home(); reset(); const p0 = rp.pos(); rp.setInput(0, -1); step(45); const p1 = rp.pos(), fi = rp.faceInfo(), toCam = Math.hypot(p1.x - p0.x, p1.z - p0.z); rp.setInput(0, 0);
  done('C walk backwards, camera still', { moved: +toCam.toFixed(2), bk: fi.bk, angAtEnd: fi.deg });
  home(); reset(); rp.setInput(0, -1); step(15); drag(360, 2.5); { const mset = settle(1.4); rp.setInput(0, 0); done('C walk backwards + drag 360°', { settledMoving: +mset.toFixed(1) }); if (mset >= 35) out.fail.push('C back settled while moving ' + mset.toFixed(1)); }

  // D. stick reversals every 0.2 s (R1: <= 75° in EVERY frame), with the camera still / dragged / sprinting
  for (const [tag, sp, dd] of [['D reversals 0.2 s, camera still', 0, 0], ['D reversals 0.2 s + drag 360°', 0, 360], ['D sprint reversals + drag 360°', 1, 360]]) {
    home(); reset(); S.sprint = !!sp; const n = Math.round(2.5 / F), d = dd / DEG / n; for (let i = 0; i < n; i++) { rp.setInput(0, Math.floor(i * F / 0.2) % 2 ? -1 : 1); rp.look(d, 0); rp.sim(F, F); } rp.setInput(0, 0); S.sprint = false; done(tag);
  }

  // E. jump (standing, running, with a drag) and dodge in 8 directions + no stick (back-step), each with the camera turning
  home(); reset(); rp.jump(); drag(180, 0.9); done('E jump + drag 180°');
  home(); reset(); rp.setInput(0, 1); step(10); rp.jump(); drag(270, 1.2); { const mset = settle(1.4); rp.setInput(0, 0); done('E running jump + drag 270°', { settledMoving: +mset.toFixed(1) }); if (mset >= 35) out.fail.push('E running jump settled while moving ' + mset.toFixed(1)); }
  for (let a = 0; a < 8; a++) { home(); reset(); rp.setInput(Math.sin(a * Math.PI / 4), Math.cos(a * Math.PI / 4)); step(6); rp.dodge(); drag(a % 2 ? 200 : -200, 0.8); rp.setInput(0, 0); done('E dodge dir ' + a * 45 + '° + drag'); }
  home(); reset(); rp.dodge(); drag(150, 0.8); done('E dodge, no stick (back-step) + drag');

  // F. swim: find deep water near the keep, push her in, drag the camera
  try { const w = rp.W(); let found = null; for (let r = 4; r < 300 && !found; r += 4) for (let a = 0; a < 6.28 && !found; a += 0.4) { const x = 40.95 + Math.cos(a) * r, z = 21.975 + Math.sin(a) * r; if (w.ground(x, z) < -1.6) found = [x, z]; }
    if (found) { home(found[0], found[1], 0); reset(); rp.setInput(0, 1); step(20); const sw = rp.pos(); drag(360, 2.5); rp.setInput(0, 0); const mset = settle(1.4); done('F swim + drag 360°', { swimming: S.sw, depthAt: +rp.W().ground(S.x, S.z).toFixed(2), settledMoving: +mset.toFixed(1), at: found.map((v) => Math.round(v)) }); } else out.sc['F swim'] = { skipped: 'no deep water found within 300 m' }; } catch (e) { out.sc['F swim'] = { err: String(e).slice(0, 160) }; }

  // G. tap a door orb from 13 m: she walks there herself (the camera swings behind her), the sheet opens on arrival; the camera is dragged 70° on the way
  try {
    const D = rp.doors(), it = D.items().find((i) => i.id === 'home:cottage_10') || D.items()[0], yw = Math.atan2(it.fx - it.gx, it.fz - it.gz);
    home(it.gx - Math.sin(yw) * 13, it.gz - Math.cos(yw) * 13, yw); rp.setLook(yw, 0.25); step(15);
    { const f0 = __bw.frames; rp.pause(false); for (let i = 0; i < 480 && __bw.frames < f0 + 3; i++) await wait(250); } rp.pause(true); step(3); reset();                          // (real frames let the door module place its orbs; the hero stands still)
    const [sx, sy] = rp.proj(it.x, it.y, it.z); rp.pause(false); const ok = rp.tapDoor(sx, sy); let t = 0, steps = 0;                          // (auto-walk is cancelled while the dev pause is on: the loop below is synchronous, so no real frame interleaves)
    while (!S.sheetOn && steps < 1800 && rp.autoState()) { if (steps === 25) rp.look(1.2, 0); rp.sim(F, F); steps++; t += F; }
    const opened = S.sheetOn; rp.pause(true); const r = done('G door auto-walk + drag 70°', { tapped: ok, opened, walked: +t.toFixed(1), screen: [Math.round(sx), Math.round(sy)] });
    if (!ok || !opened) out.fail.push('G tap did not start / finish the walk');
    await closeSheet(); out.sc['G door auto-walk + drag 70°'].sheetClosed = !S.sheetOn;
  } catch (e) { out.sc['G door auto-walk'] = { err: String(e).slice(0, 200) }; out.fail.push('G error ' + String(e).slice(0, 80)); }

  // H. interact: sheet open (she turns to the building), the camera is dragged while it is open, then it closes
  try {
    const D = rp.doors(), it = D.items().find((i) => i.id === 'home:cottage_10') || D.items()[0]; home(it.gx, it.gz, Math.atan2(it.fx - it.gx, it.fz - it.gz)); step(10); reset();
    rp.tickNear(); const opened = rp.useNear(); step(15); drag(180, 1.0); const r = done('H interact (sheet open) + drag 180°', { opened, sheetOn: rp.sheetOn() });
    await closeSheet(); out.sc['H interact (sheet open) + drag 180°'].sheetClosed = !S.sheetOn; if (S.sheetOn) out.fail.push('H the sheet did not close');
  } catch (e) { out.sc['H interact'] = { err: String(e).slice(0, 200) }; }

  S.tap = null; rp.setInput(0, 0); S.sprint = false; rp.pause(false);
  out.ok = out.fail.length === 0; out.n = Object.keys(out.sc).length;
  return JSON.stringify(out);
})()
