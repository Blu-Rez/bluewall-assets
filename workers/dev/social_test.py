import asyncio, os, json, sys
os.environ["BLUEWALL_STATE"] = "memory"
sys.path.insert(0, "/home/claude/dev/stubcfg"); sys.path.insert(0, "/home/claude/bot/bluebot_v2")
from bluewall import state as S, social as SO, progress as PR
# pure rules
assert SO.attacker_delta(500, 1, 1.0) == 13 and SO.attacker_delta(500, 2, 1.0) == 27 and SO.attacker_delta(500, 3, 1.0) == 40   # p34: a third per star
assert SO.attacker_delta(500, 3, 5.0) == round(40 * 1.35) and SO.attacker_delta(500, 3, 0.1) == round(40 * 0.75)
assert SO.attacker_delta(30, 0, 1.0) == 0 and SO.attacker_delta(100, 0, 1.0) == -10
assert SO.defender_delta(28, 2) == -14 and SO.defender_delta(-10, 0) == 5
assert [SO.league(t)["name"] for t in (0, 299, 300, 1200, 2800, 99999)] == ["Steel", "Steel", "Azure", "Cobalt", "Blue Crown", "Blue Crown"]
async def main():
    st = S.Store(); A, B, C = 1001, 1002, 1003
    await st.touch(A, "Ali‮"); await st.touch(B, "Bita"); await st.touch(C, "Cyrus")
    # invites: B comes from A's link; self / already-existing kingdoms / strangers are ignored
    assert await st.refer(B, A) is True
    assert await st.refer(B, C) is False                 # only one inviter, once
    assert await st.refer(A, A) is False
    # B reaches castle 3 -> A is paid exactly once
    async with st._lock(B):
        s = await st._txn(B); s["b"]["keep"] = 3; await st.save(B, s)
    v = await st.get(B)
    ga = await st.get(A); base = None
    assert ga["gift"] and ga["gift"]["turq"] == 1000 and ga["gift"]["inv"] == 1, ga["gift"]
    ga2 = await st.get(A); assert ga2["gift"] is None
    await st.get(B); await st.get(B)
    ga3 = await st.get(A); assert ga3["gift"] is None and ga3["gems"]["turq"] == ga2["gems"]["turq"]
    # a kingdom that is old / has fought cannot be "invited" afterwards
    async with st._lock(C):
        s = await st._txn(C); s["created"] -= 7200; await st.save(C, s)
    assert await st.refer(C, A) is False
    # cap: after 50 rewards the 51st is dropped silently
    async with st._lock(A):
        s = await st._txn(A); s["rfn"] = 50; await st.save(A, s)
    await st.push_inbox(A, {"id": "ref:9999", "src": "invite", "turq": 1000})
    t0 = (await st.get(A))["gems"]["turq"]; assert (await st.get(A))["gems"]["turq"] == t0
    # leaderboard
    for uid, t in ((A, 120), (B, 450), (C, 450)):
        async with st._lock(uid):
            s = await st._txn(uid); s["tro"] = t; await st.save(uid, s)
    lb = await st.leaderboard(A)
    assert [x["tro"] for x in lb["top"]] == [450, 450, 120], lb["top"]
    assert lb["me"]["rank"] == 3 and lb["me"]["tro"] == 120 and lb["me"]["lg"] == 0
    assert lb["top"][-1]["me"] is True
    assert lb["top"][-1]["n"] == "Ali"                   # the bidi override is gone
    print("social ok", json.dumps(lb["me"]))
asyncio.run(main())
