// tr2_s5_server_model.js — TR2-S5: what the SERVER knows, in JS: built only from docs/tr2_s5_geom.json (no game code but the pure rule function).  Used by the vector generator and by the mock endpoint,
// so the spec's numbers are checked twice: against the game's own geometry (exact ground) and against this "server" (1 m grid ground + hTol).  The Python port (docs/tr2_s5_ref_rules.py) mirrors it line by line.
import * as LS from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout_store.js';
import * as RULES from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout_rules.js';

export function serverModel(geom) {
  const h = geom.heights, bin = Buffer.from(h.cm, 'base64'), cm = new Int16Array(bin.buffer, bin.byteOffset, bin.length / 2);
  const gridH = (x, z) => { const u = (x - h.x0) / h.step, v = (z - h.z0) / h.step, i = Math.floor(u), j = Math.floor(v); if (i < 0 || j < 0 || i >= h.nx - 1 || j >= h.nz - 1) return -9; const fu = u - i, fv = v - j, at = (a, b) => cm[(j + b) * h.nx + i + a] / 100; return (at(0, 0) * (1 - fu) + at(1, 0) * fu) * (1 - fv) + (at(0, 1) * (1 - fu) + at(1, 1) * fu) * fv; };
  const GS = { town: geom.town, outer: geom.outer, moat: geom.moat, gates: geom.gates, streets: geom.streets, river: geom.river, streams: geom.streams, market: geom.market, vaults: geom.vaults, gens: [], height: gridH };
  const hTol = geom.tolerance.hTol, known = new Map(geom.things.map((t) => [t.id, t]));
  const records = (ovr) => geom.things.map((t) => { const o = ovr.get(t.id); return { id: t.id, kind: t.kind, fp: t.fp, x: o ? o[0] : t.x, z: o ? o[1] : t.z, ry: o ? o[2] : t.ry, moved: !!o }; });
  const why = (rs, r, pose) => RULES.checkPose(GS, r, pose, rs, { height: gridH, hTol }).why;
  function canonicalLoad(rec) {
    const s = LS.shapeOk(rec); if (!s.ok) return { status: 'reject', why: s.why };
    const ovr = new Map(), dropped = [];
    for (const [id, a] of Object.entries(rec.m)) { if (!known.has(id)) { dropped.push(id); continue; } const q = LS.quant(a[0], a[1], a[2]); ovr.set(id, [q.x, q.z, q.ry]); }
    for (let i = 0; i < 400; i++) {
      const rs = records(ovr), bad = rs.filter((r) => r.moved && why(rs, r, r).length).map((r) => r.id); if (!bad.length) break;
      const first = bad.sort()[0]; ovr.delete(first); dropped.push(first);
    }
    const m = {}; for (const id of [...ovr.keys()].sort()) m[id] = ovr.get(id);
    return { status: 'ok', effective: m, dropped: dropped.sort() };
  }
  return { GS, gridH, hTol, known, records, canonicalLoad, why };
}

// the endpoint (docs/layout_api.md §2) as a function: GET / POST /api/layout with a Bearer token (none / locked -> 403 {reason:'locked'}), a per-user store, the rate limit (429), 413, 400, 503 when switched off (setOff); targetFor(token) = what player_target() adds to the attacker's spec
export function createMockServer(geom, { clock = () => Date.now() } = {}) {
  const M = serverModel(geom), db = new Map(), hits = new Map(), locked = new Set(); let planId = geom.planId, off = false;
  const effective = (rec) => { const r = M.canonicalLoad(rec); return r.status === 'ok' ? { v: 1, g: planId, m: r.effective } : null; };
  function handle(method, headers, bodyText) {
    const tok = (headers && (headers.Authorization || headers.authorization) || '').replace(/^Bearer /, '');
    if (!tok || locked.has(tok)) return { status: 403, json: { ok: false, reason: 'locked' } };      // no session / a locked session: 403 + reason 'locked', NO `why` (ROUND4 A4.2)
    if (off) return { status: 503, json: { ok: false, why: 'off' } };                                  // the feature is switched off on the server
    if (method === 'GET') { let rec = db.get(tok) || null; if (rec && rec.g !== planId) { rec = effective(rec); db.set(tok, rec); } return { status: 200, json: { ok: true, layout: rec } }; }
    if (method !== 'POST') return { status: 405, json: { ok: false, why: 'method' } };
    const t = clock(), h = (hits.get(tok) || []).filter((x) => t - x < 5000); if (h.length >= 5) return { status: 429, json: { ok: false, why: 'rate' } };
    h.push(t); hits.set(tok, h);
    if (bodyText.length > 8192 + 256) return { status: 413, json: { ok: false, why: 'size' } };
    let body; try { body = JSON.parse(bodyText); } catch (e) { return { status: 400, json: { ok: false, why: 'bad' } }; }
    const res = M.canonicalLoad(body && body.layout); if (res.status === 'reject') return { status: 400, json: { ok: false, why: res.why } };
    const rec = { v: 1, g: planId, m: res.effective }; db.set(tok, Object.keys(rec.m).length ? rec : null);
    return { status: 200, json: { ok: true, layout: rec, dropped: res.dropped } };
  }
  const fetch = async (url, opt = {}) => { const r = handle(opt.method || 'GET', opt.headers, opt.body || ''); return { ok: r.status < 300, status: r.status, json: async () => r.json }; };
  return { handle, fetch, db, model: M, targetFor: (tok) => { const rec = db.get(tok); return rec && Object.keys(rec.m).length ? { layout: rec } : {}; }, setPlanId: (p) => { planId = p; }, lock: (tok) => locked.add(tok), unlock: (tok) => locked.delete(tok), setOff: (v) => { off = !!v; } };
}
