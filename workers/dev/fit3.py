# p35 pacing fit v3: sequential calibration, level by level.  best (builder bound) fixes T[n-1], free (resource bound) fixes CK[n-1].
# usage: python3 fit3.py [sweeps] [--reset]     state: fit3_state.json   (T hours at multiplier 1, CK cost factor, both indexed by the level `to`)
import sys, json, math, os, time
sys.path.insert(0, '/home/claude/bot/bluebot_v2')
from bluewall import progress as P, sim as SIM
STATE = '/home/claude/dev/fit3_state.json'
G = {1: 0.0, 2: 3, 3: 7, 4: 12, 5: 25, 6: 40, 7: 60, 8: 85, 9: 115, 10: 150}
G20, TAILG = 395.0, 28.0
for n in range(11, 21): G[n] = 150 + (G20 - 150) / 10.0 * (n - 10)
for n in range(21, 31): G[n] = G20 + TAILG * (n - 20)
RB = 0.62
B = {n: RB * d for n, d in G.items()}
OLD = {n: P.t_hours(n) for n in range(1, 31)}
if not hasattr(P, '_orig_cost'): P._orig_cost = P.cost
S = None
def apply():
    T, CK = S['T'], S['CK']
    P.t_hours = lambda to: T[min(30, max(1, int(to)))]
    base = P._orig_cost
    def cost2(ent, to):
        f = CK[min(30, max(1, int(to)))]
        return {g: int(math.ceil(v * f)) for g, v in base(ent, to).items()}
    P.cost = cost2
    P._VC.clear()
def day_of(name, n, hor):
    apply()
    kd = SIM.simulate(SIM.PROFILES[name], int(hor), stop_level=n)['keep_days']
    return kd.get(n)
def bisect(fn, lo, hi, target, it=14):
    """fn increasing in x (x log-scaled): the x where fn(x) = target (None = never reached = +inf)."""
    for _ in range(it):
        mid = math.sqrt(lo * hi)
        v = fn(mid)
        if v is None or v > target: hi = mid
        else: lo = mid
    return math.sqrt(lo * hi)
def calibrate_level(n):
    """gap n (castle n-1 -> n): T[n-1] from best, CK[n-1] from free."""
    k = max(2, n - 1)
    def fb(x):
        S['T'][k] = x; return day_of('best', n, 4 * B[n] + 5)
    S['T'][k] = bisect(fb, 0.002, 4000.0, B[n])
    def ff(x):
        S['CK'][k] = x; return day_of('free', n, 4 * G[n] + 5)
    S['CK'][k] = bisect(ff, 0.05, 60.0, G[n])
def init():
    T = {n: OLD[n] * (20.0 if n <= 8 else 2.0) for n in range(1, 31)}
    return {'T': T, 'CK': {n: 1.0 for n in range(1, 31)}, 'sweep': 0}
def load():
    if os.path.exists(STATE) and '--reset' not in sys.argv:
        d = json.load(open(STATE)); return {'T': {int(k): v for k, v in d['T'].items()}, 'CK': {int(k): v for k, v in d['CK'].items()}, 'sweep': d['sweep']}
    return init()
def save(): json.dump(S, open(STATE, 'w'))
def table(hf=2200, hb=1400):
    apply()
    kf = SIM.simulate(SIM.PROFILES['free'], hf)['keep_days']; kb = SIM.simulate(SIM.PROFILES['best'], hb)['keep_days']
    ki = SIM.simulate(SIM.PROFILES['idle'], 3000)['keep_days']; ko = SIM.simulate(SIM.PROFILES['boost'], hf)['keep_days']
    return kf, kb, ko, ki
def report(kf, kb, ko, ki):
    print(' lvl  goodT  good  err | bestT  best  err | boost  idle   T[n]h   CK')
    for n in range(2, 31):
        f, b = kf.get(n), kb.get(n)
        e1 = '%+.0f%%' % (100 * (f / G[n] - 1)) if f else '-'; e2 = '%+.0f%%' % (100 * (b / B[n] - 1)) if b else '-'
        print(' %2d %6.0f %6s %5s | %5.0f %6s %5s | %6s %6s  %7.1f %5.2f' % (n, G[n], f, e1, B[n], b, e2, ko.get(n), ki.get(n), S['T'][n], S['CK'][n]))
if __name__ == '__main__':
    S = load(); sweeps = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 1
    top = int(os.environ.get('TOP', '30'))
    for sw in range(sweeps):
        t0 = time.time()
        for n in range(3, top + 1):
            calibrate_level(n)
        S['sweep'] += 1; save(); print('sweep', S['sweep'], '%.0fs' % (time.time() - t0), flush=True)
    report(*table())
