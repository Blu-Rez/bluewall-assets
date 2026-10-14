# RP4 R2 proof frames (software GL): block (from behind), guard break, arc, effects.   usage: python3 rp4_proof2.py <scenario> [...]   scenarios: block break arc fx
import asyncio, sys, json
sys.path.insert(0, '/home/claude/dev')
from rp4_shot import *
from PIL import Image, ImageDraw
OUT = '/home/claude/work/rp4/photos/'
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
CAMB = "r.setCam(0.25, 0.2, 3.6, 50);"      # the host's behind-camera (D 3.6, fov 50, pitch 0.2)

async def sc_block(p):
    b, pg, logs, err = await open_page(p, 640, 480, '&kinds=soldier'); print('err', err, logs[:2])
    await pg.evaluate("() => { const r = __rp4; r.setPos(0, -0.4, 0); " + CAMB + " const e = r.sim.spawn('soldier', 0.2, 2.6, {yaw: Math.PI}); r.step(0.05); }")
    paths = []; lab = []
    await pg.evaluate("__rp4.cmb.setBlock(true)"); await pg.evaluate("__rp4.step(0.25)"); paths.append(await shot(pg, 'block_0', (40, 30, 600, 470))); lab.append('guard up (button held)')
    await run_to(pg, "r.sim.enemies[0].state === 'windup' && r.sim.enemies[0].sT > r.sim.enemies[0].K.tele * 0.6", 6.0); paths.append(await shot(pg, 'block_1', (40, 30, 600, 470))); lab.append('enemy winds up (telegraph)')
    t = await run_to(pg, "r.sim.events.some(x => x.type === 'block')", 2.0); print('block event after', t); paths.append(await shot(pg, 'block_2', (40, 30, 600, 470))); lab.append('blocked: sparks, small digit')
    ev = await pg.evaluate("JSON.stringify(__rp4.sim.events.filter(x => x.type==='block'||x.type==='hero-hit').map(x => [x.type, x.dmg, x.a, x.flag, x.hp]))"); print(ev)
    await pg.evaluate("__rp4.step(0.12)"); paths.append(await shot(pg, 'block_3', (40, 30, 600, 470))); lab.append('+0.12 s: still guarding, no stun')
    st = await pg.evaluate("(() => { const H = __rp4.sim.hero; return [H.state, +H.st.toFixed(1), H.hp, H.guardBroken] })()"); print('after', st)
    strip(paths, 'block_strip', 2, lab); await b.close()

async def sc_break(p):
    b, pg, logs, err = await open_page(p, 640, 480, '&kinds=brute'); print('err', err, logs[:2])
    await pg.evaluate("() => { const r = __rp4; r.setPos(0, -0.4, 0); r.setCam(0.25, 0.22, 4.2, 50); const e = r.sim.spawn('brute', 0.1, 3.0, {yaw: Math.PI}); r.sim.hero.st = 14; r.step(0.05); }")
    paths = []; lab = []
    await pg.evaluate("__rp4.cmb.setBlock(true)"); await run_to(pg, "r.sim.enemies[0].state === 'windup' && r.sim.enemies[0].sT > r.sim.enemies[0].K.tele * 0.7", 6.0); paths.append(await shot(pg, 'break_0', (40, 30, 600, 470))); lab.append('stamina 14, brute winds up')
    t = await run_to(pg, "r.sim.events.some(x => x.type === 'block')", 2.0); paths.append(await shot(pg, 'break_1', (40, 30, 600, 470))); lab.append('guard BREAK (red flash)')
    ev = await pg.evaluate("JSON.stringify(__rp4.sim.events.filter(x => x.type==='block'||x.type==='hero-hit').map(x => [x.type, x.dmg, x.a, x.flag, x.hp]))"); print(ev)
    await pg.evaluate("__rp4.step(0.3)"); paths.append(await shot(pg, 'break_2', (40, 30, 600, 470))); lab.append('+0.3 s staggered')
    st = await pg.evaluate("(() => { const H = __rp4.sim.hero; return [H.state, +H.st.toFixed(1), H.hp, H.guardBroken] })()"); print('after', st)
    strip(paths, 'break_strip', 3, lab); await b.close()

async def sc_arc(p):
    b, pg, logs, err = await open_page(p, 640, 480, '&kinds=soldier'); print('err', err, logs[:2])
    # an enemy behind the hero: guard is on but 180 deg away -> the hit lands in full
    await pg.evaluate("() => { const r = __rp4; r.setPos(0, 0, 0); " + CAMB + " const e = r.sim.spawn('soldier', 0, -2.4, {yaw: 0}); r.step(0.05); }")
    await pg.evaluate("__rp4.cmb.setBlock(true)"); paths = []; lab = []
    await run_to(pg, "r.sim.enemies[0].state === 'windup' && r.sim.enemies[0].sT > r.sim.enemies[0].K.tele * 0.8", 6.0); paths.append(await shot(pg, 'arc_0', (0, 0, 640, 480))); lab.append('attacker behind (arrow at the edge), guard up')
    await run_to(pg, "r.sim.events.some(x => x.type === 'block' || x.type === 'hero-hit')", 2.0); 
    ev = await pg.evaluate("JSON.stringify(__rp4.sim.events.filter(x => x.type==='block'||x.type==='hero-hit').map(x => [x.type, x.dmg, x.flag]))"); print('events', ev, 'heroYaw', await pg.evaluate("__rp4.sim.hero.yaw"))
    paths.append(await shot(pg, 'arc_1', (0, 0, 640, 480))); lab.append('hit lands (not blocked)')
    strip(paths, 'arc_strip', 2, lab); await b.close()

async def fxrun(p, fix, name, steps, kinds='soldier,beast', setup='', near=False):
    b, pg, logs, err = await open_page(p, 640, 480, f'&kinds={kinds}&fixture={fix}'); print(fix, 'err', err, logs[:3])
    await pg.evaluate("() => { const r = __rp4, s = r.sim; r.setPos(0, -1.5, 0); r.setCam(0.2, 0.22, 4.6, 50); "
      "s.spawn('soldier', -1.2, 4.2, {yaw: Math.PI, passive: true}); s.spawn('beast', 1.8, 5.2, {yaw: Math.PI, passive: true}); s.spawn('soldier', 0.2, 7.5, {yaw: Math.PI, passive: true}); for (const e of s.enemies) e.hp = e.hpMax = 9000; if (" + ('true' if near else 'false') + ") { const P = [[-1.3, 1.2], [1.6, 1.8], [0.2, 2.9]]; s.enemies.forEach((e, i) => { e.x = P[i][0]; e.z = P[i][1]; }); } for (const e of s.enemies) e.K = Object.assign({}, e.K, {speed: 0, reach: 0.05}); r.step(0.2); " + setup + " }")
    paths = []; lab = []
    for i, (act, cond, extra, label) in enumerate(steps):
        if act: await pg.evaluate(act)
        t = await run_to(pg, cond, 3.0) if cond else 0
        if extra: await pg.evaluate(extra)
        paths.append(await shot(pg, f'{name}_{i}', (20, 20, 620, 470))); lab.append(label + (' [cond timeout]' if t < 0 else ''))
    st = await pg.evaluate("(() => { const H = __rp4.sim.hero, s = __rp4.sim; return { hp: Math.round(H.hp), st: Math.round(H.st), sh: +H.sh.toFixed(1), en: s.enemies.map(e => [e.kind, Math.round(e.hp), +e.slowT.toFixed(1), +e.rootT.toFixed(1), +e.fzT.toFixed(1), +e.burnT.toFixed(1)]) }; })()"); print(name, st)
    strip(paths, name + '_strip', 2, lab); await b.close()

async def sc_fx(p):
    # ranged healer (plant): bow shot, heal, root snare
    await fxrun(p, 'ranged', 'fx_ranged', [
        ("__rp4.press('attack')", "r.sim.projectiles.some(q => q.on) && r.sim.projectiles.find(q => q.on).t > 0.0", "__rp4.step(0.03)", 'bow shot in flight (bolt)'),
        ("__rp4.step(0.9); __rp4.sim.hero.hp = 250; __rp4.press('skill1')", "r.sim.events.some(x => x.type === 'heal')", "__rp4.step(0.12)", 'heal: green motes + ring + +digit'),
        ("__rp4.step(1.3); __rp4.press('skill2')", "r.sim.events.some(x => x.type === 'burst')", "__rp4.step(0.25)", 'snare: ring, rooted enemies (green tint)'),
    ], near=True)

async def sc_fx2(p):
    await fxrun(p, 'spear', 'fx_spear', [
        ("__rp4.press('skill1')", "r.sim.projectiles.some(q => q.on) && r.sim.projectiles.find(q => q.on).t > 0.03", "", 'ice beads in flight'),
        ("__rp4.step(0.6)", "", "", 'beads hit: slowed (pale blue)'),
        ("__rp4.step(1.4); __rp4.press('skill2')", "r.sim.events.some(x => x.type === 'burst')", "__rp4.step(0.2)", 'nova: freeze (ice blue)'),
    ], near=True)
    await fxrun(p, 'hammer', 'fx_hammer', [
        ("__rp4.press('skill1')", "r.sim.events.some(x => x.type === 'burst')", "__rp4.step(0.08)", 'quake cone (100 deg)'),
        ("__rp4.step(1.2); __rp4.press('skill2')", "r.sim.events.some(x => x.type === 'shield')", "__rp4.step(0.25)", 'stone shield up'),
    ], near=True)

async def sc_fx3(p):
    await fxrun(p, 'daggers', 'fx_daggers', [
        ("__rp4.press('skill1')", "r.sim.projectiles.some(q => q.on) && r.sim.projectiles.find(q => q.on).t > 0.05", "", 'sling stone in flight'),
        ("__rp4.step(0.9)", "", "", 'burning enemy (orange flicker + digits)'),
        ("__rp4.step(1.5); __rp4.press('skill2')", "r.sim.events.some(x => x.type === 'burst')", "__rp4.step(0.15)", 'gust + quicken buff'),
    ], near=True)
    await fxrun(p, 'staff', 'fx_staff', [
        ("__rp4.press('attack')", "r.sim.projectiles.some(q => q.on) && r.sim.projectiles.find(q => q.on).t > 0.1", "", 'water bolt'),
        ("__rp4.step(0.9); __rp4.sim.hero.hp = 200; __rp4.press('skill1')", "r.sim.events.some(x => x.type === 'heal')", "__rp4.step(0.4)", 'healing rain (over time)'),
    ])

async def main():
    names = sys.argv[1:] or ['block']
    async with async_playwright() as p:
        for n in names: await globals()['sc_' + n](p)
asyncio.run(main())
