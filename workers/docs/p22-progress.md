# Blue Wall — package p22 (3 Oct 2026, night) — soul pass: loader, water, heraldry, gear, pasture, scatter, cannons, Assist, heat; bot levels off

Install (Blue Wall + bot in ONE package): `cd /root && tar xzf bluebot_bluewall_p22.tar.gz && bash bluebot_bluewall_p22/install.sh`
Rollback: `bash /root/bluebot_bluewall_p22/rollback.sh`. After the owner confirms: `bash /home/claude/pkg/mkpkg.sh --commit bluebot_bluewall_p22`.
New installer guard (addbot.sh, `BOTBASE`): a bot file that changed on the server after my copy (another update) stops the install before anything is touched.

Owner messages 16:06 / 16:12 / 16:37 / 17:15 → `bluewall-owner-feedback-oct3.md` (appended).

## Work split (7 parallel workers + integrator; brief: dev/BRIEF_p22.md; 2-CPU browser semaphore dev/sem.sh)
| Worker | Result | Files |
|---|---|---|
| loader | moonlit key-art loading screen: pre-rendered castle/wall plate + mountain plate, real 3D-rendered jewelled crown (glint sweep), god rays, mist, stars, flickering windows that light up with the progress, beating dragon wings, forged steel bar. CSS-only motion (0.2–1.2 ms/s main thread). Boot script byte-identical. `LOOK` A/B. | web/index.html, web/pub/ld_*.webp (11 files, ~250 KB per session) |
| water | one water shader for moat/lake/river: wind waves, gust patches, surge every ~100 s, foam, caustics, baked-height reflections (good on low/medium), moon path + torch streaks at night, winter ice. Life: 166 fish (leaps + rings), swans + mallards, jetty + rowboat + lantern, reeds/cattails/lilies, mist, fireflies. Pale-lake root cause: reflect.js cleared to the fog colour (fixed). `WATER_LOOK`. | moat.js, terrain.js (water), water_life.js; reflect.js patch |
| heraldry | crests: forged steel shield, rivets, sapphire, enamel field, raised silver charges (24 px legible); one cloth mesh for every flag/pennant/banner/tapestry, GPU wind; tapestries on the outer wall faces; gate plaque (slate + gold letters, glows at night) `setGateName`. `CREST_STYLE`, `CLOTH`, `PLAQUE_STYLE`. | emblems.js, textures.js, castle.js, her_flags.js; world/main/battle patches |
| gear | shields were mounted backwards (straps facing the enemy) + whole-shield tint → painted navy boards with the realm's crest, tier only on rim/rivets (iron→steel→gold→silver→crystal); defenders carry the defender's crest; proper metal PBR; horsehair plume (34 locks, vertex sway, tier colours); pegasus pearl/dapple coat, ice-blue tipped wings (`PEG_LOOK`). | crowd.js, army.js, bunits.js, gear_shield.js, gear_plume.js, gear_pegasus.js |
| pasture | **horses fell because the resting clip regex `/idle|eat|graz/` matched "D-eat-h"** → every resting horse looped its death. New herd on GPU crowds (walk/trot speeds from hoof motion, grazing, foals, trough), 5 cow breeds; real stable estate (stone footing, boards, Dutch doors, shingles, loft + hoist, cupola, vane, lanterns), post-and-rail fence + gates, keepers' camp (yurts, black tent, fire + smoke, hay cart, saddles), grooms/farrier/trainer. Old kit fence + blue well house removed. `STABLE_LOOK`. | life.js, military.js, nomads.js, pas_geo.js, pas_stable.js, pas_life.js; buildings/world/terrain/creature patches |
| scatter | procedural boulders (fracture planes, moss texture, crevice AO, half-buried, grass tufts) replace dodecahedra + faceted GLB rocks; card bushes baked from ez_bush/bush (sway, seasons); mines: baked rock mass, ore crystals glinting, timber shoring; far trees: side+top impostor (round crowns from above); the "placeholder boxes" were hamlet farmhouses with near-white/black roofs → rustic palette, gardens, trees, ground shadows. −2 draw calls, −139k tris. `ROCK_LOOK`. | world.js (scatter), trees.js, mines.js, hamlets.js, sc_*.js; town.js patch |
| botlevel | bot game levels OFF (one flag `LEVELS_ENABLED=False` in services/level.py): no level-ups/burn/rewards/DM; level removed from the group profile card, home box, private profile, welcome DM, admin card/buttons/stats/persona, user_management line. Rank/cups/leagues untouched. 12 files. | modules/game/…, modules/admin/… |

## Integrator (me)
- **Heat:** high preset dpr 1.35→1.25; idle → 30 fps after 3.5 s (was 12 s); any panel/hub open → ~16 fps behind it (dynamic resolution never judges those frames); shadows refresh every 5th frame while idle/behind panels; the sun's shadow box follows the view at home (stable/pasture/camp get shadows, refreshed only when it moves).
- **Assist:** new button (forged bezel with a turning light, enamel core, eight-point royal star seal, breathing halo, pulse ring when the army is ready or the log has news, tap flash); hub: realm crest + name in the header, steel-rimmed panel with a running edge light, medallion tiles rising in one by one, Banner tile shows the crest.
- **Back navigation:** a panel opened from the hub gets "‹" in its header → back to the hub; Telegram's own Back button (top-left) is live whenever the hub or a panel is open (hub → map, panel → hub). Watches the panels' class only (MutationObserver).
- **Cannons on towers** (cannons.js): castle.js always asked for a cannon on every other weapon tower, world.js dropped the type → all were ballistas. Now cast-iron guns on garrison carriages (scan, rare salute with recoil/flash/smoke; 5 draw calls total); in raids those towers fire cannonballs.
- **Archer towers:** two archer sentries on every weapon tower (patrol.js, same crowd as the wall patrols).
- **Dragonlings at home** (dragonling_home.js): before the egg is bought a glowing green egg in the Lair nest; after: two green dragonlings (one hovers over the nest, one circles and swoops past the cave). Lazy-loaded, 30 Hz, frozen when far / in battle.
- **Owner tools** (Settings, owner only): "Showcase: 2 Tesla coils + the Dragonling", "Remove the showcase", "Test balance +200 sapphire +40 onyx" (server /api/dev; the showcase alone does not take the kingdom off the leaderboard).
- **Attacks open to every player** (`BLUEWALL_ATTACK` default public; `=owner` closes). Server now enforces minimum losses: a report claiming damage with ~no losses loses at least 12 % of the defence's power × destruction (6 % with spells), cheapest units first.
- Conversions kept (1 🔵 = 1 hour of the matching mine at any castle level; consistent with the bot's own 10🔵=1🟢, 5🟢=1🔴; the timeline is protected by the daily rush cap + vault caps). Editable in admin.
- Gate name: the player's name over his own gate (in a raid: the defender's).

## Checks
- Gate: ALL OK (api 1–6, social/gift/clan/prem/econ, nomad plan, bot_xfer, battle sim 0 wall crossings).
- e2e through the NEW loader (real server, non-owner test player): loader → game → Assist → Attack → battle loading ✅ (attacks open).
- Back navigation script: hub → Shop → ‹ → hub → Back → map; Shop opened directly → Back → map; ✕ from a hub-opened panel → map ✅.
- Reviewer (fresh agent) found 7 bugs, all fixed: dragonling load-failure loop (freeze), Back with two panels open (open-order stack), result screen now shows the server's losses, shadow box steps 20 m (not every frame), cannon sound = boom, cannons animate every battle shot, world speed behind panels (dt 0.1). Also: gem glow animates opacity (no repaint), env parsing, loss floor rounding, sentries inside the parapet.
- Installer sandbox (full bot tree + p21): install ✅ → rollback identical ✅; a bot file changed after my copy → install refused before touching anything ✅.

## Open / next
- Real-device heat/FPS numbers from the black box after the owner plays (journalctl -u bluebot-wall | grep perf).
- Taste switches waiting for the owner: LOOK (loader A/B), WATER_LOOK, CREST_STYLE/CLOTH/PLAQUE_STYLE, PEG_LOOK, STABLE_LOOK, ROCK_LOOK.
- Known: pegasus folded wing bulky (model's Rest pose); swans simple up close; fairies float over the stable yard at night.

## p22 final loader (owner, 4 Oct 00:08–01:26) — rebuilt before install
- Crown removed. Title = real 3D letters (Cormorant Garamond 700, sapphire metallic lacquer faces, black chrome rim, HDRI-lit) `pub/ld_title3.webp`, subtitle "— RISE OF THE KINGDOM —".
- Alive: slow turning light rays + breathing glow + expanding light rings behind the title, light sweep across the letters, twinkles (CSS only). Dragon wings held (glide only — no stutter/heat).
- Progress bar = a real sword (owner pick: rune blade B on the knightly hilt C; original design — the Frostmourne reference was declined), HDRI-rendered `pub/ld_sword.webp` + blade mask `ld_sword_m.webp`; blue light fills the blade to a pulsing spark; no % shown.
- Assist button: real crossed sword + smith's hammer on the steel bezel (`assets/ui/assist_icon.webp`).
- Render tools: dev/s23 (title3d.js, sword5.js, HDRIs from the three.js repo: Poly Haven CC0).

## p22 final round (owner, 4 Oct 01:18–03:00): "sword, font and the hero's axe — complete, precise, deep"
- **Bar sword, path-traced** (three-gpu-pathtracer, dev/s24/sword_pt.js): rune blade B on hilt C; **two sapphires (deep blue, the game's sapphire) in raised roundels on both guard arms, both faces**, claw-set over foil; **domed black onyx in the wheel pommel** (both faces); gunmetal guard faces with polished bevels, langets on the blade, tight leather-cord grip, silver ferrules. 2800×600 at 112 spp → `pub/ld_sword.webp` 1400×300 (+ mask `ld_sword_m.webp`); loader SW = {w 1400, h 300, b0 .222, b1 .9857}, fill/spark start 22.2 %.
- **Title, path-traced** (dev/s24/title_pt.js): same letters/materials as the approved raster version, real HDRI reflections, weaker key light (the raster's key washed the "B").
- **War axes** (`client/src/gear_axe.js`, procedural, shared canvas textures): forged bearded head (hammer dents, fire scale, wavy ground bevel), socket + riveted langets, oiled ash haft, leather-cord grip, iron butt cap.
  - Gate giants (units.js): the bronze toy `axe.glb` → forged steel axe (axe.glb no longer loaded).
  - Shieldmaiden hero: sword → **blued war axe** (army.js home s .64, bunits.js battle s .75; flat iron/brass parts follow the tier metal); `sword_mw.glb` no longer loaded; card text "a blued war axe".
- Owner answer 02:2x: "the hero's axe" = **both** the gate giants and the shieldmaiden.
- 03:03–03:18 owner: "shield reversed" (on my raw dev test — the game's shield, gear_shield.js, is correct and was not touched; showed the in-game render).
  "Sword grip deep blue" → sapphire-blue leather cord (re-rendered, `ld_sword.webp?v=6`). "Put the axe handle properly in her hand" → `AXE_GRIP` (gear_axe.js):
  measured on the UAL hand rig (knuckles y≈.12, fingers curl −x, knuckle line z) → haft along z through the fist at (−.025, .09, 0), rot XYZ (90°, −90°, 0);
  same for the gate giants (same hand rig); the giants' own wooden club (`Puglin_Stick`) removed so it no longer crosses the axe.
  "Blue hair too?" → 4-shade sheet (0 silver, 1 ice, 2 light, 3 deep); shipped with 3 (`gear_maiden.js MAIDEN_HAIR = 0x2445c8`, one constant) pending his pick.
- Checks: gate ALL OK; e2e home (no console errors); e2e battle with a shieldmaiden in the army (tray ×1, loaded, no errors); installer sandbox install ✅ / rollback identical ✅.
