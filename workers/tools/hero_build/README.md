# hero_build — how a hero GLB is made (mother, 15 Oct 2026)
Needs `fix2/` of RP0A (pose.py, fixglb.py, ...) next to buildgame.py (see Project docs `RP0A_tools.md`, `RP0B_CLIPS.md`).
- back-made Tripo model (comes -Z): `python3 buildgame.py in_fix.glb out22.glb spec_game_<hero>_2k.json` (spec has `face_plus_z`)
- front-made model (comes +Z): run `spec_flip4.json` first.
- `damp` (new 15 Oct): per clip `"damp": {"Thigh": 0.55, "ThighTwist": 0.55}` pulls the local rotation of joints whose name matches toward rest by that factor — for long gowns that shred on high kicks.
- then RP0B's `buildall.py` (SP=<workspace>) appends the 11 RP0B clips -> 33 clips.
Mobina (15 Oct): back-made, `spec_game_mobina_2k.json`; result 2 936 884 B, 18 359 tris, Khronos 0 errors.
Mobina v2 (15 Oct 01:25, short velvet tunic + trousers + boots, from the owner's new back image): the new back-made Tripo export came out facing +Z (the old one came -Z), so run `spec_flip4.json` FIRST (turns it to -Z like the Elina library), then `spec_game_elika_2k.json` (no damp needed for this costume), then buildall. Result 2 745 644 B, 19 271 tris, Khronos 0 errors. Known limit: in clips with the arms away from the body (slash_a/b, cheer, heavy, dodge) a few skirt-side triangles get dragged by hand weights and show as dark shards (Tripo's auto-skin; the A-pose hands rest on the skirt). A weight repair needs a surface-distance test, not a box test (a box test breaks the hands — tried).
