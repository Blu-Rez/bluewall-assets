# NEXT_PROMPT_P35.md — paste as the FIRST message of the next chat, with the archives of §6 attached
Written 5 Oct 2026 (Tehran) at the end of round p34. p34 delivered Block C (ring control) + the small items he OK'd. **Everything below is what he moved to p35** («بقیه چیزا + چیزا دیگه که میگم میرن تو پرامپ برا چت بعد», 19:51). More of his words may be appended in §4 before this file is handed over.

## خلاصه برای وینگلس (فارسی)
1. p34 تحویل شد: سیستم حلقه‌ها، دکمه‌ها پایین، تایم/ستاره وسط، جام `۰/۴۰` طلایی (سه‌تکه)، اسپل‌های کهنه، مربی با سر، رسن شل، پگاسوس فقط از چراگاه/اصطبل حذف.
2. p35 = **۳۰ لول** (منحنی C که خودت انتخاب کردی) + **ظرفیت منابع ×۲، ارتش ×۲، دفاع دشمن ×۲** + **نیروها روی ۳۰ لول** + نقشه بزرگ‌تر + رنگ‌های جدید نقشه + اژدهای ۳ سر و بیبی دراگون ۳ سر.
3. قانون‌ها همونه: فقط چیزی که گفتی، قبل از هر چیز ظاهری یک عکس نمونه و منتظر OK، قهرمان‌ها دستی، یک بسته برای کل دور، هر ۱۰٪ «📊 پیشرفت».

---
## 0. You and the owner (same as p34 §0)
Blue Wall (Telegram Mini App castle/siege game inside BlueBot v2; three.js r186 client, esbuild, aiohttp server). Owner **Wingless**: Persian, short messages from a phone, harsh when tired. Persian replies, casual, short, English digits, plain words; never the word «bot/ربات» shown to players. **Post `📊 پیشرفت: N٪` every 10 %.** Every new owner message → append to `docs/bluewall-owner-feedback-oct5.md` (or a new `-oct6.md`) and push to the Project at once. Read first: `docs/p34-progress.md` (what was verified how), the owner-feedback doc (his own words, newest last), `docs/bluewall-handoff-p33.md` (package, rules, tooling).
Standing rules (unchanged): change only what he names; ONE sample image (real code path) before any visual/UI change and wait for his OK; rules/balance as ONE short Persian table; palette deep/light blue, navy, black, steel (red only for danger; dragons red; health bars teal-green mine / orange enemy; the MAP may change colour); heroes (shieldmaiden, lord) fully manual; never touch tokens/secrets/`.env`/server config; ONE package via `pkg/mkpkg.sh` + ONE install line after `bash dev/instest_bot.sh <pkg> ok`; sim stays pure JS + deterministic; phone stays cool; assets CC0/CC-BY only; final report lists proven / not proven / not done; max 2 browser jobs; never `pkill -f` patterns that match your own shell. If he rejects a card (AskUserQuestion), ask again when he says «دوباره بپرس» — he wants questions on the card, one round, 4 questions max.
Hard-won tooling notes: live game session = `dev/s30/live.py` (jobs in `s30/cmd/*.json`, shots `s30/t/<job>_<step>.png`; relaunch: `bash up.sh` then `setsid nohup bash sem.sh timeout 14000 python3 s30/live.py "http://127.0.0.1:8777/dev.html?q=high&w=clear&h=12&wa=1" 390 844 > s30/live.log 2>&1 & disown`; one step takes 1–2 minutes with software GL; the session can die during a long battle — split jobs). DOM HUD lab: `bash dev/s33/hud.sh OUT W H "query"`. Bare ring lab `dev/s34/rp.sh`, emblem sheet `dev/s34/gl.sh`, head lab `dev/s34/hd.sh`, cup renderer `dev/s34/cup.sh`, spell sheet `dev/s34/sp.sh`, pasture lab `dev/pas_shot.py`.

## 1. What p34 contains (so p35 does not redo it)
Block C: `ringctl.js` (drag a ring = send; hold 0.6 s = all rings; hold 0.8 s on the target = target stays as a ghost; staged squads go when the last target is placed or when their ring is tapped; tap on a ghost cancels), `ringpath.js` (road in the rings' language), `squadicon.js` (faint neon emblem per unit, inside the ring), HUD (`bhud.js`) with NEXT + spells at the floor, hero ability buttons neon with glow (only after the hero was sent), timer + bar + stars centred, cup chip `earned/full` (1★ = ⅓, 2★ = ⅔, 3★ = full: server `social.py WIN_FULL = 40` → 13 / 27 / 40 at ratio 1), gold cup icon (`ui/cup_gold.webp`, rendered by `dev/s34/cup.sh`). Spells: same art, aged/worn look (`spellart.js orbAged`, `SPELL_AGED`). P1: no winged horses in the stable pasture (`army.js`, `pas_life.js PEG_REST = []`); the flock circling the town and the battle unit stay; the aerie tower in `pas_stable.js` (stable level 16) is STILL there — ask him if it must go too. P2: lunge rope = real slack rope. Trainer / peasants now have heads (`peasanthead.js`: the pack's peasant models come without a head). The emblem sheet (21 units) is `dev/s34/gl_G.png`; the p34 progress doc lists which glyphs he had redrawn.
Server: `social.py attacker_delta` thirds; `dev/social_test.py` updated.

## 2. Block P — what he decided (his answers, 5 Oct 19:25–19:48)
| # | decision |
|---|---|
| P3 | max level 20 → **30**; time curve **C «نرم»**: levels 1–10 exactly as today, level n ≥ 11: `t_hours(n) = t_hours(10)·(n−1)/9` (linear). Whole game ≈ 391 days (today 331 = +60). Cumulative days at castle level (3 builders, all structures climb each round): 5 → 0.6 · 10 → 23 · 12 → 43 · 15 → 80 · 18 → 125 · **20 → 160** · 22 → 198 · 24 → 241 · 26 → 287 · 28 → 337 · **30 → 391**. (Option A «دم کوتاه» = 20 levels as today + 21–30 ≈ 6 days each was NOT chosen.) Note: level 20 now arrives at day 160 instead of 331 — tell him plainly in the table. Costs follow time (`cost = K·th·w·mine_rate(to−1)`), so they shrink at 11–20 and the mines (×1.13/level) keep growing to level 30: check `vault_cap`, `P_REF`, rush rules (`RUSH_DAY_H`) and the sim (`bluewall/sim.py`) at 30. |
| P5 | resource **vault capacity ×2** (every level; `progress.vault_cap`), **army housing ×2** (`military.army_cap`: 30 + 14·(L−1) → ×2, level 30 = 872) and the **enemy bases' defence ×2** (garrison `GARRISON_AT`, guardians, defences' counts / budgets). Because `P_REF` (reference army power per castle level) is computed from the rules, check that it follows; keep the defence/attack ratio calibrated (`dev/bs_*.js` harness, `bsw.sh`) |
| P8 | **all units spread over 30 levels** (no new units yet). Proposal (scale `lv' = round(1 + (lv−1)·29/19)`): archer 1 · spear 1 · imp 4 · sword 4 · guard 6 · cavalry 7 · mage 7 · catapult 9 · pegasus 12 · baby 13 · ram 13 · cannon 15 · axerider 16 · werewolf 16 · dragonling 18 · shieldmaiden 18 · trebuchet 18 · giant 19 · lord 21 · hill 24 · dragon 27. Rarity bands follow (Common 1–6, Rare 7–12, Epic 13–18, Legendary 19–24, Mythic 25–30). The 3-head dragons (P6/P7) go in as the last Mythic slots (28–30). Show him ONE short Persian table before building. Spell levels (forge) stay. |
| P1 | done in p34 (stable pasture only) |
| P4 | map a bit bigger + more houses — still needs the ONE top-view before/after sample |
| P9 | new colours for the whole map, level 30 = today's level-20 palette — still needs ONE 4-level sample sheet |
| P6, P7 | main dragon and baby dragon with **3 heads** — still need a model sample (CC0/CC-BY only) |

How to do P3 safely (the survey was not done in p34): grep every hard-coded 20 — server `progress.py MAX_LEVEL`, `military.py` (`GARRISON_AT`, guardians ramp `max(1, 20 − unlock)`, `TIER_AT`, `LVL_STEP`/`min(20, lv)`, `bot_target` `min(20, …)`, `P_REF`, rarity comments), `bridge.py` (`min(20, …)`), `shop.py` (`level_mult`), `state.py` (owner starts at `level 20`), `sim.py`; client `battlesim.js`, `unitdefs.json`, `armyui.js`, `skin.js ENT`, `pas_stable.js SP.tag(...)` (looks up to level 20), `military.js`, `world.js`, level texts («LV 20», «/20»), `econ.js`, tests/dev scripts. Looks for levels 21–30: keep the level-20 «blue crystal» look (tier 5) — a new tier look is NOT asked; say so. Existing player data (`b` ≤ 20) stays valid. `all_max()` for the owner's fresh state becomes 30.
Performance of ×2: army housing 592 at level 20 (872 at 30) and defences ×2 means a lot more bodies in the battle sim and on the phone: measure `battlesim.js` step time headless (node) at the largest case, instanced draw calls and soldier counts in the real game, and tell him the numbers; the guards: spatial grid, LOD, `maxDist`. If it is too heavy, propose a cap (do not silently cut).

## 3. NOT finished in p33/p34 (details: `docs/p33-progress.md`, `docs/p34-progress.md`)
1. Built, switched OFF, waiting for his OK (`features.js`): S8 scout (`threat.js`), S9 squad tools (half/focus; the ring scheme makes the bottom bar they sat on obsolete: «drop a ring on a building = focus» is the idea), S10 result card (`resultinfo.js`). Tell him in the first reply that all three are still off.
2. Balance gaps (numbers in `p33-progress.md` "R3 balance"): siege = 3★ with little loss on 3 of 4 bases, archers on the artillery base 3★, air on the AA base 2★, R7 5/8 3★. The ×2 army/defence change of P5 must be re-calibrated with the harness.
3. N6 colour jump on his phone: needs his recording.
4. R2 look-checks still open: flames on a burning building, guardian dragon readability, phone performance of the new gear, an unmanned site visual.
5. Not run live in p34: «last squad's target placed → all waiting squads go» (mock test only), «spell selected + tap over a ring → casts», the p34 aged spells / gold cup / trainer head inside the real game (checked in labs only), the hero button after sending in portrait AND landscape, phone safe-area values. The live session died in the middle of a battle (job f1, step `mid`): a real battle with the new HUD was not seen.
6. The aerie tower of the stable (level 16 look) still stands — ask whether it goes too.
7. Emblems: all 21 units now have a hand-drawn neon glyph (`squadicon.js` GLYPH; sheet `dev/s34/gl_G.png`, made with `bash dev/s34/gl.sh OUT ""`). He liked the OLD pegasus (single feathered wing + sparkle) — it stays. Unit types added later (3-head dragons) need their own glyph; same style: 4 passes, 100×100 box, hand-drawn.

## 4. Things he adds later (append his words here before handing over)
(empty at the time of writing)

## 6. Files the owner must give the next chat
| # | file | note |
|---|---|---|
| 1 | this prompt (`next-prompt-p35.md`) | paste as the first message, or attach it |
| 2 | **`bluewall_handoff_p34.tar.xz`** | code after p34, tools, docs, the p34 package folder; replaces `bluewall_handoff_p33.tar.xz` |
| 3 | `bluewall_assets_p22.tar.xz` | the old 3D/texture/audio assets (unchanged) |
| 4 | the words «۳۴ نصب شد» (or «نصب نشد» + the error text) | so p34 is committed (`mkpkg.sh --commit bluebot_bluewall_p34`) or debugged first |
| 5 | for N6, if still open: a screen recording 10–20 s + phone model + graphics quality + cool mode on/off | see `docs/p33-progress.md` |
