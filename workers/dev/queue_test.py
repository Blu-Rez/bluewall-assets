import sys, copy
sys.path.insert(0, '/home/claude/bot/bluebot_v2'); sys.path.insert(0, '/tmp/claude-0/-home-claude/f1defe4a-d564-51fb-b3f4-8e39cac67238/scratchpad/stub')
from bluewall import military as MI, progress as PR
PR.level = lambda st, e: st.get('lv', {}).get(e, 10)
st = {"army": {}, "tq": {}, "spells": {}, "sq": [], "gems": {"ruby": 10**6, "emerald": 10**6, "turq": 10**6}, "rep": [], "lv": {}}
MI.init(st)
t0 = 1000.0
print(MI.train(st, 'spear', 5, t0)[0], MI.train(st, 'spear', 3, t0)[0], MI.train(st, 'sword', 2, t0)[0], MI.train(st, 'guard', 1, t0)[0])
print('lane', st['tq']['barracks'])
per = MI.unit_time(st, 'spear'); print('per spear', per)
MI.settle(st, t0 + per * 2.5); print('after 2.5 pieces', st['army'], st['tq']['barracks'][0]['n'], st['tq']['barracks'][0]['s'] - t0)
MI.settle(st, t0 + per * 8 + 1); print('after 8 spear', st['army'], [ (b['u'], b['n']) for b in st['tq']['barracks']])
g0 = dict(st['gems']); print('cancel last', MI.cancel(st, 'barracks', t0 + 200), {k: st['gems'][k] - g0[k] for k in g0})
v = MI.view(st, t0 + 200); print('view fam', v['fam']['barracks']); print('units spear', v['units']['spear'])
print('queue_full:', [MI.train(st, u, 1, t0)[0] for u in ('spear', 'sword', 'guard', 'sword')])
print('speedup', MI.speedup(st, 'barracks', t0 + 300), st['army'], st['tq'])
# old format migration
old = {"army": {}, "tq": {"stable": {"u": "cavalry", "n": 4, "s": t0, "end": t0 + 4 * 52.0, "cost": {"ruby": 48, "emerald": 16}}}, "spells": {}, "sq": {"u": "lightning", "n": 2, "s": t0, "end": t0 + 60, "cost": {"turq": 16, "ruby": 8}}, "gems": {}, "rep": []}
MI.init(old); print('migrated', old['tq'], old['sq']); MI.settle(old, t0 + 100); print('settled', old['army'], old['spells'], old['tq'], old['sq'])
# spells
print(MI.brew(st, 'lightning', 3, t0)[0], MI.brew(st, 'heal', 2, t0)[0], st['sq']); MI.settle(st, t0 + 3 * MI.spell_time(st, 'lightning') + 1); print(st['spells'], [(b['u'], b['n']) for b in st['sq']])
print(MI.brew_cancel(st), st['sq'], MI.brew_cancel(st, 0, 1))
