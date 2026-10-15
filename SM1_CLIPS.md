# SM1 - which TP1 clip goes in which slot, for every unit key (generated: `python3 dev/sm1_apply.py --table`, from `dev/sm1_clips.json`)

The machine-readable twin of this page is `dev/sm1_clips.json`; `dev/sm1_apply.py KEY studio.glb out.glb` reads it, cuts exactly these clips out of the TP1 library (`TP1_clips`, 52 clips, 24 fps, retargeted onto the Studio mixamo rig) and writes the row of `unit_models.json`.
Clip names are the names of `TP1_clips_manifest.json`. **19 of 37 unit keys are soldiers the pipeline can build** (a humanoid on the 65-bone mixamo rig); the other 18 keep today's body (riders, flyers, siege machines) and are listed at the end with what they need.

## 1. The slots (what the game plays, and which clip fills it)

| slot | what the game does with it | source |
|---|---|---|
| idle | loop while standing | library `battle_idle` (ready stance, knees slightly bent): its own motion is only ~0.7 cm at the head of a 4.6 m figure, so the cut multiplies it x6 about its mean pose (max 6 deg per joint) - a breathing stance, loop still closed |
| walk | loop while the unit goes slower than `walkMax` | the **Studio file's own Walk preset**, one gait cycle cut so that frame 0 = last frame (`walkRef` = the ground speed the stance foot does not slide at, measured) |
| run | loop at battle speed | the **Studio file's own Run preset** if it has one; else the Walk again (played faster by the game, clamp 1.9x - see section 4). Giants / beasts: always the Walk |
| atk | one swing per hit; the blow lands on the sim's damage moment | library clip of the row below, cut from the start of the strongest burst; `contact` (s, measured: the hand's fastest moment) is written to the row so `bunits.js` plays it at `contact / hitTOf` (clamp 0.5..2.2); the tail eases into the idle pose |
| hit | 0.4 s flinch (`bunits.js`: `hitUntil = t + 0.4`) | library `hit_heavy`, the 0.6 s after its onset squeezed into 0.4 s, ending in the idle pose |
| death | frozen pose + dissolve (D1) | the pose is taken from the baked clip: `death_forward` is listed for the day the game plays one; it is **not** shipped now (file budget) |

## 2. Per unit key

`h` = standing height in game metres (today's recipe); `speed` = ground speed in a battle (m/s) = unitdefs spd x 3.1 x 2.9; `hit_t` = when the sim counts the damage (s after the swing starts), `atk_sp` = playback speed the attack is cut for. `weak` / `seat` = the TP1 verdict of a clip used (weak = small motion, seat = a rider's clip with straight legs).

| key | role | h m | speed | idle | walk | run | attack (alt) | hit | death | flags |
|---|---|---|---|---|---|---|---|---|---|---|
| spear | foot soldier: spear + heater shield | 4.6 | 8.99 | battle_idle (alt guard_hold) | Studio Walk | own Run preset, else Walk faster | spear_thrust (spear_sweep) | hit_heavy | death_forward | - |
| sword | foot soldier: claymore (two-handed) | 4.6 | 9.44 | battle_idle | Studio Walk | own Run preset, else Walk faster | greatsword_swing | hit_heavy | death_forward | - |
| guard | foot soldier: sword + round shield (tank) | 4.6 | 8.09 | battle_idle (alt guard_hold) | Studio Walk | own Run preset, else Walk faster | sword_shield_slash (shield_bash) | hit_heavy | death_forward | - |
| archer | foot archer | 4.6 | 8.99 | battle_idle | Studio Walk | own Run preset, else Walk faster | crossbow_shoot (shoot_bow) | hit_heavy | death_forward | weak:shoot_bow (not used) |
| giant | giant: troll + mace | 14.0 | 7.19 | battle_idle | Studio Walk | Walk only (giants / beasts do not sprint) | giant_swing (giant_smash, roar) | hit_heavy | death_forward | - |
| imp | imp (small fast raider) | 4.2 | 17.08 | battle_idle | Studio Walk | own Run preset, else Walk faster | dagger_stab | hit_heavy | death_forward | - |
| mage | mage + staff (ranged magic) | 3.15 | 8.54 | battle_idle | Studio Walk | own Run preset, else Walk faster | cast_projectile (staff_cast) | hit_heavy | death_forward | - |
| werewolf | werewolf (biped beast, claws) | 7.2 | 20.68 | battle_idle | Studio Walk | own Run preset, else Walk faster | dagger_stab (beast_leap, roar) | hit_heavy | death_forward | - |
| hill | hill giant + double hammer | 10.0 | 7.64 | battle_idle | Studio Walk | Walk only (giants / beasts do not sprint) | hammer_smash (giant_smash) | hit_heavy | death_forward | - |
| shieldmaiden | shieldmaiden: axe + round shield | 5.4 | 10.34 | battle_idle (alt guard_hold) | Studio Walk | own Run preset, else Walk faster | sword_shield_slash (shield_bash) | hit_heavy | death_forward | - |
| legionary | Roman legionary + big shield | 4.6 | 8.99 | battle_idle (alt guard_hold) | Studio Walk | own Run preset, else Walk faster | sword_shield_slash (shield_bash) | hit_heavy | death_forward | - |
| captain | banner captain (hero unit) | 5.4 | 9.89 | battle_idle | Studio Walk | own Run preset, else Walk faster | sword_shield_slash (rally_banner) | hit_heavy | death_forward | - |
| ogre | ogre + club | 9.0 | 8.09 | battle_idle | Studio Walk | Walk only (giants / beasts do not sprint) | giant_swing (giant_smash) | hit_heavy | death_forward | - |
| lich | lich (caster, bigger mage) | 5.9 | 8.54 | battle_idle | Studio Walk | own Run preset, else Walk faster | cast_projectile (cast_summon, cast_channel, staff_slam) | hit_heavy | death_forward | - |
| treant | treant (walking tree) | 8.4 | 7.19 | battle_idle | Studio Walk | Walk only (giants / beasts do not sprint) | giant_smash (giant_swing) | hit_heavy | death_forward | - |
| e_guard | foe's guard: crimson, sword + round shield | 4.6 | 8.09 | battle_idle (alt guard_hold) | Studio Walk | own Run preset, else Walk faster | sword_shield_slash (shield_bash) | hit_heavy | death_forward | - |
| e_archer | foe's archer: crimson, crossbow | 4.6 | 8.99 | battle_idle | Studio Walk | own Run preset, else Walk faster | crossbow_shoot (shoot_bow) | hit_heavy | death_forward | weak: shoot_bow |
| e_hill | foe's hill giant: crimson, double hammer | 10.0 | 7.64 | battle_idle | Studio Walk | Walk only (giants / beasts do not sprint) | hammer_smash (giant_smash) | hit_heavy | death_forward | - |
| e_giant | foe's giant: red troll + mace | 14.0 | 7.19 | battle_idle | Studio Walk | Walk only (giants / beasts do not sprint) | giant_swing (giant_smash) | hit_heavy | death_forward | - |

Notes per key:

- **spear** - today: Idle_Shield_Loop / Punch_Cross
- **sword** - the game calls it claymore -> greatsword_swing; if the owner builds him with sword + shield use sword_shield_slash (one word in the row)
- **guard** - today: Sword_Idle / Sword_Attack
- **archer** - shoot_bow is WEAK (small arm motion) -> crossbow_shoot: the Studio archer must hold a CROSSBOW (a bow with a crossbow motion would look wrong)
- **giant** - the club lands GIANT_SWING.hit 0.84 s after the swing starts; natural speed (atk_sp 1.0): the cut starts 0.84 s before the contact
- **imp** - two quick claw/dagger strikes
- **mage** - orb leaves the hand at HIT_T.orb 0.3 s (bunits: mage/lich)
- **werewolf** - claws = dagger_stab; the Studio rig needs a humanoid-proportioned werewolf (a four-legged one will not work on the mixamo rig)
- **hill** - giants walk: run slot = the walk clip (a 10 m body sprinting would need 28 m/s)
- **captain** - rally_banner (banner up) is a victory/command pose, listed as alt only
- **ogre** - club sweep = giant_swing; walks (run slot = walk clip)
- **treant** - a biped tree-man; if the Studio rig will not take it, the old treant stays
- **e_guard** - no recolour in the game: the foe needs its OWN file (crimson cloth)
- **e_archer** - own file (crimson); crossbow
- **e_hill** - own file (crimson)
- **e_giant** - own file (red loincloth)

## 3. The library `sprint` is not used

The TP1 `sprint` clip is "sprinting fast, in place": the legs pedal on the spot. Measured on the library retargeted onto a 4.6 m Studio figure (`gait()`: the speed of the planted foot against the body): **sprint 0.01 m/s** (it would need ~9 m/s), **walk 4.16 m/s**. A soldier running on `sprint` would skate at the full battle speed, so `run` is the Studio file's own Run preset or the Walk.

## 4. Walk only, or Walk + Run: what the owner gets (measured)

Infantry goes ~9 m/s in a battle. The game plays the run clip at `v / ref`, clamped to 1.9x, and the walk below `walkMax`. A Studio Walk covers ~3.8 m/s of a 4.6 m figure at 1.0x, so on the Walk alone the feet cover at most ~7.2 m/s while the body goes 9 m/s: the figure skates.

Measured on the delivered files in three.js (planted foot speed against the ground, cm/s of the final figure; p50 / p95):

| model | clip | ground speed m/s | playback | p50 | p95 |
|---|---|---|---|---|---|
| spear | walk | 2 | 0.53 | 12 | 71.3 |
| spear | walk | 4 | 1.06 | 23.5 | 145.7 |
| spear | walk | 6 | 1.58 | 34.7 | 222.1 |
| spear | run | 8 | 0.74 | 59.9 | 459.4 |
| spear | run | 9 | 0.83 | 65.5 | 531.3 |
| spear | run | 10 | 0.93 | 70.5 | 585.1 |
| spear | run | 12 | 1.11 | 80.6 | 689.6 |
| mage | walk | 2 | 0.77 | 12 | 72.6 |
| mage | walk | 4 | 1.54 | 22.8 | 150.7 |
| mage | walk | 6 | 1.90 | 109.9 | 307.1 |
| mage | walk | 8 | 1.90 | 308.2 | 505.7 |
| mage | walk | 8.5 | 1.90 | 358.1 | 555.6 |
| mage | walk | 10 | 1.90 | 507.9 | 705.3 |
| mage | walk | 12 | 1.90 | 707.8 | 905.2 |

The same 4.6 m soldier (`spear`) with ONLY the Walk preset, at its battle speed 8.99 m/s: Walk at 1.90x -> planted foot 182.8 cm/s p50, 471 cm/s p95 (with the Run preset: see the `run` rows).

`spear` has the Run preset, `mage` only the Walk. **Without a Run preset an infantry soldier skates at several m/s - ask for Walk AND Run.**

## 5. File budget (what `sm1_apply.py` enforces and reports)

| item | budget | measured on the 3 samples |
|---|---|---|
| LOD0 triangles | <= 6000 (692 soldiers at once) | 5997 (Studio file: 19169) |
| LOD1 triangles | <= 1500 (`_lod1.glb`, no clips, 512 px texture) | 1499 tris, 156.5 KB file |
| file (mesh + texture + clips) | - | 673.7 KB (6 clips) |
| baked animation texture | - | 816.6 KB |
| texture | one material, 1024 px base colour (webp), normal map dropped | |
| bones | 65 `mixamorig:*` | 65 |

## 6. Needs Tripo (what a unit needs that is not a Studio soldier)

| unit key | model needed | size | look |
|---|---|---|---|
| archer | archer with a crossbow |  |  |
| cavalry | horse_grey (rigged quadruped, Idle Walk Trot Gallop Death Kick HeadButt) | ~4.8 m long | dapple-grey |
| cavalry | knight_seated | ~4.2 m tall seated | sword, plume, crest shield · hips lowered ~0.25 m, thighs forward + out |
| axerider | horse_bay | ~5.3 m long | bay |
| axerider | axe_knight_seated | ~4.5 m | Roman helm, plate, long axe |
| pegasus | pegasus (rigged, wings, Rest Fly Glide) | ~5 m long | white |
| baby | baby_dragon (rigged, Perch Fly) | ~12 m span | red |
| dragon | dragon (rigged, Perch Fly) | ~22 m span | red |
| catapult | (optional) catapult | 9.5 m long | wood + iron |
| ram | (optional) battering_ram | 9.5 m long |  |
| cannon | (optional) cannon | 6.4 m long |  |
| werewolf | werewolf, biped |  |  |
| trebuchet | (optional) trebuchet | 9.5 m long |  |
| lord | horse_black | ~5.8 m long | black |
| lord | lord_seated | ~5 m | heavy plate, crest |
| dragonling | dragonling (rigged, Flying_Idle Fast_Flying Headbutt Punch HitReact Death) | ~2 m | green |
| gryphon | gryphon (rigged, wings) | ~7 m span | brown/white |
| treant | treant, biped |  |  |
| gryphonknight | gryphon_knight (rigged) | ~8 m span | armoured rider seated |
| darkrider | dark_rider (rigged) | ~14 m span | black |
| baby3 | baby_dragon_3head (rigged, 3 mouth bones) | ~12 m span |  |
| dragon3 | dragon_3head (rigged, 3 mouth bones) | ~24 m span |  |
| e_guard | crimson guard |  |  |
| e_archer | crimson archer with crossbow |  |  |
| e_hill | crimson hill giant |  |  |
| e_baby | baby_dragon_charcoal (own file, charcoal hide) | ~12 m span |  |
| e_dragon | dragon_charcoal (own file, charcoal hide) | ~22 m span |  |
| e_giant | red troll |  |  |

The pipeline soldiers need nothing else: the owner builds them in Studio (see `SM1_OWNER_GUIDE_fa.md`).

## 7. Keys that keep today's body

| key | kind | why | what TP1 has |
|---|---|---|---|
| cavalry | rider | a horse + a seated rider: two crowd kinds that follow the saddle; the 52 TP1 clips have no horse | seat: ride_* clips have STRAIGHT legs (no horse in Tripo); weak/seat -> not shippable |
| axerider | rider | horse + seated axe knight | seat: ride_* clips have STRAIGHT legs (no horse in Tripo); weak/seat -> not shippable |
| pegasus | flyer | winged horse | no TP1 flight clips: needs a winged rig + fly/glide/perch clips (Tripo has none in the library) |
| baby | flyer | dragon | no TP1 flight clips: needs a winged rig + fly/glide/perch clips (Tripo has none in the library) |
| dragon | flyer | dragon | no TP1 flight clips: needs a winged rig + fly/glide/perch clips (Tripo has none in the library) |
| catapult | siege | a static machine: recoil + collapse are done on the instance in bunits.js | static model: the swap pipeline loads rig + clips; a static (one mesh) row is not supported -> separate job |
| ram | siege | static | static model: the swap pipeline loads rig + clips; a static (one mesh) row is not supported -> separate job |
| cannon | siege | static | static model: the swap pipeline loads rig + clips; a static (one mesh) row is not supported -> separate job |
| trebuchet | siege | static | static model: the swap pipeline loads rig + clips; a static (one mesh) row is not supported -> separate job |
| lord | rider | horse + big seated knight | seat: ride_* clips have STRAIGHT legs (no horse in Tripo); weak/seat -> not shippable |
| dragonling | flyer | small dragon | no TP1 flight clips: needs a winged rig + fly/glide/perch clips (Tripo has none in the library) |
| gryphon | flyer | gryphon | no TP1 flight clips: needs a winged rig + fly/glide/perch clips (Tripo has none in the library) |
| gryphonknight | flyer | knight on a gryphon (seat + flyer) | no TP1 flight clips: needs a winged rig + fly/glide/perch clips (Tripo has none in the library); seat |
| darkrider | flyer | dark rider on a flyer (seat + flyer) | no TP1 flight clips: needs a winged rig + fly/glide/perch clips (Tripo has none in the library); seat |
| baby3 | flyer | three-headed baby dragon | no TP1 flight clips: needs a winged rig + fly/glide/perch clips (Tripo has none in the library) |
| dragon3 | flyer | three-headed dragon | no TP1 flight clips: needs a winged rig + fly/glide/perch clips (Tripo has none in the library) |
| e_baby | flyer | foe's baby dragon | no TP1 flight clips: needs a winged rig + fly/glide/perch clips (Tripo has none in the library) |
| e_dragon | flyer | foe's dragon | no TP1 flight clips: needs a winged rig + fly/glide/perch clips (Tripo has none in the library) |
