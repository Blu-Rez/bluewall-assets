# UI1_progress — building sheet look
📊 پیشرفت: 100٪ (round 1 + 2 done, pushed)

- Round 1: three looks (A/B/C) rendered on a real sheet at 390 px → owner picked C «Parchment & metal» (finalize with my best judgement).
- Round 2: C built into every sheet kind in `bsheet.js` (+ new `ui_theme.js`), shared tokens for the old `.bw-sheet` and the Kingdom page without editing `ui.js` / `upgradeui.js`.
- Proven: T1 OK · UI1 OK (80 sheets × portrait/landscape) · GATE_W: ALL OK (noRoute 667) · programs 166 → 166 · +5.4 KB gzip · frames at full size: 13 before/after pairs, 12 real-game frames, 4 hero-view frames.
- Found + fixed: in hero mode the HUD (z 40) covered the sheet and its touch layer ate the taps → `.bw-ui.bsh-on{z-index:45}` (my file only).
- Not proven: real phone feel. Not done: HUD, army sheet, shop screens (next round, owner decides). RP1B: hide the joystick while a sheet is open.
