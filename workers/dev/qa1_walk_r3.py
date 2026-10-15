#!/usr/bin/env python3
# qa1_walk.py (QA1) — walks the hero through the stations of the home map and takes, at every station, 3 frames (strategic from above / third person / first person at eye height) in ONE game hour,
# 844x390, plus the automatic checks (hero inside a solid / trapped / stuck on open ground / falling, camera inside a solid, tall things that are not buildings, pole-like things, floating things,
# z-fight flicker).  READ-ONLY on the game: it only moves the camera / the hero and reads the scene.  Needs: bash dev/gate_w.sh built tree (dev/app/wall.js) and playwright + chromium (swiftshader).
#   python3 dev/qa1_walk.py --tag day   --hour 12.5 [--stations 1-24] [--checks] [--no-hero]
#   python3 dev/qa1_walk.py --tag dusk  --hour 18.3 --stations 1-24
#   python3 dev/qa1_walk.py --tag night --hour 23   --stations 1-24
# Output: work/qa1/out/<tag>/frames/S01_gate_out__strat__day.png ... and work/qa1/out/<tag>/res/S01.json.   One page load per hour (the hour is pinned by ?h=), ~7 min in software GL; a frame ≈ 14 s.
import argparse, asyncio, base64, json, math, os, socket, subprocess, sys, time
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; BASE = '/home/claude/work/qa1/'; PORT = int(os.environ.get('PORT', 8779))
ap = argparse.ArgumentParser(); ap.add_argument('--tag', default='day'); ap.add_argument('--hour', type=float, default=12.5); ap.add_argument('--stations', default='1-24'); ap.add_argument('--checks', action='store_true'); ap.add_argument('--no-hero', action='store_true')
ap.add_argument('--walk', action='store_true', help='walk from the previous station to this one with the real physics (reachability) before placing her'); ap.add_argument('--scan', action='store_true', help='only the improved scene scan (res.scan2)'); ap.add_argument('--zf', action='store_true', help='only the z-fight probe with the hero hidden (res.zfight2)'); ap.add_argument('--quality', default='high'); ap.add_argument('--redo', action='store_true'); ap.add_argument('--diag', default='', help='json list of {name, from:[x,z], to:[x,z]} legs: walks each with the real physics, takes frames where she gets stuck, plus the game reach map'); ap.add_argument('--update', action='store_true', help='keep the old res json + frames, only add the new probes (scan2 / near / zfight2 / checks) to it: no frames are taken')
A = ap.parse_args(); OUT = BASE + 'out/' + A.tag + '/'; FR = OUT + 'frames/'; RS = OUT + 'res/'
for d in (FR, RS): os.makedirs(d, exist_ok=True)
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
LOG = open(OUT + 'walk.log', 'a')
def log(*a):
    s = time.strftime('%H:%M:%S ') + ' '.join(str(x) for x in a); print(s, flush=True); LOG.write(s + '\n'); LOG.flush()
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
def pick(spec, n):
    out = set()
    for part in spec.split(','):
        if part == 'all': out |= set(range(1, n + 1))
        elif '-' in part: a, b = part.split('-'); out |= set(range(int(a), int(b) + 1))
        else: out.add(int(part))
    return sorted(i for i in out if 1 <= i <= n)
def save_png(url, path):
    open(path, 'wb').write(base64.b64decode(url.split(',', 1)[1]))
async def ev(pg, js, timeout=1500):
    return await asyncio.wait_for(pg.evaluate(js), timeout)

def resolve(S, T):
    """fill the stations whose spot comes from the page (walls, a house yard, the stairs / tower base): T = world.targets (type, ringId, x, z, w, d, h, rot)"""
    keep = next(t for t in T if t['type'] == 'keep'); P = next(s for s in S if s['key'] == 'plaza'); gi = next(s for s in S if s['key'] == 'gate_in')
    walls = sorted([t for t in T if t['type'] == 'wall' and t['ringId'] == 'outer'], key=lambda t: -t['w'])
    for s in S:
        if s['key'] in ('wall_outer', 'wall_inner'):
            w = walls[0]; nx, nz = math.sin(w['rot']), math.cos(w['rot']); out = 1 if ((w['x'] - keep['x']) * nx + (w['z'] - keep['z']) * nz) > 0 else -1
            side = out if s['key'] == 'wall_outer' else -out; k = w['d'] / 2 + 6
            s.update(x=round(w['x'] + nx * side * k, 1), z=round(w['z'] + nz * side * k, 1), lx=w['x'], lz=w['z'], note='wall piece id %s, %.0f m long, %.1f m high' % (w.get('id'), w['w'], w['h']))
        elif s['key'] == 'house_yard':
            hs = [t for t in T if t['type'] == 'house' and t['w'] <= 14 and t['d'] <= 14 and 40 <= math.hypot(t['x'] - P['x'], t['z'] - P['z']) <= 90]
            h = min(hs, key=lambda t: abs(math.hypot(t['x'] - P['x'], t['z'] - P['z']) - 65)); dx, dz = P['x'] - h['x'], P['z'] - h['z']; l = math.hypot(dx, dz) or 1
            s.update(x=round(h['x'] + dx / l * (h['w'] / 2 + 9), 1), z=round(h['z'] + dz / l * (h['w'] / 2 + 9), 1), lx=h['x'], lz=h['z'], note='house target id %s (%.1f x %.1f x %.1f m)' % (h.get('id'), h['w'], h['d'], h['h']))
        elif s['key'] == 'stairs':
            tw = [t for t in T if t['type'] == 'tower' and t['ringId'] == 'outer']; t = min(tw, key=lambda q: math.hypot(q['x'] - gi['x'], q['z'] - gi['z'])); dx, dz = P['x'] - t['x'], P['z'] - t['z']; l = math.hypot(dx, dz) or 1
            s.update(x=round(t['x'] + dx / l * (t['w'] / 2 + 9), 1), z=round(t['z'] + dz / l * (t['w'] / 2 + 9), 1), lx=t['x'], lz=t['z'], note='no stair / ramp / step object exists in the scene (names searched: step|stair|ramp): the tower base next to the gate stands in for the access to the wall walk')
    return S

async def main():
    S = json.load(open(BASE + 'stations.json')); sel = pick(A.stations, len(S)); log('tag', A.tag, 'hour', A.hour, 'stations', A.stations, 'count', len(sel), 'checks', A.checks, 'q', A.quality)
    srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            pg = await b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=1, has_touch=True, is_mobile=True)
            errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
            t0 = time.time(); await pg.goto('http://127.0.0.1:%d/rp1_dev_r3.html?q=%s&w=clear&h=%s&wa=0.1' % (PORT, A.quality, A.hour), timeout=900000)
            for i in range(4000):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready'): break
            for i in range(1500):
                if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
                await asyncio.sleep(1)
            log('page ready after', round(time.time() - t0), 's')
            await pg.evaluate(open(D + 'qa1_page.js').read()); await pg.evaluate('QA1.init()')
            T = json.loads(await pg.evaluate("JSON.stringify((__bw.world.targets||[]).map(t=>({id:t.id,type:t.type,ringId:t.ringId,x:t.x,z:t.z,w:t.w,d:t.d,h:t.h,rot:t.rot})))"))
            G = json.load(open(BASE + 'layout_dump.json'))['gate']; await pg.evaluate('window.__qa1.gate=%s' % json.dumps({'nx': G['nx'], 'nz': G['nz']}))
            S = resolve(S, T); json.dump(S, open(BASE + 'stations_resolved.json', 'w'), indent=1)
            log('hour check', await pg.evaluate("JSON.stringify({h:__bw.P().hour, night:__bw.P().night, comp:!!__bw.useComposer(), q:__bw.Q.level})"))
            # ---- phase 1: the strategic frames (the hero is not started yet: the real strategic camera, 90 m = the closest zoom the game allows)
            for i in sel:
                s = S[i - 1]; f = FR + '%s_%s__strat__%s.png' % (s['id'], s['key'], A.tag)
                if os.path.exists(f) and not A.redo: continue
                t1 = time.time(); tx, tz = (s['lx'], s['lz']) if s['group'] not in ('edges', 'roads') else (s['x'], s['z'])
                r = await ev(pg, 'QA1.strat(%s)' % json.dumps({'x': tx, 'z': tz})); save_png(await ev(pg, 'QA1.shot()'), f)
                log('strat', s['id'], s['key'], 'ok', round(time.time() - t1), 's', 'cam', r['cam'])
            if A.no_hero:
                await b.close(); return
            # ---- phase 2: the hero
            r = await ev(pg, "QA1.startHero('elina')"); log('hero started', r); prev = None
            if A.diag:
                outd = BASE + 'out/%s/diag/' % A.tag; os.makedirs(outd, exist_ok=True); DR = []
                try:
                    rm = await ev(pg, 'QA1.reach()'); png = rm.pop('png', None)
                    if png: save_png(png, outd + 'reachmap.png')
                    json.dump(rm, open(outd + 'reach.json', 'w'), indent=1); log('reach map', {k: rm.get(k) for k in ('reachPct', 'landCells', 'reach', 'unreach', 'steep', 'water', 'solid')})
                except Exception as e: log('reach map error', e)
                for q in json.load(open(A.diag)):
                    t1 = time.time()
                    if 'eval' in q:
                        try:
                            if q.get('from'): await ev(pg, 'QA1.place(%s,"third")' % json.dumps({'x': q['from'][0], 'z': q['from'][1], 'lx': q['from'][0] + 1, 'lz': q['from'][1]}))
                            rec = dict(q, out=await ev(pg, q['eval']))
                        except Exception as e: rec = dict(q, error=str(e)[:300])
                        rec['secs'] = round(time.time() - t1); DR.append(rec); json.dump(DR, open(outd + 'diag.json', 'w'), indent=1); log('diag', q['name'], 'eval', 'err' if 'error' in rec else 'ok', rec['secs'], 's'); continue
                    fr, to = q['from'], q['to']
                    try:
                        pl = await ev(pg, 'QA1.place(%s,"third")' % json.dumps({'x': fr[0], 'z': fr[1], 'lx': to[0], 'lz': to[1]}))
                        wk = await ev(pg, 'QA1.walkTo(%s,%s,%s)' % (to[0], to[1], q.get('maxSec', 200)))
                        rec = dict(q, place=pl, walk=wk)
                        if not wk.get('ok'):
                            end = {'x': wk['x'], 'z': wk['z'], 'lx': to[0], 'lz': to[1]}
                            rec['ahead'] = await ev(pg, 'QA1.probeAhead(%s,%s,%s,%s)' % (wk['x'], wk['z'], to[0], to[1]))
                            pe = await ev(pg, 'QA1.place(%s,"third")' % json.dumps(end)); rec['stuck_place'] = pe
                            rec['near'] = await ev(pg, 'QA1.near(%s,%s,10)' % (wk['x'], wk['z']))
                            save_png(await ev(pg, 'QA1.shot()'), outd + q['name'] + '__stuck_third.png')
                            await ev(pg, 'QA1.place(%s,"first")' % json.dumps(end)); save_png(await ev(pg, 'QA1.shot()'), outd + q['name'] + '__stuck_first.png'); await ev(pg, '__rp.cam("third")')
                    except Exception as e: rec = dict(q, error=str(e)[:300])
                    rec['secs'] = round(time.time() - t1); DR.append(rec); json.dump(DR, open(outd + 'diag.json', 'w'), indent=1)
                    log('diag', q['name'], 'ok' if (rec.get('walk') or {}).get('ok') else 'FAIL', (rec.get('walk') or {}).get('why'), (rec.get('walk') or {}).get('t'), rec['secs'], 's')
                await b.close(); return
            for i in sel:
                s = S[i - 1]; res = {'id': s['id'], 'key': s['key'], 'name': s['name'], 'group': s['group'], 'x': s['x'], 'z': s['z'], 'tag': A.tag, 'hour': A.hour, 'note': s.get('note', '')}
                rf = RS + s['id'] + '.json'
                if A.update and os.path.exists(rf):
                    try: res = dict(json.load(open(rf)), tag=A.tag)
                    except Exception: pass
                if os.path.exists(rf) and not A.redo and not A.update and all(os.path.exists(FR + '%s_%s__%s__%s.png' % (s['id'], s['key'], c, A.tag)) for c in ('third', 'first')): continue
                t1 = time.time(); st = {'x': s['x'], 'z': s['z'], 'lx': s['lx'], 'lz': s['lz']}
                try:
                    if A.walk and prev:
                        await ev(pg, 'QA1.place(%s,"third")' % json.dumps(prev)); wk = await ev(pg, 'QA1.walkTo(%s,%s,260)' % (st['x'], st['z'])); wk['from'] = prev['id']; res['walk'] = wk
                        if not wk.get('ok'): res.setdefault('defects', []).append({'sev': 'A', 'what': 'the hero cannot walk from %s to this station on foot (real physics + BFS path): %s after %s s, ended at (%s, %s), target %s' % (prev['id'], wk.get('why') or 'did not arrive', wk.get('t'), wk.get('x'), wk.get('z'), wk.get('target')), 'cam': 'third'})
                        if wk.get('cam'): res.setdefault('defects', []).append({'sev': 'A', 'what': 'the third-person camera was inside a solid in %s frames while walking %s -> this station' % (wk['cam'], prev['id']), 'cam': 'third'})
                    pl = await ev(pg, 'QA1.place(%s,"third")' % json.dumps(st)); res['place'] = pl; res['pagev'] = await ev(pg, 'QA1.v'); prev = dict(st, id=s['id'], x=pl.get('x', st['x']), z=pl.get('z', st['z']))
                    if not pl.get('ok'):
                        res['defects'] = [{'sev': 'A', 'what': 'no free dry spot to stand on within 40 m of the station: %s' % pl.get('why'), 'cam': 'third'}]; json.dump(res, open(rf, 'w'), indent=1); log('PLACE FAIL', s['id'], pl); continue
                    if A.scan: res['scan2'] = await ev(pg, 'QA1.scan(%s,%s,70)' % (pl['x'], pl['z'])); res['near'] = await ev(pg, 'QA1.near(%s,%s,8)' % (pl['x'], pl['z'])) if A.scan else None
                    if A.zf: res['zfight2'] = await ev(pg, 'QA1.zfight()')
                    if A.checks:
                        res['hero'] = await ev(pg, 'QA1.heroChecks()'); res['scan'] = await ev(pg, 'QA1.scan(%s,%s,70)' % (pl['x'], pl['z'])); res['zfight'] = await ev(pg, 'QA1.zfight()')
                        await ev(pg, 'QA1.place(%s,"third")' % json.dumps(st))                    # back to the spot (the 8-direction walk moved her around)
                    if not A.update or not os.path.exists(FR + '%s_%s__third__%s.png' % (s['id'], s['key'], A.tag)):
                        save_png(await ev(pg, 'QA1.shot()'), FR + '%s_%s__third__%s.png' % (s['id'], s['key'], A.tag))
                        try: res['camdist'] = await ev(pg, 'QA1.camInfo()')
                        except Exception: pass
                        pf = await ev(pg, 'QA1.place(%s,"first")' % json.dumps(st)); res['place_first'] = pf
                        save_png(await ev(pg, 'QA1.shot()'), FR + '%s_%s__first__%s.png' % (s['id'], s['key'], A.tag))
                    await ev(pg, '__rp.cam("third")')
                except Exception as e:
                    res['error'] = str(e)[:300]; log('ERROR', s['id'], e)
                res['secs'] = round(time.time() - t1); res['pageerrors'] = errs[-3:]; json.dump(res, open(rf, 'w'), indent=1)
                nd = len((res.get('hero') or {}).get('defects', [])) if res.get('hero') else 0
                log('station', s['id'], s['key'], 'done', res['secs'], 's', 'hero-defects', nd, 'zfight', (res.get('zfight') or {}).get('frac'), 'tall', len((res.get('scan') or {}).get('tall', [])), 'pole', len((res.get('scan') or {}).get('pole', [])), 'float', len((res.get('scan') or {}).get('floating', [])))
            await b.close(); log('SESSION DONE', A.tag)
    finally:
        if srv: srv.terminate()
asyncio.run(main())
