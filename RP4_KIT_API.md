# RP4_KIT_API — how a sister's fighting kit is written (Round 2, 14 Oct 2026)

**For RP5a–f. Each of you writes ONE file: `web/assets/rpg/combat/kit_<sister>.js`** (`elina elika melika mobina aylin aylar`). Elina's is done and is the reference. You do not touch `combat.js`, `combat/fx.js`, `hud.js`, `foes.js`, `rpg.js`, or anything else. A kit is **data only** — no code, no imports. The engine loads it, checks every field, and refuses a kit with a single error (it names the field path).

## 0. Your 6 steps
1. `git pull` the `kit` branch (it has `combat.js`, `combat/*`, `dev/rp4_*`).
2. `cp dev/rp4_kit_template.js web/assets/rpg/combat/kit_<sister>.js` — change `id`, `element`, numbers, clips, icons. (The template is Elina's kit with every field explained.)
3. `bash dev/rp4_kit_check.sh <sister>` — must end with **`KIT OK`**. It prints a table of every beat / skill (real-time hit moments, damage per chain) so you can see what you built.
4. Look at it: build the arena once with `bash dev/rp4_dev_build.sh`, serve `dev/` (`python3 -m http.server 8766` inside `dev/`), open `http://127.0.0.1:8766/rp4_dev.html?hero=<sister>&sister=<sister>` (her own GLB + her kit; `&kinds=soldier,beast` picks the placeholder enemies; keys J attack · K dodge · U / I skills · F hold = guard · L lock). Take full-size frames from behind (`__rp4.setCam(0.2, 0.22, 4.6, 50)`) — see `dev/rp4_proof2.py` for ready scripts.
5. A weapon model is allowed **only if the owner picked it by number from a sheet** (never hand-built, never recoloured). Until he picks, use the library sword (`combat/sword_arming.glb`) or no weapon (`weapons: []`).
6. Push only `kit_<sister>.js` (+ the owner-picked weapon `.glb` under `web/assets/rpg/combat/`) and your report.

## 1. Units
Times in beats / skills / block = **clip seconds** (the clip's own clock). `rate` plays the clip faster (real time = clip time ÷ rate). `t0` = where in the clip to start (for the long clips `cast`, `bow`). Arcs = **degrees**. Distances = metres. `dmg` = multiple of ATK (**100**), times `hero.atk`, times the element multiplier. `cd` = real seconds. `lunge: [metres, from s, to s]` (clip time) = the forward step during the beat.

## 2. Top level — `export default { ... }`
| field | | range / values | meaning |
|---|---|---|---|
| `id` | required | the file's sister id | must equal `kit_<id>.js` |
| `element` | required | `fire ice water plant stone wind` | must match the sister (checked); «خاک» = `stone` |
| `role` | | ASCII text | for docs |
| `weapons` | | 0..2 entries | see §6 |
| `trail`, `trailWeapon` | | bool, 0..1 | slash ribbon on/off, which weapon draws it |
| `autoTurn` | | 1..12 m (3) | attack / skills turn to the nearest enemy inside this |
| `hero` | | `hp 100..5000 (600)` · `stamina 50..300 (100)` · `regen 5..100 /s (30)` · `armor 0..2 s (0.5)` · `atk 0.5..3 (1)` | `armor` = after a hit, further hits inside this time (+ the 0.38 s stun) do not interrupt her — a tank has more |
| `block` | | §5 | the guard |
| `icons` | | `attack skill1 skill2 block` each one of: `sword dagger bow hammer staff spear flame burst wave heal shield gust bolt snow leaf quake beads buff` | the four buttons show icons only (no text) |
| `combo` | required | 1..6 beats | §3 |
| `skills` | required | **exactly 2** | §4 |
| `clips` | | extra clip names | normally leave out; the engine collects the ones you use |
| `note` | | text | free |

Every unknown field is an error (`kit.combo[1].dmgg: unknown field (allowed: …)`), so typos cannot pass silently.

## 3. Combo beats (`combo[i]`)
The player's next press inside a beat's **cancel window** starts the next beat; after the last beat the chain restarts. The last beat is the **finisher** (it may `stagger`). A beat is `type:'melee'` (default) or `type:'shot'`.
| field | range (default) | |
|---|---|---|
| `clip`, `dur` | clip name, 0.2..3 | the clip and its length (checked against the GLB: `t0 + dur` must lie inside the clip) |
| `rate` / `t0` | 0.5..2.5 (1) / 0..10 (0) | playback speed / start offset |
| `hit` | `[a, b]` ⊂ `[0, dur]` | **damage window**; each enemy inside `arc`/`reach` is hit once per window |
| `dmg` | 0.1..6 | × ATK |
| `arc` / `reach` | 10..360° (110) / 0.5..8 m (2.2) | cone in front of her / distance from her centre |
| `lunge` | `[0..4 m, from, to]` | forward step (optional) |
| `cancel` | 0.05..dur (≈70 %) | from this clip time the next press chains; must be ≥ `hit[0]` |
| `stop` / `knock` / `poise` | 0..0.2 s (0.055) / 0..6 m (0.3) / 0..400 (22) | hit-stop · knock-back · poise damage (poise full = enemy staggers) |
| `stagger` | bool | forces a stagger (finishers) |
| `finisher` | bool | the last beat is one automatically |
| `trail` | `[[from,to],…]` | windows where the ribbon is drawn (default = the hit window) |
| `hit2` + `dmg2` + `sec{arc,reach,stop,knock,poise}` | | a second, lighter hit window later in the same clip, used only if the beat is not cancelled |
| `status` | §4b | applied to enemies it hits |
| `shot` | `{speed 1..40, range 1..40, radius 0.1..4, pierce, vis 'bolt'\|'crescent', count 1..5, spread 0..90°}` | **required for `type:'shot'`** (bow, staff bolt): a projectile leaves at `hit[0]`; `dmg stop knock poise status` of the beat apply to it |

## 4. Skills (`skills[0]` = button 1, `skills[1]` = button 2)
`{ id, name (ASCII), icon, cd 1..90 s, clip, dur, at, rate, t0, lunge, cost (stamina 0..100), effects:[1..4] }` — at clip time `at` **all** effects fire together. `at` ≤ `dur`.
| effect | fields | notes |
|---|---|---|
| `projectile` | `speed range radius dmg count(1) spread(°) pierce(true) vis('bolt'\|'crescent') + stop knock poise stagger status` | `crescent` = the flame-wave ribbon, `bolt` = a bright head with sparks. `count>1` fans out. |
| `aoe` | `shape 'circle'\|'cone'`, `radius 0.5..12`, `arc` (cone, 20..360°), `offset 0..8`, `dmg 0..8` + hit fields | circle = a ring around her; cone = in front. `dmg 0` is legal **only** with a `status` or `knock` (a crowd-control ring). |
| `heal` | `amount 0.01..1` (fraction of max HP), `dur 0..12 s` | `dur 0` = instant, otherwise spread over `dur` |
| `shield` | `absorb 0.01..2` (× max HP), `dur 0.5..20` | the shield is drawn on her + the HUD ring |
| `buff` | `stat 'atk'\|'dr'\|'rate'`, `mult 0.2..3`, `dur 0.5..30` | `atk` damage ×, `dr` damage taken ×, `rate` combo speed × (the beats play faster) |
| `stamina` | `amount 1..100` | instant refill |

### 4b. Statuses on enemies (`status: {id, dur, …}`)
`slow {k 0.1..0.9 = speed ×}` · `freeze` (stunned; ice-blue) · `root` (cannot walk, can still strike; green) · `burn {dps 0.01..2 × ATK per second}` (orange flicker; ticks every 0.5 s, shown as small orange digits). `dur 0.2..10 s`. The enemy's `cc` factor scales slow / freeze / root (brutes resist ×0.5); burn is not scaled.

## 5. Block (`kit.block`) — the shield button left of the attack button (hold) / keyboard `F`
`{ clip 'block', arc 30..360 (120), dr 0..1 (0.25), cost 0..2 (0.3), raise 0..0.5 s (0.10), turn 1..30 (10), walk 0..3 m/s (0), push 0..6 (1.5), breakSt 0..100 (20), stop, t0, dur }`.
Hold = after `raise` seconds, a hit from inside the front `arc` does `dr` × damage; the hero turns to the lock target / stick direction / nearest enemy; a clean block does **not** stun (small push, sparks, blue digit). Each blocked damage point costs `cost` stamina; no stamina regen while guarding (+0.6 s after). If stamina runs out the **guard breaks**: part of the hit goes through, she staggers, red flash, and she cannot guard again until stamina ≥ `breakSt`. Hits from outside the arc land in full. A tank: `arc 180, dr 0.1, cost 0.2, walk 1.2`.

## 6. Weapons (`weapons[0..2]`)
`{ slot 'R'|'L', url 'combat/<file>.glb', len 0.2..2.5 m, grip { b:[x,y,z] blade direction in the hand's space, pos:[x,y,z] }, tip 0..1.3 (0.92), root 0..1.3 (0.62) }` — parented to `R_Hand` / `L_Hand`. `tip`/`root` = where along the blade the trail's two edges sit. **A model enters the game only with the owner's number from a sheet.** Check each new weapon from behind and from the side on `slash_a/b/c/heavy` (see `dev/rp4_behind.py`). The validator allows ≤ 2 weapons; keep each model light (the RP4 budget is +10 draw calls in total with 6 enemies).

## 7. Elements (data in `combat.js`: `ELEMENTS` 9 · `BEATS` · `HARMONY` 7 · `elementMult` · `harmonyOf`)
Two triangles, `A → B` = A beats B (×1.5 to B; B takes ×1.5 from A; A takes ×0.75 from B): **water triangle** fire → ice → water → fire · **earth triangle** plant → stone → wind → plant. **Light** burns all six; only **shadow** and **turquoise** (فیروزه) eat it. Everything else ×1. Harmony pairs: fire+wind **firestorm**, plant+stone **thorn fort**, water+ice **frozen wave**, fire+water **hot mist**, wind+ice **blizzard**, plant+water **healing garden**, stone+fire **lava**. *(The book says «خاک» in two places; the six sisters have `stone`, so `stone` it is.)* The engine multiplies each hit by `elementMult(kit.element, enemy.element)`. **Harmony is data only so far — no gameplay uses it yet** (that is the "two sisters" round).

## 8. Clips (all six GLBs carry the same 33, same lengths — RP0B)
Fighting: `slash_a 0.43` · `slash_b 0.53` · `slash_c 0.70` · `heavy 0.93` · `block 0.84 (loop)` · `cast 5.38` (use `t0` + `dur`) · `aim 1.50` · `bow 6.00` (`t0` + `dur`) · `punch_a 2.21` · `punch_b 2.79` · `kick_a 2.50` · `kick_b 1.38`. The engine itself plays `hit 1.29`, `knockdown 3.00`, `death 4.00`, `dodge 1.70`, `idle`, `walk`, `run`. Others (`jump fall land talk cry look_around cheer angry sit_down sit_idle stand_up swim climb interact`) are not combat clips. A clip name that is not in the list is an error.

## 9. What `rp4_kit_check.sh` proves (so you do not have to)
`validateKit` (every field, range, unknown fields, clip names + `t0+dur` inside the real GLB) · every beat connects with a dummy, in order, and the chain restarts · cancel windows · each skill effect really does what it says (projectile reaches, area catches, heal heals, shield absorbs, buff active, stamina refills, status applied) · the skill's cooldown · statuses behave (slow slower, freeze / root stop, burn hurts) · the guard works in front and **not** behind (arc checked at ±) · weapon files exist · text is ASCII (no Persian / no "bot" in the hero UI) · a 25 s random fight (all buttons, 5 enemies) has no NaN and is **deterministic**. It does **not** prove feel, balance across sisters, or that a weapon looks right in her hand — that is for your frames and the owner's phone.

## 10. Hard rules (unchanged)
Icons and digits only in the hero UI (no Persian text, no «bot») · no model without the owner's number from a sheet · never hand-build or recolour a character · ≤ 6 enemies, telegraph ≥ 0.5 s (engine-enforced) · budgets: boot +0 B, ≤ +10 draw calls, ≤ +60k tris with 6 enemies, ≤ +4 programs, no per-frame allocation (the kit is data, so you cannot break these) · don't touch castle / town / battle / economy / server `*.py` / `pkg/` / `dev/gate*.sh` / `web/app/*`.

## 11. Known limits (honest)
Real-phone feel is the owner's to judge (`RP4_judge_3min.md`) · lunge distances are tuned by eye (foot sliding not measured) · `shot` beats and `bolt` projectiles were verified with test fixtures (bow / spear / hammer / dagger / staff archetypes in `dev/rp4_kit_fixtures.js`, **test-only and unbalanced — copy ideas, not numbers**) · only Elina's real kit exists.
