# p35 plan — current state (rewritten 6 Oct 2026 ~08:30 Tehran; the 5 Oct 21:0x draft is replaced)

## خلاصه برای وینگلس (فارسی)
1. ۳۰ لول، ظرفیت منابع ×۲، ارتش ×۲، دفاع دشمن ×۲، غنیمت ×۲.
2. **سرباز فقط یک بار فرمان می‌گیره**؛ هیرو آزاده و از هر کدوم تا ۳ تا.
3. نیروهای جدید روی ۳۰ لول پخش شدن: لژیونر، سروان (هیرو ضعیف اول بازی)، اوگر، گریفین، لیچ، ترنت، شوالیه‌ی گریفین، سوار تاریک (با اژدهای تاریک)، اژدهای ۳ سر و بیبی ۳ سر.
4. دفاع جدید: برج یخ (۱۸)، برج آتش (۲۲)، بالیستای ضد اژدها (۲۳).
5. زمان ارتقا: روز لول‌ها به عددای خودت نزدیک شد (۲→۳، ۳→۷، ۴→۱۲، ۵→۲۵، ۶→۴۰ …).
6. نقشه بزرگ‌تر + خونه‌ی بیشتر، و رنگ نقشه بر اساس لول (لول ۳۰ = رنگ امروزِ لول ۲۰). هر کدوم یک عکس نمونه فرستاده شده و منتظر OK هستن.

## 0. Decisions in force (his own words: `bluewall-owner-feedback-oct5.md`)
P3 30 levels · P5 vault ×2 / army housing ×2 / enemy defence ×2 · P8 units over 30 levels + new legendaries + an ordinary Roman soldier · P4 bigger map + more houses · P9 colours by level (level 30 = today's level 20) · P6/P7 3-head dragon + baby, bigger and prettier · K1 one send · K2 heroes ≤ 3 each · new defences · dark hero (dark dragon + dark rider) · heroes spread over the game · pacing (castle level → day for a GOOD player): 2→3, 3→7, 4→12, 5→25, 6→40, 7→60, 8→85, 9→115, 10→150; best boost 30–40 % less; best player ≈ 8 months to castle 20 · standing rules of `next-prompt-p35` §0 unchanged (only what he named, ONE sample image before any visual, heroes manual, ONE package, CC0 / CC-BY only, never touch secrets / server config, S8 / S9 / S10 stay OFF, the stable's aerie tower stays).

## 1. Where each item lives (code)
| item | server | client |
|---|---|---|
| 30 levels | `progress.MAX_LEVEL`, `T_HOURS` / `COST_K`, `military.TIER_AT` | `levels.js`, `skin.js` (`to20`), `upgradeui.js`, `econ.js`, `unitdefs.json` |
| ×2 | `vault_cap`, `army_cap`, garrison, loot | `battlesim.js` |
| K1 one send | — | `battlesim.send/focus`, `sim.canSend`, `ringctl.js`, `squadring.js` (sent squad = thin dim ring, no handle) |
| K2 heroes | `military.HEROES / hero_slots / hero_next / held_of` | `armyui.js` (`×n/3`), `bhud.js` (count badge), one ring + one ability orb per hero type |
| new units / defences | `military.UNITS / DEFENCES` | `bunits.js`, `spires.js`, `castle.js`, `world.js`, `bfx.js`, `battle.js` |
| P4 map | — | `layout.js` GROW/PUSH, `roads.js`, `town.js` quota, `basetargets.json` (`gen_targets.py`) |
| P9 colours | `state.touch` → keep level; `server.h_auth` replies `level` | `theme.js`, `tod.js` (`tintP`), `terrain.js` (`uTheme`), `world.js` (`onTheme`), `town.js` (scheme weights), `main.js` (`levelHint`) |

## 2. Status by task (see `p35-progress.md` for the evidence)
Done: M1 (30 levels), M2 (×2), M3 (K1 rules + UI), M4 (K2), server rules of the new units and defences, battle-sim support, P9 palette code, P4 map code, skin / unit tiers on 30 levels.
Waiting for his OK (samples sent): model sheet, map before / after, palette sheet (levels 1 / 10 / 20 / 30), K1 / K2 UI sample, tail choice (short / medium / long), roster / hero tables.
Left: portraits / emblems / ability art of the new units (after the model OK), balance finish + ONE Persian table, gate, package, installer test, handoff, final report.

## 3. Balance method (M6)
- Harness `dev/bs_matrix35.js` (`--ref 1 --ratios --Dk --Dpow 1 --sizeBy cap --lv unknown|same --style plan`), run by `dev/bal35.sh` (TAG, 2 slices), reported by `bal35_report.py`; reference army of castle K = `military._PLAN` (`ref_armies.py` → `dev/ref_armies.json`).
- Parity against p34 (`s35/bm_p34.js`): new L15 ≈ old L10, new L30 ≈ old L20 (the ×2 and the tail make the same fight come later), slightly harder at L30 / ratio 1.5.
- Economy: `dev/sim.py` (`python -m bluewall.sim`): raids cost LOSS 0.6 × army space × the real price of the reference army (`MI.ref_price_per_space`) against the loot; pacing table by `dev/days_table.py` (4 profiles × 30 levels, ensemble of 3 visit phases).
- Pacing fit: `dev/fit5.py` (knots of T and of the cost factor, coordinate descent; env `TK`, `CKN`, `START=baked`, `STATE`, `MONO=1`) → `dev/bake_curve.py` writes `T_HOURS` / `COST_K` of `progress.py` (then `python3 -m bluewall.progress` regenerates `balance.json`). The sim shows a period-2 sawtooth (the round rule + «nothing higher than castle + 2»: a cheap round = only the castle's own time, an expensive one = the rest catches up) — the owner's list is matched by the mean of each pair.

## 4. Risks
1. Phone load at ×2 / bigger map: measured (+8 % draw calls for the map; battle step time within the p34 budget) — to be re-measured on the final tree.
2. Houses take their colour at game start from the level hint (sign-in answer / saved hint); lights, ground and water change live.
3. New defence weights (`w_frost / w_flame / w_dragonbane`) are not individually tuned; the matrix says no collapse at any level.
4. New GLB models need `credits.json` entries (CC0 / CC-BY only).
5. Old saves (`b` ≤ 20): migration covered by `state.py` / gate tests.

## 5. Order from here
owner OKs → build approved art (#15) → balance finish + table (#16) → gate / package / installer test / docs (#17).
