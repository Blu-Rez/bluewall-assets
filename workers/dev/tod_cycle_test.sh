#!/bin/bash
# tod_cycle_test.sh — the day/night cycle: continuous, monotonic over the real hour, >= 70 % bright, <= 20 % full night; every minute of the hour has a sane hour value.
set -e
SRC=/home/claude/bot/bluebot_v2/bluewall/client
cd $SRC && npx esbuild src/tod.js --bundle --format=esm --platform=node --outfile=/tmp/tod_test.mjs --log-level=error
node --input-type=module -e "
import { gameHour, sample } from '/tmp/tod_test.mjs';
let bad = 0, prev = -1, wraps = 0, bright = 0, dark = 0, N = 6000;
for (let i = 0; i < N; i++) {
  const t = i * 3600 * 1000 / N + 1e9 * 3600 * 1000;         // a whole real hour, in steps of 0.6 s
  const h = gameHour(t);
  if (!(h >= 0 && h < 24)) { console.log('FAIL range', i, h); bad++; }
  if (prev >= 0 && h < prev - 1e-9) wraps++;
  prev = h;
  const P = sample(h);
  if (P.night < 0.5) bright++; if (P.night > 0.95) dark++;
}
const b = bright / N, d = dark / N;
console.log('bright share', b.toFixed(3), 'full-night share', d.toFixed(3), 'wraps in one hour', wraps);
if (wraps !== 1) { console.log('FAIL: the hour must wrap exactly once per real hour'); bad++; }
if (b < 0.70) { console.log('FAIL: bright share < 0.70'); bad++; }
if (d > 0.20) { console.log('FAIL: full night share > 0.20'); bad++; }
// continuity: neighbouring samples never jump by more than 0.1 game hour except at the wrap
let jump = 0, ph = gameHour(1e9*3600*1000);
for (let i = 1; i < N; i++) { const h = gameHour(1e9*3600*1000 + i * 3600 * 1000 / N); let dh = h - ph; if (dh < -12) dh += 24; if (dh > 0.1 || dh < 0) jump++; ph = h; }
if (jump) { console.log('FAIL: discontinuities', jump); bad++; }
console.log(bad ? 'TOD CYCLE FAILED' : 'TOD CYCLE OK'); process.exit(bad ? 1 : 0);
"
