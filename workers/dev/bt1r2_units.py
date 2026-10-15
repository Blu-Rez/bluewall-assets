#!/usr/bin/env python3
# bt1r2_units.py [pages|all] — BT1_R2 job 3: the soldier -> model dev page (dev/bt1r2_units.html).  One PNG per page (5 unit keys a page: left of each pair = today's BODY, right = the table's MODEL / "no model" when the slot is empty)
# and <OUT>/units_report.json (state of every slot).   env: STAND=1 (dev stand-in file in the foot soldiers' slots)  BROKEN=1 (a slot with a missing file)  OUT=/home/claude/work/bt1r2/units  TAG=
import asyncio, json, os, sys
from playwright.async_api import async_playwright
OUT = os.environ.get('OUT', '/home/claude/work/bt1r2/units'); os.makedirs(OUT, exist_ok=True); TAG = os.environ.get('TAG', '')
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
async def main():
    sel = sys.argv[1] if len(sys.argv) > 1 else 'all'
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS); ctx = await b.new_context(viewport={'width': 1500, 'height': 620}, device_scale_factor=1)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300])); pg.on('console', lambda m: errs.append(m.type + ': ' + m.text[:300]) if m.type in ('error', 'warning') and '404' not in m.text else None)
        q = '?' + '&'.join(x for x in ['stand=1' if os.environ.get('STAND') else '', 'broken=1' if os.environ.get('BROKEN') else ''] if x)
        await pg.goto('http://127.0.0.1:8777/bt1r2_units.html' + q)
        for i in range(120):
            if await pg.evaluate('!!window.__unitsReady'): break
            await asyncio.sleep(0.5)
        n = await pg.evaluate('__units.pages'); pages = list(range(n)) if sel == 'all' else [int(x) for x in sel.split(',')]
        rep = {'pages': []}
        for k in pages:
            rows = await pg.evaluate('__units.show(%d)' % k)
            r = await pg.evaluate('__units.report()'); lab = await pg.evaluate('__units.labels()')
            await pg.evaluate("(L) => { document.querySelectorAll('.lb').forEach(e => e.remove()); for (const l of L) { const d = document.createElement('div'); d.className = 'lb'; d.textContent = l.key; d.style.cssText = 'position:absolute;left:' + (l.x - 60) + 'px;top:' + (l.y + 6) + 'px;width:230px;font:600 15px sans-serif;color:#fff;background:#0008;padding:2px 6px;border-radius:4px;white-space:nowrap'; document.body.appendChild(d); } }", lab)
            await pg.evaluate("(R) => { document.querySelectorAll('.st').forEach(e => e.remove()); const d = document.createElement('div'); d.className = 'st'; d.style.cssText = 'position:absolute;left:8px;top:6px;font:13px monospace;color:#fff;background:#000a;padding:4px 8px;white-space:pre'; d.textContent = R.rows.map(x => x.key + ': body=' + x.body + '  model=' + (x.model === 'body' ? '(no model - slot empty)' : x.model + ' ' + (x.file || '') + ' ' + (x.why || ''))).join('\\n'); document.body.appendChild(d); }", r)
            f = '%s/units%s_p%d.png' % (OUT, TAG, k); await pg.screenshot(path=f); r['png'] = f; rep['pages'].append(r)
            print('page', k, [(x['key'], x['model']) for x in rows], 'calls', r['calls'], 'tris', r['tris'], flush=True)
        rep['errors'] = errs[:12]; json.dump(rep, open('%s/units_report%s.json' % (OUT, TAG), 'w'), indent=1); print('ERRORS', errs[:6]); await b.close()
asyncio.run(main())
