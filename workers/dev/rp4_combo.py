# RP4 proof: 6-frame strip of the 4-hit combo.   usage: python3 rp4_combo.py <name> <camYaw> <kind>
import asyncio, sys
sys.path.insert(0, '/home/claude/dev')
from rp4_shot import *
from PIL import Image
OUT = '/home/claude/work/rp4/'
name, yaw, kind = sys.argv[1], float(sys.argv[2]), sys.argv[3]
async def main():
    async with async_playwright() as p:
        b, pg, logs, err = await open_page(p, 640, 540, '&kinds=' + kind)
        print('err', err, logs[:3])
        await pg.evaluate("""([yaw, kind]) => { const r = __rp4; const e = r.sim.spawn(kind, 0, 2.2, {yaw: Math.PI, passive: true}); e.hp = e.hpMax = 5000; r.setPos(0, -0.6, 0); r.setCam(yaw, 0.14, 3.7, 38); r.step(0.3); }""", [yaw, kind])
        caps = [(0, 0.10), (0, 0.24), (1, 0.26), (2, 0.16), (3, 0.30), (3, 0.42)]
        await pg.evaluate("__rp4.press('attack')"); frames = []
        for i, (n, st) in enumerate(caps):
            for k in range(400):
                r = await pg.evaluate("""([n, st]) => { const r = __rp4, H = r.sim.hero; if (H.state === 'atk' && H.n === n && H.sT >= st) return 1; if (H.state === 'atk' && H.sT > 0.05 && H.buf.attack <= 0.01 && H.n < 3) r.press('attack'); r.step(1/60, 1/60); return 0; }""", [n, st])
                if r: break
            await pg.evaluate("__rp4.render()"); path = f'{OUT}{name}_{i}.png'; await pg.screenshot(path=path); frames.append(path)
        print(await pg.evaluate("JSON.stringify(__rp4.cmb.stats())")); print(logs[:4])
        ims = [Image.open(f).crop((100, 120, 540, 540)) for f in frames]; W = sum(i.width for i in ims[:3]); strip = Image.new('RGB', (W, ims[0].height * 2)); 
        for j, im in enumerate(ims): strip.paste(im, ((j % 3) * im.width, (j // 3) * im.height))
        strip.save(OUT + name + '_strip.png'); await b.close()
asyncio.run(main())
