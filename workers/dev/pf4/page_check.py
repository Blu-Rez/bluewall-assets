#!/usr/bin/env python3
# pf4/page_check.py — the browser half of dev/pf4_test.sh: (1) the real governor under a 30 fps cap steps 0 times with REACH.capMs set (and >= 1 time without it = the old behaviour), a really slow stream still steps down;
# (2) main.js really publishes REACH.capMs;  (3) the owner's benchmark (3 s phases) still posts a report < 3500 bytes and carries the new fields cp / wf.
import json, os, subprocess, sys
D = '/home/claude/dev/'; fails = 0
def ok(c, m):
    global fails; print(('ok   ' if c else 'FAIL ') + m); fails += 0 if c else 1
env = dict(os.environ, PF3_PAGE='pf2_after.html', PF3_PORT='8796', PF3_MAX='3000')
r = subprocess.run(['python3', D + 'pf3/lab.py', 'after', D + 'pf4/page_check.js'], env=env, cwd=D, capture_output=True, text=True, timeout=900)
j = json.load(open('/home/claude/work/pf3/lab_page_check.js.json'))
print(json.dumps(j))
ok(isinstance(j.get('live'), (int, float)) and j['live'] >= 10, 'main.js publishes REACH.capMs (live value %s ms)' % j.get('live'))
ok(j.get('A_cap_aware_30fps_cap') == 0, 'A real governor, frames sitting ON the 30 fps cap, capMs set: %s steps down in 2 min (must be 0)' % j.get('A_cap_aware_30fps_cap'))
ok((j.get('B_no_capMs_30fps_cap') or 0) >= 1, 'B same stream without capMs (= PF3 behaviour): %s steps down (>= 1)' % j.get('B_no_capMs_30fps_cap'))
ok((j.get('C_really_slow_22fps_cap_aware') or 0) >= 2, 'C a really slow stream (45 ms) still steps down with capMs set: %s steps in 20 s' % j.get('C_really_slow_22fps_cap_aware'))
ok(j.get('D_cap_off_60fps_clean') == 0, 'D a clean 60 fps stream: %s steps' % j.get('D_cap_off_60fps_clean'))
env2 = dict(os.environ, PF4_PORT='8798', PF4_SECS='3', PF4_OUT='/home/claude/work/pf4/rig_check.json')
subprocess.run(['python3', D + 'pf4/rig_bench.py', 'after'], env=env2, cwd=D, capture_output=True, text=True, timeout=900)
b = json.load(open('/home/claude/work/pf4/rig_check.json'))['bench']; ph = b['ph']
ok(not b.get('err'), 'bench ran without errors (%s)' % b.get('err'))
ok(all(ph[k].get('cp') is not None and ph[k].get('wf') is not None for k in ('md', 'mn', 'mu')), 'every phase carries the cap state (cp) and the worst-frame attribution (wf)')
ok(b['bytes'] < 3400, 'report is %d bytes (< 3400: the POST limit is 3500)' % b['bytes'])
ok(ph['hn'].get('dt') is not None or ph['hd'].get('dt') is not None, 'hero phases carry the governor state (dt)')
print('PF4 PAGE FAIL (%d)' % fails if fails else 'PF4 PAGE OK'); sys.exit(1 if fails else 0)
