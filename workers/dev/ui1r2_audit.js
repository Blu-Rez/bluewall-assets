() => {
  const VW = innerWidth, VH = innerHeight, root = document.querySelector('.bw-ui');
  const out = { small: [], off: [], anim: [], bd: [], font: [], vw: VW, vh: VH, n: 0 };
  const vis = (e) => { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0 || cs.pointerEvents === 'none') return false; const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; if (r.right <= 0 || r.bottom <= 0 || r.left >= VW || r.top >= VH) return false;
    for (let p = e.parentElement; p && p !== root; p = p.parentElement) { const c = getComputedStyle(p); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false; } return true; };
  const desc = (e) => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + '.' + [...e.classList].slice(0, 3).join('.') + (e.dataset && (e.dataset.a || e.dataset.t || e.dataset.tab || e.dataset.cat || e.dataset.e) ? '[' + (e.dataset.a || e.dataset.t || e.dataset.tab || e.dataset.cat || e.dataset.e) + ']' : '')).slice(0, 70);
  // hit box = rect expanded by a ::before hit-area pseudo (position:absolute with negative / explicit offsets)
  const hitBox = (e) => { const r = e.getBoundingClientRect(); let L = r.left, T = r.top, R = r.right, B = r.bottom; for (const ps of ['::before', '::after']) { const c = getComputedStyle(e, ps); if (c.content === 'none' || c.position !== 'absolute') continue;
      const w = parseFloat(c.width), h = parseFloat(c.height), l = parseFloat(c.left), t = parseFloat(c.top), rr = parseFloat(c.right), bb = parseFloat(c.bottom);
      if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0 && (!isNaN(l) || !isNaN(rr))) { const x0 = r.left + (isNaN(l) ? (r.width - rr - w) : l), y0 = r.top + (isNaN(t) ? (r.height - bb - h) : t); L = Math.min(L, x0); T = Math.min(T, y0); R = Math.max(R, x0 + w); B = Math.max(B, y0 + h); } } return [R - L, B - T]; };
  const SEL = 'button,[data-a],[data-t],[data-e],[data-g],[data-tab],[data-cat],input,select,textarea,a[href],[role=button],.bwa-c,.bw-tab,.bw-seg span,.bw-tg,.bwa-x,.bws-x,.bwk-x,.bwu-x,.bwh-x,.bsh-x,.bsh-b,.bsh-chip';
  const seen = new Set();
  for (const e of root.querySelectorAll(SEL)) { if (seen.has(e) || !vis(e) || e.matches('.cr')) continue; seen.add(e);
    if (e.matches('.bwu-btn,.bwa-btn,.bwa-chip,.bwk-chip') && getComputedStyle(e).display === 'none') continue;
    out.n++; const [w, h] = hitBox(e); const r = e.getBoundingClientRect();
    if (e.matches('input[type=range]')) { if (h < 44 && Math.round(r.height) < 44) out.small.push([desc(e), Math.round(w), Math.round(h)]); continue; }
    if (w < 43.5 || h < 43.5) out.small.push([desc(e), Math.round(w), Math.round(h)]); }
  // anything of the UI outside the screen (only things that are meant to be on screen: panels, sheets, hud pieces)
  for (const e of root.querySelectorAll('.bw-top *,.bwu-pan,.bwa-pan,.bws-pan,.bwk-pan,.bw-panel,.bwh-pan,.bsh,.bwa-sheet,.bw-toast,.bwh-btn')) { if (!vis(e)) continue; const r = e.getBoundingClientRect(); if (r.left < -1 || r.top < -1 || r.right > VW + 1 || r.bottom > VH + 1) { if (e.closest('.bwa-body,.bwu-body,.bws-body,.bwk-body,.bw-body,.bwa-sheet,.bsh-body')) continue; out.off.push([desc(e), Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]); } }
  // endless animations / backdrop filters in computed styles (elements + pseudo-elements)
  const all = root.querySelectorAll('*');
  for (const e of all) for (const ps of [null, '::before', '::after']) { const c = getComputedStyle(e, ps || undefined); if (ps && c.content === 'none') continue;
    if (c.animationName !== 'none' && /infinite/.test(c.animationIterationCount)) out.anim.push([desc(e) + (ps || ''), c.animationName]);
    if (c.backdropFilter && c.backdropFilter !== 'none') out.bd.push(desc(e) + (ps || '')); }
  // smallest text in sight
  for (const e of all) { if (!e.childNodes.length) continue; let t = ''; for (const n of e.childNodes) if (n.nodeType === 3) t += n.textContent; if (!t.trim() || !vis(e)) continue; const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 10) out.font.push([desc(e), fs, t.trim().slice(0, 20)]); }
  return out;
}
