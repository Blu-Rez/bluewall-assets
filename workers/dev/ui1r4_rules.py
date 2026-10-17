# ui1r4_rules.py — the pass / fail rule of UI1_R4 applied to one probe result (shared by the census table and dev/ui1_menus_test.sh)
CRAMP = 0.30          # a scrolling list must show at least 30 % of the screen height (UI3: was 45 % — the panels are now <= 68 % high, so a list of 30 % + is a real list) (a sliver of a list is not a menu)
def verdict(r, H):
    """-> list of failure strings (empty = the menu is fine)"""
    if 'skip' in r or 'error' in r: return []
    f = []
    if not r.get('opens'): f.append('does not open')
    if not r.get('fits'): f.append('not inside the screen')
    if r.get('pageScroll'): f.append('the page scrolls')
    if r.get('closeInfo') is None and r.get('note') and 'no close button element' not in ' '.join(r['note']): f.append('no close button')
    if r.get('closeInfo') is not None and not r.get('closeOk'): f.append('close button not reachable')
    if r.get('small'): f.append(f"{len(r['small'])} target(s) < 40 px (" + ', '.join(s['d'] + ' ' + str(s['w']) + '×' + str(s['h']) for s in r['small'][:3]) + ')')
    if r.get('under'): f.append(f"{len(r['under'])} target(s) under notch / Telegram button / home bar")
    if r.get('cutN'): f.append(f"{r['cutN']} element(s) cut or unreachable (" + '; '.join(c['d'] + ' ' + c['why'] for c in r['cut'][:2]) + ')')
    if r.get('textCutN'): f.append(f"{r['textCutN']} text(s) clipped (" + ', '.join(c['d'] for c in r['textCut'][:2]) + ')')
    pf = r.get('panelFrac')
    if not pf and r.get('rect') and r.get('group') not in ('Building sheets',): pf = [r['rect'][2] / {390: 844, 360: 800, 430: 932}.get(H, 844), r['rect'][3] / H]      # UI3: BEFORE runs were measured without panelFrac — the same numbers from the panel rect
    if pf and r.get('group') not in ('Hero', 'Welcome card') and (pf[0] > 0.75 + 0.002 or pf[1] > 0.70 + 0.002): f.append(f'panel too big: {round(pf[0]*100)}% x {round(pf[1]*100)}% of the screen (the limit is 75% x 70%)')      # UI3: the owner's size rule
    main = max(r.get('scrollers') or [], key=lambda s: s['sh'], default=None)
    if main and main['ch'] < CRAMP * H and main['sh'] > main['ch'] + 24: f.append(f"cramped: the list shows only {main['ch']} px of {H}")
    return f
