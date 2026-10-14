#!/bin/bash
# mountain plates for each camera (python, no browser)
cd /home/claude/dev/ld_art
A='"peak":1150,"wl":1800,"rp":1.6,"det":0.45,"dwl":380,"hero":[[-1000,-3600,1500,520],[1600,-3100,1100,260]],"snowline":60,"snowslope":0.5,"streak":0.35,"nblur":0.9,"cblur":0.4'
LDM="{$A,\"moon\":[-0.65,0.5,0.35],\"mi\":2.1,\"ai\":0.5,\"fogk\":0.00019,\"fogc\":[0.17,0.25,0.42]}" python3 ld_mtn.py /tmp/claude-0/-home-claude/afed4ef9-3c4d-54ed-bbda-649fb789829d/scratchpad/loader/r/pyP.png 540 594 0,30,250,0,48,0,40
LDM="{$A,\"moon\":[-0.65,0.5,0.35],\"mi\":2.1,\"ai\":0.5,\"fogk\":0.00019,\"fogc\":[0.17,0.25,0.42]}" python3 ld_mtn.py /tmp/claude-0/-home-claude/afed4ef9-3c4d-54ed-bbda-649fb789829d/scratchpad/loader/r/pyL.png 960 432 0,30,330,0,50,0,30
LDM="{$A,\"moon\":[-0.3,0.25,-0.9],\"mi\":1.4,\"ai\":1.0,\"rim\":2.0,\"fogk\":0.00022,\"fogc\":[0.3,0.45,0.68]}" python3 ld_mtn.py /tmp/claude-0/-home-claude/afed4ef9-3c4d-54ed-bbda-649fb789829d/scratchpad/loader/r/pyB.png 540 594 -72,12,118,-6,40,-12,46
