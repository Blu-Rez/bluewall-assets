# WC1 in-game proof: the REAL fx.js + carry.js in the RP4 arena (dev/rp4_dev.html), fixtures WC1_* (library sword file, class set by `kind`).  Checks the state machine and saves frames 844x390.
#   usage: python3 wc1_game.py [fixture ...]   -> /home/claude/work/wc1/out/game_<fixture>_<phase>_<view>.png + game_report.json ; prints "WC1 GAME OK" when every check passes
import asyncio, sys, json, math
sys.path.insert(0, '/home/claude/dev')
import rp4_shot
rp4_shot.URL = 'http://127.0.0.1:8777/rp4_dev.html'
from rp4_shot import *
OUT = '/home/claude/work/wc1/out/'
FIX = {'WC1_SWORD': 'hip', 'WC1_BIG': 'back', 'WC1_PAIR': 'hip', 'WC1_STAFF': 'hand', 'WC1_BOW': 'back'}
VIEWS = {'behind': (0, 0.12, 3.0, 40), 'left': (-math.pi / 2, 0.12, 3.0, 40)}
async def shots(pg, fx, phase):
    for v, (yaw, pit, dist, fov) in VIEWS.items():
        await pg.evaluate("([a,b,c,d]) => { __rp4.setCam(a,b,c,d); __rp4.cmb.setFrame(0); __rp4.render(); }", [yaw, pit, dist, fov]); await pg.screenshot(path=f'{OUT}game_{fx}_{phase}_{v}.png')
async def run(p, fx):
    b, pg, logs, err = await open_page(p, 844, 390, '&kinds=soldier&fixture=' + fx)
    rep = dict(fixture=fx, err=err, checks=[], logs=[l for l in logs if 'toNonIndexed' not in l][:3])
    def ck(name, ok, extra=''): rep['checks'].append(dict(name=name, ok=bool(ok), extra=str(extra))); print(('  ok  ' if ok else '  FAIL ') + name, extra)
    if err: ck('page boot', False, err); await b.close(); return rep
    await pg.evaluate("() => { const r = __rp4; r.setPos(0, 0, 0, 0); r.sim.enemies.splice(0); r.step(0.5, 1/60); }")
    st = lambda: pg.evaluate("() => __rp4.cmb.carry.state()")
    both = "() => { const c = __rp4.cmb.carry; return c.state().every(s => s.parent) }"
    s0 = await st(); want = FIX[fx]
    ck(fx + ': at rest every weapon is at its mount (carry=' + want + ')', all(s['where'] == ('hand' if s['carry'] == 'hand' else 'carry') and (s['carry'] == want or s['kind'] == 'quiver') for s in s0) , [(s['kind'], s['where'], s['parent']) for s in s0])
    await shots(pg, fx, '0rest')
    # a dummy straight ahead, then attack
    await pg.evaluate("() => { const r = __rp4; r.sim.spawn('soldier', 0, 2.2, { yaw: Math.PI, passive: true }).hp = 9999; r.setCam(0, 0.2, 3.4, 50); r.press('attack'); }")
    t = await until(pg, "r.sim.hero.state === 'atk'", 0.5); ck('attack starts', t >= 0, round(t, 3))
    await pg.evaluate("__rp4.step(0.03, 1/60)"); s1 = await st(); mid = [s for s in s1 if s['carry'] != 'hand']
    ck('mid-swap: the weapon is scaling (never visible in two places)', all(0 < s['scale'] <= 1.0 for s in s1) and all(s['parent'] for s in s1), [(s['kind'], s['phase'], round(s['scale'], 2)) for s in s1])
    await shots(pg, fx, '1draw')
    await pg.evaluate("__rp4.step(0.13, 1/60)"); s2 = await st()
    ck('0.16 s after the attack: the weapon is in the hand (a quiver stays on the hip)', all(s['phase'] == 0 and s['where'] == ('carry' if s['kind'] == 'quiver' else 'hand') for s in s2), [(s['kind'], s['where'], s['parent']) for s in s2])
    await shots(pg, fx, '2fight')
    # keep the fight on for a moment (hit), then end it: enemies gone, no input
    await pg.evaluate("__rp4.step(0.4, 1/60)")
    h = await pg.evaluate("() => ({ n: __rp4.sim.hero.n, st: __rp4.sim.hero.state, hits: __rp4.sim.events ? __rp4.sim.events.length : -1 })"); rep['hero'] = h
    await pg.evaluate("() => { const r = __rp4; r.sim.enemies.splice(0); r.input(0, 0); }")
    await until(pg, "r.sim.hero.state === 'loco' && r.sim.hero.hasLock === false", 3.0)
    t0 = await pg.evaluate("() => { const r = __rp4; let n = 0; return n; }")
    await pg.evaluate("__rp4.step(2.4, 1/60)"); s3 = await st()
    ck('2.4 s after the last blow: still in the hand (3 s linger)', all(s['where'] == 'hand' for s in s3 if s['carry'] != 'hand' and s['kind'] != 'quiver'), [(s['kind'], s['where']) for s in s3])
    await shots(pg, fx, '3linger')
    await pg.evaluate("__rp4.step(1.2, 1/60)"); s4 = await st()
    ck('3.6 s after the last blow: sheathed again', all(s['where'] == ('hand' if want == 'hand' else 'carry') and s['phase'] == 0 for s in s4 if s['kind'] != 'quiver'), [(s['kind'], s['where'], s['parent']) for s in s4])
    await shots(pg, fx, '4sheathed')
    # never both mounts visible: scan 600 ticks of a second fight, every weapon has exactly one parent that is the hand OR the mount bone
    bad = await pg.evaluate("""() => { const r = __rp4; r.sim.spawn('soldier', 0, 2.2, { yaw: Math.PI, passive: true }).hp = 9999; let bad = 0; for (let i = 0; i < 600; i++) { if (i % 40 === 0) r.press('attack'); r.step(1/60, 1/60); for (const s of r.cmb.carry.state()) { if (!s.parent) bad++; if (s.phase === 0 && s.scale < 0.999) bad++; } } return bad; }""")
    ck('600 ticks of fighting: every weapon always has exactly one parent and a whole scale outside the swap', bad == 0, bad)
    st2 = await pg.evaluate("() => { const s = __rp4.cmb.stats(); return { own: s.ownCalls, carryCalls: s.carryCalls }; }"); rep['stats'] = st2; print('  calls:', st2)
    ck('no page errors', not [l for l in rep['logs'] if 'PAGEERR' in l or l.startswith('error')], rep['logs'])
    await b.close(); return rep
async def main():
    fxs = sys.argv[1:] or list(FIX); reps = []
    async with async_playwright() as p:
        for fx in fxs: print(fx); reps.append(await run(p, fx))
    json.dump(reps, open(OUT + 'game_report.json', 'w'), indent=1)
    allok = all(c['ok'] for r in reps for c in r['checks']); print('WC1 GAME OK' if allok else 'WC1 GAME FAILED')
asyncio.run(main())
