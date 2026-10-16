# TW1 — wooden archer towers: 4.6 m legs + night floor light (extra job, no new model)

Kit: branch `kit`, HEAD c12f6f1 (AN1_R3 + ST1_R2 merged). Patch: `patch_TW1.tar.gz` (owned: `buildings.js`; shared diffs, each line marked `// TW1:`: `materials.js` (+emissive on `M.wood`), `world.js` (+1 line)).

## What changed
- **buildings.js** (the 3 archer towers at (−2,8), (46,30), (−50,−8)): legs 8 m → **4.6 m** (platform y 4.7, rails y 5.4, roof cone y 7.5, torch y 6.4, pick `y1` 12 → 8.8). Two cross-braces per side (y 1.5 / 3.2) so the thinner stilts do not read as bare poles. I did NOT use `def_watchtower` (no GLB for it ships in the build; the job said "no new model"). Footprint, rotation, torch, `'archer'` pick target unchanged.
- **materials.js + world.js** — night floor on `M.wood`: `emissive = rgb(0.022, 0.0135, 0.0075)`, `emissiveIntensity = P.night` (0 by day, 1 at full night). No new material / program, **+0 lights, +0 draw calls**.
- Side effect (intended, but global): everything built from `M.wood` gets the same floor at night — forge posts, racks, the 9 storehouse flagpoles, fences, etc. They are no longer pure black.

## Checked, as asked
- **Courtyard forge (40,−6)**: wood posts were black → fixed by the same floor. The hearth / chimney STONE stays dark: its fire light sits inside/above it. Not changed (option: move the forge point light to the front of the hearth — say if you want it).
- **"7.6 m gate columns"**: they are NOT castle.js columns (the procedural gate is not even built when the Tripo castle is on). The 7.6 m things are the 18 flagpoles with pennants of the 9 storehouses (`storeyards.js:164`, `banners()`, tint 0x4a3524) — traced with a temporary stack logger (removed). They are thin poles by design; the wood floor lifts them out of black, height left as is. `fort_day.js` is dead code (DAY=false).

## Tests
- `bash dev/gate_w.sh` → **GATE_W: ALL OK** (noRoute 647 < 700) on the final code (after removing a temporary debug logger from util.js; util.js is identical to the base).
- Rebuilt with `dev/rb.sh`; `web/app/wall.js` is rebuilt locally and is NOT in the patch.

## Frames (844×390, hour 23, hero "elina" next to a 2 m red/white ruler, 0.5 m per band)
`photos_TW1.tar.gz`: `before_tower.png` / `after_tower.png` (same hero + camera), `before_forge.png` / `after_forge.png`, `before_tower_wide3.png` / `after_tower_wide.png` (wide; the two cameras are close but not identical — wide "before" was taken later from a baseline build with a re-guessed camera).

## NOT proven
- Frames come from software GL (SwiftShader), rendered in-page to a half-float target and tone-mapped by hand (ACES + the game's exposure 1.2 + sRGB) — **no bloom/post, not a phone**. Real brightness on a phone is not measured.
- The floor level (0.022, 0.0135, 0.0075) is by eye: 0.6× looked too dim, 1.0 kept. It is one colour in `materials.js` if the owner wants it lighter/darker.
- The "after" frames came from a build that still held an inert temporary debug logger in util.js (removed before the gate run); the code path is the same.
- No ms / fps numbers; the global `M.wood` floor at other wood (forge, flagpoles, racks) was seen only in the forge and tower frames.
- Hearth / chimney stone still black (see above).
- Dawn / dusk not looked at (floor scales with `P.night`, so it is faint there).
