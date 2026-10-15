import asyncio, sys, os, json, re
from playwright.async_api import async_playwright
# BT1 test: for each level, the attack map IS the home map.  Same level, same (fixed) camera, same page:
#  1. every scene-tree group (depth 3) shows the same visible meshes + triangles (+-2 %) in home and attack, except the listed battle layers / life
#  2. every battle target that has a visible body at home still has it in the attack (aB ids)
#  3. every world target is a building of the battle sim (a solid for the soldiers / a hit-point row)
SNAP = """() => {
  const S = __bw.scene, out = {}, ids = new Set(), soups = [], nm = (o) => o.name || o.type;
  S.traverse((o) => {
    if (!(o.isMesh || o.isPoints || o.isLine)) return;
    if (o.isMesh && /^ws:.+:soup$/.test(o.name)) { let v = true, p = o; while (p) { if (!p.visible) { v = false; break; } p = p.parent; } if (v) { const bb = new __bw.THREE.Box3().setFromObject(o), c = bb.getCenter(new __bw.THREE.Vector3()); soups.push([Math.round(c.x), Math.round(c.z)]); } }
    let vis = true, p = o, chain = [];
    while (p && p !== S) { if (!p.visible) vis = false; chain.unshift(nm(p)); p = p.parent; }
    const key = chain.slice(0, 3).join(' > ');
    const g = o.geometry; let tri = 0;
    if (g) { const n = g.index ? g.index.count : (g.attributes.position ? g.attributes.position.count : 0); tri = (n / 3) * (o.isInstancedMesh ? (o.count || 0) : 1); if (g.drawRange && g.drawRange.count < 1e9) tri = Math.min(tri, g.drawRange.count / 3 * (o.isInstancedMesh ? o.count : 1)); }
    const e = out[key] || (out[key] = { vis: 0, tri: 0 });
    if (vis) { e.vis++; e.tri += tri; const a = g && g.attributes.aB; if (a) { const arr = a.array; let last = -1; for (let i = 0; i < arr.length; i++) { const x = arr[i]; if (x !== last) { last = x; if (x > 0.5) ids.add(Math.round(x)); } } } }
  });
  return { groups: out, ids: [...ids], soups };
}"""
# battle layers (only these may differ) + life that belongs to the owner's own life at home
ALLOWED = [r'Armature', r'ruins', r'^battleUnits', r'^squadRings', r'^ringPaths', r'^Points$', r'^crowd', r'^nomads$', r'^Group > Mesh$',
           r'late:army', r'late:coop > hens', r'late:crow', r'late:eagle', r'late:horse', r'late:knight', r'late:prowler', r'late:troll', r'late:wolf', r'late:cyclops', r'late:werewolf', r'late:treant', r'late:cow']
EXTRA = [r'late:defenses']   # the defence field: ballistas are driven by the sim in an attack (setManual), listed apart in the report
FAR = [0, 230, 150, 0, 0, -10]
async def settle(pg, n=8):
    f0 = await pg.evaluate('__bw.frames')
    for i in range(400):
        await asyncio.sleep(0.3)
        if await pg.evaluate(f'__bw.frames >= {f0} + {n}'): break
async def one(p, lv):
    b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg = await b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=1)
    await pg.goto(f"http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv={lv}")
    for i in range(3000):
        await asyncio.sleep(0.5)
        if await pg.evaluate('!!window.__ready'): break
    for i in range(600):
        if await pg.evaluate('!!__bw.lateReady'): break
        await asyncio.sleep(1)
    await asyncio.sleep(3)
    await pg.add_script_tag(path='/home/claude/dev/cam.js')
    await pg.evaluate(f'__bw.world.setLevel({lv})')          # (the page clamps ?lv= to the live cap 30; the attack goes up to MAXL = 50: the home map is put at the same level the same way)
    await pg.evaluate(f'__cam({",".join(map(str, FAR))})'); await settle(pg, 8); await asyncio.sleep(25); await settle(pg, 8)     # (the town's lazy bakes finish)
    home = await pg.evaluate(f'({SNAP})()')
    tinfo = await pg.evaluate("JSON.stringify(__bw.world.targets.map(t=>[t.id,t.type,Math.round(t.x),Math.round(t.z),Math.round(t.w||0),Math.round(t.d||0)]))")
    tgt = json.dumps({'id': 'bt1', 'name': 'Rival', 'emblem': 'flame', 'ratio': 1, 'levels': {'keep': lv, 'wall': lv, 'towers': lv}, 'seed': 12345, 'power': 1000, 'loot': {'ruby': 1, 'emerald': 1, 'turq': 1}})
    await pg.evaluate(f'__bw.battle.start({tgt})')
    for i in range(1200):
        await asyncio.sleep(0.5)
        if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
    await asyncio.sleep(3)
    await pg.evaluate('__bw.battle.session.cam.free = true; __bw.battle.session.cam.intro = 0')
    await pg.evaluate(f'(()=>{{const k=__bw.camera; k.position.set({",".join(map(str, FAR[:3]))}); k.lookAt({",".join(map(str, FAR[3:]))}); k.updateMatrixWorld(true);}})()'); await settle(pg, 8); await asyncio.sleep(25); await settle(pg, 8)
    atk = await pg.evaluate(f'({SNAP})()')
    sim_ids = await pg.evaluate('JSON.stringify(__bw.battle.session.sim.buildings.map(b=>b.id))')
    await b.close()
    return home, atk, json.loads(tinfo), json.loads(sim_ids)
async def main():
    levels = [int(x) for x in os.environ.get('BT1_LEVELS', '1 30 50').split()]
    bad = []; rep = {}; 
    async with async_playwright() as p:
        for lv in levels:
            home, atk, tinfo, sim_ids = await one(p, lv)
            H, A = home['groups'], atk['groups']; rows = []; extra = []; info = []
            for k in sorted(set(H) | set(A)):
                h = H.get(k, {'vis': 0, 'tri': 0}); a = A.get(k, {'vis': 0, 'tri': 0})
                if abs(h['tri'] - a['tri']) <= 0.02 * max(1, h['tri'], a['tri']) and (h['vis'] > 0) == (a['vis'] > 0): continue
                if any(re.search(r, k) for r in ALLOWED): continue
                if any(re.search(r, k) for r in EXTRA): extra.append((k, h, a)); continue
                rows.append((k, h, a))
                if lv < 30 and re.search(r'castle-tr2|late:wslife|late:worksites|late:deffield', k): info.append((k, h, a)); continue      # A1: an attack shows all three rings, the home map only the rings its level has
                bad.append(f'lv{lv}: {k} home vis {h["vis"]} tri {int(h["tri"])} / attack vis {a["vis"]} tri {int(a["tri"])}')
            hid, aid = set(home['ids']), set(atk['ids']); lost = sorted(hid - aid)
            for i in lost: bad.append(f'lv{lv}: target {i} has a body at home but none in the attack')
            tids = {t[0] for t in tinfo}; nosim = sorted(tids - set(sim_ids))
            for i in nosim: bad.append(f'lv{lv}: target {i} is not a building of the battle sim')
            nobody = sorted(tids - hid - aid)
            def soup_body(i, mode):                      # a town lot whose body is procedural (ws:<lot>:soup, no aB): world.targetDown hides it with the target (BT1)
                t = [q for q in tinfo if q[0] == i][0]; r = max(t[4], t[5]) / 2 + 8
                return any(abs(sx - t[2]) <= r and abs(sz - t[3]) <= r for sx, sz in (home if mode == 'h' else atk)['soups'])
            procedural = [i for i in nobody if soup_body(i, 'h') and soup_body(i, 'a')]
            nobody = [i for i in nobody if i not in procedural]
            for i in nobody: bad.append(f'lv{lv}: target {i} has no visible body in either mode')
            kinds = {t[0]: t[1] for t in tinfo}
            print(f'LV {lv}: groups {len(set(H) | set(A))}, differing outside the battle layers {len(rows)}, targets {len(tids)} (body at home {len(hid)}, in attack {len(aid)}), lost {len(lost)}, no sim building {len(nosim)}', flush=True)
            print('   targets without any body (not meshes: manual objects / data only):', sorted({kinds[i] for i in nobody}), flush=True)
            for k, h, a in info: print(f'   (A1 rings, not a failure below level 30) {k}: home tri {int(h["tri"])} / attack tri {int(a["tri"])}', flush=True)
            for i in procedural:
                t = [q for q in tinfo if q[0] == i][0]; print(f'   target {i} ({t[1]}) at x {t[2]} z {t[3]}: body = procedural worksite parts (no aB), hidden by world.targetDown when the target falls', flush=True)
            for i in nobody:
                t = [q for q in tinfo if q[0] == i][0]; print(f'   target {i} ({t[1]}) at x {t[2]} z {t[3]} size {t[4]} x {t[5]} has NO body in either mode', flush=True)
            for k, h, a in extra: print(f'   (listed apart) {k}: home vis {h["vis"]} tri {int(h["tri"])} / attack vis {a["vis"]} tri {int(a["tri"])}', flush=True)
            rep[lv] = {'rows': [(k, h, a) for k, h, a in rows], 'lost': lost, 'nosim': nosim, 'extra': [(k, h, a) for k, h, a in extra]}
    json.dump(rep, open('/home/claude/work/bt1/bt1_test_result.json', 'w'))
    if bad:
        print('\n'.join(bad[:40])); print('BT1 FAILED'); sys.exit(1)
    print('BT1 OK')
asyncio.run(main())
