import json, sys, collections
rows = []
for f in sys.argv[1:]:
    rows += json.load(open(f))['res']
g = collections.defaultdict(list)
for r in rows: g[(r['level'], r.get('ratio'), r['aname'])].append(r)
print('lvl  ratio  army  n  stars  %3★  %2★+  des%  lost%  time  ms/step')
for k in sorted(g, key=lambda k: (k[0], k[1] or 0, k[2])):
    v = g[k]; n = len(v); m = lambda x: sum(x) / n
    print('%3d  %5s  %-5s %2d  %4.2f  %3d  %3d  %4.0f  %4.0f  %4.0f  %5.1f' % (k[0], k[1], k[2], n, m([r['stars'] for r in v]), 100*sum(r['stars'] == 3 for r in v)/n, 100*sum(r['stars'] >= 2 for r in v)/n, m([r['des'] for r in v]), m([r['lost'] for r in v]), m([r['time'] for r in v]), m([r['avgMs'] for r in v])))
