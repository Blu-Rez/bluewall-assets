// unitcards.js — AR1: the soldiers' CARD and INFO PAGE (design art made for the game: web/assets/units/c_<look>.webp = card 384x576, s_<look>.webp = design sheet 1024x1536).
//   mapping   units_looks.json  { kinds: { <kind>: { low, high, at } } }   lookAt(kind, level) -> the look to show (low below `at`, high from `at`), null = no art, keep the old picture
//   pictures  cardImg(kind, level) / facePic(kind, level, px)   plain <img loading=lazy decoding=async>: NOTHING here runs in the 3D load stage or the loader screen,
//             the first request happens when a panel that shows a card is built.  A missing file falls back to the old 3D-render portrait (portraits.js), then to nothing.
//   page      createUnitPage(host, { onClose }) -> { open(model), refresh(model), close(), isOpen() }   a full-screen sheet over the game (Telegram safe areas, back button >= 44 px,
//             scroll, the design sheet with pinch / double-tap / wheel zoom).  The model is plain data + html strings made by the caller (armyui.js for soldiers, chars.js for the cast).
//   ensureCss() injects the one style sheet (tiles + page).  Visual layer only: no rules, no server calls, no state.
import MAP from './units_looks.json';
import DEFS from './unitdefs.json';
import { BASE } from './assets.js';
import { PORTRAIT } from './portraits.js';
import { ico } from './ui_theme.js';

const KINDS = MAP.kinds || {};
export const MAX_LEVEL = MAP.max_level || DEFS.max_level || 50;
export const hasLook = (k) => !!KINDS[k];
export const looksOf = (k) => { const e = KINDS[k]; return e ? (e.low === e.high ? [e.low] : [e.low, e.high]) : []; };
export const lookAt = (k, lvl) => { const e = KINDS[k]; if (!e) return null; return e.low === e.high || (lvl | 0) < (e.at || 16) ? e.low : e.high; };
// the level a picture is chosen by: the unit's own level (the building that trains it), never below the level that opens it
export const levelFor = (k, ulv) => Math.max(1, ulv | 0, (DEFS.units[k] && DEFS.units[k].lv) || 1);
export const cardUrl = (look) => `${BASE}units/c_${look}.webp`;
export const sheetUrl = (look) => `${BASE}units/s_${look}.webp`;
// which levels use which look: [{ look, from, to }]   (a kind with one look: one row, its whole range)
export function rangesOf(k) {
  const e = KINDS[k]; if (!e) return [];
  const lo = Math.max(1, (DEFS.units[k] && DEFS.units[k].lv) || 1);
  if (e.low === e.high) return [{ look: e.low, from: lo, to: MAX_LEVEL }];
  const at = e.at || 16;
  return [{ look: e.low, from: lo, to: at - 1 }, { look: e.high, from: at, to: MAX_LEVEL }];
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ------------------------------------------------------------------ pictures
// the card as a plain <img> (the army list, the building sheet and the page all use this one): lazy + async decode, falls back by itself (see the error listener below)
export function cardImg(k, lvl, cls = 'uc-img') {
  const lk = lookAt(k, lvl); if (!lk) return '';
  return `<img class="${cls}" data-uk="${k}" src="${cardUrl(lk)}" alt="" loading="lazy" decoding="async" draggable="false">`;
}
// the round face of a card (queue minis, building sheet chips): the top of the portrait, cover-cropped
export function facePic(k, lvl, px) {
  const lk = lookAt(k, lvl); if (!lk) return '';
  return `<img data-uk="${k}" src="${cardUrl(lk)}" width="${px}" height="${px}" alt="" loading="lazy" decoding="async" draggable="false" style="border-radius:50%;object-fit:cover;object-position:50% 11%;display:block;background:#0a1c3e">`;
}
// a card file that cannot be loaded (offline preview, a package without web/assets/units): the old 3D-render portrait, or nothing (the tile keeps its dark plate)
if (typeof document !== 'undefined') {
  document.addEventListener('error', (e) => {
    const t = e.target; if (!t || t.tagName !== 'IMG' || !t.dataset) return;
    if (t.dataset.uk && !t.dataset.fb) { t.dataset.fb = '1'; const p = PORTRAIT[t.dataset.uk]; if (p) t.src = p; else t.style.visibility = 'hidden'; }
    else if (t.classList.contains('ucp-sheet')) { const b = t.closest('.ucp-sheetb'); if (b) b.classList.add('bad'); t.style.visibility = 'hidden'; }
  }, true);
}

// ------------------------------------------------------------------ css  (look C = ui_theme.js of UI1: leather, brass, parchment)
const DISPLAY = "Cinzel,'Libre Baskerville',Vazirmatn,Georgia,serif", FONT = "'Libre Baskerville','Noto Sans Tai Viet',Vazirmatn,Georgia,serif";
export const UC_CSS = `
/* --- the card tile in the army list (unit cards only: .bwa-c.u) */
.bwa-c.u{padding:0 0 5px;touch-action:pan-y}
.bwa-c.u .pic{width:100%;aspect-ratio:2/3;border-radius:13px 13px 4px 4px;background:linear-gradient(180deg,#223a66,#0b1428);position:relative;overflow:hidden}
.bwa-c.u .pic img{width:100%;height:100%;object-fit:cover;object-position:50% 0;display:block;pointer-events:none}
.bwa-c.u .pic svg{width:46%;height:46%}
.bwa-c.u .pic:after{content:"";position:absolute;left:0;right:0;bottom:0;height:34%;background:linear-gradient(0deg,rgba(2,6,16,.78),rgba(2,6,16,0));pointer-events:none}
.bwa-c.u b.nm{margin:5px 4px 0;min-height:2.3em;font-size:11.5px;line-height:1.15;justify-content:center}
.bwa-c.u .lvb{left:5px;bottom:5px;z-index:2}
.bwa-c.u .own{left:5px;top:12px;z-index:2}
.bwa-c.u .qd{right:5px;top:12px;z-index:2}
.bwa-c.u .gdb{left:5px;bottom:30px;z-index:2}
.bwa-c.u .sr{display:flex;gap:4px;justify-content:center;align-items:center;font-size:10.5px;line-height:1;color:#dcebff;margin-top:3px;white-space:nowrap;letter-spacing:-.1px}
.bwa-c.u .sr span{display:inline-flex;align-items:center;gap:1px}.bwa-c.u .sr svg{width:10px;height:10px;opacity:.85;flex:0 0 auto}
.bwa-c.u .cs{gap:2px 6px;padding:0 3px;margin-top:3px;font-size:11px}
.bwa-c.u .cs .tm{color:#9fb8da}.bwa-c.u .cs .tm svg{width:11px;height:11px;margin-right:1px}
.bwa-c.u.lk .pic img{filter:grayscale(.85) brightness(.55)}
.bwa-c.u.lk .lock{top:22%}
.bwa-c.u.full:not(.lk) .pic img{filter:saturate(.65) brightness(.82)}
/* --- the info page */
.ucp{position:absolute;inset:0;z-index:14;pointer-events:none;display:flex;flex-direction:column;box-sizing:border-box;color:#f4e8cc;font-family:${FONT};font-weight:400;background:linear-gradient(180deg,#3c2a1b 0%,#291c11 48%,#1b120b 100%);
  opacity:0;visibility:hidden;transform:translateY(14px);transition:opacity .22s,transform .26s cubic-bezier(.22,1,.36,1),visibility 0s linear .26s;-webkit-tap-highlight-color:transparent}
.ucp.on{pointer-events:auto;opacity:1;visibility:visible;transform:none;transition:opacity .22s,transform .26s cubic-bezier(.22,1,.36,1),visibility 0s}
.ucp *{box-sizing:border-box}
.ucp-top{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:calc(var(--st) + 8px) calc(12px + var(--sr)) 8px calc(12px + var(--sl));border-bottom:1px solid rgba(196,154,84,.4);background:linear-gradient(180deg,#2c1f13,#241910)}
.ucp-back{flex:0 0 44px;width:44px;height:44px;border-radius:12px;border:1px solid #8a6a3a;background:linear-gradient(180deg,#5b4731,#3b2c1c);color:#f4e8cc;display:grid;place-items:center;padding:0;cursor:pointer;font-family:inherit}
.ucp-back svg{width:22px;height:22px}
.ucp-tt{flex:1;min-width:0}.ucp-tt b{display:block;font:900 17px/1.2 ${DISPLAY};letter-spacing:.8px;text-transform:uppercase;color:#f4e8cc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ucp-tt span{display:block;margin-top:2px;font-size:12px;color:#c9b48a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ucp-rt{flex:0 0 auto;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:#1b120b;background:var(--rc,#c3cfe0);box-shadow:0 0 10px var(--rg,transparent)}
.ucp-sc{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:14px calc(14px + var(--sr)) calc(var(--sb) + 28px) calc(14px + var(--sl))}
.ucp-hero{display:flex;gap:13px;align-items:flex-start}
.ucp-card{flex:0 0 132px;width:132px;aspect-ratio:2/3;border-radius:12px;overflow:hidden;position:relative;border:2px solid var(--rc,#c49a54);background:linear-gradient(180deg,#223a66,#0b1428);box-shadow:0 0 0 1px #1b120b,0 6px 16px rgba(0,0,0,.55),0 0 16px var(--rg,transparent)}
.ucp-card img{width:100%;height:100%;object-fit:cover;object-position:50% 0;display:block}
.ucp-card.old img{object-fit:contain;object-position:50% 50%}
.ucp-hx{flex:1;min-width:0}
.ucp-desc{margin:0 0 9px;font-size:13px;line-height:1.55;color:#e9dcbd}
.ucp .st{display:flex;flex-wrap:wrap;gap:6px}
.ucp .st span{padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;color:#f4e8cc;background:rgba(255,226,160,.1);border:1px solid rgba(196,154,84,.45)}
.ucp .st span em{font-style:normal;font-weight:400;opacity:.8}
.ucp .st span .gem3{width:16px;height:16px;vertical-align:-3px}
.ucp-h{margin:20px 2px 8px;font:900 13px/1.2 ${DISPLAY};letter-spacing:1.6px;text-transform:uppercase;color:#e0b255;display:flex;align-items:center;gap:8px}
.ucp-h:after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(196,154,84,.6),rgba(196,154,84,0))}
.ucp-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:16px}
.ucp-stat{padding:8px 4px 7px;border-radius:12px;text-align:center;background:linear-gradient(180deg,#ecdcb2,#d6bf8a);border:1px solid #8a6a3a;color:#3a2a14;min-height:56px}
.ucp-stat i{display:flex;align-items:center;justify-content:center;gap:4px;font-style:normal;font-size:11px;letter-spacing:.9px;text-transform:uppercase;color:#6d5636}
.ucp-stat i svg{width:13px;height:13px}
.ucp-stat b{display:block;margin-top:3px;font:900 17px/1.1 ${DISPLAY};color:#2c1a05}
.ucp-cost{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px;align-items:center}
.ucp-cost span{display:inline-flex;align-items:center;gap:4px;padding:3px 11px 3px 5px;border-radius:999px;font-size:14px;font-weight:700;background:rgba(255,226,160,.1);border:1px solid rgba(196,154,84,.45)}
.ucp-cost span .gem3{width:20px;height:20px}
.ucp-cost span.no{border-color:#c0283f;color:#ff9aa8}
.ucp-lks{display:flex;flex-direction:column;gap:8px}
.ucp-lk{display:flex;align-items:center;gap:12px;width:100%;min-height:72px;padding:6px 12px 6px 6px;border-radius:13px;text-align:left;cursor:pointer;color:#f4e8cc;font-family:inherit;background:rgba(255,226,160,.07);border:1px solid rgba(196,154,84,.4)}
.ucp-lk.on{border-color:#e0b255;box-shadow:0 0 0 1.5px #e0b255;background:rgba(255,226,160,.14)}
.ucp-lk .th{flex:0 0 44px;width:44px;aspect-ratio:2/3;border-radius:7px;overflow:hidden;background:#0b1428;border:1px solid #8a6a3a}
.ucp-lk .th img{width:100%;height:100%;object-fit:cover;display:block}
.ucp-lk .tx{flex:1;min-width:0}.ucp-lk .tx b{display:block;font-size:14px}.ucp-lk .tx span{display:block;margin-top:2px;font-size:12px;color:#c9b48a}
.ucp-lk .tg{flex:0 0 auto;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;color:#2c1a05;background:linear-gradient(180deg,#f5d583,#c0892a)}
.ucp-lk .tg.dim{color:#c9b48a;background:none;border:1px solid rgba(196,154,84,.4);font-weight:400}
.ucp-sheetb{position:relative;display:flex;flex-direction:column;width:100%;margin-top:10px;padding:0;border-radius:12px;overflow:hidden;cursor:zoom-in;border:2px solid #8a6a3a;background:#14100b;box-shadow:0 0 0 1px #1b120b,0 8px 22px rgba(0,0,0,.55);color:#c9b48a;font-family:inherit;text-align:center}
.ucp-sheetb .im{position:relative;display:block;width:100%;aspect-ratio:2/3;background:#14100b}
.ucp-sheetb .im:before{content:"Loading the design sheet…";position:absolute;inset:0;display:grid;place-items:center;font-size:12.5px;letter-spacing:.5px}
.ucp-sheetb.bad .im:before{content:"The design sheet is not available offline"}
.ucp-sheet{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block;background:#14100b}
.ucp-zh{display:flex;align-items:center;justify-content:center;gap:7px;min-height:46px;font-size:13px;font-weight:700;color:#2c1a05;background:linear-gradient(180deg,#f5d583,#c0892a 54%,#8f6014);border-top:1px solid #4d300a}
.ucp-zh svg{width:18px;height:18px}
.ucp-trn{display:flex;flex-direction:column;gap:6px;font-size:13px;color:#e9dcbd;line-height:1.5}.ucp-trn b{color:#f4e8cc}
.ucp-note{margin:10px 2px 0;font-size:11.5px;line-height:1.6;color:#a8926a}
.ucp .bwa-gd{margin:0 0 12px;padding:10px 12px;border-radius:14px;background:rgba(255,226,160,.08);border:1px solid rgba(196,154,84,.5);text-align:center;color:#f4e8cc}
.ucp .bwa-gd>b{display:block;font-size:13px;margin-bottom:6px;color:#f4e8cc}.ucp .bwa-gd.off{opacity:.7}.ucp .bwa-gd.off span{font-size:12px;color:#c9b48a}
.ucp .bwa-gd .gc{display:flex;align-items:center;justify-content:center;gap:14px}.ucp .bwa-gd .gc em{font-style:normal;font-size:20px;font-weight:800;min-width:60px}.ucp .bwa-gd .gc em i{font-style:normal;font-size:13px;opacity:.7;font-weight:600}
.ucp .bwa-gd button{width:44px;height:44px;border-radius:12px;border:1px solid #4d300a;background:linear-gradient(180deg,#f5d583,#c0892a 54%,#8f6014);color:#2c1a05;font-size:24px;font-weight:700;line-height:1;cursor:pointer;font-family:inherit}.ucp .bwa-gd button:disabled{opacity:.4}
.ucp .bwa-gd small{display:block;margin-top:7px;font-size:11.5px;line-height:1.5;color:#c9b48a}
.ucp-gap{height:10px}
/* the zoom viewer over the page */
.ucp-zm{position:absolute;inset:0;z-index:4;pointer-events:none;display:flex;flex-direction:column;background:#0b0805;opacity:0;visibility:hidden;transition:opacity .18s,visibility 0s linear .18s}
.ucp-zm.on{pointer-events:auto;opacity:1;visibility:visible;transition:opacity .18s,visibility 0s}
.ucp-zt{flex:0 0 auto;display:flex;align-items:center;gap:8px;padding:calc(var(--st) + 8px) calc(12px + var(--sr)) 8px calc(12px + var(--sl));background:#17100a;border-bottom:1px solid rgba(196,154,84,.4)}
.ucp-zt .hint{flex:1;min-width:0;font-size:12px;color:#c9b48a;line-height:1.3}
.ucp-zb{flex:0 0 44px;width:44px;height:44px;border-radius:12px;border:1px solid #8a6a3a;background:linear-gradient(180deg,#5b4731,#3b2c1c);color:#f4e8cc;display:grid;place-items:center;padding:0;cursor:pointer;font:700 22px/1 ${FONT}}
.ucp-zb svg{width:20px;height:20px}
.ucp-zs{position:relative;flex:1;min-height:0;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab;padding-bottom:var(--sb)}
.ucp-zs img{position:absolute;left:0;top:0;width:1024px;height:1536px;max-width:none;transform-origin:0 0;will-change:transform;pointer-events:none;-webkit-user-drag:none;user-select:none}
@media (min-width:560px){.ucp-sc{padding-left:max(14px,calc(50% - 260px));padding-right:max(14px,calc(50% - 260px))}}
@media (orientation:landscape) and (max-height:560px){.ucp-hero{gap:16px}.ucp-card{flex-basis:110px;width:110px}.ucp-sheetb{max-width:min(100%,360px);margin-left:auto;margin-right:auto}}
`;
let cssIn = false;
export function ensureCss() { if (cssIn || typeof document === 'undefined') return; cssIn = true; const s = document.createElement('style'); s.id = 'uc-css'; s.textContent = UC_CSS; document.head.appendChild(s); }

// ------------------------------------------------------------------ the little shared bits the caller can use
export const statGrid = (cells) => `<div class="ucp-stats">${cells.map(([ic, lab, val]) => `<div class="ucp-stat"><i>${ico(ic, 13)}${esc(lab)}</i><b>${esc(val)}</b></div>`).join('')}</div>`;
export const section = (title, html) => `<div class="ucp-h">${esc(title)}</div>${html}`;
const BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
const ZIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>', ZOUT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>';
const ZOOMIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5M8 10.5h5M10.5 8v5"/></svg>';

// ------------------------------------------------------------------ the page
// model = { id, title, sub, chip: { text, c, g }, looks: [{ look, label, range, tag }], cur (index of the look shown now), cardOld (html of the old portrait, when there is no card),
//           heroHtml, topHtml (stats + cost, before the sheet), restHtml (after the sheet), onAction(event) }
export function createUnitPage(host, { onClose } = {}) {
  ensureCss();
  const el = document.createElement('div'); el.className = 'ucp'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Details');
  el.innerHTML = `<div class="ucp-top"><button class="ucp-back" data-uc="back" aria-label="Back">${BACK}</button><div class="ucp-tt"><b></b><span></span></div><i class="ucp-rt"></i></div><div class="ucp-sc"></div>
    <div class="ucp-zm"><div class="ucp-zt"><button class="ucp-zb" data-uc="zclose" aria-label="Close the zoom">${BACK}</button><div class="hint">Pinch, double-tap or use + / − to zoom, drag to look around</div><button class="ucp-zb" data-uc="zout" aria-label="Zoom out">${ZOUT}</button><button class="ucp-zb" data-uc="zin" aria-label="Zoom in">${ZIN}</button></div><div class="ucp-zs"><img alt="" draggable="false" decoding="async"></div></div>`;
  host.appendChild(el);
  const $ = (s) => el.querySelector(s), TT = $('.ucp-tt b'), SUB = $('.ucp-tt span'), RT = $('.ucp-rt'), SC = $('.ucp-sc'), ZM = $('.ucp-zm'), ZS = $('.ucp-zs'), ZI = ZS.querySelector('img');
  const S = { model: null, sel: 0, open: false };

  function html(m) {
    const lk = m.looks && m.looks[S.sel] || null, multi = m.looks && m.looks.length > 1;
    const card = lk ? `<div class="ucp-card">${`<img data-uk="${esc(m.kind || '')}" src="${cardUrl(lk.look)}" alt="" decoding="async">`}</div>` : `<div class="ucp-card old">${m.cardOld || ''}</div>`;
    const rows = m.looks && m.looks.length ? `<div class="ucp-lks">${m.looks.map((x, i) => `<button class="ucp-lk${i === S.sel ? ' on' : ''}" data-uc="look" data-i="${i}"><span class="th"><img src="${cardUrl(x.look)}" alt="" loading="lazy" decoding="async"></span><span class="tx"><b>${esc(x.label)}</b><span>${esc(x.range)}</span></span>${x.tag ? `<span class="tg${x.tagDim ? ' dim' : ''}">${esc(x.tag)}</span>` : ''}</button>`).join('')}</div>` : '';
    const sheet = lk ? `<button class="ucp-sheetb" data-uc="zoom" aria-label="Zoom the design sheet"><span class="im"><img class="ucp-sheet" src="${sheetUrl(lk.look)}" alt="" loading="lazy" decoding="async"></span><span class="ucp-zh">${ZOOMIC}Tap to zoom · pinch to look closer</span></button>` : '';
    return `<div class="ucp-hero">${card}<div class="ucp-hx">${m.heroHtml || ''}</div></div>${m.topHtml || ''}
      ${lk ? section('Design sheet', (multi ? rows : '') + sheet) : ''}${m.restHtml || ''}`;
  }
  function paint(keep) {
    const m = S.model, y = keep ? SC.scrollTop : 0; if (!m) return;
    TT.textContent = m.title || ''; SUB.textContent = m.sub || '';
    if (m.chip) { RT.textContent = m.chip.text; RT.style.setProperty('--rc', m.chip.c); RT.style.setProperty('--rg', m.chip.g || 'transparent'); RT.style.display = ''; } else RT.style.display = 'none';
    el.style.setProperty('--rc', (m.chip && m.chip.c) || '#c49a54'); el.style.setProperty('--rg', (m.chip && m.chip.g) || 'transparent');
    SC.innerHTML = html(m); SC.scrollTop = y;
  }
  function open(m) { S.model = m; S.sel = Math.max(0, m.cur | 0); S.open = true; zoomClose(true); paint(false); el.classList.add('on'); }
  function refresh(m) { if (!S.open) return; S.model = m; paint(true); }
  function close() { if (!S.open) return; S.open = false; zoomClose(true); el.classList.remove('on'); if (onClose) onClose(); }

  // ---- zoom: one finger drags, two fingers pinch (about their midpoint), double-tap / double-click toggles, the wheel zooms about the pointer, + / − buttons
  const Z = { s: 1, x: 0, y: 0, W: 1, H: 1, fit: 0.3, on: false }, IW = 1024, IH = 1536, MAXS = 4.5;
  const P = new Map(); let g = null, lastTap = null;
  const apply = () => { ZI.style.transform = `translate(${Z.x}px,${Z.y}px) scale(${Z.fit * Z.s})`; };
  function clampXY() {
    const w = IW * Z.fit * Z.s, h = IH * Z.fit * Z.s;
    Z.x = w <= Z.W ? (Z.W - w) / 2 : Math.min(0, Math.max(Z.W - w, Z.x)); Z.y = h <= Z.H ? (Z.H - h) / 2 : Math.min(0, Math.max(Z.H - h, Z.y));
  }
  function measure() { const r = ZS.getBoundingClientRect(); Z.W = Math.max(1, r.width); Z.H = Math.max(1, r.height - (parseFloat(getComputedStyle(ZS).paddingBottom) || 0)); Z.fit = Math.min(Z.W / IW, Z.H / IH); }
  function zoomTo(s, cx, cy) {            // scale s about the stage point (cx, cy)
    s = Math.max(1, Math.min(MAXS, s)); const k = Z.fit * Z.s, ix = (cx - Z.x) / k, iy = (cy - Z.y) / k;
    Z.s = s; const k2 = Z.fit * s; Z.x = cx - ix * k2; Z.y = cy - iy * k2; clampXY(); apply();
  }
  function zoomOpen() {
    const lk = S.model && S.model.looks && S.model.looks[S.sel]; if (!lk) return;
    ZI.src = sheetUrl(lk.look); ZM.classList.add('on'); Z.on = true; measure(); Z.s = 1; Z.x = 0; Z.y = 0; clampXY(); apply();
  }
  function zoomClose(quiet) { if (!Z.on && !quiet) return; Z.on = false; ZM.classList.remove('on'); P.clear(); g = null; }
  const mid = () => { const a = [...P.values()]; return { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2, d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1 }; };
  const local = (e) => { const r = ZS.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  ZS.addEventListener('pointerdown', (e) => {
    try { ZS.setPointerCapture(e.pointerId); } catch (_) { /* (a synthetic pointer) */ }
    const p = local(e); P.set(e.pointerId, { x: p.x, y: p.y, x0: p.x, y0: p.y, t0: e.timeStamp });
    if (P.size === 2) { const m = mid(); g = { mode: 'pinch', d0: m.d, s0: Z.s, ix: (m.x - Z.x) / (Z.fit * Z.s), iy: (m.y - Z.y) / (Z.fit * Z.s) }; lastTap = null; }
    else if (P.size === 1) g = { mode: 'pan', x: Z.x, y: Z.y, px: p.x, py: p.y, moved: false };
  });
  ZS.addEventListener('pointermove', (e) => {
    const q = P.get(e.pointerId); if (!q || !g) return; const p = local(e); q.x = p.x; q.y = p.y;
    if (g.mode === 'pinch' && P.size >= 2) { const m = mid(); Z.s = Math.max(1, Math.min(MAXS, g.s0 * m.d / g.d0)); const k = Z.fit * Z.s; Z.x = m.x - g.ix * k; Z.y = m.y - g.iy * k; clampXY(); apply(); }
    else if (g.mode === 'pan' && P.size === 1) { if (Math.hypot(p.x - g.px, p.y - g.py) > 4) g.moved = true; Z.x = g.x + (p.x - g.px); Z.y = g.y + (p.y - g.py); clampXY(); apply(); }
  });
  const up = (e) => {
    const q = P.get(e.pointerId); if (!q) return; P.delete(e.pointerId);
    const tap = e.type === 'pointerup' && g && g.mode === 'pan' && !g.moved && e.timeStamp - q.t0 < 350;
    if (P.size === 1 && g && g.mode === 'pinch') { const r = [...P.values()][0]; g = { mode: 'pan', x: Z.x, y: Z.y, px: r.x, py: r.y, moved: true }; }
    else if (P.size === 0) g = null;
    if (tap) { const now = e.timeStamp; if (lastTap && now - lastTap.t < 320 && Math.hypot(q.x - lastTap.x, q.y - lastTap.y) < 28) { zoomTo(Z.s > 1.05 ? 1 : 2.6, q.x, q.y); lastTap = null; } else lastTap = { t: now, x: q.x, y: q.y }; }
  };
  ZS.addEventListener('pointerup', up); ZS.addEventListener('pointercancel', up);
  ZS.addEventListener('wheel', (e) => { e.preventDefault(); const p = local(e); zoomTo(Z.s * Math.exp(-e.deltaY * 0.0022), p.x, p.y); }, { passive: false });
  window.addEventListener('resize', () => { if (Z.on) { measure(); clampXY(); apply(); } });

  el.addEventListener('click', (e) => {
    const t = e.target.closest('[data-uc]');
    if (t) {
      const a = t.dataset.uc;
      if (a === 'back') return close();
      if (a === 'zoom') return zoomOpen();
      if (a === 'zclose') return zoomClose();
      if (a === 'zin') return zoomTo(Z.s * 1.5, Z.W / 2, Z.H / 2);
      if (a === 'zout') return zoomTo(Z.s / 1.5, Z.W / 2, Z.H / 2);
      if (a === 'look') { const i = +t.dataset.i; if (i !== S.sel) { S.sel = i; paint(true); } return; }
    }
    if (S.model && S.model.onAction) S.model.onAction(e);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.open) { if (Z.on) zoomClose(); else close(); } });
  return { open, refresh, close, isOpen: () => S.open, el };
}

// ------------------------------------------------------------------ Part B hook: the story-characters gallery lives in web/assets/units/chars.js (24 cards + 24 sheets)
// All the game page carries is this stub: window.BW_chars.open([key]) fetches chars.js the first time it is called (never in the loader stage), chars.js swaps the stub for the real API.
if (typeof window !== 'undefined' && !window.BW_chars) {
  window.BW_unitcards = { BASE, createUnitPage, ensureCss, statGrid, section, cardUrl, sheetUrl, esc };
  let loading = null;
  window.BW_chars = {
    stub: true,
    open(key) {
      if (!loading) loading = new Promise((ok, no) => { const s = document.createElement('script'); s.src = `${BASE}units/chars.js`; s.onload = ok; s.onerror = () => { loading = null; no(new Error('chars.js not found')); }; document.head.appendChild(s); });
      return loading.then(() => { if (window.BW_chars.stub) throw new Error('chars.js did not start'); return window.BW_chars.open(key); });
    },
  };
}
