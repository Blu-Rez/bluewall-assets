#!/bin/bash
# GR1_R3 / QA1-001..005: the ramps at the heads of the river bridges (headless, ~20 s). prints "GR1R3 BRIDGES OK"
#   bash dev/gr1r3_test.sh [--before] [--verbose]      (--before = without the carve, for the numbers)
cd /home/claude && node --no-warnings dev/gr1r3_bridge_test.mjs "$@"
