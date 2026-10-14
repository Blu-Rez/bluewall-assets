import sys, json, copy, os
from multiprocessing import Pool
sys.path.insert(0, '/home/claude/bot/bluebot_v2')
from bluewall import sim as SIM
PH = (-1.0, 0.0, 1.0)
def work(a):
    name, ph = a
    pr = copy.deepcopy(SIM.PROFILES[name]); pr['sessions'] = [min(23.9, max(0.0, h + ph)) for h in pr['sessions']]
    return SIM.simulate(pr, 3000)['keep_days']
if __name__ == '__main__':
    names = ('free', 'best')
    with Pool(2) as p: res = p.map(work, [(n, ph) for n in names for ph in PH])
    out = {}
    for i, n in enumerate(names):
        rs = res[i * 3:(i + 1) * 3]; out[n] = {L: (sum(r[L] for r in rs) / 3 if all(L in r for r in rs) else None) for L in range(2, 31)}
    print('lvl good(free) best   | owner table')
    OW = {2:3,3:7,4:12,5:25,6:40,7:60,8:85,9:115,10:150}
    for L in range(2, 31): print('%3d %6.0f %6.0f   %s' % (L, out['free'][L] or 0, out['best'][L] or 0, OW.get(L, '')))
