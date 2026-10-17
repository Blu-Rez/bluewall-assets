// RP1C-R4 — THE HERO «i» PAGE.  A plain ES module, loaded lazily by rpg.js the first time an «i» is tapped (nothing of this is in the boot bundle).
//   Opens a full-screen LANDSCAPE page for one sister: her card picture on the left, a scrolling Persian text on the right
//   (name + role · in her hands · legs & feet · clothes · skills · a two-line story).  Close = the X (44 px), the Android / Telegram back button, a tap on the dark edge, Esc.
// THE OWNER EDITS THE TEXT HERE, in INFO below (+ the small label tables right under it).  Nothing else holds a hero text.
//   · «در دست‌ها» and «توان‌ها» are NOT typed: they are read from the sister's real combat kit (combat/kit_<id>.js) and combat/carry.js at the moment the page opens,
//     so the weapon, where it is carried, the cool-downs and the ranges are the numbers the game really uses.  INFO.<hero>.kit says WHICH kit file that is.
//     Today only kit_elina.js exists and combat.js plays EVERY sister with it (ctl.kitFallback): the five others therefore show Elina's kit + one line «designed for her: …, not in the game yet».
//     The day kit_<hero>.js is added, set `kit: '<hero>'` and `planned: null` for her here (dev/rp1c4_info_test.sh fails if a kit file exists and the table still points elsewhere).
//   · «پاها» and «لباس» are what the MODEL wears (read off the 3D model and the card picture, 16 Oct 2026): boots, trousers / skirt, vest, cloak, colours.  No numbers.
//   · the story lines are the owner's own one-line bios from BLUEWALL_HANDOFF (only the spoiler clause of Aylin's was cut).
// No texture is made here (the card is the existing rpg/c_<k>.webp) and no shader program is added: plain DOM.
export const LABEL = { hands: 'در دست‌ها', legs: 'پاها', cloth: 'لباس', skills: 'توان‌ها', story: 'داستان' };

export const INFO = {
  elina: {
    name: 'الینا', role: 'جنگجوی نزدیک‌زن', elem: 'آتش', kit: 'elina', planned: null,
    legs: ['شلوار قهوه‌ای تیره', 'چکمهٔ چرمی قهوه‌ای، بلند، با لبهٔ تاخورده'],
    cloth: ['کرست چرمی سرخ روی پیراهن کِرِم', 'کمربند با سگک طلایی', 'شنل سرخِ پاره‌پاره با نشان شعله', 'بازوبند چرمی'],
    story: ['دختر بزرگ آتوسا، شمشیرزن و فرمانده‌ی مادرزاد.', 'خودش رو مقصر شکستن پل می‌دونه و آتیشش با خشمش بالا و پایین می‌ره.'],
  },
  elika: {
    name: 'الیکا', role: 'دیدبان چابک', elem: 'باد', kit: 'elina', planned: 'دو دشنهٔ خمیده و یک فلاخن',
    legs: ['شلوار گشادِ خاکی، دور ساق جمع‌شده', 'چکمهٔ قهوه‌ایِ بنددار تا ساق'],
    cloth: ['جلیقهٔ چرمی قهوه‌ای روی پیراهن کِرِم با آستین تاخورده', 'شال سبز مات دور گردن', 'شنل کلاه‌دار آبی‌سبز با نشان باد', 'دستکش چرمی بی‌انگشت'],
    story: ['دختر دوم آتوسا، دزد و جاسوس.', 'شب کودتا مردان جامه‌هیرکانی رو دید و کسی حرفش رو باور نکرد؛ حالا می‌خواد با مدرک ثابتش کنه.'],
  },
  melika: {
    name: 'ملیکا', role: 'درمانگر دوربرد', elem: 'گیاه', kit: 'elina', planned: 'کمان چوبیِ زنده و دشنهٔ کوچک گیاه‌بری',
    legs: ['دامن بلند زیتونی، پیچیده، با گل‌دوزی برگ و لبهٔ ریش‌ریش', 'چکمهٔ کوتاه قهوه‌ای تا مچ پا'],
    cloth: ['کمربند با دو کیسهٔ کوچک', 'شنل کلاه‌دار قهوه‌ای تیره', 'بازوبند چرمی', 'گل در موها'],
    story: ['دختر بزرگ ماندانا، گیاه‌شناس و درمانگر، با یوزپلنگی به اسم ماهور.', 'آرومه، ولی وقتی کسی به جنگل یا خواهرش آسیب بزنه، ترسناک‌ترین خواهر می‌شه.'],
  },
  mobina: {
    name: 'مبینا', role: 'مدافع خط مقدم', elem: 'خاک و سنگ', kit: 'elina', planned: 'پتک کوچک معدن و دستکش‌های سنگی',
    legs: ['دامن بلند چین‌دارِ مخمل کهربایی تا مچ پا', 'چکمهٔ کوتاه و ساده، قهوه‌ای'],
    cloth: ['تنپوش مخمل قهوه‌ای تیره', 'کمربند مسی', 'شنل مخمل'],
    story: ['دختر کوچیک ماندانا، کم‌حرف و دقیق، با ذهن یه معمار.', 'صدای کوه رو می‌شنوه و اولین کسیه که می‌فهمه زیر دیوار آبی چیزی زنده‌ست.'],
  },
  aylin: {
    name: 'آیلین', role: 'درمانگر پشتیبان', elem: 'آب', kit: 'elina', planned: 'عصای چوب بید با سری از صدف',
    legs: ['پیراهن بلند سرمه‌ای تا مچ پا، با موج‌دوزی نقره‌ای روی لبه', 'چکمهٔ بنددار قهوه‌ای روشن تا مچ پا'],
    cloth: ['سرمه‌ای، با موج‌دوزی نقره‌ای روی لبه و سرآستین', 'کمربندِ پارچه‌ایِ قهوه‌ای', 'شنل کلاه‌دار آبی با نشان آب'],
    story: ['دختر بزرگ آیدا، درمانگر و قلب خانواده.', 'آیدین در آغوشش مرد؛ حالا هر کی در بزنه رو راه می‌ده.'],
  },
  aylar: {
    name: 'آیلار', role: 'کنترل‌گر میدان', elem: 'یخ', kit: 'elina', planned: 'نیزهٔ یخی و مهره‌های یخیِ شطرنج',
    legs: ['شلوار تیره', 'چکمهٔ قهوه‌ای بلند تا زانو، با سرِ خزِ سفید'],
    cloth: ['پالتوی کوتاه سرمه‌ای‌خاکستری (تا روی ران) با نوارهای نقره‌دوزی', 'یقهٔ خز سفید', 'کمربند با سگک فلزی', 'نشان برف‌دانه', 'موی بلند دم‌اسبی'],
    story: ['کوچیک‌ترین خواهر، نابغه‌ی حساب و شطرنج.', 'اسیر سوداست، زندانبانی که هر شب براش نون میاره و نمی‌ذاره کسی بکشدش.'],
  },
};

// the labels the kit reader needs (Persian names of the kinds / places / skills).  The numbers never live here: they come from the kit.
export const KIND_FA = { short_sword: 'شمشیر کوتاه', sword: 'شمشیر', big_sword: 'شمشیر بزرگ', dagger: 'دشنه', staff: 'عصا', bow: 'کمان', spear: 'نیزه', hammer: 'پتک', axe: 'تبر', quiver: 'تیردان' };
export const SKILL_FA = {   // `<kit id>:<skill id>` -> name + the look of it in one phrase
  'elina:wave': { n: 'موج شعله', d: 'هلالی آتشین از شمشیر پرتاب می‌شود' },
  'elina:burst': { n: 'انفجار اخگر', d: 'انفجاری از آتش دور خودش' },
};
export const VIS_FA = { crescent: 'هلال' };
export const NOTE = {
  hands: 'سلاح فقط در دنیای زیرین (آزمایش رزم) به او داده می‌شود؛ روی نقشهٔ قلعه دست‌خالی است.',
  planned: 'برای او طراحی شده (هنوز در بازی نیست):',
  now: 'فعلاً در بازی:',
  skills: 'کیت رزمیِ خودش هنوز ساخته نشده؛ فعلاً توان‌های الینا را دارد.',
};

const DIG = '۰۱۲۳۴۵۶۷۸۹';
/** 12 -> «۱۲», 0.95 -> «۰٫۹۵» */
export const fa = (n) => String(+(+n).toFixed(2)).replace(/\d/g, (d) => DIG[d]).replace('.', '٫');

/** One effect of a kit skill -> one Persian phrase (numbers from the kit). */
export function describeEffect(e) {
  let s;
  if (e.type === 'projectile') s = `پرتابه${VIS_FA[e.vis] ? ' (' + VIS_FA[e.vis] + ')' : ''} تا ${fa(e.range)} متر، شعاع ${fa(e.radius)} متر${e.pierce ? '، از چند دشمن رد می‌شود' : ''}`;
  else if (e.type === 'aoe') s = `${e.shape === 'circle' ? 'ضربهٔ دایره‌ای' : 'ضربهٔ ناحیه‌ای'} به شعاع ${fa(e.radius)} متر`;
  else s = 'اثر ' + e.type;
  if (e.stagger) s += '، تعادل دشمن را می‌شکند';
  return s;
}

/** The kit -> the two text blocks.  `carry` = combat/carry.js ({ weaponKind, carryOf }).  Pure: no DOM.  Returns { hands: [..], skills: [{ n, d, x }], combat: [..] } */
export function describeKit(kit, carry) {
  const ws = kit.weapons || [], hip = ws.filter((w) => carry.carryOf(w) === 'hip' && carry.weaponKind(w) !== 'quiver').length, hands = [];
  for (const w of ws) {
    const kind = carry.weaponKind(w), car = carry.carryOf(w), hold = kind === 'bow' ? 'دست چپ' : w.slot === 'L' ? 'دست چپ' : 'دست راست', nm = KIND_FA[kind] || kind;   // RS1: no length in metres here (the owner: «what has the sword's half metre to do with the player») — the weapon's name only
    if (car === 'hand') hands.push(`${nm} — همیشه در ${hold}`);
    else hands.push(`${nm} — ${car === 'back' ? 'روی پشت' : hip > 1 ? 'دو طرف کمر' : 'کنار کمر، سمت چپ'}؛ در نبرد در ${hold}، بعد از نبرد دوباره سر جایش`);
  }
  const skills = (kit.skills || []).map((s) => {
    const f = SKILL_FA[kit.id + ':' + s.id] || { n: s.name || s.id, d: '' };
    return { n: f.n, d: f.d, x: (s.effects || []).map(describeEffect).join('؛ ') + ` · بازیابی ${fa(s.cd)} ثانیه` };
  });
  const combat = [];
  if (kit.combo && kit.combo.length) combat.push(`حمله — ترکیب ${fa(kit.combo.length)} ضربه${kit.combo[kit.combo.length - 1].finisher ? '؛ ضربهٔ آخر سنگین‌تر است' : ''}`);
  if (kit.block) combat.push(`سپر — از جلو (${fa(kit.block.arc)} درجه) فقط ${fa(Math.round(kit.block.dr * 100))}٪ آسیب می‌خورد`);
  return { hands, skills, combat };
}

// ------------------------------------------------------------------ the page
const CSS = `
.rpi{position:absolute;inset:0;z-index:200;pointer-events:auto;background:rgba(3,5,9,.8);touch-action:none}
.rpi *{box-sizing:border-box}
.rpi-p{position:absolute;left:max(22px,3.2vw,env(safe-area-inset-left,0px));right:max(22px,3.2vw,env(safe-area-inset-right,0px));top:calc(var(--rpi-top) + 8px);bottom:calc(var(--rpi-btm) + 8px);display:flex;flex-direction:column;overflow:hidden;border-radius:16px;border:1.5px solid var(--ac);color:#f4e8cc;
  background:linear-gradient(180deg,#3c2a1b 0%,#291c11 48%,#1b120b 100%);box-shadow:0 0 0 1px #1b120b,0 10px 34px rgba(0,0,0,.7),0 0 16px var(--ac)}
.rpi-t{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:6px 10px 6px 6px;border-bottom:1px solid rgba(196,154,84,.4);background:linear-gradient(180deg,#2c1f13,#241910)}
.rpi-x{flex:0 0 44px;width:44px;height:44px;border-radius:12px;border:1px solid #8a6a3a;background:linear-gradient(180deg,#5b4731,#3b2c1c);color:#f4e8cc;display:grid;place-items:center;padding:0;cursor:pointer;font-family:inherit}
.rpi-x svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
.rpi-tt{flex:1;min-width:0;direction:rtl;text-align:right}
.rpi-tt b{display:block;font-size:19px;font-weight:900;line-height:1.25;color:#f4e8cc}
.rpi-tt span{display:block;margin-top:1px;font-size:12.5px;color:#c9b48a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rpi-em{flex:0 0 36px;width:36px;height:36px;border-radius:50%;background:rgba(6,12,20,.92);border:1.5px solid var(--ac);box-shadow:0 0 10px var(--ac);display:flex;align-items:center;justify-content:center}
.rpi-em img{width:22px;height:22px;object-fit:contain}
.rpi-b{flex:1;min-height:0;display:flex}
.rpi-l{flex:0 0 auto;padding:10px;display:flex;align-items:center}
.rpi-card{height:100%;max-height:100%;aspect-ratio:4/5;border-radius:12px;overflow:hidden;border:2px solid var(--ac);background:#14100b;box-shadow:0 0 0 1px #1b120b,0 6px 16px rgba(0,0,0,.55),0 0 12px var(--ac)}
.rpi-card img{display:block;width:100%;height:100%;object-fit:cover}
.rpi-sc{flex:1;min-width:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y;direction:rtl;text-align:right;padding:4px 6px 22px 16px;border-left:1px solid rgba(196,154,84,.25)}
.rpi-h{margin:14px 2px 6px;font-size:13.5px;font-weight:900;color:#e0b255;display:flex;align-items:center;gap:8px}
.rpi-h:first-child{margin-top:8px}
.rpi-h:after{content:"";flex:1;height:1px;background:linear-gradient(270deg,rgba(196,154,84,.6),rgba(196,154,84,0))}
.rpi-sc p{margin:0 2px 5px;font-size:13.5px;line-height:1.65;color:#e9dcbd}
.rpi-sc p b{color:#f4e8cc;font-weight:800}
.rpi-sc p small{display:block;font-size:11.5px;line-height:1.5;color:#b9a47c}
.rpi-sc p.n{font-size:11.5px;line-height:1.55;color:#a8926a}
.rpi-sc p.pl{color:#f0d9a0}
`;

export function createInfo(o) {
  const { root, url, sisters, top, bot: btm } = o, V = new URL(import.meta.url).search || '', here = (f) => new URL(f + V, import.meta.url).href, doc = document;
  const st = { el: null, key: null, hist: false, tb: null, tbPrev: false, gen: 0, kits: {}, carry: null, style: null };
  const TG = () => { const w = window.Telegram && window.Telegram.WebApp; return w && w.BackButton && (!w.isVersionAtLeast || w.isVersionAtLeast('6.1')) ? w.BackButton : null; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lines = (a, cls) => a.map((s) => `<p${cls ? ' class="' + cls + '"' : ''}>${esc(s)}</p>`).join('');
  const sec = (h, body) => `<div class="rpi-h">${esc(h)}</div>${body}`;
  const accent = (k) => { const s = (sisters || []).find((x) => x.k === k); return s ? s.c : '#e0b255'; };

  async function kitOf(id) {
    if (st.kits[id]) return st.kits[id];
    if (!st.carry) st.carry = await import(/* @vite-ignore */ here('combat/carry.js'));
    const m = await import(/* @vite-ignore */ here('combat/kit_' + id + '.js'));
    return (st.kits[id] = m.default);
  }
  function back() { close(); }
  function onPop() { if (st.el && st.hist) { st.hist = false; close(true); } }                   // (the browser / Android back: the history entry is already gone)
  function onKey(e) { if (!st.el) return; e.stopImmediatePropagation(); if (e.code === 'Escape' || e.key === 'Escape') { e.preventDefault(); close(); } }   // (keydown only: Esc closes THIS page, not the hero mode under it; the other keys do not walk her.  keyup is left alone so no key can stay stuck)

  function open(k) {
    const I = INFO[k]; if (!I) return false; if (st.el) close(true, true);                        // (another sister while one is open: the same history entry is kept)
    if (!st.style) { st.style = doc.createElement('style'); st.style.textContent = CSS; doc.head.appendChild(st.style); }
    const gen = ++st.gen, ac = accent(k), e = doc.createElement('div'); e.className = 'rpi rp-k'; e.dataset.k = k; e.setAttribute('role', 'dialog'); e.setAttribute('aria-label', I.name);
    e.style.cssText = `--ac:${ac};--rpi-top:${top || '0px'};--rpi-btm:${btm || '0px'}`;
    e.innerHTML = `<div class="rpi-p"><div class="rpi-t"><button type="button" class="rpi-x" aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg></button>`
      + `<div class="rpi-tt"><b>${esc(I.name)}</b><span>${esc(I.role)} · ${esc(I.elem)}</span></div><div class="rpi-em"><img alt="" src="${url('e_' + k + '.png')}"></div></div>`
      + `<div class="rpi-b"><div class="rpi-l"><div class="rpi-card"><img alt="" src="${url('c_' + k + '.webp')}"></div></div><div class="rpi-sc"></div></div></div>`;
    e.addEventListener('click', (ev) => { if (ev.target === e) close(); });
    e.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); });
    e.querySelector('.rpi-x').addEventListener('click', (ev) => { ev.stopPropagation(); close(); });
    root.appendChild(e); st.el = e; st.key = k;
    window.addEventListener('keydown', onKey, true); window.addEventListener('popstate', onPop);
    if (!st.hist) { try { history.pushState({ rpi: 1 }, ''); st.hist = true; } catch (er) { st.hist = false; } }
    const tb = TG(); if (tb) { st.tb = tb; try { st.tbPrev = !!tb.isVisible; tb.onClick(back); tb.show(); } catch (er) { /* ignore */ } }
    if (o.onOpen) o.onOpen(k);
    fill(e.querySelector('.rpi-sc'), I, gen);
    return true;
  }
  async function fill(sc, I, gen) {
    let kd = null, err = '';
    try { const kit = await kitOf(I.kit); kd = describeKit(kit, st.carry); } catch (er) { err = String(er && er.message || er); }
    if (gen !== st.gen || !st.el) return;                                                           // (closed, or another sister opened, while the kit was loading)
    const own = I.kit === st.key, hands = kd ? kd.hands : [];
    let h = sec(LABEL.hands, (hands.length ? lines(hands.map((x) => (own ? x : NOTE.now + ' ' + x))) : '') + (I.planned ? `<p class="pl">${esc(NOTE.planned)} ${esc(I.planned)}</p>` : '') + lines([NOTE.hands], 'n'));
    h += sec(LABEL.legs, lines(I.legs)) + sec(LABEL.cloth, lines(I.cloth));
    h += sec(LABEL.skills, (own ? '' : lines([NOTE.skills], 'n')) + (kd ? lines(kd.combat) + kd.skills.map((s) => `<p><b>${esc(s.n)}</b>${s.d ? ' — ' + esc(s.d) : ''}<small>${esc(s.x)}</small></p>`).join('') : '') + (err ? lines(['(' + err + ')'], 'n') : ''));
    h += sec(LABEL.story, lines(I.story));
    sc.innerHTML = h; st.el.classList.add('rpi-ready'); st.el.dataset.ready = '1';
  }
  function close(quiet, keepHist) {
    const e = st.el; if (!e) return false;
    st.el = null; st.gen++; e.remove();
    window.removeEventListener('keydown', onKey, true); window.removeEventListener('popstate', onPop);
    if (st.tb) { try { st.tb.offClick(back); if (!st.tbPrev) st.tb.hide(); } catch (er) { /* ignore */ } st.tb = null; }
    if (st.hist && !keepHist) { st.hist = false; try { history.back(); } catch (er) { /* ignore */ } }
    if (o.onClose) o.onClose(st.key);
    return true;
  }
  return { open, close, isOpen: () => !!st.el, get el() { return st.el; }, INFO };
}
