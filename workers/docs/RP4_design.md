# RP4 — combat core · design (R1 final, 14 Oct 2026, kit = p47 + RP0B) — for the mother
Files (new only): `web/assets/rpg/combat.js` (PURE engine + data tables + `attach()`), `web/assets/rpg/combat/{fx,hud,foes}.js` (lazy ES modules) + `combat/sword_arming.glb` (162 KB, library sword), dev page `dev/rp4_dev.html` (+ `rp4_dev.js`, build `rp4_dev_build.sh`), tests `dev/rp4_test.sh`, hook diff `rpg_hooks_RP4.patch` (12 changed lines, every added line `// RP4:`, applies on the kit that already has RP1B).
**The combat clips are the hero GLB's own** (RP0B: `slash_a slash_b slash_c heavy block`, 33 clips per sister) — RP4 ships NO clip file any more (the first-round `clips_sword.glb` is gone).
Every number below is a constant in `TUNE` / `SISTERS` / `ELEMENTS` / `KINDS` (combat.js). The owner's 6 knobs are marked ★ (see `RP4_judge_3min.md`).

## 1. Numbers
| what | value |
|---|---|
| step | fixed 1/60 s, separate from rendering (host passes dt, the sim sub-steps) |
| hero | HP 600 · stamina 100, +30/s after 0.6 s idle · dodge costs 25 · light hits cost 0 · skills: cooldown only |
| light combo (Elina, sword) | 4 hits, ATK 100: ×0.8 / ×0.9 / ×1.0 / ×1.8 (finisher). ★ combo speed 1.0 (0.7–1.4) |
| hit 1 `slash_a` 0.43 s | hit window 0.19–0.29 · arc 110° · reach 2.1 m · lunge 0.8 m · cancel from 0.30 · stop 55 ms · knock 0.3 m |
| hit 2 `slash_b` 0.53 s | 0.20–0.32 · 110° · 2.2 m · lunge 0.9 m · cancel 0.34 · 55 ms · 0.3 m |
| hit 3 `slash_c` 0.70 s, played ×1.2 (0.58 s) | 0.29–0.43 clip-s · 120° · 2.3 m · lunge 0.7 m · cancel 0.49 · 65 ms · 0.5 m |
| hit 4 `heavy` 0.93 s | strike 0.26–0.38 · 140° · 2.6 m · lunge 1.2 m · cancel 0.56 · ★ stop 90 ms · knock 1.6 m + stagger. **Second sweep** 0.58–0.69 (the clip's rising swing) hits again ×0.7 if the player does not chain out of it (cancel 0.56 comes first) |
| chaining | a press during the swing buffers the next hit (0.30 s buffer); the next hit starts at the cancel time; 0.30 s grace after the end; no input → the combo resets |
| dodge (roll) | 0.62 s · ★ i-frames 0.04–0.34 s (0.30 s) · 4.4 m ease-out · recharge 0.8 s · cost 25 · can cancel an attack from its cancel time · perfect dodge (a strike lands inside the i-frames) → event + 25 stamina back |
| skill 1 Flame Wave | cd 6 s · clip `slash_b` · at 0.22 s a fire crescent flies 15 m/s, 12 m, 2.2 m wide, pierces, ×2.2 · stop 70 ms |
| skill 2 Ember Burst | cd 14 s · clip `cast` ×1.2 (first 0.9 s) · burst at 0.55 s: radius 5 m, ×3.0, staggers, knock 3 m · stop 110 ms |
| hit stop | freezes the hero and the victim only (their `freeze` timers; measured: hit tick 11, hero frozen 4 ticks, foe 3 ticks) |
| ★ camera shake | 0.015 (light) … 0.05 (finisher/burst) world units, 0.18 s decay, damped sine, `TUNE.shake` ×1.0 |
| ★ auto-turn range | 3.0 m: an attack turns the hero to the lock target, else the nearest enemy within 3 m, else the stick direction, else keeps facing |
| lock-on | nearest enemy in a ±65° cone of the camera, ≤ 18 m; drops at 24 m or on death (re-acquires ≤ 8 m); `lockNext` cycles by angle; the sim exposes `lockYaw()` and the host's camera yaw eases toward it (measured: 0.25 → 0.3425 vs target 0.3430) |
| hero hurt | hit stun 0.38 s with 0.5 s hyper-armour after · one hit ≥ 25 % HP → knock-down 1.1 s + 0.5 s i-frames on waking · HP 0 → `dead`, the host revives after 2.8 s |
| elements | advantage ×1.5 · disadvantage ×0.75. Triangles fire→ice→water→fire and plant→stone→wind→plant (`A→B` = A beats B; read from the RTL chain `آتش←یخ←آب←آتش` — **mother: confirm the direction with the book**). The 7 «harmony» pairs are not in the docs I was given: `HARMONY = []` stub (RP5 fills) |
| enemies (placeholders) | `soldier` HP 240, 3.3 m/s, reach 1.9, telegraph 0.6 s, dmg 70 · `beast` 320, 4.8, 1.9, 0.5 s, 90 · `brute` 650, 2.2, 2.7, 0.9 s, 160. All: strike 0.15 s, recover 0.8 s, stagger 0.7 s, max 6 alive, max 2 attacking at once, aggro 14 m |
| ★ telegraph | ≥ 0.5 s: the strike direction freezes at half the telegraph, so a roll through it always works |

## 2. State machines
```
HERO   loco ──atk──▶ ATK[n] ──(buffered atk ≥ cancel)──▶ ATK[n+1] … ATK[3] ─▶ loco (combo reset)
        │  ▲            │ end / no input ─▶ loco (grace 0.30 s keeps n)
        │  └─ end       └─dodge(≥cancel)─▶ DODGE
        ├─skill1/2──▶ SKILL ──end──▶ loco        loco/atk/skill ──hurt──▶ HIT ──0.38 s──▶ loco
        ├─dodge────▶ DODGE ──0.62 s──▶ loco      hurt ≥ 25 % ──▶ DOWN 1.1 s ──▶ loco (i-frames 0.5 s)
        └─ HP 0 ───▶ DEAD (host respawns)         i-frames: DODGE 0.04–0.34, DOWN-wake 0.5, HIT hyper-armour 0.5
ENEMY  idle ─(hero ≤ aggro)─▶ chase ─(≤ range)─▶ windup(tele) ─▶ attack(0.15 s) ─▶ recover(0.8 s) ─▶ chase
        any ──(poise ≥ max | finisher | burst)──▶ stagger 0.7 s ──▶ chase      any ──HP 0──▶ dead(1.2 s) ─▶ removed + `kill`
```

## 3. Clip table — built from the REAL clips of `web/assets/rpg/elina.glb` (33 clips, RP0B)
Measured (my scratch scripts decode the GLB and sample every clip at 60 Hz; the numbers are in the table): the sword-tip speed per frame (blade along the grip axis, 1.7 m hero) decides the hit windows; every duration is read from the accessor of the file (and checked by `dev/rp4_test.sh` against the file: «combo durations = the real clips»).
| use | clip | dur | what the data says |
|---|---|---|---|
| idle / walk / run / jump / fall / land | same names | – | host (rpg.js) keeps them |
| hit 1 | `slash_a` | 0.43 | tip peak 67 m/s @ 0.25; hot 0.22–0.27 → window 0.19–0.29 |
| hit 2 · skill 1 | `slash_b` | 0.53 | tip peak 87 m/s @ 0.27; hot 0.22–0.30 → window 0.20–0.32 (the wave leaves at 0.22) |
| hit 3 | `slash_c` | 0.70 | starts on the pose where `heavy`'s slam ends; 0.07–0.27 is a near-still low hold (tip < 3 m/s) then the up-slash 0.30–0.42 (peak 29 m/s @ 0.37) → window 0.29–0.43, played ×1.2 so the hold does not feel dead |
| hit 4 | `heavy` | 0.93 | 0–0.27 sword raised high (tip y up to 2.3 m: it IS an overhead wind-up), slam 0.27–0.37 (peak 65 m/s @ 0.30), hold on the floor 0.40–0.57, rising sweep 0.58–0.69 (32 m/s) → strike 0.26–0.38 + second sweep 0.58–0.69, two separate trail windows |
| (not used in R1) | `block` | 0.84 loop | a guard hold, tip 2.6 m/s: proposal for R2 = a guard button (damage ×0.25 from the front 120°, stamina on hit) |
| skill 2 | `cast` window 0–0.9 s | 5.38 | ×1.2; a quiet pose, the burst ring + sparks carry it |
| dodge | `dodge` | 1.70 | ×2.74 (0.62 s) |
| hurt / knock-down / death | `hit` 0–0.45 ×1.2 · `knockdown` 0–1.8 ×1.6 · `death` | 1.29 / 3.0 / 4.0 | |
| not mine | `sit_*`, `swim`, `climb`, `interact` | | RP1C/RP1B |
**The sword** is not in the hand in the GLB. It is ONE mesh (library `sword_med_arming`, owner never answered the sheet → default #1, 1160 verts / 1800 tris, one 1024 webp) parented to the `R_Hand` bone (blade axis `b = (-0.8, 0.6, 0)` in the bone frame, grip offset 0.035 m, 0.95 m long). Checked on all four RP0B clips from behind and from the side: the fist holds the grip, the blade continues the forearm in the thrusts. Known weak spot: the fingers stay at the rest pose (open hand on the hilt).

## 4. The player watches from BEHIND (owner, 14 Oct 21:11)
The host camera already sits D = 3.6 m back and 0.55 m over her right shoulder. In a fight `fx.js` adds (eased in 0.4 s, out 0.9 s, subtracted at `pre()` and added at `frame()`, same mechanism as the shake):
- **fight framing**: 0.3 m up, 0.6 m back, and sideways only as far as is missing to put her 40 % of the half-width left of the centre (cap 0.8 m; a phone in portrait is already past that, so it gets only up/back). It is dropped (0.12 s) where a pillar / the cave edge would be at the camera (`under.colliders`, `under.BOUND`). The effect is modest by design: with the target 1–2 m behind her the host camera already shows the enemy's head over her shoulder.
- **red edge arrows** (pool of 3 DOM chevrons, icons only) for every enemy in `windup`/`attack` that is outside the frame (left/right/behind the camera) — they pulse during the windup and are solid during the strike; they stay clear of Telegram's header and of the stick.
- the telegraph wedge on the ground, the lock marker and target bar are unchanged; lock-on camera yaw assist turns the view toward the target (so a target behind her comes into the frame).
Proof: `photos/behind_framing.png`, `behind_alerts.png`, `lock_strip.png`, `portrait_390.png`, `game_combo_strip.png` (the real game, 390×844).

## 5. Touch input (same glass + turquoise style, icons + digits only)
Joystick (left half) and look-drag (right half) stay. **Attack** = the big button (bottom right; jump / sprint move up and dodge left of it through `hud.moveHost`). Skill 1 / skill 2 = two smaller buttons on an arc, each with a cooldown ring + digits. **Lock** = under the host's top-left column (below exit / camera / gate): tap = toggle, a second tap within 0.4 s = next target. All offsets use the same TOP/BOT expression as the host (Telegram safe areas). A thumb never aims: the attack auto-turns (★ auto-turn).

## 6. Data tables
`ELEMENTS`: fire `#ff6a3a` (Elina) · wind `#9fe8ff` (Elika) · plant `#7fe06a` (Melika) · stone `#f0a666` (Mobina) · water `#4fb0ff` (Aylin) · ice `#cfeeff` (Aylar). `SISTERS`: per sister `{element, role, weapon, clips, combo[], skills[2]}`; **Elina is complete**, the other five are stubs `{…, combo:null, skills:null}` for RP5a–f. `KINDS` = the three placeholder enemy kinds.

## 7. Budget (measured, dev arena, software GL, fresh page per row)
| case | draw calls | triangles | programs | JS ms / frame |
|---|---|---|---|---|
| A arena + hero, no combat | 6 | 19,280 | 3 | – |
| B combat attached, idle | 10 (+4) | 22,060 (+2,780) | 6 (+3) | 0.26 |
| C combat + 6 beasts fighting | 16 (**+10**) | 37,204 (**+17.9k**) | 7 (**+4**) | 0.79 |
| D 2 soldier + 2 beast + 2 brute | 46 (+40) | 59,614 (+40.3k) | 12 (+9) | 0.45 |
Own FX = 3 draw calls (sword, ribbon, points), ~2.3k tris, 3 programs; DOM HUD costs no GL. Rows A–C meet the budget (≤ +10 / ≤ +60k / ≤ +4). **Row D does not:** the placeholder soldier (10 meshes) and brute (7 meshes) are multi-mesh models; the real RP6 enemies must be ≤ 1–2 meshes each. The sim itself costs 6–16 µs per tick with 6 enemies (Node). No allocation in the hot loop (pooled events, ribbon, particles, DOM digits and arrows). `setQuality(0..3)` (0 full … 3 lowest, as asked; measured live particles after a fight burst 63 / 45 / 27 / 0): 1 = particles ×0.7; 2 = ×0.4, no embers, shake ×0.8, enemy poses every 2nd frame (not while they wind up / strike); 3 = no particles, no slash trail, shake ×0.5, enemy poses every 3rd frame. No light is ever added.
Boot bytes: `combat*` is not referenced from `client/src` or `wall.js` (lazy `import()` inside rpg.js, only in hero mode in the underworld); the bundle size does not depend on these files. Programs with the hero off: identical (nothing is built until `attach()`).

## 8. The hook (`rpg_hooks_RP4.patch`, 12 changed lines)
`loadHero` returns `clips`; `S.cmb.pre(dt, S, wantX, wantZ, m)` after `const air`; `else if (!cb)` on the locomotion velocity; `S.cmb.post(dt)` after `animate(dt)`; `S.cmb.frame(dt, now)` after `camera.updateMatrixWorld()`; `S.cmb.key(c)` in `onKey`; `attach(...)` in `goUnder` (inside try/catch) and `dispose()` in `goHome` + `exit`.

## 9. Not proven / open
Real phone fps and the FEEL of every timing (owner, 3 minutes, `RP4_judge_3min.md`) · foot sliding (lunge distances are tuned by eye against in-place clips) · enemy variety (3 placeholder kinds only) · the camera framing in a narrow tunnel (only the pillar/edge check exists) · the direction of the element triangles and the 7 harmony pairs (mother / RP5) · `block` is unused · fingers do not wrap the hilt · placeholder enemies exceed the call budget when soldier/brute are used.
