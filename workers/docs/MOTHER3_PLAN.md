# MOTHER-3 — state and queue (written 14 Oct 2026)
Read with `claude/GIT_FLOW.md`. Owner: Wingless (Persian, short; tokens are his "time").

## خلاصه برای وینگلس
p44 (D1+T1+LD1b+RP1) و p45 (= p44 + P1 محل‌های تولید و آسیاب) هر دو ساخته و روی گیت‌ان (`pkg/p44`, `pkg/p45`)؛ p45 همه‌ی p44 رو داخل خودش داره. منتظر «نصب شد». TR2 همین الان می‌تونه شروع کنه (کیت = p45). لشگر بعد از TR2.

## Git state
`kit` = p44 tree + `workers/` (GIT_FLOW, setup_kit.sh, push_result.sh, mother_pull.sh, dev tests, docs, tools) · `lib-tripo` = 226 GLBs + `tools/` · `pkg/p44` · `inbox/_selftest` (leftover; owner may delete in GitHub UI) · `code-p38` (old; delete once old-kit workers are done).

## Packages
| pkg | content | state |
|---|---|---|
| p41–p43 | earlier | installed (p43 per owner) |
| **p44** | D1 death effect · T1 building sheets (`bsheet.js`) · LD1b loader sword · RP1 owner-only hero mode (`opts.owner||opts.rpg`, lazy `web/assets/rpg/*`) · server.py `.js` MIME · gate lines d1/t1/ld1/rp1_server/rp1 files · hero credits | built, `GATE_W: ALL OK` (noRoute 622), sha256 `6a7cb54c…c725a`, awaiting owner install |
| **p45** | p44 + P1 production lots + mills. `p1_kitext.json` regenerated (`dev/p1_kitext.mjs`, 312 kit pieces) so `p1_test` runs and is in the gate; T1 rule "worksites.js/town_*.js untouched" retired. `GATE_W: ALL OK`, noRoute **667** (limit 700, 33 left), pkgcheck OK, 43 files, sha256 `9344576f…e60b` (branch `pkg/p45`; contains p44 → owner can install p45 directly) | built, awaiting owner install; kit = p45 |
| p46+ | TR2 stages one at a time (S2 tiers/loader → S3 castle → S4 town/world → S5 layout → S6 new building+defence); server parts (lv50 `MAX_LEVEL=50`, layout API) are mother-only | waits for TR2 pushes |

## Queue / decisions
- Army chat comes AFTER TR2 and supersedes M1–M3 / AR1 / U5 / R1 (owner question 1, default yes).
- Repo is public: paid models + code readable. Default: keep until release, then private (owner question 2).
- lv-50 server patch: mother writes it after TR2 (owner question 3).
- LD1 (round 1) rejected; LD1b merged. A3 / L1S / D2 / PPL not started.
- MJ-9: perf of hero mode on a real phone unmeasured (ask owner for `journalctl -u bluebot-wall --since "30 min ago" | grep perf | tail -40` after he tries it).
- MJ-10: reset two leaked Sketchfab tokens, delete old GitHub deploy key, remove `code-p38` when all old-kit workers finished.
- `VO1_VOICE_SCRIPTS.md` (voice scripts, 2.9 MB) received, not used yet (belongs to the voice/hero chats).

## Not proven (p44)
Nothing measured on a phone; hero touch controls never touched by a finger; crown icon not re-shot inside the full game; hero-mode programs on the home map 168 (RP1 report). My own run (`p39_progs.py 30`, Q=high, lv 30, p44 tree, gate off) = 203 programs; not compared against a base run (RP1's own gate-off run at Q=low: 166 = 166). Production lots/mills (P1): programs and draw calls not measured by me; its worker's frames are in photos_P1.
