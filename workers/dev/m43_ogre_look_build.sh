#!/bin/bash
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/m43_ogre_look.js --bundle --format=iife --target=es2020 --outfile=/home/claude/dev/m43_ogre_look.bundle.js --log-level=warning 2>&1 | head -20; ls -la /home/claude/dev/m43_ogre_look.bundle.js | cut -c1-80
