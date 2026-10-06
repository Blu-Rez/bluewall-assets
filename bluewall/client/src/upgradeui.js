// Kingdom menu (bottom-right button): every structure by category, upgrade timers, builders, reserved upgrades.
//   createUpgradeUI(mount, { econ, ui, world, audio, tg }) -> { open(tab?), focus(structId), close(), update() }
// Tabs: Owned (built, upgrade / rush / cancel) · Reserve (queue: paid in advance, starts by itself when a builder frees up) ·
//       Buy (structures not built yet) · New (what the next castle levels unlock).
// All rules live on the server (progress.py); this file only draws /api/state's `prog` and calls /api/upgrade/*.
import { GEMS } from './ui.js';

const GEM_KEYS = ['ruby', 'emerald', 'turq'];
const NAME = {
  keep: 'Castle Keep', wall: 'Blue Wall', towers: 'Ballista Towers', training: 'Training Ground', barracks: 'Barracks', stable: 'Stable',
  workshop: 'Siege Workshop', lair: 'Dragon Lair', forge: 'Forge', mine_ruby: 'Ruby Mine', mine_emerald: 'Emerald Mine', mine_turq: 'Turquoise Mine',
  vault_ruby: 'Ruby Vault', vault_emerald: 'Emerald Vault', vault_turq: 'Turquoise Vault',
};
const DESC = {
  keep: 'The heart of your kingdom. Unlocks builders and new buildings — nothing else may be more than 2 levels above it.',
  wall: 'The Blue Wall and the town wall around it. Stronger walls hold the enemy longer.',
  towers: 'Ballista towers on the wall: damage and range against attackers.',
  training: 'Drills infantry and archers: how many fit in your army.',
  barracks: 'Houses the infantry (spear, sword, guard). Higher level: more soldiers and better gear.',
  stable: 'Horses and winged horses for the cavalry. More stalls with every level.',
  workshop: 'Builds siege engines and giants.',
  lair: 'Where dragons and baby dragons are raised.',
  forge: 'Armour and weapons: your soldiers wear the metal of the forge\'s tier.',
  mine_ruby: 'Digs rubies (military gem). Higher level: faster, and bigger.', mine_emerald: 'Digs emeralds (construction gem).', mine_turq: 'Digs turquoise (magic gem).',
  vault_ruby: 'Stores rubies. Higher level: a bigger wallet.', vault_emerald: 'Stores emeralds.', vault_turq: 'Stores turquoise.',
};
const CATS = [['all', 'All'], ['town', 'Town'], ['defense', 'Defense'], ['army', 'Army'], ['resource', 'Resources']];
const TIERS = [['Wood', '#c08a50', '#5a3a1c'], ['Stone', '#c5cbd6', '#4a505c'], ['Iron', '#9db0c8', '#2c3748'], ['Gold', '#ffd35e', '#7a5410'], ['Diamond', '#bff0ff', '#2a6f8f'], ['Crystal', '#62b4ff', '#0b2e78']];
const tierOf = (lv) => (lv >= 30 ? 5 : lv >= 24 ? 4 : lv >= 18 ? 3 : lv >= 12 ? 2 : lv >= 6 ? 1 : 0);        // (30 levels: the looks start at 1 / 6 / 12 / 18 / 24 / 30, like skin.js)
const WHY = { gems: 'Not enough gems', cap: 'Castle too low', vault: 'Vault too small', locked: 'Locked', busy: 'Busy', queue_full: 'Queue full', max: 'MAX', slow: 'Too fast, try again', bad: 'Not possible', offline: 'Offline preview',
  round: 'Bring every building up first', rush_limit: 'Rush limit reached for today' };
const fmtH = (s) => { const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h ? `${h}h${m ? ' ' + m + 'm' : ''}` : `${m}m`; };
const ICON = {
  keep: 'M4 21V9l3-2v3h2V6l3-3 3 3v4h2V7l3 2v12zM10 21v-5h4v5',
  wall: 'M3 20V8h3v3h3V8h3v3h3V8h3v12zM9 20v-4h6v4',
  towers: 'M8 21V8h8v13M7 8V5h2v1h2V5h2v1h2V5h2v3M11 14h2v3h-2z',
  training: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 11.5a.5.5 0 1 0 0 1',
  barracks: 'M5 19L17 7M14 6h4v4M4 20l2-2M19 19L7 7M10 6H6v4M20 20l-2-2',
  stable: 'M6 21v-3a6 6 0 1 1 12 0v3M3 21h5M16 21h5M9 11l3-3 3 3',
  workshop: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
  lair: 'M12 3c2 4 6 5 6 10a6 6 0 0 1-12 0c0-3 2-4 3-6 1 1 2 1 3-4zM9 14l3 3 3-3',
  forge: 'M3 9h14l-2 4h-4v3h4v3H7v-3h2v-3M17 9c2 0 4-1 4-3',
  mine: 'M5 21l10-10M8 5c4-2 9-1 12 3-4-1-7 0-9 2z',
  vault: 'M4 8h16v12H4zM4 8a8 4 0 0 1 16 0M10 13h4v3h-4z',
};
const icon = (id, sz = 26) => {
  const k = id.startsWith('mine_') ? 'mine' : id.startsWith('vault_') ? 'vault' : id;
  return `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${ICON[k] || ICON.keep}"/></svg>`;
};
const gemOf = (id) => (id.startsWith('mine_') || id.startsWith('vault_') ? id.split('_')[1] : null);
const fmtN = (n) => Math.floor(n).toLocaleString('en-US');
function fmtT(s) {
  s = Math.max(0, Math.ceil(s)); const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), c = s % 60;
  return d ? `${d}d ${h}h` : h ? `${h}h ${String(m).padStart(2, '0')}m` : m ? `${m}m ${String(c).padStart(2, '0')}s` : `${c}s`;
}

const CSS = `
.bwu-btn{pointer-events:auto;position:absolute;right:calc(12px + var(--sr));bottom:calc(var(--sb) + 16px);width:78px;height:86px;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .15s,opacity .6s;transform:scale(var(--hs,1));transform-origin:100% 100%}
.bwu-btn:active{transform:scale(calc(var(--hs,1) * .93))}
.bw-ui.wel>.bwu-btn{opacity:0;pointer-events:none}
.bwu-btn .ring{position:absolute;left:5px;top:3px;width:68px;height:68px;border-radius:50%;
  background:conic-gradient(from 210deg,#e8f6ff,#6fb6ff 18%,#16407f 38%,#bfe2ff 55%,#2a5fb0 75%,#e8f6ff);box-shadow:0 5px 14px rgba(0,0,0,.55),0 0 0 1.5px #01060f,0 0 18px rgba(90,170,255,.35)}
.bwu-btn .core{position:absolute;left:11px;top:9px;width:56px;height:56px;border-radius:50%;background:radial-gradient(circle at 50% 28%,#2a5aa8,#0a2352 62%,#041030);box-shadow:inset 0 2px 6px rgba(160,210,255,.5),inset 0 -6px 12px rgba(0,0,0,.55);display:grid;place-items:center;color:#eaf6ff;overflow:hidden}
.bwu-btn .core svg{filter:drop-shadow(0 2px 2px rgba(0,0,0,.6));width:30px;height:30px}
.bwu-btn .core:after{content:"";position:absolute;left:-60%;top:0;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-18deg);opacity:0}
.bwu-btn.hot .core:after{animation:bwuGleam 3s ease-in-out infinite}
.bwu-btn.hot .ring{box-shadow:0 5px 14px rgba(0,0,0,.55),0 0 0 1.5px #01060f,0 0 22px rgba(110,200,255,.85)}
@keyframes bwuGleam{0%,55%{left:-60%;opacity:0}60%{opacity:.9}100%{left:130%;opacity:0}}
.bwu-btn .lb{position:absolute;left:0;right:0;bottom:0;text-align:center;font-size:10.5px;letter-spacing:2.2px;color:#e6f4ff;text-shadow:0 1px 0 #01060f,1px 0 0 #01060f,-1px 0 0 #01060f,0 0 6px rgba(0,0,0,.8);padding-left:2px}
.bwu-btn .bd{position:absolute;right:-2px;top:-3px;min-width:22px;height:22px;padding:0 5px;box-sizing:border-box;border-radius:11px;background:linear-gradient(#7dffb5,#12a85a);border:1.5px solid #01220f;color:#02150a;font-size:12px;display:grid;place-items:center;box-shadow:0 2px 5px rgba(0,0,0,.5)}
.bwu-btn .bd.t{background:linear-gradient(#e8f6ff,#8fc4ff);border-color:#0a2a5c;color:#03122b;font-size:10px;letter-spacing:.2px}
.bwu-btn .bd:empty{display:none}
.bwu{position:absolute;inset:0;pointer-events:auto;z-index:12;background:rgba(0,3,10,.62);opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s}
.bwu.on{opacity:1;visibility:visible}
.bwu-pan{position:absolute;left:max(22px,calc(var(--sl) + 16px));right:max(22px,calc(var(--sr) + 16px));top:calc(var(--st) + max(64px,12vh));bottom:calc(var(--sb) + max(64px,12vh));max-width:440px;margin:0 auto;display:flex;flex-direction:column;border-radius:22px;overflow:hidden;
  background:linear-gradient(180deg,rgba(9,26,60,.97),rgba(2,6,16,.985));border:1px solid rgba(120,190,255,.34);box-shadow:0 20px 60px rgba(0,0,0,.65);transform:translateY(18px) scale(.98);transition:transform .3s}
.bwu.on .bwu-pan{transform:none}
.bwu-h{display:flex;align-items:center;gap:10px;padding:14px 16px 8px}
.bwu-h .t{flex:1;font-size:19px;color:#d9f2ff;letter-spacing:.3px}
.bwu-x{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:rgba(255,255,255,.07);font-size:14px;cursor:pointer}
.bwu-bl{display:flex;gap:8px;padding:2px 14px 10px}
.bwu-b{flex:1;min-width:0;padding:7px 8px 8px;border-radius:12px;background:rgba(95,182,255,.07);border:1px solid rgba(120,190,255,.2);text-align:center;position:relative;overflow:hidden}
.bwu-b .ic{color:#8fd3ff;height:22px;display:grid;place-items:center}.bwu-b.off{opacity:.38}
.bwu-b .tx{margin-top:2px;font-size:11px;line-height:1.25;font-weight:400;color:#a9c4e6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bwu-b .tx i{font-style:normal;color:#7da3d0}
.bwu-b.busy{border-color:rgba(120,230,170,.55);background:rgba(60,200,120,.1)}.bwu-b.busy .tx{color:#bff5d6}.bwu-b.busy .ic{color:#8dffc0}
.bwu-b .bar{position:absolute;left:0;bottom:0;height:3px;background:linear-gradient(90deg,#6fe8ff,#4aa8ff)}
.bwu-tabs{display:flex;gap:6px;padding:8px 12px;border-top:1px solid rgba(120,190,255,.12);border-bottom:1px solid rgba(120,190,255,.12)}
.bwu-tab{flex:1;padding:8px 4px;border-radius:12px;font-size:12.5px;color:#a9bfe0;background:rgba(255,255,255,.04);border:1px solid transparent;cursor:pointer;text-align:center;white-space:nowrap}
.bwu-tab.on{color:#03122b;background:linear-gradient(180deg,#d9f2ff,#6fc0ff);border-color:#bfe6ff}
.bwu-tab small{font-size:10px;opacity:.75}
.bwu-cats{display:flex;gap:6px;padding:8px 12px 2px;overflow-x:auto;scrollbar-width:none}.bwu-cats::-webkit-scrollbar{display:none}
.bwu-cat{flex:0 0 auto;padding:5px 11px;border-radius:999px;font-size:11.5px;color:#9fb8dc;border:1px solid rgba(120,190,255,.2);cursor:pointer}
.bwu-cat.on{color:#e8f6ff;background:rgba(95,182,255,.22);border-color:#6fc0ff}
.bwu-body{flex:1;overflow-y:auto;padding:6px 12px 18px;-webkit-overflow-scrolling:touch}
.bwu-r{position:relative;display:flex;gap:11px;padding:11px 10px;margin-top:8px;border-radius:16px;background:linear-gradient(180deg,rgba(40,90,170,.14),rgba(20,50,110,.07));border:1px solid rgba(120,190,255,.2)}
.bwu-r.hl{border-color:#8fe0ff;box-shadow:0 0 18px rgba(110,200,255,.5)}
.bwu-t{flex:0 0 54px;height:62px;border-radius:12px;position:relative;display:grid;place-items:center;color:var(--tc);background:radial-gradient(circle at 50% 30%,var(--tb),#050c1c);border:1.5px solid var(--tc);box-shadow:inset 0 0 14px rgba(0,0,0,.6)}
.bwu-t .lv{position:absolute;left:0;right:0;bottom:3px;text-align:center;font-size:12.5px;color:#fff;text-shadow:0 1px 0 #000,0 0 5px #000}
.bwu-t .gm{position:absolute;right:-6px;top:-7px;width:22px;height:22px}
.bwu-m{flex:1;min-width:0}
.bwu-m .n{font-size:14.5px;color:#e6f2ff;display:flex;justify-content:space-between;gap:8px;align-items:baseline}
.bwu-m .n small{font-size:10.5px;font-weight:400;color:var(--tc);letter-spacing:.8px;text-transform:uppercase;white-space:nowrap}
.bwu-m .d{margin-top:3px;font-size:11.5px;font-weight:400;line-height:1.5;color:#8fa9cc}
.bwu-cost{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin-top:7px;font-size:12.5px;color:#e6f2ff}
.bwu-cost span{display:inline-flex;align-items:center;gap:3px}.bwu-cost span.no{color:#ff9aa8}
.bwu-cost .gem3{width:19px;height:19px}.bwu-cost .tm{color:#9fd8ff;font-weight:400;margin-left:auto}
.bwu-go{margin-top:8px;display:flex;gap:8px}
.bwu-go button{flex:1;padding:9px 6px;border-radius:12px;border:1px solid #bfe6ff;background:linear-gradient(180deg,#5fb6ff,#1b4fb8);color:#fff;font-weight:700;font-size:13.5px;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}
.bwu-go button.sec{background:rgba(255,255,255,.06);border-color:rgba(120,190,255,.35);color:#cfe6ff}
.bwu-go button.rush{background:linear-gradient(180deg,#6ff0ff,#1b86c8)}
.bwu-go button:disabled{opacity:.45;filter:grayscale(.5)}
.bwu-go .gem3{width:17px;height:17px}
.bwu-pr{margin-top:8px;height:9px;border-radius:5px;background:#020814;border:1px solid rgba(120,190,255,.3);overflow:hidden}
.bwu-pr i{display:block;height:100%;background:linear-gradient(90deg,#2b86ff,#6fe8ff);box-shadow:0 0 8px #6fe8ff}
.bwu-up{display:flex;justify-content:space-between;font-size:12px;color:#bfe2ff;margin-top:5px}
.bwu-note{margin:14px 6px 4px;font-size:12px;font-weight:400;line-height:1.7;color:#8fa9cc;text-align:center}
.bwu-road{display:flex;gap:11px;padding:10px 4px;border-bottom:1px solid rgba(255,255,255,.06);align-items:center}
.bwu-road b{flex:0 0 78px;font-size:12.5px;color:#8fd3ff}.bwu-road span{flex:1;font-size:12.5px;font-weight:400;color:#c4d6f0;line-height:1.5}
.bwu-road.done b{color:#7dffb5}.bwu-road.done span{color:#7f9a8c;text-decoration:line-through}
@media (orientation:landscape) and (max-height:560px){.bwu-pan{max-width:560px;left:calc(14px + var(--sl));right:calc(14px + var(--sr));top:calc(var(--st) + 22px);bottom:calc(var(--sb) + 22px)}.bwu-btn{transform:scale(.8)}}
`;

export function createUpgradeUI(mount, { econ, ui, audio } = {}) {
  const host = (ui && ui.root) || mount;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const btn = document.createElement('div'); btn.className = 'bwu-btn';
  btn.innerHTML = `<div class="ring"></div><div class="core">${icon('keep', 30)}</div><div class="bd"></div><div class="lb">KINGDOM</div>`;
  const pan = document.createElement('div'); pan.className = 'bwu';
  pan.innerHTML = `<div class="bwu-pan"><div class="bwu-h"><span class="t">Kingdom</span><div class="bwu-x" data-a="x">✕</div></div>
    <div class="bwu-bl"></div><div class="bwu-tabs"></div><div class="bwu-cats"></div><div class="bwu-body"></div></div>`;
  host.appendChild(btn); host.appendChild(pan);
  const $ = (s) => pan.querySelector(s), BL = $('.bwu-bl'), TABS = $('.bwu-tabs'), CATSEL = $('.bwu-cats'), BODY = $('.bwu-body');
  const S = { open: false, tab: 'owned', cat: 'all', hl: null, busy: false, ended: new Set() };
  const P = () => econ && econ.st && econ.st.prog;
  const now = () => (econ ? econ.now() : Date.now() / 1000);
  const click = () => { audio && audio.click && audio.click(); ui && ui.haptic && ui.haptic('light'); };

  const costHtml = (cost, have) => GEM_KEYS.filter((g) => cost && cost[g]).map((g) => `<span class="${have && have[g] < cost[g] ? 'no' : ''}">${GEMS[g]}${fmtN(cost[g])}</span>`).join('');
  const tile = (id, lv, tierLv = lv) => {
    const T = TIERS[tierOf(Math.max(1, tierLv))], g = gemOf(id);
    return `<div class="bwu-t" style="--tc:${T[1]};--tb:${T[2]}">${icon(id, 30)}${g ? `<div class="gm">${GEMS[g]}</div>` : ''}<div class="lv">${lv ? 'Lv ' + lv : '—'}</div></div>`;
  };

  function builderStrip(p) {
    const act = Object.entries(p.structs).filter(([, r]) => r.up && !r.up.reserved).map(([e, r]) => ({ e, r }));
    let h = '';
    for (let i = 0; i < 3; i++) {
      if (i >= p.builders) { h += `<div class="bwu-b off"><div class="ic">${icon('workshop', 20)}</div><div class="tx">Castle 7</div></div>`; continue; }
      const a = act[i];
      if (!a) { h += `<div class="bwu-b"><div class="ic">${icon('workshop', 20)}</div><div class="tx">Builder ${i + 1}<br><i>idle</i></div></div>`; continue; }
      const u = a.r.up, left = Math.max(0, u.end - now()), f = 1 - left / Math.max(1, u.dur);
      h += `<div class="bwu-b busy"><div class="ic">${icon(a.e, 20)}</div><div class="tx" data-end="${u.end}">${fmtT(left)}</div><div class="bar" style="width:${Math.min(100, Math.max(0, f * 100)).toFixed(1)}%"></div></div>`;
    }
    BL.innerHTML = h;
  }

  function row(e, r, p, mode) {
    const have = econ.st.gems, lv = r.lv, hl = S.hl === e ? ' hl' : '';
    const g = gemOf(e);
    let body = '';
    if (r.up) {
      const u = r.up;
      if (u.reserved) {
        body = `<div class="bwu-up"><span>Reserved · Lv ${u.to}</span><span>${fmtT(u.dur)}</span></div>
          <div class="bwu-go"><button class="sec" data-a="cancel" data-e="${e}">Cancel (refund)</button></div>`;
      } else {
        const left = Math.max(0, u.end - now()), f = 1 - left / u.dur;
        body = `<div class="bwu-pr"><i style="width:${Math.min(100, Math.max(0, f * 100)).toFixed(1)}%" data-bar="${e}"></i></div>
          <div class="bwu-up"><span>Upgrading to Lv ${u.to}</span><span data-end="${u.end}">${fmtT(left)}</span></div>
          <div class="bwu-go">${u.rush_cut === 0 && u.rush === 0 && !u.rush_full ? `<button class="sec" disabled>Rush limit · ${fmtH(Math.max(0, (p.rush_day_h || 4) * 3600))}/day</button>` : `<button class="rush" data-a="rush" data-e="${e}" ${have.turq < u.rush ? 'disabled' : ''}>${u.rush > 0 ? (u.rush_full === false ? `Rush −${fmtH(u.rush_cut)} ${GEMS.turq}${fmtN(u.rush)}` : `Rush ${GEMS.turq}${fmtN(u.rush)}`) : 'Finish free'}</button>`}<button class="sec" data-a="cancel" data-e="${e}">Cancel</button></div>`;
      }
    } else if (r.next && r.next.cost) {
      const nx = r.next, free = p.builders_busy < p.builders, canReserve = p.reserved < p.reserve_max;
      let label, dis = false, cls = '';
      if (nx.ok) label = free ? (lv ? `Upgrade to Lv ${nx.to}` : 'Build') : 'Reserve';
      else { dis = true; cls = 'sec'; const i = nx.info || {}; label = nx.why === 'cap' ? `Castle Lv ${i.need_keep}` : nx.why === 'locked' ? `Castle Lv ${i.need_keep}` : nx.why === 'round' ? `All buildings Lv ${i.need} first (${(i.left || []).length} left)` : nx.why === 'vault' ? `Bigger ${i.gem === 'turq' ? 'turquoise' : i.gem} vault` : nx.why === 'gems' ? 'Not enough gems' : (WHY[nx.why] || nx.why); }
      if (nx.ok && !free && !canReserve) { dis = true; label = 'Queue full'; }
      body = `<div class="bwu-cost">${costHtml(nx.cost, have)}<span class="tm">⏱ ${fmtT(nx.dur)}</span></div>
        <div class="bwu-go"><button class="${cls}" data-a="up" data-e="${e}" ${dis ? 'disabled' : ''}>${label}</button></div>`;
    } else body = `<div class="bwu-note" style="margin:6px 0 0;text-align:left">Maximum level — ${TIERS[5][0]} tier</div>`;
    const T = TIERS[tierOf(Math.max(1, lv))];
    return `<div class="bwu-r${hl}" data-row="${e}">${tile(e, lv)}<div class="bwu-m"><div class="n"><span>${NAME[e]}</span><small style="--tc:${T[1]}">${lv ? T[0] : 'Not built'}</small></div>
      <div class="d">${DESC[e] || ''}</div>${body}</div></div>`;
  }

  function render() {
    const p = P(); if (!p) return;
    builderStrip(p);
    const E = Object.entries(p.structs), owned = E.filter(([, r]) => r.lv > 0), unbuilt = E.filter(([, r]) => r.lv === 0 && !r.up);
    const resv = E.filter(([, r]) => r.up && r.up.reserved), act = E.filter(([, r]) => r.up && !r.up.reserved);
    TABS.innerHTML = [['owned', 'Owned', owned.length], ['reserve', 'Reserve', `${p.reserved}/${p.reserve_max}`], ['buy', 'Buy', unbuilt.length], ['new', 'New', '']]
      .map(([k, n, c]) => `<div class="bwu-tab${S.tab === k ? ' on' : ''}" data-tab="${k}">${n}${c !== '' ? ` <small>${c}</small>` : ''}</div>`).join('');
    CATSEL.style.display = S.tab === 'owned' ? 'flex' : 'none';
    CATSEL.innerHTML = CATS.map(([k, n]) => `<div class="bwu-cat${S.cat === k ? ' on' : ''}" data-cat="${k}">${n}</div>`).join('');
    let h = '';
    const bb = econ.boosts ? econ.boosts().build : null;
    if (S.tab === 'owned' || S.tab === 'reserve') h += `<div class="bwu-note" style="margin:6px 2px 0;display:flex;justify-content:space-between;gap:8px;text-align:left">${bb ? `<span style="color:#8fe0ff">⚡ Builder boost +${bb.p}% · ${fmtT(bb.end - now())}</span>` : '<span>Faster builders: Shop › Boosts</span>'}<span>Rush left today ${fmtH(Math.max(0, p.rush_h || 0) * 3600)}</span></div>`;
    if (S.tab === 'owned') {
      const list = owned.filter(([, r]) => S.cat === 'all' || r.cat === S.cat);
      h += list.map(([e, r]) => row(e, r, p, 'owned')).join('') || '<div class="bwu-note">Nothing here yet.</div>';
    } else if (S.tab === 'reserve') {
      h += act.concat(resv).map(([e, r]) => row(e, r, p, 'reserve')).join('');
      h += `<div class="bwu-note">Reserved upgrades are paid now and start by themselves, to the second, the moment a builder is free. You can hold ${p.reserve_max} at a time.${p.next_builder ? `<br>Builder ${p.builders + 1} arrives with Castle Lv ${p.next_builder}.` : ''}</div>`;
    } else if (S.tab === 'buy') {
      h = unbuilt.map(([e, r]) => row(e, r, p, 'buy')).join('') || '<div class="bwu-note">Everything is built — upgrade it all!</div>';
    } else {
      const keep = p.b.keep, A = [[3, 'Stable — horses & winged horses'], [4, 'Ballista towers on the walls'], [5, 'Forge — better armour'], [7, 'Siege workshop & a third builder'], [10, 'Dragon lair — dragons!']];
      const V = [[1, 'Wooden kingdom'], [6, 'Stone walls & towers'], [12, 'Iron plating, banners'], [18, 'Golden trim, glowing runes'], [24, 'Diamond, faceted & icy'], [30, 'Blue Crystal — the legendary Blue Wall']];
      h = '<div class="bwu-note" style="text-align:left;margin-top:10px">CASTLE UNLOCKS</div>' + A.map(([l, t]) => `<div class="bwu-road${keep >= l ? ' done' : ''}"><b>Castle Lv ${l}</b><span>${t}</span></div>`).join('')
        + '<div class="bwu-note" style="text-align:left;margin-top:16px">LOOK OF EACH STRUCTURE (by its own level)</div>' + V.map(([l, t]) => `<div class="bwu-road"><b>Lv ${l}</b><span>${t}</span></div>`).join('');
    }
    BODY.innerHTML = h;
    updateBtn();
  }

  function updateBtn() {
    const p = P(); if (!p) { btn.style.display = 'none'; return; }
    btn.style.display = '';
    const act = Object.values(p.structs).filter((r) => r.up && !r.up.reserved), idle = p.builders - act.length;
    const afford = Object.values(p.structs).some((r) => r.next && r.next.ok);
    btn.classList.toggle('hot', idle > 0 && afford);
    const bd = btn.querySelector('.bd');
    if (idle > 0 && afford) { bd.className = 'bd'; bd.textContent = String(idle); }
    else if (act.length) { const t = Math.min(...act.map((r) => r.up.end)) - now(); bd.className = 'bd t'; bd.textContent = fmtT(t); bd.dataset.end = String(Math.min(...act.map((r) => r.up.end))); }
    else { bd.className = 'bd'; bd.textContent = ''; }
  }

  // ---- actions
  async function act(op, ent) {
    if (S.busy) return; S.busy = true;
    try {
      const j = await econ.upgrade(op, ent);
      if (j && j.ok) {
        if (op === 'start') ui.toast(j.info && j.info.reserved ? `${NAME[ent]} reserved` : `${NAME[ent]}: upgrade started`);
        else if (op === 'speedup') { ui.toast(j.info && j.info.full === false ? `${NAME[ent]}: ${fmtH(j.info.cut)} faster` : `${NAME[ent]} done!`); audio && audio.coins && audio.coins(); }
        else if (op === 'cancel') ui.toast('Cancelled');
      } else ui.toast(WHY[(j && j.why) || 'bad'] || 'Not possible');
    } finally { S.busy = false; render(); }
  }
  pan.addEventListener('click', (e) => {
    const t = e.target.closest('[data-a],[data-tab],[data-cat]'); if (!t) { if (e.target === pan) close(); return; }
    click();
    if (t.dataset.a === 'x') return close();
    if (t.dataset.tab) { S.tab = t.dataset.tab; BODY.scrollTop = 0; return render(); }
    if (t.dataset.cat) { S.cat = t.dataset.cat; return render(); }
    const e2 = t.dataset.e;
    if (t.dataset.a === 'up') act('start', e2); else if (t.dataset.a === 'rush') act('speedup', e2); else if (t.dataset.a === 'cancel') act('cancel', e2);
  });
  btn.addEventListener('click', () => { click(); open(); });

  function open(tab) { if (tab) S.tab = tab; S.open = true; pan.classList.add('on'); render(); }
  function close() { S.open = false; S.hl = null; pan.classList.remove('on'); }
  function focus(ent) {
    const p = P(); if (!p || !p.structs[ent]) return open();
    S.tab = p.structs[ent].lv > 0 || p.structs[ent].up ? 'owned' : 'buy'; S.cat = 'all'; S.hl = ent; open();
    requestAnimationFrame(() => { const r = BODY.querySelector(`[data-row="${ent}"]`); if (r) r.scrollIntoView({ block: 'center' }); });
  }

  // ---- 1 Hz: countdowns + completion
  setInterval(() => {
    const p = P(); if (!p) return;
    const t = now();
    host.querySelectorAll('[data-end]').forEach((el) => { const end = +el.dataset.end; el.textContent = fmtT(end - t); });
    if (S.open) pan.querySelectorAll('[data-bar]').forEach((el) => { const r = p.structs[el.dataset.bar]; if (r && r.up && r.up.end) el.style.width = Math.min(100, Math.max(0, (1 - (r.up.end - t) / Math.max(1, r.up.dur)) * 100)).toFixed(1) + '%'; });
    for (const [e, r] of Object.entries(p.structs)) {
      if (r.up && r.up.end && r.up.end <= t && !S.ended.has(e + r.up.to)) {
        S.ended.add(e + r.up.to);
        econ.load().then(() => { ui.toast(`${NAME[e]} reached Lv ${r.up.to}!`); audio && audio.coins && audio.coins(); if (S.open) render(); });
      }
    }
  }, 1000);

  return { open, close, focus, update() { if (S.open) render(); else updateBtn(); } };
}
