import asyncio, io, math, struct, wave
from playwright.async_api import async_playwright
def wav(sec=1.5, f=220):
    b = io.BytesIO(); w = wave.open(b, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(22050)
    w.writeframes(b''.join(struct.pack('<h', int(8000*math.sin(2*math.pi*f*i/22050))) for i in range(int(22050*sec)))); w.close(); return b.getvalue()
W = wav()
JS = r'''
async () => {
  const B = __bw, a = B.audio, c = a.ctx;
  const an = c.createAnalyser(); an.fftSize = 2048; a.master.connect(an);
  const buf = new Float32Array(2048);
  const peak = () => { an.getFloatTimeDomainData(buf); let m = 0; for (const v of buf) m = Math.max(m, Math.abs(v)); return m; };
  // silence the ambience/music so only the battle sounds are measured
  a.music.gain.value = 0; a.amb.gain.value = 0;
  const s = B.battle.session, sfx = s.sfx, out = {};
  const cam = s.camera.position, x = cam.x, z = cam.z - 60;
  const run = async (name, fn) => { await new Promise((r) => setTimeout(r, 700)); let m = 0; fn(); for (let i = 0; i < 25; i++) { await new Promise((r) => setTimeout(r, 30)); m = Math.max(m, peak()); } out[name] = +m.toFixed(3); };
  for (const n of ['sword', 'arrow', 'thud', 'stone', 'rock', 'launch', 'collapse', 'breath', 'clang', 'hurt', 'bolt', 'roar', 'pop']) await run(n, () => sfx.at(n, x, 5, z, 1));
  await run('horn', () => sfx.horn()); await run('fanfare', () => sfx.fanfare(true)); await run('defeat', () => sfx.fanfare(false));
  out.state = c.state; out.began = a.began;
  return JSON.stringify(out);
}
'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page(viewport={'width':390,'height':844})
        logs=[]; pg.on('console', lambda m: logs.append(m.type+': '+m.text[:200]) if m.type in ('error',) and '404' not in m.text else None); pg.on('pageerror', lambda e: logs.append('PAGEERR '+str(e)[:300]))
        async def audio(route): await route.fulfill(status=200, body=W, content_type='audio/wav')
        await pg.route('**/assets/audio/*.mp3', audio)
        await pg.goto('http://127.0.0.1:8777/dev_dbg.html?q=low&h=14&w=clear&wa=1')
        for i in range(400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(300):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(window.__bw && window.__bw.lateReady)'): break
        await pg.mouse.click(180, 320); await asyncio.sleep(2)
        print('began', await pg.evaluate('__bw.audio.began'), await pg.evaluate('__bw.audio.ctx && __bw.audio.ctx.state'))
        await pg.evaluate("document.querySelector('.bwa-btn').click()")
        for i in range(400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        await asyncio.sleep(3)
        print(await pg.evaluate(JS))
        for l in logs[:10]: print(l)
        await b.close()
asyncio.run(main())
