import sys
sys.path.insert(0, '/home/claude/dev')
import curve_lab as CL
from bluewall import progress as P, sim as SIM
t10 = CL.old_curve(10)
def lin(s): return lambda n: CL.old_curve(n) if n <= 10 else t10 + s * (n - 10)
lo, hi = 1.0, 60.0
for _ in range(40):
    mid = (lo + hi) / 2; CL.apply(lin(mid))
    if CL.builder_days(20) < 331: lo = mid
    else: hi = mid
s = (lo + hi) / 2; CL.apply(lin(s))
print('slope %.2f h per level above 10; t(11)=%.0fh t(15)=%.0fh t(20)=%.0fh t(25)=%.0fh t(30)=%.0fh' % (s, P.t_hours(11), P.t_hours(15), P.t_hours(20), P.t_hours(25), P.t_hours(30)))
print('builder days 15/20/25/30: %.0f / %.0f / %.0f / %.0f' % tuple(CL.builder_days(k) for k in (15, 20, 25, 30)))
print('per-level round days at 11,15,20,21,25,30:', ' '.join('%d:%.1f' % (k, sum(P.dur(e, k) for e in P.ORDER) / 3600 / 72) for k in (11, 15, 20, 21, 25, 30)))
CL.apply(CL.old_curve)
print('old curve per-level round days at 11,15,20:', ' '.join('%d:%.1f' % (k, sum(P.dur(e, k) for e in P.ORDER) / 3600 / 72) for k in (11, 15, 20)))
CL.apply(lin(s))
for n in ('free', 'boost', 'best', 'idle'):
    r = SIM.simulate(SIM.PROFILES[n], 1800); kd = r['keep_days']
    print('  %-5s castle 10/15/20/25/30 on day %s/%s/%s/%s/%s' % (n, kd.get(10), kd.get(15), kd.get(20), kd.get(25), kd.get(30)))
