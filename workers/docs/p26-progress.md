# p26 progress (Oct 4, ~11:00)
Package: /home/claude/pkg/bluebot_bluewall_p26.tar.gz (8 files, 720 KB; delta vs deployed after p24 -> includes the p25 files: crossed hammer+sword Assist icon, loader title shimmer removed). Install + rerun + rollback tested OK. Gate OK except bot_xfer_test (no aiogram in sandbox).

## Done
- Loader sword aged/dull/real (see feedback doc 09:55 #1). Bar glow and spark softened.
- Home camera limits 90..310 (portrait) / 280 (landscape); tilt 74°..66°; battle camera 60..300. Test script: scratchpad camtest.mjs (builds CamCtl with a fake camera, sweeps 24 azimuths x 3 targets x 3 zooms).

## Notes
- controls.js: default portrait open dist is 300 (main.js:168) — still inside the new max (310). Home default tilt moves ~1° (1.183 -> 1.158 rad).
- Not verified on a real phone.
- p24 committed. p25 NOT committed (not confirmed) — p26 contains its files.
- Open: frost spire / fire brazier defences need samples first; gem-mine ground blotches untouched.
