# p35 pacing fit v6: like fit5 but every profile is an ENSEMBLE of 3 players whose visit times differ by 1 hour (the free player is chaotic:
# one tiny cost change moves a level by 15 %), so the fit does not chase noise.   MONO=1 python3 fit6.py [sweeps]   state: fit6_state.json
import sys, json, math, os, time, copy
from multiprocessing import Pool
sys.path.insert(0, '/home/claude/dev'); sys.path.insert(0, '/home/claude/bot/bluebot_v2')
pass
import fit5
from fit5 import *
STATE6 = '/home/claude/dev/fit6_state.json'
PH = (-1.0, 0.0, 1.0)
def shifted(name, ph):
    pr = copy.deepcopy(SIM.PROFILES[name]); pr['sessions'] = [min(23.9, max(0.0, h + ph)) for h in pr['sessions']]; return pr
def work(args):
    S, name, ph, hor = args
    fit5.S = S; fit5.apply()
    return SIM.simulate(shifted(name, ph), hor)['keep_days']
POOL = None
def mean_days(res):
    out = {}
    for n in range(2, 31):
        v = [r.get(n) for r in res]
        out[n] = sum(v) / len(v) if all(x is not None for x in v) else None
    return out
def measure_all(S, names=('free', 'best'), hors=None):
    hors = hors or {'free': HF, 'best': HB, 'boost': HF, 'idle': 3000}
    tasks = [(S, n, ph, hors[n]) for n in names for ph in PH]
    res = POOL.map(work, tasks)
    return {n: mean_days(res[i * len(PH):(i + 1) * len(PH)]) for i, n in enumerate(names)}
def f_eval6():
    r = measure_all(fit5.S); return fit5.loss(r['free'], r['best'])
def report6(S):
    r = measure_all(S, ('free', 'boost', 'best', 'idle'))
    T, CK = fit5.tables()
    print(' lvl  good(target)   best(target) | boost  idle |  T[n]h   CK')
    for n in range(2, 31):
        f = r['free'].get(n); b = r['best'].get(n)
        print(' %2d  %6s(%5.0f)  %6s(%5.0f) | %6s %6s | %7.1f %5.2f' % (n, '%.0f' % f if f else '-', G[n], '%.0f' % b if b else '-', B[n], '%.0f' % r['boost'][n] if r['boost'].get(n) else '-', '%.0f' % r['idle'][n] if r['idle'].get(n) else '-', T[n], CK[n]))
    return r
if __name__ == '__main__':
    POOL = Pool(2)
    sweeps = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 10
    src = STATE6 if os.path.exists(STATE6) and '--reset' not in sys.argv else os.environ.get('START6', '/home/claude/dev/fit5_state_F.json')
    fit5.S = json.load(open(src)); S = fit5.S; step = float(S.get('step6', 0.1))
    cur = f_eval6(); print('start loss %.3f' % cur, flush=True)
    for sw in range(sweeps):
        t0 = time.time(); improved = False
        params = [('lt', i) for i in range(len(TK))] + [('lc', i) for i in range(len(CKN))]
        for (k, i) in params:
            for d in (+step, -step):
                old = S[k][i]; S[k][i] = old + d
                v = f_eval6()
                if v < cur - 1e-9: cur = v; improved = True; break
                S[k][i] = old
        if not improved: step *= 0.6
        S['step6'] = step; json.dump(S, open(STATE6, 'w'))
        print('sweep %d loss %.3f step %.3f (%.0fs)' % (sw + 1, cur, step, time.time() - t0), flush=True)
    report6(S)
