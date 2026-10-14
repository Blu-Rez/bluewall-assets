// pf_sw_unit_entry.js — PERF2 / P2: the p39 shaderwarm.js and the PERF2 one on the same synthetic scene (software GL: counts and ratios, not milliseconds).
//   scene: 6 groups of 8 children (distinct programs: the p39 compile of a group walked the whole subtree in ONE slice) + 24 loose meshes, 3 point lights + 1 directional (big fragment shaders, like the game's)
import * as THREE from 'three';
import { createShaderWarm } from 'sw-under-test';
const MODE = new URLSearchParams(location.search).get('v') || 'new';
const renderer = new THREE.WebGLRenderer({ antialias: false }); renderer.setSize(64, 64); document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100); camera.position.set(0, 2, 8);
scene.add(new THREE.DirectionalLight(0xffffff, 1)); for (let i = 0; i < 3; i++) { const l = new THREE.PointLight(0xffaa66, 1, 20); l.position.set(i, 2, 0); scene.add(l); }
const geo = new THREE.BoxGeometry(1, 1, 1), types = [THREE.MeshStandardMaterial, THREE.MeshPhysicalMaterial, THREE.MeshPhongMaterial, THREE.MeshLambertMaterial];
let n = 0; const mk = () => { const T = types[n % 4], m = new T({ color: 0x888888 }); m.flatShading = !!((n >> 2) & 1); m.vertexColors = !!((n >> 3) & 1); m.fog = !!((n >> 4) & 1); if ((n >> 5) & 1) { m.transparent = true; m.opacity = 0.8; } n++; return m; };
for (let g = 0; g < 6; g++) { const grp = new THREE.Mesh(geo, mk()); grp.position.set(g * 2 - 5, 0, 0); for (let k = 0; k < 8; k++) { const c = new THREE.Mesh(geo, mk()); c.position.set(0, k * 0.2, 0.5); grp.add(c); } scene.add(grp); }
for (let k = 0; k < 24; k++) { const c = new THREE.Mesh(geo, mk()); c.position.set(k * 0.3 - 3, -1, 0); scene.add(c); }
// geometries need the colour attribute for vertexColors
const col = new Float32Array(geo.attributes.position.count * 3).fill(1); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
const tasks = []; { const P = WebGL2RenderingContext.prototype, lp = P.linkProgram; let tk = null;
  P.linkProgram = function (p) { if (!tk) { tk = { n: 0 }; tasks.push(tk); const me = tk; setTimeout(() => { if (tk === me) tk = null; }, 0); } tk.n++; return lp.call(this, p); }; }
const sw = createShaderWarm({ renderer, scene, camera });
const opts = MODE === 'old' ? { target: 70, gap: 30 } : { target: 60, gap: 30, duty: 0.25, maxNew: 1, k0: 1 };
let busy = 0, longest = 0; const t0 = performance.now(); const p0 = renderer.info.programs.length;
// frames of a game that keeps playing: how many rAF callbacks were late (> 50 ms) during the compile
let frames = 0, late = 0, lastF = performance.now(), worstGap = 0; const tick = () => { const t = performance.now(), d = t - lastF; lastF = t; frames++; if (d > 50) late++; if (d > worstGap) worstGap = d; requestAnimationFrame(tick); }; requestAnimationFrame(tick);
sw.compile(null, opts).then(() => {
  const wall = performance.now() - t0, st = sw.stats;
  window.__res = { mode: MODE, programs: renderer.info.programs.length - p0, slices: st.slices, sliceMs: Math.round(st.ms), wallMs: Math.round(wall), busyShare: +(st.ms / wall).toFixed(2), worstSliceMs: Math.round(st.worst), frames, lateFrames: late, worstFrameGapMs: Math.round(worstGap),
    tasks: tasks.length, mostInOneTask: Math.max(0, ...tasks.map((t) => t.n)), hist: tasks.reduce((h, t) => (h[t.n] = (h[t.n] || 0) + 1, h), {}) };
  window.__done = true;
});
