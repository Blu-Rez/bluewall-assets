# p25 progress (Oct 4, ~09:55)
Package: /home/claude/pkg/bluebot_bluewall_p25.tar.gz (17 files, 776 KB, cumulative over the p22 baseline: includes p23 loader + p24). Install + rerun + rollback tested OK (instest_bot). Gate OK except bot_xfer_test (no aiogram in sandbox).

## Done
- Floating Assist button icon = hammer B crossed (X) with a sword matching its palette (silver guard, navy grip, sapphire pommel), soft shadow for depth; cache-bust `assist_icon.webp?v=3`. The Build tile inside the hub stays hammer-only (build_hammer.webp).
- Loader: removed the shine sweep over the title lettering and the 3 twinkle stars on the title (`#ld-t3 .sw/.st`, keyframes ldSw3/ldTw). Everything else in the loader untouched.

## Sources of the mistake (p24)
I replaced the whole Assist button icon with the hammer alone and dropped the sword the owner had picked earlier. Rule: change only the element asked; keep parts the owner already approved.

## Open
- Not verified on a real phone. Variant 1 (old gold sword) available on request.
- p22/p23/p24 not yet confirmed installed -> `mkpkg.sh --commit` pending.
- New defence types (frost spire / fire brazier) still need samples first.
