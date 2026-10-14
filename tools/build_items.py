import json
inv = {r['file']: r for r in json.load(open('/home/claude/tr1/inv.json'))}
BUD = {  # kind: (tris, KB, mats, rig)
 'keep': (20000, 2500, 2, 'no'), 'wall': (2000, 300, 1, 'no'), 'tower': (6000, 800, 2, 'no'), 'house': (8000, 1000, 2, 'no'),
 'soldier': (3000, 300, 3, 'biped'), 'creature': (8000, 900, 3, 'yes'), 'dragon': (15000, 1500, 3, 'yes'),
 'tree': (1500, 200, 1, 'no'), 'prop': (3000, 400, 2, 'no/simple'), 'rider': (8000, 900, 3, 'yes'), 'weapon': (1500, 150, 1, 'no')}
V = {'now': 'همین حالا', 'later': 'بعداً', 'keep': 'بمونه', 'new': 'جدید (مدل نداره)'}
ITEMS = []
def add(cat, key, fa, kind, verdict, prio, where, count, parts=None, note=''):
    ITEMS.append(dict(cat=cat, key=key, fa=fa, kind=kind, verdict=verdict, prio=prio, where=where, count=count, parts=parts, note=note))
G = lambda f, nodes=None: (f + '.glb', nodes)
# ---------------- castle & walls (code-built: castle.js, no GLB)
C = 'castle'
add(C, 'castle_keep', 'قلعه‌ی اصلی (Keep) — ۶ پوسته: چوب/سنگ/آهن/طلا/الماس/کریستال آبی', 'keep', 'now', 1, 'both', '۱ تا (ولی ۶ مدل لازمه)', None, 'کدساز: جعبه/استوانه‌ها + شیدر پوسته (castle.js, skin.js)')
add(C, 'castle_wall', 'تکه‌ی دیوار (ماژولار) — ۶ پوسته، ۳ حلقه', 'wall', 'now', 1, 'both', 'صدها تکه', None, 'کدساز: wallRun() روی چندضلعی')
add(C, 'castle_tower', 'برج دیوار — ۶ پوسته', 'tower', 'now', 1, 'both', '۲۰ تا ۴۰', None, 'کدساز: tower()')
add(C, 'castle_gatehouse', 'دروازه‌ی قلعه (دیوار داخلی/بیرونی) — ۶ پوسته', 'tower', 'now', 1, 'both', '۲ تا ۳', None, 'کدساز: gatehouse')
add(C, 'town_gate', 'دروازه‌ی شهر + پل روی خندق', 'tower', 'later', 2, 'both', '۱', None, 'کدساز: townGate()')
add(C, 'river_bridge', 'پل سنگی رودخانه', 'prop', 'later', 3, 'both', '۲ تا ۴', None, 'کدساز: riverBridge()')
add(C, 'water_gate', 'دروازه‌ی آبی / اسکله‌ی کانال', 'tower', 'later', 3, 'home', '۱ تا ۲', None, 'کدساز: waterGate(), riverQuay()')
# ---------------- houses (kit_homes.glb: ONE flat-colour material)
H = 'houses'
for kd, fa in (('cottage', 'کلبه'), ('craftsman', 'خونه‌ی صنعتگر'), ('merchant', 'خونه‌ی بازرگان'), ('noble', 'عمارت اشراف')):
    for t in range(3):
        add(H, f'house_{kd}_{t}', f'{fa} — مدل {t}', 'house', 'now', 1, 'home', '۳۰ تا ۱۰۹ خونه تو صحنه', [G('kit_homes', [f'{kd}_{t}', f'{kd}_{t}_ra'])], 'روی بدنه + سقف A؛ از kit_homes')
add(H, 'house_chimneys', 'دودکش‌ها (۶ تا)', 'prop', 'keep', 3, 'home', 'روی هر خونه', [G('kit_homes', ['chim_b_1', 'chim_b_2', 'chim_b_3'])])
add(H, 'house_props', 'وسایل کنار خونه (بشکه، گاری، نیمکت، پرچم…) ۱۶ تا', 'prop', 'keep', 3, 'home', 'زیاد، ریز', [G('kit_homes', ['p_barrel', 'p_stall', 'p_wagon', 'p_barrow', 'p_flag', 'p_crates'])])
add(H, 'house_generic', 'خونه‌های عمومی شهر (~۱۰۹ تا) — از ماژول‌های دیوار/سقف/پنجره/در سر هم می‌شن', 'house', 'now', 1, 'home', '۱۰۹ تا (تا ۲۴۰ تو سطح بالا)', [G('kit_village', ['Roof_RoundTiles_6x8', 'Wall_Plaster_WoodGrid', 'Wall_UnevenBrick_Door_Round', 'Corner_Exterior_Brick', 'Window_Wide_Round1', 'Balcony_Simple_Straight', 'Prop_Chimney', 'Roof_Tower_RoundTiles'])], 'پک kit_village (۴۴ ماژول، بافت PBR واقعی)؛ آمار = کل پک؛ تو شیت فقط ۸ ماژول نمونه')
# ---------------- civic & production
P = 'civic'
for n, fa, v, pr, cnt in (('tavern', 'قهوه‌خانه / میخانه (tavern)', 'now', 2, '۱ تا ۲'), ('church', 'عبادتگاه (chapel)', 'now', 2, '۱'), ('hall', 'تالار شهر (townhall)', 'now', 2, '۱'),
                          ('markethall', 'تالار بازار', 'later', 2, '۱'), ('tower', 'برج ساعت شهر', 'later', 3, '۱'), ('wing', 'ساختمان فرعی شهر', 'later', 3, '۱ تا ۲'), ('well', 'چاه / آب‌انبار', 'later', 3, '۱ تا ۳')):
    add(P, f'civic_{n}', fa, 'house', v, pr, 'home', cnt, [G('kit_civic', [f'cv_{n}_b'])], 'از kit_civic (نسخه‌ی آبی _b)')
add(P, 'civic_stalls', 'غرفه‌های بازار (۵ نوع)', 'prop', 'later', 3, 'home', '۵ تا ۱۵', [G('kit_civic', ['cv_stall', 'cv_stall_veg', 'cv_stall_wine', 'cv_stall_pots', 'cv_stall_rich'])])
add(P, 'civic_props', 'وسایل بازار (بشکه، جعبه، چراغ، میز…)', 'prop', 'keep', 3, 'home', 'زیاد، ریز', [G('kit_civic', ['cv_barrel', 'cv_crate', 'cv_lamp', 'cv_tableset', 'cv_chest', 'cv_banner'])])
for n, fa, v, pr in (('lumbermill', 'چوب‌بری', 'later', 2), ('smithy', 'آهنگری (کارگاه)', 'later', 2), ('brewhouse', 'کارگاه نوشیدنی', 'later', 2), ('hut', 'کلبه‌ی کارگر', 'later', 3),
                     ('market', 'بازار (ساختمون)', 'later', 2), ('butcher', 'قصابی', 'later', 3), ('jetty', 'اسکله', 'later', 3), ('fishrack', 'چوب‌ماهی خشک‌کن', 'keep', 3)):
    add(P, f'ws_{n}', fa, 'house', v, pr, 'home', '۱ تا ۳ (جاهای کار)', [G('kit_ws', [f'ws_{n}'])], 'از kit_ws')
for n, fa, v, pr in (('barn', 'انبار بزرگ مزرعه', 'later', 2), ('smallbarn', 'انبار کوچیک', 'later', 3), ('openbarn', 'سایبون مزرعه', 'keep', 3), ('silo', 'سیلو', 'later', 3), ('coop', 'مرغدونی', 'keep', 3)):
    add(P, f'farm_{n}', fa, 'house', v, pr, 'home', '۱ تا ۲', [G('kit_ws', [f'ws_{n}'])], 'از kit_ws (مزرعه)')
add(P, 'ws_construction', 'مرحله‌های ساخت + داربست (۴ تا)', 'prop', 'keep', 3, 'home', 'موقع ساخت', [G('kit_ws', ['ws_stageA', 'ws_stageB', 'ws_stageC', 'ws_scaffold'])])
add(P, 'production_lots_missing', 'ساختمون‌های تولید (اره‌خونه، سنگ‌بری، ذوب، ضرابخانه، پالایشگاه، نانوایی، قصابی، دودخانه، جواهری، انبارها) — ۱۰ نوع', 'house', 'new', 2, 'home', 'برنامه‌ریزی شده ولی ساخته نشده (WIRING_TODO)', None, 'الان مدلی ندارن: پر کردن این خلأ با مدل Tripo')
# ---------------- mines & mills
M = 'mines'
add(M, 'gem_mines', 'معدن‌های جواهر (یاقوت، زمرد، فیروزه) — ۳ تا', 'house', 'later', 2, 'home', '۳', None, 'کدساز (mines.js) + صخره‌ی cliff1/2 + کریستال')
add(M, 'ws_mine', 'معدن ساده‌ی کارگاه (ws_mine)', 'house', 'later', 3, 'home', '۱ تا ۲', [G('kit_ws', ['ws_mine'])], 'از kit_ws')
add(M, 'windmill', 'آسیاب بادی (windmill2)', 'house', 'later', 2, 'home', '۱ (نشونه‌ی نقشه)', [G('windmill2')])
add(M, 'watermill', 'آسیاب آبی (watermill)', 'house', 'later', 2, 'home', '۱', [G('watermill')])
add(M, 'blacksmith', 'آهنگری روستا (blacksmith)', 'house', 'later', 2, 'home', '۱', [G('blacksmith')], 'bbox خیلی بزرگ؛ مقیاس در کد تنظیم می‌شه')
add(M, 'watchtower', 'برج دیدبانی (watchtower)', 'tower', 'later', 2, 'both', 'چندتا روی دیوار', [G('watchtower')])
add(M, 'hex_buildings', 'ساختمان‌های kit_hex (آسیاب، چاه، بازار، آهنگر، انبار غله) ۶ تا', 'house', 'later', 3, 'home', 'لود می‌شه؛ مصرفش رو نگرفتم', [G('kit_hex', ['building_windmill_blue', 'building_well_blue', 'building_watermill_blue', 'building_market_blue', 'building_blacksmith_blue', 'building_grain'])], 'سبک Kenney (کارتونی‌تر)')
add(M, 'ws_mining_props', 'وسایل معدن (واگن، سنگ معدن، شمش، چرخ‌آب)', 'prop', 'keep', 3, 'home', 'ریز', [G('kit_ws', ['ws_minecart', 'ws_orecart', 'ws_goldbars', 'ws_waterwheel', 'ws_nugget'])])
# ---------------- infantry & archers
I = 'infantry'
add(I, 'soldier_base', 'سرباز پایه (ranger_m) — نیزه‌دار، شمشیرزن، نگهبان، کماندار، لژیونر، کاپیتان', 'soldier', 'now', 1, 'both', 'صدها تا (ازدحام)', [G('ranger_m')], 'یه مدل برای ۶+ نوع سرباز؛ رنگ و تجهیزات روش سوار می‌شه؛ انیمیشن‌ها از anims.glb')
add(I, 'ranger_f', 'رنجر زن (ranger_f)', 'soldier', 'later', 2, 'home', 'ده‌ها', [G('ranger_f')], 'ارتش خونه (units.js)')
add(I, 'villager_m', 'روستایی مرد (peasant_m)', 'soldier', 'later', 3, 'home', 'ده‌ها', [G('peasant_m')])
add(I, 'villager_f', 'روستایی زن (peasant_f)', 'soldier', 'later', 3, 'home', 'ده‌ها', [G('peasant_f')])
add(I, 'shieldmaiden', 'دختر سپردار (shieldmaiden)', 'soldier', 'later', 2, 'battle', 'ده‌ها', [G('shieldmaiden')], 'قهرمان‌های خواهر (RP0A) جداست و دست نمی‌خوره')
add(I, 'skeleton_mage', 'لیچ / جادوگر اسکلتی (skel_mage)', 'soldier', 'later', 2, 'battle', 'ده‌ها', [G('skel_mage')])
add(I, 'imp', 'ایمپ (imp)', 'soldier', 'later', 2, 'battle', 'ده‌ها', [G('imp')])
add(I, 'puglin', 'پاگلین (puglin)', 'soldier', 'later', 3, 'home', 'چندتا', [G('puglin')])
add(I, 'hill_giant', 'غول تپه (hill_giant)', 'creature', 'later', 2, 'battle', 'چندتا', [G('hill_giant')])
add(I, 'gear_swords', 'شمشیرها (sword، claymore، sword_mw)', 'weapon', 'keep', 3, 'battle', 'روی هر سرباز', [G('sword'), G('claymore'), G('sword_mw')], 'تا وقتی بدنه‌ی سرباز عوض نشده بمونه')
add(I, 'gear_shields', 'سپرها (shield، heater، round2)', 'weapon', 'keep', 3, 'battle', 'روی هر سرباز', [G('shield'), G('shield_heater'), G('shield_round2')])
add(I, 'gear_helmets', 'کلاه‌خودها (helmet2، helmet3)', 'weapon', 'keep', 3, 'battle', 'روی هر سرباز', [G('helmet2'), G('helmet3')])
add(I, 'gear_polearms', 'نیزه، کمان، تبر، چکش، عصا، مشعل', 'weapon', 'keep', 3, 'battle', 'روی هر سرباز', [G('spear'), G('bow'), G('axe'), G('hammer_double'), G('skel_staff'), G('torch')])
# ---------------- creatures & mounts
Cr = 'creatures'
add(Cr, 'ogre', 'غول (ogre)', 'creature', 'later', 2, 'battle', 'چندتا', [G('ogre')])
add(Cr, 'troll', 'ترول (troll)', 'creature', 'later', 2, 'battle', 'چندتا', [G('troll')])
add(Cr, 'cyclops', 'سیکلوپ (cyclops)', 'creature', 'later', 3, 'battle', 'چندتا؟', [G('cyclops')], 'فقط تو LATE لود می‌شه؛ مصرفش رو پیدا نکردم')
add(Cr, 'treant', 'درخت‌مرد (treant)', 'creature', 'later', 2, 'battle', 'چندتا', [G('treant')])
add(Cr, 'werewolf', 'گرگینه (werewolf)', 'creature', 'later', 2, 'battle', 'ده‌ها', [G('werewolf')])
add(Cr, 'wolf', 'گرگ (wolf)', 'creature', 'keep', 3, 'home', 'شب‌ها چندتا', [G('wolf')])
add(Cr, 'knight_rider', 'شوالیه‌ی سوار (knight_k3)', 'rider', 'now', 2, 'both', 'ده‌ها', [G('knight_k3')], 'سوار روی همه‌ی اسب‌ها؛ حالت سواری ثابت')
add(Cr, 'horse_grey', 'اسب خاکستری (horse_m2m_grey)', 'creature', 'now', 2, 'both', 'ده‌ها', [G('horse_m2m_grey')])
add(Cr, 'horse_bay', 'اسب بور (horse_m2m_bay)', 'creature', 'later', 2, 'both', 'ده‌ها', [G('horse_m2m_bay')])
add(Cr, 'horse_black', 'اسب سیاه (horse_m2m_black)', 'creature', 'later', 2, 'both', 'چندتا', [G('horse_m2m_black')])
add(Cr, 'horse_barded', 'اسب زره‌دار (horse_hq_barded)', 'creature', 'later', 3, 'home', 'چندتا', [G('horse_hq_barded')])
add(Cr, 'horse_old', 'اسب قدیمی (horse، مرتع)', 'creature', 'keep', 3, 'home', 'چندتا', [G('horse')])
add(Cr, 'cow', 'گاو (cow)', 'creature', 'keep', 3, 'home', 'چندتا', [G('cow')])
add(Cr, 'farm_small', 'گوسفند و خوک (an_sheep, an_pig)', 'creature', 'keep', 3, 'home', 'چندتا', [G('an_sheep'), G('an_pig')])
# ---------------- dragons & flyers
D = 'dragons'
add(D, 'dragon_prowler', 'اژدها (prowler) — اژدهای گشت + baby/dragon/سه‌سر تو نبرد', 'dragon', 'now', 1, 'both', '۱ تا چندتا', [G('prowler')], 'نسخه‌ی ۳ سر با کد از همین ساخته می‌شه (bdragon3.js)')
add(D, 'dragonling', 'اژدهاچه (dragonling)', 'dragon', 'now', 2, 'both', '۲', [G('dragonling')])
add(D, 'gryphon', 'گریفین (gryphon)', 'dragon', 'now', 2, 'battle', 'ده‌ها', [G('gryphon')], 'اسکلت و بال‌زدن با کد (bgryphon.js)؛ فقط هندسه‌ی glb')
add(D, 'pegasus', 'پگاسوس (pegasus)', 'dragon', 'later', 2, 'both', 'ده‌ها', [G('pegasus')])
add(D, 'eagle', 'عقاب (eagle)', 'creature', 'later', 3, 'home', 'چندتا', [G('eagle')])
add(D, 'crow', 'کلاغ (crow)', 'creature', 'keep', 3, 'home', 'چندتا', [G('crow')])
# ---------------- nature
N = 'nature'
add(N, 'trees_pine_ez', 'کاج‌های جنگل (ez_pine_a/b/c)', 'tree', 'later', 2, 'home', 'هزاران (ایمپاستر)', [G('ez_pine_a'), G('ez_pine_b'), G('ez_pine_c')], 'جنگل با کارت‌های ایمپاستر از این‌ها ساخته می‌شه (trees.js)')
add(N, 'trees_broad_ez', 'درخت‌های پهن‌برگ (ez_oak_a/b، ash، aspen)', 'tree', 'later', 2, 'home', 'هزاران (ایمپاستر)', [G('ez_oak_a'), G('ez_oak_b'), G('ez_ash_a'), G('ez_aspen_a')])
add(N, 'bushes_ez', 'بوته‌ها (ez_bush_a/b، bush، bushf)', 'tree', 'keep', 3, 'home', 'هزاران', [G('ez_bush_a'), G('ez_bush_b'), G('bush'), G('bushf')])
add(N, 'trees_scatter', 'درخت‌های پراکنده (tree1–5، pine1–5)', 'tree', 'keep', 3, 'home', 'صدها', [G('tree3'), G('tree4'), G('tree5'), G('pine1'), G('pine2'), G('pine4'), G('pine5')], 'tree1، tree2، pine3 مستقیم صدا زده نمی‌شن')
add(N, 'ground_cover', 'علف، گل، سرخس، شبدر، قارچ (۹ فایل)', 'tree', 'keep', 3, 'home', 'ده‌ها هزار', [G('grass'), G('grasst'), G('grassw'), G('flower3'), G('flower4'), G('fern'), G('clover'), G('mushroom'), G('plant')])
add(N, 'rocks', 'سنگ و ریگ (rock1–3، pebble1–2)', 'tree', 'keep', 3, 'home', 'هزاران', [G('rock1'), G('rock2'), G('rock3'), G('pebble1'), G('pebble2')])
add(N, 'rocksets_cliffs', 'صخره‌ها (rockset1–2، cliff1–2)', 'prop', 'keep', 3, 'home', 'ده‌ها', [G('rockset1'), G('rockset2'), G('cliff1'), G('cliff2')])
add(N, 'crops', 'محصولات مزرعه (ذرت، کلم، کدو، هویج، بقچه‌ی کاه)', 'prop', 'keep', 3, 'home', 'مزرعه', [G('corn'), G('cabbage'), G('pumpkin'), G('carrot'), G('haybale')])
# ---------------- traps & siege & props
T = 'traps'
for n, fa, v, pr in (('tesla', 'برج تسلا (tesla)', 'later', 2), ('gatehouse', 'دروازه‌خونه‌ی دفاعی (df_gatehouse)', 'later', 2), ('ballista', 'منجنیق‌کمان دفاعی (df_ballista)', 'later', 2),
                     ('watchtower', 'برج دیده‌بانی دفاعی', 'later', 3), ('crossbow', 'کمان‌پران (crossbow)', 'later', 3), ('firestone', 'سنگ آتش', 'keep', 3), ('brazierpair', 'آتشدان‌ها', 'keep', 3)):
    add(T, f'def_{n}', fa, 'tower' if n in ('gatehouse', 'tesla', 'watchtower') else 'prop', v, pr, 'both', '۱ تا ۱۰', [G('kit_def', [f'df_{n}'])], 'از kit_def')
add(T, 'def_traps', 'تله‌ها (خرس‌گیر، مین، اره، چاله، خارپشت، بشکه، گلوله‌ی خاردار…) ۱۱ تا', 'prop', 'keep', 3, 'both', 'ده‌ها', [G('kit_def', ['df_bear', 'df_mine', 'df_saw', 'df_pit', 'df_hedgehog', 'df_keg', 'df_spikeball', 'df_grenade', 'df_swing', 'df_grate', 'df_bear2'])])
for n, fa, v, pr in (('catapult', 'منجنیق (catapult)', 'later', 2), ('ram', 'کوبنده (ram)', 'later', 2), ('trebuchet', 'تریبوشه (trebuchet)', 'later', 2), ('siege_tower', 'برج محاصره', 'later', 2), ('cannon', 'توپ (cannon)', 'later', 2)):
    add(T, n, fa, 'creature' if n == 'trebuchet' else 'prop', v, pr, 'battle', 'چندتا', [G(n)])
add(T, 'ballista_unit', 'بالیستا (ballista)', 'prop', 'later', 3, 'both', 'چندتا', [G('ballista')])
add(T, 'props_town', 'وسایل شهر (بشکه، جعبه، گاری، واگن، گنجینه، سکه، پرچم)', 'prop', 'keep', 3, 'home', 'زیاد', [G('barrel'), G('crate'), G('cart'), G('wagon'), G('chest'), G('coins'), G('banner')])
add(T, 'props_camp', 'وسایل اردو و کارگاه (سندان، دیگ، غرفه، مانکن، چادر)', 'prop', 'keep', 3, 'home', 'چندتا', [G('anvil'), G('cauldron'), G('stall'), G('dummy'), G('weaponstand'), G('tent_general')])
add(T, 'unused_files', 'فایل‌های بدون مصرف (an_llama, carrot, horse_saddle, horse_white, horseman, mangonel, twisted1, kit_ws_p3)', 'prop', 'keep', 3, 'none', 'هیچ', [G('an_llama'), G('horse_saddle'), G('horseman'), G('mangonel'), G('twisted1')], 'تو کد صدا زده نمی‌شن؛ می‌تونن حذف بشن (حجم کم کنه)')

# numbering + stats
def pstats(parts):
    tris = kb = mats = 0; rigs = []; kitkb = None; tex = 0
    for f, nodes in parts or []:
        r = inv[f]
        if nodes:
            m = {p['name']: p['tris'] for p in r.get('parts', [])}
            tris += sum(m[n] for n in nodes); kitkb = (f[:-4], r['kb']); mats = max(mats, r['materials'])
        else:
            tris += r['tris']; kb += r['kb']; mats += r['materials']; tex += r['textures']
            if r['joints']: rigs.append(f"{r['joints']} bones/{len(r['anims'])} clips")
    return tris, kb, mats, rigs, kitkb
for i, it in enumerate(ITEMS, 1):
    it['n'] = i; ps = it['parts']
    if ps:
        tris, kb, mats, rigs, kitkb = pstats(ps)
        it['tris'] = tris; it['kb'] = kb; it['mats'] = mats; it['rig'] = rigs[0] if len(rigs) == 1 else ('; '.join(rigs) if rigs else 'static'); it['kit'] = kitkb
        it['files'] = [f for f, n in ps]
    else:
        it['tris'] = it['kb'] = it['mats'] = None; it['rig'] = 'کدساز'; it['kit'] = None; it['files'] = []
    t, k, m, r = BUD[it['kind']]; it['budget'] = f"≤{t//1000 if t>=1000 else t}k tris · ≤{k if k<1000 else str(k/1000)+'MB'}{'KB' if k<1000 else ''} · ≤{m} mat · rig {r}"
for it in ITEMS:
    if it['key']=='house_generic': it['tris']=inv['kit_village.glb']['tris']; it['mats']=inv['kit_village.glb']['materials']
json.dump(ITEMS, open('/home/claude/tr1/items.json', 'w'), ensure_ascii=False, indent=1)
from collections import Counter
print(len(ITEMS), Counter(i['cat'] for i in ITEMS), Counter(i['verdict'] for i in ITEMS), Counter(i['prio'] for i in ITEMS))
