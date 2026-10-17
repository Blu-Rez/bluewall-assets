# UI2 progress (17 Oct 2026)
- 18:58 job received (kit e35e072). 19:00 owner: blue / silver, not brown / gold; UI3_TOKENS.md not in the kit -> palette from the HUD's own tokens (`PAL` in rp_ui2.js).
- Found the cause of the «grey triangle behind the round button»: the old head triangle projected behind the round chip. Fixed by moving the chip to the HUD top row + a small crown with a clear gap.
- Built rp_ui2.js (chip looks 1-3, glass icon, pill), rp_marker.js looks 1-3 (crown / gem in silver cradle / halo ring), +0 shader programs.
- Frames: day + night x grass / stone x 33 m / 300 m, 3 looks each, all looked at by me; two bad ones re-shot (grass 300 m on a rock slope; one stale night frame).
- ui2_test.sh page -> UI2 OK; gate_w -> GATE_W: ALL OK (noRoute 647). Rebased onto kit 0e75919 (touches none of my files).
- 100%: patch + photos + report pushed to inbox/UI2.
