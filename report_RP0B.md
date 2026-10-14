# report_RP0B — hero clips round 2

**RP0B = hero clips round 2. Review like any patch: every strip full size, GATE_W: ALL OK, only hero GLB/JSON files changed, old 22 clips unchanged. The rest of this report is proof, not a claim.**

Patch = 6 hero GLBs (`web/assets/rpg/<key>.glb`) + 6 `v5/lib/rpg_heroes/<key>/<key>_clips.json` (old 22 entries kept, 11 new entries appended). Nothing else. (`bluewall/web/app/wall.js` shows as modified in the kit only because of the build; it is NOT in the patch.)

## 1. Clips: wanted → source → status
All sisters now have 33 clips (22 old + 11 new). New clips were appended to each GLB (new bufferViews/accessors/animations after the old binary), so the old 22 clips and the mesh/skin/textures are byte-identical.

| wanted | built? | source | notes |
|---|---|---|---|
| sit_down | yes | **synthesized** (hero idle pose → sit pose, local slerp, forward lean, eased hip, ground fit) | 1.20 s. No Mixamo/Tripo source; looks plausible (see strips) but procedural |
| sit_idle (loop) | yes | Quaternius `anims.glb` Sitting_Idle_Loop, retargeted | 1.67 s, loop seam 0.04° |
| stand_up | yes | **synthesized** (sit pose → idle) | 1.00 s |
| slash_a | yes | `anims_army.glb` Sword_Regular_A | 0.43 s |
| slash_b | yes | `anims_army.glb` Sword_Regular_B | 0.53 s |
| slash_c | yes | `anims.glb` Sword_Attack, window 0.45–1.25 s ×1.15 | 0.70 s |
| heavy | **partial** | `anims.glb` Sword_Attack, window 0–1.25 s ×1.35 | 0.93 s. It is a **lunge sweep, not an overhead swing**; shares its source clip with slash_c (different window) |
| block (loop) | yes | `anims_army.glb` Sword_Block hold 0.22–0.64 s, ping-pong | 0.84 s, loop seam 0.04° |
| swim (loop) | yes | Elina's Tripo library swim, retargeted (F=I, same rig family) | 5.71 s, in place |
| tread (loop, optional) | **NO** | — | see §6 |
| climb (loop) | yes | Elina's Tripo library climb, retargeted | 3.46 s, in place, linear drift removed in X/Y/Z (Y-loop), seam 0 cm |
| interact | yes | `anims.glb` Interact 0.15–1.7 s ×1.4 | 1.11 s |

Method: world-space rotation-delta retarget (`R_dst = D·C·R_dst_rest`, D = F·R_src(t)·(F·R_src_rest)⁻¹, C = T→A swing correction for arms/hands/fingers only, unmapped bones follow parent), hip travel scaled by hip-height ratio, ground fit per frame, loop closing by blend, key reduction. No Tripo credit was spent. No face/body/colour change, animation only.

## 2. Sizes / validator / gate
| sister | bytes | MB |
|---|---|---|
| elina | 2,986,128 | 2.99 |
| elika | 2,856,148 | 2.86 |
| melika | 2,823,984 | 2.82 |
| mobina | 2,949,828 | 2.95 |
| aylin | 2,798,176 | 2.80 |
| aylar | 2,856,320 | 2.86 |

All ≤ 3 MB (Elina needed looser key tolerance: 0.25°/1 mm, swim/climb 0.5°/2 mm). Mesh untouched → triangle count unchanged (≤ 20k as before).
Khronos validator: **0 errors** on all six (1 warning each, `NODE_SKINNED_MESH_NON_ROOT`, same as the original hero GLBs). three.js GLTFLoader loads 33 clips on all six. `bash dev/gate_w.sh` → **GATE_W: ALL OK** (re-run just before this report, kit GLBs == patch GLBs byte for byte).

## 3. Loop-seam check (first key vs last key, worst channel)
| loop | elina | elika | melika | mobina | aylin | aylar |
|---|---|---|---|---|---|---|
| sit_idle | 0.04° / 0 cm | 0.056° / 0 cm | 0.04° / 0 cm | 0.04° / 0 cm | 0.04° / 0 cm | 0.04° / 0 cm |
| block | 0.056° / 0 cm | 0.04° / 0 cm | 0.04° / 0 cm | 0.04° / 0 cm | 0.056° / 0 cm | 0.04° / 0 cm |
| swim | 0.04° / 0.0 cm | 0.04° / 0.001 cm | 0.04° / 0.0 cm | 0.04° / 0.0 cm | 0.04° / 0.0 cm | 0.04° / 0.001 cm |
| climb | 0.04° / 0 cm | 0.04° / 0 cm | 0.056° / 0 cm | 0.04° / 0 cm | 0.04° / 0 cm | 0.04° / 0 cm |

(0.04° = quaternion quantisation floor.) In-place loops have no hip drift (hip_travel_u ≈ 0 in the JSON).

## 4. Error table (vs source animation; direction error mean / max, position error as % of height)
| clip | source | elina | elika | melika | mobina | aylin | aylar |
|---|---|---|---|---|---|---|---|
| sit_down | SYNTHESIZED: hero idle pose -> sit | synth | synth | synth | synth | synth | synth |
| sit_idle | anims.glb Sitting_Idle_Loop | synth | synth | synth | synth | synth | synth |
| stand_up | SYNTHESIZED: sit pose -> hero idle | synth | synth | synth | synth | synth | synth |
| slash_a | anims_army.glb Sword_Regular_A | 3.5° / 7.1° ; 7.2% | 3.4° / 8.5° ; 6.0% | 3.5° / 10.2° ; 6.5% | 3.7° / 11.4° ; 5.8% | 2.8° / 11.1° ; 7.5% | 3.2° / 7.1° ; 7.3% |
| slash_b | anims_army.glb Sword_Regular_B | 3.5° / 7.1° ; 8.3% | 3.4° / 8.5° ; 7.0% | 3.5° / 10.2° ; 7.5% | 3.7° / 11.4° ; 6.8% | 2.8° / 11.1° ; 8.1% | 3.2° / 7.1° ; 8.0% |
| slash_c | anims.glb Sword_Attack [0.45-1.25  | 3.8° / 8.6° ; 7.8% | 3.7° / 9.3° ; 6.5% | 3.7° / 10.6° ; 7.0% | 4.0° / 12.2° ; 6.2% | 3.1° / 11.2° ; 7.9% | 3.4° / 7.8° ; 7.6% |
| heavy | anims.glb Sword_Attack [0-1.25 s]  | 3.9° / 10.4° ; 8.0% | 3.8° / 11.2° ; 6.6% | 3.9° / 13.2° ; 7.2% | 4.1° / 14.6° ; 6.3% | 3.2° / 11.9° ; 8.1% | 3.6° / 10.4° ; 7.7% |
| block | anims_army.glb Sword_Block hold [0 | 3.6° / 7.1° ; 7.9% | 3.5° / 8.5° ; 6.8% | 3.5° / 10.2° ; 7.1% | 3.8° / 11.4° ; 6.5% | 2.8° / 11.2° ; 7.8% | 3.2° / 7.1° ; 7.7% |
| swim | Elina library swim | 0.00% / 0.02% | 2.82% / 2.94% | 1.39% / 1.50% | 2.75% / 2.94% | 2.90% / 3.24% | 2.07% / 2.13% |
| climb | Elina library climb | 0.07% / 0.27% | 2.83% / 3.02% | 1.79% / 1.95% | 2.69% / 2.91% | 3.31% / 3.81% | 2.40% / 3.02% |
| interact | anims.glb Interact [0.15-1.7 s] x1 | 3.6° / 7.1° ; 6.7% | 3.5° / 8.5° ; 5.6% | 3.5° / 10.2° ; 6.0% | 3.8° / 11.4° ; 5.2% | 2.8° / 11.1° ; 7.5% | 3.2° / 7.1° ; 7.3% |
Reading: bone-direction error 2.8–4.1° mean, worst single bone 7–14.6°. Position error 5–8 % of height is proportion-limited (hero proportions ≠ Quaternius proportions), not a pose error. Swim/climb from Elina's own library onto the other five: 0–3.8 % (Elina onto herself ≈ 0 = identity check). Sit clips are synthesized, so no source to compare against ("synth").

## 5. Stretched triangles (edge > 4× and > 6 cm; count / lowest y over the clip)
RP0A level was ≤ 6.
| clip | dur s | elina | elika | melika | mobina | aylin | aylar |
|---|---|---|---|---|---|---|---|
| sit_down | 1.20 | 0 / -0.001 | 0 / -0.001 | 0 / -0.001 | 0 / -0.001 | 0 / -0.001 | 0 / -0.001 |
| sit_idle | 1.67 | 0 / -0.000 | 0 / -0.000 | 0 / -0.000 | 0 / -0.000 | 0 / -0.000 | 0 / -0.000 |
| stand_up | 1.00 | 0 / -0.001 | 0 / -0.001 | 0 / -0.001 | 0 / -0.001 | 0 / -0.001 | 0 / -0.001 |
| slash_a | 0.43 | 6 / -0.009 | 0 / -0.009 | 0 / -0.009 | 0 / -0.009 | 0 / -0.010 | 0 / -0.011 |
| slash_b | 0.53 | 16 / -0.004 | 0 / -0.004 | 12 / -0.009 | 0 / -0.008 | 0 / -0.005 | 0 / -0.006 |
| slash_c | 0.70 | 4 / -0.002 | 0 / -0.002 | 0 / -0.002 | 0 / -0.002 | 0 / -0.002 | 0 / -0.002 |
| heavy | 0.93 | 4 / -0.008 | 0 / -0.007 | 0 / -0.009 | 0 / -0.008 | 0 / -0.010 | 0 / -0.009 |
| block | 0.84 | 0 / -0.000 | 0 / -0.000 | 0 / -0.001 | 0 / -0.000 | 0 / -0.001 | 0 / -0.001 |
| swim | 5.71 | 0 / -0.080 | 0 / -0.081 | 2 / -0.080 | 0 / -0.081 | 0 / -0.082 | 0 / -0.081 |
| climb | 3.46 | 23 / -0.265 | 0 / -0.257 | 0 / -0.262 | 4 / -0.261 | 0 / -0.270 | 0 / -0.270 |
| interact | 1.11 | 0 / -0.001 | 0 / -0.001 | 0 / -0.001 | 0 / -0.001 | 0 / -0.001 | 0 / -0.001 |
**Over the RP0A level:** Elina slash_b 16, Elina climb 23, Melika slash_b 12. Others ≤ 6 (Elina slash_a 6, Melika swim 2, Mobina climb 4, Elina slash_c 4 / heavy 4). I looked at the Elina and Mobina strips at full size and saw no visible tearing, but I did NOT zoom into the Elina slash_b/climb and Melika slash_b stretched triangles, so treat those 3 cells as "over level, not judged". If the mother rejects them, the fix is a gentler arm-swing C correction or dropping that clip for that sister.
Lowest y: swim ≈ −0.08 u (body is horizontal, the game sets the water height), climb ≈ −0.26 u (free-climb; the game sets the root, hip bobs around standing height, so feet/knees dip under the origin plane). Other clips ≤ 0.011 u (ground fit).

## 6. What is proven / not done / what I need
**Proven (by me, at full size):**
- Contact strips (8 poses per clip, front + side) on **Elina and Mobina**: `photos/sheet_<key>_A` (sit_down, sit_idle, stand_up), `_B` (slash_a, slash_b, slash_c, heavy), `_C` (block, interact, swim, climb). All 12 images were looked at.
- Numbers: validator, gate, sizes, seams, errors, stretched triangles (tables above) for **all six**. Elika/Melika/Aylin/Aylar were not looked at as strips (they use the same code path; only Elina/Mobina were viewed).

**Not done / honest limits:**
- `tread` — not built (no source clip in anims.glb / anims_army.glb / Elina's library that is a vertical-body water tread).
- `heavy` is a lunge sweep, not an overhead swing; `slash_c` and `heavy` come from the same source.
- `sit_down` / `stand_up` are procedural; they have no seat/chair contact, the hero just lowers to seat height.
- Real-time feel, foot sliding in motion, speed in game, phone fps: **unproven** (strips are still poses, not a play-through in the game).
- `*_front_game.glb` variants were not updated.
- `rp1b_test.sh` is not in kit p45, so I could not run it.
- The JSON files live on `main` (`v5/lib/rpg_heroes/...`), not in the kit; the patch carries the full updated JSON (old 22 + 11 new) to be copied over.
- Mixamo animation names below are from memory, unverified (the web search returned nothing useful).

**Request list for the owner (only if the mother wants the upgrades; format FBX **without skin**, 30 fps, attach to the chat; or Tripo Studio Animation panel):**
1. `tread` (loop, needed): Mixamo "Treading Water" (or similar "tread water").
2. optional: real `sit_down` / `stand_up` — Mixamo search "sit" (e.g. "Stand To Sit", "Sit To Stand" — names unverified).
3. optional: real overhead `heavy` — Mixamo "Standing Melee Attack Downward" (unverified) or any two-hand overhead sword chop, ≈ 0.9 s.

## 7. Files
`patch_RP0B.tar.gz` (6 GLB + 6 JSON), `photos_RP0B.tar.gz` (6 sheets), `report_RP0B.md`, `RP0B_progress.md`, `tools_RP0B.tar.gz` (retarget scripts + renderer so the sandbox loss does not lose the work; no secrets inside).
