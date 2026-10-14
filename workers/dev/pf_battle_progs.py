import asyncio, sys, os, json, time, collections, bisect, re, hashlib
from playwright.async_api import async_playwright
# pf_battle_progs.py — shader-program inventory BEFORE and AFTER the battle load (PERF2 / P0).
#   env: NOBLOOM=1 (skip the bloom composer + its idle compile: ~10 min less in software GL)  PAGE=dev_s35_base.html (the p39 bundle) BUNDLE=...  Q=high  LV=30  HOUR=14 (22 = night path)  EXTRA='&oldload=1'  WAITBG=1 (wait for the second render path, like the phone: 393 programs at tap)  OUT=/home/claude/work/pf_progs.json
#   prints: programs before / after, the +N by name, the +N by creator (file:function:line of the `add` that put the object into the scene) x material x flags,
#           which `#define`s tell the new programs apart, groups with the SAME source but different cacheKey, battle-load timing (relative: swiftshader), long tasks.
Q = os.environ.get('Q', 'high'); LV = os.environ.get('LV', '30'); HOUR = os.environ.get('HOUR', '14'); EXTRA = os.environ.get('EXTRA', '')
PAGE = os.environ.get('PAGE', 'dev_s35.html'); BUNDLE = os.environ.get('BUNDLE', '/home/claude/dev/app_dbg.js')
OUT = os.environ.get('OUT', f'/home/claude/work/pf_progs_{Q}_h{HOUR}.json')
SEEDJS = """(() => { const e = __bw.econ, o = e.scout, SEED = __SEED__, mul = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  e.scout = function (...a) { const r = Math.random; Math.random = mul(SEED); try { return o.apply(this, a); } finally { Math.random = r; } }; })()"""          # (the dev opponent is made with Math.random: pin it, so before / after fight the same base)
INIT = """
(() => {
  const P = WebGL2RenderingContext.prototype, src = new WeakMap(), att = new WeakMap();
  const ss = P.shaderSource; P.shaderSource = function (s, t) { src.set(s, t); return ss.call(this, s, t); };
  const as = P.attachShader; P.attachShader = function (p, s) { let a = att.get(p); if (!a) att.set(p, a = []); a.push(s); return as.call(this, p, s); };
  window.__glsrc = (p) => (att.get(p) || []).map((s) => src.get(s) || '');
  const st = window.__gls = { link: 0, n: 0, big: [] }, lp = P.linkProgram;
  st.tasks = []; let tk = null;       // programs linked per main-thread task (a setTimeout(0) marks the end of the task): the speed-independent proxy for "how long is one stall" (phone: ~105 ms per program)
  P.linkProgram = function (p) { const t = performance.now(), r = lp.call(this, p), d = performance.now() - t; st.link += d; st.n++; if (d > 40) st.big.push([Math.round(t), Math.round(d)]); if (!tk) { tk = { n: 0, t: Math.round(t) }; st.tasks.push(tk); const me = tk; setTimeout(() => { if (tk === me) tk = null; }, 0); } tk.n++; return r; };
  window.__lt = []; window.__loaf = [];
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ entryTypes: ['longtask'] }); } catch (e) {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) { const sc = (e.scripts || []).slice().sort((a, b) => b.duration - a.duration)[0]; window.__loaf.push([Math.round(e.startTime), Math.round(e.duration), sc ? String(sc.sourceFunctionName || sc.invoker || '').slice(0, 40) : '']); } }).observe({ type: 'long-animation-frame', buffered: true }); } catch (e) {}
  window.__addSt = new Map(); window.__trkOn = false; Error.stackTraceLimit = 14;
})();
"""
GLTIME = """
(() => { const P = WebGL2RenderingContext.prototype, acc = window.__glt = { on: false, by: {}, big: [] };      // PERF2: which GL call blocks the main thread (a call that waits for the GPU process: getProgramParameter, readPixels, a full command buffer ...)
  for (const k of Object.getOwnPropertyNames(P)) { const d = Object.getOwnPropertyDescriptor(P, k); if (!d || typeof d.value !== 'function' || k === 'constructor') continue; const f = d.value;
    P[k] = function (...a) { if (!acc.on) return f.apply(this, a); const t = performance.now(); try { return f.apply(this, a); } finally { const e = performance.now() - t, o = acc.by[k] || (acc.by[k] = [0, 0]); o[0]++; o[1] += e; if (e > 200 && acc.big.length < 40) acc.big.push([Math.round(t), Math.round(e), k, new Error().stack.split('\\n').slice(2, 8).map((l) => l.trim().slice(0, 70)).join(' < ')]); } }; } })();
"""
SNAP = """() => {
  const r = __bw.renderer, progs = r.info.programs || [], out = { progs: [], objs: [], mem: { ...r.info.memory }, comp: !!__bw.composer(), path: { ...__bw.pathReady } };
  const fnv = (s) => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16); };
  for (const p of progs) { const s = window.__glsrc(p.program), vs = s[0] || '', fs = s[1] || ''; const df = []; for (const m of (vs + '\\n' + fs).matchAll(/^#define ([A-Z0-9_]+)(?: (.*))?$/gm)) df.push(m[1] + (m[2] !== undefined && m[2].length < 12 ? '=' + m[2] : '')); out.progs.push({ name: p.name, ck: p.cacheKey, used: p.usedTimes, vsl: vs.length, fsl: fs.length, vh: fnv(vs), fh: fnv(fs), df: [...new Set(df)] }); }
  const par = (o) => { const a = []; for (let q = o.parent, i = 0; q && i < 3; q = q.parent, i++) if (q.name) a.push(q.name.slice(0, 18)); return a.join('<'); };
  __bw.scene.traverse((o) => {
    if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite)) return;
    const ms = Array.isArray(o.material) ? o.material : [o.material], g = o.geometry, a = g && g.attributes;
    for (const m of ms) { if (!m) continue; const pr = r.properties.get(m).currentProgram;
      out.objs.push({ u: o.uuid, nm: (o.name || '').slice(0, 24), par: par(o), ty: o.type, mt: m.type, mn: (m.name || '').slice(0, 24), mu: m.uuid.slice(0, 6), ck: pr ? pr.cacheKey : null, vis: o.visible,
        fl: (o.isInstancedMesh ? 'inst ' : '') + (o.isSkinnedMesh ? 'skin ' : '') + (o.instanceColor ? 'icol ' : '') + (a && a.color ? 'vcol ' : '') + (m.transparent ? 'tr ' : '') + (m.alphaTest > 0 ? 'at ' : '') + (m.map ? 'map ' : '') + (m.normalMap ? 'nrm ' : '') + (m.flatShading ? 'flat ' : '') + (m.fog === false ? 'nofog ' : '') + (m.vertexColors ? 'vc ' : '') + (o.morphTargetInfluences && o.morphTargetInfluences.length ? 'morph ' : ''),
        cs: !!o.castShadow, rs: !!o.receiveShadow, cd: !!o.customDepthMaterial, vtx: a && a.position ? a.position.count : 0, cnt: o.isInstancedMesh ? o.count : 1, st: window.__addSt.get(o.uuid) || '' }); }
  });
  return out;
}"""

def section_map():
    lines = open(BUNDLE, encoding='utf-8').read().split('\n'); idx = []
    for i, l in enumerate(lines):
        m = re.match(r'^\s*// ((?:src|node_modules)/\S+)$', l)
        if m: idx.append((i + 1, m.group(1)))
    return [x[0] for x in idx], [x[1] for x in idx]
def where(stack, ls, fs):
    # first frame that is in the game's own source (not three / node_modules)
    for fr in stack.split('|'):
        m = re.search(r'at (?:async )?(\S+?)? ?\(?.*wall\.js:(\d+):(\d+)', fr)
        if not m: continue
        ln = int(m.group(2)); i = bisect.bisect_right(ls, ln) - 1
        if i < 0 or 'node_modules' in fs[i]: continue
        return f"{os.path.basename(fs[i])}:{m.group(1) or '?'}:{ln - ls[i]}"
    return '?'

def analyze(A, B, extra, wall, logs, ls, fs):
    import difflib
    keysA = {p['ck'] for p in A['progs']}; new = [p for p in B['progs'] if p['ck'] not in keysA]
    print(f"\nNEW programs: {len(new)}  (before {len(A['progs'])}, after {len(B['progs'])})")
    print('by name (top 12):', dict(collections.Counter(p['name'] for p in new).most_common(12)))
    byck = collections.defaultdict(list)
    for o in B['objs']:
        if o['ck']: byck[o['ck']].append(o)
    oa = {o['u'] + o['mu']: o for o in A['objs']}
    newkeys = {p['ck'] for p in new}; attributed = {k for k in newkeys if k in byck}
    # objects that were already in the scene at the tap and whose program CHANGED (same object, other cacheKey) = the map being linked again
    chg = [(oa[o['u'] + o['mu']], o) for o in B['objs'] if (o['u'] + o['mu']) in oa and o['ck'] and oa[o['u'] + o['mu']]['ck'] and oa[o['u'] + o['mu']]['ck'] != o['ck']]
    same = sum(1 for o in B['objs'] if (o['u'] + o['mu']) in oa and oa[o['u'] + o['mu']]['ck'] == o['ck'])
    chgkeys = {o2['ck'] for o1, o2 in chg}
    print(f"\nobjects already in the scene at the tap: {same + len(chg)}   program UNCHANGED: {same}   program CHANGED: {len(chg)}   -> {len(newkeys & chgkeys)} of the {len(new)} new programs belong to them")
    cnt = collections.Counter(); ex = {}
    for o1, o2 in chg:
        a, b = o1['ck'].split(','), o2['ck'].split(','); diff = []
        for tag, i1_, i2_, j1_, j2_ in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
            if tag != 'equal': diff.append((i1_, tuple(a[i1_:i2_]), tuple(b[j1_:j2_])))
        cnt[str(diff)[:160]] += 1; ex.setdefault(str(diff)[:160], (o1['nm'], o1['mt']))
    for k, v in cnt.most_common(5): print('   %5d objects: cacheKey token(index, old, new) %s   e.g. %s' % (v, k, ex[k]))
    pa = {p['ck']: p for p in A['progs']}; pb = {p['ck']: p for p in B['progs']}; cd = collections.Counter()
    for o1, o2 in chg:
        p1, p2 = pa.get(o1['ck']), pb.get(o2['ck'])
        if p1 and p2: cd[(tuple(sorted(set(p1['df']) - set(p2['df']))), tuple(sorted(set(p2['df']) - set(p1['df']))))] += 1
    for k, v in cd.most_common(4): print('   shader #defines  removed / added:', v, k)
    # the programs of NEW objects (created by the battle) by creator x material x flags
    grp = collections.defaultdict(lambda: {'n': 0, 'cks': set(), 'mats': set(), 'cast': 0, 'ex': ''})
    for k in attributed - chgkeys:
        for o in byck[k]:
            if (o['u'] + o['mu']) in oa: continue
            g = grp[(where(o['st'], ls, fs), o['mt'], o['fl'].strip())]; g['n'] += 1; g['cks'].add(k); g['mats'].add(o['mu']); g['cast'] += o['cs']; g['ex'] = g['ex'] or (o['nm'] + '|' + o['par'])
    tot = len({k for g in grp.values() for k in g['cks']})
    print(f"\nNEW programs of NEW objects (made by the battle itself): {tot}   by creator x material x flags  (programs / objects / distinct materials / shadow casters)")
    for (w, mt, fl), g in sorted(grp.items(), key=lambda kv: -len(kv[1]['cks'])):
        print(f"  {len(g['cks']):4d} progs {g['n']:5d} obj {len(g['mats']):4d} mats {g['cast']:4d} cast  {w:40s} {mt:22s} [{fl}]  e.g. {g['ex'][:36]}")
    un = newkeys - attributed
    print(f"\nnew programs NOT used by any object's colour pass (depth / distance variants of casters, materials gone): {len(un)}  by name: {dict(collections.Counter(p['name'] for p in new if p['ck'] in un).most_common(8))}")
    sh = collections.defaultdict(list)
    for p in new: sh[(p['vh'], p['fh'])].append(p)
    dup = {k: v for k, v in sh.items() if len(v) > 1}
    print(f"new programs with IDENTICAL vertex+fragment source but another cacheKey: {sum(len(v) - 1 for v in dup.values())} extra programs in {len(dup)} groups")
    g = extra['gls']; print('\nGL linkProgram calls during the battle load:', g['n'], 'call ms %.0f' % g['link'])
    tk = [t['n'] for t in g['tasks']]
    print('PROGRAMS LINKED PER MAIN-THREAD TASK (speed independent; the phone needs ~105 ms per program):  tasks that link:', len(tk), '  most in ONE task:', max(tk) if tk else 0, '  tasks with >= 3:', sum(1 for n in tk if n >= 3), '  >= 10:', sum(1 for n in tk if n >= 10), '  histogram:', dict(sorted(collections.Counter(tk).items())))
    lt = [x[1] for x in extra['lt']]
    print('long tasks since the tap (relative, software GL): n', len(lt), ' >250 ms:', sum(1 for x in lt if x > 250), ' >1000 ms:', sum(1 for x in lt if x > 1000), ' worst:', max(lt) if lt else 0, ' first 12 (start, dur):', extra['lt'][:12])
    print('LoAF since the tap (start, dur, fn):', extra['loaf'][:10]); print('sw.stats', json.dumps({k: v for k, v in extra['sw'].items() if k != 'top'}), 'top', extra['sw'].get('top', [])[:3])
    print('battle load wall %.0fs   first battle frame: calls %s tris %s' % (wall, extra['calls'], extra['tris']))
    print('[pf] marks + errors:', logs[:60])

async def main():
    ls, fs = section_map()
    async with async_playwright() as p:
        ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']; VP = {'width': int(os.environ.get('VW', 390)), 'height': int(os.environ.get('VH', 844))}
        if os.environ.get('PROFILE'):          # a persistent browser profile keeps Chrome's GPU shader cache between runs: the home load of the next run is much faster
            b = await p.chromium.launch_persistent_context(os.environ['PROFILE'], args=ARGS, viewport=VP, device_scale_factor=1); pg = b.pages[0] if b.pages else await b.new_page()
        else:
            b = await p.chromium.launch(args=ARGS); pg = await b.new_page(viewport=VP, device_scale_factor=1)
        await pg.add_init_script(INIT)
        if os.environ.get('GLTIME'): await pg.add_init_script(GLTIME)
        if os.environ.get('NOBLOOM'): await pg.add_init_script("try { localStorage.setItem('bw_settings_v1', JSON.stringify({ bloom: false })); } catch (e) {}")      # (no composer = no second render path to wait for: the battle's new programs do not depend on it)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300])); pg.on('console', lambda m: logs.append(m.text[:200]) if ('[pf]' in m.text or 'battle warm' in m.text or m.type == 'error') else None)
        t0 = time.time()
        await pg.goto(f'http://127.0.0.1:8777/{PAGE}?q={Q}&w=clear&h={HOUR}&wa=0.1&lv={LV}{EXTRA}')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(1800):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        print('home ready after', round(time.time() - t0), 's', flush=True)
        if os.environ.get('WAITBG', '1') == '1':
            for i in range(1500):
                ok = await pg.evaluate('(() => { const c = __bw.composer(); const p = __bw.pathReady; return !c || (p.screen && p.rt); })()')
                if ok: break
                await asyncio.sleep(2)
            print('second path ready after', round(time.time() - t0), 's', flush=True)
        await asyncio.sleep(4)
        A = await pg.evaluate(SNAP)
        print('BEFORE: programs', len(A['progs']), 'mem', A['mem'], 'paths', A['path'], flush=True)
        await pg.evaluate(SEEDJS.replace('__SEED__', os.environ.get('SEED', '777')))
        await pg.evaluate("(() => { const O = __bw.THREE.Object3D.prototype, oa = O.add; O.add = function (...a) { if (window.__trkOn) { const st = new Error().stack.split('\\n').slice(2, 14).join('|'); for (const c of a) if (c && c.uuid && !window.__addSt.has(c.uuid)) window.__addSt.set(c.uuid, st); } return oa.apply(this, a); }; window.__trkOn = true; window.__gls.link = 0; window.__gls.n = 0; window.__gls.big = []; window.__gls.tasks.length = 0; window.__tclick = performance.now(); })()")
        if os.environ.get('DRAIN'):          # PERF2: stop the home loop and let the (software) GPU finish its queue first: what is left of the first long task is real main-thread work
            await pg.evaluate("__bw.pause(true)"); await asyncio.sleep(int(os.environ['DRAIN'])); print('drained for', os.environ['DRAIN'], 's', flush=True)
        w0 = time.time()
        if os.environ.get('GLTIME'): await pg.evaluate("window.__glt.on = true")
        cdp = None
        if os.environ.get('CPUPROF'):          # PERF2: a sampling CPU profile of the battle load: which JS function the long first task is spent in
            cdp = await pg.context.new_cdp_session(pg); await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {'interval': 2000}); await cdp.send('Profiler.start')
        if os.environ.get('ARMY'): await pg.evaluate("(a) => { const A = __bw.econ.st.army; A.army = a; A.guard = {}; }", json.loads(os.environ['ARMY']))          # m43: fight with a chosen army (e.g. every new unit kind)
        await pg.evaluate("document.querySelector('.bwa-btn').click()")
        for i in range(3600):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        wall = time.time() - w0
        await asyncio.sleep(3)
        await pg.evaluate('window.__trkOn = false')
        B = await pg.evaluate(SNAP)
        extra = await pg.evaluate("({ lt: window.__lt.filter((x) => x[0] >= window.__tclick), loaf: window.__loaf.filter((x) => x[0] >= window.__tclick), gls: window.__gls, tclick: window.__tclick, sw: __bw.sw.stats, lateT: __bw.lateT, calls: __bw.renderer.info.render.calls, tris: __bw.renderer.info.render.triangles })")
        print('AFTER : programs', len(B['progs']), 'mem', B['mem'], 'paths', B['path'], 'battle load wall %.0fs (swiftshader: relative only)' % wall)
        json.dump({'A': A, 'B': B, 'extra': extra, 'wall': wall}, open(OUT, 'w'))
        analyze(A, B, extra, wall, logs, ls, fs)
        if cdp:
            pr = (await cdp.send('Profiler.stop'))['profile']; nodes = {n['id']: n for n in pr['nodes']}; selfus = collections.Counter(); dt = pr.get('timeDeltas', [])
            for i, sid in enumerate(pr['samples']): selfus[sid] += dt[i] if i < len(dt) else 0
            agg = collections.Counter(); cnt = collections.Counter()
            for sid, us in selfus.items():
                cf = nodes[sid]['callFrame']; k = '%s %s:%s' % (cf['functionName'] or '(anon)', cf['url'].split('/')[-1], cf['lineNumber'] + 1); agg[k] += us
            print('\nCPU PROFILE of the battle load (self ms, top 18; software GL: relative):')
            for k, us in agg.most_common(18): print('   %8.0f  %s' % (us / 1000, k))
        if os.environ.get('GLTIME'):
            g = await pg.evaluate("(window.__glt.on = false, window.__glt)")
            print('\nGL CALL TIME during the battle load (software GL: relative) - by call, total ms:', sorted(((k, v[0], round(v[1])) for k, v in g['by'].items()), key=lambda x: -x[2])[:8])
            for x in g['big'][:14]: print('   slow call', x)
        await b.close()
if len(sys.argv) > 2 and sys.argv[1] == '--analyze':
    d = json.load(open(sys.argv[2])); ls, fs = section_map(); analyze(d['A'], d['B'], d['extra'], d['wall'], [], ls, fs)
else:
    asyncio.run(main())
