#!/usr/bin/env python3
# pf2/bench.py <tag> [nopf] — (nopf = the page WITHOUT ?pf=1, like the owner's phone: the recorder is installed by the first run) boots dev/pf2_<tag>.html headless (software GL, draw calls swallowed after boot: CPU side only), runs window.BW_bench.run({secs}) and prints the result JSON
# (its size, the "programs a→b" figure of the card).  Output: /home/claude/work/pf2/bench_<tag>.json
import asyncio, json, os, sys, time, subprocess, socket
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; TAG = sys.argv[1] if len(sys.argv) > 1 else 'after'; NOPF = 'nopf' in sys.argv[2:]; PORT = int(os.environ.get('PF2_PORT', 8797)); SECS = float(os.environ.get('PF2_BENCH_SECS', 6))
OUT = '/home/claude/work/pf2/'; os.makedirs(OUT, exist_ok=True)
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info']
INIT = open(D + 'pf2/page.py').read().split('INIT = "')[1].split('"\n')[0].replace('\\"', '"')
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
async def main():
    R = {'errors': []}; srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
            await ctx.add_init_script(INIT)
            pg = await ctx.new_page(); pg.on('pageerror', lambda e: R['errors'].append(str(e)[:200]))
            await pg.goto('http://127.0.0.1:%d/pf2_%s.html?%sq=high&w=clear&h=14&wa=0.1' % (PORT, TAG, '' if NOPF else 'pf=1&'))
            for i in range(1500):
                await asyncio.sleep(0.4)
                st = await pg.evaluate('({ready: !!window.__ready, late: !!(window.__bw && __bw.lateReady)})')
                if st['ready'] and st['late']: break
            await pg.evaluate('__bw.ctl._skipIntro && __bw.ctl._skipIntro()'); await asyncio.sleep(2)
            R['has_bench'] = await pg.evaluate('typeof window.BW_bench')
            if os.environ.get('PF2_NOBENCH'):
                R['bench'] = {}; await pg.evaluate("window.__nd.on=true")
                for _ in range(24): await pg.evaluate("window.dispatchEvent(new Event('pointermove'))"); await asyncio.sleep(0.5)
                await pg.evaluate('window.__nd.on=false'); await asyncio.sleep(0.5)
                await pg.screenshot(path=os.environ['PF2_NOBENCH'], timeout=240000); await b.close(); return
            R['bench'] = await pg.evaluate('BW_bench.run({secs:%s})' % SECS)
            R['json_bytes'] = len(json.dumps(R['bench'], separators=(',', ':')))
            R['card'] = await pg.evaluate("[...document.querySelectorAll('div')].filter(d=>/^BENCH/.test(d.textContent||'')&&d.children.length==0).map(d=>d.textContent)")
            if os.environ.get('PF2_SHOT'):
                await pg.evaluate('window.__nd.on=false'); await asyncio.sleep(0.5)
                try: await pg.screenshot(path=os.environ['PF2_SHOT'], timeout=240000)
                except Exception as e: R['errors'].append('shot ' + str(e)[:100])
            if os.environ.get('PF2_SHOT2'):
                await pg.evaluate("window.__nd.on=true"); 
                for _ in range(24): await pg.evaluate("window.dispatchEvent(new Event('pointermove'))"); await asyncio.sleep(0.5)
                await pg.evaluate("document.querySelectorAll('div').forEach(d => { if (/^BENCH/.test(d.textContent || '') && d.children.length == 0) d.style.display = 'none'; })")
                await pg.evaluate('window.__nd.on=false'); await asyncio.sleep(0.5)
                try: await pg.screenshot(path=os.environ['PF2_SHOT2'], timeout=240000)
                except Exception as e: R['errors'].append('shot2 ' + str(e)[:100])
            try: R['after'] = await pg.evaluate('({hour: +__bw.P().hour.toFixed(2), night: +__bw.P().night.toFixed(2), path: __bw.useComposer()})')
            except Exception as e: R['after'] = str(e)[:80]
            json.dump(R, open(OUT + 'bench_%s%s.json' % (TAG, '_nopf' if NOPF else ''), 'w'), indent=1); await b.close()
    finally:
        if srv: srv.terminate()
    print(json.dumps(R)[:5000])
asyncio.run(main())
