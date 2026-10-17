// Home controls. The HUD has exactly ONE button: Assist (a medium circle, bottom right, no text beside it).
// Everything else is inside the hub it opens: a wide ATTACK tile on top (the crossed swords + a ring that fills with how
// ready the army is), then tiles — Build (free builders / next finish), Army (training / ready %), Shop, Rank, Clan, Friends,
// Log, Settings, Banner. Nothing else sits on the home screen.
// It only calls the other panels (upgradeui / armyui / rankui / socialui); none of their logic lives here.
// Navigation (p22): a panel opened from the hub gets a "‹" back button in its header that returns to the hub, and Telegram's own
// Back button (top-left in the Mini App) is live whenever the hub or a panel is open: hub -> map, panel -> hub (or map if opened directly).
//   createAssist(mount, { econ, ui, audio, army, upgrade, rank, social, shop, tg }) -> { update(), openHub(), closeHub(), back() }
import { crestImg } from './emblems.js';
import { leagueIdx } from './cups.js';
import { ico } from './ui_icons.js';                                       // UI3: the one icon set
import { T as TK, G as GK, A as AK, mix, FONT, fs } from './ui_tokens.js';        // UI3: the one colour / font file

const fmtN = (n) => Math.floor(n).toLocaleString('en-US');
const fmtT = (s) => { s = Math.max(0, Math.ceil(s)); const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), q = s % 60; return d ? d + 'd ' + h + 'h' : h ? h + 'h ' + String(m).padStart(2, '0') + 'm' : m + ':' + String(q).padStart(2, '0'); };
const CSS = `
/* ---- UI3: the Assist button — a 48 px silver-bezel round button with the sword-and-hammer glyph; it shows a steady ring (no motion) when something waits */
.bwh-btn{pointer-events:auto;position:absolute;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}
.bw-ui.wel>.bwh-btn{opacity:0;pointer-events:none}
.bwh-btn{right:calc(14px + var(--sr));bottom:calc(var(--sb) + 14px);width:48px;height:48px;cursor:pointer}
.bwh-btn:before{content:"";position:absolute;left:-6px;right:-6px;top:-6px;bottom:-6px}
.bwh-btn:active{transform:scale(.92)}
.bwh-btn .bez{position:absolute;inset:0;border-radius:50%;background:${GK.ring};box-shadow:0 4px 12px rgba(0,0,0,.6),0 0 0 1.5px ${TK.n0},inset 0 1px 1px rgba(255,255,255,.7)}
.bwh-btn .core{position:absolute;inset:3.5px;border-radius:50%;display:grid;place-items:center;color:${TK.ice};background:${GK.core};box-shadow:inset 0 2px 5px ${AK('ice',.32)},inset 0 -4px 8px rgba(0,0,0,.5),0 0 0 1px ${TK.n0}}
.bwh-btn .core svg{width:26px;height:26px;display:block;filter:drop-shadow(0 1px 1px rgba(0,0,0,.6))}
.bwh-btn .pulse{position:absolute;inset:-1px;border-radius:50%;box-shadow:0 0 0 2px ${AK('ice2',.95)},${GK.glow};opacity:0;pointer-events:none}
.bwh-btn.hot .pulse{opacity:1}
.bwh-btn .bd{position:absolute;right:-4px;top:-4px;min-width:20px;height:20px;padding:0 5px;box-sizing:border-box;border-radius:10px;background:linear-gradient(${TK.ok},${mix('ok','n0',.35)});border:1.5px solid ${TK.n0};color:${TK.n0};font-size:11px;font-weight:700;line-height:17px;text-align:center;font-variant-numeric:tabular-nums;z-index:2}
.bwh-btn .bd:empty{display:none}
/* ---- the hub: ONE small panel (header + a 6-column grid: the ATTACK tile takes two cells, the nine tiles follow) — about 200 px high, never more than 70 % of the screen */
.bwh{position:absolute;inset:0;pointer-events:auto;z-index:12;background:${AK('n0',.5)};opacity:0;visibility:hidden;font-family:${FONT};color:${TK.ink};-webkit-tap-highlight-color:transparent}
.bwh.on{opacity:1;visibility:visible}.bwh *{box-sizing:border-box}
.bwh-pan{position:absolute;left:calc((var(--sl) + 100% - var(--sr)) / 2);top:calc((var(--st) + 100% - var(--sb)) / 2);transform:translate(-50%,-50%);width:min(600px,calc(74% - var(--sl) - var(--sr)));max-height:68%;overflow-y:auto;overscroll-behavior:contain;
  display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;padding:8px 10px 10px;border-radius:16px;background:${GK.panel};border:1px solid ${TK.line};box-shadow:${GK.plate},${GK.shadow}}
.bwh-h{grid-column:1/-1;display:flex;align-items:center;gap:10px;min-height:40px;padding:0 0 2px}
.bwh-h .cr{flex:0 0 auto;width:32px;height:34px;display:grid;place-items:center;filter:drop-shadow(0 2px 3px rgba(0,0,0,.6))}.bwh-h .cr img{width:30px;height:auto}
.bwh-h .tt{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;line-height:1.15}
.bwh-h .tt b{font-size:16px;letter-spacing:2px;text-transform:uppercase;color:${TK.ink}}
.bwh-h .tt span{font-size:11px;color:${TK.mute};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bwh-x{flex:0 0 auto;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:${GK.btn};border:1px solid ${TK.line};color:${TK.ink};cursor:pointer}
.bwh-x svg{width:18px;height:18px;display:block}
.bwh-x:active{transform:scale(.9)}
.bwh-sep{display:none}
.bwh-g{display:contents}
.bwh-a{position:relative;grid-column:span 2;display:flex;align-items:center;gap:8px;min-height:64px;padding:6px 8px;border-radius:14px;cursor:pointer;overflow:hidden;color:${TK.inkOn};background:${GK.accent};border:1px solid ${TK.blue2};box-shadow:${GK.emb},0 3px 8px rgba(0,0,0,.4)}
.bwh-a:active{transform:scale(.97)}
.bwh-a .bz{flex:0 0 auto;width:46px;height:46px;padding:3px;border-radius:50%;background:${GK.ring};box-shadow:0 2px 6px rgba(0,0,0,.45)}
.bwh-a .ring{position:relative;width:40px;height:40px;border-radius:50%;background:conic-gradient(from 0deg,${TK.ice} calc(var(--p,0) * 1%),${TK.n0} 0);box-shadow:0 0 0 1.5px ${TK.n0}}
.bwh-a .core{position:absolute;left:4px;top:4px;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;color:${TK.ice};background:${GK.core};box-shadow:inset 0 1px 4px ${AK('ice',.3)}}
.bwh-a .core svg{width:20px;height:20px;display:block}
.bwh-a .tx{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px}
.bwh-a .tx b{font-size:14.5px;letter-spacing:1.6px;text-transform:uppercase;line-height:17px;color:${TK.inkOn}}
.bwh-a .tx small{font-size:11px;color:${TK.n2};font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
.bwh-a .ch{flex:0 0 auto;width:16px;height:16px;color:${TK.inkOn}}
.bwh-a.hot{background:${GK.accent2};border-color:${TK.inkOn};box-shadow:${GK.emb},0 0 0 2px #ffffff,0 3px 10px rgba(0,0,0,.45)}
.bwh-a.off{filter:grayscale(.55) brightness(.85)}
.bwh-t{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:2px;padding:6px 2px 5px;min-height:64px;border-radius:12px;cursor:pointer;color:${TK.ink};background:${GK.panel2};border:1px solid ${TK.line};box-shadow:inset 0 1px 0 ${AK('ice',.18)}}
.bwh-t:active{transform:scale(.94);border-color:${TK.ice}}
.bwh-t .ic{position:relative;width:32px;height:32px;border-radius:50%;padding:2px;background:${GK.ring};box-shadow:0 2px 5px rgba(0,0,0,.5)}
.bwh-t .ic>i{position:absolute;inset:2px;border-radius:50%;display:grid;place-items:center;color:${TK.ice};background:${GK.core};font-style:normal}
.bwh-t .ic svg{width:18px;height:18px;display:block}
.bwh-t .ic img{width:20px;height:auto;display:block}
.bwh-t b{font-size:${fs(12)}px;letter-spacing:.3px;color:${TK.ink};font-weight:700;line-height:14px}
.bwh-t small{font-size:${fs(10.5)}px;line-height:15px;color:${TK.mute};white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
.bwh-t .bd{position:absolute;right:-2px;top:-4px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:linear-gradient(${TK.ok},${mix('ok','n0',.35)});border:1.5px solid ${TK.n0};color:${TK.n0};font-size:10.5px;font-weight:700;line-height:15px;text-align:center}.bwh-t .bd:empty{display:none}
/* the "‹" back button the hub puts into a panel it opened (returns to the hub) */
.bwnav{flex:0 0 auto;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;cursor:pointer;color:${TK.ink};background:${GK.btn};border:1px solid ${TK.line};box-shadow:inset 0 1px 0 ${AK('ice',.22)};-webkit-tap-highlight-color:transparent}
.bwnav:active{transform:scale(.9)}.bwnav svg{width:20px;height:20px}
.bw-ui .bwa-btn,.bw-ui .bwa-chip,.bw-ui .bwu-btn,.bw-ui .bwk-chip{display:none!important}
`;

const BACK = ico('back', 20);
const CHEV = ico('chev', 16, 'ch');
const esc = (x) => String(x == null ? '' : x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createAssist(mount, { econ, ui, audio, army, upgrade, rank, social, shop, tg = null } = {}) {
  const host = (ui && ui.root) || mount;
  const stEl = document.createElement('style'); stEl.textContent = CSS; document.head.appendChild(stEl);
  const btn = document.createElement('div'); btn.className = 'bwh-btn'; btn.setAttribute('role', 'button'); btn.setAttribute('aria-label', 'Assist');
  btn.innerHTML = `<div class="bez"></div><div class="core">${ico('assist', 26)}</div><i class="pulse"></i><div class="bd"></div>`;   // (owner's pick: a real sword crossed over a smith's hammer — now with hammer B)
  const hub = document.createElement('div'); hub.className = 'bwh';
  hub.innerHTML = `<div class="bwh-pan"><div class="bwh-h"><div class="cr"></div><div class="tt"><b>Assist</b><span>&nbsp;</span></div><div class="bwh-x" data-a="x" role="button" aria-label="Close">${ico('x', 18)}</div></div><div class="bwh-sep"></div>`
    + `<div class="bwh-a" data-a="attack" role="button" aria-label="Attack"><div class="bz"><div class="ring"><div class="core">${ico('swords', 20)}</div></div></div><div class="tx"><b>Attack</b><small>&nbsp;</small></div>${CHEV}</div>`
    + `<div class="bwh-g"></div></div>`;
  host.appendChild(btn); host.appendChild(hub);
  const G = hub.querySelector('.bwh-g'), AT = hub.querySelector('.bwh-a'), ATs = AT.querySelector('small'), ATr = AT.querySelector('.ring'), CR = hub.querySelector('.bwh-h .cr'), SUB = hub.querySelector('.bwh-h .tt span');
  const S = { open: false, ret: null };
  const click = () => { audio && audio.click && audio.click(); ui && ui.haptic && ui.haptic('light'); };
  const now = () => (econ && econ.now ? econ.now() : Date.now() / 1000);
  const P = () => econ && econ.st && econ.st.prog;
  const A = () => econ && econ.st && econ.st.army;

  // ---- the attack tile: the ring fills with how ready the army is
  function paintAttack() {
    const a = A(); if (!a || !a.fam || !a.spell) { AT.style.display = 'none'; return; }
    AT.style.display = '';
    const rd = Math.max(0, Math.min(100, Math.round(+a.ready || 0)));
    const sub = !a.attack ? 'Attacks are not open yet' : a.space <= 0 ? 'Train an army first' : rd + '% ready';
    if (ATs.textContent !== sub) ATs.textContent = sub;
    ATr.style.setProperty('--p', rd);
    AT.classList.toggle('hot', rd >= 80 && !!a.attack); AT.classList.toggle('off', !a.attack || a.space <= 0);
  }

  // ---- the hub tiles. Build / Army carry the work status that used to sit on the home screen (builders, training queue)
  function tiles() {
    const p = P(), a = A(), t = Math.max(0, (econ.st && econ.st.tro) || 0), tn = now();
    let bsub = 'Kingdom';
    if (p && p.builders) {
      const busy = Object.values(p.structs || {}).filter((r) => r.up && !r.up.reserved), total = p.builders, free = Math.max(0, total - busy.length);
      if (free > 0) bsub = free + '/' + total + ' free';
      else { const nx = busy.reduce((m, r) => Math.min(m, r.up.end), Infinity); bsub = isFinite(nx) ? 'Next ' + fmtT(nx - tn) : 'All busy'; }
    }
    let asub = '';
    if (a && a.fam) {
      const lanes = [...Object.values(a.fam).map((f) => f.q), a.spell && a.spell.q].filter((q) => q && q.length);
      if (lanes.length) {
        const fin = lanes.reduce((m, q) => Math.max(m, q[q.length - 1].fin || 0), 0), n = lanes.reduce((s, q) => s + q.reduce((x, b) => x + (b.n || 0), 0), 0);
        asub = fmtN(n) + ' · ' + (fin > tn ? fmtT(fin - tn) : 'done');
      } else asub = (a.ready != null ? Math.round(a.ready) : 0) + '% ready';
    }
    const tag = social && social.clanTag ? social.clanTag() : '', un = social && social.unseen ? social.unseen() : 0;
    const li = leagueIdx(t), L = [
      ['build', ico('hammer', 18), 'Build', bsub, ''],
      ['army', ico('helm', 18), 'Army', asub, ''],
      ['shop', ico('bag', 18), 'Shop', 'Gems & chests', ''],
      ['rank', ico('cup', 18), 'Rank', fmtN(t) + ' cups', ''],
      ['clan', ico('clan', 18), 'Clan', tag ? '[' + esc(tag) + ']' : 'Join', ''],
      ['friends', ico('friends', 18), 'Friends', 'Invite', ''],
      ['log', ico('log', 18), 'Log', un ? un + ' new' : 'History', un ? String(un) : ''],
      ['set', ico('gear', 18), 'Settings', '', ''],
      ['banner', crestImg((econ.st && econ.st.emblem) || 'swords', 22, 'crest', 'display:block'), 'Banner', 'Crest', ''],
    ];
    L.li = li; return L;
  }
  // The tiles are built once; afterwards only their status texts are patched, so a finger that is on a tile is never lost
  function paintHub() {
    paintAttack();
    const em = (econ.st && econ.st.emblem) || 'swords';
    if (CR.dataset.e !== em) { CR.dataset.e = em; CR.innerHTML = crestImg(em, 30, 'crest', 'display:block'); }
    const nm = (econ.st && econ.st.name) || '', lv = (econ.st && econ.st.level) || 1, sub = (nm ? nm + ' · ' : '') + 'Keep ' + lv;
    if (SUB.textContent !== sub) SUB.textContent = sub;
    const T = tiles(), sig = T.map((x) => x[0] + '\u0001' + x[2]).join('\u0002') + '\u0003' + T.li + '\u0004' + em;     // NOT the icon markup: it carries fresh ids every call
    if (G.dataset.sig !== sig) {
      G.dataset.sig = sig;
      G.innerHTML = T.map(([k, ic, l], i) => `<div class="bwh-t" data-a="${k}" role="button" style="--i:${i + 1}"><div class="ic"><i>${ic}</i></div><b>${l}</b><small>&nbsp;</small><i class="bd"></i></div>`).join('');
    }
    for (const [k, , , sub, bd] of T) {
      const tl = G.querySelector('[data-a="' + k + '"]'); if (!tl) continue;
      const sm = tl.querySelector('small'), v = String(sub || '');
      if (sm && sm.dataset.v !== v) { sm.dataset.v = v; sm.innerHTML = v || '&nbsp;'; }
      const b = tl.querySelector('.bd'); if (b && b.textContent !== bd) b.textContent = bd;
    }
  }
  function tick() { if (S.open && !document.hidden) paintHub(); }       // once a second while the hub is open: live timers
  function paintBadge() {
    const un = social && social.unseen ? social.unseen() : 0; const b = btn.querySelector('.bd'), s = un ? String(un) : ''; if (b.textContent !== s) b.textContent = s;
    const a = A(), hot = !!un || !!(a && a.attack && a.space > 0 && (+a.ready || 0) >= 80);        // the pulse ring: a new log entry, or the army is ready to march
    if (btn.classList.contains('hot') !== hot) btn.classList.toggle('hot', hot);
  }
  function openHub() { if (S.open) return; S.open = true; G.dataset.sig = ''; paintHub(); hub.classList.add('on'); click(); social && social.refresh && social.refresh(); sync(); }
  function closeHub() { if (!S.open) return; S.open = false; hub.classList.remove('on'); sync(); }

  // ---- navigation: which panel each tile opens, how to close it, where its header is (for the "‹" back button)
  const q = (sel) => document.querySelector(sel);
  const PANE = {
    build: { el: q('.bwu'), hd: '.bwu-h', close: () => upgrade && upgrade.close && upgrade.close() },
    army: { el: q('.bwa'), hd: '.bwa-h', close: () => army && army.close && army.close() },
    shop: { el: q('.bws'), hd: '.bws-h', close: () => shop && shop.close && shop.close() },
    rank: { el: q('.bwk:not(.bwc)'), hd: '.bwk-h', close: () => rank && rank.close && rank.close() },
    social: { el: q('.bwc'), hd: '.bwk-h', close: () => social && social.close && social.close() },
    set: { el: q('.bw-set'), hd: '.bw-ph', close: () => ui && ui.openSettings && ui.openSettings(false) },
  };
  const PANE_OF = { build: 'build', army: 'army', banner: 'army', shop: 'shop', rank: 'rank', clan: 'social', friends: 'social', log: 'social', set: 'set' };
  // the panels in the order they opened (a panel can open another on top of itself, e.g. the egg card opens the Shop over the Army): Back acts on the top one
  const order = [];
  const track = () => { for (const k of Object.keys(PANE)) { const e = PANE[k].el, on = !!(e && e.classList.contains('on')), i = order.indexOf(k); if (on && i < 0) order.push(k); else if (!on && i >= 0) order.splice(i, 1); } };
  const openPane = () => { track(); return order.length ? order[order.length - 1] : null; };
  function backBtn(k, on) {
    const P = PANE[k]; if (!P || !P.el) return;
    const hd = P.el.querySelector(P.hd); if (!hd) return;
    let b = hd.querySelector(':scope > .bwnav');
    if (on && !b) {
      b = document.createElement('div'); b.className = 'bwnav'; b.setAttribute('role', 'button'); b.setAttribute('aria-label', 'Back'); b.innerHTML = BACK;
      b.addEventListener('click', (e) => { e.stopPropagation(); click(); back(); });
      hd.insertBefore(b, hd.firstChild);
    } else if (!on && b) b.remove();
  }
  // Telegram's own Back button (top-left in the Mini App) follows the same stack
  const TB = tg && tg.BackButton && (!tg.isVersionAtLeast || tg.isVersionAtLeast('6.1')) ? tg.BackButton : null;
  let tbOn = false;
  const onTB = () => back();
  if (TB) { try { TB.onClick(onTB); } catch (e) { /* ignore */ } }
  function sync() {
    const k = openPane();
    if (S.ret && !order.includes(S.ret)) { backBtn(S.ret, false); S.ret = null; }             // the panel the hub opened was closed (✕, outside tap, or another way)
    const want = S.open || !!k;
    if (TB && want !== tbOn) { tbOn = want; try { if (want) TB.show(); else TB.hide(); } catch (e) { /* ignore */ } }
  }
  function back() {
    if (S.open) { closeHub(); return; }
    const k = openPane(); if (!k) { sync(); return; }
    const toHub = S.ret === k;
    PANE[k].close();
    sync();
    if (toHub && !openPane()) openHub();
  }
  // panels open and close by themselves too (their ✕, a tap outside): watch only their own class attribute
  if (typeof MutationObserver !== 'undefined') { const mo = new MutationObserver(() => sync()); for (const k of Object.keys(PANE)) if (PANE[k].el) mo.observe(PANE[k].el, { attributes: true, attributeFilter: ['class'] }); }

  function go(k) {
    closeHub();
    if (k === 'attack') army && army.attack && army.attack();
    else if (k === 'build') upgrade && upgrade.open && upgrade.open();
    else if (k === 'army') army && army.open && army.open();
    else if (k === 'shop') shop && shop.open && shop.open();
    else if (k === 'rank') rank && rank.open && rank.open();
    else if (k === 'clan') social && social.open('clan');
    else if (k === 'friends') social && social.open('friends');
    else if (k === 'log') social && social.open('log');
    else if (k === 'set') ui && ui.openSettings && ui.openSettings(true);
    else if (k === 'banner') army && army.emblem && army.emblem();
    const pk = PANE_OF[k];
    if (pk && PANE[pk].el && PANE[pk].el.classList.contains('on')) { S.ret = pk; backBtn(pk, true); }
    sync();
  }
  btn.addEventListener('click', () => { btn.classList.remove('tap'); void btn.offsetWidth; btn.classList.add('tap'); openHub(); });
  hub.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]'); if (!a) { if (e.target === hub) closeHub(); return; }
    if (a.dataset.a === 'x') { click(); closeHub(); return; }
    click(); go(a.dataset.a);
  });
  const timer = setInterval(tick, 1000);
  function update() { paintBadge(); if (S.open) paintHub(); }
  update();
  return { update, openHub, closeHub, back, get isOpen() { return S.open; }, dispose() { clearInterval(timer); if (TB) { try { TB.offClick(onTB); TB.hide(); } catch (e) { /* ignore */ } } } };
}
