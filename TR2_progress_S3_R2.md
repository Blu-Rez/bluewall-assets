# TR2_progress — addendum, round S3-R2 (append to `claude/TR2_progress.md`)
## Round 6 — S3-R2 castle, what was left (pushed as `inbox/TR2_S3_R2`, kit `8ce26f5`)
Done: see `report_TR2_S3_R2.md`.
- lib rows: the 11 gaps1 rows are already in `lib-tripo` `c186bbe` (MANIFEST + LIB_INDEX + GLBs) → no patch.
- hi ↔ lo switch: castle-only frame strips (zoom 70 → 190 m forward / back, arc along the town wall), forced-hi vs forced-lo at every pose: silhouette differs ≤ 0.024 %, a core-cell flip changes the picture by mad 3.2 / 255 (9 % of pixels by > 16 levels) = ≈ 3 … 9 % of one camera step; quadrant flips 1.1 … 1.6 mad; on the arc 0.02 mad. Stepped frames, software GL — not a phone proof.
- keep: only two keeps in the library; `_2` (in use) is the taller; ring unchanged.
- stairs: spec (`TR2_gaps_S3.md`) + `ctx.tr2c.anchors('stairs')`; real map 10 outer + 27 town sites, inner ring 0; 0 of 37 risers outside 0.19 … 0.25; no model, nothing drawn.
- Tests: `TR2 S3 OK` (34 lines), `TR2 TIERS OK`, `GATE_W: ALL OK` (noRoute 667).
Open (owner / mother): make `castle_stairs_stone` in Tripo (spec) → wiring ≈ 1 h; optional `castle_keep_tall` (32 … 36 m) and a 16 m switchback stairs for the inner ring; decide whether a lo ↔ hi cross-fade is wanted after looking on a phone.
**📊 progress (S3 stage incl. round 2): ≈ 95 %** — the rest is the stairs model + wiring.
