# WC1 — progress (weapon carry)

State at push: built and proven (details in `report_WC1.md`). Test: `bash dev/wc1_test.sh` → `WC1 OK`; `dev/rp4_test.sh` → RP4 OK (155); `dev/gate_w.sh` → GATE_W: ALL OK (noRoute 614).

## Done (proven)
- `combat/carry.js`: hip / back / hand mounts by weapon class, kit fields `kind` / `carry` / `gem`, 0.12 s swap, 3 s sheathe, one parent at all times.
- Nothing tied on her (owner 12:04): no belt / baldric / straps; only a hip weapon's own slim scabbard.
- Frames behind + side, full size, 4 owner classes × rest (idle, walk, sit) × fight (draw, hit, sheathing, sheathed) + dagger pair, spear, hammer.
- Penetration table on Elina's rig (33 clips, 1087 samples), mounts adjusted from it.
- Budget: +1 … +2 draw calls, +0 programs vs a game-style scene, 0 lights.
- Six sheets with 3 library options each, ★ default, glowing gem in the sister's own colour.

## Open
1. Real weapon models + numbers per sister (RP5a–f); library models are test-only.
2. Short sword worst 7.3 cm (punch_b) in the proxy; bow+quiver has a constant ~4 cm overlap with the cape.
3. Sit pose: weapon keeps its mount (depends on the seat).
4. Project doc `claude/RP4_KIT_API.md` not edited (repo copy `workers/docs/RP4_KIT_API.md` is).

## Next, if asked
- per-sister penetration scan on all 6 rigs; a sit-specific mount; real gem glow tuned on a phone.
