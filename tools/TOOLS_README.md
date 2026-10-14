# TR1_tools2 — what is in here
- `LIB_INDEX.md`, `MANIFEST.json` (226 library entries), `TR1_list.md` (112-row list of the game's CURRENT models, verdict + priority), `TR1_progress.md` (TR1 log: decisions, pitfalls), `TR1_items.json`, `inv.json` (stats of the game's current GLBs).
- `sheet.py LIST.json out.png cols tw th` + `tr1_sheet.html`: numbered contact sheets (playwright + three, served by `python3 -m http.server 8777` from the dev root; list path is a URL path, e.g. `/tr1_lists/x.json`; cell = `{"n","label","sub","parts":[{"url","nodes":[],"pose":seconds?}]}`). Needs `three` linked at `<devroot>/three`.
- `inv.mjs`: GLB stats with gltf-transform.
- `slim_uv.mjs SRC OUT TARGET_TRIS WEIGHT FLAGS`: UV-aware simplify (MeshoptSimplifier.simplifyWithAttributes, UV weight 2, flag Permissive). Plain `simplify()` gets stuck on UV-seam-heavy Tripo meshes and `sloppy` destroys the texture; use this.
- Install gltf-transform locally: `npm i @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer sharp`.
