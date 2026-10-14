# Bot side of the Blue Wall conversions, end to end on a throw-away SQLite DB + fakeredis:
# quote (castle level) -> guarded debit + ledger row -> inbox -> Blue Wall applies once; insufficient; rate changed; Redis down ->
# pending -> resend (same id, applied once); 30 parallel confirms on a balance for 10; bad admin numbers refused.
import asyncio, sys, os, json, time, tempfile
sys.path[:0] = ['/home/claude/work/bot/bluebot_v2', '/home/claude/bot/bluebot_v2']
os.environ['BLUEWALL_STATE'] = 'memory'
from decimal import Decimal
import fakeredis.aioredis as FR
import core.db_engine as DB
import core.multibot as MB
from modules.game.models import GamerCurrencies
from modules.game.services import bluewall_xfer as BX
from bluewall import state as BWS, shop as SH

bad = 0
def chk(name, cond):
    global bad
    print(('OK   ' if cond else 'FAIL ') + name); bad += 0 if cond else 1

R = FR.FakeRedis(decode_responses=True)
MB._R = R
async def bal(uid):
    async with DB.session_scope() as s:
        c = await s.get(GamerCurrencies, uid); return (c.firoozeh, c.zomorrod, c.yaghoot)

async def main():
    db = tempfile.mktemp(suffix='.db')
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
    DB._engine = create_async_engine('sqlite+aiosqlite:///' + db, connect_args={'timeout': 30})
    DB._Session = async_sessionmaker(bind=DB._engine, class_=AsyncSession, expire_on_commit=False, autoflush=False)
    async with DB.get_engine().begin() as conn:
        await conn.run_sync(lambda sc: GamerCurrencies.__table__.create(sc, checkfirst=True))
    uid = 4242
    async with DB.session_scope() as s:
        s.add(GamerCurrencies(user_id=uid, firoozeh=Decimal(100), zomorrod=50, yaghoot=20, bullet=Decimal(0)))
    # Blue Wall side reads the same fake Redis
    store = BWS.Store(); store._r = R
    await R.set('bluewall:st:%d' % uid, json.dumps({'b': {'keep': 5}, 'level': 5}))
    ok, err, q = await BX.quote(uid, 'bw_t', 10)
    chk('quote 10 blue at castle 5 -> %s turquoise' % q.get('gain'), ok and q['gain'] == int(10 * 10 * 1.13 ** 4))
    chk('onyx quote needs multiples of 2', not (await BX.quote(uid, 'bw_o', 3))[0] and (await BX.quote(uid, 'bw_o', 4))[2]['gain'] == 2)
    ok, msg = await BX.convert(uid, 'bw_t', 10, expect={'gain': q['gain'], 'rate': q['rate']})
    chk('convert ok: ' + msg.split('\n')[0], ok)
    chk('10 firoozeh debited', (await bal(uid))[0] == Decimal(90))
    items = await R.lrange('bluewall:inbox:%d' % uid, 0, -1)
    chk('one gift in the Blue Wall inbox', len(items) == 1 and json.loads(items[0])['src'] == 'convert' and json.loads(items[0])['turq'] == q['gain'])
    async with DB.session_scope() as s:
        rows = (await s.execute(BX.transfers.select())).all()
    chk('ledger row sent', len(rows) == 1 and rows[0].status == 'sent')
    ok, msg = await BX.convert(uid, 'bw_r', 25)
    chk('not enough red -> refused, nothing moved', not ok and (await bal(uid))[2] == 20)
    ok, msg = await BX.convert(uid, 'bw_t', 10, expect={'gain': q['gain'] + 1, 'rate': q['rate']})
    chk('changed quote -> refused', not ok and (await bal(uid))[0] == Decimal(90))
    # Redis down at delivery: pending, then resent once, Blue Wall applies once
    real = BX._bridge
    class Dead:
        async def convert(self, *a, **k): return False
        async def quote(self, r, u, g, n): return await real().quote(r, u, g, n)
        async def rates(self, r): return await real().rates(r)
        async def castle_level(self, r, u): return await real().castle_level(r, u)
    BX._bridge = lambda: Dead()
    ok, msg = await BX.convert(uid, 'bw_s', 2)
    chk('delivery down -> debit kept, message says queued', ok and 'صف' in msg and (await bal(uid))[2] == 18)
    BX._bridge = real
    async with DB.session_scope() as s:
        pend = (await s.execute(BX.transfers.select().where(BX.transfers.c.status == 'pending'))).all()
    chk('one pending transfer', len(pend) == 1)
    BX.RESEND_AFTER_S = 0
    n = await BX.resend_pending(force=True); n2 = await BX.resend_pending(force=True)
    chk('resent once', n == 1 and n2 == 0)
    await R.rpush('bluewall:inbox:%d' % uid, (await R.lrange('bluewall:inbox:%d' % uid, -1, -1))[0])   # (a duplicate delivery of the same id)
    st = await store.get(uid)
    chk('Blue Wall got turquoise + 20 sapphire exactly once', st['prem']['sap'] == 20 and st['gems']['turq'] == q['gain'])
    st2 = await store.get(uid); chk('nothing more on the next read', st2['prem']['sap'] == 20 and st2['gems']['turq'] == q['gain'])
    # 30 parallel conversions of 2 green each with 50 green -> exactly 25 succeed, balance 0, never negative
    res = await asyncio.gather(*[BX.convert(uid, 'bw_e', 2) for _ in range(30)])
    okn = sum(1 for o, _ in res if o)
    b = await bal(uid)
    chk('parallel: %d ok, green left %s' % (okn, b[1]), okn == 25 and b[1] == 0)
    async with DB.session_scope() as s:
        rows = (await s.execute(BX.transfers.select().where(BX.transfers.c.gem == 'emerald'))).all()
    chk('parallel: one ledger row per success', len(rows) == 25)
    # admin price list
    chk('admin: set royal boost 15', await BX.set_cfg(('boost', 'royal'), 15) and (await BX.get_cfg())['boost']['royal'] == 15)
    chk('admin: 0 refused', not await BX.set_cfg(('boost', 'royal'), 0) and (await BX.get_cfg())['boost']['royal'] == 15)
    chk('admin: conv pair', await BX.set_cfg(('conv', 'turq'), [2, 30]) and (await BX.quote(uid, 'bw_t', 2))[2]['rate'] == [2, 30])
    chk('admin: unknown key refused', not await BX.set_cfg(('boost', 'nope'), 5))
    SH._cache['cfg'] = None; cfg = await SH.load_cfg(R); chk('Blue Wall reads the new price list', cfg['boost']['royal'] == 15 and cfg['conv']['turq'] == [2, 30])
    print('XFER OK' if not bad else 'XFER FAILED')
asyncio.run(main())
sys.exit(1 if bad else 0)
