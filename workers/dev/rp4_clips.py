# RP4 proof: contact strips of the 4 real hero clips (slash_a / slash_b / slash_c / heavy) played by the combat engine with the sword in her hand.
# usage: python3 rp4_clips.py <name> <camYaw> <pitch> <dist> [kind]
import asyncio, sys
sys.path.insert(0, '/home/claude/dev')
from rp4_shot import *
from PIL import Image, ImageDraw
OUT = '/home/claude/work/rp4/photos/'
name, yaw, pitch, dist = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]); kind = sys.argv[5] if len(sys.argv) > 5 else 'soldier'
TIMES = [[0.04, 0.12, 0.19, 0.24, 0.30, 0.40], [0.06, 0.15, 0.22, 0.28, 0.36, 0.50], [0.03, 0.20, 0.31, 0.37, 0.43, 0.60], [0.12, 0.23, 0.30, 0.37, 0.63, 0.80]]
async def main():
    async with async_playwright() as p:
        b, pg, logs, err = await open_page(p, 640, 540, '&kinds=' + kind)
        print('err', err, logs[:3])
        await pg.evaluate("""([yaw, pitch, dist, kind]) => { const r = __rp4; const e = r.sim.spawn(kind, 0, 2.4, {yaw: Math.PI, passive: true}); e.hp = e.hpMax = 99999; r.setPos(0, -0.6, 0); r.setCam(yaw, pitch, dist, 46); r.step(0.4); }""", [yaw, pitch, dist, kind])
        rows = []
        for n in range(4):
            frames = []
            for i, t in enumerate(TIMES[n]):
                ok = await pg.evaluate("""([n, t, first]) => { const r = __rp4, H = r.sim.hero; if (first) { let g = 0; while (H.state !== 'loco' && g++ < 400) r.step(1/60, 1/60); H.graceN = n - 1; H.grace = 9; r.press('attack'); } let g = 0; while (!(H.state === 'atk' && H.n === n && H.sT >= t) && g++ < 400) r.step(1/60, 1/60); return g < 400; }""", [n, t, i == 0])
                await pg.evaluate("__rp4.render()"); path = f'{OUT}{name}_{n}_{i}.png'; await pg.screenshot(path=path); frames.append(path)
            rows.append(frames)
        print(await pg.evaluate("JSON.stringify(__rp4.cmb.stats())")); print(logs[:4]); await b.close()
    cw, ch = 360, 400; L, Tp = 140, 110
    sheet = Image.new('RGB', (cw * 6, ch * 4)); d = ImageDraw.Draw(sheet)
    for n, fr in enumerate(rows):
        for i, f in enumerate(fr):
            im = Image.open(f).crop((L, Tp, L + cw, Tp + ch)); sheet.paste(im, (i * cw, n * ch)); d.text((i * cw + 6, n * ch + 6), f"{['slash_a','slash_b','slash_c','heavy'][n]}  {TIMES[n][i]:.2f}s", fill=(255, 255, 255))
        Image.open(f'{OUT}{name}_{n}_0.png')
    sheet.save(OUT + name + '_sheet.png'); print('saved', OUT + name + '_sheet.png', sheet.size)
asyncio.run(main())
