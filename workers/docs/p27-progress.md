# p27 progress (Oct 4, ~11:10)
Package: /home/claude/pkg/bluebot_bluewall_p27.tar.gz (3 files: wall.js, weather.js, controls.js + BUILD; delta vs deployed = p26). Install + rerun + rollback tested OK. Gate OK except bot_xfer_test (no aiogram in sandbox). p26 committed to deployed.sha256 (owner's screenshot showed the new camera + crossed icon).

## Done
- Zoom-out a little more: portrait max 310 -> 345, landscape 280 -> 300; above the old limit the tilt eases to 56° (zoomPolar with refD/pFarMax) so the camera still never leaves the valley ring; numeric test (camtest.mjs): same distance and tilt at every azimuth/target; default open view identical.
- Rain: screen-space rain sheet removed (never visible); 3-D streaks 40% of drops, thinner/shorter, alpha x0.4, faded within 18 m of the camera. Ground splashes, lightning, thunder, rain audio untouched. Before/after storm screenshots at dist 300 checked (cmp_rain.jpg).

## Open
- Not verified on a real phone. If the storm now feels too empty: bring back a few faint far streaks (weather.js `rf` / `step(aP.z, 0.4)`).
- Frost spire / fire brazier defences still need samples first; gem-mine ground blotches untouched; p26 pending nothing.
