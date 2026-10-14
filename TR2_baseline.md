# TR2_baseline — numbers BEFORE any Tripo model is in the game
Kit **p45** (14 Oct 2026), home map, castle level **30**, software GL (SwiftShader) in headless Chromium — **not a phone number**. Every later TR2 report compares against these.

## Shader programs / materials (`Q=high python3 dev/p39_progs.py 30`)
| | value |
|---|---|
| programs | **203** (154 seen on materials) |
| materials | 551 (`MeshStandardMaterial+hook+ck` 200, `MeshStandardMaterial+ck` 201, `SpriteMaterial` 77, `ShaderMaterial` 26, `MeshBasic` 21, `MeshPhysical` 11+4 hook, `MeshLambert` 4+4, `Points` 3) |
| meshes / shadow casters | 1091 / 452 |
| `customDepth` materials | 126 |
| generic houses / destruct targets | 11 `generic houses` rows / 133 targets |
| late stages (ms) | "Loading models…" 1369 + 259 + 273 · "Laying the Blue Wall…" 4406 · "Building the town…" 452 · "Planting the forest…" 2703 |
| GL `getProgramParameter` total | 26.6 s (666 calls) in software GL — compile cost on a phone is NOT proven by this |
Goal: Tripo adds **+1..2 programs** in total (ONE `MeshStandardMaterial + map` config + the destruct patch). Report `renderer.info.programs.length` after S2 and S7.

## Draw calls and triangles at the game camera (`SKIPINTRO=1 python3 dev/p38_perf.py perf 30`)
"with" = full scene (this is the baseline); "without" = worksites + wslife hidden (so the share of worksites is visible).
| view | draw calls | tris (with) | calls (without) | tris (without) |
|---|---|---|---|---|
| top (default home) | **506** | **3 464 311** | 392 | 2 846 782 |
| ctr (castle centre) | 479 | 2 990 927 | 373 | 2 365 823 |
| town | 492 | 2 949 011 | 370 | 2 283 997 |
| fields | 530 | 3 718 031 | 438 | 3 053 221 |
| lake | 259 | 1 663 509 | 163 | 1 241 198 |
Budget for TR2: draw calls and tris **within +5 %** of this at the same cameras.

## Assets (`web/assets`)
- **73 MB** total on disk (74 752 KB), 144 GLB files; `tex/` 4.6 MB.
- biggest: `kit_ws_p3` 4.3 MB (unused), `anims` 2.6 MB, `troll` 1.6 MB, `kit_ws` 1.56 MB, `kit_village` 1.44 MB, `prowler` 1.36 MB, `pegasus` 1.06 MB, `blacksmith` 0.98 MB, `ogre` 0.93 MB, horses 0.8–0.9 MB each, `kit_def` 0.8 MB.
- Library to ship from (`lib-tripo`): 226 GLBs, 58 MB; only the ones the game uses are added to `web/assets`; removed old kits are subtracted (report added MB).

## Gate
`GATE_W: ALL OK` · noRoute events **667** (limit 700) · battle sim: 0 wall crossings, 0 ground unit-steps in water, 72 pinned at end.

## Not measured here (say so in every report)
Phone fps, real shader-compile time on a phone, foot sliding, GPU texture memory on a phone. Texture memory for TR2: `renderer.info.memory.textures` + estimate (1K RGBA ≈ 5.3 MB with mips) at lv 1 / 20 / cap, aim ≤ 120 MB.
