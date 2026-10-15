# TP1 - what is left to animate (15 Oct 2026, 20:55)

Done by the owner already: jump_up, fall, land, climb_stairs, climb_wall.

I looked at all 33 clips of the game's Elina GLB frame by frame (contact strips, 6 poses each):
- fine: sit_down / sit_idle / stand_up, slash_a/b/c, heavy, interact, dodge, death, hit, aim
- stand-ins: swim (flat prone flutter), climb (ladder-like), block (standing, arms wide - not a guard)
- missing: get_up (knockdown ends lying on the floor, nothing stands her up), tread water, the top-of-wall mantle, riding, per-weapon combat (bow draw/release, spear, staff, dagger, earth spell)

Rule for every clip: Tripo Studio -> Animate -> custom prompt, the seconds below, in place (no travelling), loops are closed by me.
File name = clip name (`melika_swim.glb`). Build ALL on the rigged Melika G1 (same Mixamo rig as the others); I retarget them to the six.

## A - needed now (the game has a stand-in or nothing)
| clip | sec | loop | prompt |
|---|---|---|---|
| swim | 2.0 | yes | Swimming forward at the water surface, breaststroke: body horizontal and face down with the head lifted, arms sweep out and back in a circle, legs kick frog-style. Stays on the same spot, loopable. |
| tread_water | 2.0 | yes | Treading water, upright, in place: arms sculling gently at the sides, legs pedalling slowly, head up looking forward, a slight bobbing. Loopable, same spot. |
| block | 1.0 | yes | Defensive guard stance, in place: knees bent, both forearms raised and crossed in front of the chest and face, leaning slightly forward, bracing for a hit. Holds the pose with a tiny breathing motion, loopable. |
| get_up | 2.0 | no | Getting up from the ground, in place: starts lying flat on her back, rolls onto one side, pushes up with one hand, gets one knee under her and stands up, ends standing upright and relaxed. Same spot. |
| climb_ledge | 1.6 | no | Climbing over a ledge at the top of a wall, in place: both hands grip the edge at chest height, she pulls herself up, one knee swings onto the ledge, she pushes up and stands upright on top. Same spot. |

## B - weapons (the sister kits need them; only Elina's sword kit exists today)
| clip | sec | loop | for | prompt |
|---|---|---|---|---|
| shoot_bow | 1.4 | no | Melika | Shooting a bow, in place: stands side-on, pulls the string back to the cheek with the right hand while the left arm holds the bow out straight, holds a moment, then releases and relaxes slightly. |
| spear_thrust | 0.8 | no | Aylar | Spear thrust, in place: steps forward with the left foot and thrusts both hands forward at chest height as if holding a spear, then pulls back to a guard stance. |
| staff_cast | 1.3 | no | Aylin | Casting with a staff, in place: raises a two-handed staff overhead, then sweeps it forward and down, ending in a firm pose. |
| dagger_stab | 0.9 | no | Elika | Two quick dagger strikes, in place: low crouched stance, the right hand stabs forward, then the left hand slashes across, fast and sharp. |
| cast_ground | 1.4 | no | Mobina | Earth spell, in place: crouches, slams the palm of the right hand onto the ground, then rises and pushes both hands forward. |

## C - riding (needs the Tripo horse rigs from AN1 and ~1 day of code that does not exist yet; SL1 found no mounted pose)
| clip | sec | loop | prompt |
|---|---|---|---|
| mount | 1.8 | no | Mounting a horse from the left side: stands beside an invisible horse, lifts the left foot into a high stirrup, pulls up with the hands and swings the right leg over, ends sitting upright in the saddle holding the reins in front. |
| ride_idle | 3.0 | yes | Sitting on a horse, in place: upright, legs apart and bent around the horse's body, hands holding reins in front of the belly, breathing gently. Loopable. |
| ride_walk | 1.2 | yes | Riding a horse at a walk, in place: sitting upright, hips swaying gently with the rhythm of the horse, hands holding reins. Loopable. |
| ride_gallop | 0.7 | yes | Riding a horse at a gallop, in place: leaning forward with the knees gripping, hips rocking forward and back quickly, hands low holding reins. Loopable. |
| dismount | 1.5 | no | Dismounting a horse on the left side: swings the right leg back over, slides down and lands standing beside the horse, relaxed. |
If Tripo gives a plain "sitting on a chair" for the ride clips (legs together), stop there and tell me: riding then waits for a Mixamo clip.

## D - optional
| clip | sec | loop | prompt |
|---|---|---|---|
| sprint | 0.8 | yes | Sprinting fast, in place: strong forward lean, big arm drive, long powerful strides. Loopable. |
| wave | 2.0 | no | Friendly wave hello, in place: lifts the right hand above the shoulder and waves side to side three times, smiling, then lowers it. |

## The other five sisters (one rig + one clip each)
After the new pictures (pics6) are built into models: for each sister -> Rig (Biped, spec Mixamo, same as Melika) -> animation preset **Walk** only -> export GLB `<name>_walk.glb`. Nothing else.
Why Walk: it is the ground truth I compare my retargeted walk against (error in % of height), and it gives her natural stride so the feet do not slide.
Then I put all clips (the 33 in the game + these) on each of the five.
