// c2_perf_sites.mjs — DEV ONLY (never ships): builds dev/c2_app_sites.js = the game with THREE temporary C2 sites (sawmill / masonry / smelter) appended to WS_SITES at build time,
// so the in-game perf run (dev/c2_perf.py = p38_perf.py on dev/c2_dev_sites.html) can measure what the new kinds cost.  layout.js on disk is not touched.
import fs from 'fs'; import { createRequire } from 'module';
const C = '/home/claude/bot/bluebot_v2/bluewall/client'; const require = createRequire(C + '/package.json'); const esbuild = require('esbuild');
const SITES = [   // level 30 is forced by the page (lv=30); ids are the kinds; positions: open ground between the town and the valley rim, front (+z) turned toward the town
  { id: 'c2_sawmill', kind: 'sawmill', x: 20, z: 168, ry: 3.14, r: 17, link: [0, 120] },
  { id: 'c2_masonry', kind: 'masonry', x: 62, z: 176, ry: 3.14, r: 17, link: [60, 130] },
  { id: 'c2_smelter', kind: 'smelter', x: 104, z: 168, ry: 3.14, r: 17, link: [100, 130] },
];
const plug = { name: 'c2sites', setup(b) { b.onLoad({ filter: /client\/src\/layout\.js$/ }, (a) => ({ contents: fs.readFileSync(a.path, 'utf8') + '\nWS_SITES.push(...' + JSON.stringify(SITES) + ');\n', loader: 'js', resolveDir: C + '/src' })); } };
await esbuild.build({ entryPoints: [C + '/src/main.js'], bundle: true, format: 'iife', target: 'es2020', define: { __BUILD__: '"0"' }, legalComments: 'none', outfile: '/home/claude/dev/c2_app_sites.js', plugins: [plug], logLevel: 'error' });
console.log('built c2_app_sites.js');
