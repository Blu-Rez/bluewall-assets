// The shop (opens from the Assist hub, or by tapping one of the two special-gem capsules under the player's name).
//   · Boosts  — Builder / Army / Mines / Royal (all three) at 5, 10, 15 or 20 % for 1, 7 or 30 days, paid in deep-blue sapphire
//   · Defense — the Tesla coil (up to four on the walls: chain lightning, hits ground and air), paid in black onyx
//   · Gems    — how gems are bought: in BlueBot (Games › Store) and sent here with Convert › Blue Wall; the live rates for YOUR castle
// Prices are the owner's (bot admin -> server shop.py); the server answers every purchase (econ.buy) and the panel repaints from it.
//   createShopUI(mount, { econ, ui, audio }) -> { open(tab?), close(), update() }
import { GEMS } from './ui.js';
import BAL from './balance.json';
import { ico } from './ui_icons.js';                                       // UI3: the one icon set
import { T, G, A, mix, FONT } from './ui_tokens.js';                       // UI3: the one colour / font file

const fmtN = (n) => Math.floor(n).toLocaleString('en-US');
const BOT_LINK = 'https://t.me/Blue_Hearts_Bot';
const GEM_NAME = { ruby: 'Ruby', emerald: 'Emerald', turq: 'Turquoise', sap: 'Sapphire', onyx: 'Onyx' };
const SRC = { blue: ['#2f8dff', '#bfe0ff', 'Blue gem'], green: ['#20b45a', '#c6ffd9', 'Green gem'], red: ['#e0263f', '#ffc9d1', 'Red gem'] };
const left = (s) => { s = Math.max(0, s); const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60); return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${Math.max(1, m)}m`; };

// ---- art (UI3): one style — a round medallion with a glyph of the one icon set (the Royal boost has a thin gold rim: the only gold here)
const med = (name, gold) => `<span class="bws-med${gold ? ' gold' : ''}">${ico(name, 26)}</span>`;
const ART = { build: med('hammer'), army: med('swords'), mine: med('mine'), royal: med('crown', true), tesla: med('bolt') };
const DOT = (c) => `<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="${SRC[c][0]}" stroke="${SRC[c][1]}" stroke-width="1.5"/><circle cx="7.5" cy="7" r="2.6" fill="#fff" opacity=".55"/></svg>`;
const BOOST = {
  build: ['Builder Boost', 'Every upgrade finishes faster'],
  army: ['Army Boost', 'Soldiers and spells train faster'],
  mine: ['Mine Boost', 'Your three mines dig more gems'],
  royal: ['Royal Boost', 'Builders, army and mines together'],
};

export const SHOP_CSS = `
/* UI3: the shop skin — every colour from ui_tokens.js; the SIZE of the panel and its two-pane layout come from ui_theme_r4.js (a small centred card, a rail with the three tabs, the list on the right) */
.bws{position:absolute;inset:0;pointer-events:auto;z-index:12;background:${A('n0',.42)};opacity:0;visibility:hidden;font-family:${FONT};color:${T.ink};-webkit-tap-highlight-color:transparent;overflow:hidden;overflow:clip}
.bws.on{opacity:1;visibility:visible}.bws *{box-sizing:border-box}
.bws-pan{position:absolute;left:max(14px,calc(var(--sl) + 12px));right:max(14px,calc(var(--sr) + 12px));top:calc(var(--st) + 14px);bottom:calc(var(--sb) + 14px);max-width:560px;margin:0 auto;display:flex;flex-direction:column;border-radius:18px;overflow:hidden;
  background:${G.panel};border:1px solid ${T.line};box-shadow:${G.plate},${G.shadow}}
.bws-h{display:flex;align-items:center;gap:8px;padding:8px 10px 6px 14px}
.bws-h b{flex:1;font-size:17px;letter-spacing:1.4px;text-transform:uppercase;color:${T.ink}}
.bws-bal{display:flex;gap:6px}
.bws-bal span{position:relative;display:inline-flex;align-items:center;height:28px;padding:0 10px 0 26px;border-radius:14px;font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;background:${G.panel2};border:1px solid ${T.line};color:${T.ink}}
.bws-bal span .gem3{position:absolute;left:-5px;top:-4px;width:30px;height:30px}
.bws-x{flex:0 0 auto;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:${G.btn};border:1px solid ${T.line};color:${T.ink};cursor:pointer}
.bws-x svg{width:18px;height:18px;display:block}
.bws-tabs{display:flex;gap:4px;margin:4px 10px 0;padding:4px;border-radius:14px;background:${A('n0',.55)};border:1px solid ${A('line',.32)}}
.bws-tabs button{flex:1;min-width:0;min-height:40px;padding:0 4px;border-radius:11px;border:0;background:transparent;color:${T.mute};font-weight:700;font-size:12px;line-height:1;font-family:inherit;letter-spacing:.8px;cursor:pointer;text-transform:uppercase}
.bws-tabs button.on{color:${T.inkOn};background:${G.accent};box-shadow:${G.emb}}
.bws-body{flex:1;overflow-y:auto;padding:6px 10px 12px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.bws-note{margin:2px 2px 6px;font-size:11.5px;letter-spacing:.2px;color:${T.mute};text-align:left;line-height:1.4}.bws-note b{color:${T.ink}}
.bws-c{position:relative;margin:0 0 8px;padding:9px 10px 9px;border-radius:14px;background:${G.card};border:1px solid ${T.cardLine};box-shadow:0 2px 8px rgba(0,0,0,.35)}
.bws-c.gold{border-color:${T.gold}}
.bws-c .bws-note,.bws-c .bws-sm{color:${T.cardMute}}.bws-c .bws-note b{color:${T.cardInk}}
.bws-top{display:flex;align-items:center;gap:10px}
.bws-c .art{flex:0 0 40px;height:40px;display:grid;place-items:center}
.bws-med{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;color:${T.ice};background:${G.core};border:2px solid ${T.silver2};box-shadow:0 2px 5px rgba(0,0,0,.4)}
.bws-med.gold{border-color:${T.gold};color:${T.gold2}}
.bws-med svg{width:22px;height:22px;display:block}
.bws-c .nm{flex:1;min-width:0}
.bws-c .nm b{display:block;font-size:15px;color:${T.cardInk};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bws-c .nm small{display:block;margin-top:1px;font-size:11.5px;line-height:1.3;color:${T.cardMute}}
.bws-on{display:inline-flex;align-items:center;gap:5px;margin-top:4px;padding:2px 8px;border-radius:8px;font-size:10.5px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:${T.n0};background:linear-gradient(180deg,${T.ok},${mix('ok','n0',.4)})}
.bws-tag{position:absolute;right:10px;top:-9px;padding:2px 9px;border-radius:9px;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${T.goldInk};background:linear-gradient(180deg,${T.gold2},${T.gold});border:1px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)}
.bws-ctl{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:8px}
.bws-seg{display:flex;gap:4px;margin:0;min-width:0}
.bws-seg[data-g="p"]{flex:4 1 172px}.bws-seg[data-g="d"]{flex:3 1 128px}
.bws-seg button{flex:1;min-width:40px;height:40px;padding:0 2px;border-radius:10px;border:1px solid ${T.cardLine};background:${G.btn};color:${T.ink};font:inherit;font-size:12.5px;font-weight:700;font-variant-numeric:tabular-nums;cursor:pointer;white-space:nowrap}
.bws-seg button.on{color:${T.inkOn};border-color:${T.blue2};background:${G.accent};box-shadow:${G.emb}}
.bws-row{display:flex;align-items:center;gap:8px;margin-top:8px}
.bws-row .sp{flex:1;font-size:11.5px;color:${T.cardMute};letter-spacing:.2px}
.bws-buy{flex:0 0 auto;margin-left:auto;display:inline-flex;align-items:center;justify-content:center;gap:4px;min-width:88px;height:40px;padding:0 12px 0 6px;border-radius:12px;border:1px solid ${T.blue2};background:${G.accent};color:${T.inkOn};font:inherit;font-weight:700;font-size:14px;letter-spacing:.3px;font-variant-numeric:tabular-nums;cursor:pointer;box-shadow:${G.emb}}
.bws-buy .gem3{width:26px;height:26px;flex:0 0 auto}
.bws-buy.ok{background:${G.accent2};border-color:${T.inkOn};box-shadow:${G.emb},0 0 0 2px #ffffff}
.bws-buy.dim{opacity:.55;filter:grayscale(.35)}
.bws-buy:active{transform:scale(.94)}
.bws-done{flex:0 0 auto;padding:9px 12px;border-radius:12px;font-size:12px;font-weight:700;letter-spacing:1px;color:${T.n0};border:1px solid ${T.ok};background:linear-gradient(180deg,${T.ok},${mix('ok','n0',.4)});text-transform:uppercase}
.bws-how{margin:0 0 8px;padding:10px 12px;border-radius:14px;background:${G.card};border:1px solid ${T.cardLine};box-shadow:0 2px 8px rgba(0,0,0,.35)}
.bws-how b{display:block;font-size:15px;color:${T.cardInk};margin-bottom:4px}
.bws-how ol{margin:0;padding-left:20px;font-size:12.5px;line-height:1.5;color:${T.cardInk}}
.bws-how ol em{font-style:normal;color:${T.cardAcc};font-weight:700}
.bws-how .bws-buy{width:100%;margin-top:8px;min-width:0}
.bws-rt{display:flex;align-items:center;gap:8px;padding:6px 4px;border-bottom:1px solid ${A('cardInk',.14)};font-size:13px;font-variant-numeric:tabular-nums;color:${T.cardInk}}
.bws-rt:last-child{border-bottom:0}
.bws-rt .gem3{width:24px;height:24px;flex:0 0 auto}
.bws-rt .ar{color:${T.cardAcc};font-size:13px}
.bws-rt .sr{display:inline-flex;align-items:center;gap:5px;min-width:96px;color:${T.cardInk}}
.bws-rt .ds{display:inline-flex;align-items:center;gap:4px;flex:1;justify-content:flex-end;color:${T.cardInk};font-weight:700}
.bws-rt.hl{background:${A('blue',.22)};border-radius:10px}
.bws-sm{margin-top:4px;font-size:11px;color:${T.mute};text-align:left;line-height:1.4}
`;

export function createShopUI(mount, { econ, ui, audio } = {}) {
  const host = (ui && ui.root) || mount;
  if (!document.getElementById('bws-css')) { const stEl = document.createElement('style'); stEl.id = 'bws-css'; stEl.textContent = SHOP_CSS; document.head.appendChild(stEl); }
  const pan = document.createElement('div'); pan.className = 'bws'; pan.setAttribute('role', 'dialog'); pan.setAttribute('aria-label', 'Shop');
  pan.innerHTML = `<div class="bws-pan"><div class="bws-h"><b>Shop</b><div class="bws-bal"></div><div class="bws-x" data-a="x" role="button" aria-label="Close">${ico('x', 18)}</div></div>
    <div class="bws-tabs"><button data-t="boost" class="on">Boosts</button><button data-t="def">Defense</button><button data-t="gem">Gems</button></div>
    <div class="bws-body"></div></div>`;
  host.appendChild(pan);
  const BODY = pan.querySelector('.bws-body'), BAL = pan.querySelector('.bws-bal');
  const S = { open: false, tab: 'boost', sel: { build: [10, 7], army: [10, 7], mine: [10, 7], royal: [20, 7] }, arm: null, armT: 0, hl: null, busy: false };
  const click = () => { audio && audio.click && audio.click(); ui && ui.haptic && ui.haptic('light'); };
  const g3 = (g) => GEMS[g] || '';
  const shop = () => (econ && econ.st && econ.st.shop) || null;
  const prem = () => (econ && econ.prem ? econ.prem() : { sap: 0, onyx: 0 });
  const now = () => (econ && econ.now ? econ.now() : Date.now() / 1000);
  const lvl = () => Math.max(1, Math.min(BAL.max_level || 20, (econ && econ.st && econ.st.level) || 1));
  const priceBtn = (key, cur, n, can) => `<button class="bws-buy${S.arm === key ? ' ok' : ''}${can ? '' : ' dim'}" data-a="buy" data-k="${key}">${S.arm === key ? 'Sure?' : `${g3(cur)}${fmtN(n)}`}</button>`;

  function boosts() {
    const sh = shop(); if (!sh) return '<div class="bws-note">Loading…</div>';
    const on = econ.boosts ? econ.boosts() : {}, have = prem().sap;
    const card = (k) => {
      const [p, d] = S.sel[k], price = ((sh.boost.price[k] || {})[p] || {})[d], [title, sub] = BOOST[k];
      const act = k === 'royal' ? (['build', 'army', 'mine'].every((x) => on[x]) ? on.build : null) : on[k];
      const actTxt = k === 'royal' ? ['build', 'army', 'mine'].filter((x) => on[x]).map((x) => `${x === 'build' ? 'Builders' : x === 'army' ? 'Army' : 'Mines'} +${on[x].p}%`).join(' · ') : act ? `+${act.p}% · ${left(act.end - now())} left` : '';
      return `<div class="bws-c${k === 'royal' ? ' gold' : ''}">${k === 'royal' ? '<i class="bws-tag">All three</i>' : ''}
        <div class="bws-top"><div class="art">${ART[k]}</div><div class="nm"><b>${title}</b><small>${sub}</small>${actTxt ? `<span class="bws-on">Active · ${actTxt}</span>` : ''}</div></div>
        <div class="bws-ctl"><div class="bws-seg" data-g="p" data-k="${k}">${sh.boost.tiers.map((t) => `<button data-v="${t}" class="${t === p ? 'on' : ''}">+${t}%</button>`).join('')}</div>
        <div class="bws-seg" data-g="d" data-k="${k}">${sh.boost.days.map((t) => `<button data-v="${t}" class="${t === d ? 'on' : ''}">${t === 1 ? '1 day' : t + 'd'}</button>`).join('')}</div>
        ${priceBtn('boost:' + k, 'sap', price || 0, have >= (price || 1e9))}</div></div>`;     // UI3: one row: % tiers · days · price
    };
    return `<div class="bws-note">Boosts run in real time — even while you are away. Buying the same boost again adds days; a stronger one takes over.</div>` + ['royal', 'build', 'army', 'mine'].map(card).join('');
  }

  function defense() {
    const sh = shop(); if (!sh) return '<div class="bws-note">Loading…</div>';
    const t = sh.items.tesla, have = prem().onyx;
    return `<div class="bws-note">Royal defenses guard your walls against every raid</div>
      <div class="bws-c"><div class="bws-top"><div class="art">${ART.tesla}</div><div class="nm"><b>Tesla Coil</b><small>Chain lightning: strikes a foe and jumps to two more nearby. Hits ground and air. Grows with your castle.</small>
      <span class="bws-on">On your walls: ${t.have} / ${t.max}</span></div></div>
      <div class="bws-row"><div class="sp">${t.have >= t.max ? 'All four towers stand guard' : t.have ? 'Add another coil' : 'Raised beside your gate'}</div>
      ${t.price == null ? '<div class="bws-done">Max</div>' : priceBtn('tesla', 'onyx', t.price, have >= t.price)}</div></div>`;
  }

  function gems() {
    const sh = shop(); if (!sh) return '<div class="bws-note">Loading…</div>';
    const rows = ['turq', 'emerald', 'ruby', 'sap', 'onyx'].map((g) => { const c = sh.conv[g]; if (!c) return ''; const [, , nm] = SRC[c.from];
      return `<div class="bws-rt${S.hl === g ? ' hl' : ''}" data-g="${g}"><span class="sr">${DOT(c.from)}${c.in} ${nm}${c.in > 1 ? 's' : ''}</span><span class="ar">→</span><span class="ds">${fmtN(c.out)} ${g3(g)}</span></div>`; }).join('');
    return `<div class="bws-how"><b>Get gems in BlueBot</b><ol>
      <li>Open <em>BlueBot</em> › <em>Games</em> › <em>Store</em></li>
      <li>Buy gems there — or win them in BlueBot's games</li>
      <li>Tap <em>Convert</em> › <em>Blue Wall</em> and choose the gem</li></ol>
      <div class="bws-sm" style="text-align:left;margin-top:6px">They arrive in your kingdom at once and stay here.</div>
      <button class="bws-buy" data-a="bot">Open BlueBot</button></div>
      <div class="bws-c" style="padding:6px 10px"><div class="bws-note" style="margin:4px 0 2px">What one gem brings at <b>Castle ${lvl()}</b></div>${rows}</div>
      <div class="bws-sm">Ruby, emerald and turquoise grow with your castle — the higher it stands, the more each gem brings.<br>Sapphire buys boosts · Onyx buys royal defenses.</div>`;
  }

  function paintBal() { const p = prem(); BAL.innerHTML = `<span class="s">${g3('sap')}${fmtN(p.sap)}</span><span class="o">${g3('onyx')}${fmtN(p.onyx)}</span>`; }
  function paint() {
    paintBal();
    pan.querySelectorAll('.bws-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === S.tab));
    const keep = BODY.scrollTop, html = S.tab === 'boost' ? boosts() : S.tab === 'def' ? defense() : gems();
    BODY.innerHTML = html; BODY.scrollTop = keep;
  }
  function open(tab) {
    S.hl = null;
    if (['boost', 'def', 'gem'].includes(tab)) S.tab = tab;
    else if (tab === 'sap' || tab === 'onyx') { S.tab = 'gem'; S.hl = tab; }
    S.open = true; S.arm = null; BODY.scrollTop = 0; paint(); pan.classList.add('on');
    if (S.hl) requestAnimationFrame(() => { const r = BODY.querySelector(`.bws-rt[data-g="${S.hl}"]`); if (r) BODY.scrollTop = Math.max(0, r.getBoundingClientRect().top - BODY.getBoundingClientRect().top + BODY.scrollTop - 120); });
    click();
  }
  function close() { S.open = false; S.arm = null; pan.classList.remove('on'); }
  const say = (t) => ui && ui.toast && ui.toast(t);
  async function buy(key) {
    if (S.busy) return;
    const sh = shop(); if (!sh) return;
    let body, label;
    if (key.startsWith('boost:')) { const k = key.slice(6), [p, d] = S.sel[k]; body = { id: 'boost', kind: k, p, d }; label = `${BOOST[k][0]} +${p}% for ${d === 1 ? '1 day' : d + ' days'}`; }
    else { body = { id: 'tesla' }; label = 'A Tesla Coil rises on your walls'; }
    S.busy = true;
    const r = await econ.buy(body);
    S.busy = false; S.arm = null;
    if (r && r.ok) { audio && audio.coins && audio.coins(); ui && ui.haptic && ui.haptic('medium'); say(label + '!'); }
    else if (r && r.why === 'gems') { const g = (r.info && r.info.gem) || 'sap'; say(`Not enough ${GEM_NAME[g].toLowerCase()} — see the Gems tab`); }
    else if (r && r.why === 'stronger') say('A stronger boost is already running');
    else if (r && (r.why === 'max' || r.why === 'have')) say('You already have it');
    else say('Could not buy — try again');
    if (S.open) paint();
  }
  pan.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a]'), t = e.target.closest('.bws-tabs [data-t]'), sg = e.target.closest('.bws-seg button');
    if (t) { click(); S.tab = t.dataset.t; S.arm = null; S.hl = null; BODY.scrollTop = 0; paint(); return; }
    if (sg) { const box = sg.parentElement, k = box.dataset.k, v = +sg.dataset.v; click(); if (box.dataset.g === 'p') S.sel[k][0] = v; else S.sel[k][1] = v; S.arm = null; paint(); return; }
    if (!a) { if (e.target === pan) close(); return; }
    if (a.dataset.a === 'x') { click(); close(); return; }
    if (a.dataset.a === 'bot') { click(); const tg = (ui && ui.tg) || (window.Telegram && window.Telegram.WebApp); try { if (tg && tg.openTelegramLink) tg.openTelegramLink(BOT_LINK); else window.open(BOT_LINK, '_blank'); } catch (er) { window.open(BOT_LINK, '_blank'); } return; }
    if (a.dataset.a === 'buy') {
      click();
      const k = a.dataset.k;
      if (a.classList.contains('dim') && S.arm !== k) { const g = k === 'tesla' ? 'onyx' : 'sap'; say(`Not enough ${GEM_NAME[g].toLowerCase()} — see the Gems tab`); return; }
      if (S.arm === k && Date.now() - S.armT < 4000) { buy(k); return; }                 // (second tap = confirm: premium gems are never spent by one stray tap)
      S.arm = k; S.armT = Date.now(); paint();
      setTimeout(() => { if (S.arm === k && Date.now() - S.armT >= 3900) { S.arm = null; if (S.open) paint(); } }, 4000);
    }
  });
  return { open, close, get isOpen() { return S.open; }, update() { if (S.open && !S.arm) paint(); else if (S.open) paintBal(); } };
}
