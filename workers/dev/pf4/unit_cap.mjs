// pf4/unit_cap.mjs — node unit test of PF4 (logic only, no GPU, no phone).  Needs the bundles built by dev/pf4_test.sh: perf_old.mjs (perf.js before PF4), perf_new.mjs (now), diet.mjs (rpg_diet.js).
//  A. the adaptive frame cap (perf.js createCap) against a simulated 60 Hz / 120 Hz display and a phone whose frames cost c ms (JS part = 0.8 c): time share at each level, level changes
//  B. the hero governor (rpg_diet.js govFrame) on frames that are capped at 30 fps: how often does it step the picture DOWN with nothing wrong (old thresholds vs. the cap-aware ones)
import * as OLD from './b/perf_old.mjs'; import * as NEW from './b/perf_new.mjs'; import * as DIET from './b/diet.mjs';
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const gauss = (r) => Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r());
// one run: a display with vsync every rf ms; a frame draws when the main thread is free AND the cap's gap has passed; it costs c ms (+ hitches); the cap sees (real, js, rf, now)
function sim(create, { rf = 1000 / 60, mu = 14, sd = 2, jsFrac = 0.8, secs = 300, hitch = () => 0, extra = () => 0, off = false, seed = 7 }) {
  const C = create(off), r = rng(seed); let last = -1, busy = 0, frames = 0; const share = [0, 0, 0]; let changes = 0, lv = 0, first = -1;
  for (let v = 0; v * rf < secs * 1000; v++) {
    const now = v * rf; if (now < busy) continue; if (last >= 0 && now - last < C.gap()) continue;
    const c = Math.max(3, mu + extra(now) + sd * gauss(r)), real = last < 0 ? rf : now - last; last = now; frames++;
    busy = now + c + hitch(now);
    C.frame(real, jsFrac * c, rf, now, false);
    if (C.lvl !== lv) { changes++; lv = C.lvl; if (lv === 0 && first < 0) first = now / 1000; }
    share[C.lvl] += real;
  }
  const tot = share[0] + share[1] + share[2];
  return { fps: +(frames / secs).toFixed(1), l0: +(share[0] / tot).toFixed(2), l1: +(share[1] / tot).toFixed(2), l2: +(share[2] / tot).toFixed(2), changes, firstL0: first, C };
}
// calibrate mu so that the UNCAPPED phone does 55 fps on a 60 Hz screen (what the owner's «MAP UNCAPPED» row says)
let lo = 8, hi = 30; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2, s = sim(OLD.createCap, { mu: m, off: true, secs: 120 }); if (s.fps > 55) lo = m; else hi = m; }
const MU55 = +((lo + hi) / 2).toFixed(2); console.log('calibration: mu =', MU55, 'ms per frame -> uncapped', sim(OLD.createCap, { mu: MU55, off: true, secs: 120 }).fps, 'fps');
const boot = (now) => (now < 20000 ? 7 : 0);                                      // the first 20 s: a few hitchy windows (boot, shader links) push the window average over 20 ms
const slices = (now) => (now < 100000 && Math.floor(now / 250) !== Math.floor((now - 17) / 250) ? 70 : 0);   // the EAGER idle compile: a 70 ms slice every 250 ms for 100 s (a stand-in: a slice is 60..300 ms on a phone)
const S = {
  'S1 phone 55 fps uncapped, JS 13 ms, boot hitches': { mu: MU55, extra: boot, jsFrac: 0.95 },
  'S2 same + idle compile slices (100 s)': { mu: MU55, extra: boot, hitch: slices, jsFrac: 0.95 },
  'S3 heavy: 38 fps uncapped': { mu: 26, sd: 4 },
  'S4 light: 60 fps, JS 6 ms': { mu: 9, jsFrac: 0.65 },
  'S5 borderline 52 fps': { mu: MU55 + 1.2, jsFrac: 0.8 },
  'S6 120 Hz screen, cost 14 ms': { rf: 1000 / 120, mu: 14 },
};
const out = {};
for (const [k, o] of Object.entries(S)) { const a = sim(OLD.createCap, o), b = sim(NEW.createCap, o); out[k] = [a, b]; console.log(k.padEnd(40), 'OLD fps', String(a.fps).padStart(5), 'L0/L1/L2', a.l0, a.l1, a.l2, 'changes', a.changes, '| NEW fps', String(b.fps).padStart(5), 'L0/L1/L2', b.l0, b.l1, b.l2, 'changes', b.changes, 'first L0 at', b.firstL0 < 0 ? '-' : b.firstL0.toFixed(0) + ' s'); }
ok(out['S1 phone 55 fps uncapped, JS 13 ms, boot hitches'][0].l0 < 0.2, 'A1 OLD cap: a 55 fps phone spends < 20 % of 5 min at 60 (the owner\'s «every row 30»)');
ok(out['S1 phone 55 fps uncapped, JS 13 ms, boot hitches'][1].l0 > 0.7 && out['S1 phone 55 fps uncapped, JS 13 ms, boot hitches'][1].fps > 50, 'A2 NEW cap: the same phone gets back to 60 (> 70 % of the time, > 50 fps)');
ok(out['S2 same + idle compile slices (100 s)'][1].l0 > 0.5, 'A3 NEW cap: with the idle compile slices running for 100 s it still climbs back (> 50 % at 60)');
// sensitivity: the old rule needs the JS time of a frame < 11.7 ms to EVER step back up; the new one < 15.3 ms (and then tries)
console.log('JS share of the 14 ms frame -> JS ms | share of 5 min at 60 fps: OLD / NEW');
const sens = {}; for (const jf of [0.6, 0.7, 0.8, 0.9, 1.0]) { const a = sim(OLD.createCap, { mu: MU55, extra: boot, jsFrac: jf }), b = sim(NEW.createCap, { mu: MU55, extra: boot, jsFrac: jf }); sens[jf] = [a, b]; console.log('  js = ' + (jf * MU55).toFixed(1) + ' ms  OLD', a.l0, ' NEW', b.l0); }
ok(sens[0.8][0].l0 > 0.5 && sens[0.9][0].l0 < 0.2 && sens[1.0][0].l0 < 0.2, 'A0 OLD rule: it climbs back only while the JS time of a frame is under 11.7 ms (js 11.2 ms: yes; js 12.6 / 14 ms: stuck at 30)');
ok(sens[0.9][1].l0 > 0.7 && sens[1.0][1].l0 > 0.7, 'A0b NEW rule: it also climbs at js 12.6 / 14 ms');
ok(out['S3 heavy: 38 fps uncapped'][1].l0 < 0.05 && out['S3 heavy: 38 fps uncapped'][1].changes <= 8, 'A4 NEW cap: a heavy phone stays at 30 and does not flap (<= 8 changes in 5 min)');
ok(out['S4 light: 60 fps, JS 6 ms'][1].l0 > 0.9, 'A5 NEW cap: a light scene runs at the top level');
ok(out['S5 borderline 52 fps'][1].changes <= 14, 'A6 NEW cap: the borderline phone flaps at most 14 times in 5 min (the doubled wait keeps probes rare)');
ok(out['S6 120 Hz screen, cost 14 ms'][1].fps >= 55, 'A7 NEW cap on a 120 Hz screen: >= 55 fps for a 14 ms frame');
// ---------- B: the hero governor at a 30 fps cap
const base = DIET.GOV_CFG;
function gov(cfgFor, { hz = 60, secs = 120, hitchEvery = 12000, seed = 3 }) {
  const g = DIET.govInit(1), r = rng(seed); let steps = 0, ups = 0, t = 0, nextHitch = hitchEvery; const rf = 1000 / hz; let k = 0, last = -1e9;
  for (let v = 0; v * rf < secs * 1000; v++) {
    const vt = v * rf + 0.12 * gauss(r); if (vt - last < 29) continue;               // the cap: gap 29 ms
    let tt = vt; if (v * rf > nextHitch) { nextHitch += hitchEvery; v += 3; tt = v * rf + 0.12 * gauss(r); }
    last = tt; const d = DIET.govFrame(g, tt, cfgFor()); if (d > 0) steps++; else if (d < 0) ups++;
  }
  return { steps, ups, lvl: g.lvl };
}
const oldCfg = () => base, capMs = 33.33, newCfg = () => ({ ...base, down_ms: Math.max(base.down_ms, 1.12 * capMs) });
const rows = {};
for (const hz of [60, 60.2, 59.8, 90, 120]) { rows[hz] = [gov(oldCfg, { hz }), gov(newCfg, { hz })]; console.log('B governor @ cap 30, display', String(hz).padEnd(5), 'Hz: steps down in 2 min  OLD', rows[hz][0].steps, ' NEW', rows[hz][1].steps); }
ok(rows[60][0].steps >= 1 || rows[59.8][0].steps >= 1, 'B1 OLD thresholds: at a clean 30 fps cap the picture is stepped down although nothing is wrong (>= 1 step on a 60 Hz or 59.8 Hz screen)');
ok(Object.values(rows).every(([o, n]) => n.steps === 0), 'B2 cap-aware thresholds (down at < 0.89 x cap): 0 steps on every screen');
{ const g = DIET.govInit(1); let s = 0, t = 0; for (let i = 0; i < 400; i++) { t += 45; s += DIET.govFrame(g, t, newCfg()) > 0 ? 1 : 0; } ok(s >= 2, 'B3 a really slow frame (45 ms = 22 fps) still steps down under the cap-aware thresholds (' + s + ' steps in 18 s)'); }
console.log(fails ? 'PF4 UNIT FAIL (' + fails + ')' : 'PF4 UNIT OK'); process.exit(fails ? 1 : 0);
