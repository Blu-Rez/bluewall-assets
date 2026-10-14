# economy v6: round rule, boosts (build / army / mine), rush allowance, shop (boosts, Tesla), conversions from the bot
import asyncio, sys, json, time, math
sys.path.insert(0, '/home/claude/bot/bluebot_v2')
from bluewall import state as S, bridge as B, progress as P, military as M, shop as SH, boost as BO

bad = 0
def chk(name, cond):
    global bad
    print(('OK   ' if cond else 'FAIL ') + name); bad += 0 if cond else 1

def fresh(keep=5):
    st = {'gems': {g: 10 ** 7 for g in P.GEMS}, 'level': keep, 'last': {g: 0.0 for g in P.GEMS}, 'mb': {g: 0.0 for g in P.GEMS}, 'prem': {'sap': 0, 'onyx': 0}}
    P.init(st); st['b'] = P.fresh_levels(keep); M.init(st); st['army'] = {}
    return st

T0 = 1_000_000.0
# ---- round rule
st = fresh(5); st['b']['wall'] = 3
why, info = P.can_start(st, 'keep', T0)
chk('castle 6 waits for the round (wall 3 < 5)', why == 'round' and 'wall' in info['left'])
st['b']['wall'] = 5; st['gems'] = {g: 10 ** 8 for g in P.GEMS}
why, _ = P.can_start(st, 'keep', T0); chk('castle 6 allowed once everything is >= 5', why in ('ok', 'vault'))

# ---- build boost: half-way through, a 20 % boost makes the rest 1.2x faster; when it ends the rest runs at speed 1
st = fresh(8); st['gems'] = {g: 10 ** 8 for g in P.GEMS}
for g in P.GEMS: st['b']['vault_' + g] = 20
r, it = P.start(st, 'wall', T0); d = it['d']
t1 = T0 + d / 2
P.settle(st, t1); old = BO.window(st, 'build')
st['bst'] = {'build': {'p': 20, 's': t1, 'end': t1 + 3600}}
P.rebase_build(st, t1, old, BO.window(st, 'build'))
exp_end = t1 + 3600 + (d / 2 - 3600 * 1.2)
chk('build boost re-times the running upgrade (%.0f vs %.0f)' % (it['end'], exp_end), abs(it['end'] - exp_end) < 1)
P.settle(st, t1 + 3600 + 5)
chk('boost removed at its end, upgrade still running', 'build' not in (st.get('bst') or {}) and abs(it['end'] - exp_end) < 1 and it in st['q'])
P.settle(st, exp_end + 1); chk('upgrade done at the exact boosted time', P.level(st, 'wall') == 9)

# ---- rush allowance: 4 h a day, saved up for 2 days
st = fresh(10); st['gems'] = {g: 10 ** 8 for g in P.GEMS}
for g in P.GEMS: st['b']['vault_' + g] = 20
st['b']['keep'] = 14; st['b']['wall'] = 14; st['b']['towers'] = 14
r, it = P.start(st, 'towers', T0)
chk('allowance starts full (8 h)', abs(P.rush_left(st, T0) - 8) < 1e-6)
r, info = P.speedup(st, 'towers', T0)
chk('rush cuts only 8 h of a long upgrade', r == 'ok' and not info['full'] and abs(info['cut'] - 8 * 3600) < 2)
r, info = P.speedup(st, 'towers', T0 + 10)
chk('second rush refused: allowance used up', r == 'rush_limit')
chk('allowance refills 4 h a day', abs(P.rush_left(st, T0 + 86400) - 4) < 0.01)

# ---- inspector fixes: partial rush never free, refund above the vault, lane rush never free
st = fresh(10); st['gems'] = {g: 10 ** 8 for g in P.GEMS}
for g in P.GEMS: st['b']['vault_' + g] = 20
st['b']['keep'] = 14; st['b']['wall'] = 14; st['b']['towers'] = 14
r, it = P.start(st, 'towers', T0); st['rsh'] = {'h': 150 / 3600, 't': T0}
end0 = it['end']; turq0 = st['gems']['turq']
for i in range(50): P.speedup(st, 'towers', T0 + i * 0.01)
chk('tiny allowance: cuts at most 150 s in total, and not for free (cut %.0f s)' % (end0 - it['end']), end0 - it['end'] <= 151 and st['gems']['turq'] < turq0)
st = fresh(8); st['gems'] = {g: 50 * P.vault_cap(g, 8) for g in P.GEMS}
r, it = P.start(st, 'wall', T0); paid = it['paid']; g0 = dict(st['gems'])
P.cancel(st, 'wall', T0 + 10)
chk('cancel refund comes back above the vault', all(st['gems'][g] == g0[g] + int(paid[g] * P.CANCEL_REFUND) for g in paid))
st = fresh(12); st['b']['training'] = 12; st['b']['barracks'] = 12
M.train(st, 'spear', 1, T0)
chk('a short training queue is never rushed for free (%d)' % M.rush_cost(st['tq']['barracks'], T0, 12), M.rush_cost(st['tq']['barracks'], T0, 12) >= 1)
# ---- mine boost: +20 % output inside the window, nothing extra outside; a full vault never multiplies the boost
st = fresh(5)
st['last'] = {g: T0 for g in P.GEMS}; st['mb'] = {g: 0.0 for g in P.GEMS}
rt = P.mine_rate('ruby', 5)
st['bst'] = {'mine': {'p': 20, 's': T0, 'end': T0 + 3600}}
chk('boosted hour pays 1.2 hours', abs(P.mine_ready(st, 'ruby', T0 + 3600) - rt * 1.2) < 0.01)
chk('then normal speed', abs(P.mine_ready(st, 'ruby', T0 + 7200) - rt * 2.2) < 0.01)
P.mine_take(st, 'ruby', 0, T0 + 1800); P.mine_take(st, 'ruby', 0, T0 + 1801)
chk('repeated collect with a full vault does not inflate', abs(P.mine_ready(st, 'ruby', T0 + 7200) - rt * 2.2) < 0.02)
P.expire_mine_boost(st, T0 + 7200); chk('expired mine boost banked and dropped', 'mine' not in st['bst'] and abs(P.mine_ready(st, 'ruby', T0 + 7200) - rt * 2.2) < 0.02)

# ---- army boost: queued soldiers come out faster, back to normal at its end
st = fresh(5); st['b']['training'] = 5; st['b']['barracks'] = 5
r, inf = M.train(st, 'spear', 10, T0); t = st['tq']['barracks'][0]['t']
st['bst'] = {'army': {'p': 20, 's': T0, 'end': T0 + 3 * t}}
M.rescale_lanes(st, T0, 1 / 1.2)
M.settle(st, T0 + 3 * t)
n1 = st['army'].get('spear', 0)
chk('army boost: 3 pieces of time give 3 soldiers (+0.6)', n1 == 3)
M.settle(st, T0 + 10 * t)
chk('after the boost the rest at normal speed (all 10 by t=%.1f)' % (10 * t), st['army'].get('spear', 0) in (9, 10) and 'army' not in st['bst'])

# ---- shop
cfg = SH.cfg_from(None)
st = fresh(5); st['prem'] = {'sap': 10_000, 'onyx': 100}
r, info = SH.buy(st, {'id': 'boost', 'kind': 'build', 'p': 10, 'd': 7}, cfg, T0)
chk('buy a 10 %% build boost for %s sapphire' % info['cost']['sap'], r == 'ok' and info['cost']['sap'] == SH.boost_price(cfg, 'build', 10, 7))
r, _ = SH.buy(st, {'id': 'boost', 'kind': 'build', 'p': 5, 'd': 1}, cfg, T0 + 10); chk('a weaker boost is refused', r == 'stronger')
e0 = st['bst']['build']['end']; SH.buy(st, {'id': 'boost', 'kind': 'build', 'p': 10, 'd': 1}, cfg, T0 + 10)
chk('same % adds the days', abs(st['bst']['build']['end'] - (e0 + 86400)) < 1)
left = st['bst']['build']['end'] - (T0 + 20); SH.buy(st, {'id': 'boost', 'kind': 'build', 'p': 20, 'd': 1}, cfg, T0 + 20)
chk('stronger takes over, old time prorated (x0.6 value)', abs(st['bst']['build']['end'] - (T0 + 20 + left * 0.5 * 0.6 + 86400)) < 1 and st['bst']['build']['p'] == 20)
r, _ = SH.buy(st, {'id': 'boost', 'kind': 'royal', 'p': 15, 'd': 1}, cfg, T0 + 30); chk('royal 15 % refused while build 20 % runs', r == 'stronger')
r, _ = SH.buy(st, {'id': 'boost', 'kind': 'royal', 'p': 20, 'd': 30}, cfg, T0 + 30); chk('royal 20 % sets all three', r == 'ok' and all(st['bst'][k]['p'] == 20 for k in BO.KINDS))
st2 = fresh(5); r, info = SH.buy(st2, {'id': 'boost', 'kind': 'mine', 'p': 20, 'd': 30}, cfg, T0); chk('no sapphire -> gems', r == 'gems')
for bad_body in ({'id': 'boost', 'kind': 'build', 'p': 7, 'd': 1}, {'id': 'boost', 'kind': 'x', 'p': 5, 'd': 1}, {'id': 'boost', 'kind': 'build', 'p': 5, 'd': 2}, {'id': 'boost', 'kind': 'build', 'p': 'NaN', 'd': 1}, {'id': 'zzz'}):
    if SH.buy(st, bad_body, cfg, T0)[0] != 'bad': chk('bad body refused %r' % bad_body, False)
chk('bad bodies refused', True)
for i in range(4): r, _ = SH.buy(st, {'id': 'tesla'}, cfg, T0)
r3, _ = SH.buy(st, {'id': 'tesla'}, cfg, T0); chk('four Tesla coils, not five', st['own']['tesla'] == 4 and r3 == 'max')
DL = M.UNITS['dragonling']['lv']                                    # (p35: Lair Lv 18)
st['b']['lair'] = DL - 1; st['b']['training'] = 5
chk('dragonling locked below Lair Lv %d' % DL, M.can_train(st, 'dragonling', 1, T0)[0] == 'locked')
st['b']['lair'] = DL
chk('dragonling is a normal Lair Lv %d unit (no egg)' % DL, M.can_train(st, 'dragonling', 1, T0)[0] == 'ok')
chk('the egg is not sold any more', SH.buy(st, {'id': 'egg_dragonling'}, cfg, T0)[0] == 'bad' and 'egg_dragonling' not in SH.catalog(st, cfg, T0)['items'])
bad_cfg = SH.cfg_from(json.dumps({'boost': {'build': 0, 'army': -5, 'mine': 'x'}, 'conv': {'turq': [0, 5]}, 'items': {'tesla': [1]}}))
chk('bad panel numbers fall back to defaults', bad_cfg['boost']['build'] == 5 and bad_cfg['conv']['turq'] == [1, 10] and bad_cfg['items']['tesla'] == [10, 15, 20, 25])

# ---- unit levels
chk('unit power grows with its building level', M.unit_power('spear', 1, 20) > M.unit_power('spear', 1, 8) > M.unit_power('spear', 1, 1))
chk('reference power rises every castle level', all(M.P_REF[i] < M.P_REF[i + 1] for i in range(19)))

# ---- conversions from the bot (inbox): per gem, once, above the vault
class FakeR:
    def __init__(self): self.d = {}
    async def get(self, k): return self.d.get(k)
async def main():
    store = S.STORE; uid = 6161
    fr = FakeR(); fr.d['bluewall:st:%d' % uid] = json.dumps({'b': {'keep': 5}})
    q = await B.quote(fr, uid, 'turq', 5)
    chk('quote: 5 blue at castle 5 = %s turquoise (x%.2f)' % (q['out'], q['mult']), q['out'] == int(5 * 10 * 1.13 ** 4))
    chk('quote: sapphire is flat', (await B.quote(fr, uid, 'sap', 3))['out'] == 30)
    chk('quote: onyx needs multiples of 2', await B.quote(fr, uid, 'onyx', 3) is None and (await B.quote(fr, uid, 'onyx', 4))['out'] == 2)
    fr.d[SH.CFG_KEY] = json.dumps({'conv': {'turq': [2, 30]}})
    chk('quote follows the owner rate (2 -> 30)', (await B.quote(fr, uid, 'turq', 4))['out'] == int(2 * 30 * 1.13 ** 4))
    d0 = await store.get(uid)
    e = json.loads(B.convert_entry({'ruby': 50_000, 'sap': 7}, 'cv:abc'))
    await store.push_inbox(uid, e); d = await store.get(uid)
    chk('conversion paid: ruby above the vault + sapphire', d['gems']['ruby'] == d0['gems']['ruby'] + 50_000 and d['prem']['sap'] == d0['prem']['sap'] + 7 and d['gift']['conv'] == 1)
    await store.push_inbox(uid, e); d2 = await store.get(uid)
    chk('same conversion id replayed is ignored', d2['gems']['ruby'] == d['gems']['ruby'] and d2['prem']['sap'] == d['prem']['sap'])
    big = json.loads(B.convert_entry({'turq': 10 ** 9}, 'cv:big')); await store.push_inbox(uid, big); d3 = await store.get(uid)
    chk('absurd amount clamped', d3['gems']['turq'] - d2['gems']['turq'] == S.INBOX_MAX_CONV)
    gift = {'id': 'evil:1', 'src': 'manual', 'ruby': 10 ** 7}; await store.push_inbox(uid, gift); d4 = await store.get(uid)
    chk('a non-conversion gift keeps the small clamp', d4['gems']['ruby'] - d3['gems']['ruby'] == S.INBOX_MAX_TURQ)
    # state API: shop through the store, boosts in the view
    await store.dev(uid, {'prem': {'sap': 5000, 'onyx': 50}})
    out = await store.shop(uid, {'id': 'boost', 'kind': 'mine', 'p': 15, 'd': 7})
    chk('store.shop -> view shows the boost', out['ok'] and out['bst']['mine']['p'] == 15 and out['mines']['ruby']['rate'] > 0)
    chk('view carries the shop catalog', out['shop']['boost']['price']['royal']['20']['30'] == SH.boost_price(SH.cfg_from(None), 'royal', 20, 30))
asyncio.run(main())
async def gidtest():
    try:
        import fakeredis.aioredis as FR
    except Exception:
        chk('fakeredis missing (skip gid test)', True); return
    R = FR.FakeRedis(decode_responses=True); st2 = S.Store(); st2._r = R; uid = 7171
    await st2.get(uid)
    e = B.convert_entry({'sap': 5}, 'cv:AAA')
    await R.rpush('bluewall:inbox:%d' % uid, e); d = await st2.get(uid)
    for i in range(320): await R.rpush('bluewall:inbox:%d' % uid, json.dumps({'id': 'g%d' % i, 'src': 'prize', 'turq': 1}))
    for k in range(8): await st2.get(uid)
    await R.rpush('bluewall:inbox:%d' % uid, e); d2 = await st2.get(uid)
    chk('a conversion id resent after 320 other gifts pays once (sap %s)' % d2['prem']['sap'], d['prem']['sap'] == 5 and d2['prem']['sap'] == 5)
asyncio.run(gidtest())

print('ECON OK' if not bad else 'ECON FAILED'); sys.exit(1 if bad else 0)
