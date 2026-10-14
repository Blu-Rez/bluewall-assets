# p35 pacing fit v10: works on the REAL progress.py tables (T_HOURS / COST_K are patched in memory, no wrappers).  Free multipliers aT[n], aC[n] for levels 2..12;
# T never falls from level 4 on, effective cost (T*COST_K*1.13^n) never falls from level 3 on (enforced after every move).   python3 fit10.py [sweeps]
import sys, json, math, os, time, copy
from multiprocessing import Pool
sys.path.insert(0, '/home/claude/dev'); sys.path.insert(0, '/home/claude/bot/bluebot_v2')
from bluewall import progress as P, sim as SIM
import fit5
from fit5 import G, B
BASE_T = list(P.T_HOURS); BASE_C = list(P.COST_K)
LV = list(range(2, 13))
PH = (-1.0, 0.0, 1.0)
def tables(a):
    T = list(BASE_T); C = list(BASE_C)
    for n in LV:
        T[n - 1] *= math.exp(a['T'][str(n)]); C[n - 1] *= math.exp(a['C'][str(n)])
    for n in range(4, 31): T[n - 1] = max(T[n - 1], T[n - 2])
    for n in range(3, 31):
        c0 = T[n - 2] * C[n - 2] * 1.13 ** (n - 2); c1 = T[n - 1] * C[n - 1] * 1.13 ** (n - 1)
        if c1 < c0: C[n - 1] = c0 / (T[n - 1] * 1.13 ** (n - 1))
    return T, C
def work(args):
    a, name, ph, hor = args
    T, C = tables(a); P.T_HOURS[:] = T; P.COST_K[:] = C; P._VC.clear()
    pr = copy.deepcopy(SIM.PROFILES[name]); pr['sessions'] = [min(23.9, max(0.0, h + ph)) for h in pr['sessions']]
    return SIM.simulate(pr, hor)['keep_days']
def measure(a):
    tasks = [(a, n, ph, h) for n, h in (('free', 1500), ('best', 900)) for ph in PH]
    res = POOL.map(work, tasks)
    out = {}
    for i, n in enumerate(('free', 'best')):
        rs = res[i * 3:(i + 1) * 3]; out[n] = {L: (sum(r[L] for r in rs) / 3 if all(L in r for r in rs) else None) for L in range(2, 31)}
    return out
def loss(r):
    e = 0.0
    for n in range(2, 31):
        w = (1.0 if n <= 12 else 0.4) * (3.0 if n in (10, 15, 20, 30) else 1.0)
        f = r['free'].get(n); b = r['best'].get(n)
        e += w * (math.log(f / G[n]) ** 2 if f else 25.0) + 1.5 * w * (math.log(b / B[n]) ** 2 if b else 25.0)
    return e
if __name__ == '__main__':
    POOL = Pool(2)
    a = {'T': {str(n): 0.0 for n in LV}, 'C': {str(n): 0.0 for n in LV}}
    if os.path.exists('/home/claude/dev/fit10_state.json') and '--reset' not in sys.argv: a = json.load(open('/home/claude/dev/fit10_state.json'))
    step = 0.15; cur = loss(measure(a)); print('start', round(cur, 3), flush=True)
    for sw in range(int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 8):
        t0 = time.time(); imp = False
        for k in ('C', 'T'):
            for n in LV:
                for d in (+step, -step):
                    old = a[k][str(n)]; a[k][str(n)] = old + d
                    v = loss(measure(a))
                    if v < cur - 1e-9: cur = v; imp = True; break
                    a[k][str(n)] = old
        if not imp: step *= 0.6
        json.dump(a, open('/home/claude/dev/fit10_state.json', 'w'))
        print('sweep', sw + 1, round(cur, 3), 'step', round(step, 3), '%.0fs' % (time.time() - t0), flush=True)
    r = measure(a)
    print('good', {n: round(r['free'][n]) for n in range(2, 31) if r['free'].get(n)})
    print('best', {n: round(r['best'][n]) for n in range(2, 31) if r['best'].get(n)})
    T, C = tables(a); print('T', [round(x, 1) for x in T]); print('C', [round(x, 3) for x in C])
    json.dump({'T': [float('%.3g' % x) for x in T], 'CK': [round(x, 3) for x in C]}, open('/home/claude/dev/baked_tables_fit10.json', 'w'))
