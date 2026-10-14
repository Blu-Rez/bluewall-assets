# p35 pacing fit v7: T knots fixed (monotone state F -> best player stays ~8 months at 20), only the COST factor CK is fitted for the GOOD player (ensemble of 3 visit phases).
import sys, json, math, os, time
os.environ['MONO'] = '1'
sys.path.insert(0, '/home/claude/dev'); sys.path.insert(0, '/home/claude/bot/bluebot_v2')
sys.argv = [sys.argv[0]] + sys.argv[1:]
import fit5, fit6
from fit5 import G, B, TK, CKN
from multiprocessing import Pool
def gloss(kf):
    e = 0.0; prev = 0.0; pg = 0.0
    for n in range(2, 31):
        f = kf.get(n)
        w = (1.0 if n <= 12 else 0.5) * (3.0 if n in (10, 15, 20, 25, 30) else 1.0)
        e += w * (math.log(f / G[n]) ** 2 if f else 25.0)
        if f:
            ga = max(0.5, f - prev); gt = max(0.5, G[n] - pg); e += 0.15 * math.log(ga / gt) ** 2; prev = f
        pg = G[n]
    return e
def ev(S):
    fit5.S = S; r = fit6.measure_all(S, ('free',)); return gloss(r['free']), r['free']
if __name__ == '__main__':
    fit6.POOL = Pool(2)
    S = json.load(open('/home/claude/dev/fit5_state_F.json'))
    for i, n in enumerate(CKN):
        if 6 <= n <= 10: S['lc'][i] += math.log(1.9)
    step = 0.2; cur, kf = ev(S); print('start', round(cur, 3), flush=True)
    for sw in range(int(sys.argv[1]) if len(sys.argv) > 1 else 8):
        t0 = time.time(); imp = False
        for i in range(len(CKN)):
            for d in (+step, -step):
                old = S['lc'][i]; S['lc'][i] = old + d
                v, _ = ev(S)
                if v < cur - 1e-9: cur = v; imp = True; break
                S['lc'][i] = old
        if not imp: step *= 0.6
        json.dump(S, open('/home/claude/dev/fit7_state.json', 'w'))
        print('sweep', sw + 1, round(cur, 3), 'step', round(step, 3), '%.0fs' % (time.time() - t0), flush=True)
    _, kf = ev(S)
    print(' '.join('%d:%.0f' % (n, kf[n]) for n in range(2, 31) if kf.get(n)))
