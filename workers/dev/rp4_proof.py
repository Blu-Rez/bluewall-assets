# RP4 proof frames (software GL).  usage: python3 rp4_proof.py <scenario> [...]   scenarios: dodge hit lock tele death hurt skills portrait budget
import asyncio, sys, json
sys.path.insert(0, '/home/claude/dev')
from rp4_shot import *
from PIL import Image, ImageDraw
OUT = '/home/claude/work/rp4/photos/'
CAM = "r.setCam(0.5, 0.2, 4.8, 46);"
async def shot(pg, name, crop=None):
    await pg.evaluate("__rp4.render()"); path = OUT + name + '.png'; await pg.screenshot(path=path)
    if crop: Image.open(path).crop(crop).save(path)
    return path
def strip(paths, out, cols=None, label=None):
    ims = [Image.open(p) for p in paths]; cols = cols or len(ims); rows = (len(ims) + cols - 1) // cols; w, h = ims[0].size; S = Image.new('RGB', (w * cols, h * rows))
    for i, im in enumerate(ims):
        S.paste(im, ((i % cols) * w, (i // cols) * h))
        if label: ImageDraw.Draw(S).text(((i % cols) * w + 6, (i // cols) * h + 4), label[i], fill=(255, 255, 255))
    S.save(OUT + out + '.png')
async def run_to(pg, cond, max_sec=3.0):
    return await pg.evaluate("""([c, m]) => { const r = __rp4, H = r.sim.hero; let t = 0; while (t < m) { if (eval(c)) return t; r.step(1/60, 1/60); t += 1/60; } return -1; }""", [cond, max_sec])

async def sc_dodge(p):
    b, pg, logs, err = await open_page(p, 640, 480, '&kinds=soldier'); print('err', err, logs[:2])
    await pg.evaluate("() => { const r = __rp4; r.setPos(0, -3, 0); " + CAM + " const e = r.sim.spawn('soldier', 0.5, 4, {yaw: Math.PI, passive: true}); r.input(1, 0); r.step(0.25); }")
    await pg.evaluate("__rp4.press('dodge')"); paths = []; lab = []
    for i, st in enumerate([0.08, 0.20, 0.34, 0.50]):
        await run_to(pg, f"H.state==='dodge' && H.sT >= {st}", 1.0); inv = await pg.evaluate("__rp4.sim.invulnerable()"); paths.append(await shot(pg, f'dodge_{i}', (60, 40, 600, 480))); lab.append(f'sT={st:.2f}s invul={inv}')
    strip(paths, 'dodge_strip', 4, lab); print(lab); await b.close()

async def sc_hit(p):
    b, pg, logs, err = await open_page(p, 640, 480, '&kinds=soldier'); print('err', err, logs[:2])
    await pg.evaluate("() => { const r = __rp4; const e = r.sim.spawn('soldier', 0, 2.0, {yaw: Math.PI, passive: true}); e.hp = e.hpMax = 5000; r.setPos(0, -0.4, 0); r.setCam(0.55, 0.16, 3.9, 42); r.step(0.3); }")
    await pg.evaluate("__rp4.press('attack')")
    # tick-by-tick around the first hit: hero clock vs freeze (the hit-stop)
    rows = await pg.evaluate("""() => { const r = __rp4, H = r.sim.hero, e = r.sim.enemies[0], out = []; let hitTick = -1; for (let i = 0; i < 60; i++) { r.step(1/60, 1/60); out.push([i, +H.sT.toFixed(4), +H.freeze.toFixed(4), +e.sT.toFixed(4), +e.freeze.toFixed(4), r.sim.events.some(x => x.type === 'hit') ? 1 : 0, +H.pose.t.toFixed(4)]); } return out; }""")
    first = next(i for i, r in enumerate(rows) if r[5]); print('tick  heroT  heroFreeze  foeT  foeFreeze  hit  pose.t'); [print(r) for r in rows[first - 1:first + 8]]
    # re-run to the hit and take the frames: the hit tick, +2 ticks (hit-stop), +8
    await pg.evaluate("() => { const r = __rp4; r.sim.reset(); const e = r.sim.spawn('soldier', 0, 2.0, {yaw: Math.PI, passive: true}); e.hp = e.hpMax = 5000; r.setPos(0, -0.4, 0); r.step(0.3); }")
    await pg.evaluate("__rp4.press('attack')")
    await run_to(pg, "r.sim.events.some(x => x.type === 'hit')", 1.0); paths = [await shot(pg, 'hit_0', (40, 20, 600, 460))]
    r1 = await pg.evaluate("(() => { const H = __rp4.sim.hero; return [+H.freeze.toFixed(3), +H.sT.toFixed(3)] })()"); 
    for k in (3, 9):
        await pg.evaluate(f"__rp4.step({k}/60, 1/60)"); paths.append(await shot(pg, f'hit_{k}', (40, 20, 600, 460)))
    strip(paths, 'hit_strip', 3, ['hit tick (spark+digits+bar)', '+3 ticks', '+9 ticks']); print('freeze/sT at hit', r1); await b.close()

async def sc_lock(p):
    b, pg, logs, err = await open_page(p, 640, 480, '&kinds=soldier,beast'); print('err', err, logs[:2])
    await pg.evaluate("() => { const r = __rp4; r.setPos(0, 0, 0); r.setCam(0.25, 0.2, 4.6, 48); const a = r.sim.spawn('soldier', -4, 11, {yaw: Math.PI, passive: true}), c = r.sim.spawn('beast', 5, 14, {yaw: Math.PI, passive: true}); r.step(0.4); }")
    paths = [await shot(pg, 'lock_0', (0, 0, 640, 480))]; y0 = await pg.evaluate("__rp4.S.camYaw")
    await pg.evaluate("__rp4.press('lock')"); await pg.evaluate("__rp4.step(1.6)"); paths.append(await shot(pg, 'lock_1', (0, 0, 640, 480)))
    info = await pg.evaluate("() => { const r = __rp4, s = r.sim, t = s.lockTarget(), H = s.hero; return { camYaw: r.S.camYaw, target: t && t.kind, tYaw: t ? Math.atan2(t.x - H.x, t.z - H.z) : null, lockYaw: s.lockYaw() }; }")
    await pg.evaluate("__rp4.press('lock'); __rp4.step(0.1)"); await pg.evaluate("__rp4.press('lock'); __rp4.step(0.15); __rp4.press('lock'); __rp4.step(0.1)")  # toggle off, on, next
    await pg.evaluate("__rp4.step(1.6)"); paths.append(await shot(pg, 'lock_2', (0, 0, 640, 480)))
    info2 = await pg.evaluate("() => { const r = __rp4, s = r.sim, t = s.lockTarget(); return { camYaw: r.S.camYaw, target: t && t.kind }; }")
    print('before camYaw', y0, 'after', info, 'next', info2); strip(paths, 'lock_strip', 3, ['no lock: camera 0.25 rad off', 'lock: yaw assist turned it', 'next target (double tap)']); await b.close()

async def sc_tele(p):
    b, pg, logs, err = await open_page(p, 640, 480, '&kinds=soldier,brute'); print('err', err, logs[:2])
    await pg.evaluate("() => { const r = __rp4; r.setPos(0, 0, 0); r.setCam(0.0, 0.42, 6.0, 48); const a = r.sim.spawn('soldier', -1.7, 2.6, {yaw: Math.PI}); r.step(0.1); }")
    paths = []; lab = []
    t0 = await run_to(pg, "r.sim.enemies[0].state === 'windup'", 6.0)
    for i, f in enumerate([0.35, 0.8, 1.0]):
        await pg.evaluate(f"(() => {{ const r = __rp4, e = r.sim.enemies[0]; let g = 0; while (g++ < 200 && !(e.state === 'windup' && e.sT >= e.K.tele * {f}) && !(e.state === 'attack' && {f} >= 1.0)) r.step(1/60, 1/60); }})()")
        st = await pg.evaluate("(() => { const e = __rp4.sim.enemies[0]; return [e.state, +e.sT.toFixed(3), e.K.tele] })()"); paths.append(await shot(pg, f'tele_{i}', (40, 60, 600, 480))); lab.append(f'{st[0]} {st[1]}s of {st[2]}s'); 
    print(lab); strip(paths, 'tele_strip', 3, lab); await b.close()

async def sc_death(p):
    b, pg, logs, err = await open_page(p, 640, 480, '&kinds=soldier,beast'); print('err', err, logs[:2])
    await pg.evaluate("() => { const r = __rp4; r.setPos(0, -0.4, 0); r.setCam(0.55, 0.18, 4.4, 44); const e = r.sim.spawn('beast', 0, 1.9, {yaw: Math.PI, passive: true}); e.hp = 50; r.step(0.3); }")
    await pg.evaluate("__rp4.press('attack')"); await run_to(pg, "r.sim.events.some(x => x.type === 'kill')", 1.5)
    paths = [await shot(pg, 'death_0', (40, 40, 600, 470))]
    for i, k in enumerate((0.25, 0.45)):
        await pg.evaluate(f"__rp4.step({k})"); paths.append(await shot(pg, f'death_{i+1}', (40, 40, 600, 470)))
    strip(paths, 'death_strip', 3, ['kill tick', '+0.25 s', '+0.70 s']); await b.close()

async def sc_hurt(p):
    b, pg, logs, err = await open_page(p, 640, 480, '&kinds=brute'); print('err', err, logs[:2])
    await pg.evaluate("() => { const r = __rp4; r.setPos(0, 0, 0); r.setCam(2.4, 0.2, 4.8, 46); const e = r.sim.spawn('brute', 0, 2.6, {yaw: Math.PI}); r.step(0.1); }")
    await run_to(pg, "r.sim.events.some(x => x.type === 'hero-hit')", 8.0); paths = [await shot(pg, 'hurt_0', (40, 40, 600, 470))]
    ev = await pg.evaluate("JSON.stringify(__rp4.sim.events.filter(x => x.type==='hero-hit'||x.type==='knockdown').map(x => [x.type, x.dmg, x.flag]))"); print(ev)
    for i, k in enumerate((0.3, 0.7, 1.4)):
        await pg.evaluate(f"__rp4.step({k})"); paths.append(await shot(pg, f'hurt_{i+1}', (40, 40, 600, 470)))
    st = await pg.evaluate("(() => { const H = __rp4.sim.hero; return [H.state, H.hp] })()"); print(st); strip(paths, 'hurt_strip', 4, ['hit tick (vignette, red)', '+0.30 s down', '+1.0 s down', '+2.4 s up']); await b.close()

async def sc_skills(p):
    b, pg, logs, err = await open_page(p, 640, 480, '&kinds=soldier,beast'); print('err', err, logs[:2])
    await pg.evaluate("() => { const r = __rp4; r.setPos(0, -2, 0); r.setCam(0.6, 0.22, 5.2, 48); for (const [k, x, z] of [['soldier', -1, 6], ['beast', 1.2, 8.5], ['soldier', -2.2, 3.5]]) { const e = r.sim.spawn(k, x, z, {yaw: Math.PI, passive: true}); e.hp = e.hpMax = 3000; } r.step(0.3); }")
    await pg.evaluate("__rp4.press('skill1')"); paths = []
    await run_to(pg, "r.sim.projectiles.some(p => p.on) && r.sim.projectiles.find(p => p.on).t > 0.18", 2.0); paths.append(await shot(pg, 'skill1_0', (20, 40, 620, 470)))
    await pg.evaluate("__rp4.step(0.25)"); paths.append(await shot(pg, 'skill1_1', (20, 40, 620, 470)))
    await run_to(pg, "H.cd[0] > 0 && H.state === 'loco'", 2.0)
    await pg.evaluate("__rp4.setPos(0, -1, 0); __rp4.press('skill2')"); await run_to(pg, "r.sim.events.some(x => x.type === 'burst')", 2.0); await pg.evaluate("__rp4.step(0.08)"); paths.append(await shot(pg, 'skill2_0', (20, 40, 620, 470)))
    await pg.evaluate("__rp4.step(0.18)"); paths.append(await shot(pg, 'skill2_1', (20, 40, 620, 470)))
    strip(paths, 'skills_strip', 2, ['skill 1 Flame Wave: flight', 'skill 1: +0.25 s', 'skill 2 Ember Burst: ring', 'skill 2: +0.18 s']); await b.close()

async def sc_portrait(p):
    b, pg, logs, err = await open_page(p, 390, 844, '&kinds=soldier,beast', 2); print('err', err, logs[:2])
    await pg.evaluate("() => { const r = __rp4; r.setPos(0, 0, 0); r.setCam(0.3, 0.2, 3.6, 50); const a = r.sim.spawn('soldier', -2.2, 4.2, {yaw: Math.PI}); const c = r.sim.spawn('beast', 2.4, 5.5, {yaw: Math.PI}); r.step(0.2); r.press('lock'); r.step(0.6); r.press('attack'); r.step(0.22); }")
    await shot(pg, 'portrait_390'); print(await pg.evaluate("JSON.stringify(__rp4.info())")); await b.close()

async def sc_budget(p):
    res = {}
    # A: the arena + hero alone (no combat attached)   B: combat attached, idle   C: combat, 6 placeholder beasts fighting (attack + skill 1 in flight)   D: 2 soldiers + 2 beasts + 2 brutes
    cfgs = [('A arena+hero, no combat', '&nocmb=1', None), ('B combat attached, idle', '&kinds=beast,soldier,brute', []), ('C combat + 6 beasts fighting', '&kinds=beast', ['beast'] * 6), ('D combat + 2 soldier/2 beast/2 brute', '&kinds=soldier,beast,brute', ['soldier', 'beast', 'brute', 'soldier', 'beast', 'brute'])]
    for label, extra, ks in cfgs:
        b, pg, logs, err = await open_page(p, 640, 480, extra); print(label, 'err', err, logs[:2])
        if ks is not None:
            await pg.evaluate("(ks) => { const r = __rp4; r.setPos(0, 0, 0); r.setCam(0.3, 0.3, 5.5, 55); if (ks.length) { r.cmb.spawnTest(ks.length, ks); r.step(0.5); r.press('attack'); r.step(0.25); r.press('skill1'); r.step(0.35); } else r.step(0.3); }", ks)
        else: await pg.evaluate("__rp4.setPos(0,0,0); __rp4.setCam(0.3, 0.3, 5.5, 55); __rp4.step(0.3)")
        await pg.evaluate("__rp4.render()"); info = await pg.evaluate("__rp4.info()"); progs = await pg.evaluate("__rp4.programs()")
        st = await pg.evaluate("__rp4.cmb ? __rp4.cmb.stats() : null"); res[label] = {'info': info, 'programs': progs, 'stats': st}; await b.close()
    print(json.dumps(res, indent=1)); open('/home/claude/work/rp4/budget_raw.json', 'w').write(json.dumps(res, indent=1))

async def main():
    names = sys.argv[1:] or ['dodge']
    async with async_playwright() as p:
        for n in names: await globals()['sc_' + n](p)
asyncio.run(main())
