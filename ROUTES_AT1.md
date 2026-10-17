# AT1 server_patch - friendly attack (server half)

A real battle against a FRIEND's real, current base. Nothing is lost and nothing is won, for both sides. Only the attacker's best result against each friend is kept.

## Install (on the kit, repo root)
```
cp server_patch/NEW/friendly.py server_patch/NEW/friendly_defaults.json bluewall/
patch -p1 < server_patch/military.py.diff && patch -p1 < server_patch/state.py.diff && patch -p1 < server_patch/server.py.diff
BLUEWALL_STATE=memory PYTHONPATH=/home/claude/dev/stubcfg python3 workers/dev/at1_test.py      # -> AT1 SERVER OK  (82 checks)
```
The three diffs are small and every changed line carries `# AT1:` (military.py 2, state.py 2, server.py 5). All logic is in `friendly.py`. No state migration; a new record is the attacker's `fb` key.

## Routes
| route | body | answer |
|---|---|---|
| `POST /api/scout` | `{"mode":"friendly","friend":<uid>}` (without `mode` = the old normal scout, unchanged) | like a normal scout (full `view` of the attacker) + `ok`, `mode:"friendly"`, `cap`, `left`, `target`. `target` = `{id, name, emblem, ratio, levels:{keep,wall,towers}, seed, power, loot:{ruby:0,emerald:0,turq:0}, tesla, guard, layout?, mode:"friendly", friend:<uid>}` (the friend's REAL base as it is now; `kind` / `_victim` hidden; zero loot). Failure: `{ok:false, why}`. |
| `POST /api/battle/end` | `{"mode":"friendly","id":<target.id>,"rep":{sent,lost,destruction,stars,loot,spells}}` (same `rep` as a normal fight) | view + `ok`, `mode`, `cap`, `left`, `info:{mode:"friendly", stars, destruction, loot:{0,0,0}, tro:0, best:[stars,percent], improved:bool, report:{...lost:{}}}`. Failure `{ok:false, why}`. |
| `GET /api/friendly` | - | `{ok, enabled, cap, left, best:{"<friend id>":[stars,percent]}}` (for the friend cards) |

Same rate limiting as the neighbours (`_limited`, per uid: `s:` scout, `b:` battle end, `f:` status). 403 `{reason:"locked"}` without a session, like the others.

`why` codes: `not_friend` (not a friend OR blocked in either direction - the same answer on purpose, a block is never revealed), `bad_friend` (missing / non-numeric / yourself), `cap` (daily budget used; `cap`, `left:0` in the answer), `slow` (+ `wait` seconds: the gap between two friendly scouts; the client's `findOpponent` already turns it into the percentage bar), `no_army`, `off` (liveops), `closed` (attacks closed, as for normal fights), `no_target` / `expired` (token unknown / replayed / older than BATTLE_TIMEOUT), `bad_units`, `bad_losses`, `bad_spells`, `implausible`, `unavailable` (state could not be read).

## What a friendly fight does NOT do
No loot, no cups (`tro`), no shield made / used / changed, no soldier or spell lost or used, no entry in the attacker's `rep` list or the defender's `hits` (so no attack row and no red notice for the defender), no XP / mission / pass event, no leaderboard / clan write. The tests compare BOTH players' whole stored state (and the gift inbox) before / after, byte for byte: the only difference is the attacker's `fb`. An upgrade that finishes during the fight is NOT written back (the army is judged on a settled COPY). A mutation test (write the settled copy back) is caught.

`fb` = `{"b": {"<friend id>": [stars, percent, unix time]}, "d": "YYYY-MM-DD" (Tehran), "n": fights finished that day}`; at most 200 friends (oldest result dropped first).

## Settings: liveops section `friendly` (`friendly_defaults.json`)
`{"enabled": true, "daily_cap": 20, "gap_s": 10}` - `daily_cap` 0..1000 fights per Tehran day (resets at Tehran midnight, `Asia/Tehran`), `gap_s` 0..3600 seconds between two friendly scouts of one player. `friendly.validate(d)` is the liveops validator; `friendly.cfg()` registers the section on first use and also honours `liveops.flag("friendly")`. Until OC1 is merged there is no `liveops` module: the defaults are used (hook: `friendly._LIVEOPS`, a 3-line stub is in the test).

## Decisions that differ from a literal reading of ROUND8_COMMON section 4 (please check)
1. **The pending friendly target is NOT stored in `st["atk"]`.** `st["atk"]` also holds the 20 s scout cooldown clock and a pending normal target; writing there would reset the cooldown, throw away a pending normal target and break "state identical before / after". The friendly target lives in `friendly._PEND` (memory, one slot per attacker, valid `BATTLE_TIMEOUT`). A restart only loses a fight in progress: the client scouts again. The `mode` field in the request/answer follows the contract; `settle_battle(..., mode="friendly", pend=...)` is the contract's separate `# AT1:` block in military.py (it forwards to `friendly.settle`).
2. **No "Friend X visited" row for the defender** (the spec allowed at most one neutral row): any row changes the defender's stored state; I chose strict identity. Easy to add later in `friendly.end` if wanted (one append to the defender's state).
3. The request carries the friend as `friend` (not specified by the contract). A new `mode` other than `"friendly"` is read as normal by the server.py diff; CW1 should extend the same two lines (`h_scout`, `h_battle_end`) and the two signatures (`Store.scout`, `Store.battle_end`) with `"war"`.
4. The daily cap is counted when a fight is FINISHED (an abandoned scout costs nothing); the cap is checked at scout (early refusal) and again at the end. The gap is measured between scouts (memory, reset by a restart).
5. No match-up limit for friends: `military.player_target(..., fair=False)` skips the 0.7-1.4 power ratio and castle-gap gates (default `fair=True` = old behaviour for everyone else).

## Until FR1 / OC1 are merged (stubs, in `friendly.py`)
- `friends.are_friends(a, b)` / `friends.is_blocked(a, b)`: when a module `bluewall/friends.py` with these exists it is used (sync OR async, both directions for blocks). Until then a stub: friends = today's invite relation (`frs` of either player), blocked = a `blk` list in either state (nothing writes it yet). Test hook: `friendly._FRIENDS`.
- `liveops`: see above.

## Tests
`workers/dev/at1_test.py` (this folder: `dev/at1_test.py`) -> `AT1 SERVER OK`: isolation (all keys of both players + inbox), target (real and current, zero loot), best-result rules, tampered reports, access (stranger / blocked / self / junk ids / unfriended while fighting / liveops off), replay / wrong id / expired, daily cap on the Tehran-midnight boundary second, gap, adapters (sync + async friends module), bounded best list, and the real aiohttp app (`/api/scout`, `/api/battle/end`, `/api/friendly`, no-token 403, a request without `mode` is still normal). Existing server tests re-run: social, clan, gift, layout_server OK; `guard_test.py` fails `L13: giant` on the untouched kit too (not AT1).
