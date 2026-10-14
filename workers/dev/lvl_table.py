import sys, json
sys.path.insert(0, '/home/claude/bot/bluebot_v2')
from bluewall import progress as P, sim as SIM
out = {}
for n in ('best', 'boost', 'free', 'idle'):
    r = SIM.simulate(SIM.PROFILES[n], 1800); out[n] = r['keep_days']
# builder-days per round (3 builders): the pure time floor of castle level n
rnd = {n: sum(P.dur(e, n) for e in P.ORDER) / 3600.0 / (72 if n >= 7 else 48) for n in range(1, 31)}
json.dump({'days': {k: {str(a): b for a, b in v.items()} for k, v in out.items()}, 'round_days': rnd, 'keep_h': {n: P.dur('keep', n) / 3600.0 for n in range(1, 31)}}, open('/home/claude/dev/lvl_table.json', 'w'))
print('ok')
