# TP1 · یادداشت‌های بعد از G1 (۱۵ اکتبر ۱۷:۵۰)

## ۱) چهره‌ی ملیکا
- در ساخت G1 تکسچر **2K** انتخاب شد (توصیه‌ی من برای بودجه‌ی بازی). این اشتباه بود برای صورت: یافته‌ی قبلی (`RP0A_faces.md`) می‌گوید تکسچر **4K** صورت را واضح‌تر می‌کند و بعد برای بازی با LANCZOS به 2048 کوچک می‌شود و تقریباً همان کیفیت می‌ماند. پس: در Tripo تکسچر را **4K** بساز؛ من موقع ساخت بازی به 2048 کوچکش می‌کنم.
- ورودی‌ها 1024×1536 تمام‌قدند و صورت فقط حدود ۱۰۰–۱۵۰ پیکسل است؛ سقف جزئیات صورت همین است.
- در بازی صورت قهرمان تقریباً هیچ‌وقت دیده نمی‌شود (دوربین پشت اوست؛ پرتره‌ها ۲بعدی‌اند: `c_<key>.webp`). پس کار روی صورت اولویت پایین دارد.
- تست پیشنهادی در Tripo → Texture (۱۰ اعتبار): Texture Resolution **4K**، Remove Lighting روشن، ورودی = سه عکس (جلو، بغل، پشت). اگر خواست متن بنویسی:
  `photorealistic young woman, soft natural face, clean smooth skin, light brown-green eyes, defined eyebrows and eyelashes, natural lips, calm expression; keep the green layered robe, brown hooded cloak, herb belt with pouches and glass vials, leather vambraces, brown boots, dark brown curly hair with small white flowers; even lighting, no baked shadows`

## ۲) پرامپت انیمیشن (برای Tripo Studio؛ هر کدام یک کلیپ جدا، درجا، بدون حرکت ریشه)
بازی الان کلیپ jump را روی 0.40 ثانیه کش می‌دهد و بعد fall و land جدا می‌آیند؛ پس سه کلیپ جدا بهتر است.
1. **jump_up** — `Standing jump, in place. Quick crouch with knees bent and arms swung back, then an explosive take-off straight up with arms swinging forward and up, reaching the highest point with knees slightly tucked. Ends at the highest point, no landing. About 0.7 seconds. The character stays on the same spot, no forward movement.`
2. **fall** (loop) — `Falling through the air, in place, loopable: body upright, knees slightly bent, arms spread a little to the sides for balance, a gentle sway. 0.8 second loop. Same spot.`
3. **land** — `Landing from a jump, in place: feet touch the ground, knees bend to absorb the impact, torso leans forward a little, arms swing down, then slowly straighten back to standing. 0.6 seconds. Same spot.`
4. **climb_stairs** (loop) — `Walking up stairs, in place, loopable: steady pace, each step lifts the knee high, torso leaning slightly forward, arms swing lightly. Same spot, no forward movement. About 1.1 seconds for two steps.`
5. **climb_wall** (loop) — `Climbing up a vertical wall, in place, loopable: alternating hands reach up and grip, alternating feet push up, body close to the wall, facing the wall, steady rhythm. Same spot. About 1.2 seconds per cycle.`
خروجی: GLB با اسکلت (همان ریگ mixamo)، ایدئال یک فایل برای هر کلیپ.

## ۳) پنج خواهر دیگر
`TP1_paste_pics5.sh` ← ۱۵ عکس (جلو، پشت، بغل برای الینا، الیکا، مبینا، آیلین، آیلار) با لباس «نسخه‌ی بازی» (سلاح و همراه حذف، دامن/شنل کوتاه‌تر، پارچه‌ی شفاف مات). ≈ 0.8$. بعد برای هر کدام همان دستور G1: Multiview، H3.1، 20000 مثلث، تکسچر 4K، Remove Lighting، ریگ mixamo، idle/walk/run/jump. هزینه‌ی Tripo برای ملیکا ≈ 95 اعتبار (از دو اسکرین‌شات) ⇒ ۵ خواهر ≈ 475 اعتبار.

## v2 - عکس‌های هر ۶ خواهر (TP1_pics6.py / TP1_paste_pics6.sh)
تغییرات بعد از نقد مالک (الینا انیمیشنی‌تر از بقیه، شنل کوتاه، انار به جای المان):
- شنل برای هر ۶ خواهر: از شانه، چسبیده به بدن، تا زیر باسن (طول بالای ران). نه کوتاه‌تر، نه بلندتر. یک تکه پارچه، بدون موج.
- وسط کمر شنل = المان همون خواهر (همون آیکون‌های e_<key>.png بازی): الینا شعله‌ی طلایی-نارنجی، الیکا گردباد باد نقره‌ای، ملیکا جوانه‌ی تاک سبز، مبینا سه قله‌ی مسی، آیلین قطره + سه موج، آیلار دانه‌ی برف نقره‌ای.
- انار الینا فقط یک نشان کوچک ساده روی سینه موند (هویت). اگه نخواستی: FIX='no pomegranate on the chest'.
- لباس‌ها ساده: فقط اقلام لیست‌شده، بدون مهره/منگوله/زنجیر/آویز، همه پارچه‌ها مات و کدر (برای اینکه مدل سه‌بعدی نترکه).
- واقع‌گرایی: «عکس واقعی یک زن با لباس دست‌دوز در استودیو»، پوست طبیعی، بدون درخشش/جلوه‌ی جادویی، نه CGI نه انیمه. الینا دیگه شعله/شرر نداره (لبه‌ی شنل فقط کمی کهنه و سوخته مثل پارچه‌ی واقعی).
- چهره: دستور صریح «دقیقاً از کلوزآپ FACE شیت کپی کن»، چشم باز و رو به دوربین، حالت خنثی، مو پشت گوش.
- پشت/بغل با دو مرجع (شیت + عکس روبه‌رو). دوباره‌سازی یک عکس: ONLY=aylin VIEWS=back FIX='...' (جلو از دیسک استفاده می‌شه).
- خروجی روی blue18: /root/bw_art/tp1/v2/<name>/{front,back,side}.png ؛ قدیمی‌ها (tp1/<name>) دست نخورده‌ان.
- تست: سرور جعلی OpenAI + aiogram جعلی، ۱۸ عکس (۶ جلو یک‌مرجعی + ۱۲ پشت/بغل دومرجعی)، مسیر redo، و خود اسکریپت paste. روی blue18 واقعی اجرا نشده.
- هزینه: حدود ۰٫۰۵۵ دلار به‌ازای هر عکس، ۱۸ عکس ≈ ۱ دلار.

### کارت نیم‌تنه‌ی انتخاب پلیر (view چهارم: card)
- همون اسکریپت برای هر خواهر یک عکس چهارم هم می‌سازه: نیم‌تنه تا کمر، رو‌به‌دوربین، قاب ۴:۵ (همان نسبت c_<key>.webp بازی، ۳۲۰×۴۰۰)، صورت درشت (~یک‌چهارم قد عکس)، همان لباس ساده و شنل روی شانه‌ها (لبه‌اش دو طرف پیداست)، بدون سلاح (کارت‌های فعلی کمان/عصا/نیزه داشتن ولی مدل بازی نه)، پس‌زمینه‌ی خاکستری روشن مثل کارت‌های فعلی.
- مرجع: شیت + عکس روبه‌رو (همان پیمایش) تا لباس/صورت با سه‌نمای Tripo یکی باشه. المان روی کارت از قبل با e_<key>.png جدا نمایش داده می‌شه، پس روی نیم‌تنه نمی‌آید.
- اندازه: اول 1024x1280 (۴:۵ واقعی) می‌خواهد؛ اگر سرویس نپذیرفت خودکار به 1024x1536 می‌رود (بعداً برش).
- فقط کارت‌ها: `VIEWS=card` (اگر عکس روبه‌رو از قبل روی دیسک باشه ازش استفاده می‌کنه). یک کارت دوباره: `ONLY=aylin VIEWS=card FIX='...'`.
- تبدیل به فایل بازی: `python3 TP1_card_make.py OUTDIR elina=/path/elina_card.png ...` ← `c_<key>.webp` (320×400) و `c2_<key>.webp` (640×800). به درخت بازی چیزی نمی‌ریزه؛ با شماره‌ی مالک وارد می‌شه.
