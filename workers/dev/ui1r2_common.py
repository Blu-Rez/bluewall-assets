import asyncio, json, time, sys
from playwright.async_api import async_playwright
import os
CDP = 'http://127.0.0.1:' + os.environ.get('CDPPORT', '9222')
async def get_page(p, tag):
    b = await p.chromium.connect_over_cdp(CDP)
    ctx = b.contexts[0]
    for pg in ctx.pages:
        if f'ui1r2_{tag}.html' in pg.url: return b, pg
    return b, None
PREP = """() => {
  const e = __bw.econ, P = e.st.prog, now = () => e.now();
  for (const [k, r] of Object.entries(P.structs)) { r.lv = k === 'keep' ? 13 : 12; r.up = null; r.next = { to: r.lv + 1, ok: true, cost: { ruby: 1200, emerald: 640 }, dur: 14400, info: {} }; }
  P.b.keep = 13; P.builders = 3; P.builders_busy = 0; e.st.gems.turq = 3400; e.st.army.space = Math.floor(e.st.army.cap * 0.35); e.st.army.queued = 0; for (const f of Object.values(e.st.army.fam)) f.used = Math.floor(f.cap * 0.3);
  window.__calls = [];
  e.upgrade = async (op, ent) => { window.__calls.push(['upgrade', op, ent]); const r = P.structs[ent]; if (!r) return { ok: false, why: 'bad' };
    if (op === 'start') { r.up = { to: r.lv + 1, end: now() + 14400, dur: 14400, rush: 60, rush_cut: 0, rush_full: true }; r.next = null; P.builders_busy++; }
    else if (op === 'speedup') { r.lv = r.up.to; r.up = null; r.next = { to: r.lv + 1, ok: true, cost: { ruby: 1300, emerald: 700 }, dur: 15000, info: {} }; P.builders_busy--; e.st.gems.turq -= 60; }
    else if (op === 'cancel') { r.up = null; r.next = { to: r.lv + 1, ok: true, cost: { ruby: 1200, emerald: 640 }, dur: 14400, info: {} }; P.builders_busy--; }
    e._emit({ upgrade: op, ent, ok: true }); return { ok: true, info: {} }; };
  e.army = async (op, body) => { window.__calls.push(['army', op, body && body.u]); if (op === 'train') { const u = e.st.army.units[body.u], f = e.st.army.fam[u.fam]; f.q.push({ u: body.u, n: body.n, t: 12, fin: now() + 12 * body.n }); e._emit({ army: op, ok: true }); return { ok: true }; } return { ok: false, why: 'bad' }; };
  return { structs: Object.keys(P.structs).length, units: Object.keys(e.st.army.units).length, fams: Object.keys(e.st.army.fam) };
}"""
async def load(p, tag, w=390, h=844):
    b, pg = await get_page(p, tag)
    if pg is None:
        ctx = b.contexts[0]; pg = ctx.pages[0] if (ctx.pages and ctx.pages[0].url == 'about:blank') else await ctx.new_page()
        await pg.set_viewport_size({'width': w, 'height': h})
        pg.on('pageerror', lambda e: print('PAGEERR', str(e)[:300], flush=True))
        await pg.goto(f'http://127.0.0.1:8777/ui1r2_{tag}.html?q=low&w=clear&h=14&wa=0.1&lv=30')
        t0 = time.time()
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(900):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        print('loaded', round(time.time() - t0), flush=True); await asyncio.sleep(3)
        await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) c.intro=null; }')
        print(json.dumps(await pg.evaluate(PREP)), flush=True)
    return b, pg
