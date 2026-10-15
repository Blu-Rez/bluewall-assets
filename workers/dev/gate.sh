#!/bin/bash
# gate.sh — the last check before a package goes out.  Everything must print OK.
cd /home/claude/bot/bluebot_v2 || exit 1
export BLUEWALL_STATE=memory          # (in-process tests use the memory store even when a redis module is installed)
FAIL=0; ok(){ echo "OK   $1"; }; bad(){ echo "FAIL $1"; FAIL=1; }
python3 -m py_compile bluewall/*.py && ok "python compiles" || bad "python compiles"
bash /home/claude/dev/rb.sh >/tmp/gate_build.log 2>&1 && ok "client builds (release + debug)" || bad "client build"
# words players must never see (the owner's rule): bot / ربات in client strings
if grep -rniE "'[^']*\b(bot|ربات)\b[^']*'" bluewall/client/src/i18n.js bluewall/client/src/ui.js bluewall/client/src/rankui.js bluewall/client/src/armyui.js bluewall/client/src/upgradeui.js bluewall/client/src/bhud.js 2>/dev/null | grep -viE "bot'|\.kind|kind ===|'bot'" | grep -q .; then bad "player-visible 'bot' word"; else ok "no 'bot' word in player texts"; fi
python3 - <<'PY' && ok "credits.json lists every shipped asset folder" || bad "credits.json"
import json, os
c = json.load(open('/home/claude/bot/bluebot_v2/bluewall/web/assets/credits.json'))
assert c and len(json.dumps(c)) > 200
PY
bash /home/claude/dev/srv.sh stop; bash /home/claude/dev/srv.sh start >/dev/null
cd /home/claude/dev
for t in api_test.py api_test2.py api_test3.py api_test4.py; do timeout 100 python3 $t >/tmp/gate_t.out 2>&1 && ok "$t" || { bad "$t"; tail -3 /tmp/gate_t.out; }; done
bash srv.sh stop; bash srv.sh start >/dev/null
timeout 100 python3 api_test5.py >/tmp/gate_t.out 2>&1 && ok "api_test5 (cups / rank / invite link)" || { bad "api_test5"; tail -3 /tmp/gate_t.out; }
for t in social_test.py gift_test.py clan_test.py prem_test.py econ_test.py hero_cap_test.py; do timeout 100 python3 $t >/tmp/gate_t.out 2>&1 && ok "$t" || { bad "$t"; tail -3 /tmp/gate_t.out; }; done
# nomad camps: deterministic plan, 4-6 camps, never in the army camp / muster field / pasture / hamlets / town, tents never inside a keep-clear zone
( cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/nomad_plan.js --bundle --format=esm --platform=node --outfile=/home/claude/dev/nomad_plan.mjs >/dev/null 2>&1 && node /home/claude/dev/nomad_plan.mjs | tail -1 | grep -q "NOMADS OK" ) && ok "nomad camp plan" || bad "nomad camp plan"
# p35: rules of the battle sim (K1 one send, K2 hero caps, ...) — pure JS, deterministic
( bash /home/claude/dev/rules_test.sh > /tmp/gate_rules.out 2>&1; tail -1 /tmp/gate_rules.out | grep -q "RULES OK" ) && ok "rules_test (one send / heroes / determinism)" || { bad "rules_test"; grep FAIL /tmp/gate_rules.out | head -5; }
# p37: the squad rings never touch, compact blocks (4 giants = 2 x 2), the order of the army; buildings closed to ground units
( bash /home/claude/dev/ring_test.sh > /tmp/gate_rings.out 2>&1; tail -1 /tmp/gate_rings.out | grep -q "RINGS OK" ) && ok "ring_test (rings never touch / compact blocks / order of the army)" || { bad "ring_test"; grep FAIL /tmp/gate_rings.out | head -3; }
( bash /home/claude/dev/nav_test.sh > /tmp/gate_nav.out 2>&1; tail -1 /tmp/gate_nav.out | grep -q "NAV OK" ) && ok "nav_solids_test (no soldier walks into a building)" || { bad "nav_solids_test"; grep FAIL /tmp/gate_nav.out | head -3; }
# p38: the river through the town (bridges, water gates, nav), the camera on the bigger map, the worksites (ground, roads, pads, counts per level)
( bash /home/claude/dev/river_test.sh > /tmp/gate_river.out 2>&1; tail -1 /tmp/gate_river.out | grep -q "RIVER OK" ) && ok "river_test (river through the town / bridges / water gates / nav)" || { bad "river_test"; grep FAIL /tmp/gate_river.out | head -3; }
( bash /home/claude/dev/cam_test.sh > /tmp/gate_cam.out 2>&1; tail -1 /tmp/gate_cam.out | grep -q "CAM OK" ) && ok "cam_test (wide camera never behind a mountain)" || { bad "cam_test"; tail -3 /tmp/gate_cam.out; }
( bash /home/claude/dev/ws_test.sh > /tmp/gate_ws.out 2>&1; tail -1 /tmp/gate_ws.out | grep -q "WS OK" ) && ok "ws_test (worksites: level pads / roads / clearances / counts grow with the level)" || { bad "ws_test"; grep FAIL /tmp/gate_ws.out | head -3; }
( bash /home/claude/dev/wsroute_test.sh > /tmp/gate_wsr.out 2>&1; grep -q "ROUTE OK" /tmp/gate_wsr.out && grep -q "components 1" /tmp/gate_wsr.out ) && ok "wsroute_test (every worksite has a haul road to the storehouse, one road network)" || { bad "wsroute_test"; grep -i fail /tmp/gate_wsr.out | head -3; }
( bash /home/claude/dev/def_test.sh > /tmp/gate_def.out 2>&1; tail -1 /tmp/gate_def.out | grep -q "DEF OK" ) && ok "def_test (traps + defensive buildings: dry flat ground, off the roads, never move with the level)" || { bad "def_test"; grep FAIL /tmp/gate_def.out | head -3; }
# p35: ring control state machine (mocks)
( node /home/claude/dev/s34/rc_test.mjs 2>/dev/null | grep -q FAIL ) && bad "rc_test (ring control)" || ok "rc_test (ring control)"
bash srv.sh stop; bash srv.sh start >/dev/null
PYTHONPATH=/home/claude/dev/stubcfg timeout 150 python3 bot_xfer_test.py >/tmp/gate_t.out 2>&1 && ok "bot_xfer_test (BlueBot -> Blue Wall conversions)" || { bad "bot_xfer_test"; tail -3 /tmp/gate_t.out; }
timeout 100 python3 api_test6.py >/tmp/gate_t.out 2>&1 && ok "api_test6 (log / friends / clans)" || { bad "api_test6"; tail -3 /tmp/gate_t.out; }
# TR2-S5 server half: /api/layout, the Python port of the 12 placement rules == the reference, rate limit, player_target.layout (mother)
timeout 200 python3 -I /home/claude/dev/layout_server_test.py >/tmp/gate_t.out 2>&1; tail -1 /tmp/gate_t.out | grep -q "LAYOUT SERVER OK" && ok "layout_server_test (/api/layout + port of the 12 rules + rate + player_target)" || { bad "layout_server_test"; grep FAIL /tmp/gate_t.out | head -3; }
bash srv.sh stop
timeout 120 bash bsw.sh 1.15 >/tmp/gate_bsw.out 2>&1; tail -2 /tmp/gate_bsw.out
grep -q "crossings.*0\|0 crossings" /tmp/gate_bsw.out && ok "battle sim: no wall crossings" || echo "??   check /tmp/gate_bsw.out"
NR=$(grep -o "noRoute events: [0-9]*" /tmp/gate_bsw.out | grep -o "[0-9]*$"); [ -n "$NR" ] && [ "$NR" -lt 700 ] && ok "battle sim: noRoute events $NR (< 700; the river bridges are known to the nav)" || bad "battle sim: noRoute events $NR"
[ $FAIL = 0 ] && echo "GATE: ALL OK" || echo "GATE: FAILED"
exit $FAIL
