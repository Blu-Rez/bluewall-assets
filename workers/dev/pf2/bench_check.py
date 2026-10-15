#!/usr/bin/env python3
# pf2/bench_check.py [json] — judges the headless BW_bench v2 result written by pf2/bench.py (the page WITHOUT ?pf=1, like the owner's phone).  Prints "ok ..." / "FAIL ...", exit 1 on a failure.
import json, sys
f = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/work/pf2/bench_after_nopf.json'
R = json.load(open(f)); B = R['bench']; FAIL = []
def ok(c, m):
    print(('ok   ' if c else 'FAIL ') + m)
    if not c: FAIL.append(m)
ph = B['ph']
ok(B['v'] == 2 and R['json_bytes'] < 3500 and B['bytes'] < 3500, 'bench v2: result %d bytes (< 3.5 KB)' % R['json_bytes'])
for k in ('md', 'mn', 'hd', 'hn', 'mu'):
    p = ph.get(k)
    ok(bool(p) and p.get('fps', 0) > 0 and p.get('px') and p.get('calls') is not None, 'phase %s: fps %s · p95 %s · worst %s · %s calls · %sK tris · %s' % (k, p and p.get('fps'), p and p.get('p95'), p and p.get('max'), p and p.get('calls'), p and p.get('k'), p and p.get('px')))
worst = max([p['max'] for p in ph.values() if p and 'max' in p] or [0])
ok(worst < 2000, 'no interval above 2000 ms in any phase figure (worst %s ms); stalls reported apart: %s (%s ms)' % (worst, B['stalls'], B['stallMs']))
ok(ph['md'] and ph['md'].get('d') and all(v > 0 for v in ph['md']['d']), 'drift of the first / last 5 s of the day phase: %s' % (ph['md'] and ph['md'].get('d')))
n = B.get('night') or {}
ok(n.get('comp') == 1 and n.get('rt') == 1 and n.get('used') == 1, 'the night phase ran on the bloom composer path (built first: waited %s s)' % n.get('wait'))
ok(len(R['card']) == 1 and all(t in R['card'][0] for t in ('MAP DAY', 'MAP NIGHT', 'HERO DAY', 'HERO NIGHT', 'MAP UNCAPPED', 'programs')), 'the card has one line per phase')
ok(B['mskip']['bad'] == 0, 'matrix skip invariant after the run: bad = %s' % B['mskip']['bad'])
a = R.get('after') or {}
ok(isinstance(a, dict) and abs(a.get('hour', 0) - 14) < 0.5 and a.get('night', 1) < 0.1, 'the clock is back after the run (hour %s, night %s)' % (a.get('hour'), a.get('night')))
ok(ph['md']['prog'] - B['gl']['prog0'] <= 4, 'programs during the day phase: %d -> %d (F1/F2: nothing is compiled in the idle day)' % (B['gl']['prog0'], ph['md']['prog']))
print('PF2 BENCH ' + ('FAILED' if FAIL else 'OK')); sys.exit(1 if FAIL else 0)
