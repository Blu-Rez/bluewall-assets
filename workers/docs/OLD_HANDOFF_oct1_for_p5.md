# Blue Wall — handoff to the next session

Written 2026-10-01 22:55 (Tehran) by the previous session (Opus). Read this whole file before doing anything.

---

## 0. Start here

1. Unpack and set up the environment (takes about 2–3 minutes):
   ```bash
   tar xJf bluewall_handoff.tar.xz && bash bluewall_handoff/setup.sh
   ```
   It installs the following fixed paths, which every script uses:

   | path | contents |
   |---|---|
   | `/home/claude/bot/bluebot_v2/bluewall` | the code (server, client source, web, assets) |
   | `/home/claude/dev` | test harness (dev.html, shot.py, q.py, perf.py, cam.js) on http://127.0.0.1:8777 |
   | `/home/claude/staged` | approved new models that are not integrated yet (horses, pegasus, knights, troops, buildings, D2 logo) |
   | `/home/claude/pkg` | `mkpkg.sh` (delta package builder) and `deployed.sha256` (what the server has now) |

   It also builds the bundle and runs a smoke test. The expected result is `{"frames":…, "drawCalls":~224}` with no `PAGEERR`.
2. Read §1 (rules) and §6 (task list, in priority order).
3. Your first message to the owner should be short Persian: say that you've taken over, list the P0 items, and say you'll report progress in %.

---

## 1. Owner and working rules (mandatory)

**Talking to the owner.** The owner is **Wingless**.
- Reply in **Persian**: casual, short and direct, with English digits. No long explanations.
- Report **progress in %** often, roughly every 10%.

**Taste and approval.**
- Anything taste-based needs **samples first** (screenshots via SendUserFile), then wait for approval. This covers new characters/models, colours, logo, fonts, UI looks, layouts.
- He gets angry when work is done without consulting him. Quote: "کاراکتری چیزی میخوای اضافه کنی، صبر کن اول چند نمونه نشون من بده".
- Items already approved (§4) don't need re-approval; show him the result.

**Token budget.** The budget is tight.
- He complained that parallel Opus agents burned tokens with nothing shipped.
- Work sequentially in small, verified steps and ship packages often.
- Don't fan out many subagents.
- Big files (world.js ~41 KB, life.js, ui.js ~29 KB, main.js) should be read with grep plus offset/limit, not whole.

**Quality bar.** He wants it beautiful, precise, optimised and bug-free, at the level of top mobile strategy games (Siegefall / Rise of Kingdoms / Clash of Clans look, semi-realistic).
- Colours: light blue, navy, black, plus steel.
- The game runs on his phone inside Telegram. Keep at least 55–60 FPS.

**Deliveries.**
- Send the package `.tar.gz` with SendUserFile, plus ONE pasteable install command.
- Never ask him to run files that aren't in the package.

**Security.**
- Never ask for, paste or echo tokens or secrets in chat. If a secret is needed on the server, give him a command that uses `read -rsp` so he types it into his own terminal.

**Assets.**
- Only **CC0 or CC-BY** (add credits to `web/assets/credits.json`). Quaternius packs are OK.
- **Never** use ripped or copyrighted game assets (Siegefall/Gameloft etc.).

**Current status.** His last message before the handoff was "صبر کن صبر کن" (wait). When he gives the go, start with the P0 items.

---

## 2. Product and deployment

**Hosting.**
- Telegram bot **@Blue_Hearts_Bot** (BlueBot v2) on server **blue18**, app root `/root/bluebot_v2`.
- Game 7 "**Blue Wall**" is a Telegram Mini App at **https://game.bluhearts.com**.
  - Request path: nginx + Cloudflare → aiohttp on `127.0.0.1:8590`.
  - systemd unit: `bluebot-wall`, run with `python -m bluewall`.
- It is **owner-only** for now (allow-list `BLUEWALL_ALLOW`, `BLUEWALL_PUBLIC=false`).

**Routes** (server.py):

| route | purpose |
|---|---|
| `GET /` | loader `web/index.html` |
| `POST /api/auth` | Telegram initData HMAC → `{token, uid, name, owner}` |
| `GET /api/bundle` | **wall.js is served only with a Bearer token**; it is not a public file |
| `GET /api/state` | 403 without a token |
| `POST /api/collect {mine}` | collect gems from a mine |
| `/assets/*`, `/pub/*`, `/healthz` | static files and health check |

**Packages.**
- **Deployed:** p1 … p4 (p4 is the last one installed). **Everything newer in this archive is NOT deployed yet**; the next package (p5) will carry it.
- **Build a package:**
  ```bash
  bash /home/claude/pkg/mkpkg.sh bluebot_bluewall_p5 "short title"
  ```
  It rebuilds the bundle and ships only files whose sha256 differs from `deployed.sha256`. A dry run at handoff time gave 34 files, all client src + server.py + state.py + wall.js + index.html + fonts.
- **Install command to give him** (he uploads the tar.gz to `/root` himself):
  ```
  cd /root && tar xzf bluebot_bluewall_p5.tar.gz && bash bluebot_bluewall_p5/install.sh
  ```
  The installer backs up the old files, copies the new ones, runs `py_compile` (with automatic rollback on failure), restarts `bluebot-wall`, and checks `/healthz` and `/api/state`=403.
  - Rollback: `bash /root/bluebot_bluewall_p5/rollback.sh`.
- **After he confirms it works:** run `bash /home/claude/pkg/mkpkg.sh --commit bluebot_bluewall_p5` so the next package is a delta against it.

**Files left out of this archive.** They are already on the server and packages never delete server files.
- `web/assets/audio/*.mp3` (8.7 MB): the local dev page just 404s on audio, which is harmless. If you change or add audio, the new files ship normally.
- 8 GLBs no longer referenced by the code.
- 3 staged GLBs that were not picked.

**Running the server locally** (for API tests, optional; uses the memory store when Redis is absent):
```bash
cd /home/claude/bot/bluebot_v2 && BOT_TOKEN=123456:TESTTOKENabcdefghijk SUPER_ADMIN_UID=777 BLUEWALL_PORT=8591 python3 -m bluewall
```
`dev/api_test.py` and `dev/e2e.py` exercise auth, state and collect.

---

## 3. Architecture

The client lives in `bluewall/client/src`, as ES modules bundled by esbuild into `web/app/wall.js` (IIFE, three.js r186).
- Build with `bash bluewall/client/build.sh` (minified, about 1.1 MB).
- The global entry is `BlueWall.start(opts)`.
- `web/index.html` is the loader. It runs auth, fetches the bundle and calls `BlueWall.start({root, token, uid, name, owner, tg, …})`.
- `dev/dev.html` starts the game directly with `dev:true`.
  - URL params: `q=low|medium|high|ultra`, `h=hour`, `w=weather`, `s=season&sp=progress` (season preview), `wa=seconds` (how long the welcome card stays up).

| file | role |
|---|---|
| main.js | Entry. Renderer, quality presets (dpr: high 1.35, medium 1.1), bloom composer (`dropComposer()`), UI, Econ, clock, intro + welcome card (`ctl.intro.hold`), main loop. At frame 2 it calls `ready()` and `startWelcome()`; at frame 4 it calls `world.startLate()`. Exposes `window.__bw = {THREE, scene, camera, ctl, world, renderer, ui, Q, settings, audio, t, frames, pause(v), P()}`. |
| world.js | Builds the world in this order: castle → buildings → town → mines (+ badges) → `ctx.levelHooks=[]` → `buildDefenses(ctx)` → `buildVaults` → `buildMoat` → static batch `B.build(scene)`. `startLate()` loads life.js creatures, then `buildArmy(lateApi())` and `lateDefenses(lateApi())`, each in try/catch. Also holds `update()`, `setLevel(n)` (levels plus every `ctx.levelHooks` entry), `setOption`, and `OWN = {dragon}`. |
| layout.js | Map constants: `OUTER` (Blue Wall polygon, about 60 m, `GATE_SEG` 4), `INNER` (citadel), `TOWN` (third wall ring r≈130–145, gates 0 and 6), `MOAT`/`MOAT2`, `FIELDS`, `LAKE`, `RIVER`, `PASTURE` (46, 206), `CAMP` (−34, −212), `MINES` (r≈240), `MOUNT`=445. Also `height(x,z)`, `fieldD`, `sdTown`, `inside`, `sdPoly`. |
| terrain.js | Terrain mesh. **The ground splat is baked once** into a near texture (ortho 520 m) and a far texture, so runtime is about 3 texture reads per pixel. Also `fastHeight` (O(1) bilinear; use it for anything per-frame), backdrop mountain ranges, and water. |
| castle.js | Walls and towers. `ctx.weapon(x,y,z,a,'ballista'\|'cannon')` sits on **unroofed OUTER towers**: primitive placeholders, and these are what get replaced in P0-d. Also the town wall ring and gatehouses. |
| buildings.js / town.js / roads.js | Citadel buildings and farms; the procedural lower town (about 90–190 houses by quality, market, church); road polylines plus `roadDist`. |
| mines.js / gems.js / econ.js | 3 mines, floating gem badges, client economy. **Economy rules:** rate/h = 12/20/30 × (1+0.15(L−1)); mine storage holds 8 h; vault cap = 600/1000/1500 × (1+0.35(L−1)); collect is limited by vault room. The server (`state.py`) has the same rules. Redis key `bluewall:st:<uid>`; the owner starts at level 20. |
| units.js | UAL people (scale SC=1.75, about 3.1 m tall): gate guards, **6 wall archers only on alternate OUTER segments** (P0-c), villagers, puglin brutes at the gate. |
| life.js | Late creatures: horses and knights (5 patrol routes), pasture, 3 dragons (`buildModelDragon`, recoloured Prowler), **gryphon (must be removed, he hates it)**, troll/ogre, ballista creature, birds (clear or cloudy weather only), fairies at night. `loop()` skips mixers that are hidden or far. |
| creature.js | `makeCreature`, `mergeSkinned` (merges skinned parts per material with bind-pose correction `C = baseInv⁻¹·partInv`), `trimClips` (clips shifted to start at 0), `freezeStatic`, `herd` (bwCull/bwFar). |
| ui.js + hud_art.json | HUD, settings panel, welcome card, info sheets, toast, fps meter. `hud_art.json` holds the SVG art (badge, gear, bezel, gems). |
| i18n.js | English only. Includes the INFO catalogue; `infoFor(id)` resolves pick ids such as `tower_3` and `vault_ruby`. |
| settings.js / tod.js / audio.js / controls.js | Settings: clean + debounced save, `previewLevel` (owner). tod.js: Jalali date with era −655 (1405 → 750), `season()`, `todWord(h)`. audio.js: `Ambience` with WebAudio buses, loops, sfx and a music element. controls.js: `CamCtl` with `camR`=290 clamp, `zoomPolar`, intro hold. |
| assets.js | GLTF + meshopt loader, `loadGLB(name)`, `cloneSkinned`, PHTEX textures. |
| sky, weather, fx, fairies, trees, crops, village, materials, textures, dragon, dragon_model, giant, fort_day, noise, util | As named. weather.js has seasonal fronts in 30-min episodes; fog only between game hours 3.5 and 10.5. |
| **Hook modules for new work** | `army.js` `buildArmy(api)`; `defense.js` `buildDefenses(ctx)` + `lateDefenses(api)`; `moat.js` `buildMoat(ctx,api)`; `levels.js` (TIERS colour logic); `vault.js` `buildVaults(ctx,api)` → `{setFill, update, list}`; `upgradeui.js` `createUpgradeUI(mount,{econ,ui,world,audio,tg})` → `{open, update}`. Signatures and the `api` fields are in each file's header comment. These are stubs and already wired in. |

---

## 4. Approved decisions (locked; do not re-ask)

**Language and type**
- **English only** everywhere; Persian has been removed.
- Font **Libre Baskerville**, bold upright, with Noto Sans Tai Viet as fallback. Files are in `web/pub`.

**Loading screen**
- Logo **D2 "The Crag"**: the real 3D dragon silhouette over a crystal crown, fortress on a rocky outcrop.
- It is in `staged/peg/logoD/index.html` (open it with `?v=D2`) and uses `#pct`, `#bar` and `bwLoading(n)`. Not integrated yet.

**HUD** (done; variant A2 "Jewelled Gauges")
- Left: crystal hex level badge (A1 style) + account name. Tapping the level opens Settings.
- Right: 3 gem storage gauges, each showing % (or FULL) and "count / cap".
- **No date or time on the game screen.** Date and time appear only on the welcome card and in Settings, and **never the weekday**.
- Removed from settings: dragon/birds toggles (birds always show on clear days; the dragon depends on ownership), language, orientation, weather/time controls.

**Welcome card** (done)
- Style C (cinematic: letterbox, grade, rays), with the greeting centred: "WELCOME," / "My Lord", then the date and time of day.
- Voice: speechSynthesis "Welcome, my lord." (en-GB, rate .86, pitch .72) on tap.

**Picked troops** (staged; see the table in §11)
- Infantry: spearman, 2H swordsman, sword & shield guard, archer.
- Giants: troll, hill giant, werewolf.
- Creatures: skeleton mage, imp, **dragonling** (#13 on the check sheet). The baby dragon (#12) is excluded.
- Siege: catapult, cannon, Carrigan trebuchet, ram, Kenney siege set.
- Heroes: shieldmaiden, mounted lord.
- Buildings: all 12 OK.

**Horses:** all 7 new horses, in all colours (`staged/horses`).

**Cavalry: K3** (`staged/peg/knight_ual_raised.glb`)
- UAL knight with great helm + plume, longsword, navy shield, cape, "Ride" clip.
- Rides the 7 horses with proper swords.

**Pegasus**
- Style **B** wings (fade to navy/grey at the tips; he loves the fade), with the **coat fully white or fully grey, no dapples**.
- Pegasi **fly above the army** and **replace the gryphon**.

**Dragons:** attractive dragons in the sky. The owner has a dragon (later: shown only to dragon owners). He **hated** the earlier drawn/SVG dragons.

**Wall progression by level:** wood → stone → glass → iron → … → **level 20 = blue diamond**. The city also evolves with level.

---

## 5. State at handoff (built and smoke-tested, NOT deployed)

**Changes since p4**
- English only, the S3 font everywhere, and the D2-style colours in the HUD.
- New ui.js: A2 HUD, settings, welcome card C, sheets.
- Econ: vault caps, `wallet()`, collect limited by room. Server `state.py`/`server.py` return `vault` and `owner`.
- Hook stub modules wired into world.js/main.js; `loadGLB`; `ctx.levelHooks`; the owner flag; `settings.previewLevel`.
- The camera no longer goes behind the mountains (camR clamp; still needs checking on a device).
- Giant animation fix (`trimClips` + attacks timed from clip duration; still needs visual re-checking).
- Zoom hint removed; weekday removed; birds and dragon follow the rules in §4.
- A partially finished parallel agent improved `i18n.js` (INFO catalogue) and `settings.js` (clean + debounced save). Both compile and the smoke test passes.

**Performance**
- p4 on his phone: 59 FPS by day, 47–50 at night (bloom + fairies).
- Swiftshader: about 3.5 s/frame at high quality; draw calls went from 550 to about 247.

---

## 6. Task list (priority order)

Before each taste item, send 1–3 screenshots and wait. Ship a package after each meaningful group.

### P0: his latest message
"رو دیوار قلعه، ببینم خوشگل مرتب همه جا گشت میزنن کماندار ها، رو توور ها کمان بزرگ، ایکس بو. بازی وقتی ران میشه اولش افت فریم و صدا ندارد."

**a) Frame drop when the game starts.**
- Likely causes:
  - At frame 4, `startLate()` streams in many GLBs.
  - Each new material or program **compiles its shader on the first frame it is drawn**, which hitches.
  - Skinned merges run on the main thread.
  - The ground bake runs at start.
- Fix:
  - While the welcome card is up (the intro is held anyway), load the late models, add them hidden, then run `await renderer.compileAsync(scene, camera)` (three r186). Optionally also render 1 frame offscreen at low resolution to warm up.
  - Reveal them only after that, staggered across frames (one group per frame).
  - Measure with `performance.now()` marks plus the fps meter. Target: no frame over 50 ms after the welcome tap.

**b) No sound at the start.**
- Current behaviour:
  - `audio.start()` runs only on the first `pointerdown`.
  - It then fetches and **decodes all loop mp3s before starting any** (`await Promise.all` in `load()`).
  - The master gain ramps over 2.5 s.
  - Music uses an `<audio>` element that must be `play()`ed **inside the user gesture**. Telegram iOS WebView blocks it otherwise.
- Fix:
  - On the welcome tap, synchronously create or resume the AudioContext and call `el.play()` (it can start muted or silent).
  - Prefetch the mp3 ArrayBuffers during loading, before the tap, and decode them on the tap.
  - Start each loop as soon as **its own** buffer is decoded.
  - Play a short welcome sting immediately.
  - Shorten the ramp to about 0.8 s.
  - Verify on Telegram Android and iOS (ask him).

**c) Archers patrolling neatly on ALL walls.**
- Today there are only 6 archers, on alternate OUTER segments (`units.js` ~L59).
- Needed:
  - Evenly spaced archers on the OUTER Blue Wall, INNER citadel and TOWN wall walk-ways.
  - They walk the wall top, stop at towers, turn, sometimes pause and aim or look out, then continue. No clipping through towers or merlons.
- Budget: about 24–36 archers. Use merged skinned meshes (`mergeSkinned`), update far animation at half rate or freeze it, and avoid per-frame allocation.
- The wall-top height is per ring: OUTER `wallTop` 7.75; check castle.js for INNER and TOWN.

**d) Big bows / crossbows (ballistas) on the towers.**
- Replace the primitive `ctx.weapon` placeholders on the OUTER towers.
- Add ballistas to the TOWN wall towers too.
- Behaviour: a slow idle aim sweep, and occasionally fire a bolt with a little cocking animation.
- Candidates: `staged/stage_assets/siege_kenney_ballista.glb` (CC0, low-poly), or a better procedural or merged ballista in the game's style. **Show 2 options first.**

### P1: integrate the approved assets
1. **Loader D2 into `web/index.html`.** Keep all the auth, bundle and error logic intact. Port the markup, CSS and SVG from `staged/peg/logoD/index.html`. Copy `img/crown.png` and `img/dragon.png` into `web/pub`. Drive `bwLoading(pct)` from the existing progress callback.
2. **K3 cavalry on all 7 horses**, replacing the current knights in life.js `_knights`.
   - The seat table, bones and code snippet are in `staged/peg/README.md` §3.
   - Mesh2Motion horses: length 7.48, bone `spine_3`. HQ horses: bone `Torso2`. **Do not attach the rider to `Back`.**
   - Use the clip `Ride` (1 s). Don't loop the 9 s mixamo clip; the rider falls off at 7.5 s.
   - Horse details are in `staged/horses/README.md`; the tack mesh is `Tack`.
3. **Pegasus.**
   - **The body UVs of A and B are identical (verified: 4366 verts, max diff 0)**.
     - White version: load `pegasus_B.glb` and swap the `HorseHQ_grey` material map for A's `coat_white` texture.
     - Grey version: the same white map × a colour of about #9aa0a8 (flat grey, shading kept).
     - Doing this offline with gltf-transform into `pegasus_white.glb` / `pegasus_grey.glb` is cleaner.
   - Clips: `Fly` (1.2 s), `Glide` (4 s). Forward is +Z. Bank with Euler `'YXZ'` (see README §1). Wingspan about 20 m (`makeCreature` length 20).
   - Fly them above the army and **delete the gryphon**.
   - Show a white + grey sample first.
4. **Dragons:** make them attractive (materials, wing membrane translucency, smooth flight). Visible when `OWN.dragon` is set. Show a sample first.
5. **Army around the kingdom** (army.js), using the picked entities in §11.
   - Camps or formations at `CAMP` and along the roads, plus patrols of cavalry and heroes around the town ring.
   - Siege engines parked near the camp, giants at the gates, the dragonling near the keep.
6. **Stables:** `bld_stable_yard` + `bld_barn_small` near `PASTURE`, with horses.
7. **Town** (defense.js):
   - Distinct house types (already varied in town.js; make them more readable).
   - Towers and watchtowers between the houses, cannons and catapult towers.
   - Windmills (`windmill_tower`, `windmill_aartee`), wells, carts, barracks/archery (KayKit).

### P2: environment
- Moat water: beautiful and rich, or a natural moat with stone-lined banks, reeds and lilies, and a better shader (moat.js).
- Map realism and charm.
- Mountains.

### P3: levels and economy
- Wall and town visuals per level: wood → stone → glass → iron → … → blue diamond at 20. Use levels.js plus `ctx.levelHooks`.
- Builders and timers: a server endpoint (`/api/upgrade` in state.py/server.py) plus `upgradeui.js`.
- A vault building per gem on the map, whose fill follows the wallet (vault.js `setFill`).
- An owner-only "Kingdom" tab with a level preview slider (`settings.previewLevel` already exists).

### P4
- Landscape: it must look beautiful when the phone is rotated (adapt layout and camera).
- Night performance: bloom and fairies.
- Gem and level UI elements: rich and 3D.
- **Only after all of the above:** attacks.

---

## 7. Performance rules

- One draw call per material: merge static meshes (`freezeStatic`, the static batch `B`) and merge skinned parts (`mergeSkinned`); use instancing for repeats.
- Cull by distance and visibility; animate far objects at half rate or freeze them.
- No per-frame allocation or terrain queries; use `world.fastHeight` or precompute.
- Before and after each change, measure with `PAGE=dev.html SLEEP=40 python3 /home/claude/dev/perf.py high`, which reports draw calls, triangles and ms/frame.
- Current budget: about 250 draw calls at high quality. Keep it under about 300.

---

## 8. Gotchas (these bit us)

**Skinned meshes and animation**
- Naively merging skinned parts with different `boneInverses` made the troll **explode**. Use the bind-pose correction already in `mergeSkinned`, and use the saved `host = main.parent`, not `main.parent` after removal.
- Some clips start late (the troll's started 3.5 s in), so always run `trimClips`.
- Set the loop mode explicitly (LoopOnce for attacks).

**Colour and the terrain bake**
- `ph_*` textures are sRGB. Don't convert them to linear twice in the bake; the final shader applies pow 2.2.
- Mountains looked too pale. The rock is darkened in the bake and the snow line sits at 190–245 m.

**HUD layout direction**
- An RTL page flips the HUD. Keep `.bw-ui{direction:ltr}`; dev.html is `lang=en dir=ltr`.

**Name shadowing in ui.js**
- A `CSS` const shadows `window.CSS`, so use `window.CSS.supports`.

**Screenshots and harness timing**
- The welcome card auto-hides after 9 s; for screenshots of it use `&wa=600`.
- Late models stream in after the first frame, so wait about 40 s before taking creature screenshots.
- Swiftshader is slow, about 3.5 s per frame at high quality.

**Process**
- Never edit the owner's server by hand. Change things only through packages.
- Keep `py_compile` passing.

---

## 9. Test harness (`/home/claude/dev`)

- Start the static server with `bash up.sh` (port 8777). Build with `bash /home/claude/bot/bluebot_v2/bluewall/client/build.sh`.
- **Screenshot:**
  ```
  PAGE=dev.html python3 shot.py W H out.png QUALITY "<js after ready>" WAITSEC HOUR
  ```
  - Example: `python3 shot.py 390 844 a.png high "__cam(60,40,90, 0,2,30)" 40 12`
  - Env: `WX=clear|rain|snow|storm|fog…`, `EXTRA="&s=3&sp=0.5"` (winter preview), `EXTRA="&wa=600"` (keep the welcome card), `DPR=`.
  - Camera helpers (cam.js): `__cam(px,py,pz, tx,ty,tz)`, `__follow(dx,dy,dz)`, `__knight(i,dx,dy,dz)`, `__look(materialName,dx,dy,dz)`.
- **Evaluate JS:** `PAGE=dev.html python3 q.py "<expr>" WAITSEC` (runs at q=low).
- **Performance:** `PAGE=dev.html SLEEP=40 python3 perf.py high`.
- `agent_build.sh <name>` builds a separate bundle plus `dev_<name>.html`, for parallel work.
- **Check every change:**
  - no `PAGEERR`;
  - day (h=12) and night (h=22);
  - winter preview;
  - portrait 390×844, and landscape 844×390 for layout work.

---

## 10. Before shipping a package

1. `build.sh` succeeds, the smoke test passes, and there are no console errors.
2. Screenshots by day and by night, and you looked at them critically.
3. perf.py shows no regression.
4. If the server changed: `python3 -m py_compile bluewall/*.py`, then the local server plus `dev/api_test.py`.
5. Merge credits into `web/assets/credits.json` for any new asset.
6. `mkpkg.sh`, then send the file with SendUserFile plus the one install line. Write the Persian summary in 2–4 bullets.

---

## 11. Staged asset inventory (`/home/claude/staged`)

- `stage_assets/spec.json` holds, for every entity, its files, attachments (bone, pos, rot, scale), clips, scale and the render tile. `stage/x.glb` means a file in `stage_assets`; `web/x.glb` means a file already in `web/assets`.
- `credits_add.json` holds the credits to merge. `_stage_pack.mjs` is the packer.

| pick | spec id | files |
|---|---|---|
| Infantry 1 spearman | inf_spearman | anims_ual2, helmet2, shield_heater, spear + web/ranger_* |
| Infantry 2 2H swordsman | inf_swordsman_2h | anims_ual2, claymore, helmet3 + web/ranger_m |
| Infantry 4 guard | inf_guard | anims_ual2 + web/ranger_m, shield, sword |
| Infantry 5 archer | inf_archer | web/anims, bow, ranger_f |
| Giant troll | giant_troll | web/troll (also stage troll_full.glb) |
| Giant hill giant | giant_hill | hill_giant, hammer_double + web/anims |
| Giant werewolf | giant_werewolf | web/werewolf |
| Creature skeleton mage | cr_skel_mage | skel_mage, skel_staff, kk_anims |
| Creature imp | cr_imp | web/imp + web/anims |
| Creature dragonling (#13) | cr_dragonling | dragonling |
| Siege catapult / cannon / ram | siege_catapult / siege_cannon / siege_ram | web/catapult, web/cannon, web/ram |
| Siege trebuchet (Carrigan) | siege_trebuchet2 | trebuchet2 |
| Siege Kenney set | siege_kenney | siege_kenney_ballista/catapult/ram/tower/trebuchet |
| Hero shieldmaiden | hero_shieldmaiden | shieldmaiden, shield_round2, sword_mw + anims_ual2 |
| Hero mounted lord | hero_mounted_lord | web/horse_white + web/horseman (switch it to a new horse + K3-style rider) |
| Buildings (all 12) | bld_* | stable_yard, barn_small, windmill_tower, windmill_aartee, well_stone, hay_cart, market_cart, kk_barracks, kk_archery, kk_cattower, castle_wall_lp, general_tent |

- `horses/`: 7 GLBs: `horse_m2m_bay/black/grey`, `horse_hq_bay/black/grey`, `horse_hq_barded`.
  - The Mesh2Motion horses use length ×1.335.
  - README covers clips, bones and the `Tack` mesh; `tools/` holds the build pipeline.
- `peg/`:
  - pegasus_A/B/C (use B, see P1-3);
  - knights: K1 `knight_plate_raised`, K2 `knight_plate_lowered`, **K3 `knight_ual_raised` (approved)**;
  - `logoD/` (approved D2); README; `k/_attach.json`; `tools/`.
- `chars/README.md`: the candidate list with quality notes and licence flags (the numbering the owner used for his picks).
- Licences: CC0 except where `credits_add.json` says CC-BY. Quaternius packs are OK.
