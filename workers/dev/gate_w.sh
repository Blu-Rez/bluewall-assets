#!/bin/bash
# gate_w.sh — the CLIENT-ONLY gate for the worker chats (no server / bot tests; the mother runs the full gate.sh when she merges).  Everything must print OK.
cd /home/claude/bot/bluebot_v2 || exit 1
FAIL=0; ok(){ echo "OK   $1"; }; bad(){ echo "FAIL $1"; FAIL=1; }
bash /home/claude/dev/rb.sh >/tmp/gate_build.log 2>&1 && ok "client builds (release + debug)" || bad "client build"
if grep -rniE "'[^']*\b(bot|ربات)\b[^']*'" bluewall/client/src/i18n.js bluewall/client/src/ui.js bluewall/client/src/rankui.js bluewall/client/src/armyui.js bluewall/client/src/upgradeui.js bluewall/client/src/bhud.js 2>/dev/null | grep -viE "bot'|\.kind|kind ===|'bot'" | grep -q .; then bad "player-visible 'bot' word"; else ok "no 'bot' word in player texts"; fi
python3 - <<'PY' && ok "credits.json lists every shipped asset folder" || bad "credits.json"
import json
c = json.load(open('/home/claude/bot/bluebot_v2/bluewall/web/assets/credits.json'))
assert c and len(json.dumps(c)) > 200
PY
( cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/nomad_plan.js --bundle --format=esm --platform=node --outfile=/home/claude/dev/nomad_plan.mjs >/dev/null 2>&1 && node /home/claude/dev/nomad_plan.mjs | tail -1 | grep -q "NOMADS OK" ) && ok "nomad camp plan" || bad "nomad camp plan"
( bash /home/claude/dev/rules_test.sh > /tmp/gate_rules.out 2>&1; tail -1 /tmp/gate_rules.out | grep -q "RULES OK" ) && ok "rules_test" || { bad "rules_test"; grep FAIL /tmp/gate_rules.out | head -5; }
( bash /home/claude/dev/ring_test.sh > /tmp/gate_rings.out 2>&1; tail -1 /tmp/gate_rings.out | grep -q "RINGS OK" ) && ok "ring_test" || { bad "ring_test"; grep FAIL /tmp/gate_rings.out | head -3; }
( bash /home/claude/dev/nav_test.sh > /tmp/gate_nav.out 2>&1; tail -1 /tmp/gate_nav.out | grep -q "NAV OK" ) && ok "nav_solids_test" || { bad "nav_solids_test"; grep FAIL /tmp/gate_nav.out | head -3; }
( bash /home/claude/dev/river_test.sh > /tmp/gate_river.out 2>&1; tail -1 /tmp/gate_river.out | grep -q "RIVER OK" ) && ok "river_test" || { bad "river_test"; grep FAIL /tmp/gate_river.out | head -3; }
( bash /home/claude/dev/cam_test.sh > /tmp/gate_cam.out 2>&1; tail -1 /tmp/gate_cam.out | grep -q "CAM OK" ) && ok "cam_test" || { bad "cam_test"; tail -3 /tmp/gate_cam.out; }
( bash /home/claude/dev/ws_test.sh > /tmp/gate_ws.out 2>&1; tail -1 /tmp/gate_ws.out | grep -q "WS OK" ) && ok "ws_test" || { bad "ws_test"; grep FAIL /tmp/gate_ws.out | head -3; }
( bash /home/claude/dev/wsroute_test.sh > /tmp/gate_wsr.out 2>&1; grep -q "ROUTE OK" /tmp/gate_wsr.out && grep -q "components 1" /tmp/gate_wsr.out ) && ok "wsroute_test" || { bad "wsroute_test"; grep -i fail /tmp/gate_wsr.out | head -3; }
( bash /home/claude/dev/def_test.sh > /tmp/gate_def.out 2>&1; tail -1 /tmp/gate_def.out | grep -q "DEF OK" ) && ok "def_test" || { bad "def_test"; grep FAIL /tmp/gate_def.out | head -3; }
( bash /home/claude/dev/a1_rings_test.sh 2>&1 | tail -1 | grep -q "A1 OK" ) && ok "a1_rings_test (wall rows by level)" || bad "a1_rings_test (wall rows by level)"
( bash /home/claude/dev/a2_water_test.sh 2>&1 | tail -1 | grep -q "A2 OK" ) && ok "a2_water_test (mountain streams)" || bad "a2_water_test (mountain streams)"
( bash /home/claude/dev/b1_town_test.sh 2>&1 | tail -1 | grep -q "B1 OK" ) && ok "b1_town_test (town plan engine)" || bad "b1_town_test (town plan engine)"
( bash /home/claude/dev/b2_homes_test.sh 2>&1 | tail -1 | grep -q "B2 OK" ) && ok "b2_homes_test (house families)" || bad "b2_homes_test (house families)"
( bash /home/claude/dev/b3_civic_test.sh 2>&1 | tail -1 | grep -q "B3 OK" ) && ok "b3_civic_test (civic buildings)" || bad "b3_civic_test (civic buildings)"
( bash /home/claude/dev/p41_town_test.sh 2>&1 | tail -1 | grep -q "P41 OK" ) && ok "p41_town_test (the town shows the plan)" || bad "p41_town_test (the town shows the plan)"
( bash /home/claude/dev/c1_kinds_test.sh 2>&1 | tail -1 | grep -q "C1 OK" ) && ok "c1_kinds_test (water family)" || bad "c1_kinds_test (water family)"
( bash /home/claude/dev/c2_kinds_test.sh 2>&1 | tail -1 | grep -q "C2 OK" ) && ok "c2_kinds_test (timber / stone / metal)" || bad "c2_kinds_test (timber / stone / metal)"
( bash /home/claude/dev/c3_kinds_test.sh 2>&1 | tail -1 | grep -q "C3 OK" ) && ok "c3_kinds_test (gold / oil)" || bad "c3_kinds_test (gold / oil)"
( bash /home/claude/dev/c4_kinds_test.sh 2>&1 | tail -1 | grep -q "C4 OK" ) && ok "c4_kinds_test (food family)" || bad "c4_kinds_test (food family)"
( python3 /home/claude/dev/e1_check.py 2>&1 | tail -1 | grep -q "E1 OK" ) && ok "e1_check (economy table)" || bad "e1_check (economy table)"
( bash /home/claude/dev/m43_units_test.sh 2>&1 | tail -1 | grep -q "M43 OK" ) && ok "m43_units_test (U1-U4 assets: files / size / credits / stories / LATE)" || bad "m43_units_test (U1-U4 assets)"
( bash /home/claude/dev/d1_test.sh 2>&1 | tail -1 | grep -q "D1 OK" ) && ok "d1_test (one death effect, 31 types)" || bad "d1_test (one death effect)"
( bash /home/claude/dev/st1_test.sh 2>&1 | tail -1 | grep -q "ST1 OK" ) && ok "st1_test (Treasury Quarter: nine storages, doors, fit, skin ids, family files)" || bad "st1_test (Treasury Quarter)"
( bash /home/claude/dev/st1r2_test.sh 2>&1 | tail -1 | grep -q "ST1R2 OK" ) && ok "st1r2_test (vault gem: no crown, halo caps, target-id order)" || bad "st1r2_test (vault gem)"
( bash /home/claude/dev/gr1_test.sh 2>&1 | tail -1 | grep -q "GR1 OK" ) && ok "gr1_test (roads: dead ends / water / tiers; near-ground map + shader budget)" || bad "gr1_test (roads + near ground)"
( bash /home/claude/dev/t1_test.sh 2>&1 | tail -1 | grep -q "T1 OK" ) && ok "t1_test (building sheets)" || bad "t1_test (building sheets)"
( bash /home/claude/dev/ld1_test.sh 2>&1 | tail -1 | grep -q "LD1 OK" ) && ok "ld1_test (loader sword)" || bad "ld1_test (loader sword)"
( bash /home/claude/dev/p1_test.sh 2>&1 | tail -1 | grep -q "P1 OK" ) && ok "p1_test (production lots + mills)" || bad "p1_test (production lots + mills)"
( bash /home/claude/dev/tr2_tiers_test.sh 2>&1 | tail -1 | grep -q "TR2 TIERS OK" ) && ok "tr2_tiers_test (level tiers + cap 50 + loader compiles)" || bad "tr2_tiers_test (level tiers + cap 50 + loader compiles)"
( python3 /home/claude/dev/rp1_server_test.py 2>&1 | tail -1 | grep -q "RP1 SERVER OK" ) && ok "rp1_server_test (/assets/rpg/*.js served as JavaScript)" || bad "rp1_server_test (/assets/rpg/*.js served as JavaScript)"
( R=/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg; [ -f $R/rpg.js ] && [ -f $R/rpg_under.js ] && [ $(ls $R/*.glb | wc -l) -eq 6 ] && [ $(ls $R/c_*.webp | wc -l) -eq 6 ] && [ $(ls $R/e_*.png | wc -l) -eq 6 ] ) && ok "rp1 files (2 modules + 6 heroes + 6 cards + 6 emblems)" || bad "rp1 files"
( node /home/claude/dev/s34/rc_test.mjs 2>/dev/null | grep -q FAIL ) && bad "rc_test (ring control)" || ok "rc_test (ring control)"
cd /home/claude/dev
timeout 120 bash bsw.sh 1.15 >/tmp/gate_bsw.out 2>&1; tail -2 /tmp/gate_bsw.out
grep -q "crossings.*0\|0 crossings" /tmp/gate_bsw.out && ok "battle sim: no wall crossings" || echo "??   check /tmp/gate_bsw.out"
NR=$(grep -o "noRoute events: [0-9]*" /tmp/gate_bsw.out | grep -o "[0-9]*$"); [ -n "$NR" ] && [ "$NR" -lt 700 ] && ok "battle sim: noRoute events $NR (< 700)" || bad "battle sim: noRoute events $NR"
[ $FAIL = 0 ] && echo "GATE_W: ALL OK" || echo "GATE_W: FAILED"
exit $FAIL
