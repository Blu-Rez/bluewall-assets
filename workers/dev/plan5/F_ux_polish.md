# F — ظرافت و جذابیت: زبان طراحی، معماری اطلاعات، یک جریان روشن (Blue Wall، پلن v5)
> عامل F · ۱۴۰۵/۰۷/۱۰ · فقط‌خواندنی روی کد · مبنا: `client/src/{ui,armyui,bhud,search,spells,upgradeui,i18n,settings,main,audio,battle}.js`، `web/index.html`، `web/tg.js`، اسکرین‌شات‌های `scratchpad/ds9/*`، `ds5/b0`، `dev/e2e1_*`، `dev/e2ec_c`، `dev/sp/sheet1.png`. هم‌پوشانی با عامل A در §۱۰-۸ مشخص شده است.

## خلاصه
- **ریشه‌ی «شلوغ/گیج» در کد:** ۱۷۶ رنگ hex، ۲۴ اندازه‌ی فونت (8.5–38px)، ۲۱ شعاع، ۵ easing، ۶ رنگ تأکیدی و ۳ ورودی برای حمله. بازخوردها بی‌صدا گم می‌شوند: toast زیر پنل است و نبرد صفر haptic دارد.
- **۵ ریسک اول:**
  1. بازنویسی IA (Assist + نوار پایین + ⚔ بالا) جریان‌های تست‌شده را بشکند.
  2. مالک نمونه‌های سلیقه‌ای را رد کند (شمشیر، چیدمان خانه، رنگ دسته‌ها).
  3. انیمیشن‌های DOM گرما و FPS را بالا ببرند.
  4. نسخه‌های مختلف API تلگرام (BackButton، safe-area، haptic) روی گوشی‌ها فرق کنند.
  5. تداخل با عامل A روی `bhud.js`/`battle.js`/`spells.js`.
- **۵ اقدام اول:**
  1. `uiqa.js`: ممیزی خودکار لمس، فونت، هم‌پوشانی و z-order، و ثبت عدد پایه.
  2. بسته‌ی رفع فوری: toast بالای پنل‌ها، شیت زیر دکمه‌ها، ستاره‌ی خالیِ نامرئی، هم‌پوشانی hint/NEXT/اسپل، CSS نامعتبر.
  3. `theme.js` (توکن‌ها) + فونت فارسی fallback + رقم‌های عرض‌ثابت.
  4. `feedback.js` (haptic + صدای UI) + BackButton تلگرام + تأیید بستن وسط نبرد.
  5. نمونه برای مالک: ۳ شمشیر رندر ۳D و ۲ چیدمان خانه (اسپل A در A6).

## ۰) وضعیت واقعی (از کد)
1. **زبان و فونت:**
   - UI فقط انگلیسی است (`tr()`→`T.en`)؛ رشته‌های `armyui`/`upgradeui`/`bhud`/`search` سخت‌کدند و از i18n رد نمی‌شوند. خطاهای لودر فارسی و راست‌به‌چپ‌اند (`#msg`، Vazirmatn).
   - فونت‌ها: Baskerville برای HUD، Cinzel فقط لودر، Arial در `.hb .cp`، Georgia italic در `.bwa-c .inf`.
   - **Baskerville حرف فارسی ندارد** (cmap بی U+0627) → اسم دشمن یا اسم تلگرامی فارسی با فونت سیستم رندر می‌شود.
   - **Baskerville tnum ندارد** (عرض رقم 436–755) → `tabular-nums` در `search.js` بی‌اثر است و تایمر و % می‌لرزند.
2. **اندازه‌ها با `--hs:.64`:** `.bw-g .pc` = 7.7px، «FULL» = 6.1px، `.ct small` = 7.4px، برچسب KINGDOM = 6.7px، نشان لول = 38px لمسی. ATTACK بدون scale است (92×96) ولی KINGDOM حدود 50×55 → ناهماهنگ (`e2e1_home`).
3. **z-order:**
   - `.bw-toast` (z auto) زیر `.bwa`/`.bwu` (z 12) در stacking context `.bw-ui` می‌افتد → وقتی پنل باز است «Not enough gems»، «Queue full»، «Ready!» نامرئی‌اند (شکست بی‌صدا).
   - `.bw-sheet` به خاطر ترتیب DOM زیر `.bwa-btn`/`.bwu-btn`/`.bwa-chip` رسم می‌شود → دکمه‌ی Collect نیمه‌پوشیده.
4. **باگ جریان (=A1):** `bhud.showResults` مقدار `res.onclick=null` می‌گذارد؛ اگر NEXT لغو شود یا حریفی نباشد (`battle.js next()`)، کارت نتیجه قفل می‌شود و HOME هم کار نمی‌کند.
5. **نبرد:**
   - صفر haptic.
   - hint (sb+120)، NEXT (sb+132) و پایین ستون اسپل (sb+130) هم‌پوشانی دارند (`ds9/a0`، `a1`).
   - ستاره‌ی خالی `fill:#16233f` روی صحنه و کارت نتیجه نامرئی است (`e2ec_c`: جای خالی).
   - نام دسته 8.5px.
   - لودینگ نبرد نوار بی‌% است (قانون مالک) و تصویرش با حلقه‌ی جستجو فرق دارد.
6. **خرج یا ضرر بدون تأیید:** Rush فیروزه (`armyui .rush`، `upgradeui button.rush`)، Cancel ارتقای فعال (ضرر ۵۰٪)، تغییر کیفیت (reload بعد از 900ms).
7. **تلگرام:**
   - `BackButton`، `enableClosingConfirmation` و `SettingsButton` هیچ‌جا نیستند → ژست برگشت اندروید کل اپ را می‌بندد و بستن تصادفی نبرد را از دست می‌دهد.
   - از haptic فقط `impactOccurred` استفاده شده است.
8. **ایموجی به‌جای آیکن:** 🔒 ⏱ ✎ ⚔ ✕ ♥ ✦ ▸ + ۶۰ ایموجی در `INFO` → ظاهر وابسته به گوشی، ناهماهنگ با فولاد/شیشه.
9. **انیمیشن بی‌پایان روی property گران:** `bwaGleam`/`bwuGleam` روی `left`، `bwbGlint` و `hbLow` روی box-shadow، `bwFull` روی filter → repaint پیوسته روی خانه = گرما.
10. **ورودی‌های تکراری:**
    - حمله: ATTACK، «FIND A TARGET»، NEXT.
    - ارتش: چیپ ARMY + تپ ساختمان.
    - تنظیمات پشت نشان لول پنهان است.
    - همه‌ی تزئین‌ها «Coming soon» دارند.
11. **رنگ:** ۶ تأکید (آبی، قرمز FIND/NEXT نتیجه، نارنجی NEXT اسکوت، فیروزه‌ای Rush، سبز صف، طلایی انتخاب) در برابر پالت مالک (آبی روشن/سرمه‌ای/مشکی/فولادی).
12. **CSS:**
    - `font:700 13px/1 inherit` در `.bwa-tabs button` و `.bwa-lane .rush` نامعتبر است → کل اعلان دور ریخته می‌شود و وزن/اندازه‌ی پیش‌فرض مرورگر می‌آید.
    - toast با `white-space:nowrap` → پیام بلند در 360px از صفحه بیرون می‌زند.

## ۱) IA — نقشه‌ی جریان (پیشنهادی)
```
[Telegram] → L0 لودر N2 ─ auth 0–12% → bundle 12–60% → world 60–100% (یک نوار، یک %) ─ خطا → کارت خطای فارسی + [دوباره]
     ▼ 100%
L1 خوش‌آمد (اولین ورود روز: کامل ۹s/تپ · بعدی: ۱.۲s فقط عنوان) ── tap
     ▼
H  خانه ┌ بالا: [نشان+نام ▸ Profile] ············ [ruby][emerald][turq] ┐
        │ زیر جم‌ها، راست: [⚔ حمله‌ی کوچک ۵۶px، حلقه‌ی آمادگی %]        │
        └ پایین: [نوار کار: سازنده۱..۳ | صف آموزش‌ها | دم‌کردن] [◉ Assist] ┘
   │⚔                     │تپ خانه‌ی نوار                │◉
   ▼                      ▼                              ▼
 S جستجو % ◄────── A/صفحه‌ی متمرکز (Build|Army)     A هاب Assist (۲×۴ کاشی با badge)
   │found 100%                                    Build · Army(+Spells) · Rank(جام/لیگ/رده) · Clan
   ▼ (همان حلقه ادامه)                            Friends(دعوت +1000 فیروزه) · Log(تاریخچه حمله/دفاع) · Profile · Settings
 B0 رژه % (نشان+نام+Lv حریف وسط حلقه)            هر کاشی → Page با ← (BackButton تلگرام) · یک اقدام اصلی
   ▼
 B1 اسکوت: [HOME] [⏭ NEXT→S] لوت قابل‌دریافت · استقرار = شروع حمله
   │ اولین دسته/اسپل                (NEXT و HOME از اینجا پنهان)
   ▼
 B2 نبرد: [⚑ عقب‌نشینی ۲تپ] تایمر · تخریب · ⭐⭐⭐ · لوت برداشته
   │ ۱۰۰٪ / زمان / مرگ همه / عقب‌نشینی
   ▼
 B3 نتیجه (مرحله‌ای): بنر → ستاره → % → لوت (شمارش+پرواز) → تلفات → [HOME اصلی] [⏭ NEXT فرعی→S]
   │ HOME
   ▼ پرده‌ی «محو→ظاهر» (R6) → H + پرواز جم‌ها به گیج‌ها + شمارش
تپ ساختمان در H → شیت زمینه‌ای (نام، Lv، ۱ اقدام Upgrade/Collect/Train، «Details» → Page) · تپ تزئین → برچسب شناور ۱.۵s
```
**قواعد:**
- **یک اقدام اصلی در هر صفحه** (فقط یک دکمه primary):
  - H: Assist (⚔ تأکید کوچک بالا، درخشش در آمادگی ≥۸۰٪).
  - Army: تپ کارت = آموزش.
  - Build: فقط دکمه‌ی ردیف متمرکز.
  - B1: استقرار.
  - B3: HOME.
- **حداکثر دو لایه‌ی باز** (Page + Dialog). BackButton لایه‌ی بالا را می‌بندد.
- **یک تصویر برای همه‌ی انتظارها:** حلقه‌ی % (لودر نوار خودش را نگه می‌دارد).
- **یک مسیر toast:** بالا زیر نوار، روی همه‌ی لایه‌ها.

| چیز | الان | بعد |
|---|---|---|
| حمله | ATTACK بزرگ پایین‌چپ + FIND A TARGET در پنل ارتش | ⚔ کوچک بالا-راست؛ NEXT فقط در B1/B3؛ FIND A TARGET حذف |
| آموزش/اسپل | چیپ ARMY → پنل | صف‌ها در نوار پایین + Assist→Army (Troops/Spells) |
| ساخت/ارتقا | KINGDOM → پنل ۴ تب + دسته | سازنده‌ها در نوار + Assist→Build (Upgrade · New · Queue)؛ «New» → جزئیات Keep |
| تنظیمات | تپ نشان لول (پنهان) | Assist→Settings + منوی ⋯ تلگرام (SettingsButton) |
| پروفایل/پرچم | دکمه‌ی emblem در هدر ارتش | تپ نشان/نام → Profile (emblem، قدرت، جام، تاریخ/ساعت پادشاهی) |
| معدن | شیت Collect؛ ارتقا فقط در KINGDOM | شیت زمینه‌ای: Collect اصلی + Upgrade فرعی |
| تزئین | شیت + «Coming soon» | برچسب شناور؛ «Coming soon» حذف |
| جام/لیگ، کلن، دعوت، تاریخچه | ندارد | کاشی‌های Assist؛ قابلیتِ تحویل‌نشده **اصلاً نمایش داده نمی‌شود** |
| tutorial | ندارد | coachmark روی همین عناصر (F24) |
| FPS | بالا-وسط زیر دکمه‌های تلگرام | فقط مالک، زیر نوار بالا |

## ۲) توکن‌های طراحی (`client/src/theme.js` → `:root`)
| گروه | توکن = مقدار | کاربرد |
|---|---|---|
| متن | `--ink-0 #F2F8FF` · `--ink-1 #BFD6F2` · `--ink-2 #7F9CC4` · `--ink-off #5A6E8C` | اصلی · دوم · برچسب · غیرفعال |
| سرمه‌ای | `--navy-950 #02060F` · `--navy-900 #050F26` · `--navy-800 #0B2452` · `--navy-700 #12356F` | پایه/scrim · بدنه‌ی پنل · سر پنل · کارت برجسته |
| فولاد | `--steel-100 #E8F1FB` · `--steel-300 #AFC3DB` · `--steel-500 #6D83A6` · `--steel-700 #3A4D6E` | bezel، حاشیه‌ی قوی، ستاره‌ی خالی |
| یخ (تأکید) | `--ice-200 #BFEFFF` · `--ice-300 #8FE8FF` · `--ice-400 #5FB6FF` · `--ice-600 #1B4FB8` | انتخاب/فوکوس · glow/پیشرفت · primary |
| خط/پرده | `--line rgba(140,200,255,.32)` · `--line-2 rgba(170,215,255,.55)` · `--scrim rgba(0,3,10,.66)` | حاشیه‌ها، مودال |
| معنایی | `--ok #7DFFB5` · `--warn #FFD36A` · `--danger #E5233F→#7A0F20` · `--star #FFCF45` | موفق/HP بالا · HP میانه · **فقط** عقب‌نشینی/خطا/ضرر · **فقط** ستاره |
| جم (فقط ارز) | ruby `#EE2A4C` · emerald `#19C46C` · turq `#35D6FF` (همان `LQ`) | دکمه‌ی premium = فیروزه‌ای، چون فیروزه خرج می‌کند |
| انتخاب | حلقه `--ice-200` + `0 0 14px rgba(110,200,255,.55)` | جایگزین طلایی `#ffe08a` |
| فونت | display: `Cinzel 900` (حروف بزرگ، tracking .08em) · text: `'Libre Baskerville',Vazirmatn,'Noto Sans Tai Viet',Georgia,serif` | عنوان، برچسب دکمه، VICTORY · متن، نام، عدد |
| مقیاس متن | 11 · 12.5 · 14 · 16 · 20 · 26 · 34 · 44 px | caption (حداقل مؤثر) … hero |
| رقم | `digits(s)` → هر رقم `<i class=dg>` با `width:.62em;text-align:center` | تایمر، %، شمارنده |
| فاصله | 4 · 8 · 12 · 16 · 20 · 24 · 32؛ حاشیه‌ی لبه = 12 + inset | — |
| شعاع | `--r-xs 6` · `--r-s 10` · `--r-m 14` · `--r-l 20` · `--r-pill 999` | نوار/badge · چیپ · کارت/دکمه · پنل · قرص |
| ارتفاع | `--e1 0 2px 6px rgba(0,0,0,.45)` · `--e2 0 6px 16px rgba(0,0,0,.55)` · `--e3 0 20px 60px rgba(0,0,0,.65)` · `--hl inset 0 1px 0 rgba(200,230,255,.25)` | چیپ · دکمه/کارت · پنل · لبه‌ی براق |
| z | hud 10 · strip 20 · page 40 · sheet 45 · dialog 60 · veil 70 · search 75 · toast 90 · لودر 1000 | یک جدول، نه عدد پراکنده |
| لمس | `--hit 44px`؛ ظاهر کوچک‌تر = `::before{inset:-N}` | همه‌ی عناصر تعاملی |

**سطح‌ها:**
- `.k-glass` (پنل): `linear-gradient(180deg,#0D2A5C,#050F26 40%,#020712)` + `--line` + `--hl` + `--e3`. **بدون backdrop-filter** (گرما).
- `.k-plate` (روی ۳D): `rgba(3,10,26,.72)` + `--line` + `--e1`. هر متن روی ۳D یا روی plate است یا با `--halo: 0 1px 0 #01060f,0 0 6px rgba(0,0,0,.8)`.
- `.k-bezel`: همان conic فولادی `.bwa-btn .ring:before`، یک‌بار تعریف.

**دکمه‌ها:**
- primary: یخ، `#6FC4FF→#1B4FB8`، حاشیه `#BFE6FF`.
- secondary: فولاد شفاف `rgba(255,255,255,.06)` + `--line-2`.
- premium: فیروزه‌ای، فقط خرج فیروزه.
- danger: کریمسون، فقط عقب‌نشینی و لغو با ضرر.
- icon: 44 گرد.

**حالت‌های دکمه:**
- فشرده: `scale(.94)` + `brightness(.92)` در 90ms، برگشت با spring در 200ms.
- غیرفعال: opacity .45 + grayscale .5 + بی‌سایه + **دلیل** (روی دکمه یا toast در تپ).
- در انتظار: حلقه‌ی 16px با عرض ثابت.
- موفق: درخشش یخی 300ms.

**آیکن‌ها:**
- خط: یک مجموعه در `icons.js` (ادغام `ICON` در armyui و upgradeui): شبکه‌ی ۲۴، stroke 1.8، سر گرد، `currentColor`. ایموجی‌های UI حذف می‌شوند.
- اسپل: سبک A گوی شیشه‌ای (`dev/sp/spell_art.js orb()`)؛ زیر ۲۸px بی‌درخشش با glyph ضخیم‌تر.
- نیرو: همه‌جا پرتره‌ی ۳D (حتی لیست نتیجه)، دایره با حلقه‌ی ۲px به رنگ دسته.
- ساختمان: فعلاً خطی؛ بعداً رندر ۳D.
- emblem: ایموجیِ انتخاب مالک می‌ماند، داخل مدال فولادی.

**شمشیر ⚔ بالا** (SVG کارتونی با دسته‌ی طلایی رد شد؛ مالک «واقعی و ماورایی» خواست → **رندر ۳D**). خط لوله‌ی پرتره (`mkport.py`/`dsess.py`)، خروجی 256² webp با alpha، داخل `.k-bezel` 56px با حلقه‌ی آمادگی. هر سه نمونه روی اسکرین‌شات واقعی خانه در ۵۶ و ۱۱۲px:
- **SW-A «تیغه‌ی رونی»:** `sword_mw.glb` عمودی، فولاد PBR، رون آبی emissive در شیار، قبضه‌ی کریستالی، مه یخ.
- **SW-B «دو شمشیر بر کریستال»:** `claymore.glb` + `sword.glb` ضربدری پشت کریستال Blue Wall (`gemgeo.js`)؛ نور لبه‌ی سرد، **بدون طلا**.
- **SW-C «شمشیر طیفی»:** تیغه‌ی شیشه/یخ (fresnel + additive)، قبضه‌ی فولادی، ذرات؛ sweep ماسک CSS هر ۶ ثانیه.

## ۳) زبان حرکت
**توکن‌ها:**
- easing:
  - `--e-out (.22,1,.36,1)` ورود
  - `--e-in (.55,0,1,.45)` خروج
  - `--e-std (.2,.8,.2,1)` جابه‌جایی
  - `--e-spring (.34,1.56,.64,1)` پاپ (سقف؛ `.2,2,.4,1` فعلی خیلی جهنده است)
- مدت: press 90 · xs 140 · s 220 · m 320 · l 480 · xl 700 ms

**قواعد:**
- فقط transform و opacity.
- خروج ≈ ۷۰٪ ورود.
- stagger 40ms، حداکثر ۸ آیتم.
- حلقه‌های بی‌پایان با Page باز، در نبرد و در idle-eco متوقف شوند.
- تنظیم جدید «حرکت کمتر».

| رویداد | عنصر | حرکت | مدت/easing | همراه |
|---|---|---|---|---|
| فشار دکمه | همه | scale .94→1 | 90 / 200 spring | haptic light (فقط دکمه‌ی اقدام) |
| Page باز/بسته | `.page` | translateY 24→0 + opacity | 320 out / 220 in | scrim 220، whoosh ملایم |
| شیت زمینه‌ای | شیت پایین | Y 100%→0، overshoot ≤1.03 | 320 out | فعلی `.45s…1.1` جهنده |
| تعویض تب | محتوا | crossfade + اسلاید 8px | 180 std | `selectionChanged` |
| toast | مسیر بالا | Y −12→0 + opacity | 220/180؛ ماندن ۲.۲s (خطا ۳s) | صف حداکثر ۲ |
| شمارش عدد | گیج، نتیجه | tween | `600+150·log10(Δ)` ≤1500، ease-out cubic | رقم عرض‌ثابت |
| پرواز جم | ۶–۱۲ `img.gem3` | قوس بزیه تا bezel، scale 1→.6 | 650 + 40 stagger، `(.5,0,.2,1)` | رسیدن: pop 240 spring + تیک + chime + haptic light هر سومی |
| ستاره‌ی نبرد | `.bwb-stars svg` | .4→1.25→1، −8° | 420 spring | chime زیر/زیرتر + haptic medium |
| توالی نتیجه | کارت | بنر 500 → ستاره 3×420 (از 350) → % 900 → لوت 900+پرواز → تلفات 220/40 → دکمه 240 | ≈ ۳.۲s؛ **تپ = رد شدن** | موسیقی −6dB |
| تعویض صحنه (R6) | veil | opacity | 450 / 650 std | duck صدا |
| جستجو/رژه % | حلقه | dashoffset + رقم | پیوسته؛ ۱۰۰٪ نگه 520 + رنگ ok | haptic success در found |
| اسکلت | کارت‌های Page | shimmer translateX | 1.2s تا جواب API | — |
| idle خانه | حلقه‌ی ⚔ (≥۸۰٪)، FULL، سازنده‌ی بیکار | opacity لایه‌ی glow / scale حلقه | 2.4 / 2 / 1.6 s | متوقف با Page یا idle-eco |
| انتخاب دسته | کارت | Y −8 | 160 spring | `selectionChanged` |
| استقرار | حلقه‌ی DOM روی تپ | scale .3→1، opacity 1→0 | 380 out | haptic light (≤۱ در 120ms) |
| اعلان CHARGE/50%/KEEP | `.bwb-ann` | فعلی + Cinzel + sweep فولادی | 2.2s | heavy برای KEEP |
| ارتقا تمام شد | بنر زیر نوار + هایلایت ساختمان | Y + opacity | 1.6s spring | success + sting |
| تپ روی غیرفعال | عنصر | لرزش x ±4px در ۳ سیکل | 240 linear | صدای error + haptic error + toast دلیل |

## ۴) لایه‌ی بازخورد (`feedback.js` + `uisfx.js`؛ سنتز WebAudio روی باس fx، بدون دانلود)
**API:** `fb.tap/select/ok/err(code)/reward(n)/warn/heavy` = صدا + haptic + toast اختیاری.
- محدودیت: haptic ≤۱ در 80ms، هر صدا ≤۱ در 60ms.
- `settings.haptics` و effects را رعایت می‌کند.
- تشخیص قابلیت با `tg.isVersionAtLeast('6.1')`.
- عامل A در A14 همین را برای اسپل‌ها مصرف کند.

| صدا | طرح | مدت |
|---|---|---|
| tap | تیک فولاد (noise بالاگذر + sine 1.8k) | 30ms |
| confirm | پنجم بالارونده (660→990) | 180ms |
| error | دو ضربه‌ی بم 180Hz | 160ms |
| reward | `audio.coins()` | 350ms |
| level-up | `sting()` کوتاه + زنگ | 1.2s |
| ستاره | 880/1108/1318 | 400ms |
| whoosh | noise فیلترشده −24dB | 200ms |
| تیک ۱۰ ثانیه‌ی آخر | کلیک بم | 40ms |

| رویداد | Telegram HapticFeedback |
|---|---|
| تعویض تب/segment، انتخاب دسته/اسپل | `selectionChanged()` |
| دکمه‌ی اقدام، استقرار، آموزش یک نیرو | `impactOccurred('light')` |
| Collect، کست اسپل، ستاره، شروع ارتقا | `impactOccurred('medium')` |
| نابودی KEEP، ستاره‌ی سوم، زلزله | `impactOccurred('heavy')` |
| حریف پیدا شد، ارتقا تمام، پیروزی | `notificationOccurred('success')` |
| «RETREAT?»، ۱۰ ثانیه‌ی آخر، شکست | `notificationOccurred('warning')` |
| کمبود جم، صف پر، خطای شبکه | `notificationOccurred('error')` |

**toast:** z 90 بالا، `max-width:86vw`، ۲ خط، انواع info/success/error با آیکن و لبه‌ی رنگی، صف ≤۲.

**متن ساده** (`WHY` → i18n):

| کد | متن جدید |
|---|---|
| `gems` | «Need 120 more rubies» (نام جم + کسری) |
| `army_full` | «Army camp full — upgrade the Training Ground» |
| `slow` | «One moment…» (تلاش خودکار، نه خطا) |
| `bad` | «That didn't work — try again» |
| `offline` | «No connection — check your internet» |
| `closed` | «Attacks open soon» |
| «Forging shaders/Warming up» | «Lighting the torches…» |

**حالت‌ها:**
- قفل: قفل SVG + «Barracks Lv 6».
- صف خالی: «Nothing training — tap a soldier».
- سازنده‌ی بیکار: «+» درخشان «Builder free».
- بدون ارتش: ⚔ کم‌رنگ؛ تپ = toast + باز شدن Army.

**تأییدها** (Dialog: عنوان، یک خط پیامد، اصلی/فرعی):
- Rush: hold-to-confirm (حلقه 600ms) در نوار، و Dialog اگر ≥50 فیروزه یا اولین بار در جلسه.
- Cancel ارتقای فعال: «You get back 50%».
- کیفیت: «The game will restart».
- عقب‌نشینی: همان دو-تپ، 44px + پرچم.

## ۵) ممیزی صفحه‌ها (فایل · selector · عیب → رفع)
**خانه `ui.js`**
- U1 `.bw-lvl`: 38px لمسی → 52px بدون scale + hit-slop؛ تپ = Profile. · U2 `.bw-g .pc` / `.full .pc` / `.ct small`: 7.7 / 6.1 / 7.4px → گیج فشرده با عدد 13px، بدون %؛ FULL = درخشش.
- U3 `.bw-gems{pointer-events:auto}` بی handler → ناحیه‌ی مرده حدود 125×96px روی نقشه → `none`. · U4 `.bw-toast` زیر `.bwa`/`.bwu` → مسیر toast با z 90.
- U5 `.bw-sheet` زیر `.bwa-btn`/`.bwu-btn`/`.bwa-chip` → کلاس `sheet-on` دکمه‌ها را پنهان کند؛ شیت در z 45. · U6 `.bw-sheet .chip` «Coming soon» → حذف.
- U7 `.bw-x` / `.bwu-x` 32px، `.bwa-x` 34px → 44px. · U8 `.bw-who .nm` فارسی: فونت سیستم و ellipsis غلط → `dir=auto` + `unicode-bidi:plaintext` + Vazirmatn.
- U9 seg کیفیت در `renderBody`: reload بدون تأیید → Dialog. · U10 `.bw-fps` زیر کنترل‌های fullscreen تلگرام → فقط مالک، زیر نوار.
- U11 `.bw-sheet` با `.45s…1.1` (جهنده) → 320 `--e-out`. · U12 `bwFull` (filter بی‌پایان ×3) → glow با opacity.
- U13 `showWelcome` هر بار ۹s → نسخه‌ی کوتاه برای ورود دوباره (تصمیم مالک).
**ارتش `armyui.js`**
- A1 `.bwa-btn` (برچسب صورتی `#ffe6e8`) → جایش ⚔ بالا. · A2 `.bwa-chip` 30px → حذف.
- A3 `.bwa-c .inf` 19px با Georgia italic → long-press کارت = اطلاعات. · A4 `.bwa-lane .rush` حدود 22px، بی‌تأیید → premium 36px + hold.
- A5 `.lock i` 🔒 → SVG. · A6 `.bwa-ft` «⚔ FIND A TARGET» قرمز → حذف؛ نمایش «Ready 87%».
- A7 `.bwa-em:after "✎"` → emblem به Profile. · A8 `bwaGleam` روی `left` → transform.
- A9 hold-to-repeat بی‌نشانه → حلقه‌ی پرشونده روی کارت. · A10 `font:700 13px/1 inherit` نامعتبر → weight و size جدا.
- A11 landscape: `.bwa-btn{transform:scale(.8)}` با `:active` بازنویسی می‌شود → پرش اندازه در فشار.
**نبرد `bhud.js`** (اجرای چیدمان با A16/A17، توکن‌ها از F)
- B1 `.bwb-end` 40px با ✕ قرمز مبهم → 44px + پرچم + «Retreat?» در تپ اول. · B2 `.bwb-hint`/`.bwb-next`/`.bwb-sp` هم‌پوشانی → hint قرص وسط با `max-width:calc(100% - 2×NEXT)`، ستون اسپل از sb+150.
- B3 `.bwb-sq .c .nm` 8.5px → حذف نام؛ نام در hint هنگام انتخاب. · B4 `.bwb-loot em` «LOOT» 9.5px خاکستری روی ۳D → لوت داخل `.k-plate` بالا.
- B5 `.bwb-stars svg path` و `.bwb-card .big svg path` (`#16233f`) → خالی = stroke 1.5 `--steel-300` + `fill:rgba(255,255,255,.06)`. · B6 `.bwb-next` نارنجی + NEXT قرمز نتیجه → secondary فولادی ⏭.
- B7 `.bwb-load` بی‌% → حلقه‌ی مشترک (F9). · B8 `.hb .cp`/`.hb u` با Arial «♥/✦» → SVG.
- B9 `.hb.low .fr` و `.bwb-loot.avail span` (box-shadow بی‌پایان) → opacity pseudo-glow. · B10 `.bwb` `--sl`/`--sr` بی content-safe-area → `:root` مشترک.
- B11 `.bwb-toast` (st+140) در برابر toast خانه (پایین) → مسیر واحد. · B12 بی‌haptic → `feedback.js`.
- B13 `showResults` `icon(t,18)` → پرتره‌ی 22px. · B14 HOME آبی، NEXT قرمز، و قفل `res.onclick=null` (=A1) → HOME اصلی + NEXT فرعی loading.
- B15 `.rows` «0:00» در عقب‌نشینی قبل از شروع → «—». · B16 `.bwb-sq` کارت آخر بریده (`a0` «Wi…») → محوشدن لبه.
- B17 `.bwb-ann` با Baskerville → Cinzel. · B18 `sq.scrollTo smooth` در هر تغییر sel → فقط وقتی کارت خارج از دید است.
**جستجو `search.js`**
- S1 tnum بی‌اثر → `digits()`. · S2 `.bws .x` حدود 32px → 44.
- S3 `TIPS` هر 1.1s → 2.4s. · S4 `done()` 700ms + نوار `bwb-load` = دو تصویر → حلقه‌ی پیوسته.
**کینگدام `upgradeui.js`**
- K1 `.bwu-btn` × `--hs` (50px، برچسب 6.7px) → حذف (Assist). · K2 `.bwu-cat` حدود 26px → 36px + hit-slop.
- K3 `button.rush` و Cancel بی‌تأیید → F20. · K4 `.bwu-tab small` 10px → 11px.
- K5 `bwuGleam` روی `left` → transform.
**لودر `web/index.html`**
- L1 `#msg` بی‌Retry → کارت خطای فارسی + «دوباره». · L2 تیپ‌های `main.js lateSequence` → متن داستانی.
**عمومی**
- G1 توکن‌ها (۱۷۶ رنگ ← حدود ۳۰). · G2 BackButton و تأیید بستن.
- G3 ایموجی‌ها. · G4 «حرکت کمتر».
- G5 رشته‌ها به `i18n.js` (آمادگی `fa`).

## ۶) آیتم‌های کار
| ID | عنوان | چرا | چگونه | done-test | ریسک | ساعت | P | وابسته |
|---|---|---|---|---|---|---|---|---|
| F1 | ممیزی خودکار UI | «هر تغییر با عکس/عدد» | `dev/uiqa.js` با `dq.sh`؛ حداقل ۴ بررسی: (۱) تعاملی ≥44 یا `data-hit`، (۲) فونت مؤثر ≥11 با scale تجمعی، (۳) تقاطع rect دکمه‌ها=۰، (۴) `elementFromPoint` روی toast با Page باز؛ به‌علاوه ایموجی و تضاد روی plate؛ خروجی JSON | گزارش پایه؛ صفر تخلف در H/Army/Build/B1/B2/B3 پس از بسته‌ها | کم | 2 | P0 | — |
| F2 | رفع فوری لایه/جریان | گیجی | z-index جدول؛ toast بالا بی nowrap؛ `sheet-on`؛ ستاره‌ی خالی؛ جای hint/NEXT/اسپل؛ `font` نامعتبر؛ `.bw-gems` بی pointer. (قفل نتیجه = **A1**؛ F فقط تست) | uiqa: toast دیده شود، هم‌پوشانی ۰؛ اسکرین‌شات a0 و e2ec_c دوباره | کم | 2.5 | P0 | F1 |
| F3 | safe-area یکپارچه + نمایش inset | هم‌پوشانی با Close/⋯ | `:root{--st:max(env(safe-area-inset-top), tg+content)…}` یک‌بار؛ حذف تعریف دوباره در bhud؛ ۸ مقدار در Settings→About (مالک) | عکس از Poco: عنوان زیر دکمه‌های تلگرام نیست؛ landscape notch | متوسط | 1.5 | P0 | — |
| F4 | توکن‌ها `theme.js` | یکدستی | تزریق در `main.js` پیش از `new UI`؛ جایگزینی مکانیکی hex/شعاع/سایه با `var()` (جم و دسته استثنا) | hex در ۵ فایل ≤۲۰؛ diff اسکرین‌شات فقط در رنگ‌های ادغام‌شده | کم | 3 | P0 | F1 |
| F5 | تایپوگرافی | خوانایی، فارسی، لرزش رقم | stack با Vazirmatn، Cinzel برای display، `digits()`، ۸ پله، حداقل 11px، `dir=auto` روی نام‌ها | uiqa فونت=۰؛ `document.fonts.check` روی نام فارسی؛ تایمر ۳ فریم با عرض ثابت | کم | 2 | P0 | F4 |
| F6 | لایه‌ی بازخورد | حس ساخته‌شده | `feedback.js` + `uisfx.js` طبق §۴؛ سیم‌کشی ui/armyui/upgradeui + نقاط نبرد (استقرار، ستاره، KEEP، پایان، found) | لاگ dev شمارش برای هر رویداد در `e2e_battle.py`؛ `sfxtest.py`: هر cue RMS>0 | کم | 3 | P0 | — |
| F7 | تلگرام Back/Closing/Settings | گم‌نشدن، از دست ندادن نبرد | `layers.js` (push/pop)؛ `BackButton.show/hide/onClick` → بستن لایه‌ی بالا؛ `enableClosingConfirmation` فقط در B2؛ `SettingsButton` → Settings | e2e رویداد `backButtonClicked` → Page بسته؛ در B2 `isClosingConfirmationEnabled=true` | متوسط | 1.5 | P0 | — |
| F8 | مشخصات اسپل A کوچک | خوانایی 18px | spec نسخه‌ی <28px برای **A6** (اجرا با A) | ورق 18/42/48/90/120 در A6 | کم | 0.5 | P0 | A6 |
| F9 | حلقه‌ی % مشترک | «هر انتظار درصد» | `ring.js` از `search.js`؛ B0 همان حلقه + emblem/نام/Lv؛ `ring.track(promise, expectMs)` برای انتظار >400ms؛ جایگزین `.bwb-load` | ضبط ۱۰Hz در جستجو و رژه: هیچ فریم بی‌% | کم | 2.5 | P0 | F4 |
| F10 | ۳ شمشیر رندر ۳D (سلیقه‌ای) | رد شمشیر قبلی | SW-A/B/C (§۲)؛ three.js headless؛ ترکیب روی اسکرین‌شات خانه. **جایگزین نمونه‌های SVG در A18** (فقط یک سری ۳تایی به مالک) | ۳ PNG، بدون ادغام | سلیقه | 3 | P0 | — |
| F11 | ۲ چیدمان خانه (سلیقه‌ای) | IA جدید | mock HTML روی اسکرین‌شات واقعی: A = ⚔ بالا-راست زیر جم‌ها، B = ⚔ بالا-وسط؛ هر دو با نوار + Assist | ۲ PNG در 390×844 + landscape | سلیقه | 2 | P0 | F4 |
| F12 | Assist + Page | «یک دکمه با زیرصفحه» | `assist.js`: هاب ۲×۴ (فقط قابلیت‌های موجود) + Page (هدر 44، تب، بدنه، footer)؛ `armyui.render`/`upgradeui.render` بی‌تغییر منطق داخل Page؛ حذف `.bwa-btn`، `.bwa-chip`، `.bwu-btn` | اسکرین‌شات H/هاب/Army/Build در 360/390/412 و landscape؛ uiqa ۰؛ `e2e_battle.py` و `intg3.py` سبز | **بالا** | 4 | P0 | F11 تأیید، F7 |
| F13 | نوار کار پایین | «build/train strip» | `strip.js`: سازنده‌ها (بیکار/مشغول + شمارش + نوار نازک)، صف هر خانواده، دم‌کردن؛ تپ → Page متمرکز؛ hold = rush | fixture: ۰/۳ مشغول و صف‌ها؛ متن ≥11؛ خانه ≥56×64 | متوسط | 4 | P0 | F12 |
| F14 | ⚔ بالا (رابط) | خواست مالک | `.k-bezel` 56px + حلقه‌ی آمادگی (`--p`) + شمشیر انتخابی؛ درخشش ≥۸۰٪؛ ارتش خالی → Army (رفتار تعهد = A18/A28) | اسکرین‌شات + لمس ۵۶ + e2e حمله | کم | 1.5 | P1 | F10، F12 |
| F15 | نوار بالا + Profile | هویت، نظم | نشان+نام (تپ → Profile: emblem، قدرت، تاریخ/ساعت، بعداً جام)؛ گیج فشرده | uiqa؛ اسکرین‌شات ۳ عرض | کم | 2.5 | P1 | F4، F5 |
| F16 | پاس توکن روی HUD نبرد | «حماسی از استاتوس» | اجرای B1–B18 با توکن‌ها، **روی ماکت مصوب A16**؛ تایمر `digits`؛ ستاره‌ی خالی؛ NEXT فولادی؛ محوشدن لبه؛ landscape | اسکرین‌شات B1/B2/۲۰ث آخر/landscape؛ تقاطع rect ‏hint/next/sp/sq=۰ | متوسط | 2.5 | P0 | F4، F9، A16 |
| F17 | پاس توکن روی نتیجه | «…تا آمار» | توالی §۳ و قواعد دکمه روی **A17**؛ پرتره‌ها؛ تپ = رد شدن | فریم t=0.5/1.5/3.5s + GIF | کم | 1.5 | P1 | F6، F18، A17 |
| F18 | پرواز پاداش + شمارش | جذابیت | `fly.js` (از نقطه‌ی صفحه یا جهان → bezel؛ ≤12 گره؛ transform)؛ Collect، بازگشت با لوت، ارتقا | trace: هیچ long task >16ms در پرواز | کم | 2 | P1 | F4 |
| F19 | شیت زمینه‌ای ساختمان | یک جای ثابت برای هر چیز | تپ ساختمان → شیت (Lv، ۱ اقدام، Details)؛ ادغام Collect و Upgrade معدن؛ تزئین = برچسب | e2e تپ keep/mine/house | متوسط | 3 | P1 | F12 |
| F20 | تأیید + متن ساده | جلوگیری از خرج تصادفی | Dialog؛ Rush/Cancel/کیفیت؛ بازنویسی `WHY` با جزئیات؛ انواع toast | e2e: Rush → Dialog؛ Cancel فعال → «50%» | کم | 2 | P1 | F2 |
| F21 | بهداشت حرکت | گرما + ظرافت | جایگزینی `left`/box-shadow/filter بی‌پایان؛ توقف در Page/نبرد/idle؛ «حرکت کمتر» | trace خانه idle ۱۰ث: Paint ≥۷۰٪ کمتر؛ FPS بدون افت | کم | 2 | P1 | F4 |
| F22 | آیکن واحد | سبک فولاد/شیشه | `icons.js`؛ حذف ایموجی‌های UI؛ مدال emblem (با عامل پرچم) | grep ایموجی در رشته‌های UI = فقط لیست emblem | کم | 2.5 | P1 | F4 |
| F23 | خوش‌آمد کوتاه (تصمیم) | سرعت ورود | کامل در اولین ورود روز، بعد ۱.۲s (`localStorage` با try) | ۱۰۰٪ تا تعامل ≤۲s در ورود دوباره | کم | 1 | P2 | — |
| F24 | coachmark | tutorial | spotlight (`box-shadow 0 0 0 9999px var(--scrim)`)، حلقه‌ی پالس، یک خط، دست اشاره؛ API برای A30 و عامل tutorial | ۳ گام نمونه | کم | 2 | P2 | F4، F21 |
| F25 | اسکلت + loading دکمه | «هیچ انتظار مرده» | shimmer در Pageها؛ حالت loading دکمه | اسکرین‌شات با API تأخیری (dev) | کم | 1.5 | P2 | F12 |
| F26 | رنگ دسته هماهنگ (سلیقه‌ای) | پالت مالک | `SQUAD_COLOR` با روشنایی برابر (OKLCH L≈.78، C≈.13)، هنوز متمایز؛ ۲ نمونه | ۲ PNG ارتش روی زمین + HUD | سلیقه | 1 | P2 | — |

## ۷) باگ‌هایی که حدس می‌زنم
- `ui.toast` بی‌صف است؛ toast تازه قبلی را پاک می‌کند. · toast با nowrap در 360px بیرون می‌زند («Army housing is full (upgrade the Training Ground)» حدود 390px). · `sq.scrollTo smooth` با اسکرول انگشت کاربر می‌جنگد.
- canvas خوش‌آمد فقط یک‌بار اندازه می‌گیرد → چرخش گوشی زیر کارت = کش‌آمدگی. · landscape: `:active` روی transform غلبه می‌کند → پرش اندازه‌ی دکمه‌ها. · `--hs` به هر عنصر تازه‌ی داخل `.bw-ui` که transform دارد ارث می‌رسد و آن را ناخواسته کوچک می‌کند.
- `armyui holdStart` (repeat تا 55ms) + `render()` کامل هر 600ms → jank روی گوشی ضعیف؛ render جزئی لازم است. · `setInterval`های ۱ ثانیه‌ای (`armyui`، `upgradeui` روی کل `[data-end]`، `badgeTick`) در نبرد هم کار می‌کنند → در نبرد متوقف شوند. · ایموجی emblem روی اندروید قدیمی tofu می‌شود → fallback SVG.
- تلگرام <8.0: نه fullscreen و content-safe-area صفر؛ چیدمان باید بدون آن هم درست باشد.

## ۸) بک‌لاگ ظرافت (به ترتیب «اثر دیداری ÷ ساعت»؛ عدد = ساعت)
- 1. toast بالای پنل‌ها 0.3 · 2. ستاره‌ی خالی دیده‌شونده 0.2 · 3. شکستن خط toast 0.1 · 4. حذف «Coming soon» 0.1 · 5. CSS `font` نامعتبر 0.1 · 6. فاصله‌ی hint/NEXT/اسپل 0.3
- 7. پنهان شدن دکمه‌ها زیر شیت 0.3 · 8. closing confirmation در نبرد 0.2 · 9. haptic نبرد 0.8 · 10. BackButton 1 · 11. گیج ≥11px 0.5 · 12. ✕ با 44px 0.3
- 13. Retreat 44 + پرچم 0.3 · 14. % در لودینگ نبرد 1 · 15. رقم عرض‌ثابت 0.5 · 16. Vazirmatn برای نام‌ها 0.3 · 17. NEXT فولادی و هم‌رنگ در B1/B3 0.3 · 18. زنگ ستاره 0.4
- 19. لرزش + دلیل در تپ غیرفعال 0.6 · 20. فشار یکدست با spring 0.5 · 21. پرتره در لیست نتیجه 0.4 · 22. تأیید Cancel فعال 0.4 · 23. Rush با hold 1 · 24. متن خطای دقیق 0.8
- 25. تیپ جستجو هر 2.4s 0.1 · 26. «Lighting the torches» 0.1 · 27. درخشش آمادگی ⚔ 0.3 · 28. انتخاب طلایی → یخی 0.4 · 29. gleam با transform 0.4 · 30. توقف انیمیشن‌های idle 0.4
- 31. SettingsButton تلگرام 0.3 · 32. محوشدن لبه‌ی نوار دسته 0.3 · 33. نام دسته در hint 0.3 · 34. لوت در plate بالا 0.8 · 35. اعلان Cinzel + sweep 0.4 · 36. رد شدن در توالی نتیجه 0.4
- 37. بنر «ارتقا تمام» + sting 1 · 38. پرواز جم در Collect 2 · 39. کارت خطای لودر با Retry 0.8 · 40. خوش‌آمد کوتاه 0.5 · 41. اسکلت Pageها 1 · 42. SVG به‌جای ♥ و ✦ 0.3
- 43. رنگ دسته‌ها 1 · 44. تأیید کیفیت 0.3 · 45. FPS فقط مالک 0.1 · 46. حلقه‌ی hold روی کارت ارتش 0.5 · 47. duck موسیقی در نتیجه 0.3 · 48. «Builder free» درخشان (در F13)

## ۹) ترتیب تحویل (فقط F؛ هر بسته حدود ۳–۴ ساعت، تجمعی و با یک دستور نصب)
| بسته | محتوا | ساعت تقریبی | شرط |
|---|---|---|---|
| F-p1 «تمیز و بی‌قفل» | F1 + F2 + F3 + F8 (بک‌لاگ ۱ تا ۸)؛ هم‌زمان با A-1 (A1) | ~3.5 | — |
| F-p2 «زبان مشترک» | F4 + F5 | ~3.5 | — |
| F-p3 «حس لمس» | F6 + F7 + بک‌لاگ ۱۸ و ۱۹ | ~3.5 | — |
| F-p4 «انتظار شفاف» | F9 + F16 | ~4 | بعد از ماکت مصوب A16 |
| F-p5 نمونه‌ها (بدون نصب، موازی) | F10 + F11 + F26 | ~3 | — |
| F-p6 «یک جریان» | F12 + F13 + F14 + F15 | ~4 + 3 | **بعد از تأیید مالک روی F10/F11** |
| F-p7 «پاداش» | F17 + F18 | ~3.5 | — |
| F-p8 | F19 + F20 + F22 | ~3.5 | — |
| F-p9 | F21 + F23 + F25 + F24 | ~3.5 | F24 با عامل tutorial |

دروازه‌ی هر بسته: `uiqa.js` صفر تخلف در صفحه‌های لمس‌شده، `e2e_battle.py`، `intg3.py`، `perf.py high` (draw call بدون تغییر؛ UI روی DOM است).

## ۱۰) نقد تصمیم‌ها و تعارض‌ها
1. **⚔ کوچک بالا** با الگوی CoC و Boom Beach (حمله بزرگ پایین‌چپ، در دسترس شست) در تضاد است و حلقه‌ی اصلی را کم‌رنگ می‌کند. احترام به خواست مالک + درخشش آمادگی؛ ورودی دوم حمله در نوار پایین **نباشد**.
2. **«Assist»** در انگلیسی یعنی «کمک». برچسب نهایی را مالک تأیید کند؛ پیش‌فرض: آیکن نشان قلعه + برچسب کوچک «ASSIST».
3. **زبان:** انگلیسی برای v5 می‌ماند (حس قرون‌وسطایی، تأییدشده)، ولی همه‌ی رشته‌ها به `i18n.js` بروند تا `fa` بعداً ممکن شود. خطاهای لودر فارسی بمانند، با همان قاب.
4. **قرمز برای حمله و NEXT** پالت را می‌شکند. کریمسون فقط برای خطر و ضرر. اگر مالک قرمز ⚔ بخواهد، فقط همان یک عنصر.
5. **ستون اسپل راست** (Clash Royale و CoC همه را پایین دارند) می‌ماند، چون ۱۹ نیرو + ۵ اسپل در یک نوار جا نمی‌شوند؛ با فاصله‌ی ثابت از نوار.
6. **پنل‌های تمام‌صفحه** حس «جای دیگری رفتم» می‌دهند → شیت زمینه‌ای برای ساختمان، Page فقط برای مدیریت.
7. **عمل‌کرد:**
   - هیچ `backdrop-filter`.
   - هیچ انیمیشن بی‌پایان روی paint.
   - حداکثر حدود ۴۰ نوار HP هم‌زمان.
   - پرواز جم حداکثر ۱۲ گره.
8. **مالکیت (برای ممیز):**
   - با A (یکسان‌سازی):
     - A1 قفل نتیجه → A.
     - A6 اسپل A → A؛ F8 فقط spec سایز کوچک.
     - A18 دکمه‌ی ⚔ → رفتار A، هنر F10. **یک سری ۳تایی رندر ۳D به مالک**، نه SVG — مالک «واقعی» خواسته و SVG فلزی تکرار همان سبک ردشده است.
     - A16/A17 ماکت و منطق HUD و نتیجه → A؛ F16/F17 فقط توکن، تایپ و حرکت.
     - A14 صدا و haptic اسپل → روی `feedback.js` از F6.
     - A30 آموزش حمله → coachmark از F24.
   - F فقط CSS، توکن‌ها، کامپوننت‌ها و متن را عوض می‌کند. منطق `battle.js`/`battlesim.js` مال عامل نبرد است. emblem و پرچم مال عامل P8 است.

**منابع:**
- [CoC wiki](https://clashofclans.fandom.com/wiki/Clan_Wars): اسکوت ۳۰ثانیه‌ای، NEXT با هزینه، نتیجه فقط «Return Home»، حمله پایین‌چپ.
- [Telegram Mini Apps — HapticFeedback](https://docs.telegram-mini-apps.com/packages/tma-js-sdk/features/haptic-feedback): `impactOccurred` (light/medium/heavy/rigid/soft)، `notificationOccurred`، `selectionChanged`.
- `web/tg.js`: رویدادهای `safeAreaChanged`، `contentSafeAreaChanged` و `fullscreenChanged`، و `enableClosingConfirmation` (≥6.2).
