# BT1_progress — the attack map = the home map
15 Oct 2026 · state: **done**, pushed as `BT1` (patch + photos + report).

## Done (all frames opened full size by me)
- Side-by-side frames home / attack, same level + same camera, 844×390: lv 1 / 13 / 30 / 50 × town, castle, fields, worksite (barn), mine; extra lv 30 views (top, lower town, two hamlets); before / after the fix at lv 30.
- Root cause found with frames + scene-tree diff: `world.setBattle(true)` hid every `late:*` group except 4 → the planned town (B2 homes + B3 civic = `late:townplan`) and the static crops / bales were missing in every attack.
- Fix: `world.js` only, 6 changed lines (4 tagged `// BT1:`): keep-list in `setBattle`, and `targetDown` also hides the procedural parts of a town lot (`ws:<lot>:soup|glass|oil`).
- Destroyed one of each kind with intact / half / ruin frames: wall, tower, gate, keep, house, refinery (procedural worksite), vault, church, mine, forge, lair, ballista site (defence). Storage: not a target (ST1).
- `dev/bt1_test.sh` → `BT1 OK`; `GATE_W: ALL OK`, noRoute 614; programs 203 → 203; tris +3.8 % (far) / +4.56 % (near), calls +0.2 % / +4.1 %.

## Not done / open (see report §8)
- Phone feel (all numbers are SwiftShader).
- Attack below lv 30 shows all three wall rings (A1 rule, owner 6 Oct) — left as is; owner decision for the mother (needs the sim targets to follow).
- Defences manned by level / profile (`battlesim`, not mine): unmanned war machines / flame braziers are hidden in the attack.
- F1 for the worksite owner: `wsbuild.js` `Soup.mesh` has no `aB` + `MAT.soup` is not destruct-patched → procedural worksite parts vanish instead of crumbling.
- Storage destroy frame: nothing to destroy (not a target).
