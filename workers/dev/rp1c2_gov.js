// rp1c2_gov.js — RP1C-R2 Job 1 (+ the pixel-ratio rule of Job 0): the quality governor in the UNDERWORLD, on a fake clock, with a fake S.under / S.cmb that record every setQuality(step).
//   · the governor runs in the underworld too (S.where === 'under') and hands the step 0 (full) … 3 (lowest) to S.under.setQuality and S.cmb.setQuality, the same step to both
//   · 60 fps: nothing; 20 fps: 0,0,1,2,3,3,3 along the ladder; recovery: back to 0 (slowly); paused / hidden: silent; 30..50 fps band: held
//   · the home-only work (hiding far packs) does not run in the underworld; goUnder's diet.syncQ() hands the CURRENT step to a freshly built underworld / combat layer
//   · the owner's rule: the pixel ratio is not lowered below 1.0 until everything else has been cut (shadows OFF, far cull, crowd, packs); RP1C-R2 Job 1b: a PHONE starts at 1.0 with the mirror off and may climb to 1.5 (Job 9; a drop from there locks it), a big screen (devicePixelRatio 2 / 3)
//     may climb to min(dpr, 2); the coarse steps below 1.0 are 0.85 -> 0.70 -> 0.55; the transitions are PRINTED on a fake clock
//   run:  cd client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/rp1c2_gov.js --bundle --platform=node --format=cjs --outfile=/home/claude/dev/rp1c2_gov.cjs && node /home/claude/dev/rp1c2_gov.cjs   -> «GOV2 OK»
import * as THREE from 'three';
import { STEPS, GOV_CFG, makeSteps, createDiet } from '/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/rpg_diet.js';
import { REACH } from '/home/claude/bot/bluebot_v2/bluewall/client/src/reach.js';
let fails = 0; const ok = (c, m) => { if (!c) { console.log('FAIL', m); fails++; } else console.log('ok  ', m); };
global.document = { hidden: false };
const mkEnv = (extra = {}) => {
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(), key = new THREE.DirectionalLight(); key.castShadow = true; Object.assign(key.shadow.camera, { left: -120, right: 120, top: 120, bottom: -120 });
  const renderer = { shadowMap: { enabled: true, needsUpdate: false } }, rec = { u: [], c: [] };
  const S = { x: 0, z: 0, hero: null, where: 'home', under: { setQuality: (q) => rec.u.push(q) }, cmb: { setQuality: (q) => rec.c.push(q) } };
  const H = { THREE, renderer, scene, camera: cam, world: { key }, reach: REACH, resize: () => { }, dev: false, ...extra };
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial(), 2); m.name = 'life-far'; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < 2; i++) m.setMatrixAt(i, new THREE.Matrix4().makeTranslation(500 + i, 0, 0)); scene.add(m); m.updateMatrixWorld(true);
  return { S, H, rec, key, far: m };
};
const feed = (D, t0, sec, ms, paused = false) => { let t = t0; const end = t0 + sec * 1000; while (t < end) { t += ms; D.tick(t, paused); } return t; };

// ---- 1. the underworld: 20 fps walks the ladder, both setQuality hooks get the same steps, in range 0..3, non-decreasing
{
  const { S, H, rec, far } = mkEnv(); S.where = 'under'; const D = createDiet(H, S); D.enter();
  ok(rec.u.length > 0 && rec.u.at(-1) === 0 && rec.c.at(-1) === 0, 'enter(): both layers start at step 0 (full quality)');
  const t1 = feed(D, 1e6, 30, 50);
  ok(D.info().lvl === GOV_CFG.max && D.info().down === GOV_CFG.max, 'underworld, 20 fps for 30 s: the governor stepped down all ' + D.info().down + ' levels (it runs there too)');
  ok(JSON.stringify(rec.u) === JSON.stringify(rec.c), 'S.under.setQuality and S.cmb.setQuality received the identical sequence (' + rec.u.length + ' calls)');
  const seq = [...new Set(rec.u)].join(','); ok(seq === '0,1,2,3', 'the steps handed over: ' + seq + ' (0 full … 3 lowest)');
  ok(rec.u.every((q, i) => i === 0 || q >= rec.u[i - 1]), 'going down, the step never goes back up: ' + rec.u.join(''));
  ok(rec.u.at(-1) === 3 && rec.c.at(-1) === 3, 'at the last level both layers are at the lowest step (3)');
  ok(far.visible, 'the home-only work (hiding far packs) does NOT run in the underworld (a pack 500 m away in the home scene is untouched)');
  // paused / hidden says nothing
  const n0 = rec.u.length, lv = D.info().lvl; feed(D, t1, 30, 50, true); document.hidden = true; feed(D, t1 + 40000, 30, 50); document.hidden = false;
  ok(rec.u.length === n0 && D.info().lvl === lv, 'paused or hidden page: no step, no setQuality call');
  // recovery at 60 fps: back to 0, one step per >= 8 s
  const k0 = rec.u.length; const t2 = feed(D, t1 + 100000, 90, 1000 / 60);
  ok(D.info().lvl === 0 && rec.u.at(-1) === 0 && rec.c.at(-1) === 0, 'underworld, 60 fps afterwards: back to level 0 and step 0 (' + D.info().up + ' steps up)');
  ok(rec.u.slice(k0).every((q, i, a) => i === 0 || q <= a[i - 1]), 'going up, the step only goes down: ' + rec.u.slice(k0).join(''));
  D.exit();
}

// ---- 2. 40 fps (the 30..50 band): held
{
  const { S, H, rec } = mkEnv(); S.where = 'under'; const D = createDiet(H, S); D.enter(); let t = feed(D, 1e6, 5, 50); const l0 = D.info().lvl, n0 = rec.u.length; t = feed(D, t, 60, 25);
  ok(l0 >= 1 && D.info().lvl === l0 && rec.u.length === n0, 'underworld, 40 fps for 60 s: level ' + l0 + ' held, no setQuality call');
  D.exit();
}

// ---- 3. goUnder's hand-over: a freshly built underworld / combat layer gets the CURRENT step through diet.syncQ(); the same ladder is used when she comes back home
{
  const { S, H, rec } = mkEnv(); const D = createDiet(H, S); D.enter(); feed(D, 1e6, 10, 50);                        // home scene, 20 fps: level ~4
  const lv = D.info().lvl, want = D.STEPS[lv].q; rec.u.length = rec.c.length = 0; D.syncQ();
  ok(lv >= 3 && rec.u.length === 1 && rec.u[0] === want && rec.c[0] === want, 'syncQ(): a new underworld + combat layer starts at the governor\'s current step (' + want + ' at level ' + lv + ')');
  S.where = 'under'; rec.u.length = rec.c.length = 0; const t = feed(D, 2e6, 3, 1000 / 60);
  ok(D.info().lvl === lv, 'the governor keeps its level across the portal (no reset to 0)');
  D.exit();
}

// ---- 4. the pixel-ratio rule: nothing else left to cut before 0.85 / 0.70 / 0.55; a PHONE never goes above 1.0, a big screen climbs from native to min(dpr, 2)
{
  for (const [dpr, phone] of [[1, false], [1, true], [2, true], [3, true], [1.5, false], [2, false], [3, false]]) {
    global.window = { devicePixelRatio: dpr }; const E = mkEnv(phone ? { devdpr: Math.min(dpr, 2), phone } : { sharp: Math.min(dpr, 2), devdpr: Math.min(dpr, 2), phone }); const D = createDiet(E.H, E.S);       // (a phone: the real rule SHARP = min(dpr, 1.5) is exercised, not injected)
    const cases = null; const L = D.STEPS, f = L.findIndex((s) => s.abs < 1), tag = 'dpr ' + dpr + (phone ? ' phone' : ' screen');
    ok(L.slice(0, f).every((s) => s.abs >= 1) && L.slice(f).every((s) => s.abs < 1), tag + ': the ladder is >= 1.0 up to level ' + (f - 1) + ', below 1.0 only from level ' + f + ' (' + L.map((s) => s.abs).join(' ') + ')');
    ok(L.slice(f).map((s) => s.abs).join(' ') === '0.85 0.7 0.55', tag + ': the coarse steps are 0.85 -> 0.70 -> 0.55');
    const off = L.findIndex((s) => s.soff); ok(off >= 0 && off < f && L.slice(off).every((s) => s.soff && s.sh >= 1e6), tag + ': shadows are OFF (intensity 0, no shadow pass) from level ' + off + ', BEFORE the first level under 1.0 (level ' + f + ')');
    ok(L.findIndex((s) => s.box < 44) < f && L.findIndex((s) => s.hideR < 90) < f && L.findIndex((s) => s.norefl) < f && L.findIndex((s) => s.upd >= 4) < f, tag + ': shadow box, far-cull radius, mirror and the crowd freeze are all cut before the pixel ratio goes under 1.0');
    ok(L.slice(f).every((s, i, a) => i === 0 || (s.fog >= a[i - 1].fog && s.cullR <= a[i - 1].cullR)), tag + ': every coarse step also pulls the fog in (' + L.slice(f).map((s) => s.fog).join(' ') + ') and the draw radius (' + L.slice(f).map((s) => s.cullR).join(' ') + ')');
    if (phone) ok(L.every((s) => s.abs <= 1.5) && L.first === (dpr > 1.1 ? 1 : 0), tag + ': a phone has at most one level above 1.0, never above 1.5 (' + L.map((s) => s.abs).join(' ') + ')');
    D.enter(); ok(D.st.lvl === (phone ? L.first + 1 : L.first) && L[D.st.lvl].abs === 1 && (!phone || L[D.st.lvl].norefl), tag + ': she STARTS at native 1.0' + (phone ? ' with the water mirror OFF' : '') + ' (level ' + D.st.lvl + ')');
    ok(REACH.fog >= 1.2 && REACH.life > 0 && REACH.life <= 80, tag + ': start defaults: fog x' + REACH.fog + ', life radius ' + REACH.life + ' m' + (phone ? ', bloom off: ' + REACH.nobloom : ''));
    if (phone) ok(REACH.nobloom === true, tag + ': a phone starts with the bloom composer off');
    const px = () => Math.min(Math.min(dpr, 2), REACH.cap || 1) * REACH.dpr;                                          // what main.js dpr() computes with devicePixelRatio = dpr (resScale 1, DYN off while REACH.own)
    D.apply(L.first); ok(Math.abs(px() - 1) < 1e-6, tag + ': level ' + L.first + ' renders at exactly 1.0 px per CSS px (REACH.dpr ' + REACH.dpr.toFixed(3) + ' x cap)');
    // climb: 60 fps -> up to the sharp levels (a big screen only)
    let t = feed(D, 1e6, 20 * 8 + 10, 1000 / 60); const want = phone ? Math.min(dpr, 1.5) : Math.min(dpr, 2);
    ok(D.st.lvl === 0 && Math.abs(px() - (want > 1.1 ? want : 1)) < 0.02, tag + ': 60 fps for 170 s -> ' + (want > 1.1 ? 'she climbed to sharp ' + want : 'she stays at native 1.0') + ' (level ' + D.st.lvl + ', ' + px().toFixed(2) + ' px per CSS px)');
    if (phone && L.first > 0) {                                                                                      // Job 9: a drop from the sharp level locks the climb for the session
      for (let k = 0; k < 40 * 20 && D.st.lvl <= L.first - 1 + 0; k++) { t += 50; D.tick(t, false); }
      ok(D.st.lvl === L.first && L[D.st.lvl].abs === 1, tag + ': 20 fps at the sharp level -> back at native 1.0 (level ' + D.st.lvl + ')');
      t = feed(D, t, 300, 1000 / 60); ok(D.st.lvl === L.first, tag + ': 60 fps for 300 s afterwards: she does NOT climb to the sharp level again (level ' + D.st.lvl + ', locked for the session)');
    }
    D.exit(); ok(REACH.cap === 0 && REACH.own === false && REACH.dpr === 1 && REACH.life === 0 && REACH.fog === 1 && !REACH.nobloom, tag + ': exit(): every REACH knob neutral again');
  }
}

// ---- 5. the transitions on a fake clock, PRINTED (a phone at 20 fps, then at 60 fps), and what each step hands over
{
  global.window = { devicePixelRatio: 1 }; const E = mkEnv({ devdpr: 1, phone: true }); E.S.where = 'home'; const D = createDiet(E.H, E.S); D.enter(); const L = D.STEPS; const rows = []; let t = 5e6, prev = D.st.lvl;
  const log = (tag) => { const s = L[D.st.lvl]; rows.push(`  t=${((t - 5e6) / 1000).toFixed(0).padStart(3)}s ${tag} -> level ${D.st.lvl}/${L.length - 1} ${s.label.padEnd(11)} px ${String(s.abs).padEnd(4)} shadows ${s.soff ? 'OFF' : 'on '} box ${s.box} fog x${s.fog} cull ${s.cullR} life ${s.life} upd ${s.upd} q ${s.q}`); };
  log('start     ');
  for (let k = 0; k < 140 * 20 && D.st.lvl < L.length - 1; k++) { t += 50; D.tick(t, false); if (D.st.lvl !== prev) { prev = D.st.lvl; log('20 fps  v '); } }
  const tDown = (t - 5e6) / 1000;
  for (let k = 0; k < 400 * 60 && D.st.lvl > 0; k++) { t += 1000 / 60; D.tick(t, false); if (D.st.lvl !== prev) { prev = D.st.lvl; log('60 fps  ^ '); } }
  console.log(rows.join('\n'));
  ok(tDown < 30, 'the phone is walked down all ' + (L.length - 1) + ' steps within ' + tDown.toFixed(0) + ' s at 20 fps');
  ok(D.st.lvl === 0, 'and back to level 0 at 60 fps (dpr 1 phone: no sharp level)');
  const order = rows.filter((r) => r.includes('20 fps')).map((r) => +r.match(/level (\d)/)[1]); ok(order.join('') === '234567', 'the steps are taken one at a time, in order, from the start at level 1 (mirror off): ' + order.join(' '));
  D.exit();
}

console.log(fails ? 'GOV2 FAILED' : 'GOV2 OK'); process.exit(fails ? 1 : 0);
