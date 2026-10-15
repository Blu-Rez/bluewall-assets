#!/usr/bin/env python3
"""AR1 browser checks.  python3 ar1_browser.py harness|game [kinds]   (SHOTS=1 saves the frames, DPR=2 for sharper ones)
harness: http://127.0.0.1:8777/ar1/harness.html (the real armyui.js on a plain page, fast).  game: http://127.0.0.1:8777/dev_ar1.html (the whole game, software GL, minutes).
Checks (390x844, 56 px simulated Telegram header): the card loads for spearman / dragon / trebuchet, every touch target >= 44 px, no horizontal overflow, the info page opens / closes,
the design sheet loads lazily and zooms (double-tap, pinch, wheel, buttons), and the OLD behaviour still works: tap trains, hold keeps adding, a queued soldier can be taken out, Rush finishes the lane, castle guardian + / -."""
import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
MODE = sys.argv[1] if len(sys.argv) > 1 else 'harness'
KINDS = [] if os.environ.get('OLD_ONLY') else (sys.argv[2] if len(sys.argv) > 2 else 'spear,dragon,trebuchet').split(',')   # OLD_ONLY=1: skip the per-soldier page / zoom checks (re-run only the rest)
D = '/home/claude/dev/ar1'; R = '/home/claude/bot/bluebot_v2/bluewall/client/src'
DEFS = json.load(open(R + '/unitdefs.json')); MAP = json.load(open(R + '/units_looks.json'))
PREP = open(D + '/prep.js').read()
FR = '/home/claude/work/ar1/frames'; os.makedirs(FR, exist_ok=True)
SHOTS = os.environ.get('SHOTS') == '1'; DPR = float(os.environ.get('DPR', 1)); LV = int(os.environ.get('LV', 30))
res = []; fails = []
def check(name, ok, info=''):
    res.append({'name': name, 'ok': bool(ok), 'info': str(info)[:300]}); print(('PASS ' if ok else 'FAIL ') + name + ((' :: ' + str(info)[:200]) if (info and not ok) else ''), flush=True)
    if not ok: fails.append(name)
AUDIT_PANEL = """() => { const out = []; const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && e.offsetParent !== null; };
  for (const e of document.querySelectorAll('.bwa.on .bwa-x, .bwa.on .bwnav, .bwa.on .bwa-em, .bwa.on .bwa-tabs button, .bwa.on .bwa-ft button, .bwa.on .bwa-c, .bwa.on .inf, .bwa.on .mi, .bwa.on .rush')) {
    if (!vis(e)) continue; const r = e.getBoundingClientRect(); out.push([e.className.toString().split(' ')[0] || e.tagName, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10]); }
  return out; }"""
AUDIT_PAGE = """() => { const out = []; const P = document.querySelector('.ucp'); if (!P) return out;
  for (const e of P.querySelectorAll('[data-uc], button, .bwa-gd button')) { const r = e.getBoundingClientRect(); if (r.width > 0 && r.height > 0 && e.closest('.ucp-zm') === null && getComputedStyle(e).visibility !== 'hidden') out.push([e.className.toString().split(' ')[0] || e.dataset.uc, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10]); }
  return out; }"""
OVERFLOW = """() => { const o = []; if (document.documentElement.scrollWidth > innerWidth) o.push('document ' + document.documentElement.scrollWidth); for (const s of ['.bwa-pan', '.bwa-body', '.ucp', '.ucp-sc']) { const e = document.querySelector(s); if (e && e.offsetParent !== null && e.scrollWidth > e.clientWidth + 1) o.push(s + ' ' + e.scrollWidth + '>' + e.clientWidth); } return o; }"""

POSE = """([id, dist, az]) => { const w = __bw.world, THREE = __bw.THREE, c = __bw.ctl, cam = __bw.camera; const pk = w.picks.filter((q) => q.id === id)[0];
  if (!pk) return null; const ctr = pk.box.getCenter(new THREE.Vector3()); c.target.set(ctr.x, 0, ctr.z); c.dist = dist; c.polar = 1.0; c.azim = az; c.intro = null;
  const W = innerWidth, H = innerHeight; cam.setViewOffset(W, H, 0, Math.round(H * 0.2), W, H); return [ctr.x, ctr.y, ctr.z]; }"""
FIND = """(want) => { const w = __bw.world, THREE = __bw.THREE, cam = __bw.camera, ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hit = new THREE.Vector3();
  const pk = w.picks.filter((q) => q.id === want)[0]; if (!pk) return { ok: false }; const bx = pk.box, ctr = bx.getCenter(new THREE.Vector3());
  const pts = [ctr, new THREE.Vector3(ctr.x, bx.max.y - 0.5, ctr.z), new THREE.Vector3(ctr.x, bx.min.y + 1.2, ctr.z), new THREE.Vector3(bx.min.x + 1, ctr.y, ctr.z), new THREE.Vector3(bx.max.x - 1, ctr.y, ctr.z)];
  cam.updateMatrixWorld(); let first = null;
  for (const p of pts) { const v = p.clone().project(cam); if (Math.abs(v.x) > 0.9 || v.y > 0.55 || v.y < -0.9) continue; const x = (v.x + 1) / 2 * innerWidth, y = (1 - v.y) / 2 * innerHeight;
    ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, cam); let best = null, bd = 1e9;
    for (const q of w.picks) if (ray.ray.intersectBox(q.box, hit)) { const d = hit.distanceTo(cam.position); if (d < bd) { bd = d; best = q.id; } }
    if (!first) first = { x, y, hit: best }; if (best === want) return { x, y, hit: best, ok: true }; }
  return first ? { ...first, ok: false } : { ok: false }; }"""
async def building_sheet(pg):
    """the barracks context sheet: its soldier chips show the card faces (harness: opened through the sheet object; game: a real tap on the real barracks)"""
    if MODE == 'harness': await pg.evaluate("() => __ar1.sheets.open('barracks')"); await asyncio.sleep(1.5); return True
    for az in (0.9, 2.4, 3.9, 5.4, 1.6, 3.1, 4.6):
        if await pg.evaluate(POSE, ['barracks', 110, az]) is None: return False
        await asyncio.sleep(2.5); f = await pg.evaluate(FIND, 'barracks')
        if f.get('ok'): await pg.evaluate("([x, y]) => __bw.ctl.onTap(x, y)", [f['x'], f['y']]); await asyncio.sleep(2.5); return True
    return False
async def double_tap(cdp, x, y):
    """two taps 0.14 s apart, sent WITHOUT waiting for each answer and with explicit event times: under software GL (the real game) every round trip takes seconds, which would stretch the gap past any double-tap window (a phone does not)"""
    t = time.time(); pt = [{'x': x, 'y': y}]
    ev = lambda typ, dt, pts: cdp.send('Input.dispatchTouchEvent', {'type': typ, 'touchPoints': pts, 'timestamp': t + dt})
    await asyncio.gather(ev('touchStart', 0, pt), ev('touchEnd', 0.04, []), ev('touchStart', 0.14, pt), ev('touchEnd', 0.18, []))
def small(rows): return [r for r in rows if r[1] < 43.5 or r[2] < 43.5]
async def center(pg, sel, fx=0.5, fy=0.5):
    return await pg.evaluate("([s, fx, fy]) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left + r.width * fx, r.top + r.height * fy]; }", [sel, fx, fy])
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=DPR, has_touch=True, is_mobile=True)
        pg = await ctx.new_page(); pg.set_default_timeout(60000)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300])); pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:200]) if m.type == 'error' and '404' not in m.text and 'GPU stall' not in m.text else None)
        reqs = []; pg.on('request', lambda r: reqs.append((time.time(), r.url)))
        t0 = time.time(); T = lambda: round(time.time() - t0)
        url = 'http://127.0.0.1:8777/ar1/harness.html?lv=%d' % LV if MODE == 'harness' else 'http://127.0.0.1:8777/dev_ar1.html?q=low&w=clear&h=14&wa=0.1'
        await pg.goto(url)
        for i in range(2400):
            if await pg.evaluate('!!window.__ready'): break
            await asyncio.sleep(0.5)
        if MODE == 'game':
            for i in range(900):
                if await pg.evaluate('!!__bw.lateReady'): break
                await asyncio.sleep(1)
            await pg.evaluate("() => { window.__ar1 = { econ: __bw.econ, army: __bw.armyUI, ui: __bw.ui }; const c = __bw.ctl; if (c.intro) c.intro = null; }")
        print(MODE, 'ready at', T(), 's', flush=True)
        await pg.evaluate("document.documentElement.style.setProperty('--tg-content-safe-area-inset-top','56px')")
        await pg.evaluate(PREP, {'defs': DEFS, 'lv': LV})
        await pg.evaluate('__ar1.army.update()')   # (the real game refreshes the home button / chip on its next server answer; the stub has none, so ask for it)
        await asyncio.sleep(1)
        # ---- nothing of the art is requested before a panel that shows it is built (lazy): count card / sheet requests so far
        pre = [u for _, u in reqs if '/units/' in u]
        check('no card / sheet request before the army panel is opened', len(pre) == 0, pre[:3])
        if SHOTS: await pg.screenshot(path=f'{FR}/{MODE}_0_home_with_army_chip.png', timeout=240000)
        if MODE == 'harness':
            chipr = await pg.evaluate("() => { const e = document.querySelector('.bwa-chip'); const r = e.getBoundingClientRect(); return [r.width, r.height]; }")
            check('home ARMY chip is >= 44 px', chipr[1] >= 43.5 and chipr[0] >= 43.5, chipr)
            cdp = await ctx.new_cdp_session(pg)
            await pg.evaluate('__ar1.army.open()'); await asyncio.sleep(1.5)
        else:
            # the real game hides the old chip (assist.js) and opens the army through the Assist button -> hub -> "Army" tile: walk that path with real taps
            cdp = await ctx.new_cdp_session(pg)
            hb = await pg.evaluate("() => { const r = document.querySelector('.bwh-btn').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }")
            check('home: the Assist button is >= 44 px', hb[2] >= 43.5 and hb[3] >= 43.5, hb)
            await pg.touchscreen.tap(hb[0] + hb[2] / 2, hb[1] + hb[3] / 2); await asyncio.sleep(2.5)
            check('home: tapping the Assist button opens the hub', await pg.evaluate("() => !!document.querySelector('.bwh.on')"))
            if SHOTS: await pg.screenshot(path=f'{FR}/{MODE}_0b_hub.png', timeout=240000)
            tl = await pg.evaluate("() => { const r = document.querySelector('.bwh-t[data-a=army]').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }")
            check('hub: the Army tile is >= 44 px', tl[2] >= 43.5 and tl[3] >= 43.5, tl)
            await pg.touchscreen.tap(tl[0] + tl[2] / 2, tl[1] + tl[3] / 2)
            for _ in range(30):
                await asyncio.sleep(0.5)
                if await pg.evaluate("() => !!document.querySelector('.bwa.on')"): break
            await asyncio.sleep(1.5)
            check('hub: tapping the Army tile opens the army panel with the new cards', await pg.evaluate("() => !!document.querySelector('.bwa.on .bwa-c.u .pic img')"))
            nv = await pg.evaluate("() => { const e = document.querySelector('.bwa.on .bwnav'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.width, r.height]; }")
            print('INFO hub back chevron (assist.js .bwnav, not an AR1 file) size:', nv, flush=True)
        post = [u for _, u in reqs if '/units/' in u]
        check('cards are requested only once the panel is open (and only c_ files, no sheets)', len(post) > 0 and all('/units/c_' in u for u in post), len(post))
        check('lazy: not every one of the 31 cards is fetched up front', len(set(post)) < 31, len(set(post)))
        for _ in range(120):          # (the panel opens with a scale(.98) -> 1 transition; software GL draws a frame every few seconds, so wait for it to finish before measuring sizes)
            if await pg.evaluate("() => { const e = document.querySelector('.bwa.on .bwa-pan'); return !!e && getComputedStyle(e).transform === 'none'; }"): break
            await asyncio.sleep(0.5)
        a0 = await pg.evaluate(AUDIT_PANEL); check('army panel (troops tab): every touch target >= 44 px', len(a0) > 5 and not small(a0), small(a0)[:6])
        ov = await pg.evaluate(OVERFLOW); check('army panel: no horizontal overflow', not ov, ov)
        await pg.click('.bwa-tabs button[data-t=spells]'); await asyncio.sleep(0.6)
        a1 = await pg.evaluate(AUDIT_PANEL); check('army panel (spells tab): every touch target >= 44 px', len(a1) > 3 and not small(a1), small(a1)[:6])
        await pg.click('.bwa-tabs button[data-t=troops]'); await asyncio.sleep(0.6)
        if os.environ.get('QUICK'):
            if SHOTS: await pg.screenshot(path=f'{FR}/{MODE}_0c_panel_after_hub.png', timeout=240000)
            errs = [l for l in logs if 'PAGEERR' in l or l.startswith('error')]; check('no page errors', not errs, errs[:3])
            print(f'{MODE} (QUICK): {len(res)} checks, {len(fails)} failed', flush=True); json.dump(res, open(f'/home/claude/work/ar1/browser_{MODE}_quick.json', 'w'), indent=1); await b.close(); sys.exit(1 if fails else 0)
        for kind in KINDS:
            d = DEFS['units'][kind]; e = MAP['kinds'][kind]; look = e['low'] if e['low'] == e['high'] or LV < e.get('at', 16) else e['high']
            tile = f'.bwa-c[data-k=u][data-id={kind}]'
            await pg.evaluate("(s) => document.querySelector(s).scrollIntoView({ block: 'center' })", tile); await asyncio.sleep(1.2)
            try: await pg.wait_for_function("(s) => { const i = document.querySelector(s + ' img'); return i && i.complete && i.naturalWidth > 0; }", arg=tile, timeout=30000)
            except Exception as ex: pass
            im = await pg.evaluate("(s) => { const i = document.querySelector(s + ' .pic img'); return i ? [i.currentSrc.split('/').pop(), i.naturalWidth, i.naturalHeight, i.getAttribute('loading'), i.getAttribute('decoding')] : null; }", tile)
            check(f'{kind}: the tile shows its card c_{look}.webp (384x576, loading=lazy decoding=async)', im and im[0] == f'c_{look}.webp' and im[1] == 384 and im[2] == 576 and im[3] == 'lazy' and im[4] == 'async', im)
            if SHOTS: await pg.screenshot(path=f'{FR}/{MODE}_{kind}_1_picker.png')
            if SHOTS:
                bx = await pg.evaluate("(s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: Math.max(0, r.left - 10), y: Math.max(0, r.top - 14), width: r.width + 20, height: r.height + 24 }; }", tile)
                await pg.screenshot(path=f'{FR}/{MODE}_{kind}_2_card.png', clip=bx)
            pre_sheets = [u for _, u in reqs if '/units/s_' in u]
            # tap the little i with a real touch
            ix, iy = await center(pg, tile + ' .inf', 0.75, 0.75)
            await pg.touchscreen.tap(ix, iy); await asyncio.sleep(1.2)
            on = await pg.evaluate("() => !!document.querySelector('.ucp.on')"); check(f'{kind}: tapping i opens the info page', on)
            if not on: continue
            await asyncio.sleep(1.5)
            info = await pg.evaluate("() => { const P = document.querySelector('.ucp'), r = P.getBoundingClientRect(), b = P.querySelector('.ucp-back').getBoundingClientRect(), t = P.querySelector('.ucp-tt b').getBoundingClientRect(); return { rect: [r.left, r.top, r.width, r.height], back: [b.left, b.top, b.width, b.height], title: P.querySelector('.ucp-tt b').textContent, titleTop: t.top, tier: P.querySelector('.ucp-rt').textContent, cardSrc: (P.querySelector('.ucp-card img') || {}).currentSrc }; }")
            check(f'{kind}: the page is full-screen', info['rect'][2] >= 389 and info['rect'][3] >= 843, info['rect'])
            check(f'{kind}: back button is >= 44 px and sits under the 56 px Telegram header', info['back'][2] >= 43.5 and info['back'][3] >= 43.5 and info['back'][1] >= 56, info['back'])
            check(f'{kind}: the page title is the soldier ({info["title"]})', info['title'] == {'spear': 'Spearman', 'dragon': 'Dragon', 'trebuchet': 'Trebuchet'}.get(kind, info['title']), info['title'])
            check(f'{kind}: hero shows its card', info['cardSrc'] and f'c_{look}.webp' in info['cardSrc'], info['cardSrc'])
            ap = await pg.evaluate(AUDIT_PAGE); check(f'{kind}: info page: every touch target >= 44 px ({len(ap)} checked)', len(ap) >= 3 and not small(ap), small(ap)[:6])
            ov = await pg.evaluate(OVERFLOW); check(f'{kind}: info page: no horizontal overflow', not ov, ov)
            if SHOTS: await pg.screenshot(path=f'{FR}/{MODE}_{kind}_3_info_top.png')
            await pg.evaluate("() => document.querySelector('.ucp-sheetb').scrollIntoView({ block: 'center' })"); await asyncio.sleep(1.5)
            try: await pg.wait_for_function("() => { const i = document.querySelector('.ucp-sheet'); return i && i.complete && i.naturalWidth > 0; }", timeout=30000)
            except Exception: pass
            sh = await pg.evaluate("() => { const i = document.querySelector('.ucp-sheet'); return [i.currentSrc.split('/').pop(), i.naturalWidth, i.naturalHeight, i.getAttribute('loading')]; }")
            check(f'{kind}: the design sheet s_{look}.webp (1024x1536, lazy) loads on the page', sh[0] == f's_{look}.webp' and sh[1] == 1024 and sh[2] == 1536 and sh[3] == 'lazy', sh)
            check(f'{kind}: the sheet was not fetched before the info page was opened', not any(f's_{look}.webp' in u for u in pre_sheets), pre_sheets[:3])
            if SHOTS: await pg.screenshot(path=f'{FR}/{MODE}_{kind}_3b_info_sheet.png')
            # ---- zoom
            await pg.touchscreen.tap(195, 400); await asyncio.sleep(0.8)
            z = await pg.evaluate("() => { const m = document.querySelector('.ucp-zm'); const i = document.querySelector('.ucp-zs img'); return { on: m.classList.contains('on'), tf: i.style.transform, src: i.src.split('/').pop() }; }")
            check(f'{kind}: tapping the sheet opens the zoom viewer', z['on'] and f's_{look}' in z['src'], z)
            sc = lambda tf: float(tf.split('scale(')[1].rstrip(')')) if 'scale(' in tf else 0
            fit = sc(z['tf']) or 0.38
            zr = await pg.evaluate("() => { const r = document.querySelector('.ucp-zs').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }")
            cx, cy = zr[0] + zr[2] / 2, zr[1] + zr[3] * 0.32
            await double_tap(cdp, cx, cy); await asyncio.sleep(0.9)
            z2 = await pg.evaluate("() => document.querySelector('.ucp-zs img').style.transform")
            check(f'{kind}: double-tap zooms in about 2.6x', abs(sc(z2) / fit - 2.6) < 0.2, f'{sc(z2) / fit:.2f}')
            if SHOTS: await pg.screenshot(path=f'{FR}/{MODE}_{kind}_4_info_zoomed.png')
            # drag to pan: one finger
            await cdp.send('Input.synthesizeScrollGesture', {'x': cx, 'y': cy, 'xDistance': -120, 'yDistance': -160, 'gestureSourceType': 'touch', 'speed': 800}); await asyncio.sleep(0.5)
            z3 = await pg.evaluate("() => document.querySelector('.ucp-zs img').style.transform"); check(f'{kind}: one finger pans the zoomed sheet', z3 != z2, (z2, z3))
            await double_tap(cdp, cx, cy); await asyncio.sleep(0.9)
            z4 = await pg.evaluate("() => document.querySelector('.ucp-zs img').style.transform"); check(f'{kind}: a second double-tap returns to the fitted sheet', abs(sc(z4) / fit - 1) < 0.05, f'{sc(z4) / fit:.2f}')
            try:
                await cdp.send('Input.synthesizePinchGesture', {'x': cx, 'y': cy, 'scaleFactor': 2.0, 'relativeSpeed': 300, 'gestureSourceType': 'touch'}); await asyncio.sleep(0.8)
                z5 = await pg.evaluate("() => document.querySelector('.ucp-zs img').style.transform"); check(f'{kind}: a two-finger pinch zooms in', sc(z5) / fit > 1.5, f'{sc(z5) / fit:.2f}')
            except Exception as ex: check(f'{kind}: a two-finger pinch zooms in', False, ex)
            await pg.mouse.move(cx, cy); await pg.mouse.wheel(0, 900); await asyncio.sleep(0.4)
            z6 = await pg.evaluate("() => document.querySelector('.ucp-zs img').style.transform"); check(f'{kind}: the wheel zooms out', sc(z6) < sc(z5) if 'z5' in dir() else True, z6)
            await pg.click('.ucp-zb[data-uc=zin]'); await asyncio.sleep(0.3); await pg.click('.ucp-zb[data-uc=zin]'); await asyncio.sleep(0.3)
            z7 = await pg.evaluate("() => document.querySelector('.ucp-zs img').style.transform"); check(f'{kind}: the + button zooms in', sc(z7) > sc(z6), (z6, z7))
            zb = await pg.evaluate("() => [...document.querySelectorAll('.ucp-zm .ucp-zb')].map((e) => { const r = e.getBoundingClientRect(); return [r.width, r.height, r.top]; })")
            check(f'{kind}: zoom viewer buttons are >= 44 px and under the header', all(x[0] >= 43.5 and x[1] >= 43.5 and x[2] >= 56 for x in zb), zb)
            await pg.click('.ucp-zb[data-uc=zclose]'); await asyncio.sleep(0.5)
            await pg.touchscreen.tap(info['back'][0] + 20, info['back'][1] + 20); await asyncio.sleep(0.6)
            check(f'{kind}: the back button closes the page', not await pg.evaluate("() => !!document.querySelector('.ucp.on')"))
        # ---- the second look is reachable from the page (spear: look 1 / look 2) and both sheets switch
        await pg.evaluate("() => __ar1.army.info('spear')"); await asyncio.sleep(1.2)
        rows = await pg.evaluate("() => [...document.querySelectorAll('.ucp-lk')].map((e) => [e.textContent.replace(/\\s+/g, ' ').trim(), e.classList.contains('on'), e.getBoundingClientRect().height])")
        check('spear page lists look 1 (Lv 1-15) and look 2 (Lv 16+), Yours now on look 2', len(rows) == 2 and rows[1][1] and 'Yours now' in rows[1][0] and 'Levels 1–15' in rows[0][0] and 'Level 16 and up' in rows[1][0] and all(r[2] >= 44 for r in rows), rows)
        await pg.evaluate("() => document.querySelectorAll('.ucp-lk')[0].scrollIntoView({block:'center'})"); await asyncio.sleep(0.4)
        x, y = await center(pg, '.ucp-lk:first-child'); await pg.touchscreen.tap(x, y); await asyncio.sleep(0.8)
        s1 = await pg.evaluate("() => document.querySelector('.ucp-sheet').getAttribute('src').split('/').pop()"); check('tapping Look 1 switches the sheet to s_spearman_1.webp', s1 == 's_spearman_1.webp', s1)
        await pg.evaluate("() => document.querySelector('.ucp-back').click()"); await asyncio.sleep(0.5)
        # ---- level rule through the real UI: a Barracks at level 10 shows look 1 on the card, level 16 look 2
        for L, want in ((10, 'spearman_1'), (15, 'spearman_1'), (16, 'spearman_2')):
            await pg.evaluate(PREP, {'defs': DEFS, 'lv': LV, 'lvs': {'barracks': L}}); await asyncio.sleep(0.8)
            if not await pg.evaluate("() => document.querySelector('.bwa.on') !== null"): await pg.evaluate('__ar1.army.open()'); await asyncio.sleep(0.8)
            await asyncio.sleep(0.8)
            src = await pg.evaluate("() => (document.querySelector('.bwa-c[data-id=spear] .pic img') || {}).currentSrc || ''"); check(f'barracks Lv {L}: the spearman card is {want}', src.endswith(f'c_{want}.webp'), src)
        await pg.evaluate(PREP, {'defs': DEFS, 'lv': LV}); await asyncio.sleep(0.8)
        # ---- the OLD behaviour
        await pg.evaluate("() => { document.querySelector('.bwa-body').scrollTop = 0; }"); await asyncio.sleep(0.5)
        x, y = await center(pg, '.bwa-c[data-id=spear]', 0.4, 0.3)
        await pg.evaluate("() => { window.__calls.length = 0; }")
        under = await pg.evaluate("([x, y]) => { const e = document.elementFromPoint(x, y); return [e && e.className.toString().slice(0, 40), !!document.querySelector('.bwa.on'), !!document.querySelector('.ucp.on'), document.querySelector('.bwa-c[data-id=spear]').className]; }", [x, y])
        await pg.touchscreen.tap(x, y)
        for _ in range(20):
            await asyncio.sleep(0.5)
            if await pg.evaluate("() => window.__calls.length"): break
        await asyncio.sleep(0.9)
        c1 = await pg.evaluate("() => window.__calls.slice()"); check('tap on a card trains one soldier (train spear x1)', c1 and c1[0][0] == 'train' and c1[0][1] == {'u': 'spear', 'n': 1}, (c1, under))
        await asyncio.sleep(1.2)
        lane = await pg.evaluate("() => { const l = document.querySelector('.bwa-lane'); return l ? [l.querySelectorAll('.mi').length, !!l.querySelector('.mi img'), (l.querySelector('.mi img') || {}).currentSrc] : null; }")
        check('the training lane shows the queued soldier with its card face', lane and lane[0] >= 1 and lane[1] and 'c_spearman' in (lane[2] or ''), lane)
        await pg.evaluate("() => { window.__calls.length = 0; }")
        mx, my = await center(pg, '.bwa-lane .mi'); await pg.touchscreen.tap(mx, my); await asyncio.sleep(0.8)
        c2 = await pg.evaluate("() => window.__calls.slice()"); check('tap on a queued soldier takes it out again (cancel)', c2 and c2[0][0] == 'cancel', c2)
        await pg.touchscreen.tap(x, y); await asyncio.sleep(1.4)
        await pg.evaluate("() => { window.__calls.length = 0; }")
        rx, ry = await center(pg, '.bwa-lane .rush'); await pg.touchscreen.tap(rx, ry); await asyncio.sleep(0.8)
        c3 = await pg.evaluate("() => window.__calls.slice()"); check('Rush finishes the lane (speedup)', c3 and c3[0][0] == 'speedup', c3)
        await pg.evaluate("() => { window.__calls.length = 0; }")
        await pg.mouse.move(x, y); await pg.mouse.down(); await asyncio.sleep(1.5); await pg.mouse.up(); await asyncio.sleep(1.3)
        c4 = await pg.evaluate("() => window.__calls.slice()"); n = sum(c[1].get('n', 0) for c in c4 if c[0] == 'train'); check('holding a card keeps adding soldiers', n >= 3, c4)
        # castle guardian + / - on a giant page
        await pg.evaluate("() => __ar1.army.info('hill')"); await asyncio.sleep(1.0)
        await pg.evaluate("() => { window.__calls.length = 0; document.querySelector('.ucp-sc').scrollTo(0, 99999); }"); await asyncio.sleep(0.5)
        gx, gy = await center(pg, '.ucp .bwa-gd button[data-g="1"]'); await pg.touchscreen.tap(gx, gy); await asyncio.sleep(0.8)
        c5 = await pg.evaluate("() => window.__calls.slice()"); check('castle guardian + on the info page still calls guard', c5 and c5[0][0] == 'guard', c5)
        await pg.evaluate("() => __ar1.army.close()"); await asyncio.sleep(0.4)
        check('closing the army panel closes the info page', not await pg.evaluate("() => !!document.querySelector('.ucp.on')"))
        # ---- the building sheet (UI1) shows the same card faces
        await pg.evaluate("() => { __ar1.army.close(); }"); await asyncio.sleep(0.5)
        opened = await building_sheet(pg)
        check('the barracks building sheet opens', opened and await pg.evaluate("() => !!document.querySelector('.bsh.on')"))
        if opened:
            await asyncio.sleep(1.5)
            chips = await pg.evaluate("() => [...document.querySelectorAll('.bsh-chip .pic img')].map((i) => [i.currentSrc.split('/').pop(), i.naturalWidth, i.getBoundingClientRect().left < innerWidth])")
            seen = [c for c in chips if c[2]]
            check('building sheet: the visible soldier chips show their card faces (c_*.webp)', len(seen) >= 3 and all(c[0].startswith('c_') and c[1] == 384 for c in seen), chips)
            if SHOTS: await pg.screenshot(path=f'{FR}/{MODE}_5_building_sheet.png')
            await pg.evaluate("() => document.querySelector('.bsh-x').click()"); await asyncio.sleep(0.5)
        # ---- fonts / errors
        check('no page errors', not [l for l in logs if l.startswith('PAGEERR')], [l for l in logs if l.startswith('PAGEERR')][:3])
        json.dump({'mode': MODE, 'results': res, 'logs': logs[-10:]}, open(f'/home/claude/work/ar1/browser_{MODE}.json', 'w'), indent=1)
        await b.close()
asyncio.run(main())
print('%s: %d checks, %d failed' % (MODE, len(res), len(fails)))
if fails: print('FAILED:', '; '.join(fails)); sys.exit(1)
