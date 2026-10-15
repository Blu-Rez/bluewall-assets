# TP1 clip library - Tripo Studio "mixamo" rig (15 Oct 2026, 22:30)

Source: `fantasycharacter3dmodel.glb` = AYLAR built in Tripo Studio (18 934 tris, 65 joints `mixamorig:*`) carrying 54 Studio animations (24 fps, 10 s or 5 s, AI Animation + Preset).
Result: `TP1_clips_lib.glb` (animation-only, skeleton + 52 clips, 3.9 MB, Khronos 0 errors) + `TP1_clips_manifest.json` (per clip: name, source prompt, root mode, loop, verdict, active window, size in KB).
Tool: `TP1_clips.py` (numpy + scipy only). Same retarget maths as RP0A: `D = R_src(t) * R_src_rest^-1`, `R_dst(t) = D * R_dst_rest`, hips scaled by hip height, ground fit.

## Owner workflow (from now on)
Build the model in Studio, rig (Biped / Mixamo), add ONLY the Walk preset (idle/run/jump presets are used too if present), export GLB. Then (any machine with python3 + numpy + scipy):
    python3 TP1_clips.py apply TP1_clips_lib.glb  hero_walk.glb  hero_game.glb
    python3 TP1_clips.py apply TP1_clips_lib.glb  hero_walk.glb  hero_game.glb --only=greatsword_swing,staff_slam,cast_projectile,hit_back,death_forward   # a subset (each clip is 40-120 KB)
    add --game-names to rename 20 bones to the game's Tripo-native names (Pelvis, Spine02, L_Hand, R_Hand ...): NOT proven in the game.
The hero's own Walk/Idle/Run/Jump stay the model's own (root motion removed, loop closed); every other clip is retargeted from the library.

## Proven / not proven
- Proven: all 54 source clips viewed as contact strips (8 poses each, `TP1_clips_src_sheet_*.png`); library built; applied to a second model (Melika G1) and 12 clips viewed on it (`TP1_clips_sheet_on_melika.png`); Khronos validator 0 errors on the library and on the Melika build (2 warnings that the Tripo source mesh already has); identity retarget error 0.000 %, round trip Aylar->Melika->Aylar 0.000 %; pose difference to the source after retarget 3.9-4.7 % of hip height = the proportion difference of the two bodies (their rest poses differ by 3.8 %).
- NOT proven: nothing was played inside the game; no weapon was in the hand in any clip (Tripo animates empty hands: the kit's weapon-in-hand timing is unchecked); foot sliding with `lock` (the game moves the body); skirts/cloaks in wide stances (greatsword_swing: skirt spreads through the legs on Melika); `--game-names`; riders (below).
- The game heroes use the Tripo-native rig (`Pelvis`, `Spine02`, `R_Hand`, 80 nodes); Studio mixamo models have 65 `mixamorig:*` joints. `carry.js` looks up Pelvis / Spine02 / L_Hand / R_Hand, `rpg.js` Head, `rpg_foot.js` Hip. So a Studio-rigged hero needs either `--game-names` or a name alias in the loader. Decision for the mother / owner; TP1 touched no game file.

## Verdicts (52 clips in the library, 2 rejected)
- ok (37): walk sprint jump_stand land_soft climb_wall climb_ledge stairs_up get_up wave cast_ground spear_thrust dagger_stab staff_cast guard_hold greatsword_swing hammer_smash spear_sweep staff_slam staff_slam_b sword_shield_slash shield_bash battle_idle war_cry rally_banner victory crossbow_shoot crossbow_reload cast_projectile cast_channel cast_summon hit_back hit_heavy death_forward giant_swing giant_smash roar beast_leap
- weak (5, small or wrong motion): swim_breast (body flat, arms move little), shoot_bow, greatsword_overhead (6 s in a wide stance, the lift comes at the end), cast_buff, stun_dizzy
- seat (10, riders): ride_idle ride_walk ride_gallop mount dismount ride_slash ride_lance ride_shoot ride_shoot_b ride_hit - Tripo has no horse, so the LEGS STAND STRAIGHT (hip height 0.49-0.58 m = standing). Only the upper body is a rider. They need a seated lower body (hips down ~0.25 m, thighs forward and out) before any use. No riding feature exists in the game anyway.
- rejected (2, not in the library): "falling through the air" (the body lies flat on the ground, not a fall: keep the existing `fall`), "treading water" (flat, below the ground).
- missing from the request list: axe_chop (not generated).
Names that exist already in the game's 33 clips and have a better/other version here: swim (stand-in) -> swim_breast, climb (stand-in) -> climb_wall, block -> guard_hold, jump/land -> jump_stand/land_soft. Nothing is replaced automatically.
Long clips: most Tripo clips are 10 s with the action inside a shorter window; the manifest has `active:[start,end]` in seconds; the kit's `t0` / `dur` can cut it.
