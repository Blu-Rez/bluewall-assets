# hero_build — how a hero GLB is made (mother, 15 Oct 2026)
Needs `fix2/` of RP0A (pose.py, fixglb.py, ...) next to buildgame.py (see Project docs `RP0A_tools.md`, `RP0B_CLIPS.md`).
- back-made Tripo model (comes -Z): `python3 buildgame.py in_fix.glb out22.glb spec_game_<hero>_2k.json` (spec has `face_plus_z`)
- front-made model (comes +Z): run `spec_flip4.json` first.
- `damp` (new 15 Oct): per clip `"damp": {"Thigh": 0.55, "ThighTwist": 0.55}` pulls the local rotation of joints whose name matches toward rest by that factor — for long gowns that shred on high kicks.
- then RP0B's `buildall.py` (SP=<workspace>) appends the 11 RP0B clips -> 33 clips.
Mobina (15 Oct): back-made, `spec_game_mobina_2k.json`; result 2 936 884 B, 18 359 tris, Khronos 0 errors.
