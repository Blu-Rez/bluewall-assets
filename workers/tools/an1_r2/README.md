# AN1_R2 measurement tools
Run against a held game page (`python3 host.py <port>`, env `PAGE=` picks the html; ~2 min to load in SwiftShader), `ev.sh <file.js> <port>` runs a JS file in it and prints the JSON.
- `sim_kin.js` (crowd movers, `const P={spots:[[x,z]],secs,dt,warm}` is prepended) → `an_all.py` / `an_ratio.py` (slide, ramps, turns, match ratio); `sim_cre*.js` → `an_cre*.py` (dogs, wolves, knights).
- `gr_run2.py` + `ground_table.py` (visible surface − root height), `m4_seg.js` + `run_seg.py` (walls / props), `m4_wet2.js` + `run_wet.py` (water, shallow / deep).
- `strip.py` + `strip_prep.js / strip_step.js / strip_end.js` + `sheet.py` (the side strips), `run_strips.sh`, `run_after.sh`.
Paths in the scripts are those of the work chat (`/home/claude/work/an1_r2`); change them first.
