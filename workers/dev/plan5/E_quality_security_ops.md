# E — کیفیت، امنیت و عملیات (QA · ضدتقلب · سخت‌سازی · استقرار · «ماه‌ها بدون باگ») — پلن v5
> عامل E · ۱۴۰۵/۰۷/۱۰ · فقط‌خواندنی روی کد p15. هر ادعا به فایل/تابع واقعی ارجاع دارد.

## خلاصه
**۵ ریسک اول:**
1. **پاک‌شدن قلعه‌ها**: `state.Store.load` هر خطای parse/migration (`except: pass`) یا timeout ردیس (بدون نسخه در `_mem`) را به `_fresh(uid)` تبدیل می‌کند و caller همان را `save` می‌کند → reset دائمی.
2. **حمله‌ی عمومی = تقلب آزاد**: `military.settle_battle` به `lost`/`loot`/`destruction` کلاینت اعتماد دارد (`lost={}` → ارتش ابدی؛ لوت ربات بی‌سقف هر ۲۰ ث). نبرد هم به کیفیت گرافیک وابسته است (`town.js:102` تعداد خانه low=90…ultra=190 → `world.targets` متفاوت).
3. **نصاب ناامن**: اجرای دوباره‌ی `install.sh` بکاپ را با فایل‌های جدید بازنویسی می‌کند (rollback بی‌اثر)؛ شکست healthz → بدون rollback؛ هیچ dump از Redis قبل از migration؛ healthz ثابت «ok» حتی اگر پروسه‌ی قدیمی هنوز بالاست.
4. **کلاینت بی‌دفاع**: بدون `webglcontextlost`، بدون `window.onerror`، fetch بدون timeout/retry، session ۱۲ساعته بدون تمدید (403 بی‌صدا)، بدون تشخیص نسخه‌ی کهنه؛ `?v=__BUILD__` (timestamp) هر بسته همه‌ی glb ها (~۳۸MB موجود) را باطل می‌کند.
5. **تست‌ها assert ندارند**: `api_test*.py`/`queue_test.py` فقط چاپ می‌کنند؛ مسیر Redis واقعی هرگز تست نشده (ماژول `redis` در dev نصب نیست)؛ `py_compile` روی 3.13 نسخه‌ی پایتون سرور را نمی‌سنجد.
**۵ اقدام اول:** (۱) E6–E8: `gate.sh quick` قبل از بسته‌ی بعدیِ هر عامل · (۲) E1–E3: load/save بدون wipe + dump پیش از نصب + snapshot ساعتی · (۳) E4: نصاب v2 با rollback خودکار و build-id در health · (۴) E13–E16: گزارش خطا/کرش، بازیابی context، لایه‌ی شبکه با rid، نتیجه‌ی نبرد ماندگار · (۵) E18–E20: نقشه‌ی canonical + لاگ استقرار + شبیه‌سازی سرور؛ تا آن موقع `BLUEWALL_ATTACK` بسته و جام/لیگ/لیدربورد عمومی نشود.

## ۱. وضعیت واقعی (چه هست)
- **سرور**: aiohttp تک‌پروسه؛ قفل per-uid `asyncio.Lock` (`Store._lock`)؛ state = JSON در Redis `bluewall:st:<uid>` (DB مشترک با صف ربات، `BLUEBOT_QUEUE_DB`)؛ rate-limit درحافظه `_limited` (۳۰/دقیقه)؛ `client_max_size=64KB`؛ auth: HMAC initData درست (کلید تکراری رد، `auth_date` ≤۲۴h، آینده ≤۳۰۰ث) + session `v1.uid.exp.sig` (۱۲h). `/api/perf` = لاگ WARNING تا ۱۸۰۰ کاراکتر.
- **ضدتقلب فعلی**: sent≤army، lost≤sent، spells≤owned، `clamp_loot` (سهم از spec)، stars از destruction، token یک‌بارمصرف (`a.done`)، timeout ۲۰ دقیقه از *scout*، plausibility ضعیف (`sp ≥ need·destr·0.18`). حمله فقط مالک (`attack_allowed`).
- **کلاینت**: `perf.js` فقط فریم‌های >۳۵۰ms و longtask؛ hello یک‌بار؛ ارسال هر ۴۵ث. `econ.js` ثابت‌های اقتصاد را کپی کرده (BASE/VAULT/CAP_H). sim قطعی است (`mulberry(seed)`، `TICK=1/30` با accumulator، هیچ `Math.random` در `battlesim.js`/`nav.js`).
- **تست/ابزار**: `bs_wall.js` (عبور از دیوار، ۱۰۰٪، ستاره) · `nav_test*.js` · `dsess.py`/`btest.py`/`e2e_*.py` (playwright+swiftshader) · `perf.py` (ms/frame، calls، tris) · `leak.py` · `api_test*.py` · stub config در scratchpad. هیچ‌کدام exit-code/assert ندارند.
- **استقرار**: `mkpkg.sh` (delta با `deployed.sha256`، build در هر بار) → `install.sh` (backup فایل‌ها، `cp -r`، `py_compile`، restart، healthz، state=403) + `rollback.sh`.

## ۲. مشکلات مشخص
**الف) داده/سرور**
- A1 `Store.load`: parse/migration exception → `_fresh` (و `get/touch/collect` آن را ذخیره می‌کنند) = wipe. read-timeout بدون `_mem` → همان.
- A2 `Store.save`: خطای نوشتن → `_mem`؛ `load` بعدی از Redis می‌خواند (کهنه) → نوشتن گمشده + **collect دوباره** (timestamp قدیمی).
- A3 `_lock`: وقتی >۵۰۰۰ قفل `clear()` می‌شود حتی اگر قفلی در دست باشد → دو txn هم‌زمان یک uid → خرج دوباره.
- A4 بدون `v`/`rev` در state؛ migration ضمنی با `setdefault`؛ fixture قدیمی ثابت نداریم؛ سازگاری N-1 (rollback) تست نمی‌شود.
- A5 `battle_end`: اعتبار مهاجم و کسر از قربانی دو write جدا (crash بین‌شان = تورم)؛ دو مهاجم هم‌زمان یک قربانی را غارت می‌کنند (قفل «زیر حمله» نیست).
- A6 `lane_remove`/`brew_cancel` بازپرداخت کامل بدون سقف خزانه → جم > vault و «بانک‌کردن در صف» از دست غارتگر.
- A7 ورودی: `int("x")`/`rep.sent` لیست → 500؛ `destruction=NaN` → `min(100,nan)=100`؛ `h_dev` `int(n)`.
- A8 `_candidates`: SCAN روی DB مشترک ربات + load کامل تا ۱۸۰ state در هر scout؛ با رشد کلیدهای ربات کند می‌شود.
- A9 Redis بدون بکاپ از طرف ما؛ persistence/`maxmemory-policy` سرور نامعلوم (اگر `allkeys-lru` باشد state بازیکن evict می‌شود).
- A10 نام‌ها: `touch` فقط `[:24]`؛ کاراکترهای کنترل/bidi (U+202E) پاک نمی‌شوند (کلاینت `esc()` دارد، XSS نیست؛ جعل نمایشی هست).
**ب) ضدتقلب**
- B1 `lost`/`loot`/`destruction` خودگزارشی؛ بدون مدت نبرد؛ بدون سقف روزانه‌ی لوت ربات (تورم خالص).
- B2 targets وابسته به `Q.level` + `nav` از `world.fastHeight` (نه `L.height`) → نتیجه‌ی یک لاگ روی دو گوشی فرق می‌کند؛ مانع re-sim سرور و ناعادلانه.
- B3 `/battle/end` idempotent نیست: retry بعد از قطعی → `no_target` و کارت «ثبت نشد» درحالی‌که ثبت شده.
- B4 NEXT/scout بعد از شروع نبرد در سرور منع نشده (`scout` atk را جایگزین می‌کند) — خواسته‌ی مالک «NEXT بعد از شروع پنهان» فقط در UI است (`scoutNext`).
- B5 رفرال (۱۰۰۰ فیروزه) هنوز طراحی ضد-alt ندارد؛ هر نوشتن خارج از `bluebot-wall` روی `bluewall:st:*` = race.
**ج) کلاینت**
- C1 `main.js`: هیچ `webglcontextlost` → صفحه‌ی سیاه ابدی (اندروید در پس‌زمینه/کم‌حافظه).
- C2 خطاهای JS گزارش نمی‌شوند؛ اگر WebView کشته شود (ANR) جعبه‌ی سیاه در حافظه می‌میرد (فقط با `hide` ارسال می‌شود).
- C3 `econ.js`: fetch بدون timeout → overlay جستجو/درصد گیر می‌کند؛ 403 بعد از ۱۲h بی‌صدا نادیده (`_apply` فقط `ok`)؛ 429 نادیده؛ دوبار تپ «train» = دو batch.
- C4 بعد از هر بسته کلاینت‌های باز با bundle قدیمی به API جدید وصل‌اند؛ هیچ build-id مقایسه نمی‌شود.
- C5 کش: `build.sh` timestamp → wall.js همیشه «تغییرکرده» و `?v=` همه‌ی glb ها عوض می‌شود؛ audio بدون نسخه (کهنه تا ۲۴h).
- C6 لودر: پیام‌ها فارسی و شامل «ربات» (`index.html:257,268`) — خلاف قانون «بدون BOT/ربات» و «English only»؛ خطای اجرای bundle به‌اشتباه «اتصال برقرار نشد».
**د) استقرار/عملیات**
- D1 `install.sh`: backup بر اساس نام بسته → اجرای دوم backup را با فایل جدید پر می‌کند؛ `set -e` روی restart → خروج بدون rollback؛ healthz «ok» ثابت و build را نمی‌سنجد؛ کپی غیراتمیک؛ SHA فایل‌های بسته چک نمی‌شود (آپلود ناقص از گوشی)؛ rollback بدون health و بدون ترتیب پشته (rollback p15 روی p16 = حالت مخلوط).
- D2 `_backups/` و پوشه‌های استخراج‌شده در `/root` هرگز پاک نمی‌شوند (هر بسته چند MB).
- D3 لاگ: perf با WARNING؛ فیلتر redaction نیست؛ هیچ هشدار/مانیتور؛ مالک فقط گوشی دارد و journalctl نمی‌بیند.
- D4 نسخه‌ی پایتون/node سرور، Restart policy systemd، persistence ردیس: نامعلوم.

## ۳. پلن کار
قالب: **ID — عنوان** · اولویت · ساعت · وابستگی ┃ چرا ┃ چطور ┃ تست ┃ ریسک

**E1 — load/save بدون پاک‌شدن** · P0 · 2 · — ┃ «ماه‌ها بدون باگ»؛ بدترین باگ ممکن ┃ `state.py`: `_fresh` فقط وقتی `GET` موفق و `None`؛ parse/migration error → raw به `bluewall:bad:<uid>:<ts>` (TTL 30d) + `log.error` + `StateError` → middleware پاسخ 503 `{reason:'busy'}`؛ read/write fail → 503 (حذف fallback `_mem` در prod؛ `_mem` فقط وقتی ماژول redis نیست). `_lock`: `WeakValueDictionary` به‌جای `clear()` ┃ unit با FakeRedis (timeout/JSON خراب/exception در `MI.init`): کلید بایت‌به‌بایت دست‌نخورده، 503؛ ۵۰ txn هم‌زمان روی ۶۰۰۰ uid بدون خرج دوباره ┃ 503 بیشتر در قطعی ردیس (بهتر از wipe)

**E2 — نسخه‌ی state و migrationهای صریح** · P0 · 3 · E1 ┃ مهاجرت امن طی ماه‌ها ┃ `st.v` + `MIGRATIONS=[(2,fn),…]` ترتیبی؛ `st.rev` با Lua compare-and-set (ضد نویسنده‌ی دوم)؛ fixtureهای منجمد `dev/qa/fixtures/states/`: v1(level)، v2(b/q)، tq-dict، sq-dict، pre-spells، p15 ┃ همه load+view بی‌خطا، invariantها (E6)؛ **N-1**: کد پایتون بسته‌ی قبلی fixture جدید را بی‌exception می‌خواند ┃ Lua روی Redis قدیمی (EVAL از 2.6 هست)

**E3 — بکاپ ردیس** · P0 · 3 · E1 ┃ ریکاوری از هر اشتباه ┃ `bluewall/ops.py`: `dump` (SCAN `bluewall:*` → `jsonl.gz`، فقط تعداد چاپ) در نصب قبل از restart (شکست = توقف نصب)؛ task ساعتی در سرور → `/root/bluebot_v2/_data/bluewall/snap/` (۴۸ ساعتی + ۱۴ روزانه، سقف 200MB)؛ `restore --uid N|--all --dry-run` ┃ dump→flush ردیس تست→restore = هش یکسان؛ snapshot با ۱۰k کلید < 3ث و event-loop block < 50ms (chunked) ┃ دیسک؛ با سقف کنترل

**E4 — نصاب v2 (قالب mkpkg)** · P0 · 3 · E3,E5 ┃ قانون «یک دستور + rollback» واقعاً امن ┃ `SHA256SUMS` داخل بسته و چک قبل از هرچیز؛ preflight (دیسک ≥۳×، `bash -n`)؛ backup فقط اگر `$BK/.done` نیست؛ staging `$APP/.stg_<pkg>` و `mv` اتمیک per-file؛ `import bluewall.server` در subprocess؛ `trap ERR` → rollback+restart+health؛ deep health باید `build` = build بسته باشد (اثبات پروسه‌ی جدید)؛ `_backups/STACK` (rollback فقط بالای پشته، وگرنه `--force`)؛ نگه‌داری ۸ بکاپ آخر + حذف پوشه‌های استخراج قدیمی؛ `install.log` redacted؛ خروجی ۳ خط ✅/❌ ┃ G14: ۸ سناریو در sandbox با shim (`systemctl`,`curl`): نصب، نصب دوباره، rollback بایت‌به‌بایت، py خراب، health خراب، دیسک پر، tar ناقص، rollback خارج از ترتیب ┃ تغییر قالبی که روی هر بسته اثر دارد → فقط بعد از G14 سبز

**E5 — middleware خطا + deep health** · P0 · 1 · — ┃ هر 500 قابل ردیابی ┃ middleware: exception → `log.exception` با `ref` ۸ hex → JSON `{ok:false,reason:'server',ref}`؛ `/healthz?deep=1` (فقط 127.0.0.1): `{build, py, redis:{ok,ms}, uptime, err5m, last_snap}`؛ `build.json` کنار wall.js ┃ API suite: route خطای عمدی (dev) → 500 JSON با ref؛ فیلدهای deep ┃ —

**E6 — unit tests (stdlib unittest)** · P0 · 4 · — ┃ تور ایمنی قوانین ┃ `dev/qa/unit/`: progress (settle ترتیبی با رزرو، refund ها، speedup)، military (lane settle/cancel/speedup؛ خاصیت: `max_train=n>0 ⇒ can_train(n)=ok ∧ can_train(n+1)≠ok`؛ همین برای spells)، `clamp_loot` حدود، `settle_battle` (sent>owned، lost>sent، NaN/Inf، نوع غلط، replay، expired)، fuzz ۵k عملیات تصادفی seed‌دار با invariant: جم int≥0 و ≤vault، space≤cap، لول 0..20، builders؛ `sim.simulate(4 checks)` روز در [300,420] ┃ ≥60 تست سبز < 30ث ┃ —

**E7 — API contract + fuzz** · P0 · 3 · E5 ┃ هیچ 5xx از ورودی کاربر ┃ `dev/qa/api_suite.py`: سرور محلی با stub config دوبار (memory + `redis-server --port 6390`، `pip install redis` در venv dev)؛ auth (درست/hash غلط/کلید تکراری/expired/future/8193B/locked)؛ token (expired/tampered)؛ همه‌ی endpointها با نوع غلط/NaN/منفی/۶۴KB → 4xx؛ 31مین درخواست → 429؛ rid تکراری → همان پاسخ؛ ۲۰ collect موازی → مجموع درست؛ لاگ سرور: صفر Traceback و صفر الگوی توکن ┃ 0 شکست، 0 5xx ┃ —

**E8 — gate.sh + اتصال به mkpkg** · P0 · 3 · E6,E7 ┃ هیچ بسته‌ی شکسته‌ای نرود ┃ مشخصات §۴؛ `mkpkg.sh` قبل از tar `gate.sh quick` (و `full` اگر `client/src` تغییر کرد) و `GATE.txt` محلی؛ `--force` فقط با دلیل در یادداشت بسته ┃ یک باگ عمدی در هر گروه → gate قرمز ┃ کندی؛ quick < 3 دقیقه

**E9 — گلدن شبیه‌ساز + قطعیت** · P1 · 2 · E8 ┃ «۱۰۰٪ = کل نقشه»، صفر عبور از دیوار، ماندگار ┃ `dev/qa/sim_golden.mjs` روی `play()` از `bs_wall.js` با seedهای ثابت → `golden/sim.json`؛ دوبار اجرای یک seed → هش نتیجه + موقعیت واحدها در t=60 یکسان ┃ G7 ┃ تغییر عمدی بالانس → `--accept` با یادداشت

**E10 — رگرسیون تصویری** · P1 · 5 · E8 + هوک کلاینت ┃ «هر تغییر بصری با اسکرین‌شات» خودکار ┃ هوک dev `?freeze=1&seed=7` (ساعت/هوا ثابت، Math.random بصری seed‌دار، ابر/آب در t=10 متوقف، fps/clock پنهان) — توسط integrator؛ `dev/qa/vis.py` روی dsess: home روز(h=12)/شب(h=22)، army UI، upgrade sheet، search overlay، battle pre-deploy، فرو‌ریختن (adv ثابت)، کارت نتیجه؛ 390×844 + 844×390 برای HUD؛ Q=low ┃ diff numpy در نیم‌رزولوشن: پیکسل با Δmax>24؛ UI ≤1.5٪، 3D ≤4٪ (ماسک نواحی متحرک)؛ شکست → montage قبل|بعد|diff ┃ flaky سایه/ذره → ماسک و freeze

**E11 — گیت پرفورمنس (نسبی)** · P1 · 3 · E8 ┃ ≥55–60fps، <300 draw call، گرما ┃ A/B در یک اجرا: bundle مستقر (از آخرین بسته‌ی commit‌شده) در برابر کاندید، Q=high، ۳ ژست دوربین ثابت (خانه پیش‌فرض، خانه زوم شهر، نبرد t=30 با roster کامل)؛ **مطلق** (قطعی در swiftshader): calls، tris، programs، textures؛ **نسبی**: ms/frame میانه‌ی ۳ دور متناوب ┃ calls ≤300 سخت؛ Δcalls >+10 هشدار، >+25 رد؛ Δms >+10٪ هشدار، >+20٪ رد؛ programs ≤+5؛ بعد از ۳ نبرد textures/geometries = پایه ±2 (leak.py)؛ heap ≤ +8MB ┃ swiftshader CPU است؛ فقط نسبی

**E12 — soak/monkey** · P2 · 3 · E10 ┃ نشت و گیرکردن‌های نادر ┃ ۶۰ دقیقه headless Q=low: تپ تصادفی روی selectorهای مجاز، ۸ نبرد با استقرار تصادفی، آموزش/ارتقا از API ┃ 0 PAGEERR، 0 خطای GL، منابع ثابت، heap <+10٪، هیچ overlay نامرئی (elementFromPoint) > 3ث ┃ زمان اجرا؛ قبل از بسته‌های بزرگ

**E13 — گزارش خطا + جعبه‌ی سیاه ماندگار** · P0 · 3 · — ┃ ANR «Telegram isn't responding» و ریشه‌یابی ┃ `perf.js`: `error`/`unhandledrejection` → `err` (پیام، file:line، stack ۳۰۰، hash؛ dedupe؛ ≤8/جلسه؛ ارسال فوری)؛ ring buffer ۴۰ رویداد (phase، شروع/پایان نبرد، تغییر کیفیت، فریم کند) هر ۵ث در localStorage + `pagehide`؛ پرچم `bw_alive` → اجرای بعد `prev-crash` + **یک پله کیفیت پایین‌تر** (toast «گرافیک بعد از کرش پایین آمد»)؛ گزارش `sum` روی hide: p50/p95 فریم، ٪ زمان 30fps، `DYN.s` کمینه (تلمتری واقعی گرما) ┃ headless: throw در setTimeout → سطر err در لاگ؛ `page.close()` بدون pagehide → اجرای بعد prev-crash و tier پایین‌تر ┃ کاهش اشتباه کیفیت → فقط یک جلسه

**E14 — بازیابی WebGL context** · P0 · 1.5 · E16 ┃ صفحه‌ی سیاه ┃ `main.js`: `webglcontextlost` → `preventDefault`، `running=false`، note، overlay «Display reset — tap to continue»؛ `restored`/تپ → اگر نبرد: نتیجه‌ی معلق (E16) → `location.reload()` ┃ headless `WEBGL_lose_context.loseContext()` → overlay؛ `restoreContext()` → reload و ready بی‌خطا ┃ initData قدیمی‌تر از INIT_MAX_AGE → پیام «دوباره باز کن»

**E15 — لایه‌ی شبکه + idempotency + تمدید session** · P0 · 4 · E5 ┃ قطعی/کندی شبکه‌ی ایران؛ دوبار تپ ┃ `net.js` `api(path, body, {timeout:8000, retry})` با AbortController؛ POST با `rid` (uuid)؛ retry 0.5/1.5/4ث؛ بنر «اتصال قطع شد…» بعد از ۲ شکست؛ 403 با session → یک‌بار re-auth با `tg.initData`؛ سرور: `bluewall:rid:<uid>:<rid>` TTL 10m با پاسخ فشرده → تکرار = همان پاسخ؛ header `X-BW-Token` وقتی exp<3h ┃ API suite rid؛ playwright `set_offline` وسط collect → بنر → آنلاین → جم فقط یک‌بار اضافه ┃ پاسخ کش‌شده‌ی کهنه → TTL کوتاه

**E16 — نتیجه‌ی نبرد ماندگار** · P0 · 2 · E15 ┃ لوت گم نشود ┃ کلاینت: `{id,rep,log,t}` در `bw_pend` قبل از POST؛ ارسال دوباره هنگام launch/visibility تا timeout؛ سرور: `a.done ∧ a.id==tid` → `{ok:true,dup:true,info}`؛ timeout از `/battle/start` (E19) ┃ API: دو submit → یک اعمال؛ headless: offline روی کارت نتیجه → آنلاین → اعمال یک‌بار ┃ —

**E17 — نسخه و کش (build قابل‌تکرار)** · P1 · 3 · E5 ┃ لود سریع‌تر، بدون مخلوط نسخه ┃ `build.sh`: `__BUILD__` = sha256(src+lock)[:12] (بی‌تغییر → wall.js یکسان → ارسال نمی‌شود) + `web/app/build.json`؛ `manifest.json` {فایل: sha8} برای glb/audio → `?v=<sha8>` per-file؛ سرور برای `?v=` → `max-age=31536000, immutable`؛ `/api/state.build` ≠ کلاینت → در خانه toast «Update ready» (تپ → reload)، در نبرد بعد از نتیجه ┃ دو build بی‌تغییر = sha یکسان؛ تغییر یک glb → فقط v همان؛ headless: تغییر build.json → toast < 60ث ┃ manifest فراموش‌شده → G12 چک

**E18 — نقشه‌ی نبرد canonical** · P0† · 3 · هماهنگی با مالک battlesim ┃ عدالت + پیش‌نیاز re-sim ┃ targets نبرد از مولد ثابت مستقل از `Q.level` (چگالی ثابت شهر برای sim؛ کیفیت پایین فقط mesh ها را کم/ادغام کند و نگاشت id→mesh)؛ `buildNav` با `L.height` نه `world.fastHeight` ┃ هش targets در q=low/medium/high برابر و = `basetargets.json` (G9) ┃ تغییر بالانس؛ گلدن E9 بازتولید

**E19 — پروتکل نبرد v2 + اعتبارسنجی schema** · P0† · 3 · E15,E16 ┃ «NEXT بعد از شروع پنهان» در سرور؛ بستن سوراخ‌ها ┃ `/api/battle/start {id}` (اولین استقرار) → `atk.started`؛ scout/NEXT بعدش رد؛ `/battle/end {id,rep,log,simv,build}` schema سخت (نوع، عدد finite، dict≤32، log≤2000)؛ مدت ≥ max(5, rep.time−10) و ≤270ث؛ قفل قربانی `v.uatk=now+timeout` (رد در `_candidates`)؛ سقف لوت روزانه‌ی ربات (K×تولید روزانه‌ی معدن؛ K با مالک)؛ `lane_remove` refund سقف vault (A6) ┃ API suite: همه رد با 4xx؛ دو مهاجم یک قربانی → دومی target دیگر ┃ —

**E20 — شبیه‌سازی سرور (معتبر)** · P0† · 8 · E18,E19,E27 ┃ پیش‌شرط `BLUEWALL_ATTACK=public`، جام/لیگ/لیدربورد ┃ کلاینت لاگ استقرار `[[step,'u',type,x,z],[step,'s',k,x,z]]` (x,z با دقت 0.1) را می‌فرستد؛ `bluewall/simjs/sim.cjs` = esbuild از battlesim+nav+layout+basetargets+unitdefs با `verify(...)→{destruction,stars,lost,loot,spells,hash}`؛ اجراکننده: `node` اگر هست، وگرنه wheel `mini-racer` (V8) داخل بسته با `pip --no-index` در venv، وگرنه حمله owner-only بماند؛ worker دائمی، timeout 3ث، صف ۱؛ **نتیجه‌ی سرور اعمال می‌شود**؛ اختلاف (|Δdestr|>0.5 یا ستاره) → شمارنده‌ی `desync` + لاگ فشرده؛ `simv`≠سرور → نبرد void (بدون ضرر/لوت، «بازی به‌روز شد») ┃ G7b: corpus لاگ‌های ضبط‌شده از headless → verify سرور == نتیجه‌ی کلاینت دقیق؛ قبل از عمومی: ۲۰۰ نبرد مالک با ۰ desync؛ iOS (JavaScriptCore، sin/cos متفاوت) جدا با testerها ┃ واگرایی iOS → tolerance و اعمال نتیجه‌ی سرور

**E21 — خط لوله‌ی perf/crash + گزارش** · P1 · 2 · E13 ┃ ریشه‌یابی فریز بدون journalctl ┃ `h_perf` → `_data/bluewall/perf/YYYYMMDD.jsonl` (۱۴ روز، ≤50MB) + یک سطر INFO؛ `python -m bluewall.ops report --hours 24`: launchها، GPU top5، فریم کند به تفکیک phase (p50/p95)، top10 خطا با hash، ctxlost، prev-crash، desync، 5xx — فقط شمارش، بدون uid ┃ fixture jsonl → خروجی مورد انتظار ┃ —

**E22 — پنل سلامت مالک (داخل بازی)** · P1 · 3 · E5,E21 ┃ مالک فقط گوشی دارد ┃ Settings → تب «Server» (فقط owner) از `/api/dev/health`: build، uptime، سن آخرین بکاپ، Redis ok/ms، خطاهای ۲۴h (۳ تا)، خلاصه‌ی perf، desync، بازیکن فعال ۲۴h، حجم `_backups` ┃ اسکرین‌شات headless؛ غیرمالک 403 ┃ —

**E23 — هشدار تلگرامی به مالک** · P2 · 2 · E5,E27 ┃ خبر قبل از شکایت ┃ watchdog هر ۶۰ث: 5xx≥10/5m، Redis down≥60ث، شکست snapshot، desync>2٪/روز، restart-loop (۳ بوت <120ث در ساعت از `boots.log`) → `sendMessage` به SUPER_ADMIN با توکن ربات (هرگز چاپ نشود)، ۱ بار/۳۰ دقیقه هر نوع، متن فارسی کوتاه ┃ `BW_TG_API` جعلی در dev → پیام ضبط شد ┃ دسترسی سرور به api.telegram.org (diag بسنجد)

**E24 — بهداشت لاگ** · P1 · 1 · — ┃ «هرگز secret چاپ نشود» ┃ `logging.Filter`: الگوی توکن ربات `\d{6,12}:[\w-]{30,}`، session `v1\.\d+\.\d+\.[0-9a-f]{40}`، `hash=`/`user=` initData → `***`؛ IP → hash نمک‌دار؛ perf → INFO ┃ unit فیلتر؛ grep لاگ suite = 0 الگو ┃ —

**E25 — پاک‌سازی نام/ورودی + lint innerHTML** · P1 · 1 · — ┃ جعل نمایشی، XSS آینده (تاریخچه‌ی حمله) ┃ `touch`: حذف کنترل/bidi (U+202A–202E, U+2066–2069)/zero-width، ≤24 grapheme؛ G5: هر `innerHTML` با `${…}` بدون `esc/fmt/icon/عدد` = هشدار (۳۲ مورد فعلی baseline) ┃ unit + شمار هشدار جدید = 0 ┃ —

**E26 — تک‌نویسنده + inbox + رفرال ضد-alt** · P1 · 4 · E2 (+ عامل رفرال) ┃ «دعوت‌کننده ۱۰۰۰ فیروزه» بدون مزرعه‌ی اکانت ┃ فقط `bluebot-wall` روی `bluewall:st:*` می‌نویسد؛ ربات/بقیه `RPUSH bluewall:inbox:<uid> {gid,kind,gems}`؛ `_txn` با idempotency (`st.gids` ۲۰۰ آخر) اعمال؛ کسر قربانی هم از inbox در MULTI با اعتبار مهاجم؛ قواعد پیشنهادی (تأیید مالک): پاداش فقط وقتی invitee به keep L3 + ۲ روز فعال برسد، ≤5/روز و ≤50 کل برای هر دعوت‌کننده، invitee بدون state قبلی، hash IP مشترک ۷ روز → نگه‌داشت برای بازبینی مالک ┃ unit + هم‌زمانی؛ دو grant یکسان → یک اعمال ┃ قواعد سلیقه‌ای مالک

**E27 — diag ایمن سرور** · P0 · 1.5 · — ┃ D4: تصمیم‌های E20/E23/G1 به آن وابسته‌اند ┃ `ops diag` (در خروجی نصب بعدی): python، node، Redis (version، `maxmemory-policy`، aof/rdb، used_memory، تعداد کلید bluewall)، `systemctl show -p Restart,MemoryMax`، دیسک، حجم journal و `_backups` — هیچ مقدار env/URL ┃ اجرا روی ردیس محلی؛ grep الگوی secret = 0؛ نتیجه در `dev/qa/server_facts.json` ┃ CONFIG ممکن است rename شده باشد → «unknown»

**E28 — drop-in systemd (اختیاری)** · P2 · 0.5 · E27 ┃ ریستارت خودکار، سقف حافظه ┃ `install.sh --systemd`: `Restart=always`, `RestartSec=2`, `MemoryMax=700M`, `StartLimitBurst=5/300s` — فقط با تأیید مالک ┃ G14 shim ┃ تغییر پیکربندی سرور → opt-in

**E29 — کیت هندآف + runbook** · P1 · 3 · E8 ┃ ادامه‌ی کار توسط هر توسعه‌دهنده/Claude ┃ §۷ ┃ پوشه‌ی تمیز: README → build + `gate.sh quick` سبز در ≤15 دقیقه ┃ —

## ۴. مشخصات `dev/qa/gate.sh` (پیش‌بسته)
اجرا: `gate.sh quick|full [--accept sim|vis|perf] [--force "دلیل"]` · خروجی: `dev/qa/out/<ts>/GATE.txt` + exit≠0 روی هر شکست سخت · quick = G0–G8,G12–G14 (<3 دقیقه) · full = + G9–G11 (~20 دقیقه؛ خودکار وقتی `client/src` یا `web/` تغییر کرد).
- **G0 محیط**: node ≥20، python ≥3.10، esbuild از lock (نه `^`)، stub config موجود. → همه موجود.
- **G1 پایتون**: `py_compile` همه‌ی `bluewall/*.py`؛ `ast.parse(feature_version=<py سرور از server_facts>)`؛ `import bluewall.server` با stub؛ pyflakes (undefined/unused import) در venv dev. → 0 خطا؛ هشدار pyflakes جدید = 0.
- **G2 unit**: `python3 -m unittest discover dev/qa/unit`. → 0 شکست، ≥60 تست.
- **G3 API**: `api_suite.py` روی memory و redis:6390. → 0 شکست، 0 پاسخ 5xx، 0 Traceback و 0 الگوی secret در لاگ سرور.
- **G4 migration/N-1**: همه‌ی fixtureها با کد فعلی و کد پایتون آخرین بسته‌ی commit‌شده. → بی‌exception؛ هیچ fixture غیرخالی به fresh تبدیل نشود؛ invariantها برقرار.
- **G5 build کلاینت**: esbuild با `--metafile`؛ دو build پشت‌هم = sha یکسان؛ wall.js ≤1.6MB raw و ≤450KB gzip (+5٪ هشدار)؛ رشته‌های قابل‌مشاهده (`i18n.js`، `index.html`، HUD) بدون `\bbot\b|ربات` (case-insensitive، فقط literal نمایشی)؛ lint innerHTML (E25). → سبز.
- **G6 سازگاری قوانین**: `python -m bluewall.military` == `client/src/unitdefs.json` (بدون ترتیب کلید)؛ BASE/VAULT/CAP_H در `econ.js` == `progress.py`؛ SPELLS برابر. → برابر دقیق.
- **G7 sim**: `sim_golden.mjs` (۵ ترکیب × ۶ seed). → عبور از دیوار 0، گام در آب 0، noRoute ≤ گلدن، میانگین تخریب ±3، زمان ±8ث، تعداد ۱۰۰٪ ≥ گلدن−1، تکرار seed = هش یکسان. **G7b** (بعد از E20): corpus لاگ‌ها → `sim.cjs verify` == نتیجه‌ی ضبط‌شده (دقیق).
- **G8 nav**: مسیر از همه‌ی نقاط استقرار به keep، 0 نقطه‌ی خیس خارج پل، زمان route گرم <5ms. → سبز.
- **G9 headless smoke** (full): `e2e` واقعی با سرور محلی: لودر → ready ≤ زمان پایه×1.3؛ 0 PAGEERR، 0 console.error (جز whitelist 404 صدا)، 0 `gl.getError` (هوک dev هر ۶۰ فریم)؛ نبرد: start → deploy → پایان → کارت → HOME؛ invariantهای UI: NEXT بعد از start پنهان، sweep `elementFromPoint` روی همه‌ی دکمه‌ها = 0 بلاک؛ هش targets در q=low/high برابر (E18).
- **G10 تصویری** (full): E10؛ آستانه‌ها همان‌جا. شکست 3D = هشدار با montage (نیاز به نگاه انسان)، شکست UI = رد.
- **G11 perf** (full): E11؛ calls ≤300 و Δ ها.
- **G12 دارایی/لایسنس**: هر `loadGLB('x')`/مسیر صدا در کد → فایل موجود؛ هر glb: `asset.extras.author` ∈ `credits.json[].by` و لایسنس ∈ {CC0, CC-BY}؛ فایل >5MB = رد؛ manifest (E17) کامل.
- **G13 محتوای بسته** (بعد از ساخت files/): 0 الگوی secret (`\d{8,10}:[\w-]{35}`، `BOT_TOKEN=`، `.env`، `-----BEGIN`)؛ 0 `__pycache__`/`*.bak.*`/`app_dbg.js`؛ `bash -n` و shellcheck روی اسکریپت‌ها؛ tar فقط `NAME/{files/bluewall/…,install.sh,rollback.sh,SHA256SUMS}`؛ wall.js در بسته ⇔ تغییر src.
- **G14 نصب شبیه‌سازی‌شده**: `BW_APP=/tmp/fakeapp` + shim `systemctl/curl/redis` → ۸ سناریوی E4. → همه پاس؛ rollback بایت‌به‌بایت.

## ۵. ثبت ریسک باگ (۱۵ محتمل‌ترین، رتبه = احتمال×اثر)
| # | باگ | محل | تشخیص | رفع |
|---|---|---|---|---|
| 1 | reset قلعه با خطای migration/timeout ردیس | `state.Store.load`→`_fresh` | G4 fixture خراب؛ prod: شمارنده‌ی `bad:*` + snapshot diff | E1,E2,E3 |
| 2 | نوشتن گمشده و collect دوباره بعد از خطای write | `Store.save`→`_mem` | fault-injection G3؛ لاگ «state write failed» → هشدار E23 | E1 |
| 3 | تقلب گزارش نبرد (lost={}، لوت سقف) و مزرعه‌ی لوت ربات | `settle_battle` | تست cheat در G3؛ prod: desync، لوت روزانه‌ی هر uid | E19,E20 |
| 4 | نتیجه‌ی نبرد وابسته به کیفیت گرافیک | `town.js:102`، `battle.js:91` | G9 هش targets low/high | E18 |
| 5 | rollback بی‌اثر بعد از نصب دوباره؛ بدون rollback خودکار | `install.sh` | G14 | E4 |
| 6 | صفحه‌ی سیاه بعد از از دست رفتن context | `main.js` | تست loseContext؛ prod: `ctxlost` | E14 |
| 7 | 403 بی‌صدا بعد از ۱۲h؛ دکمه‌ها کار نمی‌کنند | `econ.js`، `auth.SESSION_TTL` | G3 token منقضی؛ prod: شمارنده‌ی 403 در perf | E15 |
| 8 | نتیجه‌ی نبرد گم/«ثبت نشد» با قطعی لحظه‌ای | `econ.battleEnd`، `settle_battle` | G3 submit دوبار؛ offline test | E16 |
| 9 | کلاینت قدیمی + سرور جدید بعد از هر بسته؛ glbهای مخلوط | `build.sh`، `assets.js` | build در perf hello در برابر سرور | E17 |
| 10 | 500 با ورودی بدشکل؛ NaN → ۱۰۰٪ | `settle_battle`، `h_dev` | G3 fuzz | E19,E5 |
| 11 | overlay جستجو/درصد گیر با شبکه‌ی معلق | `search.js`، `econ.scout` | playwright offline | E15 |
| 12 | دو مهاجم یک قربانی؛ crash بین دو write | `battle_end` | تست هم‌زمانی | E19,E26 |
| 13 | جم بیش از vault با لغو صف (بانک در صف) | `lane_remove` | invariant fuzz G2 | E19 |
| 14 | drift قوانین کلاینت/سرور | `econ.js`، `unitdefs.json` | G6 | E8 |
| 15 | پرشدن دیسک (`_backups`، tarها، لاگ perf) | `install.sh`، `h_perf` | diag + پنل سلامت | E4,E21 |

## ۶. چک‌لیست انتشار (هر بسته)
1. `gate.sh quick` سبز (و `full` اگر client تغییر کرد)؛ هشدارها در یادداشت بسته.
2. اسکرین‌شات روز/شب + هر صفحه‌ی تغییرکرده، با نگاه انتقادی؛ سلیقه‌ای‌ها قبلاً تأیید شده باشند.
3. تغییر schema state؟ → migration + fixture جدید + G4 N-1 سبز.
4. تغییر sim؟ → `simv` جدید، گلدن با `--accept` و دلیل.
5. `mkpkg.sh` → G13/G14 خودکار؛ اندازه‌ی بسته و تعداد فایل منطقی.
6. یادداشت فارسی ۲–۴ خط + یک دستور نصب + دستور rollback.
7. بعد از نصب: خروجی ۳ خط ✅ نصاب (build، redis، dump) را مالک بفرستد یا پنل سلامت.
8. ۳۰ دقیقه بعد: پنل سلامت/`ops report` → 5xx=0، err جدید=0؛ بعد `mkpkg.sh --commit`.
9. به‌روزرسانی `p5-progress.md` در Project.

## ۷. کیت هندآف (`dev/HANDOFF/` + Project `claude/bluewall-ops.md`)
- **نقشه‌ی معماری**: ماژول‌ها (سرور ۸ فایل، کلاینت ۶۸ فایل گروه‌بندی‌شده)، جریان داده (loader→auth→bundle→start→econ→API)، کلیدهای Redis (`st`, `bad`, `rid`, `inbox`)، schema state با `v`.
- **دستورها**: build (`build.sh`، `rb.sh`)، سرور محلی با stub (بدون توکن واقعی)، `gate.sh`، dsess/btest، `bsw.sh`، `mkpkg.sh` و `--commit`.
- **سیاست secret**: هرگز توکن نخواه/چاپ نکن؛ stub با توکن جعلی؛ نیاز سرور به secret → دستور `read -rsp` برای مالک؛ handoff tar با G13 اسکن می‌شود.
- **runbook ۱۰ حادثه**: شکایت reset (restore uid از snapshot)، سرویس down، Redis down، بسته‌ی بد (rollback پشته)، گزارش ANR (`ops report` phase)، جهش desync، دیسک پر، گزارش تقلب، version skew، 404 دارایی.
- **ADR**: تصمیم‌های قفل‌شده (English only، owner-only attack تا E20، تک‌نویسنده، بدون service worker).
- `handoff.sh` → `bluewall_handoff_vN.tar.xz` (کد + dev/qa + اسناد، بدون node_modules/bak/png‌های موقت).

## ۸. باگ‌های مشکوک دیگر + فهرست ظرافت
**مشکوک:** `progress.cancel` برای آیتم‌های قدیمی بدون `paid` چیزی برنمی‌گرداند · `_candidates` SCAN روی DB صف ربات کند می‌شود (index جدا `bluewall:idx` لازم برای جام/لیگ) · `INIT_MAX_AGE=24h` (لودر بلافاصله auth می‌کند؛ ۲h کافی) · `_ip()` به `CF-Connecting-IP` اعتماد می‌کند؛ دسترسی مستقیم به origin = جعل IP در rate-limit · `badgeTick`/`clock` در پس‌زمینه هم اجرا می‌شوند · iOS: `deviceMemory` ندارد → پیش‌فرض high؛ با E13 کرش→پایین بیاید · `perf.frame` فریم >20s را نادیده می‌گیرد (همان فریزهای ANR!) → جداگانه با `freeze` ثبت شود · `search.js` حلقه‌ی `slow` بی‌سقف تکرار · `h_bundle` با gzip: Cloudflare ممکن است دوباره فشرده کند (X-Raw-Size همچنان خام؛ OK) · `mkpkg` فایل حذف‌شده از سرور پاک نمی‌کند (کد مرده‌ی `bbase.js` می‌ماند).
**ظرافت:** بنر اتصال با پالس ملایم ناوی/فولادی و شمارش retry · مهر «✓ Verified» روی کارت نتیجه وقتی سرور تأیید کرد · toast «Update ready» با حلقه‌ی پیشرفت reload · overlay بازیابی context هم‌سبک لودر (نه alert خام) · کد `ref` قابل‌کپی روی خطای سرور · `tg.HapticFeedback.notificationOccurred('error'|'success')` روی خطا/ثبت نتیجه · پیام‌های لودر انگلیسی و بدون «ربات» (مثلاً "Open Blue Wall from Telegram") · نمودار sparkline خطا/فریم در پنل سلامت مالک · toast «Graphics lowered after a crash» با دکمه‌ی Undo.

## ۹. ترتیب تحویل (فقط حوزه‌ی E؛ هر بسته ~۳–۴h)
- **E-0 (dev، بدون بسته، اول از همه)**: E6 هسته + E7 هسته + E8 quick (G1–G6, G13) — تا بسته‌ی بعدیِ هر عامل از gate رد شود.
- **E-1 «بقای داده»** (بسته): E1, E2, E5, E27, E3(dump نصب + snapshot ساعتی).
- **E-2 «نصب امن»** (بسته): E4 + G14, E24, E28(opt-in).
- **E-3 «کلاینت مقاوم»** (بسته): E13, E14, E15, E16 (+ پیام‌های لودر C6).
- **E-4 «نسخه و دید مالک»** (بسته): E17, E21, E22, E23.
- **E-5 (dev)**: E9, E10 (با هوک freeze)، E11, E12 → `gate.sh full`.
- **E-6/E-7 «ضدتقلب»** (دو بسته): E18 (با مالک sim)، E19, E25 → E20 + G7b؛ سپس جمع‌آوری ۲۰۰ نبرد بدون desync → پیشنهاد باز کردن حمله.
- **E-8 «اجتماعی امن»**: E26 همراه بسته‌ی رفرال/دوستان. · **E-9**: E29 (پیش‌نویس از E-1 به بعد تکمیل می‌شود).

## ۱۰. تحقیق
- Clash of Clans replay = «دنباله‌ی فرمان‌ها که دوباره شبیه‌سازی می‌شود» و به نسخه‌ی قوانین وابسته است → ما `simv` در لاگ و void برای نسخه‌ی ناهمخوان ([clash.ninja](https://www.clash.ninja/guides/why-cant-i-view-previous-replays)).
- اعتبارسنجی سمت سرور: ورودی‌ها را در شبیه‌ساز معتبر اجرا کن، با نتیجه‌ی ادعایی مقایسه کن، ناهمخوان را رد کن و build/دستگاه را برای دیباگ ثبت کن ([bugnet](https://bugnet.io/blog/how-to-add-server-side-replay-validation)).
- نتیجه برای ما: sim قطعی موجود (`mulberry`, `TICK` ثابت) یعنی re-sim با لاگ استقرار عملی است؛ مانع واقعی فقط targets وابسته به کیفیت (E18) و موتور JS متفاوت iOS است.

## ۱۱. تعارض‌ها و توصیه‌های انتقادی
- **روی ضدتقلبِ heuristic وقت نگذارید** (حدس تلفات/مدت): حمله فعلاً owner-only است؛ مستقیم E18→E20. اما **جام/لیگ/لیدربورد/دوستان (عامل‌های دیگر) بدون E20 نباید عمومی شوند** — لیدربورد پر از متقلب می‌شود. وابستگی را در پلن آن‌ها صریح کنید.
- **Service worker اضافه نکنید**: ریسک گیرافتادن در bundle کهنه؛ کش HTTP با hash محتوا (E17) کافی و امن‌تر است.
- قانون «English only» (handoff §4) با لودر فارسی دارای «ربات» در تضاد است → E-3 درستش کند.
- «هر چند ساعت یک بسته» بدون gate یعنی «ماه‌ها بدون باگ» ممکن نیست: gate quick (<3 دقیقه) اجباری، full فقط برای تغییرات بصری.
- `mkpkg --commit` فقط بعد از دیدن پنل سلامت/۳ خط ✅، نه صرفاً «نصب شد».
