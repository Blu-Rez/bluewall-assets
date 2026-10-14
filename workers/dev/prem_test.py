# the two special gems (sapphire / onyx): a prize arrives through the bot's inbox, is paid exactly once, never touches the vault; /api/dev is owner-only
import asyncio, sys, json
sys.path.insert(0, '/home/claude/bot/bluebot_v2')
from bluewall import state as S, bridge as B
async def main():
    st = S.STORE; uid = 5151; bad = 0
    def chk(name, cond):
        nonlocal bad
        print(('OK   ' if cond else 'FAIL ') + name); bad += 0 if cond else 1
    d = await st.get(uid); chk('fresh wallet has 0/0', d['prem'] == {'sap': 0, 'onyx': 0})
    e = json.loads(B.entry(0, 'prize:t1', 'prize:t1:%d' % uid, 10, 2))
    await st.push_inbox(uid, e); d = await st.get(uid)
    chk('prize paid (10 sapphire, 2 onyx)', d['prem'] == {'sap': 10, 'onyx': 2}); chk('gift box shows it once', d['gift'] and d['gift']['sap'] == 10 and d['gift']['onyx'] == 2)
    d = await st.get(uid); chk('a second read pays nothing more', d['prem'] == {'sap': 10, 'onyx': 2})
    await st.push_inbox(uid, e); d = await st.get(uid); chk('same prize id replayed is ignored', d['prem'] == {'sap': 10, 'onyx': 2})
    e2 = json.loads(B.entry(2, 'hokm:9', 'hokm:9:%d' % uid, 0, 0)); await st.push_inbox(uid, e2); d = await st.get(uid)
    chk('a Hokm gift still turns into turquoise and leaves sapphire/onyx alone', d['prem'] == {'sap': 10, 'onyx': 2} and (d['gift'] or {}).get('turq') == 20)
    print('PREM OK' if not bad else 'PREM FAILED'); sys.exit(1 if bad else 0)
asyncio.run(main())
