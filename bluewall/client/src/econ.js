import { normEmblem } from './emblems.js';
// Player economy on the client: castle level + gem wallet + the three mines.
// Server truth comes from /api/state and /api/collect (Bearer session token);
// without a token (dev page) a local simulation with the same rules is used.
const MINES = ['ruby', 'emerald', 'turq'];
import BAL from './balance.json';                              // generated from the server's progress.py (python3 -m bluewall.progress): one source of truth
const CAP_H = BAL.cap_hours;
const MAXL = BAL.max_level || 20;                          // the top castle level (server: progress.MAX_LEVEL, 30 since p35)
const lvIdx = (lv) => Math.max(1, Math.min(MAXL, lv | 0)) - 1;
const rate = (m, lv) => BAL.rates[m][lvIdx(lv)];
export const vaultCap = (m, lv) => BAL.vault[m][lvIdx(lv)];

// offline preview (no session token): every structure at the castle level, nothing can be upgraded
const STRUCTS = { keep: 'town', wall: 'defense', towers: 'defense', training: 'army', barracks: 'army', stable: 'army', workshop: 'army', lair: 'army', forge: 'army',
  mine_ruby: 'resource', mine_emerald: 'resource', mine_turq: 'resource', vault_ruby: 'resource', vault_emerald: 'resource', vault_turq: 'resource' };
function offlineProg(lv) {
  const b = {}, structs = {};
  for (const [e, cat] of Object.entries(STRUCTS)) { b[e] = lv; structs[e] = { lv, cat, next: lv >= MAXL ? { to: lv + 1, ok: false, why: 'max', cost: null, dur: null } : { to: lv + 1, ok: false, why: 'offline', cost: { emerald: 0 }, dur: 3600 } }; }
  return { b, structs, builders: 3, builders_busy: 0, reserve_max: 2, reserved: 0, next_builder: null, rush_h: 8, rush_day_h: 4 };
}

// offline preview: a full house of soldiers (same shape as military.view)
import DEFS from './unitdefs.json';
function offlineArmy(lv) {
  const cap = DEFS.army_cap[Math.max(1, Math.min(MAXL, lv)) - 1], plan = { spear: 0.07, sword: 0.07, guard: 0.05, archer: 0.08, cavalry: 0.08, pegasus: 0.06, baby: 0.05, dragon: 0.05, catapult: 0.05, giant: 0.05, imp: 0.04, mage: 0.05, ram: 0.04, cannon: 0.05, werewolf: 0.05, trebuchet: 0.05, hill: 0.05, shieldmaiden: 0.03, lord: 0.03, legionary: 0.05, captain: 0.02, ogre: 0.04, gryphon: 0.04, lich: 0.04, treant: 0.04, gryphonknight: 0.02, darkrider: 0.02, baby3: 0.03, dragon3: 0.03 };
  const army = {}, units = {}; let space = 0, power = 0;
  for (const u of DEFS.order) {
    const d = DEFS.units[u], open = lv >= d.lv, n = open && plan[u] ? Math.min(DEFS.heroes && DEFS.heroes[u] ? DEFS.heroes[u].filter((x) => lv >= x).length : 1e9, Math.max(1, Math.floor(cap * plan[u] / d.space))) : 0;      // (p35 K2: at most three of each hero, the 2nd and 3rd open with the building level)
    units[u] = { n, fam: d.fam, lv: d.lv, space: d.space, open, max: 0, ulv: lv, tier: [1, 4, 8, 12, 16, 20].filter((x) => lv >= x).length - 1}; if (n) { army[u] = n; space += n * d.space; power += n * Math.sqrt(d.hp * d.dps) / 3 * (1 + 0.06 * (lv - 1)); }
  }
  const fam = {}; for (const f of DEFS.families) fam[f] = { lv, cap: DEFS.fam_cap[f][Math.max(1, Math.min(MAXL, lv)) - 1], used: Object.entries(army).reduce((s, [u, n]) => s + (DEFS.units[u].fam === f ? n * DEFS.units[u].space : 0), 0), q: [] };
  const spells = {}; for (const k of DEFS.spell_order) { const d = DEFS.spells[k]; spells[k] = { n: lv >= d.lv ? (k === 'lightning' ? 3 : 2) : 0, lv: d.lv, space: d.space, open: lv >= d.lv }; }
  const spell = { lv, cap: DEFS.spell_cap[Math.max(1, Math.min(MAXL, lv)) - 1], used: 0, spells, q: [] };
  const lvs = {}; for (const f of DEFS.families) lvs[f] = lv;
  return { army, units, spell, fam, space, queued: 0, cap, ready: Math.round(100 * Math.min(1, space / cap)), power: Math.round(power), forge: lv, shield: 0, attack: true, reports: [], lv: lvs };
}

// every network call has a deadline: a stalled connection must never freeze a panel / the result screen
function fetchT(url, opt = {}, ms = 15000) {
  if (typeof AbortController === 'undefined') return fetch(url, opt);
  const ac = new AbortController(), tm = setTimeout(() => ac.abort(), ms);
  return fetch(url, { ...opt, signal: ac.signal }).finally(() => clearTimeout(tm));
}

export class Econ {
  constructor({ token = null, level = 20 } = {}) {
    this.token = token; this.skew = 0; this.subs = new Set();
    this.st = { level, gems: { ruby: 0, emerald: 0, turq: 0 }, prem: { sap: 0, onyx: 0 }, vault: {}, mines: {}, prog: offlineProg(level) };
    for (const m of MINES) this.st.vault[m] = vaultCap(m, level);
    this.st.army = offlineArmy(level); this.st.emblem = DEFS.emblems[0]; this.st.name = '';
    this.st.bst = {}; this.st.own = { tesla: 0, dragonling: false }; this.st.shop = token ? null : localShop(level, this.st);      // (with a session the server's price list arrives with the state)
    const now = Date.now() / 1000;
    for (const m of MINES) this.st.mines[m] = { rate: rate(m, level), cap: rate(m, level) * CAP_H, last: now - CAP_H * 3600 * 0.5 };
    if (!token) this._loadLocal();
  }
  on(f) { this.subs.add(f); return () => this.subs.delete(f); }
  _emit(ev) { for (const f of this.subs) try { f(this.st, ev); } catch (e) { console.warn(e); } }
  _loadLocal() {
    try { const j = JSON.parse(localStorage.getItem('bw_econ_v1') || 'null'); if (j && j.gems) { this.st.gems = j.gems; for (const m of MINES) if (j.last && j.last[m]) this.st.mines[m].last = j.last[m]; } } catch (e) { /* ignore */ }
  }
  _saveLocal() { try { localStorage.setItem('bw_econ_v1', JSON.stringify({ gems: this.st.gems, last: Object.fromEntries(MINES.map((m) => [m, this.st.mines[m].last])) })); } catch (e) { /* ignore */ } }
  _apply(j) {
    if (!j || !j.ok) return;
    this.skew = (j.now || Date.now() / 1000) - Date.now() / 1000;
    this.st.level = j.level; this.st.gems = j.gems; this.st.prem = { sap: Math.max(0, (j.prem && j.prem.sap) || 0), onyx: Math.max(0, (j.prem && j.prem.onyx) || 0) }; if (j.prog) this.st.prog = j.prog; if (j.army) this.st.army = j.army; if (j.emblem) this.st.emblem = normEmblem(j.emblem); if (j.name != null) this.st.name = j.name;
    for (const m of MINES) this.st.vault[m] = (j.vault && j.vault[m]) || vaultCap(m, j.level);
    for (const m of MINES) if (j.mines && j.mines[m]) this.st.mines[m] = { rate: j.mines[m].rate, cap: j.mines[m].cap, last: j.mines[m].last };
    if (j.tro != null) { this.st.tro = j.tro; this.st.lg = j.lg || 0; }
    if (j.bst) this.st.bst = j.bst; if (j.own) { this.st.own = j.own; this.st.vis = j.vis || null; } if (j.shop) this.st.shop = j.shop;
    const G = j.gift;
    if (G && ['ruby', 'emerald', 'turq', 'sap', 'onyx'].some((g) => G[g] > 0) && G.t > (this._gt || 0)) {      // (gems that arrived from BlueBot: a conversion, a prize, an invite; shown once)
      this._gt = G.t; const ev = { gift: G.turq || 0, inv: G.inv || 0, sap: G.sap || 0, onyx: G.onyx || 0, ruby: G.ruby || 0, emerald: G.emerald || 0, conv: G.conv || 0 };
      setTimeout(() => this._emit(ev), 0);
    }
  }
  async load() {
    if (!this.token) { this._emit('load'); return this.st; }
    for (let k = 0; k < 3; k++) {                                       // (a flaky first request must not leave a made-up level-20 castle on screen)
      const w = this._wv | 0;
      try {
        const r = await fetchT('/api/state', { headers: { Authorization: 'Bearer ' + this.token }, cache: 'no-store' }, 10000);
        const j = await r.json();
        if (j && j.ok) { if (w === (this._wv | 0)) this._apply(j); this.loaded = true; break; }      // (a write finished while this read was in flight: its answer is newer, keep it)
        if (r.status === 401 || r.status === 403) { this.denied = true; break; }                      // (expired session: retrying cannot help)
      } catch (e) { console.warn('state', e); }
      if (k < 2) await new Promise((ok) => setTimeout(ok, 900 + k * 1400));
    }
    this._emit('load');
    return this.st;
  }
  _resync() { if (this._rs) return; this._rs = setTimeout(() => { this._rs = 0; this.load(); }, 2500); }   // (a write that timed out may still have been applied: re-read the truth)
  now() { return Date.now() / 1000 + this.skew; }
  ready(m) { const q = this.st.mines[m]; if (!q) return 0; return Math.floor(Math.min(q.cap, Math.max(0, (this.now() - q.last) / 3600 * q.rate))); }
  full(m) { const q = this.st.mines[m]; return q ? this.ready(m) >= Math.floor(q.cap) : false; }
  room(m) { return Math.max(0, this.st.vault[m] - this.st.gems[m]); }
  // HUD view: { ruby: { n, cap }, ... }
  wallet() { const o = {}; for (const m of MINES) o[m] = { n: this.st.gems[m], cap: this.st.vault[m] }; return o; }
  // the two special gems (no vault, no cap): { sap, onyx }
  prem() { return { sap: (this.st.prem && this.st.prem.sap) || 0, onyx: (this.st.prem && this.st.prem.onyx) || 0 }; }
  async collect(m) {
    if (!this.token) {
      const q = this.st.mines[m], exact = Math.min(q.cap, Math.max(0, (this.now() - q.last) / 3600 * q.rate)), got = Math.min(Math.floor(exact), this.room(m));
      if (got > 0) { this.st.gems[m] += got; q.last = this.now() - (exact - got) / q.rate * 3600; this._saveLocal(); }
      this._emit({ collect: m, n: got }); return got;
    }
    try {
      const r = await fetchT('/api/collect', { method: 'POST', headers: { Authorization: 'Bearer ' + this.token, 'Content-Type': 'application/json' }, body: JSON.stringify({ mine: m }) });
      const j = await r.json(); this._wv = (this._wv | 0) + 1; this._apply(j);
      const got = j && j.got ? j.got.n : 0; this._emit({ collect: m, n: got }); return got;
    } catch (e) { console.warn('collect', e); this._resync(); return 0; }
  }
}
// upgrade queue: op = start | cancel | speedup | finish (server rules, progress.py)
Econ.prototype.upgrade = async function (op, ent) {
  if (!this.token) return { ok: false, why: 'offline' };
  try {
    const r = await fetchT('/api/upgrade/' + op, { method: 'POST', headers: { Authorization: 'Bearer ' + this.token, 'Content-Type': 'application/json' }, body: JSON.stringify({ ent }) });
    const j = await r.json(); this._wv = (this._wv | 0) + 1; this._apply(j); this._emit({ upgrade: op, ent, ok: !!(j && j.ok) });
    return j;
  } catch (e) { console.warn('upgrade', e); this._resync(); return { ok: false, why: 'bad' }; }
};
// army: op = train {u, n} | cancel {fam} | speedup {fam} | get — one training batch per production building (military.py)
Econ.prototype.army = async function (op, body = {}) {
  if (!this.token) return { ok: false, why: 'offline' };
  try {
    const r = await fetchT('/api/army/' + op, { method: 'POST', headers: { Authorization: 'Bearer ' + this.token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json(); this._wv = (this._wv | 0) + 1; this._apply(j); this._emit({ army: op, ok: !!(j && j.ok) });
    return j;
  } catch (e) { console.warn('army', e); this._resync(); return { ok: false, why: 'bad' }; }
};
// the shop: {id:'boost', kind, p, d} (sapphire) | {id:'tesla'} (onyx) — shop.py
Econ.prototype.buy = async function (body) {
  if (!this.token) { const r = localBuy(this.st, body, this.now()); this.st.shop = localShop(this.st.level, this.st); this._emit({ shop: body.id, ok: r.ok }); return r; }
  try {
    const r = await fetchT('/api/shop/buy', { method: 'POST', headers: { Authorization: 'Bearer ' + this.token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json(); this._wv = (this._wv | 0) + 1; this._apply(j); this._emit({ shop: body.id, ok: !!(j && j.ok) });
    return j;
  } catch (e) { console.warn('shop', e); this._resync(); return { ok: false, why: 'bad' }; }
};
// active boosts {build|army|mine: {p, end}} (only the ones still running)
Econ.prototype.boosts = function () { const o = {}, now = this.now(); for (const [k, b] of Object.entries(this.st.bst || {})) if (b && b.end > now) o[k] = b; return o; };
// leaderboard + your place + invite link (GET /api/rank); offline preview answers an empty board
Econ.prototype.rank = async function () {
  if (!this.token) return { ok: true, local: true, top: [], me: { rank: null, tro: this.st.tro || 0, best: this.st.tro || 0, lg: this.st.lg || 0, n: this.st.name || '', e: this.st.emblem }, invite: { link: '', pay: 1000, keep: 3, done: 0, max: 50 } };
  try {
    const r = await fetchT('/api/rank', { headers: { Authorization: 'Bearer ' + this.token }, cache: 'no-store' });
    const j = await r.json();
    if (j && j.ok && j.me) { this.st.tro = j.me.tro; this.st.lg = j.me.lg; }
    return j;
  } catch (e) { console.warn('rank', e); return { ok: false }; }
};
// the social calls: '/api/log' (attack history), '/api/friends', '/api/clan' (GET) and POST '/api/clan' {op:'create'|'join'|'leave'|'kick', ...}.  Offline preview answers empty lists.
Econ.prototype.social = async function (path, body) {
  if (!this.token) return { ok: true, local: true, log: [], friends: [], mine: null, top: [], pay: 1000, keep: 3, max: 50, link: '' };
  try {
    const r = await fetchT(path, body ? { method: 'POST', headers: { Authorization: 'Bearer ' + this.token, 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' } : { headers: { Authorization: 'Bearer ' + this.token }, cache: 'no-store' });
    return await r.json();
  } catch (e) { console.warn('social', path, e); return { ok: false, reason: 'net' }; }
};
// choose the banner crest (an id from DEFS.emblems; the server keeps it and attackers see it on your walls)
// owner test tools (server: /api/dev, owner only): {own:{tesla, dragonling}} the royal showcase, {prem:{sap, onyx}} a test balance
Econ.prototype.dev = async function (body) {
  if (!this.token) return { ok: false, why: 'offline' };
  try {
    const r = await fetchT('/api/dev', { method: 'POST', headers: { Authorization: 'Bearer ' + this.token, 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
    const j = await r.json(); this._wv = (this._wv | 0) + 1; this._apply(j); this._emit({ dev: true, ok: !!(j && j.ok) });
    return j;
  } catch (e) { console.warn('dev', e); this._resync(); return { ok: false, why: 'bad' }; }
};
Econ.prototype.setEmblem = async function (e) {
  if (!DEFS.emblems.includes(e)) return { ok: false, why: 'bad' };
  this.st.emblem = e; this._emit({ emblem: e });
  if (!this.token) return { ok: true };
  return this.army('emblem', { e });
};
// next attack target {id, name, emblem, ratio, levels, seed, power, loot}; offline preview makes one locally
Econ.prototype.scout = async function (opts = {}) {
  if (!this.token) return { ok: true, local: true, target: localBot(this.st) };
  try {
    const r = await fetchT('/api/scout', { method: 'POST', headers: { Authorization: 'Bearer ' + this.token, 'Content-Type': 'application/json' }, body: JSON.stringify(opts) });
    const j = await r.json(); this._apply(j); return j;
  } catch (e) { console.warn('scout', e); return { ok: false, why: 'bad' }; }
};
// report the finished battle {sent, lost, destruction, stars, loot}; the server validates and applies losses + loot
Econ.prototype.battleEnd = async function (id, rep) {
  if (!this.token) return { ok: true, local: true, info: { loot: rep.loot, stars: rep.stars } };
  try {
    const r = await fetchT('/api/battle/end', { method: 'POST', headers: { Authorization: 'Bearer ' + this.token, 'Content-Type': 'application/json' }, body: JSON.stringify({ id, rep }) }, 15000);      // (a stalled network must never leave the result screen waiting forever)
    const j = await r.json(); this._wv = (this._wv | 0) + 1; this._apply(j); this._emit({ battle: true, ok: !!(j && j.ok) });
    return j;
  } catch (e) { console.warn('battle', e); return { ok: false, why: 'offline' }; }
};
// ---- offline preview of the shop (dev page / no session): the server's default price list (shop.py DEFAULTS)
const SHOP_DEF = { conv: { turq: [1, 10], emerald: [1, 400], ruby: [1, 1500], sap: [1, 10], onyx: [2, 1] }, boost: { build: 5, army: 4, mine: 5, royal: 12 }, dmul: { 1: 1, 7: 5, 30: 18 }, items: { tesla: [10, 15, 20, 25] } };
const CONV_FROM = { turq: 'blue', emerald: 'green', ruby: 'red', sap: 'red', onyx: 'red' };
function localShop(level, st) {
  const price = {}; for (const k of ['build', 'army', 'mine', 'royal']) { price[k] = {}; for (const p of [5, 10, 15, 20]) { price[k][p] = {}; for (const d of [1, 7, 30]) price[k][p][d] = Math.max(1, Math.round(SHOP_DEF.boost[k] * (p / 5) * SHOP_DEF.dmul[d])); } }
  const mult = Math.pow(1.13, Math.max(1, Math.min(MAXL, level)) - 1), own = (st && st.own) || {}, t = own.tesla || 0;
  const conv = {}; for (const [g, [i, o]] of Object.entries(SHOP_DEF.conv)) conv[g] = { from: CONV_FROM[g], in: i, out: Math.floor(o * (['turq', 'emerald', 'ruby'].includes(g) ? mult : 1)) };
  return { boost: { kinds: ['build', 'army', 'mine', 'royal'], tiers: [5, 10, 15, 20], days: [1, 7, 30], price, on: (st && st.bst) || {} },
    items: { tesla: { have: t, max: 4, price: t < 4 ? SHOP_DEF.items.tesla[t] : null, cur: 'onyx' } }, conv };
}
function localBuy(st, b, now) {
  const sh = st.shop, pm = st.prem;
  if (b.id === 'boost') {
    const c = sh.boost.price[b.kind] && sh.boost.price[b.kind][b.p] && sh.boost.price[b.kind][b.p][b.d]; if (!c) return { ok: false, why: 'bad' };
    if (pm.sap < c) return { ok: false, why: 'gems', info: { gem: 'sap', need: c } };
    const ks = b.kind === 'royal' ? ['build', 'army', 'mine'] : [b.kind];
    for (const k of ks) if (st.bst[k] && st.bst[k].end > now && st.bst[k].p > b.p) return { ok: false, why: 'stronger', info: { kind: k, p: st.bst[k].p } };
    pm.sap -= c; for (const k of ks) { const o = st.bst[k] && st.bst[k].end > now ? st.bst[k] : null; st.bst[k] = { p: b.p, end: (o ? (o.p === b.p ? o.end : now + (o.end - now) * o.p / b.p) : now) + b.d * 86400 }; }
    return { ok: true };
  }
  if (b.id === 'tesla') { const it = sh.items.tesla; if (it.price == null) return { ok: false, why: 'max' }; if (pm.onyx < it.price) return { ok: false, why: 'gems', info: { gem: 'onyx', need: it.price } }; pm.onyx -= it.price; st.own.tesla = (st.own.tesla || 0) + 1; return { ok: true }; }
  return { ok: false, why: 'bad' };
}
function localBot(st) {
  const my = Math.max(30, (st.army && st.army.power) || 100), ratio = 0.9 + Math.random() * 0.6, lv = Math.max(1, Math.min(MAXL, Math.round((st.level || 1) * (0.7 + 0.5 * ratio))));
  const loot = {}; for (const m of MINES) loot[m] = Math.round(rate(m, st.level || 1) * 6 * (0.7 + 0.5 * ratio));
  return { id: 'local' + Date.now().toString(36), name: ['Arman', 'Sepideh', 'Kian', 'نیلوفر', 'Dariush', 'Mahsa'][Math.floor(Math.random() * 6)], emblem: DEFS.emblems[Math.floor(Math.random() * DEFS.emblems.length)], ratio, levels: { keep: lv, wall: lv, towers: lv }, seed: 1 + Math.floor(Math.random() * 1e9), power: Math.round(my * ratio), loot };
}
export { MINES };
