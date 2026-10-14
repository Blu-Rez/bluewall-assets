#!/bin/bash
# c1_mk_wslife.sh — makes dev/c1_wslife_dev.js: a COPY of the pristine client/src/wslife.js with the 4 C1 wiring lines (the real wiring is the mother's job: see REPORT_C1.md "what the mother must wire").
python3 - <<'PY'
import re
src = open('/home/claude/bot/bluebot_v2/bluewall/client/src/wslife.js').read()
s = src.replace("from './", "from '../bot/bluebot_v2/bluewall/client/src/")
s = s.replace("import { planStores } from '../bot/bluebot_v2/bluewall/client/src/stores.js';", "import { planStores } from '../bot/bluebot_v2/bluewall/client/src/stores.js';\nimport * as C1 from '../bot/bluebot_v2/bluewall/client/src/c1_kinds.js';", 1)
assert 'c1_kinds' in s
s = s.replace("const tradesOf = (site, lv)", "Object.assign(TRADES, C1.TRADES);                    // C1 wiring 1/4\nconst tradesOf = (site, lv)", 1)
s = s.replace("export function haulRoute(site) {", "Object.assign(STORE_OF, C1.STORE_OF);                // C1 wiring 2/4\nexport function haulRoute(site) {", 1)
i = s.index("const CART_OF = {"); j = s.index("\n", i)
s = s[:j + 1] + "  Object.assign(CART_OF, C1.CART_OF);                // C1 wiring 3/4\n" + s[j + 1:]
assert s.count('C1 wiring') == 3
open('/home/claude/dev/c1_wslife_dev.js', 'w').write(s)
print('c1_wslife_dev.js written, wiring lines:', s.count('C1 wiring'))
PY
