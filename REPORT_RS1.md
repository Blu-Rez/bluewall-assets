# REPORT RS1 — the six sisters together in hero mode (strip of 6 cards + switch, then «they stand where you left them»)

**RS1 · 100% · Stage A done · Stage B done (behind a switch, default OFF) · info text fixed · not proven: how it feels / how fast it is on a real phone (see the last section)**

Base: branch `kit` @ d839024.  Gate: `GATE_W: ALL OK` (noRoute events 647 < 700).  Test: `bash dev/rs1_test.sh` → last line `RS1 OK` (node parts always; the two browser parts when the persistent browser `TAG=rs1` is up).
Owned (new) files: `web/assets/rpg/rp_sisters.js`, `dev/rs1_*`.  Shared-file edits: `web/assets/rpg/rpg.js` (every line marked `// RS1:`, list below), `web/assets/rpg/hero_info.js` (the sword-length text, one line), and outside `bluewall/`: `workers/dev/rp1c4_info_node.mjs` + `workers/dev/rp1c2_drv.py` (see «Other edits»; they are sent as separate files because `mkpatch` only walks `bluewall/`).

## What the owner gets

**Stage A (always on).**  In hero mode, top-right under the safe inset: a strip of six cards (the pick screen's own `c_<k>.webp`, **46 × 54 px**, 4 px apart; the toggle at its left end is 44 × 44).  Every card is a real `<button>`, ≥ 44 px in both directions at 844 × 390, 800 × 360, 932 × 430 (and 667 × 375), inside the screen, **no overlap** with any other HUD button or the «go up» chip.  One touch = control goes to that sister **without leaving hero mode, without a loading screen**: a small spinner turns on the tapped card while her glb is fetched + parsed (the sister in play keeps walking, the stick keeps working), her texture is uploaded to the GPU one frame before she is shown, then ONE synchronous swap puts her at the same spot, same facing, same camera, same HUD; the old model is **freed** (geometry, texture, skeleton, mixer).  Nothing but the sister in play is resident: no glb is preloaded, none is kept.  Keys 1–6 do the same on a keyboard.  The active card has her accent colour + glow; the marker over the head, the leg IK, the governor's marking and the «i» page follow the new sister.

**Stage B (the round toggle at the strip's left end; default OFF, remembered).**  ON = every sister who was left somewhere **stands there** (idle, solid), and:
- touch a card = go to her: control moves to **her place** (the camera follows), the sister who was in play **stays exactly where she stood** (she becomes a stand-in at once, no reload).  A sister who has no place yet steps out 1.7 m beside the sister in play.
- hold a card ~0.5 s = **bring her here** (a free spot beside the sister in play) — «put one somewhere else»; to put one elsewhere by hand: take her, walk, switch away.
- in hero mode the one in play is saved too: leave hero mode and she stays where she stood; the next start of a sister who has a place begins **there**, not at the gate.
- a small turquoise dot on a card = this sister is standing somewhere.  A one-line Persian hint explains touch / hold (first 3 times).
- parking works only on the ground (not in the water, not on the wall-walk / ladder — a one-line message says so); the strip is hidden and a switch is refused in the underworld (see «not done»).
- places are the client's: `localStorage` key `bw_rs_v1` = `{v:1, on, h, t, p:{<key>:[x,z,yaw]}}`.  Server half: spec at the end (nothing built, no `*.py` touched).

## Numbers (phone emulation `__rpPhone`, the governor pinned at its start level, castle gate view, SOFTWARE GL — calls / triangles are the renderer's, FPS is not meaningful here)

| | calls | triangles |
|---|---|---|
| **BEFORE** (original `rpg.js`, same page state, back-to-back A/B) | 310 / 311 | 1 180 455 / 1 182 932 |
| **AFTER, Stage A** (new `rpg.js`, one sister in play, strip present) | 310 / 311 | 1 181 870 / 1 181 983 |
| in the page test, after each of the 6 switches (aylar aylin elika melika mobina elina) | 283–286 | 1.247–1.257 M (the first read, 267 / 1.106 M, was taken 2 frames after the page settled: the world streams in and its crowd moves during the ~30 s the 6 swaps take in this rig; the sisters themselves differ by ≤ 0.8 k triangles from each other, the rest is the world; the exact back-to-back A/B is the BEFORE / AFTER rows above) |
| **Stage B, setting OFF** | = Stage A (nothing standing, 0 extra) | = Stage A |
| **Stage B, each standing sister IN VIEW** (exact A/B in one frame) | **+1 call** at ≥ 14 m, **+3** within 14 m (her contact-shadow disc is a transparent double-sided plane = 2 calls: only drawn within 14 m) | **+19 011** |
| Stage B worst case on a phone (cap 2 drawn) | **+6 calls (≈ 2 %)** | **+38 k (≈ 1.8 %)** |

The owner's «301 calls / 2.1 M tris» is another spot / time of day; in this rig the same start level reads 292–311 / 1.17–1.18 M.  The governor can cut Stage B: cap 2 on a phone, 1 from governor step 3, 0 from step 5 (desktop 3).

**What one sister costs (measured on the glb, `rs1_sizes.js`):**

| sister | triangles | joints | texture | tex GPU | geometry | clips |
|---|---|---|---|---|---|---|
| elina | 19 247 | 66 | 2048² | 21.3 MB | 0.84 MB | 33 |
| elika | 18 767 | 66 | 2048² | 21.3 MB | 0.74 MB | 33 |
| melika | 19 293 | 66 | 2048² | 21.3 MB | 0.82 MB | 33 |
| mobina | 19 018 | 66 | 2048² | 21.3 MB | 0.86 MB | 33 |
| aylin | 19 538 | 66 | 2048² | 21.3 MB | 0.82 MB | 33 |
| aylar | 18 838 | 66 | 2048² | 21.3 MB | 0.71 MB | 33 |

All six together at full quality would be ≈ 6 × 22 MB ≈ **133 MB of GPU** (and 5 more skinned meshes of ≈ 19 k triangles in the scene); that is why none is preloaded.

**Memory (what is resident):**
- Stage A: exactly ONE hero is resident at any time.  After every one of the 6 switches `renderer.info.memory` is identical to before (textures 599 on every row, geometries 830, programs 174; the 6 rows are identical); the model cache holds one key.  «All six resident» would be 6 × (21.3 MB texture + 0.8 MB geometry) ≈ **133 MB GPU**; now 22 MB.
- Stage B stand-in: the texture is redrawn at 1024 px (**5.3 MB instead of 21.3 MB**, measured: 32 MB for 1 full + 2 stand-ins), ONE shared idle `AnimationClip` for all (their own 33 clips are dropped), no sun-shadow cast (one call less in the shadow pass), matrices frozen between pose updates, **loaded only within 70 m of the player (phone) / 100 m, freed again beyond 95 m / 125 m**, one glb in flight at a time, ≤ cap resident.  Update rate by distance: 15 Hz < 20 m, 7 Hz < 45 m, 3.5 Hz beyond; none while out of view.
- **No leak.**  Test (`rs1_b_page.js` 9b, 3 cycles at one spot: setting ON → take four sisters in turn so each becomes a stand-in → setting OFF): every geometry / texture the renderer registered DURING the cycle and still holds after OFF while nothing in the scene uses it = an orphan (hook on the `dispose` listener the renderer adds at first render).  Result: **0 orphan geometries and 0 orphan textures ≥ 64 px in all 3 cycles** (the only thing alive outside the scene is one 20 × 20 data texture the WORLD re-makes for a shader uniform: `rs1_leak2.js` shows it registered inside `setValue` while drawing, a different one per cycle, the old one disposed).  The renderer's own counters: textures 495 → 498 with them → **495, exact, in each of the 3 cycles**; geometries 702 → 705 → 703, 703 → 706 → 704, 704 → 706 → **704** (exact in the last): the +1/+1 is the world, not the sisters — `rs1_leak.js` (also `rs1_leak2.js`) lists what is new and alive after a cycle and every entry is a world mesh (civic cells, homes, bakery, a tripo node, a particle `Points`), and a control with NOTHING happening at the same spot for 20 s also gained one.

**Timing in the rig (desktop CPU, local files):** fetch + parse of a sister's glb **145–260 ms**, the synchronous swap itself **0.8–1.4 ms**.  The GPU upload of her 2048² texture takes seconds here only because the rig has no GPU (SwiftShader); on a phone it is one mip-mapped 16 MB upload, done in the frame BEFORE the swap (`renderer.initTexture`) — see «not proven».

## Proven (by which test)
- `rs1_node.mjs` (node): prefs read / write round trip, garbage → defaults, clamped counts, the update-rate table, `freeModel` disposes exactly once and never the shared contact-shadow parts.
- `rs1_a_page.js` (real game page, phone diet): 6 cards, ≥ 44 px, inside, no overlap; 6 switches in a row (aylar aylin elika melika mobina elina): key / active card / marker count / one cache key / **memory counters equal before and after every switch** / position and camera do not jump / spinner on during the load and off after / only ONE skinned hero mesh in the scene; a tap on the active card does nothing; a second tap during a load is ignored; the glb request held 14 s: the old sister is still in play, the frame loop runs and she walks; exit leaves no strip and no hero mesh; re-enter restores them.
- `rs1_b_page.js`: toggle ON / OFF + stored; elina left where she stood, aylar beside her; far spot → elika; touch elina's card → control at HER place, camera follows, aylar + elika keep theirs, her stand-in is gone; textures 2048 (in play) / 1024 (stand-ins); the stand-in is solid (full-stick run at her: closest approach 0.96 m = disc 0.4 + body 0.56); hold = bring (stays 1.4–2.6 m from the sister in play, no control change); leave + start as aylar = begins at her place, elina + elika stand; LOD: 300 m away → all freed, back → loaded again; cap: 5 places near, ≤ 2 resident (phone); exact per-sister cost (table above); underworld: strip hidden, a tap does nothing, back home: strip is back; OFF: no stand-ins, no discs, one hero mesh; no leak (orphan check above).
- `rp1c4_info_node.mjs`: `INFO_NODE OK` (the «i» page's hands lines carry no metres).
- Frames viewed full-size at 844 × 390, 800 × 360, 932 × 430 (strip, toggle, dots, a standing sister at the right).  The word «ربات / bot» is in no text of this feature (tested on the strip + hint DOM; the gate's text test is `OK`).

## NOT proven / not done
- **Phone feel and speed.**  Everything above ran in software GL on a desktop CPU.  Not measured on a phone: the real GPU upload of a 2048² texture at the swap (expected one hitch of tens of ms, in the frame before the swap), the real parse time of a 3.2 MB glb on a phone CPU, the frame rate with 2 stand-ins, the cost of a first load over a mobile network (the glb is fetched when needed, HTTP-cached afterwards).
- **Underworld:** the strip is hidden there and a switch is refused (the combat layer is built per sister: kit, weapons on her bones, the fight state — a switch would have to rebuild it and would reset the enemies).  Switching works in the whole home map (including swimming / wall-walk in Stage A).
- Stage B stand-ins have **no leg IK** (they stand in the idle pose at the ground height of the spot: on a steep slope a foot may hover / sink a few cm), no blink / look-around, one idle clip for all of them (phase-shifted per sister so they do not sway in step).
- A stand-in is not re-checked against the layout: if the owner later builds on the spot where she stands she stays there (the sister you TAKE is nudged out of walls by `pushOut`; a standing one is not moved).
- The strategic (map) view does not show standing sisters; only hero mode does.
- localStorage in an in-app browser may be cleared by the host; places are per device until the server half exists.  Not tested in Telegram's WebView.
- Hero «i» page text for the skills still says «تا X متر» for skill ranges (these are gameplay ranges, left alone; only the weapon length in the hands lines was removed).
- Seen, NOT mine and not fixed: every hero session leaves ≈ +6 textures / +17 geometries in `renderer.info.memory` that never return (original `rpg.js` too: measured back-to-back) — probably the grid / ramps / doors parts.  PF3 may want it.

## Shared-file edits (all marked `// RS1:`)
`rpg.js` (+4.8 KB, 47 changed lines):
1. `let sisters = null;` after `stats`.
2. `refreshColliders()` is now a 1-line wrapper: the old function renamed `refreshColliders0`, then `S.discs = S.discs.concat(sisters.discs())` (the standing sisters' discs `[x, z, 0.4]`).
3. `start()`: lazy `import('rp_sisters.js')` inside try / catch (a missing file never stops hero mode), before `loadHero`.
4. `enter()`: frees every cached model except the sister in play (the old cache grew by one model per sister played), then `sisters.enter()`.
5. `exit()`: `sisters.exit()` (saves her place, frees the stand-ins, removes the strip).
6. `frame()`: `sisters.tick(now)`.
7. New block before «called by main.js every frame»: `loadFresh`, `placeHero`, `swapHero` (the one synchronous swap: scene, marker, `S.models`, `rpHero` marking, `localStorage bw_rpg_hero`), `sisCtx()`.
`hero_info.js` line 85: the weapon line shows the weapon's name only (the owner: «the sword's half metre — what has that to do with the player»).

## Other edits (outside `bluewall/`, sent as separate files)
- `workers/dev/rp1c4_info_node.mjs`: the hands-lines assertion now says «no metres» (it required a digit before).
- `workers/dev/rp1c2_drv.py`: the `vp` op now also calls Playwright's `set_viewport_size` — its screenshot re-applies its own size, so a shot after `vp` used to be the old layout cropped (this is how the 800 × 360 / 932 × 430 frames above were taken).
- `workers/dev/rs1_*` (node test, the two page tests, budget / size / look scripts, `rs1_test.sh`).

## Server half (SPEC — nothing built; `*.py` untouched)
Same pattern as the layout (`docs/layout_api.md`, `server.py h_layout`, `layout_sync.js`): the client already has the seam — `sisters.snapshot()` (what to store) and `sisters.adopt(json)` (a newer copy; ignored when its `t` is not newer than ours).
- `GET /api/sisters` → `{ok:true, sisters:{v:1, on:0|1, t:<ms>, p:{<key>:[x,z,yaw]}} | null}`; `POST /api/sisters` body `{sisters: rec}` → `{ok:true, sisters:<effective record>}`.  Same Bearer token as every call; 403 `{reason:'locked'}` without a session; 429 `{why:'rate'}` (1 save / 2 s / user); 413 over 2 KB; 400 `{why:'bad'}`; 503 `{why:'off'}` = the feature is off → the client keeps working from `localStorage`.
- Validation (`sisters.py`, new, mother-only): keys ⊂ {aylar, aylin, elika, elina, melika, mobina}; every place = three finite numbers, |x|,|z| < 420 (the walkable radius, `EDGE_R`), yaw any finite; `on` 0|1; `t` finite ms; extra keys dropped; numbers rounded to 0.01.  Optionally judge the places with the 12 placement rules of `layout.py` (not inside a building / water) and answer the effective record, like layout.
- Storage: one JSON per user next to the layout (`STORE.sisters_get(uid)` / `sisters_put(uid, rec)` in `state.py`), last writer wins by `t` (equal `t` = keep the stored one).
- Client wiring (owner / mother decides, ~10 lines in `main.js` next to `createLayoutSync`): after the hero starts `GET` → `sisters.adopt(doc)`; after each `savePrefs` (debounced 2 s) `POST` `sisters.snapshot()`.  No economy effect: places are cosmetic.
