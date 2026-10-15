#!/bin/bash
# ev.sh <file.js> [port]  — run a JS file in the held game page, print the JSON result
curl -s --max-time ${EVT:-900} -X POST --data-binary @"$1" http://127.0.0.1:${2:-8790}/eval
