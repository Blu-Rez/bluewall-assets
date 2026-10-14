import asyncio, os, json, sys
os.environ["BLUEWALL_STATE"] = "memory"
sys.path.insert(0, "/home/claude/dev/stubcfg"); sys.path.insert(0, "/home/claude/bot/bluebot_v2")
from bluewall import state as S, social as SO, clan as CL
async def setk(st, uid, **kw):
    async with st._lock(uid):
        s = await st._txn(uid)
        for k, v in kw.items():
            if k == "keep": s["b"]["keep"] = v
            else: s[k] = v
        await st.save(uid, s)
async def main():
    st = S.Store(); cl = st.clans; A, B, C, D = 2001, 2002, 2003, 2004
    for u, n in ((A, "Ana"), (B, "Bob"), (C, "Cy"), (D, "Dee")): await st.touch(u, n)
    # castle too low
    r = await cl.create(A, "Blue Fleet", "BF"); assert not r["ok"] and r["why"] == "low", r
    for u in (A, B, C): await setk(st, u, keep=2)
    assert (await cl.create(A, "Bl", "BF"))["why"] == "name"
    assert (await cl.create(A, "Blue Fleet", "b"))["why"] == "tag"
    assert (await cl.create(A, "Blue Fleet", "TOOLONG"))["why"] == "tag"
    r = await cl.create(A, "  Blue   Fleet ", "bf"); assert r["ok"], r; cid = r["id"]
    assert (await cl.create(A, "Another", "AN"))["why"] == "in_clan"
    assert (await cl.create(B, "blue fleet", "BX"))["why"] == "taken"       # names are unique (case-blind)
    # cups flow into the clan total
    await setk(st, A, tro=300); await st._lb_set(A, await st.load(A))
    v = await cl.view(A); assert v["mine"]["tro"] == 300 and v["mine"]["owner"] == A and v["mine"]["me_owner"] and v["mine"]["tag"] == "BF", v["mine"]
    assert v["top"][0]["id"] == cid and v["top"][0]["tro"] == 300
    # join: low castle / full / already in
    assert (await cl.join(D, cid))["why"] == "low"
    assert (await cl.join(B, cid))["ok"]
    assert (await cl.join(B, cid))["why"] == "in_clan"
    assert (await cl.join(C, 999))["why"] == "gone"
    await setk(st, B, tro=500); await st._lb_set(B, await st.load(B))
    v = await cl.view(B); assert v["mine"]["tro"] == 800 and [m["n"] for m in v["mine"]["members"]] == ["Bob", "Ana"], v["mine"]["members"]
    assert not v["mine"]["me_owner"]
    # only the owner kicks
    assert (await cl.kick(B, A))["why"] == "owner"
    # fill to the limit
    for i in range(CL.MAX_MEMBERS - 2):
        u = 3000 + i; await st.touch(u, "M%d" % i); await setk(st, u, keep=2); assert (await cl.join(u, cid))["ok"]
    assert (await cl.join(C, cid))["why"] == "full"
    assert (await cl.kick(A, 3000))["ok"] and (await cl.join(C, cid))["ok"]
    assert (await st.load(3000)).get("clan") is None
    # owner leaves: the strongest member (Bob 500) takes over
    assert (await cl.leave(A))["ok"]
    v = await cl.view(B); assert v["mine"]["owner"] == B and v["mine"]["n"] == CL.MAX_MEMBERS - 1 and v["mine"]["tro"] == 500, (v["mine"]["owner"], v["mine"]["n"], v["mine"]["tro"])
    assert (await cl.leave(A))["why"] == "none"
    # everybody leaves -> the clan and its name are gone
    for u in list(range(3001, 3000 + CL.MAX_MEMBERS - 2)) + [B, C]:
        assert (await cl.leave(u))["ok"], u
    v = await cl.view(A); assert v["mine"] is None and v["top"] == [], v
    assert (await cl.create(A, "Blue Fleet", "BF"))["ok"]                       # the name is free again
    # friends + history
    assert await st.refer(D, A) is True
    f = await st.friends(A); assert [x["id"] for x in f["friends"]] == [D] and not f["friends"][0]["paid"], f
    h = await st.history(A); assert h["log"] == []
    print("clan ok")
asyncio.run(main())
