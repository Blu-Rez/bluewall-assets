import esbuild from '/home/claude/bot/bluebot_v2/bluewall/client/node_modules/esbuild/lib/main.js';
import fs from 'node:fs';
const B = JSON.parse(fs.readFileSync('/home/claude/bot/bluebot_v2/bluewall/client/src/balance.json', 'utf8'));
B.max_level = 50;
const pad = (a) => { a = a.slice(); while (a.length < 50) a.push(a[a.length - 1]); return a; };
for (const k of ['ruby', 'emerald', 'turq']) { B.rates[k] = pad(B.rates[k]); B.vault[k] = pad(B.vault[k]); }
fs.writeFileSync('/tmp/claude-0/balance50.json', JSON.stringify(B));
await esbuild.build({ entryPoints: ['/home/claude/bot/bluebot_v2/bluewall/client/src/main.js'], bundle: true, format: 'iife', target: 'es2020', define: { __BUILD__: '"0"' }, legalComments: 'none', outfile: '/home/claude/dev/app_dbg50.js',
  plugins: [{ name: 'bal50', setup(b) { b.onResolve({ filter: /balance\.json$/ }, () => ({ path: '/tmp/claude-0/balance50.json' })); } }], logLevel: 'error' });
console.log('built app_dbg50.js');
