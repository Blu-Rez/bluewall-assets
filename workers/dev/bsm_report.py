import json, sys, collections
rows = []
args = None
for f in sys.argv[1:]:
    d = json.load(open(f)); args = d['args']; rows += d['res']
G = collections.OrderedDict()
for r in rows:
    G.setdefault((r['level'], r['profile'], r['aname']), []).append(r)
avg = lambda xs: sum(xs) / len(xs) if xs else 0
def fmt(x):
    return '-' if x is None or x < 0 else '%.0f' % x
print('args:', ' '.join(args))
print('%-4s %-9s %-6s | %5s %6s %6s %6s | %7s %7s %6s | %5s %5s %5s' % ('lvl', 'profile', 'army', 'stars', 'destr', 'lost%', 'time', 'defs50', 'defs100', 'first', 'bodA', 'bodD', 'ms/max'))
for (lv, pr, an), rs in G.items():
    ok = lambda k: [r[k] for r in rs if r[k] is not None and r[k] >= 0]
    print('%-4d %-9s %-6s | %5.2f %5.0f%% %5.0f%% %5.0fs | %7s %7s %6s | %5d %5d %3.1f/%-4.0f' % (lv, pr, an, avg([r['stars'] for r in rs]), avg([r['des'] for r in rs]), avg([r['lost'] for r in rs]), avg([r['time'] for r in rs]),
          fmt(avg(ok('tw50')) if ok('tw50') else None), fmt(avg(ok('tw100')) if ok('tw100') else None), fmt(avg(ok('tFirst')) if ok('tFirst') else None), rs[0]['bodiesA'], rs[0]['bodiesD'], avg([r['avgMs'] for r in rs]), max(r['maxMs'] for r in rs)))
