#!/usr/bin/env python3
# gr1r2_daemon.py — GR1_R2 frame rig, interactive: boots the hero dev page ONCE (software GL, ~5 min), then executes command files dropped in <qdir>/in/*.json
# in name order and writes <qdir>/out/<id>.json (+ the PNG of a shot).   python3 dev/gr1r2_daemon.py <qdir> [q=medium] [w=844] [h=390] [extra-url-query]
# command:  {"id":"c1", "eval":"js"}                                             -> result of the js
#           {"id":"c2", "shot": {"name":"x", "hour":14.4, "pos":[x,z,yaw], "look":[yaw,pitch], "pre":"js", "post":"js", "wait":3}}
#           {"id":"c3", "quit": true}
# the game hour comes from a fake Date.now (gameHour() reads it every frame), so one boot covers every hour.  window.__lab(on): hide everything except sky / terrain / backdrop / water / lights (fast frames).
import asyncio, json, os, subprocess, socket, sys, time, glob
from playwright.async_api import async_playwright

D = '/home/claude/dev/'
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
DAY_MAP = [(0, 4.6), (0.06, 6.5), (0.38, 12), (0.70, 17), (0.80, 19.1), (0.86, 20.3), (1, 28.6)]

def hour_to_ms(h):
    h = h % 24
    if h < 4.6: h += 24
    for (f0, g0), (f1, g1) in zip(DAY_MAP, DAY_MAP[1:]):
        if g0 <= h <= g1:
            f = f0 + (h - g0) / (g1 - g0) * (f1 - f0)
            return int(1_700_000_000_000 // 3_600_000 * 3_600_000 + f * 3_600_000)
    raise ValueError(h)

def up(port):
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', port)); return True
    except Exception: return False
    finally: s.close()

INIT = """(() => { const real = Date.now.bind(Date); window.__dn = null; Date.now = () => (window.__dn != null ? window.__dn : real()); })();"""
HIDE = "#game *{visibility:hidden!important} #game canvas{visibility:visible!important}"
LAB = """
window.__labHid = window.__labHid || [];
window.__labKeep = (o) => /^(backdrop|sky|gr1)/i.test(o.name || '') || o.isLight || (o.userData && (o.userData.ground || o.userData.gr1keep)) || /terrain|water/i.test(o.name || '') || (o.material && o.material.uniforms && (o.material.uniforms.uFogCol || o.material.uniforms.uWaterDepth));
window.__lab = (on) => { const s = __bw.scene;
  if (on) { for (const c of s.children) { if (!window.__labKeep(c) && c.visible) { c.visible = false; window.__labHid.push(c); } } }
  else { for (const c of window.__labHid) c.visible = true; window.__labHid = []; }
  return s.children.filter((c) => c.visible).map((c) => (c.name || c.type) + ':' + c.type); };
window.__kids = () => __bw.scene.children.map((c) => (c.name || '-') + ':' + c.type + ':' + (c.visible ? 1 : 0) + ':' + (c.children ? c.children.length : 0)).join(' | ');
"""
FRAMES = "(n)=>new Promise((res)=>{let k=0;const f=()=>{ if(++k>=n) res(k); else requestAnimationFrame(f); }; requestAnimationFrame(f);})"

async def run_shot(pg, out, s):
    t1 = time.time()
    if s.get('hour') is not None: await pg.evaluate('(ms)=>{window.__dn=ms;}', hour_to_ms(s['hour']))
    if s.get('pos'): await pg.evaluate('(a)=>__rp.setPos(a[0],a[1],a[2])', s['pos'])
    if s.get('look'): await pg.evaluate('(a)=>__rp.setLook(a[0],a[1])', s['look'])
    if s.get('pre'): await pg.evaluate(s['pre'])
    await pg.evaluate('(%s)(%d)' % (FRAMES, s.get('wait', 3)))
    path = os.path.join(out, s['name'] + '.png')
    await pg.screenshot(path=path, timeout=300000)
    info = await pg.evaluate(s['post']) if s.get('post') else ''
    return {'png': path, 'sec': round(time.time() - t1, 1), 'info': info}

async def main():
    qdir = sys.argv[1]; q = sys.argv[2] if len(sys.argv) > 2 else 'medium'
    W = int(sys.argv[3]) if len(sys.argv) > 3 else 844; H = int(sys.argv[4]) if len(sys.argv) > 4 else 390
    extra = sys.argv[5] if len(sys.argv) > 5 else ''
    for d in ('in', 'out', 'png'): os.makedirs(os.path.join(qdir, d), exist_ok=True)
    port = 8781; srv = None
    if not up(port):
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(port), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
            errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
            pg.on('console', lambda m: errs.append('CON ' + m.text[:200]) if m.type == 'error' and '404' not in m.text else None)
            await pg.add_init_script(INIT)
            t0 = time.time()
            await pg.goto('http://127.0.0.1:%d/rp1_dev.html?q=%s&w=clear&wa=0.1%s' % (port, q, extra))
            for i in range(1500):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready'): break
            for i in range(700):
                if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
                await asyncio.sleep(1)
            await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,1500)); return 1; })()" % int(time.time()))
            await pg.add_style_tag(content=HIDE)
            await pg.evaluate(LAB)
            open(os.path.join(qdir, 'READY'), 'w').write('booted in %.0f s q=%s %dx%d %s\n' % (time.time() - t0, q, W, H, extra))
            print('READY after %.0f s' % (time.time() - t0), flush=True)
            while True:
                files = sorted(glob.glob(os.path.join(qdir, 'in', '*.json')))
                if not files: await asyncio.sleep(0.5); continue
                f = files[0]; cmd = json.load(open(f)); os.rename(f, f + '.done')
                res = {'id': cmd.get('id')}
                try:
                    if cmd.get('quit'): break
                    if 'eval' in cmd: res['value'] = await pg.evaluate(cmd['eval'])
                    if 'shot' in cmd: res.update(await run_shot(pg, os.path.join(qdir, 'png'), cmd['shot']))
                    if 'shots' in cmd: res['shots'] = [await run_shot(pg, os.path.join(qdir, 'png'), s) for s in cmd['shots']]
                    if 'viewport' in cmd:
                        await pg.set_viewport_size({'width': cmd['viewport'][0], 'height': cmd['viewport'][1]}); await asyncio.sleep(1); res['value'] = await pg.evaluate('[innerWidth, innerHeight, __bw.renderer.domElement.width, __bw.renderer.domElement.height]')
                except Exception as e:
                    res['error'] = str(e)[:600]
                res['errs'] = errs[-3:]
                json.dump(res, open(os.path.join(qdir, 'out', str(cmd.get('id')) + '.json.tmp'), 'w'))
                os.rename(os.path.join(qdir, 'out', str(cmd.get('id')) + '.json.tmp'), os.path.join(qdir, 'out', str(cmd.get('id')) + '.json'))
            await b.close()
    finally:
        if srv: srv.terminate()

asyncio.run(main())
