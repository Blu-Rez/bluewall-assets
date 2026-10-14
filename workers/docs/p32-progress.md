# p32 — progress (Oct 4 2026, night) — block V (owner list 21:51) first, then the attack-strategy work

Status lines are appended as the work goes. Everything ships as ONE package `bluebot_bluewall_p32` (not built yet).

## Block V — owner's visual list (21:51)
- **V3 red dragons + orange breath** — `client/src/bdragon.js` (new): the battle dragon / baby dragon are the very Prowler model the home sky circles with, painted in the *shader* through the crowd's `bwExtra` hook
  (painted skin map = light/dark map → ramp dark/mid/light, darker belly, warm rim light; no canvas read-back, no extra texture, no new shader program). Colours in `DRAGON_LOOK`, tier sheen `EMBER` (warm family only: the
  stock GLINT is blue/white and turns red hide purple). Live tuning: `__bwLook.dragon.uLight.value.set(0x…)`. Breath: `STREAM.orange` in `bfx.js`, TYPE.dragon/baby `fire:'orange'`. The home guardian dragon stays blue (unchanged).
- **V4 dragonling yellow fireballs** — `bfx.js` `KIND.fireball` (instanced icosphere, yellow core, glow halo every frame, orange trail, orange puff + embers on impact), `battle.js` hook `fireball`, `bunits.js` TYPE.dragonling `ball:true`
  (one ball every 0.2 s of the breath burst = "ball after ball"). Body colour still follows the Lair level (`dlcolor.js`: green at 12).
- **V2 dragon quality** — causes found: small model (15 m vs ≈35 m at home), flat grey × 1.9 tint, no rim light, eye emissive overwritten, tier glint wrong colour → all fixed in `bdragon.js`.
- **V5 squad rings** — `client/src/squadring.js` rewritten: a soft translucent pool + double rim, slow-turning rune ring, a comet on the rim, an icon badge at the front, 4 draw calls in total (3 layers sharing one position buffer + one icon mesh), terrain-following, selected squad glows/grows. No per-frame allocation.
- **V1 giants** — (a) the troll's own walk was a hobble (left foot hangs and drops, right foot planted, feet travel ≈1 m per step at ≈7 m/s ground speed): `client/src/bgiant.js` keeps the artist's upper body and re-makes the LEGS as a real alternating
  stride (two-bone IK on the model's own bones, baked into plain quaternion tracks, planted foot slip = 0, hips dip with the weight, foot rolls); the stance-foot speed is returned and the view's `ref` is set from it, and the playback speed follows the
  ground speed every frame (`crowd.js p.setSpeed`, `pt.P.live`). (b) one smash per swing: sim `GIANT_SWING = {iv 1.8, hit 0.84, contact 0.86, reach 3.0}` — damage lands 0.84 s after the swing starts (the 'attack1' clip's club head is lowest at 0.87 s),
  dps unchanged (dmg = dps × interval), a giant stands a club's length (3 UR) from a building. Test: `bash dev/test/giant_test.sh` (clip contact vs sim delay ≤ 0.1 s, cadence, determinism). R7 stars unchanged.
- Finding (not changed, only for giants): `bunits.js setState` computes a unit's *run* playback speed once, when the state is entered (speed is still ≈0.5 then), so every other walking unit plays near the minimum 0.55× for its whole march.

## Tools added
`dev/s32/giant/gait.js|py|gb.sh` (bare-scene render of the troll clips: `bash gb.sh "clip=stride&view=left"`), `dev/s32/dragon/*`, `dev/s32/rings/*`, `dev/test/giant_test.sh`, live steps `dev/s32/p32c.json`.

## Block W (owner 5 Oct 01:05) — state at 5 Oct 03:00
- **W1 trophy chip** — first version (gems + cup in one row, cup gem-sized) was REJECTED by the owner at 03:08 («چقدر زشت»): being redone (see plan H/Z1).
- **W2 NEXT button** — first version (CSS red banner) REJECTED 03:08: being redone as a forged plate (plan Z1).
- **W3 unit bar** — (REJECTED 03:08/03:10: portraits «خیلی بد», gold circles «خیلی خیلی بدتر», the spell-button circle is nicer → rebuild in the spell orb style, plan Z1). First version: gold medallions (`.bwb-sq .c`), the ring behind the portrait is the squad's HEALTH (full = healthy; green ≥ 60 %, amber ≥ 35 %, red below), the portraits are NEW close-ups of the real models:
  `dev/s32/port/shoot_all.py` (one headless run of the battle: every unit isolated, camera found from the unit's own bounding box; busts for the soldiers (face + weapon), the whole engine / creature for the rest;
  per-type framing in `cfg.json`) → `mkport2.py` → `client/src/portraits.js`. Tools: `pd.py` (persistent browser), `drive.py`. NOTE: the old tool `dev/s30/live.py` once crawled because a script set `scene.fog = null`
  (world.js reads `scene.fog.color` every frame → the render loop threw → frames never advanced): keep a harmless fog object instead.

## Block X (01:26–01:38) — new defences
- Data + sim: `military.py DEFENCES / DEFENCE_PAIRS`, `battlesim.js` (gating by level, wizard / quad, profiles). Unlock table: L1 arrow ↔ spear, archer · L3 cannon ↔ sword, imp · L5 wizard tower ↔ mage, cavalry · L8 ballista ↔ pegasus · L10 quad ↔ siege cannon · L13 giant · L16 baby + hill · L18 dragon · L20 second slots.
- **X2 quad cannon house** — `client/src/quadhouse.js` (stone shed with a slate roof on a stone turntable, four barrels in a 2×2 block; the sim's salvo = four `shot` events (q = 0..3, 0.17 s apart) → each barrel kicks, flashes, smokes). Routed in `defense.js` (`kindOf` → 'cannon' so the battle draws a ball), `world.js weapon()` kind 'quad'.
- **X1 wizard tower** — `castle.js`: every 3rd ROOFED tower has its roof on four stone pillars with a glowing orb on top and a `wizard` site; `client/src/wizards.js` puts the little mage (same model + staff as the attacking mage, a baked crowd) on the platform;
  in a raid `fire()` turns him to the target and plays `Ranged_Magic_Shoot`; the sim's `orb` shot flies from the tower. Hidden when the tower falls / when the castle does not man it (`battle.js` hides every `sim.buildings[].off` site at battle start).

## Block Y (01:35–01:39) — guardians
- Server: `military.py` `GUARDIANS`, `guardian_slots`, `set_guard`, `victim_guard`, `attack_army`, `army_power(attack=True)`; `state.py` op `guard`; `server.py` allow-list; army view carries `guard`, `gslots`, `apower`; `player_target` carries the victim's `guard`;
  `settle_battle` refuses to send a guardian (`bad_units`). Test: `python3 dev/guard_test.py`.
- Client: Army sheet → the details sheet of giant / hill / baby / dragon has a «Castle guardian» − n / slots + row (locked rows say «Opens at Castle Lv N»), a 🛡n badge on the card, the attack roster (`battle.js`) excludes guardians, `target.guard` goes into the sim.
- Foe's colours: `bunits.js` kinds `troll_e` (orange / red armour + bracers, red loincloth), `e_hill` (crimson), `dragon_e` / `baby_e` (dark charcoal with ember rim; `bdragon.js DRAGON_LOOK.edragon/ebaby`); defenders that fly lift off at once.

## 5 Oct 03:30 — state when the owner went to sleep
- Done in code + lab (not yet in the real game): `gear_sword.js` (3 arm clips), `gear_helm.js` (Roman helm + face + crest), wiring in `gear_plume.js`, `life.js`, `bunits.js`. Lab: `dev/knight_lab.html` (+ `dev/lab_shot.py`), outputs in `dev/s32/k3/t/`.
- Not started: full plate armour, axe rider unit, white/black horses, HUD art redo, soldiers' natural walk/fight (W6).
- Open from before: real-game check of cracks / fire / ice / foe giants & dragons / quad house / wizard tower (the `hud2.json` live run), calibration (R7 ≈ 75 % 3★), smart-play harness, nav A* spike.

## 5 Oct 04:10 — knights (Z2/Z3/Z4) done in code, seen in lab + real battle crowd
- **Sword knight (`cavalry`)**: great helm + horsehair crest + FULL plate (`gear_armor.js`: cuirass, pauldrons, arm / leg plates, gauntlets) + the sword on the shoulder / drawn / strike clips (`gear_sword.js`). Horse = the dapple-grey (white) Mesh2Motion horse (`horse_m2m_grey`) in battle (`bunits.js` kind `horse`) and at home (`life.js` coats grey / black).
- **Axe Rider — NEW unit `axerider`** (Stable Lv 11, space 5, hp 780, dps 48, spd 2.0, Epic by the rarity formula = 64.5; cavalry is 28): `gear_plume.js axeKnight()` = its own copy of the dressed K3 knight with the ROMAN helm + heavier plate and no sword; `gear_axe.js makeAxe({ long: true })` = 1.5 m haft, head ×1.3, steel top spike;
  `gear_sword.js` generalised (`weaponClips(gltf, kind)`): clips AxeShoulder / AxeDrawn / AxeStrike (the bit leads the swing: faces forward in the guard, up in the wind-up, down at the blow). Battle: `bunits.js` TYPE.axerider = kinds `horse3` (bay horse ×1.1) + `rider3` (×1.08, axe as a crowd prop on hand_r).
  Server: `military.py UNITS` + `_PREFER near`; client tables regenerated (`unitdefs.json`: only `units.axerider` + `order` changed), `armyui` NAME / DESC / icon, `squadring` colour, `battlesim ORDER`, `i18n`. Home: 2 of the 6 patrol riders are axe riders (bay / black horses).
  NOT put into `_PLAN` (ref_power) nor the owner's start plan on purpose: those sum to 1.00 and feed the calibrated defence budgets (R7). A portrait is still missing (falls back to the line icon until the HUD/portrait redo).
- Seen: `dev/rider_lab.html` (horse + rider pairs, all poses), real battle crowd via `dev/s30/live.py` step `axe1` (`dev/s30/t/axe1_*.png`): white-horse knights and bay-horse axe riders side by side, long axes visible.
- Fixed on the way: a `userData.srcGeo` BufferGeometry was JSON-copied by three's clone (slow) → now a non-enumerable property.

## 5 Oct 04:30 — HUD redo (Z1) + soldiers' run speed (W6 part)
- **NEXT**: baked plate (`dev/hudart/art2.html` → `out/next2.png` → 7.5 KB webp inlined in `bhud.js` CSS): iron frame, thin gold edge, red lacquer inlay, 4 rivets; the lettering «NEXT »» is live text (gold-white, engraved shadow).
- **Gems + cup**: each in a round silver-rim socket (the spell-orb rim) with a dark blue (gold for the cup) bowl, the number on a plaque (dark navy, gold hairline) overlapping the socket's bottom; readable on any background. `bhud.js` `.bwb-loot`.
- **Unit medallions**: `client/src/unitorb.js` (new) = the SAME glass orb as the spell buttons: silver rim, dark channel with the squad's HEALTH as a real ring (`.arc`, green ≥ 60 %, amber ≥ 35 %, red below; updated with `stroke-dasharray`), bowl tinted by the unit's rarity (so a blue soldier never sits on a blue background), portrait in the bowl, thin rarity ring, gloss; count badge = the spells' blue pill (bottom right), squad-colour bead at the bottom. Test page `dev/s32/hud/` (`bash build.sh`; `python3 shot.py "bg=/s30/t/axe2_a2.png" out.png 3`; `orbs.html` = every unit).
- **Portraits**: pipeline `dev/s32/port/` (`pd.py` daemon, `shoot3.py` = tight busts on black AND white backgrounds → `mkport3.py` recovers the alpha → transparent webp, so the rarity bowl shows through). cfg: `cfg3.json`.
- **Run speed (W6)**: `bunits.js runPlay()` — the walk / run clip and its playback speed are re-evaluated every frame from the real ground speed (soldiers, riders, horses), with hysteresis between walk and run; before, they were fixed at the moment the run began (speed ≈ 0 then), so most units played at ≈ 0.55× and slid.

## 5 Oct 05:00 — portraits finished, HUD art final (Z1)
- All 21 unit busts re-shot (`dev/s32/port/shoot3.py`, black + white background pair → alpha in `mkport3.py`, `final.py` writes `client/src/portraits.js`, 221 KB of transparent WebP). Fixes on the way: `find()` needs the blue background (white left over from an earlier shot made spear / guard "not found"); per-type framing in `cfg3.json` (the sign of `dy` is: + = the subject moves DOWN in the picture); a faint second copy of the soldier (spawn-fade ghost) is cut by an alpha threshold (`GHOST` set in `mkport3.py`); imp re-shot (head had been cut off).
- Orb medallion (`unitorb.js`): the common bowl is now warm stone (the blue soldiers stand out), the portrait fills the bowl (72 of 96 px). Dragon / baby portraits stay the weakest (the battle model rests crouched on the ground at spawn → wings spread flat): not touched any more tonight.
- Real-game checks run through `dev/s30/live.py` with the step files `dev/s32/live/v1..v5.json` (home riders + HUD; static X/Y cameras; cracks; wizard / quad / freeze; fire) — see the next entries for what was seen.

## 5 Oct 07:30 — real-game verification (phone viewport 390×844, `dev/s30/live.py`, steps `dev/s32/live/v1..v10.json`)
SEEN and OK:
- **HUD (Z1)**: gems row in round sockets with number plaques (also the `6/60` pickup state), cup, NEXT forged plate, unit orbs with the health ring + count pill, selected-orb glow; spell orbs unchanged. Mid-fight: `s30/t/v8_hud_mid.png`.
- **Home riders (W7)**: sword knight on the white (dapple-grey) horse — great helm + crest, shield, sword resting on the shoulder; axe rider on the black / bay horse — Roman helm with a blue plume, long axe on the shoulder. `s30/t/v10_r_ax1.png`, `v10_r_sw1.png`.
- **Wizard tower (X1)**: roof on four stone pillars, the little mage under it (`v6_wz_side.png`); in a raid the sim's `orb` shot flies from it (hit seen in the event stream, kind `orb`).
- **Quad house (X2)**: stone shed on the tower top, four barrels in a 2×2 grid behind an iron grille (`v8_qd2.png`); volley events `bolt` q = 0.. seen. Walls were too white → darkened (`quadhouse.js`), not re-viewed.
- **Guardians (Y1/Y2/Y5)**: foe giants stand in the courtyard with orange/red pauldrons + loincloth (`v2_gd_giant.png`); the guardian baby dragon flies inside the castle, dark charcoal (`v6_gd_baby.png`: low contrast against dark stone). The Army-sheet toggle was seen in an earlier session.
- **Ice (W5)**: the shell is drawn (`v9_fzdirect2.png`: pale-blue block + crystals around the tower). A test that called `sim.cast` directly saw nothing only because the sim clears events that were pushed outside a step; the game's own `castSpell()` shows them at once.
- **Cracks (W4)**: dark branching cracks appear behind the giant's feet (`v3_cr2.png`); sizes ×1.8 and thicker lines afterwards (`bunits.js crackStep 3.6, size 6.2–8.6`, `cracks.js` line width 8), not re-viewed at the new size.
NOT proven: the flames on a burning building (burner list filled with 2–3 buildings and yellow fireballs were seen, but no close shot of a building on fire), a giant-vs-giant / dragon-vs-dragon spectacle, 844×390 and 360×640 in the real game (DOM harness only), perf of the new gear on a real phone.
Mistakes found on the way: a live-session script parked 1000 s waiting for an event that needs manual `sim.step` (the browser is ≈20× slower than real time); an old chromium of a killed session kept eating CPU for an hour (kill the whole process tree by PID).

## 5 Oct 07:45 — balance + package
- `battlesim.js TUNE`: the `d2` search result became the default (`tower .55`, `w_ballista 2.2`, `m_ballista_air/heavy/light 2.2/2.6/.35`, `m_cannon_light/heavy 1.8/.35`, `bm_* ` (siege 1, giant 1, air .6, infantry .55, cavalry .5, ranged .55, tank .5)) + `hp 12` (R7 tries: hp 14 → 6/8 · hp 12 → 7/8 · hp 11 → 7/8 · tower .45 → 6/8 · hp 12 + tower .5 → 7/8). Backup of the old file: `dev/s32/orig/battlesim_p32pre_tune.js`.
- R7 now: 3★ 7 of 8 (4 seeds × spells no / yes), median end ≈ 140 s. The one miss ends at 175–180 s with 97–100 % destroyed (time limit).
- Matrix `s32/search/e1.txt` (24 cells): see the plan §I — air / arch / siege / mixed win everywhere (siege with 0 % lost), infantry-only loses.
- Gate: all OK except `bot_xfer_test` (no sqlalchemy here). `bash dev/test/giant_test.sh` OK, `python3 dev/guard_test.py` OK, siege crossings 0.
- Package `bluebot_bluewall_p32` built with `pkg/mkpkg.sh`, `instest_bot.sh bluebot_bluewall_p32 ok` → installs, answers `/healthz` with the new build id, rollback restores the old tree.
