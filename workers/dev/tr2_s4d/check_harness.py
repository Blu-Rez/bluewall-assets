import asyncio, sys, json, os
from playwright.async_api import async_playwright
# headless check of the Tripo animals + villagers on a plain ground (dev/tr2_s4d/s4d.js).  Prints "ok"/"FAIL" lines, exit 1 on any FAIL.  Server :8778 root /tmp/tr2_s4d_root
bad = 0
def ok(c, m):
    global bad; print(('ok   ' if c else 'FAIL ') + m)
    if not c: bad = 1
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 900, 'height': 500})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
        await pg.goto('http://127.0.0.1:8778/index.html')
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        e = await pg.evaluate('window.__err || null'); ok(e is None and not errs, 'harness runs without errors' + ('' if e is None else ' ' + str(e)[:160]))
        R = await pg.evaluate('window.__res')
        ok(R['ok'] and not R['err'], 'preload ok, no load errors ' + str(R['err'])[:120])
        need = ['animal_cow','animal_calf','animal_horse_white','animal_horse_brown','animal_horse_black','animal_sheep','animal_lamb','animal_pig','animal_dog','animal_wolf','birds','poultry_fish_pack','villager_man','villager_woman','villager_youngman','villager_oldman']
        ok(all(R['has'].get(k) for k in need), 'all %d files loaded' % len(need))
        TARGET = {'villager_man': 3.0, 'villager_woman': 2.8, 'villager_youngman': 3.0, 'villager_oldman': 2.9}
        for k, h in TARGET.items():
            v = R['people'].get(k)
            if not isinstance(v, dict): ok(False, k + ' missing'); continue
            ok(abs(v['rawH'] * v['k'] - h) < 0.03, '%s calibrated to %.2f m (raw %.2f × k %.3f)' % (k, h, v['rawH'], v['k']))
            ok(0.9 < v['walkSpeed'] < 1.6, '%s walking speed %.2f m/s (AN1_R2: the true planted-foot speed of the clip stretched ×1 / 0.6 — the old 1.6–2.6 counted the clip\'s own root travel, which the game then added a second time)' % (k, v['walkSpeed']))
            ok(v['feetSep'] < 1.0, '%s idle frame found (feet apart %.2f)' % (k, v['feetSep']))
            ok(set(v['clips']) >= {'Idle_Loop', 'Walk_Loop'}, k + ' has the two clips')
        for sp, bx in R['birds'].items():
            ok(isinstance(bx, list) and 0.3 < max(bx) < 8, '%s wingspan/size %s m' % (sp, bx))
        for sp, n in R['dyn'].items(): ok(isinstance(n, int) and n >= 1, '%s dyn instance meshes %s' % (sp, n))
        # the drawn frame is not empty: some pixels differ from the sky colour
        await asyncio.sleep(2); await pg.screenshot(path='/tmp/tr2_s4d_check.png')
        from PIL import Image
        im = Image.open('/tmp/tr2_s4d_check.png').convert('RGB'); px = list(im.get_flattened_data()) if hasattr(im, 'get_flattened_data') else list(im.getdata()); sky = (0x8f, 0xb0, 0xd8)
        diff = sum(1 for q in px if abs(q[0]-sky[0]) + abs(q[1]-sky[1]) + abs(q[2]-sky[2]) > 40)
        ok(diff > 0.25 * len(px), 'frame has content (%.0f %% non-sky pixels)' % (100.0 * diff / len(px)))
        c = await pg.evaluate('__renderer.info.render.calls'); t = await pg.evaluate('__renderer.info.render.triangles')
        ok(c < 80, 'draw calls for 7 animals + 3 horses + 4 villager kinds + birds + poultry: %d (tris %d)' % (c, t))
        await b.close()
asyncio.run(main()); sys.exit(bad)
