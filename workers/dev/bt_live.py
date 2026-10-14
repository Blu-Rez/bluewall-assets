import asyncio, sys, os, json
from playwright.async_api import async_playwright
# bt_live.py : the REAL game, REAL mouse events on the ring handles: K1 (a soldier squad takes one order, a hero any number) + K2 (one ring / one power button per hero type)
JS_INFO = """() => { const B = __bw, s = B.battle.session, T = B.THREE; const c = B.camera; const r = {}; const W = innerWidth, H = innerHeight;
  for (const t of s.types) { const i = s.rings.info(t); if (!i) continue; const v = new T.Vector3(i.cx, B.world.fastHeight(i.cx, i.cz) + 0.4, i.cz).project(c); r[t] = { x: Math.round((v.x * 0.5 + 0.5) * W), y: Math.round((-v.y * 0.5 + 0.5) * H), canSend: s.sim.canSend(t), alive: s.sim.alive(t) }; }
  return r; }"""
async def main():
    W = int(os.environ.get('W', 450)); H = int(os.environ.get('H', 900))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.text[:300]) if m.type == 'error' and '404' not in m.text else None)
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv=30')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        await pg.evaluate("document.querySelector('.bwa-btn').click()")
        for i in range(1200):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        for i in range(900):
            if await pg.evaluate('__bw.battle.session.cam.intro <= 0.01'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        print('types', await pg.evaluate('JSON.stringify(__bw.battle.session.types)'), flush=True)
        await pg.evaluate("() => { const s = __bw.battle.session; window.__sends = []; const o = s.sim.send; s.sim.send = function (t, x, z) { const r = o.apply(this, arguments); window.__sends.push(t); return r; }; }")
        async def info(): return json.loads(await pg.evaluate('JSON.stringify((' + JS_INFO + ')())'))
        GEST = """(a) => { const [t, dx, dy] = a; const B = __bw, s = B.battle.session, pad = s.hud.pad, T = B.THREE, c = B.camera; const i = s.rings.info(t);
          const v = new T.Vector3(i.cx, B.world.fastHeight(i.cx, i.cz) + 0.4, i.cz).project(c), r = pad.getBoundingClientRect(), x = r.left + (v.x * 0.5 + 0.5) * r.width, y = r.top + (-v.y * 0.5 + 0.5) * r.height;
          const ev = (type, px, py) => pad.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: 'touch', isPrimary: true, bubbles: true, cancelable: true, clientX: px, clientY: py, buttons: type === 'pointerup' ? 0 : 1 }));
          const n0 = window.__sends.length; ev('pointerdown', x, y); for (let k = 1; k <= 8; k++) ev('pointermove', x + dx * k / 8, y + dy * k / 8); ev('pointerup', x + dx, y + dy);
          return { at: [Math.round(x), Math.round(y)], onScreen: x > 0 && x < r.width && y > 0 && y < r.height, sent: window.__sends.slice(n0) }; }"""
        async def focus(t):
            await pg.evaluate("(t) => { const s = __bw.battle.session, i = s.rings.info(t); s.cam.tx = i.cx; s.cam.tz = i.cz; }", t)
            for k in range(240):
                await asyncio.sleep(1.0)
                i = (await info()).get(t)
                if i and 40 < i['x'] < W - 40 and 120 < i['y'] < H - 160: return i
            return None
        async def drag(t, dx=0, dy=-150, steps=8):
            i = await focus(t)
            if not i: print('  ring of', t, 'never came on screen'); return None
            await pg.evaluate("__bw.pause(true)")                                  # (frames of a software renderer are slow: the gesture itself is dispatched in ONE task, like a quick finger)
            r = await pg.evaluate('(' + GEST + ')', [t, dx, dy]); await pg.evaluate("__bw.pause(false)")
            print('   gesture on', t, json.dumps(r), flush=True); return r
        res = {}
        types = json.loads(await pg.evaluate('JSON.stringify(__bw.battle.session.types)'))
        inf0 = await info(); print('rings', json.dumps(inf0), flush=True)
        soldier = 'spear' if 'spear' in inf0 else next(t for t in inf0 if t not in ('shieldmaiden', 'lord', 'captain', 'gryphonknight', 'darkrider'))
        hero = next((t for t in ('shieldmaiden', 'lord', 'captain') if t in inf0), None)
        n0 = len(await pg.evaluate('window.__sends'))
        await drag(soldier, 40, -150)
        s1 = await pg.evaluate('window.__sends'); can1 = (await info()).get(soldier)
        print('K1 soldier drag #1: sends', s1, 'canSend now', can1 and can1['canSend'], flush=True)
        # the ring of a sent soldier squad is still drawn (thin, dim) but is no handle: a press on it must not send again.
        i2 = await drag(soldier, -60, -120)
        s2 = await pg.evaluate('window.__sends'); print('K1 soldier drag #2 (on its ring): sends', s2, flush=True)
        res['soldier_once'] = (len(s1) - n0 == 1 and len(s2) == len(s1))
        if hero:
            h0 = len(await pg.evaluate('window.__sends'))
            await drag(hero, 30, -140); await drag(hero, -30, -140)
            h1 = await pg.evaluate('window.__sends'); print('K1 hero drags x2: sends', h1[h0:], flush=True)
            res['hero_again'] = (h1[h0:].count(hero) == 2)
        # K2: one ring and one power button per hero type
        k2 = await pg.evaluate("() => { const s = __bw.battle.session; const out = {}; for (const t of s.types) { const n = s.sim.alive(t); if (s.sim.heroes && s.sim.heroes[t]) out[t] = { alive: n, rings: s.rings.info(t) ? 1 : 0, buttons: document.querySelectorAll('.bwb-ab .a[data-ab=' + t + ']').length, badge: (document.querySelector('.bwb-ab .a[data-ab=' + t + '] b') || {}).textContent }; } return out; }")
        print('K2 heroes', json.dumps(k2), flush=True)
        res['k2_one_each'] = all(v['rings'] == 1 and v['buttons'] == 1 for v in k2.values()) if k2 else None
        await pg.screenshot(path='/home/claude/dev/s35/live_end.png', timeout=240000)
        print('RESULT', json.dumps(res)); print('\n'.join(logs[:20]))
        await b.close()
asyncio.run(main())
