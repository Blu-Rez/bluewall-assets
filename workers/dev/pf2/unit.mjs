// pf2/unit.mjs — node unit tests of PF2 (needs the bundles built by dev/pf2_test.sh: perf_bundle.mjs, tod_bundle.mjs)
//   nightPathWanted(h) (perf.js) against the REAL day cycle of tod.js: it must turn true ≈ 4 real minutes BEFORE `night > 0.25` (the switch to the bloom path), never later,
//   and it must be false through the whole bright day (so a day-only session never builds the night path).
import { nightPathWanted } from './perf_bundle.mjs';
import { gameHour, sample } from './tod_bundle.mjs';
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
// 1. the table
const T = [[0, true], [3, true], [5.9, true], [6.49, true], [6.5, false], [8, false], [12, false], [16.69, false], [16.7, true], [17.5, true], [18, true], [19.1, true], [23.99, true]];
ok(T.every(([h, w]) => nightPathWanted(h) === w), 'nightPathWanted(h) table: ' + T.map(([h, w]) => h + ':' + (w ? 'Y' : 'n')).join(' '));
// 2. against the real cycle: one real hour = one game day, sampled every 0.01 real minute over 2 hours
const t0 = 1.8e12 - (1.8e12 % 3600000);               // an hour boundary
let duskSwitch = null, wantFrom = null, dawnSwitch = null, wantedLate = 0, wantedInDay = 0, wantedN = 0;
for (let k = 0; k < 6000; k++) {
  const m = k * 0.01, h = gameHour(t0 + m * 60000), night = sample(h).night, w = nightPathWanted(h);
  if (night > 0.25 && !w) wantedLate++;                                       // night but the path would not be wanted
  if (w) wantedN++;
  if (h > 6.5 && h < 16.7 && w) wantedInDay++;
  if (m > 30 && m < 59.99 && duskSwitch === null && night > 0.25) duskSwitch = m;
  if (m > 30 && m < 59.99 && wantFrom === null && w) wantFrom = m;
}
ok(duskSwitch !== null && wantFrom !== null, 'the dusk switch (night > 0.25) is at minute ' + (duskSwitch && duskSwitch.toFixed(2)) + ' of the real hour; the path is wanted from minute ' + (wantFrom && wantFrom.toFixed(2)));
const lead = duskSwitch - wantFrom;
ok(lead >= 3.5 && lead <= 5.5, 'lead = ' + lead.toFixed(2) + ' real minutes before the first bloom-path frame (3.5 … 5.5): the idle compile (≈ 60-110 s, ≤ 25 % busy) is done before dusk');
ok(wantedLate === 0, 'never late: no sample where night > 0.25 and the path is not wanted');
ok(wantedInDay === 0, 'false through the whole bright day (game hour 6.5 … 16.7)');
const bright = (6.5 + (16.7 - 6.5)); ok(wantedN > 0 && wantedN < 6000 * 0.5, 'wanted in ' + (100 * wantedN / 6000).toFixed(0) + ' % of the time (the day-dominant cycle: dusk-to-dawn + the 4-minute lead, about 38 % of the real hour)');
console.log(fails ? 'PF2 UNIT FAILED' : 'PF2 UNIT OK'); process.exit(fails ? 1 : 0);
