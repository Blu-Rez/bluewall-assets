# ui1r4_rules.py — the pass / fail rule of UI1_R4 applied to one probe result (shared by the census table and dev/ui1_menus_test.sh)
CRAMP = 0.45          # a scrolling list must show at least 45 % of the screen height (a sliver of a list is not a menu)
def verdict(r, H):
    """-> list of failure strings (empty = the menu is fine)"""
    if 'skip' in r or 'error' in r: return []
    f = []
    if not r.get('opens'): f.append('does not open')
    if not r.get('fits'): f.append('not inside the screen')
    if r.get('pageScroll'): f.append('the page scrolls')
    if r.get('closeInfo') is None and r.get('note') and 'no close button element' not in ' '.join(r['note']): f.append('no close button')
    if r.get('closeInfo') is not None and not r.get('closeOk'): f.append('close button not reachable')
    if r.get('small'): f.append(f"{len(r['small'])} target(s) < 44 px (" + ', '.join(s['d'] + ' ' + str(s['w']) + '×' + str(s['h']) for s in r['small'][:3]) + ')')
    if r.get('under'): f.append(f"{len(r['under'])} target(s) under notch / Telegram button / home bar")
    if r.get('cutN'): f.append(f"{r['cutN']} element(s) cut or unreachable (" + '; '.join(c['d'] + ' ' + c['why'] for c in r['cut'][:2]) + ')')
    if r.get('textCutN'): f.append(f"{r['textCutN']} text(s) clipped (" + ', '.join(c['d'] for c in r['textCut'][:2]) + ')')
    main = max(r.get('scrollers') or [], key=lambda s: s['sh'], default=None)
    if main and main['ch'] < CRAMP * H and main['sh'] > main['ch'] + 24: f.append(f"cramped: the list shows only {main['ch']} px of {H}")
    return f
