#!/usr/bin/env python3
# pf2/od_try.py <tag> <hour> — boot, print pf_overdraw() for the default camera and for a camera parked at the first vault / the keep crystal
import asyncio, json, sys, os, time
from playwright.async_api import async_playwright
sys.path.insert(0, '/home/claude/dev/pf2')
import importlib.util
spec = importlib.util.spec_from_file_location('page', '/home/claude/dev/pf2/page.py')
src = open('/home/claude/dev/pf2/page.py').read().split('async def main')[0]
exec(compile(src, 'page_head', 'exec'))
TAGX = sys.argv[1] if len(sys.argv) > 1 else 'after'; H = sys.argv[2] if len(sys.argv) > 2 else '23'
async def main():
    srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        ctx, pg, errs = await boot(b, '&h=' + H)
        await pg.evaluate("__bw.ctl._skipIntro && __bw.ctl._skipIntro()"); await asyncio.sleep(3)
        print('keys', await pg.evaluate("Object.keys(__bw)"))
        t0 = time.time()
        r = await pg.evaluate("pf_overdraw()")
        print('ms', round((time.time() - t0) * 1000))
        print(json.dumps(r)[:2500])
        v = await pg.evaluate("(() => { const w = __bw.world; const l = (w.vaults && w.vaults.list) || (w.vault && w.vault.list) || null; return l ? l.map(x => [x.id, x.x, x.y, x.z]) : Object.keys(w).filter(k => /vault|crystal|gem/i.test(k)); })()")
        print('vaults', v)
        for nm, (x, z) in (('ruby', (-36, 102)), ('emerald', (6, 105))):
            await pg.evaluate("(() => { const c = __bw.ctl; c.target.x = %s; c.target.z = %s; c.dist = 70; c.polar = 1.0; if (c.update) c.update(0.016); })()" % (x, z)); await asyncio.sleep(2)
            r = await pg.evaluate("pf_overdraw({ within: { x: %s, z: %s, r: 30 } })" % (x, z))
            print(nm, 'within 30 m:', json.dumps({k: r[k] for k in ('px', 'add', 'alpha', 'glow')}), json.dumps(r['top'][:3]))
        await b.close()
    if srv: srv.terminate()
asyncio.run(main())
