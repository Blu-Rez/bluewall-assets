#!/bin/bash
# mountain plates for the v2 cameras (python, no browser)
cd /home/claude/dev/ld_art
A='"wl":1800,"rp":1.6,"det":0.45,"dwl":380,"snowslope":0.38,"streak":0.3,"cavs":0.25,"nblur":0.9,"cblur":0.4,"moon":[-0.6,0.45,0.15],"mi":2.3,"ai":0.55,"rim":1.5,"fogk":0.00027,"fogc":[0.2,0.29,0.48]'
[ -f /tmp/claude-0/-home-claude/afed4ef9-3c4d-54ed-bbda-649fb789829d/scratchpad/loader/r/pyP5.png ] || LDM="{$A,\"peak\":1150,\"snowline\":40,\"hero\":[[-1000,-3600,1500,520],[1600,-3100,1100,260]]}" python3 ld_mtn.py /tmp/claude-0/-home-claude/afed4ef9-3c4d-54ed-bbda-649fb789829d/scratchpad/loader/r/pyP5.png 540 594 0,30,250,0,32,0,40
[ -f /tmp/claude-0/-home-claude/afed4ef9-3c4d-54ed-bbda-649fb789829d/scratchpad/loader/r/pyL5.png ] || LDM="{$A,\"peak\":760,\"snowline\":30,\"hero\":[[-1000,-3600,1500,330],[1600,-3100,1100,170]]}" python3 ld_mtn.py /tmp/claude-0/-home-claude/afed4ef9-3c4d-54ed-bbda-649fb789829d/scratchpad/loader/r/pyL5.png 960 432 0,30,330,0,40,0,30
