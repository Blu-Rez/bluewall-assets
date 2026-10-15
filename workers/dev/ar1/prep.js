// AR1 prep (evaluated in the page with { defs, lv }): make the offline army state look like the server's (per-building levels, tiers, hp / dps by level, hero slots, a roomy housing)
// and answer army requests the way military.py would (train / cancel / speedup / guard), recording every call in window.__calls.  Needs window.__ar1 = { econ, army }.
(a) => {
  const { econ, army } = window.__ar1, DEFS = a.defs, LV = a.lv, A = econ.st.army;
  const tierOf = (L) => [1, 6, 12, 18, 24, 30].filter((x) => L >= x).length - 1;
  const lvs = a.lvs || {};
  for (const u of DEFS.order) {
    const d = DEFS.units[u], row = A.units[u], L = lvs[d.fam] != null ? lvs[d.fam] : LV;
    row.ulv = Math.max(1, L); row.tier = tierOf(row.ulv); row.open = L >= d.lv; row.hp = Math.round(d.hp * (1 + 0.035 * (row.ulv - 1))); row.dps = Math.round(d.dps * (1 + 0.035 * (row.ulv - 1)) * 10) / 10;
    if (DEFS.heroes && DEFS.heroes[u]) { const at = DEFS.heroes[u]; row.hero = { cap: at.filter((x) => L >= x).length, max: 3, held: Math.min(1, row.n), next: at.find((x) => L < x) || null }; }
    if (!row.open) row.n = 0;
    if (a.lvs && a.lvs.__units && a.lvs.__units[u] != null) { row.ulv = a.lvs.__units[u]; row.tier = tierOf(row.ulv); }
  }
  for (const f of DEFS.families) { A.fam[f].lv = lvs[f] != null ? lvs[f] : LV; A.fam[f].rush = 12; A.fam[f].q = []; A.fam[f].used = Math.floor(A.fam[f].cap * 0.3); }
  A.space = Math.floor(A.cap * 0.35); A.queued = 0; A.ready = 35;
  A.gslots = { giant: LV >= 19 ? 2 : 0, baby: LV >= 24 ? 2 : 0, hill: LV >= 24 ? 2 : 0, dragon: LV >= 27 ? 2 : 0 }; A.guard = { giant: 1 };
  econ.st.gems = { ruby: 12500, emerald: 8600, turq: 34000 };
  window.__calls = [];
  econ.army = async (op, body = {}) => {
    window.__calls.push([op, body]); const now = econ.now();
    if (op === 'train') { const u = A.units[body.u], d = DEFS.units[body.u], f = A.fam[u.fam]; const last = f.q[f.q.length - 1]; if (last && last.u === body.u) { last.n += body.n; last.fin += body.n * last.t; } else f.q.push({ u: body.u, n: body.n, t: d.t, fin: now + d.t * body.n }); A.queued += body.n * d.space; for (const g in d.cost) econ.st.gems[g] -= d.cost[g] * body.n; }
    else if (op === 'cancel') { const f = A.fam[body.fam], b = f.q[body.i]; if (b) { b.n -= body.n; A.queued -= body.n * DEFS.units[b.u].space; if (b.n <= 0) f.q.splice(body.i, 1); } }
    else if (op === 'speedup') { const f = A.fam[body.fam]; f.q.length = 0; A.queued = 0; }
    else if (op === 'guard') { A.guard = A.guard || {}; A.guard[body.u] = body.n; }
    econ._emit({ army: op, ok: true }); return { ok: true };
  };
  econ._emit({}); army.update(); return true;
}
