#!/bin/bash
# u1_ug_build.sh : the p35 ground-unit lab (ug_lab.js = the REAL createUnitViews) bundled twice: u1_ug_new.bundle.js (current code) and u1_ug_base.bundle.js (pristine base_snapshot) for the perf before / after
D=/home/claude/dev; C=/home/claude/bot/bluebot_v2/bluewall/client
A="--alias:three=$C/node_modules/three/build/three.module.js --alias:three/addons=$C/node_modules/three/examples/jsm"
sed "s#../bot/bluebot_v2/bluewall/client/src/#/home/claude/base_snapshot/client/src/#g" $D/ug_lab.js > $D/u1_ug_base.js
cd $C && NODE_PATH=$C/node_modules npx esbuild $D/ug_lab.js --bundle --format=iife $A --define:__BUILD__=\"0\" --outfile=$D/u1_ug_new.bundle.js --log-level=warning
cd $C && NODE_PATH=$C/node_modules npx esbuild $D/u1_ug_base.js --bundle --format=iife $A --define:__BUILD__=\"0\" --outfile=$D/u1_ug_base.bundle.js --log-level=warning
sed "s/ug_lab.bundle.js/u1_ug_new.bundle.js/" $D/ug_lab.html > $D/u1_ug_new.html; sed "s/ug_lab.bundle.js/u1_ug_base.bundle.js/" $D/ug_lab.html > $D/u1_ug_base.html
ls -la $D/u1_ug_*.bundle.js
