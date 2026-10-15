# report_TR2_S5 — the player arranges his own map (free layout)
Worker TR2-S5 · 15 Oct 2026 · base: kit `508723b` (p53 + gate tree 15 Oct 10:15) · `GATE_W: ALL OK`, noRoute **614** (limit 700, baseline 614) · `TR2 LAYOUT OK` · server port `PORT OK` + `FUZZ OK`.
Pushed as `TR2_S5` (client patch + frames + this report) and `TR2_S5_server` (spec only: `layout_api.md`, geometry / vectors / fuzz data, Python reference). **The server is the owner's; nothing server-side was written.**

## What the player gets
- A small **Arrange** button on the home map (bottom-left). Tap it: the game HUD steps aside, the editor takes the screen.
- **Tap a building** → yellow outline + green dots on the ground = the places where it fits (2 m grid, found 90 checks a frame). **Drag it** by its body: a ghost follows the finger (1 m snap), **green** "✓ It fits here" or **red** with the reason in words ("Another building is in the way", "On a street", "Too close to the moat", …). **Turn** buttons: 15° left / right.
- **Release** on a red spot: the building jumps to the nearest spot within 2 m that is valid (a finger is not a millimetre; a town this full turns 1 m of error into red). Then **✓ Place** commits, **✕ Cancel** drops it.
- **Drop it ON another building** → "⇄ Release to trade places": a swap (all or nothing; a swap of two rooms that only fit together is judged as a whole).
- ↶ Undo (one level), Default (this building back to its old place), Reset all (asks twice), Done. The layout is saved after every ✓ / undo / reset.
- Movable: every home (cottage / craftsman / merchant / noble), tavern, townhall, chapel, well, the production lots inside the walls (sawmill, mill, smokehouse, …) and the **six storehouses**. 85 things.

## Proven — with frames (software GL, 844×390 unless said; every frame viewed at full size)
| what | frame | note |
|---|---|---|
| house moved on the real map | `house_before` / `house_after` | cottage_11 (−85.6, 113.5) → (−80, 81): gone from the row, a new one stands on the empty grass |
| storehouse moved on the real map | `store_before` / `store_after` (+ `store_new_*` second camera) | store_wood (−77, −28) → (−147, −16), the wall side, 71 m; the hall, torches and glow pool all moved, nothing left behind |
| editor: pick, dots, ghost ok / red | `editor_selected_dots`, `editor_ghost_ok`, `editor_ghost_red` | green "It fits here"; red "Another building is in the way" |
| store picked / turned | `editor_store_selected`, `editor_store_turn` | |
| other screens | `editor_800x360`, `editor_932x430` | buttons do not overlap at any of the three |
| **real pointer events** (Playwright mouse, not code) | `drag_ghost`, `drag_placed`, `drag_swap_hover`, `drag_swapped` | `POINTER OK`: Arrange click → HUD out of the way → tap picks `cottage_03` → drag → ghost green at the finger → ✓ Place (layout count 1, house at the new place) → ↶ Undo (count 0) → drag onto a neighbouring cottage "⇄ Release to trade places" → the two swapped (count 2, A and B exchanged coordinates) → Done → HUD back |
| Telegram full-screen insets | `hud_tg`, `editor_tg` | simulated `--tg-safe-area-inset-*` / `--tg-content-safe-area-inset-*`: all editor buttons move in from the edges |

Two **real bugs found only by the pointer test** and fixed: (1) a tap on a cottage picked the chapel (30 m tall box in front) — now the box whose centre is nearest the finger wins; (2) "dropped on another building" fired for any box under the finger — now it means the ghost's centre is inside the other building's footprint.

## Proven — in node (no browser)
- `bash dev/tr2_layout_test.sh` → `TR2 LAYOUT OK`: 200 random moves (valid ones accepted, invalid refused, both planners — town plan and generics — agree), swap / undo / reset, the record round trip (≤ 8 KB, canonical load: one of two clashing poses is dropped, a valid swap survives whole), the **defender's layout in an attack** (`target.layout` shown, own layout restored after), battle sim with a moved layout, rate-limit retry, **a mock of the server round trip**.
- `bash dev/tr2_s5_vectors.sh` writes the server data; `python3 workers/docs/tr2_s5_ref_rules.py` → `PORT OK` (39 vectors) + `FUZZ OK` (2500 random poses): a Python port of the 12 rules gives the client's answer on every one. The server model (1 m height grid, `hTol` 0.25) accepted **600 / 600** client-valid poses.
- `bash dev/gate_w.sh` → `GATE_W: ALL OK`, noRoute 614 (< 700), `t1_test` main.js changed lines 11 (limit 60).

## Perf — kit vs mine (home map lv 30, software GL — NOT a phone number)
| view | draw calls kit → mine | tris kit → mine | programs |
|---|---|---|---|
| strategic (default cam) | 513 → 516 (**+3**) | 3.641 M → 3.617 M (−0.7 %) | 161 = 161 |
| house cam | 269 → 277 (**+8**, +3 %) | −0.06 % | 161 = 161 |
| store cam | 315 → 323 (**+8**, +2.5 %) | −0.18 % | 161 = 161 |

Moving things does **not** change the call count (276 / 322 after two moves). The +8 comes from the six storehouses now being **their own mesh group** (≈ 11 materials) so they can move; the net rule «≤ 0 calls» is therefore **not met** (same as S3: stated, not hidden). A way back to ≤ 0: draw the stores into the main Batcher while no store has been moved and split only on the first move — not done (it touches ST1's file).
Programs stay 161 because the editor's 3D bits (ghost, outline, dots) are built on first Arrange (three's `compileAsync` would otherwise compile invisible objects: +7 programs).
Re-plan after a move runs one stage a frame: plan → stores → targets → town → worksites → life → picks → notify. Largest slice **8.2 ms** in the container (the store redraw was 42 ms before it was cached + sliced).

## Rules (one function, three users: editor, tests, server port)
12 codes: WALL 6.5 · MOAT (14.2 + pad; stores 0) · GATE 14 + half-diagonal · MARKET gap 2 · VAULT gap 3 · OVERLAP gap 0.8 (full footprint, SAT) · STREET 0.9 (stores 0) · RIVER 8 / 7.4 mill + smokehouse / 10 store · WATER (smokehouse near the river) · STREAM 3 · DRY ≥ 0.1 · SLOPE spread ≤ 1.0. Everything is judged at the **rounded** numbers that are stored. Full table, footprints, endpoints and canonical load: `layout_api.md`.

## Defaults I chose (owner may change by number — see the sheet)
- Scope = buildings + **storehouses + production lots** (option 2 below). Walls / gates / gem mines / outer worksites / gem vaults / defences are **not** movable this round (level pads baked into the terrain — `terrain.js` / `roads.js` are GR1's; vaults ST1's).
- Generic filler houses **yield** (are not drawn) under any moved building, because a dense town has almost no free ground — with Tripo loaded. Without Tripo (old generator) they stay and block (rule GEN, client only).
- Snap 1 m, turn 15°, one undo level, 2 m release-magnet, swap by dropping on a building.
- Attack = the **defender's** layout: `military.player_target` should add `"layout": victim.get("layout")`; the client reads `target.layout` (bots send none = default town). The attacker's own arrangement never leaks into the fight.
- No layout on the server yet → the client keeps it in localStorage; the editor works the same. 429 'rate' (5 accepted POSTs in 5 s) is retried, the record is kept.

## NOT proven / known gaps (plain)
- **Phone**: no phone run; all numbers are software GL.
- **Real server**: only a mock round trip; the real endpoints do not exist yet.
- Telegram insets are **simulated** (CSS variables set by hand), not a real Telegram WebView.
- The ghost is a footprint + volume box with a front arrow, **not the model** (a live model ghost would cost programs / calls).
- The swap frame swaps two cottages (same model): the numbers prove it, the picture only shows two houses in two spots. A cottage ↔ townhall swap frame was not made.
- The hero / nav consumption of moved solids (walkability around a moved building) is tested in node only; no browser walk was made.
- A **mill moved on or off the river** may flip its water / wind variant (not looked at).
- The `baseMeta` deploy-zone cache is **not recomputed** after a move (the attack deploy zone keeps the default shape).
- The town is dense: free cottage places are few (8–11 green dots around a cottage), so **swap is the main interaction**; a larger free map area would need GR1's ground.
- Walls (D4 option C) not done. "Reset all" confirms with a second tap, no dialog.
- The Telegram back button / swipe-away while the editor is open was not tried.

## Shared-file lines (all marked `// TR2-S5:`)
`town_plan.js` +20 −6 · `stores.js` +55 −10 · `b1_layout.js` +2 −2 · `town.js` +1 −1 · `town_build.js` +31 −6 · `world.js` +10 −6 · `wslife.js` +13 −1 · `main.js` +11 (limit 60) · `battle.js` +2. New: `layout_store.js` (50), `layout_rules.js` (187), `layout_live.js` (135), `layout_ui.js` (254), `layout_sync.js` (37). Not touched: `web/app/*`, `pkg/`, `dev/gate*.sh`, server `*.py`, `terrain.js`, `roads.js`, hero, army. Merge notes + rollback: `APPLY_TR2_S5.md` (ST1 merges first and keeps `STORE_FP`; GR1 before this, re-run the vectors).

## Needs Tripo
Nothing. No new model, no key.

## One numbered sheet for the owner (I keep working on 2 until you answer)
**What may the player move?** ۱) only buildings (homes, tavern, townhall, chapel, well) · ۲) **+ storehouses + production lots — done, default** · ۳) + hand-drawn roads (needs GR1's ground; not started)
**Ghost look?** ۱) footprint + box (now) · ۲) the real model, half transparent (more programs; I would measure first)
