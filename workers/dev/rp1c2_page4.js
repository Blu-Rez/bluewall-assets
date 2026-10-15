// rp1c2_page4.js — RP1C-R2 Job 1 in the REAL game: in the underworld the governor (driven here with a fake 20 fps clock, the rig's own frames are far too slow to count as frames) calls the real S.under.setQuality(step) and S.cmb.setQuality(step) 0..3; back at 60 fps -> 0.
(async () => {
  const rp = window.__rp, S = rp.S, out = { fail: [] }, wait = (ms) => new Promise((r) => setTimeout(r, ms)), D = rp.diet();
  rp.pause(true); S.cool = 99;
  if (S.where !== 'under') { await rp.goUnder(); for (let i = 0; i < 150 && S.where !== 'under'; i++) await wait(100); }
  out.where = S.where; if (S.where !== 'under') { out.fail.push('not in the underworld'); return JSON.stringify(out); }
  const su = S.under, sc = S.cmb; out.has = { under: !!su && typeof su.setQuality, cmb: !!sc && typeof sc.setQuality };
  const rec = { u: [], c: [] }, ou = su.setQuality, oc = sc.setQuality; su.setQuality = function (q) { rec.u.push(q); return ou.apply(this, arguments); }; sc.setQuality = function (q) { rec.c.push(q); return oc.apply(this, arguments); };
  const lv0 = D.st.lvl, feed = (t0, sec, ms, paused = false) => { let t = t0; const end = t0 + sec * 1000; while (t < end) { t += ms; D.tick(t, paused); } return t; };
  let t = performance.now() + 1e6; D.syncQ(); out.syncQ = { u: rec.u.slice(), c: rec.c.slice(), lvl: D.st.lvl };
  t = feed(t + 1000, 200, 1000 / 60); out.reset = { lvl: D.st.lvl };                                          // (the rig's own slow frames had already pushed the governor to the last level: first back to 0 at 60 fps)
  rec.u.length = rec.c.length = 0; t = feed(t + 1000, 40, 50);                                               // 40 s at 20 fps in the underworld
  out.down = { lvl: D.st.lvl, u: [...new Set(rec.u)].join(','), c: [...new Set(rec.c)].join(','), nU: rec.u.length, nC: rec.c.length, same: JSON.stringify(rec.u) === JSON.stringify(rec.c) };
  if (!(out.down.u === '0,1,2,3' || out.down.u === '1,2,3' || out.down.u.endsWith('3')) || !out.down.same) out.fail.push('steps down: ' + JSON.stringify(out.down));
  out.q = { under: su.quality != null ? su.quality : (su.q != null ? su.q : null), cmb: sc.quality != null ? sc.quality : (sc.q != null ? sc.q : null) };
  rec.u.length = rec.c.length = 0; t = feed(t + 1000, 200, 1000 / 60);                                       // then 60 fps: back up
  out.up = { lvl: D.st.lvl, last: rec.u.at(-1), lastC: rec.c.at(-1), nU: rec.u.length };
  if (D.st.lvl !== 0 || rec.u.at(-1) !== 0 || rec.c.at(-1) !== 0) out.fail.push('did not climb back to step 0: ' + JSON.stringify(out.up));
  su.setQuality = ou; sc.setQuality = oc; rp.pause(false); out.ok = out.fail.length === 0; return JSON.stringify(out);
})()
