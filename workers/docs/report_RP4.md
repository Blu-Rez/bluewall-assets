# report_RP4 — Round 2 (14 Oct 2026, kit = a314960: RP3 + RP4-R1 merged)

**RP4 R2 = block + kits as data files + elements from the book, all in new/own files, plus ONE token in rpg.js (`rpg_hooks_RP4_R2.patch`, 1 line, marked `// RP4:`; `patch --dry-run` passes on the clean `origin/kit`).** Review: every frame in `photos_RP4.tar.gz` at full size · `bash dev/rp4_test.sh` → `RP4 OK (149 checks)` (R1's 63 still pass, Elina's numbers are identical) · `bash dev/rp4_kit_check.sh elina` → `KIT OK` · `GATE_W: ALL OK` · only own files changed (`web/assets/rpg/combat.js`, `combat/{fx,hud,foes}.js`, NEW `combat/kit_elina.js`, `dev/rp4_*`). No Tripo credit, no server / castle / town / battle / economy / `pkg/` / `dev/gate*.sh` / `web/app/*` touched (`wall.js` shows modified only because `gate_w.sh` / `rb.sh` rebuild it; `mkpatch` excludes it).

## What changed (the three jobs from the mother's message)
1. **Pulled `kit` first.** `origin/kit` a314960 really contains RP3 and my R1 hook (9 `// RP4:` lines in `rpg.js`); its R1 files are byte-identical to mine, so R2 is a clean modification. Worked on that tree.
2. **Elements from the book** into `ELEMENTS` (9 incl. light / shadow / turquoise, each with a glow palette), `BEATS` (water triangle fire→ice→water→fire; earth triangle plant→stone→wind→plant; light beats all six; shadow and turquoise beat light), `HARMONY` (the 7 pairs) + `harmonyOf()`. **Assumption: «خاک» = our `stone`** (six sisters / six elements) — confirm. Harmony is data only; no gameplay uses it yet.
3. **Block.** Hold the shield button (left of the attack button) or `F`: raise 0.10 s, damage ×0.25 from the front 120°, 0.3 stamina per damage point, no stamina regen while guarding, **clean block = no stun** (small push, sparks, blue digit), **guard break** when stamina runs out (red flash + vignette, stagger, no guard again until stamina ≥ 20), hits from outside the arc land in full, faces lock target > stick > nearest enemy. Pose = the `block` clip. Details: `RP4_design.md` §10.2.
4. **Kit API finalised → RP5a–f write ONE file each: `web/assets/rpg/combat/kit_<sister>.js`.** A kit is pure data (weapons, hero stats, block, icons, 1–6 combo beats `melee|shot`, exactly 2 skills with effects `projectile | aoe (circle/cone) | heal | shield | buff | stamina`, statuses `slow | freeze | root | burn`). `validateKit` refuses anything wrong with the field path; `attach()` loads `kit_<sister>.js` in parallel with the other modules. Elina's kit is the reference (`kit_elina.js`, same numbers as R1). Tools for RP5: **`RP4_KIT_API.md`** (schema, clips with durations, workflow), `dev/rp4_kit_template.js`, **`bash dev/rp4_kit_check.sh <sister>`** (contract + every beat connects + every effect works + guard + statuses + 25 s random fight deterministic + weapon files exist + ASCII-only strings), dev arena preview `rp4_dev.html?hero=<sister>&sister=<sister>`. A missing `kit_<sister>.js` (404) falls back to Elina's kit (`ctl.kitFallback`, console warning) so the owner can test any sister meanwhile; a broken kit is never hidden.

## Proven (frames I looked at, full size)
- Node: `RP4 OK (149 checks)` — elements / harmony, block (front, arc, stamina, guard break, re-guard, clean block does not stun), kit contract + refusal tests, effects (projectile, circle / cone, heal now / over time, shield, buff, stamina) and the four statuses, deterministic replay.
- **Five archetype kits** (bow healer, spear controller, hammer tank, dagger scout, staff healer; `dev/rp4_kit_fixtures.js`) pass `checkKit` — the API can express the other five sisters. They are **test fixtures, unbalanced, not game content** and not in `web/assets`.
- Browser (dev arena, behind-camera): block frames (`block_*`), guard break (`break_strip`), effect visuals for all five fixtures and Elina's two skills through the new generic code. **Found and fixed by looking:** the first block frame turned the hero into a teal ghost (guard tint 0.1 emissive) → 0.035; the shield tint was too strong (orange silhouette) → 0.045.
- **Real game** (`kit` a314960 + R2 + the 1-line hook; hero mode → underworld, 390×844): `kitId=elina, fallback=false`; hold block → state `block`, a blocked beast hit did 34 instead of 135 (×0.25 × element 1.5), stamina 59.5 = 100 − 135 × 0.3 and constant while guarding; **keyboard F** through the host's `onKey` → `block` / release → `loco`; combo beats 0–2, skill, dodge, perfect dodge, kill, hero-hit all still work (`game_block_390x844.png`).
- Budget re-measured, dev arena, software GL: A 6 calls / 19,280 tris / 3 programs · B +4 / +2.8k / +3 · **C (6 beasts fighting) 16 calls / 37,204 tris / 7 programs = +10 / +17.9k / +4 — same as R1; the new effects add no meshes** · D (2+2+2 mixed) +40 / +40k / +9 (the placeholder-enemy miss from R1 stands). Boot bytes **+0**: `grep combat client/src` = 0 hits. JS: `jsMs` 0.2–0.6 ms/frame on rows B and D (row C read 2.8 ms while the real game was booting in parallel — not a clean number).
- `GATE_W: ALL OK`.

## Not proven (honest)
Real phone fps and the FEEL of the guard (raise 0.10 s, ×0.25, 0.3 per point, 120°, break at 0): `RP4_judge_3min.md` test 7 + knobs 7–9 · the block clip looped for a long hold seen from every camera angle (I looked from behind and from the side-behind only) · effect visuals were checked with fixtures, not with real sister kits · burn / freeze / root tints on the real RP6 enemies · the tint of the hero's shield on a bright background · foot sliding of lunges (by eye) · `setQuality` still has no caller in the host governor (R1's open item) · harmony has no gameplay.

## Not done
The other five kits (that is RP5a–f's job; weapon models for them need the owner's numbers from a sheet) · swap-sister in the host · harmony gameplay · real enemies (RP6).

## Needs (mother)
1. Merge the R2 files (`patch_RP4.tar.gz`, owned) + `rpg_hooks_RP4_R2.patch` (1 line: `sister: S.key,` in the `attach(...)` options).
2. Give RP5a–f `RP4_KIT_API.md` (also in the Project: `claude/RP4_KIT_API.md`) and the rule «only `combat/kit_<sister>.js`».
3. Confirm «خاک» = `stone`.
4. RP1B's governor should call `S.cmb && S.cmb.setQuality(step)` (0 full … 3 lowest) — still not wired.
5. Owner: play `RP4_judge_3min.md` (now 7 tests, 9 knobs).

## Shared-file edits
`rpg.js`: one token in the existing `// RP4:` attach line (`sister: S.key,`), delivered as `rpg_hooks_RP4_R2.patch`, not in the patch tarball's owned files.
