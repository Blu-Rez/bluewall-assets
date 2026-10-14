# TR2_gaps_S3 — the stairs to the wall-walk: what the owner has to make in Tripo, and what is ready on the game side
TR2 · S3 round 2 · 15 Oct 2026 · kit `df25be0`+ · nothing here is hand-built: the game side is ONLY the anchor list + numbers; no stairs model was made or faked.

## خلاصه برای وینگلس
- **کتابخونه مدل پله نداره.** من هم نساختم. چیزی که تو Tripo باید بسازی: **یه پله‌ی سنگیِ راست، ۹ متر ارتفاع، ۴۱ پله (هر پله ۲۲ سانت بلند و ۳۰ سانت عمق)، عرض ۲ متر، پاگرد ۲×۲ متر بالا**، دیواره‌ی پهلوی توپُر، زیرش توپُر تا زمین (جدول پایین، همه‌ی عددها). یه مدل برای همه‌ی لول‌ها کافیه (مثل کیپ)؛ ۹ پوسته‌ی رنگی بعداً.
- **کجا می‌ایسته:** پشت دیوار (سمت داخل شهر/قلعه)، کنار هر برج یا دروازه، موازی دیوار، با پاگردِ بالاش کنار برج. روی نقشه‌ی واقعی الان **۳۷ جا** هست (۱۰ رینگ بیرونی + ۲۷ شهر)؛ پیشنهاد: هر ~۶۰ متر یکی = **۱۶ تا** (۴ بیرونی + ۱۲ شهر).
- **رینگ داخلی پله نمی‌گیره** (دیوارش ۱۶ متره؛ پله‌ی ۹ متری کش بیاد پله‌ها ۳۹ سانت می‌شه). اگه خواستی اونم راه بره، یه مدل دوم «پله‌ی دوپاگردی ۱۶ متری» لازمه — الان نخواستم، فقط نوشتم.
- **کیپ:** تو کتابخونه فقط دو تا کیپ هست (`castle_keep_stone_1/2`)؛ شماره‌ی ۲ همین الان بلندترشه. بزرگ‌تر نداریم؛ حلقه رو هم دست نزدم. اگه کیپ بلندتر می‌خوای: مدل جدید (بخش ۴).
- هیچ‌چیز پله‌ای هنوز تو بازی کشیده نمی‌شه؛ مدل که اومد وصل‌کردنش ≈ ۱ ساعته (چک‌لیست بخش ۳).

---

## 1. Model spec — `castle_stairs_stone` (ask TR1 / the owner to make in Tripo)
One straight flight with a landing at the top, standing on the INNER side of a wall, running ALONG the wall. Real-world scale, units = metres, +Y up.

| item | value | why |
|---|---|---|
| **total rise** (ground → top landing floor) | **9.0 m** | the game scales it in Y only: outer ring wall-walk 9.5 m → ×1.056, town ring 8.2 m → ×0.911 (table 2) |
| steps | **41**, riser **0.22 m**, tread **0.30 m** (41 × 0.22 = 9.02, 41 × 0.30 = 12.3) | after Y-scaling the riser is 0.232 m (outer) / 0.200 m (town): inside 0.19 … 0.25 on every real site (§2) |
| flight run (horizontal) | **12.3 m** | |
| top landing | **2.0 m** long × full width, floor exactly at y = 9.0 | the hero steps from here onto the wall-walk |
| **footprint** | **2.0 m wide (X) × 14.3 m long (Z)** = 12.3 flight + 2.0 landing | the game reserves exactly this rectangle (`rect`) |
| clear tread width | **≥ 1.6 m** (side walls ≤ 0.2 m each) | one hero walks up; two cannot pass (not checked against the hero collider) |
| side walls | solid cheek walls, 0.2 m wide, following the steps (rising ≈ 0.9 m above each tread, 1.1 m round the landing), a plain top edge, **no railings, no ropes, no lamps, no flags** | the flight stands next to a 3 m thick wall; thin parts break at distance |
| underside | **solid stone down to y = 0** and a flat skirt 0.5 m BELOW y = 0 along both sides and the foot | the ground is not flat: the town ring's ground differs by up to ±0.36 m along a flight; the skirt hides the gap, nothing floats |
| orientation | **+Z = the FOOT end (lowest step)**, **−Z = the top landing end**, climbing toward −Z; the front face of the lowest step faces +Z | `ry` = yaw of +Z toward the foot (`anchors('stairs')`) |
| pivot | centre of the footprint at y = 0 (X = 0, Z = 0 at the middle of the 14.3 m) | `centre` |
| budget | **≤ 3,000 tris**, one material, 512 px texture (like the walls), Khronos-valid, `_lo` made by `workers/tools/lod_geo.mjs` (≈ 40 %) | 16 flights ⇒ ≤ 48 k tris hi (≈ 1.3 % of the 3.6 M strategic view); the stairs have their OWN texture ⇒ +1 draw call per castle LOD cell that holds one (≤ 5 cells: core + 4 town quadrants) per tier — not free |
| look | same stone / palette family as `castle_wall_<tier>`, the step edges readable (a lighter edge), weathered but crisp | |
| tiers | **ship ONE `castle_stairs_stone` for all levels first** (like the keep, D7). Later: `castle_stairs_<tier>` in the 9 wall tiers (wood, stone, iron, gold, diamond ice, green, red, black, blue) — same footprint | the game already picks a file by tier; it needs a table entry per file |

Tripo prompt idea (owner decides): «straight stone castle staircase, 41 steps, solid sides, flat landing at the top, no railing, side view, game asset, realistic stone, same style as the blue castle wall», then check the numbers above in the viewer (rise 9.0 / footprint 2.0 × 14.3) and scale in Blender/Tripo editor if the shape is right but the size is off — the game does NOT stretch X / Z, only Y.

## 2. Where it stands — the numbers of this map (`ctx.tr2c.anchors('stairs')`, measured on the real castle at level 30, terrain heights from `world.fastHeight`)
| ring | wall-walk height H (= total rise at the wall) | Y-scale | riser (nominal 0.22 × scale) | riser on the real ground (min … max) | sites (all / ≥ 60 m apart / ≥ 80 m apart) | at tower / gate / wall end |
|---|---|---|---|---|---|---|
| outer (T 4.2, visual wall 3.02 m) | **9.5 m** | ×1.056 | 0.232 | 0.231 … 0.233 | **10 / 4 / 3** | 10 / 0 / 0 |
| town (T 3.8, visual wall 2.74 m) | **8.2 m** | ×0.911 | 0.200 | 0.193 … 0.206 | **27 / 12 / 10** | 22 / 2 / 3 |
| inner (T 3.2) | 16 m | ×1.78 | **0.391 — too steep** | — | **0** | — |
Every site on the real map has a riser inside 0.19 … 0.25 (0 sites outside), so one model with a Y-scale is enough for the outer and town rings; the real total rise is 9.49 … 9.54 m (outer) and 7.91 … 8.45 m (town) because the ground at the wall is not at y = 0 (`riseReal` in the anchor list).
- **Position of a flight** (inner side): its centre line is INSIDE the wall's centre line by 2.81 m (outer: 1.51 m wall half-thickness + 0.3 m gap + 1.0 m half width) / 2.67 m (town: 1.37 + 0.3 + 1.0), it starts at a run END — beside a tower (its W × W footprint plus 0.3 m clear, found numerically) or a gate (0.8 m past the gate facade) — and runs along the wall away from the joint; the 2 m landing is the end next to the tower / gate, the foot is 14.3 m further along the wall.
- Overlaps: of the 37 sites, **7 touch a house-cluster box** (`outer:7a`, `outer:9a`, `town:43a`, `town:33a`, `town:35a`, `town:35b`, `town:38a`; the boxes are coarse: a cluster + 9 m) — the other 30 are free. With spacing 60 only `outer:7a` and `town:35b` of the 16 touch a house box. Props are not battle targets either: in the frames a small pavilion stands on `outer:10a` and a house roof touches the foot of `town:40b`. So the planner has to take `rect` as a keep-out for houses AND props (§3 step 4).
- What it does NOT give: access to the TOWER platforms (they stand 15 … 18 m high with the war machines; the stairs lead to the wall-walk only).

## 3. The anchor list (already in the kit: `castle_tr2.js`, tests in `dev/tr2_s3_test.js` → `TR2 S3 OK`)
`world.tr2c.anchors('stairs', opts)` — `opts`: `rings` (default `['outer','town']`), `ends` (`'both'` | `'a'` | `'b'`), `spacing` (m; greedy, 0 = every site; 60 ⇒ 16 flights on this map). `anchors()` with no argument is unchanged. `STAIRS` (exported constant) holds the spec numbers (key `castle_stairs`, rise 9.0, riser 0.22, tread 0.30, run 12.3, width 2.0, landing 2.0, gap 0.3). Each site:
```
{ id: 'town:40b', ring, at: 'tower'|'gate'|'wall', tid: <wall run target id>, joint: <tower / gate tid or null>,
  model: 'castle_stairs', key: 'castle_stairs_<tier>',
  centre: {x,z}   // where the model's pivot goes (middle of the footprint)
  ry              // yaw (rad) of the model's +Z = the foot end;  dir {x,z} = unit vector top -> foot
  foot  {x,z}     // front edge of the lowest step      top {x,z} = centre of the top landing
  join  {x,z}     // the wall-walk point the landing meets (on the wall's centre line)      inward {x,z} = unit, toward the ring centre
  rise (= ring H), scale {x:1, y: H/9.0, z:1}, width: 2.0, run: 12.3,
  rect {cx,cz,w:2.0,d:14.3,ry}     // keep-out footprint }
```
**Wiring when the model arrives (≈ 1 hour, `castle_tr2.js` + one `swap.json` entry):**
1. `swap.json`: add `castle_stairs_stone` (+ `_lo`); `fileOf('stairs', tier)` / `neededFiles` return it (one file for all tiers at first, then `castle_stairs_<tier>`).
2. In the bake: for every `anchors('stairs', { spacing: 60 })` site place the piece at `centre`, yaw `ry`, base y = ground at `foot`, Y-scale = `(ground(join) + rise − ground(foot)) / 9.0` (`riseReal / 9.0`; the dump `dev/tr2_s3_stairs_dump.py` computes it; skip a site whose riser leaves 0.19 … 0.25), and the 0.5 m skirt hides the slope. Tag the vertices with `aB = site.tid` (the wall run's target) so the flight falls with its wall (`destruct.js` / `a1_rings.js rescan` work unchanged).
3. Put the stairs into the LOD cell of the wall run (same cell key) so hi / lo switch together.
4. Keep-out: the planned town (houses, `b1` plan) must treat `rect` like a solid, or the wiring drops the sites whose `rect` hits a building (7 of 37 today). `dev/tr2_s3_stairs_dump.py` prints the overlap list.
5. Hero: inside `rect` the walkable height is `yFoot + rise · clamp(s / 12.3, 0, 1)` (s = distance from `foot` along −`dir`); the landing is flat; the step onto the wall-walk is at `join` (the inner parapet is only visual, like the gate facade — the hero clips through it). `rp.setClimb(true)` (RP1B) stays OFF until this exists — mother's switch.
6. Frames: a flight on the outer ring, one on the town ring beside a tower, one beside a gate, a destroyed wall with its stairs; `dev/tr2_budget.py` numbers; `TR2 S3 OK` + `GATE_W: ALL OK`.
Optional later: a **wall piece with a gap in the inner parapet** (`castle_wall_<tier>_stairs`) so the landing opens into the wall-walk without clipping — only if the owner dislikes the clipped parapet.

## 4. Other castle findings (this round)
- **Keep:** the library has exactly two keeps — `castle_keep_stone_1` (4 conical towers, 18,175 tris, height / width 0.79) and `castle_keep_stone_2` (dome + square towers, 17,946 tris, height / width 0.88). `_2` is already in use (D7) and is the taller one for the same width: at the 27 m the inner ring allows it is 23.7 m high (`_1` would be ≈ 21 m). **No bigger keep exists; the ring was not changed.** Looking at the frames again (`keep_a`, `keep_b`, `keep_over`): its roof stands 7.7 m above the inner wall-walk and ≈ 5 m above the inner towers' platforms (18.3 m), so it reads as a big building in the yard but not as a dominating keep. Only a NEW model fixes that: **`castle_keep_tall`** — same footprint (≤ 27 m, it must clear the 16 m inner wall slabs by 0.4 m as today), **height 32 … 36 m**, beacon platform on top, 9 tiers later. Optional, owner's call.
- **Inner ring stairs:** need a second model if wanted: a switchback («U») flight, rise 16 m (2 flights of 8 m, 36 steps of 0.22 each, 11 m run, landing 2 m between) = footprint ≈ 4.4 m × 13 m; only the two longest inner runs (≈ 20 … 22 m) could hold one. Not asked for now.
- **Lib patch:** the 11 gaps1 rows are already in `lib-tripo` `MANIFEST.json` / `LIB_INDEX.md` at commit `c186bbe` (11 of 11 present in both files and their GLBs are in the tree) ⇒ no `patch_TR2_S3_lib.tar.gz` needed.
