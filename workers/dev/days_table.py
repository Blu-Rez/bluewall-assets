# the days-per-castle-level table of the REAL rules (progress.py as baked), 4 profiles, each an ensemble of 3 visit phases (-1 / 0 / +1 h)
import sys, json, copy
from multiprocessing import Pool
sys.path.insert(0, '/home/claude/bot/bluebot_v2')
from bluewall import sim as SIM
PH = (-1.0, 0.0, 1.0)
def work(a):
    name, ph = a
    pr = copy.deepcopy(SIM.PROFILES[name]); pr['sessions'] = [min(23.9, max(0.0, h + ph)) for h in pr['sessions']]
    return SIM.simulate(pr, 3000)['keep_days']
if __name__ == '__main__':
    names = ('free', 'boost', 'best', 'idle')
    with Pool(2) as p: res = p.map(work, [(n, ph) for n in names for ph in PH])
    out = {}
    for i, n in enumerate(names):
        rs = res[i * 3:(i + 1) * 3]; out[n] = {L: (sum(r[L] for r in rs) / 3 if all(L in r for r in rs) else None) for L in range(2, 31)}
    json.dump({k: {str(a): b for a, b in v.items()} for k, v in out.items()}, open('/home/claude/dev/days_table.json', 'w'))
    print('lvl  good boost best idle')
    for L in range(2, 31):
        print('%3d %5.0f %5.0f %5.0f %5.0f' % (L, out['free'][L] or 0, out['boost'][L] or 0, out['best'][L] or 0, out['idle'][L] or 0))
