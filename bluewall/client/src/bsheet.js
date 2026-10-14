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
import { ico, emblemGlyph, injectKit } from './ui_theme.js';

const FONT = "'Libre Baskerville',Vazirmatn,Georgia,serif", DISPLAY = "Cinzel,'Libre Baskerville',Vazirmatn,Georgia,serif";
const GEMK = ['ruby', 'emerald', 'turq'];
const ST_IC = { building: 'clock', working: 'gear', idle: 'check', full: 'star', locked: 'lock', max: 'star' };
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
const costHtml = (cost, have) => GEMK.filter((g) => cost && cost[g]).map((g) => `<span class="cc${have && have[g] < cost[g] ? ' no' : ''}">${GEMS[g]}${fmtN(cost[g])}</span>`).join('');
const clockT = (s) => `<span class="tm">${ico('clock', 13)}${fmtT(s)}</span>`;
const nice = (k) => { const s = String(k || '').replace(/_/g, ' '); return s.charAt(0).toUpperCase() + s.slice(1); };
const castleLv = (c) => { const p = c.econ.st && c.econ.st.prog; return Math.max(1, Math.round((p && p.b && p.b.keep) || (c.econ.st && c.econ.st.level) || 1)); };
const tierOfLv = (lv) => TIERS[tierOf(Math.max(1, lv))];
const tierName = (lv) => tierOfLv(lv)[0];
const ICON_HOME = ico('home', 26), ICON_CIVIC = ico('civic', 26);
const bar = (f, q) => `<div class="bsh-bar"><i style="--p:${Math.max(0, Math.min(1, f)).toFixed(3)}"></i>${q != null ? `<i class="q" style="--p:${Math.max(0, Math.min(1, q)).toFixed(3)}"></i>` : ''}</div>`;

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
  if (btn.dis) return { label: label || 'Upgrade', sub: `<span class="why">${ico('lock', 13)}${esc(btn.label)}</span>` + (compact ? '' : costHtml(nx.cost, I.have)), kind: 'sec', dis: true, why: btn.label };
  if (compact) return { label: label || btn.label, kind: 'sec', run: () => c.up.act('start', e) };
  return { label: label ? `${label}` : btn.label, sub: costHtml(nx.cost, I.have) + clockT(nx.dur), kind: 'pri', run: () => c.up.act('start', e) };
}
function rushBtn(I, e, c) {
  const u = I.r.up; if (!u || u.reserved) return null;
  if (u.rush_cut === 0 && u.rush === 0 && !u.rush_full) return { label: 'Rush', sub: 'Daily limit reached', kind: 'prem', dis: true, why: 'Rush limit reached for today' };
  const free = !(u.rush > 0), cut = u.rush_full === false && u.rush_cut ? `−${fmtT(u.rush_cut)} ` : '';
  return { label: free ? 'Finish free' : 'Rush', sub: free ? '' : cut + GEMS.turq + fmtN(u.rush), kind: 'prem', hold: true, dis: !free && (I.have.turq | 0) < u.rush, why: 'Not enough turquoise', run: () => c.rush(e, u) };
}
const cancelBtn = (I, e, c) => (I.r.up ? { label: 'Cancel', kind: 'sec', run: () => c.cancel(e) } : null);
const secUp = (e, c) => { const I = c.up.info(e); if (!I) return null; return I.r.up ? (rushBtn(I, e, c)) : upBtn(I, e, c, 'Upgrade', true); };
const nextLine = (e, c) => { const I = c.up.info(e); if (!I || !I.r.next || !I.r.next.cost || I.r.up) return ''; return `<div class="bsh-nx"><span class="nl">${ico('up', 14)}Next · Lv ${I.r.next.to}</span><span class="nc">${costHtml(I.r.next.cost, I.have)}${clockT(I.r.next.dur)}</span></div>`; };
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
    const a = armyData(c), F = a.fam[f], q = F.q || [], qs = q.reduce((s, b) => s + b.n * (DEFS.units[b.u] ? DEFS.units[b.u].space : 1), 0), cap = Math.max(1, F.cap), u = selUnit(f, c, a), du = DEFS.units[u];
    const chips = famUnits(f).map((id) => { const row = a.units[id] || {}, d = DEFS.units[id], on = id === u; return `<button class="bsh-chip${on ? ' on' : ''}${row.open ? '' : ' lk'}" data-u="${id}" aria-label="${esc(UNIT_NAME[id] || id)}"><span class="pic">${unitPic(id, 46)}${row.open ? '' : `<em class="mk">${ico('lock', 13)}</em>`}${on ? `<em class="mk ok">${ico('check', 13)}</em>` : ''}</span><b>${esc(UNIT_NAME[id] || id)}</b><small>${row.open ? costHtml(d.cost, c.econ.st.gems) : 'Locked'}</small></button>`; }).join('');
    const ud = du ? `<div class="bsh-ud"><b>${esc(UNIT_NAME[u] || u)}</b><span>${ico('heart', 14)}${fmtN(du.hp)}</span><span>${ico('sword', 14)}${fmtN(du.dps)}</span><span>${ico('people', 14)}${du.space}</span><span>${ico('clock', 14)}${fmtT(du.t)}</span></div>` : '';
    const qh = q.length ? `<div class="bsh-q">${q.slice(0, 4).map((b) => `<div class="qi"><span class="pic">${unitPic(b.u, 28)}</span><b>×${b.n}</b><span class="tm" data-end="${b.fin}">${fmtT(b.fin - c.now())}</span></div>`).join('')}${q.length > 4 ? `<div class="qi more">+${q.length - 4}</div>` : ''}</div>` : '';
    return `<div class="bsh-hs">${ico('people', 16)}<span>Housing <b>${fmtN(F.used)}</b> / ${fmtN(F.cap)}${qs ? ` <em>+${qs} training</em>` : ''}</span></div>
      ${bar(F.used / cap, Math.min(1, (F.used + qs) / cap))}${qh}
      <div class="bsh-chips" data-keep="chips">${chips}</div>${ud}`;
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
  return { label: 'Collect', sub: `${GEMS[g]}+${fmtN(n)}`, kind: 'pri', rdy: !why, dis: !!why, why, run: async () => { const got = await c.econ.collect(g); if (c.afterCollect) c.afterCollect(); if (got > 0) c.toast(`+${fmtN(got)}`); } };
}
const mineSpec = {
  ok: (id, c) => baseOk(id, c) && !!mineOf(c, id.slice(5)), title: baseTitle,
  state: (id, c) => { const M = mineOf(c, id.slice(5)), I = c.up.info(id); if (M.ready >= M.cap) return { code: 'full', text: 'Full — collect now', bar: 1 }; return { code: 'working', text: `Digging · ${fmtN(Math.round(M.m.rate))} / h`, bar: M.cap ? M.ready / M.cap : 0, right: I.r.up ? `Upgrading → Lv ${I.r.up.to}` : '' }; },
  body: (id, c) => { const M = mineOf(c, id.slice(5)); return `<div class="bsh-st3">${stat('collect', fmtN(M.ready), 'Ready')}${stat('clock', fmtN(Math.round(M.m.rate)), 'Per hour')}${stat('box', fmtN(M.cap), 'Capacity')}</div>${nextLine(id, c)}`; },
  primary: (id, c) => collectBtn(id.slice(5), c), secondary: (id, c) => secUp(id, c), info: (id, c) => (tr().info[id] || [])[2] || c.up.info(id).desc, manage: (id, c) => () => c.up.focus(id),
};
const vaultSpec = {
  ok: (id, c) => baseOk(id, c) && !!mineOf(c, id.slice(6)), title: baseTitle,
  state: (id, c) => { const g = id.slice(6), have = c.econ.st.gems[g] || 0, cap = c.econ.st.vault[g] || 1; return have >= cap ? { code: 'full', text: `Vault full · ${fmtN(have)} / ${fmtN(cap)}`, bar: 1 } : { code: 'working', text: `Stored ${fmtN(have)} / ${fmtN(cap)}`, bar: have / cap }; },
  body: (id, c) => { const g = id.slice(6), M = mineOf(c, g); return `<div class="bsh-st3">${stat('vault', fmtN(c.econ.st.gems[g] || 0), 'Stored')}${stat('box', fmtN(c.econ.st.vault[g] || 0), 'Capacity')}${stat('mine', fmtN(M.ready), 'In the mine')}</div>${nextLine(id, c)}`; },
  primary: (id, c) => collectBtn(id.slice(6), c), secondary: (id, c) => secUp(id, c), info: (id, c) => (tr().info[id] || [])[2] || c.up.info(id).desc, manage: (id, c) => () => c.up.focus(id),
};

// the town: sites / houses / civic lots.  Their level follows the Castle (E1), so "Upgrade" = raise the Castle (opens its row, nothing is spent by the tap itself).
function castleBtn(c) {
  const I = c.up.info('keep'), lv = castleLv(c);
  if (!I || !I.r.next) return { label: 'Upgrade Castle', sub: 'Maximum level', kind: 'sec', dis: true, why: 'The Castle is at its maximum level' };
  return { label: 'Upgrade Castle', sub: `Lv ${lv} → ${lv + 1}`, kind: 'pri', run: () => { c.close(); c.up.focus('keep'); } };
}
const stat = (ic, v, label) => `<div>${ico(ic, 16)}<b>${v}</b><span>${label}</span></div>`;
const ROW_IC = { 'In store': 'box', 'Output / hour': 'clock', Workers: 'people', Family: 'home', People: 'people' };
const rowsHtml = (rows) => `<div class="bsh-rows">${rows.map(([k, v]) => `<div><span>${ico(ROW_IC[k] || 'info', 15)}${esc(k)}</span><b>${v}</b></div>`).join('')}</div>`;
const siteOf = (id) => { const sid = id.slice(3), s = siteById(sid); if (s) return s; const k = sid.replace(/[\d_]+$/, ''); return WS_KINDS[k] ? { id: sid, kind: k } : null; };
const wsSpec = {
  ok: (id) => !!siteOf(id),
  title: (id, c) => { const s = siteOf(id), lv = wsLevel(s, castleLv(c)); return { name: KIND_EN[s.kind] || nice(s.kind), lv, tier: tierOfLv(lv), icon: ico('gear', 26) }; },
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
.k-glass{background:var(--pl,linear-gradient(180deg,#0D2A5C,#050F26 40%,#020712));border:var(--bd,1px solid rgba(140,200,255,.32));box-shadow:var(--sh,inset 0 1px 0 rgba(200,230,255,.25),0 20px 60px rgba(0,0,0,.65))}
.k-plate{background:var(--lp,rgba(3,10,26,.72));border:var(--bd,1px solid rgba(140,200,255,.32))}
.bsh,.bsh-dlg,.bsh-lbl{--f:${FONT};--dsp:${DISPLAY};--r:18px;--pl:linear-gradient(180deg,#3c2a1b 0%,#291c11 52%,#1b120b 100%);--bd:1px solid #8a6a3a;--sh:inset 0 0 0 4px #1b120b,inset 0 0 0 5px rgba(196,154,84,.55),0 20px 56px rgba(0,0,0,.72);--lp:rgba(35,24,14,.92);
  --tx:#f4e8cc;--mu:#c9b48a;--ac:#e0b255;--card:linear-gradient(180deg,#ecdcb2,#d6bf8a);--cardb:1px solid #8a6a3a;--ct:#3a2a14;--cm:#6d5636;--chip:rgba(58,42,20,.14);--chipb:rgba(58,42,20,.35);--dchip:rgba(255,226,160,.1);--dchipb:rgba(196,154,84,.45);
  --pri:linear-gradient(180deg,#f5d583,#c0892a 54%,#8f6014);--prib:1px solid #4d300a;--prit:#2c1a05;--prism:inset 0 1px 0 rgba(255,244,200,.85),inset 0 -3px 0 rgba(70,40,6,.55),0 3px 0 #22140a;
  --sec:linear-gradient(180deg,#5b4731,#3b2c1c);--secb:1px solid #8a6a3a;--sect:#f4e8cc;--prem:linear-gradient(180deg,#ffe9a6,#d49a2a 54%,#9a6a14);--premb:1px solid #4d300a;--premt:#2c1a05;
  --barbg:#1b120b;--barbd:1px solid #8a6a3a;--barfg:linear-gradient(90deg,#c4872a,#f5d583);--barq:rgba(245,213,131,.3);--barh:12px}
.bsh{position:absolute;z-index:45;left:12px;right:12px;bottom:calc(var(--sb) + 10px);max-width:520px;margin:0 auto;box-sizing:border-box;padding:0 14px 14px;border-radius:var(--r,20px);overflow:hidden;
  font-family:var(--f,${FONT});font-weight:700;color:var(--tx,#e6f2ff);transform:translateY(112%);visibility:hidden;pointer-events:none;transition:transform 220ms cubic-bezier(.22,1,.36,1),visibility 0s linear 220ms}
.bsh.on{transform:none;visibility:visible;pointer-events:auto;transition:transform 320ms cubic-bezier(.22,1,.36,1),visibility 0s}
.bsh *{box-sizing:border-box}
.bsh .k-ic{display:block;flex:0 0 auto}
.bsh-orn{display:none;position:absolute;left:0;right:0;top:0;height:12px}
.bsh .bsh-orn{display:block;height:2px;left:12px;right:12px;top:9px;background:repeating-linear-gradient(90deg,#c49a54 0 6px,transparent 6px 12px);opacity:.8}
.bsh::before{content:"";position:absolute;inset:7px;pointer-events:none;background:radial-gradient(circle at 0 0,#d9b26a 0 3.2px,transparent 3.8px) 0 0/100% 100% no-repeat,radial-gradient(circle at 100% 0,#d9b26a 0 3.2px,transparent 3.8px) 0 0/100% 100% no-repeat,radial-gradient(circle at 0 100%,#d9b26a 0 3.2px,transparent 3.8px) 0 0/100% 100% no-repeat,radial-gradient(circle at 100% 100%,#d9b26a 0 3.2px,transparent 3.8px) 0 0/100% 100% no-repeat}
.bsh-grip{width:36px;height:4px;border-radius:2px;background:rgba(170,215,255,.32);margin:8px auto 6px}
.bsh .bsh-grip{display:none}
.bsh-h{display:flex;align-items:center;gap:12px;margin-top:6px}
.bsh-h{margin-top:16px}
.bsh-hw{position:relative;flex:0 0 64px;width:64px;height:64px}
.bsh-em{position:absolute;inset:0;display:grid;place-items:center;color:var(--tc,#9fd8ff)}
.bsh-em>svg{position:relative;width:32px;height:32px}
.bsh-lv{position:absolute;right:-8px;bottom:-6px;display:flex;align-items:center;justify-content:center;font-style:normal;line-height:1;white-space:nowrap}
.bsh-lv small{font-size:11px;font-weight:700;margin-right:2px;opacity:.85}
.bsh .bsh-em{border-radius:50%;background:linear-gradient(180deg,#f2cf7a,#8f6014);padding:3px}
.bsh .bsh-em::before{content:"";position:absolute;inset:4px;border-radius:50%;background:radial-gradient(circle at 50% 30%,#4a3622,#1b120b 80%);box-shadow:inset 0 2px 5px rgba(0,0,0,.7)}
.bsh .bsh-em>svg{color:var(--tc,#f4e8cc);filter:drop-shadow(0 1px 0 #000)}
.bsh .bsh-lv{width:28px;height:28px;border-radius:50%;background:linear-gradient(180deg,#f5d583,#a8721a);border:2px solid #4d300a;color:#2c1a05;font-size:13px;font-weight:900;right:-10px;bottom:-7px;box-shadow:0 2px 3px rgba(0,0,0,.5)}
.bsh .bsh-lv small{display:none}
.bsh-t{flex:1;min-width:0}
.bsh-t b{display:block;font:900 17px/1.2 var(--dsp,${DISPLAY});letter-spacing:.8px;text-transform:uppercase;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bsh-t span{display:block;margin-top:3px;font-size:12.5px;font-weight:400;color:var(--mu)}
.bsh-t span i{font-style:normal;font-weight:700;color:var(--tc,var(--ac))}
.bsh-x{flex:0 0 44px;width:44px;height:44px;margin-right:-6px;border-radius:12px;border:var(--secb,0);background:var(--sec,rgba(255,255,255,.07));color:var(--sect,#cfe6ff);cursor:pointer;display:grid;place-items:center;-webkit-tap-highlight-color:transparent}
.bsh-st{display:flex;align-items:center;gap:9px;margin-top:13px;font-size:14px;color:var(--tx);min-height:26px}
.bsh-st .tx{flex:1;min-width:0}
.bsh-st .tm{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;background:var(--dchip);border:1px solid var(--dchipb);font-size:12.5px;font-weight:700;color:var(--tx);white-space:nowrap}
.bsh-st .dot{flex:0 0 26px;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;color:#06122b;background:#8fb4e0}
.bsh-st .dot.building{background:#6fe8ff}.bsh-st .dot.full{background:#ffd35e}.bsh-st .dot.working{background:#7fc4ff}.bsh-st .dot.locked{background:#7c879c}.bsh-st .dot.max{background:#ffd35e}.bsh-st .dot.idle{background:#7dffb5}
.bsh-bar{position:relative;height:var(--barh,8px);margin-top:9px;border-radius:999px;background:var(--barbg);border:var(--barbd);overflow:hidden}
.bsh-bar i{position:absolute;inset:0;transform-origin:0 50%;transform:scaleX(var(--p,0));background:var(--barfg);z-index:1}
.bsh-bar i.q{background:var(--barq);z-index:0}
.bsh-hs{display:flex;align-items:center;gap:7px;margin-top:11px;font-size:13px;font-weight:400;color:var(--mu)}.bsh-hs b{color:var(--tx)}.bsh-hs em{font-style:normal;color:var(--ac)}
.bsh-q{display:flex;gap:6px;margin-top:9px;overflow:hidden}
.bsh-q .qi{display:flex;align-items:center;gap:5px;padding:3px 8px 3px 4px;border-radius:999px;background:var(--dchip);border:1px solid var(--dchipb);font-size:12px;color:var(--tx)}
.bsh-q .qi .pic,.bsh-q .qi img{display:block;width:24px;height:24px}.bsh-q .qi .tm{font-weight:400;color:var(--mu);padding:0;border:0;background:none}
.bsh-chips{display:flex;gap:9px;margin-top:9px;overflow-x:auto;scrollbar-width:none;padding:2px 1px 3px;-webkit-overflow-scrolling:touch}.bsh-chips::-webkit-scrollbar{display:none}
.bsh-chip{flex:0 0 auto;width:88px;min-height:98px;padding:8px 4px 6px;border-radius:14px;border:var(--cardb);background:var(--card);color:var(--ct);font-family:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;-webkit-tap-highlight-color:transparent}
.bsh-chip.on{border-color:var(--ac);box-shadow:0 0 0 1.5px var(--ac),0 4px 14px rgba(0,0,0,.35)}.bsh-chip.lk{opacity:.55}
.bsh-chip .pic{position:relative;display:block;width:44px;height:44px}.bsh-chip .pic img{width:44px;height:44px}
.bsh-chip .mk{position:absolute;right:-5px;bottom:-4px;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#1b2435;border:1px solid rgba(255,255,255,.25);color:#fff}
.bsh-chip .mk.ok{background:var(--ac);color:#10131c;border-color:transparent}
.bsh-chip b{max-width:100%;font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bsh-chip small{display:flex;flex-wrap:wrap;gap:2px 7px;justify-content:center;align-items:center;font-size:12px;font-weight:700;color:var(--cm)}
.bsh .bsh-chip .cc{padding:0;border:0;background:none;font-size:12px;color:var(--ct)}.bsh .bsh-chip .cc.no{background:none;border:0;color:#ff8a9a}
.bsh-ud{display:flex;align-items:center;gap:12px;margin-top:8px;font-size:12.5px;font-weight:700;color:var(--tx)}.bsh-ud b{flex:1;min-width:0;font-size:13.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bsh-ud span{display:inline-flex;align-items:center;gap:4px;color:var(--mu)}
.bsh-nx{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:4px 8px;margin-top:10px;padding:8px 10px;border-radius:12px;background:var(--dchip);border:1px solid var(--dchipb);font-size:12.5px;font-weight:400;color:var(--mu)}
.bsh-nx .nl{display:inline-flex;align-items:center;gap:5px;white-space:nowrap}.bsh-nx .nc{display:inline-flex;align-items:center;gap:6px;white-space:nowrap}
.bsh .cc{display:inline-flex;align-items:center;gap:3px;padding:2px 8px 2px 4px;border-radius:999px;background:var(--dchip);border:1px solid var(--dchipb);font-size:12.5px;font-weight:700;color:var(--tx);white-space:nowrap}
.bsh .cc.no{background:rgba(255,64,88,.34);border-color:#ff6b80;color:#fff}
.bsh .bsh-chip .cc{color:#3a2a14}.bsh .bsh-st3 .cc,.bsh .bsh-rows .cc{background:var(--chip);border-color:var(--chipb);color:#3a2a14}.bsh .bsh-chip .cc.no{color:#9a1228}
.bsh .tm{display:inline-flex;align-items:center;gap:4px;font-weight:400}
.bsh-st3{display:flex;gap:8px;margin-top:12px}.bsh-st3>div{flex:1;min-width:0;padding:10px 6px 9px;border-radius:14px;background:var(--card);border:var(--cardb);color:var(--ct);text-align:center;display:flex;flex-direction:column;align-items:center;gap:3px}
.bsh-st3 .k-ic{color:var(--ac)}.bsh .bsh-st3 .k-ic{color:#8f6014}
.bsh-st3 b{display:block;font-size:18px;line-height:1.1;color:var(--ct)}.bsh-st3 span{display:block;font-size:11.5px;font-weight:400;color:var(--cm)}
.bsh-rows{margin-top:12px;border-radius:14px;background:var(--card);border:var(--cardb);color:var(--ct);overflow:hidden}.bsh-rows>div{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-bottom:1px solid rgba(128,128,128,.18);font-size:13px;font-weight:400;color:var(--cm)}.bsh-rows>div:last-child{border-bottom:0}
.bsh-rows>div span{display:inline-flex;align-items:center;gap:8px}.bsh-rows .k-ic{color:var(--ac)}.bsh .bsh-rows .k-ic{color:#8f6014}.bsh-rows b{color:var(--ct);font-weight:700;text-align:right}.bsh-rows small{font-size:11.5px;font-weight:400;color:var(--cm)}
.bsh-what{margin-top:12px;padding:11px 12px;border-radius:14px;background:var(--card);border:var(--cardb);font-size:14px;font-weight:400;line-height:1.5;color:var(--ct)}
.bsh-go{margin-top:12px}
.bsh-row{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:8px;margin-top:9px}
.bsh-b{position:relative;overflow:hidden;width:100%;min-height:44px;padding:6px 8px;border-radius:14px;border:1px solid transparent;color:#fff;font:700 14px/1.15 var(--f,${FONT});cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
  -webkit-tap-highlight-color:transparent;transition:transform 200ms cubic-bezier(.22,1,.36,1),filter 200ms;touch-action:manipulation;user-select:none;-webkit-user-select:none}
.bsh-b:active{transform:scale(.95);filter:brightness(.92);transition-duration:90ms}
.bsh-b .l{position:relative;display:flex;align-items:center;justify-content:center;gap:7px}
.bsh-b.pri{min-height:56px;border:var(--prib);background:var(--pri);color:var(--prit);box-shadow:var(--prism);font-size:15.5px}
.bsh-b.sec{background:var(--sec);border:var(--secb);color:var(--sect);font-size:12.5px;min-height:48px}
.bsh-b.prem{min-height:56px;border:var(--premb);background:var(--prem);color:var(--premt);font-size:15.5px}
.bsh-b.dng{border-color:#ffb3c0;background:linear-gradient(180deg,#d6405a,#7e1228)}
.bsh-row .bsh-b .l{flex-direction:column;gap:4px}.bsh-row .bsh-b.prem{min-height:48px;font-size:12.5px}
.bsh-h.lk .bsh-hw{filter:grayscale(.85);opacity:.75}
.bsh-b.sec.on{border-color:var(--ac);box-shadow:inset 0 0 0 1px var(--ac)}
.bsh-b.dis{opacity:.5;filter:grayscale(.55)}.bsh-b.dis:active{transform:none;filter:grayscale(.55)}
.bsh-go .bsh-b.sec.dis{min-height:56px;flex-direction:column}
.bsh-go .bsh-b.sec.dis{opacity:1;filter:none}.bsh-go .bsh-b.sec.dis .l{opacity:.6}
.bsh-b small{position:relative;display:flex;gap:6px;flex-wrap:wrap;align-items:center;justify-content:center;font-size:12px;font-weight:400}
.bsh-b.pri .cc,.bsh-b.prem .cc{background:rgba(0,12,40,.42);border-color:rgba(255,255,255,.25);color:#fff}.bsh-b.pri .cc.no{background:rgba(120,0,20,.55);border-color:#ff9aa8;color:#ffe1e6}
.bsh .bsh-b.pri .cc,.bsh .bsh-b.prem .cc{background:rgba(44,26,5,.22);border-color:rgba(44,26,5,.5);color:#2c1a05}.bsh .bsh-b.pri .cc.no{background:#7b0f22;border-color:#4d0a14;color:#fff}.bsh .bsh-b.pri .tm{color:#2c1a05}
.bsh-b .why{display:inline-flex;align-items:center;gap:5px;font-weight:700;color:var(--sect)}
.bsh-b .fill{position:absolute;inset:0;background:rgba(255,255,255,.3);transform:scaleX(0);transform-origin:0 50%;pointer-events:none}
.bsh-b.holding .fill{transform:scaleX(1);transition:transform 600ms linear}
.bsh-b.rdy{box-shadow:var(--prism),0 0 0 2px rgba(255,214,102,.95),0 0 20px rgba(255,200,80,.5)}
.bsh-b .pulse{position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 3px #ffe08a,0 0 24px 6px rgba(255,214,102,.8);opacity:0;pointer-events:none}
.bsh-info{display:none;margin-top:10px;padding:10px 12px;border-radius:14px;font-size:12.5px;font-weight:400;line-height:1.6;color:var(--ct);background:var(--card);border:var(--cardb)}.bsh-info.on{display:block}
.bsh-dlg{position:absolute;inset:0;z-index:60;pointer-events:none;display:grid;place-items:center;padding:0 22px;background:rgba(0,3,10,.62);opacity:0;visibility:hidden;transition:opacity 180ms,visibility 0s linear 180ms;font-family:var(--f,${FONT});font-weight:700;color:var(--tx,#e6f2ff)}
.bsh-dlg.on{opacity:1;visibility:visible;pointer-events:auto;transition:opacity 180ms,visibility 0s}
.bsh-dlg .card{width:min(100%,340px);padding:18px;border-radius:var(--r,20px)}
.bsh-dlg .gem3,.bsh-dlg svg,.bsh-dlg img{display:inline-block;width:17px;height:17px;vertical-align:-3px}
.bsh-dlg h3{margin:0;font:900 16px/1.3 var(--dsp,${DISPLAY});letter-spacing:.6px;text-transform:uppercase;color:var(--tx)}
.bsh-dlg p{margin:10px 0 0;font-size:14px;font-weight:400;line-height:1.5;color:var(--mu)}
.bsh-dlg .btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px}
.bsh-lbl{position:absolute;z-index:44;left:50%;bottom:calc(var(--sb) + 120px);transform:translateX(-50%);padding:8px 14px;border-radius:14px;font:700 14px/1.2 var(--f,${FONT});color:var(--tx,#e6f2ff);white-space:nowrap;opacity:0;visibility:hidden;transition:opacity 180ms,visibility 0s linear 180ms;pointer-events:none}
.bsh-lbl.on{opacity:1;visibility:visible;transition:opacity 180ms,visibility 0s}
.bsh .gem3,.bsh svg.gem3{width:17px;height:17px}.bsh .cc img,.bsh-chip small img,.bsh-nx img{width:17px;height:17px}
/* the sheet lifts the whole UI layer above anything else that is stacked on the stage (e.g. the hero's touch layer + buttons at z 40), so its buttons are always the ones that get the tap */
.bw-ui.bsh-on{z-index:45}
.bw-ui.bsh-on>.bwa-btn,.bw-ui.bsh-on>.bwa-chip,.bw-ui.bsh-on>.bwu-btn,.bw-ui.sheet-on>.bwa-btn,.bw-ui.sheet-on>.bwa-chip,.bw-ui.sheet-on>.bwu-btn{opacity:0;pointer-events:none}
@media (orientation:landscape) and (max-height:560px){.bsh{left:auto;right:calc(12px + var(--sr));width:min(590px,70vw);margin:0;padding:0 12px 10px;max-height:calc(100% - var(--st) - 16px);overflow-y:auto;display:grid;grid-template-columns:minmax(0,1fr) 190px;column-gap:12px;align-items:start}
  .bsh-grip,.bsh-orn{display:none!important}.bsh-main{min-width:0}.bsh-act{display:flex;flex-direction:column;gap:8px;margin-top:14px}.bsh-act .bsh-go{margin:0}.bsh-act .bsh-row{margin:0;grid-auto-flow:row;grid-template-columns:1fr 1fr}.bsh-act .bsh-info{margin:0}
  .bsh-st,.bsh-hs,.bsh-nx,.bsh-chips,.bsh-st3,.bsh-rows,.bsh-what,.bsh-q{margin-top:7px}.bsh-ud{display:none}.bsh-bar{margin-top:6px}.bsh-h{margin-top:12px}.bsh-b.pri,.bsh-b.prem{min-height:52px}
  .bsh-chip{min-height:88px;width:80px;padding:6px 3px 5px}.bsh-chip .pic,.bsh-chip .pic img{width:34px;height:34px}.bsh-hw{flex-basis:52px;width:52px;height:52px}.bsh-em>svg{width:26px;height:26px}.bsh-st3>div{padding:7px 4px 6px}.bsh-st3 b{font-size:16px}}
`;

// ---------------------------------------------------------------------------------------------------------------- the sheet
export function createSheetUI(mount, { econ, ui, audio, upgrade, army, afterCollect } = {}) {
  const host = (ui && ui.root) || mount;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  injectKit();                                                                       // UI1: the same tokens for the old info sheet + the Kingdom page (ui_theme.js)
  const sheet = document.createElement('div'); sheet.className = 'bsh k-glass'; sheet.setAttribute('role', 'dialog');
  const dlg = document.createElement('div'); dlg.className = 'bsh-dlg';
  const lbl = document.createElement('div'); lbl.className = 'bsh-lbl k-plate';
  host.appendChild(sheet); host.appendChild(dlg); host.appendChild(lbl);
  const S = { open: false, id: null, spec: null, info: false, fn: {}, down: false, hold: null, busy: false, rushed: false, tm: 0, lt: 0, dres: null, sel: {}, pulsed: null, pulseUntil: 0 };
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
  const btnIc = (b) => (/^Train/.test(b.label) ? 'train' : /^Collect/.test(b.label) ? 'collect' : /^(Rush|Finish)/.test(b.label) ? 'bolt' : /^Cancel/.test(b.label) ? 'x' : /^Max/.test(b.label) ? 'star' : /^(Upgrade|Build|Reserve)/.test(b.label) ? 'up' : '');
  const btnHtml = (b, k) => (b ? `<button class="bsh-b ${b.kind || 'sec'}${b.dis ? ' dis' : ''}${b.rdy ? ' rdy' : ''}" data-b="${k}"${b.hold ? ' data-hold="1"' : ''}><span class="l">${btnIc(b) ? ico(btnIc(b), k === 'p' ? 19 : 20) : ''}${esc(b.label)}</span>${b.sub ? `<small>${b.sub}</small>` : ''}${b.hold ? '<i class="fill"></i>' : ''}${b.rdy ? '<i class="pulse"></i>' : ''}</button>` : '');
  function pulse() { const el = sheet.querySelector('.bsh-b.rdy .pulse'); if (!el || !el.animate) return; S.pulseUntil = performance.now() + 1000; el.animate([{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'scale(1)', offset: 0.35 }, { opacity: 0, transform: 'scale(1.03)' }], { duration: 900, easing: 'cubic-bezier(.22,1,.36,1)' }); }
  function render() {
    const sp = S.spec; if (!S.open || !sp) return;
    const id = S.id, T = sp.title(id, c), St = sp.state(id, c), P = sp.primary ? sp.primary(id, c) : null, B = sp.secondary ? sp.secondary(id, c) : null, M = sp.manage ? sp.manage(id, c) : null;
    S.fn = { p: P, s: B, mng: M ? { run: M } : null };
    const tier = T.tier || TIERS[0], keep = sheet.querySelector('[data-keep]'), sl = keep ? keep.scrollLeft : 0;
    const mv = sp.move ? sp.move(id, c) : null;
    S.fn.mv = mv || { dis: true, why: 'Moving buildings is coming soon' };
    sheet.innerHTML = `<div class="bsh-orn"></div><div class="bsh-grip"></div><div class="bsh-main">
      <div class="bsh-h${St.code === 'locked' ? ' lk' : ''}"><div class="bsh-hw" style="--tc:${tier[1]};--tb:${tier[2]}"><div class="bsh-em">${emblemGlyph(id, 32)}</div>${T.lv ? `<i class="bsh-lv"><small>Lv</small>${T.lv}</i>` : ''}</div><div class="bsh-t"><b>${esc(T.name)}</b><span>${T.lv ? 'Lv ' + T.lv + ' · <i>' + esc(tier[0]) + '</i>' : 'Not built'}</span></div><button class="bsh-x" data-b="x" aria-label="Close">${ico('x', 18)}</button></div>
      <div class="bsh-st"><i class="dot ${St.code}">${ico(ST_IC[St.code] || 'info', 15)}</i><span class="tx">${esc(St.text)}</span>${St.end ? `<span class="tm">${ico('clock', 13)}<em data-end="${St.end}" style="font-style:normal">${fmtT(St.end - now())}</em></span>` : St.right ? `<span class="tm">${esc(St.right)}</span>` : ''}</div>
      ${St.bar != null ? bar(St.bar) : ''}${sp.body ? sp.body(id, c) : ''}</div>
      <div class="bsh-act">${P ? `<div class="bsh-go">${btnHtml(P, 'p')}</div>` : ''}
      <div class="bsh-row">${btnHtml(B, 's')}<button class="bsh-b sec${S.info ? ' on' : ''}" data-b="info"><span class="l">${ico('info', 20)}Info</span></button>${M ? `<button class="bsh-b sec" data-b="mng"><span class="l">${ico('list', 20)}Manage</span></button>` : ''}<button class="bsh-b sec${mv ? '' : ' dis'}" data-b="mv"><span class="l">${ico('move', 20)}Move</span>${mv ? '' : '<small>soon</small>'}</button></div>
      <div class="bsh-info${S.info ? ' on' : ''}">${esc(sp.info ? sp.info(id, c) : '')}</div></div>`;
    const k2 = sheet.querySelector('[data-keep]'); if (k2) { k2.scrollLeft = sl; const on = k2.querySelector('.on'); if (on && !sl) on.scrollIntoView({ inline: 'nearest', block: 'nearest' }); }
    if (P && P.rdy) { if (S.pulsed !== id) { S.pulsed = id; pulse(); } } else S.pulsed = null;      // the gold pulse: ONCE per "ready" (never endless)
  }
  function refresh() { if (S.open && !S.down && !S.hold && !S.dres && !(performance.now() < S.pulseUntil)) render(); }
  const later = () => { clearTimeout(S.lt); S.lt = setTimeout(refresh, 30); };

  // ---- open / close
  function show(id, spec) {
    if (ui && ui.hide) ui.hide();
    S.id = id; S.spec = spec; S.info = false; S.pulsed = null;
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
  // RP1C: what a door orb says about a sheet — 'gold' (something to collect), 'green' (this building can be upgraded now), 'blue' (nothing to do), null (no sheet).  Read-only: opens and runs nothing.
  const peek = (id, SM) => { const r = resolveSheet(id, SM); if (!r || r.spec.label) return null; try { if (r.spec.ok && !r.spec.ok(r.id, c)) return null; const P = r.spec.primary ? r.spec.primary(r.id, c) : null; if (P && P.label === 'Collect' && !P.dis) return 'gold'; const I = c.up.info(r.id); if (I && I.btn && !I.btn.dis && I.r && I.r.next && !I.r.up) return 'green'; } catch (e) { /* no data yet: blue */ } return 'blue'; };
  return { tap: (id, SM) => open(id, SM), open, can, lots, peek, close, isOpen: () => S.open, update: later };
}
