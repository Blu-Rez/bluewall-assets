#!/usr/bin/env python3
"""E1 checker: docs/economy_table.json (+ the Persian table) against the contract of the 15 packages and the live rules.   python3 dev/e1_check.py   ->  prints `E1 OK`"""
from __future__ import annotations

import json
import os
import re
import sys

sys.path.insert(0, "/home/claude/bot/bluebot_v2")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e1_model as M  # noqa: E402
from bluewall import military as MI  # noqa: E402
from bluewall import progress as P  # noqa: E402

DOCS = M.DOCS
# the contract (E1_economy_table.md): id -> (role, place, placeholder unlock level)
CONTRACT = {
    "lumber": ("S", "forest", 1), "quarry": ("S", "mount", 2), "iron": ("S", "mount", 8), "gold": ("S", "mount", 14), "panning": ("S", "water", 12),
    "oil": ("S", "free", 17), "farm": ("S", "free", 3), "greenhouse": ("S", "free", 11), "livestock": ("S", "free", 5), "slaughter": ("S/P", "free", 9),
    "fishery": ("S", "water", 6), "sawmill": ("P", "free", 4), "masonry": ("P", "free", 5), "smelter": ("P", "free", 9), "mint": ("P", "free", 15),
    "refinery": ("P", "free", 18), "mill": ("P", "free", 4), "bakery": ("P", "free", 5), "butcher": ("P", "free", 7), "smokehouse": ("P", "water", 8),
    "jeweler": ("P", "free", 20), "stores": ("T", "free", 1), "cottage": ("H", "free", 1), "craftsman": ("H", "free", 6), "merchant": ("H", "free", 12),
    "noble": ("H", "free", 20), "market": ("C", "free", 3), "tavern": ("C", "free", 6), "townhall": ("C", "free", 2), "chapel": ("C", "free", 1), "well": ("C", "free", 1),
}
LEVELS = ("5", "10", "20", "30")
BAD = []


def need(cond: bool, msg: str) -> None:
    if not cond:
        BAD.append(msg)


def main() -> int:
    jp, mp = os.path.join(DOCS, "economy_table.json"), os.path.join(DOCS, "economy_table_fa.md")
    need(os.path.isfile(jp) and os.path.isfile(mp), "docs/economy_table.json or docs/economy_table_fa.md missing")
    if BAD:
        print("\n".join("FAIL " + b for b in BAD))
        return 1
    d = json.load(open(jp, encoding="utf-8"))
    md = open(mp, encoding="utf-8").read()
    ks = {k["id"]: k for k in d["kinds"]}

    # 1. the kind ids = the contract, exactly, once each
    ids = [k["id"] for k in d["kinds"]]
    need(sorted(ids) == sorted(CONTRACT), "kind ids differ from the contract: missing %s, extra %s" % (sorted(set(CONTRACT) - set(ids)), sorted(set(ids) - set(CONTRACT))))
    need(len(ids) == len(set(ids)), "duplicate kind ids")
    need(d.get("ids") == ids, "`ids` list differs from the kinds")

    # 2. every record: fields, role / place as in the contract, steps and counts consistent
    for k in d["kinds"]:
        i = k["id"]
        for f in ("fa", "role", "place", "unlock", "count_steps", "count_at", "use", "place_price_hours", "place_crew_hours"):
            need(f in k, "%s: field %s missing" % (i, f))
        if i not in CONTRACT or not all(f in k for f in ("count_steps", "count_at", "unlock")):
            continue
        role, place, unlock = CONTRACT[i]
        need(k["role"] == role and k["place"] == place, "%s: role/place %s/%s differ from the contract %s/%s" % (i, k["role"], k["place"], role, place))
        need(k["unlock"] == unlock, "%s: unlock %s differs from the contract placeholder %s (allowed only if listed in the report)" % (i, k["unlock"], unlock))
        st = k["count_steps"]
        need(st and st[0][0] == k["unlock"], "%s: first step must open at the unlock level" % i)
        need(all(st[j][0] < st[j + 1][0] and st[j][1] < st[j + 1][1] for j in range(len(st) - 1)), "%s: steps must rise in level and in count" % i)
        c = [k["count_at"][L] for L in LEVELS]
        need(c == sorted(c), "%s: counts at 5/10/20/30 fall: %s" % (i, c))
        need(all(k["count_at"][str(L)] == M.count_at(M.BY_ID[i], L) for L in (5, 10, 20, 30)), "%s: count_at does not match the steps" % i)
        need(all(0 <= x <= 30 for x in c) and (k["unlock"] > 5 or c[0] >= 1), "%s: count at level 5 is %s but it opens at %s" % (i, c[0], k["unlock"]))
        need(all((k["count_at"][L] == 0) == (int(L) < k["unlock"]) for L in LEVELS), "%s: a count is 0 exactly while the kind is still locked" % i)
        need(all(("x" not in k and "z" not in k and "pos" not in k) for _ in [0]), "%s: no hard-wired positions allowed" % i)
        if "out" in k:
            need(k["out"]["base_per_h"] > 0 and k["out"]["res"] in d["resources"], "%s: bad out" % i)
        if "proc" in k and k["proc"]["in"] != ["gems"]:
            need(all(r in d["resources"] for r in k["proc"]["in"]) and k["proc"]["out"] in d["resources"] or k["proc"]["out"] == "cut_gems", "%s: bad proc resources" % i)
            for r in k["proc"]["in"]:     # a processor opens no earlier than the supplier of its input (or the processor before it)
                src = [x for x in d["kinds"] if ("out" in x and x["out"]["res"] == r) or ("proc" in x and x["proc"]["out"] == r)]
                need(src and min(s["unlock"] for s in src) <= k["unlock"], "%s opens (lv %s) before any supplier of %s" % (i, k["unlock"], r))

    # 3. ascending, sensible ladders
    u = lambda i: ks[i]["unlock"]
    for a, b in (("cottage", "craftsman"), ("craftsman", "merchant"), ("merchant", "noble"), ("lumber", "quarry"), ("quarry", "iron"), ("iron", "gold"), ("gold", "oil"),
                 ("farm", "livestock"), ("livestock", "slaughter"), ("mill", "bakery"), ("sawmill", "masonry"), ("iron", "smelter"), ("oil", "refinery"), ("panning", "mint"), ("gold", "mint"),
                 ("townhall", "market")):
        need(u(a) <= u(b) or (a, b) == ("panning", "mint"), "ladder: %s (%s) should not open after %s (%s)" % (a, u(a), b, u(b)))
    need(u("panning") <= u("mint") and u("gold") <= u("mint"), "the mint must open after both its gold sources")
    for r, lv in d["construction"]["needs_from"].items():
        chain = {"wood": ["lumber"], "stone": ["quarry"], "planks": ["sawmill"], "cut_stone": ["masonry"], "iron_bars": ["iron", "smelter"], "oil": ["oil", "refinery"],
                 "food": ["farm", "mill", "bakery"]}[r]
        need(all(u(c) <= lv for c in chain), "resource %s is asked from castle %s but its chain opens later" % (r, lv))
    pop = {L: d["tax"]["residents"][L] for L in LEVELS}
    need(all(pop[L] <= d["tax"]["water_capacity"][L] for L in LEVELS), "residents exceed the water of the wells: %s vs %s" % (pop, d["tax"]["water_capacity"]))

    # 4. the rules that must not move: the time curve and the attack numbers are the live ones
    need(d["time"]["upgrade"]["hours_at_x1"] == {str(n): P.t_hours(n) for n in (1, 2, 3, 5, 10, 20, 30)}, "upgrade time table differs from progress.T_HOURS")
    need(d["time"]["attack"]["scout_cooldown_s"] == MI.ATTACK_COOLDOWN and d["time"]["shield"]["today_h"] == MI.SHIELD_SECONDS // 3600, "attack / shield numbers differ from military.py")
    sh = d["time"]["shield"]["by_stars_h"]
    need([x[0] for x in sh] == [0, 1, 2, 3] and [x[1] for x in sh] == sorted(x[1] for x in sh) and sh[1][1] == d["time"]["shield"]["today_h"], "shield by stars must rise and keep today's 4 h for 1 star")
    need(d["raid"]["bot_hours"] == MI.LOOT_HOURS and d["raid"]["player_hours"] == MI.PLAYER_LOOT_HOURS, "raid hours differ from military.py")
    need(all(e in P.STRUCTS for e in d["construction"]["weights"]) and set(d["construction"]["weights"]) == set(P.STRUCTS), "construction weights must cover exactly the 15 structures of progress.STRUCTS")
    need(not any(k in P.STRUCTS for k in ids), "a resource kind must not be a progress.STRUCTS entry (round rule!)")

    # 5. tax / loyalty
    t = d["tax"]
    need(t["min"] == 0 and t["max"] == 30 and t["min"] <= t["default"] <= t["max"], "tax slider must be 0..30 with the default inside")
    need(all(t["at_30pct"][L] > t["at_default_10pct"][L] for L in LEVELS), "a higher rate must give more tax")
    need(all(abs(t["at_30pct"][L] / t["at_default_10pct"][L] - 3.0) < 0.1 for L in LEVELS), "tax must be linear in the rate")
    ly = d["loyalty"]["target_at"]
    need(all(ly[L]["0"] >= ly[L]["10"] >= ly[L]["20"] >= ly[L]["30"] for L in LEVELS), "a higher rate must never raise loyalty")
    need(all(ly[L]["10"] >= ly["5"]["10"] for L in LEVELS), "loyalty at the default rate must not fall with the level")
    need(ly["5"]["10"] >= d["loyalty"]["threshold"], "at the default rate the first levels must be above the loyalty threshold")

    # 6. stores never block an upgrade, supply covers demand (every resource at 5 / 10 / 20 / 30)
    for r in ("wood", "stone", "planks", "cut_stone", "iron_bars", "oil"):
        for L in (5, 10, 20, 30):
            if L >= d["construction"]["needs_from"][r]:
                dear = M.dearest(r, min(30, L + 1))
                need(d["stores"]["cap"][r][str(L)] >= dear, "store cap of %s at %s is below the dearest next price" % (r, L))
    for L in (5, 10, 20, 30):
        fl = M.flow(L)
        for r, (dem, sup) in fl.items():
            need(dem <= 1.10 * sup + 1e-9, "demand %.0f > supply %.0f of %s at castle %s" % (dem, sup, r, L))
            if sup and L >= 10:
                need(dem / sup >= 0.15 or r in ("oil",) and L < 20, "%s is almost never used at castle %s (%.0f %%): add a sink or cut a copy" % (r, L, 100 * dem / sup))

    # 7. Persian table: <= 25 rows, every kind in it, in sync with the generator
    rows = [ln for ln in md.splitlines() if ln.startswith("| ") and not ln.startswith("| چی") and not ln.startswith("|---")]
    need(len(rows) <= 25, "the Persian table has %d rows (max 25)" % len(rows))
    for k in d["kinds"]:
        need(k["fa"] in md, "the Persian table does not mention %s (%s)" % (k["id"], k["fa"]))
    need(md == M.build_md(), "docs/economy_table_fa.md is not what e1_model.py generates (run it)")
    need(json.dumps(d, ensure_ascii=False, sort_keys=False) == json.dumps(M.build_json(), ensure_ascii=False, sort_keys=False), "docs/economy_table.json is not what e1_model.py generates (run it)")
    need(re.search(r"[۰-۹]", md) is None, "the table must use English digits")
    need("ربات" not in md and "bot" not in md.lower().replace("both", ""), "the words bot / ربات must not appear in game texts")   # (the raid text says 'ربات' for the PvE target: see below)

    # 8. open questions <= 5 (in the report)
    rp = "/home/claude/REPORT_E1.md"
    if os.path.isfile(rp):
        q = re.search(r"##\s*Open questions(.*?)(\n##|\Z)", open(rp, encoding="utf-8").read(), re.S | re.I)
        if q:
            need(len(re.findall(r"^\s*\d+[.)]", q.group(1), re.M)) <= 5, "more than 5 open questions in REPORT_E1.md")

    if BAD:
        print("\n".join("FAIL " + b for b in BAD))
        print("E1 FAIL (%d)" % len(BAD))
        return 1
    print("%d kinds | %d table rows | counts, ladders, chains, stores, flows, tax, loyalty, time rules checked" % (len(ids), len(rows)))
    print("E1 OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
