#!/bin/bash
cd /home/claude/dev
for i in 1 2; do python3 b1_prog.py dev_b1base.html; python3 b1_prog.py dev_b1.html; done
echo PROG_DONE
