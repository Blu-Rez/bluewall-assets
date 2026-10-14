import sys
sys.path.insert(0, '/home/claude/dev')
import curve_lab as CL
from bluewall import progress as P, sim as SIM
t20 = CL.old_curve(20)
for k in (0.12, 0.5):
    CL.apply(lambda n, k=k: CL.old_curve(n) if n <= 20 else t20 * k)
    print('== tail const %.2f x t(20) = %.0fh; builder days 20/25/30: %.0f / %.0f / %.0f ; per-level round day at 21: %.1f' % (k, t20 * k, CL.builder_days(20), CL.builder_days(25), CL.builder_days(30), sum(P.dur(e, 21) for e in P.ORDER) / 3600 / 72))
    for n in ('free', 'boost', 'best', 'idle'):
        r = SIM.simulate(SIM.PROFILES[n], 1800); kd = r['keep_days']
        print('  %-5s castle 20/25/30 on day %s/%s/%s' % (n, kd.get(20), kd.get(25), kd.get(30)))
