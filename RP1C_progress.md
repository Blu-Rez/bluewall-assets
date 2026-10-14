# RP1C_progress
State: finished and pushed (Size M, round 2 of 2).
- Job 1 (frame): `cull.js` per-instance culling of repeated InstancedMeshes + shadow-pass casters limited to the shadow box; gate off identical. Gate 297 -> 243 calls, 1.78 M -> 1.07 M triangles (shadow pass 1.19 M -> 0.65 M); fields 218 -> 177 / 1.95 M -> 1.03 M; mill 359 -> 253 / 1.84 M -> 0.80 M; programs +0. Targets <= 150 / <= 400 k NOT reached. Static merge deliberately not done (TR2 swaps rebuild meshes).
- Job 2 (doors): `doors.js` 113 doors, 3 Points (gold / green / blue) + <= 3 glass icons, door button wears the same icon, tap an orb -> she walks there, sheet opens, `interact` plays, joystick cancels. Green is test-forced in the offline preview.
- Tests: `RP1C OK` (36 checks), `GATE_W: ALL OK`. `rp1b_test.sh`: 2 wall-climb checks fail on the kit itself (HOTFIX47 `CLIMB_ON=false`, same failure with RP1C removed; passes with `rp.setClimb(true)`).
- Not proven: real phone fps / feel; TR2 models; clean green frame.
- Needs: the owner's `journalctl -u bluebot-wall --since "30 min ago" | grep perf | tail -40`.
