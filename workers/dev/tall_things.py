#!/usr/bin/env python3
# tall_things.py — AN1_R3 A3 job 4: the scene audit.  Lists every mesh / instance group / sprite taller than --min metres (default 4) in the home map (or in hero mode, --hero) with its name chain, the position of its base,
# its size, its material and the FILE THAT OWNS IT (found by looking for the mesh's name in client/src), and every vertical thin thing (pole, mast, column) hidden inside merged meshes (a 'pole' = a 0.5 m XZ-cell cluster
# <= 2.5 m wide that is >= 3.5 m tall).  Visible things only; skinned meshes are measured with their pose; instances one by one.
#   python3 tall_things.py [--hour 23] [--hero] [--min 4] [--near X Z R] [--out DIR] [--rpc DIR]         -> DIR/tall_<hour>[_hero].json + a table on stdout
#   --rpc DIR  : use an already booted page of an1_r3_page.py (its rpc dir) instead of booting the game (4 min).  Hero mode boots rp1_dev.html (__rpLoad / __rp.start('elina') / __rp.cam('third')).
import asyncio, json, os, sys, time, subprocess, socket, argparse, re, glob
ap = argparse.ArgumentParser(); ap.add_argument('--hour', type=float, default=14); ap.add_argument('--hero', action='store_true'); ap.add_argument('--min', type=float, default=4.0)
ap.add_argument('--near', type=float, nargs=3, default=None); ap.add_argument('--out', default='/home/claude/work/an1r3'); ap.add_argument('--port', type=int, default=8798); ap.add_argument('--qs', default=''); ap.add_argument('--rpc', default=None)
A = ap.parse_args(); os.makedirs(A.out, exist_ok=True)
D = '/home/claude/dev/'; S = '/home/claude/bot/bluebot_v2/bluewall/client/src/'
JS = open(D + 'an1_r3/tall_things.js').read().replace('ARGS', json.dumps({'min': A.min, 'near': A.near}))
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', A.port)); return True
    except Exception: return False
    finally: s.close()
async def boot_and_run():
    from playwright.async_api import async_playwright
    srv = None
    if not up(): srv = subprocess.Popen(['python3', '-m', 'http.server', str(A.port), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
            ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
            await ctx.add_init_script("(()=>{ const P=['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced','drawRangeElements']; for(const k of P){ const o=WebGL2RenderingContext.prototype[k]; WebGL2RenderingContext.prototype[k]=function(a,b,c,d,e,f){ return; }; } })();")
            pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
            await pg.goto('http://127.0.0.1:%d/%s?q=high&w=clear&h=%g&wa=0.1%s' % (A.port, 'rp1_dev.html' if A.hero else 'pf1_dev.html', A.hour, A.qs))
            for i in range(3600):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready && !!(window.__bw && __bw.lateReady)'): break
            await pg.evaluate('__bw.ctl._skipIntro && __bw.ctl._skipIntro()'); await asyncio.sleep(12)
            if A.hero:
                await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,2500)); return 1; })()" % int(time.time())); await pg.evaluate("__rp.cam('third')"); await asyncio.sleep(2)
            res = await pg.evaluate('async () => {' + JS + '\n}')
            await b.close(); return res, errs
    finally:
        if srv: srv.terminate()
def via_rpc():
    env = dict(os.environ, AN1_RPC=A.rpc, AN1_WAIT='1200')
    r = subprocess.run([D + 'an1_r3_rpc.sh', 'tall'], input=JS, capture_output=True, text=True, env=env); d = json.loads(r.stdout)
    if not d.get('ok'): raise SystemExit('rpc: ' + str(d.get('error')))
    return d['result'], d.get('pageErrors', [])
res, errs = via_rpc() if A.rpc else asyncio.run(boot_and_run())
# ---- who owns it: look for the mesh's name in the client sources (first the files that SET the name, then the files that mention it)
SRC = {os.path.basename(f): open(f, errors='replace').read() for f in glob.glob(S + '*.js')}
GENERIC = {'Mesh', 'scene', 'Group', 'Scene', 'Points', 'Sprite', 'Object3D', 'late-stage', 'RootNode', 'Armature', 'static', 'Line', 'LineSegments', 'InstancedMesh', 'SkinnedMesh'}
cache = {}
def owner(chain):
    names = [n for n in re.split(r' < ', chain)]; out = []
    for n in names:
        for part in re.split(r'[:/]', n):
            if not part or part in GENERIC or len(part) < 3 or re.match(r'^(Object|Mesh|Group)_?\d*$', part): continue
            if part in cache: r = cache[part]
            else:
                setters = [f for f, t in SRC.items() if re.search(r"""name\s*=\s*['"`]%s""" % re.escape(part), t) or re.search(r"""name\s*:\s*['"`]%s""" % re.escape(part), t)]
                mentions = [f for f, t in SRC.items() if ("'%s" % part) in t or ('"%s' % part) in t or ('`%s' % part) in t]
                r = setters or mentions[:3]; cache[part] = r
            if r: out.append('%s (%s)' % (', '.join(r[:3]), part)); break
        if out: break
    if not out and re.search(r'^(Mesh|static) < (scene)', chain): return '? (unnamed mesh in the scene root: a merged / generated mesh; look for scene.add of a Mesh without .name)'
    return out[0] if out else '? (no name to look up)'
rows = res['rows']
for r in rows: r['owner'] = owner(r['chain'])
poles = res.get('poles', [])
for p in poles: p['owner'] = owner(p['chain'])
rows.sort(key=lambda r: -r['hmax']); poles.sort(key=lambda p: -p['h'])
tag = 'tall_%g%s' % (A.hour, '_hero' if A.hero else '')
json.dump({'hour': A.hour, 'hero': A.hero, 'min': A.min, 'near': A.near, 'errors': errs, 'rows': rows, 'poles': poles}, open('%s/%s.json' % (A.out, tag), 'w'), indent=1)
print('%d things taller than %g m (hour %g%s); %d pole-like columns' % (len(rows), A.min, A.hour, ', hero mode' if A.hero else '', len(poles)))
for r in rows[:70]:
    e = r['ex']; print('%7.1f m x%-4d %-9s %-62s base (%.0f, %.1f, %.0f) %.1f x %.1f  %s  -> %s' % (r['hmax'], r['n'], r['type'], r['chain'][:62], e[0], e[1], e[2], e[3], e[5], ('add ' if r.get('add') else '') + ('tr ' if r.get('tr') else '') + (r.get('m') or ''), r['owner']))
print('--- pole-like columns (thin, tall, inside a mesh) ---')
for p in poles[:60]: print('%5.1f m  %.1f wide  at (%.0f, %.0f) y %.1f..%.1f  %-50s col %s vcol %s  -> %s' % (p['h'], p['w'], p['x'], p['z'], p['y0'], p['y1'], p['chain'][:50], p['col'], p['vcol'], p['owner']))
