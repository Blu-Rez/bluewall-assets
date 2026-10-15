#!/usr/bin/env python3
# pf1/table.py <before.json> <after.json> — markdown tables for report_PF1.md: per view and CPU throttle (1x / 4x / 6x): JS ms per frame, render submit, draw calls, triangles, shadow-pass calls, allocation; and a per-system split of the map view.
import json, sys
A, B = json.load(open(sys.argv[1])), json.load(open(sys.argv[2]))
def g(R, v, th, f):
    s = (R['views'].get(v) or {}).get(th) or {}
    return s.get(f)
def d(a, b):
    if a is None or b is None or not a: return '—'
    return '%+.0f%%' % (100.0 * (b - a) / a)
print('| view | CPU | JS ms/frame before → after | Δ | render(submit) ms | draw calls | tris (M) | shadow-pass calls | alloc MB/s |')
print('|---|---|---|---|---|---|---|---|---|')
for v, ths in (('map', ('x1', 'x4', 'x6')), ('gate', ('x1', 'x4', 'x6')), ('fields', ('x1',)), ('mill', ('x1',)), ('map_night', ('x1', 'x4')), ('L30_map', ('x1', 'x4')), ('L50_map', ('x1', 'x4')), ('hero_gate', ('x1', 'x4', 'x6')), ('hero_fields', ('x1',)), ('hero_mill', ('x1',)), ('hero_walk', ('x1',)), ('hero_walk4', ('x4', 'x6'))):
    for th in ths:
        ja, jb = g(A, v, th, 'js'), g(B, v, th, 'js')
        if ja is None: continue
        f = lambda k, p=1: ('%s → %s' % (round(g(A, v, th, k) / p, 2) if g(A, v, th, k) is not None else '—', round(g(B, v, th, k) / p, 2) if g(B, v, th, k) is not None else '—'))
        print('| %s | %s | %s → %s | %s | %s | %s | %s | %s | %s |' % (v.replace('hero_walk4', 'hero_walk'), th.replace('x', '×'), ja, jb, d(ja, jb), f('render'), f('calls'), f('tris', 1e6), f('shCalls'), f('allocMBs')))
print()
print('Per-system ms/frame (map view, CPU 1x / 4x / 6x), before → after:')
keys = ['render(submit)', 'life', 'units+patrols', 'moat', 'dragon', 'army', 'extras', 'refl']
print('| system | ×1 | ×4 | ×6 |'); print('|---|---|---|---|')
for k in keys:
    row = []
    for th in ('x1', 'x4', 'x6'):
        pa = (g(A, 'map', th, 'prof') or {}).get(k); pb = (g(B, 'map', th, 'prof') or {}).get(k)
        row.append('%s → %s' % (pa, pb))
    print('| %s | %s |' % (k, ' | '.join(row)))
for tag, R in (('before', A), ('after', B)):
    print(); print(tag, 'heap sampling (KB per frame):', 'map', (R.get('heap_map') or {}).get('perFrameKB'), 'hero', (R.get('heap_hero') or {}).get('perFrameKB'))
    print(tag, 'matrix pass ms (scan):', 'map', ((R['views'].get('map') or {}).get('scan') or {}).get('matrixPassMs'), 'hero', ((R['views'].get('hero_walk') or {}).get('scan') or {}).get('matrixPassMs'))
    print(tag, 'programs', R.get('programs'), '→ end', R.get('programs_end'))
