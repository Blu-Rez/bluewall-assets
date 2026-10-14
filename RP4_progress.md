# RP4 progress — Round 2 (14 Oct 2026, 22:05 → ~22:50 Tehran)
📊 پیشرفت: 100٪

| step | state |
|---|---|
| pull `kit` (a314960: RP3 + R1 hook merged; my R1 files identical) | done |
| elements / BEATS / HARMONY from the book | done (assumption «خاک» = stone) |
| block (hold button / F, ×0.25, 120°, stamina, guard break) — engine, tests, HUD, visuals, real game | done |
| kit API finalised: kit files as data, strict validator, 5 fixture kits pass | done |
| tools for RP5a–f: `RP4_KIT_API.md`, template, `rp4_kit_check.sh`, dev preview `?hero=&sister=`, 404 fallback to Elina's kit | done |
| hook: 1 token (`sister: S.key`) as `rpg_hooks_RP4_R2.patch` | done |
| proofs: node 149 checks · kit check OK · GATE_W ALL OK · budget same as R1 · full-size frames · real game 390×844 | done |
| pushed as `RP4_R2` | see the chat |

Found by looking at frames: hero turned into a teal ghost with the first guard tint (fixed), shield tint too strong (fixed), heal digits overlapped (instant vs over-time now separate), arc test: the hero turns to face the enemy behind her while guarding, so the arc is proven in node, not in a frame.
