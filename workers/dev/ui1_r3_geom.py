# ui1_r3_geom.py — UI1-R3 geometry test on the light rig (ui1_r3_rig.html: real HUD + stand-ins for the crown and the hero buttons).
# 3 layouts x 3 landscape sizes x 3 safe-area cases (Telegram header 56 px; header + 47 px notch sides; none).  Prints one line per failure, then 'UI1R3 GEOM OK' / 'FAILED'.
import asyncio, sys, json
from playwright.async_api import async_playwright
VIEWS = [(844, 390), (800, 360), (932, 430)]
SAFES = [dict(top=56, side=0, bot=0), dict(top=56, side=47, bot=0), dict(top=0, side=0, bot=0), dict(top=56, side=24, bot=21, min_h=390)]      # (the home-bar case only on the 390 / 430 high sizes: a 360 high phone has no home bar)
JS = """([layout, hero, S, W, H]) => {
  const R = document.documentElement.style; R.setProperty('--tg-content-safe-area-inset-top', S.top + 'px'); R.setProperty('--tg-safe-area-inset-left', S.side + 'px'); R.setProperty('--tg-safe-area-inset-right', S.side + 'px'); R.setProperty('--tg-safe-area-inset-bottom', S.bot + 'px');
  document.documentElement.setAttribute('data-hud', String(layout)); window.__hero(!!hero); void document.body.offsetHeight;
  const rc = (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; };
  const hit = (e) => { const r = e.getBoundingClientRect(); let L = r.left, T = r.top, Rr = r.right, B = r.bottom; for (const ps of ['::before', '::after']) { const c = getComputedStyle(e, ps); if (c.content === 'none' || c.position !== 'absolute') continue;
      const w = parseFloat(c.width), h = parseFloat(c.height), l = parseFloat(c.left), t = parseFloat(c.top), rr = parseFloat(c.right), bb = parseFloat(c.bottom);
      if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0 && (!isNaN(l) || !isNaN(rr))) { const x0 = r.left + (isNaN(l) ? (r.width - rr - w) : l), y0 = r.top + (isNaN(t) ? (r.height - bb - h) : t); L = Math.min(L, x0); T = Math.min(T, y0); Rr = Math.max(Rr, x0 + w); B = Math.max(B, y0 + h); } } return [Rr - L, B - T]; };
  const vis = (e) => { const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && e.getBoundingClientRect().width > 0; };
  const out = [];
  const get = (sel) => [...document.querySelectorAll(sel)].filter(vis);
  const sl = Math.max(S.side, 0), sr = sl;
  if (!hero) {
    const names = { '.bw-lvl': 'level', '.bw-who': 'name', '.bw-g': 'gem', '.bw-p': 'special', '.rp-open': 'crown', '.bwh-btn': 'assist' };
    const items = []; for (const [sel, nm] of Object.entries(names)) for (const e of get(sel)) items.push({ nm: nm + (e.dataset.g || e.dataset.p || ''), e, r: rc(e) });
    for (const it of items) { const [l, t, r, b] = it.r;
      if (l < sl + 4 - 0.5) out.push(`${it.nm}: left ${Math.round(l)} < safe ${sl + 4}`); if (r > W - sr - 4 + 0.5) out.push(`${it.nm}: right ${Math.round(r)} > ${W - sr - 4}`);
      if (t < S.top - 0.5 && it.nm !== 'name') out.push(`${it.nm}: top ${Math.round(t)} < header ${S.top}`); if (b > H - S.bot + 0.5) out.push(`${it.nm}: bottom ${Math.round(b)} > ${H - S.bot}`); }
    for (const it of items) if (/^(level|special|crown|assist)/.test(it.nm)) { const [w, h] = hit(it.e); if (w < 43.5 || h < 43.5) out.push(`${it.nm}: target ${Math.round(w)}x${Math.round(h)} < 44`); }
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) { const a = items[i], c = items[j]; if ((a.nm === 'level' && c.nm === 'name') || (a.nm === 'name' && c.nm === 'level')) continue;
      const A = a.r, B = c.r; if (A[0] < B[2] - 0.5 && B[0] < A[2] - 0.5 && A[1] < B[3] - 0.5 && B[1] < A[3] - 0.5) out.push(`overlap ${a.nm} / ${c.nm}`); }
    // thumb zones: bottom-left 200 x 170 must be free of the HUD; bottom-right 170 x 170 holds only Assist and the crown
    for (const it of items) { const [l, t, r, b] = it.r; if (l < 200 + sl && r > 0 && b > H - 170 - S.bot) out.push(`${it.nm}: inside the movement zone (bottom-left)`);
      if (r > W - 170 - sr && b > H - 170 - S.bot && !/^(assist|crown)/.test(it.nm)) out.push(`${it.nm}: inside the action zone (bottom-right)`); }
    // nothing of the strategic HUD on the left column below the badge may cover the area under Telegram's Close: nothing to test; the crown must have its own 8 px air from the pills
  } else {
    const hb = [...document.querySelectorAll('.rp-b')].filter(vis).map((e) => ({ nm: e.dataset.rp, e, r: rc(e) }));
    for (const it of hb) { const [l, t, r, b] = it.r; if (r - l < 43.5 || b - t < 43.5) out.push(`hero ${it.nm}: ${Math.round(r - l)}x${Math.round(b - t)} < 44`);
      if (l < sl + 4 - 0.5 || r > W - sr - 4 + 0.5) out.push(`hero ${it.nm}: outside the side safe area (${Math.round(l)}..${Math.round(r)})`); if (t < S.top - 0.5) out.push(`hero ${it.nm}: under the header (top ${Math.round(t)} < ${S.top})`); if (b > H - S.bot + 0.5) out.push(`hero ${it.nm}: bottom ${Math.round(b)} > ${H - S.bot}`); }
    for (let i = 0; i < hb.length; i++) for (let j = i + 1; j < hb.length; j++) { const A = hb[i].r, B = hb[j].r; if (A[0] < B[2] - 0.5 && B[0] < A[2] - 0.5 && A[1] < B[3] - 0.5 && B[1] < A[3] - 0.5) out.push(`hero overlap ${hb[i].nm} / ${hb[j].nm}`); }
    // the right thumb arc must stay on the right half and in the lower 60 %; the left column must not enter the joystick zone
    for (const it of hb) { const [l, t, r, b] = it.r; if (/^(jump|dodge|sprint|act)$/.test(it.nm) && (l < W * 0.5 || t < H * 0.35)) out.push(`hero ${it.nm}: too far from the right thumb (${Math.round(l)},${Math.round(t)})`);
      if (/^(exit|cam|gate)$/.test(it.nm) && b > H - 170 - S.bot) out.push(`hero ${it.nm}: inside the joystick zone`); }
    const pf = document.querySelector('.rp-perf'); if (pf) { const r = rc(pf); if (r[2] > W - sr + 0.5) out.push('perf readout outside the right safe area'); }
    if (document.querySelector('.rp-open') && vis(document.querySelector('.rp-open'))) out.push('crown still visible in hero mode');
    if (document.querySelector('.bw-ui') && getComputedStyle(document.querySelector('.bw-ui')).visibility !== 'hidden') out.push('HUD visible in hero mode');
  }
  return out;
}"""
async def main():
    fails = []; n = 0
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 844, 'height': 390})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        await pg.goto('http://127.0.0.1:8777/ui1_r3_rig.html')
        for i in range(60):
            await asyncio.sleep(0.25)
            if await pg.evaluate('!!window.__ready'): break
        for layout in (1, 2, 3):
            for (W, H) in VIEWS:
                await pg.set_viewport_size({'width': W, 'height': H}); await asyncio.sleep(0.15)
                for S in SAFES:
                    if S.get('min_h', 0) > H: continue
                    for hero in (0, 1):
                        r = await pg.evaluate(JS, [layout, hero, S, W, H]); n += 1
                        for m in r: fails.append(f'layout {layout} {W}x{H} safe(top {S["top"]}, side {S["side"]}, bot {S["bot"]}) {"hero" if hero else "home"}: {m}')
        if errs: fails.append('page errors: ' + '; '.join(errs[:2]))
        await b.close()
    for f in fails[:60]: print('FAIL', f)
    print(f'{n} scenes checked, {len(fails)} failures')
    print('UI1R3 GEOM ' + ('OK' if not fails else 'FAILED'))
    sys.exit(0 if not fails else 1)
asyncio.run(main())
