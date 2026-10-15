// rp1c2_page2.js — RP1C-R2 Job 0 (second half) + Job 1 probes: the face rule in the UNDERWORLD with the RP4 combat sim (attack / block / lock / dodge / skill with the enemies BEHIND the camera, while the camera is dragged),
//   the underworld spawn, exit and enter again.  Evaluated INSIDE the real game page with the hero already started (home scene).  Returns a JSON string.
//   Limits: every frame <= 75° between her forward vector and the camera's forward vector; after the camera stops, settled < 35°.
(async () => {
  const rp = window.__rp, S = rp.S, out = { v: 1, sc: {}, fail: [] }, DEG = 180 / Math.PI, F = 1 / 30;
  const rec = { n: 0, max: 0, at: null, st: {} }, wait = (ms) => new Promise((r) => setTimeout(r, ms));
  S.tap = () => { const f = rp.faceInfo(); rec.n++; if (f.deg > rec.max) { rec.max = f.deg; rec.at = { st: f.st, bk: f.bk }; } rec.st[f.st] = (rec.st[f.st] || 0) + 1; };
  const reset = () => { rec.n = 0; rec.max = 0; rec.at = null; rec.st = {}; };
  const step = (n = 1, dt = F) => { for (let i = 0; i < n; i++) rp.sim(dt, dt); };
  const settle = (sec = 1.6) => { step(Math.round(sec / F)); return rp.faceInfo().deg; };
  const drag = (deg, sec, dt = F) => { const n = Math.max(1, Math.round(sec / dt)), d = deg / DEG / n; for (let i = 0; i < n; i++) { rp.look(d, 0); rp.sim(dt, dt); } };
  const done = (name, extra = {}) => { const settled = settle(); const r = { frames: rec.n, max: +rec.max.toFixed(1), settled: +settled.toFixed(1), worst: rec.at, states: Object.keys(rec.st).join(','), ...extra }; out.sc[name] = r; if (rec.max > 75) out.fail.push(name + ' max ' + r.max); if (settled >= 35) out.fail.push(name + ' settled ' + r.settled); return r; };
  rp.pause(true); S.cool = 99;

  // J0. enter the underworld (spawn): she and the camera agree from the first frame
  reset(); await rp.goUnder(); for (let i = 0; i < 100 && S.where !== 'under'; i++) await wait(100); step(15);
  if (S.where !== 'under') { out.fail.push('could not enter the underworld'); out.ok = false; S.tap = null; return JSON.stringify(out); }
  S.cool = 99; done('J0 underworld spawn'); out.cmb = !!S.cmb;
  const cmb = S.cmb, hero = cmb && cmb.sim && cmb.sim.hero;
  if (cmb) {
    cmb.spawnTest(3); step(20);
    const behind = () => { rp.look(Math.PI, 0); step(25); };                                       // the enemies were spawned in front of her: turn the camera 180° so they are BEHIND the camera
    // J1. lock + attack with the target behind the camera, then a 3-hit combo while the camera is dragged
    reset(); behind(); cmb.press('lock'); step(10); cmb.press('attack'); step(12); cmb.press('attack'); step(12); cmb.press('attack'); drag(200, 1.2); done('J1 lock + combo (enemies behind the camera) + drag 200°', { hs: hero && hero.state });
    // J2. attack with the stick pushed backwards (towards the camera) and the camera dragged
    reset(); rp.setInput(0, -1); cmb.press('attack'); drag(-300, 1.5); rp.setInput(0, 0); done('J2 attack, stick back + drag -300°');
    // J3. block held, the camera turned 360° with the stick moving
    reset(); cmb.setBlock(true); rp.setInput(0.7, 0.7); drag(360, 2.5); rp.setInput(0, 0); cmb.setBlock(false); done('J3 block held + stick + drag 360°');
    // J4. dodge (roll) in a few directions with the camera moving, then with a lock
    for (const [ix, iy, tag] of [[0, 1, 'fwd'], [0, -1, 'back'], [1, 0, 'right'], [-0.7, -0.7, 'back-left'], [0, 0, 'no stick']]) { reset(); rp.setInput(ix, iy); step(4); cmb.press('dodge'); drag(tag === 'right' ? -220 : 220, 0.9); rp.setInput(0, 0); done('J4 dodge ' + tag + ' + drag'); }
    // J5. skills, each with a camera flick
    for (const sk of ['skill1', 'skill2']) { reset(); cmb.press(sk); drag(160, 1.0); done('J5 ' + sk + ' + drag 160°'); }
    // J6. free walking in the underworld with the camera dragged 360°, reversal every 0.2 s
    reset(); { const n = Math.round(3 / F), d = (360 / DEG) / n; for (let i = 0; i < n; i++) { rp.setInput(0, Math.floor(i * F / 0.2) % 2 ? -1 : 1); rp.look(d, 0); rp.sim(F, F); } rp.setInput(0, 0); } done('J6 underworld walk, reversals 0.2 s + drag 360°');
  }

  // K. exit to the home map and enter again: the arrival frames (both ways) are behind her too
  reset(); await rp.goHome(); for (let i = 0; i < 100 && S.where !== 'home'; i++) await wait(100); step(15); done('K1 back home (portal)', { where: S.where });
  reset(); await rp.goUnder(); for (let i = 0; i < 100 && S.where !== 'under'; i++) await wait(100); step(15); done('K2 underworld again', { where: S.where });

  S.tap = null; rp.setInput(0, 0); rp.pause(false);
  out.ok = out.fail.length === 0; out.n = Object.keys(out.sc).length;
  return JSON.stringify(out);
})()
