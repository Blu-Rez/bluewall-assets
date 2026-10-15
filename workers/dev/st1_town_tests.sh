#!/bin/bash
# runs the town-plan tests that the nine new yard slots can influence; prints the last verdict line of each
cd /home/claude/dev
for t in b1_town_test p41_town_test b2_homes_test b3_civic_test wsroute_test c3_kinds_test c4_kinds_test; do
  out=$(bash $t.sh 2>&1); echo "== $t: $(echo "$out" | grep -E "FAIL" | head -3 | cut -c1-250) | $(echo "$out" | tail -1 | cut -c1-200)"
done
