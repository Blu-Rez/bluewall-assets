# curve lab: try time curves for castle levels 1..30 against the 4 simulated players.  python3 curve_lab.py [variant ...]
import sys, math
sys.path.insert(0, '/home/claude/bot/bluebot_v2')
from bluewall import progress as P, military as MI, sim as SIM
T_OLD = {}
def old_curve(n):                       # today's p34 curve (20 levels)
    n = max(1, int(n))
    if n in P.T_TABLE_H: return P.T_TABLE_H[n]
    return P.T20_H * ((n - 1) / 19.0) ** P.T_EXP
def variant(name):
    t20 = old_curve(20)
    if name == 'C':      # the p35 curve as it is now (levels > 10 linear from t(10))
        return lambda n: old_curve(n) if n <= 10 else old_curve(10) * (n - 1) / 9.0
    if name == 'L':      # levels 1..20 as today, then linear from t(20): t(n) = t(20)(n-1)/19
        return lambda n: old_curve(n) if n <= 20 else t20 * (n - 1) / 19.0
    if name == 'F':      # levels 1..20 as today, then flat (every level above 20 as slow as 20)
        return lambda n: old_curve(n) if n <= 20 else t20
    if name == 'H':      # levels 1..20 as today, then +half the linear slope
        return lambda n: old_curve(n) if n <= 20 else t20 * (1 + 0.5 * (n - 20) / 19.0 * 1.0)
    if name.startswith('S'):   # S<k>: old curve to 20 times nothing, tail linear but starting from t20 * k
        k = float(name[1:]); return lambda n: old_curve(n) if n <= 20 else t20 * (n - 1) / 19.0 * k
    raise SystemExit('unknown ' + name)
def apply(f):
    P.t_hours = f
    P._VC.clear()
def builder_days(top):
    return sum(P.dur(e, lv) for e in P.ORDER for lv in range(1, top + 1)) / 3600.0 / 72
if __name__ == '__main__':
    for v in sys.argv[1:] or ['C', 'L', 'F']:
        apply(variant(v))
        print('== variant', v, ' builder days (3 builders, all structures): 20 -> %.0f, 25 -> %.0f, 30 -> %.0f' % (builder_days(20), builder_days(25), builder_days(30)), ' t(20)=%.0fh t(30)=%.0fh' % (P.t_hours(20), P.t_hours(30)))
        for n in ('free', 'boost', 'best', 'idle'):
            r = SIM.simulate(SIM.PROFILES[n], 1800)
            kd = r['keep_days']
            print('  %-5s castle 10/15/20/25/30 on day %s/%s/%s/%s/%s' % (n, kd.get(10), kd.get(15), kd.get(20), kd.get(25), kd.get(30)))
