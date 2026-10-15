#!/usr/bin/env python3
"""AR1 Part B browser checks: the story characters gallery  (python3 ar1_chars.py harness|game ; SHOTS=1 saves the frames, DPR=2 sharper)
390x844 with the 56 px simulated Telegram header.  Checks: window.BW_chars is only a stub until the first open(), chars.js and the art are fetched lazily, the gallery lists 24 characters,
every touch target >= 44 px, no horizontal overflow, a character page (card, design sheet, zoom, previous / next, back), Esc closes one layer at a time, open(key) goes straight to a page."""
import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
MODE = sys.argv[1] if len(sys.argv) > 1 else 'harness'
SHOTS = os.environ.get('SHOTS') == '1'; DPR = float(os.environ.get('DPR', 1))
FR = '/home/claude/work/ar1/frames'; os.makedirs(FR, exist_ok=True)
U = '/home/claude/bot/bluebot_v2/bluewall/web/assets/units'
res = []; fails = []
def check(name, ok, info=''):
    res.append({'name': name, 'ok': bool(ok), 'info': str(info)[:300]}); print(('PASS ' if ok else 'FAIL ') + name + ((' :: ' + str(info)[:200]) if (info and not ok) else ''), flush=True)
    if not ok: fails.append(name)
OVERFLOW = """() => { const o = []; if (document.documentElement.scrollWidth > innerWidth) o.push('document ' + document.documentElement.scrollWidth); for (const s of ['.chg', '.chg .ucp-sc', '.chg-g']) { const e = document.querySelector(s); if (e && e.scrollWidth > e.clientWidth + 1) o.push(s + ' ' + e.scrollWidth + '>' + e.clientWidth); } return o; }"""
RECT = "(s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }"
async def rect(pg, s): return await pg.evaluate(RECT, s)
async def tap_el(pg, s, fx=0.5, fy=0.5):
    r = await rect(pg, s); await pg.touchscreen.tap(r[0] + r[2] * fx, r[1] + r[3] * fy)
async def double_tap(cdp, x, y):
    t = time.time(); pt = [{'x': x, 'y': y}]
    ev = lambda typ, dt, pts: cdp.send('Input.dispatchTouchEvent', {'type': typ, 'touchPoints': pts, 'timestamp': t + dt})
    await asyncio.gather(ev('touchStart', 0, pt), ev('touchEnd', 0.04, []), ev('touchStart', 0.14, pt), ev('touchEnd', 0.18, []))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=DPR, has_touch=True, is_mobile=True)
        pg = await ctx.new_page(); pg.set_default_timeout(60000)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300])); pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:200]) if m.type == 'error' and '404' not in m.text and 'GPU stall' not in m.text else None)
        reqs = []; pg.on('request', lambda r: reqs.append((time.time(), r.url)))
        t0 = time.time()
        url = 'http://127.0.0.1:8777/ar1/harness.html' if MODE == 'harness' else 'http://127.0.0.1:8777/dev_ar1.html?q=low&w=clear&h=14&wa=0.1'
        await pg.goto(url)
        for i in range(2400):
            if await pg.evaluate('!!window.__ready'): break
            await asyncio.sleep(0.5)
        if MODE == 'game':
            for i in range(900):
                if await pg.evaluate('!!__bw.lateReady'): break
                await asyncio.sleep(1)
            await pg.evaluate("() => { const c = __bw.ctl; if (c.intro) c.intro = null; }")
        print(MODE, 'ready at', round(time.time() - t0), 's', flush=True)
        await pg.evaluate("document.documentElement.style.setProperty('--tg-content-safe-area-inset-top','56px')")
        cdp = await ctx.new_cdp_session(pg); await asyncio.sleep(1)
        import re
        keys = re.findall(r"^\s*\['([a-z]+)', '", open(U + '/chars.js').read(), re.M)
        check('chars.js lists 24 characters', len(keys) == 24, len(keys))
        # ---- before the first open: only the stub, nothing fetched
        st = await pg.evaluate("() => ({ has: !!window.BW_chars, stub: !!(window.BW_chars && window.BW_chars.stub), uc: !!window.BW_unitcards })")
        check('window.BW_chars exists as a stub and BW_unitcards is published', st['has'] and st['stub'] and st['uc'], st)
        pre = [u for _, u in reqs if '/units/chars.js' in u or any(f'/units/c_{k}.webp' in u or f'/units/s_{k}.webp' in u for k in keys)]
        check('nothing of the gallery is requested before open() (no chars.js, no character art)', not pre, pre[:3])
        # ---- open the gallery
        await pg.evaluate("() => window.BW_chars.open()"); await asyncio.sleep(1.5)
        js = [u for _, u in reqs if '/units/chars.js' in u]
        check('chars.js was fetched once, by open()', len(js) == 1, js)
        check('the stub was replaced by the real API', await pg.evaluate("() => !window.BW_chars.stub && typeof window.BW_chars.close === 'function' && window.BW_chars.list().length === 24"))
        check('the gallery is open with 24 character tiles', await pg.evaluate("() => document.querySelector('.chg.on') !== null && document.querySelectorAll('.chg-t').length === 24"))
        for _ in range(120):          # (software GL: a frame, and with it the lazy requests, can take seconds)
            if any(f'/units/c_{k}.webp' in u for _, u in reqs for k in keys): break
            await asyncio.sleep(0.5)
        first = {u for _, u in reqs if any(f'/units/c_{k}.webp' in u for k in keys)}
        check('the gallery cards are fetched by open() (none before it; loading=lazy keeps them off the loader stage)', len(first) > 0, len(first))
        if SHOTS: await pg.screenshot(path=f'{FR}/chars_{MODE}_1_gallery_top.png')
        cap = await pg.evaluate("() => [...document.querySelectorAll('.chg-t')].map((t) => { const T = t.getBoundingClientRect(), p = t.querySelector('.pic').getBoundingClientRect(), n = t.querySelector('.tx b').getBoundingClientRect(), r = t.querySelector('.tx .r').getBoundingClientRect(); return { ratio: p.width / p.height, ok: n.width > 20 && n.height > 8 && n.bottom <= T.bottom + 0.5 && r.height > 8 && r.bottom <= T.bottom + 0.5 && n.top >= p.bottom - 0.5, name: t.querySelector('.tx b').textContent }; })")
        check('every tile shows a 2:3 card with its name and role line under it', len(cap) == 24 and all(abs(c['ratio'] - 2 / 3) < 0.02 and c['ok'] for c in cap), [c for c in cap if not (abs(c['ratio'] - 2 / 3) < 0.02 and c['ok'])][:3])
        small = await pg.evaluate("() => [...document.querySelectorAll('.chg-t, .chg .ucp-back')].filter((e) => { const r = e.getBoundingClientRect(); return r.width < 43.5 || r.height < 43.5; }).length")
        check('gallery: every touch target >= 44 px', small == 0, small)
        bk = await rect(pg, '.chg .ucp-back'); check('gallery: back button >= 44 px and under the 56 px Telegram header', bk[2] >= 43.5 and bk[3] >= 43.5 and bk[1] >= 56, bk)
        ov = await pg.evaluate(OVERFLOW); check('gallery: no horizontal overflow', not ov, ov)
        for _ in range(14):           # scroll down like a thumb does: loading=lazy fetches the cards as they come near the screen
            await pg.evaluate("() => { const e = document.querySelector('.chg .ucp-sc'); e.scrollBy(0, 450); }"); await asyncio.sleep(0.6)
            try: await pg.wait_for_function("() => [...document.querySelectorAll('.chg-t img')].filter((i) => { const r = i.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }).every((i) => i.complete && i.naturalWidth > 0)", timeout=30000)
            except Exception: pass
        await pg.evaluate("() => document.querySelector('.chg .ucp-sc').scrollTo(0, 99999)"); await asyncio.sleep(1.5)
        try: await pg.wait_for_function("() => [...document.querySelectorAll('.chg-t img')].filter((i) => { const r = i.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }).every((i) => i.complete && i.naturalWidth > 0)", timeout=30000)
        except Exception: pass
        if SHOTS: await pg.screenshot(path=f'{FR}/chars_{MODE}_2_gallery_bottom.png', timeout=240000)
        await asyncio.sleep(1.5)
        im = await pg.evaluate("() => [...document.querySelectorAll('.chg-t img')].map((i) => [i.complete && i.naturalWidth, i.naturalHeight])")
        check('scrolling loads every card (384x576)', len(im) == 24 and all(x[0] == 384 and x[1] == 576 for x in im), [x for x in im if x != [384, 576]][:4])
        await pg.evaluate("() => document.querySelector('.chg .ucp-sc').scrollTo(0, 0)"); await asyncio.sleep(0.5)
        # ---- one character page (Aram: tile 7)
        await pg.evaluate("() => document.querySelector('.chg-t[data-k=aram]').scrollIntoView({ block: 'center' })"); await asyncio.sleep(0.6)
        await tap_el(pg, '.chg-t[data-k=aram]'); await asyncio.sleep(1.6)
        pgd = await pg.evaluate("() => { const e = document.querySelectorAll('.ucp.on'); const P = e[e.length - 1]; return { n: e.length, title: P.querySelector('.ucp-tt b').textContent, sub: P.querySelector('.ucp-tt span').textContent, card: (P.querySelector('.ucp-card img') || {}).src || '', sheet: (P.querySelector('.ucp-sheet') || {}).src || '' }; }")
        check("tapping a tile opens that character's page above the gallery", pgd['n'] == 2 and pgd['title'].lower() == 'aram' and 'c_aram.webp' in pgd['card'], pgd)
        for _ in range(120):          # (the lazy <img> is requested when the page is laid out: software GL draws a frame every few seconds)
            if any('s_aram.webp' in u for _, u in reqs): break
            await asyncio.sleep(0.5)
        check('the design sheet is s_aram.webp and loads on the page (lazy)', pgd['sheet'].endswith('s_aram.webp') and any('s_aram.webp' in u for _, u in reqs))
        try: await pg.wait_for_function("() => { const i = [...document.querySelectorAll('.ucp.on')].pop().querySelector('.ucp-sheet'); return i && i.complete && i.naturalWidth > 0; }", timeout=60000)   # (software GL: the lazy sheet can take a while)
        except Exception: pass
        shape = await pg.evaluate("() => { const i = [...document.querySelectorAll('.ucp.on')].pop().querySelector('.ucp-sheet'); return [i.naturalWidth, i.naturalHeight, i.getAttribute('loading')]; }")
        check('the sheet is 1024x1536 and lazy', shape[0] == 1024 and shape[1] == 1536 and shape[2] == 'lazy', shape)
        pr = await pg.evaluate("() => { const r = [...document.querySelectorAll('.ucp.on')].pop().querySelector('.ucp-back').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }")
        if SHOTS: await pg.screenshot(path=f'{FR}/chars_{MODE}_3_character_top.png')
        check('page: back button >= 44 px and under the 56 px header', pr and pr[2] >= 43.5 and pr[3] >= 43.5 and pr[1] >= 56, pr)
        ov = await pg.evaluate("() => { const P = [...document.querySelectorAll('.ucp.on')].pop(); const sc = P.querySelector('.ucp-sc'); return [document.documentElement.scrollWidth - innerWidth, sc.scrollWidth - sc.clientWidth]; }")
        check('page: no horizontal overflow', ov[0] <= 0 and ov[1] <= 1, ov)
        # sheet + zoom
        await pg.evaluate("() => { const P = [...document.querySelectorAll('.ucp.on')].pop(); P.querySelector('.ucp-sheetb').scrollIntoView({ block: 'center' }); }"); await asyncio.sleep(1.2)
        if SHOTS: await pg.screenshot(path=f'{FR}/chars_{MODE}_3b_character_sheet.png')
        zb = await pg.evaluate("() => { const P = [...document.querySelectorAll('.ucp.on')].pop(); const r = P.querySelector('.ucp-sheetb').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }")
        await pg.touchscreen.tap(zb[0], zb[1]); await asyncio.sleep(1.0)
        z = await pg.evaluate("() => { const P = [...document.querySelectorAll('.ucp.on')].pop(); const m = P.querySelector('.ucp-zm'); const i = P.querySelector('.ucp-zs img'); return { on: m.classList.contains('on'), tf: i.style.transform, src: i.src.split('/').pop() }; }")
        check('tapping the sheet opens the zoom viewer on s_aram.webp', z['on'] and z['src'] == 's_aram.webp', z)
        sc = lambda tf: float(tf.split('scale(')[1].rstrip(')')) if 'scale(' in tf else 0
        fit = sc(z['tf']) or 0.38
        zr = await pg.evaluate("() => { const P = [...document.querySelectorAll('.ucp.on')].pop(); const r = P.querySelector('.ucp-zs').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }")
        cx, cy = zr[0] + zr[2] / 2, zr[1] + zr[3] * 0.32
        await double_tap(cdp, cx, cy); await asyncio.sleep(0.9)
        z2 = await pg.evaluate("() => [...document.querySelectorAll('.ucp.on')].pop().querySelector('.ucp-zs img').style.transform")
        check('double-tap zooms in about 2.6x', abs(sc(z2) / fit - 2.6) < 0.2, f'{sc(z2) / fit:.2f}')
        if SHOTS: await pg.screenshot(path=f'{FR}/chars_{MODE}_4_character_zoomed.png')
        await pg.evaluate("() => { const P = [...document.querySelectorAll('.ucp.on')].pop(); P.querySelector('[data-uc=zclose]').click(); }"); await asyncio.sleep(0.6)
        # previous / next
        await pg.evaluate("() => { const P = [...document.querySelectorAll('.ucp.on')].pop(); P.querySelector('.chg-nav').scrollIntoView({ block: 'center' }); }"); await asyncio.sleep(0.6)
        nv = await pg.evaluate("() => [...[...document.querySelectorAll('.ucp.on')].pop().querySelectorAll('.chg-nav button')].map((e) => { const r = e.getBoundingClientRect(); return [r.width, r.height]; })")
        check('page: previous / next buttons >= 44 px', len(nv) == 2 and all(x[0] >= 43.5 and x[1] >= 43.5 for x in nv), nv)
        await pg.evaluate("() => { const P = [...document.querySelectorAll('.ucp.on')].pop(); const b = P.querySelectorAll('.chg-nav button')[1]; const r = b.getBoundingClientRect(); window.__nb = [r.left + r.width / 2, r.top + r.height / 2]; }")
        nb = await pg.evaluate("() => window.__nb"); await pg.touchscreen.tap(nb[0], nb[1]); await asyncio.sleep(1.4)
        t1 = await pg.evaluate("() => [...document.querySelectorAll('.ucp.on')].pop().querySelector('.ucp-tt b').textContent")
        check('Next goes to the next character (Aram -> Nila) and the page starts at the top', t1.lower() == 'nila' and await pg.evaluate("() => [...document.querySelectorAll('.ucp.on')].pop().querySelector('.ucp-sc').scrollTop") < 4, t1)
        await pg.evaluate("() => { const P = [...document.querySelectorAll('.ucp.on')].pop(); P.querySelector('.chg-nav').scrollIntoView({ block: 'center' }); }"); await asyncio.sleep(0.6)
        pv = await pg.evaluate("() => { const P = [...document.querySelectorAll('.ucp.on')].pop(); const b = P.querySelectorAll('.chg-nav button')[0]; const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }")
        await pg.touchscreen.tap(pv[0], pv[1]); await asyncio.sleep(1.2)
        t2 = await pg.evaluate("() => [...document.querySelectorAll('.ucp.on')].pop().querySelector('.ucp-tt b').textContent"); check('Previous comes back (Nila -> Aram)', t2.lower() == 'aram', t2)
        # back closes the page, the gallery stays; back again closes the gallery
        pr = await pg.evaluate("() => { const r = [...document.querySelectorAll('.ucp.on')].pop().querySelector('.ucp-back').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }")
        await pg.touchscreen.tap(pr[0], pr[1]); await asyncio.sleep(0.8)
        check('back closes the character page and leaves the gallery open', await pg.evaluate("() => document.querySelectorAll('.ucp.on').length === 1 && window.BW_chars.isOpen()"))
        await tap_el(pg, '.chg .ucp-back'); await asyncio.sleep(0.8)
        check('back closes the gallery', await pg.evaluate("() => document.querySelectorAll('.ucp.on').length === 0 && !window.BW_chars.isOpen()"))
        # open(key) straight to a page, Esc closes one layer at a time
        await pg.evaluate("() => window.BW_chars.open('giti')"); await asyncio.sleep(1.4)
        check("open(key) opens the gallery and that character's page", await pg.evaluate("() => { const e = document.querySelectorAll('.ucp.on'); return e.length === 2 && [...e].pop().querySelector('.ucp-tt b').textContent.toLowerCase() === 'giti'; }"))
        await pg.keyboard.press('Escape'); await asyncio.sleep(0.6)
        check('Esc closes only the page', await pg.evaluate("() => document.querySelectorAll('.ucp.on').length === 1"))
        await pg.keyboard.press('Escape'); await asyncio.sleep(0.6)
        check('a second Esc closes the gallery', await pg.evaluate("() => document.querySelectorAll('.ucp.on').length === 0"))
        check('open() again works (and chars.js is not fetched twice)', await pg.evaluate("() => window.BW_chars.open() === true") and len([u for _, u in reqs if '/units/chars.js' in u]) == 1)
        await pg.evaluate("() => window.BW_chars.close()")
        errs = [l for l in logs if 'PAGEERR' in l or l.startswith('error')]
        check('no page errors', not errs, errs[:3])
        print(f'{MODE}: {len(res)} checks, {len(fails)} failed'); json.dump(res, open(f'/home/claude/work/ar1/chars_{MODE}.json', 'w'), indent=1)
        await b.close()
    sys.exit(1 if fails else 0)
asyncio.run(main())
