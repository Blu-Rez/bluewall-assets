// "Searching for an opponent" — the LOGIC only.  There is no page of its own: the attack flow has ONE loading screen (bhud.js createLoadView: opponent name, a bar and a percentage),
// and the search simply drives that bar:   const r = await findOpponent(econ, { ctl, onProgress(f, text) });     r = { ok, target, why }       (f = 0..1)
// The server answers a scout request either with a target or with `why: 'slow'` and `wait` (seconds until the next scout is allowed, a cooldown that stops scouting spam): that wait
// is turned into the progress (the percentage creeps up to 94 %, then the request is asked again by itself).  A found target always reaches 100 % for a beat.
//   ctl.cancelled = true  stops the search at once (also in the middle of a cooldown wait).
const TIPS = ['Scouting the land', 'Matching by power', 'Counting the walls', 'Weighing the vaults', 'Reading the banners'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function findOpponent(econ, { opts = {}, minMs = 1200, onProgress = () => {}, ctl = { cancelled: false } } = {}) {
  const t0 = performance.now(); let res = null, tries = 0;
  let f = 0, cap = 0.6, rate = 0.2, tipI = 0, tipT = 0, found = false;
  const target = (to, secs) => { cap = Math.max(f, Math.min(1, to)); rate = Math.max(0.02, (cap - f) / Math.max(0.2, secs)); };
  const tick = setInterval(() => {
    const dt = 0.08; if (f < cap) f = Math.min(cap, f + rate * dt);
    tipT += dt; if (tipT > 1.1 && !found) { tipT = 0; tipI = (tipI + 1) % TIPS.length; }
    onProgress(f, found ? 'Opponent found' : TIPS[tipI] + '…');
  }, 80);
  const nap = async (ms) => { const e = performance.now() + ms; while (!ctl.cancelled && performance.now() < e) await sleep(100); };
  try {
    target(0.6, 3);                                                              // a normal search: creeps toward 60 % while the server answers
    while (!ctl.cancelled && tries++ < 40) {
      let j = null; try { j = await econ.scout(opts); } catch (e) { j = { ok: false, why: 'offline' }; }     // (a network error must not leave the loading screen up for ever)
      if (j && j.ok && j.target) { res = j; break; }
      if (j && j.why === 'slow') { const w = Math.max(0.8, Math.min(30, +j.wait || 1.5)); target(0.94, w); await nap(w * 1000 + 120); continue; }
      res = j || { ok: false, why: 'bad' }; break;
    }
    if (ctl.cancelled) return { ok: false, why: 'cancel' };
    if (res && res.ok && res.target) {
      const rest = minMs - (performance.now() - t0); if (rest > 0) { target(0.92, rest / 1000); await sleep(rest); }
      if (ctl.cancelled) return { ok: false, why: 'cancel' };
      found = true; target(1, 0.35); await sleep(420);
      if (ctl.cancelled) return { ok: false, why: 'cancel' };                   // (cancelled during the last beat: do not start the fight)
      return { ok: true, target: res.target, raw: res };
    }
    return { ok: false, why: (res && res.why) || 'bad' };
  } finally { clearInterval(tick); }
}
