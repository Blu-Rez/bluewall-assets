// The shop (opens from the Assist hub, or by tapping one of the two special-gem capsules under the player's name).
//   · Boosts  — Builder / Army / Mines / Royal (all three) at 5, 10, 15 or 20 % for 1, 7 or 30 days, paid in deep-blue sapphire
//   · Defense — the Tesla coil (up to four on the walls: chain lightning, hits ground and air), paid in black onyx
//   · Gems    — how gems are bought: in BlueBot (Games › Store) and sent here with Convert › Blue Wall; the live rates for YOUR castle
// Prices are the owner's (bot admin -> server shop.py); the server answers every purchase (econ.buy) and the panel repaints from it.
//   createShopUI(mount, { econ, ui, audio }) -> { open(tab?), close(), update() }
import { GEMS } from './ui.js';
import BAL from './balance.json';

const fmtN = (n) => Math.floor(n).toLocaleString('en-US');
const BOT_LINK = 'https://t.me/Blue_Hearts_Bot';
const GEM_NAME = { ruby: 'Ruby', emerald: 'Emerald', turq: 'Turquoise', sap: 'Sapphire', onyx: 'Onyx' };
const SRC = { blue: ['#2f8dff', '#bfe0ff', 'Blue gem'], green: ['#20b45a', '#c6ffd9', 'Green gem'], red: ['#e0263f', '#ffc9d1', 'Red gem'] };
const left = (s) => { s = Math.max(0, s); const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60); return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${Math.max(1, m)}m`; };

// ---- art (one style: steel strokes, a blue glow, 64x64)
const svg = (inner, w = 58) => `<svg viewBox="0 0 64 64" width="${w}" height="${w}" aria-hidden="true"><defs>
  <linearGradient id="bwsSt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f8ff"/><stop offset=".5" stop-color="#9fb4cf"/><stop offset="1" stop-color="#4d6280"/></linearGradient>
  <linearGradient id="bwsBl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fe2ff"/><stop offset="1" stop-color="#1f5fd8"/></linearGradient>
  <linearGradient id="bwsGo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset="1" stop-color="#c8891c"/></linearGradient>
  <radialGradient id="bwsOrb"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#9ff0ff"/><stop offset="1" stop-color="#1f6fff" stop-opacity="0"/></radialGradient></defs>${inner}</svg>`;
const ART = {
  build: svg(`<circle cx="32" cy="32" r="27" fill="#0b2350" stroke="url(#bwsBl)" stroke-width="2"/>
    <path d="M19 45l17-17" stroke="#7a5532" stroke-width="5" stroke-linecap="round"/><path d="M30 17l14 14-6 6-14-14z" fill="url(#bwsSt)" stroke="#203450" stroke-width="1.2"/>
    <path d="M41 14l9 9-4 4-9-9z" fill="url(#bwsBl)"/><path d="M14 50h22" stroke="url(#bwsSt)" stroke-width="3" stroke-linecap="round"/>`),
  army: svg(`<circle cx="32" cy="32" r="27" fill="#0b2350" stroke="url(#bwsBl)" stroke-width="2"/>
    <path d="M18 46L42 18l4 1-1 4L21 49z" fill="url(#bwsSt)" stroke="#203450" stroke-width="1"/><path d="M46 46L22 18l-4 1 1 4 24 26z" fill="url(#bwsSt)" stroke="#203450" stroke-width="1"/>
    <path d="M15 43l6 6M49 43l-6 6" stroke="url(#bwsGo)" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="32" r="4" fill="url(#bwsBl)"/>`),
  mine: svg(`<circle cx="32" cy="32" r="27" fill="#0b2350" stroke="url(#bwsBl)" stroke-width="2"/>
    <path d="M20 44l20-20" stroke="#7a5532" stroke-width="4.5" stroke-linecap="round"/><path d="M27 15c9 0 17 5 22 13l-3 2c-5-6-11-9-18-10z" fill="url(#bwsSt)" stroke="#203450" stroke-width="1"/>
    <path d="M40 38l7-4 7 4v8l-7 4-7-4z" fill="url(#bwsBl)" stroke="#d8f2ff" stroke-width="1"/><path d="M40 38l7 4 7-4M47 42v8" stroke="#d8f2ff" stroke-width=".8" opacity=".8"/>`),
  royal: svg(`<circle cx="32" cy="32" r="27" fill="#0b2350" stroke="url(#bwsGo)" stroke-width="2.2"/>
    <path d="M15 42l3-17 8 8 6-13 6 13 8-8 3 17z" fill="url(#bwsGo)" stroke="#5a3a08" stroke-width="1.2"/><rect x="15" y="42" width="34" height="6" rx="2" fill="url(#bwsGo)" stroke="#5a3a08" stroke-width="1"/>
    <circle cx="32" cy="35" r="3.4" fill="url(#bwsBl)"/><circle cx="22" cy="37" r="2.2" fill="#e0263f"/><circle cx="42" cy="37" r="2.2" fill="#20b45a"/>`),
  tesla: svg(`<ellipse cx="32" cy="56" rx="16" ry="4" fill="#06132c"/><path d="M22 56l3-14h14l3 14z" fill="url(#bwsSt)" stroke="#203450" stroke-width="1"/>
    <rect x="28" y="22" width="8" height="21" rx="2" fill="#b4753c" stroke="#5b3416" stroke-width="1"/><path d="M27 25h10M27 29h10M27 33h10M27 37h10M27 41h10" stroke="#e8b27a" stroke-width="1.4"/>
    <circle cx="32" cy="16" r="12" fill="url(#bwsOrb)"/><circle cx="32" cy="16" r="5.5" fill="#dff8ff" stroke="#7fd6ff" stroke-width="1.5"/>
    <path d="M38 13l8-5-3 6 8-2M26 13l-8-5 3 6-8-2" stroke="#9ff0ff" stroke-width="1.6" fill="none" stroke-linejoin="round"/>`),
};
const DOT = (c) => `<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="${SRC[c][0]}" stroke="${SRC[c][1]}" stroke-width="1.5"/><circle cx="7.5" cy="7" r="2.6" fill="#fff" opacity=".55"/></svg>`;
const BOOST = {
  build: ['Builder Boost', 'Every upgrade finishes faster'],
  army: ['Army Boost', 'Soldiers and spells train faster'],
  mine: ['Mine Boost', 'Your three mines dig more gems'],
  royal: ['Royal Boost', 'Builders, army and mines together'],
};

export const SHOP_CSS = `
.bws{position:absolute;inset:0;pointer-events:auto;z-index:12;background:rgba(0,3,10,.66);opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s;font-family:'Libre Baskerville','Noto Sans Tai Viet',Georgia,serif;color:#eaf6ff;-webkit-tap-highlight-color:transparent;overflow:hidden;overflow:clip}
.bws.on{opacity:1;visibility:visible}.bws *{box-sizing:border-box}
.bws-pan{position:absolute;left:max(14px,calc(var(--sl) + 12px));right:max(14px,calc(var(--sr) + 12px));top:calc(var(--st) + max(46px,8vh));bottom:calc(var(--sb) + max(46px,8vh));max-width:450px;margin:0 auto;display:flex;flex-direction:column;border-radius:22px;overflow:hidden;
  background:linear-gradient(180deg,#0d2a5c,#050f26 38%,#020712);border:1.5px solid rgba(150,200,255,.4);box-shadow:0 20px 60px rgba(0,0,0,.7),inset 0 1px 0 rgba(200,230,255,.25);transform:translateY(18px) scale(.98);transition:transform .3s}
.bws.on .bws-pan{transform:none}
.bws-h{display:flex;align-items:center;gap:8px;padding:13px 12px 8px 16px}
.bws-h b{flex:1;font-size:19px;letter-spacing:2px;text-transform:uppercase;color:#eaf6ff}
.bws-bal{display:flex;gap:6px}
.bws-bal span{position:relative;display:inline-flex;align-items:center;height:26px;padding:0 9px 0 22px;border-radius:13px;font-size:12.5px;font-weight:700;font-variant-numeric:tabular-nums;background:linear-gradient(180deg,rgba(24,52,120,.92),rgba(2,8,28,.96));border:1px solid var(--bc);color:#fff}
.bws-bal span .gem3{position:absolute;left:-6px;top:-5px;width:30px;height:30px}
.bws-bal span.s{--bc:rgba(120,165,255,.7)}.bws-bal span.o{--bc:rgba(205,218,242,.6);background:linear-gradient(180deg,rgba(46,53,70,.98),rgba(1,2,5,.99))}
.bws-x{flex:0 0 auto;width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:rgba(255,255,255,.08);border:1px solid rgba(150,200,255,.25);font-size:14px;cursor:pointer}
.bws-tabs{display:flex;gap:4px;margin:4px 12px 0;padding:4px;border-radius:14px;background:rgba(2,8,20,.7);border:1px solid rgba(120,190,255,.2)}
.bws-tabs button{flex:1;min-width:0;padding:9px 2px;border-radius:11px;border:0;background:transparent;color:#8fb4e0;font-weight:700;font-size:11.5px;line-height:1;font-family:inherit;letter-spacing:.8px;cursor:pointer;text-transform:uppercase}
.bws-tabs button.on{color:#fff;background:linear-gradient(180deg,#3d8cff,#1b4fb8);box-shadow:0 2px 8px rgba(40,110,230,.5)}
.bws-body{flex:1;overflow-y:auto;padding:6px 12px 16px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.bws-note{margin:6px 2px 4px;font-size:11px;letter-spacing:.4px;color:#8fb4e0;text-align:center;line-height:1.45}.bws-note b{color:#d9efff}
.bws-c{position:relative;margin:10px 0;padding:11px 11px 10px;border-radius:17px;background:linear-gradient(180deg,rgba(40,90,170,.24),rgba(8,24,60,.45));border:1px solid var(--rc,rgba(140,205,255,.34));box-shadow:0 0 14px var(--rg,transparent),inset 0 1px 0 rgba(200,232,255,.12)}
.bws-c.gold{--rc:rgba(255,214,120,.6);--rg:rgba(255,190,70,.18)}
.bws-top{display:flex;align-items:center;gap:10px}
.bws-c .art{flex:0 0 58px;height:58px;display:grid;place-items:center;filter:drop-shadow(0 0 8px var(--rg,rgba(120,190,255,.35)))}
.bws-c .nm{flex:1;min-width:0}
.bws-c .nm b{display:block;font-size:14.5px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bws-c .nm small{display:block;margin-top:2px;font-size:10.5px;line-height:1.35;letter-spacing:.3px;color:#a9c8ea}
.bws-on{display:inline-flex;align-items:center;gap:5px;margin-top:5px;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#031126;background:linear-gradient(180deg,#bff1ff,#4fc3ff)}
.bws-tag{position:absolute;right:10px;top:-9px;padding:2px 9px;border-radius:9px;font-size:9.5px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#2a1a00;background:linear-gradient(180deg,#fff1b8,#e6a83a);border:1px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.5)}
.bws-seg{display:flex;gap:5px;margin-top:9px}
.bws-seg button{flex:1;min-width:0;height:30px;padding:0 2px;border-radius:10px;border:1px solid rgba(140,200,255,.28);background:rgba(4,14,36,.75);color:#a9c8ea;font:inherit;font-size:12px;font-weight:700;font-variant-numeric:tabular-nums;cursor:pointer}
.bws-seg button.on{color:#fff;border-color:#9fd6ff;background:linear-gradient(180deg,rgba(70,140,255,.55),rgba(20,70,180,.55));box-shadow:0 0 8px rgba(80,160,255,.45)}
.bws-row{display:flex;align-items:center;gap:8px;margin-top:9px}
.bws-row .sp{flex:1;font-size:10.5px;color:#8fb4e0;letter-spacing:.3px}
.bws-buy{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;gap:4px;min-width:92px;height:38px;padding:0 12px 0 6px;border-radius:12px;border:1px solid #c9e3ff;background:linear-gradient(180deg,#58a4ff,#1b4fb8);color:#fff;font:inherit;font-weight:700;font-size:14px;letter-spacing:.4px;font-variant-numeric:tabular-nums;cursor:pointer;box-shadow:0 3px 8px rgba(20,80,200,.45),inset 0 1px 0 rgba(255,255,255,.35);transition:transform .12s}
.bws-buy .gem3{width:26px;height:26px;flex:0 0 auto}
.bws-buy.ok{background:linear-gradient(180deg,#ffd76a,#d88d16);border-color:#fff0bf;color:#2a1600}
.bws-buy.dim{opacity:.45}
.bws-buy:active{transform:scale(.94)}
.bws-done{flex:0 0 auto;padding:9px 12px;border-radius:12px;font-size:12px;font-weight:700;letter-spacing:1px;color:#9fe8c0;border:1px solid rgba(120,230,170,.45);background:rgba(10,60,40,.4);text-transform:uppercase}
.bws-how{margin:8px 0 4px;padding:12px 13px;border-radius:17px;background:linear-gradient(180deg,rgba(60,120,220,.28),rgba(8,24,60,.5));border:1px solid rgba(150,210,255,.45)}
.bws-how b{display:block;font-size:15px;color:#fff;margin-bottom:6px}
.bws-how ol{margin:0;padding-left:20px;font-size:12px;line-height:1.6;color:#d9efff}
.bws-how ol em{font-style:normal;color:#9fd6ff;font-weight:700}
.bws-how .bws-buy{width:100%;margin-top:10px;min-width:0}
.bws-rt{display:flex;align-items:center;gap:8px;padding:9px 6px;border-bottom:1px solid rgba(120,180,255,.14);font-size:13px;font-variant-numeric:tabular-nums}
.bws-rt:last-child{border-bottom:0}
.bws-rt .gem3{width:26px;height:26px;flex:0 0 auto}
.bws-rt .ar{color:#6f8fb8;font-size:13px}
.bws-rt .sr{display:inline-flex;align-items:center;gap:5px;min-width:96px;color:#d9efff}
.bws-rt .ds{display:inline-flex;align-items:center;gap:4px;flex:1;justify-content:flex-end;color:#fff;font-weight:700}
.bws-rt.hl{background:rgba(80,150,255,.14);border-radius:10px}
.bws-sm{margin-top:7px;font-size:10.5px;color:#8fb4e0;text-align:center;line-height:1.4}
@media (max-width:340px){.bws-h b{flex:0 1 auto;min-width:0;font-size:16px;letter-spacing:1px}.bws-bal span{padding:0 7px 0 20px;font-size:11.5px}.bws-tabs button{letter-spacing:0;font-size:10.5px}.bws-seg button{font-size:11px;white-space:nowrap}}
@media (orientation:landscape) and (max-height:560px){.bws-pan{top:calc(var(--st) + 14px);bottom:calc(var(--sb) + 14px);max-width:560px}}
`;

export function createShopUI(mount, { econ, ui, audio } = {}) {
  const host = (ui && ui.root) || mount;
  if (!document.getElementById('bws-css')) { const stEl = document.createElement('style'); stEl.id = 'bws-css'; stEl.textContent = SHOP_CSS; document.head.appendChild(stEl); }
  const pan = document.createElement('div'); pan.className = 'bws'; pan.setAttribute('role', 'dialog'); pan.setAttribute('aria-label', 'Shop');
  pan.innerHTML = `<div class="bws-pan"><div class="bws-h"><b>Shop</b><div class="bws-bal"></div><div class="bws-x" data-a="x" role="button" aria-label="Close">✕</div></div>
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
        <div class="bws-seg" data-g="p" data-k="${k}">${sh.boost.tiers.map((t) => `<button data-v="${t}" class="${t === p ? 'on' : ''}">+${t}%</button>`).join('')}</div>
        <div class="bws-row"><div class="bws-seg" data-g="d" data-k="${k}" style="margin:0;flex:1">${sh.boost.days.map((t) => `<button data-v="${t}" class="${t === d ? 'on' : ''}">${t === 1 ? '1 day' : t + (innerWidth < 345 ? 'd' : ' days')}</button>`).join('')}</div>
        ${priceBtn('boost:' + k, 'sap', price || 0, have >= (price || 1e9))}</div></div>`;
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
