# GR1 — progress (the ground at eye level + real streets)

State at push: **both jobs built and proven on the software-GL rig; sheet answer from Wingless still open → default used** (look A + soft contact shadows from B). Evidence: `report_GR1.md`. Test: `bash dev/gr1_test.sh` → `GR1 OK`. Gate: `GATE_W: ALL OK` (noRoute 612, baseline 614).

## Done (proven)
- Job 1: numbered sheet of 3 looks (A Meadow / B Painterly / C Realistic) on the same spots; sent to Wingless.
- Job 2: the picked (default) look everywhere the hero can walk: roads (cobble / gravel / packed earth with ruts / grass-worn track, defined verge), plaza + market paved, mud only at pens / worksites, trodden yards, tufts + soft house shadows, snow / dry variants in the other seasons; one shared `groundH(x, z)` + `groundKind(x, z)` in `ground_near.js`.
- Order of the map (`roads.js`): dead ends 14 → 2 (the 2 left are deliberate bank landings), roads in water 5 → 0, hierarchy tier 1–4 + surface per road.
- Budget: terrain program +0 (one program, patched), A +1 call / +145 k tris, C +2 / +261 k, hero-only scatter programs disposed when the camera goes high, ≈ 17 MB resident textures, +13 KB gzip JS, no new image files.
- `ground.setDetail(0..3)` for the governor (low 0 / medium 2 / high 3).
- Found and fixed on the way: `rpg_diet.js` hid the camera-following tufts after a few steps (stale bounding sphere) → `userData.rpKeep = 1`; headless tests broke on `window` when `ground_near.js` imported `assets.js` → lazy base URL; first `fixWet` raised noRoute 614 → 641 → footbridges now lengthen an existing bridge.

## Open
1. Real phone fps / 4× CPU throttle numbers (not measured).
2. Wire `ground.setDetail()` into the RP1B/RP1C governor steps (their files).
3. Wingless's answer on the sheet (1 / 2 / 3 or a mix): change `DEFAULT_LOOK` (+ `p5.x` for the house-shadow strength).
4. The two bank landings (`lane118`, `lane300`) could get a small jetty model (needs Tripo: `jetty_small`).

## Next, if asked
- tune A after his answer; add leaf litter / flowers to the scatter in autumn / spring; strips of 1-m steps as a video instead of 10-m frames.
