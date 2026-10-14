# p39 — loading stall fix (mother chat, 6 Oct 2026 ~23:15 Tehran)

## State
- Package `bluebot_bluewall_p39` built (5 files: main.js, perf.js, shaderwarm.js (new), server.py (perf log cap 1800→4000 chars), wall.js). Full gate OK, instest ok + rollback OK. NOT yet committed to `pkg/deployed.sha256` (run `bash pkg/mkpkg.sh --commit bluebot_bluewall_p39` after the owner says it is installed).
- Owner asked to send back: `journalctl -u bluebot-wall --since "10 min ago" | grep perf | tail -20` after opening the game ~2 min.

## What the headless measurements showed (swiftshader = software GL, so ratios not absolutes)
- Q=high at the end of the old load: 377 programs (≈185 per render path: screen + bloom composer). The phone log said gl.prog 198→398. Programs are 'physical' (MeshStandard) with ~83 KB fragment source each: 6 point lights (4 torch/crystal lights from Q.lights + dragon glow + lightning strike light, the latter two usually intensity 0 but still in every shader) + 1 dir shadow light.
- CPU profile of the whole load (low tier): 68 % of main-thread time is `WebGLProgram.onFirstUse` = waiting for LINK_STATUS (program link), 7 % texSubImage2D, JS building is small. So the stalls are GPU shader links, not JS. One more big stage: `buildForest → bakeImpostor` (renders the tree atlas, links its first programs) ≈19 s in software.
- Old loader = 3 one-shot stalls: base scene first render, compileAsync(all late) + getUniforms loop, warm() with culling off + the second path.

## Changes (client/src)
- `shaderwarm.js`: `createShaderWarm({renderer,scene,camera,onSlow})` → `compile(rt|fn|null,{path,target,canRun,gap,progress})` adaptive batches (≈90 ms per slice, sync = getUniforms of exactly the new programs, yield with rAF), `warmDraw(render)` = first draw of what is off screen, chunks ≤220k tris / 60 draws, `collect`, `stats`.
- `main.js`: `OLD` flag (dev: `?oldload=1`) keeps the p38 loader; base precompile before first frame (bar 62→72 %); `lateSequence` new branch (sliced compile of the active path, reveal, `warmDraw`); `bgCompile()` compiles the OTHER render path at idle (`bgOk`: not hidden, not battle, no touch for 0.7 s or night>0.15) then one composer render; `pathReady{screen,rt}` + `useComposer()` never switches to a path that is not built (unit test `dev/p39_gate.py` → GATE OK); `mark()` → black box.
- `perf.js`: `mark(name, ms)` stage durations (sent first in the JSON), `long-animation-frame` entries (function name + duration) for frames > 400 ms; world-build stage durations `w:*`; slow units `u:*` (> 250 ms).
- Dev tools in /home/claude/dev: `p39_load.py` (A/B, OLD=1, Q=, SHOT=1), `p39_progs.py` (program inventory), `p39_prof.py` (V8 CPU profile), `p39_lights.py`, `p39_src.py`, `p39_gate.py`.

## Open
- Phone result unknown (waiting for his perf log). If a stall remains: LoAF `fn`/`marks` say where. Further levers: fewer point lights in shaders (Q.lights 4→2 on high; merge dragon glow + strike light), fewer distinct materials/hook variants (~185 per path), smaller shader (physical → lambert for far/small props), impostor atlas bake in slices (`trees.js bakeImpostor`).
- Wave 1 (15 worker prompts) is out with the owner; merge when patches arrive.

## Phone result (owner's log, 6 Oct 23:19–23:27 Tehran; Xiaomi 2602BPC18G, Android 16, Mali-G925-Immortalis MC11, Telegram-Android 12.10.6, tier high) — p39 IS INSTALLED
- Home load works: ready after 25.4 s, longest main-thread task 2.3 s (was 9–16 s freezes), programs at ready 265. Marks (ms): base-compile 8929, late-built 4535, late-compile 9934, reveal 815, warm-draw 81. World-build stages: Laying the Blue Wall 2198, Planting the forest 1140, Waking the army 808, models 647 + 251 (each ONE task).
- Idle compile of the second render path (`bg-screen`): 29.7 s long, programs 265 → 398, but with 300–640 ms hitches while the intro / home is on screen (slice cannot get below one unit; one unit = several programs).
- **Battle load = the open problem**: tap ATTACK → one main-thread task of **23.2 s** (LoAF function `bt` = the battle loader's continuation), programs 393 → 611 (+218), geometries 510 → 684, textures 511 → 594; first battle frame 635 draw calls / 5.56 M triangles. Before it: tasks of 581 / 634 / 483 ms. Frames in battle: not measured (add telemetry).
- Back home after the battle: one 465–698 ms task.
- Frame counts: home ≈ 55 fps average over 5 min (18 376 frames / 297 s) — the steady state is fine.
Raw log: docs/perf_log_oct6_2327_phone.txt
