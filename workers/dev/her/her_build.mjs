// node her_build.mjs [name] : bundle main.js with the heraldry patches applied in memory -> /home/claude/dev/app_<name>/wall.js + dev_<name>.html
import { createRequire } from 'module';
import fs from 'fs';
import { PATCHES } from './patches.mjs';
const CL = '/home/claude/bot/bluebot_v2/bluewall/client', N = process.argv[2] || 'heraldry';
const esbuild = createRequire(CL + '/package.json')('esbuild');
const off = process.argv.includes('--base');
const ORIG = '/tmp/claude-0/-home-claude/afed4ef9-3c4d-54ed-bbda-649fb789829d/scratchpad/heraldry/orig/';
const plugin = { name: 'her-patch', setup(b) {
  // --base: the tree as it was before the heraldry work (my files from the backups, nobody else's patched)
  if (off) b.onLoad({ filter: /client\/src\/(castle|emblems|textures|fort_day|logos)\.js$/ }, (a) => ({ contents: fs.readFileSync(ORIG + a.path.split('/').pop(), 'utf8'), loader: 'js', resolveDir: CL + '/src' }));
  b.onLoad({ filter: /client\/src\/(world|main|battle)\.js$/ }, (a) => {
    let s = fs.readFileSync(a.path, 'utf8'); const f = a.path.split('/').pop();
    if (!off) for (const [o, n] of PATCHES[f] || []) { if (!s.includes(o)) throw new Error('patch does not apply in ' + f + ': ' + o.slice(0, 80)); s = s.replace(o, n); }
    return { contents: s, loader: 'js' };
  });
} };
await esbuild.build({ entryPoints: [CL + '/src/main.js'], bundle: true, format: 'iife', target: 'es2020', define: { __BUILD__: '"' + Date.now() + '"' }, legalComments: 'none', logLevel: 'warning', outfile: '/home/claude/dev/app_' + N + '/wall.js', plugins: [plugin] });
let html = fs.readFileSync('/home/claude/dev/dev.html', 'utf8').replace('app/wall.js', 'app_' + N + '/wall.js');
html = html.replace('<style>', '<style>\n@font-face{font-family:Cinzel;src:url(pub/cinzel-900.woff2) format("woff2");font-weight:900}');
fs.writeFileSync('/home/claude/dev/dev_' + N + '.html', html);
console.log('built -> http://127.0.0.1:8777/dev_' + N + '.html' + (off ? ' (base, no patches)' : ''));
