# ui1r4_toast.py <page-tag> — UI1_R4: the gift toast («+43K ruby — a gift from your games!») on the real game at 844x390, 800x360, 932x430 with Telegram's margins, home view AND hero mode:
#   lifetime: the class «on» is removed at ~2.1 s, the fade is .4 s, the TEXT is removed at ~2.5 s (nothing stays in the element);
#   position (measured in the SAME call that shows the toast): inside the screen and the side margins, in the top strip between the two Telegram buttons (bottom <= 34 % of the height), not over any visible control,
#   not in the middle of the view, and (hero mode) not over the hero (projected head-to-feet box); the pill is really there (>= 150 px wide) — a collapsed empty box would pass every geometry rule.
import asyncio, json, os, sys, time
from playwright.async_api import async_playwright
from ui1r4_common import *
PAGE = sys.argv[1]
MSG = '+43K ruby — a gift from your games!'
SHOW = """([msg]) => { const u = __bw.ui, el = u.toastEl; window.__tl = { t0: performance.now(), off: null, clr: null };
  const mo = new MutationObserver(() => { const t = performance.now() - window.__tl.t0; if (!el.classList.contains('on') && window.__tl.off == null) window.__tl.off = t; if (el.textContent === '' && window.__tl.clr == null) window.__tl.clr = t; });
  mo.observe(el, { attributes: true, childList: true, characterData: true, subtree: true }); window.__tmo = mo; u.toast(msg);
  const r = el.getBoundingClientRect(), cs = getComputedStyle(el), hits = [];
  for (const e of document.querySelectorAll('.bw-ui button, .bw-ui [data-a], .bw-ui input, .rp-b, .rp-open')) { const q = e.getBoundingClientRect(); if (q.width < 4 || q.height < 4) continue; const s = getComputedStyle(e); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0) continue;
    if (q.left < r.right && q.right > r.left && q.top < r.bottom && q.bottom > r.top) hits.push((e.className || e.tagName).toString().slice(0, 30)); }
  return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height, tr: cs.transitionDuration, text: el.textContent, hits }; }"""
HERO = """() => { if (!window.__rp || !__rp.pos) return null; const p = __rp.pos(); const pts = [[0, 0, 0], [0, 1.9, 0], [0.5, 1, 0], [-0.5, 1, 0]].map(([dx, dy, dz]) => __rp.proj(p.x + dx, p.y + dy, p.z + dz)); const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]); return { l: Math.min(...xs), r: Math.max(...xs), t: Math.min(...ys), b: Math.max(...ys) }; }"""
HOLD = """([msg, on]) => { const el = __bw.ui.toastEl; clearTimeout(__bw.ui._tt); clearTimeout(__bw.ui._tt2); if (on) { el.textContent = msg; el.classList.add('on'); } else { el.classList.remove('on'); el.textContent = ''; } }"""
async def main():
    fails = []; rows = []
    async with async_playwright() as p:
        b, pg = await get_page(p, PAGE); assert pg
        for hero in (False, True):
            if hero:
                if not await pg.evaluate("() => !!window.__rp"): await pg.evaluate("async () => { await __rpLoad(); }")
                await pg.evaluate("async () => { if (__rp.start) await __rp.start('elina'); }")
                for _ in range(240):
                    if await pg.evaluate("() => !!(__rp && __rp.pos && document.querySelector('.rp-k') && !document.querySelector('.rp-pick'))"): break
                    await asyncio.sleep(1)
                await asyncio.sleep(3)
            for (W, H) in SIZES:
                await set_size(pg, W, H, True)
                if not hero: await close_all(pg)
                hr = await pg.evaluate(HERO) if hero else None
                r = await pg.evaluate(SHOW, [MSG])
                await asyncio.sleep(2.8); tl = await pg.evaluate("() => { const el = __bw.ui.toastEl; const o = { off: window.__tl.off, clr: window.__tl.clr, on: el.classList.contains('on'), text: el.textContent }; window.__tmo.disconnect(); return o; }")
                why = []
                if r['w'] < 150 or r['h'] < 24 or r['text'] != MSG: why.append(f"the pill is not really there ({r['w']:.0f}x{r['h']:.0f}, text {r['text'][:12]!r})")
                if r['l'] < 0 or r['r'] > W or r['t'] < 0 or r['b'] > H: why.append('outside the screen')
                if r['l'] < TG['side'] - 1 or r['r'] > W - TG['side'] + 1: why.append('inside the side margins')
                if r['b'] > 0.34 * H: why.append(f"reaches y={r['b']:.0f} (> 34 % of {H})")
                cx0, cx1, cy0, cy1 = 0.3 * W, 0.7 * W, 0.3 * H, 0.85 * H
                if r['l'] < cx1 and r['r'] > cx0 and r['t'] < cy1 and r['b'] > cy0: why.append('in the middle of the view')
                if r['hits']: why.append('over a control: ' + ', '.join(r['hits'][:3]))
                if hr and r['l'] < hr['r'] and r['r'] > hr['l'] and r['t'] < hr['b'] and r['b'] > hr['t']: why.append(f'over the hero {hr}')
                if tl['off'] is None or not (2000 <= tl['off'] <= 2300): why.append(f"'on' removed at {tl['off']}")
                if tl['clr'] is None or not (2400 <= tl['clr'] <= 2650) or tl['text'] or tl['on']: why.append(f"text removed at {tl['clr']} (left: {tl['text'][:20]!r})")
                if float(r['tr'].rstrip('s')) > 0.45: why.append('fade ' + r['tr'])
                # evidence frame: the toast held on screen for the photo, then taken away again
                await pg.evaluate(HOLD, [MSG, True]); await pg.screenshot(clip={'x': 0, 'y': 0, 'width': 2, 'height': 2}); await asyncio.sleep(.6)
                await pg.screenshot(path=f"/home/claude/work/ui1r4/toast_{'hero' if hero else 'home'}_{W}x{H}.png", timeout=240000); await pg.evaluate(HOLD, [MSG, False])
                row = dict(mode='hero' if hero else 'home', size=f'{W}x{H}', rect=[round(r[k]) for k in 'ltrb'], size_px=[round(r['w']), round(r['h'])], hero=hr, off=tl['off'] and round(tl['off']), clr=tl['clr'] and round(tl['clr']), fade=r['tr'], why=why); rows.append(row)
                print(('ok   ' if not why else 'FAIL ') + f"{row['mode']:5s} {W}x{H} toast {row['rect']} ({row['size_px'][0]}x{row['size_px'][1]}) on-off {row['off']} ms, text removed {row['clr']} ms, fade {r['tr']}" + (' — hero ' + str([round(hr[k]) for k in 'ltrb']) if hr else '') + (' — ' + '; '.join(why) if why else ''), flush=True)
                if why: fails.append(row)
        await pg.evaluate("() => { try { __rp.exit && __rp.exit(); } catch (e) {} }")
    json.dump(rows, open('/home/claude/work/ui1r4/toast_results.json', 'w'), indent=0)
    print('TOAST OK' if not fails else 'TOAST FAIL'); sys.exit(1 if fails else 0)
asyncio.run(main())
