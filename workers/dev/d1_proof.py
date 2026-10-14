import asyncio, sys, os, json, base64
from playwright.async_api import async_playwright
# d1_proof.py TAG [new|base] [QUALITY] — D1 proof run: ONE real battle (dev_s35.html = the tree, dev_base.html = the BEFORE bundle), phone 390x844, software GL.
#   new : (1) one unit of each tier dies alone -> 5 full frames at t = 0 / 0.4 / 0.8 / 1.2 / 1.6 s (common spear, rare cavalry, epic shield maiden, legendary giant, mythic dragon)
#         (2) the whole army (every type of unitdefs.json + 4 defenders) dies at once -> per-view timeline (scale, parts left, tier index), frames, CPU ms / tick, render ms, draw calls, programs
#   base: only (2) on the old bundle (tumble / death clips), same cameras and same ages, for the "no more frame time than the old tumble run" comparison.
#   Frames: /home/claude/work/d1/<TAG>_<name>_<k>.png (full 390x844 canvas); data: /home/claude/work/d1/<TAG>_data.json.  d1_strips.py cuts the proof strips from the frames.
TAG = sys.argv[1] if len(sys.argv) > 1 else 'a'; MODE = sys.argv[2] if len(sys.argv) > 2 else 'new'; Q = sys.argv[3] if len(sys.argv) > 3 else 'low'
PAGE = 'dev_s35.html' if MODE == 'new' else 'dev_base.html'
OUT = '/home/claude/work/d1'; os.makedirs(OUT, exist_ok=True)
DEFS = json.load(open('/home/claude/bot/bluebot_v2/bluewall/client/src/unitdefs.json'))['units']
ARMY = {t: 3 for t in DEFS}; ARMY['spear'] = 30
# per tier: candidate types in order of preference (the first one that has a drawn view is used): (type, camera distance, pitch, look-at height offset)
STRIPS = [('common', [('spear', 30, 0.3, 2.4), ('sword', 30, 0.3, 2.4), ('legionary', 30, 0.3, 2.4)]),
          ('rare', [('cavalry', 38, 0.3, 3.2), ('mage', 30, 0.3, 2.4), ('captain', 30, 0.3, 2.4), ('pegasus', 45, 0.25, 0), ('dragonling', 30, 0.25, 0)]),
          ('epic', [('shieldmaiden', 30, 0.3, 2.6), ('werewolf', 40, 0.3, 3), ('lich', 32, 0.3, 3), ('gryphon', 60, 0.25, 0), ('baby', 65, 0.22, 0)]),
          ('legendary', [('giant', 80, 0.25, 7), ('ogre', 55, 0.3, 5), ('hill', 55, 0.3, 5), ('lord', 40, 0.3, 3.6), ('treant', 60, 0.3, 6)]),
          ('mythic', [('dragon', 100, 0.2, 0), ('darkrider', 50, 0.3, 3), ('dragon3', 90, 0.2, 0), ('baby3', 60, 0.2, 0)])]
AGES = [0, 0.4, 0.8, 1.2, 1.6]
MASS_AGES = [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.3, 1.45, 1.6, 2.0, 3.0]; MASS_RENDER = {0.4, 0.8, 1.2, 1.6, 2.0, 3.0}
src = open('/home/claude/dev/u3_game5.py').read(); FOCUS = src.split('FOCUS = """')[1].split('"""')[0]
PICK = "(a) => { const sim = __bw.battle.session.sim; const u = sim.units.find((u) => u.type === a[0] && u.side === 'A' && !u.dead); return u ? u.id : null; }"
KILL = """(ids) => { const s = __bw.battle.session, sim = s.sim, all = sim.units.concat(sim.defenders); let n = 0;
  for (const id of ids) { const u = all.find((x) => x.id === id); if (!u || u.dead) continue; u.hp = 0; u.dead = true; u.deadAt = sim.time; s.views.event({ k: 'die', id: u.id, side: u.side, type: u.type, x: u.x, z: u.z }, s.t); n++; } return n; }"""
STATS = """(ids) => { const s = __bw.battle.session; const out = [];
  for (const id of ids) { const v = s.views.views.get(id); if (!v) { out.push({ id, none: 1 }); continue; } const p0 = v.parts && v.parts[0];
    out.push({ id, type: v.u.type, side: v.u.side, ti: v.ti, parts: v.parts ? v.parts.length : -1, ratio: p0 && p0.s0 ? p0.p.scale / p0.s0 : null, sk: v.cat ? v.cat.sk : null, inList: v.cat ? v.sk.list.includes(v.cat) : null, H: v.H, cy: v.cy, rise: v.cat ? v.cat.rise : null, state: v.state, dead: v.dead }); }
  const inst = {}; for (const [k, kd] of Object.entries(s.views.kinds)) inst[k] = kd.instances ? kd.instances.length : -1;
  return { units: out, views: s.views.stats().views, inst }; }"""
WRAP = """() => { const s = __bw.battle.session; if (s.__w) return 1; s.__w = 1; window.__T = { v: 0, f: 0, n: 0 }; const uv = s.views.update, uf = s.fx.update;
  s.views.update = function (...a) { const t = performance.now(); const r = uv.apply(this, a); __T.v += performance.now() - t; __T.n++; return r; };
  s.fx.update = function (...a) { const t = performance.now(); const r = uf.apply(this, a); __T.f += performance.now() - t; return r; }; return 1; }"""
PROBE = """(id) => { const v = __bw.battle.session.views.views.get(id); return v ? { parts: v.parts ? v.parts.length : -1, cat: !!v.cat, air: !!v.T.air } : null; }"""
HIDE = """(id) => { const s = __bw.battle.session, v = s.views.views.get(id); if (!v) return 0; const keep = new Set(v.parts.map((pt) => pt.p)); s.__hid = []; s.__keep = keep; let n = 0;
  for (const kd of Object.values(s.views.kinds)) { const arr = kd.instances; if (!arr) continue; const all = arr.slice(); s.__hid.push([arr, all]); arr.length = 0; for (const p of all) { if (keep.has(p)) arr.push(p); else { n++; if (p.c && p.c.root) p.c.root.visible = false; } } } return n; }"""
UNHIDE = """() => { const s = __bw.battle.session; for (const [arr, all] of s.__hid || []) { arr.length = 0; for (const p of all) { if (s.__keep.has(p)) continue; arr.push(p); if (p.c && p.c.root) p.c.root.visible = true; } } s.__hid = null; return 1; }"""
READT = "() => { const r = { v: __T.v, f: __T.f, n: __T.n }; __T.v = __T.f = __T.n = 0; return r; }"
RENDER = """() => { const R = __bw.renderer, t0 = performance.now(); R.render(__bw.scene, __bw.camera); const url = R.domElement.toDataURL('image/png'); const ms = performance.now() - t0;
  return { url, ms, calls: R.info.render.calls, tris: R.info.render.triangles, prog: R.info.programs.length, w: R.domElement.width, h: R.domElement.height }; }"""
async def main():
    data = {'mode': MODE, 'q': Q, 'strips': {}, 'mass': []}; logs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1); pg.set_default_timeout(900000)
        pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
        pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:240]) if m.type in ('error', 'warning') else None)
        await pg.goto(f'http://127.0.0.1:8777/{PAGE}?q={Q}&w=clear&h=14&wa=0.1&lv=30')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3); print('late ready', flush=True)
        await pg.evaluate("(a) => { const A = __bw.econ.st.army; A.army = a; A.guard = {}; }", ARMY)
        await pg.evaluate("document.querySelector('.bwa-btn').click()")
        for i in range(2400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        for i in range(900):
            if await pg.evaluate('__bw.battle.session.cam.intro <= 0.01'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        await pg.evaluate("(()=>{__bw.battle.session.hud.el.style.display='none'; for (const u of __bw.battle.session.sim.units) if (u.side === 'A') { u.hp = 1e6; u.maxHp = 1e6; } __bw.pause(true); })()")
        await pg.evaluate(WRAP)
        diag = await pg.evaluate("() => { const s = __bw.battle.session, out = {}; for (const u of s.sim.units) { if (u.side !== 'A' || out[u.type]) continue; const v = s.views.views.get(u.id); out[u.type] = v ? (v.cat ? 'cat' : v.parts.length) : 0; } return out; }")
        print('VIEWS PER TYPE (parts; 0 = no view)', diag, flush=True); data['diag'] = diag; print('EARLY LOGS', json.dumps(logs[:30]), flush=True)
        print('counts', await pg.evaluate("() => { const o = {}; for (const u of __bw.battle.session.sim.units) if (u.side === 'A') o[u.type] = (o[u.type] || 0) + 1; return o; }"), flush=True)
        print('views', await pg.evaluate("() => __bw.battle.session.views.stats().views"), flush=True)
        async def shot(name, k):
            r = await pg.evaluate(RENDER); open(f'{OUT}/{TAG}_{name}_{k}.png', 'wb').write(base64.b64decode(r['url'].split(',')[1])); r.pop('url'); return r
        if MODE == 'new':
            for name, cands in STRIPS:
                done = False
                for typ, d, pt, off in cands:
                    try:
                        uid = await pg.evaluate(PICK, [typ])
                        pr = await pg.evaluate(PROBE, uid) if uid is not None else None
                        if not pr or pr['parts'] < 1 and not pr['cat']: print('SKIP (no view)', name, typ, uid, pr, flush=True); continue
                        rl = await pg.evaluate(HIDE, uid)
                        await pg.evaluate("(s) => { __bw.battle.advance(s); }", 0.1)                 # (the moved unit shows up at its new place)
                        foc = await pg.evaluate(FOCUS, [typ, d, pt, None, [uid], False, off])
                        if not foc: print('SKIP (no camera)', name, typ, flush=True); continue
                        print(name, typ, uid, 'hid', rl, foc, flush=True)
                        await pg.evaluate("(s) => { __bw.battle.advance(s); }", 0.05)                 # (the crowd culls with the camera of its last update: let it see the new camera first)
                        await pg.evaluate(KILL, [uid]); prev = 0; fr = []
                        for k, age in enumerate(AGES):
                            if age > prev: await pg.evaluate("(s) => { __bw.battle.advance(s); }", age - prev); prev = age
                            r = await shot(name, k); st = await pg.evaluate(STATS, [uid]); r['age'] = age; r['stat'] = st['units'][0]; fr.append(r); print(name, age, r, flush=True)
                        data['strips'][name] = {'type': typ, 'focus': foc, 'frames': fr}; done = True; await pg.evaluate(UNHIDE); break
                    except Exception as e:
                        print('STRIP FAIL', name, typ, repr(e)[:300], flush=True)
                        try: await pg.evaluate(UNHIDE)
                        except Exception: pass
                if not done: print('NO STRIP for tier', name, flush=True)
            await pg.evaluate(READT)
        # ---- (2) mass death: the whole army + 4 defenders at once
        ids = await pg.evaluate("""() => { const sim = __bw.battle.session.sim; const A = sim.units.filter((u) => u.side === 'A' && !u.dead); const keep = A.find((u) => u.type === 'spear');
          const ids = A.filter((u) => u !== keep).map((u) => u.id); let g = 0, a = 0; for (const d of sim.defenders) { if (d.dead) continue; if (d.type === 'guard' && g < 2) { ids.push(d.id); g++; } else if (d.type === 'archer' && a < 2) { ids.push(d.id); a++; } } return ids; }""")
        print('mass ids', len(ids), flush=True)
        foc = await pg.evaluate(FOCUS, ['spear', 95, 0.35, None, None, False, 2.4]); print('mass focus', foc, flush=True)
        pre = await pg.evaluate(STATS, ids); data['pre'] = {'views': pre['views'], 'inst': pre['inst']}
        r0 = await shot('mass', 0); r0['age'] = 0; r0['views'] = pre['views']; data['mass'].append(r0); print('mass 0', r0, flush=True)
        await pg.evaluate(READT); nk = await pg.evaluate(KILL, ids); print('killed', nk, flush=True); prev = 0
        for age in MASS_AGES:
            await pg.evaluate("(s) => { __bw.battle.advance(s); }", age - prev); prev = age
            T = await pg.evaluate(READT); st = await pg.evaluate(STATS, ids); row = {'age': age, 'views_ms_tick': T['v'] / max(1, T['n']), 'fx_ms_tick': T['f'] / max(1, T['n']), 'ticks': T['n'], 'views': st['views'], 'inst': st['inst'], 'units': st['units']}
            if age in MASS_RENDER:
                r = await shot('mass', int(age * 10)); row.update({'render_ms': r['ms'], 'calls': r['calls'], 'tris': r['tris'], 'prog': r['prog']})
            data['mass'].append(row); print('mass', age, {k: v for k, v in row.items() if k not in ('units', 'inst')}, flush=True)
        data['logs'] = logs[:25]
        json.dump(data, open(f'{OUT}/{TAG}_data.json', 'w')); print('LOGS', json.dumps(logs[:25]), flush=True); await b.close()
asyncio.run(main())
