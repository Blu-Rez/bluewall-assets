# ui1r4_menus_md.py <before.json[,more.json]> <after.json[,more.json]> <out.md> — UI1_R4_menus.md: summary (menu x size, before vs after), the two full tables, what was fixed, what was not covered
import json, sys, collections
sys.path.insert(0, '/home/claude/dev')
from ui1r4_rules import verdict
from ui1r4_table import build
def load(arg):
    R = {}
    for f in arg.split(','):
        try: R.update(json.load(open(f)))
        except Exception as e: print('missing', f, e, file=sys.stderr)
    return R
B = load(sys.argv[1]); A = load(sys.argv[2]); out = sys.argv[3]
SIZES = ['844x390', '800x360', '932x430']
FIX = [('hub', 'compact rows at <= 400 px high, centred inside the safe box (it ran under the home bar at 800×360)'), ('kingdom', 'two panes: rail (3 builder pips + 4 tabs as 2×2) + the list at full height; category chips 44 px; compact cards'),
       ('army_', 'two panes: rail (housing, tabs, Find a target) + the list at full height'), ('shop', 'two panes: rail (tabs) + the list at full height'), ('rank_', 'two panes: rail (page + tabs) + list'), ('clan', 'two panes'), ('friends', 'two panes'), ('battle_log', 'two panes'),
       ('settings', 'two panes: date / time + 4 tabs in the rail, the settings list at full height'), ('sheet_barracks', 'queue chips wrap (the «+N» chip was cut off sideways); no more self-scroll of the sheet'), ('sheet_training', 'queue chips wrap'), ('sheet_stable', 'queue chips wrap + the sheet no longer scrolls its title / Train button out of view'), ('sheet_workshop', 'queue chips wrap'), ('sheet_lair', 'queue chips wrap'),
       ('hero_picker', 'cards and the close button inside the side margins; close 44 px under the Telegram Close pill'), ('old_info_card', '—'), ('welcome_card', '—')]
def why(name):
    for k, t in FIX:
        if name.startswith(k): return t
    return '—'
def sym(v, H):
    if v is None: return '·'
    if 'skip' in v: return '–'
    if 'error' in v: return '⚠'
    return '✅' if not verdict(v, H) else '❌'
names = []
for R in (B, A):
    for k in R:
        n = k.split('|')[0]
        if n not in names and not n.startswith('zz_end'): names.append(n)
L = ['# UI1_R4 — menu census (landscape: 844×390, 800×360, 932×430, Telegram margins on)', '',
     'Every menu / sheet / dialog is opened **by its real button** (or the real tap on the building) in the real game, headless Chromium (software GL, **not a phone**), at the three sizes with the Telegram insets (`--tg-content-safe-area-inset-top` 52 px, sides 47 px, bottom 21 px) and the two Telegram buttons drawn on top. '
     'The pass rule is `dev/ui1r4_rules.py` + the probe `dev/ui1r4_probe.js`: opens · fits the screen · the page never scrolls · the close button is ≥ 44 px, reachable and not under a Telegram button · no target < 44 px · nothing under the notch / rounded corner / home bar · no clipped text or unreachable content · a scrolling list shows ≥ 45 % of the screen height.', '',
     '**BEFORE** = the kit as started (kit 0574fdc, page built before any edit). **AFTER** = the real build with this round\'s changes (proof run of `dev/ui1_menus_test.sh`). ✅ passes · ❌ fails · – not opened (see the end) · · not measured on that side.', '',
     '## 1. Summary — menu × size', '', '| menu | BEFORE 844 | 800 | 932 | AFTER 844 | 800 | 932 | what fixed it |', '|---|---|---|---|---|---|---|---|']
nb = na = 0; nbf = naf = 0
for n in names:
    cells = []
    for R in (B, A):
        for s in SIZES:
            v = R.get(f'{n}|{s}'); H = int(s.split('x')[1]); c = sym(v, H); cells.append(c)
            if v is not None and 'skip' not in v and 'error' not in v:
                if R is B: nb += 1; nbf += (c == '❌')
                else: na += 1; naf += (c == '❌')
    bfail = any(c == '❌' for c in cells[:3]); afail = any(c == '❌' for c in cells[3:])
    L.append(f"| {n} | " + ' | '.join(cells) + f" | {why(n) if (bfail or afail) else ''} |")
L += ['', f'**BEFORE: {nb - nbf} of {nb} measured cells pass, {nbf} fail.   AFTER: {na - naf} of {na} measured cells pass, {naf} fail.**', '']
L += ['## 2. AFTER — full table (real build)', '', build(A, '', True)[0], '', '## 3. BEFORE — full table (kit as started)', '', build(B, '', True)[0], '']
open(out, 'w').write('\n'.join(L)); print(f'before {nb - nbf}/{nb}, after {na - naf}/{na}')
