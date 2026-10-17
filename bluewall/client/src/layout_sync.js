// layout_sync.js — TR2-S5 / LY1: where the player's layout lives.  Online it is the server's (docs/layout_api.md: GET / POST /api/layout, the same Bearer token as every other call); without a session
// (dev pages, offline) it is this browser's localStorage.  A save the server could not take yet is kept and sent again (the layout never gets lost to a bad connection / a locked session).
//
// What the server answers to a POST (docs/layout_api.md §2) and what this file does with it:
//   200 { ok:true, layout, dropped:[ids], reasons?:{id:[codes]} }   the server judged the record and answers the EFFECTIVE one: that is what the game shows from now on (onServer gets it with `changed` = it is not what we sent)
//   403 { ok:false, reason:'locked' }        no session (NO `why`): the record stays pending + in this browser, no retry timer (flush() is called again when the session is back: load())
//   429 { ok:false, why:'rate' }             too many saves: kept, sent again a little later (4 s, 8 s, … six times)
//   413 { ok:false, why:'size' }             over 8 KB: final (the client stays under it: nothing to retry)
//   400 { ok:false, why:'bad' | <reason> }   the request / the record is malformed: final, nothing to retry
//   503 { ok:false, why:'off' }              the feature is switched off on the server: the layout is kept in this browser only, no retry
//   anything else / no answer                kept in this browser, sent again (4 s, 8 s, …)
//
// LY1 (the owner's «a house I moved is removed later», reproduced end to end against the real server: dev/ly1_test.sh, E1):
//   * ONE save in flight at a time, in order.  Two POSTs on their way could reach the server in the other order (the older one last = the newer move lost), and a slow answer to the first one used to overwrite the second move.
//   * a save never goes out less than GAP ms after the one before (the server allows 5 in 5 s: the client keeps itself under it, so a player who is busy arranging never meets «429»).
//   * load() (GET /api/layout) is never allowed to overwrite a newer local edit: while a save is waiting / in flight, or when the player edited while the GET was on its way, it answers null («keep what is on screen»).
//   * every answer that matters is told to the game as an event (onEvent): saving / saved (+ what the server put back and why) / rejected (+ the reason) / kept here (offline).  Nothing is silent any more.
const KEY = 'bw_layout_v1', PEND = 'bw_layout_pend';
const lsGet = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
const lsPut = (v) => { try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); } catch (e) { /* private mode */ } };
const pendGet = () => { try { return localStorage.getItem(PEND) === '1'; } catch (e) { return false; } };       // 1 = the copy in this browser is NOT what the server has (not sent yet / refused for now)
const pendPut = (on) => { try { if (on) localStorage.setItem(PEND, '1'); else localStorage.removeItem(PEND); } catch (e) { /* private mode */ } };
const isRec = (r) => !!(r && r.m && Object.keys(r.m).length);
// two records say the same thing (ids + the three numbers each, to 1e-6): the server may write the numbers / the keys in another form
export function sameLayout(a, b) {
  const A = isRec(a) ? a.m : {}, B = isRec(b) ? b.m : {}, ka = Object.keys(A), kb = Object.keys(B);
  if (ka.length !== kb.length) return false;
  for (const k of ka) { const p = A[k], q = B[k]; if (!q || p.length !== 3 || q.length !== 3) return false; for (let i = 0; i < 3; i++) if (!(Math.abs(p[i] - q[i]) < 1e-6)) return false; }
  return true;
}
function fetchT(url, opt = {}, ms = 15000) {
  if (typeof AbortController === 'undefined') return fetch(url, opt);
  const ac = new AbortController(), tm = setTimeout(() => ac.abort(), ms);
  return fetch(url, { ...opt, signal: ac.signal }).finally(() => clearTimeout(tm));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// opts: onServer(j) (the answers that settle a save, `changed` = the server's record is not what we sent), onEvent(e) (see above), getRev() (a number that changes whenever the layout on screen changes: a
// response is only ever applied while it still is the one it was made for), gap (ms between two POSTs, default 1100)
export function createLayoutSync(econ, { onServer = null, onEvent = null, getRev = null, gap = 1100 } = {}) {
  let pending = null, pendRev = 0, retry = 0, tries = 0, loop = null, edits = 0, lastStart = 0, bad = null;
  const online = () => !!(econ && econ.token);
  const hdr = () => ({ Authorization: 'Bearer ' + econ.token, 'Content-Type': 'application/json' });
  const emit = (e) => { if (onEvent) try { onEvent(e); } catch (err) { console.warn('layout event', err); } };
  const rev = () => (getRev ? getRev() : 0);
  async function body(r) { try { return await r.json(); } catch (e) { return null; } }       // (a 5xx page is not JSON)
  const quiet = () => pending === null && !loop && !pendGet();                  // nothing of ours is waiting for the server
  async function load() {                                            // -> the record ({ v, g, m }) or null (= nothing to apply: the default layout, or «keep what is on screen»)
    if (!online()) return lsGet();
    if (pending !== null || loop || pendGet()) {                     // something this browser made is still waiting for the server (locked / rate / net / in flight): send it first, the server's answer decides
      if (pending === null && !loop) { const rec = lsGet(); if (isRec(rec)) { pending = rec; pendRev = rev(); } else pendPut(false); }
      if (pending !== null || loop) { await run(); return lsGet(); }          // (a good answer left the server's record in the local copy; a failed one left ours: either way that is what is true now)
    }
    const e0 = edits, r0 = rev();
    try {
      const r = await fetchT('/api/layout', { headers: hdr(), cache: 'no-store' }, 10000), j = await body(r);
      if (j && j.ok) {
        if (edits !== e0 || rev() !== r0 || !quiet()) return null;  // (the player edited while this answer was on its way: it is older than what is on screen)
        lsPut(isRec(j.layout) ? j.layout : null); return j.layout || null;
      }
    } catch (e) { console.warn('layout load', e); }                  // (403 locked / 503 off / no net: not an error)
    return edits !== e0 ? null : lsGet();                            // (the server could not be asked: the last copy this browser saw)
  }
  const later = (rec, why = 'net') => { lsPut(isRec(rec) ? rec : null); pendPut(true); if (++tries < 6) { retry = setTimeout(() => { retry = 0; run(); }, 4000 * tries); emit({ t: 'kept', why }); } else emit({ t: 'kept', why, final: true }); };      // (every try that fails is told: «Not saved yet — will try again»; the sixth: the message)
  async function send(rec, r0) {                                     // ONE POST for `rec` -> the answer ({ ok, … }, `_s` = settled: nothing left to send for it); local copy, flags and timers are settled here
    lastStart = Date.now();
    if (!online()) { lsPut(isRec(rec) ? rec : null); return { ok: true, local: true, _s: true }; }
    emit({ t: 'saving' });
    try {
      const r = await fetchT('/api/layout', { method: 'POST', headers: hdr(), body: JSON.stringify({ layout: rec }) }), j = await body(r);
      const newer = pending !== rec;                                 // (the player edited again while this one was on its way: his newer record goes next; this answer must not overwrite it)
      if (j && j.ok) {                                               // 200: apply the server's record, not ours
        const eff = isRec(j.layout) ? j.layout : null, dropped = j.dropped || [], changed = dropped.length > 0 || !sameLayout(rec || null, eff), stale = newer || rev() !== r0;
        tries = 0; if (!newer) { lsPut(eff); pendPut(false); } else pendPut(true);
        if (onServer) onServer({ ...j, changed, stale }); emit({ t: 'saved', changed, stale, dropped, reasons: j.reasons || null, layout: eff }); return { ...j, _s: true };
      }
      if (r && r.status === 403 && j && j.reason === 'locked') { if (!newer) lsPut(isRec(rec) ? rec : null); pendPut(true); tries = 0; emit({ t: 'kept', why: 'locked' }); return { ok: false, why: 'locked', reason: 'locked' }; }      // no session: pending stays, no timer
      if (j && j.why === 'rate') { if (!newer) later(rec, 'rate'); return { ok: false, why: 'rate' }; }      // too many saves: kept, tried again later
      if (j && j.why === 'off') { if (!newer) { lsPut(isRec(rec) ? rec : null); pendPut(false); } if (onServer) onServer({ ...j, changed: false }); emit({ t: 'kept', why: 'off', final: true }); return { ok: false, why: 'off', local: true, _s: true }; }      // switched off: this browser keeps it
      if (j && j.why && r.status < 500) { if (!newer) pendPut(false); bad = j.why; if (onServer) onServer({ ...j, changed: false }); emit({ t: 'rejected', why: j.why }); return { ...j, _s: true }; }      // judged / malformed (400 / 413 / any other reason the server gives): nothing to retry
    } catch (e) { console.warn('layout save', e); }
    if (pending === rec) later(rec);                                 // (no answer / 5xx: kept in this browser, tried again; a newer record waiting goes out next anyway)
    return { ok: false, why: 'net' };
  }
  function run() {                                                   // the sender: one POST at a time, newest record first, never faster than `gap`
    if (loop) return loop;
    clearTimeout(retry); retry = 0;
    loop = (async () => {
      let res = { ok: true, idle: true };
      try {
        while (pending !== null) {
          const wait = lastStart + gap - Date.now(); if (wait > 0) await sleep(wait);
          const rec = pending; res = await send(rec, pendRev);
          if (pending === rec && res._s) pending = null;            // settled (accepted / refused for good / kept here for good)
          if (pending === rec) break;                                // not settled: the retry timer (or load()) owns it now
        }
      } finally { loop = null; }
      return res;
    })();
    return loop;
  }
  const save = (rec) => { edits++; pending = rec || false; pendRev = rev(); bad = null; return run(); };
  const flush = () => (pending === null ? Promise.resolve(undefined) : run());
  return { load, save, flush, get pending() { return pending !== null || !!loop; }, get busy() { return pending !== null || !!loop; }, get edits() { return edits; }, get rejected() { return bad; } };
}
