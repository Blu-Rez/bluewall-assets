# rpg_heroes — two versions per sister
- `<key>/<key>_game.glb` — built from the BACK picture. Default for gameplay (third-person camera is behind the hero). Face = Tripo's guess (Melika, Mobina weak).
- `<key>/<key>_front_game.glb` — built from the FRONT picture with a 4K texture downscaled to 2K. Real face; the back is Tripo's guess. For portraits / close-ups.
Both: 22 clips (`idle walk run jump fall land dodge hit death knockdown punch_a punch_b kick_a kick_b cast aim talk bow cry look_around cheer angry`), facing +Z, feet on y=0, height 0.98 u, one material, 2048 texture, <= 3 MB. Tables: `<key>_clips.json` / `<key>_front_clips.json`.
A replaced model drops in with the same file name. `elina/elina_all_clips_library.glb` = 47-clip library of the old back-view Elina rig (reference only).
