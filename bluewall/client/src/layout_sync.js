// layout_sync.js — TR2-S5: where the player's layout lives.  Online it is the server's (docs/layout_api.md: GET / POST /api/layout, the same Bearer token as every other call); without a session
// (dev pages, offline) it is this browser's localStorage.  A save the server could not take yet is kept and sent again (the layout never gets lost to a bad connection / a locked session).
//
// What the server answers to a POST (docs/layout_api.md §2) and what this file does with it:
//   200 { ok:true, layout, dropped:[ids] }   the server judged the record and answers the EFFECTIVE one: that is what the game shows from now on (onServer gets it with `changed` = it is not what we sent)
//   403 { ok:false, reason:'locked' }        no session (NO `why`): the record stays pending + in this browser, no retry timer (flush() is called again when the session is back: load())
//   429 { ok:false, why:'rate' }             too many saves: kept, sent again a little later (4 s, 8 s, … six times)
//   413 { ok:false, why:'size' }             over 8 KB: final (the client stays under it: nothing to retry)
//   400 { ok:false, why:'bad' | <reason> }   the request / the record is malformed: final, nothing to retry
//   503 { ok:false, why:'off' }              the feature is switched off on the server: the layout is kept in this browser only, no retry
//   anything else / no answer                kept in this browser, sent again (4 s, 8 s, …)
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
export function createLayoutSync(econ, { onServer = null } = {}) {
  let pending = null, retry = 0, tries = 0;
  const online = () => !!(econ && econ.token);
  const hdr = () => ({ Authorization: 'Bearer ' + econ.token, 'Content-Type': 'application/json' });
  async function body(r) { try { return await r.json(); } catch (e) { return null; } }       // (a 5xx page is not JSON)
  async function load() {                                            // -> the record ({ v, g, m }) or null (= the default layout)
    if (!online()) return lsGet();
    if (pendGet()) {                                                 // something this browser made is still waiting for the server (locked / rate / net): send it first, the server's answer decides
      const rec = lsGet(); if (isRec(rec)) { pending = rec; const j = await flush(); if (j && j.ok) return j.layout || null; return rec; }
      pendPut(false);
    }
    try {
      const r = await fetchT('/api/layout', { headers: hdr(), cache: 'no-store' }, 10000), j = await body(r);
      if (j && j.ok) { lsPut(isRec(j.layout) ? j.layout : null); return j.layout || null; }
    } catch (e) { console.warn('layout load', e); }                  // (403 locked / 503 off / no net: not an error)
    return lsGet();                                                  // (the server could not be asked: the last copy this browser saw)
  }
  const later = (rec) => { lsPut(isRec(rec) ? rec : null); pendPut(true); if (++tries < 6) retry = setTimeout(flush, 4000 * tries); };
  async function flush() {
    const rec = pending; if (!rec && rec !== false) return; clearTimeout(retry);
    if (!online()) { lsPut(isRec(rec) ? rec : null); pending = null; return { ok: true, local: true }; }
    try {
      const r = await fetchT('/api/layout', { method: 'POST', headers: hdr(), body: JSON.stringify({ layout: rec }) }), j = await body(r);
      if (j && j.ok) {                                               // 200: apply the server's record, not ours
        const eff = isRec(j.layout) ? j.layout : null, changed = !!(j.dropped && j.dropped.length) || !sameLayout(rec || null, eff);
        if (pending === rec) pending = null; tries = 0; lsPut(eff); pendPut(false); if (onServer) onServer({ ...j, changed }); return j;
      }
      if (r && r.status === 403 && j && j.reason === 'locked') { lsPut(isRec(rec) ? rec : null); pendPut(true); tries = 0; return { ok: false, why: 'locked', reason: 'locked' }; }      // no session: pending stays, no timer
      if (j && j.why === 'rate') { lsPut(isRec(rec) ? rec : null); pendPut(true); if (++tries < 6) retry = setTimeout(flush, 4000 * tries); return { ok: false, why: 'rate' }; }      // too many saves: kept, tried again later
      if (j && j.why === 'off') { if (pending === rec) pending = null; lsPut(isRec(rec) ? rec : null); pendPut(false); if (onServer) onServer({ ...j, changed: false }); return { ok: false, why: 'off', local: true }; }      // switched off: this browser keeps it
      if (j && j.why && (r.status === 400 || r.status === 413 || j.why === 'size' || j.why === 'bad')) { if (pending === rec) pending = null; pendPut(false); if (onServer) onServer({ ...j, changed: false }); return j; }      // judged / malformed: nothing to retry
      if (j && j.why && r.status < 500) { if (pending === rec) pending = null; if (onServer) onServer({ ...j, changed: false }); return j; }      // any other reason the server gives: final
    } catch (e) { console.warn('layout save', e); }
    later(rec);                                                      // (no answer / 5xx: kept in this browser, tried again)
    return { ok: false, why: 'net' };
  }
  const save = (rec) => { pending = rec || false; return flush(); };
  return { load, save, flush, get pending() { return !!pending; } };
}
