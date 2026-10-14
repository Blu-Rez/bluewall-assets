# TR2_gaps — additions from TR2-S4d (animals + villagers)  · 14 Oct 2026
Rows continue the numbering of `TR2_gaps.md` §1 (14–16 are already there; this file says what S4d actually met). Nothing here is hand-built or recoloured.

## خلاصه برای وینگلس
حیوون‌ها و روستایی‌ها الان مدل Tripo هستن، ولی **حیوون‌ها پا نمی‌زنن** (مدل ثابته؛ فقط سُر می‌خورن با تکون ملایم)، **پرنده‌ها بال نمی‌زنن**، **روستایی‌ها فقط راه‌رفتن دارن** (کار/نشستن/صحبت = ژست ایستاده)، و **ابزار تو دستشون نیست**. برای اینکه خوب بشه، چت مدل‌ساز باید ریگ + کلیپ بسازه (ردیف‌های ۱۴–۱۶ و ۱۸–۲۲ پایین).

## What the game still needs for this area
| # | what | where | today (S4d) |
|---|---|---|---|
| 14a | **Quadruped rig + clips** idle / graze (head down) / walk / trot / gallop for `animal_cow`, `animal_calf`, `animal_horse_*`, `animal_sheep`, `animal_lamb`, `animal_pig`, `animal_dog`, `animal_wolf` | `pas_life` (paddock horses, cows), `wslife` (pens, cart horses), `life` (dogs, wolf pack) | static model; `tr2_life.js fauna()` moves it with a procedural gait (body bob / roll / pitch by mode, speed-scaled); **legs do not move → visible foot gliding when walking** |
| 14b | cow colour variants (the old code had 5 hides: black, black-white, red, brown-white …) | pastures, pens | ONE Tripo cow (`animal_cow`), all cows look alike — buy 2–3 hides as separate models |
| 14c | swan, mallard (drake + hen), duckling | `water_life.js` lake / moat | procedural low-poly birds stay (not replaced) |
| 14d | donkey / camel / goat in game slots | nomad camp, cart, hill pen | `animal_donkey`, `animal_camel` are in the library but no S4d slot uses them (the camp is not in §1 of S4d); no goat model |
| 15 | **bird flap clips** (eagle, crow, dove) | `life.js` | static flying pose: eagle circles + banks, crows glide in a ring over the fields (the old flap is gone) |
| 16a | **villager clips**: idle (real breathing idle, today = freeze frame of the walk with feet together), run, hammer, chop, pick, carry, fish-cast, sit, kneel/repair, talk, wave | `wslife` (workers), `units.js` (town), `pas_life` (trainer, riders) | only `walk`; every other clip name = the frozen standing frame |
| 16b | **sit pose / seated variant** for the fishermen in boats and on benches | `wslife` fishery boats | the fisherman stands in the boat |
| 18 | **tools as separate props** matching the Tripo biped's hand bones (`L_Hand` / `R_Hand`): axe, pickaxe, fishing rod, hammer, pitchfork, sack | `wslife makeTool` | no tools in the hands (the old tool props were fitted to the old rig) |
| 19 | children / old woman variants in the game's crowds (`villager_boy/girl/littlegirl/oldwoman` are in the library) | `crowd.js` town crowd, `units.js` | not used — the game has no child/old slots yet (needs a decision: S5 town life?) |
| 20 | rooster / hen / chick **walk + peck clips** | `life.js _hensT` | static bodies, bob only |
| 21 | leaping fish: carp **swim / flop clip** | `water_life.js` | static carp tumbling through the leap arc (works fine for a 0.85 s jump) |
| 22 | heads for the old peasants are no longer needed with Tripo villagers; `peasanthead.js` stays as the fallback only | | |

## Tool / loader bug found (not mine to fix; S2/S3 file)
`tr2lib.parts()` for **pack nodes** (`birds/*`, `poultry_fish_pack/*`, all `*_pack` nodes) resets the node's translation AND scale: the part comes out **centred** (base at −h/2, not at y = 0) and its swap `k` is off by 1/(node scale) (dove came out 7.9 m instead of 1.1 m with `k`). S4d works around it in `tr2_life.js partsOf()` (re-bases by bounding box, always passes `w`/`h`). The real fix belongs in `tr2lib.parts` (keep the node's offset, or re-base) — S3/S4a/S4c will hit it with trees/rocks/lamps.
