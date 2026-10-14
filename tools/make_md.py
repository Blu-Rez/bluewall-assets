import json
items=json.load(open('items.json')); inv={r['file']:r for r in json.load(open('inv.json'))}
N={i['key']:i['n'] for i in items}
CAT={'castle':'قلعه و دیوار','houses':'خونه‌ها','civic':'شهر و تولید','mines':'معدن و آسیاب','infantry':'پیاده و کماندار','creatures':'موجودات و مرکب','dragons':'اژدها و پرنده','nature':'طبیعت','traps':'تله، محاصره، وسایل'}
V={'now':'🔴 همین حالا','later':'🟡 بعداً','keep':'🟢 بمونه','new':'🔵 جدید (مدل نداره)'}
WH={'home':'خونه','battle':'نبرد','both':'هر دو','none':'—'}
def bud(it):
    k=it['key']
    if k.startswith('house_') and k not in('house_chimneys','house_props'): return '≤2.5k tris · ≤250KB · 1 mat · بی‌اسکلت (کم‌شده از ۸k)'
    if k.startswith(('civic_','ws_','farm_')) and it['kind']=='house': return '≤4k tris · ≤500KB · ≤2 mat (کم‌شده از ۸k)'
    return it['budget']
def now(it):
    if it['tris'] is None: return 'کدساز (بدون GLB)'
    if it['key']=='house_generic': return f"کل پک kit_village: {it['tris']:,} tris · {inv['kit_village.glb']['kb']} KB · ۴۴ ماژول · {it['mats']} mat (+بافت)"
    s=f"{it['tris']:,} tris · "
    s+= f"{it['kb']} KB" if it['kb'] else f"داخل {it['kit'][0]}.glb ({inv[it['kit'][0]+'.glb']['kb']} KB پک)"
    return s+f" · {it['mats']} mat · {it['rig']}"
n=lambda k:f"#{N[k]}"
L=[]
L.append('# TR1_list — فهرست مدل‌های Blue Wall (راند ۱) — ۱۳ اکتبر ۲۰۲۶')
L.append('کد: شاخه‌ی `code-p38` + overlay p41 (کیت v4، `GATE_W: ALL OK`). ممکنه چند بسته با سرور زنده فرق داشته باشه. شماره (#) = شماره‌ی روی شیت‌های `sheet_TR1_current_<دسته>.png`؛ فقط شماره بگو.')
L.append('🔴 همین حالا عوض شه · 🟡 بعداً · 🟢 بمونه · 🔵 مدل نداره، جدید بسازیم. اولویت ۱ = بیشترین دیده‌شدن.\n')
L.append('## یافته‌های مهم (قبل از خرید)')
L.append(f"1. **قلعه، دیوار، برج، دروازه و پل‌ها GLB نیستن؛ با کد ساخته می‌شن** (`castle.js`: جعبه/استوانه + شیدر پوسته‌ی ۶تایی چوب/سنگ/آهن/طلا/الماس/کریستال). مدل Tripo جایگزین یعنی هر قطعه ۶ مدل (یکی برای هر پوسته) و تغییر کد بازی (لودر + کنار گذاشتن شیدر پوسته). این بخش تو راند ۴ (`TR1_swap.md`) نوشته می‌شه و کدش با چتِ ساخت بسته‌ست. عکس‌ها: `sheet_TR1_current_castle.png` ({n('castle_keep')}–{n('water_gate')}).")
L.append(f"2. **خونه‌ها دو منبع دارن:** (الف) ۱۲ خونه‌ی برنامه‌ریزی‌شده از `kit_homes.glb` ({n('house_cottage_0')}–{n('house_noble_2')}): یه متریال رنگ ساده، ۱۸۸ تا ۹۰۴ مثلث؛ (ب) **~۱۰۹ خونه‌ی عمومی که از ماژول‌های دیوار/سقف/پنجره‌ی `kit_village` سر هم می‌شن** ({n('house_generic')}؛ تعداد اصلی خونه‌ها اینه). چون تا ۱۰۹+ خونه هم‌زمان تو صحنه‌ست و بازی تو نمای بالا ~۳ میلیون مثلث داره، بودجه‌ی خونه رو از ۸k به **۲.۵k مثلث / ۲۵۰KB / ۱ متریال** کم کردم. ساختمون‌های شهر و تولید ≤۴k. جایگزین‌کردن ۱۰۹ خونه‌ی ماژولار یعنی چند مدل کامل خونه + راه جدید ساخت تو کد (`bakeVillage`).")
L.append(f"3. **یه مدل سرباز (`ranger_m`، ۹٬۰۳۱ مثلث) پایه‌ی ۶+ نوع سربازه** (نیزه‌دار، شمشیرزن، نگهبان، کماندار، لژیونر، کاپیتان) با رنگ و تجهیزات جدا؛ صدها تا تو صحنه ({n('soldier_base')}). بودجه ۳k. انیمیشن‌هاش از `anims.glb`/`anims_army.glb` میاد و روی همین اسکلت کار می‌کنه؛ مدل Tripo اسکلت دیگه‌ای داره → انیمیشن‌ها باید روی اسکلت جدید منتقل بشن (`R1-retarget-report.md` تو پروژه هست). اول یه پایلوت.")
L.append(f"4. **اژدها (`prowler`، {n('dragon_prowler')}) ۱۹٬۷۶۶ مثلثه (بودجه ۱۵k)** و نسخه‌های سه‌سر/بچه‌اژدها با کد از روی استخوان‌های خودش ساخته می‌شن (`bdragon3.js`: `Neck_66`, `Torso_118`…). جایگزینی‌ش به اسکلت هم‌نام یا بازنویسی اون کد بستگی داره → نه تو دسته‌ی اول. گریفین ({n('gryphon')}) هم فقط هندسه‌ی glb رو می‌گیره و اسکلت/بال‌زدن با کده.")
L.append(f"5. **ساختمون‌های تولید (اره‌خونه، سنگ‌بری، ذوب، ضرابخانه، پالایشگاه، نانوایی، قصابی، دودخونه، جواهری، انبارها) الان مدل ندارن** (برنامه‌ریزی شده ولی ساخته نشده؛ `WIRING_TODO`) — ردیف {n('production_lots_missing')}. جای خوبیه برای مدل‌های Tripo.")
L.append("6. سبک فعلی: اروپایی قرون وسطایی (نیمه‌چوبی، سقف آبی، قلعه‌ی گوتیک) از پک‌های CC0 (KayKit/Quaternius/Kenney)، نه هخامنشی/ساسانی. قلعه و خونه‌ها بیشترین تغییر ظاهر رو می‌گیرن.")
L.append(f"7. فایل‌های **بلااستفاده** (کد صداشون نمی‌زنه): an_llama, carrot, horse_saddle, horse_white, horseman, mangonel, twisted1, sword_mw, kit_ws_p3 (۴٫۳MB)، و tree1/tree2/pine3 مستقیم صدا زده نمی‌شن ({n('unused_files')}). حذفشون حجم رو کم می‌کنه.")
L.append(f"8. تو شیت‌ها: werewolf ({n('werewolf')}) سیاه رندر شد (نور محیطِ خود بازی نبود)، ogre ({n('ogre')}) یه صفحه‌ی زمین همراهشه، treant ({n('treant')}) و اژدها ({n('dragon_prowler')}) تو حالت استراحت اسکلت‌اند؛ هیچ‌کدوم خرابی مدل نیست. hill_giant و shieldmaiden هر دو ۱۱٬۹۸۸ مثلث‌اند (همون مش).")
L.append('9. اسکریپت‌های رندر: `dev/tr1_sheet.html` + `tr1/sheet.py` (برای رندر کنار هم قدیمی/جدید تو راند ۳).\n')
L.append('## جدول')
cur=None
for it in items:
    if it['cat']!=cur:
        cur=it['cat']; L.append(f"\n### {CAT[cur]} — شیت `sheet_TR1_current_{cur}.png`")
        L.append('| # | نام | key | الان | کجا / چندتا | verdict | اولویت | بودجه‌ی جایگزین |'); L.append('|---|---|---|---|---|---|---|---|')
    note=f" _{it['note']}_" if it['note'] else ''
    L.append(f"| {it['n']} | {it['fa']}{note} | `{it['key']}` | {now(it)} | {WH[it['where']]} · {it['count']} | {V[it['verdict']]} | {it['prio']} | {bud(it)} |")
L.append('\n## بدون عکس (مدل نیستن)')
L.append('- `anims.glb` (۲٫۶MB، ۱۵ کلیپ)، `anims_army.glb` (۵ کلیپ)، `kk_anims.glb` (۱۶ کلیپ): کتابخونه‌ی انیمیشن سرباز/جادوگر. بمونه (تو راند ۴ باید با اسکلت جدید جور بشه).')
L.append('- ماژول‌های kit_hex (۲۱: آسیاب، چاه، بازار، آهنگر، حصار…) و بقیه‌ی ماژول‌های kit_village/kit_ws که بالا ردیف جدا ندارن: تو کد با `bakePieces` چیده می‌شن؛ بمونن.')
f=lambda ks:' · '.join(n(k) for k in ks)
batch=['castle_keep','castle_wall','castle_tower','house_cottage_0','house_craftsman_0','house_merchant_0','house_noble_0','civic_hall','windmill','soldier_base']
L.append('\n## پیشنهاد دسته‌ی اول (۱۰ تا)')
L.append(f"**{f(batch)}** = قلعه (پوسته‌ی سنگ، پایلوت) · تکه‌ی دیوار (سنگ) · برج دیوار (سنگ) · کلبه ۰ · صنعتگر ۰ · بازرگان ۰ · اشراف ۰ · تالار شهر · آسیاب بادی · سرباز پایه")
L.append('دلیل: بیشترین دیده‌شدن (قلعه، دیوار، خونه‌ها، ارتش) + دو پایلوت برای دو پرسش بزرگ (پوسته‌ی قلعه با کد؛ انیمیشن سرباز). اگه قلعه/دیوار/برج خوب دربیاد، ۵ پوسته‌ی دیگه همون پرامپت با ماده‌ی دیگه‌ست. خونه‌ی عمومی (#%d) و اژدها (#%d) بعد از جواب پایلوت‌ها.'%(N['house_generic'],N['dragon_prowler']))
open('TR1_list.md','w').write('\n'.join(L)+'\n')
print(batch,[N[k] for k in batch])
