# UI2 — hero-mode markers, arrows and chips in ONE blue / silver language (17 Oct 2026)

Owner (17 Oct): the white glass triangle over her head and the round arrow button with «33 m» are «the worst look». He wants one visual language with the HUD, **blue / silver, not brown / gold** (UI3 builds the shared palette in `workers/docs/UI3_TOKENS.md`; not in the kit yet → `PAL` in `rp_ui2.js` is the one block to map when it lands), and for the head marker his original ask: **a small neon crown + a light of the same colour**.

## Why the crown was gone (RP1C_R3)
Not a technical reason. The owner himself said «no crown anywhere» on 15 Oct 18:40 (after the first crown sample) and asked for a slightly glowing triangle «mention» marker instead (comment at the top of the old `rp_marker.js`, `report_RP1C_R3.md`). On 17 Oct he reversed it. Newest word wins → look 1 is the crown again; the ground ring stays what he fixed on 15 Oct (small, EMPTY).

## What «the grey triangle behind the round arrow» was (found in the real game, before-frames in the photo pack)
Two things sat on top of each other at the top centre: the round chip («37 m» under a round navy button) and the head marker. With the camera low / near, the marker triangle is projected right behind / beside the chip and, close up, it grows to ~85 px. Fix: the chip moves into the top row of the HUD (same row as the X / eye / map / i buttons, `top + 8 px`) and the marker is a small crown that keeps a clear gap above her head.

## Sheet A — head marker (pick a number; default 1)
| # | look | notes |
|---|---|---|
| **1** | **small neon crown** (three points, silver band, pearls on the tips) + same-colour halo + small empty ground ring | default; thin neon line like the ring emblems; her own colour, white-hot core |
| 2 | faceted colour gem in a silver cradle + halo + ring | one solid shape (the crown is a thin line) |
| 3 | thin neon halo ring with a spark + halo + ring | no crown |
Switch in the dev page: `?crown=1|2|3`; in tests `marker.setLook(n)`. The default lives in `rpg.js` (`look: … || 1`).

## Sheet B — distance arrow (pick a number; default 1)
| # | look | notes |
|---|---|---|
| **1** | **plaque**: ONE navy plate with a silver bezel; the arrow turns on the left, «33 m» is inside the same plate | default; nothing hangs under it, no second shape behind it |
| 2 | neon tag: no plate, ice neon chevron + number with a dark edge and a soft dark shade | the ring emblems' thin-neon language |
| 3 | medallion: small round silver-bezel button with only the arrow, the number on a small plate under it | closest to the old button, but in the HUD's blue / silver |
Switch: `?ui2=1|2|3`; in tests `chip.dataset.l = n`. The «Go up» pill and the glass icon over a ramp's foot use the same plate / bezel / ice arrow in every look.

## The language (tokens, `rp_ui2.js` `PAL`)
Plate: deep-blue radial `#2c5aa0 → #0e2350 → #050c1e` (the level plate of `bhud.js`). Bezel: thin silver conic `#f6faff #8aa0c0 #e9f1ff #586f90 #cfdcf0` (the round buttons of `bhud.js` / `assist.js`). Accent: ice `#8fe8ff`. Type: white `#eef6ff` with a dark edge. No gold / brown anywhere (`ui2_node.mjs` asserts it).

## Not touched (named so nobody wonders)
`.rp-b` action buttons, joystick, X / eye / map / i, the sister strip (RS1 / RS2) and the door icons (`doors.js`, state-coloured rim) keep their look: they are already silver glass and are other chats' files. Optional later: align the `.rp-b` teal glow `rgba(61,245,224,…)` to the ice accent (one CSS line, `rpg.js` `.rp-b` / `.rp-joy` / `.rp-x`).

## Frames (in `photos_UI2.tar.gz`, full size 844 × 390, headless software GL — not a phone)
- `sheets/UI2_A_marker_{day,night}.png` and `sheets/UI2_B_chip_{day,night}.png`: the four numbered sheets (rows: grass 33 m, stone 33 m, grass 300 m, stone 300 m; columns 1 / 2 / 3).
- `day/`, `night/`: every frame of the sheets at full size. `A_…_L<n>` = marker look n (chip look 1); `B_…_L<n>` = chip look n (marker look 1).
- The two **300 m** rows are placed with the ramp feet shifted by a solver (flat ground; there is no flat ground 300 m from a ramp). Only the chip's number / arrow depends on the shift. The real 300 m spot (a steep rock slope) is in `extra/`.
- `before/`: the kit as it was (old white glass triangle + round arrow button; `before_ramp_side7` / `before_ramp_back12` show the button sitting on the triangle on her head). `ramp_icon/`: the same two situations after UI2, plus the glass icon over a ramp foot (9 m) and the «Go up» pill, day and night.
