# p29 — progress (Oct 4, after the first real-phone overlay screenshot)

## Owner requests (17:09–17:11)
1. ultra must be optimised too (not downgraded).
2. Tesla coils: max 2 → **4**.
3. Loader: age the dragon, the castle and the pine trees; **dragon static** (no drift) — the small far "drake" that flew across is hidden.

## First REAL numbers (his phone, p28, overlay on, home/clear/idle)
preset **ultra** · dpr 2.00 × dyn 1.00 → 788×1706 · 30 fps / 33.2 ms (cap 30 = idle saver) · calls 401 · tris 2.97M · prog 340 · tex 474 · geo 384 · JS 12.8 ms (render-submit 10.7, units 0.7, life 0.7, dragon 0.3, army 0.1) · shadow 1/2 · refl on · bloom idle · battery 58 %.
Reading: CPU is fine at 30 fps (13 of 33 ms) but tight at 60 (13 of 16.6). The sandbox numbers were `high`; ultra is heavier (dpr 2, shadow 2048 every 2nd frame, msaa 4 at night, 6 lights).

## What p29 changes
- **Tesla ×4**: `shop.py` TESLA_MAX 4 + prices [10, 15, 20, 25] onyx (an older saved list of 2 prices keeps them, 3rd/4th = +5 each), `military.py` victim cap 4 (defence power +8 % per coil, as before), client `teslaSpots(…,4)` / `tesla.js` (4 coils on the 4 weapon towers closest to the main gate — at home and in a raid), shop card ("All four towers stand guard" / "Add another coil"), owner showcase = 4 coils. Owner's own home map shows all 4 (`vis` = TESLA_MAX). Sandbox: 4 coils present + visible at (128,26) (39,44) (124,-36) (42,133).
- **Loader art**: `ld_P_near`/`ld_L_near` (castle + pines: wobbled brick courses ≤1.2 px, uneven brick tone, rain streaks, grime at the foot, cold lichen, cracks, faded slate roofs; pines: needle noise, snow clumps, darker undersides; windows/gate/torch glow protected), `ld_dragon` (worn leathery skin, scratches, frayed rim, a few tears, duller rim glow). Tool: `dev/s29/age_loader.py near|dragon SRC DST [K]` (originals in `dev/s29/orig/`). `?v=2` on the three files in `index.html`.
- **Loader dragon static**: `#ld-dragon{animation:none}`, `#ld-drake{display:none}`.
- **Ultra, same look**: (1) far meadow cells (grass/ferns/flowers) draw 100 % → 40 % of their instances by distance (continuous, shuffled once, `assets.js meadowLod`, sandbox: default view tris 2.94M → 2.78M = −5.7 %, pixel-diff vs LOD off = animation only); (2) ultra's idle (30 fps) shadow refresh every 3rd frame instead of every 2nd (active play unchanged: every 2nd); (3) **GPU time in the overlay** (`gputime.js`, EXT_disjoint_timer_query_webgl2 when the phone offers it, else "gpu n/a"), split shadow frames / other frames — only queried while the overlay is on.

## Honest limits
- Nothing here is measured on a phone yet. The meadow LOD + idle shadow cadence are small (single-digit %), they are NOT the big lever. The next real data is the GPU ms line.
- If GPU ms is high at ultra: next steps = LOD for baked soldiers (~340k tris), tree-leaf shadow proxy, night composer msaa 4 → 2, 6 lights → cheaper far-view shading.

## Added at 18:01–18:05
- **Loader title centred** (landscape): `index.html` `L.t3` x 470 → 422 (= 844/2); the title, subtitle and halo now sit on the screen's centre line, the castle gate and the sword already did. Portrait was centred.
- Verified (sandbox): gate green except `bot_xfer_test` (no sqlalchemy here); `econ_test` OK incl. "four Tesla coils, not five" + old 2-price list padded to [12,18,23,28]; camtest clean; `e2e_hero` battle starts, no console errors; installer ok + rollback identical (`instest_bot.sh bluebot_bluewall_p29 ok`). 4 coils checked in a top-down shot (all four wall towers show a coil).
- Package: `/home/claude/pkg/bluebot_bluewall_p29.tar.gz` (18 files, 1.2 MB). NOT committed yet (`mkpkg.sh --commit bluebot_bluewall_p29` after he confirms; p28 was committed 17:09).

## p30 queue (owner 18:01, "after p29 is delivered")
1. White barn / yard in front of the soldiers (battle + home) → realistic. Findings so far: `barn.glb`/`silo.glb`/`coop.glb` are flat-colour GLBs (White 0.64 grey, RoofBlack …) and the stable estate is procedural (`pas_geo.js`); in battle the light is brighter, everything pale looks white. Needs a dev-scene battle shot of that spot first.
2. Giant (ogre / hill_giant) in battle: club in hand + proper walk (home version has the club).
3. Bridge: soldiers get stuck → pathing / crowding at the bridge (sim + visual).
4. Giant wades through the moat (no bridge, wading visual).
5. Health bars (units + buildings): redesign, SAMPLE first (ONE image); navy / steel, red only for danger.
