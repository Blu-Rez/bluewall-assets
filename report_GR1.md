# report_GR1 — the ground at eye level (+ real streets, order on the map)

**For the mother (review block).** GR1 = ground at eye level. Review like any patch: every frame full size (844×390, landscape), `GATE_W: ALL OK` (noRoute **612**, baseline 614 — not raised), **+0 shader programs for the terrain** (same `bwterrain-bake` program, patched through `onBeforeCompile`), ≤ +3 draw calls (A: +1, C: +2, B: +0), strategic views unchanged or better (top + oblique frames are pixel-identical, ground-level cinematic only gains near detail), no change to castle / town / battle / economy / server / pkg / gate files. Shared lines are listed in §3 (3 `// GR1:` lines in `world.js`). Shared height function: **`groundH(x, z)`** exported from `client/src/ground_near.js` (also `groundKind(x, z)`); RP1C can import it.

Kit started from: `p53 + landscape` (workers/KIT_VERSION, 15 Oct 10:15), branch `kit`.

## 1. What the owner asked, and what came out
- Owner: «the ground is terrible at eye level» + «fix the floor: real streets and dirt, real and correct; give the map a bit of order».
- **Sheet** (3 looks on one numbered sheet, A / B / C) was sent to Wingless; **no answer yet → default** = **1 (A "Meadow")** + the soft ground-contact shadow under houses from **2 (B "Painterly")**. All three looks ship in the code (`ground.setLook(1|2|3)`, `?look=N` for a test), the default is `DEFAULT_LOOK = 1` in `ground_near.js`. If he answers 2 or 3, change that one constant (and `p5.x` for the shadow strength).
  - A Meadow: photo grass + cobbles, blade tufts around the hero, rutted packed earth, soft shadows at the house feet (strength 0.4).
  - B Painterly: brush-stroke patches, soft value steps, ink edge on the roads, strongest contact shadows (0.5), no tufts.
  - C Realistic: normal-mapped photo layers, cavity, pebbles, wet ruts, desaturated; tufts + pebbles.
- Detail knob for the RP1B/RP1C governor: **`terrain.ground.setDetail(0..3)`** (0 = off = old ground; 1 = roads + edges; 2 = + photo detail + normals; 3 = + tufts / pebbles). Defaults: `low` 0 (and nothing is even built: 1×1 placeholders), `medium` 2, `high` / `ultra` 3. Dropping below 3 disposes the scatter at once.

## 2. Roads and order (own files: `roads.js`, `terrain.js`)
Audit of `roads.js` / `town.js` ribbons (script `gr1_test.js` + `audit_roads.js`), before → after:

| | before | after |
|---|---|---|
| dead ends (a road end > 2.5 m from any road / destination, not at water) | **14** | **2** (`lane118`, `lane300` inner ends: they now stop at the moat bank as a landing / washing place, 11–13 m from the second ring street) |
| roads running through water | **5** (`lake` 9 m / 1.5 m deep, `ws_fishery_lake` 78 m / 2.3 m, `ws_lumber2`, `ws_mill_water1/2`) | **0** |
| road ribbons crossing another road without a junction | 16 | 6 (the rest are real junctions: mainst × ring, ring2 × lane118 …) |
| road × house overlaps | 3 (`stores_oil/wood/iron` on ring2) | 2 (`stores_wood` ×2 on ring2) |

What was changed in the data (`roads.js`, all marked `// GR1`):
- the 5 town lanes used to overshoot the ring streets by 5–13 m (stubs ending in grass) → they now end exactly on the ring-street centre lines; lane 118 runs on to the first ring; the moat-side ends run down to the bank.
- the country trunk road `main` used to climb the cliff wall toward the mountains (dirt painted on rock, ending in nothing) → it stops where the valley floor ends, in a turn-around (`YARDS`).
- `fixWet()`: no road through water. A short wet run → a dry way round (A* on a 2.5 m grid, closed water + 2.5 m of bank, existing bridge decks open) if one exists, else a footbridge; a bridge that touches or overlaps an existing one that runs the same way **lengthens it** (one deck, not two end to end — two decks end to end made the battle sim's `noRoute` go 614 → 641). Result: **the bridge at (−154, 141) is now 50 m long** (it was 27 m; the `lake` road runs along the river there) and the one at (−169, 200) 36 m (was 22 m). Still 13 river bridges. noRoute 612.
- ankle-deep fords (< 0.2 m below the waterline for ≤ 8 m) are not treated as water.
- hierarchy + surface per road (`R.tier` 1–4, `R.surf`): **cobble** = main street, ring streets, west street, town lanes · **gravel** = the country trunk roads · **packed earth with wheel ruts** = country roads and village lanes · **grass-worn track** = field tracks and the haul roads of the worksites. **Mud only where animals / workers stand** (pens, slaughter, fishery worksites: `MUD_KINDS`). Plaza and market are paved discs. Zoning: stone (town) → packed earth (country roads, yards) → grass (everything else).
- the same road map (signed distances, 1024², 0.75 m/texel) feeds the shader and `groundKind(x, z)`: what the player sees is what the code knows (0 grass, 1 paved, 2 earth road, 3 track, 4 trodden, 5 mud). The ribbon height equals what the hero stands on: **`groundH(x, z)`** = the terrain's `fastHeight` (the same grid the mesh is drawn from), falling back to `L.height`.

## 3. Shared-file lines (everything else is owned: `terrain.js`, `roads.js`, new `ground_near.js`)
`client/src/world.js` — **3** lines, all marked `// GR1:` (limit 8):
1. `ground: terrain.ground,` in the returned object.
2. `if (camera && terrain.ground) terrain.ground.update(camera, dt, t);` at the top of `update`.
3. `if (terrain.ground) terrain.ground.setFootprints([...(ctx.town.houses || []), ...(tplan ? tplan.lots : [])]);` after `ctx.town = buildTown(...)` (contact shadows).

`client/src/terrain.js` (owned): imports `createGround`; `export function innerLanes()` (the castle lanes the bake already painted, now also given to the ground map); `G = createGround(...)`, `G.setPaved(...)`, `G.setSeason(...)`, a `bake.redo` wrapper that forwards the season, `G.patch(sh)` at the end of `onBeforeCompile`, `mesh.userData.ground`, `G.attach(fastHeight)` + lazy `G.build()`, and `ground` in the returned object.
`client/src/roads.js` (owned): §2.
No other file changed. **Not touched:** castle / town / battle / economy, `main.js`, `web/app/*`, `pkg/`, `dev/gate*.sh`, server `*.py`.
Integration note for RP1B/RP1C: the scatter meshes carry `userData.rpKeep = 1` (a camera-following pack must not be judged by a stale bounding sphere: without it `rpg_diet.js` hid the tufts after a few steps — found in my own proof run and fixed; `gr1_test` checks the tag).

## 4. Budget (software GL on the build machine — **not a phone**; frame at the `street` spot, 844×390)
Numbers from `budget2.js` (`photos_GR1/budget.json`). "ground" = what the module itself owns (`ground.stats()`); the frame totals also move by ±5 calls / ±2 % triangles from the world's own streaming (crowds, LOD), so differences smaller than that are noise.

| | detail 0 (old ground) | A (default) detail 3 | B detail 3 | C detail 3 | limit |
|---|---|---|---|---|---|
| ground draw calls | 0 | **+1** (tufts) | **+0** | **+2** (tufts + pebbles) | ≤ +3 ✔ |
| ground triangles | 0 | **+145 200** (9 680 tufts × 15) | +0 | **+261 360** | ≤ +400 k ✔ |
| shader programs in the frame | 227 | 228 (**+1, hero-only, the tuft material**) | **227 (+0)** | 229 (+2 hero-only: tuft + pebble) | terrain +0 ✔ |
| programs after the camera goes high again (130 frames) | 227 | **227** (tufts / pebbles disposed) | 227 | 227 | back to baseline ✔ |
| terrain shader samplers | 9 | 12 (limit 16 on phones) | 12 | 12 | |
| resident textures (2 texture arrays 5 × 512² albedo + normals with mips, + road map 1024² RGBA8) | 0 | **≈ 17.3 MB** | same | same | ≤ +24 MB ✔ |
| download | – | **+13 KB gzip** (`ground_near.js` 36 KB raw) + `roads.js` / `terrain.js` deltas; **no new image files** — the 5 photo layers + normals are the kit's own `ph_*` textures | | | ≤ +2 MB ✔ |
| `ground.update()` per frame (JS) | – | **0.48 ms avg while walking** (the scatter refills as it moves), **0.004 ms** standing / flying; ≈ 1.9 ms if the 4× CPU throttle simply scales it (**not measured throttled**) | | | |
| `build()` (lazy: first use only; `low` never) | – | 0.75 s here + 1.2–1.6 s road map (headless node figure) | | | |
| per-frame allocations | – | none in `update()` (pre-allocated matrices / typed arrays; the scatter is a toroidal window refilled in place) | | | |

The 4× throttle / real-device numbers were not run: **Not proven** (§7).

## 5. Proof (frames I looked at myself at full size; `photos_GR1.tar.gz`)
- `hero_<spot>_before_after.jpg` — 10 hero spots (top = before, bottom = after; JPEG q93 4:4:4 of the 844×390 frames) (gate, street, main road, lane, meadow, mud / pens, shore, town, field, mill) at 844×390. "before" = the ground module off (`setDetail(0)`) on the same build, so the **new roads data** is in both; the original kit's frames (`before_kit_*.jpg`, 7 spots) are in the pack too.
- `strat_top|obl|cine|cine2_before_after.jpg` — strategic top view, oblique, ground-level cinematic at 6 m and 3 m. Pixel difference: **top 0.0 %, oblique 0.0 %**, cinematic 6 m 0.4 % (the near ground), 3 m 41 % (the ground at 3 m height — that is the ground improving, castle / sky unchanged).
- `season_winter|autumn|spring_<spot>_before_after.jpg` — before / after in the other seasons (each season re-bakes the whole ground, ≈ 2 min in software GL). Winter: snow on grass and verges, the earth road shows through as a thawed track, cobbles stay.
- `strip_walk_8steps.jpg` — a walk from the main road over the verge into the field track (8 steps, 10 m apart).
- `crops_1to1.png` — 1:1 crops (no scaling: street cobbles, main-road earth with ruts, mud in the pens, meadow tufts) of the ground at 1.7 m eye height.
- `looks_ABC_sheet.png` — the numbered sheet that went to Wingless.
- `budget.json`, `audit_roads_before.json`, `audit_roads_after.json`.

## 6. Tests
- `bash dev/gr1_test.sh` → **`GR1 OK`** (road audit: dead ends ≤ 2, no road in water, house overlaps ≤ 6; map build time; every road painted; module builds headless; uniforms + sampler count; budget counters under the limits at hero height in all three looks; scatter disposed when the camera goes up; `dispose()` frees; `rpKeep` tag; `low` quality = detail 0). Not added to any `dev/gate*.sh`.
- `bash /home/claude/dev/gate_w.sh` → **`GATE_W: ALL OK`**, battle sim `noRoute events: 612` (baseline 614; my first version of `fixWet` gave 641 — see §2, fixed by lengthening the existing bridge instead of adding a second deck), 0 wall crossings.
- The headless tests import `terrain.js` / `ground_near.js` without `window`: `ground_near.js` does not import `assets.js` (it reads `window.BW_ASSETS` lazily).

## 7. Not proven (honest list)
- Real phone fps / the look under the phone's colour pipeline (everything above is software GL on the build machine, no 4× throttle).
- Winter / autumn / spring were looked at in 3 spots each, not everywhere; the transitions between seasons (the fade while the bake re-runs) were not watched.
- The walk strip is 10 m steps, not every frame; the distance fade of tufts / detail is done in the shader (deterministic), "no pop" is by construction (tufts fade out in the vertex shader over the outer 45 % of their radius, ground detail fades by smoothsteps between 12 and 120 m from the camera) rather than frame-by-frame video.
- Interaction with the new TR2 nature models (S4c) and houses: not depended on; the contact shadows use the town plan's lots + the generic houses by rectangle, not by model names.
- RP1B/RP1C governor: `setDetail()` is the knob; I did not wire it (not my files). `medium` = detail 2 and `low` = 0 are only the module's own defaults.
- Look B and C were checked in summer in 3–7 spots; A is the default and got the full pack.
- Winter on open snow (meadow spot) looks almost the same before / after (snow covers the grass layer; only stones and the roads gain detail) — the gain in winter is the roads and cobbles, not the fields.
- The `before_kit_*` frames were taken early in the job (before `ground_near.js` existed; some `roads.js` edits had already started); the other "before" frames are the same final build with the module off.

## 8. Decisions taken by default (no answer from Wingless in time)
- Look **A + B's contact shadows** (the owner can still pick 2 / 3 by number: `DEFAULT_LOOK`).
- `low` = nothing is built (no textures, no map); `medium` = detail 2; `high` / `ultra` = 3.
- The road map is 1024² (768² at `low`), 0.75 m/texel, over ±384 m; roads outside it fall back to the baked ground.
- Footbridges are merged into an existing bridge rather than added next to it (noRoute).
- No new Tripo model needed. **needs Tripo list: none.** (Optional later, if the owner wants more life on the ground: `ground_cover` / `flowers` / `rocks_small` from `lib-tripo` as tuft variants — they would be separate programs, so I did not.)

## 9. Open / next, if asked
- Wire `ground.setDetail()` into the RP1B governor steps (one line each).
- Let RP1C read `groundH` instead of its own height call where the hero stands on a street ribbon.
- The two remaining dead ends (`lane118`, `lane300`) are deliberate bank landings; a small wooden jetty model would finish them (needs Tripo: `jetty_small`, 4 × 1.5 m, weathered planks).
