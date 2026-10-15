# `layout` — the player's own map arrangement (TR2-S5 server spec)

Owner's rule: *the player changes his own map himself.*  The client (`TR2_S5`) lets him move his homes, civic buildings, production lots (sawmill, mills, bakery …) and the six storehouses inside the walled town.  This file is the contract for the server (`TR2_S5_server`, **spec only — the mother writes the server**).
Everything below is checked by files in this package; nothing here needs the game to run:

| file | what |
|---|---|
| `docs/layout_api.md` | this spec |
| `docs/tr2_s5_geom.json` | the map: town wall, citadel, gates, streets, river, streams, market, vaults, the 85 movable things (id, kind, footprint, default place) + a 1 m height grid.  **Data of the map: regenerate it** (below) |
| `docs/tr2_s5_vectors.json` | the test vectors: every rule, valid cases, whole-record cases (`single`, `load`, `reject`) |
| `docs/tr2_s5_ref_rules.py` | a reference port of the rules + the canonical load in plain Python (stdlib only): `python3 docs/tr2_s5_ref_rules.py` → `PORT OK` (all vectors pass).  Copy / adapt it |
| `docs/tr2_s5_fuzz.json` | 2500 random poses with the expected answer (`[id, x, z, ry, "CODE,CODE"]`): `tr2_s5_ref_rules.py` checks them too (`FUZZ OK`) — use it to prove a port |
| `dev/tr2_s5_server_model.js` | the server's logic in JS: `serverModel(geom)` (canonical load from the geometry file only) and `createMockServer(geom)` = GET / POST `/api/layout` incl. 401 / 413 / 429 / `dropped` / `player_target`; the client test (`dev/tr2_layout_test.sh`, section 8) runs the real `layout_sync.js` against it |
| `dev/tr2_s5_vectors.sh` | regenerates `tr2_s5_geom.json` + `tr2_s5_vectors.json` from the game code (`layout_rules.js`) |

## 1. The record

```json
{ "v": 1, "g": "p15w5gkf", "m": { "cottage_03": [-23, 137, 2.99], "store_wood": [-79, -22, 3.142] } }
```
* `m` holds **only what the player moved**: `id → [x, z, ry]` (metres in the game frame, x east / z south, `ry` radians).  A missing id = the default place (the plan the game computes from the map).  `{ "v":1, "m":{} }` = the default town.  A fresh player has **no record** (GET answers `layout: null`).
* ids are the game's own: plan lots (`cottage_00 … cottage_NN`, `tavern_00`, `merchant_05`, `sawmill_00`, `mill_01`, `smokehouse_01` …: `things[].id` in `tr2_s5_geom.json`, 85 of them at the moment) and the storehouses `store_wood store_stone store_iron store_gold store_oil store_food`.
* numbers are stored **rounded**: `x`, `z` to 2 decimals, `ry` to 3 (`js_round(v*100)/100` — JS `Math.round` rounds half **up**, Python's `round` does not: see `js_round`).  **The rules are judged at the rounded numbers.**
* `g` = id of the default plan the overrides were made against (`planId` in the geometry file).  A record with another `g` is **not an error**: the ids decide (an id that no longer exists is dropped).
* size: `len(json.dumps(record, separators=(',',':'))) ≤ 8192` (the biggest possible record, every one of the 85 things moved, is 2.5 KB; the limit is 3× that).  Larger → reject `size`.
* shape: `v == 1`, `m` an object (not an array), every key `^[a-z0-9_]{1,32}$`, every value a list of exactly 3 finite numbers (no strings, no booleans), `|x|,|z| ≤ 5000`, `|ry| ≤ 20`.  Reject reasons (exact strings, the client shows none of them, the tests compare them): `not an object`, `version`, `m`, `size`, `id <id>`, `triple <id>`, `range <id>`.

## 2. Endpoints (same auth as every other call: `Authorization: Bearer <token>`)

### `GET /api/layout`
→ `{ "ok": true, "layout": <record> | null }`.  `layout` is the **effective** record (what the last POST answered).  If its `g` differs from the current `planId`, run the canonical load again before answering (the plan changed after a deploy), and keep the result.

### `POST /api/layout`   body `{ "layout": <record> }`
The client sends it at most every 500 ms after a change (debounced; a final one when the editor closes).  The server:
1. rate limit: at most 5 accepted POSTs in any 5 s per user (the client sends one per ≥ 500 ms while he drags things about) → `429 { "ok": false, "why": "rate" }` (the client keeps the record and retries later);
2. body ≤ 8192 + 256 bytes, else `413 { "ok": false, "why": "size" }`;
3. **canonical load** (§3) of `layout`:
   * shape error → `400 { "ok": false, "why": "<reason from §1>" }` — nothing is stored (the client does not retry);
   * else store the **effective** record, answer `{ "ok": true, "layout": <effective record>, "dropped": [ids] }`.  `dropped` is always present (empty when everything fitted); the client puts the dropped things back where they fit and shows "Some buildings were put back where they fit" when it is not empty.
4. an empty effective record (`m` = `{}`) may be stored as "no layout".

`401` without a token as everywhere else.  Nothing else (no partial updates, no per-item calls: the record is small and always sent whole).

### The attack: the attacker fights the DEFENDER's layout
In `military.player_target(me, victim, …)` add **`"layout": victim.get("layout")`** to the returned spec (the effective record; leave the key out when there is none).  `scout()` already forwards every spec key that does not start with `_` and is not `kind`, so the client receives it as `target.layout` (that is the name the client reads: `battle.js` → `world.layout.enterBattle(target.layout || null)`).
* made-up kingdoms (`bot_target`) have **no** `layout` = the default town.  Do **not** add an empty layout only for players: the client must not learn whether a base is a real player's (`scout()` hides `kind` for the same reason) — send `layout` only when the player really moved something, and for bots, optionally, a layout with a few valid random moves if you want the same look for both.
* the attacker's client re-checks the defender's record with the same rules and drops what does not fit (a stale / tampered record cannot crash the fight); it never writes it back.
* the defender's layout is **not** part of the loot / balance maths: the sim only moves where the town's blocks stand (the destructible blocks are rebuilt from the lots' places; the recorded `basetargets.json` is used for the default town only).

## 3. The canonical load (the ONE algorithm the client and the server both run on a record)
```
effective(rec):
  shape check (§1)                                   -> reject
  for each id in rec.m:  round -> [r2(x), r2(z), r3(ry)];  unknown id -> dropped
  repeat at most 400 times:
      bad = ids in the overrides whose pose breaks a rule (§4) with every OTHER thing at its CURRENT place
            (an overridden thing at its override, any other at its default place)
      if bad is empty: stop
      drop the FIRST id of sorted(bad)  (it goes back to its default place; the rest is judged again)
  effective = the remaining overrides (sorted by id);  dropped = sorted list of everything removed
```
Properties the tests rely on: deterministic (sorted ids), a **clash costs exactly one of the two things** (the one with the smaller id goes back, the other stays: vector "two things on one spot"), a record is judged **as a whole** (a *swap* — two things trading places — is valid although each alone would overlap the other: vector "a swap"), dropping is idempotent (`effective(effective(r)) == effective(r)`, `dropped == []`).
The default layout always passes (every default place is valid; the generator checks it).

## 4. The rules (`check_pose`, one function)
A thing has a **footprint**: a rectangle `{w, d, ox, oz}` in its own frame (x right, z = the door side); its centre is the record's `x, z` moved by `(ox, oz)` turned by `ry`: world = `(x + lx·cos + lz·sin,  z − lx·sin + lz·cos)`.  Footprints are in `things[].fp` (summary in §6; every lot has its own measured size, the file is the truth).  A storehouse has a `core` (the hall's plinth) that the *ground* rules look at, and the full rectangle (hall + steps + heap in front of the door) that the *other things* must keep clear of.
`check_pose(G, thing, pose, others)` returns the **sorted list of broken rules** (empty = valid).  All comparisons are strict as written; `others` = every other movable thing at its CURRENT place.

| code | rule (what is measured) | number | origin |
|---|---|---|---|
| `WALL` | the core's centre and 4 corners are ≥ 6.5 m **inside** the town wall polygon (`sd_poly(town, p) ≤ −6.5`) | `WALL_M = 6.5` | B1 planner `WALL_M` |
| `MOAT` | the core's centre and corners are ≥ `moat.off + moat.half + moatPad` outside the citadel polygon `outer` (`sd_poly(outer, p) ≥ …`); `moatPad` = 4.5, a storehouse 0 | 10 + 4.2 + 4.5 | planner `moatOut` |
| `GATE` | the full footprint's centre is ≥ `14 + half-diagonal` from every gate | `GATE_R = 14` | planner `GATE_R` |
| `MARKET` | the full footprint is ≥ 2 m from the market circle (`rect_circle_gap ≥ 2`) | `MARKET_GAP = 2` | planner |
| `VAULT` | the full footprint is ≥ 3 m from every gem-vault circle | `VAULT_GAP = 3` | planner |
| `OVERLAP` | the full footprint grown by 0.8 m in w and d (0.4 m a side) does not overlap (SAT) another thing's footprint grown the same way; others farther than `½diag + ½diag' + 3` are skipped | `GAP = 0.8` | planner |
| `STREET` | the core's centre + 4 corners + perimeter samples (≤ 3.2 m apart) are ≥ `streetClear` from every street's **edge** (distance to the polyline − `w/2`); `streetClear` = 0.9, a storehouse 0 (its steps may touch a street's edge, its hall may not stand on one) | `STREET_CLEAR = 0.9` | planner |
| `RIVER` | the same samples are ≥ `rc` from the river's **centre line**: 8 m; mill and smokehouse 7.4 m; a storehouse 10 m (`things[].fp.rc` when set, else by kind) | `RC = 8` | planner `rc` |
| `WATER` | **smokehouse only**: the core's centre is ≤ `river.half + 10` m from the river centre line (it works on the water) | `WATER_NEAR = 10` | planner AFFINITY, hard |
| `STREAM` | the same samples are ≥ 3 m from the mountain streams' water edge (distance − `half`) | `STREAM_CLEAR = 3` | planner |
| `DRY` | the ground at the 9 points (4 core corners, 4 edge middles, centre) is ≥ 0.1 m above the water line (`min(h) ≥ 0.1 − hTol`) | `MIN_H = 0.1` | — |
| `SLOPE` | `max(h) − min(h)` over the same 9 points is ≤ 1.0 m (`≤ 1.0 + hTol`) | `MAX_SPREAD = 1.0` | the biggest plan lot spreads 0.49 m |

**Not server rules.**  The generic fill houses (`town.js` scatters them on whatever the plan leaves free; their number depends on the player's quality setting) — a moved lot simply takes their place (the client does not draw the houses under it).  When the client has no Tripo town loaded it applies a client-only `GEN` rule instead; the server never sees it.  Fixed things (walls, gates, gem mines, outer worksites, vaults, defences) are not in `things`: a record that names them is "unknown id" and dropped.

**The ground (`DRY`, `SLOPE`) on the server.**  The game's `height(x, z)` is procedural noise (not portable); the geometry file carries it as a **1 m grid** (`heights`: little-endian int16 centimetres, base64, node (i, j) at `(x0 + i·step, z0 + j·step)`, bilinear between nodes, outside the grid = −9 = "no ground").  Measured over 15 000 random points the grid differs from the game's ground by ≤ 0.07 m at the 99th percentile and ≤ 0.20 m at most away from the river (the river bank is steep: there `RIVER` already forbids the pose).  So the server judges `DRY` / `SLOPE` with **`hTol = 0.25 m` of slack** (`tolerance.hTol`): it **accepts everything the client accepts** and rejects everything that is clearly wet / steep.  (Only the two height rules have slack; every other rule is exact.)  The generator checks "the server model never rejects a pose the client accepts" on 4000 random poses.

## 5. The vectors (`tr2_s5_vectors.json`)
* `single[]`: `{ name, id, kind, pose:[x,z,ry], layout?, expect:{ ok, why:[codes] } }` — may `id` stand at `pose`?  The other things stand at their default places, or — when `layout` is given — at that record's effective places.  `why` is the sorted list; **every code of §4 appears at least once**; poses are already rounded; every vector is robust (the answer does not change for a 1 mm / 0.0005 rad nudge, and the grid ground gives the same answer as the exact one).
* `load[]`: `{ name, record, expect:{ status:"ok", effective:{id:[x,z,ry]}, dropped:[ids] } }` — the canonical load of a whole record (swap, clash, unknown id, rounding, rule break, stale `g` …).
* `reject[]`: `{ name, record, expect:{ status:"reject", why } }` — shape errors.
Total: see `meta` in the file (single + load + reject ≥ 30).  A server port is done when `single`, `load`, `reject` and the fuzz file all pass on **its own** implementation (`python3 docs/tr2_s5_ref_rules.py` does exactly that for the reference port: `PORT OK` + `FUZZ OK`).

## 6. Footprints (generated from `tr2_s5_geom.json`)
| kind | count | footprint w (m) | footprint d (m) | rc | ids |
|---|---|---|---|---|---|
| `cottage` | 15 | 9.2 – 10.8 | 9.0 – 10.7 | — | cottage_00 … cottage_14 |
| `craftsman` | 4 | 9.2 – 10.4 | 10.1 – 10.4 | — | craftsman_00 … craftsman_03 |
| `merchant` | 15 | 8.0 – 9.4 | 11.3 – 13.2 | — | merchant_00 … merchant_14 |
| `noble` | 15 | 12.1 – 14.1 | 12.1 – 14.4 | — | noble_00 … noble_14 |
| `tavern` | 2 | 22.0 | 20.0 | — | tavern_00, tavern_01 |
| `townhall` | 1 | 28.0 | 22.0 | — | townhall_00 |
| `chapel` | 1 | 18.0 | 28.0 | — | chapel_00 |
| `well` | 8 | 6.0 | 6.0 | — | well_00 … well_07 |
| `sawmill` | 2 | 14.0 | 16.0 | — | sawmill_00, sawmill_01 |
| `masonry` | 2 | 13.0 | 15.0 | — | masonry_00, masonry_01 |
| `smelter` | 2 | 13.0 | 14.0 | — | smelter_00, smelter_01 |
| `mint` | 1 | 12.0 | 13.0 | — | mint_00 |
| `refinery` | 1 | 17.0 | 17.0 | — | refinery_00 |
| `mill` | 2 | 10.0 | 12.0 | 7.4 | mill_00, mill_01 |
| `bakery` | 3 | 9.0 | 10.0 | — | bakery_00, bakery_01, bakery_02 |
| `butcher` | 2 | 9.0 | 11.0 | — | butcher_00, butcher_01 |
| `smokehouse` | 2 | 9.0 | 11.0 | 7.4 | smokehouse_00, smokehouse_01 |
| `jeweler` | 1 | 9.0 | 10.0 | — | jeweler_00 |
| `store` | 6 | see below | see below | 10 | store_wood, store_stone, store_iron, store_gold, store_oil, store_food |

Storehouses (`store_*`, 6): full footprint 16.4 × 19 m, centre offset (ox, oz) = (0, 3.4) (the hall + steps + heap), `core` = 15.4 × 11.8 m at offset (0, 0) (the hall's plinth: the ground rules look at the core), `rc` = 10, `streetClear` = 0, `moatPad` = 0.

Map constants: town wall polygon 12 points, citadel (`outer`) 9 points, moat `off` 10 / `half` 4.2, 3 gates, 12 street polylines, river 48 points (`half` 5), 2 mountain streams, market circle r 17.6, 3 vault circles.

## 7. Regenerating the data
`bash dev/tr2_s5_vectors.sh [outdir]` rebuilds both JSON files from the game's code.  **Re-run it whenever the town data changes** — B1 plan (new lots / kinds), GR1 (roads = `streets`, terrain = `heights`), ST1 (stores / vaults = `storeFp`, `vaults`) — then run `python3 docs/tr2_s5_ref_rules.py` again.  `planId` changes when lot ids change; old records are then re-judged on load (§2 GET).

## 8. Things the server owner should know
* The client is the first line (it never sends a pose that fails §4 at the exact ground); the server is the check against tampering and against data that changed (new plan).  An honest client is never rejected: every rule is the same function, and the height slack is on the accepting side.
* A layout is a few hundred bytes of numbers; store it in the player's state (`st["layout"]`) next to `own`, save with the rest.  It needs no migration: a missing key is the default town.
* Moves are free in this round (no cost, no cooldown).  If the owner wants a price or a cooldown later, it goes into POST (the effective record tells which ids changed: compare with the stored one).
* The editor never changes balance numbers: levels, defence budget (`defence_power`), loot are unaffected.  What changes in a fight is *where* the destructible blocks stand.
