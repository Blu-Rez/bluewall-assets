# WORKER RP3 — the underworld, first real place: the hub «Heart of the Mountain» (دل کوه) (Blue Wall · RPG phase 1)
**Nothing is attached to this chat.** Written by the mother chat, 14 Oct 2026, because the owner asked for a chat that designs and gets his OK on the underworld environment while the others work. Size **M–L**, two rounds (≈ 110 tool uses each). At the cap write `RP3_progress.md`, push what is proven, stop. **No Tripo credit is needed or allowed** (the owner's Tripo balance is low): procedural geometry + pieces that already exist in the library.

## خلاصه برای وینگلس
اولین جای واقعی «دنیای زیرین» رو می‌سازه: **دل کوه** = هاب وسط دنیای زیرین (نور فیروزه‌ای، کمپ، تابلوی کوئست، فروشنده، هفت راه به منطقه‌های کتاب که فعلاً بسته‌ان، پورتال برگشت به قلعه).
ترتیب کار:
1. **شیت حال‌وهوا:** ۶ تصویر از دل کوه (هر کدوم یه ایده‌ی متفاوت: غار عظیم / دره‌ی زیرزمینی با آسمون ساختگی / ...) با یه دستور روی سرورت (مثل شیت خواهرها، حدود ۰٫۳ دلار). شماره می‌دی. ۱۵ دقیقه جواب ندی = پیش‌فرض ۱.
2. **شیت تیکه‌ها:** سنگ، کریستال، چراغ، چادر، بنر، تابلو… از چیزهایی که **همین الان تو کتابخونه‌ی مدل‌ها داریم** (بدون خرید). با شماره انتخاب می‌کنی.
3. می‌سازه و با قهرمانت توش راه می‌ری (همون حالت قهرمان RP1). عکس‌ها رو خودش می‌بینه.
آخرش فقط یه خط به مادر: «RP3 pushed». دشمن، داستان، صدا، اقتصاد و سرور **نیست**.

## Git (do this FIRST, silently; read `claude/GIT_FLOW.md` in the Project)
1. `add_repo` tool: owner `Blu-Rez`, repo `bluewall-assets`, access `push`. Never clone `main` (4 GB).
2. `git clone --depth 1 --branch kit https://github.com/Blu-Rez/bluewall-assets.git /home/claude/bot/bluebot_v2 && bash /home/claude/bot/bluebot_v2/workers/setup_kit.sh` → `bash /home/claude/dev/gate_w.sh` must print `GATE_W: ALL OK` (kit p45, noRoute 667). `cat workers/KIT_VERSION`; say the kit state in your first message.
3. Library (read-only): `git clone --depth 1 --branch lib-tripo https://github.com/Blu-Rez/bluewall-assets.git /home/claude/lib` → `LIB_INDEX.md`, `MANIFEST.json`, `lib/tripo/<category>/<key>/<key>.glb`, `tools/` (contact-sheet and render tools: `sheet.py`, `tr2_views.html` + `views.py`). Packs = ONE glb with several named nodes, pivot at each object's base centre.
4. Results: `bash /home/claude/bot/bluebot_v2/workers/push_result.sh RP3 patch_RP3.tar.gz photos_RP3.tar.gz report_RP3.md RP3_progress.md` then ONE line to the owner: «RP3 pushed». Fallback only if push is unavailable: say so, deliver the files in the chat.
5. **Other chats run in parallel** — TR2 (castle/town/world models, tiers, layout), RP1B (hero mode: `web/assets/rpg/rpg.js` + 3 hooks in `main.js`: perf diet, reach map, door → building sheets), RP4 (combat core, new files `web/assets/rpg/combat*.js`). **You own the underworld only:** `web/assets/rpg/rpg_under.js` and a new folder `web/assets/rpg/under/`. `rpg.js` belongs to RP1B: edit it only if unavoidable (≤ 10 lines, each marked `// RP3:`, listed in the report). Do not touch `main.js`, castle/town/battle/economy, server `*.py`, `pkg/`, `dev/gate*.sh`, `web/app/*`.

## Owner and style
Owner **Wingless**: Persian, short, casual, English digits, writes from a phone. Reply in Persian, short. He lost many hours to work that looked finished but was not: **no «done» without a frame you looked at yourself, at full size.** «My time is short» = his tokens are short: no rounds of diagnostics, ONE paste-able command at a time. `📊 پیشرفت: N٪` about every 10 %. Never print or store a secret (the Tripo/OpenAI keys live on his server; never read `/root/bw_art/keys.env`). **Never the words «bot / ربات» in game texts; no Persian text inside the hero UI** (icons only; the loader title is Latin). **Never hand-build or recolour a character model; no model enters the game without the owner's number from a sheet.** Decision rule: ONE numbered sheet → ask by number and name your default; no answer in 15 min → continue with the default and say so. Final chat message ≤ 12 lines: files + «ثابت‌شده / انجام‌نشده / نیاز» + progress.

## Read first (10 minutes)
- `claude/RPG_PLAN.md` §0 (decisions), §1 (the world: layers, the hub, the 7 regions, mood), §9 (risks). Lore line: each player's castle is a «Blue Wall» built on a piece of a mountain's heart; from its cellar the **turquoise roads** lead down to the underworld (working name **Zir-Azaran**). The hub is the safe centre; the book's regions hang off it with the same geography: Sepidsar N, White Fortress S, Golden City W, Black Citadel E, Simorgh Forest NW, Black Mountain NE, Salt Flats SE; Mount Qaf far away behind the mist. Story text and dialogue do not change.
- `web/assets/rpg/rpg_under.js` (RP1's test area, 189 lines) and `workers/docs/report_RP1.md`. RP1 numbers: 12–15 draw calls, 79–81 k triangles, +12..15 programs in a separate scene, 150 crystal clusters as ONE InstancedMesh, motes as ONE Points, 191 circle colliders, exponential fog navy → turquoise.
- How `rpg.js` calls it (`import()` of `rpg_under.js`, `mod.buildUnder(T)`, then `S.under.update/dispose/hgt/colliders/clampXZ/portal/fill/spawn/stats`). **Keep that contract** so RP1B and RP4 keep working; you may ADD fields.

## Job 1 — mood sheet (the owner's OK comes first)
Write a one-paste server script in the style of `/root/bw_art/cast.py` (runner appendix in `claude/RP0U_UNITS.md`: `openai_conn()`, `make_bot()`, cost counting, Telegram albums; model `gpt-image-2.5-sunburst`, `quality high`, size `1536x1024` landscape, text-to-image, 6 images, cost ≈ $0.3). Each image = an environment concept still, photorealistic, «live-action fantasy film», NOT anime / cartoon / painting, no text, no characters; same world (ancient-Persian-flavoured, turquoise), a different idea each:
1. a colossal cavern, the camp as a small fire far below, glowing crystal veins · 2. an underground valley under a painted «sky» (cold turquoise aurora), mist rivers · 3. a ruined stone terrace city cut into the rock, turquoise braziers · 4. a flooded hall of giant pillars with a shallow glowing lake · 5. a basin of tall turquoise crystals like a forest, a path of lanterns · 6. a bridge-and-stairs hub: one big circular platform with seven arched road mouths in the cliff wall.
Ask: «کدوم شماره؟ (می‌تونی دو تا رو ترکیب کنی: مثلاً ۲ با پل‌های ۶)». Default 1 if no answer.
Do NOT copy any existing game's scenes; «Elden-Ring-like feeling» = fog, scale, cold light, artificial sky, not its designs. Be honest in the report: the feeling is reachable in a Telegram web view, the graphic detail of a console game is not.

## Job 2 — pieces sheet (no new models)
From the library pick candidates that fit the chosen mood: `rocks_boulder`, `rocks_small`, `cliffs`, `rocks_ore`, `props_camp` (tents, campfire stuff), `lamps_torches_braziers`, `lamps_fantasy`, `lamps_persian_shrine`, `market_stalls`, `props_mining`, `construction_pack`, banners/boxes/barrels in `props_town`, ruined bits you can find among `castle_*` / `civic_*` (shrines, wells). Render ONE numbered contact sheet (`tools/sheet.py` or the `tr2_views` rig; software GL renders a sheet of 8 models in seconds). Ask by number; default = your 12 best. Only the picked nodes enter the game. If a piece you need is missing (a banner pole, a board), build it **procedurally** (boxes, cylinders, canvas textures) — no hand-made character, no Tripo.

## Job 3 — build the hub
Replace the test area by the hub, same module contract (`buildUnder` may become `async` if you need to load GLBs: then `rpg.js` gets one `await`; list that line). Content:
- **Shape:** one walkable basin ≈ 240 m across (RP1's 200 m test area is the floor); height from your own noise (`hgt(x,z)` stays a pure function). A soft stop at the edge (`clampXZ`), never an invisible wall inside.
- **Centre:** camp clearing — a fire (flame sprites, ONE light, no shadow), 3–4 tents, a vendor stall, a quest board (object only, no text), benches/crates/barrels; lamps that make pools of turquoise light (≤ 3 real lights in the whole scene; the rest = baked-looking additive sprites).
- **Seven road mouths** (N, NE, E, SE, S, NW, W of the hub, matching the regions above): each an arch/gate in the rock wall with its own simple motif (so the owner can tell them apart later), closed by a slow turquoise mist curtain (non-solid to the eye, solid to the collider) + a Latin-free icon-less marker object. They are **sealed**: `regions[i].open=false`.
- **The way home:** a staircase/portal up to the castle (use RP1's portal object or a better one); keep `portal` in the return value.
- **Sky/fog/light:** per the chosen mood; no extra post-processing passes.
- **Return value (add):** `pois: [{id:'camp'|'board'|'vendor'|'portal'|'region:<key>', x, z, r}]`, `regions:[{key,x,z,dir,open}]`, `spawn`, `colliders` (circles, as before), `heightAt = hgt`, `stats()`. RP4 (enemies) and RP7 (story) will read `pois`; do not add UI or game rules.
- **Budget (hero view on any path in the basin):** ≤ 150 draw calls, ≤ 400 k triangles, **0** shader programs in the home scene, ≤ +14 in the underworld scene, ≤ 3 MB downloaded when entering (the lib nodes you use count), boot bundle +0 (lazy). Instance everything repeated; no per-frame allocations; motes/mist as ONE Points / few planes.
- **Perf hook:** export `setQuality(step)` (0 = full … 3 = lowest: fewer motes/mist layers, no flame light flicker) so RP1B's quality governor can call it later.

## Not in this round
Enemies, combat, story, quests, voices, music (ask the owner later), economy, server, regions behind the mist, PvP maps, the strategic map.

## Proof (frames you looked at yourself, full size; software GL)
mood sheet + the owner's pick · pieces sheet + his numbers · hub from 4 hero-height angles (camp, a road mouth, the portal, a wide view) · 390 px portrait hero view · the sealed mist curtain close-up · day-to-day numbers table (draw calls / triangles / programs / MB) at 3 spots · walk from spawn to the camp, to each of the 7 mouths and to the portal (physical test with the dev API) · exit → castle → re-enter (no leak: renderer.info geometries/textures back to the same count) · gate off = home scene unchanged (`GATE_W: ALL OK`, programs and requests identical).
New test `dev/rp3_test.sh` → `RP3 OK` (module builds headless, contract fields present, spawn→portal and spawn→each mouth reachable on the collider grid, no collider covers the spawn, budget counters under the limits, dispose frees). Add nothing to `dev/gate*.sh` (the mother does).

## Deliver
`patch_RP3.tar.gz` (diff vs the kit you started from; list every shared-file line), `photos_RP3.tar.gz`, `report_RP3.md` (first block for the mother: «RP3 = underworld hub «Heart of the Mountain». Review like any patch: every frame full size, GATE_W: ALL OK, gate off = +0 programs / +0 boot bytes, no change to battle / economy / server / pkg / gate files, `rpg.js` lines listed…»), `RP3_progress.md`. **Not proven** (say it): real phone fps/feel (the owner measures), anything with enemies, music/ambient audio.
