"""Army rules for Blue Wall: units, training batches, housing, power, attack targets (bots) and battle settlement.

Pure functions over the per-user state dict (like progress.py).  State added by this module::

    st["army"] = {unit: count}                       built soldiers / creatures
    st["tq"]   = {family: {"u", "n", "s", "end", "cost"}}   one training batch per production building at a time
    st["spells"] = {spell: count}                    brewed spells (cast in battle, consumed)
    st["sq"]   = {"u", "n", "s", "end", "cost"}      the spell batch the forge is brewing (one at a time)
    st["shield"] = unix time until which nobody may attack this kingdom (after being hit)
    st["atk"]  = {"id", "kind", "spec", "loot", "t"}          the target the player is currently looking at / fighting (token)
    st["rep"]  = [..last 20 battle reports..]

Housing:  total army space  <= training ground (army_cap)         e.g. L1: 60  ..  L20: 592  ..  L30: 872  (x2 since p35)
          each family       <= its building (fam_cap)             barracks / stable / lair / workshop / training (archers)
Gems:     ruby = military, emerald = construction, turquoise = magic and creatures (see progress.GEM_ROLES).

The fight itself is simulated on the client (Siegefall style); the server validates the report (units, loot, destruction,
cooldown) — see ``settle_battle``.  Attacks are owner-only until the server also simulates (``attack_allowed``).
"""
from __future__ import annotations

import math
import random
import time
from typing import Any, Dict, List, Optional, Tuple

from . import boost as BO
from . import names as NM
from . import progress as PR

GEMS = PR.GEMS


def S(old_level: int) -> int:
    """p35 (owner 5 Oct 2026: 30 levels instead of 20): a level of the old 20-level game mapped on the 30-level game, round(1 + (L - 1) * 29 / 19).
    Used for everything that is indexed by level: unit unlocks, defence unlocks, guardian unlocks, the garrison table."""
    return int(round(1 + (int(old_level) - 1) * (PR.MAX_LEVEL - 1) / 19.0))

# ------------------------------------------------------------------ units
# id: dict(fam=building that trains it, lv=its level needed (set by RARITY: Common 1-4, Rare 5-8, Epic 9-12, Legendary 13-16, Mythic 17-20 - the stronger a soldier, the later it opens), space, hp, dps, rng (metres, 0 = melee), spd, cost, t = seconds each, air, role)
UNITS: Dict[str, Dict[str, Any]] = {
    "spear":   dict(fam="barracks", lv=1,  space=1,  hp=120,  dps=9,   rng=0,  spd=1.0, cost={"ruby": 3, "emerald": 1},  t=20,   role="infantry"),
    "sword":   dict(fam="barracks", lv=4,  space=1,  hp=135,  dps=15,  rng=0,  spd=1.05, cost={"ruby": 6, "emerald": 2}, t=30,   role="infantry"),
    "guard":   dict(fam="barracks", lv=6,  space=2,  hp=330,  dps=12,  rng=0,  spd=0.9, cost={"ruby": 10, "emerald": 6},  t=50,   role="tank"),
    "archer":  dict(fam="training", lv=1,  space=1,  hp=80,   dps=11,  rng=26, spd=1.0, cost={"ruby": 4, "emerald": 2},  t=26,   role="ranged"),
    "cavalry": dict(fam="stable",   lv=7,  space=3,  hp=300,  dps=24,  rng=0,  spd=2.1, cost={"ruby": 15, "emerald": 5}, t=90,   role="cavalry"),
    # the axe rider (p32, owner 5 Oct): the heavy shock cavalry between the knight and the lord - Roman helm, plate, long axe; Epic, opens with Stable Lv 11
    "axerider": dict(fam="stable",  lv=16, space=5,  hp=780,  dps=48,  rng=0,  spd=2.0, cost={"ruby": 44, "emerald": 22, "turq": 7}, t=200, role="cavalry"),
    "pegasus": dict(fam="stable",   lv=12,  space=4,  hp=360,  dps=30,  rng=0,  spd=2.6, cost={"ruby": 20, "turq": 23},   t=150,  role="air", air=True),
    "baby":    dict(fam="lair",     lv=13,  space=8,  hp=900,  dps=55,  rng=18, spd=1.8, cost={"turq": 65, "ruby": 23},   t=420,  role="air", air=True),
    "dragon":  dict(fam="lair",     lv=27,  space=24, hp=3400, dps=150, rng=22, spd=1.9, cost={"turq": 511, "ruby": 180},  t=1500, role="air", air=True),
    "catapult": dict(fam="workshop", lv=9, space=6,  hp=420,  dps=70,  rng=44, spd=0.5, cost={"ruby": 20, "emerald": 14}, t=180, role="siege"),
    "giant":   dict(fam="workshop", lv=19,  space=12, hp=2300, dps=48,  rng=0,  spd=0.8, cost={"ruby": 62, "turq": 21},   t=360,  role="giant"),
    # ---- the second wave of the roster (the owner's picks): elite / heroes, creatures, more siege, bigger giants
    "imp":     dict(fam="lair",     lv=4,  space=2,  hp=170,  dps=24,  rng=0,  spd=1.9, cost={"turq": 7, "ruby": 3},      t=45,   role="cavalry"),
    "mage":    dict(fam="lair",     lv=7,  space=3,  hp=150,  dps=40,  rng=30, spd=0.95, cost={"turq": 18, "ruby": 8},     t=75,   role="ranged"),
    "ram":     dict(fam="workshop", lv=13,  space=5,  hp=750,  dps=62,  rng=0,  spd=0.9, cost={"ruby": 20, "emerald": 20},  t=150,  role="giant"),
    "cannon":  dict(fam="workshop", lv=15,  space=7,  hp=520,  dps=84,  rng=36, spd=0.5, cost={"ruby": 37, "emerald": 22},  t=220,  role="siege"),
    "werewolf": dict(fam="workshop", lv=16, space=8,  hp=1250, dps=58,  rng=0,  spd=2.3, cost={"ruby": 41, "turq": 15},      t=280,  role="cavalry"),
    "trebuchet": dict(fam="workshop", lv=18, space=10, hp=640,  dps=118, rng=62, spd=0.4, cost={"ruby": 58, "emerald": 37}, t=330,  role="siege"),
    "hill":    dict(fam="workshop", lv=24,  space=16, hp=3300, dps=64,  rng=0,  spd=0.85, cost={"ruby": 106, "turq": 37},    t=520,  role="giant"),
    "shieldmaiden": dict(fam="barracks", lv=15, space=6, hp=1150, dps=52, rng=0, spd=1.15, cost={"ruby": 38, "emerald": 20, "turq": 6}, t=210, role="tank"),
    "lord":    dict(fam="stable",   lv=20, space=8,  hp=1500, dps=74,  rng=0,  spd=2.3, cost={"ruby": 71, "emerald": 25, "turq": 17}, t=270, role="cavalry"),
    # The green dragonling (Quaternius "Dragon Evolved", CC0): small, between the baby dragon and the big one; a normal Lair unit from Lair Lv 12 (the egg is gone).
    "dragonling": dict(fam="lair",  lv=18, space=6,  hp=660,  dps=44,  rng=15, spd=1.9, cost={"turq": 50, "ruby": 21},    t=240,  role="air", air=True),
    # ---- p35 (owner 5 Oct 2026): the roster spread over 30 levels; every old unit keeps its stats, its unlock level moved (S()-stretched, heroes on their own ladder) and its price grew x1.13 per level of delay (the same hours of mine output)
    # the Roman legionary: the plain soldier between the spear and the sword (rectangular shield, short sword)
    "legionary": dict(fam="barracks", lv=2, space=1, hp=150, dps=11, rng=0, spd=1.0, cost={"ruby": 5, "emerald": 2}, t=24, role="infantry"),
    # HERO 1, the captain (owner 21:42: a weak hero to reach after about two months): Barracks 7, three at most; ability Banner (the soldiers near him hit harder)
    "captain": dict(fam="barracks", lv=7, space=4, hp=700, dps=36, rng=0, spd=1.1, cost={"ruby": 26, "emerald": 12, "turq": 4}, t=120, role="tank"),
    # the ogre (Workshop 22): a big club-wielding brute - slow, tough, every blow smashes a small area
    "ogre": dict(fam="workshop", lv=22, space=13, hp=2700, dps=62, rng=0, spd=0.9, cost={"ruby": 100, "turq": 30}, t=420, role="giant"),
    # the gryphon (Stable 23): a flying beast that dives on the nearest target; strong against soldiers and war machines, cannot be reached by melee guards
    "gryphon": dict(fam="stable", lv=23, space=9, hp=1300, dps=60, rng=0, spd=2.5, cost={"ruby": 48, "turq": 66}, t=300, role="air", air=True),
    # the lich (Lair 25): a bone sorcerer - frail, long reach, every bolt bursts on a group
    "lich": dict(fam="lair", lv=25, space=9, hp=800, dps=110, rng=34, spd=0.95, cost={"turq": 72, "ruby": 62}, t=380, role="ranged"),
    # the treant (Workshop 26): a walking oak - huge hit points that mend slowly, heavy fists
    "treant": dict(fam="workshop", lv=26, space=15, hp=4000, dps=55, rng=0, spd=0.8, cost={"ruby": 80, "emerald": 60, "turq": 22}, t=520, role="giant"),
    # HERO 4, the gryphon knight (Stable 25): a rider in blue plate on a gryphon; ability Dive Strike (a hard blow on a whole spot)
    "gryphonknight": dict(fam="stable", lv=25, space=10, hp=1900, dps=100, rng=0, spd=2.4, cost={"ruby": 78, "emerald": 22, "turq": 32}, t=330, role="air", air=True),
    # HERO 5, the dark rider (Lair 28): a black dragon with a rider in dark plate; ability Shadow Breath (a long breath that burns everything in a line)
    "darkrider": dict(fam="lair", lv=28, space=20, hp=4200, dps=190, rng=24, spd=1.9, cost={"turq": 300, "ruby": 150}, t=900, role="air", air=True),
    # the three-headed baby dragon (Lair 29) and the three-headed dragon (Lair 30): bigger and prettier than the normal ones, three breaths at once
    "baby3": dict(fam="lair", lv=29, space=20, hp=3000, dps=140, rng=20, spd=1.8, cost={"turq": 480, "ruby": 200}, t=1100, role="air", air=True),
    "dragon3": dict(fam="lair", lv=30, space=48, hp=8000, dps=360, rng=24, spd=1.8, cost={"turq": 1300, "ruby": 450}, t=3200, role="air", air=True),
}
UNIT_ORDER = list(UNITS)

# ---- heroes (p35 K2, owner 5 Oct 2026: «هیرو حداکثر ۳ تا از هر کدوم، تو لول مکس، اول یکی بعد دو تا بعد سه تا»): at most three of each hero.
# The first copy comes with the unit's own unlock level, the second at building level HERO_SLOT_AT[0], the third at HERO_SLOT_AT[1] (= the maximum).
HEROES = ("captain", "shieldmaiden", "lord", "gryphonknight", "darkrider")        # (the ladder: Barracks 7 / Barracks 15 / Stable 20 / Stable 25 / Lair 28)
HERO_SLOT_AT = (26, 30)


def hero_slot_levels(u: str) -> Tuple[int, int, int]:
    a = int(UNITS[u]["lv"])
    b = max(a + 1, HERO_SLOT_AT[0])
    return a, b, max(b + 1, HERO_SLOT_AT[1])


def hero_slots(u: str, level: int) -> int:
    """How many copies of hero `u` a building of this level may hold (3 at most); other units have no such cap."""
    if u not in HEROES:
        return 10 ** 6
    return sum(1 for t in hero_slot_levels(u) if int(level) >= t)


def hero_next(u: str, level: int) -> int:
    """The building level that opens the next copy (0 = all three are open, or the unit is no hero)."""
    if u not in HEROES:
        return 0
    return next((t for t in hero_slot_levels(u) if int(level) < t), 0)


def held_of(st: Dict[str, Any], u: str) -> int:
    """Copies of `u` standing in the army plus those waiting in its building's queue."""
    return int(st["army"].get(u, 0)) + sum(int(b["n"]) for b in (st.get("tq", {}).get(UNITS[u]["fam"]) or []) if b["u"] == u)

# ---- the strategy layer (p32): every unit has a LAYER (air = ignores walls / water, can be sent anywhere and is out of reach of melee guards and ground-only guns;
# wade = giants walk through the moat but are stopped by walls; ground = water only over bridges), a SIZE class from its housing space (the damage classes of the
# defences below: light <= 2, medium 3-6, heavy 7-12, huge >= 13) and a favourite target `prefer` (what the AI of the unit goes for first):
#   defence   draws the fire of the towers (giants, guards, the shieldmaiden)      gate     breaks gates and walls (ram: x4 against them), ignores soldiers
#   standoff  siege engines: defences first, from outside the guns that out-range them     raid  outlying houses / stores / mines outside the guns (fast ones)
#   antiair   goes for the anti-air sites first (dragons)                          near   the nearest thing (soldiers, archers, mages)
_PREFER = dict(spear="near", sword="near", guard="defence", archer="near", cavalry="raid", pegasus="raid", baby="antiair", dragon="antiair", catapult="standoff",
               giant="defence", imp="raid", mage="near", ram="gate", cannon="standoff", werewolf="raid", trebuchet="standoff", hill="defence", shieldmaiden="defence",
               lord="raid", dragonling="antiair", axerider="near",
               legionary="near", captain="near", ogre="defence", gryphon="raid", lich="near", treant="defence", gryphonknight="raid", darkrider="antiair", baby3="antiair", dragon3="antiair")
for _u, _d in UNITS.items():
    _d["size"] = "light" if _d["space"] <= 2 else "medium" if _d["space"] <= 6 else "heavy" if _d["space"] <= 12 else "huge"
    _d["layer"] = "air" if _d.get("air") else "wade" if _u in ("giant", "hill") else "ground"
    _d["prefer"] = _PREFER[_u]

# how many soldiers a kingdom's garrison fields by its castle level (p32, owner 4 Oct: a level-20 base holds ~150, not 30): (level, bodies) points, linear in between.
# The garrison keeps its share of the base's firepower and hit points (the budget does not grow): more bodies = each one thinner.
GARRISON_AT = [[S(1), 20], [S(5), 70], [S(10), 150], [S(15), 230], [S(20), 300]]      # (p35: x2 bodies = owner «دفاع دشمن ×۲»; levels 1 / 7 / 15 / 22 / 30)
GARRISON_MIX = dict(guard=0.55, archer=0.25, heavy=0.10, reserve=0.10)       # melee guards / archers / heavy guards / the reserve that sallies at raiders in the outskirts

# ---- the defences (p32).  `hits`: which layers the gun can hit; `w`: its share of the base's firepower (the budget stays the same, the rules only redistribute it);
# `rng` in the old map units (the client multiplies by 2), `cd` seconds between shots; `splash` / `minr` in splash units (x2 metres); `mult`: damage x by the SIZE class of the target
# (the rock-paper-scissors core: arrows shred the light, cannons the packed, ballistas the heavy and the flying);  `pick`: how it chooses its target.
DEFENCES: Dict[str, Dict[str, Any]] = {
    # `unlock` = the castle level at which the kind opens (together with an attack unit of the same level, see DEFENCE_PAIRS); `n` = (sites manned at the unlock level, sites manned at the
    # top, the level at which the top is reached): the number of manned sites grows with the level, the ones nearest the main gate first.
    "tower":    dict(hits="both",   w=1.0, rng=34, cd=0.9, splash=0,   minr=0, pick="near",    mult=dict(light=1.5, medium=1.0, heavy=0.6,  air=1.0), unlock=S(1),  n=(3, 11, S(10))),
    "cannon":   dict(hits="ground", w=2.2, rng=40, cd=3.0, splash=3.5, minr=7, pick="dense",   mult=dict(light=1.8, medium=1.0, heavy=0.35, air=0.0), unlock=S(3),  n=(1, 3, S(9))),
    # the Wizard Tower (Clash of Clans / Siegefall): the little mage on the tower top; a small blast on the densest group of ANY layer, two layers, medium reach
    "wizard":   dict(hits="both",   w=1.8, rng=36, cd=1.4, splash=2.0, minr=0, pick="dense",   mult=dict(light=1.3, medium=1.2, heavy=0.7,  air=1.0), unlock=S(5),  n=(1, 4, S(14))),
    "ballista": dict(hits="both",   w=2.2, rng=46, cd=2.6, splash=0,   minr=0, pick="air",     mult=dict(light=0.35, medium=1.0, heavy=2.6, air=2.2), unlock=S(8),  n=(2, 6, S(15))),
    # the four-barrel cannon house: ground only, a salvo of 4 shells on one target, no blind spot, tiny blast
    "quad":     dict(hits="ground", w=2.4, rng=34, cd=1.3, splash=1.1, minr=0, pick="near",    mult=dict(light=1.1, medium=1.3, heavy=0.8,  air=0.0), unlock=S(10), n=(1, 3, S(17)), volley=4),
    "keep":     dict(hits="both",   w=1.2, rng=40, cd=1.6, splash=0,   minr=0, pick="near",    mult=dict(light=1.0, medium=1.0, heavy=1.0,  air=1.0), unlock=1),
    # ---- p35 (owner 5 Oct 2026 20:44: «دفاعی جدید هم میخوایم»): three new kinds on the 30 levels, each opening with an attack unit that fits it
    # the Frost Spire (a tower with an ice crystal): a big burst of cold on the densest group of ANY layer - it does little damage but SLOWS everything inside (slow = speed x this for slow_t seconds)
    "frost":    dict(hits="both",   w=1.5, rng=38, cd=2.2, splash=5.0, minr=0, pick="dense",   mult=dict(light=1.0, medium=1.0, heavy=1.0,  air=0.6), unlock=18, n=(1, 3, 30), slow=0.5, slow_t=3.5),
    # the Flame Tower (a tower with a brazier): ground only, short reach, a fast jet of fire - shreds crowds of light soldiers, barely scratches giants
    "flame":    dict(hits="ground", w=2.6, rng=22, cd=1.1, splash=2.6, minr=0, pick="near",    mult=dict(light=2.0, medium=1.4, heavy=0.7,  air=0.0), unlock=22, n=(1, 3, 30)),
    # the Dragonbane (the big anti-dragon ballista): long reach, slow, huge against anything that flies and against the heavy ones, useless against light soldiers
    "dragonbane": dict(hits="both", w=3.0, rng=58, cd=3.4, splash=0,   minr=0, pick="air",     mult=dict(light=0.25, medium=0.8, heavy=1.6, air=3.2), unlock=23, n=(1, 3, 30)),
    "tesla":    dict(hits="both",   w=2.0, rng=32, cd=1.5, splash=0,   minr=0, pick="near",    mult=dict(light=1.3, medium=1.0, heavy=0.8,  air=1.0), chain=3),
}
# every defence that opens comes with an attack unit of the same level (owner 5 Oct 01:29: «هر چند لول یه سازه دفاعی جدید باز بشه همراه با یه نیرو حمله جدید»)
DEFENCE_PAIRS = [[S(1), "tower", ["spear", "archer"]], [S(3), "cannon", ["sword", "imp"]], [S(5), "wizard", ["mage", "cavalry"]], [S(8), "ballista", ["pegasus"]], [S(10), "quad", ["cannon"]],
                 [S(13), "giant", ["giant"]], [S(16), "baby", ["hill"]], [S(16), "hill", ["hill"]], [S(18), "dragon", ["dragon"]],
                 [18, "frost", ["dragonling", "trebuchet"]], [22, "flame", ["ogre"]], [23, "dragonbane", ["gryphon"]]]      # (p35: the three new defences; the lich / treant / legionary / heroes come on their own ladder)
DEFENCE_PAIRS.sort(key=lambda p: p[0])
# the guardians (owner 5 Oct 01:35 / 01:38): giants, hill giants, baby dragons and dragons stand in the castle as defenders.  (unlock level, how many at the unlock level, how many at the top level)
# A kingdom's own guardians are the units he assigns on the Army sheet (at most this many, at most what he owns); a made-up kingdom gets this many by its level.
GUARDIANS: Dict[str, Dict[str, Any]] = {"giant": dict(unlock=S(13), n=(2, 4)), "baby": dict(unlock=S(16), n=(2, 4)), "hill": dict(unlock=S(16), n=(2, 2)), "dragon": dict(unlock=S(18), n=(2, 2))}      # (p35: x2 counts, unlock levels stretched to 30; n = count at the unlock level, count at MAX_LEVEL)


def guardian_slots(level: int) -> Dict[str, int]:
    """How many guardians of each kind a castle of this level can hold (0 = not open yet)."""
    out: Dict[str, int] = {}
    for k, g in GUARDIANS.items():
        if level < g["unlock"]:
            continue
        n0, n1 = g["n"]
        out[k] = int(n0 + (n1 - n0) * (level - g["unlock"]) / max(1, PR.MAX_LEVEL - g["unlock"]) + 1e-9)
    return out


def guardian_power(guard: Dict[str, Any], forge: int = 1) -> float:
    """The attack-power scale (same formula as army_power) of a guardian line-up; the defence budget of the base is carved up with it."""
    km = 1.0 + 0.06 * max(0, forge - 1)
    return sum(max(0, int(n)) * math.sqrt(UNITS[u]["hp"] * UNITS[u]["dps"]) / 3.0 * km for u, n in (guard or {}).items() if u in UNITS)


def set_guard(st: Dict[str, Any], u: Any, n: Any) -> Tuple[str, Optional[Dict[str, Any]]]:
    """The player assigns n of his giants / hill giants / baby dragons / dragons as guardians of his castle (the rest stay in the attack army)."""
    if u not in GUARDIANS:
        return "bad", None
    try:
        n = int(n)
    except Exception:  # noqa: BLE001
        return "bad", None
    k = PR.keep_level(st)
    slots = guardian_slots(k).get(u, 0)
    if slots <= 0:
        return "locked", {"need": GUARDIANS[u]["unlock"]}
    have = int((st.get("army") or {}).get(u, 0) or 0)
    n = max(0, min(n, slots, have))
    g = dict(st.get("guard") or {})
    if n:
        g[u] = n
    else:
        g.pop(u, None)
    st["guard"] = g
    return "ok", {"guard": g}


def victim_guard(st: Dict[str, Any]) -> Dict[str, int]:
    """The guardians that really stand in a kingdom (what he assigned, within the slots of his level and what he still owns)."""
    slots = guardian_slots(PR.keep_level(st))
    a = st.get("army") or {}
    out = {}
    for u, n in (st.get("guard") or {}).items():
        k = min(int(n or 0), int(slots.get(u, 0)), int(a.get(u, 0) or 0))
        if u in GUARDIANS and k > 0:
            out[u] = k
    return out


def attack_army(st: Dict[str, Any]) -> Dict[str, int]:
    """The units that can go to war: the army minus the guardians that stay home."""
    g = st.get("guard") or {}
    return {u: max(0, int(n) - int(g.get(u, 0) or 0)) for u, n in (st.get("army") or {}).items() if int(n) - int(g.get(u, 0) or 0) > 0}


# ------------------------------------------------------------------ spells (brewed in the forge with turquoise; cast during an attack — Clash of Clans / Siegefall style)
# id: lv = forge level needed, space = forge housing, cost, t = seconds each
SPELLS: Dict[str, Dict[str, Any]] = {
    "lightning": dict(lv=1, space=1, cost={"turq": 8, "ruby": 4},      t=40),
    "heal":      dict(lv=2, space=1, cost={"turq": 8, "emerald": 4},   t=45),
    "freeze":    dict(lv=4, space=1, cost={"turq": 12},                t=60),
    "rage":      dict(lv=6, space=2, cost={"turq": 16, "ruby": 8},     t=90),
    "quake":     dict(lv=9, space=2, cost={"turq": 20, "ruby": 10},    t=120),
}
SPELL_ORDER = list(SPELLS)


def spell_cap(forge_level: int) -> int:
    """Spell housing of the forge."""
    return int(2 + forge_level) if forge_level > 0 else 0


def spell_space(spells: Dict[str, int]) -> int:
    return sum(int(n) * SPELLS[k]["space"] for k, n in spells.items() if k in SPELLS)


def spell_queued_space(st: Dict[str, Any]) -> int:
    return sum(int(b["n"]) * SPELLS[b["u"]]["space"] for b in st.get("sq") or [])


def spell_time(st: Dict[str, Any], u: str, now: Optional[float] = None) -> float:
    s = BO.speed(BO.get(st, "army", time.time() if now is None else now))
    return max(1.0, SPELLS[u]["t"] / speed(PR.level(st, "forge")) / s)


def spell_max(st: Dict[str, Any], u: str) -> int:
    d = SPELLS[u]
    lv = PR.level(st, "forge")
    if lv < d["lv"]:
        return 0
    n = (spell_cap(lv) - spell_space(st["spells"]) - spell_queued_space(st)) // d["space"]
    for g, c in d["cost"].items():
        n = min(n, int(st["gems"].get(g, 0)) // c)
    n = min(n, int((BATCH_MAX_SECONDS - lane_seconds(st.get("sq") or [], 0.0, False)) // spell_time(st, u)))
    return max(0, int(n))


def can_brew(st: Dict[str, Any], u: str, n: int) -> Tuple[str, Optional[Dict[str, Any]]]:
    if u not in SPELLS or n < 1 or n > 50:
        return "bad", None
    d = SPELLS[u]
    lv = PR.level(st, "forge")
    if lv <= 0:
        return "not_built", None
    if lv < d["lv"]:
        return "locked", {"need": d["lv"]}
    lane = st.get("sq") or []
    if lane and lane[-1]["u"] != u and len(lane) >= LANE_MAX_BATCHES:
        return "queue_full", None
    if spell_space(st["spells"]) + spell_queued_space(st) + d["space"] * n > spell_cap(lv):
        return "family_full", {"cap": spell_cap(lv)}
    cost = {g: int(c) * int(n) for g, c in d["cost"].items()}
    for g, c in cost.items():
        if int(st["gems"].get(g, 0)) < c:
            return "gems", {"need": cost}
    if lane_seconds(lane, 0.0, False) + n * spell_time(st, u) > BATCH_MAX_SECONDS:
        return "too_long", None
    return "ok", {"cost": cost, "t": spell_time(st, u)}


def brew(st: Dict[str, Any], u: str, n: int, now: float) -> Tuple[str, Optional[Dict[str, Any]]]:
    why, info = can_brew(st, u, n)
    if why != "ok":
        return why, info
    for g, c in info["cost"].items():
        st["gems"][g] = int(st["gems"].get(g, 0)) - c
    lane = st.setdefault("sq", [])
    lane_add(lane, u, n, info["t"], dict(SPELLS[u]["cost"]), now)
    return "ok", {"end": now + lane_seconds(lane, now), "cost": info["cost"]}


def brew_cancel(st: Dict[str, Any], i: Any = None, n: Any = None) -> Tuple[str, Optional[Dict[str, Any]]]:
    """Take `n` spells (all when None) out of the queue slot `i` (the last slot when None); the gems come back in full."""
    lane = st.get("sq") or []
    if not lane:
        return "none", None
    idx = len(lane) - 1 if i is None else int(i)
    refund = lane_remove(lane, idx, None if n is None else int(n), time.time())
    if refund is None:
        return "bad", None
    for g, c in refund.items():
        st["gems"][g] = int(st["gems"].get(g, 0)) + c
    return "ok", None


def brew_rush(st: Dict[str, Any], now: float) -> int:
    return rush_cost(st.get("sq") or [], now, PR.keep_level(st))


def brew_speedup(st: Dict[str, Any], now: float) -> Tuple[str, Optional[Dict[str, Any]]]:
    lane = st.get("sq") or []
    if not lane:
        return "none", None
    c = rush_cost(lane, now, PR.keep_level(st))
    if int(st["gems"].get("turq", 0)) < c:
        return "gems", {"need": {"turq": c}}
    st["gems"]["turq"] = int(st["gems"]["turq"]) - c
    sp = st.setdefault("spells", {})
    for b in lane:
        sp[b["u"]] = int(sp.get(b["u"], 0)) + int(b["n"])
    st["sq"] = []
    return "ok", {"cost": c}


FAMILIES = ("barracks", "training", "stable", "lair", "workshop")      # = the structure ids that train units
BATCH_MAX_SECONDS = 12 * 3600.0
CANCEL_REFUND = 0.5
LANE_MAX_BATCHES = 6                   # different kinds waiting in one building's queue


# ------------------------------------------------------------------ production lanes
# A lane = list of batches [{"u", "n", "t" (seconds per piece), "cu" (gem cost per piece), "s" (when the piece in production started; head only)}].
# Soldiers / spells come out ONE BY ONE (Clash of Clans style): the head batch delivers a piece every `t` seconds, then the next batch starts.
# Gems are paid when a piece is queued and come back in full when it is taken out of the queue again.
def lane_settle(lane: List[Dict[str, Any]], now: float, deliver) -> bool:
    changed = False
    while lane:
        b = lane[0]
        if b.get("s") is None:
            b["s"] = now
        k = min(int(b["n"]), int((now - b["s"]) // b["t"])) if now > b["s"] else 0
        if k <= 0:
            break
        deliver(b["u"], k)
        b["n"] -= k
        b["s"] += k * b["t"]
        changed = True
        if b["n"] > 0:
            break
        fin = b["s"]
        lane.pop(0)
        if lane:
            lane[0]["s"] = fin
    return changed


def lane_seconds(lane: List[Dict[str, Any]], now: float, running: bool = True) -> float:
    """Seconds until the whole lane is done (the head's progress counts when `running`)."""
    tot = sum(float(b["n"]) * float(b["t"]) for b in lane)
    if running and lane and lane[0].get("s") is not None:
        tot -= max(0.0, min(float(lane[0]["t"]), now - float(lane[0]["s"])))
    return max(0.0, tot)


def lane_add(lane: List[Dict[str, Any]], u: str, n: int, t: float, cu: Dict[str, int], now: float) -> None:
    if lane and lane[-1]["u"] == u and abs(float(lane[-1]["t"]) - t) < 1e-6:
        lane[-1]["n"] += int(n)
    else:
        lane.append({"u": u, "n": int(n), "t": float(t), "cu": {g: int(c) for g, c in cu.items()}, "s": now if not lane else None})


def lane_remove(lane: List[Dict[str, Any]], i: int, n: Optional[int], now: float) -> Optional[Dict[str, int]]:
    """Take n pieces (all when None) out of slot i; returns the gems to give back (None when the slot does not exist)."""
    if not (0 <= i < len(lane)):
        return None
    b = lane[i]
    k = int(b["n"]) if n is None else max(0, min(int(n), int(b["n"])))
    if k <= 0:
        return None
    b["n"] -= k
    refund = {g: int(c) * k for g, c in b["cu"].items()}
    if b["n"] <= 0:
        lane.pop(i)
        if i == 0 and lane:
            lane[0]["s"] = now
    return refund


def rush_cost(lane: List[Dict[str, Any]], now: float, keep: int = 1) -> int:
    """Turquoise to finish a training / brewing lane at once: half the building rush price, never free while something is queued
    (free short rushes could be chained into free training; the concave price makes small chunks dearer, not cheaper)."""
    secs = lane_seconds(lane, now)
    if secs <= 0:
        return 0
    return max(1, int(math.ceil(0.5 * PR.RUSH_HOURS * PR.mine_rate("turq", max(1, keep)) * (secs / 3600.0) ** PR.RUSH_EXP)))


def lane_view(lane: List[Dict[str, Any]], now: float) -> List[Dict[str, Any]]:
    out, acc = [], 0.0
    for i, b in enumerate(lane):
        left = float(b["n"]) * float(b["t"]) - (max(0.0, min(float(b["t"]), now - float(b["s"]))) if i == 0 and b.get("s") is not None else 0.0)
        acc += left
        out.append({"u": b["u"], "n": int(b["n"]), "t": round(float(b["t"]), 2), "next": round(float(b["t"]) - (now - float(b["s"]) if i == 0 and b.get("s") is not None else 0.0), 1) if i == 0 else None,
                    "fin": round(now + acc, 1)})
    return out


SHIELD_SECONDS = 4 * 3600
ATTACK_COOLDOWN = 20.0                  # seconds between two scouts (anti spam; the owner gets 2 s, see state.scout)
BATTLE_TIMEOUT = 20 * 60                # a battle token is valid this long
LOOT_HOURS = 6.0                        # a full win pays about this many hours of the attacker's CASTLE-LEVEL mine output (not of his mine levels, not of his army size).  p35: x2 (was 3 h) because the army, its losses and the vaults are x2
PLAYER_LOOT_HOURS = 8.0                 # the most a raid on another player's kingdom can take, in hours of the attacker's castle-level output (p35: x2, was 4 h)
POOL_HOURS = 48.0                       # the plunder pool (bots only): up to this many hours of output, refilled 1 hour per hour; an empty pool still pays POOL_FLOOR of the nominal loot
POOL_FLOOR = 0.4
# reference army power of a full, balanced army per castle level (the scale every base budget and army power is on)
P_REF: List[int] = []                  # reference army power of a full army at castle level 1..MAX_LEVEL (computed below from the rules, = D(K) of a level-K base)
GAP = {2: 1.2, 1: 1.1, 0: 1.0, -1: 0.8, -2: 0.5, -3: 0.25}      # loot factor by (target level - attacker castle level): a tiny army can only reach tiny bases, and tiny bases pay nothing


def level_for_power(p: float) -> int:
    """The castle level whose reference army power is closest to `p`."""
    return 1 + min(range(len(P_REF)), key=lambda i: abs(P_REF[i] - p))


def gap_factor(target_level: int, my_level: int) -> float:
    d = int(target_level) - int(my_level)
    return GAP.get(d, 1.2 if d > 2 else 0.1)


def pool_levels(st: Dict[str, Any], now: float) -> Dict[str, float]:
    """What is left in the plunder pool per gem (timestamp based like the mines; a kingdom that never attacked has a full pool)."""
    k = PR.keep_level(st)
    pl = st.get("pool") or {}
    t = float(pl.get("t", now) or now)
    out = {}
    for g in GEMS:
        rt = PR.mine_rate(g, k)
        cap = POOL_HOURS * rt
        out[g] = min(cap, float(pl.get(g, cap)) + max(0.0, now - t) / 3600.0 * rt)
    return out


def pool_take(st: Dict[str, Any], loot: Dict[str, int], now: float) -> None:
    cur = pool_levels(st, now)
    st["pool"] = {"t": now, **{g: max(0.0, cur[g] - float(loot.get(g, 0))) for g in GEMS}}


def fam_level(st: Dict[str, Any], fam: str) -> int:
    return PR.level(st, fam)


ARMY_MULT = 2                          # p35 (owner 5 Oct 2026: «ارتش ×۲»): every housing figure (training ground and each family's building) is twice what it was


def army_cap(training_level: int) -> int:
    """Total housing space (training ground): 60 at level 1 ... 872 at level 30 (x ARMY_MULT of the old 30 + 14 (L - 1))."""
    return ARMY_MULT * int(30 + 14 * (max(1, training_level) - 1)) if training_level > 0 else 0


def fam_cap(fam: str, level: int) -> int:
    """Space of the family's units that its building can hold (x ARMY_MULT)."""
    if level <= 0:
        return 0
    L = level - 1
    return ARMY_MULT * {"barracks": 14 + 7 * L, "training": 10 + 5 * L, "stable": 8 + 4 * L, "lair": 12 + 6 * L, "workshop": 10 + 5 * L}[fam]


def speed(level: int) -> float:
    return 1.0 + 0.08 * (max(1, level) - 1)


def forge_mult(st: Dict[str, Any]) -> float:
    """Stat bonus from the forge (armour + weapons): +6 % per level."""
    return 1.0 + 0.06 * max(0, PR.level(st, "forge") - 1)


# ---- unit levels: a soldier's level is the level of the building that trains it (barracks / training ground / stable / lair / workshop).
# Every level adds LVL_STEP to its hit points and damage; every tier (the same steps as the buildings, stretched to 30 levels: 1 wood, 6 stone, 12 iron,
# 18 gold, 24 diamond, 30 blue crystal) changes its look (bunits.js / unitlook.js) and from iron on adds a perk:
#   iron  ARMOR       -10 % damage taken            gold     SWIFT       +10 % speed
#   diamond FURY      +15 % damage                  crystal  LAST STAND  survives one deadly blow with 25 % of its life
LVL_STEP = 0.035
TIER_AT = (1, 6, 12, 18, 24, 30)
PERKS = {2: "armor", 3: "swift", 4: "fury", 5: "laststand"}


def tier_of(lv: int) -> int:
    t = 0
    for i, a in enumerate(TIER_AT):
        if int(lv) >= a:
            t = i
    return t


def lvl_mult(lv: int) -> float:
    return 1.0 + LVL_STEP * (max(1, min(PR.MAX_LEVEL, int(lv))) - 1)


def unit_level(st: Dict[str, Any], u: str) -> int:
    return max(1, PR.level(st, UNITS[u]["fam"]))


def unit_power(u: str, mult: float = 1.0, lv: int = 1) -> float:
    """Army power of one unit (sqrt(hp x dps) / 3) with the forge multiplier, its level and its tier perks."""
    d = UNITS[u]
    t = tier_of(lv)
    k = mult * lvl_mult(lv)
    hp = d["hp"] * k * (1 / 0.9 if t >= 2 else 1.0) * (1.25 if t >= 5 else 1.0)
    dps = d["dps"] * k * (1.15 if t >= 4 else 1.0)
    return math.sqrt(hp * dps) / 3.0


def space_of(army: Dict[str, int]) -> int:
    return sum(int(n) * UNITS[u]["space"] for u, n in army.items() if u in UNITS)


def fam_space(army: Dict[str, int], fam: str) -> int:
    return sum(int(n) * UNITS[u]["space"] for u, n in army.items() if u in UNITS and UNITS[u]["fam"] == fam)


def army_power(st: Dict[str, Any], army: Optional[Dict[str, int]] = None, attack: bool = False) -> float:
    """Power of the whole army (what a castle defends with) or, with attack=True, of the part that can go to war (the guardians stay home)."""
    a = attack_army(st) if (attack and army is None) else (st.get("army", {}) if army is None else army)
    m = forge_mult(st)
    return sum(int(n) * unit_power(u, m, unit_level(st, u)) for u, n in a.items() if u in UNITS)


# ------------------------------------------------------------------ state
def _old_batch_to_lane(b: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Kingdoms saved before the queue existed: one batch {u, n, s, end, cost} per building."""
    n = max(1, int(b.get("n", 1)))
    t = max(1.0, (float(b.get("end", 0)) - float(b.get("s", 0))) / n)
    return [{"u": b["u"], "n": n, "t": t, "cu": {g: int(c) // n for g, c in (b.get("cost") or {}).items()}, "s": float(b.get("s", 0))}]


def init(st: Dict[str, Any]) -> None:
    a = st.setdefault("army", {})
    for u in list(a):
        if u not in UNITS:
            a.pop(u)
    tq = st.setdefault("tq", {})
    for f in list(tq):
        if isinstance(tq[f], dict):
            tq[f] = _old_batch_to_lane(tq[f])
        tq[f] = [b for b in tq[f] if b.get("u") in UNITS and int(b.get("n", 0)) > 0]
        if f not in FAMILIES or not tq[f]:
            del tq[f]
    st.setdefault("rep", [])
    sp = st.setdefault("spells", {})
    for k in list(sp):
        if k not in SPELLS:
            sp.pop(k)
    sq = st.get("sq")
    if isinstance(sq, dict):
        st["sq"] = _old_batch_to_lane(sq)
    elif not isinstance(sq, list):
        st["sq"] = []
    st["sq"] = [b for b in st["sq"] if b.get("u") in SPELLS and int(b.get("n", 0)) > 0]


def rescale_lanes(st: Dict[str, Any], t: float, k: float) -> None:
    """Every queued piece now takes k times as long (the boost changed at time t; lanes already settled to t).  The piece in production
    keeps the share of its time it already did."""
    for lane in list(st.get("tq", {}).values()) + [st.get("sq") or []]:
        for i, b in enumerate(lane):
            old = float(b["t"])
            b["t"] = max(0.5, old * k)
            if i == 0 and b.get("s") is not None:
                b["s"] = t - max(0.0, t - float(b["s"])) * k


def settle(st: Dict[str, Any], now: float) -> bool:
    """Deliver the soldiers / spells that came out of the queues (an army boost that ended in between is handled exactly at its end).
    Returns True when something changed."""
    changed = False
    s, e = BO.window(st, "army")
    if 0 < e <= now:
        changed = _settle_to(st, e) or changed
        rescale_lanes(st, e, s)
        st["bst"].pop("army", None)
        changed = True
    return _settle_to(st, now) or changed


def _settle_to(st: Dict[str, Any], now: float) -> bool:
    changed = False
    army = st["army"]
    for fam, lane in list(st.get("tq", {}).items()):
        def put(u, k):
            army[u] = int(army.get(u, 0)) + int(k)
        if lane_settle(lane, now, put):
            changed = True
        if not lane:
            del st["tq"][fam]
    sp = st.setdefault("spells", {})

    def put_s(u, k):
        sp[u] = int(sp.get(u, 0)) + int(k)
    if lane_settle(st.setdefault("sq", []), now, put_s):
        changed = True
    return changed


def queued_space(st: Dict[str, Any], fam: Optional[str] = None) -> int:
    return sum(int(b["n"]) * UNITS[b["u"]]["space"] for f, lane in st.get("tq", {}).items() if fam is None or f == fam for b in lane)


def unit_cost(u: str, n: int) -> Dict[str, int]:
    return {g: int(c) * int(n) for g, c in UNITS[u]["cost"].items()}


def unit_time(st: Dict[str, Any], u: str, now: Optional[float] = None) -> float:
    """Seconds per piece; an army boost running now makes it shorter (military.settle re-times the queue when the boost ends)."""
    s = BO.speed(BO.get(st, "army", time.time() if now is None else now))
    return max(1.0, UNITS[u]["t"] / speed(PR.level(st, UNITS[u]["fam"])) / s)


def max_train(st: Dict[str, Any], u: str) -> int:
    """How many more `u` could be queued right now (space / housing / gems / queue length)."""
    d = UNITS[u]
    fam = d["fam"]
    lv = PR.level(st, fam)
    if lv < d["lv"] or (d.get("prem") and not (st.get("own") or {}).get(u)):
        return 0
    lane = st["tq"].get(fam, [])
    if lane and lane[-1]["u"] != u and len(lane) >= LANE_MAX_BATCHES:
        return 0
    room_fam = fam_cap(fam, lv) - fam_space(st["army"], fam) - queued_space(st, fam)
    room_all = army_cap(PR.level(st, "training")) - space_of(st["army"]) - queued_space(st)
    n = min(room_fam, room_all) // d["space"]
    if u in HEROES:
        n = min(n, hero_slots(u, lv) - held_of(st, u))
    for g, c in d["cost"].items():
        n = min(n, int(st["gems"].get(g, 0)) // c)
    n = min(n, int((BATCH_MAX_SECONDS - lane_seconds(lane, 0.0, False)) // unit_time(st, u)))
    return max(0, int(n))


def can_train(st: Dict[str, Any], u: str, n: int, now: float) -> Tuple[str, Optional[Dict[str, Any]]]:
    if u not in UNITS or n < 1 or n > 500:
        return "bad", None
    d = UNITS[u]
    fam = d["fam"]
    lv = PR.level(st, fam)
    if lv <= 0:
        return "not_built", None
    if lv < d["lv"]:
        return "locked", {"need": d["lv"]}
    if d.get("prem") and not (st.get("own") or {}).get(u):
        return "egg", {"unit": u}
    if PR.level(st, "training") <= 0:
        return "no_training", None
    if u in HEROES and held_of(st, u) + n > hero_slots(u, lv):
        return "hero_cap", {"cap": hero_slots(u, lv), "held": held_of(st, u), "next": hero_next(u, lv)}
    lane = st["tq"].get(fam, [])
    if lane and lane[-1]["u"] != u and len(lane) >= LANE_MAX_BATCHES:
        return "queue_full", None
    sp = d["space"] * n
    if fam_space(st["army"], fam) + queued_space(st, fam) + sp > fam_cap(fam, lv):
        return "family_full", {"cap": fam_cap(fam, lv)}
    if space_of(st["army"]) + queued_space(st) + sp > army_cap(PR.level(st, "training")):
        return "army_full", {"cap": army_cap(PR.level(st, "training"))}
    cost = unit_cost(u, n)
    for g, c in cost.items():
        if int(st["gems"].get(g, 0)) < c:
            return "gems", {"need": cost}
    t = unit_time(st, u, now)
    if lane_seconds(lane, 0.0, False) + n * t > BATCH_MAX_SECONDS:
        return "too_long", None
    return "ok", {"cost": cost, "t": t}


def train(st: Dict[str, Any], u: str, n: int, now: float) -> Tuple[str, Optional[Dict[str, Any]]]:
    """Queue n more `u` in its building (the same kind as the last batch simply grows it)."""
    why, info = can_train(st, u, n, now)
    if why != "ok":
        return why, info
    for g, c in info["cost"].items():
        st["gems"][g] = int(st["gems"].get(g, 0)) - c
    lane = st["tq"].setdefault(UNITS[u]["fam"], [])
    lane_add(lane, u, n, info["t"], dict(UNITS[u]["cost"]), now)
    return "ok", {"end": now + lane_seconds(lane, now), "cost": info["cost"]}


def cancel(st: Dict[str, Any], fam: str, now: float, i: Any = None, n: Any = None) -> Tuple[str, Optional[Dict[str, Any]]]:
    """Take `n` soldiers (all when None) out of queue slot `i` (the last slot when None); the gems come back in full."""
    lane = st["tq"].get(fam)
    if not lane:
        return "none", None
    idx = len(lane) - 1 if i is None else int(i)
    refund = lane_remove(lane, idx, None if n is None else int(n), now)
    if refund is None:
        return "bad", None
    for g, c in refund.items():
        st["gems"][g] = int(st["gems"].get(g, 0)) + c
    if not lane:
        del st["tq"][fam]
    return "ok", None


def speedup_cost(lane: List[Dict[str, Any]], now: float, keep: int = 1) -> int:
    return rush_cost(lane, now, keep)


def speedup(st: Dict[str, Any], fam: str, now: float) -> Tuple[str, Optional[Dict[str, Any]]]:
    """Finish the whole queue of one building at once for turquoise."""
    lane = st["tq"].get(fam)
    if not lane:
        return "none", None
    c = rush_cost(lane, now, PR.keep_level(st))
    if int(st["gems"].get("turq", 0)) < c:
        return "gems", {"need": {"turq": c}}
    st["gems"]["turq"] = int(st["gems"]["turq"]) - c
    for b in lane:
        st["army"][b["u"]] = int(st["army"].get(b["u"], 0)) + int(b["n"])
    del st["tq"][fam]
    return "ok", {"cost": c}


# ------------------------------------------------------------------ views
def readiness(st: Dict[str, Any]) -> int:
    """The % shown on the ATTACK button: how much of the housing is filled with trained soldiers."""
    cap = army_cap(PR.level(st, "training"))
    return int(round(100.0 * min(1.0, space_of(st["army"]) / cap))) if cap else 0


def view(st: Dict[str, Any], now: float, attack_ok: bool = False) -> Dict[str, Any]:
    tr = PR.level(st, "training")
    fams = {}
    for f in FAMILIES:
        lv = PR.level(st, f)
        lane = st["tq"].get(f) or []
        fams[f] = {"lv": lv, "cap": fam_cap(f, lv), "used": fam_space(st["army"], f), "q": lane_view(lane, now),
                   "left": round(lane_seconds(lane, now), 1) if lane else 0, "rush": rush_cost(lane, now, PR.keep_level(st)) if lane else 0}
    units = {}
    for u in UNIT_ORDER:
        d = UNITS[u]
        ul = unit_level(st, u)
        row: Dict[str, Any] = {"n": int(st["army"].get(u, 0)), "fam": d["fam"], "lv": d["lv"], "space": d["space"],
                               "open": PR.level(st, d["fam"]) >= d["lv"] and (not d.get("prem") or bool((st.get("own") or {}).get(u))),
                               "ulv": ul, "tier": tier_of(ul), "hp": round(d["hp"] * lvl_mult(ul) * forge_mult(st)), "dps": round(d["dps"] * lvl_mult(ul) * forge_mult(st), 1)}
        if d.get("prem"):
            row["prem"] = True
            row["egg"] = bool((st.get("own") or {}).get(u))
        if u in HEROES:
            row["hero"] = {"cap": hero_slots(u, PR.level(st, d["fam"])), "max": 3, "held": held_of(st, u), "next": hero_next(u, PR.level(st, d["fam"]))}
        if row["open"]:
            row["max"] = max_train(st, u)
        units[u] = row
    fl = PR.level(st, "forge")
    sq = st.get("sq") or []
    spells = {k: {"n": int(st.get("spells", {}).get(k, 0)), "lv": d["lv"], "space": d["space"], "open": fl >= d["lv"], "max": spell_max(st, k)} for k, d in SPELLS.items()}
    sview = {"lv": fl, "cap": spell_cap(fl), "used": spell_space(st.get("spells", {})) + spell_queued_space(st), "spells": spells, "q": lane_view(sq, now),
             "left": round(lane_seconds(sq, now), 1) if sq else 0, "rush": rush_cost(sq, now, PR.keep_level(st)) if sq else 0}
    return {"army": {u: int(n) for u, n in st["army"].items() if n}, "units": units, "spell": sview, "fam": fams,
            "space": space_of(st["army"]), "queued": queued_space(st), "cap": army_cap(tr), "ready": readiness(st),
            "power": int(army_power(st)), "apower": int(army_power(st, attack=True)), "guard": victim_guard(st), "gslots": guardian_slots(PR.keep_level(st)),
            "forge": PR.level(st, "forge"), "shield": float(st.get("shield", 0) or 0),
            "attack": bool(attack_ok), "reports": [{k: v for k, v in r.items() if k != "kind"} for r in st.get("rep", [])[-5:]],
            "lv": {f: max(1, PR.level(st, f)) for f in FAMILIES}}


def catalog() -> Dict[str, Any]:
    return {"units": {u: {k: v for k, v in d.items()} for u, d in UNITS.items()}, "order": UNIT_ORDER, "families": FAMILIES,
            "spells": {k: dict(d) for k, d in SPELLS.items()}, "spell_order": SPELL_ORDER, "emblems": EMBLEMS, "spell_cap": [spell_cap(n) for n in range(1, PR.MAX_LEVEL + 1)], "max_level": PR.MAX_LEVEL,
            "army_cap": [army_cap(n) for n in range(1, PR.MAX_LEVEL + 1)],
            "fam_cap": {f: [fam_cap(f, n) for n in range(1, PR.MAX_LEVEL + 1)] for f in FAMILIES},
            "speed": [round(speed(n), 2) for n in range(1, PR.MAX_LEVEL + 1)], "forge_mult": [round(1 + 0.06 * (n - 1), 2) for n in range(1, PR.MAX_LEVEL + 1)],
            "lvl_step": LVL_STEP, "tier_at": list(TIER_AT), "perks": {str(k): v for k, v in PERKS.items()},
            "heroes": {u: list(hero_slot_levels(u)) for u in HEROES}, "defences": {k: dict(d) for k, d in DEFENCES.items()}, "garrison_at": GARRISON_AT, "garrison_mix": GARRISON_MIX, "defence_pairs": DEFENCE_PAIRS, "guardians": GUARDIANS}


# ------------------------------------------------------------------ targets
def defence_power(levels: Dict[str, int], army_pw: float = 0.0) -> float:
    """How strong a base is (same scale as army power): walls, towers, keep and a small garrison."""
    w, t, k = max(1, levels.get("wall", 1)), max(1, levels.get("towers", 1)), max(1, levels.get("keep", 1))
    return 18.0 * w ** 1.25 + 16.0 * t ** 1.3 + 9.0 * k + 0.25 * army_pw


# ------------------------------------------------------------------ identity: every kingdom has a name and a banner emblem
EMBLEMS = ["swords", "wings", "dragon", "axes", "heart", "crown", "tower", "wolf", "eagle", "lion", "bear", "serpent",
           "flame", "star", "moon", "sun", "bolt", "pine", "anchor", "arrows", "stag", "frost", "helm", "gem"]
# banners saved before the crest redesign stored an emoji: map each old one to its nearest crest so nobody loses their banner
_OLD_EMOJI = ["⚔", "🗡", "🐉", "🔨", "❤", "👑", "🛡", "🐺", "🦅", "🦁", "🐻", "🐍", "🔥", "⭐", "🌙", "☀", "⚡", "🌲", "⚓", "🏹", "🏰", "❄", "🐴", "💎",
              "🗝", "🌹", "🦂", "🪓", "🦉", "🐗", "🦊", "💀"]
_OLD_TO = ["swords", "wings", "dragon", "axes", "heart", "crown", "helm", "wolf", "eagle", "lion", "bear", "serpent",
           "flame", "star", "moon", "sun", "bolt", "pine", "anchor", "arrows", "tower", "frost", "stag", "gem",
           "tower", "heart", "serpent", "axes", "eagle", "bear", "wolf", "helm"]
LEGACY_EMBLEMS = dict(zip(_OLD_EMOJI, _OLD_TO))


def norm_emblem(e: Any) -> Optional[str]:
    """Any stored / submitted value (a crest id or an old emoji) -> a valid crest id, else None."""
    if isinstance(e, str):
        if e in EMBLEMS:
            return e
        return LEGACY_EMBLEMS.get(e.replace("\ufe0f", ""))
    return None


def default_emblem(uid: int) -> str:
    return EMBLEMS[int(uid) % len(EMBLEMS)]


def emblem_of(st: Dict[str, Any], uid: Optional[int] = None) -> str:
    return norm_emblem(st.get("emblem")) or default_emblem(uid or 0)


def set_emblem(st: Dict[str, Any], e: Any) -> Tuple[str, Optional[Dict[str, Any]]]:
    n = norm_emblem(e)
    if n is None:
        return "bad", None
    st["emblem"] = n
    return "ok", None


def bot_target(st: Dict[str, Any], rng: Optional[random.Random] = None, now: Optional[float] = None) -> Dict[str, Any]:
    """A bot base 20 % weaker .. 20 % stronger than the attacker's army (`ratio` = defence budget / attacker power); its castle level follows that budget.
    The loot is LOOT_HOURS (6) hours of the attacker's castle-level output times the level-gap factor, then scaled down while the plunder pool is running dry."""
    rng = rng or random.Random()
    now = time.time() if now is None else now
    my = max(30.0, army_power(st, attack=True))
    ratio = round(rng.uniform(0.80, 1.20), 3)
    k = PR.keep_level(st)
    lv = int(max(1, min(PR.MAX_LEVEL, level_for_power(my * ratio) + rng.choice((-1, 0, 0, 1)))))
    seed = rng.randrange(1, 2 ** 31)
    levels = {"keep": lv, "wall": lv, "towers": max(1, lv - rng.randint(0, 2))}
    pool = pool_levels(st, now)
    loot = {}
    for g in GEMS:
        nominal = PR.mine_rate(g, k) * LOOT_HOURS * gap_factor(lv, k)
        f = 1.0 if pool[g] >= nominal else max(POOL_FLOOR, pool[g] / max(1.0, nominal))
        loot[g] = int(nominal * f)
    tesla = (1 if lv >= 9 and rng.random() < 0.35 else 0) + (1 if lv >= 15 and rng.random() < 0.35 else 0)      # (some made-up kingdoms own Tesla coils too: same defence budget, more to look at)
    return {"kind": "bot", "name": NM.pick(rng), "emblem": rng.choice(EMBLEMS), "ratio": ratio, "levels": levels, "seed": seed, "power": int(my * ratio), "loot": loot, "tesla": tesla}


def attack_allowed(uid: int, owners: set, public: bool) -> bool:
    """Attacks are open to every player (p22); BLUEWALL_ATTACK=owner makes them owner-only again."""
    return public or uid in owners


def player_target(me: Dict[str, Any], victim: Dict[str, Any], vuid: int, rng: random.Random, now: Optional[float] = None) -> Optional[Dict[str, Any]]:
    """Spec for attacking another player's (offline) kingdom, or None when the match-up is unfair."""
    my = max(30.0, army_power(me, attack=True))
    lv = {e: PR.level(victim, e) for e in ("keep", "wall", "towers")}
    tesla = max(0, min(4, int((victim.get("own") or {}).get("tesla", 0) or 0)))
    d = defence_power(lv, army_power(victim)) * (1.0 + 0.08 * tesla)
    ratio = d / my
    if not (0.7 <= ratio <= 1.4) or abs(lv["keep"] - PR.keep_level(me)) > 3:
        return None
    k = PR.keep_level(me)
    loot = {}
    for g in GEMS:
        cap = PR.mine_rate(g, k) * PLAYER_LOOT_HOURS * gap_factor(lv["keep"], k)                      # (what a player can take is limited by his own castle level and the gap, like a bot's)
        loot[g] = int(min(cap, 0.20 * int(victim["gems"].get(g, 0))))
    return {"kind": "player", "name": (str(victim.get("name") or "").strip() or NM.pick(rng))[:24], "emblem": emblem_of(victim, vuid), "ratio": round(ratio, 3), "levels": lv, "seed": rng.randrange(1, 2 ** 31),
            "power": int(d), "loot": loot, "tesla": tesla, "guard": victim_guard(victim), "_victim": vuid}


def scout_wait(st: Dict[str, Any], now: float, cooldown: Optional[float] = None) -> float:
    """Seconds still to wait before the next scout is allowed (0 when it is allowed now): the client shows this as a search percentage."""
    cd = ATTACK_COOLDOWN if cooldown is None else cooldown
    t = float(st.get("atk", {}).get("t", 0) or 0)
    return max(0.0, cd - (now - t)) if t else 0.0


def scout(st: Dict[str, Any], uid: int, now: float, pick_player: Optional[Dict[str, Any]], rng: Optional[random.Random] = None, cooldown: Optional[float] = None) -> Tuple[str, Optional[Dict[str, Any]]]:
    """Choose the next target (player if one is available 1 time in 2, else a bot) and remember it in st["atk"]."""
    cd = ATTACK_COOLDOWN if cooldown is None else cooldown
    if now - float(st.get("atk", {}).get("t", 0) or 0) < cd and st.get("atk", {}).get("t"):
        return "slow", None
    if space_of(attack_army(st)) <= 0:
        return "no_army", None
    rng = rng or random.Random()
    if pick_player and rng.random() < 0.5:
        spec = pick_player
    else:
        spec = bot_target(st, rng, now)
    tid = "%x%x" % (int(now * 1000), rng.randrange(1 << 20))
    st["atk"] = {"id": tid, "spec": spec, "t": now, "done": False}
    return "ok", {"id": tid, **{k: v for k, v in spec.items() if not k.startswith("_") and k != "kind"}}      # (the client never learns whether the base is a real player's)


def clamp_loot(spec: Dict[str, Any], claimed: Dict[str, Any], destruction: float, stars: int) -> Dict[str, int]:
    out = {}
    share = max(0.0, min(1.0, destruction / 100.0)) * (0.55 + 0.15 * max(0, min(3, stars)))
    for g in GEMS:
        mx = int(spec["loot"].get(g, 0) * min(1.0, share))
        out[g] = int(max(0, min(int(_num((claimed or {}).get(g, 0), 0, 10 ** 9)), mx)))
    return out


def _num(v: Any, lo: float, hi: float, default: float = 0.0) -> float:
    """A client-supplied number, forced into [lo, hi]; anything that is not a finite number becomes `default`."""
    try:
        x = float(v)
    except (TypeError, ValueError, OverflowError):
        return default
    if x != x or x in (float("inf"), float("-inf")):
        return default
    return max(lo, min(hi, x))


def _cnt(v: Any) -> int:
    return int(_num(v, 0, 10 ** 6))


def _dict(v: Any) -> Dict[str, Any]:
    return v if isinstance(v, dict) else {}


def settle_battle(st: Dict[str, Any], tid: str, rep: Dict[str, Any], now: float) -> Tuple[str, Optional[Dict[str, Any]]]:
    """Validate the client's report and apply losses + loot.  rep: {sent:{unit:n}, lost:{unit:n}, destruction:0..100, stars:0..3, loot:{gem:n}}."""
    a = st.get("atk") or {}
    if not a or a.get("id") != tid or a.get("done"):
        return "no_target", None
    if now - float(a.get("t", 0)) > BATTLE_TIMEOUT:
        return "expired", None
    if not isinstance(rep, dict):
        return "bad", None
    sent = {u: _cnt(n) for u, n in _dict(rep.get("sent")).items() if u in UNITS and _cnt(n) > 0}
    lost = {u: _cnt(n) for u, n in _dict(rep.get("lost")).items() if u in UNITS and _cnt(n) > 0}
    home = attack_army(st)                                                         # (the guardians stay home: they cannot be sent)
    for u, n in sent.items():
        if n > int(home.get(u, 0)):
            return "bad_units", None
    for u, n in lost.items():
        if n > sent.get(u, 0):
            return "bad_losses", None
    cast = {k: _cnt(n) for k, n in _dict(rep.get("spells")).items() if k in SPELLS and _cnt(n) > 0}
    for k, n in cast.items():
        if n > int(st.get("spells", {}).get(k, 0)):
            return "bad_spells", None
    destruction = _num(rep.get("destruction"), 0.0, 100.0)                      # (NaN / inf / text count as 0, never as 100)
    stars = int(_num(rep.get("stars"), 0, 3))
    spec = a["spec"]
    # plausibility: the army must be strong enough for what it claims (generous: server has no simulation yet)
    sp = sum(n * unit_power(u, forge_mult(st), unit_level(st, u)) for u, n in sent.items())
    need = float(spec.get("power", 0) or 0)
    if not sent and not cast and (destruction > 0 or stars):                     # (damage claimed with no soldier and no spell: nothing could have done it)
        return "implausible", None
    if destruction > 20 and sp < need * (destruction / 100.0) * 0.18:
        return "implausible", None
    # the defence always bites back (p22, attacks open to everyone): a report that claims damage with (almost) no losses is not believed —
    # the server takes the missing losses itself, spread over what was sent (cheapest units first), never more than was sent. A real battle
    # loses far more than this floor (12 % of the defence's power, scaled by the damage claimed; spells halve it).
    if sent and destruction > 0:
        floor = need * (destruction / 100.0) * (0.06 if cast else 0.12)
        lp = sum(n * unit_power(u, forge_mult(st), unit_level(st, u)) for u, n in lost.items())
        if lp < floor:
            for u in sorted(sent, key=lambda x: unit_power(x, forge_mult(st), unit_level(st, x))):
                p1 = unit_power(u, forge_mult(st), unit_level(st, u))
                room = sent[u] - lost.get(u, 0)
                if room <= 0 or p1 <= 0:
                    continue
                k = min(room, int(round((floor - lp) / p1)))                         # (rounded: a tiny chip attack is not charged a whole unit)
                if k <= 0:
                    break
                if k > 0:
                    lost[u] = lost.get(u, 0) + k
                    lp += k * p1
                if lp >= floor:
                    break
    if stars >= 1 and destruction < 50:
        stars = 0
    if stars >= 3 and destruction < 99.95:      # three stars = the WHOLE map (100 %: every last wall and gate too)
        stars = 2
    loot = clamp_loot(spec, _dict(rep.get("loot")), destruction, stars)
    if spec.get("kind") == "bot":
        pool_take(st, loot, now)
    for k, n in cast.items():
        st["spells"][k] = max(0, int(st["spells"].get(k, 0)) - n)
        if not st["spells"][k]:
            del st["spells"][k]
    for u, n in lost.items():
        st["army"][u] = max(0, int(st["army"].get(u, 0)) - n)
        if not st["army"][u]:
            del st["army"][u]
    for g in GEMS:
        room = max(0, PR.vault_cap(g, max(1, PR.level(st, "vault_" + g))) - int(st["gems"].get(g, 0)))
        loot[g] = min(loot[g], room)
        st["gems"][g] = int(st["gems"].get(g, 0)) + loot[g]
    a["done"] = True
    report = {"t": now, "target": spec.get("name"), "kind": spec.get("kind"), "stars": stars, "destruction": destruction, "loot": loot,
              "lost": lost, "sent": sent, "spells": cast}
    st.setdefault("rep", []).append(report)
    st["rep"] = st["rep"][-20:]
    return "ok", {"report": report, "loot": loot, "stars": stars}


# ------------------------------------------------------------------ reference power (the strength of a full, typical army at castle K)
_PLAN = dict(spear=.07, sword=.07, guard=.05, archer=.08, cavalry=.08, pegasus=.06, baby=.05, dragon=.05, catapult=.05, giant=.05, imp=.04, mage=.05,
             ram=.04, cannon=.05, werewolf=.05, trebuchet=.05, hill=.05, shieldmaiden=.03, lord=.03,
             legionary=.05, captain=.02, ogre=.04, gryphon=.04, lich=.04, treant=.04, gryphonknight=.02, darkrider=.02, baby3=.03, dragon3=.03)     # (p35: the new units of the 30-level roster; the plan is shared with state._start_army)


def ref_power(k: int) -> float:
    """Army power of a full army of a castle-K kingdom whose buildings are all at level K (the same rules the player's army uses).
    It is the defence budget D(K) of a level-K base and maps an army to a fair target level (level_for_power)."""
    lv = {f: (k if PR.STRUCTS[f][3] <= k else 0) for f in FAMILIES}
    forge = 1.0 + 0.06 * max(0, (k if PR.STRUCTS["forge"][3] <= k else 1) - 1)
    cap = army_cap(k)
    open_ = [u for u in _PLAN if lv[UNITS[u]["fam"]] >= UNITS[u]["lv"]]
    tot = sum(_PLAN[u] for u in open_) or 1.0
    army: Dict[str, int] = {}
    used, fu = 0, {}
    for u in open_:
        f, sp = UNITS[u]["fam"], UNITS[u]["space"]
        n = int(cap * _PLAN[u] / tot) // sp
        n = max(0, min(n, (fam_cap(f, lv[f]) - fu.get(f, 0)) // sp, (cap - used) // sp, hero_slots(u, lv[f])))
        if n:
            army[u] = n; used += n * sp; fu[f] = fu.get(f, 0) + n * sp
    for u in ("spear", "archer", "sword"):
        if u in open_:
            f = UNITS[u]["fam"]
            n = min(cap - used, fam_cap(f, lv[f]) - fu.get(f, 0)) // UNITS[u]["space"]
            if n > 0:
                army[u] = army.get(u, 0) + n; used += n; fu[f] = fu.get(f, 0) + n
    return sum(n * unit_power(u, forge, max(1, lv[UNITS[u]["fam"]])) for u, n in army.items())


P_REF[:] = [int(round(ref_power(k))) for k in range(1, PR.MAX_LEVEL + 1)]


def ref_price_per_space(k: int) -> Dict[str, float]:
    """What one space of the reference army of castle K costs in each gem (p35: the economy sim prices the army it loses in a raid with this, so the rules and the sim cannot drift apart)."""
    lv = {f: (k if PR.STRUCTS[f][3] <= k else 0) for f in FAMILIES}
    cap = army_cap(k)
    open_ = [u for u in _PLAN if lv[UNITS[u]["fam"]] >= UNITS[u]["lv"]]
    tot = sum(_PLAN[u] for u in open_) or 1.0
    army: Dict[str, int] = {}
    used, fu = 0, {}
    for u in open_:
        f, sp = UNITS[u]["fam"], UNITS[u]["space"]
        n = int(cap * _PLAN[u] / tot) // sp
        n = max(0, min(n, (fam_cap(f, lv[f]) - fu.get(f, 0)) // sp, (cap - used) // sp, hero_slots(u, lv[f])))
        if n:
            army[u] = n; used += n * sp; fu[f] = fu.get(f, 0) + n * sp
    for u in ("spear", "archer", "sword"):
        if u in open_:
            f = UNITS[u]["fam"]
            n = min(cap - used, fam_cap(f, lv[f]) - fu.get(f, 0)) // UNITS[u]["space"]
            if n > 0:
                army[u] = army.get(u, 0) + n; used += n; fu[f] = fu.get(f, 0) + n
    out = {g: 0.0 for g in PR.GEMS}
    for u, n in army.items():
        for g, c in UNITS[u]["cost"].items():
            out[g] += n * c
    return {g: v / max(1, used) for g, v in out.items()}


if __name__ == "__main__":      # regenerate the client's table:  python -m bluewall.military > bluewall/client/src/unitdefs.json
    import json
    print(json.dumps({**catalog(), "bot_ratio": [0.9, 1.5]}, separators=(",", ":")))
