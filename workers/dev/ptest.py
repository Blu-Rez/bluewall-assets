import asyncio, sys, json, os, time
from playwright.async_api import async_playwright
# portraits of the real unit models: ptest.py OUTDIR [types]
FR = {  # type: (dist, lookY, azOff, camUp, fov)
 'spear': (8.0, 1.9, 0.55, 0.3, 30), 'sword': (8.0, 1.9, 0.55, 0.3, 30), 'guard': (8.0, 1.8, 0.55, 0.3, 30), 'archer': (8.0, 1.9, 0.55, 0.3, 30),
 'cavalry': (12.5, 2.4, 0.6, 0.5, 30), 'pegasus': (15.0, 2.4, 0.7, 0.5, 30), 'baby': (19.0, 3.0, 0.7, 0.5, 30), 'dragon': (45.0, 6.0, 0.7, 0.5, 30),
 'giant': (24.0, 4.8, 0.6, 0.5, 30), 'catapult': (17.0, 2.4, 0.7, 1.0, 30),
}
async def main():
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    types = (sys.argv[2].split(',') if len(sys.argv) > 2 else list(FR))
    S = int(os.environ.get('S', 360))
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':S,'height':S}, device_scale_factor=1)
        logs=[]; pg.on('pageerror', lambda e: logs.append('PAGEERR: '+str(e)[:400]))
        await pg.goto('http://127.0.0.1:8777/dev_dbg.html?q=low&w=clear&h=2&wa=0.1')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        print('home ready', flush=True)
        await pg.evaluate('''() => { const e = __bw.econ; e.st.army = { army: {spear:30, sword:30, guard:12, archer:30, cavalry:8, pegasus:6, baby:3, dragon:2, catapult:5, giant:3}, forge: 10, space: 300, spell: {spells:{}} }; }''')
        tgt = json.dumps({'id':'t1','name':'Portrait','levels':{'keep':14,'wall':14,'towers':14},'seed':3,'ratio':1.0,'power':4000,'loot':{'ruby':1000,'emerald':1000,'turq':1000}})
        await pg.evaluate(f'() => {{ window.__st = __bw.battle.start({tgt}); }}')
        for i in range(900):
            await asyncio.sleep(1)
            if await pg.evaluate('!!(window.__battle && !window.__battle.loading)'): break
        print('battle loaded', flush=True)
        await pg.evaluate('''() => { const b = __battle, W = __bw, T = W.THREE; b.cam.intro = 0; b.cam.free = true;
          document.querySelectorAll('.bwb').forEach(e => e.style.display = 'none');
          const keep = b.views.group; W.scene.children.forEach(o => { if (!o.isLight && o !== keep) o.visible = false; });
          W.scene.background = new T.Color(0x0c1f44); W.scene.fog = null;
          const rim = new T.DirectionalLight(0x9fd0ff, 2.2); rim.position.set(-40, 30, -50); rim.target.position.set(0, 0, 0); W.scene.add(rim); window.__rim = rim;
          window.__pt = (type, d, ly, az, up, fov) => {
            const u = b.sim.units.find(q => q.type === type); const v = b.views.views.get(u.id);
            const P = v.cat ? v.cat : v.parts[0].p; const x = P.x, y = P.y, z = P.z, yaw = (v.cat ? v.cat.yaw : v.yaw);
            const a = yaw + az; const c = W.camera; c.fov = fov; c.aspect = 1; c.updateProjectionMatrix();
            c.position.set(x + Math.sin(a) * d, y + ly + up * d * 0.12, z + Math.cos(a) * d); c.lookAt(x, y + ly, z); c.updateMatrixWorld(true);
            window.__rim.position.set(x - Math.sin(a + 1.9) * 40, y + 30, z - Math.cos(a + 1.9) * 40); window.__rim.target.position.set(x, y, z); window.__rim.target.updateMatrixWorld();
            return [x, y, z, yaw];
          };
          return 1; }''')
        for t in types:
            d, ly, az, up, fov = FR[t]
            print(t, await pg.evaluate(f'__pt("{t}",{d},{ly},{az},{up},{fov})'), flush=True)
            f0 = await pg.evaluate('__bw.frames')
            for i in range(60):
                if await pg.evaluate(f'__bw.frames >= {f0} + 4'): break
                await asyncio.sleep(1)
            await pg.screenshot(path=f'{out}/{t}.png', timeout=240000); print('shot', t, flush=True)
        print('\n'.join(logs[:10]))
        await b.close()
asyncio.run(main())
