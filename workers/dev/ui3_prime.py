# ui3_prime.py [n] — UI3: fill every training queue of the (rig) page with n units, like the real game state that made the barracks sheet 83 % high.
import asyncio, os, sys
from playwright.async_api import async_playwright
from ui1r4_common import *
N = int(sys.argv[1]) if len(sys.argv) > 1 else 6
JS = """(n) => { const e = __bw.econ, a = e.st.army, now = e.now(); const by = {}; let c = 0; for (const [k, u] of Object.entries(a.units)) (by[u.fam] = by[u.fam] || []).push(k);
  for (const f of Object.keys(by)) { const ks = by[f], fam = a.fam[f]; fam.q = []; for (let i = 0; i < n; i++) { fam.q.push({ u: ks[i % Math.min(2, ks.length)], n: 1, t: 12, fin: now + 12 * (i + 1) }); c++; } }
  e._emit({ army: 'train', ok: true }); return c; }"""
async def main():
    async with async_playwright() as p:
        b, pg = await get_page(p, os.environ.get('TAG', 'rig')); assert pg
        await pg.evaluate(PREP); print('queued', await pg.evaluate(JS, N))
asyncio.run(main())
