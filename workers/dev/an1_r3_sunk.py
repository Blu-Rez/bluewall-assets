#!/usr/bin/env python3
# an1_r3_sunk.py — AN1_R3 part 2/3: are the movers' feet inside a visible static surface (bridge deck, steps, plaza, props)?
# Uses the persistent RPC page (an1_r3_page.py, already booted; dev/an1_r3_rpc.sh), pauses the game, steps world.update() by hand (1/30 s, camera parked at a few spots so the movers around it are simulated) and records, every 3rd frame,
# the feet of cart drivers, cart horses, dogs and the knights' horses.  Afterwards (offline, once - NOT per frame in the game) it ray-casts down from 1 m above each foot against the visible static meshes
# (no skinned / crowd meshes, no transparent ones, no meshes > 100k vertices = the terrain itself) and counts the samples whose feet are > 8 cm below that surface.
# It also reports how different GR1's groundH(x, z) is from the height the movers already use, and which surfaces (name, bbox, height over the terrain) the sunk samples sit in = the data a walkable-height map would need.
# Env: AN1_TAG, AN1_QS, AN1_SPOTS (name:x:z,...), AN1_WARM (frames), AN1_REC (frames), AN1_OUT, AN1_PORT
import asyncio, json, os, sys, time, subprocess, socket
D = '/home/claude/dev/'
OUT = os.environ.get('AN1_OUT', '/home/claude/work/an1r3'); os.makedirs(OUT, exist_ok=True)
TAG = os.environ.get('AN1_TAG', 'sunk'); QS = os.environ.get('AN1_QS', ''); PORT = 0
WARM = int(os.environ.get('AN1_WARM', 420)); REC = int(os.environ.get('AN1_REC', 1200))
SPOTS = [s.split(':') for s in os.environ.get('AN1_SPOTS', 'town:20:16,east:244:-100,west:-100:60,north:38:-340,fields:211:2').split(',')]
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--js-flags=--expose-gc']
R = {'spots': {}, 'errors': []}
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)

JS_SETUP = r"""
(() => {
  const B = __bw, THREE = B.THREE, world = B.world, cam = B.camera;
  const S = window.__sk = { samples: [], cands: [], ray: new THREE.Raycaster(), t: B.t || 0 };
  S.park = (x, z) => { const h = world.fastHeight ? world.fastHeight(x, z) : 0; cam.position.set(x, h + 70, z + 50); cam.lookAt(x, h, z); cam.updateMatrixWorld(true); if (cam.updateProjectionMatrix) cam.updateProjectionMatrix(); };
  S.step = (n, rec) => {
    const dt = 1 / 30, W = world.ctx.wsLife, kn = window.__knights || [], hd = window.__herds || {};
    for (let i = 0; i < n; i++) {
      S.t += dt; world.update(S.t, dt, cam);
      if (rec && i % 3 === 0) {
        for (const c of (W ? W.carts : [])) {
          if (c.driver && c.driver.y > -500) S.samples.push(['driver', c.driver.x, c.driver.y - (c.driver.lift || 0), c.driver.z]);
          if (c.horse && c.horse.y > -500) S.samples.push(['carthorse', c.horse.x, c.horse.y - (c.horse.lift || 0), c.horse.z]);
        }
        for (const h of kn) if (h.root.visible !== false && h.root.parent) S.samples.push(['knighthorse', h.root.position.x, h.root.position.y, h.root.position.z]);
        for (const k of ['dogs', 'wolves']) if (hd[k]) for (const c of hd[k].list) if (c.root.parent && (k === 'dogs' || c.root.visible)) S.samples.push([k, c.root.position.x, c.root.position.y, c.root.position.z]);
      }
    }
    return S.samples.length;
  };
  // the static, visible, opaque meshes (everything the eye sees as "ground-like" and a mover could stand in), except the terrain itself
  S.collect = () => {
    S.cands = []; S.skipped = [];
    B.scene.updateMatrixWorld(true);
    B.scene.traverse((o) => {
      if (!o.isMesh || o.isSkinnedMesh || o.isPoints || o.isLine) return;
      for (let p = o; p; p = p.parent) if (p.visible === false) return;
      const g = o.geometry; if (!g || !g.attributes || !g.attributes.position) return;
      if (g.attributes.skinIndex || g.attributes.iCur) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m || m.transparent || m.visible === false) return;
      if (g.attributes.position.count > 100000) { S.skipped.push((o.name || o.parent && o.parent.name || '?') + ':' + g.attributes.position.count); return; }
      if (!g.boundingSphere) g.computeBoundingSphere();
      o.frustumCulled = false; S.cands.push(o);
    });
    return [S.cands.length, S.skipped.slice(0, 8)];
  };
  const nameOf = (o) => { const a = []; for (let p = o; p && a.length < 4; p = p.parent) if (p.name) a.push(p.name); return a.join('<'); };
  S.cast = () => {
    const out = [], ray = S.ray, dir = new THREE.Vector3(0, -1, 0), org = new THREE.Vector3(), seen = new Map();
    const fh = world.fastHeight;
    for (const [k, x, fy, z] of S.samples) {
      const key = k + ':' + Math.round(x * 4) + ':' + Math.round(z * 4) + ':' + Math.round(fy * 20);
      let r = seen.get(key);
      if (!r) {
        org.set(x, fy + 1.0, z); ray.set(org, dir); ray.near = 0; ray.far = 3;
        const hit = ray.intersectObjects(S.cands, false)[0];
        const th = fh ? fh(x, z) : 0;
        r = { hy: hit ? hit.point.y : null, name: hit ? nameOf(hit.object) : null, th };
        seen.set(key, r);
      }
      out.push([k, x, z, fy, r.hy, r.th, r.name]);
    }
    S.samples = []; return out;
  };
  return 1;
})()
"""
JS_G = "(()=>{ const m = window.__bwGroundH; return m ? 1 : 0; })()"

def stats(rows):
    import math
    by = {}
    for k, x, z, fy, hy, th, nm in rows:
        b = by.setdefault(k, {'n': 0, 'sunk8': 0, 'sunk3': 0, 'float8': 0, 'ras': [], 'names': {}, 'pts': [], 'dev': []})
        b['n'] += 1
        ground = max(th, hy if hy is not None else -1e9)               # the highest thing under the foot: the terrain (what the movers use) or a visible static surface
        b['dev'].append(fy - ground)
        if fy - ground > 0.08: b['float8'] += 1
        if hy is None: continue
        d = hy - fy
        if d > 0.08: b['sunk8'] += 1; b['ras'].append(d); b['names'][nm] = b['names'].get(nm, 0) + 1; b['pts'].append((x, z, d, hy - th, nm))
        elif d > 0.03: b['sunk3'] += 1
    res = {}
    for k, b in by.items():
        r = sorted(b['ras']); pc = lambda q: round(r[min(len(r) - 1, int(q * len(r)))], 3) if r else 0
        dv = sorted(b['dev']); pd = lambda q: round(dv[min(len(dv) - 1, int(q * len(dv)))], 3)
        res[k] = {'n': b['n'], 'sunk_gt8cm': b['sunk8'], 'pct': round(100 * b['sunk8'] / max(1, b['n']), 2), 'pct_3_8': round(100 * b['sunk3'] / max(1, b['n']), 2), 'float_gt8cm_pct': round(100 * b['float8'] / max(1, b['n']), 2), 'dev_p5': pd(0.05), 'dev_p50': pd(0.5), 'dev_p95': pd(0.95),
                  'p50': pc(0.5), 'p95': pc(0.95), 'max': round(r[-1], 3) if r else 0, 'top_surfaces': sorted(b['names'].items(), key=lambda kv: -kv[1])[:8]}
    # clusters of the sunk samples: 4 m cells -> (count, mean raise over the feet, mean height over the terrain, a name, bbox)
    cl = {}
    for k, b in by.items():
        for x, z, d, ot, nm in b['pts']:
            c = cl.setdefault((k, round(x / 4), round(z / 4)), {'k': k, 'n': 0, 'x0': 1e9, 'x1': -1e9, 'z0': 1e9, 'z1': -1e9, 'd': 0, 'ot': 0, 'nm': {}})
            c['n'] += 1; c['x0'] = min(c['x0'], x); c['x1'] = max(c['x1'], x); c['z0'] = min(c['z0'], z); c['z1'] = max(c['z1'], z); c['d'] += d; c['ot'] += ot; c['nm'][nm] = c['nm'].get(nm, 0) + 1
    top = sorted(cl.values(), key=lambda c: -c['n'])[:40]
    for c in top: c['d'] = round(c['d'] / c['n'], 3); c['ot'] = round(c['ot'] / c['n'], 3); c['nm'] = max(c['nm'], key=c['nm'].get)
    return res, top

RPC = D + 'an1_r3_rpc.sh'
def rpc(name, js, wait=900):
    env = dict(os.environ, AN1_WAIT=str(wait))
    r = subprocess.run([RPC, name], input=js, capture_output=True, text=True, env=env)
    try: d = json.loads(r.stdout)
    except Exception: raise RuntimeError('rpc %s: %s' % (name, r.stdout[:200] + r.stderr[:200]))
    if not d.get('ok'): raise RuntimeError('rpc %s: %s' % (name, str(d.get('error'))[:300]))
    return d['result']
def main():
    rpc('pause', '__bw.pause(true); return 1;'); rpc('setup', 'return (\n' + JS_SETUP.strip().rstrip(';') + '\n);'); rpc('setup2', 'return (\n' + open(D + 'an1_r3/cast2.js').read().strip().rstrip(';') + '\n);')
    allrows = []
    for name, x, z in SPOTS:
        x, z = float(x), float(z)
        try:
            rpc('park', 'return (__sk.park(%f, %f), 1);' % (x, z))
            for i in range(0, WARM, 60): rpc('warm', 'return __sk.step(60, false);')
            n = 0
            for i in range(0, REC, 60): n = rpc('rec', 'return __sk.step(60, true);')
            cinfo = rpc('collect', 'return __sk.collect();')
            rows = rpc('cast', 'const r = __sk.cast2(); return r;'); info = rpc('castinfo', 'return __sk.castInfo;'); log('cast2', info)
            allrows += rows
            st, top = stats(rows)
            R['spots'][name] = {'xz': [x, z], 'samples': len(rows), 'cands': cinfo, 'stats': st}
            log(name, len(rows), 'samples', {k: (v['n'], v['pct'], v['float_gt8cm_pct'], v['dev_p50']) for k, v in st.items()}, 'cands', cinfo[0])
            json.dump(R, open(OUT + '/%s.json' % TAG, 'w'), indent=1)
        except Exception as e:
            R['errors'].append('%s: %s' % (name, str(e)[:300])); log('ERR', name, str(e)[:300])
    st, top = stats(allrows); R['all'] = st; R['clusters'] = top
    R['groundH_vs_terrain'] = rpc('gh', "const pts = %s; const w = __bw.world; const g = w.fastHeight; /* groundH is attach(terrain.fastHeight) in ground_near.js: identical by code */ if (!g) return { have: false, keys: Object.keys(w).filter(k => /ground/i.test(k)) }; let mx = 0, s = 0; for (const [x, z] of pts) { const d = Math.abs(g(x, z) - w.fastHeight(x, z)); mx = Math.max(mx, d); s += d; } return { have: true, n: pts.length, max: mx, mean: s / pts.length };" % json.dumps([[r[1], r[2]] for r in allrows[::7]][:3000]))
    json.dump(R, open(OUT + '/%s.json' % TAG, 'w'), indent=1)
    log('DONE', len(R['errors']), 'errors')
main()
