# guardians (p32 Y1/Y2): unlock levels, slots, the army sheet op, attack roster, bot / player targets, battle settlement
import sys, time, random, os
os.environ.setdefault("BLUEWALL_STATE", "memory")
sys.path.insert(0, "/home/claude/bot/bluebot_v2")
from bluewall import military as MI, progress as PR
def mk(level, army):
    st = {"army": dict(army), "gems": {"ruby": 10**6, "emerald": 10**6, "turq": 10**6, "sap": 0, "onyx": 0}, "lv": {}}
    MI.init(st)
    for k in ("keep", "wall", "towers"):
        st.setdefault("b", {})
    return st
ok = lambda c, m: print(("OK   " if c else "FAIL ") + m) or (c or sys.exit(1))
ok(MI.guardian_slots(12) == {}, "no guardian slot below level 13")
ok(MI.guardian_slots(13) == {"giant": 1}, "L13: giant")
g16 = MI.guardian_slots(16); ok(g16.get("baby") == 1 and g16.get("hill") == 1 and g16.get("giant") == 1, "L16: baby + hill open: %s" % g16)
ok(MI.guardian_slots(18).get("dragon") == 1, "L18: dragon")
g20 = MI.guardian_slots(20); ok(g20 == {"giant": 2, "baby": 2, "hill": 1, "dragon": 1}, "L20 slots %s" % g20)
st = {"army": {"giant": 5, "spear": 10, "dragon": 2}, "guard": {}}
orig = PR.keep_level
try:
    PR.keep_level = lambda s: 20
    why, info = MI.set_guard(st, "giant", 9); ok(why == "ok" and st["guard"] == {"giant": 2}, "set_guard clamps to the slots: %s" % st["guard"])
    why, info = MI.set_guard(st, "dragon", 5); ok(st["guard"] == {"giant": 2, "dragon": 1}, "dragon slot 1")
    ok(MI.set_guard(st, "spear", 1)[0] == "bad", "a spearman is no guardian")
    ok(MI.attack_army(st) == {"giant": 3, "spear": 10, "dragon": 1}, "attack roster = army - guardians: %s" % MI.attack_army(st))
    ok(MI.victim_guard(st) == {"giant": 2, "dragon": 1}, "victim_guard")
    st["army"]["giant"] = 1; ok(MI.victim_guard(st) == {"giant": 1, "dragon": 1} and MI.attack_army(st).get("giant", 0) == 0, "guard never exceeds what he owns")
    MI.set_guard(st, "giant", 0); ok("giant" not in st["guard"], "0 removes the guardian")
    PR.keep_level = lambda s: 12
    ok(MI.set_guard(st, "giant", 1)[0] == "locked", "locked below 13")
finally:
    PR.keep_level = orig
print("GUARD OK")
