# ROUND5_JOBS — mother 2, 16 Oct 2026 (kit 6ed3f77: six new sister heroes + GR1_R3 + ST1_R3 merged; p57 NOT built yet)

Common rules = `ROUND4_JOBS.md` § Common rules (full access, % line, own files only, 844×390, gate ALL OK, noRoute < 700, +0 programs, no word «ربات» in texts).
**Kit changed under you:** `git fetch && git reset --hard origin/kit` first. The six heroes (`aylar aylin elika elina melika mobina`) are NEW models (Tripo Studio, mixamo skeleton with the game's bone names, the game's 33 clips retargeted — `workers/dev/sis_build.py`). Same bone names (`Hip Pelvis Spine01..03 Head L_/R_ Thigh Calf Foot ToeBase Hand`), 66 joints, no face / eye bones, each ≈ 3.2 MB.

---
## R1 · RP1C_R4 — hero «i» info page + QA1 camera list  ·  push `RP1C_R4`  (the RP1C chat; owner of `rpg.js`, `rp_*.js`, `doors.js`, `ramps.js`)

### 1. The info «i» (owner's words: «a small round info sign at the top; the player taps it; that page says what they hold in their hands, on their legs, the info and so on»)
- **Where:** on every hero card of the picker (`openPick()` in `rpg.js`, the `.rp-card` tiles) — a **small round «i» button in the top corner of the card** (≥ 30 px visible, 44 × 44 px hit area, it must not start the game: `stopPropagation`), and the same «i» in the hero-mode HUD (next to the existing round buttons, top row) for the hero you are playing.
- **What opens:** a full-screen **landscape info page** for that sister (same family as the soldiers' info page: read `client/src/unitcards.js` `createUnitPage` + `ui_theme_r4.js` for the look and the 44 px close button; reuse the style, do not copy the code if you can call it). Left pane = her big card picture (`rpg/c_<k>.webp`), right pane = scrolling text. Close = the X button (44 px), the Android / Telegram back button and a tap on the dark edge; the pick screen underneath stays open and works afterwards.
- **Text (Persian, short lines, one block each):** 1) name + one-line role (from her kit class), 2) **در دست‌ها / in her hands** — the weapons her kit carries and where (hip / back / hand — read `combat/carry.js` + `kit_<k>.js`), 3) **پاها / legs & feet** — what she wears below the waist and on the feet, read off the card picture (boots, skirt, trousers), 4) **لباس** upper body / cloak / colours, 5) **توان‌ها** her skills from the kit (names + one line each), 6) a two-line **story** line. Only facts that are true for the model or the kit; invent nothing about numbers. **The words «bot / ربات» never appear.** Put all texts in ONE data table (`rpg/hero_info.js` or a block at the top of `rpg.js`) so the owner can edit them.
- **Proof:** frames at 844×390, 800×360, 932×430 of: pick screen with the «i» on all six cards, the info page of two sisters, after close (pick screen intact), the hero HUD «i». +0 shader programs, no new texture > 100 KB. A test `dev/rp1c4_info_test.*` (open → text present → close → pick usable → no console error) added to your own tests (mother adds it to the gate).

### 2. QA1 camera list (`QA1_TRIAGE.md` § RP1C, 11 items: 006 007 008 009 010 016 017 042 051 052 …)
The third-person camera collapses to 0.55–1.3 m behind her at the keep forecourt (S04), the vault row (S15), the windmill (S20), the inner wall (S25), bridge 4 (S32): the frame becomes the back of her hair. Fix in `placeCamera` / the camera spring: keep ≥ 2.2 m (shrink the FOV offset / raise the camera / fade her hair instead of crossing the wall); never inside a solid. **051:** no bridge has a side collider — collider is TR2's (parapets) but the *slope limit* and the side push-out are yours: 13 bridges × 3 places × 3 s sideways push must keep her on the deck or let her fall into the river by the wade rule, never hover. **052:** the inner wall face texture is TR2 / GR1, tell mother, do not touch.
Show: before / after at the same stations (844×390), full size.

### 3. Check the six new bodies (10 minutes, then move on)
Ramp walk (up and down), swim entry, door open with each of the six, foot IK on stairs, the F9 warm-up (each hero is a new GLB of 3.2 MB). Report anything that is body-specific (a foot that floats, a hem through the leg, a head marker at the wrong height) with the hero name.

**Not proven (say it in your report):** the feel on the phone.

---
## R2 · TR2_H_R4 — QA1 TR2 list (20 items)  ·  push `TR2_H_R4`  (the TR2 chat; owner of `castle_tr2`, `b2_homes`, bridges, mine portal, domes)
Read `workers/docs/QA1_TRIAGE.md` § TR2 (20 items: 013 014 028 035 038 041 046 047 058 065 069 086 088 089 124 131 132 142 143 144). Group them: **A) torn / melted walls** (035 046 086 — sheared triangles on cottages: probably the atlas UV or a skinned-wall pass; find the cause, fix once); **B) black holes** (014 069 038 — keep forecourt pure black ⅓ of the frame, mine portal flat black: give depth, inner frame, a dim fill); **C) bridges** (051 side colliders — parapet colliders at all 13 bridges; 058 / 131 / 065 / 142–144 loose planks and z-fight at the bridge ends — GR1_R3 already ramped the heads, kit has it); **D) sizes / looks** (088 four 4 m dark pillars round the plaza crystal, 089 a roof hiding the forecourt in strat view, 132 a plain white cube, 041 / 124 white-rim dome and cream blob at night); **E) 047 stairs** — NO stairs anywhere: report as «needs Tripo» (castle stairs, quay steps) unless the library has a stair piece.
**Proof:** the same 24-station frames (before / after, full size), gate ALL OK, noRoute < 700.

---
## Mother-side (not for workers)
Merged since p56: WC1, vault fix, TR2-S5, AU1, RP4_R3, PF2, BT1_R2, AN1_R3, ST1_R2, GR1_R2, RP1C_R3, UI1_R4, new cards, **six sisters, GR1_R3, ST1_R3**. Pending: TW1 (not pushed), SM1 (soldier models, new chat), RP1C_R4, TR2_H_R4. p57 only when the owner says.
