# BRIEF — Blue Wall master plan v5 (shared context for all planning agents)

## The product
"Blue Wall" = a Telegram Mini App strategy game (Clash-of-Clans / Siegefall style) that is part of the Telegram bot **BlueBot v2** (@Blue_Hearts_Bot).
Web app: https://game.bluhearts.com ; server service `bluebot-wall` (Python aiohttp). Players run a medieval kingdom (the "home map": castle, walls, moat, town, mines, vaults, army camps),
train an army (soldiers, flying horses, dragons, siege), cast spells, and attack other players' kingdoms. The enemy map IS the main map re-skinned (same detail level).
Gems: ruby / emerald / turquoise ("فیروزه" = turquoise). Client: three.js r186 + esbuild, vanilla JS in `/home/claude/bot/bluebot_v2/bluewall/client/src/*.js` (read-only for you!).
Server: `/home/claude/bot/bluebot_v2/bluewall/{server.py,state.py,military.py,progress.py,sim.py,auth.py,access.py,names.py}`.
Owner: **Wingless** (Persian speaker, works from his phone, Poco X8 Pro Max, inside Telegram). He reviews screenshots and approves plans item-by-item with ticks.

## Where the existing knowledge is  (READ these first — do not re-invent what is already decided)
Local copies (plain text) in `/home/claude/dev/`: `_plan-v4.md` (master plan v4), `_p5-progress.md` (progress log), `_doc_master.md`, `_doc_feedback2.md`, `_doc_design.md`, `_doc_p5.md`, `_fb3.md` (newest owner feedback 15:50–18:34 of 1405/07/10).
Also in the claude.ai Project "آپدیت ربات" (use the Projects tool `project_read` with these paths if you have that tool; otherwise ignore):
`claude/bluewall-master-plan-v4.md`, `claude/p5-progress.md`, `claude/bluewall-owner-feedback-oct2.md`, `claude/bluewall-owner-feedback-oct2-part3.md`, `claude/bluewall-progress-military-design.md`,
`claude/bluewall-handoff.md`, `claude/bluewall-assets.md`, `claude/game-overhaul-plan.md`, `claude/game-overhaul-owner-requests.md`, `claude/shop-fix-requests.md`, `claude/web-panel-*.md`, `claude/eye-game-spec.md`, `claude/hokm-game-spec.md`.
Package/dev tooling lives in `/home/claude/dev` (rb.sh builds, dsess.py/dq.sh = headless-browser dev session, bs_wall.js = headless battle sim harness).

## Hard rules of the owner (every plan item must respect them)
- Colours: light blue / navy / black / steel. Performance: >= 55-60 FPS on a mid phone, < 300 draw calls, cool phone (heat matters). LOD everywhere.
- Assets only CC0 / CC-BY (credits in `web/assets/credits.json`). No word "BOT"/"ربات" shown to players in game. Enemy names come from the bot's games name list.
- Security: never print/ask for tokens or secrets; never edit the owner's server by hand; everything ships as a package `.tar.gz` + ONE install command (+ rollback).
- Sequential small verified steps; every visual change is verified with screenshots; taste items (icons, logos, style) need 2-3 SAMPLE screenshots BEFORE integration.
- Goal: "months without bugs". Every few hours one plan is finished and delivered as a package.

## The owner's standing demands (collected, must all appear somewhere in the plans — never drop one)
loader/poster quality; grass/ground quality; spell icons + spell effects; water reflection; destruction (esp. vaults) that looks real; soldiers/walls quality; 100% destruction = the WHOLE map;
swords logo ("real and otherworldly sword", rejected the old one); LOD; perf/heat; bottom-strip build/train UI; flags/emblems/logos; cups/leagues/leaderboard/friends referral (the inviter gets 1000 فیروزه);
single "Assist" button at the bottom with sub-pages; small top attack button; nomad tents; tutorial; 20 levels ≈ 1 year at ~3 h/day play; defenses; attack history; clan flow; music (calm at start, epic in rain/war); dragons = army (no dragon spell);
tidy army (rows + coloured squad circles); HP bars; epic battle audio; camera must never enter houses/towers/cows; epic attack UI "from status to final stats"; trees must not stand where the army deploys;
scouting view needs NEXT (next opponent + its map), pretty available loot, choice attack / go back; every wait/search shows a percentage; the NEXT button must hide once the attack starts;
"Telegram isn't responding" freeze report (ANR) -> flight recorder + root cause; night glare/heat; spell icons = style A glass orb (chosen, being integrated); loader title = B (N2).
Latest owner mood (18:58): he feels the game is still "confused/chaotic" (no single clear flow), spell logos still old, and he feels the work lacks FINESSE / delicate attractiveness ("ظریف و جذاب‌سازی"). He wants a complete, exact, deep plan written by several parallel people and then audited.

## What you must produce
You are ONE of six planning agents, each owning one area. Work READ-ONLY on the code (never edit source files, never run browsers/headless sessions, never kill processes, never touch the server). Only write your own plan file.
1. Research: read the relevant source files + docs for YOUR area. Judge the REAL current state from the code (what exists, what is half-done, what is missing, what could be buggy). Where useful, look at screenshots in
   `/tmp/claude-0/-home-claude/f1defe4a-d564-51fb-b3f4-8e39cac67238/scratchpad/ds9/*.png` (the newest battle screenshots; open with the Read tool) and `ds5/b0.png`.
   You may search the web (WebSearch) for how Clash of Clans / Siegefall / Clash Royale / Boom Beach / Rise of Kingdoms solve the same problem — cite what you learned briefly.
2. Analysis: list concrete problems and gaps (be honest and specific: file + function when you can).
3. Plan: an ordered list of work items. Each item:
   `ID` (area letter + number, e.g. A12) | title (Persian) | why (owner need it serves) | how (files/functions/approach, concrete) | done-test (an objective check: screenshot, number, harness output) | risk | effort (hours) | priority P0 (blocks a good game) / P1 / P2 / P3 | depends-on.
4. A short "bugs I suspect" list (things that will bite later) and a "polish list" (small refinements that make the area feel crafted: micro-animations, easing, sound, haptics, empty states, copy).
5. A proposed order of delivery as packages (each package ~3-4 h of work) for YOUR area only.
Write in **Persian** (technical identifiers/file names in English), tight and exact — no filler, no marketing words. Max ~300 lines. Write to the file named in your task. Finish with a 10-line summary at the top ("خلاصه") listing the top 5 risks and top 5 first actions.
Be critical: if an earlier decision looks wrong or a feature conflicts with another one, say so and recommend.
