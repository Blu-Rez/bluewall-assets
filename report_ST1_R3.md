# ST1_R3 — storage yards: black poles, white heaps, lamps, court edge (QA1 list, 44 items)

Kit: branch `kit`, HEAD 15765c7 (ST1_R2 already in). Patch `patch_ST1_R3.tar.gz`: owned `storeyards.js`; shared diff = **4 lines**, every one marked `// ST1_R3:` — `world.js` ×3 (`ctx.torch`: the post's foot `o.gy`, default = terrain height as before), `tr2_s4c.js` ×1 (`lamp()`: `o.only` = one fixed model). Nothing else outside `storeyards.js`. +0 shader programs, +0 draw calls (no new material, no new mesh kind; every piece replaced 1:1), gate noRoute 647 (< 700).

**خلاصه برای وینگلس (فارسی):** میله‌های سیاه غول‌پیکر = همان میله‌ی پرچم حیاط‌ها بود؛ حالا چوب قهوه‌ای، پایه‌ی ضخیم روی سکوی سنگی، ۶ متر (قبلاً ۷٫۶)، پرچم پایین‌تر. تلّ سنگ دیگر مکعب یخی نیست (بلوک سنگ خاکستری)، بشکه‌های نفت چوب‌دار با حلقه و درپوش، شمش‌های طلا طلایی (نه نارنجی)، لبه‌ی حیاط سنگفرش خاکستری گرم (نه تخته‌ی یخیِ آبی/لیلکی)، فانوس‌ها روی پایه ایستاده‌اند و منقل‌های سیاهِ مچاله از حیاط‌ها رفته‌اند، حوضچه‌ی گنجینه‌ها مرمر کِرِم با حلقه و ستونک‌های طلایی. از ۴۴ مورد: ۱۷ درست شد، ۹ (پیکسل سیاه غروب) اندازه‌گیری و بسته شد، ۶ بهتر شد ولی کامل نیست، ۴ بدونِ مدل Tripo حل نمی‌شود، ۸ مالِ ST1 نیست (علت و مالک پایین نوشته شد).

## What changed (all in `storeyards.js` unless noted)
- **Banner poles (QA1-018/019/023/033)** — `banners()`: the 18 black sticks were 7.6 m × 15 cm of the dark `wood` material × tint 0x4a3524 = black on the quarter atlas. Now per side: stone footing (unskinned `stoneLight`), a thick tapered timber foot (r 0.2–0.3, 1.5 m), an iron band, a 6.1 m pole in the light-timber material with a brown tint, a round finial, a cross-arm and the pennant hung **lower** (3.15–5.55 m over the plinth; it was centred at ~6.1 m / 7 m). Pole top = 6.1 m over the plinth (test: ≤ 6.5 m), every look (1, 2, 3).
- **Stone heap (020/021/022, also 130's look)** — the heap was tagged to the *diamond* tier (`HEAP_BASE.stone` 16, oil 8 → ice-white, 200–230 RGB, glows at dusk); now the stone tier (`HEAP_BASE.stone` 4, `oil` 4). The court tiers `RES.pt` 4 (stone, iron, ruby, emerald, turq) / 3 (oil) → 1 (grey stone). the stone tier's texture is very dark (~0.2 linear), so the blocks carry a **linear** multiplier tint (`tintLinear`, values > 1, per-block variation + rubble chip) → grey hewn blocks with mortar, they dim at dusk and night like the town. Test: every stone body piece has a linear multiplier ≥ 1 (a plain sRGB tint < 1 makes this stone black — that was my first r3 build).
- **Oil drums (030)** — stone-tier cylinders with rust tints, two iron hoops, lid, bung (staves read from the stone texture): brown barrels instead of pale blue paper cups. `EMBLEM.oil` / `EMBLEM.iron` recoloured (QA1-125 / 033 black cut-out on the roof ridge): orange drop + steel-blue anvil.
- **Gold bars (096/097)** — neutral (white / light grey) tint on the already-gold material: the first try used a gold tint and went orange.
- **Court edge / plinth / paving (025/095/106/109-style)** — the plinth, court slab and steps were blue-tinted diamond-tier stone (0xc2c7d2 …: "ice rink", lilac sheet, a white lip at dusk). Grey-stone yards now use the *unskinned* `stoneLight` with warm-grey **linear** tints (the first r3c build was charcoal: the map is dark and the courts are often in the hall's shadow); timber / gold / food yards keep their own tier skin. No white lip at dusk (checked, S08).
- **Lamps / braziers (024/026/027/101)** — the door lanterns hung in mid-air because `ctx.torch` built the post from the *terrain* height while the yard stands on a raised pad. Now the post stands on the court / plinth top (`o.gy`) and the model is the lantern post only (`o.only`), never the crumpled fire basket; the old basket-brazier props are gone from the yards. The moved-yard path (TR2-S5) passes the same `o.gy`, so default and moved yards look the same.
- **Vault basins (102/103/104/105)** — basin bowl in the gold tier = cream marble with a real gold ring and gold bollards (were white-blue plastic).

## 44 items (QA1_TRIAGE.md «ST1»), re-checked with the QA1 tools (`qa1_walk` stations 6–15 + 24 + 29, day 12.5 / dusk 18.3 / night 23, and S01 night)
Legend: **FIXED** (seen in the after frame) · **CLOSED** (measured) · **PARTLY** · **NEEDS TRIPO / OWNER SHEET** · **NOT ST1** (owner named).
| ID | result | note |
|---|---|---|
| 012 | NOT ST1 → world.js / castle | gate torch PointLight (`world.js:165`, 120 cd, 1.5 m from a white `stoneLight 0xffffff` tower). Experiment (`dev/st1r3_gate_lights.py`, S01 night, light scale ×1 / ×0.5 / ×0.3 / ×0.15): tower-face mean RGB 181 / 161 / 142 / 116, grass 101,74,34 → 56,56,29; the stone facets stay bright because the albedo is white. Suggest ×0.3–0.4 and/or tower tint ≤ 0xd8d8d8. **Not changed** (the owner tuned these numbers on 15 Oct). |
| 018 019 023 033 | FIXED | poles brown, 6.1 m, thick foot, pennant lower, no black block on top (S06/S08/S12 first + third, day/dusk/night) |
| 020 021 022 | FIXED | stone blocks; dusk/night frames are dim like the yard (not paper-white) |
| 024 026 101 | FIXED | lanterns stand on posts on the court at every yard; no black cage in the yards |
| 025 095 106 | FIXED | grey flagstone with mortar, steps with joints, no pale-blue slab, no white strip at dusk |
| 030 | FIXED | brown staved drums with hoops + lids (S10 day/dusk/night) |
| 102 103 | FIXED (basin, bollards, plinth) | cream marble bowl + gold ring + gold bollards; the red hall's jelly gloss is the Tripo hall model (not changed) |
| 125 | FIXED | the black pointed cap on the dark building at S24 (bridge01) was the oil store's drop emblem: now red-orange (S24 + S10 strat frames) |
| 070–078 | CLOSED | pure-black pixels below the sky band, dusk: before (kit state now) sum 1.13 % over the nine frames, after 0.53 %; every one < 0.5 % already (the QA1 values 0.5–1.2 % were before ST1_R2). `dev/st1r3_black.py` |
| 027 | PARTLY | the black unlit cages are gone; the lanterns burn in the data (flame at 3.36 m, glow pool, uNight 1) but the flame sprite sits inside the opaque lantern glass and the pool is faint (known pool shader, see ST1_R2 note 3): at dusk/night the lanterns do **not** visibly glow. Needs the S4C lamp model / fx.js owner. |
| 093 | PARTLY | logs follow the light now: dusk log/grass luminance 1.85 → 1.28 (day 1.33 → 0.91, beige → brown) |
| 096 | PARTLY | bars are gold, not orange/yellow plastic; still flat boxes (a Tripo bar model would give bevel and sheen) |
| 097 | PARTLY | dusk/night: bars are still the brightest thing in the yard (shared `M.gold`, env reflection; not changed) |
| 104 105 | PARTLY | basin/plinth no longer pale blue; the three vault courts are still one court model (hall differs by colour only); the turquoise gem still overlaps the basin rim (gem placement is `vault.js`) |
| 092 094 | NEEDS TRIPO | logs: the wood tier's shader seam pattern stamps a chevron on cylinders; no hand-made fix without a Tripo log pile. Night logs stay blue-grey like everything at night. (the cart is `wslife.js`, AN1) |
| 098 099 | NEEDS TRIPO | oil hall facets + food hall arch UVs are the Tripo hall models' own texture / UV (not hand-edited by rule) |
| 034 | NOT ST1 → RP1C | the dark-blue badge ≈ 1 m from the eye = the door icon (`web/assets/rpg/doors.js`) |
| 036 109 108 107 | NOT ST1 → TR2 (worksites) | **identified (`dev/st1r3_probe.py`, ray-cast down at the S15 hero spot): the lilac slab is `ws:mint_00:soup` (197 tris, colour 0.16,0.19,0.24 linear) = the Mint worksite pad, with grass blades through it (GR1 grass mask); the beige 2.5 m box is `ws:mint_00:c3:flatDS`; the black cage on a pole is the worksite's own torch. None is a storage yard.** |
| 091 | NOT ST1 → fx.js / controls.js | flame sprite at the strategic camera next to a tower |
| 130 | NOT ST1 → TR2 | quarry blocks (`ws_tr2.js` / `worksites.js`): still pale blue-white cubes in S29 |

Counts: FIXED 17 (018 019 020 021 022 023 024 025 026 030 033 095 101 102 103 106 125) · CLOSED 9 (070–078) · PARTLY 6 (027 093 096 097 104 105) · NEEDS TRIPO 4 (092 094 098 099) · NOT ST1 8 (012 034 036 091 107 108 109 130) = 44.

Seen but **not in the list**: the oil yard's left prop is the Tripo `oil_tanks_pack/tank_brick` (grey / olive with black bands in the atlas — a brick tank should be brick-red): looks like an atlas colour problem, same before and after.

## Budgets (before = kit state, after = ST1_R3; same page, hour 12, software GL)
`st1r2_shots.py` (map, quarter, 3 vault close-ups, 3 mine close-ups; day hour 12, `?q=low`, 844×390), same page, one browser job at a time, before = the kit state (`dev/app_base`), after = `dev/app_r3`:

| view | draw calls | triangles | programs |
|---|---|---|---|
| map | 516 → **504** | 3 317 852 → 3 273 982 | 161 → 161 |
| quarter | 459 → **457** | 2 604 855 → 2 575 869 | 161 → 161 |
| vault_ruby | 380 → 380 | 2 479 137 → 2 485 135 | 161 → 161 |
| vault_emerald | 270 → **268** | 1 678 627 → 1 693 277 | 161 → 161 |
| vault_turq | 408 → 408 | 2 490 845 → 2 496 843 | 161 → 161 |
| mine_ruby | 163 → 163 | 748 828 → 754 342 | 161 → 161 |
| mine_emerald | 167 → 167 | 872 253 → 877 767 | 161 → 161 |
| mine_turq | 163 → 163 | 753 316 → 758 830 | 161 → 161 |

**+0 programs, draw calls equal or lower in all 8 views.** Triangles: the three mine views (nothing of the yards in them) all show exactly +5 514 — the quarter's static batch is ONE mesh counted whole in every view, so +5.5 k tris (≈ +0.2 % of the 2.6 M frame) is what the new pole feet / bands / finials, drum hoops and lids and rubble chips cost in total; the map / quarter differences (−44 k / −29 k) are the free camera's lazy streaming, not the code. Not re-run for noise (one run each).

## Tests
- `bash dev/gate_w.sh` → **GATE_W: ALL OK** (noRoute 647 < 700) on the final code.
- `bash dev/st1r3_test.sh` → **ST1R3 OK** (126 checks: poles ≤ 6.5 m + foot + lower pennant for all 9 yards × looks 1–3; lamps on the court top with `o.only`; heaps in the stone tier with linear multipliers; no diamond plinth; `RES.pt ≤ 3`; shared lines marked; no new material / program; the atlas piece list is unchanged). `st1_test.sh` ST1 OK, `st1r2_test.sh` ST1R2 OK, `BT1_LEVELS=30 bash dev/bt1_test.sh` → **BT1 OK** (LV 30: 119 groups, differing outside the battle layers 0, targets 130, lost 0, no sim building 0; ran alone, no browser job in parallel; the yard-pole / heap / court changes are static-batch pieces, so the home / attack layer split is untouched).

## Frames (full size 844×390, headless SwiftShader — NOT a phone)
`photos_ST1_R3.tar.gz`: `sheets/ST1_R3_{poles,heaps,lamps,court,strat}_{day,dusk,night}.jpg` (each row = BEFORE | AFTER, nothing scaled), `before_{day,dusk,night}/` and `after_{day,dusk,night}/` (stations 6–15, strat / third / first; night also S01), `extra_after_day/` (S24, S29), `gatelights/` (S01 night, 4 light scales), `probe/st1r3_probe.txt`. Hours: day 12.5, dusk 18.3, night 23. Seen at full size by me: all of them (the sheets and the single frames of S06–S15 day / dusk / night, S24, S29, S01 night + the 4 light scales).

## NOT proven / for others
- Software GL, ~1 fps, no ms numbers: how it feels on a phone is not proven. Dawn not checked. The attack map (BT1 checks structure only) not checked.
- Court tints are chosen on software-GL frames: paving mean RGB 103–163 of 255 in the day frames (S07 / S08 / S09 / S11: 103–130 / 136–149 / 125–138 / 158–163; S07 is in the hall's shadow). The first try was charcoal (40–50) — fixed before these frames.
- Logs, oil/food hall textures, the gem overlap, the identical vault courts and the lantern night glow are open (table above) — each needs a Tripo model / an owner sheet number or another owner's file.
- `web/app/wall.js` is rebuilt by the gate locally and is NOT in the patch.
- New in the patch `dev/`: `st1r3_test.js/.sh`, `st1r3_sheet.py`, `st1r3_probe.py`, `st1r3_gate_lights.py`, `st1r3_black.py`, `qa1_walk_r3.py` (walk on a named bundle), `st1r3_chain3.sh`. `st1r3_test.sh` is not in `gate_w.sh` (workers must not edit gate scripts) — mother: please add it next to `st1r2_test.sh`.
