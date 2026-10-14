# TR2_progress — S4b section (merge into the main `TR2_progress.md`)
Round 4 · S4b (production lots, worksites, mines, mills, farms, fisheries) · 14 Oct 2026 · kit **p47** · `GATE_W: ALL OK`, noRoute **667** / limit 700 · `S4B OK` · `TR2 TIERS OK`.

| stage | weight | state | notes |
|---|---|---|---|
| S4b worksites + production | ≈ 6 % of TR2 (S4 = 20 %) | **≈ 85 %** | 30 models wired (4.8 MB, 512 px), far LOD (19 % tris, +0 programs), clamp 30 → `LEVEL_CAP` everywhere in my files + 3 shared files. **Not done:** gem mines, refinery, turning sails / wheel, close-up call budget (+5…+25 calls inside 120 m), atlas per site. See `report_TR2_S4b.md`, `TR2_gaps_S4b.md`. |
**📊 progress ≈ 35 %** (29 % before + S4b ≈ 6 %; S3 castle, S4a, S4c, S4d, S5, S6 and S7 are other chats and not counted here).

## Numbers (final build, lv 30, software GL — NOT phone numbers)
- top view: calls 513 → 501, tris 3,503,788 → 3,450,713 (Tripo files blocked = old pieces of the same build).
- programs +0 (201 vs 203 in `p39_progs`), resident texture estimate ≈ 40 MB for all 30 models (512 px), 4.8 MB download.
- gate: noRoute 667.

## Pitfalls (new, S4b)
- tr2lib → assets.js reads `window`: load tr2lib lazily in anything a raw-node test imports.
- `Batcher.add` overwrites `color`; a vertex-coloured far LOD must be a hand-built `BufferGeometry` mesh.
- Textured Tripo meshes do not simplify (UV seams): weld by position + colour from the texture first.
- `BLOCK_TR2=1 python3 dev/tr2_s4b_perf.py` is the honest «old pieces» baseline of the same build.

## Next step
1. Close-up calls (+5…+25 inside 120 m; the lumber +25 is the neighbours, roughly explained by `dev/tr2_s4b_diag.py`): a texture atlas per site / fewer files per farm if it matters on a phone.
2. Gem mines + refinery (owner: one model or per-tier skin?), turning sails / wheel models.
3. Real-device check of fps and shader compile (not measurable here).
