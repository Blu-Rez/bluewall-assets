# TR2_progress — S4a (houses + civic), 14 Oct 2026
Read first: `claude/TR2_WIRE_PROMPT.md`, `claude/TR2_SPLIT.md`; previous: `inbox/TR2_S2`.
| part | state |
|---|---|
| S4a models shipped (houses 4×3, civic hall, tavern, shrine, market hall, stalls, 3 wells, 2 prop packs) | done (4.0 MB) |
| atlas (`tr2atlas.js`), `bakeTr2` (aB + patchDestruct), `homeTr2`, `civicTr2` (+ nav circles), `warmTown`, kit fallback | done |
| gate / tiers / S4a test / noRoute 667 with Tripo solids | done, green |
| tris budget (+5 %) | **open: +8.8…9.8 %** (owner decision, levers in report) |
| generic fill houses + hamlets, chimney smoke, assets.js cleanup | open |
Weights: S4 = 20 % of the whole job, S4a assumed = half of it, ≈ 70 % of its own scope → **📊 ≈ 36 %** overall (S0–S2 29 % + 7).
## Pitfalls (new)
- `pkill -f` / `ps | awk '/frames.py/'` inside the SAME bash command kills your own shell (exit 144 / 1) — put the kill in a script file.
- `Page.screenshot` under SwiftShader needs `timeout=240000`; `r.info` counters accumulate over frames when `autoReset=false` — divide by the frame count.
- `renderer.info.memory.textures` ≠ the baseline `tex` field: compare programs/calls/tris only.
- Close-up targets must come from `civicLots/homeLots` (node, `dev/…/lots.json`), never from a merged mesh bounding box (that is the castle).
## Next
Owner picks the tri lever → (a) slim bodies / (b) fewer stalls / (c) accept; then wire `house_generic_*` for the fill houses behind the same atlas and drop kit_homes/kit_civic from assets.js.
