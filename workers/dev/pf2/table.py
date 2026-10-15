#!/usr/bin/env python3
# pf2/table.py — the before / after program table of PF2 (reads /home/claude/work/pf2/{before,after}/*.json; prints markdown)
import json, os
W = '/home/claude/work/pf2/'
def load(t, f):
    try: return json.load(open(W + t + '/' + f))
    except Exception: return None
def boot(t):
    d = load(t, 'progs.json'); s = d and d.get('boot_series')
    if not s: return None, None
    first = next((x for x in s if x['ready'] and x['late']), None)
    return (first['progs'] if first else None), s[-1]['progs']
def state(t, name):
    d = load(t, 'progs.json')
    for s in (d or {}).get('states', []):
        if s['state'] == name: return s['programs']
def idle(t, h):
    d = load(t, 'idle_h%s.json' % h); return d['series'][-1]['progs'] if d else None
rows = []
b0, b1 = boot('before'); a0, a1 = boot('after')
rows.append(('first draw (late stage ready), day', b0, a0))
rows.append(('+8 s after the first draw (touching)', b1, a1))
rows.append(('day (hour 14), 120 s idle, no input', idle('before', '14'), idle('after', '14')))
rows.append(('dusk near (hour 16.8), 120 s idle, no input', idle('before', '16.8'), idle('after', '16.8')))
for n, lab in [('night, screen path (no composer)', 'night, screen path (forced, cold)'), ('night, bloom composer path', 'night + bloom composer (forced, cold)'), ('hero, day, screen path', 'hero, day'), ('hero, night, screen path', 'hero, night'), ('hero, night, bloom composer path', 'hero, night + composer')]:
    rows.append((lab, state('before', n), state('after', n)))
print('| state | before | after | Δ |\n|---|---|---|---|')
for lab, b, a in rows:
    d = '' if b is None or a is None else '%+d' % (a - b)
    print('| %s | %s | %s | %s |' % (lab, b if b is not None else '–', a if a is not None else '–', d))
