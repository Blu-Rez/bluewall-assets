# Blue Wall — p22 shared brief (read fully before you start)

Project: "Blue Wall", a Telegram Mini App castle-strategy game (three.js r186, mobile portrait first, must also work in landscape).
Owner: Persian-speaking ("Wingless"). Quality bar: top mobile strategy games (Clash of Clans, Siegefall, Rise of Kingdoms) — semi-realistic,
"with soul" (life, light, motion, detail), BUT it must stay cool on ordinary phones: **the owner reports the game makes his phone very, very hot**.
Every change must be cheap at runtime (instancing / merging, shader-driven animation, distance culling, no per-frame allocations, no per-frame
terrain queries, no new full-screen passes, no new shadow casters unless tiny). Measure with perf.py when you add geometry/materials.

## Tree
- Client: /home/claude/bot/bluebot_v2/bluewall/client/src (ES modules; entry main.js → world.js). Bundled by esbuild.
- Web root: /home/claude/bot/bluebot_v2/bluewall/web (index.html = loader + boot; assets/ = meshopt GLBs, webp textures, credits.json; pub/ = fonts + loader images).
- Server: /home/claude/bot/bluebot_v2/bluewall/*.py (aiohttp; state in Redis).
- Dev harness dir: /home/claude/dev (static server on 8777 serves it; `assets` and `pub` there are symlinks to the real web folders).
- Scratchpad for your shots/notes: /tmp/claude-0/-home-claude/afed4ef9-3c4d-54ed-bbda-649fb789829d/scratchpad/<yourname>/
- The owner's 4 phone screenshots (1280x2772) of the current build, downscaled: same scratchpad: 1387ff4d.jpg (top-down view: papercraft rock pile at a mine,
  odd dark/blue boxes near the bottom), 3100b9b0.jpg (soldiers: wrong light-blue shields, huge low-poly green pentagon bush, faceted grey rocks),
  5b3a80a0.jpg (current loading screen), 8c204349.jpg (stable + pasture: horses lying/falling, pegasi, flat lake behind).

## Rules for parallel work (IMPORTANT — 7 workers edit the same tree at once)
1. EDIT ONLY the files listed as yours. Read anything. Need a change in someone else's file (esp. main.js, which is the integrator's)? Don't edit it —
   put the exact patch (old → new) in your final report. You may CREATE new files (prefix them clearly, e.g. `water_fish.js`).
   The Edit tool fails if a file changed since you read it — re-read and retry; never overwrite whole files you don't own.
2. Build & test ONLY your own bundle: `bash /home/claude/dev/agent_build.sh <yourname>` → http://127.0.0.1:8777/dev_<yourname>.html
   (never run client/build.sh or dev/rb.sh; the integrator does release builds). If the bundle breaks because of someone else's file, wait 1–2 min, retry.
3. **This machine has only 2 CPUs.** Wrap EVERY browser run (playwright/chromium: shot.py, lookshot.py, perf.py, your own scripts) in the semaphore:
   `bash /home/claude/dev/sem.sh python3 /home/claude/dev/shot.py ...` (at most 2 browsers run machine-wide; you may wait in the queue).
   Full-world shots under swiftshader take ~1–3 min; prefer small focused dev pages (look_dev.js / your own *_dev.html built with esbuild like
   look_dev) for iteration and use the full world only to verify. Keep the number of full-world shots modest. Close browsers (scripts do).
   Start the static server once with `bash /home/claude/dev/up.sh` (idempotent).
4. Full-world screenshots: `cd /home/claude/dev && PAGE=dev_<name>.html LATE=1 bash sem.sh python3 shot.py 390 844 OUT.png high "__cam(px,py,pz, tx,ty,tz)" 3 12`
   args: width height out quality(low|medium|high|ultra) js-after-ready wait-seconds hour(12 day / 22 night). Env WX=clear|rain|snow, EXTRA="&s=3&sp=0.5" (winter).
   Camera helpers in /home/claude/dev/cam.js (`__cam`, `__look`, …). `window.__bw` exposes {scene, camera, renderer, world, ctl, THREE, frames, lateReady}.
   Layout constants: client/src/layout.js (L.PASTURE, L.LAKE, L.CAMP, L.TOWN …). The world is ~±450 m; the castle at the origin.
   perf: `cd /home/claude/dev && PAGE=dev_<name>.html bash sem.sh python3 perf.py high` → ms/frame (swiftshader), draw calls, triangles.
5. Assets: only CC0 / CC-BY (record credits in scratchpad/<yourname>/credits.json as [{name, by, license, group}]). Prefer procedural.
   New GLBs/textures into web/assets with your prefix. The network is restricted (package registries + GitHub only).
6. All in-game text is English. The words "bot" / "ربات" are NEVER shown to players. Fonts: 'Libre Baskerville' (pub/baskerville-700/400.woff2),
   Cinzel (pub/cinzel-900?.woff2 – check pub/), Vazirmatn. Palette of the kingdom: light blue / ice, navy, black, steel (+ warm torch gold accents).
7. Verify before you report: no console errors (PAGEERR), day h=12 AND night h=22, portrait 390x844; look at your screenshots critically and iterate
   until it is truly beautiful and believable. No placeholders.
8. Final report (concise, < 60 lines): what you built, files changed/created, screenshot paths (2–4 best), perf before/after, exact patches for files
   you don't own, anything the integrator must wire, known issues.

## Owner's words (3 Oct, translated) relevant to all
"Fix accurately and deeply. Give the game soul. Optimize — the game heats the phone very very very much. Take ideas from other games.
Don't rush, but deliver soon." Taste items: when there is a real taste choice, implement the best one as default AND keep 1–2 alternatives
switchable by a single constant, and save a small side-by-side sample sheet PNG (the owner picks; default ships).
