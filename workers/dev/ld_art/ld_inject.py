# ld_inject.py [target] : assemble the loader index.html = template + title paths + plate meta + the untouched boot script
import json, sys, re
D = '/home/claude/dev/ld_art/'
tpl = open(D + 'ld_index_tpl.html').read()
tp = open(D + 'tp.json').read().strip()
meta = json.load(open(D + 'out/ld_meta.json'))
boot = open(D + 'boot_part.html').read().rstrip('\n')
s = tpl.replace('__TP__', tp).replace('/*LD_META*/{}/*LD_END*/', '/*LD_META*/' + json.dumps(meta, separators=(',', ':')) + '/*LD_END*/').replace('__BOOT__', boot)
out = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/bot/bluebot_v2/bluewall/web/index.html'
open(out, 'w').write(s); print(out, len(s))
