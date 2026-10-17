// ui1r4_probe.js — UI1_R4 geometry probe for ONE open menu.  Evaluated in the page as  (PROBE)(args)  by ui1r4_scenes.py (census + dev/ui1_menus_test.sh).
// args = { root, pan, close, W, H, safe: {t, r, b, l} }   root = the overlay element selector, pan = the visible panel inside it (default: root), close = the close button selector.
// Returns plain JSON: opens, fits, pageScroll, closeOk, scrollers, small targets, targets under the notch / rounded corners, clipped content, cut text, columns, body height.
(args) => {
  const { root: rootSel, pan: panSel, close: closeSel, W, H } = args; const MINT = 40; const S = args.safe || { t: 0, r: 0, b: 0, l: 0 };      // UI3: MINT = the owner's rule — buttons are 40-48 px (was 44)
  const out = { root: rootSel, opens: false, fail: [], note: [] };
  const root = document.querySelector(rootSel);
  if (!root) { out.fail.push('no root'); return out; }
  const pan = panSel ? (root.matches(panSel) ? root : root.querySelector(panSel)) : root;
  if (!pan) { out.fail.push('no panel'); return out; }
  const desc = (e) => { let s = e.tagName.toLowerCase(); if (e.id) s += '#' + e.id; if (typeof e.className === 'string' && e.className.trim()) s += '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.'); const t = (e.getAttribute && (e.getAttribute('aria-label') || e.getAttribute('data-a') || e.getAttribute('data-t'))) || (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 18); return s + (t ? '«' + t + '»' : ''); };
  const R = (e) => e.getBoundingClientRect();
  const shown = (e) => { for (let n = e; n && n !== document.documentElement; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false; } const r = R(e); return r.width > 0 && r.height > 0; };
  const pr = R(pan);
  const tr = getComputedStyle(pan).transform; let settled = true; if (tr && tr !== 'none') { const m = new DOMMatrix(tr); settled = m.a > 0.99 && m.d > 0.99; }      // (a sheet that is still sliding in is not "open" yet)
  out.opens = shown(root) && shown(pan) && settled;
  out.rect = [pr.left, pr.top, pr.width, pr.height].map(Math.round);
  out.W = W; out.H = H; out.panelFrac = [+(pr.width / W).toFixed(2), +(pr.height / H).toFixed(2)];
  out.fits = pr.left >= -0.5 && pr.top >= -0.5 && pr.right <= W + 0.5 && pr.bottom <= H + 0.5;
  const de = document.scrollingElement;
  out.pageScroll = de.scrollHeight > H + 1 || de.scrollWidth > W + 1;
  // ---- scroll containers inside the panel
  const all = [pan, ...pan.querySelectorAll('*')];
  const scrollers = [];
  for (const e of all) { const cs = getComputedStyle(e); if (!/(auto|scroll)/.test(cs.overflowY) || e.clientHeight <= 0) continue; if (e.scrollHeight > e.clientHeight + 1) scrollers.push({ d: desc(e), sh: e.scrollHeight, ch: e.clientHeight, y: Math.round(R(e).top), b: Math.round(R(e).bottom) }); }
  out.scrollers = scrollers;
  const main = scrollers.slice().sort((a, b) => b.sh - a.sh)[0]; out.bodyH = main ? main.ch : null; out.bodyFrac = main ? +(main.ch / H).toFixed(2) : null;
  // ---- clip region of an element (intersection of the overflow-clipping ancestors up to the panel)
  const clipOf = (e) => { let L = -1e9, T = -1e9, Rr = 1e9, B = 1e9; for (let n = e.parentElement; n; n = n.parentElement) { const cs = getComputedStyle(n); const ox = cs.overflowX !== 'visible', oy = cs.overflowY !== 'visible'; if (ox || oy) { const r = R(n); if (ox) { L = Math.max(L, r.left); Rr = Math.min(Rr, r.right); } if (oy) { T = Math.max(T, r.top); B = Math.min(B, r.bottom); } } if (n === pan) break; } return { L, T, R: Rr, B }; };
  const vrect = (e) => { const r = R(e), c = clipOf(e); const l = Math.max(r.left, c.L, 0), t = Math.max(r.top, c.T, 0), rr = Math.min(r.right, c.R, W), bb = Math.min(r.bottom, c.B, H); return { l, t, r: rr, b: bb, w: rr - l, h: bb - t, full: r }; };
  // ---- targets
  const TSEL = 'button,[role=button],a[href],input,select,textarea,[data-a],[data-t],[data-k],.bwu-cat,.bwu-tab,.bw-tab';
  const pills = [...document.querySelectorAll('#tgmock > div')].map((x) => x.getBoundingClientRect());
  const small = [], under = [], seen = new Set();
  for (const e of pan.querySelectorAll(TSEL)) {
    if (e.closest('[disabled],.dis') && !e.matches('input,select')) { /* disabled ones still must be big enough */ }
    if (!shown(e)) continue; const v = vrect(e); const full = v.full; if (v.w * v.h < 0.5 * full.width * full.height) continue;       // scrolled out of its clip box: counted by the scroller, not here
    if (e.querySelector(TSEL) && !e.matches('button,[role=button],input,select')) continue;                                                  // wrappers (a card that holds its own buttons)
    const w = Math.round(full.width), h = Math.round(full.height);
    if (Math.min(w, h) < MINT - 0.5) { const k = desc(e); if (!seen.has(k)) { seen.add(k); small.push({ d: k, w, h }); } }
    const hitPill = pills.some((q) => full.left < q.right - 3 && full.right > q.left + 3 && full.top < q.bottom - 3 && full.bottom > q.top + 3);      // Telegram's own Close / ⌄ ⋮ buttons
    let inScr = false; for (let n = e.parentElement; n && n !== pan.parentElement; n = n.parentElement) { const c2 = getComputedStyle(n); if (/(auto|scroll)/.test(c2.overflowY) && n.scrollHeight > n.clientHeight + 1) { inScr = true; break; } }      // (a row inside a scrolling list — or inside a panel that itself scrolls, like a building sheet — passes the home bar while it scrolls and is reached by scrolling)
    if (full.left < S.l - 0.5 || full.right > W - S.r + 0.5 || (full.bottom > H - S.b + 0.5 && !inScr) || hitPill) { if (v.w > 4 && v.h > 4) under.push({ d: desc(e), r: [full.left, full.top, full.right, full.bottom].map(Math.round) }); }
  }
  out.small = small; out.under = under;
  // ---- close button
  let closeOk = false, closeInfo = null; const cb = closeSel ? (root.querySelector(closeSel) || document.querySelector(closeSel)) : null;
  if (cb && shown(cb)) { const r = R(cb), cx = r.left + r.width / 2, cy = r.top + r.height / 2, top = document.elementFromPoint(cx, cy); closeInfo = { w: Math.round(r.width), h: Math.round(r.height), at: [Math.round(cx), Math.round(cy)] };
    closeOk = r.left >= S.l - 0.5 && r.right <= W - S.r + 0.5 && r.top >= 0 && r.bottom <= H - S.b + 0.5 && !pills.some((q) => r.left < q.right - 3 && r.right > q.left + 3 && r.top < q.bottom - 3 && r.bottom > q.top + 3) && r.width >= MINT - 0.5 && r.height >= MINT - 0.5 && !!top && (top === cb || cb.contains(top)); }
  out.closeOk = closeOk; out.closeInfo = closeInfo; if (!cb) out.note.push('no close button element (closes by tapping outside)');
  // ---- content that is cut and can never be reached (inside an overflow:hidden box, no scroll) or lies outside the screen
  const hasTextBelow = (e) => !!e.textContent.trim();                                                                                  // an svg with text inside is content, not an icon
  const roundBadge = (a, ar) => { const v = getComputedStyle(a).borderTopLeftRadius; const px = v.endsWith('%') ? parseFloat(v) / 100 * Math.min(ar.width, ar.height) : parseFloat(v); return px >= Math.min(ar.width, ar.height) / 2 - 1; };   // icon cropped by a circular badge (hub Attack seal): a design crop, not lost content
  const cut = [], leaves = [];
  for (const e of all) { if (e === pan) continue; if (!shown(e)) continue; const hasText = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()); if (hasText || e.matches('img,svg,canvas,input,button,select')) leaves.push(e); }
  for (const e of leaves) {
    const r = R(e); if (r.width < 1 || r.height < 1) continue;
    let anc = null; for (let n = e.parentElement; n; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.overflowY !== 'visible' || cs.overflowX !== 'visible') { anc = n; break; } if (n === pan) break; }
    // nearest clipping ancestor: scrollable -> reachable; hidden/clip -> must fit inside
    if (anc) { const cs = getComputedStyle(anc); const scY = /(auto|scroll)/.test(cs.overflowY) && anc.scrollHeight > anc.clientHeight + 1, ar = R(anc);
      const sideOut = r.left < ar.left - 3 || r.right > ar.right + 3, topOut = r.top < ar.top - 3 || r.bottom > ar.bottom + 3;      // (3 px: decorative glows / sub-pixel rounding)
      if (sideOut && !/(auto|scroll)/.test(cs.overflowX)) cut.push({ d: desc(e), why: 'sideways out of ' + desc(anc) + ' [' + [r.left, r.right].map(Math.round) + ' vs ' + [ar.left, ar.right].map(Math.round) + ']' });
      else if (topOut && !scY && !/(auto|scroll)/.test(cs.overflowY) && !(e.matches('svg,img') && !hasTextBelow(e) && roundBadge(anc, ar))) cut.push({ d: desc(e), why: 'below/above ' + desc(anc) + ' (hidden, no scroll)' }); }
    if (r.bottom > H + 1.5 || r.right > W + 1.5 || r.left < -1.5 || r.top < -1.5) { let inScroll = false; for (let n = e.parentElement; n && n !== document.body; n = n.parentElement) { const cs = getComputedStyle(n); if ((/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 1) || (/(auto|scroll)/.test(cs.overflowX) && n.scrollWidth > n.clientWidth + 1)) { inScroll = true; break; } } if (!inScroll) cut.push({ d: desc(e), why: 'outside the screen' }); }
  }
  out.cut = cut.slice(0, 12); out.cutN = cut.length;
  // ---- text cut by overflow:hidden (the visible text is shorter than the text)
  const txt = [], ell = [];
  for (const e of all) { if (e === pan || !shown(e)) continue; const cs = getComputedStyle(e); if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue; const hasText = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()); if (!hasText) continue;
    if (e.scrollWidth > e.clientWidth + 1.5) { (cs.textOverflow === 'ellipsis' ? ell : txt).push({ d: desc(e), sw: e.scrollWidth, cw: e.clientWidth }); }
    else if (e.scrollHeight > e.clientHeight + 1.5 && !/(auto|scroll)/.test(cs.overflowY)) txt.push({ d: desc(e), sh: e.scrollHeight, ch: e.clientHeight }); }
  out.textCut = txt.slice(0, 12); out.textCutN = txt.length; out.ellipsisN = ell.length; out.ellipsis = ell.slice(0, 6);
  // ---- columns: most visible cards that share one row inside the main scroller (or the panel)
  const host = main ? [...all].find((e) => desc(e) === main.d) : pan; let cols = 1;
  if (host) { const kids = []; const add = (el) => { for (const c of el.children) { if (!shown(c)) continue; const r = R(c); if (r.width < 24 || r.height < 18) continue; kids.push(r); } };
    add(host); for (const c of host.children) { const cs = getComputedStyle(c); if (cs.display.indexOf('grid') >= 0 || (cs.display.indexOf('flex') >= 0 && cs.flexWrap !== 'nowrap')) add(c); }
    const rows = {}; for (const r of kids) { const k = Math.round(r.top / 6); (rows[k] = rows[k] || []).push(Math.round(r.left / 6)); } for (const k in rows) cols = Math.max(cols, new Set(rows[k]).size); }
  out.cols = cols;
  // ---- verdict
  if (!out.opens) out.fail.push('does not open (hidden / still sliding)');
  if (!out.fits) out.fail.push('panel not inside the screen ' + out.rect.join(','));
  if (out.pageScroll) out.fail.push('the page scrolls');
  if (cb ? !closeOk : false) out.fail.push('close button not reachable');
  if (small.length) out.fail.push(small.length + ' target(s) < ' + MINT + ' px: ' + small.slice(0, 3).map((s) => s.d + ' ' + s.w + '×' + s.h).join(', '));
  if (under.length) out.fail.push(under.length + ' target(s) under the notch / corner / home bar: ' + under.slice(0, 2).map((s) => s.d).join(', '));
  if (cut.length) out.fail.push(cut.length + ' element(s) cut / unreachable: ' + cut.slice(0, 2).map((s) => s.d + ' (' + s.why + ')').join(', '));
  if (txt.length) out.fail.push(txt.length + ' text(s) clipped: ' + txt.slice(0, 2).map((s) => s.d).join(', '));
  if (args.size !== false && (pr.height > 0.70 * H + 0.5 || pr.width > 0.75 * W + 0.5)) out.fail.push('panel too big: ' + Math.round(pr.width) + '×' + Math.round(pr.height) + ' = ' + Math.round(100 * pr.width / W) + '% × ' + Math.round(100 * pr.height / H) + '% (the limit is 75% × 70%)');      // UI3: the owner's size rule
  if (main && main.ch < 0.3 * H && main.sh > 2 * main.ch) out.fail.push('cramped: the scrolling body shows only ' + main.ch + ' px of ' + H);
  out.ok = out.fail.length === 0;
  return out;
}
