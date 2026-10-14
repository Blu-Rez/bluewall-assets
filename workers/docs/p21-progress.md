# Blue Wall — package p21 (3 Oct 2026, afternoon) — economy v6, boosts, shop, Tesla, Dragonling, unit levels, BlueBot ⇄ Blue Wall conversions

Install (Blue Wall + bot in ONE package, ~1 MB):  `cd /root && tar xzf bluebot_bluewall_p21.tar.gz && bash bluebot_bluewall_p21/install.sh`
(steps: verify → backup → copy → python check (Blue Wall + bot import check) → restart bluebot-wall + prove new build → restart every running `bluebot*` unit except bluebot-wall). Rollback: `bash /root/bluebot_bluewall_p21/rollback.sh` (restores both, restarts both).
After the owner confirms: `bash /home/claude/pkg/mkpkg.sh --commit bluebot_bluewall_p21` (note: deployed.sha256 tracks only `bluewall/`; the bot files of p21 are listed in `bluebot_bluewall_p21/BOT_FILES`). p21 contains p20 (the «+» removal) — if p20 was never installed, p21 covers it.

Owner messages of 13:22 / 13:26 / 13:30 / 13:37 → `bluewall-owner-feedback-oct3.md` (appended).

## 1. Economy v6 (server: progress.py, military.py, boost.py, shop.py; sim.py)
- **Targets (owner):** good play 3 h/day → castle 20 in ~16 months; best case (all boosts 20 %, gems bought, daily rush used) ~8 months, never faster.
- **Simulated with the real rules** (`python -m bluewall.sim`, profiles free/boost/best/idle): free **16.1 months**, boosts-only 13.3, best **8.1**, idle (2 visits/day) 21.3. Castle 10 ≈ day 37, castle 15 ≈ day 181 (free).
- Constants: `T20_H=320, T_EXP=2.55` (L20 ≈ 13 days, castle 20 days), `GEM_K = emerald .985 / ruby .885 / turq 1.97`.
- **Round rule:** the castle may go to L only when every unlocked structure is ≥ L−1 (finished levels only) — reason `round` + list.
- **Rush allowance:** at most `RUSH_DAY_H=4` h of building rushed per day, saved up 2 days (`rsh`); partial rush ("Rush −4h"), `rush_limit`; the last 3 min stay free (no allowance). A partial cut is never free (inspector F1).
- **Boosts** (`st.bst`, boost.py): build / army / mine (royal = all three) × 5/10/15/20 % × 1/7/30 days, paid in **sapphire**. Exact timestamp math: build = re-timed remaining work (`rebase_build`, `end_for`), army = lane pieces re-scaled at purchase and exactly at expiry, mine = banked output (`mb`) + boosted seconds. Same % extends; higher % takes over (old time valued at the 30-day rate → ×0.6 by default); weaker refused (`stronger`).
- Mines now via `PR.mine_ready/mine_take/mine_view` (view sends the boosted rate and a matching `last` → client unchanged).
- Cancel refund no longer capped by the vault. Training/brew rush never free while something is queued (chunking exploit, F5).

## 2. Shop (shop.py + client shopui.js) — "nice and clean"
- Tabs **Boosts · Defense · Army · Gems**. Two-tap confirm ("Sure?") for every premium purchase. 320 px safe.
- **Gems tab (English):** "Get gems in BlueBot: Open BlueBot › Games › Store · buy or win · Convert › Blue Wall" + **Open BlueBot** button (t.me/Blue_Hearts_Bot) + live rate table for the player's castle level.
- Prices = owner's (`bluewall:cfg` in Redis, written by the bot admin): defaults boost/day@5 %: build 5, army 4, mine 5, royal 12; ×p/5; 7 d = ×5, 30 d = ×18; Tesla 10/15 onyx; Dragonling egg 8 onyx.
- POST `/api/shop/buy` {id: boost|tesla|egg_dragonling, kind, p, d}; the state view carries `bst`, `own`, `shop` (catalog).

## 3. BlueBot ⇄ Blue Wall conversions (owner's final model: one-way, from the bot store's «تبدیل»)
- Bot store › 🔁 تبدیل › **🏰 Blue Wall** (button only for users `bluewall.access` lets in): 🔵→💎 turquoise, 🟢→💚 emerald, 🔴→❤️ ruby, 🔴→💠 sapphire, 🔴→🖤 onyx. Amount → exact quote (castle level) → ✅ → done.
- Default rates at castle 1: 1 🔵 → 10 turquoise (= 1 hour of the turquoise mine; the owner's "×10"), 1 🟢 → 400 emerald, 1 🔴 → 1500 ruby (value-consistent with the bot's own 10🔵=1🟢, 5🟢=1🔴), 1 🔴 → 10 sapphire, 2 🔴 → 1 onyx. Mined colours × 1.13 per castle level (×10.2 at castle 20) so the help stays the same size.
- Safety: one DB transaction = guarded debit + `bluewall_transfers` ledger row (self-created table); delivery `cv:<ref>`; pending rows resent (each conversion + every 5 min, scheduler loop in `modules/game/__init__.py`); Blue Wall applies an id once (recent list + Redis `bluewall:gid:<id>` 90 d, marked after the save); confirm claim = Redis SET NX across workers inside the MySQL GET_LOCK; one conversion capped at `bridge.CONV_MAX` (quote says the max). `services/level.py` now locks the balance rows (`with_for_update`) — it wrote absolute balances and could undo a concurrent debit (pre-existing race, F4).
- **Admin:** مدیریت استور › «🏰 Blue Wall»: edit the 5 conversion rates, 4 boost prices, 7/30-day multipliers, Tesla 1st/2nd, egg; preview → ✅ → audit row; Blue Wall reads within 30 s.
- Tests: `dev/bot_xfer_test.py` (SQLite + fakeredis: quote, debit, ledger, Redis down → pending → resend once, Blue Wall applies once, 30 parallel confirms on a balance for 25, admin limits) — in the gate.

## 4. Levels 1–20 for soldiers too (owner 13:30) — unitlook.js, battlesim.js, military.py
- A unit's level = level of its building (barracks / training / stable / lair / workshop). +3.5 % hp & damage per level (plus the forge).
- Tiers 1/4/8/12/16/20 (like the buildings): cloth colour (linen → kingdom blue → navy → royal → ice → crystal), gear tint/glow, kit (recruits bare-headed; stone: helmet (+shield for spearmen); gold: crested helm), size +2.5 %/tier; creatures get a sheen from gold on.
- Perks: iron **Armor** (−10 % damage), gold **Swift** (+10 % speed), diamond **Fury** (+15 % damage), crystal **Last Stand** (survives one deadly blow at 25 %).
- Army panel: level badge on each card, info sheet "Level N · Tier" + perk list; home camp uses the same kit (built with the barracks tier; colours follow live).
- `P_REF` is now computed from the rules (`ref_power`). Without `lv` (older server) battles are identical to before (gate battle output byte-identical).

## 5. Royal items
- **Tesla Coil** (tesla.js, procedural: stone collar, copper coil, crystal orb, halo, idle arcs; ~5 draw calls each): up to 2, on the flat weapon towers nearest the main gate (the coil replaces that tower's ballista/cannon; hides when the tower falls). Battle: chain lightning 3 targets (100/60/36 %), ground + air, weight 2.0 of the defence budget. Made-up bases get coils sometimes (L≥9 / L≥15); a player's own coils raise his defence +8 % each.
- **Dragonling** (Quaternius "Dragon Evolved", CC0, `web/assets/dragonling.glb`): small, **green**, green fire; unlocked by its egg (8 onyx), trained in the Lair; space 6, hp 660, dps 44, rng 15. Portrait added.
- Fire colours: big dragon **blue**, baby dragon **red**, dragonling **green** (bfx `STREAM`).

## 6. Camera zoom (owner: limit only if it helps)
Measured (swiftshader, high): default view 216 draw calls / 2.12 M tris; zoomed-in (dist 45) 177 / 2.04 M — zooming in is cheaper. Not limited.

## 7. Inspections (3 inspectors, opus): 28 findings → verified; fixed all P1/P2 and most P3
Money/economy: free partial-rush loop (P1), failing shop calls re-pushing invite gifts (P2), conversions above Blue Wall's clamp (P2), level-up absolute-write race (P2), free chunked training rush (P2), gid window 300 (P3), cancel refund under vault (P3), Infinity → 500 (P3), boost prorating abuse (P3), confirm claim per process (P3).
Client: Tesla buried in the roof (P1 → moved to the flat weapon towers), coil floating after collapse, level badge covering "+N", crash on missing unit rows, 320 px overflow, zap end points vs drawn fliers, shop catalog before state, offline egg, default tier without levels, home kit ≠ battle kit, dragonling breath threshold.
Open (P3, by design or later): sim floor with hourly play ≈ 7.7 months; home kit changes on the next app open if the barracks crosses a tier mid-session.

## 8. Next (not done in p21)
- Real-device FPS/heat data from the black box after the owner plays (journalctl … | grep perf).
- More royal defenses (owner said "Tesla and …": frost spire / fire brazier) and maybe more premium units — samples first.
- The cute #12 baby dragon file (`dragon_baby.glb`) was not in the archive; only #13 is used (owner then chose: just that one, small and green).
- Phases 1–3 of next-opus-prompt.md (broad bug hunt, perf, graphics) beyond today's scope; attack-logo choice sheet.
