# TR1_list — فهرست مدل‌های Blue Wall (راند ۱) — ۱۳ اکتبر ۲۰۲۶
کد: شاخه‌ی `code-p38` + overlay p41 (کیت v4، `GATE_W: ALL OK`). ممکنه چند بسته با سرور زنده فرق داشته باشه. شماره (#) = شماره‌ی روی شیت‌های `sheet_TR1_current_<دسته>.png`؛ فقط شماره بگو.
🔴 همین حالا عوض شه · 🟡 بعداً · 🟢 بمونه · 🔵 مدل نداره، جدید بسازیم. اولویت ۱ = بیشترین دیده‌شدن.

## یافته‌های مهم (قبل از خرید)
1. **قلعه، دیوار، برج، دروازه و پل‌ها GLB نیستن؛ با کد ساخته می‌شن** (`castle.js`: جعبه/استوانه + شیدر پوسته‌ی ۶تایی چوب/سنگ/آهن/طلا/الماس/کریستال). مدل Tripo جایگزین یعنی هر قطعه ۶ مدل (یکی برای هر پوسته) و تغییر کد بازی (لودر + کنار گذاشتن شیدر پوسته). این بخش تو راند ۴ (`TR1_swap.md`) نوشته می‌شه و کدش با چتِ ساخت بسته‌ست. عکس‌ها: `sheet_TR1_current_castle.png` (#1–#7).
2. **خونه‌ها دو منبع دارن:** (الف) ۱۲ خونه‌ی برنامه‌ریزی‌شده از `kit_homes.glb` (#8–#19): یه متریال رنگ ساده، ۱۸۸ تا ۹۰۴ مثلث؛ (ب) **~۱۰۹ خونه‌ی عمومی که از ماژول‌های دیوار/سقف/پنجره‌ی `kit_village` سر هم می‌شن** (#22؛ تعداد اصلی خونه‌ها اینه). چون تا ۱۰۹+ خونه هم‌زمان تو صحنه‌ست و بازی تو نمای بالا ~۳ میلیون مثلث داره، بودجه‌ی خونه رو از ۸k به **۲.۵k مثلث / ۲۵۰KB / ۱ متریال** کم کردم. ساختمون‌های شهر و تولید ≤۴k. جایگزین‌کردن ۱۰۹ خونه‌ی ماژولار یعنی چند مدل کامل خونه + راه جدید ساخت تو کد (`bakeVillage`).
3. **یه مدل سرباز (`ranger_m`، ۹٬۰۳۱ مثلث) پایه‌ی ۶+ نوع سربازه** (نیزه‌دار، شمشیرزن، نگهبان، کماندار، لژیونر، کاپیتان) با رنگ و تجهیزات جدا؛ صدها تا تو صحنه (#55). بودجه ۳k. انیمیشن‌هاش از `anims.glb`/`anims_army.glb` میاد و روی همین اسکلت کار می‌کنه؛ مدل Tripo اسکلت دیگه‌ای داره → انیمیشن‌ها باید روی اسکلت جدید منتقل بشن (`R1-retarget-report.md` تو پروژه هست). اول یه پایلوت.
4. **اژدها (`prowler`، #82) ۱۹٬۷۶۶ مثلثه (بودجه ۱۵k)** و نسخه‌های سه‌سر/بچه‌اژدها با کد از روی استخوان‌های خودش ساخته می‌شن (`bdragon3.js`: `Neck_66`, `Torso_118`…). جایگزینی‌ش به اسکلت هم‌نام یا بازنویسی اون کد بستگی داره → نه تو دسته‌ی اول. گریفین (#84) هم فقط هندسه‌ی glb رو می‌گیره و اسکلت/بال‌زدن با کده.
5. **ساختمون‌های تولید (اره‌خونه، سنگ‌بری، ذوب، ضرابخانه، پالایشگاه، نانوایی، قصابی، دودخونه، جواهری، انبارها) الان مدل ندارن** (برنامه‌ریزی شده ولی ساخته نشده؛ `WIRING_TODO`) — ردیف #46. جای خوبیه برای مدل‌های Tripo.
6. سبک فعلی: اروپایی قرون وسطایی (نیمه‌چوبی، سقف آبی، قلعه‌ی گوتیک) از پک‌های CC0 (KayKit/Quaternius/Kenney)، نه هخامنشی/ساسانی. قلعه و خونه‌ها بیشترین تغییر ظاهر رو می‌گیرن.
7. فایل‌های **بلااستفاده** (کد صداشون نمی‌زنه): an_llama, carrot, horse_saddle, horse_white, horseman, mangonel, twisted1, sword_mw, kit_ws_p3 (۴٫۳MB)، و tree1/tree2/pine3 مستقیم صدا زده نمی‌شن (#112). حذفشون حجم رو کم می‌کنه.
8. تو شیت‌ها: werewolf (#72) سیاه رندر شد (نور محیطِ خود بازی نبود)، ogre (#68) یه صفحه‌ی زمین همراهشه، treant (#71) و اژدها (#82) تو حالت استراحت اسکلت‌اند؛ هیچ‌کدوم خرابی مدل نیست. hill_giant و shieldmaiden هر دو ۱۱٬۹۸۸ مثلث‌اند (همون مش).
9. اسکریپت‌های رندر: `dev/tr1_sheet.html` + `tr1/sheet.py` (برای رندر کنار هم قدیمی/جدید تو راند ۳).

## جدول

### قلعه و دیوار — شیت `sheet_TR1_current_castle.png`
| # | نام | key | الان | کجا / چندتا | verdict | اولویت | بودجه‌ی جایگزین |
|---|---|---|---|---|---|---|---|
| 1 | قلعه‌ی اصلی (Keep) — ۶ پوسته: چوب/سنگ/آهن/طلا/الماس/کریستال آبی _کدساز: جعبه/استوانه‌ها + شیدر پوسته (castle.js, skin.js)_ | `castle_keep` | کدساز (بدون GLB) | هر دو · ۱ تا (ولی ۶ مدل لازمه) | 🔴 همین حالا | 1 | ≤20k tris · ≤2.5MB · ≤2 mat · rig no |
| 2 | تکه‌ی دیوار (ماژولار) — ۶ پوسته، ۳ حلقه _کدساز: wallRun() روی چندضلعی_ | `castle_wall` | کدساز (بدون GLB) | هر دو · صدها تکه | 🔴 همین حالا | 1 | ≤2k tris · ≤300KB · ≤1 mat · rig no |
| 3 | برج دیوار — ۶ پوسته _کدساز: tower()_ | `castle_tower` | کدساز (بدون GLB) | هر دو · ۲۰ تا ۴۰ | 🔴 همین حالا | 1 | ≤6k tris · ≤800KB · ≤2 mat · rig no |
| 4 | دروازه‌ی قلعه (دیوار داخلی/بیرونی) — ۶ پوسته _کدساز: gatehouse_ | `castle_gatehouse` | کدساز (بدون GLB) | هر دو · ۲ تا ۳ | 🔴 همین حالا | 1 | ≤6k tris · ≤800KB · ≤2 mat · rig no |
| 5 | دروازه‌ی شهر + پل روی خندق _کدساز: townGate()_ | `town_gate` | کدساز (بدون GLB) | هر دو · ۱ | 🟡 بعداً | 2 | ≤6k tris · ≤800KB · ≤2 mat · rig no |
| 6 | پل سنگی رودخانه _کدساز: riverBridge()_ | `river_bridge` | کدساز (بدون GLB) | هر دو · ۲ تا ۴ | 🟡 بعداً | 3 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |
| 7 | دروازه‌ی آبی / اسکله‌ی کانال _کدساز: waterGate(), riverQuay()_ | `water_gate` | کدساز (بدون GLB) | خونه · ۱ تا ۲ | 🟡 بعداً | 3 | ≤6k tris · ≤800KB · ≤2 mat · rig no |

### خونه‌ها — شیت `sheet_TR1_current_houses.png`
| # | نام | key | الان | کجا / چندتا | verdict | اولویت | بودجه‌ی جایگزین |
|---|---|---|---|---|---|---|---|
| 8 | کلبه — مدل 0 _روی بدنه + سقف A؛ از kit_homes_ | `house_cottage_0` | 204 tris · داخل kit_homes.glb (194 KB پک) · 1 mat · static | خونه · ۳۰ تا ۱۰۹ خونه تو صحنه | 🔴 همین حالا | 1 | ≤2.5k tris · ≤250KB · 1 mat · بی‌اسکلت (کم‌شده از ۸k) |
| 9 | کلبه — مدل 1 _روی بدنه + سقف A؛ از kit_homes_ | `house_cottage_1` | 188 tris · داخل kit_homes.glb (194 KB پک) · 1 mat · static | خونه · ۳۰ تا ۱۰۹ خونه تو صحنه | 🔴 همین حالا | 1 | ≤2.5k tris · ≤250KB · 1 mat · بی‌اسکلت (کم‌شده از ۸k) |
| 10 | کلبه — مدل 2 _روی بدنه + سقف A؛ از kit_homes_ | `house_cottage_2` | 218 tris · داخل kit_homes.glb (194 KB پک) · 1 mat · static | خونه · ۳۰ تا ۱۰۹ خونه تو صحنه | 🔴 همین حالا | 1 | ≤2.5k tris · ≤250KB · 1 mat · بی‌اسکلت (کم‌شده از ۸k) |
| 11 | خونه‌ی صنعتگر — مدل 0 _روی بدنه + سقف A؛ از kit_homes_ | `house_craftsman_0` | 446 tris · داخل kit_homes.glb (194 KB پک) · 1 mat · static | خونه · ۳۰ تا ۱۰۹ خونه تو صحنه | 🔴 همین حالا | 1 | ≤2.5k tris · ≤250KB · 1 mat · بی‌اسکلت (کم‌شده از ۸k) |
| 12 | خونه‌ی صنعتگر — مدل 1 _روی بدنه + سقف A؛ از kit_homes_ | `house_craftsman_1` | 422 tris · داخل kit_homes.glb (194 KB پک) · 1 mat · static | خونه · ۳۰ تا ۱۰۹ خونه تو صحنه | 🔴 همین حالا | 1 | ≤2.5k tris · ≤250KB · 1 mat · بی‌اسکلت (کم‌شده از ۸k) |
| 13 | خونه‌ی صنعتگر — مدل 2 _روی بدنه + سقف A؛ از kit_homes_ | `house_craftsman_2` | 446 tris · داخل kit_homes.glb (194 KB پک) · 1 mat · static | خونه · ۳۰ تا ۱۰۹ خونه تو صحنه | 🔴 همین حالا | 1 | ≤2.5k tris · ≤250KB · 1 mat · بی‌اسکلت (کم‌شده از ۸k) |
| 14 | خونه‌ی بازرگان — مدل 0 _روی بدنه + سقف A؛ از kit_homes_ | `house_merchant_0` | 552 tris · داخل kit_homes.glb (194 KB پک) · 1 mat · static | خونه · ۳۰ تا ۱۰۹ خونه تو صحنه | 🔴 همین حالا | 1 | ≤2.5k tris · ≤250KB · 1 mat · بی‌اسکلت (کم‌شده از ۸k) |
| 15 | خونه‌ی بازرگان — مدل 1 _روی بدنه + سقف A؛ از kit_homes_ | `house_merchant_1` | 482 tris · داخل kit_homes.glb (194 KB پک) · 1 mat · static | خونه · ۳۰ تا ۱۰۹ خونه تو صحنه | 🔴 همین حالا | 1 | ≤2.5k tris · ≤250KB · 1 mat · بی‌اسکلت (کم‌شده از ۸k) |
| 16 | خونه‌ی بازرگان — مدل 2 _روی بدنه + سقف A؛ از kit_homes_ | `house_merchant_2` | 498 tris · داخل kit_homes.glb (194 KB پک) · 1 mat · static | خونه · ۳۰ تا ۱۰۹ خونه تو صحنه | 🔴 همین حالا | 1 | ≤2.5k tris · ≤250KB · 1 mat · بی‌اسکلت (کم‌شده از ۸k) |
| 17 | عمارت اشراف — مدل 0 _روی بدنه + سقف A؛ از kit_homes_ | `house_noble_0` | 470 tris · داخل kit_homes.glb (194 KB پک) · 1 mat · static | خونه · ۳۰ تا ۱۰۹ خونه تو صحنه | 🔴 همین حالا | 1 | ≤2.5k tris · ≤250KB · 1 mat · بی‌اسکلت (کم‌شده از ۸k) |
| 18 | عمارت اشراف — مدل 1 _روی بدنه + سقف A؛ از kit_homes_ | `house_noble_1` | 693 tris · داخل kit_homes.glb (194 KB پک) · 1 mat · static | خونه · ۳۰ تا ۱۰۹ خونه تو صحنه | 🔴 همین حالا | 1 | ≤2.5k tris · ≤250KB · 1 mat · بی‌اسکلت (کم‌شده از ۸k) |
| 19 | عمارت اشراف — مدل 2 _روی بدنه + سقف A؛ از kit_homes_ | `house_noble_2` | 904 tris · داخل kit_homes.glb (194 KB پک) · 1 mat · static | خونه · ۳۰ تا ۱۰۹ خونه تو صحنه | 🔴 همین حالا | 1 | ≤2.5k tris · ≤250KB · 1 mat · بی‌اسکلت (کم‌شده از ۸k) |
| 20 | دودکش‌ها (۶ تا) | `house_chimneys` | 288 tris · داخل kit_homes.glb (194 KB پک) · 1 mat · static | خونه · روی هر خونه | 🟢 بمونه | 3 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |
| 21 | وسایل کنار خونه (بشکه، گاری، نیمکت، پرچم…) ۱۶ تا | `house_props` | 482 tris · داخل kit_homes.glb (194 KB پک) · 1 mat · static | خونه · زیاد، ریز | 🟢 بمونه | 3 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |
| 22 | خونه‌های عمومی شهر (~۱۰۹ تا) — از ماژول‌های دیوار/سقف/پنجره/در سر هم می‌شن _پک kit_village (۴۴ ماژول، بافت PBR واقعی)؛ آمار = کل پک؛ تو شیت فقط ۸ ماژول نمونه_ | `house_generic` | کل پک kit_village: 22,871 tris · 1439 KB · ۴۴ ماژول · 9 mat (+بافت) | خونه · ۱۰۹ تا (تا ۲۴۰ تو سطح بالا) | 🔴 همین حالا | 1 | ≤2.5k tris · ≤250KB · 1 mat · بی‌اسکلت (کم‌شده از ۸k) |

### شهر و تولید — شیت `sheet_TR1_current_civic.png`
| # | نام | key | الان | کجا / چندتا | verdict | اولویت | بودجه‌ی جایگزین |
|---|---|---|---|---|---|---|---|
| 23 | قهوه‌خانه / میخانه (tavern) _از kit_civic (نسخه‌ی آبی _b)_ | `civic_tavern` | 1,995 tris · داخل kit_civic.glb (388 KB پک) · 1 mat · static | خونه · ۱ تا ۲ | 🔴 همین حالا | 2 | ≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k) |
| 24 | عبادتگاه (chapel) _از kit_civic (نسخه‌ی آبی _b)_ | `civic_church` | 949 tris · داخل kit_civic.glb (388 KB پک) · 1 mat · static | خونه · ۱ | 🔴 همین حالا | 2 | ≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k) |
| 25 | تالار شهر (townhall) _از kit_civic (نسخه‌ی آبی _b)_ | `civic_hall` | 800 tris · داخل kit_civic.glb (388 KB پک) · 1 mat · static | خونه · ۱ | 🔴 همین حالا | 2 | ≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k) |
| 26 | تالار بازار _از kit_civic (نسخه‌ی آبی _b)_ | `civic_markethall` | 1,183 tris · داخل kit_civic.glb (388 KB پک) · 1 mat · static | خونه · ۱ | 🟡 بعداً | 2 | ≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k) |
| 27 | برج ساعت شهر _از kit_civic (نسخه‌ی آبی _b)_ | `civic_tower` | 934 tris · داخل kit_civic.glb (388 KB پک) · 1 mat · static | خونه · ۱ | 🟡 بعداً | 3 | ≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k) |
| 28 | ساختمان فرعی شهر _از kit_civic (نسخه‌ی آبی _b)_ | `civic_wing` | 919 tris · داخل kit_civic.glb (388 KB پک) · 1 mat · static | خونه · ۱ تا ۲ | 🟡 بعداً | 3 | ≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k) |
| 29 | چاه / آب‌انبار _از kit_civic (نسخه‌ی آبی _b)_ | `civic_well` | 454 tris · داخل kit_civic.glb (388 KB پک) · 1 mat · static | خونه · ۱ تا ۳ | 🟡 بعداً | 3 | ≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k) |
| 30 | غرفه‌های بازار (۵ نوع) | `civic_stalls` | 5,643 tris · داخل kit_civic.glb (388 KB پک) · 1 mat · static | خونه · ۵ تا ۱۵ | 🟡 بعداً | 3 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |
| 31 | وسایل بازار (بشکه، جعبه، چراغ، میز…) | `civic_props` | 2,292 tris · داخل kit_civic.glb (388 KB پک) · 1 mat · static | خونه · زیاد، ریز | 🟢 بمونه | 3 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |
| 32 | چوب‌بری _از kit_ws_ | `ws_lumbermill` | 2,012 tris · داخل kit_ws.glb (1560 KB پک) · 17 mat · static | خونه · ۱ تا ۳ (جاهای کار) | 🟡 بعداً | 2 | ≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k) |
| 33 | آهنگری (کارگاه) _از kit_ws_ | `ws_smithy` | 1,600 tris · داخل kit_ws.glb (1560 KB پک) · 17 mat · static | خونه · ۱ تا ۳ (جاهای کار) | 🟡 بعداً | 2 | ≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k) |
| 34 | کارگاه نوشیدنی _از kit_ws_ | `ws_brewhouse` | 2,278 tris · داخل kit_ws.glb (1560 KB پک) · 17 mat · static | خونه · ۱ تا ۳ (جاهای کار) | 🟡 بعداً | 2 | ≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k) |
| 35 | کلبه‌ی کارگر _از kit_ws_ | `ws_hut` | 975 tris · داخل kit_ws.glb (1560 KB پک) · 17 mat · static | خونه · ۱ تا ۳ (جاهای کار) | 🟡 بعداً | 3 | ≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k) |
| 36 | بازار (ساختمون) _از kit_ws_ | `ws_market` | 1,774 tris · داخل kit_ws.glb (1560 KB پک) · 17 mat · static | خونه · ۱ تا ۳ (جاهای کار) | 🟡 بعداً | 2 | ≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k) |
| 37 | قصابی _از kit_ws_ | `ws_butcher` | 4,485 tris · داخل kit_ws.glb (1560 KB پک) · 17 mat · static | خونه · ۱ تا ۳ (جاهای کار) | 🟡 بعداً | 3 | ≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k) |
| 38 | اسکله _از kit_ws_ | `ws_jetty` | 3,700 tris · داخل kit_ws.glb (1560 KB پک) · 17 mat · static | خونه · ۱ تا ۳ (جاهای کار) | 🟡 بعداً | 3 | ≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k) |
| 39 | چوب‌ماهی خشک‌کن _از kit_ws_ | `ws_fishrack` | 2,721 tris · داخل kit_ws.glb (1560 KB پک) · 17 mat · static | خونه · ۱ تا ۳ (جاهای کار) | 🟢 بمونه | 3 | ≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k) |
| 40 | انبار بزرگ مزرعه _از kit_ws (مزرعه)_ | `farm_barn` | 2,176 tris · داخل kit_ws.glb (1560 KB پک) · 17 mat · static | خونه · ۱ تا ۲ | 🟡 بعداً | 2 | ≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k) |
| 41 | انبار کوچیک _از kit_ws (مزرعه)_ | `farm_smallbarn` | 1,664 tris · داخل kit_ws.glb (1560 KB پک) · 17 mat · static | خونه · ۱ تا ۲ | 🟡 بعداً | 3 | ≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k) |
| 42 | سایبون مزرعه _از kit_ws (مزرعه)_ | `farm_openbarn` | 1,520 tris · داخل kit_ws.glb (1560 KB پک) · 17 mat · static | خونه · ۱ تا ۲ | 🟢 بمونه | 3 | ≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k) |
| 43 | سیلو _از kit_ws (مزرعه)_ | `farm_silo` | 1,525 tris · داخل kit_ws.glb (1560 KB پک) · 17 mat · static | خونه · ۱ تا ۲ | 🟡 بعداً | 3 | ≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k) |
| 44 | مرغدونی _از kit_ws (مزرعه)_ | `farm_coop` | 914 tris · داخل kit_ws.glb (1560 KB پک) · 17 mat · static | خونه · ۱ تا ۲ | 🟢 بمونه | 3 | ≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k) |
| 45 | مرحله‌های ساخت + داربست (۴ تا) | `ws_construction` | 4,950 tris · داخل kit_ws.glb (1560 KB پک) · 17 mat · static | خونه · موقع ساخت | 🟢 بمونه | 3 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |
| 46 | ساختمون‌های تولید (اره‌خونه، سنگ‌بری، ذوب، ضرابخانه، پالایشگاه، نانوایی، قصابی، دودخانه، جواهری، انبارها) — ۱۰ نوع _الان مدلی ندارن: پر کردن این خلأ با مدل Tripo_ | `production_lots_missing` | کدساز (بدون GLB) | خونه · برنامه‌ریزی شده ولی ساخته نشده (WIRING_TODO) | 🔵 جدید (مدل نداره) | 2 | ≤8k tris · ≤1.0MB · ≤2 mat · rig no |

### معدن و آسیاب — شیت `sheet_TR1_current_mines.png`
| # | نام | key | الان | کجا / چندتا | verdict | اولویت | بودجه‌ی جایگزین |
|---|---|---|---|---|---|---|---|
| 47 | معدن‌های جواهر (یاقوت، زمرد، فیروزه) — ۳ تا _کدساز (mines.js) + صخره‌ی cliff1/2 + کریستال_ | `gem_mines` | کدساز (بدون GLB) | خونه · ۳ | 🟡 بعداً | 2 | ≤8k tris · ≤1.0MB · ≤2 mat · rig no |
| 48 | معدن ساده‌ی کارگاه (ws_mine) _از kit_ws_ | `ws_mine` | 1,100 tris · داخل kit_ws.glb (1560 KB پک) · 17 mat · static | خونه · ۱ تا ۲ | 🟡 بعداً | 3 | ≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k) |
| 49 | آسیاب بادی (windmill2) | `windmill` | 4,321 tris · 158 KB · 1 mat · 14 bones/1 clips | خونه · ۱ (نشونه‌ی نقشه) | 🟡 بعداً | 2 | ≤8k tris · ≤1.0MB · ≤2 mat · rig no |
| 50 | آسیاب آبی (watermill) | `watermill` | 9,302 tris · 338 KB · 1 mat · static | خونه · ۱ | 🟡 بعداً | 2 | ≤8k tris · ≤1.0MB · ≤2 mat · rig no |
| 51 | آهنگری روستا (blacksmith) _bbox خیلی بزرگ؛ مقیاس در کد تنظیم می‌شه_ | `blacksmith` | 16,099 tris · 983 KB · 7 mat · static | خونه · ۱ | 🟡 بعداً | 2 | ≤8k tris · ≤1.0MB · ≤2 mat · rig no |
| 52 | برج دیدبانی (watchtower) | `watchtower` | 10,544 tris · 415 KB · 6 mat · static | هر دو · چندتا روی دیوار | 🟡 بعداً | 2 | ≤6k tris · ≤800KB · ≤2 mat · rig no |
| 53 | ساختمان‌های kit_hex (آسیاب، چاه، بازار، آهنگر، انبار غله) ۶ تا _سبک Kenney (کارتونی‌تر)_ | `hex_buildings` | 11,065 tris · داخل kit_hex.glb (264 KB پک) · 1 mat · static | خونه · لود می‌شه؛ مصرفش رو نگرفتم | 🟡 بعداً | 3 | ≤8k tris · ≤1.0MB · ≤2 mat · rig no |
| 54 | وسایل معدن (واگن، سنگ معدن، شمش، چرخ‌آب) | `ws_mining_props` | 2,622 tris · داخل kit_ws.glb (1560 KB پک) · 17 mat · static | خونه · ریز | 🟢 بمونه | 3 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |

### پیاده و کماندار — شیت `sheet_TR1_current_infantry.png`
| # | نام | key | الان | کجا / چندتا | verdict | اولویت | بودجه‌ی جایگزین |
|---|---|---|---|---|---|---|---|
| 55 | سرباز پایه (ranger_m) — نیزه‌دار، شمشیرزن، نگهبان، کماندار، لژیونر، کاپیتان _یه مدل برای ۶+ نوع سرباز؛ رنگ و تجهیزات روش سوار می‌شه؛ انیمیشن‌ها از anims.glb_ | `soldier_base` | 9,031 tris · 363 KB · 2 mat · 585 bones/0 clips | هر دو · صدها تا (ازدحام) | 🔴 همین حالا | 1 | ≤3k tris · ≤300KB · ≤3 mat · rig biped |
| 56 | رنجر زن (ranger_f) _ارتش خونه (units.js)_ | `ranger_f` | 9,093 tris · 365 KB · 2 mat · 585 bones/0 clips | خونه · ده‌ها | 🟡 بعداً | 2 | ≤3k tris · ≤300KB · ≤3 mat · rig biped |
| 57 | روستایی مرد (peasant_m) | `villager_m` | 6,445 tris · 232 KB · 2 mat · 260 bones/0 clips | خونه · ده‌ها | 🟡 بعداً | 3 | ≤3k tris · ≤300KB · ≤3 mat · rig biped |
| 58 | روستایی زن (peasant_f) | `villager_f` | 6,784 tris · 199 KB · 1 mat · 260 bones/0 clips | خونه · ده‌ها | 🟡 بعداً | 3 | ≤3k tris · ≤300KB · ≤3 mat · rig biped |
| 59 | دختر سپردار (shieldmaiden) _قهرمان‌های خواهر (RP0A) جداست و دست نمی‌خوره_ | `shieldmaiden` | 11,988 tris · 539 KB · 6 mat · 845 bones/0 clips | نبرد · ده‌ها | 🟡 بعداً | 2 | ≤3k tris · ≤300KB · ≤3 mat · rig biped |
| 60 | لیچ / جادوگر اسکلتی (skel_mage) | `skeleton_mage` | 4,588 tris · 106 KB · 2 mat · 184 bones/0 clips | نبرد · ده‌ها | 🟡 بعداً | 2 | ≤3k tris · ≤300KB · ≤3 mat · rig biped |
| 61 | ایمپ (imp) | `imp` | 8,199 tris · 226 KB · 1 mat · 275 bones/0 clips | نبرد · ده‌ها | 🟡 بعداً | 2 | ≤3k tris · ≤300KB · ≤3 mat · rig biped |
| 62 | پاگلین (puglin) | `puglin` | 6,054 tris · 221 KB · 1 mat · 165 bones/0 clips | خونه · چندتا | 🟡 بعداً | 3 | ≤3k tris · ≤300KB · ≤3 mat · rig biped |
| 63 | غول تپه (hill_giant) | `hill_giant` | 11,988 tris · 489 KB · 7 mat · 585 bones/0 clips | نبرد · چندتا | 🟡 بعداً | 2 | ≤8k tris · ≤900KB · ≤3 mat · rig yes |
| 64 | شمشیرها (sword، claymore، sword_mw) _تا وقتی بدنه‌ی سرباز عوض نشده بمونه_ | `gear_swords` | 3,443 tris · 96 KB · 11 mat · static | نبرد · روی هر سرباز | 🟢 بمونه | 3 | ≤1k tris · ≤150KB · ≤1 mat · rig no |
| 65 | سپرها (shield، heater، round2) | `gear_shields` | 4,556 tris · 164 KB · 12 mat · static | نبرد · روی هر سرباز | 🟢 بمونه | 3 | ≤1k tris · ≤150KB · ≤1 mat · rig no |
| 66 | کلاه‌خودها (helmet2، helmet3) | `gear_helmets` | 1,428 tris · 37 KB · 4 mat · static | نبرد · روی هر سرباز | 🟢 بمونه | 3 | ≤1k tris · ≤150KB · ≤1 mat · rig no |
| 67 | نیزه، کمان، تبر، چکش، عصا، مشعل | `gear_polearms` | 7,119 tris · 200 KB · 12 mat · static | نبرد · روی هر سرباز | 🟢 بمونه | 3 | ≤1k tris · ≤150KB · ≤1 mat · rig no |

### موجودات و مرکب — شیت `sheet_TR1_current_creatures.png`
| # | نام | key | الان | کجا / چندتا | verdict | اولویت | بودجه‌ی جایگزین |
|---|---|---|---|---|---|---|---|
| 68 | غول (ogre) | `ogre` | 10,289 tris · 928 KB · 2 mat · 364 bones/6 clips | نبرد · چندتا | 🟡 بعداً | 2 | ≤8k tris · ≤900KB · ≤3 mat · rig yes |
| 69 | ترول (troll) | `troll` | 10,467 tris · 1607 KB · 4 mat · 702 bones/5 clips | نبرد · چندتا | 🟡 بعداً | 2 | ≤8k tris · ≤900KB · ≤3 mat · rig yes |
| 70 | سیکلوپ (cyclops) _فقط تو LATE لود می‌شه؛ مصرفش رو پیدا نکردم_ | `cyclops` | 7,009 tris · 479 KB · 4 mat · 285 bones/1 clips | نبرد · چندتا؟ | 🟡 بعداً | 3 | ≤8k tris · ≤900KB · ≤3 mat · rig yes |
| 71 | درخت‌مرد (treant) | `treant` | 7,724 tris · 794 KB · 1 mat · 98 bones/4 clips | نبرد · چندتا | 🟡 بعداً | 2 | ≤8k tris · ≤900KB · ≤3 mat · rig yes |
| 72 | گرگینه (werewolf) | `werewolf` | 2,524 tris · 395 KB · 1 mat · 60 bones/7 clips | نبرد · ده‌ها | 🟡 بعداً | 2 | ≤8k tris · ≤900KB · ≤3 mat · rig yes |
| 73 | گرگ (wolf) | `wolf` | 1,962 tris · 480 KB · 4 mat · 51 bones/7 clips | خونه · شب‌ها چندتا | 🟢 بمونه | 3 | ≤8k tris · ≤900KB · ≤3 mat · rig yes |
| 74 | شوالیه‌ی سوار (knight_k3) _سوار روی همه‌ی اسب‌ها؛ حالت سواری ثابت_ | `knight_rider` | 10,493 tris · 465 KB · 3 mat · 520 bones/1 clips | هر دو · ده‌ها | 🔴 همین حالا | 2 | ≤8k tris · ≤900KB · ≤3 mat · rig yes |
| 75 | اسب خاکستری (horse_m2m_grey) | `horse_grey` | 6,018 tris · 901 KB · 2 mat · 56 bones/11 clips | هر دو · ده‌ها | 🔴 همین حالا | 2 | ≤8k tris · ≤900KB · ≤3 mat · rig yes |
| 76 | اسب بور (horse_m2m_bay) | `horse_bay` | 6,018 tris · 874 KB · 2 mat · 56 bones/11 clips | هر دو · ده‌ها | 🟡 بعداً | 2 | ≤8k tris · ≤900KB · ≤3 mat · rig yes |
| 77 | اسب سیاه (horse_m2m_black) | `horse_black` | 6,018 tris · 845 KB · 2 mat · 56 bones/11 clips | هر دو · چندتا | 🟡 بعداً | 2 | ≤8k tris · ≤900KB · ≤3 mat · rig yes |
| 78 | اسب زره‌دار (horse_hq_barded) | `horse_barded` | 12,134 tris · 813 KB · 2 mat · 50 bones/12 clips | خونه · چندتا | 🟡 بعداً | 3 | ≤8k tris · ≤900KB · ≤3 mat · rig yes |
| 79 | اسب قدیمی (horse، مرتع) | `horse_old` | 2,182 tris · 552 KB · 8 mat · 50 bones/7 clips | خونه · چندتا | 🟢 بمونه | 3 | ≤8k tris · ≤900KB · ≤3 mat · rig yes |
| 80 | گاو (cow) | `cow` | 2,450 tris · 499 KB · 7 mat · 42 bones/7 clips | خونه · چندتا | 🟢 بمونه | 3 | ≤8k tris · ≤900KB · ≤3 mat · rig yes |
| 81 | گوسفند و خوک (an_sheep, an_pig) | `farm_small` | 1,172 tris · 290 KB · 4 mat · 24 bones/2 clips; 24 bones/2 clips | خونه · چندتا | 🟢 بمونه | 3 | ≤8k tris · ≤900KB · ≤3 mat · rig yes |

### اژدها و پرنده — شیت `sheet_TR1_current_dragons.png`
| # | نام | key | الان | کجا / چندتا | verdict | اولویت | بودجه‌ی جایگزین |
|---|---|---|---|---|---|---|---|
| 82 | اژدها (prowler) — اژدهای گشت + baby/dragon/سه‌سر تو نبرد _نسخه‌ی ۳ سر با کد از همین ساخته می‌شه (bdragon3.js)_ | `dragon_prowler` | 19,766 tris · 1357 KB · 3 mat · 252 bones/2 clips | هر دو · ۱ تا چندتا | 🔴 همین حالا | 1 | ≤15k tris · ≤1.5MB · ≤3 mat · rig yes |
| 83 | اژدهاچه (dragonling) | `dragonling` | 7,438 tris · 177 KB · 4 mat · 46 bones/8 clips | هر دو · ۲ | 🔴 همین حالا | 2 | ≤15k tris · ≤1.5MB · ≤3 mat · rig yes |
| 84 | گریفین (gryphon) _اسکلت و بال‌زدن با کد (bgryphon.js)؛ فقط هندسه‌ی glb_ | `gryphon` | 3,074 tris · 269 KB · 9 mat · 390 bones/1 clips | نبرد · ده‌ها | 🔴 همین حالا | 2 | ≤15k tris · ≤1.5MB · ≤3 mat · rig yes |
| 85 | پگاسوس (pegasus) | `pegasus` | 7,590 tris · 1063 KB · 2 mat · 84 bones/3 clips | هر دو · ده‌ها | 🟡 بعداً | 2 | ≤15k tris · ≤1.5MB · ≤3 mat · rig yes |
| 86 | عقاب (eagle) | `eagle` | 3,128 tris · 184 KB · 1 mat · 52 bones/1 clips | خونه · چندتا | 🟡 بعداً | 3 | ≤8k tris · ≤900KB · ≤3 mat · rig yes |
| 87 | کلاغ (crow) | `crow` | 878 tris · 138 KB · 2 mat · 59 bones/1 clips | خونه · چندتا | 🟢 بمونه | 3 | ≤8k tris · ≤900KB · ≤3 mat · rig yes |

### طبیعت — شیت `sheet_TR1_current_nature.png`
| # | نام | key | الان | کجا / چندتا | verdict | اولویت | بودجه‌ی جایگزین |
|---|---|---|---|---|---|---|---|
| 88 | کاج‌های جنگل (ez_pine_a/b/c) _جنگل با کارت‌های ایمپاستر از این‌ها ساخته می‌شه (trees.js)_ | `trees_pine_ez` | 10,583 tris · 989 KB · 6 mat · static | خونه · هزاران (ایمپاستر) | 🟡 بعداً | 2 | ≤1k tris · ≤200KB · ≤1 mat · rig no |
| 89 | درخت‌های پهن‌برگ (ez_oak_a/b، ash، aspen) | `trees_broad_ez` | 17,099 tris · 1369 KB · 8 mat · static | خونه · هزاران (ایمپاستر) | 🟡 بعداً | 2 | ≤1k tris · ≤200KB · ≤1 mat · rig no |
| 90 | بوته‌ها (ez_bush_a/b، bush، bushf) | `bushes_ez` | 7,118 tris · 840 KB · 7 mat · static | خونه · هزاران | 🟢 بمونه | 3 | ≤1k tris · ≤200KB · ≤1 mat · rig no |
| 91 | درخت‌های پراکنده (tree1–5، pine1–5) _tree1، tree2، pine3 مستقیم صدا زده نمی‌شن_ | `trees_scatter` | 21,548 tris · 915 KB · 14 mat · static | خونه · صدها | 🟢 بمونه | 3 | ≤1k tris · ≤200KB · ≤1 mat · rig no |
| 92 | علف، گل، سرخس، شبدر، قارچ (۹ فایل) | `ground_cover` | 5,087 tris · 472 KB · 11 mat · static | خونه · ده‌ها هزار | 🟢 بمونه | 3 | ≤1k tris · ≤200KB · ≤1 mat · rig no |
| 93 | سنگ و ریگ (rock1–3، pebble1–2) | `rocks` | 1,372 tris · 148 KB · 5 mat · static | خونه · هزاران | 🟢 بمونه | 3 | ≤1k tris · ≤200KB · ≤1 mat · rig no |
| 94 | صخره‌ها (rockset1–2، cliff1–2) | `rocksets_cliffs` | 15,475 tris · 1766 KB · 4 mat · static | خونه · ده‌ها | 🟢 بمونه | 3 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |
| 95 | محصولات مزرعه (ذرت، کلم، کدو، هویج، بقچه‌ی کاه) | `crops` | 8,840 tris · 261 KB · 11 mat · static | خونه · مزرعه | 🟢 بمونه | 3 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |

### تله، محاصره، وسایل — شیت `sheet_TR1_current_traps.png`
| # | نام | key | الان | کجا / چندتا | verdict | اولویت | بودجه‌ی جایگزین |
|---|---|---|---|---|---|---|---|
| 96 | برج تسلا (tesla) _از kit_def_ | `def_tesla` | 8,378 tris · داخل kit_def.glb (797 KB پک) · 7 mat · static | هر دو · ۱ تا ۱۰ | 🟡 بعداً | 2 | ≤6k tris · ≤800KB · ≤2 mat · rig no |
| 97 | دروازه‌خونه‌ی دفاعی (df_gatehouse) _از kit_def_ | `def_gatehouse` | 4,159 tris · داخل kit_def.glb (797 KB پک) · 7 mat · static | هر دو · ۱ تا ۱۰ | 🟡 بعداً | 2 | ≤6k tris · ≤800KB · ≤2 mat · rig no |
| 98 | منجنیق‌کمان دفاعی (df_ballista) _از kit_def_ | `def_ballista` | 4,590 tris · داخل kit_def.glb (797 KB پک) · 7 mat · static | هر دو · ۱ تا ۱۰ | 🟡 بعداً | 2 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |
| 99 | برج دیده‌بانی دفاعی _از kit_def_ | `def_watchtower` | 446 tris · داخل kit_def.glb (797 KB پک) · 7 mat · static | هر دو · ۱ تا ۱۰ | 🟡 بعداً | 3 | ≤6k tris · ≤800KB · ≤2 mat · rig no |
| 100 | کمان‌پران (crossbow) _از kit_def_ | `def_crossbow` | 2,074 tris · داخل kit_def.glb (797 KB پک) · 7 mat · static | هر دو · ۱ تا ۱۰ | 🟡 بعداً | 3 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |
| 101 | سنگ آتش _از kit_def_ | `def_firestone` | 2,122 tris · داخل kit_def.glb (797 KB پک) · 7 mat · static | هر دو · ۱ تا ۱۰ | 🟢 بمونه | 3 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |
| 102 | آتشدان‌ها _از kit_def_ | `def_brazierpair` | 2,016 tris · داخل kit_def.glb (797 KB پک) · 7 mat · static | هر دو · ۱ تا ۱۰ | 🟢 بمونه | 3 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |
| 103 | تله‌ها (خرس‌گیر، مین، اره، چاله، خارپشت، بشکه، گلوله‌ی خاردار…) ۱۱ تا | `def_traps` | 11,094 tris · داخل kit_def.glb (797 KB پک) · 7 mat · static | هر دو · ده‌ها | 🟢 بمونه | 3 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |
| 104 | منجنیق (catapult) | `catapult` | 6,086 tris · 280 KB · 2 mat · static | نبرد · چندتا | 🟡 بعداً | 2 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |
| 105 | کوبنده (ram) | `ram` | 1,926 tris · 92 KB · 1 mat · static | نبرد · چندتا | 🟡 بعداً | 2 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |
| 106 | تریبوشه (trebuchet) | `trebuchet` | 1,671 tris · 142 KB · 2 mat · 16 bones/5 clips | نبرد · چندتا | 🟡 بعداً | 2 | ≤8k tris · ≤900KB · ≤3 mat · rig yes |
| 107 | برج محاصره | `siege_tower` | 1,258 tris · 80 KB · 1 mat · static | نبرد · چندتا | 🟡 بعداً | 2 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |
| 108 | توپ (cannon) | `cannon` | 4,107 tris · 256 KB · 2 mat · static | نبرد · چندتا | 🟡 بعداً | 2 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |
| 109 | بالیستا (ballista) | `ballista_unit` | 1,758 tris · 80 KB · 1 mat · static | هر دو · چندتا | 🟡 بعداً | 3 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |
| 110 | وسایل شهر (بشکه، جعبه، گاری، واگن، گنجینه، سکه، پرچم) | `props_town` | 11,962 tris · 975 KB · 14 mat · 6 bones/4 clips | خونه · زیاد | 🟢 بمونه | 3 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |
| 111 | وسایل اردو و کارگاه (سندان، دیگ، غرفه، مانکن، چادر) | `props_camp` | 11,146 tris · 728 KB · 11 mat · static | خونه · چندتا | 🟢 بمونه | 3 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |
| 112 | فایل‌های بدون مصرف (an_llama, carrot, horse_saddle, horse_white, horseman, mangonel, twisted1, kit_ws_p3) _تو کد صدا زده نمی‌شن؛ می‌تونن حذف بشن (حجم کم کنه)_ | `unused_files` | 22,287 tris · 947 KB · 13 mat · 24 bones/2 clips; 560 bones/4 clips; 34 bones/1 clips | — · هیچ | 🟢 بمونه | 3 | ≤3k tris · ≤400KB · ≤2 mat · rig no/simple |

## بدون عکس (مدل نیستن)
- `anims.glb` (۲٫۶MB، ۱۵ کلیپ)، `anims_army.glb` (۵ کلیپ)، `kk_anims.glb` (۱۶ کلیپ): کتابخونه‌ی انیمیشن سرباز/جادوگر. بمونه (تو راند ۴ باید با اسکلت جدید جور بشه).
- ماژول‌های kit_hex (۲۱: آسیاب، چاه، بازار، آهنگر، حصار…) و بقیه‌ی ماژول‌های kit_village/kit_ws که بالا ردیف جدا ندارن: تو کد با `bakePieces` چیده می‌شن؛ بمونن.

## پیشنهاد دسته‌ی اول (۱۰ تا)
**#1 · #2 · #3 · #8 · #11 · #14 · #17 · #25 · #49 · #55** = قلعه (پوسته‌ی سنگ، پایلوت) · تکه‌ی دیوار (سنگ) · برج دیوار (سنگ) · کلبه ۰ · صنعتگر ۰ · بازرگان ۰ · اشراف ۰ · تالار شهر · آسیاب بادی · سرباز پایه
دلیل: بیشترین دیده‌شدن (قلعه، دیوار، خونه‌ها، ارتش) + دو پایلوت برای دو پرسش بزرگ (پوسته‌ی قلعه با کد؛ انیمیشن سرباز). اگه قلعه/دیوار/برج خوب دربیاد، ۵ پوسته‌ی دیگه همون پرامپت با ماده‌ی دیگه‌ست. خونه‌ی عمومی (#22) و اژدها (#82) بعد از جواب پایلوت‌ها.
