# WC1 — where the heroes carry their weapons

Chat WC1 · built on branch `kit` (setup_kit.sh) · everything below was run on the software-GL rig (swiftshader), Elina's rig + LIBRARY weapons (test-only).

## What it does
New lazy module `combat/carry.js` (loaded by `combat/fx.js` only when a kit has weapons, i.e. hero mode only). Each weapon has a class (`kind`) and a carry place (`carry`):

| class (`kind`) | default `carry` | mount |
|---|---|---|
| short_sword / sword / dagger | `hip` | LEFT hip, hilt forward, blade angled back; own slim scabbard (cone + gold throat/locket/chape) |
| 2 daggers | `hip` | one on each hip (`hip_pair`: slightly further out and back so the hilt does not sit on her hand) |
| big_sword / axe | `back` | on the back, hilt over the right shoulder |
| spear / hammer | `back` | on the back, shaft diagonal, head over the shoulder |
| bow | `back` | slung on the back (drawn into the LEFT hand) |
| quiver | `hip` | right hip/back, never leaves the body |
| staff | `hand` | in the hand all the time (default grip: upright at her side, leaned inwards in the bind pose so the idle arm ends with the shaft vertical) |

Behaviour: fight starts (lock, attack, skill, hit, block, down) → the weapon moves from the mount to the hand with a 0.12 s scale-out / scale-in swap using the game's additive flash; 3 s after the last blow it goes back (3.6 s check below). The weapon has exactly one parent at all times (hand bone XOR mount bone), never visible in both places. The trail is off during the swap. A kit can override with `carry: 'hip'|'back'|'hand'`, name the class with `kind`, switch the sister's gem off with `gem: false`; `grip` is now optional (default per class).

**Owner 12:04: nothing is tied on her.** No belt, baldric, strap, ring or frog anywhere. The only fitting is a hip sword/dagger's OWN scabbard (hangs from nothing, rides on the pelvis bone). Back weapons and the quiver have no fitting at all. So the "needs Tripo" list for scabbard/strap/quiver pieces is **empty**.

**Owner 11:24: default weapons + gem.** Six numbered sheets (one per sister, 3 library options each, ★ default, zero Tripo tokens) with a small faceted gem in a gold bezel in the sister's OWN colour that glows (Points glow through `fx.js emit`, no real light). Defaults: Elina arming sword (#1) · Elika kris pair (#2) · Melika persian bow + persian quiver (#1) · Mobina maul (#1) · Aylin wizard staff (#3) · Aylar long spear (#1). These are library models, test-only until the owner picks real ones.

## Files
- NEW `bluewall/web/assets/rpg/combat/carry.js`.
- `combat/fx.js` (shared, diff): weapons are only loaded there, `carry.create/update/setVisible/dispose`, `ownCalls` stat. 3 lines tagged `// WC1:`.
- `combat.js` (shared, diff): WEAPON schema `kind`, `carry`, `gem`, `grip` optional (+1 `// WC1:` line). `rpg.js`: **not touched** (0 lines).
- `workers/docs/RP4_KIT_API.md`: §6 + new §6a (kind / carry / gem, rule table, unit-weapon convention, cost, "nothing tied on her"). The Project copy `claude/RP4_KIT_API.md` was NOT edited — please sync it from the repo copy.
- `workers/dev/`: `wc1_test.sh` (unit + in-game), `wc1_unit.js`, `wc1_game.py`, `wc1_calls.py` (budget), `wc1_dev.js/.html` + `wc1_dev_build.sh` (harness), `wc1_sheets.py`, `wc1_frames.py`, `wc1_pen.py`, `wc1_cmp.py`, `wc1_sweep*.py`, `wc1_shot.py`, and `rp4_kit_fixtures.js` (+ WC1_SWORD / BIG / PAIR / STAFF / BOW / BARE fixtures).

## Proven
- `bash dev/wc1_test.sh` → **WC1 OK**: 39 unit checks (class defaults, `carry` override, kind from file name, validateKit accepts kind/carry/gem/no grip and refuses bad kind / carry / gem / grip / typos) + the REAL fx.js + carry.js in the RP4 arena for 5 fixtures (short sword hip, big sword back, dagger pair hips, staff hand, bow back + quiver hip): at rest every weapon is at its mount; mid-swap it is scaling and has one parent; 0.16 s after the attack it is in the hand (the quiver stays); 2.4 s after the last blow still in the hand; 3.6 s after sheathed; 600 ticks of fighting never leave a weapon parentless or double-parented; no page errors.
- `bash dev/rp4_test.sh` → **RP4 OK (155 checks)**. `bash dev/gate_w.sh` → **GATE_W: ALL OK** (noRoute 614, baseline 614).
- Frames 844×390 (behind AND side), all looked at full size by me: 4 owner classes (short sword, big sword, staff, bow+quiver) × {rest: idle, walk, sit} × {fight: draw, hit, sheathing, sheathed} = 56 frames, plus dagger pair, spear, hammer at rest. In `photos_WC1.tar.gz` → `frames/`. In-game frames in `game/`. Sheets in `sheets/`. Mount comparisons in `cmp/`.
- Budget (measured on the real renderer, `python3 dev/wc1_calls.py` → WC1 CALLS OK): extra draw calls = **+2** short sword (scabbard + gem), **+2** dagger pair (scabbard + ONE gem; `gem:false` on the 2nd dagger — gems on both daggers = +3, over budget, so the fixture/kit should keep one gem), **+1** big sword / staff / bow+quiver (gem only), 0 lights. Shader programs: **+0** compared with a scene that already draws a static vertex-coloured MeshStandard mesh (terrain.js / gear_shield.js / sc_farm.js do) — see the caveat below.

## Penetration table (Elina rig, library weapons, 33 clips sampled every 0.1 s = 1087 samples, worst cm of a weapon/scabbard surface point inside the skinned body)
| class | carried: worst cm (clip) | samples >1 cm of 1087 | worst per item (cm) | scabbard worst cm | in hand: worst cm |
|---|---|---|---|---|---|
| short sword (hip) | 7.3 (punch_b) | 318 | 0:7.3 | 5.8 | 7.2 |
| big sword (back) | 3.3 (cast) | 121 | 0:3.3 | 0.0 | 8.6 |
| dagger pair (both hips) | 4.9 (cast) | 66 | 0:4.2, 1:4.9 | 2.9 | 8.0 |
| bow (back) + quiver (hip) | 4.3 (kick_a) | 1058 | 0:2.5, 1:4.3 | 0.0 | 11.9 |
| staff (hand) | — (never carried) | — | — | — | 11.6 (cry) |
| spear (back) | 2.8 (cast) | 21 | 0:2.8 | 0.0 | 11.1 |
| hammer (back) | 1.6 (jump) | 22 | 0:1.6 | 0.0 | 9.9 |

Everyday clips (idle, walk, run, jump, sit) are mostly ≤ 3 cm; the worst numbers sit in the extreme clips (punch_b, cast, swim, kick, cry) where the arms swing across the hip. Changes made because of these numbers: big sword mount moved closer to the back (profile gap), spear/hammer mount tightened, quiver moved back (5.0 → 4.3 cm), dagger pair moved out/back (**10.5 → 4.9 cm, >1 cm samples 279 → 66**). Rejected: short sword further out/back (fewer samples >1 cm, 318 → 210, but worst 7.3 → 8.8 cm and ~8 cm in many clips) and the earlier "hip moved outward" variants (≈1.3 cm in everyday clips but the sword visibly floated). The short sword stays at 7.3 cm worst (punch_b), 318/1087 samples > 1 cm.
"in hand" is NOT a clipping measure: the hilt/shaft always passes through the fist and forearm of the glove (5–12 cm in almost every sample).

## NOT proven / caveats (please read)
- The penetration number is a proxy (skinned body vertices vs weapon surface points, consensus sign test), not a collision engine; thin cloth, the cape and concavities can mis-sign, and the bow+quiver count of ≥ 1 cm samples (1058/1087) is a constant ~4 cm overlap of the quiver with the cape/arm volume, not a spike. It is a ranking tool for the mounts, not a guarantee.
- Elina's rig only (other sisters use the same skeleton and 33 clips, but their body/cape shapes differ: the sheets show them at rest, not the full 33-clip scan).
- Sitting: the hip sword/daggers keep their mount while she sits (no seat in the arena); the blade hangs behind and downward — whether it dips below a seat/floor depends on the seat the game puts her on.
- Staff in hand: in the `sit` clip the staff lies across her lap (the hand bone does that); a real kit should give its own `grip` for casts.
- Programs +0 was shown against a scene that has a static vertex-colour MeshStandard mesh (as the game does); in the bare arena without any such mesh it is +1. Not measured inside the full game scene.
- Real phone fps / feel not measured; foot sliding / weapon trail look in motion not judged (only still frames).
- Library models are test-only. The final weapon numbers (`kind`, `len`, `grip`, `carry`) per sister are for RP5a–f; the ★ defaults above are my picks, the owner decides.
- An axe has no model tested (maps to the big-sword mount by default).

## For the mother / RP5a–f
Write each kit's weapons as `{ slot, url, len, kind, [carry], [gem], [grip] }`. `kind` decides the carry place; leave `carry` out unless the owner wants something else; `gem: false` on a 2nd weapon to stay within +2 calls. The unit weapon convention (length 1, blade along +Y, origin at the hold point) is in RP4_KIT_API.md §6a.
