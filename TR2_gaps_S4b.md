# TR2_gaps — additions from S4b (production lots, worksites, mines, mills, farms, fisheries) · 14 Oct 2026
Missing / unfinished models and wiring. Nothing here was hand-built or recoloured.

## Not wired (model exists)
| thing | model | why not | who |
|---|---|---|---|
| gem mines turquoise / diamond red / green (`mines.js`) | `gem_mine_turquoise`, `dia_mine_red`, `dia_mine_green` | tier-skin-gated procedural estates with targets / FX; swapping needs a design call (skin per tier vs one model) | S4b round 2 or mother |
| oil refinery (`c3_proc` tanks, SOLIDS_PROC) | `oil_refinery_0` | solids / targets are the procedural tanks; swap changes footprint | S4b round 2 |
| unused models | `rice_paddy_*`, `coal_mine_*`, `oil_well_2`, `lumber_mill_2`, `stone_quarry_0/2`, `windmill_tower` | no old kind to replace (rice / coal are new kinds), others are alternates | owner decision |

## Missing models
- **Turning windmill sails** (separate sail model, pivot at the hub): `windmill_asbad_*` have the sails baked in, so the sails no longer turn.
- **Water wheel** as its own turning model: `watermill` is one piece, so the wheel no longer turns (`noMovers`).
- **Flame** for chimneys / forge (the game has no flame effect yet; smoke only).

## Over budget
- `fishing_hut_1` 9.2k tris (building budget 8k) — slimming (S1).

## Style seam (not a gap, a decision)
Old cartoon props (barrels, carts, fences, workers, stalls) stand next to realistic Tripo buildings inside every site until S4c (props) / S4d (people, animals).
