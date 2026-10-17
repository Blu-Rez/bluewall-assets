# ui3_menus_md.py <before.json[,more.json]> <after.json[,more.json]> <out.md> — UI3_menus.md (copy of ui1r4_menus_md.py with the UI3 rules and texts): summary (menu x size, before vs after), the two full tables, what was fixed, what was not covered
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
FIX = [('army_unit_info', 'the unit page is a small card, not the full screen; the design-sheet button no longer collapses'), ('hub', 'a 600 px card, <= 68 % high, centred in the safe box; ten tiles with the one icon set'), ('kingdom', 'a small card (<= 68 % x 74 %): rail (3 builder chips + 4 tabs) + the list; compact rows, category chips >= 40 px'),
       ('army_', 'a small card; the unit card is a small horizontal tile (picture left, name / stats / cost right), two per row'), ('shop', 'a small card; the description above the list is no longer cut'), ('rank_', 'a small card, one font'), ('clan', 'a small card, one font'), ('friends', 'a small card, one font'), ('battle_log', 'a small card, one font'),
       ('settings', 'a small card: date / time + 4 tabs in the rail'), ('sheet_', 'blue / silver tokens, one icon set; the unit-training sheets (barracks, training, stable, workshop, lair) were 83 % high with a queue and the mine / vault sheets 75 % at 800x360 — now <= 70 %: compact header, one sideways row of queue chips («+N» first), smaller unit chips'), ('hero_picker', 'UI2 owns the hero mode — not touched here'), ('old_info_card', 'tokens'), ('welcome_card', 'tokens')]
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
L = ['# UI3 — menu census, BEFORE (kit e35e072 as started) vs AFTER (look 1) — landscape 844×390, 800×360, 932×430, Telegram margins on', '',
     'Every menu is opened **by its real button** in the **real game** (non-sheet rows), headless Chromium (software GL, **not a phone**), at the three sizes with the Telegram insets (`--tg-content-safe-area-inset-top` 52 px, sides 47 px, bottom 21 px) and the two Telegram buttons drawn on top. '
     '**Building sheets (`sheet_*`) and their two confirmation dialogs are measured in the LIGHT RIG** (`dev/ui3_rig*.js`: the real `bsheet.js` + real Econ, opened by `__bw.sheets.open(id)` instead of a camera + tap, on a photo of the map, with every training queue filled to 7 — the same state that made the barracks sheet 83 % high in the real game; the numbers matched to the pixel: 322 / 292 px). The real-game sheet frames are in the photos as `real_sheet_*` (AFTER only). '
     'The pass rule is `dev/ui1r4_rules.py` + the probe `dev/ui1r4_probe.js`: opens · fits the screen · the page never scrolls · the close button is ≥ 40 px (owner rule: buttons 40–48 px), reachable and not under a Telegram button · no target < 40 px · nothing under the notch / rounded corner / home bar · no clipped text or unreachable content · a scrolling list shows ≥ 45 % of the screen height.', '',
     '**BEFORE** = the kit as started (kit e35e072, built before any edit; measured under the UI3 rules: panel <= 70 % x 75 %, targets >= 40 px). **AFTER** = the real build with this round\'s changes (UI3 build, look 1). ✅ passes · ❌ fails · – not opened (see the end) · · not measured on that side.', '',
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
