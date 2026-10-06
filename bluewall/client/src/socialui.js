// Social panel: three tabs on one small sheet.
//   * Clan     — create one (name + 2–4 character tag) or join one from the list; members, total cups, leave / kick
//   * Friends  — everyone who opened the game from your invite link, and whether the 1,000 turquoise reward has been earned
//   * Log      — the last attacks you made and the last attacks made on your kingdom (stars, %, loot, cups)
// Data from the server (GET /api/clan, /api/friends, /api/log; POST /api/clan); this file only draws.
//   createSocialUI(mount, { econ, ui, audio }) -> { open(tab), close(), isOpen, unseen(), refresh() }
import { LEAGUES, leagueBadge, leagueIdx, cupSvg } from './cups.js';
import { crestImg, normEmblem } from './emblems.js';
import { GEMS } from './ui.js';
import { BWK_CSS } from './rankui.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtN = (n) => Math.floor(n).toLocaleString('en-US');
const SEEN = 'bw_log_seen';
const lsGet = (k) => { try { return +localStorage.getItem(k) || 0; } catch (e) { return 0; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, String(v)); } catch (e) { /* ignore */ } };
const ago = (t, now) => { const d = Math.max(0, now - t); return d < 90 ? 'just now' : d < 3600 ? Math.round(d / 60) + ' min ago' : d < 86400 ? Math.round(d / 3600) + ' h ago' : Math.round(d / 86400) + ' d ago'; };
const star = (on) => `<svg viewBox="0 0 24 24" width="14" height="14" style="display:block"><path d="M12 2.6l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.7l1.3-6.6L2.5 9.5l6.6-.8z" fill="${on ? '#ffcf45' : 'rgba(255,255,255,.07)'}" stroke="${on ? '#a8780a' : '#6d83a6'}" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
const SWORD = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19L19 5M14 5h5v5M5 5l14 14M5 10V5h5"/></svg>`;
const SHIELD = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z"/></svg>`;
const CROWN = `<svg viewBox="0 0 24 24" width="13" height="13" style="display:block"><path d="M4 18L3 8l5 4 4-7 4 7 5-4-1 10z" fill="#43e0ff" stroke="#0a4a6a" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
const WHY = {
  name: 'Pick a name of 3 to 16 characters.', tag: 'The tag needs 2 to 4 letters or digits.', taken: 'That clan name is already taken.', low: 'Your castle must be level 2 first.',
  in_clan: 'You are already in a clan.', full: 'That clan is full.', gone: 'That clan no longer exists.', owner: 'Only the clan leader can do that.', none: 'Nothing to do.',
};

const CSS = `
.bwc .bwk-pan{top:calc(var(--st) + max(80px,15vh));bottom:auto;max-height:min(540px,calc(100% - var(--st) - var(--sb) - max(130px,28vh)))}
@media (orientation:landscape) and (max-height:560px){.bwc .bwk-pan{top:calc(var(--st) + 14px);max-height:calc(100% - var(--st) - var(--sb) - 28px)}}
.bwc-tag{display:inline-block;min-width:34px;padding:2px 6px;border-radius:8px;text-align:center;font-size:11px;font-weight:700;letter-spacing:1px;color:#031126;background:linear-gradient(180deg,#bfe9ff,#4fa8ff);border:1px solid #e6f6ff}
.bwc-h3{margin:12px 6px 6px;font-size:11.5px;letter-spacing:1.6px;text-transform:uppercase;color:#8fb4e0}
.bwc-card{margin:4px 2px 8px;padding:12px;border-radius:16px;background:linear-gradient(180deg,rgba(50,110,200,.28),rgba(8,26,64,.5));border:1px solid rgba(140,205,255,.4)}
.bwc-card .top{display:flex;align-items:center;gap:10px}.bwc-card .top b{font-size:17px;color:#eaf6ff;letter-spacing:.3px}.bwc-card .sub{margin-top:8px;display:flex;gap:14px;font-size:12px;color:#b4cdec;font-variant-numeric:tabular-nums}.bwc-card .sub b{color:#fff}
.bwc-in{display:flex;gap:8px;margin:8px 0}.bwc-in input{min-width:0;padding:11px 12px;border-radius:12px;border:1px solid rgba(140,200,255,.4);background:#020814;color:#e6f3ff;font-size:14px;font-family:inherit}.bwc-in input.n{flex:1}.bwc-in input.g{flex:0 0 76px;text-transform:uppercase;letter-spacing:2px;text-align:center}
.bwc-btn{display:block;width:100%;padding:12px;border-radius:13px;border:1px solid #c9e3ff;background:linear-gradient(180deg,#4d9bff,#1b4fb8);color:#fff;font-weight:700;font-size:13.5px;letter-spacing:1.2px;font-family:inherit;cursor:pointer;text-transform:uppercase}
.bwc-btn.sec{background:rgba(255,255,255,.07);border-color:rgba(160,205,255,.4);color:#cfe6ff}.bwc-btn.dng{background:rgba(255,255,255,.07);border-color:#9fb2cc;color:#d7e4f5}.bwc-btn:disabled{opacity:.45;filter:grayscale(.5)}
.bwc-err{min-height:16px;margin:2px 4px 4px;font-size:12px;color:#ffd9a8;text-align:center}
.bwc-row .go{flex:0 0 auto;padding:8px 12px;border-radius:11px;border:1px solid #c9e3ff;background:linear-gradient(180deg,#4d9bff,#1b4fb8);color:#fff;font-weight:700;font-size:12px;font-family:inherit;cursor:pointer;letter-spacing:.6px}.bwc-row .go:disabled{opacity:.45}
.bwc-row .go.x{background:rgba(255,255,255,.07);border-color:rgba(160,205,255,.4);color:#cfe6ff;padding:6px 9px}
.bwc-row .nm span i{font-style:normal;color:#43e0ff;margin-right:4px}
.bwc-lg{position:relative;display:flex;align-items:center;gap:10px;margin:5px 0;padding:9px 10px 9px 12px;border-radius:14px;background:linear-gradient(180deg,rgba(40,90,170,.2),rgba(10,30,70,.25));border:1px solid rgba(120,190,255,.25);overflow:hidden}
.bwc-lg:before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:#5fb6ff}.bwc-lg.d:before{background:#8aa0bd}.bwc-lg.new{border-color:#8fe0ff;box-shadow:0 0 12px rgba(110,200,255,.3)}
.bwc-lg .ic{flex:0 0 28px;display:grid;place-items:center;color:#8fd8ff}.bwc-lg.d .ic{color:#b4c4da}
.bwc-lg .mid{flex:1;min-width:0}.bwc-lg .mid b{display:block;font-size:13px;color:#eaf6ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bwc-lg .mid span{display:flex;align-items:center;gap:8px;margin-top:3px;font-size:11px;color:#9db9de;font-variant-numeric:tabular-nums}
.bwc-lg .st{display:flex;gap:1px}.bwc-lg .lt{display:flex;gap:7px;align-items:center}.bwc-lg .lt .gem3{width:13px;height:13px;vertical-align:-2px;margin-right:2px}
.bwc-lg .rt{flex:0 0 auto;text-align:right;font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;color:#eaf6ff}.bwc-lg .rt small{display:block;font-size:10px;font-weight:400;color:#8fa6c4;margin-top:2px}
.bwc-lg .rt.up{color:#9fffd0}.bwc-lg .rt.dn{color:#ffc7a8}
.bwc-inv{display:flex;align-items:center;gap:10px;margin:4px 2px 10px;padding:11px 12px;border-radius:15px;background:rgba(2,8,20,.55);border:1px solid rgba(140,225,255,.4)}
.bwc-inv .t{flex:1;font-size:12.5px;line-height:1.5;color:#cfe6ff}.bwc-inv .t b{color:#fff}.bwc-inv .gem3{width:16px;height:16px;vertical-align:-3px}.bwc-inv .amt{display:inline-flex;align-items:center;gap:4px;white-space:nowrap;vertical-align:-3px}.bwc-inv .amt .gem3{vertical-align:baseline}
.bwc-inv button{flex:0 0 auto;padding:10px 14px;border-radius:12px;border:1px solid #c9e3ff;background:linear-gradient(180deg,#4d9bff,#1b4fb8);color:#fff;font-weight:700;font-size:12.5px;font-family:inherit;cursor:pointer;letter-spacing:.8px}
.bwc-ok{color:#9fffd0;font-size:11px;letter-spacing:.4px}.bwc-wait{color:#9db9de;font-size:11px}
.bwk-tabs button .dot{display:inline-block;width:7px;height:7px;margin-left:5px;border-radius:50%;background:#7dffb5;box-shadow:0 0 6px #7dffb5;vertical-align:1px}
`;

export function createSocialUI(mount, { econ, ui, audio, rank } = {}) {
  const host = (ui && ui.root) || mount;
  if (!document.getElementById('bwk-css')) { const e0 = document.createElement('style'); e0.id = 'bwk-css'; e0.textContent = BWK_CSS; document.head.appendChild(e0); }
  const stEl = document.createElement('style'); stEl.textContent = CSS; document.head.appendChild(stEl);
  const pan = document.createElement('div'); pan.className = 'bwk bwc';
  pan.innerHTML = `<div class="bwk-pan"><div class="bwk-h"><div class="bd"></div><div class="t"><b>Community</b><span></span></div><div class="bwk-x" data-a="x">✕</div></div>
    <div class="bwk-tabs"><button data-t="clan" class="on">Clan</button><button data-t="friends">Friends</button><button data-t="log">Log<i class="dot" hidden></i></button></div>
    <div class="bwk-body"></div></div>`;
  host.appendChild(pan);
  const $ = (s) => pan.querySelector(s), BODY = $('.bwk-body');
  const S = { open: false, tab: 'clan', d: {}, busy: {}, err: '', confirm: 0, unseen: 0, lastLog: 0 };
  const click = () => { audio && audio.click && audio.click(); ui && ui.haptic && ui.haptic('light'); };
  const toast = (m) => ui && ui.toast && ui.toast(m);
  const nowS = () => (econ && econ.now ? econ.now() : Date.now() / 1000);

  // ------------------------------------------------------------------ drawing
  const lgName = (i) => LEAGUES[Math.max(0, Math.min(5, i || 0))];
  function member(m, mine) {
    const L = lgName(m.lg);
    return `<div class="bwk-row bwc-row${m.me ? ' me' : ''}" style="--lc:${L.color}"><div class="cr">${crestImg(normEmblem(m.e) || 'swords', 34)}</div>
      <div class="nm"><b>${m.owner ? CROWN + ' ' : ''}${esc(m.n)}</b><span>${L.name} · Castle ${m.k}</span></div><div class="tp">${cupSvg(15)}${fmtN(m.tro)}</div>
      ${mine && mine.me_owner && !m.owner ? `<button class="go x" data-a="kick" data-id="${m.id}" aria-label="Remove">✕</button>` : ''}</div>`;
  }
  function clanTab() {
    const d = S.d.clan;
    if (!d) return '<div class="bwk-empty">Loading…</div>';
    if (d.failed) return '<div class="bwk-empty">The clan list could not be loaded.<br>Try again in a moment.</div>';
    const err = `<div class="bwc-err">${esc(S.err)}</div>`;
    if (d.mine) {
      const c = d.mine;
      return `<div class="bwc-card"><div class="top"><span class="bwc-tag">${esc(c.tag)}</span><b>${esc(c.name)}</b></div>
        <div class="sub"><span>Members <b>${c.n}</b>/${c.max}</span><span>${cupSvg(14)} <b>${fmtN(c.tro)}</b> cups</span></div></div>
        ${err}${c.members.map((m) => member(m, c)).join('')}
        <div style="margin:14px 2px 4px"><button class="bwc-btn dng" data-a="leave">${S.confirm ? 'Tap again to leave' : 'Leave clan'}</button></div>`;
    }
    const top = d.top || [];
    return `<div class="bwc-card"><div class="top"><b>Create your clan</b></div>
      <div class="bwc-in"><input class="n" maxlength="16" placeholder="Clan name" aria-label="Clan name" autocomplete="off"><input class="g" maxlength="4" placeholder="TAG" aria-label="Clan tag" autocomplete="off"></div>
      ${err}<button class="bwc-btn" data-a="create"${S.busy.clan ? ' disabled' : ''}>Create clan</button>
      <div class="sub" style="margin-top:9px"><span>Needs castle level ${d.min_keep || 2} · up to ${d.max || 30} members</span></div></div>
      <div class="bwc-h3">Join a clan</div>
      ${top.length ? top.map((c) => `<div class="bwk-row bwc-row"><span class="bwc-tag">${esc(c.tag)}</span><div class="nm"><b>${esc(c.name)}</b><span>${c.n}/${c.max} members</span></div><div class="tp">${cupSvg(15)}${fmtN(c.tro)}</div>
        <button class="go" data-a="join" data-id="${c.id}"${c.n >= c.max || S.busy.clan ? ' disabled' : ''}>${c.n >= c.max ? 'Full' : 'Join'}</button></div>`).join('') : '<div class="bwk-empty">No clans yet.<br>Be the first to start one.</div>'}`;
  }
  function friendsTab() {
    const d = S.d.friends;
    if (!d) return '<div class="bwk-empty">Loading…</div>';
    if (d.failed) return '<div class="bwk-empty">Your friends could not be loaded.<br>Try again in a moment.</div>';
    const list = d.friends || [], done = list.filter((f) => f.paid).length;
    const head = `<div class="bwc-inv"><div class="t">Invite a friend and earn <span class="amt"><b>${fmtN(d.pay)}</b>${GEMS.turq}</span> when their castle reaches level <b>${d.keep}</b>.<br><span class="bwc-wait">${done} of ${fmtN(d.max)} rewards earned</span></div>
      ${d.link ? '<button data-a="share">Invite</button>' : ''}</div>`;
    if (!list.length) return head + '<div class="bwk-empty">No friends yet.<br>Send your link and they will show up here.</div>';
    return head + list.map((f) => {
      const L = lgName(f.lg);
      return `<div class="bwk-row bwc-row" style="--lc:${L.color}"><div class="cr">${crestImg(normEmblem(f.e) || 'swords', 34)}</div>
        <div class="nm"><b>${esc(f.n)}</b><span>${f.paid ? '<i class="bwc-ok">✓ reward earned</i>' : `<i class="bwc-wait">Castle ${f.k} of ${d.keep}</i>`}</span></div><div class="tp">${cupSvg(15)}${fmtN(f.tro)}</div></div>`;
    }).join('');
  }
  function logTab() {
    const d = S.d.log;
    if (!d) return '<div class="bwk-empty">Loading…</div>';
    if (d.failed) return '<div class="bwk-empty">The log could not be loaded.<br>Try again in a moment.</div>';
    const rows = d.log || [];
    if (!rows.length) return '<div class="bwk-empty">Nothing here yet.<br>Your attacks and the attacks on your kingdom will be listed.</div>';
    const seen = S.seenAt || 0, t0 = nowS();
    return rows.map((r) => {
      const att = r.k === 'a', loot = Object.entries(r.loot || {}).filter(([, n]) => n > 0).map(([g, n]) => `<i>${GEMS[g] || ''}${att ? '' : '−'}${fmtN(n)}</i>`).join('');
      const title = att ? esc(r.who) : esc(r.who) + (r.stars > 0 ? '' : ' · held');
      const sub = att ? `<span class="st">${[1, 2, 3].map((i) => star(i <= r.stars)).join('')}</span><span>${r.pct}%</span>` : (r.stars > 0 ? `<span class="st">${[1, 2, 3].map((i) => star(i <= r.stars)).join('')}</span><span>${r.pct}%</span>` : '<span>attack failed</span>');
      const tr2 = r.tro ? `<div class="rt ${r.tro > 0 ? 'up' : 'dn'}">${r.tro > 0 ? '+' : '−'}${Math.abs(r.tro)}<small>cups</small></div>` : '<div class="rt"></div>';
      return `<div class="bwc-lg ${att ? 'a' : 'd'}${!att && r.t > seen ? ' new' : ''}"><div class="ic">${att ? SWORD : SHIELD}</div><div class="mid"><b>${att ? 'Attacked ' : 'Attacked by '}${title}</b><span>${sub}<span class="lt">${loot}</span></span><span>${ago(r.t, t0)}</span></div>${tr2}</div>`;
    }).join('');
  }
  function paintHead() {
    const t = Math.max(0, (econ && econ.st && econ.st.tro) || 0), i = leagueIdx(t);
    $('.bwk-h .bd').innerHTML = leagueBadge(i, 46);
    const c = S.d.clan && S.d.clan.mine;
    $('.bwk-h .t span').innerHTML = c ? `<span class="bwc-tag">${esc(c.tag)}</span> ${esc(c.name)}` : `${cupSvg(15)}<b style="color:#fff">${fmtN(t)}</b> cups`;
    const dot = $('.bwk-tabs .dot'); if (dot) dot.hidden = !(S.unseen > 0 && S.tab !== 'log');
  }
  function paintBody() {
    const keepIn = BODY.querySelector('input.n') ? [BODY.querySelector('input.n').value, BODY.querySelector('input.g').value] : null;
    BODY.innerHTML = S.tab === 'clan' ? clanTab() : S.tab === 'friends' ? friendsTab() : logTab();
    if (keepIn && BODY.querySelector('input.n')) { BODY.querySelector('input.n').value = keepIn[0]; BODY.querySelector('input.g').value = keepIn[1]; }
  }
  const paint = () => { paintHead(); paintBody(); };

  // ------------------------------------------------------------------ data
  async function load(tab, force) {
    const path = { clan: '/api/clan', friends: '/api/friends', log: '/api/log' }[tab];
    if (S.busy[tab] && !force) return;
    S.busy[tab] = true;
    let j = null; try { j = await econ.social(path); } catch (e) { j = null; }
    S.busy[tab] = false;
    S.d[tab] = j && j.ok ? j : { failed: true };
    if (tab === 'log' && j && j.ok) { S.lastLog = Date.now(); S.unseen = (j.log || []).filter((r) => r.k === 'd' && r.t > lsGet(SEEN)).length; if (S.open && S.tab === 'log') { S.seenAt = lsGet(SEEN); lsSet(SEEN, nowS()); S.unseen = 0; } }
    if (S.open) paint();
  }
  async function command(body) {
    if (S.busy.clan) return; S.busy.clan = true; S.err = ''; paintBody();
    let j = null; try { j = await econ.social('/api/clan', body); } catch (e) { j = null; }
    S.busy.clan = false;
    if (j && j.ok) { S.d.clan = j; S.confirm = 0; }
    else S.err = j && j.why ? (WHY[j.why] || 'That did not work.') : 'No connection. Try again.';
    if (j && j.ok) { click(); if (body.op === 'create') toast('Clan created'); if (body.op === 'join') toast('You joined the clan'); }
    paint();
  }
  function open(tab) {
    S.open = true; S.tab = tab || S.tab || 'clan'; S.err = ''; S.confirm = 0; pan.classList.add('on'); click();
    pan.querySelectorAll('.bwk-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === S.tab));
    if (S.tab === 'log') { S.seenAt = lsGet(SEEN); }
    paint(); load(S.tab, true);
  }
  function close() { S.open = false; pan.classList.remove('on'); if (S.tab === 'log') { lsSet(SEEN, nowS()); S.unseen = 0; } }
  function share(link) {
    const text = 'Join me in Blue Wall — build a castle, raise an army, take the crown!', url = 'https://t.me/share/url?url=' + encodeURIComponent(link) + '&text=' + encodeURIComponent(text);
    try { if (ui && ui.tg && ui.tg.openTelegramLink) { ui.tg.openTelegramLink(url); return; } } catch (e) { /* fall through */ }
    if (navigator.share) { navigator.share({ title: 'Blue Wall', text, url: link }).catch(() => {}); return; }
    try { navigator.clipboard.writeText(link); toast('Link copied'); } catch (e) { toast('Copy the link from the Rank panel'); }
  }
  pan.addEventListener('click', (e) => {
    const a = e.target.closest('[data-a],[data-t]'); if (!a) { if (e.target === pan) close(); return; }
    if (a.dataset.t) {
      if (S.tab === 'log') { lsSet(SEEN, nowS()); S.unseen = 0; }
      S.tab = a.dataset.t; S.err = ''; S.confirm = 0; pan.querySelectorAll('.bwk-tabs button').forEach((b) => b.classList.toggle('on', b === a)); click();
      if (S.tab === 'log') S.seenAt = lsGet(SEEN);
      paint(); BODY.scrollTop = 0; load(S.tab, true); return;
    }
    const k = a.dataset.a;
    if (k === 'x') { click(); close(); }
    else if (k === 'create') command({ op: 'create', name: (BODY.querySelector('input.n') || {}).value || '', tag: (BODY.querySelector('input.g') || {}).value || '' });
    else if (k === 'join') command({ op: 'join', id: +a.dataset.id });
    else if (k === 'kick') command({ op: 'kick', id: +a.dataset.id });
    else if (k === 'leave') { if (!S.confirm) { S.confirm = 1; paintBody(); setTimeout(() => { if (S.confirm) { S.confirm = 0; if (S.open) paintBody(); } }, 3500); } else command({ op: 'leave' }); }
    else if (k === 'share') share((S.d.friends || {}).link || '');
  });
  const refresh = () => { if (Date.now() - S.lastLog > 120000 && !S.busy.log) load('log'); };
  // the attacks on this kingdom since the player last looked (for the welcome card): at most 3 days back, newest first
  async function raids() {
    try { await Promise.race([load('log', true), new Promise((r) => setTimeout(r, 2500))]); } catch (e) { return []; }
    const d = S.d.log; if (!d || d.failed) return [];
    const seen = lsGet(SEEN), t0 = nowS();
    return (d.log || []).filter((r) => r.k === 'd' && r.t > seen && r.t > t0 - 3 * 86400).map((r) => ({ who: r.who, stars: r.stars, pct: r.pct, tro: r.tro, loot: r.loot, t: r.t }));
  }
  const markSeen = () => { lsSet(SEEN, nowS()); S.unseen = 0; };
  return { open, close, refresh, raids, markSeen, get isOpen() { return S.open; }, unseen: () => S.unseen, clanTag: () => ((S.d.clan && S.d.clan.mine) ? S.d.clan.mine.tag : '') };
}
