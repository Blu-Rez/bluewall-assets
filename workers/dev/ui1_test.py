import asyncio, json, sys
from playwright.async_api import async_playwright
# UI1: every sheet kind in every state, at 390x844 portrait and 844x390 landscape, on the REAL bsheet.js: no console errors, every button >= 44 px, no overlap, nothing outside the viewport,
# no endless animation, no backdrop-filter, no text below 11 px, the sheet fits the screen.   Exit code 1 + a list on any violation.
DEFS = json.load(open('/home/claude/bot/bluebot_v2/bluewall/client/src/unitdefs.json'))
UNITS = {}
for f in ('barracks', 'training', 'stable', 'workshop', 'lair'):
    us = [u for u in DEFS['order'] if DEFS['units'][u]['fam'] == f]
    for i, u in enumerate(us): UNITS[u] = {'open': i < len(us) - 1, 'n': 5}
PREP = {
 'normal': "() => {}",
 'upgrading': "(id) => { const r = __H.structs[id]; if (r) { r.up = { to: r.lv + 1, end: __H.NOW + 8000, dur: 14400, rush: 60, rush_cut: 0, rush_full: true }; r.next = null; } }",
 'reserved': "(id) => { const r = __H.structs[id]; if (r) { r.up = { to: r.lv + 1, dur: 14400, reserved: true }; r.next = null; } }",
 'maxed': "(id) => { const r = __H.structs[id]; if (r) r.next = null; }",
 'locked_cap': "(id) => { const r = __H.structs[id]; if (r) r.next = { ok: false, to: r.lv + 1, why: 'cap', cost: { ruby: 1200, emerald: 640 }, dur: 14400, info: { need_keep: 14 } }; }",
 'cannot_afford': "(id) => { __H.have.ruby = 300; const r = __H.structs[id]; if (r) r.next = { ok: false, to: r.lv + 1, why: 'gems', cost: { ruby: 1200, emerald: 640 }, dur: 14400, info: {} }; }",
 'ready': "() => { __H.setReady(6302); }", 'empty': "() => { __H.setReady(0); }", 'full': "() => { __H.setReady(99999); }",
}
KINDS = [('keep', ['normal', 'upgrading', 'reserved', 'maxed', 'locked_cap', 'cannot_afford']), ('wall', ['normal', 'upgrading', 'locked_cap', 'cannot_afford']), ('towers', ['normal', 'maxed']), ('forge', ['normal', 'upgrading', 'cannot_afford']),
 ('barracks', ['normal', 'upgrading', 'locked_cap']), ('training', ['normal']), ('stable', ['normal']), ('workshop', ['normal']), ('lair', ['normal']),
 ('mine_ruby', ['ready', 'empty', 'full', 'upgrading']), ('mine_emerald', ['ready']), ('mine_turq', ['ready']), ('vault_ruby', ['normal', 'maxed']), ('vault_emerald', ['normal']), ('vault_turq', ['normal']),
 ('ws:fishery_river', ['normal']), ('ws:lumber1', ['normal']), ('ws:farm1', ['normal']), ('ws:smelter1', ['normal']), ('home:1', ['normal']), ('home:2', ['normal']), ('civic:1', ['normal']), ('civic:2', ['normal'])]
AUDIT = """() => { const s = document.querySelector('.bsh.on'); if (!s) return { open: false, v: ['sheet did not open'] }; const V = [], R = s.getBoundingClientRect();
  const vis = (x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(x).visibility !== 'hidden'; };
  const btns = [...s.querySelectorAll('button')].filter(vis); const clip = (x) => { const r = x.getBoundingClientRect(), k = x.closest('[data-keep]'); if (!k) return r; const c = k.getBoundingClientRect(); return { left: Math.max(r.left, c.left), right: Math.min(r.right, c.right), top: Math.max(r.top, c.top), bottom: Math.min(r.bottom, c.bottom) }; };
  const rects = btns.map((x) => ({ t: (x.textContent || '').trim().slice(0, 16) || x.getAttribute('aria-label') || x.className, r: x.getBoundingClientRect(), c: clip(x), keep: !!x.closest('[data-keep]') }));
  for (const q of rects) if (q.r.width < 43.5 || q.r.height < 43.5) V.push('target<44 ' + q.t + ' ' + Math.round(q.r.width) + 'x' + Math.round(q.r.height));
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) { const a = rects[i].c, c = rects[j].c; if (a.right <= a.left || c.right <= c.left) continue; if (rects[i].keep && rects[j].keep) continue; if (a.left < c.right - 0.5 && c.left < a.right - 0.5 && a.top < c.bottom - 0.5 && c.top < a.bottom - 0.5) V.push('overlap ' + rects[i].t + ' / ' + rects[j].t); }
  for (const x of s.querySelectorAll('*')) { if (!vis(x)) continue; const cs = getComputedStyle(x); if ([...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(cs.fontSize) < 11) V.push('font<11 ' + x.className + ' ' + cs.fontSize);
    if (cs.animationName !== 'none' && cs.animationIterationCount === 'infinite') V.push('infinite animation ' + x.className); if (cs.backdropFilter && cs.backdropFilter !== 'none') V.push('backdrop-filter ' + x.className); }
  if (R.left < -0.5 || R.right > innerWidth + 0.5 || R.top < -0.5 || R.bottom > innerHeight + 0.5) V.push('sheet outside the viewport ' + [R.left, R.top, R.right, R.bottom].map(Math.round));
  for (const q of rects) if (!q.keep && (q.r.top < R.top - 0.5 || q.r.bottom > R.bottom + 0.5 || q.r.bottom > innerHeight + 0.5)) V.push('button cut off / below the fold ' + q.t);
  if (document.documentElement.scrollWidth > innerWidth) V.push('horizontal scroll');
  if (s.scrollHeight > s.clientHeight + 1 && getComputedStyle(s).overflowY === 'visible') V.push('content cut');
  return { open: true, v: V, h: Math.round(R.height), t: (s.querySelector('.bsh-t b') || {}).textContent }; }"""
async def main():
    bad = []; n = 0; mx = {}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for (w, h, tag) in ((390, 844, 'portrait'), (844, 390, 'landscape')):
            pg = await b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1); logs = []
            pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300])); pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:200]) if m.type in ('error', 'warning') else None)
            for (id_, states) in KINDS:
                for st in states:
                    await pg.goto('file:///home/claude/dev/ui1_h.html'); await pg.wait_for_function('window.__ready')
                    await pg.evaluate("(u) => Object.assign(__H.econ.st.army.units, u)", UNITS)
                    await pg.evaluate("() => __H.reset()")
                    base = id_ if id_ in ('keep', 'wall', 'towers', 'forge', 'barracks', 'training', 'stable', 'workshop', 'lair') or id_.startswith(('mine_', 'vault_')) else None
                    await pg.evaluate(PREP[st], base)
                    ok = await pg.evaluate("(id) => __sheets.open(id, {})", id_)
                    await asyncio.sleep(0.75); n += 1
                    if not ok: bad.append(f'{tag} {id_}/{st}: open() returned false'); continue
                    a = await pg.evaluate(AUDIT)
                    for v in a['v']: bad.append(f'{tag} {id_}/{st}: {v}')
                    if a.get('h'): mx[tag] = max(mx.get(tag, 0), a['h'])
            for l in logs[:10]:
                if 'ERR_FILE_NOT_FOUND' in l: continue
                bad.append(f'{tag} console: {l}')
            await pg.close()
        await b.close()
    # motion: open 320 ms / close 220 ms (the computed transition of the sheet), the sheet really slides in
    async with async_playwright() as p2:
        b2 = await p2.chromium.launch(); pg = await b2.new_page(viewport={'width': 390, 'height': 844}); await pg.goto('file:///home/claude/dev/ui1_h.html'); await pg.wait_for_function('window.__ready')
        closed = await pg.evaluate("() => getComputedStyle(document.querySelector('.bsh')).transitionDuration.split(',')[0].trim()")
        await pg.evaluate("() => __sheets.open('keep', {})"); await asyncio.sleep(0.15)
        opened = await pg.evaluate("() => getComputedStyle(document.querySelector('.bsh.on')).transitionDuration.split(',')[0].trim()")
        await asyncio.sleep(0.5); tf = await pg.evaluate("() => getComputedStyle(document.querySelector('.bsh.on')).transform")
        await pg.evaluate("() => __sheets.close()"); await asyncio.sleep(0.5); gone = await pg.evaluate("() => getComputedStyle(document.querySelector('.bsh')).visibility")
        await b2.close()
    print('motion: closed rule', closed, '| open rule', opened, '| open transform', tf, '| after close visibility', gone)
    if closed != '0.22s' or opened != '0.32s' or tf != 'none' or gone != 'hidden': bad.append(f'motion timing {closed} {opened} {tf} {gone}')
    print(f'UI1 render: {n} sheets, tallest {mx}')
    if bad:
        print('FAIL'); [print(' ', x) for x in bad[:40]]; sys.exit(1)
asyncio.run(main())
