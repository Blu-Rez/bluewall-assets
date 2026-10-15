#!/usr/bin/env python3
# rp1c_f9_test.py — RP1C_R3 (PF1 F9): the shader programs the hero's FIRST frames ask for are built behind the loading card, not at the first hero frame.
#   A fresh page at NIGHT, phone flag on (hero mode on a phone drops the bloom composer = a new draw path), the hero is started the moment the game says __ready (before the idle warm has finished);
#   we print the programs before start / after start (warm included) / after 4 drawn hero frames, with and without the warm (window.__rpNoWarm).  usage: python3 rp1c_f9_test.py [warm|nowarm|both] [q=low|high]
import asyncio, json, sys, os, subprocess, socket, time
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; PORT = int(os.environ.get('RP1C_F9_PORT', 8781))
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
mode = sys.argv[1] if len(sys.argv) > 1 else 'both'; Q = sys.argv[2] if len(sys.argv) > 2 else 'low'
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
JS = """(async () => {
  const R = __bw.renderer, wait = (ms) => new Promise((r) => setTimeout(r, ms)); window.__rpPhone = true; window.__rpNoWarm = %s;
  const names = () => R.info.programs.map((p) => (p.name || '?') + ':' + p.cacheKey.length);
  const late0 = !!__bw.lateReady, p0 = R.info.programs.length, n0 = names();
  await window.__rpLoad('?v=' + Date.now()); const api = window.__rp; const t0 = performance.now();
  await api.start('elina');
  const tStart = Math.round(performance.now() - t0), p1 = R.info.programs.length, n1 = names(), w = api.warmed ? api.warmed() : null, S = api.S; let c = 0;
  S.hero.blob.onBeforeRender = () => { c++; };
  const t1 = performance.now(); while (c < 4 && performance.now() - t1 < 180000) await wait(500);
  const p2 = R.info.programs.length, n2 = names(); const diff = (a, b) => { const m = {}; for (const x of a) m[x] = (m[x] || 0) + 1; const o = []; for (const x of b) { if (m[x]) m[x]--; else o.push(x); } return o; };
  return JSON.stringify({ lateReadyAtStart: late0, before: p0, afterStart: p1, afterFirst4Frames: p2, frames: c, addedByStart: p1 - p0, growthAtFirstFrames: p2 - p1, warmed: w, startMs: tStart, startAdded: diff(n0, n1).slice(0, 30), frameAdded: diff(n1, n2).slice(0, 30) });
})()"""
async def one(p, noWarm):
    b = await p.chromium.launch(args=ARGS)
    pg = await b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=1, has_touch=True, is_mobile=True)
    await pg.goto('http://127.0.0.1:%d/rp1_dev.html?q=%s&w=clear&h=22&wa=0.1' % (PORT, Q))
    for i in range(1800):
        await asyncio.sleep(0.5)
        if await pg.evaluate('!!window.__ready'): break
    r = json.loads(await pg.evaluate(JS % ('true' if noWarm else 'false'))); await b.close(); return r
async def main():
    srv = None
    if not up(): srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    out = {}
    try:
        async with async_playwright() as p:
            if mode in ('nowarm', 'both'): out['nowarm'] = await one(p, True); print('nowarm', json.dumps(out['nowarm']), flush=True)
            if mode in ('warm', 'both'): out['warm'] = await one(p, False); print('warm', json.dumps(out['warm']), flush=True)
    finally:
        if srv: srv.terminate()
    ok = True
    if 'warm' in out: ok = out['warm']['growthAtFirstFrames'] <= max(1, out.get('nowarm', {}).get('growthAtFirstFrames', 99) - 1) and out['warm']['frames'] >= 4
    print('F9 OK' if ok else 'F9 FAILED'); sys.exit(0 if ok else 1)
asyncio.run(main())
