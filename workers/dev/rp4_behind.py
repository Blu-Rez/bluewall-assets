# RP4 proof: the player watches from BEHIND.  Over-the-shoulder framing (no framing vs combat framing) + off-screen attacker arrows.   usage: python3 rp4_behind.py
import asyncio, sys
sys.path.insert(0, '/home/claude/dev')
from rp4_shot import *
from PIL import Image, ImageDraw
OUT = '/home/claude/work/rp4/photos/'
def lab(im, txt): d = ImageDraw.Draw(im); d.rectangle((0, 0, im.width, 22), fill=(0, 0, 0)); d.text((6, 5), txt, fill=(255, 255, 255)); return im
async def main():
    async with async_playwright() as p:
        # --- A: framing on / off, same moment (hero mid-combo, soldier straight ahead, the worst case for a back-camera)
        res = []
        for off in (0, 1):
            b, pg, logs, err = await open_page(p, 640, 480, '&kinds=soldier')
            await pg.evaluate("""(off) => { const r = __rp4; const e = r.sim.spawn('soldier', 0, 2.6, {yaw: Math.PI, passive: true}); e.hp = e.hpMax = 9999; r.setPos(0, -0.6, 0); r.setCam(0, 0.2, 3.6, 50); r.step(0.2); }""", off)
            if not off: await pg.evaluate("() => { __rp4.cmb.setFrame(0); }")
            await pg.evaluate("__rp4.press('lock'); __rp4.step(0.8, 1/60)"); await pg.evaluate("__rp4.press('attack')"); await pg.evaluate("() => { const r = __rp4, H = r.sim.hero; let g = 0; while (!(H.state === 'atk' && H.sT >= 0.24) && g++ < 300) r.step(1/60, 1/60); r.step(0.15, 1/60); r.press('attack'); g = 0; while (!(H.state === 'atk' && H.n === 1 && H.sT >= 0.26) && g++ < 300) r.step(1/60, 1/60); }")
            await pg.evaluate("__rp4.render()"); path = f'{OUT}behind_frame_{off}.png'; await pg.screenshot(path=path); res.append(path); print('frameK', await pg.evaluate("__rp4.cmb.stats().frameK")); await b.close()
        ims = [lab(Image.open(res[0]).convert('RGB'), 'framing OFF: the host camera as it is (0.55 m over her shoulder)'), lab(Image.open(res[1]).convert('RGB'), 'framing ON: + fight framing (up 0.3, back 0.6; sideways only if she is not already left of centre)')]
        s = Image.new('RGB', (1280, 480)); s.paste(ims[0], (0, 0)); s.paste(ims[1], (640, 0)); s.save(OUT + 'behind_framing.png')
        # --- B: attackers outside the frame -> red edge arrows
        b, pg, logs, err = await open_page(p, 640, 480, '&kinds=soldier,brute'); print('err', err, logs[:2])
        await pg.evaluate("""() => { const r = __rp4, s = r.sim; r.setPos(0, 0, 0); r.setCam(0, 0.2, 3.6, 50);
          const a = s.spawn('soldier', 0, 2.4, {yaw: Math.PI, passive: true}); a.hp = a.hpMax = 9999;                       // on screen, not attacking
          const l = s.spawn('soldier', -9, 0.5, {yaw: Math.PI / 2, passive: true}); l.state = 'windup'; l.sT = 0.2;       // off the left edge (forced windup for the picture)
          const k = s.spawn('brute', 1.2, -7.5, {yaw: 0, passive: true}); k.state = 'windup'; k.sT = 0.3;                  // behind the camera
          l.passive = false; k.passive = false; r.step(0.05, 1/60); }""")
        paths = []
        for i in range(3):
            await pg.evaluate("() => { const r = __rp4; r.step(0.12, 1/60); }")
            await pg.evaluate("__rp4.render()"); path = f'{OUT}behind_alert_{i}.png'; await pg.screenshot(path=path); paths.append(path)
        print('alerts', await pg.evaluate("JSON.stringify(__rp4.cmb.stats().alerts)"), await pg.evaluate("JSON.stringify(__rp4.sim.enemies.map(e => e.kind + ':' + e.state))")); await b.close()
        ims = [lab(Image.open(f).convert('RGB'), t) for f, t in zip(paths, ['windup: arrows left + bottom', '+0.12 s', '+0.24 s'])]
        s = Image.new('RGB', (1920, 480)); [s.paste(im, (i * 640, 0)) for i, im in enumerate(ims)]; s.save(OUT + 'behind_alerts.png')
asyncio.run(main())
