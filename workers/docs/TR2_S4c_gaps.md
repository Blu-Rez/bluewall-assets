# TR2_S4c_gaps — what the Tripo library does NOT cover for nature / lamps / props (S4c)
15 Oct 2026 · rule kept: no model was hand-built or recoloured; where the library has no fit, the OLD model stays and is listed here.

## Not replaced (old model stays) — need a new model from the library chat
| slot | file | why | what to ask for |
|---|---|---|---|
| grass tufts (`Grass#…`, ~4.5k instances) | assets.js models | every Tripo grass node is 2–10× heavier than the 12-tri tuft; swapping would add > 100k tris to the meadow | a ≤ 24-tri tuft/blade cluster, 128 px texture |
| wheat / crop fields (`crops.js`) | crops.js | `crops.glb` has one wheat head only; the field uses ~30k tiny instances | low-poly wheat row (≤ 60 tris) |
| haybale, pumpkin, corn, cabbage | `life.js` (not an S4c file) | placed by life.js | S5 / life owner |
| nomad tents, rugs, camp props | `nomads.js` | tent models in `props_camp` exist but the nomads are procedural and camp layout is not in the S4c plan | S5 |
| ruins (pillars, arches) | `ruins.js` | no ruin pieces in the library | ruin pack: column, arch, broken wall |
| pebbles / gravel | `sc_rocks.js` `bank-rocks` | `rocks_small` is 130 tris; 20 k bank rocks would add 2.6 M tris | ≤ 16-tri pebble |
| weapon stand | props list `weaponstand` | no counterpart | weapon rack |
| market stalls on the plan town (lv 30) | `town_plan.js` | `stall` is not placed at lv 30 (shows from the market tier) | — (wired, will show when placed) |

## Library models available but NOT used (kept out on purpose: each is +1 draw call)
cedar, cypress, plane, walnut, birch, apple, almond, tamarisk (trees) · rose, thorny (bushes) · rock `slab`, `round` stone (sc_rocks maps a slab to a flattened boulder) · `props_street`, `props_camp`, `lamps_tower_gate` and the other lamp packs · market stalls are wired but none stands at lv 30.

## Wired but limited
- **Wall torches** (`torch_wall`): only on rect targets (houses, barracks, civic). Castle gate/tower torches use `torch_hand` (upright). S3's `ctx.tr2c.anchors` was not pushed, so tower/gate lamps are driven by the existing `torch()` calls, not by Tripo lamp slots.
- **Lamp models are unlit.** Flames/glow come from the game's own flame effect (`fx.js`); no new lights, programs +0.
- **Barrels/crates** are pale next to the old ones (Tripo texture); not recoloured.
- **Trees are stylised** (low-poly crowns); far view uses the old card impostors baked from the Tripo models (`bakeAtlas`).
- `props_street`, `props_camp`, `lamps_tower_gate` packs are NOT shipped (no old counterpart is placed in lv 30).

## Old assets that can be removed later (after the owner accepts the look)
- `ez_pine_a/b/c`, `ez_oak_a/b`, `ez_ash_a`, `ez_aspen_a`, `ez_bush_a/b` ≈ 3.0 MB
- `rockset1/2` ≈ 0.7 MB
- `bush, bushf, flower3, flower4, fern, clover, plant, torch, barrel, crate, stall, cart` ≈ 1.3 MB
- total ≈ 5.0 MB. Keep `cliff1/2` (mountains, not S4c).
Do NOT delete before the A/B is signed off: `?s4c=0` and the automatic pack-load fall-back use them.
