# TR2_S4c_progress — worker TR2 stage S4c (nature, lamps, props)
15 Oct 2026 · kit p47 (includes TR2-S2) · pushed as `inbox/TR2_S4c` · `GATE_W: ALL OK`, noRoute 667.
**📊 S4c: 100 % of its own part** (≈ 5 % of the whole TR2 weight; S3 castle, S4a/S4b/S4d, S5, S6, S7 belong to other chats / are not started).

| item | state |
|---|---|
| trees (instanced + far impostors, 4 seasons) | done: spruce, pine, oak, willow, poplar, maple (autumn), bare tree + snow fir (winter) |
| bushes, rocks | done (3 rock meshes, shrubs in the card atlas) |
| meadow flowers / clover / ferns | done (counts scaled to the tris budget) |
| lamps (posts, braziers, wall torches, hand torches) | done, baked with the structure id; flame = the game's own sprite |
| props (barrels, crates, sacks, wagon, handcart, stalls) | done; stalls wired, none placed at lv 30 |
| grass tufts, crops/wheat, ruins, nomad tents, pebbles, weapon stand, haybale/pumpkin/corn/cabbage | NOT done → `TR2_S4c_gaps.md` |
| S3 `ctx.tr2c.anchors` (tower / gate lamp slots) | not available (S3 not pushed) → lamps follow the existing `torch()` calls |

Numbers: calls −2…−22 and tris −0.8…+2.4 % at the 5 strategic cameras, programs 201 vs 203 (Q=high), +1.80 MB assets, +11.3 MB GPU texture estimate (software GL, not a phone).
Next for whoever continues: look decision by the owner (denser / darker forest → `TREES` + `tint()` in `tr2_s4c.js`), old-asset clean-up ≈ 5 MB (list in the report §7), the gaps file, then S3 anchors for tower / gate lamps.
