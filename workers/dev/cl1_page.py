#!/usr/bin/env python3
# cl1_page.py — CL1 (ROUND6) browser part: ONE fresh page (the real game, software GL, 844x390), the hero started, then
#   1 the collision grid has the INSTANCE layer (trees / bushes / props / rocks / hay) and the hero's door keep-clear cut its pieces (rp_clear.js)
#   2 dev/cl1_lane.js    the 3 m lane in front of every door: the quarry + the saw mill (lumber1) are free; no instance-layer solid in any door zone
#   3 dev/cl1_doors.js   (instance props in the door zones: none solid)
#   4 dev/cl1_phys.js    the hero walks INTO every type of instanced prop with the real physics: samples that really arrive without the layer must be stopped with it (through: before -> after)
# Prints «CL1 PAGE OK» or the failures.  (~8 min: the game boots in software GL; the walk-into test ~4 min)
import asyncio, json, sys, os, subprocess, socket, time
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; PORT = int(os.environ.get('CL1_PAGE_PORT', 8784))
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
fails = []; nok = 0
def ok(c, m, info=''):
    global nok
    print(('ok   ' if c else 'FAIL ') + m + ((' — ' + str(info)) if info != '' else ''), flush=True)
    if c: nok += 1
    else: fails.append(m)
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
async def ev(pg, js, to=900):
    return await asyncio.wait_for(pg.evaluate(js), to)
async def main():
    srv = None
    if not up(): srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS); pg = await b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=1, has_touch=True, is_mobile=True)
            errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
            await pg.goto('http://127.0.0.1:%d/rp1_dev.html?q=low&w=clear&h=14&wa=0.1' % PORT)
            for i in range(1800):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready'): break
            for i in range(900):
                if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
                await asyncio.sleep(1)
            r = json.loads(await ev(pg, "(async()=>{await window.__rpLoad('?v='+Date.now()); await __rp.start('elina'); await new Promise(r=>setTimeout(r,1500)); const i=__rp.grid().info(), c=__rp.clear(); return JSON.stringify({ready:i.ready, icells:i.icells, tree:i.inst&&i.inst.tree, bush:i.inst&&i.inst.bush, solid:i.inst&&i.inst.solid, cut:c?c.st.removed.length:-1, cutIds:c?[...new Set(c.st.removed.map(x=>x.id))]:[]})})()"))
            ok(r['ready'] and (r['icells'] or 0) > 20000, 'collision grid ready WITH the instance layer', r['icells'])
            ok((r['tree'] or 0) >= 1000 and (r['bush'] or 0) >= 150 and (r['solid'] or 0) >= 300, 'instance layer: trees >= 1000, bushes >= 150, solid props >= 300', '%s / %s / %s' % (r['tree'], r['bush'], r['solid']))
            ok(r['cut'] > 0 and 'ws:quarry' in r['cutIds'] and 'ws:lumber1' in r['cutIds'], 'door keep-clear cut the quarry blocks + the saw mill carts', '%s pieces at %s' % (r['cut'], r['cutIds']))
            ln = json.loads(await ev(pg, open(D + 'cl1_lane.js').read(), 300)); rows = {(x['id']): x for x in ln['rows']}
            ok(rows.get('ws:quarry', {}).get('laneS', 0) == 0 and rows.get('ws:lumber1', {}).get('laneS', 0) == 0, 'lane in front of the quarry / lumber1 doors: 0 solid cells (was 46 / 27)')
            ok(ln['laneBlockedI'] == 0 and ln['zoneI'] == 0, 'no instance-layer solid in any of the %d door lanes / zones' % ln['doors'], 'lane doors with static building cells: %d (building shells, not clutter)' % ln['laneBlockedS'])
            dr = json.loads(await ev(pg, open(D + 'cl1_doors.js').read(), 300))
            ok(dr['withInstSolid'] == 0 and dr['withDisc'] == 0, 'doors with a solid instance prop / disc in the 3 m x 4 m zone = %d / %d (of %d)' % (dr['withInstSolid'], dr['withDisc'], dr['doors']), 'doors with any (soft) instance prop in the zone: %d' % dr['withInst'])
            await ev(pg, "window.__cl1popt = { per: 14, sec: 2.6 }", 30)
            ph = json.loads(await ev(pg, open(D + 'cl1_phys.js').read(), 1200)); rs = ph['rows']
            valid = sum(x['valid'] for x in rs); bt = sum(x['beforeThrough'] for x in rs); at = sum(x['afterThrough'] for x in rs)
            ok(valid >= 150 and bt >= 0.95 * valid, 'walk-into samples that really arrive WITHOUT the layer: %d, of them through: %d' % (valid, bt))
            ok(at == 0, 'walk-into WITH the layer: through = %d of %d (every type: trees, trunks, bushes, rocks, barrels, crates, wagons, hay)' % (at, valid), [x['key'] for x in rs if x['afterThrough']])
            ok(not errs, 'no page errors', errs[:3])
            await b.close()
    finally:
        if srv: srv.terminate()
    print('CL1 PAGE OK (%d checks)' % nok if not fails else 'CL1 PAGE FAILED: %s' % fails); sys.exit(0 if not fails else 1)
asyncio.run(main())
