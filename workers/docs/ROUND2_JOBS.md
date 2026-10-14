# ROUND2_JOBS — second-round jobs for the workers (mother, 15 Oct 2026 ~00:10 Tehran)

**Base for everyone: branch `kit`, commit `df25be0` or newer.** It already contains: RP0B (33 hero clips), RP3 (underworld hub), RP4 R1+R2 (combat, block, kit API), RP1B + HOTFIX47, **RP1C** (cull + door orbs), **UI1** (sheet look C), **TR2-S3** (castle), **TR2-S4a** (houses + civic), **TR2-S4d** (animals + villagers). Pull it first (`git clone --branch kit`), rebase your work on it, then do ONLY the jobs of your own section. Push with `push_result.sh <ID>_R2 …`, then ONE line «<ID>_R2 pushed». Rules unchanged (GIT_FLOW.md): own files only, shared lines marked, no secrets, no `web/app/*`, `pkg/`, `dev/gate*.sh`, server `*.py`; every frame looked at full size; say plainly what is NOT proven. Report in the same format as round 1.

Package state: **p49 = everything above** (supersedes p48, which holds only RP0B + RP3 + RP4-R1). Test with the kit, not with your old tree.

---
## RP1C-R2 (hero mode: face rule + back + governor + frame)
Owner's words (14 Oct, repeated): «the hero's FACE must never be visible — when I turn the camera she turns too — and her back must look good / sharp».
**Job 0 (first, urgent — round 1 did not do it).**
1. Third person = camera always behind her. When the player drags the camera, her facing follows the camera yaw (smoothly, ≤ 0.25 s lag) so the camera never sees her face — at idle, walk, run, jump, dodge, interact, sit, block, attack. No orbit to the front. The eye button (first person) stays. Walk backwards = she turns (never moonwalks facing the camera).
2. Test: node/browser check that for 360° of camera drag the angle between her forward vector and the camera forward stays < 35° after settle, in every locomotion state; one frame from behind after a 180° drag.
3. Back sharpness: find what makes the back blurry (the HUD overlay says `px 0.85` = render scale 0.85; hero texture mip / anisotropy; shadow) and fix it inside your own files (e.g. hero at native pixel ratio, texture anisotropy, a sharper shadow box near her). Show a before/after crop of the back at full size. Do not recolour or edit the model.
**Job 1.** The quality governor currently runs only in the home scene. Run it in the underworld too and call `S.under.setQuality(step)` and `S.cmb.setQuality(step)` (0 full … 3 lowest; RP3 / RP4 APIs) — test with a fake clock like the existing governor tests.
**Job 2.** While a building sheet (`.bsh.on`) is open, hide the joystick + action buttons (UI1's note: the sheet is under `.rp-touch` in z-order otherwise); restore on close.
**Job 3.** Re-measure the three hero views (gate, fields, mill) on the new kit (castle + houses + animals are Tripo now) and report calls / tris like round 1. Allowed levers: a `// RP1C:` one-line hook for the castle `LOD_NEAR` constant (80 → 50 m in `castle_tr2.js`), culling the planned-town chunks (homes 2 calls, civic 1 call, 40-lot cells) by hero radius, a smaller shadow box. Target stays ≤ 150 calls / ≤ 400 k tris; if not reached, say which meshes are left (names + tris).
`rp1b_test.sh` now has `rp.setClimb(true)` around the wall test (kit) — wall climbing stays OFF by default until stairs exist.

---
## TR2-S4a-R2 (houses + civic — finish the stage)
1. **Triangle budget**: strategic cameras are +8.8…9.8 % (rule +5 %). Use the S3 way: hi / lo cells — make `_lo` versions of the house bodies (tools: `workers/tools/lod_geo.mjs`, `tr2_retex.mjs`; the castle does it in `castle_tr2.js`) and show the far cells as `_lo` (> ~80 m). Keep the near houses as they are. Report the new numbers with `dev/tr2_budget.py`.
2. **Wire the rest of the houses**: the generic fill houses of `town.js` (models `house_generic_a..d` are shipped, not wired) and the hamlet / `village.js` houses outside the wall — all Tripo, same fallback rule.
3. **Pennants / flags**: `props_street/flag` (h 2.8) reads huge next to the houses and looks ragged — scale to about 60 %, keep them at the same anchors.
4. **Chimney smoke** for the Tripo houses (the old planned homes had ≤ 18 plumes): put smoke anchors on chimneys via model data (no hand-built meshes).
5. **Frames you did not get**: lot-level street close-up of ONE house with the camera at hero eye height (~1.7 m above the terrain, not under it), levels 1 and 20, one destroyed block (battle frame). Also look at the grey sack-like blobs near the chapel / tavern and tell me which file builds them.
6. Remove `kit_homes / kit_civic / kit_village` from `assets.js` ONLY if the fallback is no longer needed — do NOT; keep them (QA first). List the MB they would save.

---
## UI1-R2 (all other screens in look C)
Owner's pick stays: look C «Parchment & metal» (leather + brass + parchment). Do the next round in the same style, same rules (no backdrop-filter, no endless animation, ≥ 44 px targets, +0 programs, English short texts, portrait 390 + landscape 844): **(1) the top HUD** (castle level chip, resource bars, the corner Kingdom button — also fix its endless `bwuGleam` animation), **(2) the army screen (`armyui.js`)**, **(3) the shop screens**, **(4) toasts + dialogs everywhere** so nothing looks like the old UI next to the new sheets. Same proof as round 1 (80+ screens × 2 orientations, real-game before/after frames, T1 OK, GATE_W OK). Ask nothing; if a screen needs a logic change, leave it and list it.

---
## TR2-S3-R2 (castle — what is left)
1. `lib-tripo` `MANIFEST.json` / `LIB_INDEX.md` still need the 11 gaps1 rows — send them as a patch file (`patch_TR2_S3_lib.tar.gz`: only those two files), I will push them.
2. Prove that the hi ↔ lo switch at 80 / 100 m does not pop on a moving camera (a short frame strip while the camera moves along the wall).
3. Keep: look again at the keep in the inner ring (23.7 m inside a 16 m ring). If a bigger Tripo keep model exists in the library, name it; otherwise leave as is — do NOT change the ring.
4. **Stairs to the wall-walk**: there is no stairs model in `lib-tripo`. Do not build one. Write the spec of the model the owner should make in Tripo (width, step height, total rise = the wall-walk height at each tier, where it stands inside the gate and the towers) and the anchor list (`ctx.tr2c.anchors('stairs')`) so wiring is a one-hour job when the model arrives. Put it in `TR2_gaps_S3.md`.

---
## RP4 (answers to R2 — no new round now)
- «خاک» = `stone` — confirmed (the book's earth triangle is plant → stone → wind → plant; the harmony pairs that say "earth" mean stone).
- `RP4_KIT_API.md` goes to RP5a–f when the owner opens them (sister kits + weapons need his number picks from a sheet first).
- The governor → `setQuality` wiring is RP1C-R2 Job 1.
