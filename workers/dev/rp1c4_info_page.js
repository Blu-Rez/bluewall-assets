// rp1c4_info_page.js — RP1C_R4 browser part (run with:  python3 rp1c2_q.py -t TAG evalf rp1c4_info_page.js).  Returns { ok, fails, ... }.
(async () => {
  const F = [], t = (c, m) => { if (!c) F.push(m); }, sl = (ms) => new Promise((r) => setTimeout(r, ms)), K = ['elina', 'elika', 'melika', 'mobina', 'aylin', 'aylar'];
  const h = await window.__rpLoad('?v=' + Date.now()); window.__h = h; h.openPick(); await sl(500);
  const ready = async () => { for (let i = 0; i < 80; i++) { await sl(150); const e = document.querySelector('.rpi'); if (e && e.dataset.ready) return e; } return null; };
  const gone = () => !document.querySelector('.rpi'), pickUp = () => !!document.querySelector('.rp-pick') && document.querySelectorAll('.rp-card').length === 6;
  // 1. the six buttons: 44 x 44 hit area, >= 30 px visible, inside their card and the screen
  for (const k of K) {
    const b = document.querySelector('.rp-i[data-info=' + k + ']'), r = b.getBoundingClientRect(), v = b.querySelector('i').getBoundingClientRect(), c = b.parentElement.getBoundingClientRect();
    t(r.width >= 44 && r.height >= 44, k + ': hit area ' + r.width + 'x' + r.height); t(v.width >= 30 && v.height >= 30, k + ': visible ' + v.width); t(r.right <= innerWidth && r.top >= 0 && r.right <= c.right + 4, k + ': outside card / screen');
  }
  // 2. each sister opens (the game must NOT start), shows its text, closes a different way each time; the pick screen is intact afterwards
  const how = ['x', 'edge', 'esc', 'pop', 'tg', 'x'], seen = {}; let tgHide = 0, tgClick = null;
  window.Telegram = { WebApp: { BackButton: { isVisible: false, onClick(f) { tgClick = f; }, offClick() { tgClick = null; }, show() {}, hide() { tgHide++; } }, isVersionAtLeast: () => true } };
  for (let i = 0; i < 6; i++) {
    const k = K[i]; document.querySelector('.rp-i[data-info=' + k + ']').click(); const e = await ready(); t(!!e && e.dataset.k === k, k + ': page did not open');
    if (!e) continue; const tx = e.innerText, I = h.info.INFO[k];
    for (const w of ['در دست‌ها', 'پاها', 'لباس', 'توان‌ها', 'داستان', I.name, I.role, I.legs[0], I.cloth[0], I.story[0], I.story[1]]) t(tx.includes(w), k + ': text lacks «' + w + '»');
    t(!/ربات/.test(tx), k + ': forbidden word'); t(!h.active, k + ': the game started'); t(pickUp(), k + ': pick screen vanished while open');
    t(e.querySelector('.rpi-x').getBoundingClientRect().width >= 44, k + ': X < 44 px'); t(e.querySelector('.rpi-card img').naturalWidth > 0, k + ': card picture not loaded');
    const m = how[i]; seen[k] = m;
    if (m === 'x') e.querySelector('.rpi-x').click();
    else if (m === 'edge') e.dispatchEvent(new MouseEvent('click', { bubbles: true }));   // target = the dark overlay itself
    else if (m === 'esc') document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true }));
    else if (m === 'pop') { history.back(); await sl(400); }
    else if (m === 'tg') { t(typeof tgClick === 'function', k + ': Telegram back not hooked'); if (tgClick) tgClick(); }
    await sl(300); t(gone(), k + ': did not close with ' + m); t(pickUp(), k + ': pick screen broken after ' + m); t(!h.active, k + ': game started after close');
  }
  t(tgHide >= 1, 'Telegram back button was never hidden again');
  // 3. a tap inside the panel does not close it
  document.querySelector('.rp-i[data-info=aylar]').click(); const e3 = await ready(); if (e3) { e3.querySelector('.rpi-sc').dispatchEvent(new MouseEvent('click', { bubbles: true })); await sl(200); t(!gone(), 'a tap inside the panel closed it'); e3.querySelector('.rpi-x').click(); await sl(200); }
  // 4. the pick is still usable: a card starts the hero; then the HUD «i» (hero mode): opens, the world stands still, close gives it back; Esc closes only the page
  const out = { seen };
  if (!window.__rpNoStart) {
    const t0 = performance.now(); await h.start('aylar'); out.startMs = Math.round(performance.now() - t0); t(h.active, 'the hero did not start from the pick');
    if (h.active) {
      const b = [...document.querySelectorAll('.rp-b[data-rp=info]')].pop();   // (the LAST one: a hot-reloaded older instance leaves its hidden HUD in the DOM)
      t(!!b, 'no HUD «i»'); if (b) {
        const r = b.getBoundingClientRect(); t(r.width >= 44 && r.height >= 44 && r.left >= 0 && r.top >= 0, 'HUD «i» size / place ' + JSON.stringify([r.x, r.y, r.width, r.height])); out.hud = [r.x, r.y, r.width, r.height];
        b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 7 })); b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 7 }));
        const e = await ready(); t(!!e && e.dataset.k === 'aylar', 'HUD «i» did not open aylar'); t(h.dev.S.paused === true, 'world not paused while the page is open');
        document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape', bubbles: true })); await sl(300); t(gone(), 'Esc did not close the page'); t(h.active, 'Esc left hero mode (it must only close the page)'); t(h.dev.S.paused === false, 'pause not given back');
      }
      h.exit(); await sl(300); t(!h.active, 'exit failed');
    }
  }
  out.ok = F.length === 0; out.fails = F; return out;
})()
