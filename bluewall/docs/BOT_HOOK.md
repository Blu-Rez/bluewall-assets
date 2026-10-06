# BlueBot ⇄ Blue Wall (updated 3 Oct 2026, package p21)

## 0. What is live now: the player's own conversions (store › 🔁 تبدیل › 🏰 Blue Wall)

Done on both sides in p21 (no hook left to write for it):
* Bot: `modules/game/services/bluewall_xfer.py` (+ `handlers/store_bluewall.py`, `handlers/admin_bluewall.py`).  One DB transaction =
  guarded debit (balance never negative) + a `bluewall_transfers` row (created by the service itself); then
  `bluewall.bridge.convert(redis, uid, {gem: amount}, gid="cv:<ref>")`; a failed delivery stays `pending` and is resent (every
  conversion + every 5 min) with the SAME id.
* Blue Wall: `state._drain_inbox` applies a `src="convert"` entry once (recent-ids list + Redis `bluewall:gid:<id>` for 90 days),
  above the vault, clamped to `bridge.CONV_MAX`; the toast says "... — arrived from BlueBot!".
* Rates and prices: Redis `bluewall:cfg` (written by the bot admin, read by Blue Wall's `shop.py` and by `bridge.quote`):
  `conv` {turq/emerald/ruby/sap/onyx: [bot gems in, Blue Wall gems out at castle 1]} — ruby/emerald/turquoise × 1.13 per castle level;
  `boost` (sapphire per day at 5 %), `dmul` (1/7/30-day multipliers), `items` (tesla 1st..4th; onyx).
* Mapping: 🔵 firoozeh → turquoise, 🟢 zomorrod → emerald, 🔴 yaghoot → ruby / 💠 sapphire / 🖤 onyx.

The sections below (game prizes pushed by the bot itself) are still valid and optional.

## 1. Optional: Hokm → Blue Wall prize hook (5 blue gems in Hokm = +50 turquoise in Blue Wall)

The Blue Wall side is finished and tested: `bluewall/bridge.py` puts a gift into the player's inbox,
the server turns it into turquoise (1 blue gem = 10 turquoise), shows it in the gift box and never pays the same `gid` twice.
What is missing is the ONE call on the bot side, at the place where Hokm awards blue gems.  That file is not in the
Blue Wall package, so it has to be added where the award happens (send me that file and I add it, with a test).

## The call (10 lines, put it right after the bot has paid the blue gems to the player in Hokm)

```python
from bluewall.bridge import credit          # the bot already has bluewall/ next to it on the server

async def _bluewall_gift(redis, uid: int, blue: int, match_id: str) -> None:
    # `redis` = the bot's own redis.asyncio client.  Never raises: a gift must not break the game that awards it.
    if blue > 0:
        await credit(redis, uid, blue, src="hokm:%s" % match_id, gid="hokm:%s:%d" % (match_id, uid))
```

* `blue` is the number of blue gems the player just earned (5 → 50 turquoise).
* `gid` must be unique per award (match id + uid).  A repeated call with the same `gid` is ignored by the server — safe to retry.
* The gift is added to the player's turquoise balance at their next visit (above the vault's capacity if needed — nothing is lost) and announced with a toast.
* Manual test from the server shell:  `python3 -m bluewall.bridge --grant <telegram_id> 5` then open Blue Wall;  `--peek <telegram_id>` lists the inbox.

## The two special gems (deep-blue **sapphire** and black **onyx**)

They are never mined and never in the vault: a player gets them only from the shop (later) or as a **prize** from the bot (a Hokm win,
a tournament, an event).  The same bridge carries them — pass `sap=` / `onyx=` (and `blue=0` when it is only a prize):

```python
await credit(redis, uid, 0, src="prize:%s" % event_id, gid="prize:%s:%d" % (event_id, uid), sap=10, onyx=1)
```

* A prize shows up in the Blue Wall toast ("+10 sapphire · +1 onyx — a gift from your games!") and in the two capsules under the player's name.
* The balances are plain integers kept by the server (`prem` in the player's wallet); they can only go up from a prize / purchase.
* Manual test from the server shell:  `python3 -m bluewall.bridge --grant-prem <telegram_id> 10 1`

## Things to know (so the hook is safe)

* **Same Redis.** The bot's `redis` client must point at the same Redis URL **and DB number** that Blue Wall uses (`REDIS_URL` / `REDIS_DB` in `bluewall/state.py`); a gift written to another DB is never seen.
* **Limits per call.** `blue`, `sap` and `onyx` must be ≥ 0 and at least one > 0 (otherwise `credit()` returns `False`). The inbox keeps the newest `KEEP` gifts per player; the server pays at most a sane number of gems per gift (clamped), so a bug on the bot side can't print gems.
* **Game ids.** `gid` (up to 48 characters is stored as written; a longer id is hashed, never cut) is what makes a retry safe — build it from the match id + player id. `src` is only a label (40 characters).
* **Never raises.** `credit()` / `credit_sync()` return `True` when queued and `False` on any error — the game that awards the gems must not care.
