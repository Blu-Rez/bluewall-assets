# RP4 — progress (Round 1 finished, 14 Oct 2026 ~21:45 Tehran)
**State: R1 pushed.** Kit = p47 installed + RP0B merged (626a7d5, RP1B inside). 📊 100 % of Round 1.

## Done
- Engine `combat.js` (pure, fixed 1/60, Node-tested: `dev/rp4_test.sh` → RP4 OK, 63 checks incl. the clip table checked against the real `elina.glb`).
- Presentation `combat/fx.js`, HUD `combat/hud.js`, placeholder enemies `combat/foes.js`, sword `combat/sword_arming.glb` (library `sword_med_arming`, default #1 — the owner never answered the sheet), on `R_Hand`.
- Elina: 4-hit combo = the real RP0B clips `slash_a / slash_b / slash_c / heavy` (windows measured on the clips), skill 1 Flame Wave (`slash_b` + crescent), skill 2 Ember Burst (`cast`), dodge roll with i-frames, lock-on with camera yaw assist, hurt / knock-down / death.
- Owner's «the player watches from behind» (21:11): fight framing of the host camera + red edge arrows for attackers outside the frame; proofs with the host's own camera values and in the real game (390×844).
- HUD follows the host's TOP/BOT (Telegram header / footer), `setQuality(0..3)` (0 full … 3 lowest), particle size clamp.
- `rpg_hooks_RP4.patch` (12 changed lines, `// RP4:`) tested in the real game: hero mode → underworld → fight 3 placeholder enemies.
- GATE_W: ALL OK · boot bytes +0 (wall.js 2,742,778 B with and without the RP4 files).

## Not done / Round 2 candidates
1. Mother applies `rpg_hooks_RP4.patch` (+ the one-line `setQuality` call from RP1B's governor).
2. `block` guard state + button (clip exists, 0.84 s loop).
3. Element triangle direction (book) and the 7 harmony pairs; the other five sisters' kits (RP5a–f).
4. Owner's 3-minute judging (`RP4_judge_3min.md`) → tune the 6 knobs; foot sliding; real phone fps.
5. Real enemies (RP6) must be ≤ 1–2 meshes each (placeholder soldier / brute break the call budget).
