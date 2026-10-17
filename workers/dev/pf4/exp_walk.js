// pf4/exp_walk.js — hero mode, the bench's own walk, governor ACTIVE, 40 s, per-frame JS recorded: the profile (CDP) is taken around it by prof_lab.py
const b = __bw, r = b.renderer; const sleep = (ms) => new Promise((x) => setTimeout(x, ms));
window.__nd.on = true; const poke = () => window.dispatchEvent(new Event('pointermove')); const ip = setInterval(poke, 600);
await __rpLoad('?v=' + Date.now()); await __rp.start('elina'); await sleep(1200);
__pf.rec.start(); __pf.rec.hold(false);
let yaw = 0, t0 = performance.now(); const hero = __rp;
while (performance.now() - t0 < 40000) { const dt = 0.05; yaw += 0.5 * dt; hero.setLook(yaw, 0.25); hero.setInput(0, 0.8); hero.sprint(((performance.now() - t0) / 1000 | 0) % 4 === 3); await sleep(50); }
hero.setInput(0, 0); __pf.rec.hold(true);
const F = __pf.rec.F, n = F.n; const o = { n, t: Array.from(F.t.subarray(0, n)).map(Math.round), js: Array.from(F.js.subarray(0, n)).map((v) => +v.toFixed(1)), rn: Array.from(F.rn.subarray(0, n)).map((v) => +v.toFixed(1)), pr: Array.from(F.pr.subarray(0, n)).map((v) => +v.toFixed(2)), diet: __rp.diet().info() };
clearInterval(ip); return { n, diet: o.diet, big: o.js.map((v, i) => [i, v, o.rn[i], o.pr[i], i ? o.t[i] - o.t[i - 1] : 0]).filter((x) => x[1] > 70) };
