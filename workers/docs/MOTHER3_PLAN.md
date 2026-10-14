# MOTHER-3 — state and queue (written 14 Oct 2026)
Read with `claude/GIT_FLOW.md`. Owner: Wingless (Persian, short; tokens are his "time").

## خلاصه برای وینگلس
p44 (D1+T1+LD1b+RP1) و p45 (= p44 + P1 محل‌های تولید و آسیاب) هر دو ساخته و روی گیت‌ان (`pkg/p44`, `pkg/p45`)؛ p45 همه‌ی p44 رو داخل خودش داره. هر دو نصب شد (p45 روی سرور). TR2 همین الان می‌تونه شروع کنه (کیت = p45). لشگر بعد از TR2.

## ترتیب کارها
ترتیب کامل همه‌ی چت‌ها و بسته‌ها: **`claude/ORDER.md`** (تصمیم مادر، ۱۴ اکتبر). TR2 الان در جریانه؛ مدل ارتش موازی؛ چت ارتش بعد از TR2-S3 + قبول دسته‌ی ۱ مدل ارتش؛ بعد جنگ، اقتصاد/مردم؛ RPG موازی از TR2-S5؛ آخر QA/انتشار.

## TR2 — حالت (۱۴ اکتبر ۱۵:۳۵)
S0 رسید و از گیت (`inbox/TR2_S0`) خوندم: فقط سند (نقشه‌ی مدل‌ها، کم‌مونده‌ها، baseline، شیت انتخاب)، کد نداره، پس بسته‌ای نیست. Baseline: 203 programs، 506 draw call و 3.46M مثلث در نمای بالا (نرم‌افزاری، نه گوشی)، noRoute 667. طراحی: قطعات تخریب‌پذیر باید با `aB` داخل Batcher/`bakePieces` بشن، نه InstancedMesh. پیشرفت TR2 ≈ 8٪. بعدی: S1b (جهت/مقیاس/اسلیم)، بعد S2 (tiers.js + لودر + متریال مشترک) → اولین پچ برای p46. جواب‌های برگه‌ی S0: پیش‌فرض‌ها + ۷: ۱۳ (کیپ سنگی ۲، گنبد فیروزه‌ای). کم‌مونده‌ها: `claude/TR2_gaps.md` (با ترتیب خرید) برای TR1.


## TR2 — حالت (۱۴ اکتبر ۱۸:۲۵) — S2 ادغام شد
S1b (جهت/اسلیم ۱۱ مدل + ابزار slim_uv درست‌شده) و S2 (`tiers.js`: سقف لول 30 فعلاً/50 وقتی سرور `max_level` 50 بده، ۹ پوسته؛ `tr2lib.js`: لودر + متریال مشترک + bake سازگار با destruct + لود تنبل پوسته‌ها؛ `web/assets/tr2/swap.json`) رسید و با گیت کامل پاس شد: `GATE_W: ALL OK`, noRoute 667، تست جدید `TR2 TIERS OK` (خطش تو gate_w.sh اضافه شد). تو بازی چیزی عوض نمی‌شه (cap 30 = دقیقاً p45). **kit = p45 + S2** (نصب نشده؛ تو بسته‌ی بعدی p46 می‌ره، وینگلس الان نصب نمی‌کنه). تصمیم: تکسچر 512 برای قلعه/خونه/ساختمون/تولیدی/دفاع/تله/پل/آدم/حیوون، 1K فقط کیپ + تالار شهر + بازار، 256 برای طبیعت/چراغ/پراپ (ابزار `workers/tools/tr2_retex.mjs`؛ دلیل: حافظه‌ی GPU، 1K همه‌ی خونه‌ها ≈ 370 MB). ۱۱ مدل gaps1 تو `lib-tripo` (237 مدل). بعدی: S3 (قلعه)، با `TR2_SPLIT.md` برای شکستن S3/S4/S5/S6 به چند چت. سرور لول 50 (E1 تا 50 + `progress.py`) هنوز نیست؛ بعد از S3/S4 و جواب سؤال‌های E1.

## Git state
`kit` = p44 tree + `workers/` (GIT_FLOW, setup_kit.sh, push_result.sh, mother_pull.sh, dev tests, docs, tools) · `lib-tripo` = 226 GLBs + `tools/` · `pkg/p44` · `inbox/_selftest` (leftover; owner may delete in GitHub UI) · `code-p38` (old; delete once old-kit workers are done).

## Packages
| pkg | content | state |
|---|---|---|
| p41–p43 | earlier | installed (p43 per owner) |
| **p44** | D1 death effect · T1 building sheets (`bsheet.js`) · LD1b loader sword · RP1 owner-only hero mode (`opts.owner||opts.rpg`, lazy `web/assets/rpg/*`) · server.py `.js` MIME · gate lines d1/t1/ld1/rp1_server/rp1 files · hero credits | built, `GATE_W: ALL OK` (noRoute 622), sha256 `6a7cb54c…c725a`, INSTALLED (superseded by p45) |
| **p45** | p44 + P1 production lots + mills. `p1_kitext.json` regenerated (`dev/p1_kitext.mjs`, 312 kit pieces) so `p1_test` runs and is in the gate; T1 rule "worksites.js/town_*.js untouched" retired. `GATE_W: ALL OK`, noRoute **667** (limit 700, 33 left), pkgcheck OK, 43 files, sha256 `9344576f…e60b` (branch `pkg/p45`; contains p44 → owner can install p45 directly) | **INSTALLED** 14 Oct 14:29 Tehran (installer screenshot: build bluebot_bluewall_p45, 44 files); committed in `pkg/deployed.sha256`; kit = p45 |
| p46+ | TR2 stages one at a time (S2 tiers/loader → S3 castle → S4 town/world → S5 layout → S6 new building+defence); server parts (lv50 `MAX_LEVEL=50`, layout API) are mother-only | waits for TR2 pushes |

## Queue / decisions
- Army chat comes AFTER TR2 and supersedes M1–M3 / AR1 / U5 / R1 (owner question 1, default yes).
- Repo is public: paid models + code readable. Default: keep until release, then private (owner question 2).
- lv-50 server patch: mother writes it after TR2 (owner question 3).
- LD1 (round 1) rejected; LD1b merged. A3 / L1S / D2 / PPL not started.
- MJ-9: perf of hero mode on a real phone unmeasured (ask owner for `journalctl -u bluebot-wall --since "30 min ago" | grep perf | tail -40` after he tries it).
- MJ-10: reset two leaked Sketchfab tokens, delete old GitHub deploy key, remove `code-p38` when all old-kit workers finished.
- `VO1_VOICE_SCRIPTS.md` (voice scripts, 2.9 MB) received, not used yet (belongs to the voice/hero chats).

## Not proven (p44)
Nothing measured on a phone; hero touch controls never touched by a finger; crown icon not re-shot inside the full game; hero-mode programs on the home map 168 (RP1 report). My own run (`p39_progs.py 30`, Q=high, lv 30, p44 tree, gate off) = 203 programs; not compared against a base run (RP1's own gate-off run at Q=low: 166 = 166). Production lots/mills (P1): programs and draw calls not measured by me; its worker's frames are in photos_P1.

## حالت (۱۴ اکتبر ۲۰:۴۰) — RP1B ادغام شد، p46 ساخته شد
- kit = p45 + TR2-S2 + RP1B (گیت `GATE_W: ALL OK`، noRoute 667؛ `rp1b_test` → `RP1B OK`، خارج از gate_w چون ۱۰ دقیقه طول می‌کشه). سقف تغییر `main.js` در `t1_test` از ۴۰ به ۶۰ خط رفت (۳ هوک RP1B).
- **p46** (S2 + RP1B، ۲۲ فایل، ۱٫۲ مگ) روی `pkg/p46` هش `c182bdb2…494d`؛ منتظر نصب مالک و بعد `mkpkg.sh --commit p46`.
- فریم هدف (≤150 call / ≤400k مثلث) نرسید ← **RP1C** (cull.js: تکه‌تکه‌کردن InstancedMesh، سایه‌ی کوچک، ادغام ساختمان‌های ثابت — فقط حالت قهرمان، بدون دست‌زدن به فایل‌های دنیا) + گوی/آیکون سر هر در.
- مالک: «UI تخمی» ← **UI1** (ظاهر برگه‌ها). «خواهر باید بپره/بشینه/بجنگه» ← **RP0B** (قهرمان‌ها ۲۲ کلیپ دارن؛ نشستن/شمشیر/شنا/بالا رفتن/برداشتن نیست).
- مالک پرسید چرا خونه‌ها و مپ جدید تو بازی نیست: S2 فقط لودره؛ مدل‌ها با S3 (قلعه) و S4 (شهر+مپ) میان. از چت TR2 `TR2_SPLIT.md` خواسته شد تا S4/S6 موازی بشن. RP3 (زیرین) و RP4 (مبارزه) پرامپتشون آماده؛ مالک باید چت‌ها رو باز کنه.
