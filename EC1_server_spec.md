# EC1 — server patch for the mother (17 Oct 2026)

Server `*.py` files and `MAX_LEVEL` are the mother's, so everything below is a DIFF to apply, not an edit made in the shared tree you merge from. Base = the `bluewall/` tree of kit p47 (`base_snapshot`). `MAX_LEVEL` stays 50 (it was already 50); only the tables above level 30 and one price tail change.

## What changes (3 shared files)

| file | change |
|---|---|
| `progress.py` | (1) `T_HOURS[30:50]` = `155.0` × 20 (was +5 h per level, 160 … 255). (2) `COST_K[30:50]` = `0.987` × 20 (was +0.008 per level, 0.995 … 1.147). (3) New constant `RUBY_TAIL = 0.02` after `GEM_K`; `cost()` multiplies the ruby price (only ruby) of every level above `BASE_LEVELS` (30) by `1 + RUBY_TAIL * (level - 30)` (×1.2 at 40, ×1.4 at 50); exactly 1.0 up to level 30. (4) comments/docstring. |
| `client/src/balance.json` | regenerated: `python3 -m bluewall.progress > bluewall/client/src/balance.json`. Only the vault arrays at indices 29–49 change (ruby cap and the others follow the new prices; the cap at level 30 depends on the price of level 31, so 3 values at level 30 change too). Levels 1–29 identical. |
| `sim.py` | docstring only: castle-50 numbers of the four profiles. |

Levels 1–30 of everything else (T, prices, durations, mine rates, vaults 1–29, caps, builders, unlocks) are byte-identical to the tree before the patch (`dev/ec1_frozen30.json`, checked by `ec1_test.py`).

The clients read prices from the catalog / `balance.json`; no client source changes. `RUBY_TAIL` is server-side only (the catalog already carries the final price).

## How to apply

```
cd bluewall
for f in progress.py sim.py client/src/balance.json; do patch -p1 < ../shared/$f.diff; done      # (paths inside the tar: shared/progress.py.diff, shared/sim.py.diff, shared/client/src/balance.json.diff)
python3 -m bluewall.progress | cmp - client/src/balance.json && echo balance.json matches progress.py
```
Applied to a pristine copy of the base, the three files come out byte-identical to the tree the numbers below were measured on. The owned part (`patch_EC1.tar.gz`: `docs/economy_table*`, `dev/ec1_*`, `dev/e1_*`) is copied whole.

## How to verify (all pure Python, no server needed)

The scripts import `bluewall` from `$BW_ROOT` (default `/home/claude/bot/bluebot_v2`; set `BW_ROOT=<folder that contains bluewall/>` on another machine). They live in `workers/dev/` of the kit (`dev/` in the patch).

```
python3 dev/ec1_test.py          # -> EC1 OK  (23 s; add --full for the whole grid)
python3 dev/e1_check.py          # -> E1 OK
python3 dev/ec1_static.py        # static rules (INFO/WARN lines; WARN = content gap 31-50, known)
python3 dev/lv50_snap.py after.json   # compare with a snapshot taken before: levels 1-30 identical except vault level 30
```
Re-run the server tests you have: `econ_test`, `prem_test`, `queue_test`, `social_test`, `gift_test`, `clan_test` pass on this tree. `guard_test` and `hero_cap_test` fail on the base tree too (not EC1).

## What the numbers are (free player 1.5 h/day, mean of visit phases)

castle 10 / 20 / 30 / 40 / 50 on day 152 / 445 / 732 / 1036 / 1321 (old placeholder: 50 on day 1603). Best player (every boost 20 %, gems bought, rush used up): 30 on day 452, 50 on day 891. Royal 20 % without buying gems: 50 on day 1156. Days per castle level: 28.5 (21–30), 29.6 (31–50). To make the tail shorter/longer change the two flat numbers (`T_HOURS`, `COST_K` for 31–50) and re-run `ec1_test.py`: it keeps the free player's day-50 inside 1150–1500 and best/free inside 0.55–0.72.

## Things to know before merging

- `T_HOURS`/`COST_K` above 30 are flat on purpose: a price still grows ×1.13 per level because it is measured in hours of the mine output of the level below; do not "fix" the flat look.
- Odd/even castle levels alternate cheap/dear rounds (≈9 d vs ≈52 d) — the round rule, same as in 1–30.
- Not in this patch: the E1 resource layer (`economy.py`) — the tables it needs are `docs/economy_table.json` (now to castle 50). Gameplay content for castle 31–50 (new unit/defence/hero slots): none exists, `ec1_static` prints it as WARN.
- Nothing here was run on a phone or on the real server; the full `gate_w.sh` and the server gate are yours.
