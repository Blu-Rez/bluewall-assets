#!/usr/bin/env python3
"""layout_server_test.py - TR2-S5 server half (bluewall/layout.py + /api/layout + player_target).  Last line: "LAYOUT SERVER OK".
  1  data      bluewall/layout_geom.json == workers/docs/tr2_s5_geom.json (regenerate + ship both when the town data changes)
  2  port      the spec vectors (single / load / reject) and the 2500 fuzz poses on OUR module                       (reference: workers/docs/tr2_s5_ref_rules.py)
  3  same      400 random records: layout.canonical_load == the reference canonical_load, byte for byte (+ idempotent)
  4  cost      the worst record (all 85 things moved, invalid) and an honest full record stay fast
  5  endpoints GET / POST /api/layout: 403 locked, null, ok, clash -> dropped, 400 reasons, 413, size, 429 rate, empty record, stale plan id, 503 off, deep JSON, concurrency
  6  attack    military.player_target carries `layout` only when the player really moved something; scout() forwards it, hides kind / _victim; bots never carry one
"""
import asyncio, hashlib, importlib, json, os, random, sys, time
os.environ["BLUEWALL_STATE"] = "memory"
ROOT = "/home/claude/bot/bluebot_v2"
DOCS = os.environ.get("LAYOUT_DOCS") or ROOT + "/workers/docs"
sys.path.insert(0, ROOT); sys.path.insert(0, DOCS)
import tr2_s5_ref_rules as REF
from bluewall import layout as LY
from bluewall import military as MI

bad = 0
def say(ok, name, extra=""):
    global bad
    bad += 0 if ok else 1
    print(("ok   " if ok else "FAIL ") + name + (("   " + str(extra)[:300]) if extra and not ok else ""))

# ---------------------------------------------------------------- 1 data
sha = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()
say(sha(str(LY.GEOM_PATH)) == sha(DOCS + "/tr2_s5_geom.json"), "data: bluewall/layout_geom.json == docs/tr2_s5_geom.json")
G = LY.load_geom(LY.GEOM_PATH); GR = REF.load_geom(DOCS + "/tr2_s5_geom.json")
V = json.load(open(DOCS + "/tr2_s5_vectors.json")); F = json.load(open(DOCS + "/tr2_s5_fuzz.json"))
h_tol = G["tolerance"]["hTol"]; things = G["things"]; ids = [t["id"] for t in things]; by = G["_things"]

# ---------------------------------------------------------------- 2 port
n_bad = 0
for v in V["single"]:
    eff = LY.canonical_load(G, v["layout"]).get("effective", {}) if v.get("layout") else {}
    rs = LY.current_records(G, eff); me = next(r for r in rs if r["id"] == v["id"])
    got = LY.check_pose(G, me, tuple(v["pose"]), rs, h_tol)
    if got != v["expect"]["why"]:
        n_bad += 1; print("FAIL single", v["name"], got, v["expect"]["why"])
for v in V["load"] + V["reject"]:
    r = LY.canonical_load(G, v["record"]); e = v["expect"]
    ok = (r["status"] == "reject" and r["why"] == e["why"]) if e["status"] == "reject" else (r["status"] == "ok" and r["effective"] == e["effective"] and r["dropped"] == e["dropped"])
    if not ok:
        n_bad += 1; print("FAIL record", v["name"], str(r)[:160])
say(n_bad == 0, "port: %d single + %d load + %d reject vectors" % (len(V["single"]), len(V["load"]), len(V["reject"])), n_bad)
rs0 = LY.current_records(G, {}); by0 = {r["id"]: r for r in rs0}
nf = sum(1 for id_, x, z, ry, want in F["cases"] if ",".join(LY.check_pose(G, by0[id_], (x, z, ry), rs0, h_tol)) != want)
say(nf == 0, "port: %d fuzz poses" % len(F["cases"]), nf)

# ---------------------------------------------------------------- 3 same as the reference
rng = random.Random(20261015)
def pose_for(t):
    m = rng.random()
    if m < .30: return [t["x"], t["z"], t["ry"]]                                                              # the default place (valid)
    if m < .50: return [t["x"] + rng.uniform(-3, 3), t["z"] + rng.uniform(-3, 3), t["ry"] + rng.uniform(-.5, .5)]   # a small move (often valid, often a clash)
    if m < .65:
        o = by[rng.choice(ids)]; return [o["x"] + rng.uniform(-2, 2), o["z"] + rng.uniform(-2, 2), o["ry"]]     # onto another thing (clash / swap)
    if m < .90: return [rng.uniform(-90, 90), rng.uniform(-90, 90), rng.uniform(-3.2, 3.2)]                       # somewhere in / near the town
    return [rng.uniform(-300, 300), rng.uniform(-300, 300), rng.uniform(-3, 3)]                                    # far away
diff = 0; kept = dropped_n = 0; idem = 0; rbad = 0
CODES = ["WALL", "MOAT", "GATE", "MARKET", "VAULT", "OVERLAP", "STREET", "RIVER", "WATER", "STREAM", "DRY", "SLOPE"]
NREC = 412   # 400 small / medium records + 8 of 30 things + 4 of ALL things (the reference needs ~1-6 s for the big ones)
for i in range(NREC):
    k = rng.choice([1, 2, 3, 5, 8, 15]) if i < 400 else (30 if i < 408 else len(ids)); m = {}
    for id_ in rng.sample(ids, k): m[id_] = pose_for(by[id_])
    if rng.random() < .15: m["not_a_thing_%d" % i] = [1, 2, 3]
    rec = {"v": 1, "g": "x", "m": m}
    a, b = LY.canonical_load(G, rec), REF.canonical_load(GR, rec)
    for d in a["dropped"]:                                                                                    # LY1: every dropped id says WHY (rule codes; UNKNOWN = no such id) — and a clean record carries no `reasons` at all
        rr = (a.get("reasons") or {}).get(d)
        if not rr or any(c not in CODES + ["UNKNOWN"] for c in rr) or (d in G["_things"] and "UNKNOWN" in rr): rbad += 1
    if not a["dropped"] and "reasons" in a: rbad += 1
    if sorted(a.get("reasons") or {}) != sorted(a["dropped"]): rbad += 1
    a = {k: v for k, v in a.items() if k != "reasons"}
    if a != b:
        diff += 1
        if diff <= 3: print("FAIL differs", i, k, str(a)[:200], str(b)[:200])
        continue
    kept += len(a["effective"]); dropped_n += len(a["dropped"])
    again = LY.canonical_load(G, {"v": 1, "m": a["effective"]})
    idem += 1 if (again["status"] == "ok" and again["effective"] == a["effective"] and again["dropped"] == []) else 0
say(diff == 0, "same: %d random records == the reference (kept %d things, dropped %d)" % (NREC, kept, dropped_n), diff)
say(rbad == 0, "LY1: every dropped id has its reasons (rule codes, UNKNOWN only for an id that does not exist); a clean record has none", rbad)
say(idem == NREC - diff and kept > 100 and dropped_n > 100, "same: idempotent (effective of effective == itself) and the records were not all trivial", (idem, kept, dropped_n))
for rec, why in (({"v": 1, "m": {"cottage_00": [10 ** 400, 0, 0]}}, "triple cottage_00"), ({"v": 1, "m": {"cottage_00": [float("nan"), 0, 0]}}, "triple cottage_00"),
                 ({"v": 1, "m": {"cottage_00": [True, 0, 0]}}, "triple cottage_00"), ({"v": 1, "m": {"cottage_00": [6000, 0, 0]}}, "range cottage_00"), ({"v": 1, "m": []}, "m"),
                 ({"v": True, "m": {}}, "version"), ([], "version"), (None, "not an object"), ({"v": 1, "m": {"Bad-Id": [0, 0, 0]}}, "id Bad-Id")):
    r = LY.canonical_load(G, rec)
    say(r["status"] == "reject" and r["why"] == why, "shape: %s -> %s" % (str(rec)[:48], why), r)

# ---------------------------------------------------------------- 4 cost
rng2 = random.Random(7)
worst = {"v": 1, "m": {i: [rng2.uniform(-60, 60), rng2.uniform(-60, 60), rng2.uniform(0, 6)] for i in ids}}
t0 = time.perf_counter(); r = LY.canonical_load(G, worst); dt = time.perf_counter() - t0
say(dt < 1.5 and r["status"] == "ok", "cost: all %d things moved at random (worst record): %.2f s (reference 6+ s), kept %d" % (len(things), dt, len(r["effective"])), dt)
honest = {"v": 1, "m": {t["id"]: [t["x"], t["z"], t["ry"]] for t in things}}
t0 = time.perf_counter(); r = LY.canonical_load(G, honest); dt = time.perf_counter() - t0
say(dt < 1.0 and r["dropped"] == [] and len(r["effective"]) == len(things), "cost: all %d at their default places (valid): %.2f s" % (len(things), dt), dt)
stack = {"v": 1, "m": {t["id"]: [things[0]["x"], things[0]["z"], 0] for t in things}}                              # all on one spot: many clashes, one pass drops one
t0 = time.perf_counter(); r = LY.canonical_load(G, stack); dt = time.perf_counter() - t0
say(dt < 1.5 and r["status"] == "ok", "cost: all %d on one spot: %.2f s, kept %d" % (len(things), dt, len(r["effective"])), dt)

# ---------------------------------------------------------------- 5 endpoints
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer
srv = importlib.import_module("bluewall.server"); ST = importlib.import_module("bluewall.state")
def _uid(req):
    h = req.headers.get("Authorization", "")
    return int(h[7:]) if h.startswith("Bearer ") and h[7:].isdigit() else None
srv._bearer_uid = _uid
PID = G["planId"]
ok_load = next(v for v in V["load"] if v["expect"]["status"] == "ok" and v["expect"]["dropped"] == [] and v["expect"]["effective"])
clash = next(v for v in V["load"] if v["expect"]["status"] == "ok" and v["expect"]["dropped"] and v["expect"]["effective"])
clk = [1000.0]; LY._clock = lambda: clk[0]

async def endpoints():
    async with TestClient(TestServer(srv.make_app())) as c:
        H = lambda u: {"Authorization": "Bearer %d" % u}
        async def call(method, u, body=None, raw=None, ct="application/json"):
            kw = {"headers": H(u) if u else {}}
            if raw is not None: kw["data"] = raw; kw["headers"] = {**kw["headers"], "Content-Type": ct}
            elif body is not None: kw["json"] = body
            r = await c.request(method, "/api/layout", **kw)
            try: j = await r.json()
            except Exception: j = None
            return r.status, j
        s, j = await call("GET", None); say(s == 403 and j == {"ok": False, "reason": "locked"}, "GET without a token -> 403 {reason: locked}, no `why` (the client keeps its record)", (s, j))
        s, j = await call("POST", None, {"layout": ok_load["record"]}); say(s == 403 and "why" not in (j or {}), "POST without a token -> 403", (s, j))
        s, j = await call("GET", 101); say(s == 200 and j == {"ok": True, "layout": None}, "GET a new player -> layout null", (s, j))
        s, j = await call("POST", 101, {"layout": ok_load["record"]})
        e = {"v": 1, "g": PID, "m": ok_load["expect"]["effective"]}
        say(s == 200 and j == {"ok": True, "layout": e, "dropped": []}, "POST a valid record -> the effective record + dropped []", (s, j))
        s, j = await call("GET", 101); say(s == 200 and j["layout"] == e, "GET gives back what the POST answered", (s, j))
        say(ST.STORE._mem[101].get("layout") == e, "stored in the player's state as st['layout']")
        clk[0] += 6
        s, j = await call("POST", 101, {"layout": clash["record"]})
        say(s == 200 and j["dropped"] == clash["expect"]["dropped"] and j["layout"]["m"] == clash["expect"]["effective"], "POST a clash -> the dropped ids are named, the rest stands", (s, j))
        say(s == 200 and sorted(j.get("reasons") or {}) == sorted(j["dropped"]) and all(j["reasons"][d] for d in j["dropped"]), "LY1: POST a clash -> `reasons` says why each dropped id went back", (s, j.get("reasons")))
        before = (await call("GET", 101))[1]["layout"]
        s, j = await call("POST", 101, {"layout": {"v": 2, "m": {}}}); say(s == 400 and j == {"ok": False, "why": "version"}, "POST a bad record -> 400 {why: version}", (s, j))
        say((await call("GET", 101))[1]["layout"] == before, "a rejected POST stores nothing")
        s, j = await call("POST", 101, raw="not json {"); say(s == 400 and j == {"ok": False, "why": "bad"}, "POST not JSON -> 400 {why: bad}", (s, j))
        s, j = await call("POST", 101, {}); say(s == 400 and j["why"] == "not an object", "POST without `layout` -> 400 not an object", (s, j))
        s, j = await call("POST", 101, raw="[" * 6000); say(s == 400 and j["why"] == "bad", "POST deeply nested JSON -> 400 bad (no crash)", (s, j))
        clk[0] += 6   # (every POST the limiter lets through counts, also the ones answered 400)
        s, j = await call("POST", 101, {"layout": {"v": 1, "m": {}}, "pad": "x" * 9000}); say(s == 413 and j == {"ok": False, "why": "size"}, "POST body > 8448 bytes -> 413 {why: size}", (s, j))
        big = {"v": 1, "m": {"u%030d" % i: [0, 0, 0] for i in range(197)}}
        assert 8192 < len(json.dumps(big, separators=(",", ":"))) < 8400
        s, j = await call("POST", 101, raw=json.dumps({"layout": big}, separators=(",", ":"))); say(s == 400 and j["why"] == "size", "POST record > 8192 bytes (body <= 8448) -> 400 {why: size}", (s, j))
        clk[0] += 6
        s, j = await call("POST", 101, {"layout": {"v": 1, "m": {"cottage_00": [0, 0, 0], "no_such_id": [1, 1, 1]}}})
        say(s == 200 and "no_such_id" in j["dropped"], "an unknown id is dropped, not an error", (s, j))
        say(s == 200 and (j.get("reasons") or {}).get("no_such_id") == ["UNKNOWN"], "LY1: an unknown id is answered with reasons {id: [UNKNOWN]}", (s, j.get("reasons")))
        # the rate limit: 5 accepted POSTs in any 5 s, a refused one is not counted
        clk[0] += 10; codes = []
        for _ in range(7): codes.append((await call("POST", 102, {"layout": {"v": 1, "m": {}}}))[0])
        say(codes == [200] * 5 + [429] * 2, "rate: 5 accepted in 5 s, then 429", codes)
        s, j = await call("POST", 102, {"layout": {"v": 1, "m": {}}}); say(s == 429 and j == {"ok": False, "why": "rate"}, "rate: the 429 body is {why: rate} (the client retries later)", (s, j))
        clk[0] += 5.5; s, j = await call("POST", 102, {"layout": {"v": 1, "m": {}}}); say(s == 200, "rate: free again after the window", (s, j))
        clk[0] += 10; s, j = await call("POST", 103, {"layout": {"v": 1, "m": {}}}); say(s == 200 and j["layout"] == {"v": 1, "g": PID, "m": {}} and j["dropped"] == [], "rate: another player is not limited by 102")
        # an empty effective record = no layout
        clk[0] += 10; await call("POST", 103, {"layout": ok_load["record"]}); clk[0] += 6
        s, j = await call("POST", 103, {"layout": {"v": 1, "m": {}}})
        say(s == 200 and j["layout"]["m"] == {} and (await call("GET", 103))[1] == {"ok": True, "layout": None} and "layout" not in ST.STORE._mem[103], "an empty record is stored as no layout (GET -> null)")
        # a changed plan (a deploy): GET judges the stored record again and keeps the result
        clk[0] += 10; await call("POST", 104, {"layout": ok_load["record"]})
        ST.STORE._mem[104]["layout"]["g"] = "old_plan"
        s, j = await call("GET", 104); say(j["layout"] == {"v": 1, "g": PID, "m": ok_load["expect"]["effective"]} and ST.STORE._mem[104]["layout"]["g"] == PID, "stale plan id: GET re-judges, re-stamps `g` and keeps the result", (s, j))
        ST.STORE._mem[104]["layout"] = {"v": 1, "g": "old_plan", "m": {"cottage_00": [900, 900, 0], "gone_id_7": [0, 0, 0]}}
        s, j = await call("GET", 104); say(j == {"ok": True, "layout": None} and "layout" not in ST.STORE._mem[104], "stale plan id + nothing valid left: GET -> null, key removed", (s, j))
        # no map data = the feature is off (503), the rest of the game does not care
        keep = LY.GEOM_PATH; LY.GEOM_PATH = keep.with_name("nope.json"); LY.geom()
        clk[0] += 10; s, j = await call("POST", 105, {"layout": ok_load["record"]}); say(s == 503 and j == {"ok": False, "why": "off"}, "no layout_geom.json -> POST 503 {why: off}", (s, j))
        s, j = await call("GET", 105); say(s == 200 and j["layout"] is None, "no layout_geom.json -> GET still answers (null)", (s, j))
        LY.GEOM_PATH = keep; LY.geom()
        # a tampered record must not freeze the loop: the worst record over HTTP, while a ticker keeps ticking
        gaps = []; stop = [False]
        async def ticker():
            last = time.perf_counter()
            while not stop[0]:
                await asyncio.sleep(0.01); n = time.perf_counter(); gaps.append(n - last); last = n
        tk = asyncio.ensure_future(ticker()); clk[0] += 10; t0 = time.perf_counter()
        res = await asyncio.gather(*[call("POST", 200 + i, {"layout": worst}) for i in range(4)])
        el = time.perf_counter() - t0; stop[0] = True; await tk
        say(all(s == 200 and j["ok"] for s, j in res) and el < 6, "4 worst-case records at once: %.2f s, all answered" % el, [(s, str(j)[:80]) for s, j in res])
        say(max(gaps) < 0.5, "the event loop stayed free while they were judged (longest stall %.0f ms)" % (max(gaps) * 1000), max(gaps))
asyncio.run(endpoints())

# ---------------------------------------------------------------- 6 the attack
ST_ = importlib.import_module("bluewall.state"); S = ST_.STORE
me = S._fresh(1); vic = S._fresh(2)
real = (MI.army_power, MI.defence_power); MI.army_power = lambda st, attack=False: 100.0; MI.defence_power = lambda lv, ap: 100.0
try:
    spec = MI.player_target(me, vic, 2, random.Random(1)); say(spec is not None and "layout" not in spec, "player_target: no layout when the player never moved anything", spec and sorted(spec))
    vic["layout"] = {"v": 1, "g": PID, "m": {}}; spec = MI.player_target(me, vic, 2, random.Random(1)); say("layout" not in spec, "player_target: an empty record is not sent (the client must not learn it is a real player)")
    vic["layout"] = {"v": 1, "g": PID, "m": ok_load["expect"]["effective"]}; spec = MI.player_target(me, vic, 2, random.Random(1)); say(spec.get("layout") == vic["layout"], "player_target: carries the defender's effective record", spec.get("layout"))
    class Pick(random.Random):
        def random(self): return 0.1                                                                              # (scout picks the player target)
    me2 = S._fresh(3); st, out = MI.scout(me2, 3, time.time(), spec, Pick(5))
    say(st == "ok" and out.get("layout") == vic["layout"] and "kind" not in out and "_victim" not in out, "scout(): forwards `layout`, still hides kind / _victim", (st, sorted(out or {})))
    bt = MI.bot_target(me, random.Random(3)); say("layout" not in bt, "bot_target: a made-up kingdom has no layout (= the default town)")
finally:
    MI.army_power, MI.defence_power = real

print("LAYOUT SERVER OK" if not bad else "LAYOUT SERVER FAILED (%d)" % bad)
sys.exit(1 if bad else 0)
