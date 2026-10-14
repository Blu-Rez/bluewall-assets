# NEXT_PROMPT_P36.md — paste as the FIRST message of the next chat, with the archives of §6 attached
Written 6 Oct 2026 (Tehran) at the end of round p35. p35 delivered the whole 30-level mission (30 levels, ×2, K1 one send, K2 heroes ×3, new units / defences, bigger map, level palette, new pacing). **Everything below is what is still open.** More of his words may be appended in §4 before this file is handed over.

## خلاصه برای وینگلس (فارسی)
1. p35 تحویل شد: ۳۰ لول، ظرفیت منابع ×۲، ارتش ×۲، دفاع دشمن ×۲، سرباز فقط یک بار فرمان می‌گیره (هیرو آزاده، از هر کدوم تا ۳ تا)، ۱۰ نیروی جدید، ۳ دفاع جدید، نقشه بزرگ‌تر، رنگ نقشه بر اساس لول، زمان لول‌ها از نو تنظیم شد.
2. منتظر OK تو هستن: مدل‌ها، نقشه قبل/بعد، رنگ لول‌ها، دکمه‌ها و حلقه‌ها (K1/K2)، عکس نیروها/آیکن‌ها/قدرت‌ها، و انتخاب دُم بعد از لول ۲۰ (کوتاه / متوسط / بلند).
3. قانون‌ها همونه: فقط چیزی که گفتی، قبل از هر چیز ظاهری یک عکس نمونه و منتظر OK، قهرمان‌ها دستی، یک بسته برای کل دور، هر ۱۰٪ «📊 پیشرفت».

---
## 0. You and the owner (same as p35 §0)
Blue Wall (Telegram Mini App castle/siege game inside BlueBot v2; three.js r186 client, esbuild, aiohttp server). Owner **Wingless**: Persian, short messages from a phone, harsh when tired. Persian replies, casual, short, English digits, plain words; never the word «bot/ربات» shown to players. **Post `📊 پیشرفت: N٪` every 10 %.** Every new owner message → append to `docs/bluewall-owner-feedback-oct5.md` (or a new `-oct6.md`) and push to the Project at once. Read first: `docs/p35-progress.md` (what was verified how), `docs/p35-plan.md` (file map), `docs/bluewall-handoff-p35.md` (package, rules, tooling), the owner-feedback doc (his own words, newest last).
Standing rules (unchanged): change only what he names; ONE sample image (real code path) before any visual/UI change and wait for his OK; rules/balance as ONE short Persian table; palette deep/light blue, navy, black, steel (red only for danger; dragons red; health bars teal-green mine / orange enemy; the MAP may change colour); heroes fully manual; never touch tokens/secrets/`.env`/server config; ONE package via `pkg/mkpkg.sh` + ONE install line after `bash dev/instest_bot.sh <pkg> ok`; sim stays pure JS + deterministic; phone stays cool; assets CC0/CC-BY only; final report lists proven / not proven / not done; max 2 browser jobs; never `pkill -f` patterns that match your own shell. S8 scout / S9 squad tools / S10 result card stay OFF in `features.js` until he says OK. The stable's aerie tower stays. If he rejects a card (AskUserQuestion), ask again when he says «دوباره بپرس» — questions on the card, one round, 4 questions max.

## 1. What p35 contains (so p36 does not redo it) — details in `docs/bluewall-handoff-p35.md`
30 levels · ×2 vault / army housing / enemy garrison / loot · K1 one send (`battlesim.send`, `ringctl.js`, `squadring.js`) · K2 heroes ≤ 3 each (`military.hero_slots`, `armyui.js`, `bhud.js`) · hero ladder captain 7 / shieldmaiden 15 / lord 20 / gryphon knight 25 / dark rider 28 · 10 new units (legionary, captain, ogre, gryphon, lich, treant, gryphonknight, darkrider, baby3, dragon3) with models, portraits, emblems, power art · frost spire 18 / flame tower 22 / dragonbane ballista 23 · bigger map (96 house blocks) · `theme.js` palette (bands 1 / 6 / 12 / 18 / 24 / 30) · tiers wood 1 / stone 6 / iron 12 / gold 18 / diamond 24 / crystal 30 · pacing: good player castle 5 → day 28, 10 → 152, 20 → 428, 30 → 717; best 20 → 260, 30 → 453 (`dev/s35/days_final.txt`).

## 2. Waiting for his answer (do NOT redo, do NOT ask again in a long list — ONE short question per item, only if he is silent)
| # | item | state |
|---|---|---|
| 1 | model sheet (lich, treant, 3-head dragons, …) | sent, no answer |
| 2 | map before / after (P4) | sent, no answer |
| 3 | palette sheet levels 1 / 10 / 20 / 30 (P9) | sent, no answer |
| 4 | K1 / K2 UI sample (one ring + one power button per hero type, badge ×n, sent-squad thin ring) | sent, no answer |
| 5 | art sheet (portraits, emblems, powers of the new units) | sent, no answer |
| 6 | tail above level 20: short / medium / long (now ≈ medium ≈ 29 days per castle level) | no answer |
| 7 | roster table + hero ladder table | sent, no answer |
If he says «آشغال» to any sample: ONE question, no blind iteration.

## 3. NOT finished / not proven in p35
1. **Real-phone performance** at ×2 army, bigger map, 96 house blocks, 3-head dragons, 3 new defences: only headless numbers exist (node sim step up to 4.7 ms at L30 archers vs 2.7 in p34; +8 % draw calls for the map). Measure on a phone if he gives a recording / overlay screenshot (phone model + graphics quality + cool mode); otherwise tell him plainly it is unmeasured.
2. **Pacing residuals**: castle levels 4 / 6 / 8 are 20–25 % over his list, 3 / 7 / 9 slightly under (period-2 sawtooth from the round rule + «nothing higher than castle + 2» + 3 builders at castle 7; the pairs average to his list); best-vs-good at levels 2–10 is −45…−52 % (he asked −30…−40 %) because the rush allowance is large against short early builds. Fix idea: smooth the round rule for levels ≤ 10 or add a per-level rush cap; re-run `dev/fit5.py` (`START=baked`).
3. **Balance**: `noRoute` events 5 in 30 battles (p34: 1) — archers sent across the whole bigger map retry after 2 s; look at `nav` for the new map. `w_frost / w_flame / w_dragonbane` not tuned individually. L30 ratio 1.5 very hard; siege / archers dominant as in p34. Old gaps from p34 §3 (siege 3★ with little loss, archers on the artillery base, air on the AA base) are not re-checked individually.
4. **Visual checks never done in the real game**: houses take their colour at game start from the level hint (sign-in answer > localStorage > 30) — a level change during play recolours light / ground / water but not the houses; level 1–5 look of the new map on a phone; 3-head dragon wing animation under load.
5. Old p34 open items still open: N6 colour jump (needs his recording), flames on a burning building, guardian dragon readability, an unmanned site visual, hero button after sending in portrait AND landscape, safe-area values.
6. S8 / S9 / S10 built, still OFF.

## 4. Things he adds later (append his words here before handing over)
(empty at the time of writing)

## 6. Files the owner must give the next chat
| # | file | note |
|---|---|---|
| 1 | this prompt (`next-prompt-p36.md`) | paste as the first message, or attach it |
| 2 | **`bluewall_handoff_p35.tar.xz`** | code after p35, tools, docs, the p35 package folder; replaces `bluewall_handoff_p34.tar.xz` |
| 3 | `bluewall_assets_p22.tar.xz` | the old 3D/texture/audio assets (unchanged; newer assets are in `overlay/`) |
| 4 | the words «۳۵ نصب شد» (or «نصب نشد» + the error text) | so p35 is committed (`mkpkg.sh --commit bluebot_bluewall_p35`) or debugged first |
| 5 | his answers to §2 (any of them) | each OK unlocks nothing new to build — a «no» is the work of p36 |
| 6 | for item 3.1 / 3.5, if he has it: a screen recording 10–20 s + phone model + graphics quality + cool mode on/off | |
Setup in a fresh workspace: `cd /home/claude && tar xJf bluewall_handoff_p35.tar.xz && tar xJf bluewall_assets_p22.tar.xz && bash bluewall_handoff/setup.sh`.
