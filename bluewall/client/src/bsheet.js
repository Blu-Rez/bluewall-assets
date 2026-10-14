// bsheet.js — T1: the building CONTEXT SHEET.  Tap a building -> a bottom sheet with its name, level, state, ONE primary action that fits it,
// and Info / Manage (= the full page) / Move (slot, "soon").  The actions are the existing ones, CALLED, never copied:
//   upgrade  -> createUpgradeUI().act / .info / .focus      (upgradeui.js: the rules of the Kingdom page)
//   train    -> createArmyUI().trainOne / .why              (armyui.js: the same path a card tap takes)
//   collect  -> econ.collect(m)                             (the same call the old mine sheet made)
//   createSheetUI(mount, { econ, ui, audio, upgrade, army, afterCollect }) -> { tap(id, SM), open(id, SM), close(), isOpen(), update() }
// Registry:  registerSheet(idOrPrefix, { ok?, title, state, primary, secondary?, body?, info?, manage?, move? })   (a key ending in ':' or '_' is a prefix)
//   resolve order: exact id -> the castle map `SM` (gate / tower / archer -> wall / wall / towers) -> longest prefix (ws: home: civic: mine_ vault_).  Unmapped ids: tap() returns false = today's behaviour.
// Design (UX plan F12 / F19): one primary action per screen; .k-glass panel, no blur behind the panel; only transform + opacity move; no endless animation; touch targets >= 44 px.
import { GEMS } from './ui.js';
import { tr } from './i18n.js';
import DEFS from './unitdefs.json';
import { unitPic, NAME as UNIT_NAME } from './armyui.js';
import { TIERS, tierOf, fmtT, fmtN, structIcon } from './upgradeui.js';
import { siteById, WS_KINDS, wsLevel, counts } from './worksites.js';
import { homeLots, civicLots } from './town_plan.js';

const FONT = "'Libre Baskerville',Vazirmatn,Georgia,serif", DISPLAY = "Cinzel,'Libre Baskerville',Vazirmatn,Georgia,serif";
const GEMK = ['ruby', 'emerald', 'turq'];
const FAMS = ['barracks', 'training', 'stable', 'workshop', 'lair'];
const LABEL_IDS = ['well', 'market', 'house', 'camp', 'windmill', 'lumber', 'crystal'];         // decorations: a floating label for 1.5 s, no sheet

// ---------------------------------------------------------------------------------------------------------------- registry
const REG = new Map();
export function registerSheet(key, spec) { REG.set(key, spec); }
export function resolveSheet(id, SM) {
  if (!id) return null;
  if (REG.has(id)) return { spec: REG.get(id), id };
  if (SM && SM[id] && REG.has(SM[id])) return { spec: REG.get(SM[id]), id: SM[id] };
  let best = null; for (const k of REG.keys()) if ((k.endsWith(':') || k.endsWith('_')) && id.startsWith(k) && (!best || k.length > best.length)) best = k;
  return best ? { spec: REG.get(best), id } : null;
}

// ---------------------------------------------------------------------------------------------------------------- small helpers
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const costHtml = (cost, have) => GEMK.filter((g) => cost && cost[g]).map((g) => `<span class="${have && have[g] < cost[g] ? 'no' : ''}">${GEMS[g]}${fmtN(cost[g])}</span>`).join('');
const nice = (k) => { const s = String(k || '').replace(/_/g, ' '); return s.charAt(0).toUpperCase() + s.slice(1); };
const castleLv = (c) => { const p = c.econ.st && c.econ.st.prog; return Math.max(1, Math.round((p && p.b && p.b.keep) || (c.econ.st && c.econ.st.level) || 1)); };
const tierOfLv = (lv) => TIERS[tierOf(Math.max(1, lv))];
const tierName = (lv) => tierOfLv(lv)[0];
const svg = (d) => `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
const ICON_HOME = svg('M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5'), ICON_CIVIC = svg('M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M3 10l9-6 9 6');
const bar = (f) => `<div class="bsh-bar"><i style="--p:${Math.max(0, Math.min(1, f)).toFixed(3)}"></i></div>`;

// the E1 economy table (docs/economy_table.json, placeholder numbers): per-hour output of the extraction sites, throughput of the processing sites.  x 1.13^(level-1).
const E1 = { lumber: ['wood', 40], quarry: ['stone', 40], iron: ['iron_ore', 28], gold: ['gold_ore', 8], panning: ['gold_dust', 5], oil: ['crude', 12], farm: ['wheat', 45], greenhouse: ['vegetables', 36], livestock: ['livestock', 12], fishery: ['fish', 30],
  slaughter: ['livestock', 24, 'carcass', 2], sawmill: ['wood', 120, 'planks', 0.5], masonry: ['stone', 90, 'cut_stone', 0.5], smelter: ['iron_ore', 90, 'iron_bars', 0.5], mint: ['gold_ore', 24, 'coins', 4], refinery: ['crude', 36, 'oil', 0.5],
  mill: ['wheat', 135, 'flour', 1], bakery: ['flour', 135, 'bread', 1], butcher: ['livestock', 36, 'meat', 3], smokehouse: ['fish', 90, 'dried_fish', 1] };
const perH = (base, lv) => Math.round(base * Math.pow(1.13, Math.max(1, lv) - 1));
const KIND_EN = { lumber: 'Lumber Yard', quarry: 'Quarry', farm: 'Farm', livestock: 'Livestock Pen', fishery: 'Fishery', iron: 'Iron Mine', slaughter: 'Slaughter Hall', greenhouse: 'Greenhouse', gold: 'Gold Mine', oil: 'Oil Field',
  panning: 'Gold Panning', smokehouse: 'Smokehouse', sawmill: 'Sawmill', masonry: 'Masonry', smelter: 'Smelter', mint: 'Mint', refinery: 'Refinery', mill: 'Mill', bakery: 'Bakery', butcher: 'Butcher' };
const HOME_EN = { cottage: 'Cottage', craftsman: "Craftsman's House", merchant: "Merchant's House", noble: 'Noble House' };
const CIVIC_EN = { chapel: ['Chapel', 'Raises the loyalty of the town.'], well: ['Well', 'Fresh water for the town, the troops and the horses.'], townhall: ['Town Hall', 'Collects the tax. The tax rate comes with the economy update.'],
  market: ['Market', 'Trade: a tax bonus for the whole town.'], tavern: ['Tavern', 'Loyalty: the soldiers spend their pay here.'] };

// ---------------------------------------------------------------------------------------------------------------- buttons (plain data; the sheet draws them)
function upState(I, c) {
  const r = I.r, u = r.up;
  if (u && !u.reserved) return { code: 'building', text: `Upgrading to Lv ${u.to}`, end: u.end, bar: 1 - Math.max(0, u.end - c.now()) / Math.max(1, u.dur) };
  if (u && u.reserved) return { code: 'building', text: `Reserved · Lv ${u.to}`, right: fmtT(u.dur) };
  if (!r.lv) return { code: 'locked', text: 'Not built yet' };
  if (!r.next) return { code: 'max', text: `Max level · ${I.tier[0]} tier` };
  return { code: 'idle', text: `${I.tier[0]} tier · ready to upgrade` };
}
function upBtn(I, e, c, label, compact) {
  const btn = I.btn, nx = I.r.next;
  if (!btn || !nx) return { label: I.r.lv ? 'Max level' : 'Not available', kind: 'sec', dis: true, why: I.r.lv ? 'Already at the maximum level' : 'Not available yet' };
  if (btn.dis) return { label: label || 'Upgrade', sub: esc(btn.label), kind: 'sec', dis: true, why: btn.label };
  if (compact) return { label: label || btn.label, kind: 'sec', run: () => c.up.act('start', e) };
  return { label: label ? `${label}` : btn.label, sub: costHtml(nx.cost, I.have) + `<span class="tm">⏱ ${fmtT(nx.dur)}</span>`, kind: 'pri', run: () => c.up.act('start', e) };
}
function rushBtn(I, e, c) {
  const u = I.r.up; if (!u || u.reserved) return null;
  if (u.rush_cut === 0 && u.rush === 0 && !u.rush_full) return { label: 'Rush', sub: 'Daily limit reached', kind: 'prem', dis: true, why: 'Rush limit reached for today' };
  const free = !(u.rush > 0), cut = u.rush_full === false && u.rush_cut ? `−${fmtT(u.rush_cut)} ` : '';
  return { label: free ? 'Finish free' : 'Rush', sub: free ? '' : cut + GEMS.turq + fmtN(u.rush), kind: 'prem', hold: true, dis: !free && (I.have.turq | 0) < u.rush, why: 'Not enough turquoise', run: () => c.rush(e, u) };
}
const cancelBtn = (I, e, c) => (I.r.up ? { label: 'Cancel', kind: 'sec', run: () => c.cancel(e) } : null);
const secUp = (e, c) => { const I = c.up.info(e); if (!I) return null; return I.r.up ? (rushBtn(I, e, c)) : upBtn(I, e, c, 'Upgrade', true); };
const nextLine = (e, c) => { const I = c.up.info(e); if (!I || !I.r.next || !I.r.next.cost || I.r.up) return ''; return `<div class="bsh-nx"><span>Next · Lv ${I.r.next.to}</span><span>${costHtml(I.r.next.cost, I.have)}<span class="tm">⏱ ${fmtT(I.r.next.dur)}</span></span></div>`; };
const baseTitle = (e, c) => { const I = c.up.info(e); return { name: I.name, lv: I.r.lv, tier: I.tier, icon: structIcon(e, 26) }; };
const baseOk = (e, c) => !!c.up.info(e);

// castle structures with ONE job: Upgrade (keep / wall / gates / towers) and the Forge ("Upgrade armour")
const upgradeSpec = (label) => ({
  ok: baseOk, title: baseTitle, state: (e, c) => upState(c.up.info(e), c),
  primary: (e, c) => { const I = c.up.info(e); return I.r.up ? rushBtn(I, e, c) : upBtn(I, e, c, label); },
  secondary: (e, c) => { const I = c.up.info(e); return I.r.up ? cancelBtn(I, e, c) : null; },
  info: (e, c) => c.up.info(e).desc, manage: (e, c) => () => c.up.focus(e),
});

// the training buildings: Train (queue + housing).  The chips pick the soldier the big button trains.
const armyData = (c) => { const a = c.econ.st && c.econ.st.army; return a && a.fam && a.units ? a : null; };
const famUnits = (f) => DEFS.order.filter((u) => DEFS.units[u] && DEFS.units[u].fam === f);
function selUnit(f, c, a) { const us = famUnits(f), keep = c.sel[f]; if (keep && us.includes(keep) && a.units[keep] && a.units[keep].open) return keep; return us.find((u) => a.units[u] && a.units[u].open) || us[0]; }
const armySpec = (f) => ({
  ok: (e, c) => baseOk(e, c) && !!armyData(c),
  title: baseTitle,
  state: (e, c) => {
    const a = armyData(c), F = a.fam[f], I = c.up.info(e), q = F.q || [], queued = q.reduce((s, b) => s + b.n, 0);
    if (!F.lv) return { code: 'locked', text: 'Not built yet' };
    if (q.length) return { code: 'working', text: `Training · ${queued} in queue`, end: q[q.length - 1].fin };
    if (F.cap - F.used <= 0) return { code: 'full', text: `Full · ${fmtN(F.used)} / ${fmtN(F.cap)}` };
    const up = I.r.up && !I.r.up.reserved ? ` · upgrading to Lv ${I.r.up.to}` : '';
    return { code: 'idle', text: `Idle · room for ${fmtN(F.cap - F.used)}${up}` };
  },
  body: (e, c) => {
    const a = armyData(c), F = a.fam[f], q = F.q || [], qs = q.reduce((s, b) => s + b.n * (DEFS.units[b.u] ? DEFS.units[b.u].space : 1), 0), cap = Math.max(1, F.cap), u = selUnit(f, c, a);
    const chips = famUnits(f).map((id) => { const row = a.units[id] || {}, d = DEFS.units[id]; return `<button class="bsh-chip${id === u ? ' on' : ''}${row.open ? '' : ' lk'}" data-u="${id}" aria-label="${esc(UNIT_NAME[id] || id)}"><span class="pic">${unitPic(id, 40)}</span><b>${esc(UNIT_NAME[id] || id)}</b><small>${row.open ? costHtml(d.cost, null) : '🔒'}</small></button>`; }).join('');
    return `<div class="bsh-hs"><span>Housing <b>${fmtN(F.used)}</b> / ${fmtN(F.cap)}${qs ? ` <em>+${qs} training</em>` : ''}</span></div>
      <div class="bsh-bar"><i style="--p:${Math.min(1, (F.used + qs) / cap).toFixed(3)}"></i></div>
      <div class="bsh-chips" data-keep="chips">${chips}</div>${nextLine(e, c)}`;
  },
  primary: (e, c) => {
    const a = armyData(c), u = selUnit(f, c, a); if (!u) return null;
    const why = c.army.why(u), d = DEFS.units[u];
    return { label: `Train ${UNIT_NAME[u] || u}`, sub: why ? esc(why) : costHtml(d.cost, c.econ.st.gems), kind: 'pri', dis: !!why, why, run: () => { c.army.trainOne(u); } };
  },
  secondary: (e, c) => secUp(e, c), info: (e, c) => c.up.info(e).desc, manage: (e, c) => () => c.up.focus(e),
});

// mines + vaults: Collect (+ capacity); Upgrade is the secondary
const mineOf = (c, g) => { const m = c.econ.st.mines && c.econ.st.mines[g]; return m ? { m, ready: c.econ.ready(g), cap: Math.floor(m.cap), room: c.econ.room(g) } : null; };
function collectBtn(g, c) {
  const M = mineOf(c, g); if (!M) return null;
  const n = Math.min(M.ready, M.room), why = M.room < 1 ? 'Vault full — upgrade the vault' : M.ready < 1 ? 'Nothing to collect yet' : null;
  return { label: 'Collect', sub: `${GEMS[g]}+${fmtN(n)}`, kind: 'pri', dis: !!why, why, run: async () => { const got = await c.econ.collect(g); if (c.afterCollect) c.afterCollect(); if (got > 0) c.toast(`+${fmtN(got)}`); } };
}
const mineSpec = {
  ok: (id, c) => baseOk(id, c) && !!mineOf(c, id.slice(5)), title: baseTitle,
  state: (id, c) => { const M = mineOf(c, id.slice(5)), I = c.up.info(id); if (M.ready >= M.cap) return { code: 'full', text: 'Full — collect now', bar: 1 }; return { code: 'working', text: `Digging · ${fmtN(Math.round(M.m.rate))} / h`, bar: M.cap ? M.ready / M.cap : 0, right: I.r.up ? `Upgrading → Lv ${I.r.up.to}` : '' }; },
  body: (id, c) => { const M = mineOf(c, id.slice(5)); return `<div class="bsh-st3"><div><b>${fmtN(M.ready)}</b><span>Ready</span></div><div><b>${fmtN(Math.round(M.m.rate))}</b><span>Per hour</span></div><div><b>${fmtN(M.cap)}</b><span>Capacity</span></div></div>${nextLine(id, c)}`; },
  primary: (id, c) => collectBtn(id.slice(5), c), secondary: (id, c) => secUp(id, c), info: (id, c) => (tr().info[id] || [])[2] || c.up.info(id).desc, manage: (id, c) => () => c.up.focus(id),
};
const vaultSpec = {
  ok: (id, c) => baseOk(id, c) && !!mineOf(c, id.slice(6)), title: baseTitle,
  state: (id, c) => { const g = id.slice(6), have = c.econ.st.gems[g] || 0, cap = c.econ.st.vault[g] || 1; return have >= cap ? { code: 'full', text: `Vault full · ${fmtN(have)} / ${fmtN(cap)}`, bar: 1 } : { code: 'working', text: `Stored ${fmtN(have)} / ${fmtN(cap)}`, bar: have / cap }; },
  body: (id, c) => { const g = id.slice(6), M = mineOf(c, g); return `<div class="bsh-st3"><div><b>${fmtN(c.econ.st.gems[g] || 0)}</b><span>Stored</span></div><div><b>${fmtN(c.econ.st.vault[g] || 0)}</b><span>Capacity</span></div><div><b>${fmtN(M.ready)}</b><span>In the mine</span></div></div>${nextLine(id, c)}`; },
  primary: (id, c) => collectBtn(id.slice(6), c), secondary: (id, c) => secUp(id, c), info: (id, c) => (tr().info[id] || [])[2] || c.up.info(id).desc, manage: (id, c) => () => c.up.focus(id),
};

// the town: sites / houses / civic lots.  Their level follows the Castle (E1), so "Upgrade" = raise the Castle (opens its row, nothing is spent by the tap itself).
function castleBtn(c) {
  const I = c.up.info('keep'), lv = castleLv(c);
  if (!I || !I.r.next) return { label: 'Upgrade Castle', sub: 'Maximum level', kind: 'sec', dis: true, why: 'The Castle is at its maximum level' };
  return { label: 'Upgrade Castle', sub: `Lv ${lv} → ${lv + 1}`, kind: 'pri', run: () => { c.close(); c.up.focus('keep'); } };
}
const rowsHtml = (rows) => `<div class="bsh-rows">${rows.map(([k, v]) => `<div><span>${esc(k)}</span><b>${v}</b></div>`).join('')}</div>`;
const siteOf = (id) => { const sid = id.slice(3), s = siteById(sid); if (s) return s; const k = sid.replace(/[\d_]+$/, ''); return WS_KINDS[k] ? { id: sid, kind: k } : null; };
const wsSpec = {
  ok: (id) => !!siteOf(id),
  title: (id, c) => { const s = siteOf(id), lv = wsLevel(s, castleLv(c)); return { name: KIND_EN[s.kind] || nice(s.kind), lv, tier: tierOfLv(lv), icon: structIcon('workshop', 26) }; },
  state: (id, c) => { const s = siteOf(id), lv = wsLevel(s, castleLv(c)); return lv <= 0 ? { code: 'locked', text: `Unlocks at Castle Lv ${WS_KINDS[s.kind].unlock}` } : { code: 'working', text: `Working · ${tierName(lv)} tier` }; },
  body: (id, c) => {
    const s = siteOf(id), lv = wsLevel(s, castleLv(c)), e = E1[s.kind], w = lv > 0 ? counts(s, lv).workers : 0;
    const out = !e || lv <= 0 ? '—' : e[2] ? `${fmtN(perH(e[1], lv))} ${nice(e[0]).toLowerCase()} → ${fmtN(Math.round(perH(e[1], lv) * e[3]))} ${nice(e[2]).toLowerCase()}` : `${fmtN(perH(e[1], lv))} ${nice(e[0]).toLowerCase()}`;
    return rowsHtml([['In store', '— <small>soon</small>'], ['Output / hour', out], ['Workers', w ? fmtN(w) : '—']]);
  },
  primary: (id, c) => castleBtn(c), info: (id) => { const s = siteOf(id); return ((tr().info[s.kind] || [])[2] || '') + ' Its level follows the Castle. (Numbers are the planning table, not final.)'; },
};
const lotOf = (list, n) => list.find((l) => String(l.id) === String(n)) || null;
const homeSpec = {
  ok: () => true,
  title: (id, c) => { let k = 'cottage'; try { const l = lotOf(homeLots(castleLv(c)), id.slice(5)); if (l && l.kind) k = l.kind; } catch (e) { /* plan not ready */ } return { name: HOME_EN[k] || 'House', lv: castleLv(c), tier: tierOfLv(castleLv(c)), icon: ICON_HOME }; },
  state: () => ({ code: 'working', text: 'Lived in' }),
  body: () => rowsHtml([['Family', '— <small>soon</small>'], ['People', '— <small>soon</small>']]),
  primary: (id, c) => castleBtn(c), info: () => 'A home of the town. Its looks grow with the Castle level. Families and people arrive with the town update.',
};
const civicSpec = {
  ok: () => true,
  title: (id, c) => { let k = 'chapel'; try { const l = lotOf(civicLots(castleLv(c)), id.slice(6)); if (l && l.kind) k = l.kind; } catch (e) { /* plan not ready */ } const t = CIVIC_EN[k] || ['Town building', '']; return { name: t[0], lv: castleLv(c), tier: tierOfLv(castleLv(c)), icon: ICON_CIVIC, what: t[1] }; },
  state: () => ({ code: 'working', text: 'Open' }),
  body: (id, c) => { let k = 'chapel'; try { const l = lotOf(civicLots(castleLv(c)), id.slice(6)); if (l && l.kind) k = l.kind; } catch (e) { /* ignore */ } return `<div class="bsh-what">${esc((CIVIC_EN[k] || ['', ''])[1])}</div>`; },
  primary: (id, c) => castleBtn(c), info: () => 'Part of the town. Its level follows the Castle.',
};

for (const k of ['keep', 'wall', 'towers']) registerSheet(k, upgradeSpec(null));
registerSheet('forge', upgradeSpec('Upgrade armour'));
for (const f of FAMS) registerSheet(f, armySpec(f));
registerSheet('mine_', mineSpec); registerSheet('vault_', vaultSpec);
registerSheet('ws:', wsSpec); registerSheet('home:', homeSpec); registerSheet('civic:', civicSpec);
for (const id of LABEL_IDS) registerSheet(id, { label: true });

// ---------------------------------------------------------------------------------------------------------------- CSS (every selector starts with .bsh / .k-)
const CSS = `
.k-glass{background:linear-gradient(180deg,#0D2A5C,#050F26 40%,#020712);border:1px solid rgba(140,200,255,.32);box-shadow:inset 0 1px 0 rgba(200,230,255,.25),0 20px 60px rgba(0,0,0,.65)}
.k-plate{background:rgba(3,10,26,.72);border:1px solid rgba(140,200,255,.32)}
.bsh{position:absolute;z-index:45;left:12px;right:12px;bottom:calc(var(--sb) + 10px);max-width:520px;margin:0 auto;box-sizing:border-box;padding:8px 14px 14px;border-radius:20px;
  font-family:${FONT};font-weight:700;color:#e6f2ff;transform:translateY(112%);visibility:hidden;pointer-events:none;transition:transform 220ms cubic-bezier(.22,1,.36,1),visibility 0s linear 220ms}
.bsh.on{transform:none;visibility:visible;pointer-events:auto;transition:transform 320ms cubic-bezier(.22,1,.36,1),visibility 0s}
.bsh *{box-sizing:border-box}
.bsh-grip{width:36px;height:4px;border-radius:2px;background:rgba(170,215,255,.35);margin:0 auto 4px}
.bsh-h{display:flex;align-items:center;gap:10px}
.bsh-ic{flex:0 0 44px;height:44px;border-radius:10px;display:grid;place-items:center;color:var(--tc,#9fd8ff);background:radial-gradient(circle at 50% 30%,var(--tb,#1b3b78),#050c1c);border:1.5px solid var(--tc,#6fc0ff)}
.bsh-t{flex:1;min-width:0}
.bsh-t b{display:block;font:900 16px/1.2 ${DISPLAY};letter-spacing:.8px;text-transform:uppercase;color:#d9f2ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bsh-t span{display:block;margin-top:2px;font-size:12.5px;font-weight:400;color:#9fb8dc}
.bsh-x{flex:0 0 44px;width:44px;height:44px;margin-right:-6px;border-radius:10px;border:0;background:rgba(255,255,255,.07);color:#cfe6ff;font:700 16px/1 ${FONT};cursor:pointer;display:grid;place-items:center;-webkit-tap-highlight-color:transparent}
.bsh-st{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:14px;color:#e6f2ff;min-height:20px}
.bsh-st .tx{flex:1;min-width:0}
.bsh-st .tm{font-size:12.5px;font-weight:400;color:#9fd8ff;white-space:nowrap}
.bsh-st .dot{flex:0 0 10px;height:10px;border-radius:50%;background:#8fb4e0;box-shadow:0 0 0 2px rgba(255,255,255,.12)}
.bsh-st .dot.building{background:#6fe8ff}.bsh-st .dot.full{background:#7dffb5}.bsh-st .dot.working{background:#6fc4ff}.bsh-st .dot.locked{background:#6b7790}.bsh-st .dot.max{background:#ffd35e}
.bsh-bar{height:8px;margin-top:8px;border-radius:5px;background:#020814;border:1px solid rgba(120,190,255,.3);overflow:hidden}
.bsh-bar i{display:block;height:100%;transform-origin:0 50%;transform:scaleX(var(--p,0));background:linear-gradient(90deg,#2b86ff,#6fe8ff)}
.bsh-hs{margin-top:10px;font-size:12.5px;font-weight:400;color:#9fb8dc}.bsh-hs b{color:#e6f2ff}.bsh-hs em{font-style:normal;color:#8fe0ff}
.bsh-chips{display:flex;gap:8px;margin-top:10px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px;-webkit-overflow-scrolling:touch}.bsh-chips::-webkit-scrollbar{display:none}
.bsh-chip{flex:0 0 auto;width:68px;min-height:78px;padding:5px 3px;border-radius:10px;border:1px solid rgba(170,215,255,.28);background:rgba(255,255,255,.05);color:#dff0ff;font-family:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;-webkit-tap-highlight-color:transparent}
.bsh-chip.on{border-color:#BFE6FF;background:rgba(95,182,255,.22)}.bsh-chip.lk{opacity:.5}
.bsh-chip .pic{display:block;width:36px;height:36px}.bsh-chip .pic img{width:36px;height:36px}
.bsh-chip b{max-width:100%;font-size:11px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bsh-chip small{font-size:11px;font-weight:400;display:flex;gap:4px;align-items:center;white-space:nowrap}
.bsh-nx{display:flex;justify-content:space-between;gap:8px;margin-top:10px;font-size:12.5px;font-weight:400;color:#9fb8dc}
.bsh-st3{display:flex;gap:8px;margin-top:10px}.bsh-st3>div{flex:1;min-width:0;padding:8px 6px;border-radius:10px;background:rgba(95,182,255,.07);border:1px solid rgba(120,190,255,.2);text-align:center}
.bsh-st3 b{display:block;font-size:16px;color:#fff}.bsh-st3 span{display:block;margin-top:2px;font-size:11px;font-weight:400;color:#9fb8dc}
.bsh-rows{margin-top:10px}.bsh-rows>div{display:flex;justify-content:space-between;gap:10px;padding:7px 2px;border-bottom:1px solid rgba(255,255,255,.07);font-size:12.5px;font-weight:400;color:#9fb8dc}.bsh-rows b{color:#e6f2ff;font-weight:700;text-align:right}.bsh-rows small{font-size:11px;font-weight:400;color:#9fb8dc}
.bsh-what{margin-top:10px;font-size:14px;font-weight:400;line-height:1.5;color:#c4d6f0}
.bsh-go{margin-top:10px}
.bsh-row{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:8px;margin-top:8px}
.bsh-b{position:relative;overflow:hidden;width:100%;min-height:44px;padding:6px 8px;border-radius:10px;border:1px solid transparent;color:#fff;font:700 14px/1.15 ${FONT};cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
  -webkit-tap-highlight-color:transparent;transition:transform 200ms cubic-bezier(.22,1,.36,1),filter 200ms;touch-action:manipulation;user-select:none;-webkit-user-select:none}
.bsh-b:active{transform:scale(.94);filter:brightness(.92);transition-duration:90ms}
.bsh-b.pri{min-height:56px;border-color:#BFE6FF;background:linear-gradient(180deg,#6FC4FF,#1B4FB8);text-shadow:0 1px 0 rgba(0,20,60,.6)}
.bsh-b.sec{background:rgba(255,255,255,.06);border-color:rgba(170,215,255,.55);color:#dff0ff}
.bsh-b.prem{min-height:56px;border-color:#c8fbff;background:linear-gradient(180deg,#6ff0ff,#1b86c8);text-shadow:0 1px 0 rgba(0,40,70,.6)}
.bsh-b.dng{border-color:#ffb3c0;background:linear-gradient(180deg,#d6405a,#7e1228)}
.bsh-b.sec.on{border-color:#BFE6FF;background:rgba(95,182,255,.18)}
.bsh-b.dis{opacity:.45;filter:grayscale(.5)}.bsh-b.dis:active{transform:none;filter:grayscale(.5)}
.bsh-b .l{position:relative}.bsh-b small{position:relative;display:flex;gap:8px;align-items:center;justify-content:center;font-size:11px;font-weight:400;opacity:.95}
.bsh-b small span,.bsh-nx span span,.bsh-chip small span{display:inline-flex;align-items:center;gap:3px}.bsh .no{color:#ff9aa8}
.bsh .gem3,.bsh svg.gem3{width:17px;height:17px}.bsh-b small img,.bsh-chip small img,.bsh-nx img{width:17px;height:17px}
.bsh-b .fill{position:absolute;inset:0;background:rgba(255,255,255,.3);transform:scaleX(0);transform-origin:0 50%;pointer-events:none}
.bsh-b.holding .fill{transform:scaleX(1);transition:transform 600ms linear}
.bsh-info{display:none;margin-top:10px;padding:10px 12px;border-radius:10px;font-size:12.5px;font-weight:400;line-height:1.6;color:#b8cdea;background:rgba(95,182,255,.07);border:1px solid rgba(120,190,255,.2)}.bsh-info.on{display:block}
.bsh-dlg{position:absolute;inset:0;z-index:60;pointer-events:none;display:grid;place-items:center;padding:0 22px;background:rgba(0,3,10,.62);opacity:0;visibility:hidden;transition:opacity 180ms,visibility 0s linear 180ms;font-family:${FONT};font-weight:700;color:#e6f2ff}
.bsh-dlg.on{opacity:1;visibility:visible;pointer-events:auto;transition:opacity 180ms,visibility 0s}
.bsh-dlg .card{width:min(100%,340px);padding:18px;border-radius:20px}
.bsh-dlg .gem3,.bsh-dlg svg,.bsh-dlg img{display:inline-block;width:17px;height:17px;vertical-align:-3px}
.bsh-dlg h3{margin:0;font:900 16px/1.3 ${DISPLAY};letter-spacing:.6px;text-transform:uppercase;color:#d9f2ff}
.bsh-dlg p{margin:10px 0 0;font-size:14px;font-weight:400;line-height:1.5;color:#c4d6f0}
.bsh-dlg .btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px}
.bsh-lbl{position:absolute;z-index:44;left:50%;bottom:calc(var(--sb) + 120px);transform:translateX(-50%);padding:8px 14px;border-radius:14px;font:700 14px/1.2 ${FONT};color:#e6f2ff;white-space:nowrap;opacity:0;visibility:hidden;transition:opacity 180ms,visibility 0s linear 180ms;pointer-events:none}
.bsh-lbl.on{opacity:1;visibility:visible;transition:opacity 180ms,visibility 0s}
.bw-ui.bsh-on>.bwa-btn,.bw-ui.bsh-on>.bwa-chip,.bw-ui.bsh-on>.bwu-btn,.bw-ui.sheet-on>.bwa-btn,.bw-ui.sheet-on>.bwa-chip,.bw-ui.sheet-on>.bwu-btn{opacity:0;pointer-events:none}
@media (orientation:landscape) and (max-height:560px){.bsh{left:auto;right:calc(12px + var(--sr));width:min(380px,46vw);margin:0;padding:8px 12px 10px;max-height:calc(100% - var(--st) - 20px);overflow-y:auto}
  .bsh-grip{display:none}.bsh-st,.bsh-hs,.bsh-nx,.bsh-chips,.bsh-st3,.bsh-rows,.bsh-what{margin-top:6px}.bsh-bar{margin-top:6px}.bsh-go{margin-top:8px}.bsh-row{margin-top:6px}.bsh-b.pri,.bsh-b.prem{min-height:48px}
  .bsh-chip{min-height:68px}.bsh-chip .pic,.bsh-chip .pic img{width:28px;height:28px}}
`;

// ---------------------------------------------------------------------------------------------------------------- the sheet
export function createSheetUI(mount, { econ, ui, audio, upgrade, army, afterCollect } = {}) {
  const host = (ui && ui.root) || mount;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const sheet = document.createElement('div'); sheet.className = 'bsh k-glass'; sheet.setAttribute('role', 'dialog');
  const dlg = document.createElement('div'); dlg.className = 'bsh-dlg';
  const lbl = document.createElement('div'); lbl.className = 'bsh-lbl k-plate';
  host.appendChild(sheet); host.appendChild(dlg); host.appendChild(lbl);
  const S = { open: false, id: null, spec: null, info: false, fn: {}, down: false, hold: null, busy: false, rushed: false, tm: 0, lt: 0, dres: null, sel: {} };
  const now = () => econ.now();
  const toast = (m) => ui && ui.toast && ui.toast(m);
  const click = () => { audio && audio.click && audio.click(); ui && ui.haptic && ui.haptic('light'); };
  const c = { econ, ui, audio, up: upgrade, army, afterCollect, now, toast, sel: S.sel, close: () => close(), rush: (e, u) => rush(e, u), cancel: (e) => cancel(e) };

  // ---- confirmations
  function ask({ title, text, ok, no = 'Back', kind = 'pri' }) {
    return new Promise((res) => {
      S.dres = res;
      dlg.innerHTML = `<div class="card k-glass"><h3>${esc(title)}</h3><p>${text}</p><div class="btns"><button class="bsh-b sec" data-d="0">${esc(no)}</button><button class="bsh-b ${kind}" data-d="1">${esc(ok)}</button></div></div>`;
      dlg.classList.add('on');
    });
  }
  function answer(v) { dlg.classList.remove('on'); const r = S.dres; S.dres = null; if (r) r(v); }
  async function rush(e, u) {
    const cost = u.rush | 0;
    if (cost > 0 && (cost >= 50 || !S.rushed)) { const ok = await ask({ title: 'Finish now?', text: `Spend ${GEMS.turq}${fmtN(cost)} turquoise to finish the upgrade right away?`, ok: 'Rush', kind: 'prem' }); if (!ok) return; }
    S.rushed = true; await upgrade.act('speedup', e);
  }
  async function cancel(e) {
    const ok = await ask({ title: 'Cancel the upgrade?', text: 'You get back 50 %.', ok: 'Cancel upgrade', no: 'Keep going', kind: 'dng' });
    if (ok) await upgrade.act('cancel', e);
  }

  // ---- drawing
  const btnHtml = (b, k) => (b ? `<button class="bsh-b ${b.kind || 'sec'}${b.dis ? ' dis' : ''}" data-b="${k}"${b.hold ? ' data-hold="1"' : ''}><span class="l">${esc(b.label)}</span>${b.sub ? `<small>${b.sub}</small>` : ''}${b.hold ? '<i class="fill"></i>' : ''}</button>` : '');
  function render() {
    const sp = S.spec; if (!S.open || !sp) return;
    const id = S.id, T = sp.title(id, c), St = sp.state(id, c), P = sp.primary ? sp.primary(id, c) : null, B = sp.secondary ? sp.secondary(id, c) : null, M = sp.manage ? sp.manage(id, c) : null;
    S.fn = { p: P, s: B, mng: M ? { run: M } : null };
    const tier = T.tier || TIERS[0], keep = sheet.querySelector('[data-keep]'), sl = keep ? keep.scrollLeft : 0;
    const mv = sp.move ? sp.move(id, c) : null;
    S.fn.mv = mv || { dis: true, why: 'Moving buildings is coming soon' };
    sheet.innerHTML = `<div class="bsh-grip"></div>
      <div class="bsh-h"><div class="bsh-ic" style="--tc:${tier[1]};--tb:${tier[2]}">${T.icon || ''}</div><div class="bsh-t"><b>${esc(T.name)}</b><span>${T.lv ? 'Lv ' + T.lv + ' · ' + esc(tier[0]) : 'Not built'}</span></div><button class="bsh-x" data-b="x" aria-label="Close">✕</button></div>
      <div class="bsh-st"><i class="dot ${St.code}"></i><span class="tx">${esc(St.text)}</span>${St.end ? `<span class="tm" data-end="${St.end}">${fmtT(St.end - now())}</span>` : St.right ? `<span class="tm">${esc(St.right)}</span>` : ''}</div>
      ${St.bar != null ? bar(St.bar) : ''}${sp.body ? sp.body(id, c) : ''}
      ${P ? `<div class="bsh-go">${btnHtml(P, 'p')}</div>` : ''}
      <div class="bsh-row">${btnHtml(B, 's')}<button class="bsh-b sec${S.info ? ' on' : ''}" data-b="info"><span class="l">Info</span></button>${M ? '<button class="bsh-b sec" data-b="mng"><span class="l">Manage</span></button>' : ''}<button class="bsh-b sec${mv ? '' : ' dis'}" data-b="mv"><span class="l">Move</span>${mv ? '' : '<small>soon</small>'}</button></div>
      <div class="bsh-info${S.info ? ' on' : ''}">${esc(sp.info ? sp.info(id, c) : '')}</div>`;
    const k2 = sheet.querySelector('[data-keep]'); if (k2) { k2.scrollLeft = sl; const on = k2.querySelector('.on'); if (on && !sl) on.scrollIntoView({ inline: 'nearest', block: 'nearest' }); }
  }
  function refresh() { if (S.open && !S.down && !S.hold && !S.dres) render(); }
  const later = () => { clearTimeout(S.lt); S.lt = setTimeout(refresh, 30); };

  // ---- open / close
  function show(id, spec) {
    if (ui && ui.hide) ui.hide();
    S.id = id; S.spec = spec; S.info = false;
    if (!S.open) { S.open = true; host.classList.add('bsh-on'); clearInterval(S.tm); S.tm = setInterval(() => { if (!S.open) return; sheet.querySelectorAll('[data-end]').forEach((el) => { el.textContent = fmtT(+el.dataset.end - now()); }); refresh(); }, 1000); }
    render(); void sheet.offsetHeight; sheet.classList.add('on');
  }
  function close() { if (!S.open) return; S.open = false; S.id = null; S.spec = null; sheet.classList.remove('on'); host.classList.remove('bsh-on'); clearInterval(S.tm); if (S.dres) answer(false); }
  function showLabel(id) { const it = (tr().info[id] || [])[1] || nice(id), em = (tr().info[id] || [])[0] || ''; lbl.textContent = `${em} ${it}`.trim(); lbl.classList.add('on'); clearTimeout(S.lbT); S.lbT = setTimeout(() => lbl.classList.remove('on'), 1500); }
  function open(id, SM) {
    const r = resolveSheet(id, SM); if (!r) return false;
    if (r.spec.label) { close(); showLabel(id); return true; }
    try { if (r.spec.ok && !r.spec.ok(r.id, c)) return false; } catch (e) { return false; }            // (no data yet -> the old behaviour)
    try { show(r.id, r.spec); } catch (e) { console.warn('bsheet', e); close(); return false; }
    ui && ui.haptic && ui.haptic('light'); return true;
  }

  // ---- taps
  async function run(b) {
    if (!b) return;
    if (b.dis) { toast(b.why || 'Not possible'); return; }
    if (!b.run || S.busy) return; S.busy = true;
    try { await b.run(); } catch (e) { console.warn('bsheet action', e); toast('Not possible'); } finally { S.busy = false; later(); }
  }
  sheet.addEventListener('click', (e) => {
    const u = e.target.closest('[data-u]');
    if (u) { click(); const f = S.id, id = u.dataset.u, a = armyData(c); if (a && a.units[id] && !a.units[id].open) { toast(army.why(id) || 'Locked'); return; } S.sel[f] = id; render(); return; }
    const t = e.target.closest('[data-b]'); if (!t) return;
    const k = t.dataset.b; click();
    if (k === 'x') return close();
    if (t.dataset.hold) { if (!t.dataset.fired) toast('Hold to confirm'); delete t.dataset.fired; return; }
    if (k === 'info') { S.info = !S.info; return render(); }
    if (k === 'mng') { const m = S.fn.mng; close(); return m && m.run(); }
    if (k === 'mv') return run(S.fn.mv);
    run(S.fn[k]);
  });
  // hold-to-confirm (Rush): the fill runs 600 ms, a release before that cancels
  sheet.addEventListener('pointerdown', (e) => {
    S.down = true; const t = e.target.closest('[data-hold]'); if (!t) return;
    const b = S.fn[t.dataset.b]; if (!b || b.dis) return;
    t.classList.add('holding'); clearTimeout(S.hold);
    S.hold = setTimeout(() => { S.hold = null; t.classList.remove('holding'); t.dataset.fired = '1'; click(); run(b); }, 600);
  });
  const up = () => { S.down = false; if (S.hold) { clearTimeout(S.hold); S.hold = null; sheet.querySelectorAll('.holding').forEach((x) => x.classList.remove('holding')); } };
  window.addEventListener('pointerup', up, true); window.addEventListener('pointercancel', up, true);
  dlg.addEventListener('click', (e) => { const d = e.target.closest('[data-d]'); if (d) { click(); answer(d.dataset.d === '1'); } else if (e.target === dlg) answer(false); });
  if (econ && econ.on) econ.on(() => { if (S.open) later(); });

  const can = (id, SM) => { const r = resolveSheet(id, SM); if (!r || r.spec.label) return false; try { return !(r.spec.ok && !r.spec.ok(r.id, c)); } catch (e) { return false; } };     // RP1B: does this id have a real sheet right now? (the hero mode's door button asks, it never opens one that would not open)
  // RP1B: the town lots (cottages / civic buildings) with the footprint the town plan gives them at the player's castle level — the hero mode's door button asks here, read each time (a plan or level change is followed)
  const lots = () => { const lv = castleLv(c), out = []; try { for (const l of homeLots(lv)) out.push({ id: 'home:' + l.id, x: l.x, z: l.z, ry: l.ry || 0, w: l.w, d: l.d, r: l.r }); for (const l of civicLots(lv)) out.push({ id: 'civic:' + l.id, x: l.x, z: l.z, ry: l.ry || 0, w: l.w, d: l.d, r: l.r }); } catch (e) { /* plan not ready */ } return out; };
  return { tap: (id, SM) => open(id, SM), open, can, lots, close, isOpen: () => S.open, update: later };
}
