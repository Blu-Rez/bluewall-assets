import asyncio, os, json, sys
os.environ["BLUEWALL_STATE"] = "memory"
sys.path.insert(0, "/home/claude/dev/stubcfg"); sys.path.insert(0, "/home/claude/bot/bluebot_v2")
from bluewall import state as S, bridge as B
async def main():
    st = S.Store(); uid = 4242
    v = await st.get(uid); t0 = v["gems"]["turq"]; assert v["gift"] is None
    # the bot queues 5 blue gems for a hokm win (twice with the same gid = once) + a malformed one + a huge one
    st._inbox[uid] = [B.entry(5, "hokm:1", "hokm:1:4242"), B.entry(5, "hokm:1", "hokm:1:4242"), "garbage", B.entry(2, "hokm:2", "hokm:2:4242")]
    v = await st.get(uid)
    assert v["gems"]["turq"] == t0 + 70, v["gems"]
    assert v["gift"] and v["gift"]["turq"] == 70, v["gift"]
    assert st._inbox[uid] == [], st._inbox
    v = await st.get(uid); assert v["gift"] is None and v["gems"]["turq"] == t0 + 70
    # replay of an already used id after the inbox was trimmed (crash between save and trim) is ignored
    st._inbox[uid] = [B.entry(5, "hokm:1", "hokm:1:4242")]
    v = await st.get(uid); assert v["gems"]["turq"] == t0 + 70 and v["gift"] is None
    # an endpoint other than get() sees the gift in its view, get() consumes it
    st._inbox[uid] = [B.entry(1, "x", "x1")]
    c = await st.collect(uid, "ruby"); assert c["gift"] and c["gift"]["turq"] == 10
    g = await st.get(uid); assert g["gift"] and g["gift"]["turq"] == 10
    g = await st.get(uid); assert g["gift"] is None
    # sanity bound
    st._inbox[uid] = [json.dumps({"id": "big", "blue": 10**9})]
    before = (await st.get(uid))["gems"]["turq"]
    print("ok turq", before)
asyncio.run(main())
