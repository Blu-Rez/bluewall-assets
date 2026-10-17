// pf4/page_check.js — runs inside the rig page (pf3/lab.py): the REAL rpg_diet.js governor on a frame stream that sits ON the 30 fps cap, with REACH.capMs as main.js sets it
const sleep = (ms) => new Promise((x) => setTimeout(x, ms));
window.__nd.on = true; const ip = setInterval(() => window.dispatchEvent(new Event('pointermove')), 600);
await __rpLoad('?v=' + Date.now()); await __rp.start('elina'); await sleep(2500);
const k = __rp.knobs(), live = k.capMs;                       // what main.js put there while the hero was running
__bw.pause(true); await sleep(300);
const d = __rp.diet();
const feed = (capMs, ms, secs) => { k.capMs = capMs; d.enter(); const s0 = d.st.stepsDown; let t = 5e6; const n = Math.round(secs * 1000 / ms); for (let i = 0; i < n; i++) { t += ms; d.tick(t, false); } return d.st.stepsDown - s0; };
const out = { live, A_cap_aware_30fps_cap: feed(1000 / 30 * 1, 33.4, 120), B_no_capMs_30fps_cap: feed(0, 33.4, 120), C_really_slow_22fps_cap_aware: feed(1000 / 30, 45, 20), D_cap_off_60fps_clean: feed(16.7, 16.7, 60) };
__bw.pause(false); k.capMs = live; clearInterval(ip);
try { __rp.exit && __rp.exit(); } catch (e) { /* ignore */ }
return out;
