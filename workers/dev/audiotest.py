# Audio start-up test: serves synthetic wavs for /assets/audio/*.mp3 (the real files are not in the dev tree), checks that
# the context is prepared + loops decoded BEFORE the first tap, and that one tap resumes everything.
import asyncio, io, math, struct, wave, json, os
from playwright.async_api import async_playwright
def wav(sec=1.5, f=220):
    b = io.BytesIO(); w = wave.open(b, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(22050)
    w.writeframes(b''.join(struct.pack('<h', int(8000*math.sin(2*math.pi*f*i/22050))) for i in range(int(22050*sec)))); w.close(); return b.getvalue()
W = wav()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':360,'height':640})
        logs=[]; pg.on('console', lambda m: logs.append(m.type+': '+m.text[:200])); pg.on('pageerror', lambda e: logs.append('PAGEERR '+str(e)[:300]))
        async def audio(route): await route.fulfill(status=200, body=W, content_type='audio/wav')
        await pg.route('**/assets/audio/*.mp3', audio)
        await pg.goto('http://127.0.0.1:8777/dev.html?q=low&h=12&w=clear&wa=600')
        for i in range(400):
            await asyncio.sleep(0.25)
            if await pg.evaluate('!!window.__ready'): break
        await asyncio.sleep(12)
        S = 'JSON.stringify({state: __bw.audio.ctx && __bw.audio.ctx.state, loops: Object.keys(__bw.audio.loops).length, bufs: Object.keys(__bw.audio.buf).length, began: __bw.audio.began, musicOK: __bw.audio.musicOK, fade: __bw.audio.fade && +__bw.audio.fade.gain.value.toFixed(2), elPaused: __bw.audio.el && __bw.audio.el.paused, src: __bw.audio.el && __bw.audio.el.src.split("/").pop()})'
        print('BEFORE TAP', await pg.evaluate(S))
        await pg.mouse.click(180, 320)
        await asyncio.sleep(0.15); print('TAP+0.15s ', await pg.evaluate(S))
        await asyncio.sleep(1.2);  print('TAP+1.35s ', await pg.evaluate(S))
        await pg.evaluate('__bw.audio.update(1, {P: __bw.P(), world: __bw.world, camera: __bw.camera})')
        await asyncio.sleep(0.3);    print('after update ', await pg.evaluate('JSON.stringify(Object.fromEntries(Object.entries(__bw.audio.loops).map(([k,g])=>[k,+g.gain.value.toFixed(2)])))'))
        for l in logs[-8:]: print(l)
        await b.close()
asyncio.run(main())
