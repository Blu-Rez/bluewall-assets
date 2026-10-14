# p33 progress (5 Oct 2026) — what was done and HOW it was verified
(written as the round goes; final section "proven / not proven / not done" is at the end)

## Block N (owner 08:23)
| id | what | state | verified how |
|---|---|---|---|
| N1 | tiny bead under each soldier orb removed | ✅ | before/after HUD image (`s33/n1_cmp.png`), orbs pixel-identical |
| N8 | health bars thinner (11 → 7 px, same width / anchor / colours) | ✅ | same image, real battle |
| N7 | axe rider: axe in the RIGHT hand, on the shoulder, chops in attack | ✅ | rider lab sheet `s33/n7_sheet.png`; real battle: rider part plays `AxeShoulder` idle/run and `AxeStrike` in the fight (read from the live view parts, `ax5.out`); battle camera is top-down so only the shoulder pose is visible from it |
| N4/N5 | attack dragon + baby = the HOME dragon (same model, grey-skin × tint recipe, rim light, real wing-beat) in aged RED | ✅ | live battle shots next to each other (`dr1_*`, tint test sheets `dr2/dr3`): chosen dragon tint 0xd92e20, baby 0xe23a28, rim red-orange; foe guardians stay charcoal. Code: `bdragon_live.js` (one skinned mesh per dragon, shared materials/geometry; falls back to the baked crowd if it throws) |
| N3 | portraits of giant, hill giant, dragon, baby | ✅ | giants: real-game shots re-framed head-and-shoulders (`dev/s32/port/cfg3.json`, new `sx` shift in `drive.py`); dragons: lab render of the live model in a rearing pose (`dev/s33/drg_port.js`); the other 17 busts untouched (byte-identical); checked at 72 px in the real HUD (`s33/hudB_bar.png`) |
| N2 | ability buttons (Shield Wall / Rally Charge) | ✅ | emblems rendered from the game's own 3D assets (`dev/s33/abil_lab.js`: shield_heater.glb repainted navy/steel, banner cloth on a lance), baked to 120 px WebP in `abilart.js`; glass orb bowl + rim like the unit orbs; position/size/wedge/countdown/pulse/off/label unchanged; seen in the real battle and in the DOM HUD lab (`dev/s33/hud_lab.js`: the REAL `createHUD`, no 3D) |
| N6 | colour jump / noise in attack | 🟡 cause PROVEN for thunder weather, fixed; rest not provable | see below |

### N6 evidence (real battle, headless, same camera)
* Render path: the bloom composer path is +10 % brighter than the direct path (lum 84.5 vs 93.1) — but the battle always runs at a fixed hour (`BATTLE_HOUR`), so the path does NOT switch inside an attack (it can only differ between home at night and the attack: hidden behind the loading screen).
* Lightning flash: `exposureMul = 1 + flash*0.5` and `flash` flickers at 14 Hz (`sin(t*90)`): exposure ×1.25 → lum +13 %, ×1.5 → +25 % (83.1 → 103.9). In rain / thunder / storm weather (battle weather mode is `auto`) the whole attack picture jumps and flickers. **Fix (battle only):** `exposureMul(calm)` = 1 + `flashSoft`·0.05 (a 5 % swell, no 14 Hz flicker); home keeps its flashes.
* Frame-to-frame luminance in a clear-weather fight (66 frames, 49 sim-s): median Δ 0.5, p95 2.4, max 3.5 (of ~80) → no hidden jump from FX / units; no render-path, exposure or DPR change during it.
* NOT provable here: his phone's dynamic-resolution / thermal governor behaviour, anything that needs his recording. Dev tools added (dev only, `opts.dev`): `window.__bwPath='c'|'d'`, `window.__bwLumOn=true` → `window.__bwLum[]`.

## Ability emblems (owner 12:55–13:12)
- Rejected: 3D stills (p32), flat SVG (shield+3 shields / lance+pennant), spell-orb style with busy glyphs (6 variants). Brief that worked (13:07): **minimal, beautiful, high quality**.
- Shipped (his pick 13:12): Shield Wall = solid minimal shield (two-tone per-pale), Rally Charge = thin-line pennant. Same steel rim + deep-navy disc as the spell orbs (`spellart.js abilOrb`). No text under the buttons. Verified on the real HUD (ready / cooldown + seconds / off) at 390×844.
- He said the flag "is not pretty": offer a refinement in p34 only if he asks.

## R5 nav spike (measured, headless, 4 battles of the owner's full army)
- Before: slowest route 27–37 ms (3 plans per step allowed → 78 ms steps), mean 2.2 ms, 1550 plans.  The slow ones were all failed searches: direct A* hits its 3500-node cap, then 1–2 bridge legs that can never succeed expand 6000 nodes each (15 500 nodes ≈ 30 ms).
- Fix: dry-region labelling of the 2.5 m grid (bridges not counted; done once in the last loading-screen warm slice), bridge candidates filtered to the ones that really link start-region and goal-region, flat A* neighbour tables, A* node counter; the sim spends a deterministic **node budget** (4000, +24 000/s) instead of "3 plans per step".
- After (same 1550 plans replayed): slowest 5.3 ms, p99 3.3 ms, total 992 ms vs 2885 ms; paths identical in 1518 / 1550, the other 32 are equal or shorter (total length ratio 0.9966, worst +0.2 %).

## R3 balance (final p33 numbers; `dev/s32/search/*.txt`, matrix L20 × 4 base profiles, 1 seed; R7 = owner full army, 8 seeds)
Final defaults in `battlesim.js TUNE` (everything else unchanged): `prefer=1` (attacker AI by `prefer`), `hunt=40` (reserve + heavy guards chase siege), ballista `w 4.2 · air ×6.5 · heavy ×3.2 · HP ×2`, wizard `air ×1.8 · weight .65 · HP ×1.5`, attacker siege range `×0.85`, siege damage to buildings `×1.2` (was 2.0 flat). Guard sorties (`hall`), counter-battery (`cb`), gun range (`grng`), reserve strength (`rhp/rdps/rsp`) are built but OFF (they cost R7 more than they gave).
| army | before p33 (E1) | after |
|---|---|---|
| air, balanced base | 3★ 22 % lost | 3★ 36 % lost |
| air, anti-air base | 3★ 20 % lost | **2★** 46 % lost (180 s cap) |
| air, art / arrows base | 3★ 0–18 % | 3★ 0–6 % (no anti-air there: by design) |
| siege (14 cat+6 cannon+4 treb+20 guards) | 3★ **0 %** lost, all bases | 3★ 19 / 21 / 4 / 1 % lost (balanced / aa / art / arrows), 144–172 s |
| archers | 3★ 19–28 % | 3★ 13–34 % |
| mixed | 3★ 23–38 % | 3★ 26–53 % |
| giants+rams (`big`) | — | 2★ 27–39 % (cap) |
| cavalry | 1–3★, 63–99 % lost | 1★ (balanced, aa) · 3★ with 72–88 % lost (art, arrows) |
| infantry only | 0–1★ | 0–1★ |
R7 (owner full army): before 6–7/8 3★ → now **5/8 3★ (spells yes and no), the other 3 are 2★** (one 1★ without spells). `plan5/r7.js` NS=8.
Smart-play harness (`--style plan` vs lazy `--style all`, 2 seeds, 3 bases): losses mixed 44→35 / 53→46 / 43→26 %, siege 15→12 / 22→15 / 21→8 %, archers 18→18 / 17→12 / 24→15 %. Air and cavalry tactics are NOT modelled in the harness (it is worse than lazy for them), so criterion (h) is proven for ground armies only.
Pass criteria §6.2: (b) best counter per base ≥ 2.5★ with ≤ 45 % lost ✓, worst ≤ 1★ ✓; (c) ✓; (a) fails for SIEGE only (3★ with ≤ 20 % lost on 3 of 4 bases); (d) air on the AA base is 2★ not ≤ 1.5★ and archers on the artillery base still 3★ (27–34 %); (f) R7 is lower than before on purpose; (h) partly. Not fixed: siege vs arrow-only bases (nothing out-ranges it there; the counter is riders, which die).

## S6 unmanned weapon models (verified in the real battle)
`battle.js` hides the war machine of every unmanned site at battle start (`world.ballistas.hide(id)` for each `b.off`: level or profile does not man it); `defense.js` routes it to ballista / cannon / quad house / wizard. Proven in the real scene: hiding a manned cannon removes its model (before / after shots `s30/t/s8c_j2b_*.png`). Not provable on that base: it has no unmanned site at L20 seed 11 (all 28 guns manned), so the visual of an actually unmanned site was not seen — same code path, same ids.

## S8 scout / defence preview (built, OFF: `FEATURES.scout`, waits for his OK)
- `threat.js`: one merged ribbon mesh (+2 draw calls measured: 336 → 338 in the real scene), rings on the terrain: solid = ground + air, dashed = ground only, red dashed = blind spot (cannon < 14 m). All rings at 55 % strength; a tap on a gun lights ITS ring (full) and dims the rest (16 %) and opens the card (name, what it hits, one weakness line, no raw numbers). Chips under the top bar: share of the destruction % per part (Guns / Walls / Houses / Rest; unmanned sites count as Rest).
- HUD: blue ring-orb (same glass family) above NEXT before the first squad is sent; the card is 290 px max and clears the hero buttons and the spell column (DOM lab `s33/sc1_0.png`); landscape rules added. Scouting never sends a squad (a tap on empty ground only closes the card); the first squad sent switches it off.
- Verified: pure helpers on the real base at 5 levels / seeds (`dev/s33/threat_test.js`: info per kind, no unmanned gun listed, chips sum to 1), real scene with real pointer events (`s30/t/s8c_j1_*.png`, card text read from the DOM), draw calls on / off. Sample sent to him (`s33/s8_strip.png`). With all 28 guns on screen the rings overlap a lot: dim by default, lit on tap is the fix; zoomed far out it is still busy.

## R1 contact-timed hits
The sim lands the damage of every swing / shot at `hitTOf(type)` seconds after the swing starts (soldiers, riders, archers; giants keep `GIANT_SWING.contact`); `bunits.js` plays the attack clip at a speed such that its contact frame (`CONTACT` table per clip: Sword_Regular_A 0.24 s, Sword_Attack 0.42, RideStrike 0.43, AxeStrike 0.46, Ranged_Magic_Shoot 0.3 …) falls exactly on that moment, then the part returns to its idle. The `melee` spark / sound also waits for the same delay (`fx.later(e.hit)`). Seen in the real battle; not measured frame-exact on a phone.

## S4 attacker AI by `prefer` (`TUNE.prefer = 1`)
Each attacking unit picks its target by what it can do: flyers go for anti-air guns first (ballista → wizard → tesla) and never for a soldier who cannot hit them; siege stands off (takes the guns it out-ranges, ±12 / −8 for guns that out-range / cannot reach it); rams / battering units go for the gate; raiders (cavalry) the outskirts; `reachable()` keeps melee soldiers off flyers. Numbers: see the R3 table above (siege / air / archers).

## S9 squad tools (built, OFF: `FEATURES.squad`)
Two small tools next to the selected squad's row: **half** (the next tap sends half of the squad) and **focus** (the next tap names ONE building or defender: `sim.targetAt` + `sim.focus(squad, target, {half})`). Sample strip sent to him (`s33/sq1_strip.png`); no OK yet. The 14:50 ring scheme (p34 Block C) replaces the bar these tools sit on → decide in p34 whether they survive (a drop on a building could mean focus).

## S10 result card + coach (built, OFF: `FEATURES.resultInfo`)
`resultinfo.js`: `damageBySource(stats.took)` (top 5 sources + «Others») and ONE rule-based hint (`hintFor`: time ran out → riders; flyers shot down → keep them back; guardians → bring giants / dragons; ballistas vs heavy; blasts vs bunched soldiers; arrow towers; siege out-ranged; clean raid; default → two gates). Shown on the result card (`.dmg` bars + `.tip`). Verified in the DOM lab with the numbers of a real battle (`dev/s33/res_sample.json`, `hud.sh … res=1`); sample sent earlier; no OK yet.

## R2 look-checks (real battle, headless, 390×844, L20 seed 11) and the late checks
| check | result | evidence |
|---|---|---|
| giant vs giant | ✓ readable: our giants blue belts, guardian orange; dust, rocks, health bars | `s30/t/s8c_j4_giants_fight.png` (sim: ours 3944 / 3966 hp vs guardians 1088 / 903 / 1561 at t 14.6) |
| enlarged cracks | ✓ look right on ground, ✗ drawn over the moat when a giant wades → FIXED (`cracks.js` `wet`, `battle.js` passes `nav.isWet`); fix NOT re-seen live | `s8c_j4_cracks.png`, `s8c_j4_giants_fight.png` |
| dragon vs dragon | ✓ red attack dragons + fire breath readable | `s8c_j5_dragons_fight.png` |
| guardian dragon contrast | ✗ weak: charcoal on dark-navy stone / roofs, only the silhouette reads → p34 (sample first) | `s8c_j5_dragons_fight.png` (upper left), `s8c_j4_guards.png` |
| flames on a burning building | 🟡 first 2–4 s only (faint orange glows); the long run was lost (session killed by the machine, exit 137; first long run had expired burners) → p34 | `s8c_j3_fire*.png` |
| 844×390, 360×640 HUD | ✓ (DOM lab, real `createHUD`) | `dev/s33/*` |
| phone performance | NOT measured (software-rendered browser) | draw calls only: 322 at battle start, 336 mid-scout-off, 338 scout on |

## Final: proven / not proven / not done
**Proven (how):** N1–N5, N7, N8 (real battle / DOM lab shots) · ability emblems (his pick, real HUD) · R1 contact timing (real battle shots; clip contact frames) · R3 numbers (matrix + R7 8 seeds, `dev/s32/search`) · R5 nav (replay of 1550 real queries: same paths, worst 30 → 5 ms) · S6 hide (cannon removed in the real scene) · S8 pure helpers (5 levels) + real pointer-event tap in the real scene + draw calls · S10 card (DOM lab with real numbers) · gate (`dev/gate.sh`).
**Not proven:** anything on his phone (performance, colour jump N6, thermal) · R7 criterion (a)/(d) of §6.2 (see the table above) · the cracks-on-water fix live · flames long run · an unmanned site visual.
**Not done:** S8 / S9 / S10 switched ON (waiting for his OK) · guardian-dragon contrast · his 14:50 ring scheme (p34 Block C, his decision) · his 9 requests of 08:41 (p34 Block P).
