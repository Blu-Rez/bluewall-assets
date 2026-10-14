# RP1B — hero mode, round 2 (frame drop · she can go everywhere · buildings by walking)

Owner-only (`rpg:true` / hero module). Gate off = nothing changes for normal players (checked, see 5).
Patch is against the kit p45 snapshot. Everything below was measured on the software-GL test rig (≈0.1–0.5 fps), **not on a phone**.

## 0. Short version
| | state |
|---|---|
| Job 1 – frame load | **cut, target NOT reached.** Gate view, low preset: 297–300 → 271 calls, 1.92 M → 1.44 M triangles; mill view 285 → 190 calls, 2.25 M → 1.25 M. Goal ≤150 calls / ≤400 k triangles is out of reach without touching world code (7). Governor built and proven (fake clock + one forced slow run on screen). |
| Job 2 – she can go everywhere | **done.** Reachable ground 256 700 m² → 483 600 m² (reach map 64.4 % → 98.8 % on foot, 99.3 % with swimming); 42 / 42 physical walks; every bridge and gate crossed both ways; walls climbed and walked; water waded and swum. |
| Job 3 – buildings by walking | **done.** 113 / 113 buildings, worksites, lots that have a sheet give a button id 1.5 m from their face; same T1 sheet; closes back to walking; usable at 390 px. |
| Owner additions | climb / walk on walls, wade / swim: working. **No swim / climb clip exists** in the shipped files (see 6), so the poses are code stand-ins. |

## 1. Job 1 — frame drop
What a walking player does not need, and what was cut (all in `web/assets/rpg/rpg_diet.js`, owner-only, nothing saved, `exit()` puts every knob back):
- pixel ratio cap ×0.85 (governor: ×0.75); world.update every 2nd drawn frame (the missed time is added to the next one; every 4th at the last level);
- sun-shadow box 56 m around the hero instead of the strategic one, redrawn every 4th frame (governor: 34 m, every 8th, then frozen);
- far life hidden: an instanced pack / skinned figure whose NEAREST copy is > 90 m / 70 m away is not drawn (workers, animals, boats, carts; buildings, landmarks, war machines are never touched);
- NEW this round: a far **heavy static pack** (≥ 100 k triangles on its own, ≤ 400 instances) farther than 160 m is not drawn — this is the attacker camp: 29 × 8.9 k = 258 k triangles, 304 m from the gate, drawn every frame before;
- meadow thinning distance ×0.25 (`REACH.k`, `assets.js meadowLod`), fog ×1 at L0 (×1.7 at L3), mirror off from L1, bloom off from L2. No new shader programs (+0), no new lights, no new materials.

Quality governor (owner only, `GOV_CFG`): 1 s average < 30 fps for 2 s → one level down (pixel ratio → shadows → far-cull radius → crowd freeze), ≥ 2 s between steps; back up only after ≥ 8 s of ≥ 50 fps, one step per 8 s, never inside the 30–50 band; if it drops again < 20 s after a step up it does not go up for 60 s; a ≥ 1 s stall is not a frame time; a paused / hidden page says nothing. The overlay (`.rp-perf`) shows `q 4/4 crowd freeze`, `px 0.75`.

Before / after (same session, same positions, interleaved; `calls` = main pass; 3 views = castle gate, open fields, outer mill):

| view (low preset, shadows off) | calls before → after | triangles before → after | programs |
|---|---|---|---|
| castle gate | 297–300 → 271–272 | 1.92 M → 1.44–1.46 M (−24 %) | 168 → 168 |
| open fields | 253–256 → 196–207 | 1.675 M → 1.25–1.28 M (−24 %) | 168 → 168 |
| outer mill | 283–288 → 189–192 | 2.24–2.26 M → 1.24–1.26 M (−44 %) | 168 → 168 |

| view (high preset, shadows on) | main pass calls / tris | + shadow pass (each refresh) | amortised per frame (before: 1 refresh in 3, after: 1 in 4) |
|---|---|---|---|
| gate | 336 / 2.38 M → 294 / 1.87 M | +219 / 1.69 M → +169 / 1.19 M | 409 calls / 2.95 M → 336 / 2.17 M (−18 % / −26 %) |
| fields | 271 / 2.05 M → 221 / 1.63 M | +224 / 1.61 M → +137 / 1.12 M | 346 / 2.59 M → 255 / 1.91 M (−26 % / −26 %) |
| mill | 318 / 2.77 M → 213 / 1.71 M | +225 / 1.80 M → +130 / 1.13 M | 393 / 3.37 M → 246 / 1.99 M (−38 % / −41 %) |

JS: `world.update` runs every 2nd frame (halves its per-frame average); its own cost on the rig is 2.4–7.6 ms per call and too noisy to quote as a number — **real JS ms on a phone is not measured.**

**Target ≤150 calls and ≤400 k triangles at the gate and in the fields: NOT reached.** What remains at the gate (low preset, 271 calls / 1.44 M):
- static castle + town + terrain ≈ 370 k triangles on their own (terrain 83 k, planned town 90 k, village trim 88 k, static 110 k): this alone is the 400 k;
- trees / rocks / meadow packs (~34 instanced packs, ≈ 280 k): one pack is drawn whole when any copy is in view, per-instance culling needs a change in the world code;
- worksite life (`late:wslife`, 44 instanced packs, ≈ 300 k): drawn whole if one worker is within 90 m (the nearest is 47 m from the gate); per-copy culling lives in the worksite code, not touched;
- ≈ 270 separate calls = many small meshes in the castle / town / defences; fewer calls means merging them (world code, not hero code);
- high preset: the shadow pass re-draws the map-wide instanced casters (+169 calls / +1.19 M per refresh at the gate).
Next real step (needs the mother): per-copy distance culling for instanced packs in the world code, and a merged static castle.

## 2. Job 2 — she can go everywhere
Reach map (BFS from the gate, 2 m cells, same rules as the body): `reach_before.png` / `reach_after.png` (green reachable, red land-but-unreachable, blue water, grey buildings, brown too steep).
- before: 256 700 m² reachable (64.4 % of the land counted then); after: 483 600 m² on foot (98.8 %), 486 200 m² with swimming (99.3 %). The percentages use different land counts (shore strips that used to count as water are now land) — compare the m².
- slope limit: a rise above 0.85 × run + 0.06 stops her (≈ 40°); very steep faces stay blocked, as allowed.
- real reasons found and fixed: (a) a hard 335 m circle in the physics → soft map edge at 420 m (16 m soft zone); (b) every `house` target is a 26 m block box → replaced by one disc per house from `world.picks` (streets / blocks open); (c) `nav.isWet` has the soldiers' 1.1 m shore margin and a narrowed bridge corridor → the hero uses her own deep-water test (wading is allowed, depth ≥ 0.95 m swims, bridge deck counts as dry); (d) the moat / berm strips are reached by swimming and a 1.1 m haul-out; (e) towers / keep / gates stay solid, wall pieces are climbable (see 4).
- left red (3 400 m² with swimming): cliff-enclosed pockets near the edge (r ≥ 370 m) and a 216 m² corner of the keep courtyard between solids — all "steep face / keep", allowed.
- stuck-proofing: if a body ends inside a collider she is pushed to the nearest free cell (spiral search), and a round "back to the gate" icon button (bottom, glass + turquoise) puts her 9 m inside the gate facing the keep.
- physical `walkTo` tests (real physics, steering only): 42 / 42 — farthest outer mill (`ws:mill_wind2`), gem mines (ruby, emerald, turquoise), nearest hamlet, lake and river shores, 17 other outer sites, every bridge both ways, every gate both ways, gate → main bridge → gate. Longest 287 s of simulated walking. 
- camera: never inside a wall / building / ground in those walks (the test counts violating frames = 0). Behind her, 3.6 m; an obstacle between her and the camera pulls the camera in at once (no smoothed approach, that was the cause of lag frames inside a tower / ballista box), and it eases back out at 3.5 m/s; tall boxes use the body radius + 0.25 m as margin; on the wall-walk the camera floor is the walkway (+ parapet-aware), the merlon slabs are camera obstacles with a thin margin (a thick one made the camera collapse to 1 m while she walked along), and the camera stays straight behind her.

## 3. Job 3 — buildings used by walking
Within 2.5 m of the nearest face of any pick / worksite / town lot / civic building a round house-and-door icon button (no words) appears above the action buttons; tap → she turns to face it, the SAME T1 sheet opens (`sheets.tap` — same code path as the strategic view), joystick and walk buttons hidden while it is open, close → walking again. CSS exception only for `.bsh`, `.bsh-dlg`, `.bsh-lbl` and the toast under `.rp-on`. No panel → no button (`well`, `market`, `house`, `camp`, `windmill`, `lumber`, `crystal` are label-only; wall / gate / tower are skipped on purpose). Positions and footprints come from game data at call time (`world.picks`, `sheets.lots()` at the player's castle level — new `can()` / `lots()` in `bsheet.js`). `doorTest`: 113 / 113 give a button id (98 name the building itself; 15 name a neighbouring sheet ≤ 1.6 m away — town lots standing side by side); frames at 390 px: barracks, farm, cottage, vault.
- no animation on tap (the hero GLB has `talk` and `bow`, the game does not load them; the brief allowed "none").

## 4. Owner additions (walls, water)
- walls: she walks to a wall piece, holds forward, climbs (mantle onto the walkway), walks the wall-walk between the merlons (corridor half-width = half the wall thickness − 1 m), and climbs down either side; camera stays behind her and never inside the stone (0 violating frames in the wall tests). Towers, gates and keep are not climbable (solid), so **the wall-walk is one wall piece between two solid towers**: to go on she climbs down and up again at the next piece. Walking through the towers on the wall-walk is not built.
- the mantle moment (the half second she pulls herself over the edge) is the one place where the camera is very close (0.55 m) when she faces across the wall; it is never inside stone, but it is tight. I did not put a frame of that half second in `photos_RP1B` (the one I shot was too close to be a useful picture); `wall_climb` / `wall_climb_side` show the climb before it and `wall_top` right after it.
- water: < 0.95 m depth wading (slower, feet in the water), deeper she swims at the surface (1.9 m/s, body leaning), no jump / dodge while swimming, haul-out at the shore. Swim across the lake 94 m: ok, camera above the surface.
- **the poses are stand-ins:** the hero GLB (22 clips: idle walk run jump fall land dodge hit death knockdown punch_a/b kick_a/b cast aim talk bow cry look_around cheer angry) and the shared animation libraries (`anims`, `anims_army`, `kk_anims`) have **no swim and no climb clip**. Climb / swim = the walk cycle plus a body lean. The code uses clips named `swim` / `climb` automatically if the model gets them (needs the model-maker chat).

## 5. Gate off = nothing changes
- `REACH` is neutral (k 1, dpr 1, fog 1, upd 1, sh 0, norefl false, nobloom false) until the hero module changes it, and `exit()` puts every knob, the shadow box and every mesh the diet hid back (tested, `rp1b_gov.js`); what the game itself hid is never touched.
- gate-off page: 0 requests under `assets/rpg/`, no hero switch, 166 programs (the base game: 166); hero on: 166 at start, 168 in the 3-view table.
- `dev/gate_w.sh`: every line OK, battle sim noRoute 667 (≤ 667), `d1_test` OK (crowd.js is the base's again — an earlier version of the diet edited it and broke D1's "crowd.js untouched" check; the gain was ≈ 2 % triangles at the gate, 0 elsewhere, so the hook was removed).

## 6. NOT proven / not done
- real phone fps and feel; foot sliding on stairs / slopes; the real JS ms per frame (all numbers are software GL);
- anything with the TR2 models or layout (I did not depend on their names or files);
- Train pressed in the barracks sheet: at castle Lv 30 the housing is full, the button is disabled in both views (same logic); the state change by a button is shown with the vault Collect (`door_vault_collected.png`); farm / fishery sheets have no Collect, only Upgrade / Info;
- the gates and the keep door are drawn closed (static boxes in castle.js); she walks through the opening — visual only;
- swim / climb animation (see 4): the owner believes a swim animation exists; I searched the hero GLB and the three shared animation libraries and found none — it needs to come from the model-maker chat;
- walking through the towers on the wall-walk; opening the drawn-closed gates (see above);
- the mantle moment's tight camera (see 4);
- ≤150 calls / ≤400 k triangles (see 1);
- the frame set was shot with the build before the last two small changes (crowd.js hook removed; far heavy pack rule) — they change nothing visible except the attacker camp, which now appears at 160 m instead of 304 m.

## 7. Shared-file edits (everything else is owned: `web/assets/rpg/*`, new `client/src/reach.js`, new `dev/rp1b_*`)
- `client/src/main.js` (+12 / −10 lines): `import { REACH }`; `dpr()` × `REACH.dpr`; `useComposer()` skip when `REACH.nobloom`; fog × `REACH.fog`; `world.update` cadence (`hdt`, hero mode only); shadow-refresh modulus + `REACH.sh`; `refl.update({battle: inBattle || REACH.norefl})`; `SHEET_MAP` hoisted out of the sheet function so the hero can pass it; hero `create({... reach, resize, sheets, SM, dev})`. Every one is neutral when `REACH` is neutral.
- `client/src/assets.js` (+3 / −2): `REACH` import, `heroKit.reach`, `meadowLod` distances × `REACH.k`.
- `client/src/bsheet.js` (+4 / −1): `can(id, SM)` and `lots()` added to the returned object (read-only helpers).
- `client/src/crowd.js`: **not touched** (D1 needs it identical). `dev/gate*.sh`: not touched. Server `*.py`, `pkg/`, `web/app/*`: not touched.

## 8. Tests
`bash dev/rp1b_test.sh` → `RP1B OK` (≈ 10 min, the real game loads twice in software GL): static checks (no Persian text / no «bot» in hero strings, crowd.js = base, no secret), `rp1b_gov.js` (36 checks, fake clock: steps down, up, hysteresis, relock, stall, diet enter / apply / exit leave everything as it was, including a pack that left the candidate lists while hidden), `rp1b_page.py` + `rp1b_page.js` (reach above the old 64.4 % and above 97 %, bridges / gates / mill / mine / hamlet / shore walked, walls, water, a button id for every building with a sheet, the sheet opens and closes, the diet hides things, everything back after exit). Not added to any `dev/gate*.sh`.

## 9. Frames (looked at full size by me)
`reach_before.png`, `reach_after.png`; `bridge`, `gate_outer`, `mill`, `shore`, `gate_keep`; `wall_climb`, `wall_climb_side`, `wall_top`, `wall_top_side`, `swim`; `door_barracks`, `door_barracks_sheet`, `door_barracks_train`, `door_farm`, `door_farm_sheet`, `door_farm_collected`, `door_vault_sheet`, `door_vault_collected`, `door_cottage`, `door_cottage_sheet`, `door_cottage_info`, `door_closed_walking`; `governor_stepped` (forced slow run: `q 4/4 crowd freeze`, `px 0.75`). Note: the overlay's `progs 261` in the first group of frames is my own dev top-down picture tool rendering into an offscreen target in the same session, not the hero (fresh hero: 166, door frames: 168).

## 9b. A real bug found by the test on the way
Objects the diet had hidden that later dropped out of its candidate lists (emptied / remade packs) stayed hidden after `exit()` (102 objects in one run). Fixed: the diet remembers every object it hid (`st.mine`), the next pass shows any that are no longer candidates, and `exit()` restores all of them. Checked: 102 → 0 hidden after leaving hero mode, in the fake-scene test and in the real page.

## 10. Decisions taken by default
- crowd.js hook removed rather than changing D1's test (1: ≈ 2 % at the gate).
- Heavy far static pack rule added to the diet (attacker camp).
- No tap animation (the brief allowed none).
