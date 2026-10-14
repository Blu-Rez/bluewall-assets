# LV50 — the castle goes to 50 levels (mother, 15 Oct 2026 03:20 Tehran) — server + client tables
Owner (02:27): «why am I not level 50? the map must be level 50».
## What changed (p51)
- `progress.py`: `MAX_LEVEL = 50`, new `BASE_LEVELS = 30` (the design the economy was fitted on). `T_HOURS` / `COST_K` have 50 entries; **levels 31–50 are PLACEHOLDERS** (+5 h per level from 160 h, `COST_K` +0.008 per level) — they continue the 26–30 slope until the owner approves an E1 table.
- `military.py`: `S()` (old 20-level → current levels) and the guardian-slot formula use `BASE_LEVELS`, so every unlock level, defence count and guardian count of levels 1–30 is **unchanged**; levels 31–50 hold the level-30 guardian count. Everything else (army housing, family caps, spell cap, speed, forge, unit level multiplier, P_REF, bot levels) was already a formula of the level and simply extends (army housing 872 at 30 → 1432 at 50).
- Client: `client/src/balance.json` + `unitdefs.json` regenerated (`python -m bluewall.progress > …/balance.json`, `python -m bluewall.military > …/unitdefs.json`): `max_level 50`; every table is the old one plus 20 entries (the vault of level 30 is a bit larger because level 31 now exists). `tiers.js` then uses its 9-tier table (wood → stone → iron → gold → ice → green → red → black → blue diamond) with pure tiers at 1, 7, 13, 19, 26, 32, 38, 44, 50.
- Owner dev tool `/api/dev {max:true}` now sets everything to 50.
## Proof
`dev/lv50_snap.py` dumps every level-dependent number for levels 1–30 (t_hours, cost, dur, rates, vaults, max_allowed, builders, S, guardians, spell/army/family caps, speed, lvl_mult, tier_of, P_REF, level_for_power, hero slots, garrison, defences, both catalogs): before vs after = identical except `max_level` and the level-30 vault size (expected). Levels 31–50: T and every cost monotone, `view()` works at all-max (keep next = max), bots up to 50.
## The placeholder timeline (keep, one builder, no boost) — for the owner to approve or change
| level | hours | days for this level | days since level 30 |
|---|---|---|---|
| 31 | 160 | 10.0 | 10 |
| 35 | 180 | 11.2 | 53 |
| 40 | 205 | 12.8 | 114 |
| 45 | 230 | 14.4 | 183 |
| 50 | 255 | 15.9 | 259 |
Keep alone, levels 2→30 ≈ 200 days, 2→50 ≈ 459 days. Gem cost of keep 50: ruby 2.06 M, emerald 6.1 M, turquoise 0.76 M (mine output at level 50 ≈ 12 k ruby / 16 k emerald / 4 k turq per hour).
Open owner questions: the E1 table (5 questions), how many levels each unit family needs beyond 30, new units for 31–50 (none now), 50 as player/hero level (bible) is separate.
