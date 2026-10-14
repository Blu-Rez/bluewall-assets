# replace the T_HOURS / COST_K block of progress.py with the tables of baked_tables.json (idempotent)
import json, re
p = '/home/claude/bot/bluebot_v2/bluewall/progress.py'; s = open(p).read()
tab = json.load(open('/home/claude/dev/baked_tables.json'))
def fmt(v, per=10):
    return '\n'.join('    ' + ', '.join(repr(x) for x in v[i:i + per]) + ',' for i in range(0, len(v), per))
a = s.index('T_HOURS = [\n'); b = s.index('# ---- gems: a level costs')
blk = 'T_HOURS = [\n' + fmt(tab['T']) + '\n]\nCOST_K = [\n' + fmt(tab['CK']) + '\n]\n'
s = s[:a] + blk + s[b:]
open(p, 'w').write(s)
print('baked')
