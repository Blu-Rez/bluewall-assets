import asyncio, sys, os, json, time, collections
from playwright.async_api import async_playwright
# p39_progs.py [q=high] [lv=30] : shader-program inventory of the real game after the late load.
#   prints: count, per program-name groups, which cacheKey parameters differ, GL call time (linkProgram / getProgramParameter / compile), long tasks.
Q = os.environ.get('Q', 'high'); LV = sys.argv[1] if len(sys.argv) > 1 else '30'
INIT = """
(() => {
  const P = WebGL2RenderingContext.prototype, st = window.__gls = { link: 0, linkN: 0, stat: 0, statN: 0, comp: 0, compN: 0, long: [], big: [] };
  const wrap = (name, key, nkey) => { const o = P[name]; P[name] = function (...a) { const t = performance.now(); const r = o.apply(this, a); const d = performance.now() - t; st[key] += d; st[nkey]++; if (d > 40) st.big.push([name, +d.toFixed(0), Math.round(t)]); return r; }; };
  wrap('linkProgram', 'link', 'linkN'); wrap('compileShader', 'comp', 'compN');
  const gp = P.getProgramParameter; P.getProgramParameter = function (p, k) { const t = performance.now(); const r = gp.call(this, p, k); const d = performance.now() - t; st.stat += d; st.statN++; if (d > 40) st.big.push(['getProgramParameter', +d.toFixed(0), Math.round(t)]); return r; };
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) st.long.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ entryTypes: ['longtask'] }); } catch (e) {}
})();
"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
        await pg.add_init_script(INIT)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300])); pg.on('console', lambda m: logs.append(m.text[:200]) if '[late]' in m.text else None)
        t0 = time.time()
        extra = os.environ.get('EXTRA', '')
        await pg.goto(f'http://127.0.0.1:8777/dev_base.html?q={Q}&w=clear&h=14&wa=0.1&lv={LV}{extra}')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(900):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        print('ready after', round(time.time() - t0), 's', flush=True)
        await asyncio.sleep(4)
        res = await pg.evaluate("""() => {
          const r = __bw.renderer, progs = r.info.programs || [], g = {};
          const out = { n: progs.length, shadows: r.shadowMap.enabled, bloom: !!__bw.composer(), rows: [] };
          for (const p of progs) out.rows.push({ name: p.name, used: p.usedTimes, key: p.cacheKey, vs: (p.vertexShader || '').length, fs: (p.fragmentShader || '').length });
          // material census: type, hooks, shadow casters
          const mats = new Map(); let meshes = 0, casters = 0, withCustomDepth = 0;
          __bw.scene.traverse((o) => { if (!(o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || o.isPoints || o.isLine || o.isSprite)) return; meshes++; if (o.castShadow) casters++; if (o.customDepthMaterial) withCustomDepth++;
            const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) { if (!m) continue; mats.set(m, (mats.get(m) || 0) + 1); } });
          out.meshes = meshes; out.casters = casters; out.withCustomDepth = withCustomDepth; out.materials = mats.size;
          const byType = {}; for (const [m] of mats) { const k = m.type + (m.onBeforeCompile && m.onBeforeCompile.toString().length > 40 ? '+hook' : '') + (m.customProgramCacheKey && m.customProgramCacheKey() ? '+ck' : ''); byType[k] = (byType[k] || 0) + 1; }
          out.byType = byType;
          // distinct customProgramCacheKey strings
          const cks = {}; for (const [m] of mats) { try { const k = m.customProgramCacheKey ? m.customProgramCacheKey() : ''; if (k) cks[k.slice(0, 80)] = (cks[k.slice(0, 80)] || 0) + 1; } catch (e) {} } out.cks = cks;
          const prog2 = {}; const F = (o, m) => ({ ty: m.type, nm: m.name || '', map: !!m.map, nrm: !!m.normalMap, rgh: !!m.roughnessMap, met: !!m.metalnessMap, ao: !!m.aoMap, em: !!m.emissiveMap, al: !!m.alphaMap, vc: !!m.vertexColors, fl: !!m.flatShading, tr: !!m.transparent, at: m.alphaTest > 0, sd: m.side, inst: !!o.isInstancedMesh, ic: !!(o.instanceColor), sk: !!o.isSkinnedMesh, mo: !!(o.morphTargetInfluences && o.morphTargetInfluences.length), rs: !!o.receiveShadow, fog: !!m.fog, ck: (m.customProgramCacheKey ? m.customProgramCacheKey() : '').slice(-24).replace(/\\s+/g, ' '), tx: ['map','normalMap','roughnessMap'].map((k) => m[k] ? (m[k].image && m[k].image.width) || 0 : 0).join('/') });
          __bw.scene.traverse((o) => { if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite)) return; const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) { if (!m) continue; const pr = r.properties.get(m).currentProgram; if (!pr) continue; (prog2[pr.cacheKey] = prog2[pr.cacheKey] || []).push(F(o, m)); } });
          out.prog2 = Object.values(prog2).map((a) => ({ n: a.length, f: a[0] }));
          out.gls = window.__gls; out.mem = r.info.memory; out.generic = (__bw.world && __bw.world.ctx && __bw.world.ctx.houses) ? __bw.world.ctx.houses.length : -1; out.targets = __bw.world.targets ? __bw.world.targets.length : -1; return out; }""")
        json.dump(res, open(f'/home/claude/work/progs_base_{Q}_{LV}.json', 'w'))
        print('generic houses', res.get('generic'), 'targets', res.get('targets'), flush=True)
        print('programs', res['n'], 'shadows', res['shadows'], 'bloom', res['bloom'], 'meshes', res['meshes'], 'casters', res['casters'], 'customDepth', res['withCustomDepth'], 'materials', res['materials'])
        print('material types', json.dumps(res['byType']))
        by = collections.Counter(r['name'] for r in res['rows'])
        feat = collections.Counter(); 
        for q in res['prog2']:
            for k, v in q['f'].items():
                if k not in ('nm','ck','tx','ty') and v: feat[k] += 1
        print('programs seen on materials', len(res['prog2']), 'feature counts', dict(feat)); print('program names', dict(by.most_common(25)))
        g = res['gls']; print('GL ms: link %.0f (%d)  status %.0f (%d)  compileShader %.0f (%d)' % (g['link'], g['linkN'], g['stat'], g['statN'], g['comp'], g['compN']))
        print('long tasks (start ms, dur ms):', g['long'][:30]); print('big GL calls:', g['big'][:20])
        print('top cacheKey groups (name, count):')
        for k, v in by.most_common(8): print('   ', k, v)
        print('LOGS', logs[:6])
        await b.close()
asyncio.run(main())
