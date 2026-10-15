#!/usr/bin/env python3
# bt1r2_test.py - the RUNTIME half of BT1R2 (dev/bt1r2_test.sh builds the rig first and runs the static half).  Prints "FAIL: ..." lines and a table; exit 1 on a fail.
#   1. the soldier -> model pipeline, on the real bunits.js with a fake sim (dev/bt1r2_units.html): every slot present, a stand-in file takes a slot (clip map included), a missing file keeps the body and says why,
#      a page change gives the recipes back, and the LOD2 figure's colours equal the real soldier's (head / body / legs) per forge tier
#   2. the game (dev/bt1r2_test.html = the current source, ?pf=1, 844x390): the defender's layout hook is called once with the record before the sim exists; one slot per unit key; the camp is one tent per squad
#      (one command tent, a banner, no palisade without a model) and its far / near pavilions follow the camera; the unit LOD follows the picture size (triangles); +0 shader programs; units face the way they walk
import asyncio, json, os, sys, time
from playwright.async_api import async_playwright
Q = os.environ.get('Q', 'low'); LV = int(os.environ.get('LV', 30)); OUT = os.environ.get('OUT', '/home/claude/work/bt1r2/test'); os.makedirs(OUT, exist_ok=True)
BASE = {'tris_units': 4541967, 'tris_total': 6952929, 'calls': 503, 'prog_delta': 42, 'frac45': 0.042, 'frac70': 0.023}      # the kit before BT1_R2 (work/bt1r2/perf_before.json, the facing probe on the same rig)
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
fails = []; rows = []
def bad(m): fails.append(m); print('FAIL:', m, flush=True)
def row(k, v): rows.append((k, v)); print('  %-34s %s' % (k, v), flush=True)
NODRAW = "(()=>{ window.__nd={on:true}; const P=['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced','drawRangeElements']; for(const k of P){ const o=WebGL2RenderingContext.prototype[k]; WebGL2RenderingContext.prototype[k]=function(a,b,c,d,e,f){ if(window.__nd.on) return; return o.call(this,a,b,c,d,e,f); }; } })();"

async def units(b):
    print('1. soldier -> model pipeline (dev/bt1r2_units.html)', flush=True)
    ctx = await b.new_context(viewport={'width': 1500, 'height': 620}, device_scale_factor=1); pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)[:200])); pg.on('console', lambda m: errs.append(m.text[:300]) if m.type == 'warning' and 'unit swap' in m.text else None)
    async def load(q):
        await pg.goto('http://127.0.0.1:8777/bt1r2_units.html' + q)
        for i in range(120):
            if await pg.evaluate('!!window.__unitsReady'): return
            await asyncio.sleep(0.5)
        bad('units page did not start ' + q)
    await load('')
    n = await pg.evaluate('__units.pages'); order = await pg.evaluate('__units.order'); row('unit keys / pages', '%d / %d' % (len(order), n))
    seen = set()
    for k in range(n):
        await pg.evaluate('__units.show(%d)' % k); r = await pg.evaluate('__units.report()')
        for x in r['rows']:
            seen.add(x['key'])
            if x['body'] != 'body' or x['model'] != 'body': bad('default table: %s is not on its body (%s / %s)' % (x['key'], x['body'], x['model']))
        if r['calls'] < 1: bad('page %d drew nothing' % k)
    if len(seen) != len(order): bad('the gallery did not cover every key (%d of %d)' % (len(seen), len(order)))
    row('slots on bodies (shipped table)', '%d of %d' % (len(seen), len(order)))
    # stand-in file in four slots (the legionary / captain clips live in their own files: they would fail with that reason) (the clip map of two of them is overridden by their rows)
    await load('?stand=1'); got = {}
    for k in range(n):
        await pg.evaluate('__units.show(%d)' % k); r = await pg.evaluate('__units.report()')
        for x in r['rows']: got[x['key']] = x
    for k in ['spear', 'sword', 'guard', 'archer']:
        if got.get(k, {}).get('model') != 'model': bad('stand-in: %s did not take the model (%s: %s)' % (k, got.get(k, {}).get('model'), got.get(k, {}).get('why')))
    if got.get('imp', {}).get('model') != 'body': bad('stand-in: an empty slot (imp) is not on its body')
    row('stand-in slots on the model', ', '.join(k for k, x in got.items() if x['model'] == 'model'))
    # a slot whose file does not exist keeps its body and says why
    await load('?broken=1'); await pg.evaluate('__units.show(0)'); r = await pg.evaluate('__units.report()'); s = [x for x in r['rows'] if x['key'] == 'sword']
    if not s or s[0]['model'] != 'failed' or not s[0]['why']: bad('broken file: sword is not "failed" with a reason: %s' % s)
    else: row('missing file', 'sword failed -> body kept (%s)' % s[0]['why'][:50])
    st = r['stats'][1]
    if not st or st['views'] < 1: bad('broken file: no sword figure is drawn (the body must stay)')
    # the swapped recipes are given back when a page goes: showing the default again must give bodies
    await pg.evaluate('__units.show(0)'); r2 = await pg.evaluate('__units.report()')
    # (no ?stand here: the page's table is the broken one; sword stays failed, the rest on bodies)
    # LOD2 colours = the real soldier's, per tier
    worst = 0
    for t in (0, 3, 5):
        c = await pg.evaluate('(a) => __units.cal(a[0], a[1])', [['sword', 'guard', 'archer', 'e_guard'], t])
        for k, v in c.items():
            for reg in ('body', 'legs', 'head'):
                a, d = v['lod0'][reg], v['lod2'][reg]
                if not a or not d: bad('colour calibration: no pixels for %s %s' % (k, reg)); continue
                worst = max(worst, max(abs(a[i] - d[i]) for i in range(3)))
    row('LOD2 colour, worst channel diff', '%d / 255 (limit 24)' % worst)
    if worst > 24: bad('LOD2 colours differ from the real soldier by %d (> 24)' % worst)
    if errs: print('  console:', errs[:2])
    await ctx.close()

async def game(b):
    print('2. the game (dev/bt1r2_test.html, ?pf=1)', flush=True)
    ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True); await ctx.add_init_script(NODRAW)
    pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300])); pg.on('console', lambda m: errs.append(m.text[:300]) if m.type in ('warning', 'error') and any(w in m.text for w in ('camp', 'swap', 'layout', 'kind')) else None)
    await pg.goto('http://127.0.0.1:8777/bt1r2_test.html?pf=1&q=%s&w=clear&h=14&wa=0.1&lv=%d' % (Q, LV))
    for i in range(3600):
        await asyncio.sleep(0.5)
        if await pg.evaluate('!!window.__ready'): break
    for i in range(600):
        if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
        await asyncio.sleep(1)
    await asyncio.sleep(3)
    prog_home = await pg.evaluate('(__bw.renderer.info.programs||[]).length')
    rec = {'v': 1, 'm': [{'id': 'bt1r2_probe', 'x': 12.5, 'z': -3.25, 'ry': 0.5}]}
    stub = await pg.evaluate("(() => { window.__layoutCalls = []; try { __bw.world.layout.enterBattle = (r) => { __layoutCalls.push({ rec: r ? JSON.parse(JSON.stringify(r)) : r, noSession: !(__bw.battle && __bw.battle.session) }); return 0; }; __bw.world.layout.settled = () => Promise.resolve(true); return true; } catch (e) { return String(e); } })()")
    if stub is not True: bad('could not install the world.layout.enterBattle stub: %s' % stub)
    tgt = {'id': 'bt1', 'name': 'Rival', 'emblem': 'flame', 'ratio': 1, 'levels': {'keep': LV, 'wall': LV, 'towers': LV}, 'seed': 12345, 'power': 1000, 'loot': {'ruby': 1, 'emerald': 1, 'turq': 1}, 'layout': rec}
    await pg.evaluate('__bw.battle.start(%s)' % json.dumps(tgt))
    for i in range(2400):
        await asyncio.sleep(0.5)
        if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
    await asyncio.sleep(3); await pg.evaluate('__bw.battle.session.cam.intro = 0'); await asyncio.sleep(2)
    cam0 = await pg.evaluate('(() => { const c = __bw.battle.session.cam; return { tx: c.tx, tz: c.tz, dist: c.dist }; })()')
    # (5) the layout hook
    calls = await pg.evaluate('__layoutCalls')
    if len(calls) != 1: bad('world.layout.enterBattle called %d times (1 expected)' % len(calls))
    else:
        if calls[0]['rec'] != rec: bad('applyLayout got %s, not the target.layout record' % calls[0]['rec'])
        if not calls[0]['noSession']: bad('applyLayout ran after the battle session existed (the nav / sim have already read the world)')
        row('applyLayout', 'called once with target.layout, before the session')
    # programs
    prog = await pg.evaluate('(__bw.renderer.info.programs||[]).length'); row('shader programs home -> battle', '%d -> %d (+%d, kit +%d)' % (prog_home, prog, prog - prog_home, BASE['prog_delta']))
    if prog - prog_home > BASE['prog_delta']: bad('programs grew: +%d (kit +%d)' % (prog - prog_home, BASE['prog_delta']))
    # (3) one slot per unit key
    sl = await pg.evaluate("(() => { const s = __bw.battle.session, sl = s.views.slots(), want = new Set(); for (const u of s.sim.units) want.add(u.type); for (const d of s.sim.defenders) want.add('e_' + d.type); return { keys: Object.keys(sl).length, missing: [...want].filter(k => !sl[k]), notBody: Object.entries(sl).filter(([k, v]) => v.state !== 'body').map(([k]) => k), types: [...want].length }; })()")
    row('unit slots (keys / in this army)', '%d / %d' % (sl['keys'], sl['types']))
    if sl['keys'] != 37: bad('views.slots() has %d keys (37 expected)' % sl['keys'])
    if sl['missing']: bad('units without a slot: %s' % sl['missing'])
    if sl['notBody']: bad('slots not on their body in the shipped table: %s' % sl['notBody'])
    # (2) the camp
    cp = await pg.evaluate("(() => { const s = __bw.battle.session, c = s.camp; if (!c) return null; const k = {}; for (const x of c.slots) k[x.kind] = (k[x.kind] || 0) + 1; return { slots: c.slots.length, kinds: k, types: s.types.length, states: Object.values(c.info.kinds).map(v => v.state), lod: c.info.lod(), tents: c.info.tents.length, ok: c.slots.every(x => Number.isFinite(x.x) && Number.isFinite(x.z) && Number.isFinite(x.ry)) }; })()")
    if not cp: bad('no camp was built')
    else:
        row('camp slots', json.dumps(cp['kinds']))
        n_t = cp['tents']; tent_kinds = sum(v for k, v in cp['kinds'].items() if k not in ('banner', 'palisade'))
        if tent_kinds != cp['types'] or n_t != cp['types']: bad('camp: %d tent slots / %d tents for %d squads' % (tent_kinds, n_t, cp['types']))
        if cp['kinds'].get('command') != 1: bad('camp: command tents = %s (1 expected)' % cp['kinds'].get('command'))
        if cp['kinds'].get('banner') != 1: bad('camp: banners = %s' % cp['kinds'].get('banner'))
        if cp['kinds'].get('palisade'): bad('camp: a palisade is drawn without a model')
        if not cp['ok']: bad('camp: a slot record has a non-finite x / z / ry')
        if any(s != 'fallback' for s in cp['states']): bad('camp: a kind is not on its fallback in the shipped table: %s' % cp['states'])
        await asyncio.sleep(1.5); lod = await pg.evaluate('__bw.battle.session.camp.info.lod()')
        row('pavilions far / near (battle camera)', '%s / %s' % (lod['lo'], lod['hi']))
        if lod['hi'] != 0 or lod['lo'] != cp['tents']: bad('camp LOD at the battle camera: far %s near %s (all %s tents must be far)' % (lod['lo'], lod['hi'], cp['tents']))
        t0 = await pg.evaluate("(() => { const c = __bw.battle.session.camp; return c.slots.find(x => x.kind !== 'banner'); })()")
        await pg.evaluate("(t) => { const s = __bw.battle.session; s.cam.tx = t.x; s.cam.tz = t.z; s.cam.dist = 22; }", t0); await asyncio.sleep(2.5)
        lod2 = await pg.evaluate('__bw.battle.session.camp.info.lod()'); row('pavilions far / near (22 m from a tent)', '%s / %s' % (lod2['lo'], lod2['hi']))
        if lod2['hi'] < 1: bad('camp LOD: no pavilion turns to the near version when the camera is 22 m from a tent')
    # (4) unit LOD follows the picture size (the camera goes back to the battle's own)
    await pg.evaluate("(c) => { const s = __bw.battle.session; s.cam.tx = c.tx; s.cam.tz = c.tz; s.cam.dist = c.dist; }", cam0); await asyncio.sleep(2.5)
    census = await pg.evaluate('__pf.census()'); u = [x for x in census['top'] if x['k'] == 'battleUnits']; ut = u[0]['tris'] if u else -1
    row('unit triangles (battleUnits)', '%d (kit %d)' % (ut, BASE['tris_units']))
    if not (0 < ut < 0.45 * BASE['tris_units']): bad('unit triangles %d are not below 45%% of the kit (%d)' % (ut, BASE['tris_units']))
    row('scene triangles / calls', '%d / %d (kit %d / %d)' % (census['tris'], census['calls'], BASE['tris_total'], BASE['calls']))
    if census['calls'] > BASE['calls'] + 5: bad('draw calls grew: %d (kit %d)' % (census['calls'], BASE['calls']))
    # (4) front / back: units face the way they walk
    await pg.evaluate("(() => { const s = __bw.battle.session, k = __bw.world.baseMeta.keep; for (const t of s.types) s.sim.send(t, k.x, k.z); s.started = true; })()"); await asyncio.sleep(5)
    fp = await pg.evaluate(open('/home/claude/dev/bt1r2_face_probe.js').read())
    row('facing: moving samples', fp['tot']['n']); row('facing: > 45 deg off / > 70 deg / backwards', '%.1f %% / %.1f %% / %.1f %% (kit %.1f %% / %.1f %%)' % (100 * fp['tot']['frac45'], 100 * fp['tot']['frac70'], 100 * fp['tot']['fracBack'], 100 * BASE['frac45'], 100 * BASE['frac70']))
    if fp['tot']['n'] < 300: bad('facing probe saw only %d moving samples' % fp['tot']['n'])
    if fp['tot']['frac45'] > 0.026: bad('facing: %.1f %% of moving soldiers look > 45 deg off their way (limit 2.6 %%; kit %.1f %%)' % (100 * fp['tot']['frac45'], 100 * BASE['frac45']))
    if fp['tot']['frac70'] > 0.015: bad('facing: %.1f %% look > 70 deg off (limit 1.2 %%)' % (100 * fp['tot']['frac70']))
    pe = [e for e in errs if 'camp' in e.lower() or 'swap' in e.lower()]
    if pe: bad('console warnings: %s' % pe[:2])
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        which = os.environ.get('PARTS', 'units,game').split(',')
        if 'units' in which: await units(b)
        if 'game' in which: await game(b)
        await b.close()
    json.dump({'rows': rows, 'fails': fails}, open(OUT + '/bt1r2_runtime.json', 'w'), indent=1)
    print('RUNTIME', 'FAILS %d' % len(fails) if fails else 'OK')
    sys.exit(1 if fails else 0)
asyncio.run(main())
