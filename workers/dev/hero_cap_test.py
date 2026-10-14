# p35 K2: at most three of each hero (slot 1 at the unit's unlock level, slot 2 at building level 26, slot 3 at 30)
import sys
sys.path.insert(0, '/home/claude/bot/bluebot_v2')
from bluewall import state as S, progress as P, military as M
bad = 0
def chk(name, cond):
    global bad
    print(('OK   ' if cond else 'FAIL ') + name); bad += 0 if cond else 1
def fresh(level):
    st = {'gems': {g: 10 ** 9 for g in P.GEMS}, 'level': level, 'last': {g: 0.0 for g in P.GEMS}, 'mb': {g: 0.0 for g in P.GEMS}, 'prem': {'sap': 0, 'onyx': 0}}
    P.init(st); st['b'] = P.fresh_levels(level); M.init(st); st['army'] = {}
    return st
T = 1_000_000.0
for hero in M.HEROES:
    lv0, lv1, lv2 = M.hero_slot_levels(hero)
    chk('%s slot levels are increasing and the last is the maximum (%s)' % (hero, (lv0, lv1, lv2)), lv0 < lv1 < lv2 <= P.MAX_LEVEL and lv2 == P.MAX_LEVEL)
    for lv, want in ((lv0 - 1, 0), (lv0, 1), (lv1 - 1, 1), (lv1, 2), (lv2 - 1, 2), (lv2, 3)):
        chk('%s at building level %d: %d slot(s)' % (hero, lv, want), M.hero_slots(hero, lv) == want)
    st = fresh(30)
    fam = M.UNITS[hero]['fam']
    why, _ = M.train(st, hero, 1, T); chk(hero + ' #1 queued', why == 'ok')
    why, _ = M.train(st, hero, 2, T); chk(hero + ' #2 and #3 queued (queue counts)', why == 'ok')
    why, info = M.train(st, hero, 1, T); chk(hero + ' a 4th is refused: hero_cap ' + str(info), why == 'hero_cap' and info['cap'] == 3 and info['held'] == 3)
    chk(hero + ' max_train = 0 with three queued', M.max_train(st, hero) == 0)
    # delivered copies count too
    M.settle(st, T + 10 ** 7)
    chk(hero + ' three stand in the army', st['army'].get(hero) == 3)
    why, info = M.train(st, hero, 1, T + 10 ** 7); chk(hero + ' still no 4th once they are delivered', why == 'hero_cap')
    # one falls in a battle: the slot opens again
    st['army'][hero] = 2
    chk(hero + ' a fallen hero opens its slot', M.max_train(st, hero) >= 1 and M.train(st, hero, 1, T + 10 ** 7)[0] == 'ok')
    # cancel gives the slot back
    st2 = fresh(30); M.train(st2, hero, 3, T); M.cancel(st2, fam, T); chk(hero + ' cancelling the queue gives the slots back', M.max_train(st2, hero) == 3)
    # lower building level: only the open slots
    st3 = fresh(lv1); chk(hero + ' at level %d only 2 can be trained' % lv1, M.max_train(st3, hero) == 2 and M.train(st3, hero, 3, T)[0] == 'hero_cap')
    # the view tells the client
    v = M.view(fresh(lv0), T)['units'][hero]; chk(hero + ' view: hero info %s' % v.get('hero'), v['hero']['cap'] == 1 and v['hero']['max'] == 3 and v['hero']['next'] == lv1)
# the owner's fresh kingdom and the reference army never hold more than 3
so = S._start_army(fresh(30), True); chk('owner start army: <= 3 of each hero ' + str({h: so.get(h) for h in M.HEROES}), all(so.get(h, 0) <= 3 for h in M.HEROES))
for k in (12, 20, 30):
    M.ref_power(k)
chk('regular units have no cap', M.hero_slots('spear', 1) > 10 ** 5)
print('HERO CAP FAILED' if bad else 'HERO CAP OK'); sys.exit(1 if bad else 0)
