# REPORT A1 — wall rows by level (3 rings)

**خلاصه (فارسی):** علت دو ردیف: هر سه دیوار همیشه ساخته می‌شدن، ولی دیوار دور برج (`layout.js` خط ۹، `WALL.inner.H = 7.5`) از دیوار قلعه (۹.۵) کوتاه‌تره و از دوربین خونه پشتش قایم می‌شد. الان `ringsAt(level)` هست: لول ۱–۱۰ یک ردیف، ۱۱–۲۰ دو ردیف، ۲۱–۳۰ سه ردیف؛ دیوار دور برج بلند شده (۱۶ متر) تا سه ردیف واضح باشه. نمونه‌ی شماره‌دار برای مالک فرستاده شد (پیش‌فرض ۱)، جواب نگرفتم → پیش‌فرض ساخته شد و علامت زده شد.

## 0. Owner decision (sample sheet `a1_sheet_final.png`)
| # | what | status |
|---|------|--------|
| 1 | castle grows OUTWARD (keep ring → citadel wall → town wall), keep ring raised to 16 m | **my default, built** |
| 2 | same order, keep ring left at 7.5 m (as `layout.WALL`) | switch: `window.__a1InnerH = 7.5` before the world is built, or change `INNER_H` in `a1_rings.js` |
| 3 | REVERSED (town wall first) | switch: `layout.RING_ORDER = ['town','outer','inner']` (one line), shots in the sheet |

**FLAG: no answer from the owner had arrived when this report was written → option 1 (default) is what is in the patch; it is a design choice, not confirmed.** If he picks 2 or 3 it is a one-constant change (above), no rebuild of the code.

## 1. Cause of two rows (one sentence)
All three rings were always built, but the keep ring is the lowest wall (`layout.js:9` `WALL.inner.H = 7.5` vs `outer 9.5`), hugs the keep and is built with roofed towers only (`castle.js` INNER `wallRun`, `roof: () => true`), so from the home camera it hides behind the citadel wall and its own towers and only two rows read as walls.

## 2. What was built
- `layout.js` (SHARED, +11 lines): `RING_ORDER = ['inner','outer','town']`, `RING_STEP = 10`, `ringsAt(level)` → 1–10 `['inner']`, 11–20 `['inner','outer']`, 21–30 all three (clamped 1..30; the day map has only the square fort → only `outer` exists there and is always returned).
- `a1_rings.js` (NEW, owned): ring tracker. `castle.js` records which structure ids / weapon sites / torch pools / lamps / tap boxes belong to which ring while it builds (`RT.begin(ring)` … `RT.end()`); when the **wall level** changes it shows exactly `ringsAt(level)` — **no rebuild, no new shader/material/draw call**:
  - batched stone, roofs, windows, cloth, plaque, kit tower roofs: vertices of an inactive ring are found once (scan of the `aB` structure-id attribute) and collapsed (static meshes → point 0,0,0; waving cloth → `aPin.y = -4000`), restored from saved copies, only the changed ranges are uploaded;
  - torch flames, tower weapons, Tesla coils: the existing `hide(id)` / `reset()` calls (the same ones an attack uses);
  - glow pools, brazier lights (intensity only → no shader recompile), tap boxes (`picks`): small lists;
  - archers + sentries: `patrol.js` `setRings(set)`.
- `castle.js` (owned): ring recording around the three wall runs + both gatehouses; wall dims from `DIMS` (keep ring `H` = `INNER_H` = 16 m).
- `patrol.js` (owned): archers/sentries carry their ring, `setRings()` removes/re-adds them (walk beats of inactive rings never run).
- `ballista.js`: **not modified** — the towers' weapons are hidden by `a1_rings.js` through the existing `hide(tid)` of the weapons aggregator (so "draws only active rings" holds without touching it).
- Gate + bridge: gate openings are built with `GATE_HALF` per ring; the bridges over the moat are not part of a ring (`castle.js` closes the ring before building them) → roads/nav list them at every level.

## 3. PROVEN (I saw / ran it)
- **Cause**: in-game, level 30, all rings present (shots `a1_base30_L30_*.png`, base build) — the keep ring is hidden behind the citadel wall / its own towers; with `INNER_H = 16` it is clearly a third row.
- **Screenshots from the owner's camera (`ctr` = same as his screenshot), each viewed at full size**: `a1_fin_L10_ctr.png` (1 row), `a1_fin_L11_ctr.png` (2), `a1_fin_L20_ctr.png` (2), `a1_fin_L21_ctr.png` (3), `a1_fin_L30_ctr.png` (3). Town gate bridge visible at every level.
- Option sheet: `a1_sheet_final.png` (1/2/3 at levels 10/20/30 + zoom of the keep at level 30 for tall vs low keep wall).
- **Per ring, in the running game** (probe `dev/a1_probe.js`, `a1_probe.log`): level 10 → archers drawn inner 4/4, outer 0/8, town 0/10; sentries 8/8, 0/14, 0/22; tap boxes 6/6, 0/22, 0/28; level 11–20 → archers 4, 8, 0; sentries 8, 14, 0; level 21–30 → all (4/8/10 archers, 8/14/22 sentries), the citadel's two brazier lights are on only while the citadel ring stands (the other rings have none).
- **Close-ups at the tower positions of the hidden rings**, same camera at level 10 vs 30 (viewed at full size): `a1_wpn_L10_tw.png` / `a1_wpn_L30_tw.png` (town wall: absent at 10 — no wall, gate, flame or cloth floating; the bridge in front of the town gate still stands) and `a1_wpn_L10_ow.png` / `a1_wpn_L30_ow.png` (citadel wall + crystal tower: absent at 10; keep ring with its brazier tower stays).
- **No leftover geometry** (probe `dev/a1_leftover.js`, `a1_perf_after.log`): level 10 → keep ring 29,360 of 29,360 vertices shown, citadel 43,920 and town 69,572 collapsed (0 left over); level 20 → town 69,572 collapsed, rest shown; level 30 → 0 collapsed (restore works, also 30 → 10 → 30 again).
- `bash dev/a1_rings_test.sh` → **`A1 OK`**: `ringsAt` table 1–30 (+ clamps, reordering, day map), each active ring has its gate opening, a walkable route from the muster ground to the keep door through the gate(s) at levels 1/10/11/20/21/30, and the control with gates walled up has no route (so the route really goes through the gates), town-gate bridge listed at every level.
- `nav_test.sh` **NAV OK**, `ring_test.sh` **RINGS OK**, `cam_test.sh` **CAM OK** (worst ground-above-line 2 m).
- `bash dev/gate_w.sh` → **`GATE_W: ALL OK`** (incl. battle sim "no wall crossings", noRoute events 317 < 700).

## 4. Perf — before (p38 build) / after (this patch)
Software GL (swiftshader, 2 cores, `q=low`), level 30, overview cameras; `a1_perf_*.log`, `a1_time_*.log`.

| measure | before | after | budget | |
|---|---|---|---|---|
| new shader programs | 167 | 167 | +0 | ok |
| new draw calls (code adds no mesh/material) | 443 (ctr) / 476 (top) | 443–447 / 475–480 (frame-to-frame noise ±4 from creatures) | ≤ +0 | ok (nothing added; counts differ only by moving creatures) |
| static triangles (deterministic, scene walk) | 175,902 | 175,902 | | +0 |
| all scene triangles at level 30 (deterministic) | 2,010,029 | 2,010,605 | ≤ +20k | **+576** (longer tapestry on the taller keep wall) |
| per-frame `renderer.info` triangles (ctr) | 2,553,716 | 2,587,911 / 2,605,546 | ≤ +20k | noisy (±17k between two runs of the same build); the deterministic walk above is the real delta |
| client bundle (minified, gzip -9) | 1,012,250 B | 1,012,843 B | ≤ +15 KB | **+593 B** (debug build +2.7 KB) |
| ring show/hide, main thread | – | 0.4–0.9 ms per flip (100k vertices), `apply()` no-op 0.0 ms | frame job ≤ 100 ms | ok |
| whole level change (`world.setLevel`) | 50–234 ms | 40–249 ms | | **pre-existing**: the base build already needs >100 ms here for a level change; A1's part is <1 ms, so no regression |

Also: the hidden rings are *collapsed*, not removed, so at levels < 30 the GPU still receives their (zero-area) triangles; this saves nothing in vertex count (it is a visibility fix, not a perf feature).

## 5. NOT proven
- Real phone: frame time and the GPU upload of the changed vertex ranges (≤ 142,852 vertices × 12 B ≈ 1.7 MB at a full flip) were not measured on a device — only software GL.
- The owner's pick (options 1/2/3) — not answered yet (see §0).
- Day map (square fort) was not looked at in a screenshot; only the logic (`ringsAt` returns `['outer']`, `INNER`/`TOWN` are null there) is tested.
- Only `q=low`; no high-quality shots.
- Tesla coils following their ring: implemented through `tesla.hide(id)` / `set(n)`, not seen in-game (no Tesla coil was placed in the shots).
- Tower weapons (ballistas etc.): hidden by structure id (per-ring weapon sites 4 / 7 / 11), seen only indirectly — no weapon is visible at the hidden rings' tower positions in the level-10 close-ups, but I did not find a clearly visible ballista at level 30 in those same views either, so "weapon present when the ring stands" is not shown by a picture.

## 6. NOT done (by design / not mine)
- `bbase.js` / `battlesim.js` battle base: **in a battle all three rings are shown** (old picture) until the battle base is reworked in a later package. `ctx.rings.setBattle(true/false)` is already called by `world.js`.
- River (A2), houses (B*), moat (`moat.js`) and roads (`roads.js`/`town.js`) untouched: at low levels the citadel moat and the town roads/bridge are still there although the citadel/town wall is not (e.g. level 10: the bridge in front of the town gate stands without a wall).
- The dark stone lining along the river/moat bank (`moat.js`, not a ring) stays at every level, so at level 10 it still runs where the town wall will stand (visible in `a1_wpn_L10_tw.png`).
- `ballista.js` not edited (not needed).
- No assets used → no `credits_a1.json`.
- No `(ph)` game-rule numbers were introduced. Two **design values** to confirm: `RING_STEP = 10` (a ring every 10 levels, the owner's rule) and `INNER_H = 16` m (keep ring height, see §0).

## 7. SHARED-file edits and why
- `client/src/layout.js` — only the `ringsAt` export block (`RING_ORDER`, `RING_STEP`, `ringsAt`) after `WALL`. `WALL` itself is **unchanged** (the keep ring's new 16 m comes from `a1_rings.js` `DIMS`, nothing else reads `WALL.inner`).
- `client/src/world.js` — (1) `fx: { flames, pools, flags, lights, picks }` in the `ctx` literal (so `castle.js` can record ring items); (2) after `setLevel(Q.level0 || 20)`: `ctx.levelHooks.push(() => ctx.rings.apply())` + `ctx.rings.install({ scene, weapons, patrols, coils })`; (3) `ctx.rings.apply(true)` after `lateDefenses(...)` and at the end of `teslaApi.set` (weapons/coils built later get hidden if their ring is down); (4) `setBattle(true/false)` in the battle on/off branches; (5) `rings: ctx.rings` in the returned world object (dev hook `__bw.world.rings`).
- `nav.js`: not touched.

## 8. What the mother must wire
- The driver is the **wall entity level** (`levelOf('wall')`, 1..30 on the player scale): whatever sets the wall level (server state → `restoreLevels` → `levels.setMany`) already re-applies the rings through the level hook; **nothing else to wire** for the home map.
- For the battle-base package: `bbase.js` / `battlesim.js` still use all three rings; use `layout.ringsAt(wallLevel)` and `ctx.rings.setBattle(false)` semantics (the battle targets/destruction ids of hidden rings still exist in `ctx.targets`, only the home view hides them).
- Patch application: `owned/` = `castle.js`, `patrol.js`, `a1_rings.js` (copy whole), `shared/…diff` = `layout.js`, `world.js` (`patch -p1`). `web/app/*` is not in the patch (rebuild with `bash client/build.sh`).
- Dev files: `dev/a1_rings_test.{js,sh}` (add to the gate if wanted: prints `A1 OK`), `dev/a1_shot.py`, `a1_perf.py`, `a1_time.py`, `a1_probe.js`, `a1_leftover.js`, `a1_sheet*.py`.
