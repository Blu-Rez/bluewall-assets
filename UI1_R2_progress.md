# UI1_R2 progress

UI1-R2 = look C «Parchment & metal» on HUD, Assist hub, Kingdom, Army, Shop, Rank/Clan/Friends/Log, Settings, toasts. Done 100 %.

| % | what |
|---|------|
| 10 | read UI1_SHEETS.md + ROUND2_JOBS.md (UI1-R2); kit 8ce26f5; real-game rig + before frames |
| 30 | new `ui_theme_r2.js` (tokens, HUD badge/gear SVG, shared panel chrome); HUD + toasts |
| 50 | Army + Shop + Assist hub; endless animations removed (bwFull, bwuGleam, bwaGleam) or neutralised (hub) |
| 70 | Rank / Clan / Friends / Log / Settings; DOM audit written (targets, off-screen, animations, backdrop, font size) |
| 85 | frames viewed one by one → ~20 layout fixes (army «i», scrollbars, emblem picker, tabs, landscape compaction …) |
| 95 | populated server states (stubbed from the test page) → header / clan row / medal / friends / crown fixes |
| 99 | final runs: 205 frames × before/after, audit after = 0/0/0/0, T1 OK, UI1 OK, UI1_R2 OK, GATE_W: ALL OK |
| 100 | patch + photos + report pushed |

Final numbers: ui_theme_r2.js 25,200 B raw / 6,253 B gzip · programs 160 → 160 · audit after: 3,319 targets, 0 < 44 px, 0 outside, 0 endless animations, 0 backdrop-filter, 0 text < 10 px (before: 68 small target types, 9 endless animations, 2 tiny-text types).
Not proven: real phone; battle HUD / coach / welcome-card animations untouched; landscape Kingdom list ≈ 140 px (needs a layout change in upgradeui.js — left, listed); populated server states use stubbed data.
