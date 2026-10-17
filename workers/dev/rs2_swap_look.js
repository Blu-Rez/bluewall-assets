// rs2_swap_look.js — RS2: open the fan, tap a sister while her glb is held back 6 s: the chip + the spinner are on screen meanwhile (shot it), nothing else changes.   usage: python3 rp1c2_q.py -t rs2 evalf rs2_swap_look.js
(async () => {
  const sl = (ms) => new Promise((r) => setTimeout(r, ms)), h = window.__h, S = h.dev.S;
  const tap = (e) => { e.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 11, pointerType: 'touch' })); e.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 11, pointerType: 'touch' })); };
  const f0 = window.__rs2f0 || window.fetch; window.__rs2f0 = f0; const want = window.__rs2To || 'aylar';
  window.fetch = (u, ...a) => (/\.glb/.test(String(u && u.url || u)) ? new Promise((r) => setTimeout(r, window.__rs2Hold || 6000)).then(() => f0(u, ...a)) : f0(u, ...a));
  h.sisters.openFan(); await sl(1200); tap(document.querySelector('.rs-f[data-k=' + want + ']')); await sl(1800);
  const chip = document.querySelector('.rs-chip');
  return JSON.stringify({ key: S.key, open: h.sisters.st.open, busy: h.sisters.st.busy, ld: h.sisters.main.classList.contains('ld'), chip: !!chip, chipText: chip && chip.textContent, pick: !!document.querySelector('.rp-pick'), blue: !!document.querySelector('.bwb-load') });
})()
