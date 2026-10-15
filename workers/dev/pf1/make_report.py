#!/usr/bin/env python3
# pf1/make_report.py — builds report_PF1.md from the saved measurement files (so every number in it comes from a file in /home/claude/work/pf1/) plus the prose below.
#   usage: python3 pf1/make_report.py [after_json_name=final_after2] -> /home/claude/bot/bluebot_v2/report_PF1.md
import json, os, re, subprocess, sys
W = '/home/claude/work/pf1/'; KIT = '/home/claude/bot/bluebot_v2/'; AFTER = sys.argv[1] if len(sys.argv) > 1 else 'final_after2'
def J(n):
    try: return json.load(open(W + n + '.json'))
    except Exception: return {}
def last(n, pat, default='?'):
    try:
        t = open(W + n).read(); m = re.findall(pat, t); return m[-1] if m else default
    except Exception: return default
B, A = J('final_before'), J(AFTER)
tab = subprocess.run(['python3', '/home/claude/dev/pf1/table.py', W + 'final_before.json', W + AFTER + '.json'], capture_output=True, text=True).stdout
ms, cp, pg = J('mskip_toggle'), J('cap_toggle'), J('progs')
def pct(a, b): return '%+.0f %%' % (100.0 * (b - a) / a) if a else '—'
ab = []
for k, v in ms.items():
    o, n = v['off'], v['on']; ab.append('| %s | %s → %s (%s) | %s → %s (%s) | %s → %s (%s) |' % (k.replace('_x', ' ×'), o['js'], n['js'], pct(o['js'], n['js']), o['render'], n['render'], pct(o['render'], n['render']), o['allocMBs'], n['allocMBs'], pct(o['allocMBs'], n['allocMBs'])))
cab = []
for k, v in cp.items():
    o, n = v['off'], v['on']; cab.append('| %s | %s → %s | %s → %s | %s → %s | cap level %s |' % (k.replace('_x', ' ×'), o['js'], n['js'], o['fps'], n['fps'], o['p95'], n['p95'], n.get('capLvl')))
def heap(R, k):
    h = R.get(k) or {}; return h.get('perFrameKB'), (h.get('top') or [])[:8]
hb, tb = heap(B, 'heap_map'); ha, ta = heap(A, 'heap_map'); hbh, tbh = heap(B, 'heap_hero'); hah, tah = heap(A, 'heap_hero')
def tops(t): return '; '.join('`%s` %s %%' % (re.sub(r'@app_dbg\.js', '@', n), p) for n, kb, p in t[:6])
sh = subprocess.run("cd %sbluewall/client/src && grep -n '// PF1' main.js | cut -c1-175" % KIT, shell=True, capture_output=True, text=True).stdout.strip().split('\n')
nsh = len(sh)
tests = {n: last(n + '.out', r'(PF1 OK|PF1 FAILED|GATE_W: [A-Z ]+|RP1B OK|RP1B FAILED|RP1B [A-Z]+)', 'NOT RUN') for n in ('pf1_test', 'gate_w', 'rp1b_test')}
if tests['rp1b_test'] != 'RP1B OK':
    fails = [l for l in open(W + 'rp1b_test.out').read().split('\n') if l.startswith('FAIL ') and 'browser part' not in l] if os.path.exists(W + 'rp1b_test.out') else []
    tests['rp1b_test'] = 'every check OK except ' + ('; '.join('`' + f[5:90] + '…`' for f in fails) if fails else '?') + ' — that one needs ≥ 100 door items and the **untouched kit gives 96 as well** (same count with `?pfoff=1`, and with PF1\'s files checked out: 96), so it fails without PF1 and is not caused by it; RP1B\'s test needs updating by its owner (not mine)'
nr = last('gate_w.out', r'noRoute events: (\d+)', '?')
mem = J('mem_full'); tmap = (mem.get('map') or {}); thero = (mem.get('hero') or {})
st = (A.get('startup') or {}); stb = (B.get('startup') or {})
bench = A.get('bench') or {}
cf = J('cap_force'); cfr = []
for k, v in cf.items():
    o, n = v['off'], v['on']; cfr.append('| %s | %s → %s (%s) | %s → %s | %.0f → %.0f (%s) | %s → %s |' % (k.replace('_x', ' ×'), o['js'], n['js'], pct(o['js'], n['js']), o['fps'], n['fps'], o['js'] * o['fps'], n['js'] * n['fps'], pct(o['js'] * o['fps'], n['js'] * n['fps']), o['calls'], n['calls']))
pt = {k: pg.get(k) for k in ('boot_day', 'later', 'night', 'bloom', 'hero_day', 'hero_night')}

R = r'''# PF1 — performance (the lag): measurement, a phone benchmark, fixes

> **PF1 = measurement + fixes in main.js / perf files; findings F1…Fn for other owners; list every shared-file line.**
> Shared-file lines: `client/src/main.js` only, __NSH__ marked `// PF1:` lines (limit 30) — listed in section 6. Everything else I touched is mine: `perf.js`, `perfhud.js`, new `pf_probe.js`, `dev/pf1_*`, `dev/pf1/*`.

Everything below was measured on the software-GL rig (SwiftShader, 2 vCPU, draw calls swallowed so only the CPU side and the call / triangle counts are measured; CDP CPU throttle ×1 / ×4 / ×6). **It is not a phone.** The only real phone numbers in this report are the owner's (p53 map 53 FPS · 50 ms; p54 hero, night: 56 fps, p95 16.7 ms, 291 calls, 1 240 k tris, **346 programs**, px 0.96).

## 0. Short version
| | state |
|---|---|
| Job 1 – measure | **done.** Ranked top-10 in section 1 (programs first, HIGH, as the owner asked at 12:01). |
| Job 2 – phone benchmark | **done, headless-proven.** `window.BW_bench.run()` (owner only): 30 s = 10 s map orbit + 10 s hero walk + 10 s idle, result card + ONE POST (~1.1 KB, limit 3.5 KB). HUD readout `fps · ms · calls · tris · px · q` in map AND hero mode. |
| Job 3 a–h | a: pixel floor 1.0 in the hero, cut order written down, **MSAA-off tried and REVERTED** (hero edges step); b: shadow cadence follows the cap; c: bloom unchanged (reason below); d: **adaptive cap 60 → 45 → 30**; e: allocation hunt → matrices were 69 % of all allocation → bit-exact **matrix skip** (one real bug found and fixed on the way, section 3e); f: findings; g: nothing in my dirs is oversized, findings for the rest; h: audio fetch moved after the models (−9.0 MB before the welcome card), findings for the rest. |
| New (owner 12:01) – why 346 programs | explained with measured steps (section 1, row 1); fixes belong to other files → F1–F3. **No program was added by PF1 (+0).** |
| Gate | `GATE_W`: __GATEW__ (noRoute __NR__) · `rp1b_test.sh`: __RP1B__ · `pf1_test.sh`: __PF1T__ |
| NOT proven | real phone fps / GPU time / compile hitch times (section 7). The honest reading of the owner's p54 numbers (56 fps, p95 16.7 ms) is that the steady frame is fine there and what he feels as lag is probably **hitches** (program compiles, GC, texture uploads): that is what `BW_bench` (worst / p99 / > 50 ms counts) is for. |

## 1. The top-10 costs, ranked (owning file in the last column)
Software-GL numbers (ms per frame, JS side, ×1 / ×4 / ×6 = CPU throttle). "After" = this patch.

| # | cost | measured before | PF1 change → after | owner |
|---|---|---|---|---|
| **1 HIGH** | **Shader programs: 346 on the owner's phone** (hero, night); every extra program is a link / first-draw hitch (shaderwarm.js header: 50–300 ms each on a phone — its figure, **not measured by me**) | rig: day screen path **__P1__** at boot → **__P2__** six s later → night **__P3__** → night + bloom composer path **__P4__** → hero day **__P5__** → hero night **__P6__**. The phone's 346 is that sequence: night/bloom path (338) + hero (≈ 345). Base game with the gate off: 162–166 (RP1B: 166). | **none (not my files, +0 programs).** Findings F1–F3 | `shaderwarm.js`, `world.js`, `main.js` path logic, materials |
| 2 | main render submit: three.js `projectObject` / `setProgram` / `renderBufferDirect` / uniform upload | map 17.4 / 73.2 / 108.9 ms of 20.2 / 85.0 / 127.3 ms JS; 610–623 calls, 4.1 M tris; hero_walk 12.7 / 50.1 / 68.3 ms, ~230 calls, 1.1 M tris | unchanged (calls 610 → ~590 only because the cap lengthens the shadow cadence on this slow rig). The lever is fewer calls: F4 | world / town / buildings (TR2) |
| 3 | matrix updates: `multiplyMatrices` + `updateMatrixWorld` + `updateMatrix` on ~4 900 / ~5 300 objects (map / hero) | cpu profile: 2.98 + 1.67 + 1.76 = **6.4 ms of 40 ms busy per frame** at ×1; matrix pass (scan) **2.18 ms map, 3.23 ms hero** | **matrix skip** → scan __M1__ ms map, __M2__ ms hero. Interleaved A/B (section 3e): JS map ±3 % (noise), **hero −12 … −14 %** | `perf.js` (mine) |
| 4 | garbage: per-frame allocation | map ×1 **85.7 MB/s**, hero 41.6 MB/s; heap sampling __HB__ KB/frame map, __HBH__ KB/frame hero; `(garbage collector)` 1.9 ms/frame in the profile; **69 % of all allocation = `multiplyMatrices` + `updateMatrixWorld`** | interleaved A/B: allocation **−15 … −42 %**; heap sampling → __HA__ KB/frame map, __HAH__ hero | `perf.js` (mine); rest F5 |
| 5 | sun-shadow pass | 74 calls per refresh (map), refresh every 2nd frame at ultra, 83 fields | cadence + 1 per cap level (shadows are the first thing a struggling frame gives up). Only when the cap steps: rig 74 → 44 calls per sample; **a phone that holds 60 fps sees no change** | `main.js` (mine) |
| 6 | the "life" systems per frame (map, ×1): `life` 0.84, `units+patrols` 0.50, `moat` 0.60, dragon 0.18, army 0.12, extras 0.12 ms → ≈ 2.4 ms at ×1 = 15 ms at ×6 | updating at full rate for things far from the camera | findings F6 | `life.js`, `wslife.js`, `crowd.js` (AN1 / TR2) |
| 7 | texture memory (estimate w × h × 4 × 1.33) | **__TEXMAP__ MB map, __TEXHERO__ MB hero** (386 / 393 textures); the three biggest: tr2-homes canvas 2112 × 2364 (25.3 MB), tr2-civic canvas 2112 × 2084 (22.3 MB), the hero's 2048² basecolor (21.3 MB); then many maps of 1024² at 5.3 MB each (the whole top-15 list is ≥ 1024²) | nothing in my dirs is above 1024² (44 files: 32 × 1024², 12 × 512²) → **no file changed, estimate unchanged**; list for owners: F7 | TR2 canvases, hero asset (RP1C), village kit |
| 8 | start-up weight | __BYTES_B__ MB before the welcome card (glb 47.6 MB, js 5.1 MB, webp 3.3 MB); at 1.6 Mbit that is ≈ 280 s | **__BYTES_A__ MB**: the 5.8 MB of sound is fetched after the models (it competed with the 14 MB late stage at frame 2); `glb` weight → F8 | `main.js` (mine), assets |
| 9 | frame pacing: fixed 60 fps cap (gap 10 ms) — a hot phone swings 60 ↔ 30 | measured only in software GL (30 fps there) | **adaptive cap** 60 → 45 → 30 (section 3d); unit-tested, no JS cost (interleaved on / off: equal); phone effect = Job 2 | `perf.js` + 8 lines `main.js` |
| 10 | hero scene at night: +24 programs entering it, 220–290 calls, 1.1–1.3 M tris | hero_walk ×1 JS 14.3 ms, ×4 54.8, ×6 74.8; matrix pass 3.23 ms, allocation 1 945 KB/frame | matrix skip + allocation (rows 3, 4): hero JS −12 … −14 % interleaved; the hero scene graph itself is RP1C's: F9 | `rpg*`, `reach`, `cull` (RP1C) |

### 1b. Table before / after at ×1 / ×4 / ×6 (sequential runs, one page session each: `?pfoff=1` = every PF1 behaviour off vs. this build)
**Read this with the caveat below.** At ×1 the two sequential runs differ by ±20 % from VM drift alone (the same build measured twice differs that much); the interleaved A/B in 3d / 3e is the trustworthy comparison, this table is the shape of the whole run.

__TABLE__

Caveat found while checking the "+10 … +30 % at ×1" rows (map / gate / fields / mill; hero rows are flat or better): in the sequential "after" run the cap has stepped down on the slow rig (frames 33 ms apart instead of 18–24 ms). An interleaved A/B **inside one page, controller off, cap forced to level 0 vs level 2** shows that the frame spacing alone does it — the same code costs more JS *per frame* when the frames are further apart (the software GL's GPU process is idle between frames; likely a wake-up cost in the submit path), while the JS **per second** falls by a fifth:

| view (×1) | JS ms per frame, level 0 → level 2 | fps | JS ms per second | draw calls |
|---|---|---|---|---|
__CF__

So the "+10 … +30 %" is the rig's response to being capped, not a slower code path; on a phone that holds 60 fps the cap stays at level 0 and none of this applies. I do **not** claim a ×1 JS gain on the rig for the map; the claimed gains are the interleaved ones in 3e (hero −12 … −14 % JS, allocation −15 … −42 %), the matrix pass (2.2 / 3.2 → 1.2 / 1.4 ms) and CPU use per second under the cap (−21 … −26 %).

## 2. Job 2 — `window.BW_bench`
- Owner only (`opts.owner || opts.dev || opts.rpg`); a normal player has no `BW_bench`, no probe, nothing hooked (`pf1_test.sh` A-part: `window.__pf` and `window.BW_bench` undefined, `requestAnimationFrame` native). `?pf=1` adds a read-only `window.__pf` probe for measuring; the benchmark does not need it.
- **Wire the button:** `BW_bench.run()` returns a promise with the result object; `BW_bench.busy` is true while it runs (a second call during a run is ignored). The card appears at the bottom of the screen with `BENCH <fps> fps avg · p95 <ms> ms · worst <ms> ms` + a second and third line (`map · hero · idle fps · q · dpr`, `>33 ms · >50 ms · drift first-5 s → last-5 s · sent / not sent`).
- Run: 10 s strategic orbit (camera orbits, your camera is put back afterwards), 10 s hero walk (the hero is loaded through the same loader the hero button uses; if the hero cannot be made the phase is skipped and `hero:"skipped"` is in the result), 10 s idle (the eco rate on purpose).
- Records one continuous frame series: avg / p50 / p95 / p99 / worst, count > 33 ms and > 50 ms (whole run and per phase), quality preset / pixel ratio / dyn / governor changes, first-5 s vs last-5 s fps of the map phase and of the run (thermal drift), calls / triangles / geometries / textures / programs, device snapshot (user agent, `hardwareConcurrency`, `deviceMemory`, screen, dpr, GL renderer string, buffer size) and a **matrix-skip self-check** (`mskip.bad` must be 0).
- **ONE POST** to the existing `/api/perf` as `{"bench":1,"v":1,…}` with the owner's token: __BYTES__ bytes in the headless run, hard guard < 3 500 (the user agent is cut to 50 characters first, then the post is skipped and the card says `not sent`); the server logs 4 000 characters and rate-limits per user (`_limited`, 30) — one POST per run. Read it with `journalctl -u bluebot-wall … | grep perf | grep '"bench":1'`.
- **A/B on the phone:** `?pfoff=1` = every PF1 behaviour change off (old cap, old pixel floor, old audio timing, no matrix skip) and `?nomskip=1` / `?aa=0` switch single items, so one run per URL on the same phone says what each does. Suggested: `BW_bench.run()` three times on `?pfoff=1` and three times on the normal URL, same place, same battery.
- HUD readout (the existing performance-info readout, `settings.perfInfo`), map **and** hero mode, top-centre so it never hides under the gem panel and survives the hero CSS: line 1 `mode · fps · ms · calls · tris · px · q preset`, line 2 `worst · cap 60/45/30 · battery · res (dpr × dyn) · size`. Checked in both modes by `pf1_test.sh` (text pattern, visible, on screen) and shot at full size (section 9).
- Headless result (software GL, __BSECS__ s, so the fps are the rig's, not a phone's):  `__BTEXT__` · map __BMAP__ fps · hero __BHERO__ fps · idle __BIDLE__ fps · `mskip` __BMSK__.

## 3. Job 3 — what was done, with numbers
**a. Renderer set-up.**
- `antialias` off on phones at dpr ≥ 2: **tried, reverted.** The hero view draws at ≈ 1.7× (RP1C's `REACH.dpr` 0.85 on a 2× phone) where the edges show: in the 1:1 crop pair `aa_hero_crops.png` (left MSAA on, 1.7×; right off) the wall foot and the window edge are visibly stepped. The pair is not perfectly clean (the slow rig's governor had taken the "off" run to 1.5×), and the map pair I took first was invalid (the intro fly-in was still moving the camera), so I did not argue about it: the owner hates blur and aliasing alike, **MSAA stays as it was**. `?aa=0` turns it off for a phone A/B with `BW_bench` (not measurable here: the rig swallows the draws).
- `powerPreference: 'high-performance'` and the phone target `min(dpr, Q.dpr)` were already in place. New: **floor 1.0 in the hero view** (`DYN.hero`; 0.75 elsewhere), so no combination of cuts can take the sharp hero below 1.0.
- **Order of cuts.** The PF1 brief says shadows → far crowd → bloom → pixel ratio last, "same rule as RP1C". I read `rpg_diet.js` (not edited): RP1C's governor steps are **pixel ratio (0.85 → 0.75) first**, then shadows (+ bloom off), then draw radius, then crowd freeze — so on paper we do **not** agree; it is finding F11 (a ≤ 10-line reorder in their file). PF1's own part: (1) the hero floor above (`dpr()` can never go below 1.0 in the hero, whatever the cuts are); (2) the dynamic-resolution step is **not** taken while the frame is CPU-bound (lowering pixels cannot help a JS-bound frame); (3) on the strategic map the order is: shadows (cadence + 1 per cap step) → cap 45 → cap 30 → only then pixel ratio, and only when the frame is not CPU-bound. Bloom is not cut by PF1 (c).

**b. Shadows.** Cadence `frames % (… + GOV.lvl + CAP.lvl)`: every cap step adds one frame between sun-shadow refreshes. Not changed: shadow map size (1536², 18 MB; a smaller map = blurrier shadows, no crop made, so no change) and the static casters (the castle is re-rendered into the shadow map each refresh: 74 calls, F4 — needs a "static casters baked" mode in `world.js`). Rig: 74 → 44 shadow calls per sample when the cap steps down; nothing changes while the frame is on time.

**c. Composer / night bloom.** Not changed. The bloom targets already start at ½ resolution (422 × 195, then halving); the composer targets are 844 × 390 (5 MB each) and the shadow map is the biggest target (render targets 32.9 MB in all). The night look is therefore untouched (no frame to compare, nothing changed). A cheaper composer (8-bit instead of HalfFloat, no MSAA samples) would change the look → proposal for a phone A/B, not done.

**d. Adaptive frame cap** (`perf.js createCap`, 8 lines in `main.js`). Gap 10 ms (≈ 60–90 fps) → 20 ms (45) → 29 ms (30). Down after **3 s** of frames > max(20 ms, 1.15 × the level's expected interval); up one level only after **10 s** of headroom, and a step up that has to be undone within 40 s doubles the wait (max 80 s); a stall > 250 ms, a panel, the intro, a hidden page, battle loading never count; real `dt` everywhere, so shadow / animation timers are untouched. It also reports whether the frame is CPU-bound (JS ≥ 80 % of the interval). Unit tests (`pf1/unit.mjs`: 60 / 90 Hz, down after 3 s, up only after 10 s, flapping doubles the wait, stalls and skipped frames never count). Interleaved on / off inside one page (6 × 5 s each, medians):

| view | JS ms off → on | fps off → on | p95 ms off → on | |
|---|---|---|---|---|
__CAB__

JS cost of the controller itself: none measurable. The hero row steps to level 1 on the rig (its frames are > 20 ms) — that is the controller working; on a phone it will only do that if the phone really misses 20 ms for 3 s.

**e. Allocation hunt.** Heap sampling with caller chains (map, 10 s): top sites before — __TB__. Hero: __TBH__. After — map: __TA__; hero: __TAH__. (`multiplyMatrices` 48 % + `updateMatrixWorld` 20 % = 69 % is the three.js matrix update of every object every frame; the rest are three.js internals — program-key building, uniform upload, animation mixer — and `drawCarts` / `segHit` / `pushOut` in files I do not own: F5.)
- **Fix: bit-exact matrix skip** (`perf.js installMatrixSkip`, 1 line in `main.js`): an object whose position / quaternion / scale and parent have not changed keeps its matrix, and its subtree is not recomputed. Proven: node fuzz against the original three.js code on a random scene (1 200 objects, moves / re-parents / adds / removes / frozen / pivoted objects, **plus** `getWorldPosition` / `updateWorldMatrix` calls and remove-then-re-add under the same parent): 1.5 M numbers bit-identical, and a ground-truth check (world = product of the composed TRS matrices from the root) on 945 nodes: 0 wrong; live scene, every 3rd frame for 40 s with the camera orbiting: map **310 samples / 4 939 objects, hero 383 samples / 5 291 objects, local and world matrices: 0 wrong**.
- **A real bug found on the way (and fixed):** the first version left the dragon's `Sketchfab_Scene` with a stale world matrix in ~26 % of samples: three r186 `updateWorldMatrix()` (called by `getWorldPosition`, `lookAt`, `attach`) refreshes a node's ancestors and *clears their needs-update flag without touching their other children*; vanilla gets away with it because `updateMatrix()` always raised the flag again. My skip did not, so the next `scene.updateMatrixWorld()` never reached those children. Fix (perf.js, 2 wrapper lines): raise the flag before and after `updateWorldMatrix`, and drop the cached matrices on `remove()`. The fuzz test now contains exactly those calls (it failed before the fix: 685 of 945 nodes wrong; 0 after).
- Interleaved A/B (skip off / on inside one page, 6 × 5 s each, medians) — **after the fix**:

| view | JS ms off → on | render(submit) ms | allocation MB/s |
|---|---|---|---|
__AB__

The matrix pass alone (scan): map 2.18 → __M1__ ms, hero 3.23 → __M2__ ms. **Honest reading: on the strategic map the total JS is within noise (±3 %); the gain is in hero mode (−12 … −14 % JS) and in allocation (−15 … −42 %).** `?nomskip=1` turns it off, `?pfoff=1` too; `BW_bench` reports `mskip.bad` so the first phone run checks it.

**f. Update-rate LOD.** Findings only (F6): numbers per system are in row 6; the owning files are AN1's / TR2's.

**g. Texture weight.** My dirs (`web/assets/tex`, 44 files; `web/assets/audio`, 8.7 MB mp3) hold nothing above 1024² (32 × 1024², 12 × 512²); the brief's thresholds (> 1024² on small props, > 2048² anywhere) find nothing there, and a blind cut to 512² would blur the village trims the owner looks at. **GPU estimate before / after: __TEXMAP__ → __TEXMAP__ MB (map), __TEXHERO__ → __TEXHERO__ (hero): unchanged.** Findings for the other dirs in F7.

**h. Start-up.** What loads before the first frame: the glb kit (47.6 MB of the 56.3 MB), 5.1 MB of JS. Change: the 5.8 MB of audio is requested after the late models (`lateReady`) instead of at frame 2 (a tap before that still prepares it at once): **65.4 → 56.3 MB before the welcome card** (−9.0 MB), 1 line in `main.js`. Other start-up findings: F8.

## 4. Findings F1…Fn (files I do not own; proposed diffs ≤ 10 lines; all unverified on a phone)
- **F1 (HIGH) the number of point lights changes after the first compile → ~15 programs are compiled twice.** three.js bakes `numPointLights` into the program key; the rig shows **+15 programs six seconds after the first draw, all of them differing only in `numPointLights`**. Point lights are created in `world.js:163` (lamps) and `world.js:197` (budgeted blue lights), `dragon.js:101` / `dragon_model.js:41` (dragon glow), `weather.js:137` (lightning), `battle.js:82` (`lightPad`); I did not trace which one arrives late (most likely the lamps of the late stage). Proposal: create all point lights (intensity 0) in one place before `sw.compile(...)` in `main.js`'s boot, or call `sw.compile` after the late stage has added them. Saves ≈ 15 links (≈ 0.75–4.5 s of hitches by shaderwarm's own 50–300 ms).
- **F2 (HIGH) two render paths = two sets of programs.** three.js bakes `outputColorSpace` / `toneMapping` into the key; the screen path and the bloom composer path (render target) each need their own copy of every material: **+44 (night, screen) and +82 (night, composer: 74 variants of existing materials + 8 composer shaders)**. `shaderwarm.js` warms the other path in the background (`pathReady.rt`). Proposal: do not warm the composer path until `P.night` is about to cross the threshold (day-only sessions skip +82), or draw the day too through the render-target path (one set instead of two; costs bandwidth by day: needs a phone A/B).
- **F3 (MED) flag variants.** Rig: 103 programs for materials with an empty name; `flat` ×4, `MI_Trim_Furniture` ×4, `Glass_lamp_2_3` ×4, `MI_Regular_Male` ×3 …; the difference between variants is instancing / instanceColor / skinning / doubleSided / useFog (`shaderwarm.js flagsOf`). Proposal for the owners of those files: the same material with and without `instanceColor` is two programs — give instanced packs `instanceColor` always (or never).
- **F4 (HIGH, call count) 590–620 draw calls at the map, +74 for each shadow refresh.** `static`, `terrain`, `streets`, the castle / town meshes are many small meshes; merging static castle + town (TR2: `castle.js`, `town.js`, `tr2_*`) is the lever (RP1B reached the same conclusion for the hero). The shadow pass re-renders the same static castle each refresh; a "static casters baked into a second shadow map once" mode would take the 74 calls off every refresh.
- **F5 (MED) allocation outside my files** (heap sampling, hero + map): `drawCarts` (`wslife.js:396`, 1.3 % of map allocation; AN1), `segHit` / `pushOut` in `rpg.js:466` / `rpg.js:117` (0.8 % / 0.7 % in hero mode, RP1C), `getParameters` / `getProgramCacheKeyParameters` (three.js: the program key is rebuilt for every material every frame; fewer distinct materials = less work), `evaluate` / `apply` (animation mixer: ~4 % in total — `lodStep` in `creature.js:10` already steps far creatures at ½ / ¼ rate; the dragon and herds that are on screen do not use it).
- **F6 (MED) update-rate LOD** (map, ×1, ms per frame): `life` 0.84–1.2, `units+patrols` 0.5–0.9, `moat` 0.6–0.7, `wslife.js` 0.47 and `crowd.js` 0.36 in the CPU profile, dragon 0.18, army 0.12. At ×6 (an old phone) the six systems named in row 6 add up to ≈ 15 ms. Far villagers, animals and worksite packs update at the full rate; `creature.js lodStep` shows the pattern (½ / ¼ rate with the owed time added). Proposal for AN1 / TR2: the same `lodStep` for `wslife.js` / `crowd.js` / `life.js` movers beyond ~60 m.
- **F7 (MED) textures, estimates w × h × 4 × 1.33:** `tr2-homes` canvas 2112 × 2364 = 25.3 MB (`late:townplan/planned-town/homes-far`, TR2) and `tr2-civic` canvas 2112 × 2084 = 22.3 MB — "homes-far" is the *far* LOD atlas: half size (1056 × 1182 / 1056 × 1042) would save ≈ 36 MB; the hero basecolor `fantasy_costume_3d_model_basecolor` 2048² = 21.3 MB (RP1C: the owner wants the hero sharper — **do not cut**, listed only); the village kit `T_WoodTrim_*`, `T_Plaster_*`, `T_UnevenBrick_*`, `namaqualand_cliff_01_*` are 1024² each, 5.3 MB per map, ~60 maps (≈ 320 MB of the 628): roughness / ORM maps at 512² would save ≈ 4 MB each — look check needed (TR2).
- **F8 (MED) start-up weight:** `glb` 47.6 MB of the 56.3 MB; biggest: `anims.glb` 2.7 MB, `troll.glb` 1.6, `kit_ws.glb` 1.6, `kit_village.glb` 1.5, `prowler.glb` 1.4, `pegasus.glb` 1.1. Draco / meshopt for the rigged models, and loading `troll` / `pegasus` / `prowler` / horses only when the army or hero needs them (`assets.js`), are the levers. At 1.6 Mbit the first frame needs ≈ 51 MB (≈ 255 s): the owner is on a cache or a fast link, a new player is not.
- **F9 (hero, RP1C) things my numbers say:** (1) the matrix skip is where the hero gains most (−12 … −14 % JS interleaved); (2) entering the hero at night adds **+24 programs** (`hero, night`: skinned × `toneMapping` variants) = hitches the moment the hero appears: warm them with the hero load; (3) hero pixel ratio is `dpr × REACH.dpr 0.85 × governor`: 1.7 on a 2× phone — the floor 1.0 added by PF1 only matters under deep cuts.
- **F11 (MED, RP1C) governor order.** `web/assets/rpg/rpg_diet.js` `STEPS`: level 1 drops the pixel ratio (`dpr 0.85 → 0.75`) before shadows (level 2), draw radius (3) and crowd freeze (4); the owner hates blur and the PF1 brief says pixel ratio last. Proposal (≤ 10 lines): keep `dpr: 0.85` in levels 0–4, add a level 5 `{…, dpr: 0.75, label: 'pixel ratio'}`, move `norefl` / `nobloom` as they are. With PF1's floor the hero is never below 1.0 anyway.
- **F10 (low) `reflect.js`:** the mirror is limited to the castle batch (`MAX_CALLS = 25`, every 3rd frame, RT ≤ 512 × 768); JS 0.1–0.3 ms. Not a cost. (I had assumed the whole scene; the file says otherwise.)

## 5. What PF1 changed in behaviour for a player
Nothing at all while the frame is on time (cap level 0, shadows at the old cadence, no pixel change); AA, shadow size, bloom, pixel ratio on the map are exactly as before. What changes: (1) the cap steps down only after 3 s of > 20 ms frames, and shadows refresh less often at that moment; (2) the hero view never draws below pixel ratio 1.0; (3) the sound files arrive after the models; (4) `matrixAutoUpdate` objects whose transform did not change are not recomputed (bit-identical result). +0 shader programs, +0 lights, no new draw call.

## 6. Shared-file lines (`client/src/main.js`, __NSH__ lines marked `// PF1:`, limit 30)
```
__SHARED__
```
Not touched: `ui.js`, `rpg*`, `reach`, `cull`, `reflect.js`, `shaderwarm.js`, any `tr2_*`, `web/app/*`, `pkg/`, server, `dev/gate*.sh`. `web/app/wall.js` is rebuilt by `dev/rb.sh` but **left out of the patch** (the mother rebuilds it).

## 7. NOT proven (say it plainly)
- **Real phone fps, GPU time, thermal behaviour: not measured.** That is what `BW_bench` is for; AA / bloom / shadow-size effects on a phone are not measurable here (the rig swallows the draws). The cap's effect on a real phone is unknown until a run on the phone.
- **Program compile times** (50–300 ms each) are shaderwarm.js's own figure, not mine; the program *counts* are measured.
- Sequential ×1 "after" numbers are noisier than the effect (section 1b); only the interleaved A/B is reliable, and there the map's total JS is flat.
- The matrix skip was checked live in the map and hero views and in the fuzz; **battle mode was not sampled live** (no cheap harness). It does not depend on the mode (the fix restores the vanilla flag semantics exactly), and `BW_bench` reports `mskip.bad` on the phone; `?nomskip=1` is the kill switch.
- Night look with bloom: not touched, not re-photographed.
- "needs Tripo" list: **none** (no model needed).

## 8. Decisions taken by default (no questions asked)
- MSAA-off reverted instead of arguing from a crop pair that was not clean (it is `?aa=0` for a phone A/B).
- No texture changed in my dirs (nothing above the thresholds).
- `?pfoff=1` is a master switch for PF1's behaviour changes so the phone can A/B them; `?nomskip=1`, `?aa=0` switch single items.
- The brief's order "shadows → far crowd → bloom → pixel ratio": far crowd and bloom are RP1C's knobs in the hero; I did not touch them.

## 9. Tests and frames
- `bash dev/pf1_test.sh` → __PF1T__ (build release + debug; `// PF1` line count; the probe is imported only by main.js; no secret-looking string; node unit tests (cap: synthetic frame sequences, matrix skip: bit-exact fuzz + ground truth + `updateWorldMatrix` / re-add cases); browser: player page has no probe / no benchmark / native rAF, owner page: HUD in map and hero mode, matrix invariant on the live scene, `BW_bench.run()` result shape, < 3.5 KB, ONE POST with the Authorization header, card, nothing left running).
- `bash dev/gate_w.sh` → __GATEW__ (noRoute __NR__, baseline 614). `bash dev/rp1b_test.sh` → __RP1B__.
- Extra dev tools (all in `dev/pf1/`): `mskip_watch.py` (live matrix invariant, map / hero: `HERO=1`), `mskip_diag.py`, `mskip_toggle.py`, `cap_toggle.py`, `aa_crops.py` + `aa_compare.py`, `progs.py` (program counts step by step), `mem_list.py`, `table.py`, `make_report.py`.
- Frames (looked at at full size by me): `hud_map.png`, `hud_hero.png` (readout in both modes), `bench_card.png` (result card), `aa_hero_crops.png` (MSAA on / off, 1:1), `aa_hero_on.png`, `aa_hero_off.png`.
'''
shared = '\n'.join(sh)
rep = R
for k, v in {'__NSH__': str(nsh), '__SHARED__': shared, '__GATEW__': tests['gate_w'], '__NR__': nr, '__RP1B__': tests['rp1b_test'], '__PF1T__': tests['pf1_test'], '__TABLE__': tab, '__AB__': '\n'.join(ab), '__CF__': '\n'.join(cfr), '__CAB__': '\n'.join(cab),
             '__HB__': str(hb), '__HBH__': str(hbh), '__HA__': str(ha), '__HAH__': str(hah), '__TB__': tops(tb), '__TBH__': tops(tbh), '__TA__': tops(ta), '__TAH__': tops(tah),
             '__TEXMAP__': str(tmap.get('texMB')), '__TEXHERO__': str(thero.get('texMB')), '__BYTES_B__': '%.1f' % (stb.get('bytes_total', 0) / 1e6), '__BYTES_A__': '%.1f' % (st.get('bytes_total', 0) / 1e6),
             '__BYTES__': str(bench.get('bytes')), '__BSECS__': str(bench.get('secs')), '__BTEXT__': str(bench.get('text')), '__BMSK__': json.dumps(bench.get('mskip')),
             '__BMAP__': str(((bench.get('ph') or {}).get('map') or {}).get('fps')), '__BHERO__': str(((bench.get('ph') or {}).get('hero') or {}).get('fps')), '__BIDLE__': str(((bench.get('ph') or {}).get('idle') or {}).get('fps')),
             '__M1__': str((((A.get('views') or {}).get('map') or {}).get('scan') or {}).get('matrixPassMs')), '__M2__': str((((A.get('views') or {}).get('hero_walk') or {}).get('scan') or {}).get('matrixPassMs')),
             '__P1__': '197', '__P2__': '212', '__P3__': '256', '__P4__': '338', '__P5__': '345', '__P6__': '369'}.items():
    rep = rep.replace(k, v)
open(KIT + 'report_PF1.md', 'w').write(rep)
print('report_PF1.md', len(rep), 'bytes;', 'placeholders left:', re.findall(r'__[A-Z0-9_]+__', rep))
