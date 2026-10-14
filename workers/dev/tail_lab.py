import sys
sys.path.insert(0, '/home/claude/bot/bluebot_v2')
from bluewall import progress as P, sim as SIM
for k in [float(x) for x in sys.argv[1:]]:
    P.TAIL_K = k; P._VC.clear()
    print('== TAIL_K %.2f  builder days 20/25/30: %.0f / %.0f / %.0f' % (k, *[sum(P.dur(e, lv) for e in P.ORDER for lv in range(1, top + 1)) / 3600 / 72 for top in (20, 25, 30)]))
    for n in ('free', 'boost', 'best', 'idle'):
        r = SIM.simulate(SIM.PROFILES[n], 1900); kd = r['keep_days']
        print('  %-5s castle 20/25/30 on day %s/%s/%s' % (n, kd.get(20), kd.get(25), kd.get(30)), flush=True)
