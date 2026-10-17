#!/usr/bin/env python3
"""EC1: the numbers of castle levels 1-30 that must never move.   BW_ROOT=<tree> python3 dev/ec1_freeze.py OUT.json   (the shipped file was made from the tree BEFORE the EC1 patch, commit e35e072)."""
import json
import os
import sys

sys.path.insert(0, os.environ.get("BW_ROOT", "/home/claude/bot/bluebot_v2"))
from bluewall import military as MI  # noqa: E402
from bluewall import progress as PR  # noqa: E402

N = 30
o = {"t_hours": [PR.t_hours(n) for n in range(1, N + 1)],
     "cost": {e: [PR.cost(e, n) for n in range(1, N + 1)] for e in PR.ORDER},
     "dur": {e: [PR.dur(e, n) for n in range(1, N + 1)] for e in PR.ORDER},
     "rate": {g: [PR.mine_rate(g, n) for n in range(1, N + 1)] for g in PR.GEMS},
     "vault_1_29": {g: [PR.vault_cap(g, n) for n in range(1, N)] for g in PR.GEMS},
     "max_allowed": {e: [PR.max_allowed(e, k) for k in range(1, N + 1)] for e in PR.ORDER},
     "builders": [PR.builders(k) for k in range(1, N + 1)],
     "army_cap": [MI.army_cap(k) for k in range(1, N + 1)], "speed": [MI.speed(k) for k in range(1, N + 1)], "spell_cap": [MI.spell_cap(k) for k in range(1, N + 1)],
     "guardians": [MI.guardian_slots(k) for k in range(1, N + 1)], "unit_lv": {u: d["lv"] for u, d in MI.UNITS.items()}}
json.dump(o, open(sys.argv[1], "w"), sort_keys=True)
print("froze", sys.argv[1])
