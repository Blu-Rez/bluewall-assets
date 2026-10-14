#!/usr/bin/env bash
# rp3_test.sh — headless proof of the underworld hub (RP3). Prints "RP3 OK" on success.
set -e
cd "$(dirname "$0")"
node rp3_test.mjs
