# MERGE-4 report — E1 + U1–U4 (+ U5 code) → package p43 (7 Oct 2026, merge chat)

**State (7 Oct 2026):** p43 = `bluewall_devkit_v4` (= p41) + p42 (installed + committed in this chat) + E1 / U1–U4. Package `bluebot_bluewall_p43.tar.gz` built, `PKGCHECK: OK` (numbers in the final block below). **Not installed yet; `mkpkg.sh --commit bluebot_bluewall_p43` runs only after the owner says «۴۳ نصب شد».** Nothing was pushed to git.
Install line: `cd /root && rm -rf bluebot_bluewall_p43 && tar xzf bluebot_bluewall_p43.tar.gz && bash bluebot_bluewall_p43/install.sh`

## Patch verdicts
| patch | verdict | what went in / why |
|---|---|---|
| E1 economy table | ✅ docs only | `docs/economy_table_fa.md` (23 rows, 31 kinds) + `docs/economy_table.json` + `dev/e1_*`; `E1 OK`. Nothing wired. 5 open questions with defaults + the `in/out` shape (see `WIRING_TODO.md`). |
| U1 legionary + captain | ✅ merged | KayKit Knight (CC0) and Viking lowpoly (CC-BY) + a code-made banner prop; chibi look, terracotta shield. |
| U2 ogre + treant | ⚠ changed | the owner called U2's ogre / treant ugly → **ogre = Behemoth** (his pick #2 of the U2 sheet), **treant = old look** until he brings a model. U2's treant / crown / story removed. |
| U3 lich + dark rider | ✅ merged | KayKit Skeleton Rogue + staff (CC0); Low Poly Dragon + Dark Knight (CC-BY). |
| U4 gryphon | ⚠ gryphon only | Twqero gryphon-simple (CC-BY). Gryphon knight NOT built (no real gryphon-rider exists; owner decision). |
| U5 three-head dragons | ⚠ code in, assets held out | King Ghidorah is a Toho character: decision pending. `U5_ON = false` in `u5_looks.js` → baby3 / dragon3 keep the old three-head prowler, no 404 for the missing glb. Re-apply recipe: `MERGE5_prompt.md` item 4. |
No patch touched secrets / `web/app/*` / `pkg/` / `dev/gate*.sh` / server `*.py` (file-list scan of every patch). The U5 `dev/u5_fetch_*.sh` helpers read `SF_TOKEN` from the environment; they are not shipped.

## What the player SEES / does NOT see
- **Sees (battle):** legionary, captain, ogre, lich, dark rider, gryphon on real rigged models in the instanced crowd; new portraits + squad emblems for those six; the ogre swings its club overhead and the slam lands on the sim's damage moment.
- **Does not see:** gryphon knight, treant, baby3 / dragon3 (all old looks); the unit story texts (no UI reads `u*_story.json`); the new line icons in the army list; any economy number; the 10 new worksite kinds (p42).
- The ogre has ONE clip (an attack): standing / marching = the first pose of that clip, held (the unit slides); death = tumble. A model with idle / walk / death clips is the real fix.

## Verified myself (software GL; same cameras / scripts as p42)
- **Gate:** `bash dev/gate_w.sh` on the final tree → every line OK incl. `E1 OK`, `M43 OK` (new static check: U1–U4 glb files / ≤ 600 KB each / credits for every model / stories fa+en without «bot» / `u2_ogre` in LATE / no `.rej`), `C1–C4 OK`, `A1/A2/B1/B2/B3/P41 OK`, ws_test, battle sim 0 wall crossings, **noRoute 622 (< 700)** → `GATE_W: ALL OK` (1 m 44 s).
- **Real in-game battle pictures** (`dev/m43_units.py`, lv 30, q=low, 390×844 and 1100×620, I opened each at full size): ogre idle (both widths), march, attack (club on the tower, dust; phone + wide), death (tumble + dust; phone), treant (old look) idle / move / attack / death; earlier merged-tree run `m43_a_*`: idle of legionary, captain, lich, dark rider, gryphon, baby3, dragon3, ogre, treant. Console: no page error, no warning (`LOGS []`).
  **Colour note:** the dev game boots at forge level 30 = tier 5 (crystal): every unit looks pale / icy in these battle shots; the model's own colours are in the lab shots (`work/m43/ogre_lab_*.png`, brown hide, black spiked club).
- **Shader programs, home, Q=high, lv 30** (`p39_progs.py 30`): p42 204 → p43 **203** (meshes 1 023 → 1 021, materials 550 → 548).
- **ATTACK, Q=high, same script, same seed (`pf_battle_progs.py`, `NOBLOOM=1`, `SEED 777`):**
  - default army: **203 → 247 (+44)** (p42: 204 → 254, +50), **most in ONE task 2** (p42: 3), 27 tasks that link, first battle frame 324 calls / 2.76 M tris;
  - army with every new kind (legionary 8, captain 1, ogre 3, treant 3, lich 4, dark rider 1, gryphon 3, baby3 2, dragon3 1, spear 8, archer 6; new `ARMY` env of the script): **203 → 234 (+31)**, most in one task 3 (one task), first frame 319 calls / 2.38 M tris.
  Both runs used a bundle from before the `U5_ON` flag: they show one harmless `404 /assets/u5_dragon3.glb`; the shipped bundle does not ask for it (the later `pf_battle_gate` run uses it).
- **Ogre kind** (lab, real crowd path, `dev/m43_ogre_stats.py`): 4 draw calls (4 materials), 6 005 tris per instance (budget 6 k), +0 programs (2 in the lab = ground + crowd); asset 436 KB (436 144 B). Old ogre: 1 skinned mesh + club props (not re-measured).
- **Bundle** (`web/app/wall.js`, gzip -9): 1 047 046 → **1 060 941 B (+13.9 KB)** for all six looks + portraits + glyphs (workers' budget was +15 KB each). New glbs **1 975 524 B** in total (U1 743 KB, U2 436 KB, U3 696 KB, U4 101 KB; decimal KB); U5's 482 KB is not in.
- **Home draw calls / tris** (`p38_perf.py perf 30`, q=low, with worksites; p42 → p43): top 474 / 3.058 M → 477 / 3.078 M · ctr 447 / 2.591 M → 445 / 2.609 M · town 457 / 2.546 M → 456 / 2.542 M · fields 514 / 3.304 M → 495 / 3.320 M · lake 261 / 1.473 M → 272 / 1.515 M. Without worksites: 394 / 372 / 371 / 440 / 173 → 394 / 370 / 370 / 440 / 173 calls. → no measurable change (n = 3 animated frames; the p42 numbers are from the previous chat's run, not re-measured on a clean p42 tree here — the clean-p42 baseline chain was interrupted, so every "p42 →" figure in this report is that chat's report).
- **PF gate, final bundle (`U5_ON` flag in), Q=low:** `pf_battle_gate.py` → **`PF OK`**: programs 166 → 208 (+42; p42 167 → 215, +48), most in one task 3 (p42: 2), back home 208 → 166, no console error, no 404; one `battle-ready` + one `gate-home` report (2 bodies, 2 947 / 467 chars). Not run here at Q=high (the attack runs above are the Q=high numbers); `p39_gate.py`, `ring_test`, `rules_test`, `bsw.sh` ran inside `gate_w.sh` (rules / ring / bsw) — `p39_gate.py` was **not** run separately.
- **Final gate on the shipped tree:** `bash dev/gate_w.sh` → `GATE_W: ALL OK` (noRoute 622) after the last source edit (`U5_ON`).
- **Package:** `mkpkg.sh` → 31 files, 2.8 MB (2 912 551 B), sha256 starts 53f15447; `pkgcheck.sh` → **`PKGCHECK: OK`** (32 entries incl. BUILD, 5.2 MB unpacked; its only warnings are the expected `https://` strings in credits / comments). File list: 8 `client/src` (assets, bunits, bunits_fly, bunits_ground, portraits, squadicon + new u1–u5 looks, u2_glyphs), 2 `docs/economy_*`, `web/app/wall.js`, `credits.json` + `credits_u1–u4.json`, 8 glbs (u1 ×2, u2, u3 ×4, u4), 3 story json; no `.py`, no `u5_*` asset.

## NOT proven
- Anything on a phone: frame time, real compile cost, real fps in a battle.
- Forge tiers 0–4 of the new units in a **real battle** (only tier 5 was shot there; lab shots cover other tiers for U1 / U5 in the workers' sheets).
- A hit frame of the captain (no hit clip) and a hit frame of the ogre; a natural (non-forced) death of the new units — deaths were triggered through the real `die` event with the loop paused (`KILL` helper, same as the workers).
- The ogre slam landing exactly on the damage moment is computed from clip time (contact 1.95 s, `atkOff 1.55 / atkSp 1.6` → 0.25 s) and seen in one wide + one phone frame; not measured frame by frame.
- Full `dev/gate.sh`, the server tests, the installer sandbox (`instest`) — need the private code.

## Pitfalls hit in this chat
See `MERGE5_prompt.md` → "Pitfalls hit in MERGE-4" (patch collisions + `.rej`, huge single-line files, getBounds, tier-5 tint, browser run times, the `ARMY` env, hash-prefixed uploads).

## Open (owner / next merge)
`MERGE5_prompt.md` ("Open — needs the owner's answer first" and "next packages") and `WIRING_TODO.md` → "Open after p43".
