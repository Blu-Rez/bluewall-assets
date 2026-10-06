// Cups UI.  Home: a small CUPS chip above the build button (bottom right) showing the league badge and the number of cups; it opens the panel:
//   * Leaderboard: the top 20 kingdoms by cups (crest, name, league) with your own place pinned at the bottom when you are not on the list
//   * Leagues: the six steps from Steel to the Blue Crown and how cups are won and lost
//   * Invite: your personal link; a friend who opens the game from it and reaches Castle 3 pays you 1,000 turquoise
// Rules and numbers come from the server (social.py, GET /api/rank); this file only draws.
//   createRankUI(mount, { econ, ui, audio }) -> { open(), close(), update() }
import { LEAGUES, leagueBadge, leagueIdx, cupSvg } from './cups.js';
import { crestImg, normEmblem } from './emblems.js';
import { GEMS } from './ui.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtN = (n) => Math.floor(n).toLocaleString('en-US');
const MEDAL = ['#43e0ff', '#dbe8f7', '#8fa6c4'];

export const BWK_CSS = `
.bwk-chip{pointer-events:auto;position:absolute;right:calc(14px + var(--sr));bottom:calc(var(--sb) + 112px);height:34px;padding:0 12px 0 5px;display:flex;align-items:center;gap:6px;border-radius:17px;font-size:12.5px;letter-spacing:.6px;color:#e4f3ff;
  background:linear-gradient(180deg,rgba(24,52,104,.92),rgba(5,14,36,.94));border:1px solid rgba(140,200,255,.45);box-shadow:0 3px 10px rgba(0,0,0,.5);cursor:pointer;transition:opacity .6s,transform .15s;-webkit-tap-highlight-color:transparent;font-variant-numeric:tabular-nums}
.bwk-chip:active{transform:scale(.94)}.bwk-chip .lgb{width:24px;height:auto}.bwk-chip b{font-weight:700}
.bw-ui.wel>.bwk-chip{opacity:0;pointer-events:none}
.bwk{position:absolute;inset:0;pointer-events:auto;z-index:12;background:rgba(0,3,10,.66);opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s;font-family:'Libre Baskerville','Noto Sans Tai Viet',Georgia,serif;color:#eaf6ff;-webkit-tap-highlight-color:transparent}
.bwk.on{opacity:1;visibility:visible}.bwk *{box-sizing:border-box}
.bwk-pan{position:absolute;left:max(22px,calc(var(--sl) + 16px));right:max(22px,calc(var(--sr) + 16px));top:calc(var(--st) + max(64px,12vh));bottom:calc(var(--sb) + max(64px,12vh));max-width:440px;margin:0 auto;display:flex;flex-direction:column;border-radius:22px;overflow:hidden;
  background:linear-gradient(180deg,#0d2a5c,#050f26 38%,#020712);border:1.5px solid rgba(150,200,255,.4);box-shadow:0 20px 60px rgba(0,0,0,.7),inset 0 1px 0 rgba(200,230,255,.25);transform:translateY(18px) scale(.98);transition:transform .3s}
.bwk.on .bwk-pan{transform:none}
.bwk-h{display:flex;align-items:center;gap:12px;padding:14px 12px 6px 14px}.bwk-h .bd{flex:0 0 auto;width:62px}.bwk-h .bd .lgb{width:62px;height:auto}
.bwk-h .t{flex:1;min-width:0}.bwk-h .t b{display:block;font-size:20px;letter-spacing:.5px;color:var(--lc,#e6f6ff);text-shadow:0 0 12px var(--lg,transparent)}.bwk-h .t span{display:flex;align-items:center;gap:5px;font-size:13px;color:#cfe6ff;margin-top:2px}
.bwk-x{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:rgba(255,255,255,.08);border:1px solid rgba(150,200,255,.25);font-size:14px;cursor:pointer;align-self:flex-start}
.bwk-pg{margin:6px 14px 2px}.bwk-pg .r{display:flex;justify-content:space-between;font-size:11.5px;color:#9db9de}.bwk-pg .r b{color:#eaf6ff}
.bwk-bar{position:relative;margin-top:5px;height:10px;border-radius:6px;background:#020814;border:1px solid rgba(120,190,255,.35);overflow:hidden}.bwk-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:6px;background:linear-gradient(90deg,#2b86ff,#7ef0ff);box-shadow:0 0 8px rgba(110,232,255,.7);transition:width .5s}
.bwk-tabs{display:flex;gap:6px;margin:10px 12px 0;padding:4px;border-radius:14px;background:rgba(2,8,20,.7);border:1px solid rgba(120,190,255,.2)}
.bwk-tabs button{flex:1;padding:9px 4px;border-radius:11px;border:0;background:transparent;color:#8fb4e0;font-weight:700;font-size:12px;line-height:1;font-family:inherit;letter-spacing:1px;cursor:pointer;text-transform:uppercase}
.bwk-tabs button.on{color:#fff;background:linear-gradient(180deg,#3d8cff,#1b4fb8);box-shadow:0 2px 8px rgba(40,110,230,.5)}
.bwk-body{flex:1;overflow-y:auto;padding:8px 10px 14px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.bwk-row{display:flex;align-items:center;gap:9px;margin:5px 0;padding:7px 10px 7px 8px;border-radius:14px;background:linear-gradient(180deg,rgba(40,90,170,.2),rgba(10,30,70,.25));border:1px solid rgba(120,190,255,.25)}
.bwk-row.me{border-color:#8fe0ff;background:linear-gradient(180deg,rgba(60,130,230,.34),rgba(14,44,100,.4));box-shadow:0 0 14px rgba(110,200,255,.35)}
.bwk-row .rk{flex:0 0 30px;text-align:center;font-size:15px;font-weight:700;color:#bcd6f3;font-variant-numeric:tabular-nums}
.bwk-row .rk.m{font-size:17px;color:var(--mc);text-shadow:0 0 10px var(--mc)}
.bwk-row .cr{flex:0 0 auto;width:36px;height:36px;display:grid;place-items:center}
.bwk-row .nm{flex:1;min-width:0}.bwk-row .nm b{display:block;font-size:13.5px;color:#eaf6ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bwk-row .nm span{font-size:10.5px;letter-spacing:1.2px;text-transform:uppercase;color:var(--lc,#9db9de)}
.bwk-row .tp{display:flex;align-items:center;gap:5px;font-size:14px;font-weight:700;color:#eaf6ff;font-variant-numeric:tabular-nums}.bwk-row .tp svg{color:#8fd8ff}
.bwk-row .lgb{width:26px;height:auto}
.bwk-gap{text-align:center;color:#6f8db8;letter-spacing:6px;margin:2px 0}
.bwk-empty{margin:28px 10px;text-align:center;font-size:13px;line-height:1.7;color:#9db9de}
.bwk-lg{display:flex;align-items:center;gap:12px}.bwk-lg .lgb{width:40px;height:auto}.bwk-lg .nm{flex:1}.bwk-lg .nm b{display:block;font-size:14.5px;color:var(--lc)}.bwk-lg .nm span{font-size:11.5px;color:#9db9de}.bwk-lg .tp{font-size:13px;color:#cfe6ff;font-variant-numeric:tabular-nums}
.bwk-row.cur{border-color:var(--lc);box-shadow:0 0 12px var(--lg)}
.bwk-how{margin:12px 4px 4px;padding:11px 13px;border-radius:14px;background:rgba(2,8,20,.55);border:1px solid rgba(120,190,255,.2);font-size:12px;line-height:1.75;color:#b4cdec}.bwk-how b{color:#eaf6ff}
.bwk-inv{text-align:center;padding:10px 6px}.bwk-inv h3{margin:10px 0 12px;font-size:18px;color:#eaf6ff}.bwk-inv p{margin:0 8px 14px;font-size:12.5px;line-height:1.65;color:#b4cdec}
.bwk-inv .pay{display:inline-flex;align-items:center;gap:7px;padding:8px 16px;border-radius:16px;font-size:20px;font-weight:700;color:#e6fbff;background:linear-gradient(180deg,rgba(40,120,200,.5),rgba(10,40,90,.6));border:1px solid rgba(140,225,255,.6);box-shadow:0 0 18px rgba(80,200,255,.35)}
.bwk-inv .pay .gem3{width:24px;height:24px}.bwk-inv .pay small{font-size:12px;font-weight:400;color:#a9c8ea;margin-left:3px;letter-spacing:.4px}.bwk-inv .lgb{margin:0 auto}
.bwk-inv .stp{list-style:none;margin:16px 4px 16px;padding:0;text-align:left}.bwk-inv .stp li{display:flex;align-items:center;gap:11px;margin:7px 0;padding:9px 12px;border-radius:13px;background:rgba(2,8,20,.5);border:1px solid rgba(120,190,255,.2);font-size:12.5px;line-height:1.45;color:#c4dbf5}.bwk-inv .stp i{flex:0 0 24px;height:24px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:700;font-size:12px;color:#fff;background:linear-gradient(180deg,#3d8cff,#1b4fb8);border:1px solid #bfe0ff}
.bwk-lk{display:flex;gap:8px;margin:0 4px 10px}.bwk-lk input{flex:1;min-width:0;padding:11px 12px;border-radius:12px;border:1px solid rgba(140,200,255,.4);background:#020814;color:#cfe6ff;font-size:12px;font-family:inherit}
.bwk-lk button,.bwk-sh{padding:11px 16px;border-radius:12px;border:1px solid #bff6ff;background:linear-gradient(180deg,#6ff0ff,#1b86c8);color:#021;font-weight:700;font-size:13px;font-family:inherit;cursor:pointer;letter-spacing:.6px}
.bwk-sh{display:block;width:calc(100% - 8px);margin:0 4px;padding:14px;font-size:15px;letter-spacing:1.5px;border-color:#c9e3ff;background:linear-gradient(180deg,#4d9bff,#1b4fb8);color:#fff}
.bwk-inv .st{margin-top:14px;font-size:12px;color:#9db9de}.bwk-inv .st b{color:#eaf6ff}
@media (orientation:landscape) and (max-height:560px){.bwk-pan{max-width:560px;left:calc(14px + var(--sl));right:calc(14px + var(--sr));top:calc(var(--st) + 22px);bottom:calc(var(--sb) + 22px)}.bwk-chip{bottom:calc(var(--sb) + 100px)}}
`;

export function createRankUI(mount, { econ, ui, audio } = {}) {
  const host = (ui && ui.root) || mount;
  if (!document.getElementById('bwk-css')) { const stEl = document.createElement('style'); stEl.id = 'bwk-css'; stEl.textContent = BWK_CSS; document.head.appendChild(stEl); }
  const chip = document.createElement('div'); chip.className = 'bwk-chip';
  const pan = document.createElement('div'); pan.className = 'bwk';
  pan.innerHTML = `<div class="bwk-pan"><div class="bwk-h"><div class="bd"></div><div class="t"><b></b><span></span></div><div class="bwk-x" data-a="x">✕</div></div>
    <div class="bwk-pg"></div>
    <div class="bwk-tabs"><button data-t="lb" class="on">Leaderboard</button><button data-t="lg">Leagues</button><button data-t="inv">Invite</button></div>
    <div class="bwk-body"></div></div>`;
  host.appendChild(chip); host.appendChild(pan);
  const $ = (s) => pan.querySelector(s);
  const BODY = $('.bwk-body');
  const S = { open: false, tab: 'lb', data: null, busy: false };
  const click = () => { audio && audio.click && audio.click(); ui && ui.haptic && ui.haptic('light'); };
  const toast = (m) => ui && ui.toast && ui.toast(m);
  const tro = () => Math.max(0, (econ && econ.st && econ.st.tro) || 0);

  function paintChip() {
    const t = tro(), i = leagueIdx(t);
    chip.innerHTML = `${leagueBadge(i, 24)}<b>${fmtN(t)}</b>`;
  }
  function paintHead() {
    const t = S.data && S.data.me ? S.data.me.tro : tro(), i = leagueIdx(t), L = LEAGUES[i], nx = LEAGUES[i + 1];
    pan.style.setProperty('--lc', L.color); pan.style.setProperty('--lg', L.color + '99');
    $('.bwk-h .bd').innerHTML = leagueBadge(i, 62);
    $('.bwk-h .t b').textContent = L.name + ' League';
    $('.bwk-h .t span').innerHTML = `${cupSvg(16)}<b style="color:#fff">${fmtN(t)}</b> cups` + (S.data && S.data.me && S.data.me.rank ? ` · rank <b style="color:#fff">#${fmtN(S.data.me.rank)}</b>` : '');
    const best = S.data && S.data.me ? S.data.me.best : t;
    $('.bwk-pg').innerHTML = nx ? `<div class="r"><span>Next: <b>${nx.name}</b></span><span><b>${fmtN(t)}</b> / ${fmtN(nx.from)}</span></div><div class="bwk-bar"><i style="width:${Math.max(2, Math.min(100, ((t - L.from) / (nx.from - L.from)) * 100)).toFixed(1)}%"></i></div>`
      : `<div class="r"><span>The top league</span><span>Best <b>${fmtN(best)}</b></span></div><div class="bwk-bar"><i style="width:100%"></i></div>`;
  }
  function row(r, extra = '') {
    const L = LEAGUES[Math.max(0, Math.min(5, r.lg || 0))], m = r.r <= 3 && r.r > 0;
    return `<div class="bwk-row${r.me ? ' me' : ''}" style="--lc:${L.color}${m ? `;--mc:${MEDAL[r.r - 1]}` : ''}"><div class="rk${m ? ' m' : ''}">${r.r ? r.r : '–'}</div><div class="cr">${crestImg(normEmblem(r.e) || 'swords', 34)}</div>
      <div class="nm"><b>${esc(r.n || 'Kingdom')}${r.me ? ' (you)' : ''}</b><span>${L.name}</span></div><div class="tp">${cupSvg(15)}${fmtN(r.tro)}</div></div>${extra}`;
  }
  function paintBody() {
    const d = S.data;
    if (S.tab === 'lb') {
      if (!d) { BODY.innerHTML = '<div class="bwk-empty">Loading…</div>'; return; }
      if (d.failed) { BODY.innerHTML = '<div class="bwk-empty">The leaderboard could not be loaded.<br>Try again in a moment.</div>'; return; }
      const top = d.top || [];
      let h = '';
      if (!top.length) h += '<div class="bwk-empty">No one has earned cups yet.<br>Win a battle to be the first on the list.</div>';
      for (const r of top) h += row(r);
      const me = d.me;
      if (me && !top.some((r) => r.me)) {
        h += (top.length ? '<div class="bwk-gap">···</div>' : '') + row({ r: me.rank || 0, e: me.e, n: me.n || 'You', tro: me.tro, lg: me.lg, me: true });
      }
      BODY.innerHTML = h;
    } else if (S.tab === 'lg') {
      const cur = leagueIdx(S.data && S.data.me ? S.data.me.tro : tro());
      BODY.innerHTML = LEAGUES.map((L, i) => `<div class="bwk-row bwk-lg${i === cur ? ' cur' : ''}" style="--lc:${L.color};--lg:${L.color}88">${leagueBadge(i, 40)}<div class="nm"><b>${L.name}</b><span>${i === cur ? 'Your league' : i < cur ? 'Reached' : 'Locked'}</span></div><div class="tp">${L.from ? fmtN(L.from) + '+' : 'Start'}</div></div>`).join('') +
        `<div class="bwk-how"><b>How cups work</b><br>A battle with at least one star wins cups: <b>+18</b> for one star, <b>+28</b> for two, <b>+40</b> for three (a stronger enemy pays a little more).<br>An attack without a star costs <b>10</b>. Under 60 cups you lose nothing while you learn.<br>When a real player takes your loot you lose some cups; when you hold them off you gain a few.</div>`;
    } else {
      const iv = (d && d.invite) || { pay: 1000, keep: 3, done: 0, max: 50, link: '' };
      BODY.innerHTML = `<div class="bwk-inv">${leagueBadge(5, 60)}<h3>Invite a friend</h3>
        <div class="pay">${fmtN(iv.pay)} ${GEMS.turq || ''}<small>for every friend</small></div>
        <ol class="stp"><li><i>1</i><span>Send your personal link to a friend</span></li><li><i>2</i><span>They open the game from it and start building</span></li><li><i>3</i><span>When their castle reaches level ${iv.keep}, the turquoise is yours</span></li></ol>
        ${iv.link ? `<div class="bwk-lk"><input readonly value="${esc(iv.link)}" aria-label="Your invite link"><button data-a="copy">Copy</button></div><button class="bwk-sh" data-a="share">SHARE WITH A FRIEND</button>` : '<p>Open the game from Telegram to get your link.</p>'}
        <div class="st">Friends rewarded: <b>${fmtN(iv.done)}</b> / ${fmtN(iv.max)}</div></div>`;
    }
  }
  const paint = () => { paintHead(); paintBody(); };

  async function load() {
    if (S.busy) return; S.busy = true;
    try { const j = await econ.rank(); S.data = j && j.ok ? j : { failed: true, me: { tro: tro() } }; } catch (e) { S.data = { failed: true, me: { tro: tro() } }; }
    S.busy = false; if (S.open) paint();
  }
  function open(tab) {
    if (S.open) return; S.open = true; S.data = null; if (tab) { S.tab = tab; pan.querySelectorAll('.bwk-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === tab)); }
    pan.classList.add('on'); click(); paint(); load();
  }
  function close() { S.open = false; pan.classList.remove('on'); }
  async function copy(link, btn) {
    try { await navigator.clipboard.writeText(link); } catch (e) { const i = pan.querySelector('.bwk-lk input'); if (i) { i.select(); try { document.execCommand('copy'); } catch (e2) { /* ignore */ } } }
    if (btn) { btn.textContent = 'Copied ✓'; setTimeout(() => { btn.textContent = 'Copy'; }, 1600); }
    toast('Link copied');
  }
  function share(link) {
    const text = 'Join me in Blue Wall — build a castle, raise an army, take the crown!';
    const url = 'https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(text);
    try { if (ui && ui.tg && ui.tg.openTelegramLink) { ui.tg.openTelegramLink(url); return; } } catch (e) { /* fall through */ }
    if (navigator.share) { navigator.share({ title: 'Blue Wall', text, url: link }).catch(() => {}); return; }
    copy(link, null);
  }
  chip.addEventListener('click', () => open());
  pan.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a],[data-t]'); if (!a) { if (e.target === pan) close(); return; }
    if (a.dataset.t) { S.tab = a.dataset.t; pan.querySelectorAll('.bwk-tabs button').forEach((b) => b.classList.toggle('on', b === a)); click(); paintBody(); BODY.scrollTop = 0; return; }
    if (a.dataset.a === 'x') { click(); close(); } else if (a.dataset.a === 'copy') copy(S.data.invite.link, a); else if (a.dataset.a === 'share') share(S.data.invite.link);
  });
  paintChip();
  return { open, close, update() { paintChip(); if (S.open) paintHead(); }, get isOpen() { return S.open; } };
}
