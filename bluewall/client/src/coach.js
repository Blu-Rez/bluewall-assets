// Coach marks (F24) and the first-hour tutorial (C13 / A30).
//   createCoach(host, { audio, ui }) -> { run(steps, { key, onDone }), stop(), running(), home(force), battle(force), reset() }
// A step is { sel | rect(), text, side: 'above' | 'below' | 'auto' }. The page behind it goes dark with a hole round the target
// (box-shadow 0 0 0 9999px), a pulse ring and a pointing hand mark the target, one short line says what it is. A tap anywhere moves on, "Skip" ends it.
// The home tour runs once for a new player (castle level <= 3), the battle tour once on the first attack; both can be replayed from Settings.
const KEY = { home: 'bw_coach_home', battle: 'bw_coach_battle' };
const get = (k) => { try { return localStorage.getItem(k) === '1'; } catch (e) { return false; } };
const put = (k, v) => { try { if (v) localStorage.setItem(k, '1'); else localStorage.removeItem(k); } catch (e) { /* private mode */ } };

const CSS = `
.bwch{position:absolute;inset:0;z-index:40;pointer-events:auto;touch-action:manipulation;-webkit-tap-highlight-color:transparent;font-family:'Libre Baskerville','Noto Sans Tai Viet',Georgia,serif;color:#eaf6ff;opacity:0;transition:opacity .3s}
.bwch.on{opacity:1}
.bwch .hole{position:absolute;border-radius:16px;box-shadow:0 0 0 9999px rgba(0,3,10,.76);transition:left .35s cubic-bezier(.2,.8,.2,1),top .35s cubic-bezier(.2,.8,.2,1),width .35s cubic-bezier(.2,.8,.2,1),height .35s cubic-bezier(.2,.8,.2,1);pointer-events:none}
.bwch .ring{position:absolute;inset:-3px;border-radius:19px;border:2px solid #8fe8ff;box-shadow:0 0 12px rgba(110,215,255,.65);animation:bwchp 1.5s ease-in-out infinite;pointer-events:none}
@keyframes bwchp{0%,100%{transform:scale(1);opacity:.95}50%{transform:scale(1.07);opacity:.45}}
.bwch .hand{position:absolute;width:34px;height:34px;color:#e6f6ff;filter:drop-shadow(0 2px 4px rgba(0,0,0,.7));animation:bwchh 1.1s ease-in-out infinite;pointer-events:none}
@keyframes bwchh{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
.bwch .hand.dn{animation-name:bwchd}@keyframes bwchd{0%,100%{transform:translateY(0)}50%{transform:translateY(7px)}}
.bwch .card{position:absolute;left:50%;width:min(310px,calc(100% - 32px));box-sizing:border-box;padding:13px 16px 12px;border-radius:18px;background:linear-gradient(180deg,#0d2a5c,#050f26 70%);border:1.5px solid rgba(150,205,255,.5);box-shadow:0 14px 40px rgba(0,0,0,.7),inset 0 1px 0 rgba(200,230,255,.25);transform:translateX(-50%);pointer-events:none}
.bwch .card b{display:block;font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:#8fe0ff;margin-bottom:5px;font-weight:700}
.bwch .card p{margin:0;font-size:14px;line-height:1.5;color:#f2f8ff}
.bwch .card i{display:block;margin-top:9px;font-style:normal;font-size:11px;letter-spacing:1.2px;color:#9db9de}
.bwch .dots{display:flex;gap:5px;margin-top:8px}.bwch .dots s{width:6px;height:6px;border-radius:50%;background:rgba(150,200,255,.3);text-decoration:none}.bwch .dots s.on{background:#8fe8ff}
.bwch .card .skip{position:absolute;right:10px;bottom:8px;padding:8px 13px;border-radius:12px;border:1px solid rgba(160,205,255,.45);background:rgba(8,20,48,.8);color:#cfe6ff;font:700 11px 'Libre Baskerville',Georgia,serif;letter-spacing:1.4px;cursor:pointer;pointer-events:auto}
.bwch{font-family:'BW Naskh','Noto Naskh Arabic','Vazirmatn',Tahoma,serif}
.bwch .card{direction:rtl;text-align:right}
.bwch .card b{letter-spacing:0;text-transform:none;font-size:15px;color:#8fe0ff;margin-bottom:4px}
.bwch .card p{font-size:16px;line-height:1.95;font-weight:400}
.bwch .card i{letter-spacing:0;font-size:12.5px;font-weight:700;text-align:right}
.bwch .card .skip{right:auto;left:10px;letter-spacing:0;font-family:inherit;font-size:13px;padding:6px 14px}
.bwch .dots{direction:ltr;justify-content:flex-end}
@media (prefers-reduced-motion:reduce){.bwch .ring,.bwch .hand{animation:none}}
`;
const HAND = '<svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor" stroke="#0b1d44" stroke-width="1.2" stroke-linejoin="round"><path d="M9.5 3.2c.9 0 1.6.7 1.6 1.6v6.1l.9-.2c.8-.2 1.5.3 1.7 1l.3-.1c.8-.2 1.5.3 1.7 1l.2.1c.8-.2 1.5.3 1.7 1l.4 5.2c.1 1.6-1.2 3-2.8 3H11c-1.2 0-2.2-.6-2.8-1.6l-3-5c-.5-.8-.2-1.8.6-2.2.6-.3 1.3-.2 1.8.3l.8.8V4.8c0-.9.7-1.6 1.6-1.6z"/></svg>';

export function createCoach(host0, { audio, ui, econ, battleHost = null } = {}) {
  let host = host0;                                                   // where the tour is mounted: the home HUD, or (for the battle tour) the page root, since the home HUD is hidden during a battle
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  let el = null, run = null;
  const click = () => { audio && audio.click && audio.click(); ui && ui.haptic && ui.haptic('light'); };

  function rectOf(s) {
    if (s.rect) return s.rect();
    const e = typeof s.sel === 'string' ? host.querySelector(s.sel) || document.querySelector(s.sel) : s.sel;
    if (!e) return null;
    const r = e.getBoundingClientRect(); if (r.width < 4 || r.height < 4) return null;
    const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return null;
    return r;
  }
  function place() {
    if (!run || !el) return;
    const s = run.steps[run.i], r = rectOf(s), hb = host.getBoundingClientRect(); if (!r) return;
    const pad = s.pad == null ? 7 : s.pad, L = r.left - hb.left - pad, T = r.top - hb.top - pad, Wd = r.width + pad * 2, H = r.height + pad * 2;
    const hole = el.querySelector('.hole'), card = el.querySelector('.card'), hand = el.querySelector('.hand');
    hole.style.left = L + 'px'; hole.style.top = T + 'px'; hole.style.width = Wd + 'px'; hole.style.height = H + 'px';
    const mid = T + H / 2, side = s.side && s.side !== 'auto' ? s.side : (mid > hb.height * 0.55 ? 'above' : 'below');
    const ch = card.offsetHeight || 120;
    if (side === 'above') { card.style.top = Math.max(10, T - ch - 54) + 'px'; hand.style.top = (T - 40) + 'px'; hand.classList.add('dn'); hand.style.transform = 'rotate(180deg)'; }
    else { card.style.top = Math.min(hb.height - ch - 10, T + H + 54) + 'px'; hand.style.top = (T + H + 6) + 'px'; hand.classList.remove('dn'); hand.style.transform = ''; }
    hand.style.left = Math.max(6, Math.min(hb.width - 40, L + Wd / 2 - 17)) + 'px';
  }
  function draw() {
    const s = run.steps[run.i];
    el.querySelector('.card').innerHTML = `<b>${s.title || 'نکته'}</b><p>${s.text}</p><div class="dots">${run.steps.map((_, k) => `<s class="${k === run.i ? 'on' : ''}"></s>`).join('')}</div><i>${run.i < run.steps.length - 1 ? 'برای ادامه بزن' : 'برای پایان بزن'}</i>${run.i < run.steps.length - 1 ? '<button class="skip" type="button">رد کردن</button>' : ''}`;
    place(); requestAnimationFrame(place);
  }
  function step(dir = 1) {
    if (!run) return;
    let i = run.i + dir;
    while (i >= 0 && i < run.steps.length && !rectOf(run.steps[i])) i += dir;           // a target that is not on screen is skipped
    if (i >= run.steps.length || i < 0) return finish(true);
    run.i = i; draw();
  }
  function finish(done) {
    if (!run) return; const r = run; run = null;
    if (el) { const e = el; el = null; e.classList.remove('on'); setTimeout(() => e.remove(), 320); }
    window.removeEventListener('resize', place);
    host = host0;
    if (r.key) put(r.key, true);
    r.onDone && r.onDone(!!done);
  }
  function start(steps, { key = '', onDone = null, at = null } = {}) {
    if (run) return false;
    host = at || host0;
    try { if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('400 16px "BW Naskh"'), document.fonts.load('700 16px "BW Naskh"')]).then(() => run && place(), () => {}); } catch (e) { /* the fallback font is fine */ }
    const list = steps.filter((s) => rectOf(s)); if (!list.length) { host = host0; return false; }
    run = { steps: list, i: 0, key, onDone };
    el = document.createElement('div'); el.className = 'bwch'; el.lang = 'fa';
    el.innerHTML = '<div class="hole"><div class="ring"></div></div><div class="hand">' + HAND + '</div><div class="card"></div>';
    el.addEventListener('click', (e) => { e.stopPropagation(); click(); if (e.target.closest('.skip')) finish(true); else step(1); });
    el.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    host.appendChild(el); draw(); requestAnimationFrame(() => el && el.classList.add('on'));
    window.addEventListener('resize', place);
    return true;
  }

  // ---- the two tours
  const HOME = () => [
    { sel: '.bw-lvl', title: 'سطح و نام تو', text: 'سطح قلعه، نام و جام‌هایت این‌جاست. روی نشان سطح بزنی تنظیمات باز می‌شود.', side: 'below' },
    { sel: '.bw-gems', title: 'جواهرها', text: 'یاقوت، زمرد و فیروزه خرج هر کاری می‌شوند. از معدن‌ها جمع کن تا گنجینه‌ها پر شود.', side: 'below' },
    { sel: '.bw-pm', title: 'جواهر ویژه', text: 'جم آبی پررنگ و جم مشکی معدن ندارند؛ فقط با خرید یا جایزه به دست می‌آیند. روی هرکدام بزنی فروشگاه باز می‌شود.', side: 'below' },
    { sel: '.bwh-btn', title: 'منوی دستیار', text: 'تنها دکمه‌ی صفحه همین است. حمله، ساخت‌وساز و سازنده‌ها، ارتش، فروشگاه، رتبه، قبیله، دوستان و تاریخچه همه از این‌جا باز می‌شوند.' },
  ];
  const BATTLE = () => [
    { sel: '.bwb-sq', title: 'دسته‌های تو', text: 'یک دسته را انتخاب کن، بعد روی میدان بزن تا وارد نبرد شود. دسته‌های تازه‌نفس با هم بهتر می‌جنگند.' },
    { sel: '.bwb-sp', title: 'اسپل‌ها', text: 'رعد، شفا، انجماد، خشم و زمین‌لرزه؛ وقتی نبرد سخت شد، روی نقشه بزن.', side: 'above' },
    { sel: '.bwb-top', title: 'میزان تخریب', text: 'تا تمام نشدن زمان هرچه می‌توانی خراب کن. تخریب بیشتر یعنی ستاره و غنیمت بیشتر.', side: 'below' },
  ];
  const api = {
    run: start, stop: () => finish(false), running: () => !!run,
    home(force = false) { if (!force && (get(KEY.home) || run)) return false; return start(HOME(), { key: KEY.home }); },
    battle(force = false) { if (!force && (get(KEY.battle) || run)) return false; return start(BATTLE(), { key: KEY.battle, at: battleHost }); },
    seen: (k) => get(KEY[k]),
    reset() { put(KEY.home, false); put(KEY.battle, false); },
    // a new player: nothing finished yet and a small castle
    isNew() { const s = econ && econ.st, lv = s ? Math.max(1, (s.prog && s.prog.b && s.prog.b.keep) || s.level || 1) : 99; return lv <= 3; },
  };
  return api;
}
