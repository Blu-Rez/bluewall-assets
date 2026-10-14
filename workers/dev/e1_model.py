#!/usr/bin/env python3
"""E1 economy model - the ONE source of every number (design only; all values are (ph) placeholders for the server owner).

    python3 dev/e1_model.py            writes docs/economy_table.json + docs/economy_table_fa.md
    python3 dev/e1_model.py --flow     prints supply / demand per resource at castle 5 / 10 / 20 / 30 (the tuning aid)

Rules it keeps (so the pacing of progress.py cannot move):
  * the resource kinds are NOT in progress.STRUCTS and not in the round rule: their level IS the castle level (auto follow, level factor 1.13^(L-1) like the gem mines);
  * a resource only adds a SMALL second price to an upgrade (share x hours of build x output of one building of that resource); gems are untouched;
  * a resource is only asked for once its producer chain is unlocked (needs_from), so nothing can dead-lock.
"""
from __future__ import annotations

import json
import math
import os
import sys

sys.path.insert(0, "/home/claude/bot/bluebot_v2")
from bluewall import military as MI  # noqa: E402
from bluewall import progress as P  # noqa: E402

ROOT = "/home/claude/bot/bluebot_v2/bluewall"
DOCS = os.path.join(ROOT, "docs")
GROWTH = 1.13            # per level, same as progress.RATE_GROWTH (gem mines): x3 at 10, x10 at 20, x35 at 30
LEVELS = (5, 10, 20, 30)
STORE_HOURS = 48         # a store holds at least this many hours of the output of its resource (and never less than the dearest upgrade of the next round)
BUILD_SHARE = 0.3        # an upgrade of H hours of build costs  BUILD_SHARE x weight x H hours of ONE building's output of that resource


def lf(level: float) -> float:
    return GROWTH ** (max(1, int(level)) - 1)


# ---------------------------------------------------------------- resources: id -> (fa, store group, class, food value per unit)
RES = {
    "wood": ("چوب", "wood", "raw", 0), "planks": ("تخته", "wood", "processed", 0),
    "stone": ("سنگ", "stone", "raw", 0), "cut_stone": ("سنگ تراشیده", "stone", "processed", 0),
    "iron_ore": ("سنگ آهن", "iron", "raw", 0), "iron_bars": ("شمش آهن", "iron", "processed", 0),
    "gold_ore": ("سنگ طلا", "treasury", "raw", 0), "gold_dust": ("خاک طلا", "treasury", "raw", 0), "coins": ("سکه", "treasury", "processed", 0),
    "crude": ("نفت خام", "oil", "raw", 0), "oil": ("نفت", "oil", "processed", 0),
    "wheat": ("گندم", "food", "raw", 0), "flour": ("آرد", "food", "processed", 0), "bread": ("نان", "food", "food", 1.0),
    "vegetables": ("سبزی", "food", "food", 0.8),
    "livestock": ("دام", "food", "raw", 0), "carcass": ("لاشه", "food", "food", 0.8), "meat": ("گوشت", "food", "food", 1.5),
    "fish": ("ماهی", "food", "raw", 0), "dried_fish": ("ماهی خشک", "food", "food", 1.5),
}
STORE_GROUPS = ("wood", "stone", "iron", "treasury", "oil", "food")

# ---------------------------------------------------------------- kinds (ids = the contract of the 15 packages, final)
# S supplier  : out = (resource, base per hour of ONE building at level factor 1)
# P processor : proc = (input(s), output, ratio, throughput of input per hour at level factor 1)
# steps = [[castle level that opens the n-th copy, n]], the first step is the unlock level
KINDS = [
    dict(id="lumber", fa="چوب‌بری", role="S", place="forest", unlock=1, steps=[[1, 2], [12, 3], [22, 4]], out=("wood", 40), crew_h=1, price=(3, 0),
         use="چوب: ساخت‌وساز همه‌ی ارتقاها + خوراک اره‌کشی"),
    dict(id="quarry", fa="معدن سنگ", role="S", place="mount", unlock=2, steps=[[2, 1], [6, 2], [20, 3]], out=("stone", 40), crew_h=1, price=(3, 0),
         use="سنگ: ساخت‌وساز (دیوار و برج بیشتر) + خوراک سنگ‌تراشی"),
    dict(id="iron", fa="معدن آهن", role="S", place="mount", unlock=8, steps=[[8, 1], [14, 2], [26, 3]], out=("iron_ore", 28), crew_h=1, price=(3, 0),
         use="سنگ آهن: خوراک کوره‌ی ذوب"),
    dict(id="gold", fa="معدن طلا", role="S", place="mount", unlock=14, steps=[[14, 1], [22, 2]], out=("gold_ore", 8), crew_h=1, price=(3, 0),
         use="سنگ طلا: خوراک ضرابخانه"),
    dict(id="panning", fa="طلاشویی رود", role="S", place="water", unlock=12, steps=[[12, 1], [24, 2]], out=("gold_dust", 5), crew_h=1, price=(3, 0),
         use="خاک طلا: خوراک ضرابخانه"),
    dict(id="oil", fa="میدان نفت", role="S", place="free", unlock=17, steps=[[17, 1], [26, 2]], out=("crude", 12), crew_h=1, price=(3, 0),
         use="نفت خام: خوراک پالایشگاه"),
    dict(id="farm", fa="مزرعه", role="S", place="free", unlock=3, steps=[[3, 1], [7, 2], [18, 3], [27, 4]], out=("wheat", 45), crew_h=1, price=(3, 0),
         use="گندم: خوراک آسیاب"),
    dict(id="greenhouse", fa="گلخانه", role="S", place="free", unlock=11, steps=[[11, 1], [20, 2], [28, 3]], out=("vegetables", 36), crew_h=1, price=(3, 0),
         use="سبزی: خوراک ارتش (مستقیم)"),
    dict(id="livestock", fa="دامداری", role="S", place="free", unlock=5, steps=[[5, 1], [14, 2], [24, 3]], out=("livestock", 12), crew_h=1, price=(3, 0),
         use="دام: خوراک قصابی و کشتارگاه"),
    dict(id="slaughter", fa="کشتارگاه", role="S/P", place="free", unlock=9, steps=[[9, 1], [20, 2]], proc=(("livestock",), "carcass", 2.0, 24), crew_h=2, price=(4, 3),
         use="لاشه: خوراک ارتش (ارزون و فراوان)"),
    dict(id="fishery", fa="ماهی‌گیری", role="S", place="water", unlock=6, steps=[[6, 1], [13, 2], [24, 3]], out=("fish", 30), crew_h=1, price=(3, 0),
         use="ماهی: خوراک دودخانه"),
    dict(id="sawmill", fa="اره‌کشی", role="P", place="free", unlock=4, steps=[[4, 1], [18, 2]], proc=(("wood",), "planks", 0.5, 120), crew_h=2, price=(4, 3),
         use="تخته: ساخت‌وساز (از لول 4) + خونه‌ها"),
    dict(id="masonry", fa="سنگ‌تراشی", role="P", place="free", unlock=5, steps=[[5, 1], [18, 2]], proc=(("stone",), "cut_stone", 0.5, 90), crew_h=2, price=(4, 3),
         use="سنگ تراشیده: دیوار، برج و ساختمون‌های شهری"),
    dict(id="smelter", fa="کوره‌ی ذوب", role="P", place="free", unlock=9, steps=[[9, 1], [22, 2]], proc=(("iron_ore",), "iron_bars", 0.5, 90), crew_h=2, price=(4, 3),
         use="شمش آهن: تجهیزات سرباز + آهنگری"),
    dict(id="mint", fa="ضرابخانه", role="P", place="free", unlock=15, steps=[[15, 1], [25, 2]], proc=(("gold_ore", "gold_dust"), "coins", 4.0, 24), crew_h=2, price=(4, 3),
         use="سکه: طلسم‌ها + ساختمون شهری"),
    dict(id="refinery", fa="پالایشگاه", role="P", place="free", unlock=18, steps=[[18, 1], [27, 2]], proc=(("crude",), "oil", 0.5, 36), crew_h=2, price=(4, 3),
         use="نفت: برج آتشین و تله‌ی شعله"),
    dict(id="mill", fa="آسیاب", role="P", place="free", unlock=4, steps=[[4, 1], [16, 2]], proc=(("wheat",), "flour", 1.0, 135), crew_h=2, price=(4, 3),
         use="آرد: خوراک نانوایی"),
    dict(id="bakery", fa="نانوایی", role="P", place="free", unlock=5, steps=[[5, 1], [16, 2], [26, 3]], proc=(("flour",), "bread", 1.0, 135), crew_h=2, price=(4, 3),
         use="نان: خوراک ارتش"),
    dict(id="butcher", fa="قصابی", role="P", place="free", unlock=7, steps=[[7, 1], [18, 2]], proc=(("livestock",), "meat", 3.0, 36), crew_h=2, price=(4, 3),
         use="گوشت: خوراک ارتش (کیفیت بالا)"),
    dict(id="smokehouse", fa="دودخانه‌ی ماهی", role="P", place="water", unlock=8, steps=[[8, 1], [20, 2]], proc=(("fish",), "dried_fish", 1.0, 90), crew_h=2, price=(4, 3),
         use="ماهی خشک: خوراک ارتش (کیفیت بالا)"),
    dict(id="jeweler", fa="جواهرساز", role="P", place="free", unlock=20, steps=[[20, 1], [28, 2]], proc=(("gems",), "cut_gems", 1.0, 0), crew_h=2, price=(4, 3),
         use="تراش جواهر برای تزئین قلعه و پرچم؛ فقط ظاهر، اقتصاد جواهر رو دست نمی‌زنه"),
    dict(id="stores", fa="انبارها", role="T", place="free", unlock=1, steps=[[1, 6]], crew_h=1, price=(4, 4),
         use="6 انبار: چوب / سنگ / آهن / خزانه / نفت / غذا؛ ظرفیت با لول بالا می‌ره"),
    dict(id="cottage", fa="کلبه", role="H", place="free", unlock=1, steps=[[1, 3], [4, 5], [8, 8], [12, 10], [16, 13], [20, 16], [26, 18], [30, 20]], residents=4, wage=1.0, crew_h=0.25, price=(1, 0.5),
         use="مردم عادی؛ مالیات"),
    dict(id="craftsman", fa="خانه‌ی پیشه‌ور", role="H", place="free", unlock=6, steps=[[6, 2], [12, 4], [18, 6], [24, 8], [30, 10]], residents=6, wage=1.5, crew_h=0.25, price=(1.5, 1.5),
         use="پیشه‌ورها؛ مالیات بیشتر"),
    dict(id="merchant", fa="خانه‌ی تاجر", role="H", place="free", unlock=12, steps=[[12, 2], [18, 4], [24, 7], [30, 10]], residents=8, wage=2.5, crew_h=0.25, price=(2, 3),
         use="تاجرها؛ مالیات خوب"),
    dict(id="noble", fa="خانه‌ی اشراف", role="H", place="free", unlock=20, steps=[[20, 1], [25, 3], [30, 5]], residents=10, wage=4.0, crew_h=0.25, price=(3, 6),
         use="اشراف؛ بیشترین مالیات"),
    dict(id="market", fa="بازار", role="C", place="free", unlock=3, steps=[[3, 1], [18, 2]], tax_bonus_per_tier=0.05, loyalty=3, crew_h=2, price=(4, 4),
         use="تجارت: +5% مالیات در هر پله‌ی ظاهر (تا +25%) + کمی وفاداری"),
    dict(id="tavern", fa="میخانه", role="C", place="free", unlock=6, steps=[[6, 1], [15, 2], [25, 3]], loyalty=8, crew_h=2, price=(3, 3),
         use="وفاداری +8 هر کدوم"),
    dict(id="townhall", fa="تالار شهر", role="C", place="free", unlock=2, steps=[[2, 1]], crew_h=2, price=(6, 6),
         use="مالیات رو جمع می‌کنه؛ نرخ مالیات 0 تا 30% اینجا تنظیم می‌شه"),
    dict(id="chapel", fa="کلیسا", role="C", place="free", unlock=1, steps=[[1, 1], [12, 2], [24, 3]], loyalty=6, crew_h=2, price=(4, 6),
         use="وفاداری +6 هر کدوم"),
    dict(id="well", fa="چاه", role="C", place="free", unlock=1, steps=[[1, 2], [8, 4], [14, 6], [22, 8], [28, 10]], loyalty=1, serves=40, crew_h=0.5, price=(0.5, 1),
         use="آب شهر: هر چاه 40 نفر؛ بیشتر از ظرفیتِ آب مالیات نمی‌دن"),
]
KIND_IDS = [k["id"] for k in KINDS]
BY_ID = {k["id"]: k for k in KINDS}

# ---------------------------------------------------------------- rules
# castle level from which a resource is part of an upgrade price (its whole chain is open by then)
NEEDS_FROM = {"wood": 1, "stone": 2, "planks": 4, "cut_stone": 7, "iron_bars": 9, "oil": 18, "food": 6}
# weight of each resource in the price of a structure (x BUILD_SHARE x hours of build x output/h of one building of that resource, level below)
_W_ARMY = {"wood": 0.8, "planks": 0.6, "stone": 0.4, "iron_bars": 0.5}
W = {
    "keep": {"wood": 1.0, "stone": 1.0, "planks": 0.6, "cut_stone": 0.6, "iron_bars": 0.3},
    "wall": {"stone": 1.5, "cut_stone": 1.2, "wood": 0.3, "iron_bars": 0.4},
    "towers": {"stone": 1.2, "cut_stone": 1.0, "wood": 0.3, "iron_bars": 0.5, "oil": 0.4},
    "training": _W_ARMY, "barracks": {**_W_ARMY, "iron_bars": 0.6}, "stable": {"wood": 1.0, "planks": 0.8, "stone": 0.3, "iron_bars": 0.6},
    "workshop": {"wood": 0.8, "planks": 0.6, "stone": 0.4, "iron_bars": 1.2}, "lair": {"wood": 0.6, "planks": 0.4, "stone": 0.8, "cut_stone": 0.6, "iron_bars": 0.4},
    "forge": {"wood": 0.4, "stone": 0.4, "iron_bars": 1.5},
}
for _e in ("mine_ruby", "mine_emerald", "mine_turq", "vault_ruby", "vault_emerald", "vault_turq"):
    W[_e] = {"wood": 0.4, "stone": 0.6, "cut_stone": 0.4}
FLOOR = 5                      # a price is never under this many units x weight
GEAR_H = 0.007                 # iron bars to replace the gear of ONE lost army space = this many hours of one smelter chain's output at the castle level (from castle 9)
UPKEEP_PER_SPACE = 0.4         # food points per army space per hour x level factor
OIL_PER_DEFENDED_RAID_H = 4.0  # hours of ONE refinery's output burnt re-arming flame traps per raid suffered
SPELL_COIN_H = 1.0             # coins per spell space = this many hours of the kingdom's default-rate tax

TAX = dict(min=0, max=30, default=10, step=1, collect_cap_hours=24, uncollected_stolen=0.25)
LOYALTY = dict(per_tax_pct=-3, base=100, threshold=50, slow_floor=0.5, move_per_hour=4, start=70, well_bonus_cap=5)
RAID = dict(bot_hours=MI.LOOT_HOURS, player_hours=MI.PLAYER_LOOT_HOURS, store_share_cap=0.25, resources=["wood", "stone", "iron_bars", "coins", "oil", "food"])
SHIELD_H = [[0, 0], [1, 4], [2, 8], [3, 12]]                 # stars -> hours of shield after being hit (1 star = today's 4 h)


# ---------------------------------------------------------------- counts, outputs
def count_at(k: dict, level: int) -> int:
    n = 0
    for lv, c in k["steps"]:
        if level >= lv:
            n = c
    return n


def kind_out_per_h(k: dict, level: int) -> float:
    """What ONE building of a supplier makes per hour at castle `level` (level factor included)."""
    return k["out"][1] * lf(level) if "out" in k else 0.0


def supply(res: str, level: int) -> float:
    """Raw output per hour of all suppliers of `res` at castle `level` (the producers' side only)."""
    return sum(count_at(k, level) * kind_out_per_h(k, level) for k in KINDS if "out" in k and k["out"][0] == res)


def rate1(res: str, level: int) -> float:
    """Output per hour of ONE building of this resource (a processed one: of the chain that starts at one raw supplier) at castle `level`."""
    for k in KINDS:
        if "out" in k and k["out"][0] == res:
            return k["out"][1] * lf(level)
    for k in KINDS:
        if "proc" in k and k["proc"][1] == res:
            return rate1(k["proc"][0][0], level) * k["proc"][2]
    if res == "coins":
        return tax_per_hour(level, TAX["default"])
    raise KeyError(res)


def tax_per_hour(level: int, rate_pct: float, loyalty_factor: float = 1.0) -> float:
    """Tax coins per hour (before the market bonus): sum residents x wage x rate x level factor."""
    pop = sum(count_at(k, level) * k["residents"] * k["wage"] for k in KINDS if k["role"] == "H")
    return pop * (rate_pct / 100.0) * lf(level) * loyalty_factor


def market_bonus(level: int) -> float:
    tier = sum(1 for t in P_TIERS if level >= t)
    return BY_ID["market"]["tax_bonus_per_tier"] * max(0, tier - 1) if count_at(BY_ID["market"], level) else 0.0


P_TIERS = (1, 6, 12, 18, 24, 30)


def residents(level: int) -> int:
    return sum(count_at(k, level) * k["residents"] for k in KINDS if k["role"] == "H")


def water_capacity(level: int) -> int:
    return count_at(BY_ID["well"], level) * BY_ID["well"]["serves"]


def loyalty_target(level: int, rate_pct: float) -> float:
    b = 0.0
    for kid in ("chapel", "tavern", "market"):
        b += count_at(BY_ID[kid], level) * BY_ID[kid]["loyalty"]
    b += min(count_at(BY_ID["well"], level), LOYALTY["well_bonus_cap"]) * BY_ID["well"]["loyalty"]
    return max(0.0, min(100.0, LOYALTY["base"] + LOYALTY["per_tax_pct"] * rate_pct + b))


def loyalty_factor(loyalty: float) -> float:
    """Production factor: 1 from the threshold up, then falling linearly to slow_floor at loyalty 0."""
    th, fl = LOYALTY["threshold"], LOYALTY["slow_floor"]
    return 1.0 if loyalty >= th else fl + (1.0 - fl) * loyalty / th


def weights(ent: str) -> dict:
    return W[ent]


def price(ent: str, to: int, res: str) -> int:
    """Units of `res` an upgrade of structure `ent` to level `to` costs on top of its gems (0 while the chain of `res` is not open)."""
    w = W[ent].get(res, 0.0)
    if not w:
        return 0
    hours = P.t_hours(to) * P.STRUCTS[ent][1]
    return int(math.ceil(max(FLOOR * w, BUILD_SHARE * w * hours * rate1(res, max(1, to - 1)))))


def dearest(res: str, upto: int) -> int:
    return max((price(e, n, res) for e in P.ORDER for n in range(1, upto + 1)), default=0)


def store_cap(res: str, level: int) -> int:
    """48 hours of what the kingdom makes of `res`, never under 1.25 x the dearest price of the next round (a store never blocks an upgrade); 0 while its chain is closed."""
    if level < NEEDS_FROM.get(res, 1):
        return 0
    if res == "coins":
        per_h = tax_per_hour(level, TAX["default"]) * (1 + market_bonus(level)) + mint_coins(level)
    elif res == "food":
        per_h = food_supply(level)
    else:
        per_h = produced(res, level)
    return int(max(STORE_HOURS * per_h, math.ceil(1.25 * dearest(res, min(P.MAX_LEVEL, level + 1))), 100))


def mint_coins(level: int) -> float:
    k = BY_ID["mint"]
    n = count_at(k, level)
    gold = supply("gold_ore", level) + supply("gold_dust", level)
    return min(gold, n * k["proc"][3] * lf(level)) * k["proc"][2] if n else 0.0


def produced(res: str, level: int) -> float:
    """What the kingdom makes of `res` per hour at castle `level` if every copy runs (raw: suppliers; processed: the processors, limited by their input)."""
    if res in ("iron_bars", "planks", "cut_stone", "oil", "bread", "flour"):
        for k in KINDS:
            if "proc" in k and k["proc"][1] == res:
                n = count_at(k, level)
                src = k["proc"][0][0]
                avail = supply(src, level) if src != "flour" else produced("flour", level)
                return min(n * k["proc"][3] * lf(level), avail) * k["proc"][2]
    if res in ("meat", "carcass"):                                # livestock is shared by butcher and slaughter, half each
        for k in KINDS:
            if "proc" in k and k["proc"][1] == res:
                n = count_at(k, level)
                return min(n * k["proc"][3] * lf(level), supply("livestock", level) * 0.5) * k["proc"][2] if n else 0.0
    if res == "dried_fish":
        k = BY_ID["smokehouse"]
        n = count_at(k, level)
        return min(n * k["proc"][3] * lf(level), supply("fish", level)) * k["proc"][2] if n else 0.0
    return supply(res, level)


def food_supply(level: int) -> float:
    return sum(produced(r, level) * RES[r][3] for r in RES if RES[r][2] == "food")


def food_demand(level: int) -> float:
    return MI.army_cap(level) * UPKEEP_PER_SPACE * lf(level)


def builders(level: int) -> int:
    return P.builders(level)


def flow(level: int) -> dict:
    """Utilisation per resource at castle `level` (demand / supply, 1.0 = every copy fully used) for a player who attacks 6 times a day."""
    B = builders(level)
    out = {}
    n_s = len(P.ORDER)
    wbar = {r: sum(W[e].get(r, 0.0) for e in P.ORDER) / n_s for r in ("wood", "stone", "planks", "cut_stone", "iron_bars", "oil")}
    cons = {r: (BUILD_SHARE * B * wbar[r] * rate1(r, level) if level >= NEEDS_FROM[r] else 0.0) for r in wbar}
    gear = 6 / 24.0 * MI.army_cap(level) * 0.6 * GEAR_H * rate1("iron_bars", level) * (level >= NEEDS_FROM["iron_bars"])      # 6 raids a day, 60 % of the army lost in each (sim.py LOSS)
    oil_arm = 3 / 24.0 * OIL_PER_DEFENDED_RAID_H * rate1("oil", level) if level >= NEEDS_FROM["oil"] else 0.0
    # wood: raw price + 2 wood per plank
    out["wood"] = (cons["wood"] + cons["planks"] / BY_ID["sawmill"]["proc"][2], supply("wood", level))
    out["stone"] = (cons["stone"] + cons["cut_stone"] / BY_ID["masonry"]["proc"][2], supply("stone", level))
    out["iron_bars"] = (cons["iron_bars"] + gear, produced("iron_bars", level))
    out["oil"] = (cons["oil"] + oil_arm, produced("oil", level))
    out["food"] = (food_demand(level) if level >= NEEDS_FROM["food"] else 0.0, food_supply(level))
    coin_dem = MI.spell_cap(level) * SPELL_COIN_H * tax_per_hour(level, TAX["default"]) / 24.0       # one full set of spells a day
    out["coins"] = (coin_dem, tax_per_hour(level, TAX["default"]) * (1 + market_bonus(level)) + mint_coins(level))
    return out


# ---------------------------------------------------------------- json
def kind_record(k: dict) -> dict:
    r = {"id": k["id"], "fa": k["fa"], "role": k["role"], "place": k["place"], "unlock": k["unlock"],
         "count_steps": k["steps"], "count_at": {str(L): count_at(k, L) for L in LEVELS}, "use": k["use"],
         "place_price_hours": {"wood": k["price"][0], "stone": k["price"][1]}, "place_crew_hours": k["crew_h"]}
    if "out" in k:
        res, base = k["out"]
        r["out"] = {"res": res, "base_per_h": base, "per_h_at_unlock": round(base * lf(k["unlock"]), 1), "per_h_at_30": round(base * lf(30), 1)}
        r["store"] = RES[res][1]
    if "proc" in k:
        ins, outp, ratio, thr = k["proc"]
        r["proc"] = {"in": list(ins), "out": outp, "ratio": ratio, "throughput_in_per_h": thr, "throughput_at_unlock": round(thr * lf(k["unlock"]), 1), "throughput_at_30": round(thr * lf(30), 1)}
        r["store"] = RES[outp][1] if outp in RES else "treasury"
    if k["role"] == "H":
        r["home"] = {"residents": k["residents"], "wage_per_resident_h": k["wage"], "tax_per_h_per_home_at_10pct": {str(L): round(k["residents"] * k["wage"] * 0.10 * lf(L), 2) for L in LEVELS}}
    if k["role"] == "C":
        r["civic"] = {x: k[x] for x in ("loyalty", "tax_bonus_per_tier", "serves") if x in k}
    if k["role"] == "T":
        rep = {"wood": "wood", "stone": "stone", "iron": "iron_bars", "treasury": "coins", "oil": "oil", "food": "food"}
        r["stores"] = {"groups": list(STORE_GROUPS), "cap_hours": STORE_HOURS, "cap_at": {g: {str(L): store_cap(rep[g], L) for L in LEVELS} for g in STORE_GROUPS}}
    return r


def build_json() -> dict:
    steps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30]
    return {
        "version": "E1-1", "date": "2026-10-07", "ph": "every number is a placeholder (ph) for the server owner; the sim only proves pacing",
        "level_factor": {"formula": "1.13^(L-1)", "x10": round(lf(10), 2), "x20": round(lf(20), 2), "x30": round(lf(30), 2)},
        "levels_follow_castle": True,
        "resources": {r: {"fa": v[0], "store": v[1], "class": v[2], "food_value": v[3]} for r, v in RES.items()},
        "kinds": [kind_record(k) for k in KINDS],
        "construction": {"share": BUILD_SHARE, "floor": FLOOR, "needs_from": NEEDS_FROM, "weights": W,
                         "note": "price(res) = max(floor*w, share*w*hours_of_build*output_per_h_of_one_building_of_res_at_level_below); gems unchanged; round rule unchanged; resource kinds are not in progress.STRUCTS",
                         "sample": {e: {"to": 10, **{r: price(e, 10, r) for r in W[e] if 10 >= NEEDS_FROM[r]}} for e in ("keep", "wall", "forge", "lair")}},
        "stores": {"cap_hours": STORE_HOURS, "rule": "max(48 h of the resource's output, 1.25 x dearest price of the next round)",
                   "cap": {r: {str(L): store_cap(r, L) for L in LEVELS} for r in ("wood", "planks", "stone", "cut_stone", "iron_bars", "oil", "coins", "food")}},
        "army": {"gear_hours_of_one_smelter_chain_per_lost_space": GEAR_H, "gear_from_castle": NEEDS_FROM["iron_bars"], "upkeep_food_per_space_h": UPKEEP_PER_SPACE, "upkeep_level_factor": True,
                 "short_food": "training slower: x(0.5 + 0.5 * fed_share); never kills soldiers", "food_variety_bonus": {"2": 0.10, "3": 0.20, "4+": 0.30},
                 "oil_per_defended_raid_hours_of_one_refinery": OIL_PER_DEFENDED_RAID_H, "spell_coin_hours_of_default_tax_per_space": SPELL_COIN_H},
        "tax": {**TAX, "formula": "sum(homes x residents x wage) x rate x 1.13^(L-1) x (1 + market bonus) x loyalty factor; residents above well capacity pay nothing",
                "market_bonus_per_tier": BY_ID["market"]["tax_bonus_per_tier"], "stored_in": "townhall panel (setting)",
                "at_default_10pct": {str(L): round(tax_per_hour(L, 10) * (1 + market_bonus(L)), 1) for L in LEVELS},
                "at_30pct": {str(L): round(tax_per_hour(L, 30) * (1 + market_bonus(L)), 1) for L in LEVELS},
                "residents": {str(L): residents(L) for L in LEVELS}, "water_capacity": {str(L): water_capacity(L) for L in LEVELS}},
        "loyalty": {**LOYALTY, "formula": "target = clamp(100 - 3 x tax% + chapel 6 + tavern 8 + market 3 + well 1 (5 wells at most), 0, 100); moves 4 points per hour toward the target",
                    "slow": "below 50 every producer works x(0.5 + 0.5 x loyalty / 50)",
                    "target_at": {str(L): {str(p): round(loyalty_target(L, p)) for p in (0, 10, 20, 30)} for L in LEVELS}},
        "raid": {**RAID, "rule": "a win also takes from the six stores of the victim: each store gives min(25 % of its content, 6 h (bot) / 8 h (player) of ONE building's output at the attacker's castle level) x the same share (destruction x stars) as the gems; plus 25 % of the tax not yet collected; the victim loses exactly what is taken; gems as today"},
        "time": {"upgrade": {"rule": "unchanged: progress.T_HOURS x structure multiplier; builders 2 (3 from castle 7); 2 reserved", "hours_at_x1": {str(n): P.t_hours(n) for n in (1, 2, 3, 5, 10, 20, 30)}},
                 "town_crew": {"rule": "placing a resource / home / civic kind takes its crew hours x (1 + 0.04 (L-1)) with 2 town crews, separate from the builders", "simultaneous": 2},
                 "attack": {"scout_cooldown_s": MI.ATTACK_COOLDOWN, "owner_scout_cooldown_s": 2, "battle_token_min": MI.BATTLE_TIMEOUT // 60, "note": "unchanged"},
                 "shield": {"today_h": MI.SHIELD_SECONDS // 3600, "by_stars_h": SHIELD_H, "attacking_ends_own_shield": True, "target_filter": "offline > 10 min and no shield (unchanged)"}},
        "pacing": {"rule": "resource kinds are outside the gem ladder and the round rule; the resource price is small and priced in hours of output, so castle 20 / 30 days stay within 5 %", "proof": "dev/e1_sim.py"},
        "ids": KIND_IDS,
    }


# ---------------------------------------------------------------- Persian table
def _fmt(x: float) -> str:
    if x >= 100:
        return "{:,}".format(int(round(x)))
    if x >= 10:
        return str(int(round(x)))
    return ("%.1f" % x).rstrip("0").rstrip(".")


def _cnt(k: dict) -> str:
    return "·".join(str(count_at(k, L)) for L in LEVELS)


def _out(k: dict) -> str:
    if "out" in k:
        return "%s → %s" % (_fmt(k["out"][1] * lf(k["unlock"])), _fmt(k["out"][1] * lf(30)))
    return "-"


def build_md() -> str:
    R = lambda i: BY_ID[i]
    rows = []

    def add(name, unlock, cnt, out, use):
        rows.append("| %s | %s | %s | %s | %s |" % (name, unlock, cnt, out, use))

    def chain(title, ids, use, outs=None):
        ks = [R(i) for i in ids]
        if outs is None:
            outs = [_out(k) if "out" in k else "×" + _fmt(k["proc"][2]) for k in ks]
        add("**%s**: %s" % (title, " / ".join(k["fa"] for k in ks)), " / ".join(str(k["unlock"]) for k in ks),
            " / ".join(_cnt(k) for k in ks), " / ".join(outs), use)

    chain("چوب", ["lumber", "sawmill"], "ساخت‌وساز همه‌ی ارتقاها؛ تخته از لول 4")
    chain("سنگ", ["quarry", "masonry"], "ساخت‌وساز؛ سنگ تراشیده برای دیوار و برج (از لول 7)")
    chain("آهن", ["iron", "smelter"], "شمش = تجهیزات سرباز + آهنگری (از لول 9)")
    chain("طلا", ["gold", "panning", "mint"], "ضرابخانه سنگ و خاک طلا رو سکه می‌کنه؛ سکه = طلسم + ساختمون شهری",
          [_out(R("gold")), _out(R("panning")), "×4"])
    chain("نفت", ["oil", "refinery"], "نفت = برج آتشین و تله‌ی شعله (بعد از هر حمله دوباره پر می‌شه)")
    chain("نان", ["farm", "mill", "bakery"], "نان = خوراک ارتش (از لول 6)", [_out(R("farm")), "×1", "×1"])
    chain("سبزی", ["greenhouse"], "خوراک ارتش، مستقیم")
    chain("گوشت", ["livestock", "butcher", "slaughter"], "گوشت = خوراک خوب؛ لاشه = خوراک ارزون و فراوان", [_out(R("livestock")), "×3", "×2"])
    chain("ماهی", ["fishery", "smokehouse"], "ماهی خشک = خوراک خوب؛ خوراک متنوع (2 / 3 / 4+ نوع) = آموزش 10 / 20 / 30 درصد سریع‌تر")
    chain("جواهرساز", ["jeweler"], "فقط ظاهر (تزئین و پرچم)، به جواهر دست نمی‌زنه", ["-"])
    add("**انبارها**: چوب/سنگ/آهن/خزانه/نفت/غذا", "1", "6 ثابت",
        "جا: چوب %s → %s" % (_fmt(store_cap("wood", 5)), _fmt(store_cap("wood", 30))),
        "جا = 48 ساعت تولید و هیچ‌وقت کمتر از گرون‌ترین ارتقای دور بعد؛ پر شد تولید می‌ایسته؛ غارت از همین‌ها می‌بره")
    for kid, use in (("cottage", "مردم عادی، 4 نفر؛ 1 سکه/نفر/ساعت پایه"), ("craftsman", "6 نفر؛ 1.5 سکه/نفر"),
                     ("merchant", "8 نفر؛ 2.5 سکه/نفر"), ("noble", "10 نفر؛ 4 سکه/نفر")):
        k = R(kid)
        add("**%s**" % k["fa"], str(k["unlock"]), _cnt(k),
            "%s → %s سکه (هر خونه، نرخ 10 درصد)" % (_fmt(k["residents"] * k["wage"] * 0.1 * lf(k["unlock"])), _fmt(k["residents"] * k["wage"] * 0.1 * lf(30))), use)
    add("**تالار شهر / بازار**", "2 / 3", "1 / " + _cnt(R("market")), "جمع مالیات / +5 درصد مالیات در هر پله‌ی ظاهر (تا +25 درصد)",
        "تالار: اسلایدر نرخ مالیات 0 تا 30 درصد (پیش‌فرض 10)؛ مالیات تا 24 ساعت می‌مونه تا برداری")
    add("**کلیسا / میخانه / چاه**", "1 / 6 / 1", " / ".join(_cnt(R(i)) for i in ("chapel", "tavern", "well")), "وفاداری +6 / +8 / +1 هر کدوم",
        "چاه: آب 40 نفر؛ بیشتر از آب، مالیات نمی‌دن")
    th = {n: P.t_hours(n) for n in (1, 2, 5, 6, 10, 20, 30)}
    rows.append("| **زمان ارتقا** | - | سازنده 2 (3 از لول 7)، رزرو 2 | همون منحنی فعلی | لول 1: %d دقیقه، 2: %d ساعت، 5: %d ساعت، 6: %.1f روز، 10: %.1f روز، 20: %.1f روز، 30: %.1f روز؛ قلعه 1.5 برابر. ساختمون شهری جدا از سازنده‌ها: 2 کارگر شهری، 15 دقیقه تا 2 ساعت |"
                % (round(th[1] * 60), round(th[2]), round(th[5]), th[6] / 24, th[10] / 24, th[20] / 24, th[30] / 24))
    rows.append("| **زمان حمله** | - | - | پیدا کردن هدف 20 ثانیه | نبرد تا 20 دقیقه؛ ارتش از دست‌رفته دوباره آموزش می‌بینه (تجهیز = شمش آهن، از لول 9) |")
    rows.append("| **سپر بعد از ضربه** | - | - | 1 ستاره 4 ساعت، 2 ستاره 8، 3 ستاره 12 | اگه خودت حمله کنی سپرت می‌پره؛ هدف: آفلاین بیش از 10 دقیقه و بدون سپر |")
    tx = {L: tax_per_hour(L, 10) * (1 + market_bonus(L)) for L in LEVELS}
    rows.append("| **مالیات** | - | - | لول 5 / 10 / 20 / 30 با نرخ 10 درصد: %s / %s / %s / %s سکه در ساعت (نرخ 30 درصد: سه برابر) | مجموع (نفر × درآمد هر نفر) × نرخ × 1.13^(لول-1) × (1 + بازار) |"
                % tuple(_fmt(tx[L]) for L in LEVELS))
    lt = [round(loyalty_target(L, 20)) for L in LEVELS]
    rows.append("| **وفاداری** | - | - | هر 1 درصد مالیات = 3 وفاداری کم | سقف 100؛ زیر 50 همه‌ی تولیدها تا نصف کند می‌شن. با نرخ 20 درصد، لول 5 / 10 / 20 / 30: %s |" % " / ".join(str(x) for x in lt))
    rows.append("| **غارت** | - | - | از هر انبار تا 25 درصد محتوا | علاوه بر جواهر: تا 6 ساعت (پایگاه کامپیوتری) یا 8 ساعت (بازیکن) تولید یک ساختمون هم‌لول از هر منبع + 25 درصد مالیات جمع‌نشده؛ طرف مقابل دقیقا همون رو از دست می‌ده |")
    head = ["| چی | باز شدن (لول) | تعداد در لول 5·10·20·30 | تولید یک ساختمون در ساعت (اول → لول 30) | به چه دردی می‌خوره |", "|---|---|---|---|---|"]
    intro = ("# جدول اقتصاد بلو وال (E1) - پیش‌نویس برای تایید\n\n"
             "همه‌ی عددها پیشنهادین (ph). جواهر همچنان پول اصلیه و قیمت جواهرِ ارتقاها عوض نشده.\n"
             "ساختمون‌های تولیدی خودشون با لول قلعه بالا می‌رن (تولید ×1.13 هر لول: ×3 در لول 10، ×10 در 20، ×35 در 30). "
             "منابع فقط یه قیمت دوم و کوچیک روی ارتقاها می‌ذارن (حدود 30 درصدِ تولید یک ساختمون در مدت ساخت)، پس سرعت پیشرفت جابه‌جا نمی‌شه.\n"
             "توی ردیف‌هایی که چند ساختمونه، عددها به ترتیب اسم‌ها هستن (جدا شده با /).\n\n")
    return intro + "\n".join(head + rows) + "\n"


def write_all() -> None:
    os.makedirs(DOCS, exist_ok=True)
    with open(os.path.join(DOCS, "economy_table.json"), "w", encoding="utf-8") as f:
        json.dump(build_json(), f, ensure_ascii=False, indent=1, sort_keys=False)
        f.write("\n")
    with open(os.path.join(DOCS, "economy_table_fa.md"), "w", encoding="utf-8") as f:
        f.write(build_md())


if __name__ == "__main__":
    if "--flow" in sys.argv:
        print("%-3s %s" % ("L", "  ".join("%-12s" % r for r in ("wood", "stone", "iron_bars", "oil", "food", "coins"))))
        for L in (3, 5, 8, 10, 14, 20, 25, 30):
            fl = flow(L)
            print("%-3d %s" % (L, "  ".join("%-12s" % ("%5.0f%% (%s)" % (100.0 * d / s if s else float("nan"), _fmt(s))) for d, s in (fl[r] for r in ("wood", "stone", "iron_bars", "oil", "food", "coins")))))
    else:
        write_all()
        print("wrote", DOCS)
